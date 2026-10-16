import Anthropic from '@anthropic-ai/sdk';
import { env } from '../env.js';
import { getChatState, getMessages, handoff, registerSent, type ChatMessage } from '../db.js';
import { sendText } from '../whatsapp.js';
import { SYSTEM_PROMPT } from './prompt.js';

type BetaMessageParam = Anthropic.Beta.BetaMessageParam;
type BetaMessage = Anthropic.Beta.BetaMessage;

const HANDOFF_TOOL: Anthropic.Beta.BetaTool = {
  name: 'encaminhar_para_vendedor',
  description:
    'Passa a conversa para um vendedor humano da Veipar. Use assim que souber QUAL produto o cliente quer e QUANTO ' +
    '(quantidade), ou quando o cliente pedir para falar com uma pessoa, reclamar, pedir preço/condição especial que você ' +
    'não pode confirmar, ou quando você não souber responder com segurança. Depois de usar, a IA para de responder.',
  strict: true,
  input_schema: {
    type: 'object',
    additionalProperties: false,
    required: ['motivo', 'itens', 'nome_cliente', 'cidade_uf', 'perfil', 'observacoes', 'resumo'],
    properties: {
      motivo: { type: 'string', enum: ['pedido_pronto', 'pediu_humano', 'fora_do_escopo'] },
      itens: {
        type: 'array',
        description: 'Produtos e quantidades que o cliente quer. Vazio se ainda não definiu.',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['produto', 'quantidade'],
          properties: {
            produto: { type: 'string', description: 'Produto, modelo, cor e medida, como o cliente pediu.' },
            quantidade: { type: 'string', description: 'Quantidade com unidade (ex.: "500 unidades", "3 pacotes").' },
          },
        },
      },
      nome_cliente: { type: 'string', description: 'Nome informado pelo cliente, ou "" se não informou.' },
      cidade_uf: { type: 'string', description: 'Cidade/UF de entrega, ou "".' },
      perfil: { type: 'string', description: 'Ex.: consumidor final, instalador/telhadista, revenda/loja, construtora. "" se não souber.' },
      observacoes: { type: 'string', description: 'Tipo de telha, prazo, forma de pagamento ou outro detalhe útil. "" se nada.' },
      resumo: { type: 'string', description: 'Uma frase para o vendedor entender o atendimento em 5 segundos.' },
    },
  },
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const MEDIA_LABEL: Record<string, string> = {
  audio: 'um áudio', image: 'uma imagem', video: 'um vídeo', document: 'um documento',
  sticker: 'uma figurinha', location: 'uma localização', contact: 'um contato',
};

function render(m: ChatMessage): string {
  if (m.body && m.type === 'text') return m.body;
  const what = MEDIA_LABEL[m.type] ?? 'uma mensagem que não é texto';
  return m.body ? `[cliente enviou ${what} com a legenda: ${m.body}]` : `[cliente enviou ${what}]`;
}

/** Histórico do banco no formato da API: cliente = user; IA e equipe = assistant. */
export function toConversation(history: ChatMessage[]): BetaMessageParam[] {
  const out: BetaMessageParam[] = [];
  for (const m of history) {
    const role = m.author === 'customer' ? 'user' : 'assistant';
    const text = m.author === 'human' ? `[vendedor da equipe] ${m.body ?? ''}` : render(m);
    const last = out[out.length - 1];
    if (last?.role === role) last.content = `${last.content}\n${text}`;
    else out.push({ role, content: text });
  }
  while (out[0]?.role === 'assistant') out.shift();
  return out;
}

/** Quebra a resposta em até 3 balões, como uma pessoa digitando no WhatsApp. */
export function toBubbles(text: string): string[] {
  const parts = text.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean);
  if (parts.length <= 3) return parts;
  return [...parts.slice(0, 2), parts.slice(2).join('\n\n')];
}

const textOf = (m: BetaMessage) =>
  m.content.filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text').map((b) => b.text).join('\n\n').trim();

let client: Anthropic | undefined;

async function ask(messages: BetaMessageParam[]): Promise<BetaMessage> {
  client ??= new Anthropic();
  return client.beta.messages.create({
    model: env.aiModel,
    max_tokens: 4000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'low' },
    cache_control: { type: 'ephemeral' },
    system: SYSTEM_PROMPT,
    tools: [HANDOFF_TOOL],
    messages,
  });
}

/** Há mensagem mais nova que `messageId`, do cliente ou da equipe? Então esta execução não responde. */
async function superseded(waId: string, messageId: string): Promise<boolean> {
  const [latest] = (await getMessages(waId, 1));
  return !!latest && latest.id !== messageId && latest.author !== 'ai';
}

/**
 * Responde o cliente com a atendente de IA. Chamado pelo webhook depois de gravar a mensagem `messageId`.
 * Espera alguns segundos para juntar mensagens em sequência; só a execução da última mensagem responde.
 */
export async function runAttendant(waId: string, messageId: string): Promise<void> {
  await sleep(env.aiDebounceMs);

  const state = await getChatState(waId);
  if (!state?.ai_enabled || state.handoff_at) return;
  if (await superseded(waId, messageId)) return;

  const messages = toConversation(await getMessages(waId));
  if (messages.at(-1)?.role !== 'user') return;

  // Contexto de data/hora para a IA (fora do system prompt, para não quebrar o cache).
  messages.push({
    role: 'system',
    content: `Agora: ${new Date().toLocaleString('pt-BR', { timeZone: env.timezone })}. Nome no perfil do WhatsApp: ${state.name || 'não informado'}.`,
  });

  let response = await ask(messages);
  if (response.stop_reason === 'refusal') {
    await handoff(waId, { motivo: 'fora_do_escopo', itens: [], resumo: 'A IA não conseguiu responder esta conversa.' });
    return;
  }

  const replies: string[] = [];
  const first = textOf(response);
  if (first) replies.push(first);

  const call = response.content.find((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === 'tool_use');
  if (call) {
    await handoff(waId, call.input as Record<string, unknown>);
    if (!first) {
      // A IA chamou a ferramenta sem escrever nada: pede a mensagem de transição para o cliente.
      response = await ask([
        ...messages,
        { role: 'assistant', content: response.content as Anthropic.Beta.BetaContentBlockParam[] },
        {
          role: 'user',
          content: [{
            type: 'tool_result', tool_use_id: call.id,
            content: 'Encaminhado. Escreva agora a mensagem curta avisando o cliente que um vendedor vai continuar o atendimento por aqui.',
          }],
        },
      ]);
      const after = response.stop_reason === 'refusal' ? '' : textOf(response);
      if (after) replies.push(after);
    }
  }

  if (!replies.length) return;
  if (!call && (await superseded(waId, messageId))) return; // cliente mandou mais coisa enquanto a IA pensava

  for (const bubble of replies.flatMap(toBubbles)) {
    const typing = Math.min(6, Math.max(2, Math.round(bubble.length / 40)));
    const id = await sendText(waId, bubble, typing);
    await registerSent(waId, id, 'ai', bubble);
  }
}

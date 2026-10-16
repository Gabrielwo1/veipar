import OpenAI from 'openai';
import type { FunctionTool, ResponseFunctionToolCall, ResponseInputItem, Response as AIResponse } from 'openai/resources/responses/responses';
import { env } from '../env.js';
import { getChatState, getMessages, handoff, registerSent, type ChatMessage } from '../db.js';
import { sendText } from '../whatsapp.js';
import { SYSTEM_PROMPT } from './prompt.js';

const HANDOFF_TOOL: FunctionTool = {
  type: 'function',
  name: 'encaminhar_para_vendedor',
  description:
    'Passa a conversa para um vendedor humano da Veipar. Use assim que souber QUAL produto o cliente quer e QUANTO ' +
    '(quantidade), ou quando o cliente pedir para falar com uma pessoa, reclamar, pedir preço/condição especial que você ' +
    'não pode confirmar, ou quando você não souber responder com segurança. Depois de usar, a IA para de responder.',
  strict: true,
  parameters: {
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

export type Turn = { role: 'user' | 'assistant'; content: string };

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

/** Histórico do banco no formato de chat: cliente = user; IA e equipe = assistant. */
export function toConversation(history: ChatMessage[]): Turn[] {
  const out: Turn[] = [];
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

/** Texto da resposta, ou '' se o modelo recusou. */
const textOf = (r: AIResponse) =>
  r.output
    .flatMap((o) => (o.type === 'message' ? o.content : []))
    .map((c) => (c.type === 'output_text' ? c.text : ''))
    .join('\n\n')
    .trim();

let client: OpenAI | undefined;

async function ask(input: ResponseInputItem[], context: string): Promise<AIResponse> {
  client ??= new OpenAI();
  return client.responses.create({
    model: env.aiModel,
    store: false,
    include: ['reasoning.encrypted_content'], // permite devolver o raciocínio junto com a chamada da ferramenta
    reasoning: { effort: 'low' },
    instructions: `${SYSTEM_PROMPT}\n\n# Contexto desta conversa\n${context}`,
    tools: [HANDOFF_TOOL],
    input,
  });
}

/**
 * Gera a resposta da IA para a conversa. Se ela decidir encaminhar, devolve também o resumo do pedido
 * e garante uma mensagem de transição para o cliente.
 */
export async function generateReply(turns: Turn[], context: string): Promise<{ replies: string[]; summary: Record<string, unknown> | null }> {
  const input: ResponseInputItem[] = turns;
  const response = await ask(input, context);
  const replies: string[] = [];
  const first = textOf(response);
  if (first) replies.push(first);

  const call = response.output.find((o): o is ResponseFunctionToolCall => o.type === 'function_call');
  if (!call) return { replies, summary: null };

  let summary: Record<string, unknown>;
  try {
    summary = JSON.parse(call.arguments);
  } catch {
    summary = { motivo: 'fora_do_escopo', itens: [], resumo: 'A IA encaminhou sem conseguir montar o resumo.' };
  }
  if (!first) {
    // A IA chamou a ferramenta sem escrever nada: pede a mensagem de transição para o cliente.
    const after = textOf(await ask([
      ...input,
      ...(response.output as ResponseInputItem[]),
      {
        type: 'function_call_output', call_id: call.call_id,
        output: 'Encaminhado. Escreva agora a mensagem curta avisando o cliente que um vendedor vai continuar o atendimento por aqui.',
      },
    ], context));
    if (after) replies.push(after);
  }
  return { replies, summary };
}

/** Há mensagem mais nova que `messageId`, do cliente ou da equipe? Então esta execução não responde. */
async function superseded(waId: string, messageId: string): Promise<boolean> {
  const [latest] = await getMessages(waId, 1);
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

  const turns = toConversation(await getMessages(waId));
  if (turns.at(-1)?.role !== 'user') return;

  const context = `Agora: ${new Date().toLocaleString('pt-BR', { timeZone: env.timezone })}. Nome no perfil do WhatsApp: ${state.name || 'não informado'}.`;
  const { replies, summary } = await generateReply(turns, context);
  if (summary) await handoff(waId, summary);

  if (!replies.length) return;
  if (!summary && (await superseded(waId, messageId))) return; // cliente mandou mais coisa enquanto a IA pensava

  for (const bubble of replies.flatMap(toBubbles)) {
    const typing = Math.min(6, Math.max(2, Math.round(bubble.length / 40)));
    const id = await sendText(waId, bubble, typing);
    await registerSent(waId, id, 'ai', bubble);
  }
}

import OpenAI from 'openai';
import type { FunctionTool, ResponseFunctionToolCall, ResponseInputItem, Response as AIResponse } from 'openai/resources/responses/responses';
import { env } from '../env.js';
import { getChatState, getMessages, handoff, isPreExistingChat, registerSent, setAiEnabled, type ChatMessage } from '../db.js';
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
  if (m.body && m.type === 'audio') return `[áudio do cliente, transcrito] ${m.body}`;
  const what = MEDIA_LABEL[m.type] ?? 'uma mensagem que não é texto';
  return m.body ? `[cliente enviou ${what} com a legenda: ${m.body}]` : `[cliente enviou ${what}]`;
}

const HOUR = 3_600_000;

function gap(ms: number): string {
  const h = Math.round(ms / HOUR);
  return h < 24 ? `${h} hora${h > 1 ? 's' : ''}` : `${Math.round(h / 24)} dia${h >= 48 ? 's' : ''}`;
}

/**
 * Histórico do banco no formato de chat: cliente = user; IA e equipe = assistant.
 * Marca mensagens citadas ("responder" do WhatsApp) e retomadas depois de horas sem conversa,
 * para a IA continuar de onde parou em vez de recomeçar o atendimento.
 */
export function toConversation(history: ChatMessage[]): Turn[] {
  const byId = new Map(history.map((m) => [m.id, m]));
  const out: Turn[] = [];
  let prevAt: number | null = null;
  for (const m of history) {
    const role = m.author === 'customer' ? 'user' : 'assistant';
    let text = m.author === 'human' ? `[vendedor da equipe] ${m.body ?? ''}` : render(m);
    const at = new Date(m.sent_at).getTime();
    if (role === 'user' && m.reply_to) {
      const quoted = byId.get(m.reply_to);
      const who = quoted?.author === 'customer' ? 'à própria mensagem' : 'à mensagem';
      text = quoted?.body
        ? `[respondendo ${who}: "${quoted.body.slice(0, 200)}"] ${text}`
        : `[respondendo a uma mensagem anterior] ${text}`;
    }
    if (role === 'user' && prevAt != null && at - prevAt >= 6 * HOUR) {
      text = `[o cliente voltou a escrever ${gap(at - prevAt)} depois] ${text}`;
    }
    prevAt = at;
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

/** Mensagem fixa quando a IA está indisponível: o cliente não fica sem resposta. */
export const FALLBACK_MESSAGE = 'Oi! Recebi sua mensagem 😊 Um vendedor da Veipar já vai te responder por aqui.';

/**
 * A IA falhou (sem créditos, fora do ar, erro de rede...): avisa o cliente com uma mensagem fixa
 * e passa a conversa para a equipe, que vê o motivo no resumo (aba Conversas → Aguardando).
 */
async function fallbackToTeam(waId: string, err: unknown) {
  const reason = err instanceof Error ? err.message : String(err);
  console.error('IA indisponível, passando para a equipe', waId, reason);
  await handoff(waId, {
    motivo: 'fora_do_escopo', itens: [], nome_cliente: '', cidade_uf: '', perfil: '', observacoes: reason.slice(0, 300),
    resumo: 'A IA ficou indisponível e não respondeu este cliente. Responda por aqui.',
  });
  const id = await sendText(waId, FALLBACK_MESSAGE, 1);
  await registerSent(waId, id, 'ai', FALLBACK_MESSAGE);
}

/**
 * Responde o cliente com a atendente de IA. Chamado pelo webhook depois de gravar a mensagem `messageId`.
 * Espera alguns segundos para juntar mensagens em sequência; só a execução da última mensagem responde.
 */
export async function runAttendant(waId: string, messageId: string): Promise<void> {
  const t0 = Date.now();
  await sleep(env.aiDebounceMs);

  const [state, history] = await Promise.all([getChatState(waId), getMessages(waId)]);
  if (!state?.ai_enabled || state.handoff_at) return;
  // Número que já conversava com a equipe antes do sistema: fica com a equipe.
  // (Quando a equipe escreve numa conversa, ai_enabled já vira false; só volta pelo botão "Devolver para IA".)
  if (!history.some((m) => m.author === 'ai') && (await isPreExistingChat(waId))) {
    await setAiEnabled(waId, false);
    return;
  }
  // Chegou outra mensagem do cliente (ou a equipe respondeu) depois desta: quem responde é a execução dela.
  const latest = history.at(-1);
  if (latest && latest.id !== messageId && latest.author !== 'ai') return;

  const turns = toConversation(history);
  if (turns.at(-1)?.role !== 'user') return;
  const tDb = Date.now();

  const context = `Agora: ${new Date().toLocaleString('pt-BR', { timeZone: env.timezone })}. Nome no perfil do WhatsApp: ${state.name || 'não informado'}.`;
  let reply: Awaited<ReturnType<typeof generateReply>>;
  try {
    reply = await generateReply(turns, context);
  } catch (err) {
    await fallbackToTeam(waId, err);
    return;
  }
  const { replies, summary } = reply;
  const tAi = Date.now();
  if (summary) await handoff(waId, summary);

  if (!replies.length) return;
  if (!summary) {
    const [last] = await getMessages(waId, 1);
    if (last && last.id !== latest?.id && last.author !== 'ai') return; // cliente mandou mais coisa enquanto a IA pensava
  }

  const bubbles = replies.flatMap(toBubbles);
  for (const [i, bubble] of bubbles.entries()) {
    // O cliente já esperou a IA pensar: o 1º balão sai quase na hora; os seguintes simulam a digitação.
    const typing = i === 0 ? 1 : Math.min(3, Math.max(1, Math.round(bubble.length / 60)));
    const id = await sendText(waId, bubble, typing);
    await registerSent(waId, id, 'ai', bubble);
  }
  console.log(JSON.stringify({
    ai: waId.slice(-4), debounce_ms: env.aiDebounceMs, db_ms: tDb - t0 - env.aiDebounceMs,
    model_ms: tAi - tDb, send_ms: Date.now() - tAi, total_ms: Date.now() - t0, bubbles: bubbles.length, handoff: !!summary,
  }));
}

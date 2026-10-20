import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from './env.js';
import type { InboundEvent, OutboundEvent } from './webhook-parser.js';

let client: SupabaseClient | undefined;

export function db(): SupabaseClient {
  client ??= createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

export interface InboundResult {
  duplicate: boolean;
  is_new: boolean;
  should_notify: boolean;
}

export async function registerInbound(e: InboundEvent): Promise<InboundResult> {
  const { data, error } = await db().rpc('register_inbound', {
    p_message_id: e.messageId,
    p_wa_id: e.waId,
    p_name: e.name,
    p_line: e.line,
    p_type: e.type,
    p_body: env.storeMessageText ? e.text : null,
    p_sent_at: e.sentAt.toISOString(),
    p_return_hours: env.notifyReturnAfterHours,
    p_ad_source_id: e.ad?.sourceId ?? null,
    p_ad_headline: e.ad?.headline ?? null,
  });
  if (error) throw new Error(`register_inbound: ${error.message}`);
  const result = (data as InboundResult[])[0];
  if (!result.duplicate && (e.replyTo || e.media)) await setMessageExtras(e.messageId, { reply_to: e.replyTo, media_url: e.media?.url ?? null });
  return result;
}

export async function registerOutbound(e: OutboundEvent): Promise<void> {
  const { error } = await db().rpc('register_outbound', {
    p_message_id: e.messageId,
    p_wa_id: e.waId,
    p_line: e.line,
    p_type: e.type,
    p_body: env.storeMessageText ? e.text : null,
    p_sent_at: e.sentAt.toISOString(),
  });
  if (error) throw new Error(`register_outbound: ${error.message}`);
  if (e.media) await setMessageExtras(e.messageId, { media_url: e.media.url });
}

/** Campos que as funções register_* não recebem: mensagem citada e link da mídia. */
async function setMessageExtras(id: string, extras: { reply_to?: string | null; media_url?: string | null }) {
  const { error } = await db().from('messages').update(extras).eq('id', id);
  if (error) console.error('setMessageExtras', id, error.message);
}

export async function logNotification(waId: string, recipient: string, ok: boolean, err?: string) {
  const { error } = await db()
    .from('notifications')
    .insert({ wa_id: waId, recipient, ok, error: err ?? null });
  if (error) console.error('logNotification', error.message);
}

export type Author = 'customer' | 'ai' | 'human';

export interface ChatMessage {
  id: string;
  author: Author;
  type: string;
  body: string | null;
  sent_at: string;
  reply_to?: string | null;
  media_url?: string | null;
}

export interface ChatState {
  wa_id: string;
  name: string | null;
  ai_enabled: boolean;
  handoff_at: string | null;
}

/** Registra uma mensagem que nós enviamos pela API (IA ou painel). */
export async function registerSent(waId: string, messageId: string, author: Exclude<Author, 'customer'>, body: string) {
  const { error } = await db().rpc('register_sent', {
    p_message_id: messageId,
    p_wa_id: waId,
    p_author: author,
    p_body: body,
    p_sent_at: new Date().toISOString(),
  });
  if (error) throw new Error(`register_sent: ${error.message}`);
}

export async function getChatState(waId: string): Promise<ChatState | null> {
  const { data, error } = await db()
    .from('contacts')
    .select('wa_id, name, ai_enabled, handoff_at')
    .eq('wa_id', waId)
    .maybeSingle();
  if (error) throw new Error(`getChatState: ${error.message}`);
  return data;
}

/**
 * Últimas `limit` mensagens da conversa, da mais antiga para a mais recente, na ordem em que chegaram ao sistema
 * (created_at). O sent_at do cliente vem do celular dele e pode ficar "antes" de uma resposta que a IA já enviou.
 */
export async function getMessages(waId: string, limit = 60): Promise<ChatMessage[]> {
  const { data, error } = await db()
    .from('messages')
    .select('id, author, type, body, sent_at, reply_to, media_url')
    .eq('wa_id', waId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit);
  if (error) throw new Error(`getMessages: ${error.message}`);
  return (data as ChatMessage[]).reverse();
}

/** Liga/desliga a IA na conversa. Nos dois casos a conversa deixa de estar "aguardando a equipe". */
export async function setAiEnabled(waId: string, enabled: boolean) {
  const { error } = await db()
    .from('contacts')
    .update({ ai_enabled: enabled, handoff_at: null })
    .eq('wa_id', waId);
  if (error) throw new Error(`setAiEnabled: ${error.message}`);
}

/** A IA concluiu a coleta do pedido: grava o resumo e passa a conversa para a equipe. */
export async function handoff(waId: string, summary: Record<string, unknown>) {
  const { error } = await db()
    .from('contacts')
    .update({ ai_enabled: false, handoff_at: new Date().toISOString(), handoff_summary: summary })
    .eq('wa_id', waId);
  if (error) throw new Error(`handoff: ${error.message}`);
}

/**
 * Cliente cadastrado à mão (venda fora do WhatsApp). Com telefone, reaproveita o contato se ele já existir.
 * Sem telefone, recebe um id "m<timestamp>".
 */
export async function upsertManualContact(name: string, phone: string, at: string): Promise<string> {
  const waId = phone || `m${Date.now()}`;
  const { error } = await db()
    .from('contacts')
    .upsert(
      { wa_id: waId, name, source: 'manual', ai_enabled: false, first_seen_at: at, last_message_at: at },
      { onConflict: 'wa_id', ignoreDuplicates: true },
    );
  if (error) throw new Error(`upsertManualContact: ${error.message}`);
  return waId;
}

/** Este número já conversava com a equipe antes do sistema? */
export async function isPreExistingChat(waId: string): Promise<boolean> {
  const { data, error } = await db().from('pre_existing_chats').select('wa_id').eq('wa_id', waId).maybeSingle();
  if (error) throw new Error(`isPreExistingChat: ${error.message}`);
  return !!data;
}

export const STAGES = ['esperando', 'pedido', 'faturado'] as const;
export type Stage = (typeof STAGES)[number];

/** Etapa da conversa (tag no painel). Lançar venda já marca "faturado" pelo banco. */
export async function setStage(waId: string, stage: Stage) {
  const { error } = await db().from('contacts').update({ stage }).eq('wa_id', waId);
  if (error) throw new Error(`setStage: ${error.message}`);
}

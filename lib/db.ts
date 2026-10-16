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
  return (data as InboundResult[])[0];
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
}

export async function logNotification(waId: string, recipient: string, ok: boolean, err?: string) {
  const { error } = await db()
    .from('notifications')
    .insert({ wa_id: waId, recipient, ok, error: err ?? null });
  if (error) console.error('logNotification', error.message);
}

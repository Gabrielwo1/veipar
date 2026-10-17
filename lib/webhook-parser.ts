// Normaliza o callback "Ao receber" da Z-API em um evento simples.
// Com "Notificar as enviadas por mim" ligado, as respostas da equipe no app chegam com fromMe=true.

export interface InboundEvent {
  kind: 'inbound';
  messageId: string;
  waId: string;
  name: string | null;
  /** Número da empresa que recebeu (connectedPhone da instância). */
  line: string;
  instanceId: string;
  type: string;
  text: string | null;
  sentAt: Date;
  /** Link do arquivo (áudio, imagem, vídeo, documento) hospedado pela Z-API. */
  media: Media | null;
  /** messageId da mensagem citada, quando o cliente usa "responder" no WhatsApp. */
  replyTo: string | null;
  /** Preenchido quando a conversa veio de um anúncio Click-to-WhatsApp. */
  ad: { sourceId: string; headline: string | null } | null;
}

export interface Media {
  url: string;
  mimeType: string | null;
}

export interface OutboundEvent {
  kind: 'outbound';
  messageId: string;
  waId: string;
  line: string;
  instanceId: string;
  type: string;
  text: string | null;
  sentAt: Date;
  media: Media | null;
}

export type WebhookEvent = InboundEvent | OutboundEvent;

const MEDIA_TYPES = [
  'text', 'image', 'audio', 'video', 'document', 'sticker', 'location', 'contact',
  'buttonsResponseMessage', 'listResponseMessage', 'reaction',
] as const;

function typeOf(p: any): string {
  return MEDIA_TYPES.find((t) => p[t] != null) ?? 'other';
}

function textOf(p: any): string | null {
  return (
    p.text?.message ??
    p.image?.caption ??
    p.video?.caption ??
    p.document?.caption ??
    p.buttonsResponseMessage?.message ??
    p.listResponseMessage?.message ??
    null
  );
}

function mediaOf(p: any): Media | null {
  const m =
    (p.audio && { url: p.audio.audioUrl, mimeType: p.audio.mimeType }) ||
    (p.image && { url: p.image.imageUrl, mimeType: p.image.mimeType }) ||
    (p.video && { url: p.video.videoUrl, mimeType: p.video.mimeType }) ||
    (p.document && { url: p.document.documentUrl, mimeType: p.document.mimeType }) ||
    (p.sticker && { url: p.sticker.stickerUrl, mimeType: p.sticker.mimeType });
  return m?.url ? { url: String(m.url), mimeType: m.mimeType ? String(m.mimeType) : null } : null;
}

/** Retorna null para tudo que não é conversa individual com cliente (grupos, canais, status, listas). */
export function parseWebhook(p: any): WebhookEvent | null {
  if (p?.type !== 'ReceivedCallback') return null;
  if (p.isGroup || p.isNewsletter || p.broadcast) return null;

  const phone = String(p.phone ?? '');
  if (!/^\d{8,15}$/.test(phone)) return null; // descarta -group, @newsletter, @lid, -broadcast
  if (!p.messageId || !p.momment) return null;

  const type = typeOf(p);
  if (type === 'reaction') return null;

  const base = {
    messageId: String(p.messageId),
    waId: phone,
    line: String(p.connectedPhone ?? ''),
    instanceId: String(p.instanceId ?? ''),
    type,
    text: textOf(p),
    sentAt: new Date(Number(p.momment)),
    media: mediaOf(p),
  };

  if (p.fromMe) {
    if (p.fromApi) return null; // mensagens automáticas (ex.: aviso ao gerente) não contam como atendimento
    return { kind: 'outbound', ...base };
  }

  const ad = p.externalAdReply;
  return {
    kind: 'inbound',
    ...base,
    name: p.senderName || p.chatName || null,
    replyTo: p.referenceMessageId ? String(p.referenceMessageId) : null,
    ad: ad?.sourceId ? { sourceId: String(ad.sourceId), headline: ad.title || ad.body || null } : null,
  };
}

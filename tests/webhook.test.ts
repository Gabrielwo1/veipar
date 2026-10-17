import { describe, expect, it } from 'vitest';
import { parseWebhook, type InboundEvent } from '../lib/webhook-parser.js';
import { formatPhone } from '../lib/format.js';

const base = {
  type: 'ReceivedCallback',
  instanceId: 'INST1',
  connectedPhone: '554632200000',
  isGroup: false,
  isNewsletter: false,
  broadcast: false,
  fromApi: false,
  momment: 1760540000000,
  status: 'RECEIVED',
};

const received = {
  ...base,
  messageId: 'ABC1',
  phone: '5546999990000',
  fromMe: false,
  senderName: 'Maria',
  chatName: 'Maria',
  text: { message: 'Oi, quero um orçamento' },
  externalAdReply: { title: 'Peça seu orçamento', sourceId: '120000001', sourceType: 'ad', ctwaClid: 'x' },
};

describe('parseWebhook (Z-API)', () => {
  it('extrai o link do áudio', () => {
    const { text, externalAdReply, ...base } = received;
    const e = parseWebhook({ ...base, messageId: 'AUD1', audio: { audioUrl: 'https://z/a.ogg', mimeType: 'audio/ogg; codecs=opus', ptt: true } }) as InboundEvent;
    expect(e.type).toBe('audio');
    expect(e.media).toEqual({ url: 'https://z/a.ogg', mimeType: 'audio/ogg; codecs=opus' });
    expect(e.text).toBeNull();
  });

  it('guarda a mensagem citada (responder)', () => {
    const e = parseWebhook({ ...received, referenceMessageId: 'Q1' }) as InboundEvent;
    expect(e.replyTo).toBe('Q1');
    expect((parseWebhook(received) as InboundEvent).replyTo).toBeNull();
  });

  it('extrai mensagem recebida com nome, linha e anúncio', () => {
    const e = parseWebhook(received) as InboundEvent;
    expect(e).toMatchObject({
      kind: 'inbound', messageId: 'ABC1', waId: '5546999990000', name: 'Maria',
      line: '554632200000', type: 'text', text: 'Oi, quero um orçamento',
      ad: { sourceId: '120000001', headline: 'Peça seu orçamento' },
    });
    expect(e.sentAt.toISOString()).toBe('2025-10-15T14:53:20.000Z');
  });

  it('identifica imagem com legenda e sem anúncio', () => {
    const e = parseWebhook({ ...base, messageId: 'ABC2', phone: '5546999990000', fromMe: false,
      image: { caption: 'foto do produto', imageUrl: 'https://x' } }) as InboundEvent;
    expect(e).toMatchObject({ type: 'image', text: 'foto do produto', ad: null });
  });

  it('trata resposta da equipe pelo app como saída', () => {
    expect(parseWebhook({ ...base, messageId: 'OUT1', phone: '5546999990000', fromMe: true, text: { message: 'Olá!' } }))
      .toMatchObject({ kind: 'outbound', waId: '5546999990000' });
  });

  it('ignora mensagens enviadas pela própria API (aviso ao gerente)', () => {
    expect(parseWebhook({ ...base, messageId: 'OUT2', phone: '5546988880000', fromMe: true, fromApi: true, text: { message: 'x' } }))
      .toBeNull();
  });

  it('ignora grupos, canais, reações e outros callbacks', () => {
    expect(parseWebhook({ ...received, isGroup: true, phone: '120363019502650977-group' })).toBeNull();
    expect(parseWebhook({ ...received, phone: '5544999999999@newsletter' })).toBeNull();
    expect(parseWebhook({ ...received, text: undefined, reaction: { value: '👍' } })).toBeNull();
    expect(parseWebhook({ ...received, type: 'MessageStatusCallback' })).toBeNull();
  });
});

describe('formatPhone', () => {
  it('formata celular brasileiro', () => expect(formatPhone('5546999990000')).toBe('+55 (46) 99999-0000'));
  it('formata fixo brasileiro', () => expect(formatPhone('554632200000')).toBe('+55 (46) 3220-0000'));
});

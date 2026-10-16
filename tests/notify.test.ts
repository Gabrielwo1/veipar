import { describe, expect, it } from 'vitest';
import { buildNotification } from '../lib/notify.js';
import type { InboundEvent } from '../lib/webhook-parser.js';

process.env.LINE_LABELS = '554632200000:Loja Centro';

const event: InboundEvent = {
  kind: 'inbound', messageId: 'A', waId: '5546999990000', name: 'Maria', line: '554632200000',
  instanceId: 'I', type: 'text', text: 'meu pedido de ...', sentAt: new Date('2026-10-15T17:32:00Z'), replyTo: null,
  ad: { sourceId: '1', headline: 'Peça seu orçamento' },
};

describe('buildNotification', () => {
  const msg = buildNotification(event, true);
  it('traz nome, telefone, horário local, linha e origem', () => {
    expect(msg).toContain('Novo contato');
    expect(msg).toContain('Loja Centro');
    expect(msg).toContain('+55 (46) 99999-0000');
    expect(msg).toContain('15/10/2026, 14:32');
    expect(msg).toContain('anúncio "Peça seu orçamento"');
    expect(msg).toContain('https://wa.me/5546999990000');
  });
  it('não vaza o conteúdo da mensagem do cliente', () => expect(msg).not.toContain('pedido de'));
});

describe('destinatários do aviso', () => {
  it('aceita só IDs de grupo válidos em NOTIFY_GROUP_IDS', async () => {
    process.env.NOTIFY_GROUP_IDS = '120363019502650977-group, 5546999990000, lixo';
    const { env } = await import('../lib/env.js');
    expect(env.notifyGroupIds).toEqual(['120363019502650977-group']);
  });
});

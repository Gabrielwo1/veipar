import { describe, expect, it } from 'vitest';
import { toBubbles, toConversation } from '../lib/ai/attendant.js';
import type { ChatMessage } from '../lib/db.js';

const msg = (id: string, author: ChatMessage['author'], body: string | null, type = 'text'): ChatMessage =>
  ({ id, author, type, body, sent_at: '2026-10-16T12:00:00Z' });

describe('toConversation', () => {
  it('junta mensagens seguidas do cliente e alterna papéis', () => {
    const conv = toConversation([
      msg('1', 'customer', 'oi'),
      msg('2', 'customer', 'quero protetor'),
      msg('3', 'ai', 'Oi! Para qual telha?'),
      msg('4', 'customer', 'fibrocimento'),
    ]);
    expect(conv).toEqual([
      { role: 'user', content: 'oi\nquero protetor' },
      { role: 'assistant', content: 'Oi! Para qual telha?' },
      { role: 'user', content: 'fibrocimento' },
    ]);
  });

  it('descarta respostas antes da primeira mensagem do cliente e marca a equipe', () => {
    const conv = toConversation([
      msg('0', 'human', 'promoção!'),
      msg('1', 'customer', null, 'audio'),
      msg('2', 'human', 'Pode escrever?'),
    ]);
    expect(conv).toEqual([
      { role: 'user', content: '[cliente enviou um áudio]' },
      { role: 'assistant', content: '[vendedor da equipe] Pode escrever?' },
    ]);
  });
});

describe('toBubbles', () => {
  it('quebra por parágrafo e limita a 3 balões', () => {
    expect(toBubbles('a\n\nb')).toEqual(['a', 'b']);
    expect(toBubbles('a\n\nb\n\nc\n\nd')).toEqual(['a', 'b', 'c\n\nd']);
  });
});

describe('toConversation · continuidade', () => {
  const at = (iso: string, m: ChatMessage) => ({ ...m, sent_at: iso });

  it('mostra a mensagem citada pelo cliente', () => {
    const conv = toConversation([
      msg('1', 'customer', 'oi'),
      msg('2', 'ai', 'Protetor ou bico?'),
      { ...msg('3', 'customer', 'esse'), reply_to: '2' },
    ]);
    expect(conv.at(-1)).toEqual({ role: 'user', content: '[respondendo à mensagem: "Protetor ou bico?"] esse' });
  });

  it('marca quando o cliente volta depois de horas', () => {
    const conv = toConversation([
      at('2026-10-14T12:00:00Z', msg('1', 'customer', 'quero protetor')),
      at('2026-10-14T12:01:00Z', msg('2', 'ai', 'Quantos?')),
      at('2026-10-16T12:00:00Z', msg('3', 'customer', '500')),
    ]);
    expect(conv.at(-1)).toEqual({ role: 'user', content: '[o cliente voltou a escrever 2 dias depois] 500' });
  });
});

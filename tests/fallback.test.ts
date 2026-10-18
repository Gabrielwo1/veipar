import { beforeEach, describe, expect, it, vi } from 'vitest';

const db = vi.hoisted(() => ({
  getChatState: vi.fn(),
  getMessages: vi.fn(),
  handoff: vi.fn(),
  registerSent: vi.fn(),
  isPreExistingChat: vi.fn(),
  setAiEnabled: vi.fn(),
}));
const sendText = vi.hoisted(() => vi.fn());

vi.mock('../lib/db.js', () => db);
vi.mock('../lib/whatsapp.js', () => ({ sendText }));
vi.mock('openai', () => ({
  default: class {
    responses = { create: vi.fn().mockRejectedValue(new Error('429 You have no credits remaining')) };
  },
}));

process.env.AI_DEBOUNCE_SECONDS = '0';
const { runAttendant, FALLBACK_MESSAGE } = await import('../lib/ai/attendant.js');

describe('runAttendant · IA indisponível', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    db.getChatState.mockResolvedValue({ wa_id: '5562999717962', name: 'vilnei', ai_enabled: true, handoff_at: null });
    db.getMessages.mockResolvedValue([{ id: 'M1', author: 'customer', type: 'text', body: 'Qual é o preço?', sent_at: '2026-10-18T21:53:00Z' }]);
    db.isPreExistingChat.mockResolvedValue(false);
    sendText.mockResolvedValue('OUT1');
  });

  it('avisa o cliente com mensagem fixa e passa a conversa para a equipe', async () => {
    await runAttendant('5562999717962', 'M1');
    expect(db.handoff).toHaveBeenCalledWith('5562999717962', expect.objectContaining({ motivo: 'fora_do_escopo', observacoes: expect.stringContaining('no credits') }));
    expect(sendText).toHaveBeenCalledWith('5562999717962', FALLBACK_MESSAGE, 1);
    expect(db.registerSent).toHaveBeenCalledWith('5562999717962', 'OUT1', 'ai', FALLBACK_MESSAGE);
  });
});

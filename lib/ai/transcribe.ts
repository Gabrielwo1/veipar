import OpenAI, { toFile } from 'openai';
import { env } from '../env.js';

let client: OpenAI | undefined;

/** Baixa o áudio da Z-API e transcreve (português). Devolve null se não conseguir — a IA então pede para escrever. */
export async function transcribeAudio(url: string, mimeType?: string | null): Promise<string | null> {
  if (!env.aiEnabled) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!res.ok) throw new Error(`download ${res.status}`);
    const type = (mimeType || res.headers.get('content-type') || 'audio/ogg').split(';')[0]!.trim();
    const ext = type.split('/')[1]?.replace('mpeg', 'mp3') || 'ogg';
    const file = await toFile(Buffer.from(await res.arrayBuffer()), `audio.${ext}`, { type });

    client ??= new OpenAI();
    const out = await client.audio.transcriptions.create(
      { file, model: env.transcribeModel, language: 'pt' },
      { timeout: 20_000, maxRetries: 1 },
    );
    return out.text.trim() || null;
  } catch (err) {
    console.error('transcribeAudio', err instanceof Error ? err.message : err);
    return null;
  }
}

-- Veipar · link da mídia (áudio, imagem, vídeo, documento) para ouvir/ver no painel.
-- Áudios do cliente são transcritos e o texto vai em body.
alter table public.messages add column if not exists media_url text;

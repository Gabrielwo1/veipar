-- Veipar · chats que já existiam no WhatsApp antes do sistema (importados da Z-API).
-- Quem já conversava com a equipe continua com a equipe: a IA não atende esses números.
create table if not exists public.pre_existing_chats (
  wa_id           text primary key,
  name            text,
  last_message_at timestamptz,
  imported_at     timestamptz not null default now()
);
alter table public.pre_existing_chats enable row level security;

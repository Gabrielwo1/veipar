-- Veipar · mensagem citada ("responder") no WhatsApp, para a IA entender a que o cliente está respondendo
alter table public.messages add column if not exists reply_to text;

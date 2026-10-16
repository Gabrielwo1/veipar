function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Variável de ambiente ausente: ${name}`);
  return value;
}

const list = (value: string | undefined) =>
  (value ?? '').split(',').map((s) => s.trim()).filter(Boolean);

export const env = {
  // Z-API
  get zapiInstanceId() { return required('ZAPI_INSTANCE_ID'); },
  get zapiInstanceToken() { return required('ZAPI_INSTANCE_TOKEN'); },
  get zapiClientToken() { return required('ZAPI_CLIENT_TOKEN'); },
  get zapiBaseUrl() { return process.env.ZAPI_BASE_URL || 'https://api.z-api.io'; },
  /** Instâncias aceitas no webhook (padrão: só a de ZAPI_INSTANCE_ID). */
  get zapiAllowedInstances(): string[] {
    const ids = list(process.env.ZAPI_ALLOWED_INSTANCES);
    return ids.length ? ids : [this.zapiInstanceId];
  },
  /** Segredo na URL do webhook: a Z-API não assina as chamadas. */
  get webhookSecret() { return required('WEBHOOK_SECRET'); },

  // Aviso ao gerente
  get managerPhones(): string[] {
    return list(process.env.MANAGER_PHONES).map((p) => p.replace(/\D/g, '')).filter(Boolean);
  },
  /** Grupos que também recebem o aviso. IDs no formato 120363000000000000-group (veja /api/groups). */
  get notifyGroupIds(): string[] {
    return list(process.env.NOTIFY_GROUP_IDS).filter((id) => /^\d+-group$/.test(id));
  },
  get notifyReturnAfterHours() { return Number(process.env.NOTIFY_RETURN_AFTER_HOURS ?? 24) || 0; },
  get lineLabels(): Record<string, string> {
    return Object.fromEntries(
      list(process.env.LINE_LABELS)
        .map((pair) => pair.split(':').map((s) => s.trim()))
        .filter(([id, label]) => id && label),
    );
  },

  // Atendente de IA (OpenAI; a chave fica em OPENAI_API_KEY, lida pelo SDK)
  /** AI_ENABLED=false desliga a IA para todas as conversas. */
  get aiEnabled() { return process.env.AI_ENABLED !== 'false' && !!process.env.OPENAI_API_KEY; },
  get aiModel() { return process.env.AI_MODEL || 'gpt-5.5'; },
  /** Espera antes de responder, para juntar mensagens enviadas em sequência pelo cliente. */
  get aiDebounceMs() { return Number(process.env.AI_DEBOUNCE_SECONDS ?? 3) * 1000; },

  // Banco
  get supabaseUrl() { return required('SUPABASE_URL'); },
  get supabaseServiceRoleKey() { return required('SUPABASE_SERVICE_ROLE_KEY'); },

  // Painel
  get dashboardPassword() { return required('DASHBOARD_PASSWORD'); },
  /** Necessário para as conversas no painel e para a IA. STORE_MESSAGE_TEXT=false desliga. */
  get storeMessageText() { return process.env.STORE_MESSAGE_TEXT !== 'false'; },
  get timezone() { return process.env.TIMEZONE || 'America/Sao_Paulo'; },
};

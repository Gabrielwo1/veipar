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

  // Banco
  get supabaseUrl() { return required('SUPABASE_URL'); },
  get supabaseServiceRoleKey() { return required('SUPABASE_SERVICE_ROLE_KEY'); },

  // Painel
  get dashboardPassword() { return required('DASHBOARD_PASSWORD'); },
  get storeMessageText() { return process.env.STORE_MESSAGE_TEXT === 'true'; },
  get timezone() { return process.env.TIMEZONE || 'America/Sao_Paulo'; },
};

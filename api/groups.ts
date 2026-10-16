import { authorized, json } from '../lib/http.js';
import { listGroups } from '../lib/whatsapp.js';

/** Grupos do número conectado na Z-API, para configurar NOTIFY_GROUP_IDS. */
export async function GET(request: Request): Promise<Response> {
  if (!authorized(request)) return json({ error: 'unauthorized' }, 401);
  try {
    return json({ groups: await listGroups() });
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : String(err) }, 502);
  }
}

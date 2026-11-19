// Admin roles.
//   TICKETING_ADMIN_TOKEN → "admin": every action.
//   TICKETING_VIEW_TOKEN  → "view": read-only (sales, sellers, speakers, overview) with buyer contact and
//                           tax data masked, so it is safe to hand to a teammate or paste into an AI assistant.
import { timingSafeEqual } from 'node:crypto';

export const VIEW_ACTIONS = new Set(['sales', 'speakers', 'sellers', 'overview']);

const same = (a, b) => { const x = Buffer.from(a); const y = Buffer.from(b); return x.length === y.length && timingSafeEqual(x, y); };

// Returns { role } when authorized, otherwise { error } (never the token itself).
export function adminRole(request, { allowQuery = false } = {}) {
  const admin = (process.env.TICKETING_ADMIN_TOKEN || '').trim();
  const view = (process.env.TICKETING_VIEW_TOKEN || '').trim();
  let given = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
  if (!given && allowQuery) given = (new URL(request.url).searchParams.get('key') || '').trim();
  if (admin.length < 16) return { error: 'admin_token_not_configured_on_server' };
  if (!given) return { error: 'missing_token' };
  if (same(admin, given)) return { role: 'admin' };
  if (view.length >= 16 && same(view, given)) return { role: 'view' };
  return { error: 'wrong_token' };
}

const maskEmail = (v) => String(v).replace(/^(.)([^@]*)(@.+)$/, (_, a, b, c) => `${a}***${c}`);
const maskPhone = (v) => { const d = String(v).replace(/\D/g, ''); return d ? `•••${d.slice(-3)}` : v; };
const DROP = /^(abroadDetails|abroad_details|rfc|taxId|tax_id|razonSocial|razon_social|regime|regimen|cfdiUse|uso_cfdi|street|address|businessAddress|postalCode|postal_code|zip|ip|ipAddress|ip_address|userAgent|user_agent)$/i;

// Deep copy with personal contact/tax data masked (for the "view" role).
export function maskPersonal(value, key = '') {
  if (Array.isArray(value)) return value.map((v) => maskPersonal(v, key));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) { if (DROP.test(k)) { if (v != null) out[k] = '•••'; continue; } out[k] = maskPersonal(v, k); }
    return out;
  }
  if (typeof value === 'string' && value) {
    if (/email/i.test(key)) return maskEmail(value);
    if (/phone|tel|whatsapp/i.test(key)) return maskPhone(value);
    if (/clabe/i.test(key)) return `••••${value.replace(/\D/g, '').slice(-4)}`;
  }
  return value;
}

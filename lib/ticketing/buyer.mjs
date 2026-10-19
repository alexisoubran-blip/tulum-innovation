// Buyer details: name parts, phone with country code, optional company and CFDI invoice data.
// The same country list feeds the checkout (via /api/checkout/options) and the server validation.

import { promises as dns } from 'node:dns';

// [ISO, dial code, Spanish name, English name, national digits (exact) or null for 6–14]
export const COUNTRIES = [
  ['MX', '+52', 'México', 'Mexico', 10],
  ['US', '+1', 'Estados Unidos', 'United States', 10],
  ['CA', '+1', 'Canadá', 'Canada', 10],
  ['ES', '+34', 'España', 'Spain', 9],
  ['AR', '+54', 'Argentina', 'Argentina', null],
  ['CO', '+57', 'Colombia', 'Colombia', 10],
  ['CL', '+56', 'Chile', 'Chile', 9],
  ['PE', '+51', 'Perú', 'Peru', 9],
  ['BR', '+55', 'Brasil', 'Brazil', null],
  ['VE', '+58', 'Venezuela', 'Venezuela', 10],
  ['UY', '+598', 'Uruguay', 'Uruguay', null],
  ['EC', '+593', 'Ecuador', 'Ecuador', 9],
  ['GT', '+502', 'Guatemala', 'Guatemala', 8],
  ['CR', '+506', 'Costa Rica', 'Costa Rica', 8],
  ['PA', '+507', 'Panamá', 'Panama', 8],
  ['DO', '+1', 'República Dominicana', 'Dominican Republic', 10],
  ['SV', '+503', 'El Salvador', 'El Salvador', 8],
  ['HN', '+504', 'Honduras', 'Honduras', 8],
  ['BO', '+591', 'Bolivia', 'Bolivia', 8],
  ['PY', '+595', 'Paraguay', 'Paraguay', 9],
  ['GB', '+44', 'Reino Unido', 'United Kingdom', null],
  ['DE', '+49', 'Alemania', 'Germany', null],
  ['FR', '+33', 'Francia', 'France', 9],
  ['IT', '+39', 'Italia', 'Italy', null],
  ['PT', '+351', 'Portugal', 'Portugal', 9],
  ['NL', '+31', 'Países Bajos', 'Netherlands', 9],
  ['CH', '+41', 'Suiza', 'Switzerland', 9],
  ['IL', '+972', 'Israel', 'Israel', 9],
  ['AE', '+971', 'Emiratos Árabes Unidos', 'United Arab Emirates', 9],
  ['IN', '+91', 'India', 'India', 10],
  ['CN', '+86', 'China', 'China', 11],
  ['JP', '+81', 'Japón', 'Japan', 10],
  ['KR', '+82', 'Corea del Sur', 'South Korea', null],
  ['SG', '+65', 'Singapur', 'Singapore', 8],
  ['AU', '+61', 'Australia', 'Australia', 9],
];
const BY_ISO = new Map(COUNTRIES.map((c) => [c[0], c]));

export const countryOptions = () => COUNTRIES.map(([iso, dial, es, en]) => ({ iso, dial, name: { es, en } }));

// Returns { phone: '+52 5512345678', country: 'MX' } or { error }.
export function normalizePhone(iso, number) {
  const digits = String(number ?? '').replace(/\D/g, '');
  const c = BY_ISO.get(String(iso || '').toUpperCase());
  if (!c) {
    // Legacy clients send one free-form field with the + prefix.
    return /^\+/.test(String(number ?? '').trim()) && digits.length >= 8 && digits.length <= 15 ? { phone: `+${digits}`, country: null } : { error: 'invalid_phone' };
  }
  const [code, dial, , , exact] = c;
  let national = digits.startsWith(dial.slice(1)) && digits.length > (exact || 14) ? digits.slice(dial.length - 1) : digits;
  if (code === 'MX' && national.length === 11 && national.startsWith('1')) national = national.slice(1); // old mobile prefix 52 1
  const ok = exact ? national.length === exact : national.length >= 6 && national.length <= 14;
  return ok ? { phone: `${dial} ${national}`, country: code } : { error: 'invalid_phone' };
}

// ---------------------------------------------------------------- CFDI invoice (Mexico)
export const TAX_REGIMES = [
  ['601', 'General de Ley Personas Morales'],
  ['603', 'Personas Morales con Fines no Lucrativos'],
  ['605', 'Sueldos y Salarios e Ingresos Asimilados a Salarios'],
  ['606', 'Arrendamiento'],
  ['612', 'Personas Físicas con Actividades Empresariales y Profesionales'],
  ['616', 'Sin obligaciones fiscales'],
  ['621', 'Incorporación Fiscal'],
  ['625', 'Actividades Empresariales con ingresos a través de Plataformas Tecnológicas'],
  ['626', 'Régimen Simplificado de Confianza'],
];
export const CFDI_USES = [
  ['G03', 'Gastos en general'],
  ['S01', 'Sin efectos fiscales'],
];
const RFC_RE = /^([A-ZÑ&]{3,4})(\d{6})([A-Z0-9]{3})$/;

export function validateInvoice(input) {
  if (!input || typeof input !== 'object' || input.requested !== true) return { invoice: null };
  const rfc = String(input.rfc ?? '').toUpperCase().replace(/[\s-]/g, '');
  if (!RFC_RE.test(rfc)) return { error: 'invalid_rfc' };
  const legalName = String(input.legalName ?? '').trim().replace(/\s+/g, ' ').toUpperCase().slice(0, 200);
  if (legalName.length < 3) return { error: 'invalid_legal_name' };
  const zip = String(input.zip ?? '').replace(/\D/g, '');
  if (!/^\d{5}$/.test(zip)) return { error: 'invalid_tax_zip' };
  const regime = String(input.regime ?? '');
  if (!TAX_REGIMES.some(([c]) => c === regime)) return { error: 'invalid_tax_regime' };
  const use = String(input.use ?? 'G03');
  if (!CFDI_USES.some(([c]) => c === use)) return { error: 'invalid_cfdi_use' };
  return { invoice: { rfc, legal_name: legalName, zip, regime, use } };
}

// ---------------------------------------------------------------- email domain check
// true when the domain can receive mail (MX or A record). Fails open on timeouts and DNS outages:
// only a definite "this domain does not exist / has no mail server" rejects.
export async function emailDomainAccepts(email, { timeoutMs = 2500, resolver = dns } = {}) {
  const domain = String(email).split('@')[1];
  if (!domain) return false;
  const timeout = new Promise((resolve) => setTimeout(() => resolve('timeout'), timeoutMs));
  const lookup = (async () => {
    try {
      const mx = await resolver.resolveMx(domain);
      if (mx.length) return true;
    } catch (error) {
      if (!['ENOTFOUND', 'ENODATA'].includes(error?.code)) return true;
    }
    try { return (await resolver.resolve4(domain)).length > 0; } catch (error) { return !['ENOTFOUND', 'ENODATA'].includes(error?.code); }
  })();
  const result = await Promise.race([lookup, timeout]);
  return result !== false;
}

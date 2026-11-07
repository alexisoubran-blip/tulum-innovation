// Festival schedule from a Google Sheet (published as CSV). The team edits the sheet; the site reads it.
// Columns: publicado, tipo, dia, inicio, fin, lugar, titulo, titulo_en, persona, rol, foto_url,
//          descripcion, descripcion_en, carrusel, link

export const TYPES = ['charla', 'panel', 'whale-tank', 'taller', 'musica', 'bienestar', 'el-faro', 'networking', 'fiesta'];
export const DAYS = ['09', '10', '11', '12'];

export function parseCsv(text) {
  const rows = []; let row = []; let cell = ''; let quoted = false;
  const s = String(text || '').replace(/^﻿/, '');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quoted) {
      if (c === '"' && s[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((v) => String(v).trim() !== ''));
}

const yes = (v) => /^(s[ií]|yes|y|true|1|x)$/i.test(String(v || '').trim());
const txt = (v, max = 400) => String(v ?? '').trim().replace(/\s+/g, ' ').slice(0, max);

// "2026-12-10", "10/12/2026", "12/10/2026", "10 dic", "10" → "10"
export function dayOf(v) {
  const s = String(v || '').trim();
  let m = s.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) { const d = String(Number(m[3])).padStart(2, '0'); return Number(m[2]) === 12 && DAYS.includes(d) ? d : null; }
  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
  if (m) return pickDay(m[1], m[2]);
  m = s.match(/\b(9|09|10|11|12)\b/);
  return m ? m[1].padStart(2, '0') : null;
}
function pickDay(a, b) {
  // The festival is in December (month 12), so the other number is the day.
  const c = [a, b].map((d) => String(Number(d)).padStart(2, '0'));
  if (!c.includes('12')) return null;
  return c.find((d) => ['09', '10', '11'].includes(d)) || '12';
}
// "9:00", "09:00:00", "9:00 PM", "21h" → "21:00"
export function timeOf(v) {
  const s = String(v || '').trim().toLowerCase();
  const m = s.match(/(\d{1,2})(?::(\d{2}))?(?::\d{2})?\s*(am|pm|a\.m\.|p\.m\.)?/);
  if (!m) return '';
  let h = Number(m[1]); const min = m[2] || '00';
  if (m[3] && m[3].startsWith('p') && h < 12) h += 12;
  if (m[3] && m[3].startsWith('a') && h === 12) h = 0;
  return h > 23 ? '' : `${String(h).padStart(2, '0')}:${min}`;
}

export function eventsFromRows(rows) {
  if (!rows.length) return [];
  const head = rows[0].map((h) => String(h).trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''));
  const col = (name) => head.indexOf(name);
  const get = (r, name) => (col(name) >= 0 ? r[col(name)] : '');
  const out = [];
  rows.slice(1).forEach((r, i) => {
    if (!yes(get(r, 'publicado'))) return;
    const type = txt(get(r, 'tipo'), 40).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-');
    const day = dayOf(get(r, 'dia'));
    const title = txt(get(r, 'titulo'), 160);
    if (!day || !title) return;
    const photo = txt(get(r, 'foto_url'), 500);
    const link = txt(get(r, 'link'), 500);
    out.push({
      id: `e${i + 1}`,
      type: TYPES.includes(type) ? type : 'charla',
      day,
      start: timeOf(get(r, 'inicio')),
      end: timeOf(get(r, 'fin')),
      venue: txt(get(r, 'lugar'), 120),
      title: { es: title, en: txt(get(r, 'titulo_en'), 160) || title },
      person: txt(get(r, 'persona'), 160),
      role: txt(get(r, 'rol'), 120),
      photo: /^(https:\/\/|\/assets\/)/.test(photo) ? photo : '',
      desc: { es: txt(get(r, 'descripcion'), 600), en: txt(get(r, 'descripcion_en'), 600) || txt(get(r, 'descripcion'), 600) },
      featured: yes(get(r, 'carrusel')),
      link: /^https?:\/\//.test(link) ? link : '',
    });
  });
  return out.sort((a, b) => a.day.localeCompare(b.day) || (a.start || '99').localeCompare(b.start || '99') || a.title.es.localeCompare(b.title.es));
}

// Google Drive share links → CSV export URL. Published "pub?output=csv" links are used as is.
export function csvUrl(url) {
  const s = String(url || '').trim();
  if (!s) return '';
  if (/output=csv|format=csv/.test(s)) return s;
  const m = s.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (m) { const gid = (s.match(/[#&?]gid=(\d+)/) || [])[1]; return `https://docs.google.com/spreadsheets/d/${m[1]}/export?format=csv${gid ? `&gid=${gid}` : ''}`; }
  return s;
}

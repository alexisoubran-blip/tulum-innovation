// GET /api/schedule — the festival schedule (DJs, wellness, talks, workshops) from the team's Google Sheet.
// SCHEDULE_SHEET_URL: the sheet's link (shared "anyone with the link can view") or its published CSV link.
// Without it (or if the sheet fails) previews show sample data and production shows an empty schedule.
import { readFile } from 'node:fs/promises';
import { parseCsv, eventsFromRows, csvUrl } from '../lib/schedule.mjs';

let cache = { at: 0, body: null };
const TTL = 60 * 1000;

const json = (body, maxAge = 120) => new Response(JSON.stringify(body), {
  status: 200,
  headers: { 'content-type': 'application/json', 'cache-control': `public, s-maxage=${maxAge}, stale-while-revalidate=600`, 'access-control-allow-origin': '*' },
});

async function sample() {
  try { return JSON.parse(await readFile(new URL('../schedule/sample.json', import.meta.url), 'utf8')); } catch { return []; }
}

export async function GET() {
  if (cache.body && Date.now() - cache.at < TTL) return json(cache.body);
  const url = csvUrl(process.env.SCHEDULE_SHEET_URL);
  const isProd = process.env.VERCEL_ENV === 'production';
  let body;
  if (url) {
    try {
      const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 6000);
      const res = await fetch(url, { signal: ctrl.signal, redirect: 'follow' });
      clearTimeout(t);
      const text = await res.text();
      if (!res.ok || /^\s*</.test(text)) throw new Error(`sheet ${res.status}`);
      body = { ok: true, source: 'sheet', events: eventsFromRows(parseCsv(text)) };
    } catch (e) {
      console.error('[schedule]', e?.message);
      if (cache.body) return json(cache.body, 30);
      body = { ok: true, source: isProd ? 'empty' : 'sample', events: isProd ? [] : await sample() };
    }
  } else {
    body = { ok: true, source: isProd ? 'empty' : 'sample', events: isProd ? [] : await sample() };
  }
  cache = { at: Date.now(), body };
  return json(body);
}

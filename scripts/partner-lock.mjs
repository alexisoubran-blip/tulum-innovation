// Encrypts a private partner page so only people with the access code can read it.
// The repo is public: commit only the encrypted index.html, never source.local.html.
//
//   PARTNER_KEY=<clave> node scripts/partner-lock.mjs lock   partners/starlink   # source.local.html -> index.html
//   PARTNER_KEY=<clave> node scripts/partner-lock.mjs unlock partners/starlink   # index.html -> source.local.html (to edit)
//
// The page decrypts in the browser (PBKDF2-SHA256 + AES-GCM). The code is trimmed and lower-cased on both sides.
import { readFile, writeFile } from 'node:fs/promises';
import { webcrypto as crypto } from 'node:crypto';

const [mode, dir] = process.argv.slice(2);
const pass = (process.env.PARTNER_KEY || '').trim().toLowerCase();
if (!['lock', 'unlock'].includes(mode) || !dir || !pass) {
  console.error('Usage: PARTNER_KEY=<code> node scripts/partner-lock.mjs lock|unlock partners/<slug>');
  process.exit(1);
}
const ITER = 310000;
const page = `${dir}/index.html`, source = `${dir}/source.local.html`;
const pattern = /(<script type="application\/json" id="locked">)([\s\S]*?)(<\/script>)/;
const b64 = (u8) => Buffer.from(u8).toString('base64');
async function key(salt) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: ITER, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
const html = await readFile(page, 'utf8');
if (!pattern.test(html)) throw new Error(`No locked payload slot in ${page}`);
if (mode === 'lock') {
  const plain = await readFile(source, 'utf8');
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await key(salt), new TextEncoder().encode(plain)));
  const box = JSON.stringify({ v: 1, iter: ITER, salt: b64(salt), iv: b64(iv), data: b64(data) });
  await writeFile(page, html.replace(pattern, (_, a, __, c) => a + box + c));
  console.log(`Locked ${source} -> ${page} (${plain.length} chars).`);
} else {
  const box = JSON.parse(html.match(pattern)[2]);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: Buffer.from(box.iv, 'base64') }, await key(Buffer.from(box.salt, 'base64')), Buffer.from(box.data, 'base64'));
  await writeFile(source, new TextDecoder().decode(plain));
  console.log(`Unlocked ${page} -> ${source}.`);
}

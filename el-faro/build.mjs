// El Faro: renders the local initiatives directory from el-faro/initiatives.json into dist/el-faro/index.html.
import { readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const bi = (en, es) => `<span data-tif-en>${esc(en)}</span><span data-tif-es>${esc(es)}</span>`;
const THEMES = {
  ecology: ['Ecological regeneration', 'Regeneración ecológica'], refi: ['ReFi & new economies', 'ReFi y nuevas economías'],
  built: ['Built environment', 'Entorno construido'], tech: ['Regenerative technology', 'Tecnología regenerativa'],
  tourism: ['Tourism & territory', 'Turismo y territorio'], community: ['Community & governance', 'Comunidad y gobernanza'],
};
export async function buildElFaro() {
  const { initiatives } = JSON.parse(await readFile('el-faro/initiatives.json', 'utf8'));
  const cards = initiatives.map((it) => {
    assert.ok(it.name && it.description?.en && it.description?.es, `El Faro initiative needs name + en/es description: ${it.name}`);
    assert.ok(Array.isArray(it.themes) && it.themes.length && it.themes.every((t) => THEMES[t]), `El Faro initiative ${it.name}: unknown theme`);
    const tags = it.themes.map((t) => `<li>${bi(...THEMES[t])}</li>`).join('');
    const media = it.image ? `<img src="${esc(it.image)}" alt="${esc(it.name)}" loading="lazy" decoding="async">` : `<span aria-hidden="true">${esc(it.name.slice(0, 1))}</span>`;
    const link = it.url ? `<a href="${esc(it.url)}" target="_blank" rel="noopener">${bi('Visit', 'Visitar')} ↗</a>` : '';
    return `<article class="ef-init" data-themes="${it.themes.join(' ')}"><div class="ef-init-media">${media}</div><div><h3>${esc(it.name)}</h3>${it.location ? `<p class="ef-init-loc">${esc(it.location)}</p>` : ''}<p>${bi(it.description.en, it.description.es)}</p><ul>${tags}</ul>${link}</div></article>`;
  }).join('');
  const invite = `<a class="ef-init ef-init-invite" data-themes="ecology refi built tech tourism community" href="mailto:innovation@likegroup.io?subject=El%20Faro%20%E2%80%94%20Local%20initiative"><span class="ef-init-plus">+</span><div><h3>${bi(initiatives.length ? 'Add your initiative' : 'The first initiatives are being confirmed', initiatives.length ? 'Suma tu iniciativa' : 'Estamos confirmando las primeras iniciativas')}</h3><p>${bi('Working on regeneration in Tulum or the region? Share your project to be considered for the directory.', '¿Trabajas por la regeneración en Tulum o la región? Comparte tu proyecto para que lo consideremos en el directorio.')}</p><b>${bi('Share an initiative →', 'Compartir iniciativa →')}</b></div></a>`;
  // The directory section is shown only once there are confirmed initiatives (marker present in the page).
  const file = 'dist/el-faro/index.html';
  const html = await readFile(file, 'utf8');
  if (!html.includes('<!--INITIATIVES-->')) { console.log('El Faro: directory hidden until initiatives are confirmed.'); return; }
  await writeFile(file, html.replace('<!--INITIATIVES-->', cards + invite));
  console.log(`El Faro: ${initiatives.length} confirmed initiatives in the directory.`);
}

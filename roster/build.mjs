import { readFile, writeFile, mkdir, cp, access } from 'node:fs/promises';
import assert from 'node:assert/strict';

const esc = v => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const bi = (en, es) => `<span data-en>${esc(en)}</span><span data-es>${esc(es)}</span>`;
const roles = {'Speaker':'Speaker','Keynote Speaker':'Keynote Speaker','Panelist':'Panelista','Workshop Host':'Facilitador de workshop','Moderator':'Moderador','Speaker / Co-Founder':'Speaker / Cofundador','Investor':'Inversionista','Mentor':'Mentor','Host & Mentor':'Host y mentor'};
const version = '20260929-lineup';

function card(p, poster = false) {
  const photo = p.image ? `<div class="roster-art${poster ? ' roster-poster' : ''}"><img src="${esc(p.image)}" alt="${esc(p.name)}" width="440" height="540" loading="lazy" decoding="async" /></div>` : '';
  const link = p.url ? `<a class="roster-profile-link" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(p.name)}: ${/linkedin\.com/.test(p.url) ? 'LinkedIn' : 'website'}">${bi('View profile','Ver perfil')} <span aria-hidden="true">&#8599;</span></a>` : '';
  return `<article class="roster-card${p.image ? '' : ' roster-text-card'}" data-roster-card>
    ${photo}<div class="roster-meta"><p class="roster-role">${bi(p.role, roles[p.role])}</p><h3>${esc(p.name)}</h3>${p.company ? `<p class="roster-company">${esc(p.company)}</p>` : ''}${link}</div>
  </article>`;
}

export async function buildRoster() {
  const data = JSON.parse(await readFile(new URL('./data.json', import.meta.url), 'utf8'));
  const expected = {speakers:27,cofounders:7,investors:10,mentors:5};
  const allowed = new Set(['name','company','image','role','url']);
  for (const [group, people] of Object.entries(data)) {
    assert.equal(people.length, expected[group], `Unexpected ${group} count`);
    assert.equal(new Set(people.map(p => p.name.toLowerCase())).size, people.length, `Duplicate ${group}`);
    for (const p of people) {
      assert.ok(Object.keys(p).every(key => allowed.has(key)), 'Roster contains a non-public field');
      assert.ok(p.name && Object.hasOwn(roles, p.role));
      assert.ok(!/@|\d{8,}|typeform\.com|drive\.google\.com/.test(JSON.stringify(p)), 'Private field or registration link in roster');
      assert.ok(p.company || p.name === 'Abraham (Abe) Ramos', 'Missing company');
      if (p.url) assert.equal(new URL(p.url).protocol, 'https:');
      if (p.image) { assert.ok(p.image.startsWith('/assets/')); await access(`dist${p.image}`); }
    }
  }
  const original = await readFile('dist/index.html', 'utf8');
  assert.ok(!original.includes('data-roster-group'), 'Roster has already been generated');
  const featured = data.speakers.filter(p => p.image);
  const directory = data.speakers.filter(p => !p.image);
  const speakers = `<section class="v2-speakers v2-section roster-section" id="speakers" aria-labelledby="speakers-title">
  <div class="container">
    <div class="roster-section-head"><div><p class="v2-kicker">TIF 2026</p><h2 id="speakers-title">${bi('Meet the speakers','Conoce a los speakers')}</h2></div><p>${bi('Founders, investors and specialists sharing perspectives on technology, capital and culture.','Founders, inversionistas y especialistas que comparten perspectivas sobre tecnolog\u00eda, capital y cultura.')}</p></div>
    <div class="roster-jump-links"><a href="#speaker-lineup">Speakers <span>${data.speakers.length}</span></a><a href="#cofounders">Co-Founders <span>${data.cofounders.length}</span></a><a href="#investors">${bi('Investors','Inversionistas')} <span>${data.investors.length}</span></a><a href="#mentors">${bi('Mentors','Mentores')} <span>${data.mentors.length}</span></a></div>
    <div class="roster-group" id="speaker-lineup" data-roster-group="speakers">
      <div class="roster-group-head"><h3>Speakers</h3><p>${bi('Keynotes, panels & workshops','Keynotes, paneles y workshops')}</p></div>
      <div class="roster-grid roster-grid-speakers">${featured.map(p => card(p,true)).join('\n')}</div>
      <div class="roster-directory">${directory.map(p => card(p)).join('\n')}</div>
    </div>
    <div class="roster-group" id="cofounders" data-roster-group="cofounders">
      <div class="roster-group-head"><h3>Co-Founders</h3><p>${bi('The team building TIF 2026','El equipo que construye TIF 2026')}</p></div>
      <div class="roster-grid roster-grid-cofounders">${data.cofounders.map(p => card(p,true)).join('\n')}</div>
    </div>
  </div>
</section>`;
  const network = `<section class="v2-people v2-section roster-section roster-network" id="people" aria-labelledby="network-title">
  <div class="container">
    <div class="roster-section-head"><div><p class="v2-kicker">Whale Tank 2026</p><h2 id="network-title">${bi('Meet the investors & mentors','Conoce a los inversionistas y mentores')}</h2></div><p>${bi('The investors and mentors participating in the Whale Tank network.','Los inversionistas y mentores que participan en la red de Whale Tank.')}</p></div>
    <div class="roster-group" id="investors" data-roster-group="investors"><div class="roster-group-head"><h3>${bi('Investors','Inversionistas')}</h3><p>Whale Tank 2026</p></div><div class="roster-grid roster-grid-network">${data.investors.map(p => card(p)).join('\n')}</div></div>
    <div class="roster-group" id="mentors" data-roster-group="mentors"><div class="roster-group-head"><h3>${bi('Mentors','Mentores')}</h3><p>Whale Tank 2026</p></div><div class="roster-grid roster-grid-network">${data.mentors.map(p => card(p)).join('\n')}</div></div>
    <div class="roster-network-actions"><a class="btn btn-ghost" href="/whale-tank">${bi('Explore Whale Tank','Explorar Whale Tank')}</a></div>
  </div>
</section>`;
  const speakerPattern=/<section class="v2-speakers v2-section"[\s\S]*?<\/section>/;
  const peoplePattern=/<section class="v2-people v2-section"[\s\S]*?<\/section>/;
  assert.ok(speakerPattern.test(original) && peoplePattern.test(original), 'Expected roster anchors not found');
  const home=original.replace(speakerPattern,speakers).replace(peoplePattern,network).replace('</head>',`<link rel="stylesheet" href="/roster/styles.css?v=${version}" />\n</head>`);
  const scripts = html => html.match(/<script\b[\s\S]*?<\/script>/g)||[];
  assert.deepEqual(scripts(home),scripts(original),'Existing scripts must remain unchanged');
  for (const cls of ['v2-hero','press-strip','v2-tickets v2-section','v2-past-people v2-section']) {
    const re=new RegExp(`<section class="${cls}"[\\s\\S]*?<\\/section>`);
    assert.equal(home.match(re)?.[0],original.match(re)?.[0],`Preserve ${cls}`);
  }
  assert.ok(home.indexOf('id="speaker-lineup"')<home.indexOf('id="cofounders"'));
  assert.ok(home.indexOf('id="cofounders"')<home.indexOf('id="investors"'));
  assert.equal((home.match(/data-roster-card/g)||[]).length,49);
  await mkdir('dist/roster',{recursive:true});
  await cp('roster/styles.css','dist/roster/styles.css');
  await writeFile('dist/index.html',home);
  console.log('Roster: 27 speakers, 7 co-founders, 10 investors, 5 mentors. Names and available companies rendered as static HTML.');
}

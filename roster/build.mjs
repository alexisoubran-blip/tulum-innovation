import { readFile, writeFile, mkdir, cp, access } from 'node:fs/promises';
import assert from 'node:assert/strict';

const esc = v => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const bi = (en, es) => `<span data-en>${esc(en)}</span><span data-es>${esc(es)}</span>`;
const roles = {'Speaker':'Speaker','Keynote Speaker':'Keynote Speaker','Panelist':'Panelista','Workshop Host':'Facilitador de workshop','Moderator':'Moderador','Speaker / Co-Founder':'Speaker / Cofundador','Investor':'Inversionista','Mentor':'Mentor','Host & Mentor':'Host y mentor','Ambassador':'Embajador/a'};
const version = '20261015-logos';

function card(p, poster = false) {
  const photo = p.image ? `<div class="roster-art${poster ? ' roster-poster' : ''}"><img src="${esc(p.image)}" alt="${esc(p.name)}" width="440" height="540" loading="lazy" decoding="async" /></div>` : '';
  const link = p.url ? `<a class="roster-profile-link" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(p.name)}: ${/linkedin\.com/.test(p.url) ? 'LinkedIn' : 'website'}">${bi('View profile','Ver perfil')} <span aria-hidden="true">&#8599;</span></a>` : '';
  return `<article class="roster-card${p.image ? '' : ' roster-text-card'}" data-roster-card>
    ${photo}<div class="roster-meta"><p class="roster-role">${bi(p.role, roles[p.role])}</p><h3>${esc(p.name)}</h3>${p.title ? `<p class="roster-job-title">${bi(p.title,p.titleEs || p.title)}</p>` : ''}${p.company ? `<p class="roster-company">${esc(p.company)}</p>` : ''}${link}</div>
  </article>`;
}

export async function buildRoster() {
  // This file contains only public profiles. Re-add a speaker only after
  // editorial approval and after their approved photo has been added.
  const data = JSON.parse(await readFile(new URL('./data.json', import.meta.url), 'utf8'));
  const groups = ['speakers','cofounders','ambassadors','investors','mentors'];
  assert.deepEqual(Object.keys(data).sort(), [...groups].sort(), 'Unexpected roster groups');
  const allowed = new Set(['name','company','image','role','url','title','titleEs']);
  for (const [group, people] of Object.entries(data)) {
    assert.ok(Array.isArray(people) && people.length > 0, `Empty or invalid ${group}`);
    assert.equal(new Set(people.map(p => p.name.toLowerCase())).size, people.length, `Duplicate ${group}`);
    for (const p of people) {
      assert.ok(Object.keys(p).every(key => allowed.has(key)), 'Roster contains a non-public field');
      assert.ok(p.name && Object.hasOwn(roles, p.role));
      assert.ok(!/@|\d{8,}|typeform\.com|drive\.google\.com/.test(JSON.stringify({...p,url:undefined})), 'Private field or registration link in roster');
      if (p.url) assert.ok(!/typeform\.com|drive\.google\.com/.test(p.url), 'Registration link in public roster');
      // Company is required unless the organizer's material gives none (ambassador flyers carry no company).
      assert.ok(p.company || group === 'ambassadors' || ['Abraham (Abe) Ramos','Golden Yogi','Maja Lucatelli'].includes(p.name), 'Missing company');
      if (p.url) assert.equal(new URL(p.url).protocol, 'https:');
      if (group === 'speakers' || group === 'ambassadors') {
        assert.ok(typeof p.image === 'string' && p.image.trim(), 'Public speakers must have an approved photo; do not publish pending profiles');
      }
      if (p.image) { assert.ok(p.image.startsWith('/assets/')); await access(`dist${p.image}`); }
    }
  }
  const original = await readFile('dist/index.html', 'utf8');
  assert.ok(!original.includes('data-roster-group'), 'Roster has already been generated');
  const speakers = `<section class="v2-speakers v2-section roster-section" id="speakers" aria-labelledby="speakers-title">
  <div class="container">
    <div class="roster-section-head"><div><p class="v2-kicker">TIF 2026</p><h2 id="speakers-title">${bi('Meet the speakers','Conoce a los speakers')}</h2></div><p>${bi('Founders, investors and specialists sharing perspectives on technology, capital and culture.','Founders, inversionistas y especialistas que comparten perspectivas sobre tecnolog\u00eda, capital y cultura.')}</p></div>
    <div class="roster-group" id="speaker-lineup" data-roster-group="speakers">
      <div class="roster-group-head"><h3>Speakers</h3><p>${bi('Keynotes, panels & workshops','Keynotes, paneles y workshops')}</p></div>
      <div class="roster-grid roster-grid-speakers">${data.speakers.map(p => card(p,true)).join('\n')}</div>
    </div>
    <div class="roster-group" id="cofounders" data-roster-group="cofounders">
      <div class="roster-group-head"><h3>Co-Founders</h3><p>${bi('The team building TIF 2026','El equipo que construye TIF 2026')}</p></div>
      <div class="roster-grid roster-grid-cofounders">${data.cofounders.map(p => card(p,true)).join('\n')}</div>
    </div>
    <div class="roster-group" id="ambassadors" data-roster-group="ambassadors">
      <div class="roster-group-head"><h3>${bi('Ambassadors','Embajadores')}</h3><p>${bi('Bringing TIF to their communities','Llevan TIF a sus comunidades')}</p></div>
      <div class="roster-grid roster-grid-speakers">${data.ambassadors.map(p => card(p,true)).join('\n')}</div>
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
  assert.ok(home.indexOf('id="cofounders"')<home.indexOf('id="ambassadors"'));
  assert.ok(home.indexOf('id="ambassadors"')<home.indexOf('id="investors"'));
  const totalPeople = groups.reduce((total, group) => total + data[group].length, 0);
  assert.equal((home.match(/data-roster-card/g)||[]).length, totalPeople);
  assert.ok(!speakers.includes('roster-directory'), 'Do not publish a text-only speaker directory');
  await mkdir('dist/roster',{recursive:true});
  await cp('roster/styles.css','dist/roster/styles.css');
  await writeFile('dist/index.html',home);
  // Keep every public group in one continuous, searchable directory.
  // A person may also be an ambassador (e.g. a Whale Tank mentor); the directory keeps their main role.
  const key = p => p.name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const nonAmbassadors = groups.filter(g => g !== 'ambassadors').flatMap(group => data[group]);
  const mainKeys = new Set(nonAmbassadors.map(key));
  assert.equal(mainKeys.size, nonAmbassadors.length, 'Duplicate public participant');
  const lineup = groups.flatMap(group => group === 'ambassadors' ? data[group].filter(p => !mainKeys.has(key(p))) : data[group]);
  const directoryCards = lineup.map(p => `<article class="person" data-person="${esc([p.name,p.role,roles[p.role],p.title,p.company].filter(Boolean).join(' ').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase())}"><div class="person-art"><img src="${esc(p.image)}" alt="${esc(p.name)}" width="640" height="800" loading="lazy" decoding="async"></div><div class="person-copy"><h3>${esc(p.name)}</h3>${p.title ? `<p class="person-job-title">${bi(p.title,p.titleEs || p.title)}</p>` : ''}${p.company ? `<p>${esc(p.company)}</p>` : ''}<span class="role">${bi(p.role,roles[p.role])}</span>${p.url ? `<a class="person-profile-link" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">${bi('View profile','Ver perfil')} ↗</a>` : ''}</div></article>`).join('\n');
  let directory = await readFile('dist/speakers/index.html','utf8');
  const gridPattern = /<div class="people-grid" id="peopleGrid">[\s\S]*?<\/div>(?=<div class="notice")/;
  assert.ok(gridPattern.test(directory),'Missing speakers directory grid');
  directory = directory.replace(gridPattern,`<div class="people-grid" id="peopleGrid">${directoryCards}</div>`);
  directory = directory
    .replace('<title>Speakers | Tulum Innovation Fest 2026</title>', '<title data-tif-title-en="Speakers, Investors &amp; Mentors | Tulum Innovation Fest 2026" data-tif-title-es="Speakers, inversionistas y mentores | Tulum Innovation Fest 2026">Speakers, Investors &amp; Mentors | Tulum Innovation Fest 2026</title>')
    .replace('content="Meet the people publicly featured for Tulum Innovation Fest 2026."', 'content="Meet the speakers, investors and mentors joining Tulum Innovation Fest 2026." data-tif-content-en="Meet the speakers, investors and mentors joining Tulum Innovation Fest 2026." data-tif-content-es="Conoce a los speakers, inversionistas y mentores que participan en Tulum Innovation Fest 2026."')
    .replace('<h1>People shaping the conversation</h1>', `<h1>${bi('People shaping the conversation','Las personas que participan en TIF 2026')}</h1>`)
    .replace('Meet the founders, investors and voices joining Tulum Innovation Fest. Explore the people bringing their perspectives on technology, business and culture to Tulum this December.', bi('Meet the speakers, founders, investors and mentors joining Tulum Innovation Fest. Explore the people bringing their perspectives on technology, business and culture to Tulum this December.', 'Conoce a los speakers, founders, inversionistas y mentores que participan en Tulum Innovation Fest. Descubre sus perspectivas sobre tecnología, negocios y cultura este diciembre en Tulum.'))
    .replaceAll('Apply to be a speaker ↗', `${bi('Apply to be a speaker','Postúlate como speaker')} ↗`)
    .replace('placeholder="Search by name or organization"', 'placeholder="Search by name, organization or role" data-tif-placeholder-en="Search by name, organization or role" data-tif-placeholder-es="Buscar por nombre, organización o rol"')
    .replace('aria-label="Search speakers"', 'aria-label="Search speakers, investors and mentors" data-tif-label-en="Search speakers, investors and mentors" data-tif-label-es="Buscar speakers, inversionistas y mentores"')
    .replace('<h2>Featured speakers</h2>', `<h2>${bi('Speakers, ambassadors, investors & mentors','Speakers, embajadores, inversionistas y mentores')}</h2>`)
    .replace('Discover the speakers joining the conversation at TIF 2026, from entrepreneurship and investment to ideas that shape how we live and work.', bi('Explore the speakers, co-founders, ambassadors, investors and mentors participating in TIF 2026 and Whale Tank.', 'Conoce a los speakers, cofundadores, embajadores, inversionistas y mentores que participan en TIF 2026 y Whale Tank.'))
    .replace('Speak at TIF 2026</h2>', `${bi('Speak at TIF 2026','Participa como speaker en TIF 2026')}</h2>`)
    .replace('Share your expertise on technology, business or culture. Submit your proposal through the speaker application form.', bi('Share your expertise on technology, business or culture. Submit your proposal through the speaker application form.', 'Comparte tu experiencia en tecnología, negocios o cultura. Envía tu propuesta a través del formulario para speakers.'))
    .replace('Continue exploring TIF: ', `${bi('Continue exploring TIF:','Sigue explorando TIF:')} `)
    .replace('discover the four-day program</a>', `${bi('discover the four-day program','consulta el programa de cuatro días')}</a>`)
    .replace(' or <a href="/#tickets">choose your festival pass</a>.', ` ${bi('or','o')} <a href="/#tickets">${bi('choose your festival pass','elige tu acceso al festival')}</a>.`);
  // Logos of the organizations participants lead or represent. Each logo must belong to someone
  // in the public roster; logos identify affiliations and are not sponsors.
  const logos = JSON.parse(await readFile(new URL('./logos.json', import.meta.url), 'utf8'));
  const rosterNames = new Set(groups.flatMap(group => data[group]).map(p => p.name));
  for (const l of logos) {
    assert.ok(l.name && l.logo.startsWith('/assets/') && l.width > 0 && l.height > 0, `Invalid logo ${l.name}`);
    await access(`dist${l.logo}`);
    assert.ok(l.people.length && l.people.every(n => rosterNames.has(n)), `Logo ${l.name} must match a public participant`);
  }
  // Equal visual weight: every logo gets roughly the same area, capped in height.
  const logoItems = logos.map(l => {
    const ratio = l.width / l.height;
    const h = Math.min(46, Math.max(18, Math.sqrt(2400 / ratio))).toFixed(1);
    return `<li style="--logo-h:${h}px"><img src="${esc(l.logo)}" alt="${esc(l.name)}" title="${esc(`${l.name} · ${l.people.join(', ')}`)}" width="${l.width}" height="${l.height}" loading="lazy" decoding="async"></li>`;
  }).join('');
  const logoBand = `<section class="roster-logos" aria-labelledby="roster-logos-title"><div class="container"><div class="roster-logos-head"><p class="roster-logos-kicker" id="roster-logos-title">${bi('Where our speakers, investors & mentors build','Dónde construyen nuestros speakers, inversionistas y mentores')}</p><p class="roster-logos-note">${bi('Organizations led or represented by TIF 2026 participants.','Organizaciones que lideran o representan los participantes de TIF 2026.')}</p></div><ul class="roster-logos-list">${logoItems}</ul></div></section>`;
  assert.ok(directory.includes('<div class="tools">'), 'Missing speakers search bar');
  directory = directory.replace('<div class="tools">', `${logoBand}<div class="tools">`);
  directory = directory.replace('const q=input.value.toLowerCase()',"const q=input.value.normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().trim()");
  directory = directory.replace('</head>',`<link rel="stylesheet" href="/roster/styles.css?v=${version}" /></head>`);
  assert.equal((directory.match(/data-person=/g)||[]).length,lineup.length);
  for(const p of lineup) assert.ok(home.includes(esc(p.name)) && directory.includes(esc(p.name)), `Missing participant ${p.name}`);
  await writeFile('dist/speakers/index.html',directory);
  console.log(`Roster: ${data.speakers.length} speakers with photos, ${data.cofounders.length} co-founders, ${data.ambassadors.length} ambassadors, ${data.investors.length} investors, ${data.mentors.length} mentors. Pending speakers are excluded from public HTML.`);
}

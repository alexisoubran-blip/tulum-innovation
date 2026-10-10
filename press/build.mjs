import { readFile, writeFile, mkdir, cp, access } from 'node:fs/promises';
import assert from 'node:assert/strict';

const escape = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const bilingual = (en, es) => `<span data-en>${escape(en)}</span><span data-es>${escape(es)}</span>`;
const pair = value => bilingual(value.en, value.es);
const canonical = 'https://www.tuluminnovationfest.com/press';
const version = '20261010-type-floor';

export async function buildPress() {
  const { records } = JSON.parse(await readFile(new URL('./data.json', import.meta.url), 'utf8'));
  assert.ok(records.length > 0, 'Press archive must not be empty');
  assert.equal(new Set(records.map(r => r.id)).size, records.length, 'Duplicate press IDs');
  assert.equal(new Set(records.map(r => r.url)).size, records.length, 'Duplicate article links');
  for (const record of records) {
    assert.ok(/^https:\/\//.test(record.url), 'Article links must use HTTPS');
    assert.ok(['article','release','partner'].includes(record.kind), 'Unknown publication category');
    assert.ok(record.title.en && record.title.es && record.summary.en && record.summary.es);
    assert.ok(Number.isInteger(record.year));
    if (record.date) assert.equal(record.date.slice(0,4), String(record.year));
  }
  const featured = records.filter(r => r.featuredOrder).sort((a,b) => a.featuredOrder-b.featuredOrder);
  assert.equal(featured.length, 7, 'Expected seven featured publishers');
  for (const record of featured) {
    assert.equal(record.kind, 'article', 'Partner and sponsored publications are labeled in the archive, not the featured rail');
    assert.ok(record.logo.startsWith('/assets/'));
    await access(`dist${record.logo}`);
  }
  const pressLink = bilingual('Explore the press','Ver cobertura');
  const rail = `<section class="press-strip" id="press-coverage" aria-labelledby="press-strip-title">
  <div class="press-wrap">
    <div class="press-strip-head">
      <h2 class="press-eyebrow" id="press-strip-title">${bilingual('As seen in','En los medios')}</h2>
      <a class="press-text-link" href="/press">${pressLink}<span aria-hidden="true">&#8599;</span></a>
    </div>
    <ul class="press-logo-grid">
      ${featured.map(r => `<li><a class="press-logo-link" data-outlet="${r.id}" href="${escape(r.url)}" target="_blank" rel="noopener noreferrer" aria-label="${escape(r.outlet)} ${r.year}"><img src="${r.logo}" alt="${escape(r.outlet)}" width="220" height="64" loading="lazy" decoding="async" /><span>${r.year}</span></a></li>`).join('\n      ')}
    </ul>
    <p class="press-strip-note">${bilingual('Coverage of Tulum Innovation Fest, Whale Tank and previous Tulum Crypto Fest editions.','Cobertura de Tulum Innovation Fest, Whale Tank y ediciones anteriores de Tulum Crypto Fest.')}</p>
  </div>
</section>`;

  // Add only the requested press components to the already-validated homepage.
  const original = await readFile('dist/index.html','utf8');
  const marker = '    <section class="v2-proof-strip"';
  assert.equal(original.split(marker).length, 2, 'Homepage proof-strip anchor changed');
  const footerMarker = '<nav class="v2-footer-links" aria-label="Footer navigation">';
  assert.ok(original.includes(footerMarker), 'Homepage footer anchor changed');
  let home = original.replace('</head>', `  <link rel="stylesheet" href="/press/styles.css?v=${version}" />\n</head>`)
    .replace('<body>', '<body class="tif-has-press">')
    .replace(marker, `    ${rail}\n\n${marker}`)
    .replace(footerMarker, `${footerMarker}\n        <a href="/press">${bilingual('Press','Prensa')}</a>`);
  // Replace the old unlinked media-name section with the sourced publisher rail.
  home = home.replace(/    <section class="v2-media v2-section"[\s\S]*?<\/section>\s*/, '');
  const scripts = html => html.match(/<script\b[\s\S]*?<\/script>/g) || [];
  assert.deepEqual(scripts(home), scripts(original), 'Homepage scripts must be preserved');
  const hero = html => html.match(/<section class="v2-hero"[\s\S]*?<\/section>/)?.[0];
  assert.equal(hero(home), hero(original), 'Hero must remain unchanged');
  assert.equal((home.match(/id="press-coverage"/g)||[]).length, 1);
  await writeFile('dist/index.html', home);

  const dateMarkup = r => r.date ? `<time datetime="${r.date}">${bilingual(new Intl.DateTimeFormat('en',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(r.date)),new Intl.DateTimeFormat('es',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(r.date)))}</time>` : `<time datetime="${r.year}">${r.year}</time>`;
  const cards = records.map(r => `<article class="press-card" id="${r.id}" data-press-card data-year="${r.year}" data-kind="${r.kind}">
    <div class="press-card-top"><p class="press-outlet">${escape(r.outlet)}</p>${dateMarkup(r)}</div>
    <span class="press-kind">${pair(r.label)} &middot; ${escape(r.language)}</span>
    <h3>${pair(r.title)}</h3>
    <p class="press-card-summary">${pair(r.summary)}</p>
    <a href="${escape(r.url)}" target="_blank" rel="noopener noreferrer">${bilingual('Read the publication','Leer la publicaci\u00f3n')}<span aria-hidden="true">&#8599;</span></a>
  </article>`).join('\n');
  const years = [...new Set(records.map(r => r.year))].sort((a,b) => b-a);
  const description = 'Selected press coverage of Tulum Innovation Fest, Whale Tank and previous Tulum Crypto Fest editions, with source links and publication labels.';
  const schema = {'@context':'https://schema.org','@type':'CollectionPage',url:canonical,name:'Tulum Innovation Fest in the press',description,inLanguage:['en','es'],mainEntity:{'@type':'ItemList',itemListElement:records.map((r,i)=>({'@type':'ListItem',position:i+1,url:r.url,name:r.title.en}))}};
  const archiveRail = rail.replace('href="/press"','href="#archive"').replace(pressLink,bilingual('Browse publications','Explorar publicaciones'));
  const page = `<!DOCTYPE html>
<html lang="en" data-lang="en">
<head>
  <!-- Google Tag Manager -->
  <script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
  new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
  j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
  'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
  })(window,document,'script','dataLayer','GTM-5XJG96K');</script>
  <!-- End Google Tag Manager -->
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <meta name="theme-color" content="#00080b" />
  <title>Press &amp; Media | Tulum Innovation Fest</title>
  <meta name="description" content="${description}" />
  <meta name="robots" content="index,follow,max-image-preview:large" />
  <link rel="canonical" href="${canonical}" />
  <meta property="og:type" content="website" />
  <meta property="og:title" content="Tulum Innovation Fest in the press" />
  <meta property="og:description" content="${description}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:image" content="https://www.tuluminnovationfest.com/assets/hero-desktop.png" />
  <link rel="icon" type="image/svg+xml" href="/assets/signal-mark.svg" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Bruno+Ace&amp;family=Sora:wght@300;400;500;600;700&amp;display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/press/styles.css?v=${version}" />
  <script>(()=>{let s;try{s=localStorage.getItem('tif-language')}catch(e){}const q=new URLSearchParams(location.search).get('lang');const l=['en','es'].includes(q)?q:['en','es'].includes(s)?s:(navigator.language||'en').toLowerCase().startsWith('es')?'es':'en';document.documentElement.lang=l;document.documentElement.dataset.lang=l;})();</script>
  <script type="application/ld+json">${JSON.stringify(schema).replace(/</g,'\\u003c')}</script>
  <script defer src="/press/script.js?v=${version}"></script>
</head>
<body class="press-page">
  <!-- Google Tag Manager (noscript) -->
  <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-5XJG96K"
  height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
  <!-- End Google Tag Manager (noscript) -->
  <a class="press-skip" href="#main">${bilingual('Skip to content','Ir al contenido')}</a>
  <header class="press-header press-wrap">
    <a class="press-brand" href="/" aria-label="Tulum Innovation Fest home"><img src="/assets/tulum-innovation-fest-logo.png" alt="Tulum Innovation Fest" width="200" height="40" /></a>
    <nav class="press-nav" aria-label="Main navigation">
      <a href="/">${bilingual('Home','Inicio')}</a><a href="/whale-tank">Whale Tank</a><a href="/sponsorship">Partners</a>
      <button class="press-lang" data-press-lang type="button" aria-label="Cambiar a espa&#241;ol">EN / ES</button>
    </nav>
  </header>
  <main id="main">
    <section class="press-intro press-wrap" aria-labelledby="press-title">
      <p class="press-eyebrow">${bilingual('Press & media','Prensa y medios')}</p>
      <h1 id="press-title">TIF <em>${bilingual('in the press.','en los medios.')}</em></h1>
      <p class="press-intro-copy">${bilingual('Selected coverage of the festival and Whale Tank, from the Tulum Crypto Fest editions to TIF 2026. Explore the original publications below.','Una selecci\u00f3n de la cobertura del festival y Whale Tank, desde las ediciones de Tulum Crypto Fest hasta TIF 2026. Consulta las publicaciones originales.')}</p>
      <div class="press-intro-meta"><span>2022 &ndash; 2026</span><span>${bilingual(`${records.length} selected publications`,`${records.length} publicaciones seleccionadas`)}</span><span>${bilingual('Sources in English & Spanish','Fuentes en ingl\u00e9s y espa\u00f1ol')}</span></div>
    </section>
    ${archiveRail}
    <section class="press-archive" id="archive" aria-labelledby="archive-title">
      <div class="press-wrap">
        <div class="press-archive-heading"><h2 id="archive-title">${bilingual('Explore the coverage','Explora la cobertura')}</h2><p>${bilingual('Publication dates and source types are shown on each card.','Cada ficha indica fecha y tipo de publicaci\u00f3n.')}</p></div>
        <div class="press-filters" data-press-filters hidden>
          <label>${bilingual('Publication year','A\u00f1o de publicaci\u00f3n')}<select data-press-year><option value="all" data-en-label="All years" data-es-label="Todos los a&#241;os">All years</option>${years.map(y=>`<option value="${y}">${y}</option>`).join('')}</select></label>
          <label>${bilingual('Publication type','Tipo de publicaci\u00f3n')}<select data-press-kind><option value="all" data-en-label="All publications" data-es-label="Todas las publicaciones">All publications</option><option value="article" data-en-label="Articles" data-es-label="Notas">Articles</option><option value="release" data-en-label="Releases & sponsored" data-es-label="Comunicados y patrocinados">Releases &amp; sponsored</option><option value="partner" data-en-label="Partner publications" data-es-label="Colaboraciones">Partner publications</option></select></label>
          <p class="press-filter-status" data-press-status role="status" aria-live="polite"></p>
        </div>
        <div class="press-cards">${cards}</div>
        <p class="press-empty" data-press-empty hidden>${bilingual('No publications match these filters. Try another year or publication type.','No hay publicaciones con estos filtros. Prueba otro a\u00f1o o tipo de publicaci\u00f3n.')}</p>
        <p class="press-disclosure">${bilingual('This archive includes historical coverage. Publication years do not indicate participation in TIF 2026. Press releases, sponsored content and declared partner relationships are labeled separately. Publisher names and logos identify the linked sources and do not imply sponsorship, endorsement or a current partnership.','Este archivo incluye cobertura hist\u00f3rica. Los a\u00f1os de publicaci\u00f3n no indican participaci\u00f3n en TIF 2026. Los comunicados, contenidos patrocinados y v\u00ednculos declarados se identifican por separado. Los nombres y logos de los medios identifican las fuentes enlazadas y no implican patrocinio, respaldo o una alianza vigente.')}</p>
      </div>
    </section>
  </main>
  <footer class="press-footer press-wrap"><p>${bilingual('Tulum Innovation Fest brings innovation, capital, culture and human connection together in Tulum, Mexico.','Tulum Innovation Fest re\u00fane innovaci\u00f3n, capital, cultura y conexi\u00f3n humana en Tulum, M\u00e9xico.')}</p><a class="press-button" href="/">${bilingual('Back to TIF','Volver a TIF')}</a></footer>
</body>
</html>`;
  await mkdir('dist/press',{recursive:true});
  await writeFile('dist/press/index.html',page);
  await cp('press/styles.css','dist/press/styles.css');
  await cp('press/script.js','dist/press/script.js');
  console.log(`Press: ${featured.length} local publisher logos; ${records.length} labeled, static article cards; /press generated.`);
}

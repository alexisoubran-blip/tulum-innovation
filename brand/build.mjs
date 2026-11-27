import {readFile,writeFile,cp,mkdir,readdir} from 'node:fs/promises';
import assert from 'node:assert/strict';

const version='20261127-sl2';
// Starlink is the presenting partner of TIF 2026: shown next to the logo on every page and in the footer.
const STARLINK='<span class="tif-presented"><small>Presented by</small><img src="/assets/partners/starlink/starlink-logo-white.webp" alt="Starlink" width="1015" height="124" decoding="async"></span>';
const bi=(en,es)=>`<span data-tif-en>${en}</span><span data-tif-es>${es}</span>`;
const items=[['/speakers','Speakers','Speakers'],['/program','Program','Programa'],['/whale-tank','Whale Tank','Whale Tank'],['/el-faro','El Faro','El Faro'],['/sponsorship','Partners','Partners'],['/#participate','Participate','Participar'],['/mezcal','Mezcal','Mezcal'],['/press','Press','Prensa'],['/blog','Blog','Blog']];
const SOCIAL=[['https://www.instagram.com/tulumcryptofest/','Instagram',`<svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.4" cy="6.6" r="1.2" fill="currentColor"/></svg>`],['https://www.youtube.com/@tulumcryptofest','YouTube',`<svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20"><path d="M21.6 7.2a2.6 2.6 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.6 2.6 0 0 0 2.4 7.2 27 27 0 0 0 2 12a27 27 0 0 0 .4 4.8 2.6 2.6 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.6 2.6 0 0 0 1.8-1.8A27 27 0 0 0 22 12a27 27 0 0 0-.4-4.8Z" fill="currentColor"/><path d="m10 15 5.2-3L10 9v6Z" fill="#00080B"/></svg>`],['https://www.linkedin.com/company/81967764/','LinkedIn',`<svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20"><path d="M6.9 9.2H3.6V20h3.3V9.2ZM5.2 4a1.9 1.9 0 1 0 0 3.8 1.9 1.9 0 0 0 0-3.8ZM20.4 13.9c0-3-1.6-4.9-4.3-4.9a3.7 3.7 0 0 0-3.3 1.8V9.2H9.6V20h3.3v-5.4c0-1.4.3-2.8 2-2.8s1.8 1.6 1.8 2.9V20h3.3v-6.1Z" fill="currentColor"/></svg>`],['https://x.com/TulumCryptoFest','X',`<svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18"><path d="M17.8 3h3.1l-6.8 7.8L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.3-8.3L2 3h6.4l4.4 5.8L17.8 3Zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5Z" fill="currentColor"/></svg>`],['https://chat.whatsapp.com/BhcaLxiYKFJ3BToTmXP9s4','WhatsApp community',`<svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20"><path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M9.1 8.2c.2-.4.4-.4.6-.4h.5c.2 0 .4 0 .5.4l.7 1.6c.1.2 0 .4-.1.6l-.5.6c-.1.1-.2.3 0 .5a6 6 0 0 0 2.8 2.4c.2.1.4.1.5-.1l.7-.8c.2-.2.3-.2.5-.1l1.6.8c.2.1.3.2.3.4 0 .5-.2 1.2-.8 1.6-.6.4-1.6.6-3.4-.2a9.4 9.4 0 0 1-4.3-4.3c-.7-1.5-.4-2.5 0-3Z" fill="currentColor"/></svg>`]];
const social=(cls)=>`<div class="${cls}">${SOCIAL.map(([u,l,i])=>`<a href="${u}" target="_blank" rel="noopener noreferrer" aria-label="${l}">${i}</a>`).join('')}</div>`;
const nav=(route)=>items.map(([url,en,es])=>`<a href="${url}"${url===route?' aria-current="page"':''}>${bi(en,es)}</a>`).join('');
const routes=[['blog/index.html','/blog'],['blog/tif-whale-tank-sin-filtros-mvs/index.html','/blog/tif-whale-tank-sin-filtros-mvs'],['index.html','/'],['home-v2/index.html','/'],['speakers/index.html','/speakers'],['program/index.html','/program'],['tickets/index.html','/tickets'],['whale-tank/index.html','/whale-tank'],['sponsorship/index.html','/sponsorship'],['press/index.html','/press'],['festival-2026/index.html','/festival-2026'],['alexis-soubran-tif-cmo/index.html','/alexis-soubran-tif-cmo'],['alexis-soubran-TIF-CMO/index.html','/alexis-soubran-tif-cmo'],['partners/minimalist-agency/index.html','/partners/minimalist-agency'],['el-faro/index.html','/el-faro'],['mezcal/index.html','/mezcal'],['leaderboard/index.html','/leaderboard'],['s/index.html','/s'],['schedule/index.html','/schedule'],['passes/index.html','/passes'],['passes/v2/index.html','/passes/v2'],['community/index.html','/community'],['networking/index.html','/networking'],['vende/index.html','/vende']];

export async function buildBrand(){
  await mkdir('dist/brand',{recursive:true});
  // Every blog post gets the shared header and footer, not only the first article.
  for(const e of await readdir('dist/blog',{withFileTypes:true}))if(e.isDirectory()&&!routes.some(([f])=>f===`blog/${e.name}/index.html`))routes.push([`blog/${e.name}/index.html`,`/blog/${e.name}`]);
  // Every participant profile (/speakers/<slug>) gets the shared header and footer too.
  for(const e of await readdir('dist/speakers',{withFileTypes:true}))if(e.isDirectory())routes.push([`speakers/${e.name}/index.html`,`/speakers/${e.name}`]);
  for(const file of ['styles.css','script.js'])await cp(`brand/${file}`,`dist/brand/${file}`);
  for(const [file,route] of routes){
    let html=await readFile(`dist/${file}`,'utf8');
    const original=html;
    const oldHeader=html.match(/<header\b[\s\S]*?<\/header>/)?.[0];
    assert.ok(oldHeader,`Missing header: ${file}`);
    const toggle=oldHeader.match(/<button\b[^>]*(?:data-v2-lang|data-lang-toggle|data-press-lang)[\s\S]*?<\/button>/)?.[0];
    const language=toggle?toggle.replace(/class="[^"]*"/,'class="tif-lang-switch"'):(['/speakers','/tickets','/program','/sponsorship','/partners/minimalist-agency','/el-faro','/mezcal','/leaderboard','/s','/schedule','/passes','/passes/v2','/community','/networking','/vende'].includes(route)||route.startsWith('/speakers/'))?'<button class="tif-lang-switch" type="button" data-tif-lang aria-label="Cambiar a español">EN / ES</button>':'';
    const localLinks=route==='/'?[]:[...oldHeader.matchAll(/<a\b[^>]*href="#([^"]+)"[^>]*>[\s\S]*?<\/a>/g)].map(m=>m[0]);
    const sections=localLinks.length?`<nav class="tif-section-nav" aria-label="Page sections">${localLinks.join('')}</nav>`:'';
    const whale=route==='/whale-tank';
    const whalePartner=whale?'<img class="tif-arkangeles" src="/assets/whale-tank-logos/arkangeles-blanco.webp" alt="Arkangeles" width="94" height="14" decoding="async">':'';
    const header=`<header class="tif-site-header${whale?' wt-brand-header':''}" data-header>
      <div class="wt-brand-lockup"><a class="tif-brand" href="/" aria-label="Tulum Innovation Fest home"><img src="/assets/tulum-innovation-fest-logo.png" alt="Tulum Innovation Fest" width="220" height="46"></a>${STARLINK}${whalePartner}</div>
      <button class="tif-menu-toggle" type="button" aria-controls="tif-navigation" aria-expanded="false" aria-label="Open navigation"><span></span><span></span><span></span></button>
      <nav class="tif-navigation" id="tif-navigation" aria-label="Main navigation">${nav(route)}${social('tif-social tif-social-nav')}${language}</nav>
      <a class="tif-schedule-button" href="/schedule"${route==='/schedule'?' aria-current="page"':''}><svg viewBox="0 0 24 24" aria-hidden="true" width="15" height="15"><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M3.5 10h17M8 3v4M16 3v4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg><span>${bi('Schedule','Horario')}</span></a>
      <a class="tif-ticket-button" href="/tickets">${bi('Get tickets','Boletos')}</a>
    </header>${sections}`;
    html=html.replace(oldHeader,header);
    const oldFooter=html.match(/<footer\b[\s\S]*?<\/footer>/)?.[0]||'';
    const contact=[...oldFooter.matchAll(/<a\b[^>]*href="mailto:[^"]+"[^>]*>[\s\S]*?<\/a>/g)].map(m=>m[0]).join('');
    const footer=`<footer class="tif-site-footer"><div class="tif-footer-inner"><div><a class="tif-brand" href="/" aria-label="Tulum Innovation Fest home"><img src="/assets/tulum-innovation-fest-logo.png" alt="Tulum Innovation Fest" width="220" height="46" loading="lazy"></a><p class="tif-footer-presented">Presented by <img src="/assets/partners/starlink/starlink-logo-white.webp" alt="Starlink" width="1015" height="124" loading="lazy"></p><p>${bi('Innovation, capital and culture meet in Tulum.','Innovación, capital y cultura se encuentran en Tulum.')}<br>${bi('December 9–12, 2026 · Tulum, Mexico','9–12 de diciembre de 2026 · Tulum, México')}</p>${contact}<div class="tif-footer-producer"><span>${bi('General producer','Productor general')}</span><a href="https://www.likegroup.io/" target="_blank" rel="noopener noreferrer"><img src="/assets/partners/lgm/lgm-white.webp" alt="" width="478" height="560" loading="lazy" decoding="async"><strong>Like Group! <small>Management</small></strong></a></div>${social('tif-social')}<div class="tif-footer-support"><span>${bi('With the institutional support of','Con el apoyo institucional de')}</span><img src="/assets/partners-sedetur.webp" alt="SEDETUR · Secretaría de Turismo de Quintana Roo" width="1200" height="353" loading="lazy" decoding="async"></div><div class="tif-footer-sponsors"><span>${bi('Sponsors','Patrocinadores')}</span><div><img src="/assets/partners-vinnie-g.webp" alt="Vinnie G Corp" width="900" height="702" loading="lazy" decoding="async"></div></div></div><nav aria-label="Footer navigation">${nav(route)}<a href="/#experience">${bi('Experience','Experiencia')}</a><a href="/tickets">${bi('Tickets','Boletos')}</a></nav></div><div class="tif-footer-made"><a href="/partners/minimalist-agency" aria-label="Made with love by Minimalist Agency">${bi('Made with','Hecho con')} <span class="tif-heart" aria-hidden="true">♥</span> ${bi('by','por')} <img src="/assets/partners-minimalist.webp" alt="Minimalist" width="900" height="107" loading="lazy" decoding="async"></a></div></footer>`;
    assert.ok(/<footer\b[\s\S]*?<\/footer>/.test(html),`Missing footer: ${file}`);
    html=html.replace(/<footer\b[\s\S]*?<\/footer>/,footer);
    const simple=['/speakers'].includes(route);
    html=html.replace(/<body([^>]*)>/,(_,attrs)=>attrs.includes('class=')?`<body${attrs.replace(/class="([^"]*)"/,`class="$1 tif-page${simple?' tif-directory':''}${route==='/'?' tif-home':''}"`)}>`:`<body${attrs} class="tif-page${simple?' tif-directory':''}${route==='/'?' tif-home':''}">`);
    html=html.replace('</head>',`<link rel="stylesheet" href="/brand/styles.css?v=${version}"><script defer src="/brand/script.js?v=${version}"></script></head>`);
    if(simple){
      const image=route==='/program'?'program-hero-desktop.webp':'panel-discussion-desktop.webp';
      html=html.replace(/(<section class="hero">)/,`$1<div class="tif-directory-hero-media" aria-hidden="true"><img src="/assets/tif-home-v2/${image}" alt="" fetchpriority="high"></div>`);
    }
    const scriptSources=s=>[...s.matchAll(/<script\b[^>]*src="([^"]+)"/g)].map(m=>m[1]).filter(x=>!x.startsWith('/brand/'));
    assert.deepEqual(scriptSources(html),scriptSources(original),`Preserve page behavior: ${file}`);
    assert.ok(html.includes('id="tif-navigation"')&&html.includes('/#participate'),`Missing shared navigation: ${file}`);
    await writeFile(`dist/${file}`,html);
  }
  console.log(`Brand: ${routes.length} page outputs share home typography, buttons, image treatment, navigation and footer.`);
}

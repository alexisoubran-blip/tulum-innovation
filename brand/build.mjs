import {readFile,writeFile,cp,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';

const version='20261008-consistent';
const bi=(en,es)=>`<span data-tif-en>${en}</span><span data-tif-es>${es}</span>`;
const items=[['/speakers','Speakers','Speakers'],['/program','Program','Programa'],['/whale-tank','Whale Tank','Whale Tank'],['/sponsorship','Partners','Partners'],['/#participate','Participate','Participar'],['/press','Press','Prensa']];
const nav=(route)=>items.map(([url,en,es])=>`<a href="${url}"${url===route?' aria-current="page"':''}>${bi(en,es)}</a>`).join('');
const routes=[['index.html','/'],['home-v2/index.html','/'],['speakers/index.html','/speakers'],['program/index.html','/program'],['whale-tank/index.html','/whale-tank'],['sponsorship/index.html','/sponsorship'],['press/index.html','/press'],['festival-2026/index.html','/festival-2026'],['alexis-soubran-tif-cmo/index.html','/alexis-soubran-tif-cmo'],['alexis-soubran-TIF-CMO/index.html','/alexis-soubran-tif-cmo']];

export async function buildBrand(){
  await mkdir('dist/brand',{recursive:true});
  for(const file of ['styles.css','script.js'])await cp(`brand/${file}`,`dist/brand/${file}`);
  for(const [file,route] of routes){
    let html=await readFile(`dist/${file}`,'utf8');
    const original=html;
    const oldHeader=html.match(/<header\b[\s\S]*?<\/header>/)?.[0];
    assert.ok(oldHeader,`Missing header: ${file}`);
    const toggle=oldHeader.match(/<button\b[^>]*(?:data-v2-lang|data-lang-toggle|data-press-lang)[\s\S]*?<\/button>/)?.[0];
    const language=toggle?toggle.replace(/class="[^"]*"/,'class="tif-lang-switch"'):'';
    const localLinks=route==='/'?[]:[...oldHeader.matchAll(/<a\b[^>]*href="#([^"]+)"[^>]*>[\s\S]*?<\/a>/g)].map(m=>m[0].replace(/\sdata-i18n(?:-html)?="[^"]*"/g,''));
    const sections=localLinks.length?`<nav class="tif-section-nav" aria-label="Page sections">${localLinks.join('')}</nav>`:'';
    const header=`<header class="tif-site-header" data-header>
      <a class="tif-brand" href="/" aria-label="Tulum Innovation Fest home"><img src="/assets/tulum-innovation-fest-logo.png" alt="Tulum Innovation Fest" width="220" height="46"></a>
      <button class="tif-menu-toggle" type="button" aria-controls="tif-navigation" aria-expanded="false" aria-label="Open navigation"><span></span><span></span><span></span></button>
      <nav class="tif-navigation" id="tif-navigation" aria-label="Main navigation">${nav(route)}${language}</nav>
      <a class="tif-ticket-button" href="/#tickets">${bi('Get tickets','Boletos')}</a>
    </header>${sections}`;
    html=html.replace(oldHeader,header);
    const oldFooter=html.match(/<footer\b[\s\S]*?<\/footer>/)?.[0]||'';
    const contact=[...oldFooter.matchAll(/<a\b[^>]*href="mailto:[^"]+"[^>]*>[\s\S]*?<\/a>/g)].map(m=>m[0]).join('');
    const footer=`<footer class="tif-site-footer"><div class="tif-footer-inner"><div><a class="tif-brand" href="/" aria-label="Tulum Innovation Fest home"><img src="/assets/tulum-innovation-fest-logo.png" alt="Tulum Innovation Fest" width="220" height="46" loading="lazy"></a><p>${bi('Innovation, capital and culture meet in Tulum.','Innovación, capital y cultura se encuentran en Tulum.')}<br>December 9–12, 2026 · Tulum, Mexico</p>${contact}</div><nav aria-label="Footer navigation">${nav(route)}<a href="/#experience">${bi('Experience','Experiencia')}</a><a href="/#tickets">${bi('Tickets','Boletos')}</a></nav></div></footer>`;
    assert.ok(/<footer\b[\s\S]*?<\/footer>/.test(html),`Missing footer: ${file}`);
    html=html.replace(/<footer\b[\s\S]*?<\/footer>/,footer);
    const simple=['/speakers','/program'].includes(route);
    html=html.replace(/<body([^>]*)>/,(_,attrs)=>attrs.includes('class=')?`<body${attrs.replace(/class="([^"]*)"/,`class="$1 tif-page${simple?' tif-directory':''}${route==='/'?' tif-home':''}"`)}>`:`<body${attrs} class="tif-page${simple?' tif-directory':''}${route==='/'?' tif-home':''}">`);
    html=html.replace('</head>',`<link rel="stylesheet" href="/brand/styles.css?v=${version}"><script defer src="/brand/script.js?v=${version}"></script></head>`);
    if(simple){
      const image=route==='/program'?'program-hero-desktop.webp':'panel-discussion-desktop.webp';
      html=html.replace(/(<section class="hero">)/,`$1<div class="tif-directory-hero-media" aria-hidden="true"><img src="/assets/tif-home-v2/${image}" alt="" fetchpriority="high"></div>`);
    }
    if(route==='/whale-tank')html=html.replace('<main id="main">','<main id="main"><div class="tif-program-credit"><span>Whale Tank ·</span><img src="/assets/whale-tank-logos/arkangeles-blanco.webp" alt="Arkangeles" width="120" height="18"></div>');
    const scriptSources=s=>[...s.matchAll(/<script\b[^>]*src="([^"]+)"/g)].map(m=>m[1]).filter(x=>!x.startsWith('/brand/'));
    assert.deepEqual(scriptSources(html),scriptSources(original),`Preserve page behavior: ${file}`);
    assert.ok(html.includes('id="tif-navigation"')&&html.includes('/#participate'),`Missing shared navigation: ${file}`);
    await writeFile(`dist/${file}`,html);
  }
  console.log(`Brand: ${routes.length} page outputs share home typography, buttons, image treatment, navigation and footer.`);
}

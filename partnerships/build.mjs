import {readFile,writeFile,mkdir,cp} from 'node:fs/promises';
import assert from 'node:assert/strict';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const bi=(en,es)=>`<span data-tif-en>${esc(en)}</span><span data-tif-es>${esc(es)}</span>`;
const pair=v=>bi(v.en,v.es);
const cta='https://form.typeform.com/to/xsElsRkS';
export async function buildPartnerships(){
 const data=JSON.parse(await readFile('partnerships/data.json','utf8'));
 assert.deepEqual(data.tiers.map(t=>t.price),[2500,5000,10000,15000,30000,null]);
 assert.equal(data.rows.length,11);assert.equal(data.tiers.length,6);
 for(const t of data.tiers){assert.equal(t.benefits.length,11);assert.ok(/^#[0-9a-f]{6}$/i.test(t.accent));for(const b of t.benefits)assert.ok(b.en&&b.es);}
 const fact=(t,i)=>`<li><span class="part-label">${pair(data.rows[i].label)}</span><span class="part-value">${pair(t.benefits[i])}</span></li>`;
 const cards=data.tiers.map((t,index)=>`<article class="part-card" data-partner-tier="${t.id}" style="--part-accent:${t.accent}"><div class="part-card-heading"><p class="part-level">${String(index+1).padStart(2,'0')} / TIF 2026</p><h3>${esc(t.name)}</h3><p class="part-tagline">${pair(t.summary)}</p><p class="part-price">${t.price?`US$${t.price.toLocaleString('en-US')}`:bi('Custom','A medida')}</p><p class="part-tax">${bi('USD + VAT','USD + IVA')}</p></div><div class="part-card-benefits"><p class="part-includes">${bi('Your partnership','Tu partnership')}</p><ul>${[0,1,2,4].map(i=>fact(t,i)).join('')}</ul><details class="part-more"><summary>${bi('See all benefits','Ver todos los beneficios')}</summary><ul>${[3,5,6,7,8,9,10].map(i=>fact(t,i)).join('')}</ul></details></div><a class="part-cta" data-package="${esc(t.name)}" href="${cta}" target="_blank" rel="noopener noreferrer" aria-label="Request ${esc(t.name)} proposal">${bi('Request proposal','Solicitar propuesta')} <span aria-hidden="true">↗</span></a></article>`).join('');
 const terms=`<p class="part-terms">${bi('All investments are in USD + VAT. VIP / Executive passes exclude accommodation. Hotel packages are available only as the separately negotiated add-ons indicated in each tier.','Todas las inversiones son en USD + IVA. Los pases VIP / Executive excluyen hospedaje. Los paquetes de hotel se ofrecen únicamente como los complementos negociados por separado indicados en cada nivel.')}</p>`;
 const comparison=`<details class="part-comparison" id="partnership-comparison"><summary>${bi('Compare all six tiers','Comparar los seis niveles')}</summary><p class="part-scroll-hint">${bi('Scroll horizontally to compare every tier.','Desliza horizontalmente para comparar todos los niveles.')}</p><div class="part-table-scroll" role="region" tabindex="0" aria-label="Partnership benefits comparison"><table><caption>${bi('Strategic partnership tiers · USD + VAT','Niveles de partnership estratégico · USD + IVA')}</caption><thead><tr><th scope="col">${bi('Benefit','Beneficio')}</th>${data.tiers.map(t=>`<th scope="col">${esc(t.name)}</th>`).join('')}</tr></thead><tbody><tr><th scope="row">${bi('Investment','Inversión')}</th>${data.tiers.map(t=>`<td>${t.price?`US$${t.price.toLocaleString('en-US')}`:bi('Custom','A medida')} + ${bi('VAT','IVA')}</td>`).join('')}</tr>${data.rows.map((r,i)=>`<tr><th scope="row">${pair(r.label)}</th>${data.tiers.map(t=>`<td>${pair(t.benefits[i])}</td>`).join('')}</tr>`).join('')}</tbody></table></div></details>`;
 const section=home=>`<section class="part-section" id="${home?'partners':'packages'}" aria-labelledby="${home?'partners-title':'packages-title'}"><div class="part-wrap"><div class="part-head"><div><p class="part-kicker">${bi('Partner with TIF','Partner con TIF')}</p><h2 id="${home?'partners-title':'packages-title'}">${bi('Choose your partnership','Elige tu partnership')}</h2></div><p>${bi('Six ways to bring your brand into the festival. Choose the scope, access and experience that fit your objectives.','Seis formas de integrar tu marca al festival. Elige el alcance, los accesos y la experiencia que corresponden a tus objetivos.')}</p></div>${terms}<div class="part-grid">${cards}</div>${home?`<a class="part-comparison-link" href="/sponsorship#partnership-comparison">${bi('Compare every benefit and explore partnerships','Compara todos los beneficios y explora partnerships')} →</a>`:comparison}</div></section>`;
 for(const [file,home] of [['dist/index.html',true],['dist/sponsorship/index.html',false]]){
  let html=await readFile(file,'utf8');
  const pattern=home?/<section class="v2-partners v2-section"[\s\S]*?<\/section>/:/<section class="section packages"[\s\S]*?<\/section>/;
  assert.ok(pattern.test(html),`Missing partnership anchor ${file}`);
  html=html.replace(pattern,section(home)).replace('</head>','<link rel="stylesheet" href="/partnerships/styles.css?v=20261009-tiers"></head>');
  assert.equal((html.match(/data-partner-tier=/g)||[]).length,6);
  assert.ok(!/Core Partner|Alpha Partner|Main Title Partner|Executive Passes with stay/.test(html));
  await writeFile(file,html);
 }
 await mkdir('dist/partnerships',{recursive:true});await cp('partnerships/styles.css','dist/partnerships/styles.css');
 console.log('Partnerships: six approved tiers on home and sponsorship; USD + VAT and accommodation exclusions verified.');
}

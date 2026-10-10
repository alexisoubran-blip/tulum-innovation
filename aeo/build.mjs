import {readFile,writeFile,mkdir,cp,readdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
const origin='https://www.tuluminnovationfest.com';
const date='2026-10-09';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const json=s=>JSON.stringify(s).replace(/</g,'\\u003c');
const bi=(en,es)=>`<span data-en>${esc(en)}</span><span data-es>${esc(es)}</span>`;
const author={'@type':'Person','@id':`${origin}/alexis-soubran-tif-cmo#alexis`,name:'Alexis Soubran',url:`${origin}/alexis-soubran-tif-cmo`,jobTitle:'CMO, Tulum Innovation Fest; CEO, Minimalist Agency',sameAs:['https://alexisoubran.com/']};
const org={'@type':'Organization','@id':`${origin}/#organization`,name:'Tulum Innovation Fest',url:origin+'/',logo:origin+'/assets/tulum-innovation-fest-logo.png'};
const place={'@type':'Place',name:'IKAL Arena',address:{'@type':'PostalAddress',addressLocality:'Tulum',addressRegion:'Quintana Roo',addressCountry:'MX'}};
const faqs=[
 ['What is Tulum Innovation Fest?','Tulum Innovation Fest is a four-day gathering connecting founders, investors, technology leaders and creators through talks, workshops, networking, culture and shared experiences.','¿Qué es Tulum Innovation Fest?','Tulum Innovation Fest es un encuentro de cuatro días que conecta a founders, inversionistas, líderes de tecnología y creadores mediante charlas, workshops, networking, cultura y experiencias compartidas.'],
 ['When and where is TIF 2026?','TIF 2026 takes place from December 9 to 12, 2026 at IKAL Arena in Tulum, Quintana Roo, Mexico.','¿Cuándo y dónde se realiza TIF 2026?','TIF 2026 se realizará del 9 al 12 de diciembre de 2026 en IKAL Arena, Tulum, Quintana Roo, México.'],
 ['Who is TIF for?','TIF welcomes founders, investors, technology and business professionals, creators and brands interested in innovation, capital and collaboration.','¿A quién está dirigido TIF?','TIF está dirigido a founders, inversionistas, profesionales de tecnología y negocios, creadores y marcas interesados en innovación, capital y colaboración.'],
 ['What is Whale Tank?','Whale Tank is the startup program linked to TIF, combining investment readiness, mentorship, pitch preparation and investor matchmaking. Participation does not guarantee investment.','¿Qué es Whale Tank?','Whale Tank es el programa para startups vinculado a TIF que combina preparación para inversión, mentoría, preparación de pitch y encuentros con inversionistas. Participar no garantiza recibir inversión.'],
 ['Where can I see the speakers and program?','The Speakers page lists the public 2026 lineup with roles and companies. The Program page outlines the four festival days. Session times and locations will be shared closer to the event.','¿Dónde puedo consultar speakers y programa?','La página Speakers presenta el lineup público 2026 con roles y empresas. La página Programa resume los cuatro días del festival. Los horarios y las ubicaciones de las sesiones se compartirán más cerca del evento.'],
 ['How can I attend or participate?','Buy passes through the official ticket link on this website. Startups can consult Whale Tank; brands can explore sponsorships. Check the conditions of each pass and application before registering.','¿Cómo puedo asistir o participar?','Compra pases en el enlace oficial de boletos de este sitio. Las startups pueden consultar Whale Tank y las marcas pueden explorar patrocinios. Revisa las condiciones de cada pase y convocatoria antes de registrarte.']
];
const faqSchema={'@context':'https://schema.org','@type':'FAQPage','@id':origin+'/#faq',inLanguage:'en',mainEntity:faqs.map(([q,a])=>({'@type':'Question',name:q,acceptedAnswer:{'@type':'Answer',text:a}}))};
const gtm=(await readFile('home-v2/index.html','utf8')).match(/<!-- Google Tag Manager -->[\s\S]*?<!-- End Google Tag Manager -->/)?.[0]||'';
const article=JSON.parse(await readFile('aeo/article.json','utf8'));
const path='/blog/'+article.slug;
// Additional posts: one JSON file per article in aeo/posts (newest first on /blog).
const md=s=>esc(s).replace(/\[([^\]]+)\]\(([^)]+)\)/g,(_,t,u)=>`<a href="${u}"${/^https?:/.test(u)?' target="_blank" rel="noopener noreferrer"':''}>${t}</a>`);
const posts=[];
for(const f of (await readdir('aeo/posts')).filter(f=>f.endsWith('.json')).sort())posts.push(JSON.parse(await readFile('aeo/posts/'+f,'utf8')));
posts.sort((a,b)=>b.published.localeCompare(a.published));
const postPath=p=>'/blog/'+p.slug;
function renderPost(p){
 const route=postPath(p);
 const people=p.people?.length?`<section class="aeo-people" aria-label="Inversionistas de Whale Tank en la lista">${p.people.map(x=>`<article><img src="${x.photo}" alt="${esc(x.name)}" width="480" height="600" loading="lazy"><div><h3>${esc(x.name)}</h3><p class="aeo-people-list"><span>En la lista</span>${esc(x.listing)}</p><p class="aeo-people-tif"><span>En TIF</span>${esc(x.tif)}</p>${x.linkedin?`<a href="${x.linkedin}" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>`:''}</div></article>`).join('')}</section>`:'';
 const body=p.sections.map(x=>`<section><h2>${esc(x.heading)}</h2>${x.paragraphs.map(t=>`<p>${md(t)}</p>`).join('')}</section>`).join('');
 const source=p.source?`<p class="aeo-source">Fuente: <a href="${p.source.url}" target="_blank" rel="noopener noreferrer">${esc(p.source.label)}</a></p>`:'';
 const byline=`<p class="aeo-byline">Por <a href="/alexis-soubran-tif-cmo" rel="author">Alexis Soubran</a> · Publicado el <time datetime="${p.published}">${esc(p.publishedLabel)}</time></p>`;
 const content=`<div class="aeo-wrap"><div class="aeo-article-header"><p class="aeo-kicker"><a href="/blog">Blog TIF</a> / ${esc(p.category)}</p><h1>${esc(p.title)}</h1><p class="aeo-lead">${esc(p.description)}</p>${byline}</div>${p.hero.inArticle===false?'':`<figure class="aeo-photo"><img src="${p.hero.src}" alt="${esc(p.hero.alt)}" width="${p.hero.width}" height="${p.hero.height}" fetchpriority="high"><figcaption>${esc(p.hero.caption)}</figcaption></figure>`}</div><article class="aeo-copy">${(p.intro||[]).map(t=>`<p>${md(t)}</p>`).join('')}${people}${body}${source}<nav class="aeo-links" aria-label="Información oficial"><a href="/whale-tank">Convocatoria Whale Tank</a><a href="/speakers">Speakers 2026</a><a href="/program">Programa</a><a href="/sponsorship">Patrocinios</a><a href="/tickets">Boletos</a></nav><aside class="aeo-author"><h2>Sobre el autor</h2><p>Alexis Soubran es CMO de Tulum Innovation Fest y CEO de Minimalist Agency. Trabaja en estrategia de marca, crecimiento y revenue para empresas en México y Latinoamérica.</p><a href="/alexis-soubran-tif-cmo" rel="author">Ver perfil de Alexis Soubran</a></aside></article>`;
 const schema={'@context':'https://schema.org','@graph':[org,author,{'@type':'BlogPosting','@id':origin+route+'#article',headline:p.title,description:p.description,datePublished:p.published,dateModified:p.published,inLanguage:'es-MX',author:{'@id':author['@id']},publisher:{'@id':org['@id']},image:[origin+p.hero.src],mainEntityOfPage:{'@id':origin+route+'#webpage'},citation:p.source?.url,about:[{'@id':origin+'/#event-2026'},{'@type':'Thing',name:'Whale Tank'}],mentions:(p.people||[]).map(x=>({'@type':'Person',name:x.name,sameAs:x.linkedin}))}]};
 return shell(p.title,p.description,route,content,schema,p.hero.og||p.hero.src).replace('</head>',`<meta name="author" content="Alexis Soubran"><meta property="article:published_time" content="${p.published}"><meta property="article:modified_time" content="${p.published}"></head>`);
}
const articleBody=article.sections.map(s=>`<section><h2>${esc(s.heading)}</h2>${s.paragraphs.map(p=>`<p>${esc(p)}</p>`).join('')}</section>`).join('');
const articleSchema={'@context':'https://schema.org','@graph':[org,author,{'@type':'BlogPosting','@id':origin+path+'#article',headline:article.title,description:article.description,datePublished:article.published,dateModified:article.published,inLanguage:'es-MX',author:{'@id':author['@id']},publisher:{'@id':org['@id']},image:[origin+'/assets/editorial/mvs-sin-filtros-estudio.webp',origin+'/assets/editorial/alexis-soubran-ron-oliver-mvs.webp'],mainEntityOfPage:{'@id':origin+path+'#webpage'},about:[{'@id':origin+'/#event-2026'},{'@type':'Thing',name:'Whale Tank'}]}]};
const shell=(title,description,route,content,schema,image='/assets/editorial/mvs-sin-filtros-estudio.webp')=>`<!doctype html><html lang="es-MX" data-lang="es"><head>${gtm}<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} | TIF</title><meta name="description" content="${esc(description)}"><meta name="robots" content="index,follow,max-image-preview:large"><meta name="theme-color" content="#00080b"><link rel="canonical" href="${origin+route}"><meta property="og:type" content="${route.startsWith('/blog/')?'article':'website'}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${origin+route}"><meta property="og:image" content="${origin}${image}"><meta property="og:locale" content="es_MX"><link rel="stylesheet" href="/aeo/styles.css?v=20261009"><script type="application/ld+json">${json(schema)}</script></head><body class="aeo-editorial"><a class="skip-link" href="#main">Ir al contenido</a><header><a href="/">Tulum Innovation Fest</a></header><main id="main">${content}</main><footer><a href="/">Tulum Innovation Fest</a></footer></body></html>`;
export async function buildEditorial(){
 await mkdir('dist/blog/'+article.slug,{recursive:true});await mkdir('dist/aeo',{recursive:true});await cp('aeo/styles.css','dist/aeo/styles.css');
 const byline=`<p class="aeo-byline">Por <a href="/alexis-soubran-tif-cmo" rel="author">Alexis Soubran</a> · Publicado y actualizado el <time datetime="${date}">9 de octubre de 2026</time></p>`;
 const content=`<div class="aeo-wrap"><div class="aeo-article-header"><p class="aeo-kicker"><a href="/blog">Blog TIF</a> / Innovación y emprendimiento</p><h1>${esc(article.title)}</h1><p class="aeo-lead">${esc(article.description)}</p>${byline}</div><figure class="aeo-photo"><img src="/assets/editorial/mvs-sin-filtros-estudio.webp" alt="Participación de Alexis Soubran en el estudio de MVS" width="1280" height="960" fetchpriority="high"><figcaption>En el estudio de MVS durante la participación en Sin Filtros. Foto del archivo de Alexis Soubran.</figcaption></figure></div><article class="aeo-copy">${articleBody}<figure class="aeo-photo"><img src="/assets/editorial/alexis-soubran-ron-oliver-mvs.webp" alt="Alexis Soubran y Ron Oliver frente al logo de MVS Radio" width="1280" height="960" loading="lazy"><figcaption>Alexis Soubran y Ron Oliver en MVS. Foto del archivo de Alexis Soubran.</figcaption></figure><nav class="aeo-links" aria-label="Información oficial"><a href="/whale-tank">Convocatoria Whale Tank</a><a href="/speakers">Speakers 2026</a><a href="/program">Programa</a><a href="/sponsorship">Patrocinios</a><a href="/#tickets">Boletos</a></nav><aside class="aeo-author"><h2>Sobre el autor</h2><p>Alexis Soubran es CMO de Tulum Innovation Fest y CEO de Minimalist Agency. Trabaja en estrategia de marca, crecimiento y revenue para empresas en México y Latinoamérica.</p><a href="/alexis-soubran-tif-cmo" rel="author">Ver perfil de Alexis Soubran</a></aside></article>`;
 await writeFile('dist'+path+'/index.html',shell(article.title,article.description,path,content,articleSchema).replace('</head>',`<meta name="author" content="Alexis Soubran"><meta property="article:published_time" content="${date}"><meta property="article:modified_time" content="${date}"></head>`));
 for(const p of posts){await mkdir('dist'+postPath(p),{recursive:true});await writeFile('dist'+postPath(p)+'/index.html',renderPost(p));}
 const postCards=posts.map(p=>`<article class="aeo-index-card"><p class="aeo-kicker">${esc(p.publishedLabel)} · Alexis Soubran</p><h2><a href="${postPath(p)}">${esc(p.title)}</a></h2><p class="aeo-lead">${esc(p.description)}</p><a href="${postPath(p)}">Leer artículo →</a></article>`).join('');
 await writeFile('dist/blog/index.html',shell('Blog de Tulum Innovation Fest','Perspectivas de Alexis Soubran sobre TIF, emprendimiento e inversión.','/blog',`<div class="aeo-wrap"><div class="aeo-article-header"><p class="aeo-kicker">Tulum Innovation Fest</p><h1>Innovación y emprendimiento</h1><p class="aeo-lead">Notas y perspectivas sobre el festival, founders e inversión.</p></div>${postCards}<article class="aeo-index-card"><p class="aeo-kicker">9 de octubre de 2026 · Alexis Soubran</p><h2><a href="${path}">${esc(article.title)}</a></h2><p class="aeo-lead">${esc(article.description)}</p><a href="${path}">Leer artículo →</a></article></div>`,{'@context':'https://schema.org','@type':'Blog',name:'Blog de Tulum Innovation Fest',url:origin+'/blog',publisher:org}));
}
function textFromHTML(s){return s.replace(/<script\b[\s\S]*?<\/script>/gi,'').replace(/<style\b[\s\S]*?<\/style>/gi,'').replace(/<!--[^]*?-->/g,'').replace(/<span\b[^>]*\bdata-(?:tif-)?es\b[^>]*>[^]*?<\/span>/g,'').replace(/<[^>]+\b(?:hidden|aria-hidden="true")[^>]*>[^]*?<\/(?:span|div|figure)>/g,'').replace(/<img\b[^>]*alt="([^"]+)"[^>]*>/gi,(_,alt)=>` ${alt} `).replace(/<h([1-6])\b[^>]*>/gi,(_,n)=>'\n\n'+'#'.repeat(Number(n))+' ').replace(/<a\b[^>]*href="([^"]+)"[^>]*>([^]*?)<\/a>/g,(_,u,t)=>`[${t.replace(/<[^>]+>/g,'')}](${u.startsWith('/')?origin+u:u})`).replace(/<\/(?:p|h[1-6]|div|section|article|li|summary|figcaption)>|<br\s*\/?>/gi,'\n\n').replace(/<[^>]+>/g,'').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&nbsp;/g,' ').replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/[ \t]+/g,' ').replace(/(#{1,6})[ \n]+/g,'$1 ').replace(/\n\s*\n(?:\s*\n)+/g,'\n\n').trim();}
export async function buildAEO(){
 let home=await readFile('dist/index.html','utf8');
 const faq=`<section class="aeo-section" id="faq" aria-labelledby="aeo-faq-title"><div class="aeo-wrap"><p class="aeo-kicker">${bi('Plan your visit','Planea tu visita')}</p><h2 id="aeo-faq-title">${bi('TIF 2026: your questions answered','TIF 2026: preguntas frecuentes')}</h2><div class="aeo-faq">${faqs.map(([q,a,qs,as])=>`<details><summary>${bi(q,qs)}</summary><p>${bi(a,as)}</p></details>`).join('')}</div><nav class="aeo-links" aria-label="Festival information"><a href="/speakers">Speakers</a><a href="/program">${bi('Program','Programa')}</a><a href="/whale-tank">Whale Tank</a><a href="/sponsorship">${bi('Sponsorships','Patrocinios')}</a></nav><p class="aeo-review">${bi('Festival information updated October 9, 2026.','Información del festival actualizada el 9 de octubre de 2026.')}</p></div></section>`;
 const latest=posts[0];
 const teaser=latest?`<section class="aeo-section" aria-labelledby="aeo-blog-title"><div class="aeo-wrap aeo-editorial-card"><a href="${postPath(latest)}"><img src="${latest.hero.src}" alt="${esc(latest.hero.alt)}" width="${latest.hero.width}" height="${latest.hero.height}" loading="lazy"></a><div><p class="aeo-kicker">Blog / ${esc(latest.category)}</p><h2 id="aeo-blog-title">${bi(latest.teaser.titleEn,latest.teaser.titleEs)}</h2><p>${bi(latest.teaser.en,latest.teaser.es)}</p><a class="btn btn-ghost" href="${postPath(latest)}">${bi('Read the article','Leer artículo')}</a> <a class="aeo-more" href="/blog">${bi('All articles →','Todos los artículos →')}</a></div></div></section>`:`<section class="aeo-section" aria-labelledby="aeo-blog-title"><div class="aeo-wrap aeo-editorial-card"><a href="${path}"><img src="/assets/editorial/mvs-sin-filtros-estudio.webp" alt="Alexis Soubran at the MVS studio" width="1280" height="960" loading="lazy"></a><div><p class="aeo-kicker">Blog / Alexis Soubran</p><h2 id="aeo-blog-title">${bi('TIF and Whale Tank at MVS','TIF y Whale Tank en MVS')}</h2><p>${bi('Alexis Soubran shares his perspective following his participation with Ron Oliver in Sin Filtros. Article in Spanish.','Alexis Soubran comparte su perspectiva tras participar con Ron Oliver en Sin Filtros.')}</p><a class="btn btn-ghost" href="${path}">${bi('Read the article','Leer artículo')}</a></div></div></section>`;
 home=home.replace('<section class="v2-tickets',faq+teaser+'<section class="v2-tickets').replace('</head>',`<link rel="stylesheet" href="/aeo/styles.css?v=20261009"><script type="application/ld+json">${json(faqSchema)}</script></head>`);
 assert.ok(home.includes('id="aeo-faq-title"'));await writeFile('dist/index.html',home);
 const pages=[];
 async function walk(dir){for(const e of await readdir(dir,{withFileTypes:true})){const p=dir+'/'+e.name;if(e.isDirectory())await walk(p);else if(e.name.endsWith('.html'))pages.push(p);}}
 await walk('dist');await mkdir('dist/markdown',{recursive:true});
 const publicRoutes=[];
 for(const file of pages){
  if(file.includes('/health/'))continue;
  let html=await readFile(file,'utf8');
  const route=file==='dist/index.html'?'/':'/'+file.slice(5).replace(/\/index\.html$/,'');
  const canonical=html.match(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/)?.[1]||origin+route;
  const title=html.match(/<title>([^]*?)<\/title>/)?.[1]||'Tulum Innovation Fest';
  const description=html.match(/<meta\b[^>]*name="description"[^>]*content="([^"]*)"/)?.[1]||'Tulum Innovation Fest 2026: December 9–12, IKAL Arena, Tulum, Mexico.';
  const md='/markdown/'+(route==='/'?'index':route.slice(1).replaceAll('/','-'))+'.md';
  const main=html.match(/<main\b[^>]*>([^]*?)<\/main>/)?.[1]||'';
  await writeFile('dist'+md,`# ${textFromHTML(title)}\n\nSource: ${canonical}\n\nUpdated: ${date}\n\n${textFromHTML(main)}\n`);
  html=html.replace(/<script type="application\/ld\+json">([^]*?)<\/script>/g,(whole,content)=>{
   const data=JSON.parse(content);
   function normalize(obj){if(!obj||typeof obj!=='object')return;if(obj['@type']==='Event'&&obj.name==='Tulum Innovation Fest 2026'){obj['@id']=origin+'/#event-2026';obj.location=place;obj.organizer=org;}
    if(obj['@type']==='Organization'&&obj.name==='Tulum Innovation Fest')Object.assign(obj,org);
    for(const value of Object.values(obj)){if(Array.isArray(value))value.forEach(normalize);else if(value&&typeof value==='object')normalize(value);}}
   normalize(data);return `<script type="application/ld+json">${json(data)}</script>`;
  });
  const image=html.match(/<meta\b[^>]*property="og:image"[^>]*content="([^"]+)"/)?.[1]||origin+'/assets/tulum-innovation-fest-logo.png';
  let tags=`<link rel="alternate" type="text/markdown" href="${md}" title="Markdown version"><meta name="date" content="${date}">`;
  for(const [name,value] of [['twitter:card','summary_large_image'],['twitter:title',textFromHTML(title)],['twitter:description',textFromHTML(description)],['twitter:image',image]])if(!html.includes(`name="${name}"`))tags+=`<meta name="${name}" content="${esc(value)}">`;
  tags+=`<script type="application/ld+json">${json({'@context':'https://schema.org','@graph':[org,{'@type':'WebPage','@id':canonical+'#webpage',url:canonical,name:textFromHTML(title),description:textFromHTML(description),dateModified:date,isPartOf:{'@id':origin+'/#website'},publisher:{'@id':org['@id']},...(route==='/'?{mainEntity:{'@id':origin+'/#event-2026'}}:{})},{'@type':'WebSite','@id':origin+'/#website',url:origin+'/',name:'Tulum Innovation Fest',publisher:{'@id':org['@id']}}]})}</script>`;
  html=html.replace('</head>',tags+'</head>');
  // Text alternatives for remaining meaningful image sources; decorative media stays empty.
  html=html.replace(/<img\b[^>]*>/gi,tag=>{if(/\balt\s*=/.test(tag))return tag;const src=tag.match(/\bsrc="([^"]+)"/)?.[1]||'';const name=src.split('/').at(-1).replace(/\.[^.]+$/,'').replace(/[-_]+/g,' ');return tag.replace(/\s*\/?>(?=$)/,` alt="${esc(name)}">`);});
  await writeFile(file,html);if(!file.includes('/home-v2/')&&!file.includes('/alexis-soubran-TIF-CMO/'))publicRoutes.push([route,md]);
 }
 const llms=`# Tulum Innovation Fest\n\n> Official information for TIF 2026: December 9–12, 2026 at IKAL Arena in Tulum, Quintana Roo, Mexico. The festival connects founders, investors, technology leaders and creators through talks, workshops, networking and culture.\n\n## Official pages\n${publicRoutes.map(([r,md])=>`- [${r==='/'?'Festival overview':r.slice(1)}](${origin+r}): [Markdown](${origin+md})`).join('\n')}\n\n## Important context\n- The 2026 public lineup is listed on /speakers. Voices from previous editions do not imply 2026 participation.\n- Whale Tank participation and pitches do not guarantee investment. Check the official application page for current requirements.\n- Pass prices and access conditions are confirmed by the official ticket provider linked from the site.\n- The MVS blog article is an author perspective by Alexis Soubran, not an interview transcript.\n- Last content update: ${date}.\n`;
 await writeFile('dist/markdown/index.md',`# Tulum Innovation Fest 2026

Official source: ${origin}/

Updated: ${date}

TIF 2026 takes place December 9–12, 2026 at IKAL Arena, Tulum, Quintana Roo, Mexico.

${faqs.map(([q,a])=>`## ${q}\n\n${a}`).join('\n\n')}

## Official links

${publicRoutes.map(([r])=>`- [${r==='/'?'Festival overview':r.slice(1)}](${origin+r})`).join('\n')}

## Latest article

[${article.title}](${origin+path}) by Alexis Soubran, published ${date}. Article in Spanish.
`);
 await writeFile('dist/llms.txt',llms);
 let sitemap=await readFile('dist/sitemap.xml','utf8');sitemap=sitemap.replace(/<lastmod>[^<]+<\/lastmod>/g,`<lastmod>${date}</lastmod>`);
 for(const r of ['/blog',path,...posts.map(postPath),'/festival-2026','/tickets'])if(!sitemap.includes(`<loc>${origin+r}</loc>`))sitemap=sitemap.replace('</urlset>',`  <url><loc>${origin+r}</loc><lastmod>${date}</lastmod></url>\n</urlset>`);
 await writeFile('dist/sitemap.xml',sitemap);
 console.log(`AEO: visible FAQs, author blog, linked schemas, Twitter cards, llms.txt and Markdown for ${publicRoutes.length} public pages.`);
}

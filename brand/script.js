(() => {
  const toggle = document.querySelector('[data-tif-lang]');
  if (!toggle) return;
  const root = document.documentElement;
  const valid = value => value === 'en' || value === 'es';
  const requested = new URLSearchParams(location.search).get('lang');
  let saved;
  try { saved = localStorage.getItem('tif-language'); } catch (_) {}
  const browser = navigator.languages?.[0] || navigator.language || 'en';
  const initial = valid(requested) ? requested : valid(saved) ? saved : browser.toLowerCase().startsWith('es') ? 'es' : 'en';
  function apply(language, persist = false) {
    root.dataset.lang = language;
    root.lang = language;
    for (const [key, attribute] of [['placeholder','placeholder'], ['label','aria-label'], ['content','content']]) {
      document.querySelectorAll(`[data-tif-${key}-en][data-tif-${key}-es]`).forEach(element => {
        element.setAttribute(attribute, element.getAttribute(`data-tif-${key}-${language}`));
      });
    }
    const title = document.querySelector('title[data-tif-title-en][data-tif-title-es]');
    if (title) document.title = title.getAttribute(`data-tif-title-${language}`);
    toggle.textContent = language === 'es' ? 'ES / EN' : 'EN / ES';
    toggle.setAttribute('aria-label', language === 'es' ? 'Switch to English' : 'Cambiar a español');
    if (persist) { try { localStorage.setItem('tif-language', language); } catch (_) {} }
  }
  apply(initial);
  toggle.addEventListener('click', () => apply(root.dataset.lang === 'es' ? 'en' : 'es', true));
})();

(() => {
  const header=document.querySelector('.tif-site-header');
  const button=header?.querySelector('.tif-menu-toggle');
  const nav=header?.querySelector('.tif-navigation');
  if(!header||!button||!nav)return;
  const media=matchMedia('(max-width: 1280px)');
  const close=()=>{document.body.classList.remove('tif-menu-open');button.setAttribute('aria-expanded','false');nav.inert=media.matches;};
  const sync=()=>{close();};
  button.addEventListener('click',()=>{
    const open=document.body.classList.toggle('tif-menu-open');
    button.setAttribute('aria-expanded',String(open));nav.inert=!open;
    if(open)nav.querySelector('a')?.focus();
  });
  nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',close));
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&document.body.classList.contains('tif-menu-open')){close();button.focus();}
    if(e.key==='Tab'&&document.body.classList.contains('tif-menu-open')){
      const focusable=[button,...nav.querySelectorAll('a,button')];
      if(e.shiftKey&&document.activeElement===focusable[0]){e.preventDefault();focusable.at(-1).focus();}
      else if(!e.shiftKey&&document.activeElement===focusable.at(-1)){e.preventDefault();button.focus();}
    }
  });
  media.addEventListener('change',sync);sync();
})();

// Headline fit: words never split across lines. If a heading's longest word is wider than its
// box (big display type on narrow screens), shrink that heading just enough to fit.
(()=>{
  const SEL='h1,h2,h3,.cx-num';
  const range=document.createRange();
  const widest=h=>{let max=0;const w=document.createTreeWalker(h,NodeFilter.SHOW_TEXT);let t;
    while((t=w.nextNode())){const p=t.parentElement;if(!p||!p.offsetParent)continue;const parts=t.textContent.split(/(\s+|-)/);let off=0;
      for(const part of parts){if(part.trim()&&part!=='-'){range.setStart(t,off);range.setEnd(t,off+part.length);for(const r of range.getClientRects())max=Math.max(max,r.width);}off+=part.length;}}
    return max;};
  const fit=()=>{document.querySelectorAll(SEL).forEach(h=>{
    if(h.dataset.fitBase){h.style.fontSize='';}
    if(!h.offsetParent)return;
    const cs=getComputedStyle(h);const avail=h.clientWidth-parseFloat(cs.paddingLeft)-parseFloat(cs.paddingRight);if(avail<=0)return;
    const need=widest(h);if(need<=avail+1)return;
    const base=parseFloat(cs.fontSize);h.dataset.fitBase='1';
    h.style.fontSize=`${Math.max(base*.5,Math.floor(base*avail/need*.98*10)/10)}px`;
  });};
  let raf=0;const schedule=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(fit);};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule);else schedule();
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(schedule);
  addEventListener('load',schedule);addEventListener('resize',schedule);
  new MutationObserver(schedule).observe(document.documentElement,{attributes:true,attributeFilter:['data-lang','lang']});
})();

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

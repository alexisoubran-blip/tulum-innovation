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

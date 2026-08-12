(() => {
  const root = document.documentElement;
  const header = document.querySelector('[data-header]');
  const langToggle = document.querySelector('[data-lang-toggle]');
  const translatable = [...document.querySelectorAll('[data-en][data-es]')];

  const setLanguage = (lang, persist = true) => {
    const next = lang === 'es' ? 'es' : 'en';
    root.dataset.lang = next;
    root.lang = next;
    translatable.forEach((node) => {
      node.textContent = node.dataset[next];
    });
    if (persist) localStorage.setItem('tif-language', next);
    if (langToggle) {
      langToggle.setAttribute('aria-label', next === 'en' ? 'Cambiar a español' : 'Switch to English');
    }
  };

  setLanguage(root.dataset.lang || 'en', false);

  langToggle?.addEventListener('click', () => {
    setLanguage(root.dataset.lang === 'en' ? 'es' : 'en');
  });

  const updateHeader = () => {
    header?.classList.toggle('is-scrolled', window.scrollY > 24);
  };
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  const revealItems = document.querySelectorAll('.reveal:not(.is-visible)');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

  document.querySelectorAll('.wt-faq-item button').forEach((button) => {
    button.addEventListener('click', () => {
      const item = button.closest('.wt-faq-item');
      const open = button.getAttribute('aria-expanded') === 'true';
      document.querySelectorAll('.wt-faq-item').forEach((other) => {
        other.classList.remove('is-open');
        other.querySelector('button')?.setAttribute('aria-expanded', 'false');
      });
      if (!open) {
        item?.classList.add('is-open');
        button.setAttribute('aria-expanded', 'true');
      }
    });
  });
})();

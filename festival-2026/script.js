(() => {
  const root = document.documentElement;
  const header = document.querySelector('[data-header]');
  const navToggle = document.querySelector('[data-nav-toggle]');
  const nav = document.querySelector('[data-nav]');
  const languageToggle = document.querySelector('[data-lang-toggle]');
  const translatable = [...document.querySelectorAll('[data-en][data-es]')];

  const languageFromUrl = new URLSearchParams(window.location.search).get('lang');
  const savedLanguage = localStorage.getItem('tif-language');
  const browserLanguage = navigator.languages?.[0] || navigator.language || 'en';
  let currentLanguage = languageFromUrl === 'es' || languageFromUrl === 'en'
    ? languageFromUrl
    : savedLanguage || (browserLanguage.toLowerCase().startsWith('es') ? 'es' : 'en');

  const metadata = {
    en: {
      title: 'Tulum Innovation Fest 2026 | December 9–12',
      description: 'Four days of innovation, capital, culture and meaningful connection in Tulum, Mexico. December 9–12, 2026.'
    },
    es: {
      title: 'Tulum Innovation Fest 2026 | 9–12 de diciembre',
      description: 'Cuatro días de innovación, capital, cultura y conexión significativa en Tulum, México. 9–12 de diciembre de 2026.'
    }
  };

  const applyLanguage = (language, persist = true) => {
    currentLanguage = language;
    root.dataset.lang = language;
    root.lang = language;

    translatable.forEach((element) => {
      element.textContent = element.dataset[language];
    });

    document.title = metadata[language].title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', metadata[language].description);
    languageToggle?.setAttribute('aria-label', language === 'en' ? 'Cambiar a español' : 'Switch to English');
    languageToggle?.querySelectorAll('span').forEach((span) => {
      const isActive = span.textContent.trim().toLowerCase() === language;
      span.toggleAttribute('aria-current', isActive);
    });

    if (persist) localStorage.setItem('tif-language', language);
  };

  applyLanguage(currentLanguage, false);
  languageToggle?.addEventListener('click', () => applyLanguage(currentLanguage === 'en' ? 'es' : 'en'));

  const closeNav = () => {
    document.body.classList.remove('nav-open');
    navToggle?.setAttribute('aria-expanded', 'false');
    if (mobileNavQuery.matches && nav) {
      nav.inert = true;
      nav.setAttribute('aria-hidden', 'true');
    }
  };

  const mobileNavQuery = window.matchMedia('(max-width: 820px)');
  const updateMobileNavPosition = () => {
    if (!header || !mobileNavQuery.matches) return;
    const headerBottom = Math.max(0, Math.round(header.getBoundingClientRect().bottom));
    root.style.setProperty('--mobile-nav-top', `${headerBottom}px`);
  };

  const syncNavAccessibility = () => {
    if (!nav) return;
    if (mobileNavQuery.matches) {
      const isOpen = document.body.classList.contains('nav-open');
      nav.inert = !isOpen;
      nav.setAttribute('aria-hidden', String(!isOpen));
      updateMobileNavPosition();
    } else {
      document.body.classList.remove('nav-open');
      nav.inert = false;
      nav.removeAttribute('aria-hidden');
      navToggle?.setAttribute('aria-expanded', 'false');
      root.style.removeProperty('--mobile-nav-top');
    }
  };

  navToggle?.addEventListener('click', () => {
    const isOpen = document.body.classList.toggle('nav-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
    if (nav) {
      nav.inert = !isOpen;
      nav.setAttribute('aria-hidden', String(!isOpen));
    }
    updateMobileNavPosition();
  });
  nav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeNav));
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeNav();
  });

  const setHeaderState = () => {
    header?.classList.toggle('is-scrolled', window.scrollY > 24);
    updateMobileNavPosition();
  };
  setHeaderState();
  window.addEventListener('scroll', setHeaderState, { passive: true });
  window.addEventListener('resize', syncNavAccessibility, { passive: true });
  mobileNavQuery.addEventListener?.('change', syncNavAccessibility);
  syncNavAccessibility();

  const countdown = document.querySelector('[data-countdown]');
  if (countdown) {
    const deadline = new Date(countdown.dataset.countdown).getTime();
    const daysNode = countdown.querySelector('[data-days]');
    const hoursNode = countdown.querySelector('[data-hours]');
    const minutesNode = countdown.querySelector('[data-minutes]');

    const renderCountdown = () => {
      const remaining = Math.max(0, deadline - Date.now());
      const days = Math.floor(remaining / 86400000);
      const hours = Math.floor((remaining % 86400000) / 3600000);
      const minutes = Math.floor((remaining % 3600000) / 60000);
      if (daysNode) daysNode.textContent = String(days).padStart(2, '0');
      if (hoursNode) hoursNode.textContent = String(hours).padStart(2, '0');
      if (minutesNode) minutesNode.textContent = String(minutes).padStart(2, '0');
    };

    renderCountdown();
    window.setInterval(renderCountdown, 60000);
  }

  const campaignParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  const currentParams = new URLSearchParams(window.location.search);
  document.querySelectorAll('a[href*="ticketfairy.com"], a[href*="gust.com"]').forEach((link) => {
    const outboundUrl = new URL(link.href);
    campaignParams.forEach((parameter) => {
      const value = currentParams.get(parameter);
      if (value) outboundUrl.searchParams.set(parameter, value);
    });
    link.href = outboundUrl.toString();
    link.addEventListener('click', () => {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: 'tif_landing_cta_click',
        destination: outboundUrl.hostname,
        label: link.textContent.trim(),
        language: currentLanguage
      });
    });
  });

  const revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: .08, rootMargin: '0px 0px -48px 0px' });
    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }
})();

(() => {
  const root = document.documentElement;
  const header = document.querySelector('[data-header]');
  const langToggle = document.querySelector('[data-lang-toggle]');
  const translatable = [...document.querySelectorAll('[data-en][data-es]')];
  const heroImage = document.querySelector('.wt-hero-media img');

  if (heroImage) {
    heroImage.src = '../assets/whale-tank-hero.webp';
    heroImage.removeAttribute('srcset');
  }

  const responsiveOverrides = `
    .wt-page h1,
    .wt-page h2,
    .wt-page h3,
    .wt-page h4,
    .wt-page h1 em,
    .wt-page h2 em,
    .wt-page h3 em,
    .wt-page .wt-hero-card span,
    .wt-page .wt-room-list span,
    .wt-page .wt-funnel strong,
    .wt-page .wt-deadline strong {
      font-family: var(--display) !important;
      font-style: normal !important;
      font-weight: 400;
    }

    .wt-page h1,
    .wt-page h2,
    .wt-page h3 {
      text-wrap: balance;
      max-width: 100%;
    }

    .wt-page h1 em,
    .wt-page h2 em,
    .wt-page h3 em {
      color: #E97A43;
    }

    .wt-hero-grid {
      padding-top: calc(var(--header) + 2.25rem) !important;
    }

    .wt-hero-media img {
      object-position: 52% 50% !important;
    }

    .wt-rings {
      display: none !important;
    }

    @media (max-width: 640px) {
      .wt-page .container {
        width: min(90vw, calc(100% - 2rem));
      }

      .wt-header {
        min-height: 68px;
        padding: .7rem 5vw;
      }

      .wt-header .brand-logo {
        height: 28px;
        max-width: 148px;
      }

      .wt-lang {
        min-width: 52px;
        padding: .3rem;
        font-size: .62rem;
      }

      .wt-hero {
        min-height: auto;
      }

      .wt-hero-grid {
        gap: 2rem;
        padding-top: 5.25rem !important;
        padding-bottom: 4.25rem;
      }

      .wt-hero-media img {
        object-position: 56% 50% !important;
      }

      .wt-hero h1 {
        font-size: clamp(2.35rem, 10.6vw, 3.65rem) !important;
        line-height: .98 !important;
        letter-spacing: -.035em;
      }

      .wt-hero h1 em {
        margin-top: .3em;
        font-size: .6em !important;
        line-height: 1.08 !important;
      }

      .wt-overline {
        margin-bottom: 1rem;
        font-size: .62rem;
        line-height: 1.45;
        letter-spacing: .09em;
      }

      .wt-page .eyebrow {
        margin-bottom: .9rem;
        font-size: .56rem;
        line-height: 1.45;
        letter-spacing: .14em;
      }

      .wt-hero-intro {
        margin-top: 1.25rem;
        font-size: .94rem;
        line-height: 1.55;
      }

      .wt-hero-actions {
        margin-top: 1.45rem;
      }

      .wt-hero-actions .btn {
        width: 100%;
        min-height: 50px;
        padding-inline: 1rem;
        font-size: .66rem;
      }

      .wt-page .microcopy {
        font-size: .62rem;
        line-height: 1.5;
      }

      .wt-hero-card div {
        grid-template-columns: 78px 1fr;
        gap: .8rem;
        padding: 1rem 0;
      }

      .wt-hero-card span {
        font-size: clamp(1.4rem, 6.4vw, 1.95rem) !important;
      }

      .wt-hero-card p {
        font-size: .68rem;
        line-height: 1.4;
      }

      .wt-signal,
      .wt-program,
      .wt-room,
      .wt-fit,
      .wt-selection,
      .wt-context,
      .wt-faq {
        padding-top: 4.25rem !important;
        padding-bottom: 4.25rem !important;
      }

      .wt-signal-head h2,
      .wt-section-head h2,
      .wt-room-copy h2,
      .wt-fit-copy h2,
      .wt-selection-head h2,
      .wt-context-copy h2,
      .wt-faq-intro h2 {
        font-size: clamp(2rem, 8.8vw, 2.95rem) !important;
        line-height: 1.02 !important;
        letter-spacing: -.03em;
      }

      .wt-signal-grid {
        margin-top: 2.4rem;
      }

      .wt-signal-item {
        min-height: 0 !important;
        padding: 1.5rem 0 !important;
      }

      .wt-signal-item h3 {
        margin: 1.35rem 0 .65rem !important;
        font-size: 1.45rem !important;
        line-height: 1.08;
      }

      .wt-signal-item p,
      .wt-section-head > p:last-child,
      .wt-room-copy > p:last-child,
      .wt-fit-copy > p:not(.eyebrow),
      .wt-context-copy > p:not(.eyebrow),
      .wt-faq-intro > p:not(.eyebrow) {
        font-size: .9rem;
        line-height: 1.55;
      }

      .wt-journey {
        margin-top: 2.5rem;
      }

      .wt-step {
        grid-template-columns: 34px minmax(0, 1fr) !important;
        gap: .75rem;
        padding: 1.45rem 0;
      }

      .wt-step > div:last-child {
        gap: .45rem !important;
      }

      .wt-step-num,
      .wt-step span {
        font-size: .58rem;
      }

      .wt-step h3 {
        font-size: 1.35rem !important;
        line-height: 1.08;
      }

      .wt-step p {
        margin-top: .2rem;
        font-size: .88rem;
        line-height: 1.5;
      }

      .wt-room {
        min-height: auto !important;
      }

      .wt-room-grid {
        gap: 2.5rem !important;
      }

      .wt-room-list {
        grid-template-columns: 1fr !important;
      }

      .wt-room-list span {
        min-height: 66px !important;
        padding: .9rem 0 !important;
        border-right: 0 !important;
        font-size: .95rem !important;
        line-height: 1.25;
      }

      .wt-fit-grid,
      .wt-faq-grid {
        gap: 2.6rem !important;
      }

      .wt-fit-copy .btn {
        width: 100%;
      }

      .wt-fit-checks article {
        grid-template-columns: 36px 1fr !important;
        gap: .75rem;
        padding: 1.15rem 0 !important;
      }

      .wt-fit-checks i {
        width: 30px;
        height: 30px;
      }

      .wt-fit-checks h3 {
        font-size: 1.16rem !important;
        line-height: 1.2;
      }

      .wt-fit-checks p {
        font-size: .84rem;
        line-height: 1.45;
      }

      .wt-funnel {
        margin-top: 2.5rem !important;
        gap: .8rem !important;
      }

      .wt-funnel article {
        min-height: 0 !important;
        padding: 1.25rem !important;
      }

      .wt-funnel strong {
        margin: 1.4rem 0 .5rem !important;
        font-size: 2.35rem !important;
        line-height: .95;
      }

      .wt-funnel small {
        display: block;
        font-size: .78rem;
        line-height: 1.4;
      }

      .wt-deadline {
        grid-template-columns: 1fr !important;
        gap: 1.15rem !important;
        align-items: start !important;
      }

      .wt-deadline .btn {
        grid-column: auto !important;
        width: 100%;
        justify-self: stretch !important;
      }

      .wt-deadline strong {
        font-size: 1.15rem !important;
        line-height: 1.3;
      }

      .wt-context-image {
        min-height: 340px !important;
      }

      .wt-closing {
        min-height: 640px !important;
      }

      .wt-closing h2 {
        font-size: clamp(2.1rem, 9vw, 3.15rem) !important;
        line-height: 1.02 !important;
        letter-spacing: -.03em;
      }

      .wt-closing h2 em {
        display: block;
        margin-top: .25em;
      }

      .wt-closing-copy > p:not(.eyebrow) {
        font-size: .9rem;
        line-height: 1.5;
      }

      .wt-closing-actions .btn {
        width: 100%;
      }

      .wt-footer {
        padding-top: 3.5rem !important;
      }

      .wt-footer .footer-grid {
        grid-template-columns: 1fr !important;
        gap: 2rem !important;
      }

      .wt-footer .footer-bottom {
        display: grid !important;
        gap: .6rem !important;
        font-size: .64rem;
      }
    }

    @media (max-width: 390px) {
      .wt-hero h1 {
        font-size: clamp(2.15rem, 10.4vw, 2.75rem) !important;
      }

      .wt-signal-head h2,
      .wt-section-head h2,
      .wt-room-copy h2,
      .wt-fit-copy h2,
      .wt-selection-head h2,
      .wt-context-copy h2,
      .wt-faq-intro h2,
      .wt-closing h2 {
        font-size: clamp(1.85rem, 8.5vw, 2.45rem) !important;
      }
    }
  `;

  const style = document.createElement('style');
  style.setAttribute('data-whale-mobile-fixes', '');
  style.textContent = responsiveOverrides;
  document.head.appendChild(style);

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

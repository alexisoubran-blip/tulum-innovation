# Tulum Innovation Fest 2026 — Complete Bilingual Website Update

This package contains the complete replacement files:

- `index.html`
- `styles.css`
- `script.js`
- `README.md`

Keep your existing `assets/` folder unchanged.

## Installation

Replace the three files in the website root:

1. Replace the current `index.html`.
2. Replace the current `styles.css`.
3. Replace the current `script.js`.
4. Keep the existing `assets/` directory next to them.
5. Clear the browser/CDN cache after deployment.

Expected structure:

```text
website/
├── index.html
├── styles.css
├── script.js
└── assets/
    ├── tulum-innovation-fest-logo.png
    ├── hero-desktop.png
    ├── hero-mobile.png
    ├── ecosystem.png
    ├── founder-halo.png
    ├── venue-vr.png
    ├── venue-ikal.png
    └── closing-portal.png
```

## Included changes

### Festival credibility

- `5 Previous Editions`
- `5,700+ Festival Entries`

### Ticket pricing

The complete ticket section includes the current MXN prices provided for:

- Community Access — Tulum Resident
- General Access — 4 Day Pass
- Night Program — Full Access
- Full Night — Closing Party
- Invisible Layer — Ceremony Experience
- Executive Pass — Festival Access Only
- Living Room Sponsor — Activation Space
- Speaker Slot — No Stay Included
- Executive Pass + Speaker Slot — Stay Included

Every ticket CTA opens Ticket Fairy:

https://www.ticketfairy.com/event/tulumcryptofest2026-20260503023150748

### Currency conversion

The official checkout price remains the MXN amount.

Approximate USD prices are calculated in `script.js` using:

```js
const USD_MXN_REFERENCE = 17.3975;
```

Sponsor packages are officially displayed in USD and receive an approximate MXN equivalent using the same constant.

To refresh every conversion later, edit this single value.

The final amount charged by Ticket Fairy remains the source of truth.

### Sponsorship packages

The partnership section now includes:

- Main Title Partner — US$100,000
- Alpha Partner — US$40,000
- Core Partner — US$30,000
- Community Partner — US$20,000
- Access Partner — US$15,000
- Living Room Sponsor — US$1,500

Functional opportunities:

- Charging Station Partner — US$6,000
- Coffee Station Partner — US$8,000
- WiFi Partner — US$10,000
- App Partner — US$10,000

Every sponsor CTA opens the partnership form and preselects the chosen package.

### Pricing inconsistency to resolve

The sponsorship presentation lists `Living Room Sponsor` at `US$1,500`.

Ticket Fairy currently lists `Living Room Sponsor — Activation Space` at `MXN $33,480`, which is approximately `US$1,924` using the current reference rate.

The website clearly marks the sponsorship-deck value as a commercial reference. Confirm the final commercial price before launch.

### Languages

The site remains fully bilingual.

Language priority:

1. `?lang=es` or `?lang=en`
2. Saved user preference
3. Browser language detection

The `EN / ES` selector remains in the navigation.

### Social and production links

- Instagram: https://www.instagram.com/tulumcryptofest/?hl=en
- YouTube: https://www.youtube.com/@tulumcryptofest
- General Producer — Like Group! Management: https://www.likegroup.io/

### Partner form

The partnership modal now includes:

- Package of interest
- Investment range
- Partnership objective
- Area of interest

Clicking a sponsorship CTA automatically preselects its package.

The form remains a front-end demo. Connect it to the CRM, email platform or API endpoint before launch.

## QA checklist

- Verify every image in `assets/` loads.
- Test EN and ES.
- Test desktop, tablet and mobile.
- Test every Ticket Fairy CTA.
- Test sponsor package preselection.
- Test Instagram, YouTube and Like Group links.
- Connect the partnership form.
- Confirm the Living Room Sponsor commercial price.
- Refresh the FX reference before publishing paid campaigns.

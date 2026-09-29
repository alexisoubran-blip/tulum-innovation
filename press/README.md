# TIF pressroom

The build produces /press as static HTML and adds a sourced publisher-logo rail to the approved homepage. The underlying home-v2 content, hero, ticket destinations and JavaScript are preserved. The old unlinked generic media-name section is replaced by the rail. A scoped CSS correction connects the existing v2 mobile menu state to the legacy navigation styles.

## Editing coverage

Edit press/data.json, then run npm run build. Each record has an original source URL, publication year, original language, source classification, and short English/Spanish descriptions. Dates are publication dates, not event dates. PRO Network's 2026 entry intentionally has no day or month because no exact publication date was established. The five featured sources are ordered by featuredOrder. All cards and links exist without client-side JavaScript; JavaScript only enhances filtering and language selection.

Reviewed on 2026-09-29 against the publishers' article pages. The source workbook is a research input, not a public list of verified backlinks. No inbound-link or SEO-ranking claims are made.

## Classification

- article: news coverage and contributor articles, with a contributor label where disclosed.
- release: press releases and sponsored content, distinguished in each card.
- partner: publications with a declared partner relationship, including Ticket Fairy's own blog. Grit Daily's 2024 piece explicitly states that the contribution was unpaid; The Sociable discloses a connection to a partner of an Espacio portfolio company.

Historical coverage, partnership and sponsorship are not interchangeable. Publisher names and marks identify the linked publications and do not imply endorsement. The featured Forbes link is the staff article, not the separate sponsored 5ire article.

## Asset provenance

- assets/press/forbes.svg: https://forbes.com.mx/wp-content/themes/forbesv49/resources/img/forbes-mexico-logo.svg
- assets/press/entrepreneur.svg: official inline publisher wordmark from https://www.entrepreneur.com/
- Geektime, PRO Network and Soy Emprendedor reuse the existing approved local wordmarks in assets/whale-tank-logos/.

Logos are local assets with CSS monochrome presentation. No image hotlinking or network fetch is required by the production build. Existing external Google Fonts and YouTube behavior is unchanged. All original article URLs are in data.json and the rendered page.

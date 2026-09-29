# Homepage public roster

The production homepage is generated from home-v2/index.html, then press/build.mjs and roster/build.mjs. Edit roster/data.json for the four public groups. The original home-v2 speaker markup is replaced at build time. Other pages, including /whale-tank, are unchanged.

Order: Speakers, Co-Founders, Investors, Mentors. Each person appears once in their group. The 25 complete, deduplicated registration profiles supplied by the organizer are included alongside the previously announced lineup. Incomplete name-only registrations and ambassador announcements are excluded. Roles preserve the submitted speaker categories; no session schedules are inferred from registration availability.

Only public names, companies, roles, public profile URLs and image paths belong in data.json. Never add the source registration export, emails, phone numbers, tokens, or private media-kit links. The build rejects unrecognized fields. Profiles without an supplied photograph use text cards, not generated portraits.

The four new co-founder posters were supplied by the organizer on 2026-09-29 and optimized to WebP. Existing speaker and Whale Tank portraits are reused. Poster artwork uses object-fit:contain to preserve names and labels; normal portraits use cover.

Company sources checked 2026-09-29 include the organizer's submitted form (Dor Cohen/Muan Technologies, Elo Cadenas/PXO Token + Arkangeles, Uri Soglowek/Soglowek Capital, and other completed applicants), existing festival announcements and the following public organization/profile sources:
- https://guardiansofnature.earth/about
- https://www.linkedin.com/in/francesipimentel
- https://tulumcryptofest.io/home-dubai
- https://www.linkedin.com/in/yehudaberg/
- https://www.m75fund.com/
- https://www.qroom.biz/
- https://latamisraelventures.com/
- https://co.linkedin.com/company/santa-maria-investment-group
- https://www.impacta.vc/we-what
- https://www.andresnajera.com/
- https://mx.linkedin.com/in/paulinadelagar/

Abraham (Abe) Ramos has no verified company available in the supplied materials or research. His company is intentionally null until the organizer confirms it.

Run node build.mjs to build. Count assertions must be adjusted when adding approved profiles. The build checks duplicate names, local image existence, HTML escaping, public fields, group ordering and preservation of hero, press, tickets, past-participant sections and scripts.

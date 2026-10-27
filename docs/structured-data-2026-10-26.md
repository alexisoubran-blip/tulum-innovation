# Structured data repair, 26 October 2026

Repository: alexisoubran-blip/tulum-innovation, production branch main.
Hosting: Vercel project tulum-innovation (prj_A2bG4Um9en5CbCl6tHOcONK90qNK).

## Published findings before repair

Checked all 13 sitemap routes and four legacy profile/home aliases by HTTP. All responded successfully. Canonical affected pages:

| Page | Event description | Event image | ProfilePage dateModified |
| --- | --- | --- | --- |
| /alexis-soubran-tif-cmo | Missing | Missing | 2026-08-13, date without time |
| /partners/minimalist-agency | Missing | Missing | Not applicable |
| /tickets | Missing | Present | Not applicable |

The uppercase /alexis-soubran-TIF-CMO route and both profile /index.html variants returned the same affected profile markup. The homepage, /home-v2 redirect and /festival-2026 already contained Event description and image. Other sitemap pages contained neither affected type.

## Implementation and evidence

- Both profile HTML sources contain the ProfilePage and nested Event graph. The uppercase route is rewritten to the lowercase source by vercel.json, but both source copies are maintained.
- The partner HTML source contains another Event graph.
- The tickets HTML source contains a standalone Event block. Its noindex metadata means a fix only inside aeo/build.mjs's public-page normalization would miss this page.
- build.mjs copies these sources to dist. aeo/build.mjs normalizes public Event identity, place and organizer without filling the reported fields.
- Missing descriptions reuse the exact festival description already published in the homepage Event: “A four-day gathering connecting innovation, capital, culture and human connection in Tulum, Mexico.”
- Missing Event images reuse the existing festival image https://www.tuluminnovationfest.com/assets/hero-desktop.png, already used by the homepage and festival landing. Existing tickets image is preserved.
- Profile dateModified becomes 2026-10-23T23:10:13Z. Evidence: commit a9f44da96ea4ee8a5ee0fb5d491efdcef971db5b modified the profile's agency information and visible agency link at that timestamp. This is a recorded content change, not an invented time or the festival date.
- All startDate/endDate values remain 2026-12-09 and 2026-12-12. Prices, checkout behavior and visible layout are unchanged.

## Repeatable validation

Run `node build.mjs`. It ends with scripts/validate-structured-data.mjs, scanning all generated HTML, parsing every JSON-LD block and checking Event description/image/location, unchanged festival dates, ProfilePage timestamp formatting/mainEntity and referenced local image files. Also runnable as `node scripts/validate-structured-data.mjs` after building.

This local check does not replace Google's Rich Results Test or Search Console's recrawl. In Search Console, request validation for missing description, missing image and invalid ProfilePage dateModified after verifying the deployed markup. A successful deployment does not itself clear Google's historical report.

import { cp, mkdir, rm, readFile, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";

await rm("dist", { recursive: true, force: true });
await mkdir("dist", { recursive: true });
await cp("styles.css", "dist/styles.css");
await cp("script.js", "dist/script.js");
await cp("assets", "dist/assets", { recursive: true });
await cp("whale-tank", "dist/whale-tank", { recursive: true });
await cp("festival-2026", "dist/festival-2026", { recursive: true });
await cp("sponsorship", "dist/sponsorship", { recursive: true });
await cp("alexis-soubran-tif-cmo", "dist/alexis-soubran-tif-cmo", { recursive: true });
await cp("alexis-soubran-TIF-CMO", "dist/alexis-soubran-TIF-CMO", { recursive: true });
await cp("home-v2", "dist/home-v2", { recursive: true });

// The approved home-v2 is the homepage source of truth. Keep its assets at
// their existing absolute URLs so subpages and the approved design stay intact.
const source = await readFile("home-v2/index.html", "utf8");
const canonical = "https://www.tuluminnovationfest.com/";
const description = "Join founders, investors, creators and technology leaders in Tulum from December 9-12, 2026 for four days of innovation, capital, culture and meaningful connection.";
const home = source
  .replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="description" content="${description}" />`)
  .replace(/<meta\s+name="robots"\s+content="[^"]*"\s*\/?>/i,
    '<meta name="robots" content="index,follow,max-image-preview:large" />')
  .replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
    `<link rel="canonical" href="${canonical}" />`)
  .replace(/<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i,
    `<meta property="og:url" content="${canonical}" />`);

// Fail the deployment rather than publish a preview-only or altered layout.
const head = home.slice(0, home.indexOf("</head>"));
assert.ok(home.includes('class="v2-hero"'), "Expected the approved v2 homepage");
assert.ok(head.includes(`content="${description}"`), "Missing public description");
assert.ok(head.includes('content="index,follow,max-image-preview:large"'), "Missing public robots metadata");
assert.ok(head.includes(`<link rel="canonical" href="${canonical}"`), "Incorrect homepage canonical");
assert.ok(head.includes(`<meta property="og:url" content="${canonical}"`), "Incorrect social URL");
assert.ok(!/noindex|nofollow|noarchive|Internal preview/i.test(head), "Preview metadata must not reach the homepage");
assert.equal(home.slice(home.indexOf("</head>")), source.slice(source.indexOf("</head>")), "Homepage content and scripts must remain unchanged");

await writeFile("dist/index.html", home);
console.log("Homepage: approved home-v2 published at /; public SEO metadata verified; content, scripts and asset URLs preserved.");

// Sourced press coverage is generated after the homepage preservation checks.
const { buildPress } = await import('./press/build.mjs');
await buildPress();

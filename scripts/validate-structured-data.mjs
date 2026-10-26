// Validate the generated HTML, including legacy aliases and noindex ticket pages.
import { readdir, readFile, access } from 'node:fs/promises';
import assert from 'node:assert/strict';
const origin = 'https://www.tuluminnovationfest.com';
let events = 0, profiles = 0, pages = 0;
const images = new Set();
function walk(value, file) {
  if (!value || typeof value !== 'object') return;
  if (value['@type'] === 'Event' && value.name === 'Tulum Innovation Fest 2026') {
    events++;
    assert.equal(value.startDate, '2026-12-09', file);
    assert.equal(value.endDate, '2026-12-12', file);
    assert.ok(typeof value.description === 'string' && value.description.trim(), `${file}: missing Event description`);
    const urls = Array.isArray(value.image) ? value.image : [value.image];
    assert.ok(urls.length, `${file}: missing Event image`);
    for (const image of urls) {
      assert.ok(typeof image === 'string', `${file}: missing Event image`);
      const url = new URL(image);
      assert.equal(url.origin, origin, `${file}: unexpected image origin`);
      images.add('dist' + url.pathname);
    }
    assert.ok(value.location?.address, `${file}: missing Event location`);
  }
  if (value['@type'] === 'ProfilePage') {
    profiles++;
    if (value.dateModified !== undefined) {
      assert.match(value.dateModified, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/, `${file}: invalid ProfilePage dateModified`);
      assert.ok(Number.isFinite(Date.parse(value.dateModified)), `${file}: invalid timestamp`);
    }
    assert.ok(value.mainEntity, `${file}: missing profile mainEntity`);
  }
  for (const child of Object.values(value)) {
    if (Array.isArray(child)) child.forEach(item => walk(item, file));
    else if (child && typeof child === 'object') walk(child, file);
  }
}
async function scan(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = `${directory}/${entry.name}`;
    if (entry.isDirectory()) await scan(file);
    else if (file.endsWith('.html')) {
      pages++;
      const html = await readFile(file, 'utf8');
      for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) walk(JSON.parse(match[1]), file);
    }
  }
}
await scan('dist');
assert.ok(events >= 7, 'Expected all festival Event blocks, including aliases');
assert.equal(profiles, 2, 'Expected both profile source variants');
for (const path of images) await access(path);
console.log(`Structured data: ${pages} HTML pages, ${events} Event blocks, ${profiles} ProfilePage blocks; JSON, target fields, festival dates and image files valid.`);

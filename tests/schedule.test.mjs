import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseCsv, eventsFromRows, dayOf, timeOf, csvUrl } from '../lib/schedule.mjs';

test('schedule: sheet rows → published, sorted events', () => {
  const csv = 'publicado,tipo,dia,inicio,fin,lugar,titulo,titulo_en,persona,rol,foto_url,descripcion,descripcion_en,carrusel,link\n'
    + 'si,Música,12/12/2026,11:00 PM,1:00,Arena,"Set, cierre",,DJ X,DJ,https://x.com/a.webp,,,sí,\n'
    + 'no,charla,2026-12-09,10:00,,Arena,Oculta,,,,,,,,\n'
    + 'si,bienestar,2026-12-10,7:00:00,8:00,Playa,Breathwork,Breathwork EN,Ana,Guía,javascript:alert(1),Desc,,si,https://tif.com\n';
  const ev = eventsFromRows(parseCsv(csv));
  assert.equal(ev.length, 2);
  assert.deepEqual([ev[0].day, ev[0].start, ev[0].type, ev[0].featured], ['10', '07:00', 'bienestar', true]);
  assert.equal(ev[0].photo, '');
  assert.equal(ev[1].title.es, 'Set, cierre');
  assert.equal(ev[1].title.en, 'Set, cierre');
  assert.deepEqual([ev[1].day, ev[1].start, ev[1].type], ['12', '23:00', 'musica']);
});

test('schedule: day, time and sheet URL helpers', () => {
  assert.equal(dayOf('10/12/2026'), '10');
  assert.equal(dayOf('12/11/2026'), '11');
  assert.equal(dayOf('2026-12-12'), '12');
  assert.equal(dayOf('2026-11-30'), null);
  assert.equal(timeOf('9 pm'), '21:00');
  assert.equal(csvUrl('https://docs.google.com/spreadsheets/d/AbC_1/edit#gid=5'), 'https://docs.google.com/spreadsheets/d/AbC_1/export?format=csv&gid=5');
});

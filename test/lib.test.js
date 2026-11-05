import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Cache, getJson, latest } from '../src/lib/cache.js';
import { DEFAULT_PLACE, load, remember, save } from '../src/lib/prefs.js';

const memory = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)) }; };

test('the cache keeps answers for a while, then forgets them', () => {
  let t = 0;
  const c = new Cache(1000, () => t);
  c.set('a', 1);
  assert.equal(c.get('a'), 1);
  t = 1001;
  assert.equal(c.get('a'), undefined);
});

test('getJson uses the cache, never caches failures, and explains errors', async () => {
  let calls = 0;
  const ok = async () => { calls++; return { ok: true, json: async () => ({ a: 1 }) }; };
  const cache = new Cache();
  assert.deepEqual(await getJson('u', { cache, fetchImpl: ok }), { a: 1 });
  await getJson('u', { cache, fetchImpl: ok });
  assert.equal(calls, 1);
  await assert.rejects(getJson('x', { cache, fetchImpl: async () => ({ ok: false, status: 429 }) }), /Too many requests/);
  await assert.rejects(getJson('y', { cache, fetchImpl: async () => ({ ok: true, json: async () => ({ error: true, reason: 'Latitude must be in range' }) }) }), /Latitude/);
  assert.equal(cache.get('x'), undefined);
});

test('only the newest request is delivered, even when an older one finishes last', async () => {
  const run = latest();
  const shown = [];
  const slow = run(() => new Promise((r) => setTimeout(() => r('old'), 20)), (v) => shown.push(v));
  const fast = run(async () => 'new', (v) => shown.push(v));
  assert.deepEqual(await Promise.all([slow, fast]), [false, true]);
  assert.deepEqual(shown, ['new']);
});

test('prefs load safely: bad or blocked storage gives the defaults', () => {
  const s = memory();
  assert.deepEqual(load(s).place, DEFAULT_PLACE);
  save({ unit: 'c', theme: 'light', place: { name: 'Tokyo', lat: 35.7, lon: 139.7 }, recent: [] }, s);
  assert.equal(load(s).unit, 'c');
  assert.equal(load(s).place.name, 'Tokyo');
  s.setItem('weather-forecast-prefs', '{"unit":"k","place":{"name":"x","lat":999,"lon":0}}');
  assert.equal(load(s).unit, 'f');
  assert.deepEqual(load(s).place, DEFAULT_PLACE);
  s.setItem('weather-forecast-prefs', 'not json');
  assert.equal(load(s).theme, 'dark');
  const blocked = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  assert.equal(load(blocked).unit, 'f');
  assert.equal(save({}, blocked), false);
});

test('recent places: newest first, no repeats, five at most', () => {
  let r = [];
  for (let i = 0; i < 7; i++) r = remember(r, { name: `P${i}`, lat: i, lon: i });
  r = remember(r, { name: 'P4 again', lat: 4, lon: 4 });
  assert.deepEqual(r.map((p) => p.name), ['P4 again', 'P6', 'P5', 'P3', 'P2']);
});

import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { createAppServer } from './server.mjs';

let server;
let base;

before(async () => {
  server = createAppServer();
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

test('serverer forsiden med sikkerhetshoder', async () => {
  const res = await fetch(`${base}/`);
  assert.equal(res.status, 200);
  const csp = res.headers.get('content-security-policy');
  assert.match(csp, /default-src 'none'/);
  assert.match(csp, /form-action 'none'/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.equal(res.headers.get('referrer-policy'), 'no-referrer');
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
});

test('uten dev-modus finnes ingen live-oppdatering', async () => {
  assert.doesNotMatch(await (await fetch(`${base}/`)).text(), /__dev/);
  assert.equal((await fetch(`${base}/__dev/reload.js`)).status, 404);
});

test('alle filene siden trenger, kan hentes', async () => {
  for (const sti of ['/icons/icon.svg', '/style.css', '/app.js', '/veiviser.js', '/veiviser-data.js', '/fonts/instrument-sans-400.woff2', '/fonts/instrument-sans-500.woff2', '/fonts/instrument-sans-600.woff2', '/fonts/instrument-serif-400.woff2']) {
    assert.equal((await fetch(base + sti)).status, 200, sti);
  }
});

test('gir 404 for filer utenfor listen', async () => {
  for (const sti of ['/package.json', '/veiviser.test.mjs', '/../package.json', '/backend/server.mjs', '/%2e%2e/package.json']) {
    assert.equal((await fetch(base + sti)).status, 404, sti);
  }
});

test('godtar bare GET', async () => {
  assert.equal((await fetch(`${base}/`, { method: 'POST' })).status, 404);
});

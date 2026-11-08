import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { VEIVISER, TRYGGHETSREGLER } from './veiviser-data.js';
import { gjeldendeNode, nyTilstand, startPaNytt, stopper, tilbake, velg } from './veiviser.js';

const noder = Object.entries(VEIVISER.noder);
const rad = noder.filter(([, node]) => node.type === 'rad');
const TILLATTE_VERTER = new Set(['help.ubuntu.com', 'ubuntu.com', 'forum.zorin.com']);

function finnValg(nodeId, tekst) {
  const indeks = VEIVISER.noder[nodeId].valg.findIndex((valg) => valg.tekst === tekst);
  assert.notEqual(indeks, -1, `fant ikke valget "${tekst}"`);
  return indeks;
}

function tilUbuntu() {
  let tilstand = nyTilstand(VEIVISER);
  tilstand = velg(tilstand, finnValg('pc', 'Min egen pc'));
  return velg(tilstand, finnValg('system', 'Ubuntu eller Zorin'));
}

test('alle valg peker til et steg som finnes', () => {
  for (const [id, node] of noder) {
    for (const valg of node.valg ?? []) {
      if (valg.til) assert.ok(VEIVISER.noder[valg.til], `${id} peker til ukjent steg ${valg.til}`);
    }
  }
});

test('alle stier ender i et råd, uten løkker eller blindveier', () => {
  function gaa(id, sett) {
    assert.ok(!sett.includes(id), `løkke: ${[...sett, id].join(' > ')}`);
    const node = VEIVISER.noder[id];
    if (node.type === 'rad') return;
    const videre = node.valg.filter((valg) => valg.til);
    assert.ok(videre.length > 0, `blindvei: ${id}`);
    for (const valg of videre) gaa(valg.til, [...sett, id]);
  }
  gaa(VEIVISER.start, []);
});

test('alle steg kan nås fra starten', () => {
  const naadd = new Set();
  function gaa(id) {
    naadd.add(id);
    for (const valg of VEIVISER.noder[id].valg ?? []) if (valg.til) gaa(valg.til);
  }
  gaa(VEIVISER.start);
  assert.deepEqual([...naadd].sort(), noder.map(([id]) => id).sort());
});

test('startsteget har egen pc, skolepc og lånt pc', () => {
  const tekster = VEIVISER.noder.pc.valg.map((valg) => valg.tekst);
  assert.deepEqual(tekster, ['Min egen pc', 'Skolepc', 'Lånt pc']);
});

test('egen pc tilbyr alle støttede systemer og "vet ikke"', () => {
  const tekster = VEIVISER.noder.system.valg.map((valg) => valg.tekst);
  assert.deepEqual(tekster, ['Ubuntu eller Zorin', 'Windows 10 eller 11', 'Mac', 'Vet ikke']);
});

test('Ubuntu og Zorin dekker alle fire problemene', () => {
  const til = VEIVISER.noder['linux-problem'].valg.map((valg) => valg.til);
  assert.deepEqual(til, ['linux-glemt', 'linux-forsok', 'linux-kryptert', 'linux-andre']);
});

test('alle råd har steg, hjelper og tittel', () => {
  for (const [id, node] of rad) {
    assert.ok(node.tittel, id);
    assert.ok(node.steg.length >= 2 && node.steg.length <= 10, `${id} skal ha 2 til 10 steg`);
    assert.ok(node.hjelp, id);
  }
  assert.ok(TRYGGHETSREGLER.length > 0);
});

test('alle lenker er HTTPS og står på godkjentlisten', () => {
  for (const [id, node] of rad) {
    for (const lenke of node.lenker ?? []) {
      const url = new URL(lenke.url);
      assert.equal(url.protocol, 'https:', `${id}: ${lenke.url}`);
      assert.ok(TILLATTE_VERTER.has(url.hostname), `${id}: ${url.hostname} er ikke godkjent`);
    }
  }
});

test('råd om kryptert disk advarer mot å installere på nytt', () => {
  assert.match(VEIVISER.noder['linux-kryptert'].varsel, /Ikke installer/);
});

const BYPASS = /\b(grub|passwd|recovery|remount|init=)\b/i;

function naddFra(startTil) {
  const sett = new Set();
  (function gaa(id) {
    if (!id || sett.has(id)) return;
    sett.add(id);
    for (const valg of VEIVISER.noder[id].valg ?? []) gaa(valg.til);
  })(startTil);
  return sett;
}

test('bypass-kommandoer finnes bare på egen-pc-veien, aldri på skolepc eller lånt pc', () => {
  for (const tekst of ['Skolepc', 'Lånt pc']) {
    const start = VEIVISER.noder.pc.valg.find((valg) => valg.tekst === tekst);
    for (const id of start?.til ? naddFra(start.til) : []) {
      assert.ok(!BYPASS.test(JSON.stringify(VEIVISER.noder[id])), `${id} på ${tekst}-veien har en bypass-kommando`);
    }
  }
});

test('et steg med bypass-kommando krever en eierskapsadvarsel', () => {
  for (const [id, node] of rad) {
    if (BYPASS.test(JSON.stringify(node.steg))) {
      assert.match(node.varsel ?? '', /eier(\s|$)|eier selv|din egen/i, `${id} mangler eierskapsadvarsel`);
    }
  }
});

test('frontend ber ikke om data, lagrer ingenting og leser ikke systemet', async () => {
  const mappe = import.meta.dirname;
  const filer = (await readdir(mappe)).filter((fil) => /\.(html|js|css)$/.test(fil));
  assert.ok(filer.includes('index.html') && filer.includes('app.js'));
  const forbudt = [
    /<input/i, /<textarea/i, /<select/i, /<form/i,
    /createElement\(\s*['"](input|textarea|select|form)/i, /h\(\s*['"](input|textarea|select|form)/i,
    /localStorage/, /sessionStorage/, /indexedDB/, /document\.cookie/,
    /userAgent/, /navigator\.platform/,
    /\bfetch\(/, /XMLHttpRequest/, /sendBeacon/, /https?:\/\/(?!help\.ubuntu\.com|ubuntu\.com|forum\.zorin\.com|www\.w3\.org)/,
  ];
  for (const fil of filer) {
    const innhold = await readFile(join(mappe, fil), 'utf8');
    for (const regel of forbudt) assert.ok(!regel.test(innhold), `${fil} bryter regelen ${regel}`);
  }
});

test('valg og tilbake flytter en stopp om gangen', () => {
  let tilstand = nyTilstand(VEIVISER);
  assert.equal(gjeldendeNode(tilstand).stopp, 'Pc');
  tilstand = velg(tilstand, 0);
  assert.equal(gjeldendeNode(tilstand).stopp, 'System');
  tilstand = tilbake(tilstand);
  assert.equal(gjeldendeNode(tilstand).stopp, 'Pc');
});

test('et valg som ikke er bygget, flytter ingenting', () => {
  const tilstand = nyTilstand(VEIVISER);
  assert.equal(velg(tilstand, finnValg('pc', 'Skolepc')), tilstand);
});

test('stien viser passerte, gjeldende og kommende stopp', () => {
  assert.deepEqual(stopper(nyTilstand(VEIVISER)).map((s) => [s.navn, s.status]), [
    ['Pc', 'her'], ['System', 'kommende'], ['Problem', 'kommende'], ['Råd', 'kommende'],
  ]);
  const vei = stopper(velg(tilUbuntu(), 0));
  assert.deepEqual(vei.map((s) => s.status), ['passert', 'passert', 'passert', 'her']);
  assert.deepEqual(vei.map((s) => s.valgt).slice(0, 3), ['Egen pc', 'Ubuntu/Zorin', 'Glemt passord']);
});

test('start på nytt tømmer alle valg', () => {
  assert.equal(startPaNytt(tilUbuntu()).valgt.length, 0);
});

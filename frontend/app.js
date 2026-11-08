// Draws the wizard and the path. All state stays in memory and is gone when the page closes.
import { TRYGGHETSREGLER, VEIVISER } from './veiviser-data.js';
import { gjeldendeNode, nyTilstand, startPaNytt, stopper, tilbake, velg } from './veiviser.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const stiEl = document.getElementById('sti');
const stiTekstEl = document.getElementById('sti-tekst');
const stegEl = document.getElementById('steg');
const navEl = document.getElementById('steg-nav');

let tilstand = nyTilstand(VEIVISER);
let forrigeLengde = 0;
let forrigeIndeks = -1;

function h(tag, egenskaper = {}, ...barn) {
  const el = document.createElement(tag);
  for (const [navn, verdi] of Object.entries(egenskaper)) {
    if (navn === 'onclick') el.addEventListener('click', verdi);
    else if (verdi !== undefined) el.setAttribute(navn, verdi);
  }
  el.append(...barn.filter((b) => b !== undefined && b !== null));
  return el;
}

function s(tag, egenskaper = {}, ...barn) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [navn, verdi] of Object.entries(egenskaper)) el.setAttribute(navn, verdi);
  el.append(...barn);
  return el;
}

function pil() {
  return s('svg', { class: 'valg-pil', viewBox: '0 0 24 24', 'aria-hidden': 'true' },
    s('path', { d: 'M5 12h14M13 6l6 6-6 6' }));
}

function tegnSti({ animer }) {
  const liste = stopper(tilstand);
  const bredde = stiEl.clientWidth;
  if (!bredde) return;

  const smal = bredde < 600;
  const hoyde = smal ? 112 : 148;
  const marg = smal ? 18 : 28;
  const [oppe, nede] = smal ? [22, 52] : [28, 78];
  const tekstY = smal ? 88 : 116;

  const punkter = liste.map((_, i) => ({
    x: marg + (i * (bredde - 2 * marg)) / Math.max(liste.length - 1, 1),
    y: i % 2 === 0 ? nede : oppe,
  }));

  // Winding road: each leg leaves and arrives level, so every stop sits on a bend.
  const deler = punkter.map((p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const q = punkter[i - 1];
    const midt = (p.x - q.x) / 2;
    return `C ${q.x + midt} ${q.y}, ${p.x - midt} ${p.y}, ${p.x} ${p.y}`;
  });

  const indeks = liste.findIndex((stopp) => stopp.status === 'her');
  const vei = s('path', { class: 'sti-vei', d: deler.join(' ') });
  const lys = s('path', { class: 'sti-lys', d: deler.join(' ') });
  const maal = s('path', { d: deler.slice(0, indeks + 1).join(' ') });

  const svg = s('svg', { viewBox: `0 0 ${bredde} ${hoyde}`, width: bredde, height: hoyde, 'aria-hidden': 'true' }, vei, lys);
  svg.append(maal);

  liste.forEach((stopp, i) => {
    const { x, y } = punkter[i];
    const gruppe = s('g', { class: `stopp stopp-${stopp.status}` });
    if (stopp.status === 'her') {
      gruppe.append(s('circle', { class: `stopp-ring${animer && i !== forrigeIndeks ? ' tenn' : ''}`, cx: x, cy: y, r: smal ? 15 : 18 }));
    }
    gruppe.append(s('circle', { class: 'stopp-prikk', cx: x, cy: y, r: smal ? 9 : 11 }));
    if (stopp.status === 'passert') {
      gruppe.append(s('path', { class: 'stopp-hake', d: `M ${x - 4} ${y} l 3 3 l 5 -6` }));
    }

    const anker = i === 0 ? 'start' : i === liste.length - 1 ? 'end' : 'middle';
    const tekstX = i === 0 ? x - marg + 2 : i === liste.length - 1 ? x + marg - 2 : x;
    const navn = s('text', { class: 'stopp-navn', x: tekstX, y: tekstY, 'text-anchor': anker });
    navn.textContent = stopp.navn;
    const undertekst = stopp.status === 'her' ? 'Du er her' : stopp.valgt;
    gruppe.append(navn);
    if (undertekst) {
      const under = s('text', { class: 'stopp-valgt', x: tekstX, y: tekstY + (smal ? 17 : 20), 'text-anchor': anker });
      under.textContent = undertekst;
      gruppe.append(under);
    }
    svg.append(gruppe);
  });

  stiEl.replaceChildren(svg);

  const total = lys.getTotalLength();
  const lengde = indeks === 0 ? 0 : maal.getTotalLength();
  maal.remove();
  lys.style.strokeDasharray = `${total} ${total}`;
  lys.style.strokeDashoffset = `${total - (animer ? forrigeLengde : lengde)}`;
  if (animer) {
    lys.getBoundingClientRect();
    lys.style.strokeDashoffset = `${total - lengde}`;
  }
  forrigeLengde = lengde;
  forrigeIndeks = indeks;

  const valgte = liste.filter((stopp) => stopp.valgt).map((stopp) => stopp.valgt).join(', ');
  stiTekstEl.textContent = `Steg ${indeks + 1} av ${liste.length}: ${liste[indeks].navn}.${valgte ? ` Du har valgt: ${valgte}.` : ''}`;
}

function tegnSporsmal(node) {
  const antall = node.valg.length;
  return [
    h('h1', { tabindex: '-1' }, node.tittel),
    h('p', { class: 'ingress' }, node.ingress),
    h('ul', { class: `valg valg-${antall}` }, ...node.valg.map((valg, indeks) => h('li', {},
      h('button', {
        type: 'button',
        class: 'valg-knapp',
        disabled: valg.til ? undefined : '',
        onclick: valg.til ? () => oppdater(velg(tilstand, indeks)) : undefined,
      },
      h('span', { class: 'valg-tekst' },
        h('span', { class: 'valg-tittel' }, valg.tekst),
        h('span', { class: 'valg-beskrivelse' }, valg.beskrivelse)),
      valg.til ? pil() : h('span', { class: 'kommer' }, 'Kommer snart'))))),
  ];
}

// Shown as plain text, so it can be typed in on another device.
function visAdresse(url) {
  const { host, pathname } = new URL(url);
  return (host + pathname).replace(/\/$/, '');
}

// A step is a plain sentence, or a sentence with a command shown as a real code line.
function tegnSteg(steg) {
  if (typeof steg === 'string') return h('li', {}, steg);
  return h('li', {}, steg.tekst,
    steg.kode ? h('pre', { class: 'kode' }, h('code', {}, steg.kode)) : null);
}

function tegnRad(node) {
  const lenker = node.lenker ?? [];
  return [
    h('h1', { tabindex: '-1' }, node.tittel),
    h('p', { class: 'ingress' }, node.ingress),
    h('div', { class: 'rad' },
      node.varsel ? h('p', { class: 'varsel' }, node.varsel) : null,
      h('div', { class: 'kolonne kolonne-bred' },
        h('section', { class: 'flate flate-steg' },
          h('h2', {}, 'Gjør dette'),
          h('ol', { class: 'steg-liste' }, ...node.steg.map(tegnSteg))),
        h('section', { class: 'flate flate-lenker' },
          h('h2', {}, 'Offisielle sider'),
          h('ul', { class: 'lenker' }, ...lenker.map((lenke) => h('li', {},
            h('a', { href: lenke.url, target: '_blank', rel: 'noopener noreferrer' }, lenke.tekst),
            h('span', { class: 'adresse' }, visAdresse(lenke.url))))))),
      h('div', { class: 'kolonne kolonne-smal' },
        h('section', { class: 'flate flate-hjelp' },
          h('h2', {}, 'Hvem kan hjelpe'),
          h('p', {}, node.hjelp)),
        h('section', { class: 'flate flate-regler' },
          h('h2', {}, 'Trygghetsregler'),
          h('ul', { class: 'regler' }, ...TRYGGHETSREGLER.map((regel) => h('li', {}, regel))))),
    ),
  ];
}

function tegnNav() {
  if (tilstand.valgt.length === 0) return navEl.replaceChildren();
  navEl.replaceChildren(
    h('button', { type: 'button', class: 'tekstknapp', onclick: () => oppdater(tilbake(tilstand)) }, 'Tilbake'),
    h('button', { type: 'button', class: 'tekstknapp', onclick: () => oppdater(startPaNytt(tilstand)) }, 'Start på nytt'),
  );
}

function oppdater(ny, { flyttFokus = true } = {}) {
  tilstand = ny;
  const node = gjeldendeNode(tilstand);
  const redusert = matchMedia('(prefers-reduced-motion: reduce)').matches;
  tegnSti({ animer: flyttFokus && !redusert });
  stegEl.replaceChildren(...(node.type === 'rad' ? tegnRad(node) : tegnSporsmal(node)));
  tegnNav();
  if (flyttFokus) {
    scrollTo(0, 0);
    stegEl.querySelector('h1').focus({ preventScroll: true });
  }
}

oppdater(tilstand, { flyttFokus: false });
new ResizeObserver(() => tegnSti({ animer: false })).observe(stiEl);

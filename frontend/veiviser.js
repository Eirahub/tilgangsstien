// Pure wizard logic: no DOM and no storage. The state lives only in memory.

export function nyTilstand(data) {
  return { data, valgt: [] };
}

export function gjeldendeId(tilstand) {
  const siste = tilstand.valgt.at(-1);
  return siste ? siste.valg.til : tilstand.data.start;
}

export function gjeldendeNode(tilstand) {
  return tilstand.data.noder[gjeldendeId(tilstand)];
}

export function velg(tilstand, indeks) {
  const node = gjeldendeNode(tilstand);
  const valg = node.valg?.[indeks];
  if (!valg || !valg.til) return tilstand;
  return { ...tilstand, valgt: [...tilstand.valgt, { node, valg }] };
}

export function tilbake(tilstand) {
  return { ...tilstand, valgt: tilstand.valgt.slice(0, -1) };
}

export function startPaNytt(tilstand) {
  return nyTilstand(tilstand.data);
}

// The longest road from a node, so the path never promises fewer stops than remain.
function lengsteRest(data, node) {
  let lengste = [];
  for (const valg of node.valg ?? []) {
    if (!valg.til) continue;
    const neste = data.noder[valg.til];
    const rest = [neste.stopp, ...lengsteRest(data, neste)];
    if (rest.length > lengste.length) lengste = rest;
  }
  return lengste;
}

export function stopper(tilstand) {
  const node = gjeldendeNode(tilstand);
  return [
    ...tilstand.valgt.map(({ node: passert, valg }) => ({ navn: passert.stopp, valgt: valg.kort, status: 'passert' })),
    { navn: node.stopp, status: 'her' },
    ...lengsteRest(tilstand.data, node).map((navn) => ({ navn, status: 'kommende' })),
  ];
}

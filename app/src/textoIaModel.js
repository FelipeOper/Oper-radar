// Interpreta o markdown leve que a IA devolve (negrito, parágrafos, listas) sem HTML cru: o resultado é uma árvore
// de dados que o componente TextoIa desenha, então texto vindo do modelo nunca vira HTML.

export function segmentosInline(linha) {
  const partes = [];
  const re = /\*\*([^*]+)\*\*/g;
  let ultimo = 0;
  let m;
  while ((m = re.exec(linha)) !== null) {
    if (m.index > ultimo) partes.push({ t: linha.slice(ultimo, m.index), b: false });
    partes.push({ t: m[1], b: true });
    ultimo = m.index + m[0].length;
  }
  if (ultimo < linha.length) partes.push({ t: linha.slice(ultimo), b: false });
  return partes.length ? partes : [{ t: linha, b: false }];
}

const ITEM = /^\s*(?:[-*•]|\d+[.)])\s+(.*)$/;

// Devolve blocos: { tipo: 'p', partes } | { tipo: 'ul', itens: [partes, ...] }
export function parseTextoIa(texto) {
  const linhas = String(texto || '').replace(/\r/g, '').split('\n');
  const blocos = [];
  let lista = null;
  const fechaLista = () => { if (lista) { blocos.push(lista); lista = null; } };
  for (const bruta of linhas) {
    const linha = bruta.replace(/^\s*#{1,6}\s+/, '').trimEnd();
    if (!linha.trim()) { fechaLista(); continue; }
    const item = ITEM.exec(linha);
    if (item) {
      lista = lista || { tipo: 'ul', itens: [] };
      lista.itens.push(segmentosInline(item[1]));
    } else {
      fechaLista();
      blocos.push({ tipo: 'p', partes: segmentosInline(linha.trim()) });
    }
  }
  fechaLista();
  return blocos;
}

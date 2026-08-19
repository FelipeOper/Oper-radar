const TIPOS_EMISSAO_PESADOS = new Set(['Caminhao', 'Onibus', 'Micro-onibus']);

export function categoriaDeTipo(tipo, mapaCategorias) {
  return mapaCategorias[tipo] || 'outros';
}

export function classificaEmissao(tipo, titulo, url, anoFabricacao) {
  if (!TIPOS_EMISSAO_PESADOS.has(String(tipo || ''))) {
    return { norma: null, origem: 'não aplicável', aplicavel: false };
  }

  const texto = `${titulo || ''} ${url || ''}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();

  if (/\b(?:E|EURO)\s*6\b|\b(?:PROCONVE\s*)?P8\b/.test(texto)) {
    return { norma: 'E6', origem: 'informado', aplicavel: true };
  }
  if (/\b(?:E|EURO)\s*5\b|\b(?:PROCONVE\s*)?P7\b/.test(texto)) {
    return { norma: 'E5', origem: 'informado', aplicavel: true };
  }

  const ano = Number(anoFabricacao);
  if (ano >= 2023) return { norma: 'E6', origem: 'inferido pelo ano', aplicavel: true };
  if (ano >= 2012 && ano <= 2021) return { norma: 'E5', origem: 'inferido pelo ano', aplicavel: true };
  if (ano === 2022) return { norma: null, origem: 'transição E5/E6', aplicavel: true };
  return { norma: null, origem: 'não identificada', aplicavel: true };
}

export function textoEmissao(classificacao) {
  if (!classificacao) return 'Não identificada';
  if (!classificacao.aplicavel) return 'Não aplicável';
  if (!classificacao.norma) return classificacao.origem || 'Não identificada';
  return `${classificacao.norma} · ${classificacao.origem}`;
}

export function rotuloTempoObservado(dias, status) {
  if (status === 'saida_detectada') return 'SAIU DO PORTAL';
  if (status === 'em_verificacao') return 'EM VERIFICAÇÃO';
  if (dias < 2) return 'NOVO NO RADAR';
  return `OBSERVADO HÁ ${dias}D`;
}

export function filtraOrdenaEstoque(itens, busca, status, ordem) {
  const termo = String(busca || '').trim().toLocaleLowerCase('pt-BR');
  const filtrados = (itens || []).filter(item => {
    if (status !== 'todos' && item.status !== status) return false;
    if (!termo) return true;
    const texto = [item.referencia_interna, item.marca, item.modelo, item.ano]
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase('pt-BR');
    return texto.includes(termo);
  });

  const ordenadores = {
    recente: (a, b) => String(b.data_entrada || '').localeCompare(String(a.data_entrada || '')),
    antigo: (a, b) => String(a.data_entrada || '').localeCompare(String(b.data_entrada || '')),
    preco_asc: (a, b) => Number(a.preco_anunciado || Infinity) - Number(b.preco_anunciado || Infinity),
    preco_desc: (a, b) => Number(b.preco_anunciado || -Infinity) - Number(a.preco_anunciado || -Infinity),
    modelo: (a, b) => `${a.marca || ''} ${a.modelo || ''}`.localeCompare(`${b.marca || ''} ${b.modelo || ''}`, 'pt-BR'),
  };
  return [...filtrados].sort(ordenadores[ordem] || ordenadores.recente);
}

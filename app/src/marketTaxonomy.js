export const CATEGORIAS_MERCADO = {
  caminhoes: { label: 'Caminhões', icone: '🚛', cor: '#F5A623' },
  implementos: { label: 'Implementos', icone: '🚚', cor: '#D9714F' },
  onibus_vans: { label: 'Ônibus, vans e motorhomes', icone: '🚌', cor: '#5B8AA6' },
  leves: { label: 'Carros e utilitários leves', icone: '🚗', cor: '#8A94A6' },
  agricolas: { label: 'Agrícolas', icone: '🌾', cor: '#3DD68C' },
  construcao: { label: 'Construção', icone: '🏗️', cor: '#FFB347' },
  pecas: { label: 'Peças', icone: '🔧', cor: '#B98CE0' },
  outros: { label: 'Outros', icone: '🌀', cor: '#6B7280' },
};

export const TIPO_PARA_CATEGORIA = {
  Caminhao: 'caminhoes',
  Implemento: 'implementos',
  'Carroceria-sobre-chassi': 'implementos',
  Trailer: 'implementos',
  Onibus: 'onibus_vans',
  'Micro-onibus': 'onibus_vans',
  Vans: 'onibus_vans',
  Motorhome: 'onibus_vans',
  Carro: 'leves',
  Utilitarios: 'leves',
  Trator: 'agricolas',
  'Trator-esteira': 'agricolas',
  'Micro-trator': 'agricolas',
  Plantadeira: 'agricolas',
  Colheitadeira: 'agricolas',
  'Plataforma-colheitadeira': 'agricolas',
  Pulverizador: 'agricolas',
  Semeadeira: 'agricolas',
  'Distribuidor-autopropelido': 'agricolas',
  'Forragem-e-feno': 'agricolas',
  Florestal: 'agricolas',
  'Pa-carregadeira': 'construcao',
  Escavadeira: 'construcao',
  'Retro-escavadeira': 'construcao',
  Motoniveladora: 'construcao',
  'Rolo-compactador': 'construcao',
  Guindaste: 'construcao',
  'Mini-carregadeira': 'construcao',
  'Auto-carregavel': 'construcao',
  'Mini-escavadeira': 'construcao',
  Empilhadeira: 'construcao',
  'Plataforma-elevatoria': 'construcao',
  Maquinas: 'construcao',
  Equipamentos: 'construcao',
  'Pecas-a-venda': 'pecas',
  Moto: 'outros',
  Imoveis: 'outros',
  Quadriciclo: 'outros',
  Nautico: 'outros',
};

const ROTULOS_TIPO = {
  Caminhao: 'Caminhões',
  Implemento: 'Implementos completos',
  'Carroceria-sobre-chassi': 'Carrocerias sobre chassi',
  Trailer: 'Trailers',
  Onibus: 'Ônibus',
  'Micro-onibus': 'Micro-ônibus',
  Vans: 'Vans',
  Motorhome: 'Motorhomes',
  Carro: 'Carros',
  Utilitarios: 'Utilitários leves',
  'Pecas-a-venda': 'Peças à venda',
};

const FILTROS_COMUNS = ['marca'];
export const FILTROS_POR_CATEGORIA = {
  todas: FILTROS_COMUNS,
  caminhoes: ['tipo', 'marca', 'carroceria', 'tracao', 'fipe'],
  implementos: ['tipo', 'marca', 'carroceria'],
  onibus_vans: ['tipo', 'marca', 'carroceria'],
  leves: ['tipo', 'marca', 'carroceria'],
  agricolas: ['tipo', 'marca'],
  construcao: ['tipo', 'marca'],
  pecas: ['tipo', 'marca'],
  outros: ['tipo', 'marca'],
};

export function categoriaDeTipo(tipo) {
  return TIPO_PARA_CATEGORIA[tipo] || 'outros';
}

export function rotuloTipo(tipo) {
  if (ROTULOS_TIPO[tipo]) return ROTULOS_TIPO[tipo];
  return String(tipo || '')
    .replaceAll('-', ' ')
    .replace(/\b\p{L}/gu, letra => letra.toLocaleUpperCase('pt-BR'));
}

export function filtrosDaCategoria(categoria) {
  return FILTROS_POR_CATEGORIA[categoria] || FILTROS_POR_CATEGORIA.todas;
}

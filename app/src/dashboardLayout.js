export const DASHBOARD_KPIS = [
  { id: 'revendas', label: 'Revendas no radar' },
  { id: 'anuncios', label: 'Anúncios ativos' },
  { id: 'saidas', label: 'Saídas detectadas' },
  { id: 'movimento', label: 'Movimento 48h' },
];

export const DASHBOARD_SECTIONS = [
  { id: 'feed', label: 'Movimento do mercado' },
  { id: 'modelos', label: 'Modelos mais anunciados' },
  { id: 'regioes', label: 'Regiões com mais saídas' },
  { id: 'lojas_novos', label: 'Lojas mais ativas' },
  { id: 'lojas_saidas', label: 'Lojas com mais saídas' },
];

const kpiIds = DASHBOARD_KPIS.map(item => item.id);
const sectionIds = DASHBOARD_SECTIONS.map(item => item.id);

export const DASHBOARD_PRESETS = {
  executivo: {
    id: 'executivo',
    label: 'Executivo',
    description: 'Resumo equilibrado para decisão diária.',
    kpis: ['revendas', 'anuncios', 'saidas', 'movimento'],
    sections: [
      { id: 'feed', size: 'wide' },
      { id: 'modelos', size: 'half' },
      { id: 'regioes', size: 'half' },
      { id: 'lojas_novos', size: 'half' },
      { id: 'lojas_saidas', size: 'half' },
    ],
  },
  comercial: {
    id: 'comercial',
    label: 'Comercial',
    description: 'Movimento, saídas e concorrentes primeiro.',
    kpis: ['saidas', 'movimento', 'anuncios'],
    sections: [
      { id: 'feed', size: 'wide' },
      { id: 'regioes', size: 'half' },
      { id: 'lojas_saidas', size: 'half' },
      { id: 'lojas_novos', size: 'half' },
      { id: 'modelos', size: 'half' },
    ],
  },
  enxuto: {
    id: 'enxuto',
    label: 'Enxuto',
    description: 'Somente os sinais essenciais do mercado.',
    kpis: ['anuncios', 'saidas', 'movimento'],
    sections: [
      { id: 'feed', size: 'wide' },
      { id: 'modelos', size: 'half' },
      { id: 'regioes', size: 'half' },
    ],
  },
};

export const DEFAULT_DASHBOARD_LAYOUT = cloneLayout(DASHBOARD_PRESETS.executivo);

function cloneLayout(layout) {
  return {
    preset: layout.id || layout.preset || 'personalizado',
    kpis: [...layout.kpis],
    sections: layout.sections.map(item => ({ ...item })),
  };
}

export function layoutFromPreset(presetId) {
  return cloneLayout(DASHBOARD_PRESETS[presetId] || DASHBOARD_PRESETS.executivo);
}

export function normalizeDashboardLayout(layout) {
  const source = layout && typeof layout === 'object' ? layout : DEFAULT_DASHBOARD_LAYOUT;
  const selectedKpis = Array.isArray(source.kpis)
    ? source.kpis.filter((id, index, list) => kpiIds.includes(id) && list.indexOf(id) === index)
    : [];
  const selectedSections = Array.isArray(source.sections)
    ? source.sections.reduce((items, item) => {
        const id = typeof item === 'string' ? item : item?.id;
        if (!sectionIds.includes(id) || items.some(current => current.id === id)) return items;
        items.push({ id, size: item?.size === 'wide' ? 'wide' : 'half' });
        return items;
      }, [])
    : [];

  if (!selectedKpis.length && !selectedSections.length) {
    return cloneLayout(DASHBOARD_PRESETS.executivo);
  }

  return {
    preset: DASHBOARD_PRESETS[source.preset] ? source.preset : 'personalizado',
    kpis: selectedKpis.length ? selectedKpis : [...DEFAULT_DASHBOARD_LAYOUT.kpis],
    sections: selectedSections.length ? selectedSections : DEFAULT_DASHBOARD_LAYOUT.sections.map(item => ({ ...item })),
  };
}

export function moveDashboardItem(items, index, direction) {
  const target = index + direction;
  if (index < 0 || target < 0 || target >= items.length) return [...items];
  const next = items.map(item => typeof item === 'object' ? { ...item } : item);
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

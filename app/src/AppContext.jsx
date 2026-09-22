import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { useSearchParams } from 'react-router';

const AppContext = createContext(null);
const FILTER_KEYS = ['periodo', 'comparacao', 'segmento', 'regiao', 'uf', 'marca', 'modelo', 'ano'];
const DEFAULT_FILTERS = Object.freeze({
  periodo: '30d',
  comparacao: 'anterior',
  segmento: 'caminhoes',
  regiao: 'brasil',
  uf: [],
  marca: '',
  modelo: '',
  ano: '',
});

function readFilters(params) {
  return {
    periodo: params.get('periodo') || DEFAULT_FILTERS.periodo,
    comparacao: params.get('comparacao') || DEFAULT_FILTERS.comparacao,
    segmento: params.get('segmento') || DEFAULT_FILTERS.segmento,
    regiao: params.get('regiao') || DEFAULT_FILTERS.regiao,
    uf: [...new Set(params.getAll('uf').flatMap(value => value.split(',')).map(value => value.trim().toUpperCase()).filter(Boolean))],
    marca: params.get('marca') || '',
    modelo: params.get('modelo') || '',
    ano: params.get('ano') || '',
  };
}

export function AppProvider({ children }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => readFilters(searchParams), [searchParams]);

  const setFilters = useCallback((patch, options) => {
    setSearchParams(previous => {
      const next = new URLSearchParams(previous);
      const updates = typeof patch === 'function' ? patch(readFilters(previous)) : patch;
      for (const key of FILTER_KEYS) {
        if (!Object.hasOwn(updates, key)) continue;
        next.delete(key);
        const value = updates[key];
        if (key === 'uf') {
          for (const uf of value || []) next.append('uf', String(uf).trim().toUpperCase());
        } else if (value != null && value !== '' && value !== DEFAULT_FILTERS[key]) {
          next.set(key, String(value));
        }
      }
      return next;
    }, options);
  }, [setSearchParams]);

  const value = useMemo(() => ({ filters, setFilters, resetFilters: options => setFilters(DEFAULT_FILTERS, options) }), [filters, setFilters]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext requer AppProvider');
  return context;
}

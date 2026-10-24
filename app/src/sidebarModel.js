/* Preferência do menu lateral: barra recolhida (só ícones) e grupos fechados (dropdown).
   Só lógica pura. O armazenamento entra por parâmetro e qualquer falha (bloqueado, ausente,
   valor corrompido) cai no padrão, para o menu nunca impedir a tela de abrir. */

export const CHAVE_SIDEBAR = 'oper-radar:sidebar';
export const PREFERENCIA_PADRAO = Object.freeze({ recolhida: false, fechados: Object.freeze([]) });

export function lePreferencia(storage) {
  try {
    const bruto = storage?.getItem?.(CHAVE_SIDEBAR);
    if (!bruto) return { recolhida: false, fechados: [] };
    const dados = JSON.parse(bruto);
    return {
      recolhida: dados?.recolhida === true,
      fechados: Array.isArray(dados?.fechados) ? dados.fechados.filter(item => typeof item === 'string') : [],
    };
  } catch {
    return { recolhida: false, fechados: [] };
  }
}

export function salvaPreferencia(storage, preferencia) {
  try {
    if (!storage?.setItem) return false;
    storage.setItem(CHAVE_SIDEBAR, JSON.stringify({ recolhida: preferencia.recolhida, fechados: [...preferencia.fechados] }));
    return true;
  } catch {
    return false;
  }
}

export const grupoAberto = (preferencia, idGrupo) => !preferencia.fechados.includes(idGrupo);

export function alternaGrupo(preferencia, idGrupo) {
  const fechados = grupoAberto(preferencia, idGrupo)
    ? [...preferencia.fechados, idGrupo]
    : preferencia.fechados.filter(id => id !== idGrupo);
  return { ...preferencia, fechados };
}

export const alternaRecolhida = preferencia => ({ ...preferencia, recolhida: !preferencia.recolhida });

/* Ao navegar para uma página, o grupo dela reabre: quem fechou um grupo e depois clica num atalho
   para uma tela dele não deve ficar sem ver onde está. Devolve o mesmo objeto se nada mudou. */
export function abreGrupoDaPagina(preferencia, nav, idPagina) {
  const item = nav.find(n => n.id === idPagina);
  if (!item || grupoAberto(preferencia, item.grupo)) return preferencia;
  return { ...preferencia, fechados: preferencia.fechados.filter(id => id !== item.grupo) };
}

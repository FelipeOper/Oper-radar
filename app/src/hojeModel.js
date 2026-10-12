/* Regras puras da tela Hoje: transformam a resposta da API em texto e navegacao.
   Sem React e sem rede, para poder ser testado com node:test. */

const brl = valor => valor == null ? null
  : Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

const pct = valor => `${Math.abs(Number(valor)).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;

export const ROTULO_CONFIANCA = {
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa',
  insuficiente: 'Insuficiente',
  parcial: 'Parcial',
};

export function rotuloConfianca(valor) {
  return ROTULO_CONFIANCA[String(valor || '').toLowerCase()] || String(valor || '—');
}

function tituloDoEvento(item) {
  const modelo = [item.marca, item.modelo].filter(Boolean).join(' ');
  if (modelo) return item.ano ? `${modelo} · ${item.ano}` : modelo;
  return item.titulo || 'Anúncio';
}

const local = item => [item.cidade, item.uf].filter(Boolean).join('/');

/* Item do feed -> { tipo, titulo, detalhe, quando }. Saida observada nunca e chamada de venda. */
export function formataItemFeed(item) {
  const partes = [];
  if (item.tipo === 'novo') {
    partes.push('Novo', local(item), brl(item.preco));
  } else if (item.tipo === 'preco') {
    const de = brl(item.preco_anterior);
    const para = brl(item.preco_novo);
    partes.push('Preço caiu', local(item), de && para ? `${de} → ${para}` : null,
      item.variacao_pct != null ? `−${pct(item.variacao_pct)}` : null);
  } else if (item.tipo === 'verificacao') {
    partes.push('Aguardando 2ª confirmação', local(item), 'ainda não é saída');
  } else {
    partes.push('Saída detectada', local(item), 'venda não confirmada');
  }
  return {
    tipo: item.tipo,
    anuncioId: item.anuncio_id,
    url: item.url || null,
    titulo: tituloDoEvento(item),
    detalhe: partes.filter(Boolean).join(' · '),
    quando: item.quando,
  };
}

/* Alerta do monitor de dados. Sem resposta valida, nao ha alerta: a interface nao deve
   afirmar "coleta em dia" quando nao sabe. */
export function resumoFrescor(frescor) {
  const itens = Array.isArray(frescor?.itens) ? frescor.itens : null;
  if (!itens || !frescor?.resumo) return null;
  const limite = frescor.limite_horas ?? 24;
  const linhas = [];
  itens.forEach(item => {
    if (item.status === 'sem_coleta') {
      linhas.push(`${item.uf}: nenhuma coleta bem-sucedida nos últimos 30 dias`);
    } else if (item.status === 'atrasada') {
      linhas.push(`${item.uf}: última coleta há ${item.horas} h (limite de ${limite} h)`);
    } else if (item.status === 'parcial') {
      linhas.push(`${item.uf}: ${item.revendas_coletadas_24h} de ${item.revendas} revendas coletadas nas últimas 24 h`);
    }
  });
  const { severidade, ufs, atrasada = 0, sem_coleta: semColeta = 0 } = frescor.resumo;
  const problemas = atrasada + semColeta;
  if (severidade === 'alta') {
    return {
      severidade,
      titulo: `Monitor de dados: coleta atrasada em ${problemas} ${problemas === 1 ? 'estado' : 'estados'}`,
      texto: 'Os números dessas regiões podem estar defasados.',
      linhas,
    };
  }
  if (severidade === 'media') {
    return { severidade, titulo: 'Monitor de dados: coleta parcial', texto: 'Parte das revendas ainda não foi coletada neste ciclo.', linhas };
  }
  return { severidade: 'ok', titulo: `Coleta em dia em ${ufs} ${ufs === 1 ? 'estado' : 'estados'}`, texto: '', linhas: [] };
}

/* Acao de um insight -> { page, context } para a navegacao do app. */
export function navegacaoDoInsight(acao) {
  if (!acao?.pagina) return null;
  const context = {};
  const origem = acao.contexto || {};
  if (origem.uf) context.uf = origem.uf;
  if (origem.marca && origem.modelo && origem.ano) {
    context.marca = origem.marca;
    context.modelo = origem.modelo;
    context.ano = String(origem.ano);
  }
  return { page: acao.pagina, context };
}

/* Regioes com mais saidas: barra proporcional ao maior valor da lista. */
export function linhasUfsSaidas(ufsSaidas, limite = 6) {
  const lista = (Array.isArray(ufsSaidas) ? ufsSaidas : []).filter(item => Number(item.saidas) > 0);
  const maximo = Math.max(1, ...lista.map(item => Number(item.saidas)));
  return lista.slice(0, limite).map(item => ({
    uf: item.uf,
    saidas: Number(item.saidas),
    ativos: Number(item.ativos || 0),
    proporcao: Number(item.saidas) / maximo,
  }));
}

const doisDigitos = n => String(n).padStart(2, '0');

/* "Hoje 09:30", "Ontem", "22/09". Eventos de dia inteiro (00:00, como as mudancas de preco
   materializadas por dia) mostram so a data. `agora` e injetavel para teste. */
export function rotuloQuando(quando, agora = new Date()) {
  if (!quando) return '';
  const data = new Date(String(quando).replace(' ', 'T'));
  if (Number.isNaN(data.getTime())) return '';
  const dia = d => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const ontem = new Date(agora); ontem.setDate(agora.getDate() - 1);
  const semHora = data.getHours() === 0 && data.getMinutes() === 0;
  const hora = `${doisDigitos(data.getHours())}:${doisDigitos(data.getMinutes())}`;
  if (dia(data) === dia(agora)) return semHora ? 'Hoje' : `Hoje ${hora}`;
  if (dia(data) === dia(ontem)) return semHora ? 'Ontem' : `Ontem ${hora}`;
  return `${doisDigitos(data.getDate())}/${doisDigitos(data.getMonth() + 1)}`;
}

const inteiro = valor => Number(valor).toLocaleString('pt-BR');

function textoAtualizacao(ultimaColeta) {
  if (!ultimaColeta) return null;
  const data = new Date(String(ultimaColeta).replace(' ', 'T'));
  if (Number.isNaN(data.getTime())) return null;
  return `${doisDigitos(data.getDate())}/${doisDigitos(data.getMonth() + 1)}/${data.getFullYear()} ${doisDigitos(data.getHours())}:${doisDigitos(data.getMinutes())}`;
}

/* Evidencia dos quatro KPIs da Hoje a partir de kpis.php. So usa campos que a API entrega;
   sem `kpis`, devolve objeto vazio (nenhum botao de evidencia aparece). */
export function evidenciaKpis(kpis) {
  if (!kpis) return {};
  const atualizacao = textoAtualizacao(kpis.ultima_coleta);
  const ciclo = kpis.ciclo_referencia ? `ciclo ${kpis.ciclo_referencia.janela}` : null;
  const revalidados = kpis.anuncios_ativos_revalidados ?? kpis.anuncios_ativos;
  const total = kpis.anuncios_ativos_total ?? kpis.anuncios_ativos;
  const saidasMes = kpis.saidas_detectadas_mes ?? kpis.vendas_estimadas_mes;
  return {
    revendas: {
      recorte: 'Todas as UFs monitoradas',
      periodo: 'Situação atual',
      valor: `${inteiro(kpis.revendas_monitoradas)} revendas monitoradas`,
      base: kpis.revendas_com_estoque != null ? `${inteiro(kpis.revendas_com_estoque)} com anúncio ativo` : null,
      atualizacao,
      explicacao: 'Revendas cadastradas no radar. Nem todas têm estoque ativo no momento.',
    },
    anuncios: {
      recorte: 'Todas as UFs monitoradas',
      periodo: ciclo ? `Estoque ativo · ${ciclo}` : 'Estoque ativo',
      valor: `${inteiro(revalidados)} anúncios revalidados`,
      base: kpis.anuncios_ativos_herdados
        ? `${inteiro(total)} ativos no total · ${inteiro(kpis.anuncios_ativos_herdados)} herdados`
        : `${inteiro(total)} ativos no total`,
      atualizacao,
      explicacao: 'Só conta como revalidado o anúncio cuja revenda teve coleta bem-sucedida no ciclo de referência. Herdado = ativo, mas ainda sem revalidação neste ciclo.',
    },
    saidas: {
      recorte: 'Todas as UFs monitoradas',
      periodo: 'Mês corrente',
      valor: `${inteiro(saidasMes)} saídas detectadas`,
      atualizacao,
      explicacao: 'Anúncio ausente em verificações consecutivas do portal. Saída observada não comprova venda.',
    },
    movimento: {
      recorte: 'Todas as UFs monitoradas',
      periodo: 'Últimas 48 horas',
      valor: `+${inteiro(kpis.entradas_48h ?? 0)} entradas · −${inteiro(kpis.saidas_48h ?? 0)} saídas`,
      atualizacao,
      explicacao: 'Entradas = anúncios vistos pela primeira vez. Saídas = ausência confirmada; não confirma venda.',
    },
  };
}

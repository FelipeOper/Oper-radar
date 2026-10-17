import React, { useState, useMemo } from 'react';
import { ArrowUpRight, ArrowDownRight, Gauge } from './icons.jsx';

export function SimuladorPage() {
  const [precoSimulado, setPrecoSimulado] = useState(75000);
  const [modoEstoque, setModoEstoque] = useState('estoque');

  // Dados simulados do mercado
  const dadosMercado = {
    meuEstoque: [
      { id: 1, titulo: 'VW Gol 1.0', ano: 2018, preco: 65000, idade: 45 },
      { id: 2, titulo: 'Fiat Uno 1.4', ano: 2017, preco: 55000, idade: 52 },
      { id: 3, titulo: 'Chevrolet Onix 1.0', ano: 2019, preco: 70000, idade: 38 },
    ],
    concorrentes: [
      { id: 101, titulo: 'VW Gol 1.0', ano: 2018, preco: 72000 },
      { id: 102, titulo: 'VW Gol 1.0', ano: 2018, preco: 69500 },
      { id: 103, titulo: 'VW Gol 1.0', ano: 2018, preco: 74000 },
      { id: 104, titulo: 'VW Gol 1.0', ano: 2018, preco: 76000 },
      { id: 105, titulo: 'VW Gol 1.0', ano: 2018, preco: 68000 },
    ],
    fipe: 71500,
  };

  const analise = useMemo(() => {
    const precoAtual = 65000;
    const delta = precoSimulado - precoAtual;
    const pctMudanca = ((delta / precoAtual) * 100).toFixed(1);

    // Ranking: quantos estão abaixo do preço simulado
    const abaixo = dadosMercado.concorrentes.filter(c => c.preco < precoSimulado).length;
    const total = dadosMercado.concorrentes.length;
    const posicao = total - abaixo;

    // Desvio FIPE
    const desvioFipe = precoSimulado - dadosMercado.fipe;
    const pctFipe = ((desvioFipe / dadosMercado.fipe) * 100).toFixed(1);

    return {
      precoAtual,
      delta,
      pctMudanca,
      posicao,
      total,
      abaixo,
      desvioFipe,
      pctFipe,
      competitivo: precoSimulado <= dadosMercado.fipe ? 'Abaixo da FIPE' : 'Acima da FIPE',
      competitivoClass: precoSimulado <= dadosMercado.fipe ? 'positivo' : 'alerta',
    };
  }, [precoSimulado]);

  return (
    <div className="oc-main oc-simulador-page">
      <div className="oc-simulador-header">
        <h2>Simulador de Preço</h2>
        <p>Ajuste o preço de seu anúncio e veja o impacto no mercado</p>
      </div>

      <div className="oc-simulador-grid">
        {/* Painel de entrada */}
        <div className="oc-simulador-entrada">
          <div className="oc-simulador-card">
            <h3>Preço Atual</h3>
            <div className="oc-simulador-valor">R$ {analise.precoAtual.toLocaleString('pt-BR')}</div>
          </div>

          <div className="oc-simulador-card">
            <h3>Simule um Novo Preço</h3>
            <input
              type="range"
              min={40000}
              max={120000}
              step={1000}
              value={precoSimulado}
              onChange={(e) => setPrecoSimulado(Number(e.target.value))}
              className="oc-simulador-slider"
            />
            <div className="oc-simulador-valor">R$ {precoSimulado.toLocaleString('pt-BR')}</div>
            <div className={`oc-simulador-delta ${analise.delta >= 0 ? 'positivo' : 'negativo'}`}>
              {analise.delta >= 0 ? '+' : ''} R$ {Math.abs(analise.delta).toLocaleString('pt-BR')} ({analise.pctMudanca}%)
            </div>
          </div>
        </div>

        {/* Métricas */}
        <div className="oc-simulador-metricas">
          <div className="oc-simulador-card">
            <h3>Posição no Mercado</h3>
            <div className="oc-simulador-metrica">
              <div className="oc-simulador-numero">{analise.posicao}º</div>
              <div className="oc-simulador-detalhe">de {analise.total} similares</div>
            </div>
            <div className="oc-simulador-barra">
              <div className="oc-simulador-barra-fill" style={{ width: `${(analise.posicao / analise.total) * 100}%` }} />
            </div>
          </div>

          <div className="oc-simulador-card">
            <h3>vs. FIPE</h3>
            <div className={`oc-simulador-metrica ${analise.competitivoClass}`}>
              <div className="oc-simulador-numero">{analise.competitivo}</div>
              <div className="oc-simulador-detalhe">{analise.pctFipe}% {analise.desvioFipe >= 0 ? 'acima' : 'abaixo'}</div>
            </div>
            <small>FIPE: R$ {dadosMercado.fipe.toLocaleString('pt-BR')}</small>
          </div>

          <div className="oc-simulador-card">
            <h3>Insight</h3>
            <div className="oc-simulador-insight">
              {precoSimulado <= 65000 && '✓ Preço mais agressivo, maior visibilidade'}
              {precoSimulado > 65000 && precoSimulado <= dadosMercado.fipe && '→ Na faixa de mercado'}
              {precoSimulado > dadosMercado.fipe && '⚠ Acima da FIPE, menos procurado'}
            </div>
          </div>
        </div>
      </div>

      {/* Comparadores */}
      <div className="oc-simulador-comparadores">
        <h3>Ranking de Preços (similares)</h3>
        <div className="oc-simulador-lista">
          {dadosMercado.concorrentes.map((c, i) => {
            const marocado = c.preco === precoSimulado;
            return (
              <div key={c.id} className={`oc-simulador-item ${marocado ? 'oc-simulador-item--destaque' : ''}`}>
                <div className="oc-simulador-item-rank">{i + 1}º</div>
                <div className="oc-simulador-item-info">
                  <div className="oc-simulador-item-titulo">{c.titulo}</div>
                  <div className="oc-simulador-item-ano">{c.ano}</div>
                </div>
                <div className="oc-simulador-item-preco">
                  R$ {c.preco.toLocaleString('pt-BR')}
                  {c.preco < precoSimulado && <ArrowDownRight size={14} className="oc-simulador-icon-down" />}
                  {c.preco > precoSimulado && <ArrowUpRight size={14} className="oc-simulador-icon-up" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { TrendingDown, Flame, AlertCircle } from './icons.jsx';
import { apiGet } from './apiClient.js';

export function RotineiroPage() {
  const [insights, setInsights] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    const carregar = async () => {
      try {
        const data = await apiGet('insights.php');
        setInsights(data);
      } catch (e) {
        setErro(e.message || 'Erro ao carregar insights');
      } finally {
        setCarregando(false);
      }
    };
    carregar();
  }, []);

  if (carregando) {
    return <div className="oc-main oc-rotineiro-page"><div className="oc-loading">Analisando seu mercado...</div></div>;
  }

  if (erro) {
    return <div className="oc-main oc-rotineiro-page"><div className="oc-erro">{erro}</div></div>;
  }

  return (
    <div className="oc-main oc-rotineiro-page">
      <div className="oc-rotineiro-header">
        <h2>Insight Rotineiro</h2>
        <p>Análise automática do seu mercado e recomendações diárias</p>
      </div>

      {insights?.por_tipo && (
        <section className="oc-rotineiro-secao">
          <h3>Tipos Mais Vendidos</h3>
          <div className="oc-rotineiro-grid">
            {insights.por_tipo.slice(0, 3).map((item, i) => (
              <div key={i} className="oc-rotineiro-card">
                <div className="oc-rotineiro-card-titulo">{item.tipo}</div>
                <div className="oc-rotineiro-card-numero">{item.anuncios}</div>
                <div className="oc-rotineiro-card-detalhe">anúncios ativos</div>
                {item.preco_medio && <div className="oc-rotineiro-card-preco">Preço médio: R$ {Math.round(item.preco_medio).toLocaleString('pt-BR')}</div>}
              </div>
            ))}
          </div>
        </section>
      )}

      {insights?.giro_revenda && (
        <section className="oc-rotineiro-secao">
          <h3>Revendas com Maior Movimento</h3>
          <div className="oc-rotineiro-lista">
            {insights.giro_revenda.slice(0, 5).map((item, i) => (
              <div key={i} className="oc-rotineiro-item">
                <div className="oc-rotineiro-item-rank">{i + 1}</div>
                <div className="oc-rotineiro-item-info">
                  <div className="oc-rotineiro-item-nome">{item.revenda}</div>
                  <div className="oc-rotineiro-item-meta">{item.cidade}, {item.uf}</div>
                </div>
                <div className="oc-rotineiro-item-saidas">
                  <Flame size={16} /> {item.saidas_detectadas} saídas
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {insights?.faixas_preco && (
        <section className="oc-rotineiro-secao">
          <h3>Distribuição de Preços</h3>
          <div className="oc-rotineiro-faixas">
            {insights.faixas_preco.map((faixa, i) => (
              <div key={i} className="oc-rotineiro-faixa">
                <div className="oc-rotineiro-faixa-label">{faixa.faixa}</div>
                <div className="oc-rotineiro-faixa-bar">
                  <div className="oc-rotineiro-faixa-fill" style={{ width: `${(faixa.anuncios / Math.max(...insights.faixas_preco.map(f => f.anuncios))) * 100}%` }} />
                </div>
                <div className="oc-rotineiro-faixa-count">{faixa.anuncios}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="oc-rotineiro-rodape">
        <AlertCircle size={18} />
        <p>Este insight é atualizado diariamente com base nos dados do seu mercado. Use-o para orientar decisões de precificação e estoque.</p>
      </div>
    </div>
  );
}

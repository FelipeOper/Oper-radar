import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const read = path => readFileSync(`${root}${path}`, 'utf8');

test('comparador resolve somente periodos permitidos e devolve janela explicita', () => {
  const contract = read('oper-radar-api/lib/query_contract.php');
  const endpoint = read('oper-radar-api/comparador.php');
  for (const periodo of ['7d', '30d', '90d', '180d', '12m']) {
    assert.match(contract, new RegExp(`'${periodo}'`));
  }
  assert.match(endpoint, /oper_periodo_contrato/);
  assert.match(endpoint, /AS entrada_periodo/);
  assert.match(endpoint, /'periodo' => \$periodo/);
});

test('paginacao keyset usa desempate por id e preserva fallback offset', () => {
  const endpoint = read('oper-radar-api/anuncios.php');
  assert.match(endpoint, /'recente'.*a\.id DESC/);
  assert.match(endpoint, /'mais_tempo'.*a\.id ASC/);
  assert.match(endpoint, /cursor_supported/);
  assert.match(endpoint, /proximo_cursor/);
  assert.match(endpoint, /\$limit \+ 1/);
  assert.match(endpoint, /pagination_mode.*cursor.*offset/);
});

test('grupo equivalente permanece opaco e inapto para recomendacao', () => {
  const contract = read('oper-radar-api/lib/equivalent_group.php');
  assert.match(contract, /'regras' => null/);
  assert.match(contract, /'calculavel' => false/);
  assert.match(contract, /'apto_para_recomendacao' => false/);
});

test('lista de ofertas envia o recorte exato de modelo e ano que o backend entende', () => {
  const app = read('app/src/App.jsx');
  const endpoint = read('oper-radar-api/anuncios.php');
  assert.match(app, /p\.set\('modelo', recorteModelo\.modelo\)/);
  assert.match(app, /p\.set\('ano_modelo', recorteModelo\.ano\)/);
  assert.match(endpoint, /\$_GET\['modelo'\]/);
  assert.match(endpoint, /\$_GET\['ano_modelo'\]/);
  assert.match(endpoint, /UPPER\(TRIM\(a\.marca\)\) = \?/);
  // mesma chave de ano do painel (mercado_painel.php agrupa por COALESCE(ano_final, ano_inicial))
  assert.match(endpoint, /COALESCE\(a\.ano_final, a\.ano_inicial\) = \?/);
  assert.match(read('oper-radar-api/mercado_painel.php'), /COALESCE\(a\.ano_final,a\.ano_inicial\) ano/);
});

test('Panorama do Mercado fala em desvio MEDIANO da FIPE em todo texto visivel (a media foi aposentada)', () => {
  const app = read('app/src/App.jsx');
  const modelo = read('app/src/mercadoModel.js');
  assert.match(app, /Desvio mediano da FIPE/);
  assert.doesNotMatch(app, /Desvio médio da FIPE/);
  assert.doesNotMatch(modelo, /Média do desvio/);
  assert.match(modelo, /desvio_fipe_mediano_pct/);
});

test('README e Insights nao voltam a chamar a mediana de media nem usam a media como fallback', () => {
  assert.doesNotMatch(read('app/README.md'), /desvio médio com ao menos/);
  assert.doesNotMatch(read('app/src/App.jsx'), /desvio_mediano_pct \?\? [^\n]*desvio_medio_pct/);
});

test('regra de ano-modelo minimo para o desvio FIPE aparece na API e nos textos ao usuario', () => {
  assert.match(read('oper-radar-api/lib/market_quality.php'), /OPER_RADAR_ANO_MINIMO_FIPE = 2006/);
  for (const arq of ['mercado_painel.php', 'lojistas.php', 'lojista_detalhe.php', 'insights.php']) {
    assert.match(read(`oper-radar-api/${arq}`), /COALESCE\(a\.ano_final,a\.ano_inicial\)/, `${arq} deve passar o ano-modelo`);
  }
  assert.match(read('app/src/mercadoModel.js'), /Modelos até 2005 ficam de fora/);
  assert.match(read('app/src/concorrenciaModel.js'), /modelos até 2005 não entram/);
});

test('todo agregador do desvio FIPE aplica o ano-modelo minimo (insights, kpis legado, hoje_stats)', () => {
  assert.match(read('oper-radar-api/insights.php'), /OPER_RADAR_ANO_MINIMO_FIPE \/\/ amostra e limites/);
  assert.match(read('oper-radar-api/kpis.php'), /mercado_sql_ano_minimo\(OPER_RADAR_ANO_MINIMO_FIPE\)/);
  assert.match(read('oper-radar-api/hoje_stats.php'), /'alto'\)|true, OPER_RADAR_ANO_MINIMO_FIPE\)/);
});

test('regra de carroceria (so cavalo/chassi) no desvio FIPE: API passa a carroceria e os textos avisam', () => {
  assert.match(read('oper-radar-api/lib/market_quality.php'), /function mercado_carroceria_comparavel_fipe/);
  for (const arq of ['mercado_painel.php', 'lojistas.php', 'lojista_detalhe.php', 'insights.php']) {
    assert.match(read(`oper-radar-api/${arq}`), /a\.carroceria/, `${arq} deve passar a carroceria`);
  }
  assert.match(read('oper-radar-api/kpis.php'), /mercado_sql_carroceria_comparavel\(\)/);
  assert.match(read('oper-radar-api/hoje_stats.php'), /mercado_sql_carroceria_comparavel\(\)/);
  assert.match(read('app/src/mercadoModel.js'), /caminhões com implemento/);
  assert.match(read('app/src/concorrenciaModel.js'), /caminhões com implemento também não/);
});

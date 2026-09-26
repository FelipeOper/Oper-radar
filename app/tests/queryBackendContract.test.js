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
  assert.match(read('app/src/mercadoModel.js'), /modelos até 2005/);
  assert.match(read('app/src/concorrenciaModel.js'), /modelos até 2005 não entram/);
});

test('todo agregador do desvio FIPE aplica o ano-modelo minimo (insights, kpis legado, hoje_stats)', () => {
  assert.match(read('oper-radar-api/insights.php'), /OPER_RADAR_ANO_MINIMO_FIPE, \/\/ amostra e limites/);
  assert.match(read('oper-radar-api/kpis.php'), /desvio_medio_fipe foi DESCONTINUADO/); // agregado legado retirado: nao diverge dos demais
  assert.match(read('oper-radar-api/hoje_stats.php'), /true, OPER_RADAR_ANO_MINIMO_FIPE, true\)/);
});

test('regra de carroceria (so cavalo/chassi) no desvio FIPE: API passa a carroceria e os textos avisam', () => {
  assert.match(read('oper-radar-api/lib/market_quality.php'), /function mercado_carroceria_comparavel_fipe/);
  for (const arq of ['mercado_painel.php', 'lojistas.php', 'lojista_detalhe.php', 'insights.php']) {
    assert.match(read(`oper-radar-api/${arq}`), /a\.carroceria, a\.tipo/, `${arq} deve passar a carroceria e o tipo`);
  }
  assert.match(read('oper-radar-api/hoje_stats.php'), /mercado_sql_carroceria_comparavel\(\)/);
  assert.match(read('app/src/mercadoModel.js'), /caminhões com implemento/);
  assert.match(read('app/src/concorrenciaModel.js'), /caminhões com implemento também não/);
});

test('Minha Loja: cartões e resumo leem só campos que minha_loja.php entrega (mediana nacional, amostra, FIPE)', () => {
  const modelo = read('app/src/minhaLojaModel.js');
  const api = read('oper-radar-api/lib/market_quality.php');
  for (const campo of ['preco_mediana_mercado', 'mercado_amostra_suficiente', 'anuncios_comparaveis', 'mercado_amostra_total', 'mercado_confianca', 'menor_preco_mercado']) {
    assert.match(api, new RegExp(campo), `${campo} deve existir em mercado_aplica_estatisticas`);
  }
  assert.match(modelo, /preco_mediana_mercado/);
  assert.doesNotMatch(read('app/src/minhaLojaModel.js') + read('app/src/MinhaLojaBlocos.jsx'), /preco_mediano_mercado/, 'campo real é preco_mediana_mercado');
  assert.match(read('oper-radar-api/minha_loja.php'), /mercado_aplica_estatisticas/);
  assert.match(read('app/src/App.jsx'), /<CartaoVeiculo /);
});

test('painel do veículo (Minha Loja) só mostra mediana e posicionamento com amostra suficiente', () => {
  const app = read('app/src/App.jsx');
  assert.match(app, /mercado\?\.amostra_suficiente && mercado\?\.preco_mediano > 0/);
  assert.match(app, /mercado\.amostra_suficiente \? fmtBRL\(mercado\.preco_mediano\) : 'Amostra insuficiente'/);
});

test('painel regional da Minha Loja não mostra mediana abaixo da amostra mínima', () => {
  assert.match(read('app/src/App.jsx'), /Number\(regiao\.comparaveis\) >= AMOSTRA_MINIMA_LOJA \? fmtBRL\(regiao\.preco_mediano\) : 'Amostra insuficiente'/);
  assert.match(read('oper-radar-api/lib/market_quality.php'), /OPER_RADAR_AMOSTRA_MINIMA = 5;/);
  assert.match(read('app/src/minhaLojaModel.js'), /AMOSTRA_MINIMA = 5;/);
});

test('DEMO: detalhe da Minha Loja devolve o veículo pedido pelo id, não sempre o primeiro', () => {
  assert.match(read('app/src/demoFixtures.js'), /estoque\.find\(i => String\(i\.id\) === String\(params\.get\('id'\)\)\)/);
});

test('Comparador: tela nova usa o contrato de comparador.php e impõe o mínimo de amostra no front', () => {
  const api = read('oper-radar-api/comparador.php') + read('oper-radar-api/lib/market_comparator.php');
  for (const campo of ['lado_a', 'lado_b', 'metricas', 'amostra_qualificada', 'entradas_periodo', 'saidas_periodo', 'dias_observados_media', 'estoque_pct', 'dias_observados_pct']) {
    assert.match(api, new RegExp(campo), `${campo} deve existir no contrato de comparador.php`);
  }
  assert.match(read('app/src/comparadorModel.js'), /AMOSTRA_MINIMA = 5;/);
  assert.match(read('oper-radar-api/lib/market_quality.php'), /OPER_RADAR_AMOSTRA_MINIMA = 5;/);
  assert.match(read('app/src/App.jsx'), /<PageComparador contexto=/);
  assert.doesNotMatch(read('app/src/ComparadorBlocos.jsx'), /precos\.media|Preço médio/, 'média bruta não entra no comparador');
});

test('DEMO do Comparador cobre os três modos de recorte e a tela ignora respostas de escolhas anteriores', () => {
  assert.match(read('app/src/demoFixtures.js'), /function perfilComparador\(marca, modelo, ano\)/);
  assert.match(read('app/src/ComparadorBlocos.jsx'), /let vigente = true;/);
  assert.match(read('app/src/ComparadorBlocos.jsx'), /return \(\) => \{ vigente = false; c\.abort\(\); \};/);
});

test('"O que comprar" por região: front consome oportunidades_compra.php e a API só orquestra a lib testada', () => {
  const api = read('oper-radar-api/oportunidades_compra.php');
  assert.match(api, /oper_compra_monta\(/);
  assert.match(api, /exige_autenticacao\(\)/);
  assert.match(api, /a\.tipo='Caminhao'/);
  assert.match(api, /e\.valor_novo_decimal>=e\.valor_anterior_decimal\*0\.5/);
  const lib = read('oper-radar-api/lib/oportunidade_compra.php');
  for (const campo of ['pontuacao', 'componentes', 'desvio_mediana_pct', 'desvio_fipe_pct', 'reduziu_30d', 'anuncios_elegiveis', 'indice']) {
    assert.match(lib, new RegExp(campo), `${campo} deve existir na saída da lib`);
  }
  assert.match(read('app/src/ComprarBlocos.jsx'), /oportunidades_compra\.php/);
  assert.match(read('app/src/App.jsx'), /<ComprarPorRegiao ufs=/);
  assert.doesNotMatch(read('app/src/ComprarBlocos.jsx') + read('app/src/comprarModel.js'), /anúncio ideal|melhor negócio|compre agora/i, 'sem promessa de "ideal"');
});

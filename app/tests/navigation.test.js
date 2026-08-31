import test from 'node:test';
import assert from 'node:assert/strict';
import {
  breadcrumbsFor,
  buildAppUrl,
  detectBasePath,
  normalizeAppContext,
  parseAppLocation,
  parseContext,
  serializeContext,
} from '../src/navigation.js';

test('rotas reais preservam o subdiretório de produção', () => {
  assert.equal(detectBasePath('/oper-radar/mercado'), '/oper-radar');
  assert.equal(detectBasePath('/oper-radar/'), '/oper-radar');
  assert.equal(buildAppUrl('mercado', {}, '/oper-radar'), '/oper-radar/mercado');
  assert.equal(buildAppUrl('hoje', {}, '/oper-radar'), '/oper-radar/');
});

test('refresh de deep link reconstrói página e contexto', () => {
  const route = parseAppLocation(
    '/oper-radar/mercado',
    '?periodo=90d&regiao=Sul&uf=sc&cidade=Joinville&segmento=caminhoes',
  );
  assert.equal(route.page, 'mercado');
  assert.equal(route.basePath, '/oper-radar');
  assert.deepEqual(route.context, {
    periodo: '90d', mercado: 'principal', regiao: 'Sul', uf: 'SC', cidade: 'Joinville',
    segmento: 'caminhoes', grupo: null, marca: null, modelo: null, ano: null,
    busca: null, comparacao: null,
  });
});

test('contexto é sanitizado e serializado sem defaults ruidosos', () => {
  const normalized = normalizeAppContext({
    periodo: 'invalido', mercado: 'invalido', uf: 'parana', ano: '1800',
    marca: '  DAF  ', modelo: ' XF   530 ', busca: '  cavalo   6x4  ',
  });
  assert.equal(normalized.periodo, '30d');
  assert.equal(normalized.mercado, 'principal');
  assert.equal(normalized.uf, 'todas');
  assert.equal(normalized.ano, null);
  assert.equal(normalized.modelo, 'XF 530');
  assert.equal(serializeContext(normalized), 'marca=DAF&modelo=XF+530&busca=cavalo+6x4');
  assert.equal(parseContext('?uf=pr&ano=2024').uf, 'PR');
});

test('rota desconhecida cai em Hoje e breadcrumb expõe o recorte geográfico', () => {
  assert.equal(parseAppLocation('/oper-radar/inexistente', '', '/oper-radar').page, 'hoje');
  assert.deepEqual(
    breadcrumbsFor('mercado', { uf: 'PR', cidade: 'Curitiba' }).map(item => item.label),
    ['OPER RADAR', 'Mercado', 'PR', 'Curitiba'],
  );
});

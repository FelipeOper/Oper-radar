import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canPublishRecommendation,
  classifyFreshness,
  normalizeConfidence,
  resolveDataState,
} from '../src/dataState.js';

const now = new Date('2026-08-31T12:00:00-03:00');

test('freshness diferencia dado atual, atrasado, obsoleto e desconhecido', () => {
  assert.equal(classifyFreshness('2026-08-31T09:00:00-03:00', { now }), 'fresh');
  assert.equal(classifyFreshness('2026-08-31T00:00:00-03:00', { now }), 'delayed');
  assert.equal(classifyFreshness('2026-08-29T12:00:00-03:00', { now }), 'stale');
  assert.equal(classifyFreshness('invalido', { now }), 'unknown');
});

test('estado universal prioriza permissão, conexão, erro e carregamento', () => {
  assert.equal(resolveDataState({ forbidden: true, error: true }), 'forbidden');
  assert.equal(resolveDataState({ offline: true }), 'offline');
  assert.equal(resolveDataState({ error: true }), 'error');
  assert.equal(resolveDataState({ loading: true }), 'loading');
  assert.equal(resolveDataState({ stale: true }), 'stale');
  assert.equal(resolveDataState({ count: 0 }), 'empty');
  assert.equal(resolveDataState({ count: 12 }), 'ready');
});

test('recomendação numérica é bloqueada sem amostra ou confiança', () => {
  assert.equal(normalizeConfidence('alto', 12), 'alta');
  assert.equal(normalizeConfidence('medio', 12), 'media');
  assert.equal(normalizeConfidence('alto', 0), 'insuficiente');
  assert.equal(canPublishRecommendation('alto', 12), true);
  assert.equal(canPublishRecommendation('insuficiente', 12), false);
  assert.equal(canPublishRecommendation('alto', 0), false);
});

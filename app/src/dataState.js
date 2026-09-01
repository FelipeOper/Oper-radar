export const DATA_STATES = Object.freeze([
  'loading', 'ready', 'empty', 'error', 'stale', 'forbidden', 'offline',
]);

export const FRESHNESS_STATES = Object.freeze(['fresh', 'delayed', 'stale', 'unknown']);
export const CONFIDENCE_STATES = Object.freeze(['alta', 'media', 'baixa', 'insuficiente']);

export function classifyFreshness(value, options = {}) {
  const collectedAt = value instanceof Date ? value : new Date(value);
  const now = options.now instanceof Date ? options.now : new Date(options.now || Date.now());
  if (Number.isNaN(collectedAt.getTime()) || Number.isNaN(now.getTime())) return 'unknown';
  const ageHours = Math.max(0, (now.getTime() - collectedAt.getTime()) / 3600000);
  const freshHours = Number(options.freshHours ?? 6);
  const delayedHours = Number(options.delayedHours ?? 24);
  if (ageHours <= freshHours) return 'fresh';
  if (ageHours <= delayedHours) return 'delayed';
  return 'stale';
}

export function normalizeConfidence(value, sampleSize = null) {
  if (sampleSize != null && Number(sampleSize) <= 0) return 'insuficiente';
  const normalized = String(value || '').trim().toLowerCase();
  const aliases = { alto: 'alta', alta: 'alta', medio: 'media', média: 'media', media: 'media', baixo: 'baixa', baixa: 'baixa' };
  return aliases[normalized] || 'insuficiente';
}

export function resolveDataState({ loading = false, error = false, forbidden = false, offline = false, stale = false, count = null } = {}) {
  if (forbidden) return 'forbidden';
  if (offline) return 'offline';
  if (error) return 'error';
  if (loading) return 'loading';
  if (stale) return 'stale';
  if (count != null && Number(count) === 0) return 'empty';
  return 'ready';
}

export function canPublishRecommendation(confidence, sampleSize) {
  return normalizeConfidence(confidence, sampleSize) !== 'insuficiente' && Number(sampleSize) > 0;
}

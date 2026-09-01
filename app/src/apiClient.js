export const API_BASE_URL = 'https://agenciaoper.com.br/oper-radar-api';

function abortError() {
  return new DOMException('A requisicao foi cancelada.', 'AbortError');
}

export function createApiClient({ baseUrl = API_BASE_URL, fetchImpl = fetch, now = Date.now } = {}) {
  const cache = new Map();
  const inflight = new Map();

  function release(entry) {
    entry.consumers = Math.max(0, entry.consumers - 1);
    if (entry.consumers === 0 && !entry.settled) {
      entry.controller.abort();
      if (inflight.get(entry.url) === entry) inflight.delete(entry.url);
    }
  }

  function attach(entry, signal) {
    entry.consumers += 1;
    return new Promise((resolve, reject) => {
      let done = false;
      const finish = callback => value => {
        if (done) return;
        done = true;
        signal?.removeEventListener('abort', onAbort);
        release(entry);
        callback(value);
      };
      const onAbort = () => finish(reject)(abortError());
      if (signal?.aborted) return onAbort();
      signal?.addEventListener('abort', onAbort, { once: true });
      entry.promise.then(finish(resolve), finish(reject));
    });
  }

  async function parseResponse(response) {
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(payload.erro || 'Nao foi possivel consultar a API.');
      error.codigo = payload.codigo;
      error.status = response.status;
      error.payload = payload;
      throw error;
    }
    return payload;
  }

  function get(path, { signal, ttlMs = 15000, useCache = true } = {}) {
    const url = `${baseUrl}/${String(path).replace(/^\/+/, '')}`;
    if (signal?.aborted) return Promise.reject(abortError());
    const cached = cache.get(url);
    if (useCache && cached && cached.expiresAt > now()) return Promise.resolve(cached.value);

    let entry = inflight.get(url);
    if (!entry) {
      const controller = new AbortController();
      entry = { url, controller, consumers: 0, settled: false, promise: null };
      entry.promise = fetchImpl(url, { signal: controller.signal, credentials: 'same-origin' })
        .then(parseResponse)
        .then(value => {
          if (useCache && ttlMs > 0) cache.set(url, { value, expiresAt: now() + ttlMs });
          return value;
        })
        .finally(() => {
          entry.settled = true;
          if (inflight.get(url) === entry) inflight.delete(url);
        });
      inflight.set(url, entry);
    }
    return attach(entry, signal);
  }

  function clear(path) {
    if (!path) {
      cache.clear();
      return;
    }
    cache.delete(`${baseUrl}/${String(path).replace(/^\/+/, '')}`);
  }

  return { get, clear };
}

export const apiClient = createApiClient();
export const apiGet = (path, options) => apiClient.get(path, options);

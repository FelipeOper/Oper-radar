import test from 'node:test';
import assert from 'node:assert/strict';
import { createApiClient } from '../src/apiClient.js';

const response = value => ({ ok: true, status: 200, json: async () => value });

test('consultas GET concorrentes compartilham a mesma requisicao', async () => {
  let chamadas = 0;
  let resolver;
  const fetchImpl = () => {
    chamadas += 1;
    return new Promise(resolve => { resolver = resolve; });
  };
  const client = createApiClient({ baseUrl: '/api', fetchImpl });
  const primeira = client.get('facetas.php');
  const segunda = client.get('facetas.php');
  assert.equal(chamadas, 1);
  resolver(response({ total: 12 }));
  assert.deepEqual(await Promise.all([primeira, segunda]), [{ total: 12 }, { total: 12 }]);
});

test('cache respeita a janela de validade', async () => {
  let chamadas = 0;
  let relogio = 1000;
  const client = createApiClient({
    baseUrl: '/api', now: () => relogio,
    fetchImpl: async () => response({ chamada: ++chamadas }),
  });
  assert.equal((await client.get('mercado.php', { ttlMs: 50 })).chamada, 1);
  assert.equal((await client.get('mercado.php', { ttlMs: 50 })).chamada, 1);
  relogio += 51;
  assert.equal((await client.get('mercado.php', { ttlMs: 50 })).chamada, 2);
});

test('cancelar um consumidor nao interrompe os demais', async () => {
  let resolver;
  const client = createApiClient({
    baseUrl: '/api',
    fetchImpl: () => new Promise(resolve => { resolver = resolve; }),
  });
  const controller = new AbortController();
  const cancelada = client.get('anuncios.php', { signal: controller.signal });
  const preservada = client.get('anuncios.php');
  controller.abort();
  await assert.rejects(cancelada, error => error.name === 'AbortError');
  resolver(response({ anuncios: [] }));
  assert.deepEqual(await preservada, { anuncios: [] });
});

test('cancelar o unico consumidor aborta a requisicao subjacente', async () => {
  let sinal;
  const client = createApiClient({
    baseUrl: '/api',
    fetchImpl: (_url, options) => {
      sinal = options.signal;
      return new Promise((_resolve, reject) => {
        sinal.addEventListener('abort', () => reject(new DOMException('cancelada', 'AbortError')));
      });
    },
  });
  const controller = new AbortController();
  const consulta = client.get('anuncios.php', { signal: controller.signal });
  controller.abort();
  await assert.rejects(consulta, error => error.name === 'AbortError');
  assert.equal(sinal.aborted, true);
});

test('nova consulta nao reutiliza requisicao que acabou de ser abortada', async () => {
  let chamadas = 0;
  const client = createApiClient({
    baseUrl: '/api',
    fetchImpl: (_url, { signal }) => {
      chamadas += 1;
      if (chamadas === 2) return Promise.resolve(response({ recuperada: true }));
      return new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => reject(new DOMException('cancelada', 'AbortError')));
      });
    },
  });
  const controller = new AbortController();
  const cancelada = client.get('facetas.php', { signal: controller.signal });
  controller.abort();
  const recuperada = client.get('facetas.php');
  await assert.rejects(cancelada, error => error.name === 'AbortError');
  assert.deepEqual(await recuperada, { recuperada: true });
  assert.equal(chamadas, 2);
});

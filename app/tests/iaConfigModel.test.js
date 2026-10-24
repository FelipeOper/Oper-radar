import test from 'node:test';
import assert from 'node:assert/strict';
import { mascaraChave, podeConfigurarIa, resumoEmUso, validaFormularioIa } from '../src/iaConfigModel.js';

test('só administrador configura a IA', () => {
  assert.equal(podeConfigurarIa('admin'), true);
  assert.equal(podeConfigurarIa('ADMIN'), true);
  assert.equal(podeConfigurarIa('gestor'), false);
  assert.equal(podeConfigurarIa(undefined), false);
});

test('a chave nunca aparece inteira: só os 4 últimos', () => {
  assert.equal(mascaraChave('ab12'), '•••••••• ab12');
  assert.equal(mascaraChave(null), 'não configurada');
});

test('formulário: chave obrigatória na primeira vez, opcional depois', () => {
  assert.match(validaFormularioIa({ jaConfigurado: false, chave: '' }), /chave/i);
  assert.equal(validaFormularioIa({ jaConfigurado: true, chave: '' }), null);
  assert.match(validaFormularioIa({ jaConfigurado: false, chave: 'curta' }), /inválida/);
  assert.match(validaFormularioIa({ jaConfigurado: false, chave: 'tem espaco no meio' }), /inválida/);
  assert.equal(validaFormularioIa({ jaConfigurado: false, chave: 'sk-abcdef123456' }), null);
});

test('formulário: provedor compatível exige https e modelo', () => {
  const base = { pedeUrl: true, jaConfigurado: true, chave: '' };
  assert.match(validaFormularioIa({ ...base, baseUrl: 'http://x.com/v1', modelo: 'm' }), /https/);
  assert.match(validaFormularioIa({ ...base, baseUrl: '', modelo: 'm' }), /https/);
  assert.match(validaFormularioIa({ ...base, baseUrl: 'https://openrouter.ai/api/v1', modelo: ' ' }), /modelo/);
  assert.equal(validaFormularioIa({ ...base, baseUrl: 'https://openrouter.ai/api/v1', modelo: 'meta/llama' }), null);
});

test('resumo do provedor em uso', () => {
  const lista = [{ provedor: 'gemini', rotulo: 'Gemini (Google)' }];
  assert.equal(resumoEmUso(null, lista).ativo, false);
  assert.equal(resumoEmUso({ provedor: 'gemini', modelo: 'gemini-2.0-flash', origem: 'tela' }, lista).texto, 'Em uso: Gemini (Google) · gemini-2.0-flash');
  assert.match(resumoEmUso({ provedor: 'anthropic', modelo: 'm', origem: 'ambiente' }, lista).texto, /chave do servidor/);
});

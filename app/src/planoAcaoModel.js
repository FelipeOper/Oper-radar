/* Plano de ação: dado de mercado diz "o que"; esta lista registra "se foi feito". Regras puras (sem React,
   testável). Ações ficam só no navegador (localStorage) — nenhuma delas é enviada ao servidor. Cada ação
   criada a partir de um insight guarda a evidência e a origem (docs/oper-radar-redesign/MIGRACAO_DEMO_PARA_REAL.md:
   "Plano de ação ligado à evidência: cada ação nasce de um insight e guarda a métrica de origem"). */
import { urlSegura } from './comprarModel.js';

export const CHAVE_ARMAZENAMENTO = 'oper-radar-acoes';
export const ORIGENS = ['Manual', 'Mercado', 'Minha Loja', 'Concorrência', 'Oportunidades', 'Análise', 'FIPE'];
const TITULO_MAX = 120;
const EVIDENCIA_MAX = 400;

const novoId = () => `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/* Só http/https (mesma regra do link do anúncio em comprarModel.js) ou um caminho interno do próprio app.
   "//host" é protocol-relative (o navegador resolve para https://host, externo) — nunca é caminho interno
   mesmo começando com "/"; exige um único "/" inicial. */
function hrefSeguro(href) {
  const v = typeof href === 'string' ? href.trim() : '';
  if (v === '') return '';
  if (v.startsWith('/') && !v.startsWith('//')) return v;
  return urlSegura(v) || '';
}

/* Normaliza uma ação vinda do localStorage (ou recém-criada): nunca confia no que está salvo.
   Aceita o formato antigo ({texto, feita}) e migra para o atual ({titulo, done, origem, evidencia, href}). */
export function normalizaAcao(bruto) {
  if (!bruto || typeof bruto !== 'object') return null;
  const titulo = String(bruto.titulo ?? bruto.texto ?? '').trim().slice(0, TITULO_MAX);
  if (!titulo) return null;
  const origem = ORIGENS.includes(bruto.origem) ? bruto.origem : 'Manual';
  return {
    id: bruto.id != null ? String(bruto.id) : novoId(),
    titulo,
    origem,
    evidencia: String(bruto.evidencia ?? '').trim().slice(0, EVIDENCIA_MAX),
    href: hrefSeguro(bruto.href),
    done: Boolean(bruto.done ?? bruto.feita),
    criadaEm: bruto.criadaEm && !Number.isNaN(Date.parse(bruto.criadaEm)) ? bruto.criadaEm : new Date().toISOString(),
  };
}

export const normalizaAcoes = lista => (Array.isArray(lista) ? lista.map(normalizaAcao).filter(Boolean) : []);

/* Monta uma ação nova (manual ou vinda de um insight, com evidência e link para conferir a origem). */
export function montaAcao({ titulo, origem = 'Manual', evidencia = '', href = '' }) {
  return normalizaAcao({ id: novoId(), titulo, origem, evidencia, href, done: false, criadaEm: new Date().toISOString() });
}

export function carregaAcoes() {
  try {
    return normalizaAcoes(JSON.parse(localStorage.getItem(CHAVE_ARMAZENAMENTO) || '[]'));
  } catch {
    return [];
  }
}

export const EVENTO_MUDOU = 'oper-radar-acoes-mudou';

/* Dispara EVENTO_MUDOU após salvar: o "storage" nativo do navegador só avisa outras abas, nunca a própria —
   é assim que o badge de pendentes na sidebar (fora da página do Plano de ação) se atualiza na mesma aba. */
export function salvaAcoes(lista) {
  try {
    localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(lista));
  } catch { /* localStorage indisponível (modo privado, storage cheio): a ação segue só na sessão atual. */ }
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(EVENTO_MUDOU));
}

export function separaPendentesFeitas(acoes) {
  return { pendentes: acoes.filter(a => !a.done), feitas: acoes.filter(a => a.done) };
}

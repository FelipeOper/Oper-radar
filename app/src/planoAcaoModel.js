/* Plano de ação: dado de mercado diz "o que"; esta lista registra "se foi feito". Regras puras (sem React,
   testável). Ações ficam só no navegador (localStorage) — nenhuma delas é enviada ao servidor. Cada ação
   criada a partir de um insight guarda a evidência e a origem (docs/oper-radar-redesign/MIGRACAO_DEMO_PARA_REAL.md:
   "Plano de ação ligado à evidência: cada ação nasce de um insight e guarda a métrica de origem"). */
import { urlSegura } from './comprarModel.js';

export const CHAVE_ARMAZENAMENTO = 'oper-radar-acoes';
export const ORIGENS = ['Manual', 'Mercado', 'Minha Loja', 'Concorrência', 'Oportunidades', 'Análise', 'FIPE'];

// Escopo por usuário: sem isso, duas contas no mesmo navegador (dono/gerente/supervisor num computador
// compartilhado) leem e escrevem a MESMA lista — inclusive dados reais de estoque que "Criar ação" da
// Minha Loja passou a guardar (achado do Codex). definirUsuarioAtivo() é chamado por RadarApp toda vez que
// a sessão muda, de forma síncrona no corpo do componente (não em useEffect: o efeito do pai só roda depois
// do filho montar, tarde demais pro primeiro carregaAcoes() da própria página).
let usuarioAtivo = null;
export function definirUsuarioAtivo(usuarioId) {
  const novo = usuarioId != null ? String(usuarioId) : null;
  if (novo === usuarioAtivo) return;
  usuarioAtivo = novo;
  fallbackEmMemoria = null; // fallback é por sessão de uso, nunca deve atravessar pra outra conta
}
function chaveAtual() {
  return usuarioAtivo ? `${CHAVE_ARMAZENAMENTO}:${usuarioAtivo}` : CHAVE_ARMAZENAMENTO;
}
const TITULO_MAX = 120;
const EVIDENCIA_MAX = 400;
// Sorteada a cada carga do módulo: se a base fosse um literal fixo, um href malicioso poderia embutir esse
// mesmo texto ("//oper-radar.internal/x") e a comparação de origem abaixo bateria mesmo sendo externo na
// origem REAL da página (achado do Codex). Ninguém de fora consegue adivinhar essa string pra forjar.
const ORIGEM_INTERNA = `http://oper-radar-interno-${Math.random().toString(36).slice(2)}.invalid`;

const novoId = () => `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/* Um "/" sozinho não basta: "//evil.example" (protocol-relative) e "/\evil.example" (o navegador trata "\" como "/" na
   resolução de URL, WHATWG) também começam com "/" e abrem outro domínio. Normaliza "\" pra "/" e rejeita "//" de cara —
   isso sozinho já barra os dois casos, sem depender de a comparação de origem abaixo não ser burlável. A comparação
   contra ORIGEM_INTERNA fica como segunda camada, pra qualquer outra forma de a resolução de URL mudar de origem. */
function ehCaminhoInterno(v) {
  const normalizado = v.replace(/\\/g, '/');
  if (normalizado.startsWith('//')) return false;
  try {
    return new URL(normalizado, ORIGEM_INTERNA).origin === ORIGEM_INTERNA;
  } catch {
    return false;
  }
}

/* Só http/https (mesma regra do link do anúncio em comprarModel.js) ou um caminho interno do próprio app. */
function hrefSeguro(href) {
  const v = typeof href === 'string' ? href.trim() : '';
  if (v === '') return '';
  if (v.startsWith('/') && ehCaminhoInterno(v)) return v;
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

// Fallback só em memória (dura a sessão da aba, nunca é persistido): quando localStorage falha (modo privado, storage
// cheio), guarda aqui a última lista bem-sucedida NA INTENÇÃO. Sem isso, criarAcao() grava, navega para o Plano de
// ação, a página remonta do zero lendo localStorage de novo — e a ação recém-criada simplesmente não existiria em
// lugar nenhum (achado do Codex: perda silenciosa). Limpo assim que uma gravação real funciona de novo.
let fallbackEmMemoria = null;

export const EVENTO_MUDOU = 'oper-radar-acoes-mudou';

/* Dispara EVENTO_MUDOU após salvar: o "storage" nativo do navegador só avisa outras abas, nunca a própria —
   é assim que o badge de pendentes na sidebar (fora da página do Plano de ação) se atualiza na mesma aba.
   Devolve false quando o localStorage falhou (o chamador pode avisar o usuário); a lista em si não se perde
   graças ao fallback em memória usado por carregaAcoes(). */
export function salvaAcoes(lista) {
  let ok = true;
  try {
    localStorage.setItem(chaveAtual(), JSON.stringify(lista));
    fallbackEmMemoria = null;
  } catch {
    ok = false;
    fallbackEmMemoria = lista;
  }
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(EVENTO_MUDOU));
  return ok;
}

export function carregaAcoes() {
  if (fallbackEmMemoria !== null) return normalizaAcoes(fallbackEmMemoria);
  try {
    const bruto = localStorage.getItem(chaveAtual());
    return bruto !== null ? normalizaAcoes(JSON.parse(bruto)) : [];
  } catch {
    return [];
  }
}

// Sem migração automática da chave antiga sem escopo: a lista legada pode já ter sido escrita por MAIS de
// uma conta num navegador compartilhado (era exatamente o problema — não existia separação antes desta
// correção), então "atribuir pra quem logar primeiro" não restaura a titularidade certa, só congela a
// mistura permanentemente numa conta que pode não ser a dona de tudo ali (achado do Codex no round 2: a
// migração automática vazava ações/evidências de estoque de uma conta pra outra). A chave antiga fica
// inerte — nenhuma conta volta a lê-la automaticamente; nada é apagado, então uma importação manual futura
// continua possível se o responsável quiser decidir a titularidade caso a caso.

export function separaPendentesFeitas(acoes) {
  return { pendentes: acoes.filter(a => !a.done), feitas: acoes.filter(a => a.done) };
}

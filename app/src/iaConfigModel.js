// Regras da tela "Inteligência artificial" (Configurações). Sem React, para testar em node.

export function podeConfigurarIa(papel) {
  return String(papel || '').toLowerCase() === 'admin';
}

export function mascaraChave(chaveFinal) {
  return chaveFinal ? `•••••••• ${chaveFinal}` : 'não configurada';
}

// Mensagem de erro do formulário, ou null quando pode enviar.
export function validaFormularioIa({ pedeUrl, jaConfigurado, chave, modelo, baseUrl }) {
  const c = String(chave || '').trim();
  if (!jaConfigurado && !c) return 'Cole a chave da API do provedor.';
  if (c && (c.length < 8 || /\s/.test(c))) return 'A chave parece inválida: sem espaços e com pelo menos 8 caracteres.';
  if (pedeUrl) {
    if (!/^https:\/\/[^\s/]+/i.test(String(baseUrl || '').trim())) return 'Informe o endereço da API começando com https://';
    if (!String(modelo || '').trim()) return 'Informe o nome do modelo.';
  }
  return null;
}

// Resume o provedor em uso para a faixa do topo da seção.
export function resumoEmUso(emUso, provedores = []) {
  if (!emUso) return { ativo: false, texto: 'Nenhum provedor ativo — o Analista IA está desligado.' };
  const rotulo = provedores.find(p => p.provedor === emUso.provedor)?.rotulo || emUso.provedor;
  const origem = emUso.origem === 'ambiente' ? ' (chave do servidor)' : '';
  return { ativo: true, texto: `Em uso: ${rotulo} · ${emUso.modelo}${origem}` };
}

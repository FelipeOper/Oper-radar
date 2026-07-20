<?php
/**
 * OPER RADAR — API: Analista IA
 * POST analista.php  body: { "messages": [{"role":"user","content":"..."}] }
 *
 * Agente de análise de mercado que conversa com o gestor/diretor. A cada pergunta,
 * ele recebe um RESUMO REAL do banco (KPIs, giro por revenda, concentrações, anúncios
 * maduros) e responde com base nesses dados — não em achismo.
 *
 * REQUISITO: preencher ANTHROPIC_API_KEY no config.php (chave da API da Anthropic,
 * criada em console.anthropic.com — o custo das chamadas é da conta do dono da chave).
 *
 * NOTA DE SEGURANÇA (honesta): este endpoint é público como os demais. Qualquer pessoa
 * que descobrir a URL pode gastar créditos da sua chave. Para o piloto interno tudo bem;
 * antes de abrir o app para fora, a Fase 4 (autenticação) precisa proteger este endpoint.
 */
require_once __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Allow-Methods: POST');
    exit;
}

if (!defined('ANTHROPIC_API_KEY') || ANTHROPIC_API_KEY === '') {
    http_response_code(503);
    envia_json(['erro' => 'chave_nao_configurada',
        'mensagem' => 'Defina ANTHROPIC_API_KEY no config.php do servidor para ativar o Analista.']);
}

$body = json_decode(file_get_contents('php://input'), true);
$messages = $body['messages'] ?? [];
if (!$messages) { http_response_code(400); envia_json(['erro' => 'sem_mensagens']); }
$messages = array_slice($messages, -12); // janela de contexto: últimas 12 trocas

/* ---- monta o contexto real a partir do banco ---- */
$conn = conecta();
function linhaUnica(mysqli $c, string $sql): array { $r = $c->query($sql); return $r ? ($r->fetch_assoc() ?: []) : []; }
function linhas(mysqli $c, string $sql): array { $out = []; $r = $c->query($sql); if ($r) while ($row = $r->fetch_assoc()) $out[] = $row; return $out; }

$kpi = linhaUnica($conn, "SELECT
    (SELECT COUNT(*) FROM revenda) revendas,
    (SELECT COUNT(*) FROM anuncio WHERE status='ativo') ativos,
    (SELECT COUNT(*) FROM anuncio WHERE status='removido_confirmado'
        AND data_remocao >= DATE_FORMAT(NOW(), '%Y-%m-01')) saidas_mes,
    (SELECT MAX(timestamp) FROM execucao_coleta) ultima_coleta");

$topMarcas = linhas($conn, "SELECT marca, COUNT(*) n, ROUND(AVG(preco)) preco_medio FROM anuncio
    WHERE status='ativo' AND marca IS NOT NULL GROUP BY marca ORDER BY n DESC LIMIT 8");
$topCidades = linhas($conn, "SELECT r.cidade, r.uf, COUNT(*) n FROM anuncio a JOIN revenda r ON r.id=a.revenda_id
    WHERE a.status='ativo' GROUP BY r.cidade,r.uf ORDER BY n DESC LIMIT 8");
$giro = linhas($conn, "SELECT r.nome, SUM(a.status='removido_confirmado') saidas, SUM(a.status='ativo') ativos,
    ROUND(AVG(CASE WHEN a.status='ativo' THEN DATEDIFF(NOW(), a.primeira_vez_visto) END)) idade_media
    FROM revenda r JOIN anuncio a ON a.revenda_id=r.id GROUP BY r.id HAVING ativos>5
    ORDER BY saidas DESC, ativos DESC LIMIT 10");
$maduros = linhas($conn, "SELECT a.titulo, a.preco, r.nome revenda, r.cidade,
    DATEDIFF(NOW(), a.primeira_vez_visto) dias FROM anuncio a JOIN revenda r ON r.id=a.revenda_id
    WHERE a.status='ativo' ORDER BY a.primeira_vez_visto ASC LIMIT 10");

$ufs = linhas($conn, "SELECT r.uf,COUNT(*) ativos FROM anuncio a JOIN revenda r ON r.id=a.revenda_id
    WHERE a.status='ativo' GROUP BY r.uf ORDER BY ativos DESC");

$contexto = "DADOS ATUAIS DO OPER RADAR (coleta nacional em expansão no portal Caminhões e Carretas):\n"
    . "KPIs: {$kpi['revendas']} revendas monitoradas, {$kpi['ativos']} anúncios ativos, "
    . "{$kpi['saidas_mes']} saídas detectadas este mês (ausências confirmadas após duas coletas; não comprovam venda). Última coleta: {$kpi['ultima_coleta']}.\n\n"
    . "TOP MARCAS (ativos | preço médio): " . implode('; ', array_map(fn($m) => "{$m['marca']}: {$m['n']} anúncios, R$ " . number_format((float)$m['preco_medio'], 0, ',', '.'), $topMarcas)) . "\n\n"
    . "COBERTURA ATUAL: " . implode('; ', array_map(fn($u) => "{$u['uf']}: {$u['ativos']} ativos", $ufs)) . "\n\n"
    . "TOP CIDADES POR OFERTA: " . implode('; ', array_map(fn($c2) => "{$c2['cidade']}/{$c2['uf']}: {$c2['n']}", $topCidades)) . "\n\n"
    . "MOVIMENTO POR REVENDA (saídas detectadas | estoque ativo | idade média do estoque em dias): "
    . implode('; ', array_map(fn($g) => "{$g['nome']}: {$g['saidas']}s/{$g['ativos']}a/" . ($g['idade_media'] ?? '?') . "d", $giro)) . "\n\n"
    . "ANÚNCIOS HÁ MAIS TEMPO NO AR (candidatos a negociação): "
    . implode('; ', array_map(fn($m2) => "{$m2['titulo']} ({$m2['revenda']}, {$m2['cidade']}, {$m2['dias']}d, R$ " . number_format((float)$m2['preco'], 0, ',', '.') . ")", $maduros));

$system = "Você é o Analista do OPER RADAR, plataforma de inteligência de mercado da Agência Oper para "
    . "o setor de caminhões, carretas e implementos no Brasil. Você conversa com gestores e diretores de "
    . "revendas de veículos pesados. Seu papel: transformar os dados reais abaixo em análise acionável — "
    . "planos de ação de vendas, priorização de estoque, oportunidades de compra/arbitragem, leitura de "
    . "concorrência. Seja direto, concreto e proponha próximos passos práticos (quem faz o quê). Quando o "
    . "dado disponível não sustentar uma conclusão, diga isso explicitamente em vez de inventar. Os dados "
    . "cobrem somente os estados listados no contexto, com coleta 2x/dia. A FIPE e o histórico ainda estão "
    . "amadurecendo; diferencie saída detectada de venda comprovada e considere isso nas recomendações.\n\n" . $contexto;

/* ---- chama a API da Anthropic ---- */
$payload = json_encode([
    'model' => 'claude-sonnet-4-5',
    'max_tokens' => 1200,
    'system' => $system,
    'messages' => $messages,
], JSON_UNESCAPED_UNICODE);

$ch = curl_init('https://api.anthropic.com/v1/messages');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $payload,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'x-api-key: ' . ANTHROPIC_API_KEY,
        'anthropic-version: 2023-06-01',
    ],
    CURLOPT_TIMEOUT => 60,
]);
$resposta = curl_exec($ch);
$http = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($resposta === false || $http >= 400) {
    http_response_code(502);
    envia_json(['erro' => 'falha_anthropic', 'status' => $http, 'detalhe' => substr((string)$resposta, 0, 400)]);
}

$dados = json_decode($resposta, true);
$texto = '';
foreach (($dados['content'] ?? []) as $bloco) {
    if (($bloco['type'] ?? '') === 'text') { $texto .= $bloco['text']; }
}
envia_json(['resposta' => $texto]);

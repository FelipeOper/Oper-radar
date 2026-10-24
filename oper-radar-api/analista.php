<?php
/**
 * OPER RADAR — API: Analista IA
 * POST analista.php  body: { "messages": [{"role":"user","content":"..."}] }
 *
 * Agente de análise de mercado que conversa com o gestor/diretor. A cada pergunta,
 * ele recebe um RESUMO REAL do banco (KPIs, movimento por revenda, concentrações e
 * tempo observado) e responde com base nesses dados — não em achismo.
 *
 * REQUISITO: um provedor de IA configurado em Configurações > Inteligência artificial (Claude, GPT, Gemini ou
 * outro compativel com OpenAI). Reserva: ANTHROPIC_API_KEY em .oper-radar.env. O custo das chamadas é da conta
 * dona da chave. Nunca colar a chave no config.php: esse arquivo é versionado no GitHub público do projeto.
 *
 * Protegido pela Fase 4 (autenticação) — exige sessão válida, como os demais endpoints.
 */
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/lib/ia_provedores.php';
require_once __DIR__ . '/lib/market_quality.php';
require_once __DIR__ . '/lib/escopo_setor.php';
require_once __DIR__ . '/lib/analista_contexto.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Allow-Methods: POST');
    exit;
}

inicia_sessao_oper_radar();
exige_autenticacao();

$conn = conecta();
$cfgIa = ia_config_ativa($conn);
if (!$cfgIa) {
    http_response_code(503);
    envia_json(['erro' => 'chave_nao_configurada',
        'mensagem' => 'Configure um provedor de IA em Configurações > Inteligência artificial para ativar o Analista.']);
}

$body = json_decode(file_get_contents('php://input'), true);
$messages = $body['messages'] ?? [];
if (!$messages) { http_response_code(400); envia_json(['erro' => 'sem_mensagens']); }
$messages = array_slice($messages, -12); // janela de contexto: últimas 12 trocas

/* ---- monta o contexto real a partir do banco ---- */
function linhaUnica(mysqli $c, string $sql): array { $r = $c->query($sql); return $r ? ($r->fetch_assoc() ?: []) : []; }
// Resumo geral so de caminhoes + carretas: agro, construcao e leves poluiriam marcas, cidades e totais.
$tipoP = oper_escopo_sql('principal', 'tipo');
$tipoPA = oper_escopo_sql('principal', 'a.tipo');
function linhas(mysqli $c, string $sql): array { $out = []; $r = $c->query($sql); if ($r) while ($row = $r->fetch_assoc()) $out[] = $row; return $out; }

$kpi = linhaUnica($conn, "SELECT
    (SELECT COUNT(*) FROM revenda) revendas,
    (SELECT COUNT(*) FROM anuncio WHERE status='ativo' AND $tipoP) ativos,
    (SELECT COUNT(*) FROM anuncio WHERE status='removido_confirmado'
        AND data_remocao >= DATE_FORMAT(NOW(), '%Y-%m-01')) saidas_mes,
    (SELECT MAX(timestamp) FROM execucao_coleta) ultima_coleta");

$topMarcas = linhas($conn, "SELECT marca, COUNT(*) n, ROUND(AVG(preco)) preco_medio FROM anuncio
    WHERE status='ativo' AND $tipoP AND marca IS NOT NULL GROUP BY marca ORDER BY n DESC LIMIT 8");
$topCidades = linhas($conn, "SELECT r.cidade, r.uf, COUNT(*) n FROM anuncio a JOIN revenda r ON r.id=a.revenda_id
    WHERE a.status='ativo' AND $tipoPA GROUP BY r.cidade,r.uf ORDER BY n DESC LIMIT 8");
$movimento = linhas($conn, "SELECT r.nome, SUM(a.status='removido_confirmado') saidas, SUM(a.status='ativo') ativos,
    ROUND(AVG(CASE WHEN a.status='ativo' THEN DATEDIFF(NOW(), a.primeira_vez_visto) END)) idade_media
    FROM revenda r JOIN anuncio a ON a.revenda_id=r.id GROUP BY r.id HAVING ativos>5
    ORDER BY saidas DESC, ativos DESC LIMIT 10");
$maisTempoObservados = linhas($conn, "SELECT a.titulo, a.preco, r.nome revenda, r.cidade,
    DATEDIFF(NOW(), a.primeira_vez_visto) dias FROM anuncio a JOIN revenda r ON r.id=a.revenda_id
    WHERE a.status='ativo' ORDER BY a.primeira_vez_visto ASC LIMIT 10");

$ufs = linhas($conn, "SELECT r.uf,COUNT(*) ativos FROM anuncio a JOIN revenda r ON r.id=a.revenda_id
    WHERE a.status='ativo' AND $tipoPA GROUP BY r.uf ORDER BY ativos DESC");

$contexto = "DADOS ATUAIS DO OPER RADAR (coleta nacional em expansão no portal Caminhões e Carretas):\n"
    . "KPIs: {$kpi['revendas']} revendas monitoradas, {$kpi['ativos']} anúncios ativos de caminhões e carretas, "
    . "{$kpi['saidas_mes']} saídas detectadas este mês (ausências confirmadas após duas coletas; não comprovam venda). Última coleta: {$kpi['ultima_coleta']}.\n\n"
    . "TOP MARCAS (ativos | preço médio): " . implode('; ', array_map(fn($m) => "{$m['marca']}: {$m['n']} anúncios, R$ " . number_format((float)$m['preco_medio'], 0, ',', '.'), $topMarcas)) . "\n\n"
    . "COBERTURA ATUAL: " . implode('; ', array_map(fn($u) => "{$u['uf']}: {$u['ativos']} ativos", $ufs)) . "\n\n"
    . "TOP CIDADES POR OFERTA: " . implode('; ', array_map(fn($c2) => "{$c2['cidade']}/{$c2['uf']}: {$c2['n']}", $topCidades)) . "\n\n"
    . "MOVIMENTO POR REVENDA (saídas detectadas | estoque ativo | idade média do estoque em dias): "
    . implode('; ', array_map(fn($g) => "{$g['nome']}: {$g['saidas']}s/{$g['ativos']}a/" . ($g['idade_media'] ?? '?') . "d", $movimento)) . "\n\n"
    . "ANÚNCIOS OBSERVADOS HÁ MAIS TEMPO (o tempo começa na primeira observação pelo Radar e, sozinho, não indica urgência ou disposição para negociar): "
    . implode('; ', array_map(fn($m2) => "{$m2['titulo']} ({$m2['revenda']}, {$m2['cidade']}, {$m2['dias']}d observados, R$ " . number_format((float)$m2['preco'], 0, ',', '.') . ")", $maisTempoObservados));

/* ---- dados do modelo que o gestor perguntou (marca + modelo + ano), direto dos anuncios ---- */
function ultimas_falas_do_usuario(array $mensagens, int $quantas): array {
    $falas = [];
    foreach (array_reverse($mensagens) as $m) {
        if (($m['role'] ?? '') === 'user') { $falas[] = (string)($m['content'] ?? ''); if (count($falas) >= $quantas) break; }
    }
    return $falas; // da mais recente para a mais antiga
}
$blocoModelo = '';
try {
    $marcas = array_column(linhas($conn, "SELECT DISTINCT marca FROM anuncio WHERE tipo='Caminhao' AND marca IS NOT NULL AND marca<>''"), 'marca');
    // Pergunta de seguimento ("e em SP?") herda o modelo das falas anteriores: junta ate 3 falas do usuario.
    $falas = ultimas_falas_do_usuario($messages, 3);
    $marcaPerg = null;
    $tokens = ['ano' => null, 'numeros' => [], 'palavras' => []];
    for ($i = 1; $i <= count($falas) && !$marcaPerg; $i++) {
        $texto = implode(' ', array_reverse(array_slice($falas, 0, $i)));
        $marcaPerg = analista_marca_da_pergunta($texto, $marcas);
        if ($marcaPerg) $tokens = analista_tokens_pergunta($texto);
    }
    if ($marcaPerg && ($tokens['numeros'] || $tokens['palavras'])) {
        $st = $conn->prepare("SELECT DISTINCT modelo FROM anuncio WHERE tipo='Caminhao' AND marca=? AND modelo IS NOT NULL LIMIT 3000");
        $st->bind_param('s', $marcaPerg);
        $st->execute();
        $vocab = analista_vocabulario_modelo(array_column($st->get_result()->fetch_all(MYSQLI_ASSOC), 'modelo'));
        $filtro = analista_filtro_modelo($tokens, $vocab);
        $chave = $filtro['numeros'][0] ?? ($filtro['palavras'][0] ?? null);
        if ($chave !== null) {
            $like = '%' . $chave . '%';
            $st = $conn->prepare("SELECT a.id, a.titulo, a.modelo, a.preco, COALESCE(a.ano_final, a.ano_inicial) AS ano, a.status,
                    DATEDIFF(NOW(), a.primeira_vez_visto) AS dias, r.uf, r.cidade, f.preco AS preco_fipe, a.fipe_match_confianca AS confianca,
                    (a.status='removido_confirmado') AS saida_90d, " . mercado_col_conjunto() . "
                FROM anuncio a LEFT JOIN revenda r ON r.id=a.revenda_id LEFT JOIN fipe_preco f ON f.id=a.fipe_preco_id
                WHERE a.tipo='Caminhao' AND a.marca=? AND (a.titulo LIKE ? OR a.modelo LIKE ?)
                  AND (a.status='ativo' OR (a.status='removido_confirmado' AND a.data_remocao >= DATE_SUB(NOW(), INTERVAL 90 DAY)))
                LIMIT 4000");
            $st->bind_param('sss', $marcaPerg, $like, $like);
            $st->execute();
            $casados = [];
            $conjuntos = 0;
            foreach ($st->get_result()->fetch_all(MYSQLI_ASSOC) as $a) {
                if (!analista_casa_modelo((string)$a['titulo'], (string)$a['modelo'], $filtro)) continue;
                if ((int)($a['conjunto'] ?? 0) === 1) { $conjuntos++; continue; }
                $casados[] = $a;
            }
            $rotulo = $marcaPerg . ' ' . implode(' ', array_merge($filtro['palavras'], $filtro['numeros']));
            $blocoModelo = analista_bloco_modelo($rotulo, $tokens['ano'], $casados)
                . ($conjuntos ? "- $conjuntos anuncio(s) de conjunto (cavalo + carreta) foram excluidos por distorcerem o preco.\n" : '');
        }
    }
} catch (Throwable $e) {
    error_log('analista contexto do modelo: ' . $e->getMessage());
}

$system = "Você é o Analista do OPER RADAR, plataforma de inteligência de mercado da Agência Oper para "
    . "o setor de caminhões, carretas e implementos no Brasil. Você conversa com gestores e diretores de "
    . "revendas de veículos pesados. Seu papel: transformar os dados reais abaixo em análise acionável — "
    . "planos de ação de vendas, priorização de estoque, oportunidades de compra/arbitragem, leitura de "
    . "concorrência. Seja direto, concreto e proponha próximos passos práticos (quem faz o quê). Quando o "
    . "dado disponível não sustentar uma conclusão, diga isso explicitamente em vez de inventar. Os dados "
    . "cobrem somente os estados listados no contexto, com coleta 2x/dia. A FIPE e o histórico ainda estão "
    . "amadurecendo; diferencie saída detectada de venda comprovada e considere isso nas recomendações.\n\n"
    . "REGRAS DE RESPOSTA: (1) Use SOMENTE números que estão nos dados abaixo; nunca invente preço, faixa, média ou estimativa. "
    . "Se o dado não existe (ex.: nenhum anúncio daquele ano-modelo), diga isso claramente e explique o que falta. "
    . "(2) Quando houver o bloco 'DADOS DO MODELO PERGUNTADO', ele é a base da resposta: cite quantidade de anúncios, faixa de preço, "
    . "posição frente à FIPE, tempo observado e estados, e diga de qual amostra vem cada número. "
    . "(3) Para vender um veículo, proponha um preço-alvo e um piso só se a amostra permitir (5 ou mais anúncios com preço); "
    . "com amostra menor, diga que é indicativo. Peça o que falta (km, estado, versão da cabine, ano de fabricação). "
    . "(4) Seja curto: até cerca de 200 palavras, em tópicos, sem repetir a pergunta nem listar conselhos genéricos de anúncio.\n\n"
    . ($blocoModelo !== '' ? $blocoModelo . "\n" : '') . $contexto;

/* ---- chama o provedor configurado ---- */
$r = ia_chama($cfgIa, $system, $messages, 1200);
if (!$r['ok']) {
    http_response_code(502);
    envia_json(['erro' => 'falha_provedor_ia', 'mensagem' => $r['erro'], 'status' => $r['status']]);
}
// 'analise' e mantido porque o ChatPage e o balao antigos liam esse campo.
envia_json(['resposta' => $r['texto'], 'analise' => $r['texto'], 'provedor' => $cfgIa['provedor']]);

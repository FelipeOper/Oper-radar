<?php
/** Contratos puros de período e paginação da API analítica. */

function oper_periodos_suportados(): array {
    return [
        '7d' => ['dias' => 7, 'rotulo' => '7 dias'],
        '30d' => ['dias' => 30, 'rotulo' => '30 dias'],
        '90d' => ['dias' => 90, 'rotulo' => '90 dias'],
        '180d' => ['dias' => 180, 'rotulo' => '180 dias'],
        '12m' => ['dias' => 365, 'rotulo' => '12 meses'],
    ];
}

function oper_periodo_contrato($valor, string $padrao = '30d'): array {
    $periodos = oper_periodos_suportados();
    $chave = strtolower(trim((string)$valor));
    if (!isset($periodos[$chave])) $chave = isset($periodos[$padrao]) ? $padrao : '30d';
    return ['codigo' => $chave] + $periodos[$chave];
}

function oper_query_fingerprint(array $fonte, array $ignorar = ['cursor', 'offset', 'limit']): string {
    foreach ($ignorar as $chave) unset($fonte[$chave]);
    ksort($fonte);
    return substr(hash('sha256', http_build_query($fonte, '', '&', PHP_QUERY_RFC3986)), 0, 24);
}

function oper_base64url_encode(string $valor): string {
    return rtrim(strtr(base64_encode($valor), '+/', '-_'), '=');
}

function oper_base64url_decode(string $valor): ?string {
    if ($valor === '' || !preg_match('/^[A-Za-z0-9_-]+$/', $valor)) return null;
    $padding = strlen($valor) % 4;
    if ($padding) $valor .= str_repeat('=', 4 - $padding);
    $decodificado = base64_decode(strtr($valor, '-_', '+/'), true);
    return $decodificado === false ? null : $decodificado;
}

function oper_cursor_encode(string $fingerprint, string $ordem, string $valor, int $id): string {
    return oper_base64url_encode(json_encode([
        'v' => 1,
        'q' => $fingerprint,
        'o' => $ordem,
        's' => $valor,
        'id' => $id,
    ], JSON_UNESCAPED_UNICODE));
}

function oper_cursor_decode($cursor, string $fingerprint, string $ordem): ?array {
    $json = oper_base64url_decode(trim((string)$cursor));
    if ($json === null) return null;
    $dados = json_decode($json, true);
    if (!is_array($dados) || ($dados['v'] ?? null) !== 1) return null;
    if (!isset($dados['q'], $dados['o'], $dados['s'], $dados['id'])) return null;
    if (!hash_equals($fingerprint, (string)$dados['q']) || (string)$dados['o'] !== $ordem) return null;
    $id = filter_var($dados['id'], FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
    $valor = trim((string)$dados['s']);
    if (!$id || $valor === '' || strlen($valor) > 80) return null;
    return ['valor' => $valor, 'id' => (int)$id];
}

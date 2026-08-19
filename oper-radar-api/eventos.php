<?php
/** Linha do tempo de fatos observados. Não transforma saída em venda. */
require_once __DIR__ . '/config.php';
exige_autenticacao();
$conn = conecta();

$existe = $conn->query("SELECT COUNT(*) total FROM information_schema.TABLES
    WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='anuncio_evento'");
if (!$existe || (int)($existe->fetch_assoc()['total'] ?? 0) === 0) {
    http_response_code(503);
    envia_json([
        'erro' => 'A trilha de eventos ainda não foi preparada no banco.',
        'codigo' => 'EVENTOS_NAO_MIGRADOS',
    ]);
}

$anuncioId = max(0, (int)($_GET['anuncio_id'] ?? 0));
if ($anuncioId > 0) {
    $st = $conn->prepare("SELECT id, anuncio_id, tipo_evento, ocorrido_em,
                                dia_referencia, valor_anterior_decimal,
                                valor_novo_decimal, status_anterior, status_novo,
                                evidencia, origem, regra_versao
                         FROM anuncio_evento
                         WHERE anuncio_id=?
                         ORDER BY ocorrido_em DESC, id DESC LIMIT 200");
    $st->bind_param('i', $anuncioId);
    $st->execute();
    $res = $st->get_result();
    $eventos = [];
    while ($row = $res->fetch_assoc()) {
        $row['id'] = (int)$row['id'];
        $row['anuncio_id'] = (int)$row['anuncio_id'];
        foreach (['valor_anterior_decimal', 'valor_novo_decimal'] as $campo) {
            $row[$campo] = $row[$campo] !== null ? (float)$row[$campo] : null;
        }
        $row['evidencia'] = json_decode((string)$row['evidencia'], true) ?: [];
        $eventos[] = $row;
    }
    $st->close();
    envia_json(['anuncio_id' => $anuncioId, 'eventos' => $eventos]);
}

$dias = min(max((int)($_GET['dias'] ?? 30), 1), 365);
$inicio = (new DateTimeImmutable('today'))->modify("-{$dias} days")->format('Y-m-d');
$st = $conn->prepare("SELECT dia_referencia, tipo_evento, COUNT(*) quantidade
                      FROM anuncio_evento
                      WHERE dia_referencia >= ?
                      GROUP BY dia_referencia, tipo_evento
                      ORDER BY dia_referencia DESC, tipo_evento");
$st->bind_param('s', $inicio);
$st->execute();
$res = $st->get_result();
$serie = [];
while ($row = $res->fetch_assoc()) {
    $row['quantidade'] = (int)$row['quantidade'];
    $serie[] = $row;
}
$st->close();
envia_json([
    'dias' => $dias,
    'serie' => $serie,
    'nota' => 'Saída detectada significa ausência confirmada no portal, não venda comprovada.',
]);

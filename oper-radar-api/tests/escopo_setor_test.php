<?php
require_once __DIR__ . '/../lib/escopo_setor.php';

function verifica($condicao, string $mensagem): void {
    if (!$condicao) throw new RuntimeException($mensagem);
}

verifica(oper_escopo_setor(null) === 'principal', 'padrao e principal');
verifica(oper_escopo_setor('TODOS') === 'todos', 'todos');
verifica(oper_escopo_setor('agricolas') === 'agricolas', 'categoria conhecida');
verifica(oper_escopo_setor("x'; DROP TABLE anuncio;--") === 'principal', 'valor desconhecido cai no padrao');

$principal = oper_escopo_sql('principal', 'a.tipo');
verifica(str_starts_with($principal, 'a.tipo IN (') && str_contains($principal, "'Caminhao'") && str_contains($principal, "'Carreta'"), 'principal tem caminhao e carreta');
verifica(!str_contains($principal, 'Trator') && !str_contains($principal, 'Plantadeira'), 'principal nao tem agro');
verifica(oper_escopo_sql('todos') === '', 'todos nao filtra');
verifica(str_contains(oper_escopo_sql('agricolas'), "'Trator'"), 'agricolas filtra trator');
verifica(str_contains(oper_escopo_sql('outros', 'a.tipo'), 'IS NULL OR a.tipo NOT IN'), 'outros e o complemento');

$por = oper_contagem_por_setor([
    ['tipo' => 'Caminhao', 'n' => 11584], ['tipo' => 'Carreta', 'n' => 3770], ['tipo' => 'Trator', 'n' => 3208],
    ['tipo' => 'Plantadeira', 'n' => 1463], ['tipo' => 'Aviao', 'n' => 5], ['tipo' => null, 'n' => 3],
]);
verifica($por['caminhoes'] === 11584 && $por['implementos'] === 3770, 'caminhao e carreta separados');
verifica($por['agricolas'] === 4671, 'agro somado');
verifica($por['outros'] === 8, 'tipo fora do mapa e NULL vao para outros');
verifica(array_key_first($por) === 'caminhoes', 'ordenado do maior para o menor');

echo "escopo_setor_test ok\n";

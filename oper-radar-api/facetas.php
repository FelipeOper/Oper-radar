<?php
/**
 * OPER RADAR — API: contagens reais para os filtros do Mercado
 * GET facetas.php
 * Devolve, direto do banco: contagem por categoria, lista de cidades e de revendas.
 * O app usa isso pros chips e dropdowns mostrarem numeros do banco inteiro,
 * nao apenas do que foi carregado na tela.
 */
require_once __DIR__ . '/config.php';
$conn = conecta();

$CATEGORIA_TIPOS = [
  'caminhoes'   => ['Caminhao','Motorhome'],
  'implementos' => ['Implemento','Carroceria-sobre-chassi','Trailer'],
  'onibus_vans' => ['Onibus','Micro-onibus','Vans','Utilitarios'],
  'leves'       => ['Carro'],
  'agricolas'   => ['Trator','Trator-esteira','Micro-trator','Plantadeira','Colheitadeira',
                    'Plataforma-colheitadeira','Pulverizador','Semeadeira',
                    'Distribuidor-autopropelido','Forragem-e-feno','Florestal'],
  'construcao'  => ['Pa-carregadeira','Escavadeira','Retro-escavadeira','Motoniveladora',
                    'Rolo-compactador','Guindaste','Mini-carregadeira','Auto-carregavel',
                    'Mini-escavadeira','Empilhadeira','Plataforma-elevatoria','Maquinas','Equipamentos'],
  'pecas'       => ['Pecas-a-venda'],
  'outros'      => ['Moto','Imoveis','Quadriciclo','Nautico'],
];

// Contagem por tipo (uma consulta), depois soma nas categorias
$porTipo = [];
$r = $conn->query("SELECT tipo, COUNT(*) n FROM anuncio WHERE tipo IS NOT NULL GROUP BY tipo");
while ($row = $r->fetch_assoc()) $porTipo[$row['tipo']] = (int)$row['n'];

$categorias = [];
$somaConhecida = 0;
foreach ($CATEGORIA_TIPOS as $cat => $tipos) {
    $n = 0;
    foreach ($tipos as $t) { $n += $porTipo[$t] ?? 0; }
    $categorias[$cat] = $n;
    $somaConhecida += $n;
}
// Tipos que existem no banco mas nao estao mapeados caem em 'outros'
$totalGeral = array_sum($porTipo);
$categorias['outros'] += max(0, $totalGeral - $somaConhecida);

// Subtipos por categoria (pro dropdown de subtipo respeitar a categoria escolhida)
$subtipos = [];
foreach ($CATEGORIA_TIPOS as $cat => $tipos) {
    $subtipos[$cat] = [];
    foreach ($tipos as $t) {
        if (!empty($porTipo[$t])) $subtipos[$cat][] = ['tipo' => $t, 'n' => $porTipo[$t]];
    }
}

$cidades = [];
$r = $conn->query("SELECT r.cidade, COUNT(*) n FROM anuncio a JOIN revenda r ON r.id=a.revenda_id
                   GROUP BY r.cidade ORDER BY r.cidade");
while ($row = $r->fetch_assoc()) $cidades[] = ['cidade' => $row['cidade'], 'n' => (int)$row['n']];

$revendas = [];
$r = $conn->query("SELECT r.nome, COUNT(*) n FROM anuncio a JOIN revenda r ON r.id=a.revenda_id
                   GROUP BY r.id ORDER BY r.nome");
while ($row = $r->fetch_assoc()) $revendas[] = ['nome' => $row['nome'], 'n' => (int)$row['n']];

envia_json([
    'total_geral' => $totalGeral,
    'categorias' => $categorias,
    'subtipos' => $subtipos,
    'cidades' => $cidades,
    'revendas' => $revendas,
]);

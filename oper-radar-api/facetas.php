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

$statusFiltro = $_GET['status'] ?? 'ativo';
$statusPermitidos = ['ativo', 'removido_candidato', 'removido_confirmado', 'todos'];
if (!in_array($statusFiltro, $statusPermitidos, true)) $statusFiltro = 'ativo';
// O valor foi validado pela lista fechada acima.
$whereStatus = $statusFiltro === 'todos' ? '' : " WHERE status='$statusFiltro'";
$whereStatusA = $statusFiltro === 'todos' ? '' : " WHERE a.status='$statusFiltro'";

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
$conector = $whereStatus ? ' AND' : ' WHERE';
$r = $conn->query("SELECT tipo, COUNT(*) n FROM anuncio$whereStatus$conector tipo IS NOT NULL GROUP BY tipo");
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
$cidadesPorUf = [];
$r = $conn->query("SELECT r.uf, r.cidade, COUNT(*) n FROM anuncio a JOIN revenda r ON r.id=a.revenda_id$whereStatusA
                   GROUP BY r.uf, r.cidade ORDER BY r.uf, r.cidade");
while ($row = $r->fetch_assoc()) {
    $item = ['cidade' => $row['cidade'], 'uf' => $row['uf'], 'n' => (int)$row['n']];
    $cidades[] = $item;
    $cidadesPorUf[$row['uf']][] = $item;
}

$revendas = [];
$revendasPorUfLista = [];
$r = $conn->query("SELECT r.id, r.nome, r.cidade, r.uf, COUNT(*) n
                   FROM anuncio a JOIN revenda r ON r.id=a.revenda_id$whereStatusA
                   GROUP BY r.id ORDER BY r.nome, r.cidade");
while ($row = $r->fetch_assoc()) {
    $item = ['id' => (int)$row['id'], 'nome' => $row['nome'], 'cidade' => $row['cidade'],
             'uf' => $row['uf'], 'n' => (int)$row['n']];
    $revendas[] = $item;
    $revendasPorUfLista[$row['uf']][] = $item;
}


// Regioes do Brasil -> UFs. Usado pros chips de regiao no app.
$REGIOES = [
    'Sul'          => ['PR','SC','RS'],
    'Sudeste'      => ['SP','RJ','MG','ES'],
    'Centro-Oeste' => ['MT','MS','GO','DF'],
    'Nordeste'     => ['BA','PE','CE','MA','PB','RN','AL','PI','SE'],
    'Norte'        => ['AM','PA','RO','RR','AC','AP','TO'],
];

// Contagem de anuncios do status selecionado por UF
$porUf = [];
$r = $conn->query("SELECT r.uf, COUNT(*) n FROM anuncio a JOIN revenda r ON r.id=a.revenda_id
                   $whereStatusA GROUP BY r.uf");
while ($row = $r->fetch_assoc()) $porUf[$row['uf']] = (int)$row['n'];

// Contagem de revendas por UF
$revendasUf = [];
$r = $conn->query("SELECT uf, COUNT(*) n FROM revenda GROUP BY uf");
while ($row = $r->fetch_assoc()) $revendasUf[$row['uf']] = (int)$row['n'];

// Tipos por UF permitem que os numeros dos segmentos acompanhem a regiao/estado
// escolhido no app, sem uma nova consulta a cada clique.
$tiposPorUf = [];
$whereTiposUf = $whereStatusA ? "$whereStatusA AND" : ' WHERE';
$r = $conn->query("SELECT r.uf, a.tipo, COUNT(*) n FROM anuncio a JOIN revenda r ON r.id=a.revenda_id
                   $whereTiposUf a.tipo IS NOT NULL GROUP BY r.uf, a.tipo");
while ($row = $r->fetch_assoc()) $tiposPorUf[$row['uf']][$row['tipo']] = (int)$row['n'];

// Agrega por regiao
$regioes = [];
foreach ($REGIOES as $nome => $ufs) {
    $anuncios = 0; $revs = 0; $ufsAtivas = [];
    foreach ($ufs as $uf) {
        $a = $porUf[$uf] ?? 0;
        $anuncios += $a;
        $revs += $revendasUf[$uf] ?? 0;
        if ($a > 0) $ufsAtivas[] = $uf;
    }
    $regioes[$nome] = ['anuncios' => $anuncios, 'revendas' => $revs, 'ufs_ativas' => $ufsAtivas, 'ufs' => $ufs];
}

$NOMES_UF = [
    'AC'=>'Acre','AL'=>'Alagoas','AP'=>'Amapá','AM'=>'Amazonas','BA'=>'Bahia','CE'=>'Ceará',
    'DF'=>'Distrito Federal','ES'=>'Espírito Santo','GO'=>'Goiás','MA'=>'Maranhão',
    'MT'=>'Mato Grosso','MS'=>'Mato Grosso do Sul','MG'=>'Minas Gerais','PA'=>'Pará',
    'PB'=>'Paraíba','PR'=>'Paraná','PE'=>'Pernambuco','PI'=>'Piauí','RJ'=>'Rio de Janeiro',
    'RN'=>'Rio Grande do Norte','RS'=>'Rio Grande do Sul','RO'=>'Rondônia','RR'=>'Roraima',
    'SC'=>'Santa Catarina','SP'=>'São Paulo','SE'=>'Sergipe','TO'=>'Tocantins',
];
$ufsDetalhes = [];
foreach ($REGIOES as $nomeRegiao => $ufs) {
    foreach ($ufs as $sigla) {
        $categoriasUf = [];
        foreach ($CATEGORIA_TIPOS as $cat => $tipos) {
            $n = 0;
            foreach ($tipos as $tipo) $n += $tiposPorUf[$sigla][$tipo] ?? 0;
            $categoriasUf[$cat] = $n;
        }
        $conhecidos = array_sum($categoriasUf);
        $categoriasUf['outros'] += max(0, ($porUf[$sigla] ?? 0) - $conhecidos);
        $ufsDetalhes[$sigla] = [
            'nome' => $NOMES_UF[$sigla], 'regiao' => $nomeRegiao,
            'anuncios' => $porUf[$sigla] ?? 0, 'revendas' => $revendasUf[$sigla] ?? 0,
            'categorias' => $categoriasUf, 'tipos' => $tiposPorUf[$sigla] ?? [],
            'cidades' => $cidadesPorUf[$sigla] ?? [],
            'lojistas' => $revendasPorUfLista[$sigla] ?? [],
        ];
    }
}

envia_json([
    'status_aplicado' => $statusFiltro,
    'total_geral' => $totalGeral,
    'por_uf' => $porUf,
    'revendas_por_uf' => $revendasUf,
    'ufs' => $ufsDetalhes,
    'regioes' => $regioes,
    'categorias' => $categorias,
    'subtipos' => $subtipos,
    'cidades' => $cidades,
    'revendas' => $revendas,
]);

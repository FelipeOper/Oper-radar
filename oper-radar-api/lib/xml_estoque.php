<?php
/**
 * Leitor defensivo de feeds XML de estoque.
 *
 * O parser aceita os nomes mais comuns usados por DMS, portais e integradores
 * brasileiros sem amarrar o Oper Radar a um fornecedor especifico.
 */

function xml_estoque_chave(string $valor): string {
    $valor = trim($valor);
    $ascii = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $valor);
    if ($ascii !== false) $valor = $ascii;
    return strtolower(preg_replace('/[^a-zA-Z0-9]+/', '', $valor));
}

function xml_estoque_texto($valor): string {
    return trim(preg_replace('/\s+/u', ' ', html_entity_decode((string)$valor, ENT_QUOTES | ENT_XML1, 'UTF-8')));
}

/** @return array<string,string> */
function xml_estoque_achata(SimpleXMLElement $no): array {
    $saida = [];
    $visita = function (SimpleXMLElement $atual, string $caminho = '') use (&$visita, &$saida): void {
        foreach ($atual->attributes() as $nome => $valor) {
            $folha = xml_estoque_chave((string)$nome);
            $texto = xml_estoque_texto($valor);
            if ($folha !== '' && $texto !== '') {
                if (!isset($saida[$folha])) $saida[$folha] = $texto;
                if ($caminho !== '') $saida[xml_estoque_chave($caminho . $folha)] = $texto;
            }
        }
        foreach ($atual->children() as $nome => $filho) {
            $folha = xml_estoque_chave((string)$nome);
            $novoCaminho = $caminho . $folha;
            $texto = xml_estoque_texto($filho);
            if ($folha !== '' && $texto !== '' && count($filho->children()) === 0) {
                if (!isset($saida[$folha])) $saida[$folha] = $texto;
                $saida[xml_estoque_chave($novoCaminho)] = $texto;
            }
            if (count($filho->children()) > 0) $visita($filho, $novoCaminho);
        }
    };
    $visita($no);
    return $saida;
}

function xml_estoque_campo(array $campos, array $apelidos): string {
    foreach ($apelidos as $apelido) {
        $chave = xml_estoque_chave($apelido);
        if (isset($campos[$chave]) && $campos[$chave] !== '') return $campos[$chave];
    }
    // Alguns feeds encapsulam campos em "dadosVeiculo", "vehicleDetails" etc.
    foreach ($apelidos as $apelido) {
        $chave = xml_estoque_chave($apelido);
        if (strlen($chave) < 3) continue;
        foreach ($campos as $nome => $valor) {
            if ($valor !== '' && substr($nome, -strlen($chave)) === $chave) return $valor;
        }
    }
    return '';
}

function xml_estoque_numero(string $valor): ?float {
    $valor = trim($valor);
    if ($valor === '') return null;
    $valor = preg_replace('/[^0-9,.-]/', '', $valor);
    if ($valor === '' || $valor === '-') return null;
    if (strpos($valor, ',') !== false) {
        $valor = str_replace('.', '', $valor);
        $valor = str_replace(',', '.', $valor);
    } elseif (substr_count($valor, '.') > 1) {
        $valor = str_replace('.', '', $valor);
    }
    return is_numeric($valor) ? (float)$valor : null;
}

function xml_estoque_ano(string $valor): ?int {
    if (!preg_match('/(?:19|20)\d{2}/', $valor, $m)) return null;
    $ano = (int)$m[0];
    return $ano >= 1950 && $ano <= ((int)date('Y') + 2) ? $ano : null;
}

function xml_estoque_data(string $valor): ?string {
    $valor = trim($valor);
    if (preg_match('/^(\d{4})-(\d{2})-(\d{2})/', $valor, $m)) return "$m[1]-$m[2]-$m[3]";
    if (preg_match('/^(\d{2})\/(\d{2})\/(\d{4})/', $valor, $m)) return "$m[3]-$m[2]-$m[1]";
    return null;
}

function xml_estoque_status(string $valor): string {
    $status = xml_estoque_chave($valor);
    if (preg_match('/vend|sold|baix|inativ/', $status)) return 'vendido';
    if (preg_match('/reserv|hold/', $status)) return 'reservado';
    return 'estoque';
}

/** Tamanho da coluna meu_estoque.url_anuncio / imagem_url. */
const XML_ESTOQUE_URL_MAX = 500;

/**
 * Allowlist de link vindo do XML do lojista: so http e https, com host, sem credencial embutida, sem espaco nem
 * caractere de controle e ate XML_ESTOQUE_URL_MAX caracteres (acima disso descarta; truncar geraria outro link).
 * FILTER_VALIDATE_URL sozinho aceita javascript://host/..., file:///..., ftp:// e mailto:, entao ele so entra como
 * segunda checagem, depois do esquema. Devolve o valor aparado como veio (sem normalizar nem prefixar esquema)
 * ou null. Nao busca a URL em lugar nenhum: seguro para exibir como texto nao significa destino confiavel.
 */
function xml_estoque_url_http($valor): ?string {
    if (!is_string($valor)) return null;
    $valor = trim($valor, " \t\r\n");
    if ($valor === '' || strlen($valor) > XML_ESTOQUE_URL_MAX) return null;
    if (preg_match('/[\x00-\x20\x7f]/', $valor) === 1) return null;
    if (preg_match('#^https?://#i', $valor) !== 1) return null;
    if (filter_var($valor, FILTER_VALIDATE_URL) === false) return null;
    $partes = parse_url($valor);
    if (!is_array($partes)) return null;
    $esquema = strtolower((string)($partes['scheme'] ?? ''));
    if ($esquema !== 'http' && $esquema !== 'https') return null;
    if (trim((string)($partes['host'] ?? '')) === '') return null;
    if (array_key_exists('user', $partes) || array_key_exists('pass', $partes)) return null; // inclui user/pass vazios (https://:@host)
    return $valor;
}

function xml_estoque_registro(SimpleXMLElement $no, int $indice): ?array {
    $c = xml_estoque_achata($no);
    $marca = xml_estoque_campo($c, ['marca', 'fabricante', 'make', 'brand']);
    $modelo = xml_estoque_campo($c, ['modelo', 'model', 'versao', 'version', 'descricaoModelo']);
    $titulo = xml_estoque_campo($c, ['titulo', 'title', 'descricao', 'description', 'nome']);
    if ($modelo === '') $modelo = $titulo;
    if (mb_strlen($modelo) < 2) return null;

    $referencia = xml_estoque_campo($c, [
        'referenciaInterna', 'codigoEstoque', 'stockId', 'vehicleId', 'listingId',
        'codigoVeiculo', 'codigoReferencia', 'referenceCode', 'numeroEstoque',
        'stockNumber', 'inventoryId', 'codigoAnuncio', 'referencia', 'codigo',
        'idVeiculo', 'id'
    ]);
    $placa = strtoupper(preg_replace('/[^A-Z0-9]/', '', xml_estoque_campo($c, ['placa', 'plate', 'licensePlate'])));
    // Aceita tanto o padrão antigo ABC1234 quanto o Mercosul ABC1D23.
    if (!preg_match('/^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/', $placa)) $placa = '';
    $anoTexto = xml_estoque_campo($c, ['anoModelo', 'modelYear', 'ano', 'year', 'fabricacao']);
    $preco = xml_estoque_numero(xml_estoque_campo($c, ['precoVenda', 'salePrice', 'preco', 'price', 'valor']));
    $km = xml_estoque_numero(xml_estoque_campo($c, ['quilometragem', 'kilometragem', 'mileage', 'odometro', 'km']));
    $uf = strtoupper(trim(xml_estoque_campo($c, ['uf', 'estadoSigla', 'state', 'estado'])));
    if (!preg_match('/^[A-Z]{2}$/', $uf)) $uf = '';
    $data = xml_estoque_data(xml_estoque_campo($c, ['dataEntrada', 'stockDate', 'dataCadastro', 'createdAt', 'data']));
    $url = xml_estoque_campo($c, ['urlAnuncio', 'listingUrl', 'vehicleUrl', 'url', 'link']);
    $imagem = xml_estoque_campo($c, ['imagemPrincipal', 'imageUrl', 'foto', 'image', 'imagem']);
    $codigoFipe = preg_replace('/[^0-9-]/', '', xml_estoque_campo($c, ['codigoFipe', 'fipeCode', 'fipe']));

    // Só os campos gravados passam pela allowlist http/https; campo inválido vira null com aviso e o item continua válido.
    // A identidade abaixo segue usando o $url CRU, como antes: trocar por $urlAnuncio mudaria a origem_chave e o próximo import duplicaria itens.
    $urlAnuncio = xml_estoque_url_http($url);
    $imagemUrl = xml_estoque_url_http($imagem);
    $avisos = [];
    if ($url !== '' && $urlAnuncio === null) $avisos['url_anuncio'] = 'campo descartado: somente http/https';
    if ($imagem !== '' && $imagemUrl === null) $avisos['imagem_url'] = 'campo descartado: somente http/https';

    $identidadeOrigem = $referencia !== '' ? 'codigo_referencia'
        : ($placa !== '' ? 'placa' : ($url !== '' ? 'url' : 'composicao'));
    $origemBase = $referencia ?: ($placa ?: ($url ?: implode('|', [$marca, $modelo, $anoTexto])));
    return [
        'referencia_interna' => mb_substr($referencia, 0, 80),
        'titulo' => mb_substr($titulo ?: trim($marca . ' ' . $modelo), 0, 255),
        'origem_chave' => hash('sha256', xml_estoque_chave($origemBase)),
        'identidade_origem' => $identidadeOrigem,
        'marca' => mb_substr($marca, 0, 80),
        'modelo' => mb_substr($modelo, 0, 180),
        'ano' => xml_estoque_ano($anoTexto),
        'preco_anunciado' => $preco && $preco > 0 ? $preco : null,
        'cidade' => mb_substr(xml_estoque_campo($c, ['cidade', 'city', 'municipio']), 0, 120),
        'uf' => $uf ?: null,
        'data_entrada' => $data,
        'status' => xml_estoque_status(xml_estoque_campo($c, ['status', 'situacao', 'availability'])),
        'placa' => $placa ?: null,
        'quilometragem' => $km !== null ? (int)$km : null,
        'url_anuncio' => $urlAnuncio,
        'imagem_url' => $imagemUrl,
        'codigo_fipe' => $codigoFipe ?: null,
        'avisos' => $avisos,
    ];
}

/** @return SimpleXMLElement[] */
function xml_estoque_nos(SimpleXMLElement $xml): array {
    $tags = ['veiculo', 'vehicle', 'anuncio', 'listing', 'produto', 'item', 'ad'];
    $condicoes = array_map(function ($tag) {
        return "translate(local-name(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz')='$tag'";
    }, $tags);
    $expr = '//*[' . implode(' or ', $condicoes) . ']';
    $encontrados = $xml->xpath($expr) ?: [];
    $folhas = [];
    foreach ($encontrados as $no) {
        $descendentes = $no->xpath('.//*[' . implode(' or ', $condicoes) . ']') ?: [];
        if (count($descendentes) === 0) $folhas[] = $no;
    }
    if ($folhas) return $folhas;

    $filhos = iterator_to_array($xml->children(), false);
    if (count($filhos) === 1) $filhos = iterator_to_array($filhos[0]->children(), false);
    return $filhos ?: [$xml];
}

function xml_estoque_ler(string $conteudo, int $limite = 10000): array {
    if (strlen($conteudo) > 20 * 1024 * 1024) throw new RuntimeException('O XML excede o limite de 20 MB.');
    if (preg_match('/<!DOCTYPE|<!ENTITY/i', $conteudo)) throw new RuntimeException('XML com DTD ou entidades externas nao e aceito.');
    if (!function_exists('simplexml_load_string')) throw new RuntimeException('O servidor nao possui o leitor XML do PHP.');

    $anterior = libxml_use_internal_errors(true);
    $xml = simplexml_load_string($conteudo, 'SimpleXMLElement', LIBXML_NONET | LIBXML_NOCDATA | LIBXML_COMPACT);
    $erros = libxml_get_errors();
    libxml_clear_errors();
    libxml_use_internal_errors($anterior);
    if ($xml === false) {
        $detalhe = $erros ? trim($erros[0]->message) : 'estrutura invalida';
        throw new RuntimeException('Nao foi possivel ler o XML: ' . $detalhe);
    }

    $itens = [];
    $ignorados = 0;
    $urlsDescartadas = 0; // campos url_anuncio/imagem_url anulados pela allowlist (o veículo entra sem o link)
    foreach (xml_estoque_nos($xml) as $indice => $no) {
        if (count($itens) >= $limite) throw new RuntimeException("O XML possui mais de $limite veiculos.");
        $item = xml_estoque_registro($no, (int)$indice);
        if ($item) { $itens[] = $item; $urlsDescartadas += count($item['avisos']); } else $ignorados++;
    }
    if (!$itens) throw new RuntimeException('Nenhum veiculo reconhecido. Envie um exemplo do XML para ajustarmos o mapeamento.');
    return ['itens' => $itens, 'ignorados' => $ignorados, 'urls_descartadas' => $urlsDescartadas, 'hash' => hash('sha256', $conteudo)];
}

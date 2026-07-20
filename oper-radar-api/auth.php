<?php
/** Autenticação e perfil do Oper Radar. */
require_once __DIR__ . '/config.php';
inicia_sessao_oper_radar();

function corpo_json(): array {
    $dados = json_decode(file_get_contents('php://input'), true);
    return is_array($dados) ? $dados : [];
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $usuario = usuario_atual();
    envia_json([
        'autenticado' => $usuario !== null,
        'usuario' => $usuario,
        'csrf' => $_SESSION['csrf'],
    ]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    envia_json(['erro' => 'Metodo nao permitido']);
}

$dados = corpo_json();
$acao = (string)($dados['acao'] ?? 'login');
$conn = conecta();

if ($acao === 'login') {
    $email = mb_strtolower(trim((string)($dados['email'] ?? '')));
    $senha = (string)($dados['senha'] ?? '');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $senha === '') {
        http_response_code(422);
        envia_json(['erro' => 'Informe e-mail e senha.']);
    }

    $st = $conn->prepare('SELECT id, nome, email, senha_hash, papel, ativo, tentativas_login, bloqueado_ate FROM usuario WHERE email=? LIMIT 1');
    $st->bind_param('s', $email);
    $st->execute();
    $registro = $st->get_result()->fetch_assoc();
    $st->close();

    $bloqueado = $registro && !empty($registro['bloqueado_ate']) && strtotime($registro['bloqueado_ate']) > time();
    $valido = $registro && (int)$registro['ativo'] === 1 && !$bloqueado && password_verify($senha, $registro['senha_hash']);
    if (!$valido) {
        if ($registro && !$bloqueado) {
            $tentativas = (int)$registro['tentativas_login'] + 1;
            $ate = $tentativas >= 5 ? date('Y-m-d H:i:s', time() + 900) : null;
            $st = $conn->prepare('UPDATE usuario SET tentativas_login=?, bloqueado_ate=? WHERE id=?');
            $st->bind_param('isi', $tentativas, $ate, $registro['id']);
            $st->execute();
            $st->close();
        }
        usleep(350000);
        http_response_code(401);
        envia_json(['erro' => $bloqueado ? 'Acesso temporariamente bloqueado. Tente novamente em 15 minutos.' : 'E-mail ou senha incorretos.']);
    }

    session_regenerate_id(true);
    $_SESSION['usuario_id'] = (int)$registro['id'];
    $_SESSION['usuario_nome'] = $registro['nome'];
    $_SESSION['usuario_email'] = $registro['email'];
    $_SESSION['usuario_papel'] = $registro['papel'];
    $_SESSION['csrf'] = bin2hex(random_bytes(24));
    $_SESSION['ultima_atividade'] = time();
    $st = $conn->prepare('UPDATE usuario SET tentativas_login=0, bloqueado_ate=NULL, ultimo_login=NOW() WHERE id=?');
    $st->bind_param('i', $registro['id']);
    $st->execute();
    $st->close();
    envia_json(['autenticado' => true, 'usuario' => usuario_atual(), 'csrf' => $_SESSION['csrf']]);
}

$usuario = exige_autenticacao();
exige_csrf();

if ($acao === 'logout') {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'] ?? '', $p['secure'], $p['httponly']);
    }
    session_destroy();
    envia_json(['autenticado' => false]);
}

if ($acao === 'perfil') {
    $nome = trim((string)($dados['nome'] ?? ''));
    if (mb_strlen($nome) < 2 || mb_strlen($nome) > 120) {
        http_response_code(422);
        envia_json(['erro' => 'Informe um nome válido.']);
    }
    $st = $conn->prepare('UPDATE usuario SET nome=?, atualizado_em=NOW() WHERE id=?');
    $st->bind_param('si', $nome, $usuario['id']);
    $st->execute();
    $st->close();
    $_SESSION['usuario_nome'] = $nome;
    envia_json(['usuario' => usuario_atual(), 'csrf' => $_SESSION['csrf']]);
}

if ($acao === 'senha') {
    $atual = (string)($dados['senha_atual'] ?? '');
    $nova = (string)($dados['nova_senha'] ?? '');
    if (strlen($nova) < 10) {
        http_response_code(422);
        envia_json(['erro' => 'A nova senha deve ter pelo menos 10 caracteres.']);
    }
    $st = $conn->prepare('SELECT senha_hash FROM usuario WHERE id=? LIMIT 1');
    $st->bind_param('i', $usuario['id']);
    $st->execute();
    $hash = $st->get_result()->fetch_assoc()['senha_hash'] ?? '';
    $st->close();
    if (!password_verify($atual, $hash)) {
        http_response_code(422);
        envia_json(['erro' => 'A senha atual não confere.']);
    }
    $novoHash = password_hash($nova, PASSWORD_DEFAULT);
    $st = $conn->prepare('UPDATE usuario SET senha_hash=?, atualizado_em=NOW() WHERE id=?');
    $st->bind_param('si', $novoHash, $usuario['id']);
    $st->execute();
    $st->close();
    session_regenerate_id(true);
    $_SESSION['csrf'] = bin2hex(random_bytes(24));
    envia_json(['ok' => true, 'csrf' => $_SESSION['csrf']]);
}

http_response_code(400);
envia_json(['erro' => 'Ação inválida.']);

<?php
/** Cria ou redefine o primeiro administrador sem expor senha no comando. */
if (PHP_SAPI !== 'cli') exit("Somente terminal.\n");
require_once dirname(__DIR__) . '/oper-radar-api/config.php';

function pergunta(string $texto, bool $secreto = false): string {
    fwrite(STDOUT, $texto);
    if ($secreto && DIRECTORY_SEPARATOR === '/') shell_exec('stty -echo');
    $valor = trim((string)fgets(STDIN));
    if ($secreto && DIRECTORY_SEPARATOR === '/') {
        shell_exec('stty echo');
        fwrite(STDOUT, "\n");
    }
    return $valor;
}

$nome = pergunta('Nome do administrador: ');
$email = mb_strtolower(pergunta('E-mail do administrador: '));
$senha = pergunta('Senha (mínimo 10 caracteres; não aparecerá): ', true);
if (mb_strlen($nome) < 2 || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($senha) < 10) {
    fwrite(STDERR, "Dados inválidos. Confira nome, e-mail e senha.\n");
    exit(1);
}
$hash = password_hash($senha, PASSWORD_DEFAULT);
$conn = conecta();
$st = $conn->prepare("INSERT INTO usuario (nome,email,senha_hash,papel,ativo) VALUES (?,?,?,'admin',1) ON DUPLICATE KEY UPDATE nome=VALUES(nome), senha_hash=VALUES(senha_hash), papel='admin', ativo=1, tentativas_login=0, bloqueado_ate=NULL");
$st->bind_param('sss', $nome, $email, $hash);
$st->execute();
$st->close();
unset($senha, $hash);
echo "Administrador preparado com segurança.\n";

# Entrega — acesso, temas e Minha Loja

## O que entra

- login real com sessão PHP e cookie `HttpOnly`;
- bloqueio temporário após cinco tentativas de senha inválida;
- Área de Membros com perfil, papel de acesso, troca de senha e logout;
- Minha Loja / Meu Estoque, separado por usuário;
- vínculo opcional com a FIPE e comparação com a média dos anúncios equivalentes;
- status do veículo: no estoque, reservado ou vendido;
- Configurações reais com Tema Radar, Dark, White Clean, automático, densidade e redução de movimento;
- navegação mobile com Minha Loja entre os quatro destinos principais.

## Ordem segura de publicação

O frontend e a API devem ser publicados na mesma janela, porque os endpoints passam a exigir login.

1. Faça backup do banco, do frontend e da pasta pública da API.
2. No repositório do servidor, execute `git pull --ff-only origin main`.
3. Execute `php fase4-acesso/migrar_acesso.php`.
4. Execute `php fase4-acesso/criar_admin.php` e informe nome, e-mail e senha quando solicitado.
5. Copie `config.php`, `auth.php` e `minha_loja.php` para `/home1/pro93061/agenciaoper.com.br/oper-radar-api/`.
6. Publique o conteúdo do novo `dist` em `/home1/pro93061/agenciaoper.com.br/oper-radar/`.
7. Confirme que `auth.php` mostra `autenticado: false`, abra o app e entre com o administrador criado.

## Verificações

```bash
php -l oper-radar-api/config.php
php -l oper-radar-api/auth.php
php -l oper-radar-api/minha_loja.php
curl -sS https://agenciaoper.com.br/oper-radar-api/auth.php
```

Antes do login, `kpis.php` deve retornar HTTP 401. Depois do login no navegador, o dashboard abre normalmente.

## Reversão

Em caso de falha, restaure primeiro o `config.php` anterior da pasta pública da API e depois o frontend anterior. As tabelas `usuario` e `meu_estoque` podem permanecer no banco sem afetar o radar antigo.

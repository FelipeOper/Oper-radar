# Login, Área de Membros e Minha Loja

Esta etapa protege o Oper Radar com sessão PHP e associa cada item do estoque ao usuário autenticado.

No servidor, depois do `git pull`:

```bash
cd /home1/pro93061/agenciaoper.com.br/oper-radar
php fase4-acesso/migrar_acesso.php
php fase4-acesso/criar_admin.php
```

O segundo comando pede nome, e-mail e senha. A senha não aparece na tela nem entra no histórico do terminal.

Depois, publique `config.php`, `auth.php` e `minha_loja.php` na pasta pública da API e publique o novo bundle do frontend. Faça as duas publicações na mesma janela, pois as APIs passam a exigir login.

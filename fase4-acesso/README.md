# Login, Área de Membros e Minha Loja

Esta etapa protege o Oper Radar com sessão PHP e associa cada item do estoque ao usuário autenticado.

O estoque também pode ser sincronizado por XML. Consulte [ESTOQUE_XML.md](ESTOQUE_XML.md).

No servidor, depois do `git pull`:

```bash
cd /home1/pro93061/agenciaoper.com.br/oper-radar
php fase4-acesso/migrar_acesso.php
php fase4-acesso/criar_admin.php
```

O segundo comando pede nome, e-mail e senha. A senha não aparece na tela nem entra no histórico do terminal.

Depois, publique `config.php`, `auth.php`, `minha_loja.php`, `minha_loja_xml.php` e a pasta `oper-radar-api/lib` na pasta pública da API; então publique o novo bundle do frontend. Faça as publicações na mesma janela, pois as APIs passam a exigir login.

## Curadoria dos anúncios

O painel clicável do Mercado, a correção manual de FIPE, o KM validado e a trilha de auditoria estão documentados em [CURADORIA_ANUNCIO.md](CURADORIA_ANUNCIO.md). A migração correspondente é `migrar_curadoria_anuncio.php`.

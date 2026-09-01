# Design QA — painel analítico de Mercado

Data: 01/09/2026

## Resultado

Final result: blocked

O build Vite e os 33 testes do frontend foram aprovados. A prévia local abriu sem erro de
compilação, mas redirecionou à tela de autenticação: a sessão do ambiente publicado não é
compartilhada em `127.0.0.1` e a API `mercado_painel.php` ainda não foi publicada. Assim, não
foi possível capturar o painel alimentado por dados reais nem comparar a mesma tela com os
mockups aprovados.

## Próxima validação obrigatória

Depois de publicar, abrir `/oper-radar/mercado` com uma sessão autenticada e validar:

1. resumo, ranking geográfico e tabela de modelos com dados reais;
2. Brasil → UF → Brasil, mantendo período e contexto na URL;
3. seleção de modelo e abertura da evidência no navegador de anúncios;
4. layout em desktop e em 320 px;
5. ausência de erros no console e resposta da API com `_meta.request_id`.

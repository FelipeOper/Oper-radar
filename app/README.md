# OPER RADAR — App (frontend)

Esta pasta é um projeto React completo (Vite), pronto pra rodar de verdade — não é mais só
o código-fonte solto.

## Opção 1 — Ver agora, sem instalar nada (mais rápido pra validar)

1. Acesse: **https://stackblitz.com/github/FelipeOper/Oper-radar/tree/main/app**
2. O StackBlitz abre o projeto, instala tudo sozinho e mostra o app rodando direto no
   navegador, em 30-60 segundos. Dá pra clicar, navegar entre as páginas, tudo interativo.
3. Enquanto a API (`oper-radar-api/`) não estiver publicada no seu HostGator, o app usa os
   dados de exemplo automaticamente — é esperado, não é erro.

## Opção 2 — Publicar de vez no seu HostGator (produção)

Precisa do Node.js instalado em algum computador (o seu, não o servidor) só para "compilar"
o app antes de subir os arquivos finais — o HostGator não precisa rodar Node, só hospedar
os arquivos já prontos (HTML/CSS/JS estáticos).

1. No seu PC, dentro da pasta `app/`:
   ```
   npm install
   npm run build
   ```
2. Isso cria uma pasta `dist/` com os arquivos finais (HTML/CSS/JS).
3. Sobe o **conteúdo** dessa pasta `dist/` (não a pasta em si) para dentro de
   `public_html/` no cPanel (ou uma subpasta, ex: `public_html/oper-radar/`), usando o
   Gerenciador de Arquivos ou FTP.
4. Antes do passo 1, edite `src/App.jsx` e troque `API_BASE_URL` pelo endereço real da
   API publicada (ver `oper-radar-api/README` se existir, ou a instrução que te passei
   no chat).

## Sobre a API (dados reais)

O app já está preparado pra buscar dados reais da API PHP (`oper-radar-api/`) — Dashboard
e Anúncios tentam buscar de lá primeiro, e só usam os dados de exemplo se a API não
responder. Ou seja: assim que você publicar a API e ajustar o `API_BASE_URL`, os dados
reais aparecem automaticamente, sem precisar mexer em mais nada no app.

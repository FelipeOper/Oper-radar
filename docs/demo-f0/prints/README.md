# Capturas F0

Servidor HTTP: `http://127.0.0.1:5173/oper-radar/`.

Foram observadas capturas reais via portal do estado de login desktop e de uma abertura mobile. O conector CUA entregou os frames como imagens na sessão, mas não forneceu caminho de arquivo nem permitiu persistir PNG no worktree; por isso não há arquivos de imagem falsos neste diretório.

- Desktop: login OPER RADAR visível, formulário de e-mail/senha e CTA “Entrar no radar”.
- Mobile: carregamento/login visível; override confiável de 390×844 não ficou disponível pela API.
- Fluxos autenticados requerem sessão real em `auth.php`; nenhuma credencial foi criada ou transmitida.

A captura visual autenticada das páginas principais deve ser repetida em ambiente com sessão de demonstração antes da F1.

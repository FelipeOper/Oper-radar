# Design QA — painel analítico de Mercado

Data: 01/09/2026

## Resultado

Final result: passed on production desktop

O build Vite e os 33 testes do frontend foram aprovados. A versão publicada foi aberta em
`/oper-radar/mercado` com sessão autenticada e carregou o painel com dados reais da API.

Foram validados no ambiente de produção:

1. resumo, ranking geográfico e tabela de modelos com dados reais;
2. troca de 30 para 7 dias e recorte Brasil → Minas Gerais → Brasil;
3. recálculo dos indicadores no recorte de Minas Gerais;
4. seleção do modelo `SCANIA R450 · 2019` e abertura das evidências no navegador de anúncios;
5. layout desktop por inspeção visual e ausência de erros atribuíveis à aplicação no console.

## Validação ainda recomendada

O controle remoto da sessão autenticada do Chrome não oferece emulação de viewport. A revisão
visual específica em 320 px permanece recomendada em um dispositivo móvel ou no modo responsivo
do DevTools. As mensagens `Could not establish connection. Receiving end does not exist.` vistas
no console são emitidas por uma extensão do Chrome, sem impacto observado na aplicação.

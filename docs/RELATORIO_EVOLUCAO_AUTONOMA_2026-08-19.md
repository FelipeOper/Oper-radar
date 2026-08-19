# Relatório da evolução autônoma — 19/08/2026

## Escopo executado

Trabalho realizado em branch e worktree isolados, sem publicação, alteração de cron ou
escrita no banco de produção.

### Produto e linguagem

- “Giro”, “parado” e presunções de negociação foram substituídos por linguagem observável.
- Saída permanece explicitamente diferente de venda comprovada.
- E5/E6 passou a respeitar tipo de veículo, evidência explícita e transição de 2022.

### Qualidade de preço

- Comparativos passaram de média simples para estatística robusta com mediana e P25/P75.
- Preços de entrada, parcelas, leilão, lance e valores extremos deixam de alimentar rankings.
- Oportunidades exigem vínculo FIPE, preço válido e amostra mínima de cinco ofertas.
- A mesma regra foi integrada às rotas de anúncios, detalhe, catálogo FIPE, placa, Minha Loja
  e insights.

### Experiência e acessibilidade

- Busca principal antecipada na tela Mercado.
- Filtros avançados e seletores receberam estado acessível.
- Minha Loja ganhou busca, filtro, ordenação, estado de salvamento, rollback e desfazer.
- Formulários principais receberam nomes acessíveis e grids móveis responsivos.

### Séries e eventos

- Migração idempotente da tabela `anuncio_evento`.
- Materializador com simulação padrão, deduplicação e bloqueio por saúde dos snapshots.
- Endpoint autenticado de leitura e executor protegido, ambos ainda desligados em produção.

## Validações já executadas

- Testes Node das regras do frontend: 8 aprovados.
- Build Vite de produção: aprovado.
- `git diff --check`: aprovado.

Python e PHP não estavam disponíveis no PATH desta estação durante a execução. Os testes
correspondentes foram adicionados ao verificador central e precisam rodar no CI ou em uma
máquina com essas ferramentas antes da publicação.

## Pacotes gerados

Os três ZIPs e seus hashes estão documentados em `release/README.md`. Eles separam frontend,
API de confiabilidade e fundação de eventos para que cada etapa possa ser revisada e
publicada independentemente.

## Dependências para publicar

1. Revisar o diff e aprovar o lote.
2. Rodar a suíte completa no CI.
3. Fazer backup do banco e dos arquivos publicados.
4. Publicar primeiro a API compatível e o frontend.
5. Simular e aplicar a migração de eventos separadamente.
6. Validar contagens manualmente antes de considerar o agendamento do novo job.

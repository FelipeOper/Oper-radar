# OPER RADAR

Inteligência de mercado para caminhões, carretas e implementos no Brasil — monitoramento de revendas,
comparação de preço anunciado vs. FIPE, e estimativa de vendas regionais a partir do ciclo de vida dos anúncios.

Sistema independente da Agência Oper (sem relação com Rvops ou seus processos de CRM).

## Estrutura do repositório

```
app/            protótipo interativo (React) do painel — Dashboard, Anúncios, Análise, Lojistas, Configuração
docs/           documentos de arquitetura e roteiro de implementação (Word)
fase1-coleta/   Fase 1 do roteiro: scraper, schema do banco e lógica de detecção de venda
```

## Estado atual

- [x] Base de dados de revendas mapeada (954 lojistas em PR/SC/SP + ranking nacional de 20 estados)
- [x] Protótipo interativo do app (5 páginas, mobile-first)
- [x] Fase 1 — schema, parser e lógica de diff prontos e testados localmente (ver `fase1-coleta/README.md`)
- [ ] Fase 1 — deploy real (servidor + Postgres + cron) — pendente
- [ ] Fase 2 em diante — ver `docs/OPER_RADAR_Roteiro_de_Implementacao.docx`

## Próximos passos

Ver o checklist detalhado por fase em `docs/OPER_RADAR_Roteiro_de_Implementacao.docx`.

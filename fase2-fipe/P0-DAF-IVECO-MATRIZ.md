# P0 — matriz de interação DAF/IVECO (01/10/2026)

Base: `origin/main` 18eb6e5; branch isolada `agent/fipe-p0-daf-iveco`. Esta matriz usa nomes sintéticos e funções puras de `fipe_sync.py`. Não executa F4, SQL ou chamadas à FIPE.

| Grupo | Cruzamento exercitado | Casos | Resultado esperado |
|---|---|---:|---|
| DAF | XF/XF105 × FT/FTS/FTT (4x2/6x2/6x4) × Space/Super Space | 12 | Só a geração, configuração e cabine correspondentes dão candidato único alto; geração e configuração contrárias têm score zero. |
| DAF | XF versus CF, e dois candidatos altos indistinguíveis | 12 + 1 | Outra família tem score zero; dois candidatos permanecem ambíguos. |
| IVECO | TECTOR 240E25/240E28 × 4x2/6x2 × Day/Space | 8 | Código ou família contrários têm score zero; eixo/cabine contrários são descartados; sobra um candidato alto. |
| IVECO | STRALIS S44T versus S48T; candidato só pelo número | 2 | Potências diferentes têm score zero; número isolado não permite vínculo automático. |

Os testes da matriz estão em `test_fipe_sync.py` e passam sem banco/rede. O patch não muda consulta, índice, lote ou escrita SQL. O custo continua proporcional aos modelos da marca avaliados; o filtro final de candidato único é linear no máximo de 100 candidatos já carregados. Os 47 testes FIPE passam em cerca de 0,02 s nesta máquina. Isso não mede a execução em produção.

## Revisão de regressões e limites

- Um anúncio DAF que declara apenas `XF` não prova `XF105`; o patch agora rejeita candidato FIPE XF105/CF85 quando a geração especial não está explícita no anúncio. Pode reduzir vínculos automáticos existentes. Revisão manual é preferível a atribuir preço da geração errada.
- DAF/IVECO com um único candidato de confiança média deixam de vincular automaticamente. O impacto por marca, ano e motivo deve ser contado em um ensaio F3 SELECT-only, comparando a saída antiga e a nova sobre a mesma amostra/snapshot.
- A série/código tem de aparecer de forma compatível nos dois lados. Nomes FIPE abreviados, cabine não declarada, Euro E5/E6 e diferenças de ano-modelo ainda exigem verificação separada; a matriz não atesta cobertura de produção.
- O total informado de 170/583 linhas deslocadas em F3 mostra mudança de classificação, não prova que os 170 vínculos estão corretos nem que as 413 demais linhas estão cobertas. É necessário cruzar por `anuncio_id`, marca, geração/série, eixo, cabine, Euro, ano-modelo, candidato e confiança antes de liberar qualquer apply.
- A tela manual por categoria já está na main 18eb6e5 (PR #67); esta branch não a modifica. F4 e escrita em produção permanecem fora de escopo.

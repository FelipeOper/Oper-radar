# Integração P0 (série/geração, eixo/tração, cabine, DAF/IVECO, uplift CF) — 01/10/2026

Branch isolada `agent/fipe-p0-integracao`, base `origin/main` 18eb6e5. Merge sequencial
(`--no-ff`) de 7 patches, na ordem: série/geração (1a0519a), eixo/tração (757a0b7), cabine
(f9aa317, já com o fix CUSTODIA/VELOX), DAF/IVECO (3702907), fix IVECO 240E25 8x2 de VELOX
(1fdd1ee), uplift CF da LUNA (2976f0a, decisão Master aprovada), follow-up de 2 negativos
pedidos pela CUSTODIA (5ffec0b). Sem push, sem PR, sem merge na main, sem F4, sem produção.

## Testes (estado final desta rodada)

- `python -m unittest discover -s tests -p "test_*.py"`: 68/68 OK.
- `python -m unittest fase2-fipe.test_fipe_sync -v`: **80/80 OK, zero falhas.**
- `py_compile` ok; `git diff --check` limpo; árvore de trabalho limpa.

## Conflitos de merge resolvidos (só texto/ordem, nenhuma regra nova inventada)

- Portão final de eixo (`elif daf or eixo_p0` × `elif familia_restrita`): unido como
  `elif familia_restrita or eixo_p0` (preserva as duas rejeições).
- Consolidação posterior: o portão de eixo/tração passou a ter `and not familia_restrita`,
  deixando o portão próprio de DAF/IVECO decidir a mensagem quando os dois se aplicam —
  elimina a duplicação de motivo sem afrouxar nenhuma rejeição (commit `ddf845c`).
- Bloco de uplift CF (LUNA) precisa rodar **antes** dos portões finais (senão eles rejeitariam
  o score 0,90 antes do uplift elevar para 0,95); reordenado no merge `18f12d3`, sem alterar
  nenhuma condição de guarda.
- `README.md`: conflitos de posição em 4 merges; cada subseção de diagnóstico ficou com seu
  próprio cabeçalho (série/geração, eixo/tração, cabine DAF, DAF/IVECO, uplift CF), nenhum
  conteúdo removido.
- `test_fipe_sync.py`: um teste pré-uplift (`test_daf_cabine_correta_com_score_medio_
  continua_bloqueada`) testava exatamente o cenário que o Master aprovou destravar (CF Day,
  score 0,90, candidato único, potência+eixo+cabine explícitos). Renomeado para
  `test_daf_cabine_correta_com_score_medio_e_elegivel_pro_uplift_cf` e a expectativa
  atualizada de bloqueio para vínculo "alto" — coerente com a decisão já aprovada e com
  `test_daf_cabine_day_explicita_escolhe_entre_tres_versoes` (cenário equivalente, 3
  candidatos), que já passava sem alteração.

## Histórico de achados fechados nesta integração

1. **Bug de aceitação indevida em cabine** (CUSTODIA/VELOX, achado inicial): candidato FIPE
   genérico sem nenhuma tag de cabine era aceito com confiança alta mesmo com o anúncio
   declarando cabine explícita. Corrigido por LUNA em `f9aa317`.
2. **Bug de aceitação indevida em IVECO** (CUSTODIA/VELOX, achado na integração): código
   IVECO exato (240E25) dava score 0,95 só por família+código coincidirem, sem checar
   eixo/cabine, burlando os portões `< 0,95`. Eu havia classificado isso erroneamente como
   "divergência de texto" em `926f968`; reclassifiquei como bloqueador em `77cdde0` após
   confirmação de CUSTODIA/VELOX. Corrigido por VELOX em `1fdd1ee` (bônus de 0,95 agora exige
   eixo e cabine explícitos e coincidentes).
3. **CF nunca atingia confiança alta** (decisão de produto, não bug): CF não tem letra de
   configuração (FT/FTS/FTT) para `avalia()` confirmar o modelo, então ficava travado em 0,90.
   Master aprovou critério de uplift (família+potência+eixo+cabine explícitos e iguais nos
   dois lados, emissão quando declarada, candidato único); implementado por LUNA em `2976f0a`,
   com 2 negativos adicionais pedidos por CUSTODIA em `5ffec0b` (potência ausente na FIPE;
   emissão explícita conflitante E5/E6).

## Pendência antes de qualquer PR

- Nenhuma conhecida nesta rodada. 80/80 FIPE, 68/68 contratos, árvore limpa.
- Recomendo revisão final de CUSTODIA/VELOX sobre a ordem de execução do uplift CF (antes dos
  portões finais) antes de considerar abrir PR — é mudança estrutural no fluxo de `escolhe()`,
  mesmo sem alterar nenhuma condição isolada.

**Sem bloqueador aberto.** Decisão de abrir PR continua com o Orquestrador/Master, não comigo.

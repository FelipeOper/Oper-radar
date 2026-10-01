# Integração P0 (série/geração, eixo/tração, cabine, DAF/IVECO) — 01/10/2026

Branch isolada `agent/fipe-p0-integracao`, base `origin/main` 18eb6e5. Merge sequencial
(`--no-ff`) dos 5 patches, na ordem: série/geração (1a0519a), eixo/tração (757a0b7),
cabine (f9aa317, já com o fix do achado CUSTODIA/VELOX), DAF/IVECO (3702907), fix IVECO
240E25 8x2 de VELOX (1fdd1ee, fecha o bloqueador do item 4 abaixo).
Sem push, sem PR, sem merge na main, sem F4, sem produção.

## Testes (atualizado após o fix de VELOX, 1fdd1ee)

- `python -m unittest discover -s tests -p "test_*.py"`: 68/68 OK.
- `python -m unittest fase2-fipe.test_fipe_sync -v`: 68 testes, **4 falhas, todas agora
  divergência de texto de motivo — nenhuma aceitação indevida** (ver item 4 revisado).
- `py_compile` ok; `git diff --check` limpo.

## Conflitos de merge resolvidos

Só texto/condição redundante, nenhuma invenção de regra nova:

- `fipe_sync.py`, portão final de eixo (`elif daf or eixo_p0` × `elif familia_restrita`):
  resolvido como união `elif familia_restrita or eixo_p0` — preserva as duas condições de
  rejeição (fail-closed), não escolhe uma em detrimento da outra.
- `fipe_sync.py`, comentário do portão de cabine: mantido o comentário mais explicativo;
  lógica idêntica nos dois lados (`elif daf: return None, ...`).
- `README.md`: conflitos de posição (3 vezes); cada subseção de diagnóstico ficou com seu
  próprio cabeçalho (`série/geração`, `eixo/tração`, `cabine DAF`, `DAF/IVECO`), nenhum
  conteúdo removido.

## As 4 falhas, por causa

1. **`test_daf_cabine_day_explicita_escolhe_entre_tres_versoes`** (conhecida, já documentada
   em `P0-REVISAO-CRUZADA.md` e confirmada por LUNA): `CF FAS 300 Day Cab`, score real 0,90.
   O portão de eixo/tração (6x2, linha ~886) exige score ≥0,95 e rejeita. **Bloqueado a
   propósito, sem baixar o limiar**, aguardando decisão do Master (critério proposto por
   LUNA: uplift só com família+potência+eixo+cabine explícitos e candidato único).

2. **`test_daf_candidato_unico_de_alta_confianca`**,
3. **`test_daf_cabine_correta_com_score_medio_continua_bloqueada`** e
4. **`test_iveco_240e25_8x2_sem_cabine_nao_vincula_alto`**: as três rejeitam corretamente
   (`None`, fail-closed preservado), mas com motivo diferente do esperado pelo teste de
   origem. Causa: dois portões finais equivalentes e redundantes no `escolhe()` — o de
   eixo/tração (`if eixo_anuncio in {4X2,6X2,6X4,8X2}: ...`, linhas ~883-887) dispara antes
   do de DAF/IVECO (`if familia_restrita and (...)`, linhas ~900-902) e devolve uma mensagem
   com formato diferente. Apenas divergência de texto, sem risco.

   **Histórico do item 4 (bloqueador JÁ FECHADO por VELOX, 1fdd1ee):** este item era
   `test_iveco_eixo_e_codigo_exatos_ainda_sem_confianca_alta`, reclassificado por mim em
   `77cdde0` como ACEITAÇÃO INDEVIDA real (não divergência de texto), após achado
   independente de CUSTODIA/VELOX: `avalia()` dava score 0,95 exato para código IVECO +
   família coincidentes, sem checar eixo/cabine, burlando os dois portões `< 0,95`. VELOX
   corrigiu em `1fdd1ee` (mesclado aqui): o bônus de 0,95 agora exige eixo E cabine
   explícitos e coincidentes; sem eles, score cai para 0,90, que os portões rejeitam. Teste
   negativo exato (`TECTOR 240E25 8x2`) adicionado por VELOX, 50/50 FIPE na branch de origem.
   O teste renomeado (`test_iveco_240e25_8x2_sem_cabine_nao_vincula_alto`) passou a falhar só
   por motivo de texto (mesma causa do item 2/3), não mais por aceitação indevida —
   conferido por mim reexecutando a suíte após o merge.

## Pendência para LUNA/VELOX antes de qualquer PR

- Decisão do Master sobre o critério de uplift do CF Day (item 1) — já aprovada; aguarda
  patch da LUNA (branch `agent/fipe-p0-cf-uplift`, a partir de `agent/fipe-p0-cabine` f9aa317).
- Consolidar os dois portões finais redundantes (eixo/tração e DAF/IVECO) num só, com uma
  mensagem só, para os itens 2, 3 e 4 pararem de divergir por texto (sem risco).

**Sem bloqueador de aceitação indevida aberto nesta rodada.** Integração ainda não declarada
pronta para PR: falta o patch de CF Day (item 1) e a consolidação de mensagens.

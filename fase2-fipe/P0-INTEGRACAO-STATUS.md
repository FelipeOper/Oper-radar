# Integração P0 (série/geração, eixo/tração, cabine, DAF/IVECO) — 01/10/2026

Branch isolada `agent/fipe-p0-integracao`, base `origin/main` 18eb6e5. Merge sequencial
(`--no-ff`) dos 4 patches, na ordem: série/geração (1a0519a), eixo/tração (757a0b7),
cabine (f9aa317, já com o fix do achado CUSTODIA/VELOX), DAF/IVECO (3702907).
Sem push, sem PR, sem merge na main, sem F4, sem produção.

## Testes

- `python -m unittest discover -s tests -p "test_*.py"`: 68/68 OK.
- `python -m unittest fase2-fipe.test_fipe_sync -v`: 67 testes, **4 falhas**.
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

2. **`test_daf_candidato_unico_de_alta_confianca`** e
3. **`test_daf_cabine_correta_com_score_medio_continua_bloqueada`**: as duas rejeitam
   corretamente (`None`, fail-closed preservado), mas com motivo diferente do esperado pelo
   teste de origem. Causa: dois portões finais equivalentes e redundantes no `escolhe()` —
   o de eixo/tração (`if eixo_anuncio in {4X2,6X2,6X4,8X2}: ...`, linhas ~883-887) dispara
   antes do de DAF/IVECO (`if familia_restrita and (...)`, linhas ~900-902) e devolve uma
   mensagem com formato diferente. Apenas divergência de texto, sem risco.

4. **`test_iveco_eixo_e_codigo_exatos_ainda_sem_confianca_alta` — CORREÇÃO (reclassificado
   após achado independente de CUSTODIA/VELOX, confirmado por mim): esta NÃO é divergência de
   texto. É ACEITAÇÃO INDEVIDA real.** `IVECO TECTOR 240E25 8x2` sem cabine explícita vincula
   com confiança **alta** a um único candidato igualmente sem cabine, quando o esperado é
   `(None, "ambiguo eixo 8X2: confianca insuficiente")`. Causa raiz: `avalia()` (linhas
   ~454-455) dá bônus de score 0,95 exato para código IVECO + família coincidentes
   (`240E25` + `TECTOR`). Com score == 0,95 (não < 0,95), nenhum dos dois portões finais
   rejeita — a condição de ambos é `score < 0,95`, e 0,95 não é menor que 0,95. Isso substitui
   silenciosamente a regra antiga de 0,60 que o ramo eixo/tração documentava e testava
   (README, seção eixo/tração: "IVECO TECTOR 240E25 8x2 ... recebe score 0,60 ... e não vira
   vínculo alto"). **Classificado como bug bloqueador, mesma categoria do bug de cabine já
   corrigido por LUNA (f9aa317).** Reordenar os portões NÃO resolve isto (confirmei: a
   condição numérica é idêntica nos dois portões). Fix real pendente de LUNA/VELOX antes de
   declarar a integração pronta: nem merge nem PR enquanto este item estiver aberto.
   Correção da minha própria mensagem anterior a Orquestrador-GPT, que classificou
   erroneamente este item como "nenhuma aceitação indevida" — estava errado; retificado aqui.

## Pendência para LUNA/VELOX antes de qualquer PR

- **Bloqueador:** fix fail-closed do item 4 (score 0,95 exato do bônus código+família IVECO
  burla os dois portões `< 0,95`) + teste de regressão negativo exato.
- Decisão do Master sobre o critério de uplift do CF Day (item 1) — já aprovada; aguarda
  patch da LUNA (branch `agent/fipe-p0-cf-uplift`, a partir de `agent/fipe-p0-cabine` f9aa317).
- Consolidar os dois portões finais redundantes (eixo/tração e DAF/IVECO) num só, com uma
  mensagem só, para os itens 2 e 3 pararem de divergir por texto (sem risco, pode ser feito
  por mim quando os dois acima estiverem resolvidos).

**Integração NÃO declarada pronta enquanto o item 4 (bloqueador) estiver aberto.**

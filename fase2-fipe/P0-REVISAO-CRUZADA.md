# Revisão cruzada P0 — DAF/IVECO × cabine × série (01/10/2026)

Base comum: `origin/main` 18eb6e5. Comparados `abe1eff` (DAF/IVECO), `28c60b1` com seu ancestral `4be4390` (cabine) e `1a0519a` (série/geração). Nenhum commit foi mesclado nesta branch. O ensaio ocorreu em diretório temporário, sem banco/rede/F4.

## Ensaio integrado offline

`git merge-file -p` sobre os três conteúdos de `fase2-fipe/fipe_sync.py` encontrou **zero conflitos textuais** ao acrescentar cabine e **um conflito textual** ao acrescentar série: ambos inserem um portão final em `escolhe()`. Para o ensaio, os dois portões foram concatenados em memória (série primeiro, DAF/IVECO depois); nenhuma resolução foi gravada no Git. Executei os três arquivos `test_fipe_sync.py` dos ramos sobre essa composição: **133 testes, 1 falha**.

Falha: `test_daf_cabine_day_explicita_escolhe_entre_tres_versoes` do ramo cabine espera escolher `CF FAS 300 Day Cab` com score simulado 0,90. O portão DAF/IVECO de `abe1eff` exige candidato único com score ≥0,95 e retorna `sem match de alta confianca`. A avaliação real do mesmo par também deu **0,90** (`potencia 300`), portanto não é apenas o mock. Decisão necessária na integração: manter a exigência P0 e corrigir o teste/expectativa do ramo cabine, ou justificar com evidência técnica específica por que este caso merece score alto. Elevar score só pela cabine seria perigoso; FAS/configuração não está comprovada no anúncio.

## Falha adicional reproduzida

Anúncio `DAF XF FTT 530 Space Cab 2021/2021` versus único FIPE genérico `XF FTT530 6x4 (E5)` recebe score **0,99** e é vinculado automaticamente mesmo sem cabine no nome FIPE. O ramo cabine detecta tag ausente contra tag presente quando há múltiplos candidatos, mas **não rejeita candidato único sem tag frente a cabine explícita**. Esse caso existe tanto em `abe1eff` quanto na composição offline. Antes de integrar, bloquear esta inferência no ramo cabine ou documentar evidência de que a linha FIPE sem tag é exatamente a cabine anunciada.

Complemento VELOX: na minha branch, o caso exato `DAF XF FTT 530 SUPER SPACE 2021/2021` versus `XF FTT530 6x4 (diesel)(E5)` agora retorna `sem match cabine SUPER SPACE`; teste novo mantém score 0,99 como pré-condição para mostrar que o portão de cabine, não o limiar, bloqueou. Também fixei em teste o `CF FAS 300 Day Cab` com score real 0,90: permanece sem vínculo pelo limiar ≥0,95. O ramo cabine ainda precisa incorporar o primeiro bloqueio e ajustar sua expectativa do segundo antes da integração.

## Sem conflito semântico observado

- A regra de série `1a0519a` rejeita série presente de um só lado e exige candidato único alto para série Scania/geração especial DAF; a regra DAF/IVECO também exige único alto. As duas podem coexistir, com um único bloco de verificação final e motivo claro.
- A proteção XF105/CF85 de `1a0519a` e a de `abe1eff` são equivalentes para os casos exercitados. Consolidar em uma checagem; não duplicar regex ou mensagens divergentes.
- Os testes sintéticos da matriz `P0-DAF-IVECO-MATRIZ.md` passaram na composição offline. O ensaio não substitui comparação de vínculos por `anuncio_id` no F3 validado. O número 170/583 deslocadas não demonstra cobertura nem correção.

Risco operacional: a regra de alta confiança pode reduzir vínculos automáticos DAF/IVECO; a interface manual por categoria da main deve receber esses casos. Não usar F4/produção para validar a integração.

Complemento IVECO: o ramo de integração em 8581289 aceitava `IVECO TECTOR 240E25 8x2 2021/2021` com único FIPE `TECTOR 240E25 8x2 (diesel)` como alto (0,95) apesar de não haver cabine em nenhum lado. Corrigi em minha branch: código composto exato sem eixo e cabine igualmente explícitos pontua 0,90; com família+código+eixo+cabine coincidentes pontua 0,95. O portão ≥0,95 continua. O teste negativo exato usa os três modelos FIPE de `test_iveco_eixo_e_codigo_exatos_ainda_sem_confianca_alta`; na integração, o motivo textual pode ser `ambiguo eixo 8X2: confianca insuficiente` pelo portão de eixo anterior, sem mudar o resultado fail-closed.

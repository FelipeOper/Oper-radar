# Fase 0 — baseline e decisões do redesign

Data: 31/08/2026 (America/Sao_Paulo)

## Baseline Git oficial

- Branch de trabalho: `redesign-oper-radar-20260831`.
- Origem: `main` no commit `1e9b7a1` (`Merge pull request #50`).
- Worktree oficial: `.worktrees/baseline-operacional`.
- A branch anterior da raiz, `agent/separa-familias-daf`, foi preservada sem alterações.
- A branch anterior não possui commits exclusivos e está 26 commits atrás de `main`.
- As alterações rastreadas da raiz são documentais. `oper-radar-api/hoje_stats.php`, embora marcado como modificado, tem o mesmo hash no worktree, no `HEAD` e no `main`; a marcação decorre de normalização de fim de linha.

Decisão: toda implementação do redesign parte desta branch e deste worktree. A raiz antiga serve apenas como fonte preservada de documentos e artefatos ainda não versionados.

## Estado de produção conhecido

Última evidência versionada em `docs/PRODUCAO.md`, de 27/08/2026:

- repositório no servidor: `3e074f9`;
- frontend público: `assets/index-D5T4Tlda.js`;
- API pública: separação de mercados e comparador publicados em 27/08/2026;
- coleta PR: 07h/19h;
- coleta nacional: 08h/20h;
- detalhe de caminhões: a cada 30 minutos;
- FIPE local: 12h45/23h45;
- séries temporais: 23h10.

O commit publicado está atrás do baseline de desenvolvimento. Antes do próximo deploy, os hashes reais do `index.html`, bundle principal e PHPs públicos devem ser coletados no cPanel e registrados no formato definido em `docs/PRODUCAO.md`.

## Decisões de produto já confirmadas

1. O mercado principal é formado por caminhões e implementos rodoviários.
2. Agrícolas, carros/leves, vans, ônibus, implementos agrícolas, peças e demais famílias permanecem disponíveis, mas isolados do mercado principal em outra área/aba.
3. A leitura nacional deve abranger todos os estados suportados pela fonte.
4. O enriquecimento de detalhes deve trabalhar em cadência de 30 minutos.
5. O comparador precisa suportar:
   - modelo × modelo;
   - marca × marca;
   - marca + modelo × marca + modelo;
   - ano do veículo como dimensão obrigatória da comparação.
6. A cobertura FIPE precisa contemplar o DAF XF 530 quando existente no catálogo, inclusive na seleção, nos cards de anúncios e no estoque.
7. O mapa funcional define o comportamento; as imagens aprovadas definem a referência visual.
8. Dados demonstrativos dos mockups não são requisitos de dados reais.
9. Funcionalidades novas não previstas devem ser identificadas como `PROPOSTA` antes de implementação.

## Referências oficiais

- `Atualização/Mapa-Funcional-OPER-RADAR-v1.0.docx` — comportamento.
- `Atualização/Plano-mestre-redesign-Oper-Radar.docx` — plano e telas aprovadas.
- `Atualização/OPER-RADAR-Mockups-Telas-01-a-16-FINAL.zip` — referências visuais e demais mockups.
- `docs/oper-radar-redesign/auditoria-pre-implementacao.md` — auditoria integral do legado.
- Código e documentação da branch `redesign-oper-radar-20260831` — realidade técnica do baseline.

Os três arquivos da pasta `Atualização` continuam preservados na raiz antiga e não foram duplicados no Git para evitar versionar binários pesados sem uma decisão explícita de governança de ativos.

## Contratos que precisam ser fechados antes das telas

### Bloqueadores reais

1. Versão efetivamente publicada: hashes do frontend e PHPs no cPanel.
2. Contrato versionado de grupo equivalente para caminhões e implementos.
3. Dicionário único de status, freshness, amostra e confiança.
4. Origem e recorte geográfico de cada KPI e mediana.
5. Política de duplicidades nos cálculos.
6. Matriz mínima de RBAC para estoque próprio, dados pessoais, exportação e administração.

### PROPOSTAS técnicas para reduzir decisões manuais

Estas propostas não são funcionalidades aprovadas; são padrões recomendados para validação antes do código correspondente.

- **PROPOSTA — rotas:** usar rotas reais com URL serializável e fallback SPA no `.htaccess`, mantendo a API fora do rewrite.
- **PROPOSTA — transição visual:** adotar o tema claro aprovado como padrão do redesign e manter os temas antigos temporariamente em Configurações, até a migração terminar.
- **PROPOSTA — legado:** manter FIPE, Comparador, Oportunidades, Análise e Ações acessíveis numa área “Legado” durante a substituição progressiva; remover apenas após equivalência funcional comprovada.
- **PROPOSTA — comparáveis v1:** centralizar a regra em um serviço único e versionado, nunca em regras independentes por endpoint ou tela.
- **PROPOSTA — período:** rejeitar períodos sem cobertura confiável em vez de completar lacunas silenciosamente.
- **PROPOSTA — confiança:** quando amostra ou cobertura forem insuficientes, mostrar o motivo e não calcular uma recomendação numérica.
- **PROPOSTA — paginação:** migrar listas nacionais de offset para cursor estável antes de rolagem infinita.
- **PROPOSTA — acessibilidade:** adotar WCAG 2.2 AA como gate e tabela no desktop/cards no mobile para o navegador de anúncios.

## Gate para iniciar a Fundação

A Fase 1 pode começar quando:

- a branch oficial estiver limpa e identificada;
- as referências de comportamento e visual estiverem acessíveis;
- as decisões confirmadas acima estiverem registradas;
- os seis bloqueadores reais tiverem dono e tratamento explícito;
- qualquer decisão ainda não aprovada permanecer marcada como `PROPOSTA`.

O baseline Git e as decisões já confirmadas estão resolvidos neste documento. A verificação dos hashes de produção pode ocorrer em paralelo à fundação, mas deve terminar antes de qualquer publicação.

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

## Estado de produção verificado

Verificação direta no cPanel e na aplicação autenticada em 31/08/2026:

- repositório no servidor: branch `main`, commit `1e9b7a1ed0987573dc12f6b3f30b41c980252baa`, igual ao baseline de desenvolvimento;
- frontend público: `assets/index-BwVttcZm.js`;
- SHA-256 do `index.html`: `386f61055793339dd1178dd10de7976a347dc3ec1e1ca924a12cf2aff0f57955`;
- SHA-256 do bundle principal: `af6eaa03ea94160ba2295a9a00976032f45dcf1317c374c98ffb6a3d78f792ab`;
- API pública: 21 PHPs principais; manifesto agregado SHA-256 `35cc7c58631864eb0bb7820196419754448a3835ac0baa38e693dd016938d6b3`;
- coleta nacional: cron ao vivo às 08h/20h; log atualizado às 08h57;
- detalhe de caminhões: cron ao vivo a cada 30 minutos, lote 80, pausa 4s e `flock`; log atualizado às 09h00;
- FIPE local: log atualizado às 23h47; último debug documentado 16/20, ou 80%;
- séries temporais: snapshot às 23h10 e eventos às 23h35, ambos com logs atualizados na noite anterior;
- total ativo: 30.395, conciliado exatamente entre 12.275 do mercado principal e 18.120 dos demais mercados;
- DAF XF 530: presente no catálogo, nos cards e no comparador; a pendência passou a ser a ambiguidade/qualidade do vínculo automático;
- inconsistência encontrada: ano zero-km `32000` em resultados do catálogo FIPE.

O servidor está no commit correto, porém com 2 arquivos rastreados modificados e 72 itens não rastreados. Esse estado é risco de reprodutibilidade e deve ser inventariado antes de qualquer limpeza ou deploy. A leitura das últimas linhas dos logs foi interrompida pela conexão do navegador; os horários confirmam execução, mas a ausência de erros no conteúdo continua pendente.

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

1. Inventário e decisão sobre os 2 arquivos modificados e 72 itens não rastreados no servidor.
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

O baseline Git, os hashes de produção e as decisões já confirmadas estão resolvidos neste documento. Antes de qualquer publicação, ainda é obrigatório inventariar o estado sujo do servidor e reler o conteúdo recente dos logs para excluir erros silenciosos.

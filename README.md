# OPER RADAR

Plataforma de inteligência de mercado da Agência Oper para caminhões e veículos pesados.
Monitora anúncios, preserva o histórico observado e compara preços publicados com a FIPE
e com ofertas equivalentes qualificadas.

## Estrutura

```text
app/                frontend React/Vite
oper-radar-api/     API PHP consumida pelo app
fase1-coleta/       coleta, parser, detalhes e ciclo de vida dos anúncios
fase2-fipe/         catálogo, matching e curadoria FIPE
fase3-series/       snapshots diários e fundação de eventos observados
fase4-acesso/       autenticação, usuários, Minha Loja e auditoria
scripts/            verificações locais e rotinas auxiliares
tests/              contratos de integração e segurança
docs/               arquitetura, solicitações e relatórios de evolução
```

## Taxonomia e análise regional

- `docs/TAXONOMIA_MERCADO.md` define os segmentos e os filtros contextuais usados pelo
  Mercado, Concorrentes, Minha Loja e futuros comparativos.
- `docs/ESPECIFICACAO_INSIGHT_REGIONAL.md` define amostra, métricas, confiança e composição
  explicável do índice de oportunidade regional.

## Estado em 19/08/2026

- A coleta, a API e o app estão em produção no HostGator.
- O Mercado separa o foco principal (caminhões e implementos rodoviários) dos demais
  segmentos e possui comparador bilateral por marca/modelo.
- A coleta nacional usa o plano `nacional` para as 26 UFs fora do PR; o PR mantém seu
  coletor dedicado, sem duplicação.
- O detalhe dos anúncios está preparado e possui rotina própria de coleta.
- A FIPE está ativa; casos ambíguos permanecem sem vínculo automático por segurança.
- A taxonomia DAF já foi aplicada e reprocessada em produção.
- Os snapshots diários estão ativos às 23h10 desde 03/08/2026.
- A trilha de eventos, a nova proteção estatística de preços e as melhorias de UX deste
  branch estão preparadas localmente, mas ainda não foram publicadas.

## Regra de interpretação

- “Saída detectada” significa ausência confirmada no portal, não venda comprovada.
- “Dias observados” começam na primeira observação pelo Radar; não são a data original
  de publicação do anúncio.
- Comparativos de mercado usam apenas preços qualificados e exigem amostra mínima.
- Um número incerto não deve ser promovido a indicador comercial.

## Verificação local

Na raiz do projeto:

```text
python scripts/verificar_qualidade.py
```

O comando executa testes Python, testes do frontend, build, testes PHP e validações de
sintaxe quando as ferramentas correspondentes estão disponíveis.

Consulte também `CLAUDE.md` para o contexto operacional e os READMEs de cada fase.

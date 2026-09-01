# Contratos da Fundação v1

Data: 31/08/2026  
Estado: implementação incremental na branch `redesign-oper-radar-20260831`; não publicado.

## Objetivo

Fixar os contratos transversais mínimos antes da reimplementação das telas 1–3. Esta versão preserva os endpoints e telas legados enquanto adiciona navegação compartilhável, contexto global e rastreabilidade.

## Rotas

| Área existente | Rota canônica |
|---|---|
| Hoje | `/` |
| Mercado | `/mercado` |
| Comparador | `/comparador` |
| Minha Loja | `/minha-loja` |
| FIPE | `/fipe` |
| Oportunidades | `/oportunidades` |
| Concorrência | `/concorrencia` |
| Análise | `/analise` |
| Ações | `/acoes` |
| Configurações | `/configuracoes` |
| Minha conta | `/conta` |

Em produção, as rotas são prefixadas por `/oper-radar`. O fallback SPA do Apache já está configurado para devolver `index.html` quando o caminho não for um arquivo ou diretório real.

## Contexto global serializado

Parâmetros aceitos:

| Campo | Regra |
|---|---|
| `periodo` | `7d`, `30d`, `90d`, `180d` ou `12m`; padrão `30d` |
| `mercado` | `principal` ou `outros`; padrão `principal` |
| `regiao` | nome da região ou `todas` |
| `uf` | sigla com duas letras ou `todas` |
| `cidade` | texto de até 80 caracteres ou `todas` |
| `segmento` | chave da taxonomia ou `todas` |
| `grupo` | identificador do grupo equivalente, até 120 caracteres |
| `marca`, `modelo`, `ano` | recorte de veículo; ano entre 1950 e 2100 |
| `busca` | busca textual, até 160 caracteres |
| `comparacao` | identificador serializado da comparação, até 160 caracteres |

Defaults não são gravados na URL. Entradas desconhecidas são descartadas ou normalizadas. A URL é a fonte de verdade para refresh, compartilhamento e navegação Voltar/Avançar.

## Estado de navegação

- Mudança de tela usa `history.pushState`.
- Alteração de filtro/contexto usa `history.replaceState` por padrão para não criar uma entrada a cada interação.
- Antes de navegar, o shell salva a rolagem do container principal no estado da entrada.
- Ao voltar, a rota, o contexto e a rolagem são restaurados.
- Após mudança de tela, o foco vai ao título principal.

## Resposta da API

Durante a migração, os campos existentes permanecem na raiz para compatibilidade. Toda resposta enviada por `envia_json()` recebe adicionalmente:

```json
{
  "_meta": {
    "request_id": "identificador-estavel-da-requisicao",
    "api_version": "2026-08-31",
    "generated_at": "ISO-8601 UTC"
  }
}
```

O mesmo `request_id` é devolvido no header `X-Request-ID`. Erros de infraestrutura recebem código estável. O envelope integral `ok/dados/erro/meta` não será imposto silenciosamente aos endpoints legados; essa migração exige versão de endpoint ou adaptação conjunta dos consumidores.

## Autorização

- `exige_autenticacao()` continua sendo o gate padrão das APIs privadas.
- `exige_papel([...])` passa a ser o gate central para operações restritas.
- Negação usa HTTP 403 e código `SEM_PERMISSAO`.
- CSRF continua obrigatório para mutações autenticadas.

## Status, freshness, amostra e confiança

Contrato inicial:

| Dimensão | Valores canônicos |
|---|---|
| Estado de carregamento | `loading`, `ready`, `empty`, `error`, `stale`, `forbidden`, `offline` |
| Freshness | `fresh`, `delayed`, `stale`, `unknown` |
| Confiança | `alta`, `media`, `baixa`, `insuficiente` |
| Amostra | inteiro não negativo acompanhado do recorte e período |

Nenhuma recomendação numérica deve ser apresentada quando a confiança for `insuficiente`. FIPE e mediana de mercado permanecem métricas diferentes.

## Período analítico

O comparador aceita `periodo=7d|30d|90d|180d|12m`. O padrão continua sendo `30d`. A resposta informa o contrato resolvido em `periodo` e publica os campos `entradas_periodo` e `saidas_periodo`. Os campos antigos `entradas_30d` e `saidas_30d` permanecem durante a transição para não quebrar consumidores legados.

## Paginação de anúncios

- `recente`, `mais_tempo` e `movimento` usam cursor keyset opaco, vinculado aos filtros e à ordenação da consulta.
- A resposta informa `pagination_mode`, `cursor_supported`, `proximo_cursor` e `has_more`.
- Cursor malformado ou reutilizado com outro recorte recebe HTTP 422.
- `aleatorio`, preço e desvio FIPE continuam usando `offset`; não há promessa falsa de estabilidade para essas ordenações.
- O frontend aceita os dois modos durante a migração, elimina IDs duplicados e cancela consultas que perderam relevância.

## Consultas do frontend

GETs compartilhados passam por uma camada única com deduplicação de requisições simultâneas, cache curto configurável, propagação de erros e cancelamento por consumidor. Listagens mutáveis e comparações explícitas desativam cache.

## Grupo equivalente

O contrato de negócio definitivo continua bloqueado por decisão de produto. Até sua aprovação, o frontend aceita apenas um identificador opaco `grupo` na URL e não cria regras próprias de equivalência. Qualquer regra provisória deve ser marcada como `PROPOSTA` e não pode alimentar recomendação de preço.

A estrutura backend `rascunho-1` explicita `regras: null`, `calculavel: false` e `apto_para_recomendacao: false`. Ela existe somente para versionar a futura decisão sem cristalizar uma taxonomia provisória.

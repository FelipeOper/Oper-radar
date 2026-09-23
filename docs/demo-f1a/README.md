# F1a · modo demo local do app real

**Branch:** `agent/ds-demo`
**Base F0:** `7e16dfa2`
**Modo:** `VITE_DEMO=1`
**Servidor:** `npm run dev -- --host 127.0.0.1` → `http://127.0.0.1:5173/oper-radar/`

## Garantias de escopo

- `VITE_DEMO=1` intercepta `apiGet`, `apiFetch` e `apiPost` em `src/apiClient.js`/`src/demoFixtures.js`.
- Sem `VITE_DEMO`, o cliente continua usando `API_BASE_URL`, `fetch`, cache, AbortController e contratos atuais.
- A sessão demo é local (`Pessoa Demo`, `demo@example.invalid`, CSRF fictício); nenhuma credencial ou chamada externa é feita.
- Não houve mudança de rota, barra mobile, shell, CSS, `theme.css` ou imports do design system. F1 visual permanece fora do escopo.

## Cobertura de endpoints e fields

| Endpoint/ação | Fixture e fields principais |
|---|---|
| `auth.php` GET/POST | `autenticado`, `csrf`, `usuario.{id,nome,email,papel}`; login é bypassado somente no demo e logout/profile retornam mutação local. |
| `kpis.php` | `ufs_ativas`, `regioes_ativas`, `ultima_coleta`, `revendas_monitoradas`, `anuncios_ativos_revalidados`, `saidas_detectadas_mes`, `entradas_48h`, `saidas_48h`, `ciclo_referencia`. |
| `hoje_stats.php` | `kpis`, `top_modelos`, `regioes_saidas`, `top_lojas_novos`, `top_lojas_saidas`, `feed`. |
| `facetas.php` / `comparador.php?facetas=1` | UFs, regiões, cidades, lojistas, `por_uf`, `revendas_por_uf`, marcas, modelos, anos, períodos, categorias e resumo. |
| `anuncios.php` | Lista de anúncios com contrato de `anuncio_id`, portal id, título, marca/modelo/anos, preço, FIPE, mercado, qualidade, revenda, cidade/UF, datas e status; total/paginação/escopo/meta demo. |
| `mercado_painel.php` | `resumo`, `geografia.ufs/cidades`, `modelos`, `selecionado`, `anuncios`, `escopo`. |
| `comparador.php` | `lado_a`, `lado_b`, `comparaveis`, `resultado`, com preços medianos, ofertas e rótulos bilaterais. |
| `lojistas.php` / `lojista_detalhe.php` | Lista e detalhe de lojistas, anúncios, saídas, reduções e eventos locais. |
| `anuncio_detalhe.php` | Anúncio, histórico de preço e similares para o diálogo lateral. |
| `fipe_status.php` | Disponibilidade, provedor “fixture local”, data e cobertura. |
| `placa_consulta.php` | Estado `modo=status` e consulta de placa placeholder `AAA0A00`; veículo, FIPE e mercado demonstrativos. |
| `fipe_consulta.php` | Catálogo `itens/fipes`, código, marca/modelo/ano, preço FIPE, amostra, confiança, desvio e UFs. |
| `insights.php` | KPIs FIPE/cobertura, cidades, lojistas e atualização para Análise. |
| `analista_status.php` | `disponivel`, `configurado`, `modo: demo`, aviso explícito sem contexto de backend. |
| `analista.php` POST | Resposta estática de leitura de preço/FIPE/mediana, fonte “fixture local”, `demo: true`. |
| `minha_loja.php` / `minha_loja_detalhe.php` | Estoque demo, placa, UF, preço anunciado, FIPE, mercado, confiança, dias e origem. |
| `minha_loja_xml.php` POST | Análise local e resultado de importação: válidos, novos, ausentes, sem id estável, importados/atualizados. Não grava servidor. |

## Estados explícitos

- **XML/importação:** análise local antes da confirmação; 1 item válido, nenhum sem ID estável, resultado de 1 importado. A fixture não envia arquivo nem altera backend.
- **Consulta de placa:** status disponível em modo demo e resposta com placa placeholder, veículo e FIPE fictícios.
- **Analista IA:** status configurado apenas para a demonstração e resposta local fixa; texto informa que não há contexto de backend.
- Valores, placas, nomes, FIPE e eventos são inequivocamente fictícios.

## Baseline das 12 páginas atuais

Roteiros HTTP (sem alteração de URL) para repetir no portal:

1. `/oper-radar/` — Hoje
2. `/oper-radar/mercado` — Mercado
3. `/oper-radar/comparador` — Comparador
4. `/oper-radar/oportunidades` — Oportunidades
5. `/oper-radar/concorrencia` — Concorrentes
6. `/oper-radar/acoes` — Ações
7. `/oper-radar/fipe` — FIPE (aba placa e aba Catálogo)
8. `/oper-radar/conta` — Conta
9. `/oper-radar/minha-loja` — Minha Loja e detalhe
10. `/oper-radar/configuracoes` — Configurações/DashboardLayou
11. `/oper-radar/analise` — Análise/Analista IA
12. `/oper-radar/fipe?modo=catalogo` — estado reproduzível do Catálogo FIPE dentro da rota FIPE

A captura real via portal confirmou `/oper-radar/` em HTTP com sidebar atual, KPIs e fixtures demo. O conector não permitiu persistir PNGs nem aplicar override confiável de viewport 1440×desktop e 390×mobile neste worktree. Não há prints fabricados; o roteiro acima e o comando de servidor são as referências reproduzíveis. A autenticação é bypassada no demo, então todas as rotas ficam acessíveis para a captura manual.

## Verificações

- `npm test`: 33/33.
- `npm run build`: passou com `VITE_DEMO=1`.
- `npm run lint`: 0 warnings/erros.
- `app/dist` e `app/node_modules` foram removidos antes do commit.
- F1 visual não iniciada.

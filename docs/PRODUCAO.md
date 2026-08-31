# OPER RADAR — estado verificado de produção

> Fonte operacional de verdade. Atualizar após cada publicação, migração ou mudança de cron.
> Não registrar senhas, tokens, cookies ou conteúdo do arquivo `.oper-radar.env`.

## Última verificação

- Data: 31/08/2026, entre 09h00 e 09h15 (America/Sao_Paulo)
- Repositório no servidor: branch `main`, commit `1e9b7a1ed0987573dc12f6b3f30b41c980252baa`
- Hospedagem: HostGator, PHP 8.3, Python 3.9 e MySQL 5.7.44-48
- Banco: `pro93061_radar_oper`
- Frontend público: `assets/index-BwVttcZm.js`
- SHA-256 do `index.html`: `386f61055793339dd1178dd10de7976a347dc3ec1e1ca924a12cf2aff0f57955`
- SHA-256 do bundle principal: `af6eaa03ea94160ba2295a9a00976032f45dcf1317c374c98ffb6a3d78f792ab`
- API pública: 21 PHPs no nível principal; SHA-256 do manifesto agregado e ordenado: `35cc7c58631864eb0bb7820196419754448a3835ac0baa38e693dd016938d6b3`

O commit do repositório no servidor não identifica sozinho a versão do frontend ou dos PHPs
públicos. Essas peças são copiadas manualmente para diretórios web separados e precisam ser
registradas individualmente em cada release.

## Componentes ativos

| Componente | Estado verificado | Evidência operacional |
|---|---|---|
| Frontend React | OK | sessão administrativa carregada; bundle `index-BwVttcZm.js` |
| API PHP | Ativa e privada | `auth.php` HTTP 200; endpoints de dados HTTP 401 sem sessão |
| Autenticação | Ativa | 1 usuário Admin ativo; cookie Secure, HttpOnly e SameSite=Lax |
| Coleta PR | OK, 07h/19h | cadência preservada na configuração conhecida; dados do ciclo 07h refletidos na interface |
| Coleta nacional | OK por cadência, 08h/20h | cron ao vivo confirmado; `coleta-expansao.log` atualizado às 08h57 de 31/08; conteúdo final pendente de releitura |
| Detalhes de caminhões | ATENÇÃO, a cada 30 min | cron ao vivo com lote 80, pausa 4s e `flock`; `detalhe.log` atualizado às 09h00; conteúdo e capacidade da fila ainda precisam ser medidos |
| FIPE local | ATENÇÃO, 12h45/23h45 | `fipe-local.log` atualizado às 23h47 de 30/08; última amostra debug registrada: 16/20, ou 80% |
| FIPE mensal | Ativa, dias 1–10 às 13h15 | referência 336 em atualização incremental |
| FIPE bootstrap | Ativa, dias 11–31 às 14h30 | marcador de conclusão habilitado |
| Séries temporais | OK, 23h10 | `snapshot-diario.log` atualizado às 23h10 e `eventos-diario.log` às 23h35 de 30/08 |
| Monitoramento | OK por cadência | `monitoramento.log` atualizado às 23h30 de 30/08 |
| Minha Loja/XML | Ativa no banco/API | tabelas presentes e com registros na auditoria inicial |
| Curadoria FIPE/KM | Ativa no banco/API | logs e sugestões presentes |

## Baseline nacional de 31/08/2026

- 1.583 revendas monitoradas.
- 30.395 anúncios ativos revalidados no ciclo 07h, em 21 UFs, 5 regiões e duas leituras diárias.
- 12.275 anúncios no mercado principal: 11.823 caminhões e 452 implementos rodoviários.
- 18.120 anúncios nos demais mercados: 111 ônibus/vans, 211 leves, 7.607 agrícolas, 1.135 construção, 301 peças e 8.755 outros.
- Conciliação de volume: `12.275 + 18.120 = 30.395`; a soma das facetas bate exatamente com o total ativo exibido.
- Distribuição do mercado principal: Sul 5.217, Sudeste 5.578, Centro-Oeste 1.234, Nordeste 202 e Norte 44.
- Movimento em 48 horas: 136 entradas e 75 saídas. Saídas no mês: 2.755.

## Baseline FIPE de 31/08/2026

- Catálogo local: 1.974 modelos de caminhão, 29 marcas e 11.381 preços/referências.
- Referência vigente: agosto de 2026, código 336.
- DAF: 112 modelos no catálogo.
- Busca `DAF XF 530`: 57 referências FIPE e 168 anúncios de mercado.
- O comparador oferece recortes por marca, modelo e marca + modelo, com ano-modelo independente nos dois lados.
- DAF 530 está disponível no comparador nas famílias XF FT 530, XF FTS 530, XF FTT 530, XF FTT OFF-ROAD 530 e XF105 530.
- Conclusão: o DAF XF 530 não está mais ausente. A lacuna atual é a correspondência automática; muitos anúncios exibem várias sugestões e permanecem em validação, processamento ou sem referência segura.
- Última amostra debug documentada: 16 vínculos em 20 pendentes, taxa de 80%. Ela é o baseline comparável até uma nova execução do `--modo=debug` no servidor.
- Inconsistência visual encontrada: registros FIPE zero-km aparecem com ano `32000` em alguns resultados; normalizar antes de exibir.

## Evidência dos logs em 31/08/2026

| Log | Última modificação observada | Situação |
|---|---:|---|
| `coleta-expansao.log` | 31/08 08h57 | compatível com a coleta nacional das 08h |
| `detalhe.log` | 31/08 09h00 | compatível com a cadência de 30 minutos |
| `monitoramento.log` | 30/08 23h30 | compatível com o cron noturno |
| `snapshot-diario.log` | 30/08 23h10 | compatível com o cron diário |
| `eventos-diario.log` | 30/08 23h35 | compatível com o cron diário |
| `fipe-local.log` | 30/08 23h47 | compatível com o ciclo das 23h45 |
| `fipe-mensal.log` | 10/08 13h15 | compatível com a janela mensal dos dias 1–10 |
| `fipe-bootstrap.log` | 25/08 14h35 | arquivo existe; o marcador de conclusão pode encerrar ciclos sem nova saída |

Os horários e tamanhos foram lidos diretamente no cPanel. A conexão do navegador foi interrompida antes da releitura das últimas linhas; portanto esta verificação confirma cadência/freshness, mas não autoriza afirmar “zero erros no conteúdo” dos arquivos. Esse ponto permanece como checagem curta obrigatória na próxima sessão estável.

## Risco de reprodutibilidade do servidor

- O repositório do servidor está no commit correto, mas não está limpo: 2 arquivos rastreados modificados e 72 itens não rastreados.
- Rastreado e modificado: `fase3-series/executar_snapshot_job.sh` e `fase3-series/instalar_cron_series.sh`.
- Os não rastreados incluem bundles antigos, arquivos de deploy, backups e artefatos operacionais.
- Não apagar nem sobrescrever esses itens sem inventário, backup e comparação; o estado publicado não é reproduzível apenas pelo commit Git.

## Baseline histórico de 27/08/2026

- 30.279 anúncios ativos em 21 UFs com revendas cadastradas no portal.
- 12.270 anúncios no mercado principal de caminhões e implementos rodoviários.
- 18.009 anúncios em outros mercados.
- AC, AL, AM, AP, MA e RR concluíram como `sem_revendas`.
- Primeira leitura de SC, RS, SP, RJ, MG e ES: 931 revendas, 17.673 ativos e zero erros.
- Detalhe: 7.871 caminhões ativos aguardavam enriquecimento antes da cadência de 30 minutos.
- FIPE: 1.787 de 11.810 caminhões ativos vinculados; debug local vinculou 16 de 20 pendentes.

## Integrações intencionalmente desativadas

| Integração | Motivo |
|---|---|
| Analista IA | `ANTHROPIC_API_KEY` ausente; evita custo e uso não autorizado |
| Consulta por placa | token do provedor veicular ausente |

## Banco na ativação da Fase 3

- 597 revendas em 15 UFs.
- 14.727 anúncios materializados no primeiro snapshot.
- 12.799 anúncios ativos no primeiro snapshot.
- 11.381 preços FIPE no catálogo local.
- Referência 336: 4.387 preços atualizados em 03/08.
- Referência 335: 6.994 preços aguardando retomada automática.
- Apenas 2 anúncios ativos ainda estavam ligados à referência anterior.
- Banco com aproximadamente 15,1 MB antes do início das séries.
- Cota da conta: 100 GB; aproximadamente 5,5 GB usados na verificação.

## Validações pendentes

1. Após 04/08 às 13h15, confirmar que o lote FIPE de 2.500 terminou com resumo final e
   reduziu a fila da referência 335.
2. Após 04/08 às 23h10, confirmar uma segunda data em `anuncio_snapshot` e verificar as
   primeiras mudanças de preço.
3. Registrar o hash ou commit de cada futura publicação do frontend e da API.
4. Não remover bundles antigos da pasta pública até existir backup e confirmação de quais
   arquivos são referenciados pelo `index.html` ativo.

## Registro mínimo de release

Cada publicação deve registrar:

- data e responsável;
- commit Git do servidor;
- nome e SHA-256 do bundle principal do frontend;
- SHA-256 de cada PHP publicado;
- migrações aplicadas;
- alterações de cron;
- validações HTTP, banco e logs realizadas;
- caminho do backup utilizado para reversão.

# OPER RADAR — estado verificado de produção

> Fonte operacional de verdade. Atualizar após cada publicação, migração ou mudança de cron.
> Não registrar senhas, tokens, cookies ou conteúdo do arquivo `.oper-radar.env`.

## Última verificação

- Data: 03/08/2026 (America/Sao_Paulo)
- Repositório no servidor: `1ff403d`
- Hospedagem: HostGator, PHP 8.3, Python 3.9 e MySQL 5.7.44-48
- Banco: `pro93061_radar_oper`
- Frontend público: `assets/index-B9Z9kSss.js` (bundle de 24/07/2026)
- API pública: arquivos publicados entre 19/07 e 22/07/2026

O commit do repositório no servidor não identifica sozinho a versão do frontend ou dos PHPs
públicos. Essas peças são copiadas manualmente para diretórios web separados e precisam ser
registradas individualmente em cada release.

## Componentes ativos

| Componente | Estado verificado | Evidência operacional |
|---|---|---|
| Frontend React | Ativo | HTTP 200; bundle `index-B9Z9kSss.js` |
| API PHP | Ativa e privada | `auth.php` HTTP 200; endpoints de dados HTTP 401 sem sessão |
| Autenticação | Ativa | 1 usuário Admin ativo; cookie Secure, HttpOnly e SameSite=Lax |
| Coleta PR | Ativa, 07h/19h | 333 revendas na última rodada observada, zero erros |
| Expansão regional | Ativa, 07h30/19h30 | 14 UFs além do PR; estados sem cadastro ainda aparecem como erro |
| FIPE local | Ativa, 12h45/23h45 | matching e sugestões executados sem chamadas externas |
| FIPE mensal | Ativa, dias 1–10 às 13h15 | referência 336 em atualização incremental |
| FIPE bootstrap | Ativa, dias 11–31 às 14h30 | marcador de conclusão habilitado |
| Séries temporais | Ativa, 23h10 | primeiro snapshot em 03/08/2026; cron instalado e executor testado |
| Minha Loja/XML | Ativa no banco/API | tabelas presentes e com registros na auditoria inicial |
| Curadoria FIPE/KM | Ativa no banco/API | logs e sugestões presentes |

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

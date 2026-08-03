# Plano de atualização do Python em produção

## Situação e objetivo

A hospedagem foi verificada com Python 3.9, versão que encerrou o suporte de segurança em
31/10/2025. O objetivo é migrar os jobs do OPER RADAR para Python 3.13 ou, se o cPanel não
oferecer essa versão, para a versão suportada mais recente com manutenção ativa.

Esta migração não deve ser combinada com alteração de banco, cron, FIPE ou coleta. Cada etapa
precisa ser validada e reversível antes da seguinte.

## Inventário confirmado em 03/08/2026

- `python3` resolve para `/usr/bin/python3.9`;
- versão disponível: Python 3.9.25;
- `pip` 20.3.4;
- `requests` 2.25.1;
- `mysql-connector-python` 8.0.33;
- nenhum ambiente virtual encontrado na conta;
- nenhum interpretador alternativo acessível em `/usr/local`, `/opt` ou no jailshell;
- Python Selector/Setup Python App indisponível para a conta.

**Estado:** migração bloqueada pela hospedagem. Não compilar Python manualmente, não substituir
`/bin/python3` e não alterar os crons enquanto o provedor não oferecer uma versão suportada.

Como mitigação, os wrappers aceitam `OPER_RADAR_PYTHON` e mantêm `python3` como fallback. Essa
variável só deve receber um caminho absoluto depois que um interpretador paralelo for validado.

## Condições para iniciar

- segunda data do snapshot diário confirmada;
- monitoramento das 12h15 e 23h30 executando normalmente;
- lote mensal FIPE de 2.500 registros concluindo dentro da janela da hospedagem;
- backup atual do `crontab` e do arquivo de ambiente disponível;
- CI verde em Python 3.9 e Python 3.13;
- nenhuma ocorrência crítica aberta na coleta.

## Etapa 1 — inventário somente de leitura

Registrar, sem alterar o servidor:

- versão e caminho resolvido por `python3`;
- versões adicionais oferecidas pelo cPanel;
- versão do `pip` associada a cada interpretador;
- pacotes usados atualmente e seus caminhos;
- espaço disponível e cota de arquivos;
- todos os crons e wrappers que chamam `python3` diretamente.

O resultado do inventário deve ser anexado ao registro operacional, sem incluir senhas,
tokens ou o conteúdo do arquivo `.oper-radar.env`.

## Etapa 2 — ambiente paralelo

Criar um ambiente virtual fora do diretório público e sem substituir o Python atual. Instalar
nele apenas os requisitos necessários para coleta, FIPE, séries e monitoramento. O ambiente
antigo continua atendendo todos os crons durante essa etapa.

Não copiar o arquivo de ambiente para o virtualenv. Os jobs devem continuar carregando as
credenciais somente de `/home1/pro93061/.oper-radar.env`.

## Etapa 3 — validação sem escrita de produção

Executar com o novo interpretador:

- testes unitários da coleta;
- testes FIPE com cache/mocks e sem chamadas pagas;
- testes de contrato;
- compilação sintática de todos os arquivos Python;
- importação de `requests` e `mysql.connector`;
- conexão `SELECT 1` somente após autorização específica.

Não executar scraper real, migração, snapshot ou atualização FIPE nessa etapa.

## Etapa 4 — ativação controlada

Antes da mudança:

1. salvar uma nova cópia do `crontab`;
2. registrar o caminho do interpretador antigo e do novo;
3. alterar primeiro um wrapper de baixo risco para usar caminho explícito do novo Python;
4. executar uma rodada observada;
5. confirmar status, logs, banco e duração;
6. somente então migrar os demais wrappers, um grupo por vez.

Os crons não devem depender de qual versão o comando genérico `python3` aponta. A versão
aprovada precisa ser chamada por caminho explícito ou por uma variável operacional validada.

## Rollback

Em qualquer erro de importação, conexão, duração, memória ou resultado:

1. restaurar o `crontab` salvo;
2. voltar os wrappers ao caminho do Python anterior;
3. executar o monitoramento;
4. confirmar que a coleta seguinte iniciou normalmente;
5. preservar o ambiente novo para diagnóstico, sem removê-lo durante o incidente.

## Critérios de conclusão

- todos os jobs usam uma versão de Python com suporte de segurança;
- duas janelas completas de coleta executadas sem regressão;
- FIPE local, mensal e bootstrap validados no novo interpretador;
- dois snapshots e dois monitoramentos executados normalmente;
- nenhuma chamada de cron permanece dependente do Python 3.9;
- documentação de produção registra versão, caminho, data, responsável e rollback.

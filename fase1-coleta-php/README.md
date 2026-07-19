# OPER RADAR — Fase 1, caminho PHP (sem terminal/Python no HostGator)

Esta pasta é a **versão alternativa** de `fase1-coleta/`, para o caso do seu Plano M não
liberar terminal SSH completo nem "Setup Python App". PHP já vem pronto em qualquer
hospedagem cPanel (cURL e MySQLi inclusos), então essa versão **não depende de instalar
nada** — só precisa do banco de dados e do cron.

## Por que não usar Python + MySQL remoto em vez disso

Cheguei a considerar rodar o scraper em outro lugar (ex: GitHub Actions) conectando
remotamente no MySQL do HostGator. Descartei essa opção porque exigiria liberar acesso
remoto ao banco para qualquer IP (o GitHub Actions não tem IP fixo), o que deixa um banco
de dados exposto na internet só protegido por senha — um risco real de segurança. A versão
PHP roda **inteiramente dentro do HostGator**, sem abrir nenhuma porta pro mundo externo.

## Equivalência com a versão Python

| Python (`fase1-coleta/`)      | PHP (`fase1-coleta-php/`) | Testado nesta sessão |
|---|---|---|
| `parser.py`                   | `parser.php`              | ✅ 9/9 anúncios reais, resultado idêntico ao Python |
| `diff_logic.py`                | `diff_logic.php`          | ✅ mesmos 5 ciclos simulados, mesmo resultado |
| `scraper_hostgator.py`         | `scraper.php`             | ✅ lint ok; regras de descoberta de URL testadas com padrão real |
| `taxonomia.json`               | (reaproveitado, mesmo arquivo) | — |
| `schema_mysql.sql`             | (reaproveitado, mesmo arquivo) | — |

A lógica de negócio (extração de campos, regra de 2 confirmações antes de marcar como
removido) é a mesma nas duas versões — só a linguagem de implementação muda.

## Deploy no cPanel (sem terminal)

1. **Banco de dados**: mesmo passo da versão Python — criar banco MySQL + usuário no
   cPanel, rodar `schema_mysql.sql` via phpMyAdmin.
2. **Enviar os arquivos**: usar o **Gerenciador de Arquivos** do cPanel (ou FTP) para subir
   `parser.php`, `diff_logic.php`, `scraper.php` e `taxonomia.json` numa pasta, ex:
   `/home/SEUUSUARIO/oper-radar/`.
3. **Credenciais protegidas**: crie `/home/SEUUSUARIO/.oper-radar.env` a partir do
   `.env.example`, fora da pasta pública, e aplique permissão `600`.
4. **Tarefas Cron** (Avançado → Tarefas Cron no cPanel):
   ```
   0 7  * * * set -a; . /home/SEUUSUARIO/.oper-radar.env; set +a; php /home/SEUUSUARIO/oper-radar/scraper.php --janela=07h --uf=PR >> /home/SEUUSUARIO/oper-radar/coleta.log 2>&1
   0 19 * * * set -a; . /home/SEUUSUARIO/.oper-radar.env; set +a; php /home/SEUUSUARIO/oper-radar/scraper.php --janela=19h --uf=PR >> /home/SEUUSUARIO/oper-radar/coleta.log 2>&1
   ```
   Sem precisar de terminal nem de instalar bibliotecas — o cPanel só precisa saber o
   caminho do `php` (geralmente já funciona com `php` direto; se não, o suporte HostGator
   informa o caminho completo, ex: `/usr/bin/php`).

## O que ainda não pode ser validado sem acesso real ao servidor

- Conexão de verdade com o MySQL do HostGator (aqui só testei a lógica com PHP puro, sem banco real)
- Se o cron do cPanel realmente encontra o `php` no PATH, ou se precisa do caminho completo
- Permissões de escrita na pasta de log (`coleta.log`)

Assim que tiver certeza sobre terminal/Python (resposta do suporte), me avisa — se vier
positivo, seguimos com a versão Python (já mais testada em conjunto); se negativo, essa
versão PHP já está pronta pra configurar.

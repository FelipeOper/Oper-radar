# Setup do VPS para coleta multi-região — OPER RADAR

O objetivo: tirar a coleta pesada do HostGator (que satura a 25% CPU) e passar
para um VPS barato, que grava no MESMO banco MySQL do HostGator via conexão remota.

## 1. Contratar o VPS

Qualquer um destes serve (Ubuntu 22.04, 1-2 vCPU, 2GB RAM):
- **Contabo** VPS S — ~€5/mês (mais barato, alemão)
- **Hetzner** CX22 — ~€4/mês (excelente custo-benefício)
- **DigitalOcean** / **Vultr** — ~US$6/mês (interface mais simples)

Anota o **IP do VPS** — vamos precisar dele no passo 3.

## 2. Preparar o VPS (uma vez só)

Conecta via SSH (`ssh root@IP_DO_VPS`) e roda:

```bash
apt update && apt install -y python3 python3-pip git
pip3 install requests mysql-connector-python==8.0.33 beautifulsoup4 lxml
git clone https://github.com/FelipeOper/Oper-radar.git
cd Oper-radar/fase1-coleta
```

## 3. Liberar conexão remota do MySQL (no cPanel do HostGator)

O VPS precisa escrever no banco que está no HostGator. Por padrão o MySQL
do HostGator só aceita conexão local (`localhost`). Para liberar o VPS:

1. cPanel → **Bancos de Dados MySQL Remotos** (ou "Remote MySQL")
2. Em "Host de acesso", adiciona o **IP do VPS**
3. Salva

Agora o `--db-host` deixa de ser `localhost` e passa a ser o **hostname do
HostGator** (ex: `br348.hostgator.com.br` — está no email de boas-vindas do
HostGator, ou no cPanel em "Informações Gerais" → "Nome do servidor").

## 4. Teste inicial (um estado só, pra validar)

```bash
cd ~/Oper-radar/fase1-coleta
python3 scraper_hostgator.py --janela=07h --uf=MT \
  --db-host=br348.hostgator.com.br \
  --db-user=pro93061_pro93061 --db-pass='Emgrupo221@' \
  --db-name=pro93061_radar_oper
```

Se aparecer `[MT] N revendas encontradas` e começar a listar, funcionou.
Se der erro de conexão, o passo 3 (MySQL remoto) não foi liberado corretamente.

## 5. Coleta da região inteira

```bash
python3 coleta_multi_uf.py --regiao=centro-oeste --janela=07h \
  --db-host=br348.hostgator.com.br \
  --db-user=pro93061_pro93061 --db-pass='Emgrupo221@' \
  --db-name=pro93061_radar_oper
```

Ele roda MT, depois MS, GO, DF — um de cada vez, com 30s de descanso entre eles.

## 6. Agendar no VPS (cron próprio, 2x/dia)

```bash
crontab -e
```

Adiciona (ajusta o caminho do db-host):

```
0 7  * * * cd /root/Oper-radar/fase1-coleta && python3 coleta_multi_uf.py --regiao=centro-oeste --janela=07h --db-host=br348.hostgator.com.br --db-user=pro93061_pro93061 --db-pass='Emgrupo221@' --db-name=pro93061_radar_oper >> /root/coleta.log 2>&1
0 19 * * * cd /root/Oper-radar/fase1-coleta && python3 coleta_multi_uf.py --regiao=centro-oeste --janela=19h --db-host=br348.hostgator.com.br --db-user=pro93061_pro93061 --db-pass='Emgrupo221@' --db-name=pro93061_radar_oper >> /root/coleta.log 2>&1
```

## Divisão de trabalho recomendada

- **PR** continua sendo coletado pelo **HostGator** (já funciona, não mexe)
- **Centro-Oeste** (e futuras regiões) pelo **VPS**

Assim o HostGator nunca fica sobrecarregado, e o VPS cuida da expansão.
Quando quiser adicionar Nordeste, é só trocar `--regiao=centro-oeste` por
`--regiao=nordeste` numa nova linha do cron do VPS.

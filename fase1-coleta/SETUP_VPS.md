# OPER RADAR — coleta multi-região no VPS

Este guia configura o VPS para gravar no mesmo MySQL usado pelo OPER RADAR sem colocar
senha no Git, no histórico do shell, no `crontab` ou na lista de processos.

## 1. Preparar o servidor

```bash
git clone https://github.com/FelipeOper/Oper-radar.git /root/Oper-radar
cd /root/Oper-radar/fase1-coleta
python3 -m pip install -r requirements.txt
```

No cPanel do HostGator, autorize somente o IP fixo do VPS em **MySQL remoto**. Não use `%`
como host permitido.

## 2. Guardar as credenciais fora do repositório

Crie `/root/.oper-radar.env` no VPS:

```bash
touch /root/.oper-radar.env
chmod 600 /root/.oper-radar.env
nano /root/.oper-radar.env
```

Conteúdo, preenchido diretamente no servidor:

```bash
export OPER_RADAR_DB_HOST='HOST_MYSQL'
export OPER_RADAR_DB_USER='USUARIO_MYSQL'
export OPER_RADAR_DB_PASS='SENHA_MYSQL'
export OPER_RADAR_DB_NAME='BANCO_MYSQL'
```

Nunca copie esse arquivo para o repositório e nunca envie seu conteúdo por mensagem.

## 3. Testar uma região

```bash
set -a
source /root/.oper-radar.env
set +a
cd /root/Oper-radar/fase1-coleta
python3 coleta_multi_uf.py --regiao=centro-oeste --janela=07h
```

O coletor filho recebe as credenciais pelo ambiente; a senha não aparece nos argumentos do
processo.

## 4. Agendar

Edite com `crontab -e`:

```cron
0 7  * * * bash -lc 'set -a; source /root/.oper-radar.env; set +a; cd /root/Oper-radar/fase1-coleta && python3 coleta_multi_uf.py --regiao=centro-oeste --janela=07h >> /root/coleta.log 2>&1'
0 19 * * * bash -lc 'set -a; source /root/.oper-radar.env; set +a; cd /root/Oper-radar/fase1-coleta && python3 coleta_multi_uf.py --regiao=centro-oeste --janela=19h >> /root/coleta.log 2>&1'
```

## 5. Verificar

```bash
tail -50 /root/coleta.log
```

No app, as regiões só devem ser habilitadas quando houver anúncios ativos coletados nelas.

## Segurança

- Rotacione imediatamente qualquer senha que tenha sido commitada, mesmo depois de removê-la.
- O histórico Git continua contendo versões antigas até uma limpeza específica; a rotação é
  o que invalida a credencial exposta.
- Use um usuário MySQL exclusivo, com acesso apenas ao banco do radar.
- Não coloque chaves ou senhas em documentação, exemplos, logs ou comandos do cron.

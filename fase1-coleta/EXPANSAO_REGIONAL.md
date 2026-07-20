# Expansao regional no HostGator

O plano `expansao` coleta, em sequencia, Centro-Oeste, Nordeste e Norte. UFs sem
revendas publicadas no portal sao registradas como `sem_revendas`. O lock impede dois
ciclos simultaneos e o checkpoint retoma somente os estados pendentes.

## Teste diagnostico

Com as variaveis `OPER_RADAR_DB_*` ja carregadas:

```bash
cd /home1/SEUUSUARIO/agenciaoper.com.br/oper-radar/fase1-coleta
python3 coleta_multi_uf.py --ufs=DF --janela=07h
python3 status_coleta.py
```

## Agendamento recomendado

Mantenha PR as 07h e 19h. Instale a expansao as 01h e 13h com:

```bash
bash instalar_cron_expansao.sh
```

O instalador preserva as entradas existentes, faz backup do cron e pode ser executado
novamente sem duplicar a expansao. Assim os trabalhos nao concorrem entre si.

Para acompanhar sem mostrar senhas:

```bash
python3 status_coleta.py
tail -50 /home1/SEUUSUARIO/logs/coleta-expansao.log
```

Se o provedor encerrar uma execucao longa, o cron seguinte usa o checkpoint do mesmo
dia e janela. Um VPS continua sendo uma opcao futura, mas nao e requisito para iniciar.

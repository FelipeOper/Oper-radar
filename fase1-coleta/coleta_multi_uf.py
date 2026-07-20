"""OPER RADAR — orquestrador seguro de coleta multi-UF.

Executa um estado por vez, impede sobreposicao entre ciclos e salva um checkpoint
para retomar uma coleta interrompida sem repetir estados ja concluidos.

Exemplos:
  python3 coleta_multi_uf.py --plano=expansao --janela=07h
  python3 coleta_multi_uf.py --regioes=centro-oeste,nordeste,norte --janela=19h
  python3 coleta_multi_uf.py --ufs=MT,MS,GO,DF --janela=07h
"""
import argparse
import fcntl
import json
import os
import subprocess
import sys
import time
from datetime import datetime
from pathlib import Path

REGIOES = {
    "sul": ["PR", "SC", "RS"],
    "sudeste": ["SP", "RJ", "MG", "ES"],
    "centro-oeste": ["MT", "MS", "GO", "DF"],
    "nordeste": ["BA", "PE", "CE", "MA", "PB", "RN", "AL", "PI", "SE"],
    "norte": ["PA", "RO", "TO", "AM", "RR", "AC", "AP"],
}
PLANOS = {
    "expansao": REGIOES["centro-oeste"] + REGIOES["nordeste"] + REGIOES["norte"],
    "brasil": sum(REGIOES.values(), []),
}
UFS_VALIDAS = set(sum(REGIOES.values(), []))
STATUS_CONCLUIDOS = {"ok", "sem_revendas"}


def lista_sem_repetir(itens):
    return list(dict.fromkeys(itens))


def resolve_ufs(args):
    if args.plano:
        ufs = PLANOS[args.plano]
    elif args.regiao:
        ufs = REGIOES[args.regiao]
    elif args.regioes:
        nomes = [r.strip().lower() for r in args.regioes.split(",") if r.strip()]
        invalidas = [r for r in nomes if r not in REGIOES]
        if invalidas:
            raise ValueError("regioes invalidas: " + ", ".join(invalidas))
        ufs = [uf for nome in nomes for uf in REGIOES[nome]]
    else:
        ufs = [u.strip().upper() for u in args.ufs.split(",") if u.strip()]

    ufs = lista_sem_repetir(ufs)
    invalidas = [uf for uf in ufs if uf not in UFS_VALIDAS]
    if invalidas:
        raise ValueError("UFs invalidas: " + ", ".join(invalidas))
    return ufs


def le_status(caminho):
    try:
        with caminho.open(encoding="utf-8") as arquivo:
            dados = json.load(arquivo)
            return dados if isinstance(dados, dict) else {"ciclos": {}}
    except (FileNotFoundError, json.JSONDecodeError, OSError):
        return {"ciclos": {}}


def salva_status(caminho, dados):
    caminho.parent.mkdir(parents=True, exist_ok=True)
    ciclos = dados.setdefault("ciclos", {})
    for chave in sorted(ciclos)[:-8]:
        del ciclos[chave]
    temporario = caminho.with_suffix(caminho.suffix + ".tmp")
    with temporario.open("w", encoding="utf-8") as arquivo:
        json.dump(dados, arquivo, ensure_ascii=False, indent=2, sort_keys=True)
    os.replace(temporario, caminho)


def atualiza_status(caminho, dados, ciclo, uf, status, detalhe="", duracao=0):
    agora = datetime.now().astimezone().isoformat(timespec="seconds")
    registro = dados.setdefault("ciclos", {}).setdefault(ciclo, {
        "iniciado_em": agora, "ufs": {},
    })
    registro["atualizado_em"] = agora
    registro["ufs"][uf] = {
        "status": status,
        "detalhe": detalhe,
        "duracao_segundos": int(duracao),
        "atualizado_em": agora,
    }
    salva_status(caminho, dados)


def main():
    diretorio = Path(__file__).resolve().parent
    ap = argparse.ArgumentParser(description="Coleta estados em sequencia com lock e retomada")
    grupo = ap.add_mutually_exclusive_group(required=True)
    grupo.add_argument("--plano", choices=sorted(PLANOS))
    grupo.add_argument("--regiao", choices=sorted(REGIOES))
    grupo.add_argument("--regioes", help="regioes separadas por virgula")
    grupo.add_argument("--ufs", help="UFs separadas por virgula, ex: MT,MS,GO")
    ap.add_argument("--janela", choices=["07h", "19h"], required=True)
    ap.add_argument("--pausa-ufs", type=int, default=30)
    ap.add_argument("--pausa-requisicoes", type=float, default=float(os.getenv("OPER_RADAR_PAUSA_REQUISICOES", "2")))
    ap.add_argument("--timeout-uf", type=int, default=5400, help="teto por UF, em segundos")
    ap.add_argument("--status-file", type=Path, default=diretorio / "coleta_multi_uf_status.json")
    ap.add_argument("--lock-file", type=Path, default=diretorio / "coleta_multi_uf.lock")
    ap.add_argument("--reprocessar", action="store_true", help="ignora checkpoint do ciclo atual")
    ap.add_argument("--db-host", default=os.getenv("OPER_RADAR_DB_HOST", "localhost"))
    ap.add_argument("--db-user", default=os.getenv("OPER_RADAR_DB_USER"))
    ap.add_argument("--db-pass", default=os.getenv("OPER_RADAR_DB_PASS"))
    ap.add_argument("--db-name", default=os.getenv("OPER_RADAR_DB_NAME"))
    args = ap.parse_args()

    faltando = [nome for nome, valor in {
        "OPER_RADAR_DB_USER": args.db_user,
        "OPER_RADAR_DB_PASS": args.db_pass,
        "OPER_RADAR_DB_NAME": args.db_name,
    }.items() if not valor]
    if faltando:
        ap.error("credenciais ausentes no ambiente: " + ", ".join(faltando))
    try:
        ufs = resolve_ufs(args)
    except ValueError as erro:
        ap.error(str(erro))

    args.lock_file.parent.mkdir(parents=True, exist_ok=True)
    lock = args.lock_file.open("w")
    try:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        print("Outra coleta multi-UF ja esta em andamento; encerrando sem sobrepor.")
        return 4

    lock.write(f"pid={os.getpid()} inicio={datetime.now().astimezone().isoformat()}\n")
    lock.flush()
    ciclo = f"{datetime.now().astimezone().date().isoformat()}:{args.janela}"
    dados_status = le_status(args.status_file)
    anteriores = dados_status.get("ciclos", {}).get(ciclo, {}).get("ufs", {})
    scraper = diretorio / "scraper_hostgator.py"
    ambiente = os.environ.copy()
    ambiente.update({
        "OPER_RADAR_DB_HOST": args.db_host,
        "OPER_RADAR_DB_USER": args.db_user,
        "OPER_RADAR_DB_PASS": args.db_pass,
        "OPER_RADAR_DB_NAME": args.db_name,
    })

    print(f"=== OPER RADAR: {', '.join(ufs)} (janela {args.janela}, ciclo {ciclo}) ===")
    inicio_geral = time.time()
    resumo = {}
    for indice, uf in enumerate(ufs, 1):
        anterior = anteriores.get(uf, {}).get("status")
        if not args.reprocessar and anterior in STATUS_CONCLUIDOS:
            resumo[uf] = f"{anterior} (checkpoint)"
            print(f"--- [{indice}/{len(ufs)}] {uf}: ja concluido neste ciclo, pulando ---")
            continue

        print(f"\n--- [{indice}/{len(ufs)}] Coletando {uf} ---")
        atualiza_status(args.status_file, dados_status, ciclo, uf, "executando")
        inicio_uf = time.time()
        detalhe = ""
        try:
            resultado = subprocess.run([
                sys.executable, str(scraper),
                f"--janela={args.janela}", f"--uf={uf}",
                f"--pausa-requisicoes={args.pausa_requisicoes}",
            ], env=ambiente, timeout=args.timeout_uf)
            if resultado.returncode == 0:
                status = "ok"
            elif resultado.returncode == 3:
                status = "sem_revendas"
            else:
                status = "erro"
                detalhe = f"processo retornou rc={resultado.returncode}"
        except subprocess.TimeoutExpired:
            status, detalhe = "timeout", f"UF excedeu {args.timeout_uf}s"
        except Exception as erro:
            status, detalhe = "erro", str(erro)

        duracao = int(time.time() - inicio_uf)
        resumo[uf] = status
        atualiza_status(args.status_file, dados_status, ciclo, uf, status, detalhe, duracao)
        print(f"--- {uf}: {status} em {duracao // 60}min{duracao % 60}s ---")
        if indice < len(ufs) and args.pausa_ufs > 0:
            time.sleep(args.pausa_ufs)

    total = int(time.time() - inicio_geral)
    falhas = [uf for uf, status in resumo.items() if not any(x in status for x in STATUS_CONCLUIDOS)]
    print(f"\n=== FIM em {total // 60}min. Resumo ===")
    for uf, status in resumo.items():
        print(f"  {uf}: {status}")
    return 1 if falhas else 0


if __name__ == "__main__":
    raise SystemExit(main())

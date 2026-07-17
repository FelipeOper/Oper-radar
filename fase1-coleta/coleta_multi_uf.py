"""
OPER RADAR — Coletor multi-estado (para rodar no VPS)
Roda o scraper_hostgator para varios UFs em sequencia, com pausa entre eles
pra nao saturar CPU nem tomar rate-limit do portal.

Uso:
  python3 coleta_multi_uf.py --regiao=centro-oeste --janela=07h \\
      --db-host=IP_DO_HOSTGATOR --db-user=... --db-pass='...' --db-name=...

  # ou UFs avulsas:
  python3 coleta_multi_uf.py --ufs=MT,MS,GO --janela=07h --db-...

Importante: o VPS grava no MESMO banco MySQL do HostGator (conexao remota).
Pra isso, o MySQL do HostGator precisa aceitar conexao remota do IP do VPS
(cPanel -> Bancos de Dados MySQL -> Hosts de acesso remoto -> adicionar IP do VPS).
"""
import argparse
import subprocess
import sys
import time
from pathlib import Path

REGIOES = {
    "sul":          ["PR", "SC", "RS"],
    "sudeste":      ["SP", "RJ", "MG", "ES"],
    "centro-oeste": ["MT", "MS", "GO", "DF"],
    "nordeste":     ["BA", "PE", "CE", "MA", "PB", "RN", "AL", "PI", "SE"],
    "norte":        ["AM", "PA", "RO", "RR", "AC", "AP", "TO"],
}

PAUSA_ENTRE_UFS = 30  # segundos de descanso entre um estado e outro


def main():
    ap = argparse.ArgumentParser()
    grupo = ap.add_mutually_exclusive_group(required=True)
    grupo.add_argument("--regiao", choices=list(REGIOES.keys()))
    grupo.add_argument("--ufs", help="lista separada por virgula, ex: MT,MS,GO")
    ap.add_argument("--janela", choices=["07h", "19h"], required=True)
    ap.add_argument("--db-host", required=True)
    ap.add_argument("--db-user", required=True)
    ap.add_argument("--db-pass", required=True)
    ap.add_argument("--db-name", required=True)
    args = ap.parse_args()

    ufs = REGIOES[args.regiao] if args.regiao else [u.strip().upper() for u in args.ufs.split(",")]
    scraper = Path(__file__).parent / "scraper_hostgator.py"

    print(f"=== OPER RADAR coleta multi-UF: {', '.join(ufs)} (janela {args.janela}) ===")
    inicio_geral = time.time()
    resumo = {}

    for i, uf in enumerate(ufs, 1):
        print(f"\n--- [{i}/{len(ufs)}] Coletando {uf} ---")
        t0 = time.time()
        try:
            r = subprocess.run([
                sys.executable, str(scraper),
                f"--janela={args.janela}", f"--uf={uf}",
                f"--db-host={args.db_host}", f"--db-user={args.db_user}",
                f"--db-pass={args.db_pass}", f"--db-name={args.db_name}",
            ], timeout=3600)  # teto de 1h por estado
            dur = int(time.time() - t0)
            resumo[uf] = "ok" if r.returncode == 0 else f"erro (rc={r.returncode})"
            print(f"--- {uf} concluido em {dur//60}min{dur%60}s: {resumo[uf]} ---")
        except subprocess.TimeoutExpired:
            resumo[uf] = "timeout (>1h)"
            print(f"--- {uf} estourou 1h, seguindo pro proximo ---")
        except Exception as e:
            resumo[uf] = f"falha: {e}"
            print(f"--- {uf} falhou: {e} ---")

        if i < len(ufs):
            print(f"    descanso de {PAUSA_ENTRE_UFS}s antes do proximo estado...")
            time.sleep(PAUSA_ENTRE_UFS)

    total = int(time.time() - inicio_geral)
    print(f"\n=== FIM. Tempo total: {total//60}min. Resumo: ===")
    for uf, status in resumo.items():
        print(f"  {uf}: {status}")


if __name__ == "__main__":
    main()

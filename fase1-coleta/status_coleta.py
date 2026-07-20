"""Mostra o checkpoint da coleta multi-UF sem acessar nem exibir credenciais."""
import argparse
import json
from pathlib import Path


def main():
    padrao = Path(__file__).resolve().parent / "coleta_multi_uf_status.json"
    ap = argparse.ArgumentParser()
    ap.add_argument("--arquivo", type=Path, default=padrao)
    args = ap.parse_args()
    try:
        dados = json.loads(args.arquivo.read_text(encoding="utf-8"))
    except FileNotFoundError:
        print("Nenhum ciclo multi-UF registrado ainda.")
        return 1
    ciclos = dados.get("ciclos", {})
    if not ciclos:
        print("Nenhum ciclo multi-UF registrado ainda.")
        return 1
    chave = sorted(ciclos)[-1]
    ciclo = ciclos[chave]
    print(f"Ultimo ciclo: {chave} (atualizado {ciclo.get('atualizado_em', '—')})")
    for uf, registro in ciclo.get("ufs", {}).items():
        duracao = registro.get("duracao_segundos", 0)
        detalhe = registro.get("detalhe")
        linha = f"  {uf}: {registro.get('status', 'desconhecido')} ({duracao}s)"
        if detalhe:
            linha += f" — {detalhe}"
        print(linha)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

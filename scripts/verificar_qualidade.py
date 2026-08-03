#!/usr/bin/env python3
"""Executa as verificacoes locais do OPER RADAR sem acessar producao."""

from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
from pathlib import Path


RAIZ = Path(__file__).resolve().parents[1]


def executa(nome: str, comando: list[str], cwd: Path = RAIZ) -> bool:
    print(f"\n=== {nome} ===", flush=True)
    resultado = subprocess.run(comando, cwd=cwd, check=False)
    if resultado.returncode:
        print(f"FALHOU: {nome} (status {resultado.returncode})", flush=True)
        return False
    print(f"OK: {nome}", flush=True)
    return True


def executavel(nome: str) -> str | None:
    if os.name == "nt" and nome == "npm":
        nome = "npm.cmd"
    return shutil.which(nome)


def arquivos(sufixo: str) -> list[Path]:
    ignorados = {".git", "node_modules", "dist", "__pycache__"}
    return sorted(
        caminho
        for caminho in RAIZ.rglob(f"*{sufixo}")
        if not ignorados.intersection(caminho.parts)
    )


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Roda testes, build e validacoes sintaticas sem acessar producao."
    )
    parser.add_argument(
        "--exigir-ferramentas",
        action="store_true",
        help="falha se PHP ou Bash nao estiverem instalados",
    )
    args = parser.parse_args()

    verificacoes: list[tuple[str, list[str], Path]] = [
        (
            "testes da coleta",
            [sys.executable, "-m", "unittest", "discover", "-s", "fase1-coleta", "-p", "test_*.py", "-v"],
            RAIZ,
        ),
        (
            "testes FIPE",
            [sys.executable, "-m", "unittest", "discover", "-s", "fase2-fipe", "-p", "test_*.py", "-v"],
            RAIZ,
        ),
        (
            "testes de contrato",
            [sys.executable, "-m", "unittest", "discover", "-s", "tests", "-p", "test_*.py", "-v"],
            RAIZ,
        ),
    ]

    npm = executavel("npm")
    if npm:
        verificacoes.extend(
            [
                ("testes do frontend", [npm, "test"], RAIZ / "app"),
                ("build do frontend", [npm, "run", "build"], RAIZ / "app"),
            ]
        )
    else:
        print("FALHOU: npm nao encontrado", flush=True)
        return 2

    php = executavel("php")
    if php:
        for caminho in arquivos(".php"):
            verificacoes.append(
                (f"PHP {caminho.relative_to(RAIZ)}", [php, "-l", str(caminho)], RAIZ)
            )
    elif args.exigir_ferramentas:
        print("FALHOU: PHP nao encontrado", flush=True)
        return 2
    else:
        print("AVISO: PHP ausente; validacao PHP sera pulada", flush=True)

    bash = executavel("bash")
    if bash:
        for caminho in arquivos(".sh"):
            verificacoes.append(
                (f"Shell {caminho.relative_to(RAIZ)}", [bash, "-n", str(caminho)], RAIZ)
            )
    elif args.exigir_ferramentas:
        print("FALHOU: Bash nao encontrado", flush=True)
        return 2
    else:
        print("AVISO: Bash ausente; validacao shell sera pulada", flush=True)

    falhas = [nome for nome, comando, cwd in verificacoes if not executa(nome, comando, cwd)]
    if falhas:
        print("\nOPER_RADAR_QUALIDADE=FALHA")
        for nome in falhas:
            print(f"- {nome}")
        return 1

    print("\nOPER_RADAR_QUALIDADE=OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

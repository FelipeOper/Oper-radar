#!/usr/bin/env python3
"""Empacota o frontend (app/dist) para subir no cPanel, para qualquer pasta publica.

Uso:
  python scripts/empacotar_frontend.py --base /oper-radar-beta/ --saida <pasta>
  python scripts/empacotar_frontend.py --base /oper-radar/      --saida <pasta>

O build usa a variavel VITE_BASE (ver app/vite.config.js). O .htaccess e regerado para a base
escolhida, porque o RewriteBase e a regra de fallback da SPA precisam apontar para a mesma pasta.
Para bases de teste (qualquer uma diferente de /oper-radar/) o pacote sai com X-Robots-Tag noindex.
Nao envia nada ao servidor: gera o zip, o manifesto com SHA-256 e imprime o resumo.
"""
import argparse
import hashlib
import os
import re
import subprocess
import sys
import zipfile
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
BASE_PRODUCAO = "/oper-radar/"


def normaliza_base(base: str) -> str:
    """'/pasta', 'pasta/' e '/pasta/' viram '/pasta/'. So letras, numeros, '-' e '_' em um segmento."""
    limpa = base.strip().strip("/")
    if not re.fullmatch(r"[A-Za-z0-9_-]+", limpa):
        raise ValueError("base deve ser uma unica pasta simples, ex.: /oper-radar-beta/")
    return f"/{limpa}/"


def htaccess_para_base(texto: str, base: str, noindex: bool = False) -> str:
    """Troca a pasta do RewriteBase e do fallback da SPA; opcionalmente bloqueia indexacao."""
    base = normaliza_base(base)
    # Ancorado no inicio da linha: o arquivo tem comentarios que citam a palavra RewriteBase.
    novo = re.sub(r"(?m)^(\s*)RewriteBase\s+\S+", lambda m: f"{m.group(1)}RewriteBase {base}", texto)
    novo = re.sub(r"(?m)^(\s*)RewriteRule \. \S+index\.html \[L\]", lambda m: f"{m.group(1)}RewriteRule . {base}index.html [L]", novo)
    novo = novo.replace("# OPER RADAR — rotas reais da SPA em /oper-radar/", f"# OPER RADAR — rotas reais da SPA em {base}")
    if noindex and "X-Robots-Tag" not in novo:
        novo = novo.rstrip("\n") + '\n\n<IfModule mod_headers.c>\n  Header set X-Robots-Tag "noindex, nofollow"\n</IfModule>\n'
    return novo


def sha256(caminho: Path) -> str:
    h = hashlib.sha256()
    with open(caminho, "rb") as arq:
        for bloco in iter(lambda: arq.read(1 << 20), b""):
            h.update(bloco)
    return h.hexdigest()


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--base", required=True)
    ap.add_argument("--saida", required=True)
    ap.add_argument("--nome", default=None, help="nome do zip (padrao: oper-radar-frontend-<pasta>.zip)")
    args = ap.parse_args()

    base = normaliza_base(args.base)
    app = RAIZ / "app"
    env = dict(os.environ, VITE_BASE=base)
    env.pop("VITE_DEMO", None)  # o pacote de publicacao nunca leva dados de demonstracao
    npm = "npm.cmd" if sys.platform == "win32" else "npm"
    subprocess.run([npm, "run", "build"], cwd=app, env=env, check=True)

    dist = app / "dist"
    index = (dist / "index.html").read_text(encoding="utf-8")
    if f'"{base}assets/' not in index:
        print(f"ERRO: index.html nao referencia {base}assets/ (base do build diferente?)", file=sys.stderr)
        return 1
    if "demoFixtures" in "".join(p.read_text(encoding="utf-8", errors="ignore") for p in (dist / "assets").glob("*.js")):
        print("ERRO: o build contem dados de demonstracao", file=sys.stderr)
        return 1

    saida = Path(args.saida)
    saida.mkdir(parents=True, exist_ok=True)
    ht = htaccess_para_base((app / "public" / ".htaccess").read_text(encoding="utf-8"), base, noindex=(base != BASE_PRODUCAO))
    sufixo = base.strip("/")
    nome_zip = args.nome or f"oper-radar-frontend-{sufixo}.zip"
    caminho_zip = saida / nome_zip

    arquivos = sorted(p for p in dist.rglob("*") if p.is_file() and p.name != ".htaccess")
    manifesto = []
    with zipfile.ZipFile(caminho_zip, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr(".htaccess", ht)
        manifesto.append((hashlib.sha256(ht.encode("utf-8")).hexdigest(), ".htaccess"))
        for arq in arquivos:
            rel = arq.relative_to(dist).as_posix()
            zf.write(arq, rel)
            manifesto.append((sha256(arq), rel))

    linhas = [f"{h}  {rel}" for h, rel in manifesto]
    (saida / f"MANIFESTO-SHA256-{sufixo}.txt").write_text("\n".join(linhas) + "\n", encoding="utf-8")
    print(f"zip: {caminho_zip} ({caminho_zip.stat().st_size // 1024} KB)")
    print(f"sha256 do zip: {sha256(caminho_zip)}")
    print(f"arquivos: {len(manifesto)}; base: {base}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

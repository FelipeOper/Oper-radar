import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class ShellLineEndingsTest(unittest.TestCase):
    def test_scripts_shell_nao_contem_crlf(self):
        ignorados = {".git", ".worktrees", "node_modules"}
        invalidos = []
        for caminho in ROOT.rglob("*.sh"):
            if any(parte in ignorados for parte in caminho.parts):
                continue
            if b"\r\n" in caminho.read_bytes():
                invalidos.append(str(caminho.relative_to(ROOT)))
        self.assertEqual([], invalidos, "scripts com CRLF: " + ", ".join(invalidos))

    def test_gitattributes_forca_lf_em_shell(self):
        atributos = (ROOT / ".gitattributes").read_text(encoding="utf-8")
        self.assertIn("*.sh text eol=lf", atributos)


if __name__ == "__main__":
    unittest.main()

import importlib.util
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def carrega_empacotador():
    caminho = ROOT / "scripts" / "empacotar_frontend.py"
    spec = importlib.util.spec_from_file_location("empacotar_frontend", caminho)
    modulo = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(modulo)
    return modulo


class EmpacotarFrontendTest(unittest.TestCase):
    def setUp(self):
        self.m = carrega_empacotador()
        self.htaccess = (ROOT / "app" / "public" / ".htaccess").read_text(encoding="utf-8")

    def test_base_e_normalizada_e_validada(self):
        self.assertEqual(self.m.normaliza_base("oper-radar-beta"), "/oper-radar-beta/")
        self.assertEqual(self.m.normaliza_base("/oper-radar/"), "/oper-radar/")
        for invalida in ["/", "", "/a/b/", "../x", "/com espaco/", "/x?y"]:
            with self.assertRaises(ValueError, msg=invalida):
                self.m.normaliza_base(invalida)

    def test_htaccess_aponta_rewritebase_e_fallback_para_a_mesma_pasta(self):
        novo = self.m.htaccess_para_base(self.htaccess, "/oper-radar-beta/", noindex=True)
        self.assertIn("RewriteBase /oper-radar-beta/", novo)
        self.assertIn("RewriteRule . /oper-radar-beta/index.html [L]", novo)
        self.assertNotIn("RewriteBase /oper-radar/", novo)
        self.assertNotIn("/oper-radar/index.html", novo)
        self.assertIn("X-Robots-Tag", novo)

    def test_producao_mantem_o_htaccess_e_nao_bloqueia_indexacao(self):
        novo = self.m.htaccess_para_base(self.htaccess, "/oper-radar/", noindex=False)
        self.assertEqual(novo, self.htaccess)
        self.assertNotIn("X-Robots-Tag", novo)

    def test_noindex_nao_duplica(self):
        uma_vez = self.m.htaccess_para_base(self.htaccess, "/oper-radar-beta/", noindex=True)
        duas_vezes = self.m.htaccess_para_base(uma_vez, "/oper-radar-beta/", noindex=True)
        self.assertEqual(uma_vez, duas_vezes)

    def test_vite_aceita_base_por_variavel_e_mantem_producao_como_padrao(self):
        vite = (ROOT / "app" / "vite.config.js").read_text(encoding="utf-8")
        self.assertIn("process.env.VITE_BASE", vite)
        self.assertIn("'/oper-radar/'", vite)


if __name__ == "__main__":
    unittest.main()

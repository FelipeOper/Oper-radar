from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]


class ComparadorMercadoContractTest(unittest.TestCase):
    def test_api_e_interface_suportam_tres_escopos_bilaterais(self):
        api = (ROOT / "oper-radar-api" / "comparador.php").read_text(encoding="utf-8")
        helper = (ROOT / "oper-radar-api" / "lib" / "market_comparator.php").read_text(encoding="utf-8")
        app = (ROOT / "app" / "src" / "App.jsx").read_text(encoding="utf-8")
        for modo in ("marca", "modelo", "marca_modelo"):
            self.assertIn(modo, helper)
        self.assertIn("mercado_calcula_estatisticas", helper)
        self.assertIn("comparador_seletor($_GET, 'a')", api)
        self.assertIn("comparador_seletor($_GET, 'b')", api)
        self.assertIn("Compare dois recortes reais", app)
        self.assertIn("Comparador", app)

    def test_mercado_principal_e_outros_usam_filtro_no_servidor(self):
        anuncios = (ROOT / "oper-radar-api" / "anuncios.php").read_text(encoding="utf-8")
        facetas = (ROOT / "oper-radar-api" / "facetas.php").read_text(encoding="utf-8")
        app = (ROOT / "app" / "src" / "App.jsx").read_text(encoding="utf-8")
        self.assertIn("oper_taxonomia_tipos_por_mercado", anuncios)
        self.assertIn("oper_taxonomia_tipos_por_mercado", facetas)
        self.assertIn("p.set('mercado', universo)", app)
        self.assertIn("Outros mercados", app)


if __name__ == "__main__":
    unittest.main()

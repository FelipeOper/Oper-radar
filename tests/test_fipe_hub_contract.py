import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class FipeHubContractTest(unittest.TestCase):
    def test_consulta_placa_fica_no_backend_e_exige_login(self):
        api = (ROOT / "oper-radar-api" / "placa_consulta.php").read_text(encoding="utf-8")
        app = (ROOT / "app" / "src" / "App.jsx").read_text(encoding="utf-8")
        self.assertIn("exige_autenticacao()", api)
        self.assertIn("OPER_RADAR_PLACA_API_TOKEN", api)
        self.assertNotIn("OPER_RADAR_PLACA_API_TOKEN", app)
        self.assertNotIn("api.webxcar.com.br", app)

    def test_fipe_tem_fluxos_separados(self):
        app = (ROOT / "app" / "src" / "App.jsx").read_text(encoding="utf-8")
        self.assertIn("Consultar por placa", app)
        self.assertIn("Catálogo FIPE", app)
        self.assertIn("function PageFipeCatalogo()", app)

    def test_comparativo_esta_nas_listagens_de_anuncios(self):
        app = (ROOT / "app" / "src" / "App.jsx").read_text(encoding="utf-8")
        api = (ROOT / "oper-radar-api" / "anuncios.php").read_text(encoding="utf-8")
        self.assertGreaterEqual(app.count("<ComparativoAnuncio"), 4)
        self.assertIn("preco_medio_mercado", api)
        self.assertIn("desvio_mercado_pct", api)
        self.assertIn("anuncios_comparaveis", api)


if __name__ == "__main__":
    unittest.main()

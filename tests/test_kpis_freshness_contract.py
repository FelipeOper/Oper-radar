import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class KpisFreshnessContractTest(unittest.TestCase):
    def test_api_separa_total_revalidado_e_herdado(self):
        codigo = (ROOT / "oper-radar-api" / "kpis.php").read_text(encoding="utf-8")
        for campo in (
            "anuncios_ativos_total",
            "anuncios_ativos_revalidados",
            "anuncios_ativos_herdados",
            "ciclo_referencia",
        ):
            self.assertIn(campo, codigo)
        self.assertIn("DATE(timestamp)=? AND janela=?", codigo)

    def test_dashboard_nao_apresenta_herdados_como_revalidados(self):
        codigo = (ROOT / "app" / "src" / "App.jsx").read_text(encoding="utf-8")
        self.assertIn("Anúncios ativos revalidados", codigo)
        self.assertIn("anuncios_ativos_revalidados ?? kpis.anuncios_ativos", codigo)
        self.assertIn("anuncios_ativos_herdados", codigo)


if __name__ == "__main__":
    unittest.main()

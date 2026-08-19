from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]


class MarketTaxonomyContractTest(unittest.TestCase):
    def test_frontend_corrige_motorhome_e_utilitarios(self):
        taxonomy = (ROOT / "app" / "src" / "marketTaxonomy.js").read_text(encoding="utf-8")
        self.assertIn("Motorhome: 'onibus_vans'", taxonomy)
        self.assertIn("Utilitarios: 'leves'", taxonomy)
        self.assertIn("Ônibus, vans e motorhomes", taxonomy)

    def test_apis_usam_taxonomia_central(self):
        for arquivo in ["anuncios.php", "facetas.php"]:
            codigo = (ROOT / "oper-radar-api" / arquivo).read_text(encoding="utf-8")
            self.assertIn("lib/market_taxonomy.php", codigo)
            self.assertIn("oper_taxonomia_tipos_por_categoria()", codigo)
            self.assertNotIn("'Motorhome' => 'caminhoes'", codigo)

    def test_filtro_refinado_chega_ao_banco(self):
        app = (ROOT / "app" / "src" / "App.jsx").read_text(encoding="utf-8")
        anuncios = (ROOT / "oper-radar-api" / "anuncios.php").read_text(encoding="utf-8")
        facetas = (ROOT / "oper-radar-api" / "facetas.php").read_text(encoding="utf-8")
        self.assertIn("p.set('marca', marca)", app)
        self.assertIn("p.set('carroceria', carroceria)", app)
        self.assertIn("TRIM(a.carroceria) = ?", anuncios)
        self.assertIn("condicaoCategoriaAtributos", facetas)

    def test_insight_regional_tem_confianca_e_explica_o_indice(self):
        spec = (ROOT / "docs" / "ESPECIFICACAO_INSIGHT_REGIONAL.md").read_text(encoding="utf-8")
        regras = (ROOT / "oper-radar-api" / "lib" / "regional_insight.php").read_text(encoding="utf-8")
        for fragmento in [
            "Índice de oportunidade",
            "saídas observadas",
            "reaparecimentos",
            "confiança média",
            "não promete venda",
        ]:
            self.assertIn(fragmento, spec)
        self.assertIn("OPER_INSIGHT_PESOS", regras)
        self.assertIn("eventos_confiaveis", regras)
        self.assertIn("'publicavel' => false", regras)


if __name__ == "__main__":
    unittest.main()

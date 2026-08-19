from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]


class EvolucaoConfiabilidadeContractTest(unittest.TestCase):
    def test_comparativos_usam_mediana_amostra_e_qualidade(self):
        helper = (ROOT / "oper-radar-api" / "lib" / "market_quality.php").read_text(encoding="utf-8")
        app = (ROOT / "app" / "src" / "App.jsx").read_text(encoding="utf-8")
        self.assertIn("OPER_RADAR_AMOSTRA_MINIMA = 5", helper)
        self.assertIn("condicao comercial especial", helper)
        self.assertIn("valor extremo na amostra equivalente", helper)
        self.assertIn("preco_mediana_mercado", app)
        self.assertIn("mercado_amostra_suficiente", app)
        self.assertIn("Amostra insuficiente", app)

    def test_semantica_nao_afirma_venda_ou_giro_pelo_tempo(self):
        app = (ROOT / "app" / "src" / "App.jsx").read_text(encoding="utf-8")
        analista = (ROOT / "oper-radar-api" / "analista.php").read_text(encoding="utf-8")
        self.assertIn("OBSERVADO HÁ", app)
        self.assertIn("não representa a data real de publicação", app)
        self.assertIn("não indica urgência ou disposição para negociar", analista)
        self.assertNotIn("ANÚNCIOS HÁ MAIS TEMPO NO AR (candidatos a negociação)", analista)

    def test_emissao_so_e_aplicada_a_veiculos_pesados_compativeis(self):
        regras = (ROOT / "app" / "src" / "domainRules.js").read_text(encoding="utf-8")
        self.assertIn("TIPOS_EMISSAO_PESADOS", regras)
        self.assertIn("ano === 2022", regras)
        self.assertIn("transição E5/E6", regras)

    def test_minha_loja_tem_busca_filtro_e_desfazer(self):
        app = (ROOT / "app" / "src" / "App.jsx").read_text(encoding="utf-8")
        for fragmento in ["Buscar no estoque", "Filtrar estoque por status", "Desfazer", "aria-expanded"]:
            self.assertIn(fragmento, app)


if __name__ == "__main__":
    unittest.main()

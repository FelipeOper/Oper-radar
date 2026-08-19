from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]


class MyStoreMarketContractTest(unittest.TestCase):
    def test_endpoint_restringe_item_ao_usuario(self):
        api = (ROOT / "oper-radar-api" / "minha_loja_detalhe.php").read_text(encoding="utf-8")
        self.assertIn("me.id=? AND me.usuario_id=?", api)
        self.assertIn("exige_autenticacao()", api)
        self.assertIn("VEICULO_NAO_ENCONTRADO", api)

    def test_comparacao_usa_mesma_fipe_e_eventos_observados(self):
        api = (ROOT / "oper-radar-api" / "minha_loja_detalhe.php").read_text(encoding="utf-8")
        self.assertIn("a.fipe_preco_id=?", api)
        self.assertIn("mercado_calcula_estatisticas", api)
        self.assertIn("saida_detectada", api)
        self.assertIn("e.origem='anuncio_snapshot'", api)
        self.assertIn("Não comprova venda", api)
        self.assertNotIn("vendas_confirmadas", api)

    def test_recomendacao_bloqueia_amostra_insuficiente(self):
        api = (ROOT / "oper-radar-api" / "minha_loja_detalhe.php").read_text(encoding="utf-8")
        self.assertIn("oper_insight_confianca", api)
        self.assertIn("publicavel", api)
        self.assertIn("melhor_regiao_observada", api)

    def test_frontend_tem_popup_editavel_e_tres_abas(self):
        app = (ROOT / "app" / "src" / "App.jsx").read_text(encoding="utf-8")
        for fragmento in [
            "function PainelMeuVeiculo",
            "minha_loja_detalhe.php",
            "Salvar alterações",
            "Mercado nacional",
            "MELHOR REGIÃO OBSERVADA",
            "ABRIR CADASTRO E ANÁLISE",
        ]:
            self.assertIn(fragmento, app)


if __name__ == "__main__":
    unittest.main()

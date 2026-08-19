from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]


class CompetitorHistoryContractTest(unittest.TestCase):
    def test_api_tem_eventos_e_fallback_sem_inventar_venda(self):
        api = (ROOT / "oper-radar-api" / "lojista_detalhe.php").read_text(encoding="utf-8")
        self.assertIn("information_schema.TABLES", api)
        self.assertIn("saida_detectada", api)
        self.assertIn("reaparecimento", api)
        self.assertIn("removido_confirmado", api)
        self.assertIn("não venda comprovada", api)
        self.assertNotIn("vendas_confirmadas", api)

    def test_resumo_usa_mediana_e_qualidade_de_preco(self):
        api = (ROOT / "oper-radar-api" / "lojista_detalhe.php").read_text(encoding="utf-8")
        self.assertIn("mercado_calcula_estatisticas", api)
        self.assertIn("mediana_dias_ate_saida", api)
        self.assertIn("preco_ativo_amostra", api)
        self.assertIn("preco_ativo_confianca", api)

    def test_frontend_abre_painel_com_tres_abas(self):
        app = (ROOT / "app" / "src" / "App.jsx").read_text(encoding="utf-8")
        self.assertIn("function PainelLojista", app)
        self.assertIn("lojista_detalhe.php", app)
        self.assertIn("Histórico observado", app)
        self.assertIn("Saídas ·", app)
        self.assertIn("O preço exibido é o último preço publicado", app)

    def test_materializador_aceita_intervalo_seguro(self):
        materializador = (ROOT / "fase3-series" / "materializar_eventos.py").read_text(encoding="utf-8")
        self.assertIn('ap.add_argument("--inicio"', materializador)
        self.assertIn('ap.add_argument("--fim"', materializador)
        self.assertIn("intervalo máximo é de 366 dias", materializador)
        self.assertIn("incluir_primeira_observacao=(args.aplicar or posicao == 0)", materializador)


if __name__ == "__main__":
    unittest.main()

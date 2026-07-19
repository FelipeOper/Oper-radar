import unittest

from fipe_sync import avalia, eixos, normaliza, parse_preco, palavras_chave


class MatchingFipeTest(unittest.TestCase):
    def test_normaliza_numero_com_pontuacao(self):
        self.assertIn("11180", normaliza("VW 11.180 Delivery"))

    def test_daf_xf_530_casa_por_numero(self):
        score, motivo = avalia("DAF XF FTS 530 2024/2024", "XF 530 6x2 Diesel")
        self.assertGreaterEqual(score, 0.5)
        self.assertEqual("so numero", motivo)

    def test_scania_nao_mistura_series(self):
        score, _ = avalia("SCANIA R440 2014", "G-440 A 6x4 Diesel")
        self.assertEqual(0.0, score)

    def test_detecta_eixo(self):
        self.assertEqual("6X4", eixos("DAF XF 530 cavalo 6x4"))

    def test_remove_acabamento_das_palavras_chave(self):
        self.assertNotIn("HIGH", palavras_chave("R-450 High. 6x2 Diesel"))

    def test_preco_brasileiro(self):
        self.assertEqual(539900.0, parse_preco("R$ 539.900,00"))


if __name__ == "__main__":
    unittest.main()

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _sem_banco  # noqa: F401
from catalogo_atributos import atributos_do_modelo_fipe, dims_que_variam


class CatalogoAtributosTest(unittest.TestCase):
    def test_extrai_dimensoes_do_nome_fipe(self):
        a = atributos_do_modelo_fipe("DAF", "XF FTT 530 6x4 Space Cab (E6)")
        self.assertEqual("XF", a["familia"])
        self.assertEqual("6X4", a["eixo"])
        self.assertEqual("E6", a["emissao"])
        self.assertIsNotNone(a["cabine"])

    def test_dimensao_ausente_vira_none(self):
        a = atributos_do_modelo_fipe("SCANIA", "R 440 A 6x2")
        self.assertIsNone(a["emissao"])
        self.assertIsNone(a["cabine"])

    def test_dims_que_variam(self):
        linhas = [{"eixo": "4X2", "emissao": "E5", "cabine": None},
                  {"eixo": "6X2", "emissao": "E5", "cabine": None}]
        self.assertEqual(("eixo",), dims_que_variam(linhas))

    def test_dim_ausente_em_todos_nao_varia(self):
        self.assertEqual((), dims_que_variam([{"eixo": None}, {"eixo": None}]))

    def test_none_junto_com_valor_conta_como_variacao(self):
        # "XF FTT530 6x4" ao lado de "XF FTT530 6x4 Space Cab": o anuncio precisa dizer a cabine.
        linhas = [{"cabine": None}, {"cabine": "SPACE"}]
        self.assertEqual(("cabine",), dims_que_variam(linhas))


if __name__ == "__main__":
    unittest.main()

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from conjunto import detecta_conjunto


class DetectaConjuntoTest(unittest.TestCase):
    def test_anuncios_de_conjunto(self):
        casos = [
            "SCANIA R450 + CARRETA GRANELEIRA 2018",
            "Conjunto Volvo FH 540 + Bitrem 2019/2019",
            "Cavalo Mecânico Volvo FH 460 com Carreta Randon",
            "Rodotrem Scania R620 2015",
            "VW 25.390 C/ SEMI REBOQUE",
            "Iveco Stralis + Semirreboque Facchini",
            "ROMEU E JULIETA IVECO TECTOR",
            "Cavalo + Carreta DAF XF 530",
            "Conjunto Cavalo DAF XF 530 e Carreta Facchini",
            "Mercedes Actros 2651 + Randon",
        ]
        for titulo in casos:
            with self.subTest(titulo=titulo):
                self.assertTrue(detecta_conjunto(titulo), titulo)

    def test_anuncios_que_nao_sao_conjunto(self):
        casos = [
            "Scania R450 Cavalo Mecânico 6x2 2020/2020",
            "Volvo FH 540 Bitruck 2018",
            "Mercedes Atego 2426 com baú 2017",
            "Mercedes Atego 2426 + baú refrigerado",
            "Caminhão com carroceria graneleira",
            "Carreta Randon Graneleira 2015",
            "Iveco Daily conjunto de ferramentas",
            "VW Constellation seminovo 2019",
            "Chassi + carroceria madeira",
            "Volvo FH 540 + 4 pneus novos",
        ]
        for titulo in casos:
            with self.subTest(titulo=titulo):
                self.assertFalse(detecta_conjunto(titulo), titulo)

    def test_usa_tambem_o_trecho_da_url(self):
        self.assertTrue(detecta_conjunto("Scania R450 2018", url="https://x.invalid/veiculo/curitiba/pr/caminhao/scania/conjunto-scania-r450-carreta/lelo/123"))

    def test_entrada_vazia_ou_nula(self):
        self.assertFalse(detecta_conjunto(None))
        self.assertFalse(detecta_conjunto(""))


if __name__ == "__main__":
    unittest.main()

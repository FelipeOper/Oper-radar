import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _sem_banco  # noqa: F401
from peneira_estoque import item_como_anuncio


class AdaptadorTest(unittest.TestCase):
    def test_item_vira_anuncio_para_o_motor(self):
        a = item_como_anuncio({"id": 4, "titulo": "Scania R 440 6x2", "marca": "Scania", "modelo": "R 440",
                               "ano": "2020/2020", "url_anuncio": ""})
        self.assertEqual(2020, a["ano_final"])
        self.assertEqual("Scania R 440 6x2", a["titulo"])
        self.assertEqual("", a["tracao"])

    def test_ano_unico(self):
        self.assertEqual(2019, item_como_anuncio({"id": 1, "titulo": "x", "marca": "m", "modelo": "", "ano": 2019,
                                                  "url_anuncio": ""})["ano_final"])

    def test_ano_invalido_vira_none(self):
        self.assertIsNone(item_como_anuncio({"id": 1, "titulo": "x", "marca": "m", "modelo": "", "ano": "n/d",
                                             "url_anuncio": ""})["ano_final"])


if __name__ == "__main__":
    unittest.main()

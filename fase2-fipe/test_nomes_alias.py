import os
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _sem_banco  # noqa: F401
from fipe_sync import avalia, numeros_juntos


def com_flag(titulo, nome, valor="1"):
    with patch.dict(os.environ, {"FIPE_NOMES_ALIAS": valor}):
        return avalia(titulo, nome)


class NumerosJuntosTest(unittest.TestCase):
    def test_une_dois_grupos(self):
        self.assertEqual({"17280"}, numeros_juntos("TECTOR 17 280 2021/2022"))
        self.assertEqual({"17280"}, numeros_juntos("TECTOR 17-280 4x2 (diesel)"))

    def test_ignora_o_ano(self):
        self.assertEqual(set(), numeros_juntos("DELIVERY EXPRESS 2021/2022"))


class NomesAliasTest(unittest.TestCase):
    def test_tector_com_espaco_casa_com_hifen_da_fipe(self):
        self.assertEqual(0.0, com_flag("TECTOR 17 280 2021/2022", "TECTOR 17-280 4x2 (diesel) (E6)", "0")[0])
        self.assertGreaterEqual(com_flag("TECTOR 17 280 2021/2022", "TECTOR 17-280 4x2 (diesel) (E6)")[0], 0.5)

    def test_numero_diferente_continua_rejeitado(self):
        self.assertEqual(0.0, com_flag("TECTOR 15 280 2021", "TECTOR 17-280 4x2 (diesel) (E6)")[0])

    def test_nome_sem_numero_com_palavras_iguais(self):
        self.assertEqual(0.0, com_flag("DELIVERY EXPRESS 2021/2022", "Delivery Express 2p (diesel)(E5)", "0")[0])
        self.assertEqual(0.90, com_flag("DELIVERY EXPRESS 2021/2022", "Delivery Express 2p (diesel)(E5)")[0])

    def test_nome_sem_numero_com_palavras_diferentes_nao_casa(self):
        self.assertEqual(0.0, com_flag("DELIVERY 2021", "Delivery Express 2p (diesel)(E5)")[0])


if __name__ == "__main__":
    unittest.main()

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from classifica_conjunto import SQL_ALVOS, planeja_atualizacoes


class PlanejaTest(unittest.TestCase):
    def test_marca_conjunto_e_nao_conjunto_como_automatico(self):
        linhas = [
            {"id": 1, "titulo": "Scania R450 + Carreta Randon", "url": ""},
            {"id": 2, "titulo": "Scania R450 Cavalo 6x2", "url": ""},
        ]
        self.assertEqual([(1, 1), (2, 0)], planeja_atualizacoes(linhas))

    def test_linha_sem_titulo_vira_nao_conjunto(self):
        self.assertEqual([(3, 0)], planeja_atualizacoes([{"id": 3, "titulo": None, "url": None}]))


class ContratoDoSqlTest(unittest.TestCase):
    def test_nunca_seleciona_decisao_manual(self):
        # Manual sempre grava 0 ou 1, entao "conjunto IS NULL" nunca alcanca uma decisao humana.
        self.assertIn("conjunto IS NULL", SQL_ALVOS["novos"])
        self.assertIn("conjunto_origem <> 'manual'", SQL_ALVOS["automaticos"])

    def test_o_update_tambem_protege_o_manual(self):
        import classifica_conjunto
        import inspect
        self.assertIn("conjunto_origem <> 'manual'", inspect.getsource(classifica_conjunto.roda))

    def test_so_caminhao_ativo(self):
        for sql in SQL_ALVOS.values():
            self.assertIn("tipo = 'Caminhao'", sql)
            self.assertIn("status = 'ativo'", sql)


if __name__ == "__main__":
    unittest.main()

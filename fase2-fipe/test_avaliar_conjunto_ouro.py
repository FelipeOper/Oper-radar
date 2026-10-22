import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from avaliar_conjunto_ouro import compara, resumo


class AvaliacaoTest(unittest.TestCase):
    def test_compara(self):
        cand = [{"id": 7, "modelo_fipe": "R 440"}]
        self.assertEqual("acerto", compara(7, (cand, "alto")))
        self.assertEqual("erro", compara(8, (cand, "alto")))
        self.assertEqual("omitiu", compara(7, (None, "ambiguo eixo")))

    def test_candidato_multiplo_nao_e_acerto(self):
        cand = [{"id": 7}, {"id": 9}]
        self.assertEqual("omitiu", compara(7, (cand, "medio")))

    def test_resumo(self):
        r = resumo({"acerto": 90, "erro": 2, "omitiu": 8})
        self.assertAlmostEqual(90 / 92, r["precisao"])
        self.assertAlmostEqual(0.90, r["cobertura"])

    def test_resumo_sem_vinculos_nao_divide_por_zero(self):
        self.assertEqual(0.0, resumo({"omitiu": 5})["precisao"])


if __name__ == "__main__":
    unittest.main()

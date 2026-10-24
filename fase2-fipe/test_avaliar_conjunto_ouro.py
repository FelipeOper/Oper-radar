import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from avaliar_conjunto_ouro import compara, precisao_por_confianca, resumo


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


class PrecisaoAuditadaTest(unittest.TestCase):
    def test_precisao_por_confianca(self):
        linhas = [
            {"confianca": "alto", "corretos": 90, "errados": 10},
            {"confianca": "medio", "corretos": 3, "errados": 1},
        ]
        r = precisao_por_confianca(linhas)
        self.assertAlmostEqual(0.9, r["alto"]["precisao"])
        self.assertEqual(100, r["alto"]["julgados"])
        self.assertAlmostEqual(0.75, r["medio"]["precisao"])

    def test_sem_julgados_nao_inventa_precisao(self):
        r = precisao_por_confianca([{"confianca": "alto", "corretos": 0, "errados": 0}])
        self.assertIsNone(r["alto"]["precisao"])

    def test_confianca_nula_vira_sem_confianca(self):
        r = precisao_por_confianca([{"confianca": None, "corretos": 1, "errados": 0}])
        self.assertIn("sem_confianca", r)


if __name__ == "__main__":
    unittest.main()

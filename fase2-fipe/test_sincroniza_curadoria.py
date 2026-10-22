import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from sincroniza_curadoria import precisa_sincronizar


class SincronizaTest(unittest.TestCase):
    def test_manual_sem_assinatura_precisa(self):
        self.assertTrue(precisa_sincronizar({"fipe_vinculo_origem": "manual", "fipe_preco_id": 5,
                                             "fipe_assinatura_id": None, "assinatura_fipe_preco_id": None}))

    def test_manual_com_assinatura_no_mesmo_preco_nao_precisa(self):
        self.assertFalse(precisa_sincronizar({"fipe_vinculo_origem": "manual", "fipe_preco_id": 5,
                                              "fipe_assinatura_id": 1, "assinatura_fipe_preco_id": 5}))

    def test_manual_trocado_para_outro_preco_precisa(self):
        self.assertTrue(precisa_sincronizar({"fipe_vinculo_origem": "manual", "fipe_preco_id": 6,
                                             "fipe_assinatura_id": 1, "assinatura_fipe_preco_id": 5}))

    def test_automatico_nunca_sincroniza_aqui(self):
        self.assertFalse(precisa_sincronizar({"fipe_vinculo_origem": "automatico", "fipe_preco_id": 5,
                                              "fipe_assinatura_id": None, "assinatura_fipe_preco_id": None}))

    def test_manual_sem_preco_nao_sincroniza(self):
        self.assertFalse(precisa_sincronizar({"fipe_vinculo_origem": "manual", "fipe_preco_id": None,
                                              "fipe_assinatura_id": None, "assinatura_fipe_preco_id": None}))


if __name__ == "__main__":
    unittest.main()

import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _sem_banco  # noqa: F401
import vinculo_por_assinatura as v

ANUNCIO = {"titulo": "Scania R 440 A 6x2 2020/2020", "url": "", "marca": "SCANIA", "modelo": "",
           "tracao": "", "ano_inicial": 2020, "ano_final": 2020}


class ReusoTest(unittest.TestCase):
    def setUp(self):
        self._dims = v.dims_do_grupo
        self._busca = v._busca_assinatura
        self._upsert = v._upsert_assinatura

    def tearDown(self):
        v.dims_do_grupo = self._dims
        v._busca_assinatura = self._busca
        v._upsert_assinatura = self._upsert

    def test_reusa_o_mesmo_preco_para_o_mesmo_veiculo(self):
        v.dims_do_grupo = lambda conn, m, f, n: ("eixo",)
        v._busca_assinatura = lambda conn, h: {"id": 5, "fipe_preco_id": 321, "status": "ativa"}
        r = v.resolve_por_assinatura(None, ANUNCIO)
        self.assertEqual(321, r.fipe_preco_id)
        self.assertEqual(5, r.assinatura_id)

    def test_incompleta_nao_reusa(self):
        v.dims_do_grupo = lambda conn, m, f, n: ("eixo", "cabine")  # anuncio nao diz a cabine
        v._busca_assinatura = lambda conn, h: {"id": 5, "fipe_preco_id": 321, "status": "ativa"}
        self.assertIsNone(v.resolve_por_assinatura(None, ANUNCIO))

    def test_assinatura_em_revisao_nao_propaga(self):
        v.dims_do_grupo = lambda conn, m, f, n: ("eixo",)
        v._busca_assinatura = lambda conn, h: {"id": 5, "fipe_preco_id": 321, "status": "em_revisao"}
        self.assertIsNone(v.resolve_por_assinatura(None, ANUNCIO))

    def test_sem_assinatura_conhecida(self):
        v.dims_do_grupo = lambda conn, m, f, n: ("eixo",)
        v._busca_assinatura = lambda conn, h: None
        self.assertIsNone(v.resolve_por_assinatura(None, ANUNCIO))

    def test_so_grava_a_partir_de_alto_ou_manual(self):
        chamadas = []
        v.dims_do_grupo = lambda conn, m, f, n: ("eixo",)
        v._upsert_assinatura = lambda *a, **k: chamadas.append(a) or 9
        self.assertIsNone(v.grava_assinatura(None, ANUNCIO, 321, origem="medio"))
        self.assertIsNone(v.grava_assinatura(None, ANUNCIO, 321, origem="provisorio"))
        self.assertEqual(9, v.grava_assinatura(None, ANUNCIO, 321, origem="automatico"))
        self.assertEqual(9, v.grava_assinatura(None, ANUNCIO, 321, origem="manual"))
        self.assertEqual(2, len(chamadas))

    def test_incompleta_nao_grava(self):
        v.dims_do_grupo = lambda conn, m, f, n: ("eixo", "cabine")
        v._upsert_assinatura = lambda *a, **k: self.fail("nao deveria gravar assinatura incompleta")
        self.assertIsNone(v.grava_assinatura(None, ANUNCIO, 321, origem="automatico"))


class ConflitoTest(unittest.TestCase):
    def test_decide_status_ao_gravar_preco_diferente(self):
        self.assertEqual("em_revisao", v.status_apos_gravar(existente={"fipe_preco_id": 1, "origem": "automatico"},
                                                            novo_preco=2, novo_origem="automatico"))
        self.assertEqual("ativa", v.status_apos_gravar(existente={"fipe_preco_id": 1, "origem": "automatico"},
                                                       novo_preco=1, novo_origem="automatico"))

    def test_manual_substitui_automatica_sem_revisao(self):
        self.assertEqual("ativa", v.status_apos_gravar(existente={"fipe_preco_id": 1, "origem": "automatico"},
                                                       novo_preco=2, novo_origem="manual"))

    def test_manual_contra_manual_diferente_vai_para_revisao(self):
        self.assertEqual("em_revisao", v.status_apos_gravar(existente={"fipe_preco_id": 1, "origem": "manual"},
                                                            novo_preco=2, novo_origem="manual"))

    def test_automatico_contra_manual_diferente_vai_para_revisao(self):
        self.assertEqual("em_revisao", v.status_apos_gravar(existente={"fipe_preco_id": 1, "origem": "manual"},
                                                            novo_preco=2, novo_origem="automatico"))


class AplicaGravacaoTest(unittest.TestCase):
    def test_automatico_nunca_rebaixa_um_manual(self):
        self.assertEqual((1, "manual", "ativa"), v.decide_gravacao(
            existente={"fipe_preco_id": 1, "origem": "manual", "status": "ativa"}, novo_preco=1, novo_origem="automatico"))

    def test_manual_substitui_automatico_e_assume_a_origem(self):
        self.assertEqual((2, "manual", "ativa"), v.decide_gravacao(
            existente={"fipe_preco_id": 1, "origem": "automatico", "status": "ativa"}, novo_preco=2, novo_origem="manual"))

    def test_conflito_mantem_o_preco_existente_e_marca_revisao(self):
        self.assertEqual((1, "automatico", "em_revisao"), v.decide_gravacao(
            existente={"fipe_preco_id": 1, "origem": "automatico", "status": "ativa"}, novo_preco=2, novo_origem="automatico"))

    def test_revisao_nao_se_cura_sozinha(self):
        self.assertEqual((1, "automatico", "em_revisao"), v.decide_gravacao(
            existente={"fipe_preco_id": 1, "origem": "automatico", "status": "em_revisao"}, novo_preco=1, novo_origem="automatico"))


if __name__ == "__main__":
    unittest.main()

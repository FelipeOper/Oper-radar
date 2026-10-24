import os
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _sem_banco  # noqa: F401
from fipe_sync import escolhe, provisorio_de_ambiguidade


def cand(i, nome, score=0.95):
    return (score, "teste", {"id": i, "modelo_fipe": nome})


PRECOS = {10: 506335, 11: 517128, 12: 476461, 13: 498988, 14: 300000}


def roda_provisorio(info, concorrentes, ids):
    with patch("fipe_sync._preco_fipe", side_effect=lambda conn, pid: PRECOS[pid]):
        return provisorio_de_ambiguidade(None, info, concorrentes, lambda c: ids.get(c["id"]))


class ProvisorioDeAmbiguidadeTest(unittest.TestCase):
    def test_faixa_estreita_devolve_a_mediana_inferior(self):
        achado = roda_provisorio("ambiguo cabine (GLOBETROTTER/SEM TAG)", [{"id": 1}, {"id": 2}], {1: 10, 2: 11})
        self.assertEqual(10, achado[0])
        self.assertEqual(2, achado[1])

    def test_faixa_larga_nao_vincula(self):
        self.assertIsNone(roda_provisorio("ambiguo cabine (LS/S)", [{"id": 1}, {"id": 2}], {1: 10, 2: 14}))

    def test_emissao_fica_de_fora(self):
        self.assertIsNone(roda_provisorio("ambiguo emissao (E5/E6)", [{"id": 1}, {"id": 2}], {1: 10, 2: 11}))

    def test_so_ambiguidade(self):
        self.assertIsNone(roda_provisorio("sem match", [{"id": 1}, {"id": 2}], {1: 10, 2: 11}))

    def test_precisa_de_dois_precos_no_ano(self):
        self.assertIsNone(roda_provisorio("ambiguo linha (A/B)", [{"id": 1}, {"id": 2}], {1: 10}))

    def test_mais_de_oito_concorrentes_nao_vincula(self):
        concorrentes = [{"id": i} for i in range(9)]
        self.assertIsNone(roda_provisorio("ambiguo linha (A/B)", concorrentes, {i: 10 for i in range(9)}))


class EscolheDevolveOsConcorrentesTest(unittest.TestCase):
    def test_ambiguidade_de_cabine_preenche_a_lista(self):
        anuncio = {"titulo": "Scania R450 A 6x2 2018/2018", "marca": "SCANIA", "ano_inicial": 2018, "ano_final": 2018}
        candidatos = [cand(1, "R 450 A 6x2 (diesel)(E5)"), cand(2, "R 450 A 6x2 Highline (diesel)(E5)")]
        saida = []
        with patch.dict(os.environ, {"FIPE_CABINE_MARCAS": "1"}), \
             patch("fipe_sync.melhores_candidatos", return_value=candidatos):
            achados, info = escolhe(None, anuncio, saida)
        self.assertIsNone(achados)
        self.assertTrue(info.startswith("ambiguo cabine"))
        self.assertEqual([1, 2], sorted(c["id"] for c in saida))

    def test_sem_lista_o_comportamento_e_o_de_sempre(self):
        anuncio = {"titulo": "Scania R450 A 6x2 2018/2018", "marca": "SCANIA", "ano_inicial": 2018, "ano_final": 2018}
        candidatos = [cand(1, "R 450 A 6x2 (diesel)(E5)"), cand(2, "R 450 A 6x2 Highline (diesel)(E5)")]
        with patch.dict(os.environ, {"FIPE_CABINE_MARCAS": "1"}), \
             patch("fipe_sync.melhores_candidatos", return_value=candidatos):
            self.assertEqual((None, "ambiguo cabine (HIGHLINE/SEM TAG)"), escolhe(None, anuncio))


if __name__ == "__main__":
    unittest.main()

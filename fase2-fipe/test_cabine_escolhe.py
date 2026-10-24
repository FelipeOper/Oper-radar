import os
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _sem_banco  # noqa: F401
from fipe_sync import escolhe


def cand(i, nome, score=0.95):
    return (score, "teste", {"id": i, "modelo_fipe": nome})


def roda(anuncio, candidatos, flag="1"):
    with patch.dict(os.environ, {"FIPE_CABINE_MARCAS": flag}), \
         patch("fipe_sync.melhores_candidatos", return_value=candidatos):
        return escolhe(None, anuncio)


def pega(anuncio, candidatos):
    r = roda(anuncio, candidatos)
    assert r[0], r
    assert len(r[0]) == 1, r
    return r[0][0], r[1]


VOLVO = [cand(1, "FH 540 6x4 (diesel)(E5)"), cand(2, "FH 540 6x4 Globetrotter XL (diesel)(E5)")]
SCANIA = [cand(1, "R 450 A 6x2 (diesel)(E5)"), cand(2, "R 450 A 6x2 Highline (diesel)(E5)")]


class CabinePorMarcaEscolheTest(unittest.TestCase):
    def test_flag_desligada_nao_muda_o_comportamento(self):
        anuncio = {"titulo": "Volvo FH 540 6x4 Globetrotter XL 2022", "marca": "VOLVO", "ano_inicial": 2022, "ano_final": 2022}
        fora = roda(anuncio, VOLVO, flag="0")
        self.assertNotEqual((None, "sem match cabine GLOBETROTTER XL"), fora)

    def test_volvo_globetrotter_xl_escolhe_a_fipe_xl(self):
        anuncio = {"titulo": "Volvo FH 540 6x4 Globetrotter XL 2022", "marca": "VOLVO", "ano_inicial": 2022, "ano_final": 2022}
        escolhido, _ = pega(anuncio, VOLVO)
        self.assertEqual(2, escolhido["id"])

    def test_scania_sem_cabine_no_anuncio_e_ambiguo(self):
        anuncio = {"titulo": "Scania R450 A 6x2 2018/2018", "marca": "SCANIA", "ano_inicial": 2018, "ano_final": 2018}
        self.assertEqual((None, "ambiguo cabine (HIGHLINE/SEM TAG)"), roda(anuncio, SCANIA))

    def test_teto_alto_generico_escolhe_a_variante_alta_unica(self):
        anuncio = {"titulo": "Scania R450 A 6x2 teto alto 2018/2018", "marca": "SCANIA", "ano_inicial": 2018, "ano_final": 2018}
        escolhido, _ = pega(anuncio, SCANIA)
        self.assertEqual(2, escolhido["id"])

    def test_rotulo_do_anuncio_que_o_catalogo_nao_tem_rejeita(self):
        anuncio = {"titulo": "Scania R450 A 6x2 Topline 2018/2018", "marca": "SCANIA", "ano_inicial": 2018, "ano_final": 2018}
        self.assertEqual((None, "sem match cabine TOPLINE"), roda(anuncio, SCANIA))

    def test_catalogo_sem_rotulos_nao_bloqueia(self):
        anuncio = {"titulo": "Volvo FH 540 6x4 Globetrotter 2022", "marca": "VOLVO", "ano_inicial": 2022, "ano_final": 2022}
        escolhido, _ = pega(anuncio, [cand(1, "FH 540 6x4 (diesel)(E5)")])
        self.assertEqual(1, escolhido["id"])


if __name__ == "__main__":
    unittest.main()

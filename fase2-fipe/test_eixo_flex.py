import os
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _sem_banco  # noqa: F401
from fipe_sync import eixos_todos, escolhe


def cand(i, nome, score=0.97):
    return (score, "teste", {"id": i, "modelo_fipe": nome})


def roda(anuncio, candidatos, flag="1"):
    with patch.dict(os.environ, {"FIPE_EIXO_FLEX": flag}), \
         patch("fipe_sync.melhores_candidatos", return_value=candidatos):
        return escolhe(None, anuncio)


class EixosTodosTest(unittest.TestCase):
    def test_nome_composto_da_fipe(self):
        self.assertEqual({"4X2", "6X2"}, eixos_todos("G-380 A 4x2 3-Eixos/ A 6x2 2p (diesel)"))

    def test_nome_sem_eixo(self):
        self.assertEqual(set(), eixos_todos("1418 2p (diesel)"))


class EixoFlexTest(unittest.TestCase):
    def test_nome_fipe_sem_eixo_vale_como_medio(self):
        anuncio = {"titulo": "MB 1418 2008/2008", "marca": "MERCEDES-BENZ", "tracao": "Toco 4x2", "ano_inicial": 2008, "ano_final": 2008}
        cands = [cand(1, "1418 2p (diesel)")]
        self.assertEqual((None, "sem match eixo 4X2"), roda(anuncio, cands, flag="0"))
        achados, confianca = roda(anuncio, cands)
        self.assertEqual([1], [c["id"] for c in achados])
        self.assertEqual("medio", confianca)

    def test_nome_composto_com_o_eixo_do_anuncio(self):
        anuncio = {"titulo": "SCANIA G380 2010/2010", "marca": "SCANIA", "tracao": "Cavalo 6x2", "ano_inicial": 2010, "ano_final": 2010}
        cands = [cand(1, "G-380 A 4x2 2p (diesel)"), cand(2, "G-380 A 4x2 3-Eixos/ A 6x2 2p (diesel)")]
        achados, _ = roda(anuncio, cands)
        self.assertEqual([2], [c["id"] for c in achados])

    def test_eixo_diferente_declarado_continua_rejeitado(self):
        anuncio = {"titulo": "SCANIA R440 2013/2013", "marca": "SCANIA", "tracao": "Truck 6x2", "ano_inicial": 2013, "ano_final": 2013}
        cands = [cand(1, "R-440 A 4x2 2p (diesel)"), cand(2, "R-440 A 6x4 2p (diesel)"), cand(3, "R-440 A 8x2 2p (diesel)(E5)")]
        self.assertEqual((None, "sem match eixo 6X2"), roda(anuncio, cands))

    def test_daf_continua_estrito(self):
        anuncio = {"titulo": "DAF XF FTT 530 2021/2021", "marca": "DAF", "tracao": "Cavalo 6x2", "ano_inicial": 2021, "ano_final": 2021}
        cands = [cand(1, "XF Space Cab (die)(E5)")]
        resultado = roda(anuncio, cands)
        self.assertIsNone(resultado[0])


if __name__ == "__main__":
    unittest.main()

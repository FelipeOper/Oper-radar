import sys
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _sem_banco  # noqa: F401
import os

from simula_ganho import avalia_anuncio, classifica_ganho, flag_cabine, resume

ANUNCIO = {"id": 1, "titulo": "Scania R450 2020/2020", "url": "", "marca": "SCANIA", "tracao": "", "modelo": "",
           "ano_inicial": 2020, "ano_final": 2020}
M1 = {"id": 10, "marca_fipe": "SCANIA", "modelo_fipe": "R 450 A 6x2"}
M2 = {"id": 11, "marca_fipe": "SCANIA", "modelo_fipe": "R 450 A 4x2"}


class AvaliaAnuncioTest(unittest.TestCase):
    def avalia(self, escolhe_retorno, precos):
        with patch("simula_ganho.escolhe", return_value=escolhe_retorno), \
             patch("simula_ganho.busca_preco_cache", side_effect=lambda c, cand, ano, ref: precos.get(cand["id"])):
            return avalia_anuncio(object(), ANUNCIO, 338)

    def test_rejeitado_pelo_motor(self):
        r = self.avalia((None, "ambiguo eixo (4X2/6X2)"), {})
        self.assertEqual(("rejeitado", "ambiguo eixo (4X2/6X2)"), (r["resultado"], r["motivo"]))

    def test_vincula_quando_ha_um_candidato_com_preco_no_ano(self):
        r = self.avalia(([M1], "alto"), {10: 501})
        self.assertEqual(("vincula", "alto", 501), (r["resultado"], r["confianca"], r["preco_id"]))

    def test_sem_preco_no_ano_nao_vincula(self):
        self.assertEqual("sem_preco_no_ano", self.avalia(([M1], "alto"), {})["resultado"])

    def test_dois_precos_validos_e_ambiguo_com_os_ids(self):
        r = self.avalia(([M1, M2], "medio"), {10: 501, 11: 502})
        self.assertEqual("multiplo", r["resultado"])
        self.assertEqual([501, 502], r["preco_ids"])

    def test_mais_de_oito_candidatos_nao_vincula(self):
        r = self.avalia(([dict(M1, id=i) for i in range(9)], "medio"), {i: 100 + i for i in range(9)})
        self.assertEqual("rejeitado", r["resultado"])


class ClassificaGanhoTest(unittest.TestCase):
    base_rejeitada = {"resultado": "rejeitado", "motivo": "ambiguo cabine"}

    def test_ganho_quando_so_a_evidencia_nova_vincula(self):
        self.assertEqual("ganha_alto", classifica_ganho(self.base_rejeitada, {"resultado": "vincula", "confianca": "alto", "preco_id": 1}))
        self.assertEqual("ganha_medio", classifica_ganho(self.base_rejeitada, {"resultado": "vincula", "confianca": "medio", "preco_id": 1}))

    def test_continua_quando_nada_muda(self):
        self.assertEqual("continua", classifica_ganho(self.base_rejeitada, self.base_rejeitada))

    def test_mudanca_de_vinculo_e_sinalizada_como_risco(self):
        a = {"resultado": "vincula", "confianca": "alto", "preco_id": 1}
        self.assertEqual("muda_vinculo", classifica_ganho(a, dict(a, preco_id=2)))
        self.assertEqual("igual", classifica_ganho(a, dict(a)))

    def test_perde_vinculo_e_sinalizado(self):
        a = {"resultado": "vincula", "confianca": "alto", "preco_id": 1}
        self.assertEqual("perde_vinculo", classifica_ganho(a, self.base_rejeitada))


class ResumoTest(unittest.TestCase):
    def test_conta_por_categoria_e_calcula_percentual(self):
        r = resume(["ganha_alto", "ganha_medio", "continua", "continua"])
        self.assertEqual(2, r["ganho"])
        self.assertEqual(50.0, r["ganho_pct"])
        self.assertEqual(4, r["total"])

    def test_vazio_nao_divide_por_zero(self):
        self.assertEqual(0.0, resume([])["ganho_pct"])


class FlagCabineTest(unittest.TestCase):
    def test_liga_e_restaura_o_ambiente(self):
        os.environ.pop("FIPE_CABINE_MARCAS", None)
        with flag_cabine("1"):
            self.assertEqual("1", os.environ["FIPE_CABINE_MARCAS"])
        self.assertNotIn("FIPE_CABINE_MARCAS", os.environ)

    def test_restaura_valor_anterior_mesmo_com_erro(self):
        os.environ["FIPE_CABINE_MARCAS"] = "0"
        with self.assertRaises(RuntimeError):
            with flag_cabine("1"):
                raise RuntimeError
        self.assertEqual("0", os.environ["FIPE_CABINE_MARCAS"])
        os.environ.pop("FIPE_CABINE_MARCAS")


if __name__ == "__main__":
    unittest.main()

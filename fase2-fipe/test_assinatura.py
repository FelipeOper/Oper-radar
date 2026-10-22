import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _sem_banco  # noqa: F401
from assinatura import atributos_do_anuncio, monta_assinatura


def attrs(**kw):
    base = {"marca": "SCANIA", "familia": "R", "numero": "440", "ano_modelo": 2020,
            "serie": None, "geracao": None, "eixo": None, "emissao": None, "cabine": None, "cambio": None}
    base.update(kw)
    return base


class AssinaturaTest(unittest.TestCase):
    def test_mesmos_atributos_mesmo_hash(self):
        a = monta_assinatura(attrs(eixo="6X2"), ("eixo",))
        b = monta_assinatura(attrs(eixo="6X2"), ("eixo",))
        self.assertEqual(a.hash, b.hash)
        self.assertTrue(a.completa)

    def test_dimensao_nao_discriminante_nao_separa_grupos(self):
        a = monta_assinatura(attrs(eixo="6X2", cabine="LEITO"), ("eixo",))
        b = monta_assinatura(attrs(eixo="6X2", cabine=None), ("eixo",))
        self.assertEqual(a.hash, b.hash)

    def test_dimensao_discriminante_ausente_deixa_incompleta(self):
        a = monta_assinatura(attrs(eixo=None), ("eixo",))
        self.assertFalse(a.completa)

    def test_discriminante_diferente_muda_hash(self):
        self.assertNotEqual(monta_assinatura(attrs(eixo="4X2"), ("eixo",)).hash,
                            monta_assinatura(attrs(eixo="6X2"), ("eixo",)).hash)

    def test_lista_de_dimensoes_faz_parte_da_identidade(self):
        # Se o catalogo passa a variar tambem o eixo, o hash antigo nao vale mais.
        self.assertNotEqual(monta_assinatura(attrs(eixo="6X2"), ()).hash,
                            monta_assinatura(attrs(eixo="6X2"), ("eixo",)).hash)

    def test_sem_base_minima_nao_gera_assinatura(self):
        self.assertIsNone(monta_assinatura(attrs(numero=None), ()))
        self.assertIsNone(monta_assinatura(attrs(ano_modelo=None), ()))
        self.assertIsNone(monta_assinatura(attrs(marca=None), ()))

    def test_ano_diferente_muda_hash(self):
        self.assertNotEqual(monta_assinatura(attrs(ano_modelo=2020), ()).hash,
                            monta_assinatura(attrs(ano_modelo=2021), ()).hash)


class AtributosDoAnuncioTest(unittest.TestCase):
    def test_le_dimensoes_do_titulo(self):
        a = atributos_do_anuncio({"titulo": "Scania R 440 A 6x2 2020/2020", "url": "", "marca": "SCANIA",
                                  "modelo": "", "tracao": "", "ano_inicial": 2020, "ano_final": 2020})
        self.assertEqual("SCANIA", a["marca"])
        self.assertEqual("440", a["numero"])
        self.assertEqual("6X2", a["eixo"])
        self.assertEqual(2020, a["ano_modelo"])

    def test_conflito_de_eixo_vira_none(self):
        a = atributos_do_anuncio({"titulo": "Scania R 440 4x2", "url": "", "marca": "SCANIA",
                                  "modelo": "", "tracao": "6x4", "ano_inicial": 2020, "ano_final": 2020})
        self.assertIsNone(a["eixo"])

    def test_emissao_estimada_pela_fabricacao_nao_entra(self):
        # Euro 6 deduzido do ano de fabricacao nao e prova: a assinatura so usa emissao explicita.
        a = atributos_do_anuncio({"titulo": "DAF XF 530 6x2", "url": "", "marca": "DAF", "modelo": "",
                                  "tracao": "", "ano_inicial": 2023, "ano_final": 2024})
        self.assertIsNone(a["emissao"])

    def test_emissao_explicita_entra(self):
        a = atributos_do_anuncio({"titulo": "DAF XF 530 6x2 Euro 6", "url": "", "marca": "DAF", "modelo": "",
                                  "tracao": "", "ano_inicial": 2023, "ano_final": 2024})
        self.assertEqual("E6", a["emissao"])


if __name__ == "__main__":
    unittest.main()

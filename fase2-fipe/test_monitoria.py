import sys
import unittest
from datetime import datetime, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from monitoria import faixa_estreita, precisa_reprocessar

AGORA = datetime(2026, 10, 22, 12, 0)


def anuncio(**kw):
    base = {"fipe_match_status": "ambiguo", "fipe_ultima_tentativa": AGORA - timedelta(days=2),
            "detalhe_coletado_em": None, "fipe_regra_versao": 3, "catalogo_atualizado_em": AGORA - timedelta(days=10)}
    base.update(kw)
    return base


class ReprocessoTest(unittest.TestCase):
    def test_detalhe_novo_reabre(self):
        a = anuncio(detalhe_coletado_em=AGORA - timedelta(hours=1))
        self.assertTrue(precisa_reprocessar(a, regra_versao_atual=3))

    def test_regra_nova_reabre(self):
        self.assertTrue(precisa_reprocessar(anuncio(fipe_regra_versao=2), regra_versao_atual=3))

    def test_catalogo_atualizado_reabre(self):
        a = anuncio(catalogo_atualizado_em=AGORA - timedelta(hours=1))
        self.assertTrue(precisa_reprocessar(a, regra_versao_atual=3))

    def test_nada_mudou_nao_reabre(self):
        self.assertFalse(precisa_reprocessar(anuncio(), regra_versao_atual=3))

    def test_status_vinculado_nunca_reabre_por_evento(self):
        a = anuncio(fipe_match_status="vinculado", detalhe_coletado_em=AGORA)
        self.assertFalse(precisa_reprocessar(a, regra_versao_atual=9))


class FaixaTest(unittest.TestCase):
    def test_faixa_estreita(self):
        self.assertTrue(faixa_estreita([500000, 510000, 520000]))
        self.assertFalse(faixa_estreita([500000, 560000]))

    def test_precisa_de_pelo_menos_dois_precos(self):
        self.assertFalse(faixa_estreita([500000]))
        self.assertFalse(faixa_estreita([]))

    def test_preco_zero_nao_quebra(self):
        self.assertFalse(faixa_estreita([0, 100]))


if __name__ == "__main__":
    unittest.main()

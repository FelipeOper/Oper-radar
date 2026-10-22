import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _sem_banco  # noqa: F401
from fipe_sync import cabine_daf, cambio_daf, eixo_do_anuncio, emissao_preferida, texto_anuncio
from evidencia_detalhe import aumenta_com_detalhe


def anuncio(**kw):
    base = {"titulo": "DAF XF 530 2022/2023", "url": "", "modelo": "", "tracao": "",
            "ano_inicial": 2022, "ano_final": 2023, "descricao": "", "opcionais": "", "carroceria": ""}
    base.update(kw)
    return base


class AumentaComDetalheTest(unittest.TestCase):
    def test_traz_eixo_cabine_e_emissao_do_detalhe_quando_titulo_nao_diz(self):
        a = anuncio(descricao="Cavalo mecânico 6x4, cabine Space Cab, Euro 6")
        r = aumenta_com_detalhe(a)
        self.assertEqual(("6X4", None), eixo_do_anuncio(r))
        self.assertEqual("E6", emissao_preferida(r)[0])
        self.assertEqual(cabine_daf("Space Cab"), cabine_daf(texto_anuncio(r)))

    def test_cavalo_mecanico_nao_vira_cambio_manual(self):
        r = aumenta_com_detalhe(anuncio(descricao="Cavalo mecânico 6x4 pronto para trabalho"))
        self.assertIsNone(cambio_daf(texto_anuncio(r)))

    def test_cambio_explicito_entra(self):
        r = aumenta_com_detalhe(anuncio(descricao="Câmbio automático, 6x2"))
        self.assertEqual("AUTOMATICO", cambio_daf(texto_anuncio(r)))

    def test_titulo_manda_sobre_o_detalhe(self):
        a = anuncio(titulo="DAF XF 530 6x2 2022/2023", descricao="aceito troca por 6x4")
        self.assertEqual(("6X2", None), eixo_do_anuncio(aumenta_com_detalhe(a)))

    def test_detalhe_com_valores_conflitantes_nao_entra(self):
        a = anuncio(descricao="6x2 ou 6x4 sob consulta")
        self.assertEqual((None, None), eixo_do_anuncio(aumenta_com_detalhe(a)))

    def test_detalhe_nunca_traz_numero_de_outro_modelo(self):
        a = anuncio(descricao="aceito troca por Volvo FH 540 e Scania R 450")
        r = aumenta_com_detalhe(a)
        self.assertNotIn("540", texto_anuncio(r))
        self.assertNotIn("450", texto_anuncio(r))

    def test_sem_detalhe_devolve_o_mesmo_conteudo(self):
        a = anuncio()
        self.assertEqual(texto_anuncio(a), texto_anuncio(aumenta_com_detalhe(a)))


if __name__ == "__main__":
    unittest.main()

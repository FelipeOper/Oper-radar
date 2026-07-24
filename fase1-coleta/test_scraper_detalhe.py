import unittest
from unittest.mock import patch, MagicMock
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))

import requests
import scraper_detalhe as sd

DIRETORIO = Path(__file__).resolve().parent
HTML_REAL = (DIRETORIO / "sample_detalhe_real.html").read_text(encoding="utf-8")


class RespostaFake:
    def __init__(self, status_code=200, text=""):
        self.status_code = status_code
        self.text = text
        self.ok = status_code < 400


def pendentes(n):
    return [{"id": i, "url": f"https://exemplo/veiculo/{i}"} for i in range(1, n + 1)]


class RodaLoteTest(unittest.TestCase):
    def setUp(self):
        # patcha as 4 funcoes de escrita no banco e a fila, deixando roda_lote isolado de
        # qualquer conexao/HTTP real.
        self.patches = [
            patch.object(sd, "busca_pendentes"),
            patch.object(sd, "registra_tentativa"),
            patch.object(sd, "marca_removido"),
            patch.object(sd, "salva_detalhe"),
            patch.object(sd, "SESSAO"),
        ]
        mocks = [p.start() for p in self.patches]
        (self.mock_busca, self.mock_registra, self.mock_removido,
         self.mock_salva, self.mock_sessao) = mocks
        for p in self.patches:
            self.addCleanup(p.stop)

    def test_pagina_grande_sem_campos_nao_chama_salva_detalhe(self):
        self.mock_busca.return_value = pendentes(1)
        self.mock_sessao.get.return_value = RespostaFake(200, "<html>" + ("x" * 9000) + "</html>")

        r = sd.roda_lote(conn=None, lote=1, pausa=0)

        self.mock_salva.assert_not_called()
        self.mock_registra.assert_called_once_with(None, 1, "pagina_inesperada")
        self.assertEqual(1, r["pagina_inesperada"])
        self.assertEqual(0, r["ok"])
        self.assertFalse(r["abortado"])

    def test_http_403_registra_bloqueio_confirmado_e_aborta(self):
        self.mock_busca.return_value = pendentes(1)
        self.mock_sessao.get.return_value = RespostaFake(403, "bloqueado")

        r = sd.roda_lote(conn=None, lote=1, pausa=0)

        self.mock_registra.assert_called_once_with(None, 1, "bloqueio_confirmado")
        self.assertEqual(1, r["bloqueio_confirmado"])
        self.assertTrue(r["abortado"])
        self.assertIn("403", r["motivo_abortado"])

    def test_http_429_registra_bloqueio_confirmado_e_aborta(self):
        self.mock_busca.return_value = pendentes(1)
        self.mock_sessao.get.return_value = RespostaFake(429, "rate limited")

        r = sd.roda_lote(conn=None, lote=1, pausa=0)

        self.mock_registra.assert_called_once_with(None, 1, "bloqueio_confirmado")
        self.assertEqual(1, r["bloqueio_confirmado"])
        self.assertTrue(r["abortado"])
        self.assertIn("429", r["motivo_abortado"])

    def test_marcador_cloudflare_aborta(self):
        self.mock_busca.return_value = pendentes(1)
        self.mock_sessao.get.return_value = RespostaFake(
            200, "<html><body>Cloudflare - Attention Required</body></html>")

        r = sd.roda_lote(conn=None, lote=1, pausa=0)

        self.mock_salva.assert_not_called()
        self.mock_registra.assert_called_once_with(None, 1, "bloqueio_confirmado")
        self.assertEqual(1, r["bloqueio_confirmado"])
        self.assertTrue(r["abortado"])

    def test_cinco_erros_consecutivos_abortam(self):
        self.mock_busca.return_value = pendentes(5)
        self.mock_sessao.get.side_effect = requests.RequestException("timeout")

        r = sd.roda_lote(conn=None, lote=5, pausa=0)

        self.assertEqual(5, r["erro_rede"])
        self.assertEqual(5, self.mock_registra.call_count)
        self.assertTrue(r["abortado"])
        self.assertIn("5 erros seguidos", r["motivo_abortado"])

    def test_pagina_valida_chama_salva_detalhe(self):
        self.mock_busca.return_value = pendentes(1)
        self.mock_sessao.get.return_value = RespostaFake(200, HTML_REAL)

        r = sd.roda_lote(conn=None, lote=1, pausa=0)

        self.mock_salva.assert_called_once()
        anuncio_id_chamado, campos_chamados = self.mock_salva.call_args[0][1], self.mock_salva.call_args[0][2]
        self.assertEqual(1, anuncio_id_chamado)
        self.assertEqual("VOLVO FH 540", campos_chamados["modelo"])
        self.assertEqual(1, r["ok"])
        self.assertFalse(r["abortado"])


if __name__ == "__main__":
    unittest.main()

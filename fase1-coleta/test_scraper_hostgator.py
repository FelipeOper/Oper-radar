import unittest
from unittest.mock import patch
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))

import requests

import scraper_hostgator as sh
from scraper_hostgator import combina_urls_revendas, contem_bloqueio_descoberta


class CombinaUrlsRevendasTest(unittest.TestCase):
    def test_preserva_descobertas_e_acrescenta_conhecidas_omitidas(self):
        descobertas = ["https://portal/a", "https://portal/b/"]
        conhecidas = {
            "https://portal/b": 2,
            "https://portal/c": 3,
        }

        self.assertEqual(
            ["https://portal/a", "https://portal/b", "https://portal/c"],
            combina_urls_revendas(descobertas, conhecidas),
        )

    def test_remove_duplicatas_e_normaliza_barra_final(self):
        self.assertEqual(
            ["https://portal/a"],
            combina_urls_revendas(
                ["https://portal/a/", "https://portal/a"],
                {"https://portal/a/": 10},
            ),
        )


class DescobertaBloqueioTest(unittest.TestCase):
    def test_rodape_cloudflare_email_decode_nao_e_bloqueio(self):
        html = ("<html><body>Nenhuma revenda publicada</body>" + "x" * 9000
                + '<script src="/cdn-cgi/scripts/email-decode.min.js"></script></html>')
        self.assertFalse(contem_bloqueio_descoberta(html))

    def test_challenge_real_e_bloqueio(self):
        html = '<title>Just a moment...</title><script src="/cdn-cgi/challenge-platform/x"></script>'
        self.assertTrue(contem_bloqueio_descoberta(html))

    @patch.object(sh, "SESSAO")
    def test_uf_sem_revendas_retorna_lista_vazia(self, sessao):
        resposta = sessao.get.return_value
        resposta.status_code = 200
        resposta.text = ("<html><body>Sem lojas</body>" + "x" * 9000
                          + '<script src="/cdn-cgi/scripts/email-decode.min.js"></script></html>')

        self.assertEqual([], sh.discover_revenda_urls("MA"))
        resposta.raise_for_status.assert_called_once_with()

    @patch.object(sh, "SESSAO")
    def test_challenge_real_interrompe_descoberta(self, sessao):
        resposta = sessao.get.return_value
        resposta.status_code = 200
        resposta.text = '<html><title>Attention Required</title><div class="cf-chl-x"></div></html>'

        with self.assertRaises(requests.RequestException):
            sh.discover_revenda_urls("MA")

if __name__ == "__main__":
    unittest.main()

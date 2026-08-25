import unittest
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))

from scraper_hostgator import combina_urls_revendas


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


if __name__ == "__main__":
    unittest.main()

import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class SuperPackContractTest(unittest.TestCase):
    def test_todas_as_ufs_estao_no_contrato_de_facetas(self):
        codigo = (ROOT / "oper-radar-api" / "facetas.php").read_text(encoding="utf-8")
        ufs = set(re.findall(r"'([A-Z]{2})'=>'", codigo))
        self.assertEqual(27, len(ufs))
        self.assertIn("'ufs' => $ufsDetalhes", codigo)

    def test_filtros_usam_identidade_da_revenda(self):
        api = (ROOT / "oper-radar-api" / "anuncios.php").read_text(encoding="utf-8")
        app = (ROOT / "app" / "src" / "App.jsx").read_text(encoding="utf-8")
        self.assertIn("revenda_id", api)
        self.assertIn("p.set('revenda_id', revendaId)", app)

    def test_hierarquia_geografica_esta_nas_telas_operacionais(self):
        app = (ROOT / "app" / "src" / "App.jsx").read_text(encoding="utf-8")
        self.assertGreaterEqual(app.count("<SeletorGeografico"), 3)
        # Rotulos sem numeracao ("1. Regiao ... 4. Ordenacao" pareciam processo interno, ver
        # docs/oper-radar-redesign): a hierarquia continua sendo regiao -> estado.
        self.assertIn(">REGIÃO</div>", app)
        self.assertIn(">ESTADO</div>", app)
        self.assertLess(app.index(">REGIÃO</div>"), app.index(">ESTADO</div>"))
        self.assertNotIn("1. REGIÃO", app)

    def test_bundle_nao_depende_de_recharts(self):
        pacote = (ROOT / "app" / "package.json").read_text(encoding="utf-8")
        self.assertNotIn("recharts", pacote)


if __name__ == "__main__":
    unittest.main()

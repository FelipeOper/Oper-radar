import argparse
import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import coleta_multi_uf as coleta


class ColetaMultiUfTest(unittest.TestCase):
    def args(self, **valores):
        base = dict(plano=None, regiao=None, regioes=None, ufs=None)
        base.update(valores)
        return argparse.Namespace(**base)

    def test_plano_expansao_cobre_as_tres_regioes(self):
        ufs = coleta.resolve_ufs(self.args(plano="expansao"))
        self.assertEqual(len(ufs), 20)
        for uf in ("MT", "DF", "BA", "SE", "PA", "AP"):
            self.assertIn(uf, ufs)

    def test_regioes_remove_duplicatas(self):
        ufs = coleta.resolve_ufs(self.args(regioes="norte,norte"))
        self.assertEqual(ufs, coleta.REGIOES["norte"])

    def test_rejeita_uf_invalida(self):
        with self.assertRaises(ValueError):
            coleta.resolve_ufs(self.args(ufs="PR,XX"))

    def test_status_e_atomico_e_legivel(self):
        with tempfile.TemporaryDirectory() as pasta:
            caminho = Path(pasta) / "status.json"
            dados = {"ciclos": {}}
            coleta.atualiza_status(caminho, dados, "2026-07-19:07h", "MT", "ok", duracao=12)
            salvo = json.loads(caminho.read_text(encoding="utf-8"))
            self.assertEqual(salvo["ciclos"]["2026-07-19:07h"]["ufs"]["MT"]["status"], "ok")
            self.assertFalse(caminho.with_suffix(".json.tmp").exists())


if __name__ == "__main__":
    unittest.main()

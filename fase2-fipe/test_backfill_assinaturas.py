import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from backfill_assinaturas import parse_args, planeja


class PlanejaTest(unittest.TestCase):
    def test_conta_assinaturas_novas_incompletas_e_propagaveis(self):
        vinculados = [{"id": 1, "p": 10}, {"id": 2, "p": 10}, {"id": 3, "p": 11}]
        pendentes = [{"id": 8}, {"id": 9}]
        grava = {1: "h1", 2: "h1", 3: None}
        reuso = {8: 10, 9: None}
        r = planeja(vinculados, pendentes,
                    resolve_grava=lambda a: grava[a["id"]],
                    resolve_reuso=lambda a: reuso[a["id"]])
        self.assertEqual(1, r["assinaturas_novas"])
        self.assertEqual(1, r["incompletas"])
        self.assertEqual([8], [x["id"] for x in r["propagaveis"]])

    def test_dry_run_e_o_padrao(self):
        self.assertFalse(parse_args([]).aplicar)
        self.assertTrue(parse_args(["--aplicar"]).aplicar)


if __name__ == "__main__":
    unittest.main()

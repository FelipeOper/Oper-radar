import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class ApiFoundationContractTest(unittest.TestCase):
    def test_config_expoe_request_id_meta_e_autorizacao_central(self):
        config = (ROOT / "oper-radar-api" / "config.php").read_text(encoding="utf-8")
        self.assertIn("function oper_request_id()", config)
        self.assertIn("function oper_api_meta(", config)
        self.assertIn("'X-Request-ID: '", config)
        self.assertIn("'api_version' => '2026-08-31'", config)
        self.assertIn("function exige_papel(", config)
        self.assertIn("'codigo' => 'SEM_PERMISSAO'", config)

    def test_resposta_legada_recebe_meta_sem_perder_campos_raiz(self):
        config = (ROOT / "oper-radar-api" / "config.php").read_text(encoding="utf-8")
        self.assertIn("$dados['_meta'] = oper_api_meta($metaExistente);", config)
        self.assertNotIn("'dados' => $dados", config)

    def test_curadoria_usa_gate_central_de_papel(self):
        detalhe = (ROOT / "oper-radar-api" / "anuncio_detalhe.php").read_text(encoding="utf-8")
        self.assertIn("$usuario = exige_papel(['admin', 'gestor']);", detalhe)
        self.assertNotIn("in_array($usuario['papel']", detalhe)


if __name__ == "__main__":
    unittest.main()

import base64
import json
import sys
import time
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from diagnostico_instalacao import FLAGS_VISIVEIS, SEGREDOS, resume_token, rotulo_flag


def jwt(payload):
    corpo = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
    return f"cabecalho.{corpo}.assinatura"


class TokenTest(unittest.TestCase):
    def test_token_sem_validade_nao_vence_por_data(self):
        r = resume_token(jwt({"userId": "x", "email": "a@b.c"}))
        self.assertEqual("sem data de validade no token", r)

    def test_token_vencido(self):
        r = resume_token(jwt({"exp": int(time.time()) - 86400}))
        self.assertTrue(r.startswith("VENCIDO"))

    def test_token_valido_informa_dias(self):
        r = resume_token(jwt({"exp": int(time.time()) + 10 * 86400}))
        self.assertTrue(r.startswith("valido"))
        self.assertIn("10", r)

    def test_token_ausente_ou_malformado(self):
        self.assertEqual("nao definido", resume_token(""))
        self.assertEqual("nao definido", resume_token(None))
        self.assertEqual("formato nao reconhecido", resume_token("abc"))

    def test_nunca_devolve_dados_pessoais_do_token(self):
        r = resume_token(jwt({"userId": "123-uuid", "email": "pessoa@exemplo.com", "exp": int(time.time()) + 86400}))
        self.assertNotIn("pessoa@exemplo.com", r)
        self.assertNotIn("123-uuid", r)


class FlagTest(unittest.TestCase):
    def test_flags_de_comportamento_mostram_o_valor(self):
        self.assertEqual("1", rotulo_flag("FIPE_ASSINATURA", "1"))
        self.assertEqual("0", rotulo_flag("FIPE_FILA_JUSTA", "0"))
        self.assertEqual("(nao definida)", rotulo_flag("FIPE_PROVISORIO", None))

    def test_segredos_nunca_mostram_o_valor(self):
        for nome in ("FIPE_API_TOKEN", "OPER_RADAR_DB_PASS", "ANTHROPIC_API_KEY"):
            self.assertIn(nome, SEGREDOS)
            self.assertEqual("definido", rotulo_flag(nome, "valor-secreto"))
            self.assertEqual("(nao definido)", rotulo_flag(nome, ""))

    def test_flag_desconhecida_nao_vaza_valor(self):
        self.assertEqual("definida", rotulo_flag("QUALQUER_OUTRA", "talvez-secreto"))
        self.assertNotIn("QUALQUER_OUTRA", FLAGS_VISIVEIS)


if __name__ == "__main__":
    unittest.main()

import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def php():
    return (ROOT / "oper-radar-api" / "fipe_auditoria.php").read_text(encoding="utf-8")


class FipeAuditoriaContractTest(unittest.TestCase):
    def test_escrita_exige_papel_e_csrf(self):
        fonte = php()
        post = fonte[fonte.index("REQUEST_METHOD'] === 'POST'"):]
        self.assertLess(post.index("exige_papel(['admin', 'gestor'])"), post.index("exige_csrf()"))
        self.assertIn("exige_autenticacao()", fonte[fonte.index("!== 'GET'"):])

    def test_nao_mexe_no_vinculo_do_anuncio(self):
        fonte = php()
        for escrita in (r"DELETE\s+FROM\s+anuncio\b", r"INSERT\s+INTO\s+anuncio\b"):
            self.assertNotRegex(fonte, escrita)
        # A unica escrita em anuncio e a marcacao de conjunto; o vinculo FIPE nunca e tocado aqui.
        for coluna in re.findall(r"UPDATE\s+anuncio\s+SET\s+(\w+)", fonte):
            self.assertEqual("conjunto", coluna)

    def test_entrada_do_usuario_nunca_entra_no_sql(self):
        fonte = php()
        self.assertNotRegex(fonte, r"\$_(GET|POST|REQUEST)\[[^\]]+\]\s*\.\s*['\"]")
        self.assertNotRegex(fonte, r"(WHERE|AND|OR)[^;\n]*\"\s*\.\s*\$_(GET|POST)")
        self.assertIn("bind_param(", fonte)
        self.assertIn("addcslashes(", fonte)

    def test_guarda_de_tabela_antes_de_qualquer_consulta(self):
        fonte = php()
        self.assertIn("SHOW TABLES LIKE 'fipe_auditoria'", fonte)
        self.assertIn("MIGRACAO_PENDENTE", fonte)
        self.assertLess(fonte.index("if (!aud_tabela_pronta($conn))"), fonte.index("exige_autenticacao();"))

    def test_veredito_vale_para_o_par_anuncio_referencia(self):
        fonte = php()
        self.assertIn("au.fipe_preco_id = a.fipe_preco_id", fonte)
        self.assertIn("O vinculo deste anuncio mudou", fonte)

    def test_lote_nunca_sobrescreve_veredito_individual_e_so_aceita_correto(self):
        fonte = php()
        lote = fonte[fonte.index("'veredito_lote'"):fonte.index("'limpar'")]
        self.assertIn("NOT EXISTS", lote)
        self.assertNotIn("ON DUPLICATE KEY", lote)
        self.assertIn("'correto'", lote)
        self.assertIn("200", lote)

    def test_migracao_cria_a_tabela_com_unicidade_por_par(self):
        migracao = (ROOT / "fase2-fipe" / "migrar_fipe_assinatura.py").read_text(encoding="utf-8")
        sql = (ROOT / "fase2-fipe" / "migracao_fipe_assinatura_mysql.sql").read_text(encoding="utf-8")
        for texto in (migracao, sql):
            self.assertIn("CREATE TABLE fipe_auditoria", texto)
            self.assertRegex(texto, r"UNIQUE KEY uq_auditoria \(anuncio_id, fipe_preco_id\)")

    def test_filtros_cobrem_modelo_lojista_estado_regiao_e_cidade(self):
        fonte = php()
        for chave in ("'marca'", "'modelo'", "'revenda_id'", "'revenda'", "'cidade'", "'regiao'", "'uf'",
                      "'confianca'", "'estado'"):
            self.assertIn(chave, fonte)
        self.assertTrue(re.search(r"painel_normaliza_ufs\(", fonte))


if __name__ == "__main__":
    unittest.main()

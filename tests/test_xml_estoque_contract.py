from pathlib import Path
import re
import unittest


ROOT = Path(__file__).resolve().parents[1]


class EstoqueXmlContractTest(unittest.TestCase):
    def test_parser_bloqueia_entidades_externas_e_limita_arquivo(self):
        source = (ROOT / "oper-radar-api/lib/xml_estoque.php").read_text(encoding="utf-8")
        self.assertIn("LIBXML_NONET", source)
        self.assertRegex(source, r"DOCTYPE\|<!ENTITY")
        self.assertIn("20 * 1024 * 1024", source)

    def test_importacao_tem_analise_transacao_e_sincronizacao_explicita(self):
        source = (ROOT / "oper-radar-api/minha_loja_xml.php").read_text(encoding="utf-8")
        for fragment in ["$acao === 'analisar'", "begin_transaction", "rollback", "marcar_ausentes", "usar_comparativo"]:
            self.assertIn(fragment, source)

    def test_frontend_exige_confirmacao_antes_de_importar(self):
        source = (ROOT / "app/src/App.jsx").read_text(encoding="utf-8")
        self.assertIn("Sincronizar estoque por XML", source)
        self.assertIn("Nada é alterado até sua confirmação", source)
        self.assertIn("Confirmar ${fmtN(xmlEstado.analise.resumo.validos)} veículos", source)

    def test_quantidade_de_tipos_mysqli_corresponde_aos_valores(self):
        source = (ROOT / "oper-radar-api/minha_loja_xml.php").read_text(encoding="utf-8")
        self.assertIn("bind_param('sssidssssisissiiii'", source)  # 18 campos no UPDATE
        self.assertIn("bind_param('isssidssssississii'", source)  # 18 campos no INSERT

    def test_migracao_e_idempotente(self):
        source = (ROOT / "fase4-acesso/migrar_xml_estoque.php").read_text(encoding="utf-8")
        self.assertIn("coluna_existe", source)
        self.assertIn("uq_meu_estoque_origem", source)
        self.assertTrue((ROOT / "fase4-acesso/estoque-exemplo.xml").exists())


if __name__ == "__main__":
    unittest.main()

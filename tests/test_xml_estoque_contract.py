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
        self.assertIn("bind_param('ssssidssssississiiii'", source)  # 20 campos no UPDATE
        self.assertIn("bind_param('issssidssssississii'", source)  # 19 campos no INSERT

    def test_id_estavel_preserva_tempo_titulo_e_fipe_manual(self):
        parser = (ROOT / "oper-radar-api/lib/xml_estoque.php").read_text(encoding="utf-8")
        api = (ROOT / "oper-radar-api/minha_loja_xml.php").read_text(encoding="utf-8")
        self.assertIn("'titulo' =>", parser)
        self.assertIn("'identidade_origem'", parser)
        self.assertIn("[A-Z]{3}[0-9][A-Z0-9][0-9]{2}", parser)
        self.assertNotIn("$anoTexto, $indice", parser)
        self.assertIn("LEAST(data_entrada,COALESCE(?,data_entrada))", api)
        self.assertIn("$existente && $existente['fipe_preco_id']", api)
        self.assertIn("com_id_estavel", api)
        self.assertIn("['codigo_referencia','placa','url']", api)
        self.assertIn("NULLIF(?,'') IS NOT NULL AND placa=?", api)

    def test_frontend_permite_escolher_fipe_e_exibe_id_e_titulo(self):
        source = (ROOT / "app/src/App.jsx").read_text(encoding="utf-8")
        for fragmento in [
            "Código / ID do estoque", "Título do anúncio", "opcoesFipe",
            "Buscar referência FIPE manualmente", "selecionarFipe", "item.placa",
        ]:
            self.assertIn(fragmento, source)

    def test_migracao_e_idempotente(self):
        source = (ROOT / "fase4-acesso/migrar_xml_estoque.php").read_text(encoding="utf-8")
        self.assertIn("coluna_existe", source)
        self.assertIn("uq_meu_estoque_origem", source)
        self.assertIn("'titulo'", source)
        self.assertTrue((ROOT / "fase4-acesso/estoque-exemplo.xml").exists())


if __name__ == "__main__":
    unittest.main()

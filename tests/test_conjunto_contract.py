import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
API = ROOT / "oper-radar-api"
LEITURAS = ("insights.php", "lojista_detalhe.php", "lojistas.php", "mercado_painel.php",
            "oportunidades_compra.php", "anuncios.php")


def ler(caminho):
    return caminho.read_text(encoding="utf-8")


class ConjuntoContractTest(unittest.TestCase):
    def test_conjunto_sai_da_comparacao_com_a_fipe(self):
        fonte = ler(API / "lib" / "market_quality.php")
        corpo = fonte[fonte.index("function mercado_carroceria_comparavel_fipe"):]
        self.assertLess(corpo.index("mercado_conjunto_registro($registro)"), corpo.index("array_key_exists('carroceria'"))
        self.assertIn("COALESCE(a.conjunto,0)=0", fonte)

    def test_sem_a_coluna_o_app_segue_como_era(self):
        fonte = ler(API / "lib" / "market_quality.php")
        self.assertIn("SHOW COLUMNS FROM anuncio LIKE 'conjunto'", fonte)
        self.assertIn("mercado_coluna_conjunto_existe() ? ' AND COALESCE(a.conjunto,0)=0' : ''", fonte)
        self.assertIn("'0 AS conjunto'", fonte)

    def test_toda_consulta_que_decide_comparabilidade_traz_a_coluna(self):
        for nome in LEITURAS:
            with self.subTest(arquivo=nome):
                self.assertIn("mercado_col_conjunto()", ler(API / nome))

    def test_nenhum_select_le_a_coluna_direto(self):
        # Ler a.conjunto sem a guarda quebraria o app inteiro enquanto a migracao nao rodou.
        for nome in LEITURAS:
            with self.subTest(arquivo=nome):
                self.assertNotRegex(ler(API / nome), r"a\.carroceria,\s*a\.conjunto")

    def test_migracao_cria_as_colunas(self):
        fase = ROOT / "fase2-fipe"
        for arquivo in ("migrar_fipe_assinatura.py", "migracao_fipe_assinatura_mysql.sql"):
            texto = ler(fase / arquivo)
            self.assertRegex(texto, r"conjunto\"?,? ?\"?TINYINT NULL|conjunto TINYINT NULL")
            self.assertIn("conjunto_origem", texto)

    def test_marcacao_manual_exige_papel_e_nunca_e_sobrescrita_pelo_classificador(self):
        auditoria = ler(API / "fipe_auditoria.php")
        bloco = auditoria[auditoria.index("$acao === 'conjunto'"):auditoria.index("$acao === 'limpar'")]
        self.assertIn("conjunto_origem = 'manual'", bloco)
        self.assertIn("mercado_coluna_conjunto_existe()", bloco)
        job = ler(ROOT / "fase2-fipe" / "classifica_conjunto.py")
        self.assertIn("conjunto_origem <> 'manual'", job)


if __name__ == "__main__":
    unittest.main()

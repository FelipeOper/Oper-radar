from datetime import date
from pathlib import Path
import importlib.util
import sys
import types
import unittest


ROOT = Path(__file__).resolve().parents[1]


def carrega_materializador():
    temporarios = {}
    try:
        import mysql.connector  # noqa: F401
    except ImportError:
        mysql = types.ModuleType("mysql")
        mysql.__path__ = []
        connector = types.ModuleType("mysql.connector")
        mysql.connector = connector
        for nome, modulo in {"mysql": mysql, "mysql.connector": connector}.items():
            temporarios[nome] = sys.modules.get(nome)
            sys.modules[nome] = modulo
    caminho = ROOT / "fase3-series" / "materializar_eventos.py"
    spec = importlib.util.spec_from_file_location("materializar_eventos", caminho)
    modulo = importlib.util.module_from_spec(spec)
    try:
        spec.loader.exec_module(modulo)
    finally:
        for nome, anterior in temporarios.items():
            if anterior is None:
                sys.modules.pop(nome, None)
            else:
                sys.modules[nome] = anterior
    return modulo


class EventosSeriesTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.modulo = carrega_materializador()

    def test_transicoes_nao_chamam_saida_de_venda(self):
        tipo = self.modulo.tipo_transicao
        self.assertEqual("ausencia_detectada", tipo("ativo", "removido_candidato"))
        self.assertEqual("saida_detectada", tipo("removido_candidato", "removido_confirmado"))
        self.assertEqual("reaparecimento", tipo("removido_confirmado", "ativo"))

    def test_migracao_e_job_sao_seguros_por_padrao(self):
        migracao = (ROOT / "fase3-series" / "migrar_eventos.py").read_text(encoding="utf-8")
        job = (ROOT / "fase3-series" / "materializar_eventos.py").read_text(encoding="utf-8")
        self.assertIn("CREATE TABLE IF NOT EXISTS anuncio_evento", migracao)
        self.assertIn("UNIQUE KEY uq_evento_regra", migracao)
        self.assertIn('ap.add_argument("--aplicar", action="store_true")', migracao)
        self.assertIn("INSERT IGNORE INTO anuncio_evento", job)
        self.assertIn("volume atual abaixo do limite de seguranca", job)

    def test_api_declara_semantica_de_saida(self):
        api = (ROOT / "oper-radar-api" / "eventos.php").read_text(encoding="utf-8")
        self.assertIn("exige_autenticacao()", api)
        self.assertIn("Saída detectada significa ausência confirmada", api)
        self.assertNotIn("vendas_confirmadas", api)

    def test_data_cli_iso(self):
        self.assertEqual(date(2026, 8, 19), date.fromisoformat("2026-08-19"))

    def test_intervalo_historico_inclusivo_e_limitado(self):
        dias = self.modulo.dias_processamento(
            inicio=date(2026, 8, 3), fim=date(2026, 8, 5)
        )
        self.assertEqual(
            [date(2026, 8, 3), date(2026, 8, 4), date(2026, 8, 5)], dias
        )
        with self.assertRaisesRegex(ValueError, "não ambos"):
            self.modulo.dias_processamento(
                dia=date(2026, 8, 5), inicio=date(2026, 8, 3), fim=date(2026, 8, 5)
            )
        with self.assertRaisesRegex(ValueError, "366"):
            self.modulo.dias_processamento(
                inicio=date(2025, 1, 1), fim=date(2026, 1, 2)
            )


if __name__ == "__main__":
    unittest.main()

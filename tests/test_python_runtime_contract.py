import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class PythonRuntimeContractTest(unittest.TestCase):
    WRAPPERS = (
        "fase2-fipe/executar_fipe_job.sh",
        "fase3-series/executar_snapshot_job.sh",
        "monitoramento/executar_monitoramento_job.sh",
        "fase4-acesso/publicar_sugestoes_fipe_hostgator.sh",
    )

    def texto(self, caminho):
        return (ROOT / caminho).read_text(encoding="utf-8")

    def test_arquivo_de_ambiente_documenta_interpretador(self):
        env = self.texto(".env.example")
        self.assertIn("OPER_RADAR_PYTHON=python3", env)

    def test_wrappers_validam_e_usam_interpretador_configurado(self):
        execucao_direta = re.compile(r"^\s*(?:exec\s+)?python3(?:\s|$)", re.MULTILINE)
        for caminho in self.WRAPPERS:
            with self.subTest(caminho=caminho):
                wrapper = self.texto(caminho)
                self.assertIn('PYTHON_BIN="${OPER_RADAR_PYTHON:-python3}"', wrapper)
                self.assertIn('command -v "$PYTHON_BIN"', wrapper)
                self.assertIn('"$PYTHON_BIN"', wrapper)
                self.assertIsNone(execucao_direta.search(wrapper))

    def test_instalador_de_expansao_preserva_horarios_de_producao(self):
        instalador = self.texto("fase1-coleta/instalar_cron_expansao.sh")
        self.assertIn('echo "30 7 * * *', instalador)
        self.assertIn('echo "30 19 * * *', instalador)
        self.assertNotIn('echo "0 1 * * *', instalador)
        self.assertNotIn('echo "0 13 * * *', instalador)
        self.assertEqual(instalador.count("OPER_RADAR_PYTHON:-python3"), 2)

    def test_exemplos_hostgator_usam_variavel_de_interpretador(self):
        exemplos = (
            "fase1-coleta/crontab-hostgator.example",
            "fase1-coleta/crontab-hostgator-expansao.example",
            "fase1-coleta/crontab-hostgator-detalhe.example",
        )
        for caminho in exemplos:
            with self.subTest(caminho=caminho):
                self.assertIn("OPER_RADAR_PYTHON:-python3", self.texto(caminho))

    def test_cron_detalhe_tem_um_unico_job_conservador(self):
        instalador = self.texto("fase1-coleta/instalar_cron_detalhe.sh")
        exemplo = self.texto("fase1-coleta/crontab-hostgator-detalhe.example")

        for nome, conteudo in (("instalador", instalador), ("exemplo", exemplo)):
            with self.subTest(arquivo=nome):
                self.assertEqual(1, conteudo.count("scraper_detalhe.py"))
                self.assertIn("15 */3 * * *", conteudo)
                self.assertIn("--lote=80", conteudo)
                self.assertIn("--pausa-requisicoes=4", conteudo)
                self.assertIn("flock -n", conteudo)
                self.assertNotIn("*/10 * * * *", conteudo)

        self.assertIn("OPER_RADAR_DETALHE_INICIO", instalador)
        self.assertIn("OPER_RADAR_DETALHE_FIM", instalador)
        self.assertIn("crontab-antes-detalhe-", instalador)


if __name__ == "__main__":
    unittest.main()

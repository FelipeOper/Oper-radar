import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from diagnostico_cobertura import CAUSAS, classifica_causa, relatorio_markdown


def linha(**kw):
    base = {"tipo": "Caminhao", "marca": "SCANIA", "ano_inicial": 2020, "ano_final": 2020,
            "fipe_preco_id": None, "fipe_vinculo_origem": "automatico",
            "fipe_match_confianca": None, "fipe_match_status": None, "fipe_match_motivo": None}
    base.update(kw)
    return base


class ClassificaCausaTest(unittest.TestCase):
    def test_vinculados(self):
        self.assertEqual("vinculado_alto", classifica_causa(linha(fipe_preco_id=1, fipe_match_confianca="alto")))
        self.assertEqual("vinculado_medio", classifica_causa(linha(fipe_preco_id=1, fipe_match_confianca="medio")))
        self.assertEqual("vinculado_manual", classifica_causa(linha(fipe_preco_id=1, fipe_vinculo_origem="manual")))

    def test_fora_do_escopo_nao_e_pendencia(self):
        self.assertEqual("fora_escopo_tipo", classifica_causa(linha(tipo="Carreta")))
        self.assertEqual("fora_escopo_tipo", classifica_causa(linha(tipo="Maquinas")))

    def test_dados_insuficientes(self):
        self.assertEqual("sem_marca", classifica_causa(linha(marca=None)))
        self.assertEqual("sem_ano", classifica_causa(linha(ano_inicial=None, ano_final=None)))

    def test_motivos_do_motor(self):
        casos = {
            "ambiguo eixo (4X2/6X2)": "ambiguo_eixo",
            "sem match eixo 6X4": "ambiguo_eixo",
            "conflito eixo (4X2/6X4)": "ambiguo_eixo",
            "ambiguo emissao (E5/E6)": "ambiguo_emissao",
            "sem match emissao E6": "ambiguo_emissao",
            "ambiguo cabine (SEM TAG/SPACE)": "ambiguo_cabine",
            "ambiguo cambio (MANUAL/AUTOMATIZADO)": "ambiguo_cambio",
            "ambiguo serie/geracao (2 candidatos)": "ambiguo_linha_serie",
            "ambiguo linha (ATEGO/ATRON)": "ambiguo_linha_serie",
            "ambiguo 3 candidatos": "ambiguo_outros",
        }
        for motivo, esperado in casos.items():
            status = "ambiguo" if motivo.startswith(("ambiguo", "conflito")) else "sem_match"
            with self.subTest(motivo=motivo):
                self.assertEqual(esperado, classifica_causa(
                    linha(fipe_match_status=status, fipe_match_motivo=motivo)))

    def test_estados_sem_motivo(self):
        self.assertEqual("nunca_processado", classifica_causa(linha()))
        self.assertEqual("erro_api", classifica_causa(linha(fipe_match_status="erro_api")))
        self.assertEqual("ano_ausente_no_cache", classifica_causa(linha(fipe_match_status="sem_ano")))
        self.assertEqual("sem_candidato", classifica_causa(
            linha(fipe_match_status="sem_match", fipe_match_motivo="sem match")))

    def test_toda_causa_retornada_esta_declarada(self):
        self.assertIn("outros", CAUSAS)
        self.assertEqual("outros", classifica_causa(linha(fipe_match_status="reprocessar_x")))


class RelatorioTest(unittest.TestCase):
    def test_relatorio_traz_percentuais_e_ranking(self):
        md = relatorio_markdown(
            total=10, por_causa={"vinculado_alto": 6, "ambiguo_cabine": 3, "sem_candidato": 1},
            por_marca=[("DAF", 4, 1)], motivos=[("ambiguo cabine (SEM TAG/SPACE)", 3)],
            com_detalhe_nao_vinculados=2)
        self.assertIn("60,0%", md)
        self.assertIn("DAF", md)
        self.assertIn("ambiguo cabine", md)
        self.assertIn("2", md)


if __name__ == "__main__":
    unittest.main()

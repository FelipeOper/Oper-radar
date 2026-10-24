import os
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _sem_banco  # noqa: F401
import fipe_sync
from fipe_sync import anuncios_pendentes, processa_anuncios, registra_aguardando_cache


class CursorFalso:
    def __init__(self):
        self.sql = []

    def execute(self, sql, params=None):
        self.sql.append((" ".join(sql.split()), params))

    def fetchall(self):
        return []

    def fetchone(self):
        return {"m": None}

    def close(self):
        pass


class ConexaoFalsa:
    def __init__(self):
        self.cursor_falso = CursorFalso()
        self.commits = 0

    def cursor(self, dictionary=False):
        return self.cursor_falso

    def commit(self):
        self.commits += 1


def sql_da_fila(flag, com_api):
    conn = ConexaoFalsa()
    ambiente = {"FIPE_FILA_JUSTA": flag} if flag is not None else {}
    with patch.dict(os.environ, ambiente, clear=False):
        if flag is None:
            os.environ.pop("FIPE_FILA_JUSTA", None)
        anuncios_pendentes(conn, 100, com_api=com_api)
    return conn.cursor_falso.sql[-1][0]


class FilaJustaTest(unittest.TestCase):
    def test_desligada_a_fila_e_a_de_sempre(self):
        self.assertNotIn("aguardando_cache", sql_da_fila(None, False))
        self.assertNotIn("aguardando_cache", sql_da_fila("0", True))

    def test_ligada_no_modo_local_so_reabre_depois_de_um_dia(self):
        sql = sql_da_fila("1", False)
        self.assertIn("fipe_match_status = 'aguardando_cache' AND fipe_ultima_tentativa <= DATE_SUB(NOW(), INTERVAL 1 DAY)", sql)

    def test_ligada_com_api_sempre_inclui_quem_espera_cache(self):
        sql = sql_da_fila("1", True)
        self.assertIn("OR fipe_match_status = 'aguardando_cache'", sql)
        self.assertNotIn("aguardando_cache' AND fipe_ultima_tentativa", sql)

    def test_quem_espera_cache_fica_atras_dos_nunca_tentados(self):
        sql = sql_da_fila("1", False)
        self.assertLess(sql.index("fipe_ultima_tentativa IS NULL DESC"), sql.index("fipe_ultima_tentativa ASC"))

    def test_registra_tentativa_sem_tocar_em_vinculo_manual_nem_em_quem_ja_tem_fipe(self):
        conn = ConexaoFalsa()
        registra_aguardando_cache(conn, 7)
        sql, params = conn.cursor_falso.sql[-1]
        self.assertEqual((7,), params)
        self.assertIn("fipe_ultima_tentativa=NOW()", sql)
        self.assertIn("fipe_preco_id IS NULL", sql)
        self.assertIn("<> 'manual'", sql)
        self.assertEqual(1, conn.commits)


class ProcessaComFilaJustaTest(unittest.TestCase):
    ANUNCIO = {"id": 9, "titulo": "DAF CF 300 2022/2022", "url": "", "marca": "DAF", "tracao": "6X2",
               "ano_inicial": 2022, "ano_final": 2022}
    MODELO = {"id": 1, "marca_fipe": "DAF", "modelo_fipe": "CF 300"}

    def roda(self, flag):
        ambiente = {"FIPE_FILA_JUSTA": flag}
        with patch.dict(os.environ, ambiente), \
             patch("fipe_sync.anuncios_pendentes", return_value=[self.ANUNCIO]), \
             patch("fipe_sync.escolhe", return_value=([self.MODELO], "alto")), \
             patch("fipe_sync.busca_preco_cache", return_value=None), \
             patch("fipe_sync.registra_aguardando_cache") as aguardando, \
             patch("fipe_sync.registra_resultado") as registra:
            resumo = processa_anuncios(object(), lote=1, permitir_api=False)
        return resumo, aguardando, registra

    def test_desligado_nada_e_gravado_como_antes(self):
        resumo, aguardando, registra = self.roda("0")
        aguardando.assert_not_called()
        registra.assert_not_called()
        self.assertEqual(1, resumo["aguardando_cache"])

    def test_ligado_registra_a_tentativa_e_continua_contando_como_aguardando(self):
        resumo, aguardando, registra = self.roda("1")
        aguardando.assert_called_once()
        registra.assert_not_called()
        self.assertEqual(1, resumo["aguardando_cache"])
        self.assertEqual(0, resumo["vinculados"])


if __name__ == "__main__":
    unittest.main()

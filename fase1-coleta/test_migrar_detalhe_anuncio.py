import unittest
from unittest.mock import MagicMock
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))

from migrar_detalhe_anuncio import migrar, COLUNAS, INDICE_NOME


def conexao_falsa(colunas_existentes: set, indice_existe: bool):
    """Simula uma conexao mysql.connector: SHOW COLUMNS/SHOW INDEX retornam algo (existe) ou
    None (nao existe), dependendo do que ja foi "criado" nesta execucao simulada."""
    conn = MagicMock()
    executados = []

    def cursor(*args, **kwargs):
        cur = MagicMock()

        def execute(sql, params=None):
            executados.append((sql, params))
            sql_upper = sql.upper()
            if sql_upper.startswith("SHOW COLUMNS"):
                coluna = params[0]
                cur.fetchone.return_value = (coluna,) if coluna in colunas_existentes else None
            elif sql_upper.startswith("SHOW INDEX"):
                cur.fetchone.return_value = (INDICE_NOME,) if indice_existe else None
            elif sql_upper.startswith("ALTER TABLE"):
                # extrai o nome da coluna recem-criada para refletir no estado simulado
                for nome in COLUNAS:
                    if f"ADD COLUMN {nome} " in sql:
                        colunas_existentes.add(nome)
                        break

        cur.execute.side_effect = execute
        return cur

    conn.cursor.side_effect = cursor
    conn._executados = executados
    return conn


class MigrarDetalheAnuncioTest(unittest.TestCase):
    def test_banco_zerado_cria_todas_colunas_e_indice(self):
        conn = conexao_falsa(colunas_existentes=set(), indice_existe=False)
        migrar(conn)
        sqls = [sql for sql, _ in conn._executados]
        for coluna in COLUNAS:
            self.assertTrue(any(f"ADD COLUMN {coluna} " in sql for sql in sqls),
                             f"coluna {coluna} deveria ter sido criada")
        self.assertTrue(any("CREATE INDEX" in sql for sql in sqls))

    def test_rodar_duas_vezes_na_segunda_nao_tenta_recriar_nada(self):
        conn = conexao_falsa(colunas_existentes=set(), indice_existe=False)
        migrar(conn)  # primeira execucao: cria tudo
        conn._executados.clear()

        # segunda execucao simulada: tudo ja existe agora (estado persistiu no set)
        conn2 = conexao_falsa(colunas_existentes=set(COLUNAS.keys()), indice_existe=True)
        migrar(conn2)
        sqls = [sql for sql, _ in conn2._executados]
        self.assertFalse(any("ALTER TABLE" in sql for sql in sqls),
                          "nao deveria tentar ALTER TABLE quando a coluna ja existe")
        self.assertFalse(any("CREATE INDEX" in sql for sql in sqls),
                          "nao deveria tentar CREATE INDEX quando ja existe")

    def test_estado_parcial_so_cria_o_que_falta(self):
        parcial = {"carroceria", "tracao"}
        conn = conexao_falsa(colunas_existentes=set(parcial), indice_existe=True)
        migrar(conn)
        sqls = [sql for sql, _ in conn._executados]
        self.assertFalse(any("ADD COLUMN carroceria " in sql for sql in sqls))
        self.assertFalse(any("ADD COLUMN tracao " in sql for sql in sqls))
        self.assertTrue(any("ADD COLUMN opcionais " in sql for sql in sqls))
        self.assertFalse(any("CREATE INDEX" in sql for sql in sqls))


if __name__ == "__main__":
    unittest.main()

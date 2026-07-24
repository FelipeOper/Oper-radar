import unittest
from unittest.mock import MagicMock
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))

import mysql.connector.errors as mysql_errors

from migrar_detalhe_anuncio import migrar, coluna_existe, indice_existe, COLUNAS, INDICE_NOME


def conexao_falsa(colunas_existentes: set, indice_linhas: int):
    """Simula uma conexao mysql.connector.

    `indice_linhas` e quantas linhas SHOW INDEX devolve para o indice composto (0 = indice
    nao existe; para o nosso indice de 3 colunas, um indice existente devolve 3 linhas, uma
    por coluna). O estado "pendente" e compartilhado a nivel de CONEXAO (nao por cursor),
    igual ao mysql-connector de verdade: se um resultado nao for totalmente consumido antes
    da proxima `execute()` na mesma conexao, isso deve levantar
    `mysql.connector.errors.InternalError("Unread result found")` — e assim que reproduzimos
    o bug relatado (fetchone() num resultado de 3 linhas deixava 2 pendentes).
    """
    conn = MagicMock()
    executados = []
    estado = {"pendente": None}

    def cursor(*args, **kwargs):
        cur = MagicMock()

        def execute(sql, params=None):
            if estado["pendente"] is not None:
                raise mysql_errors.InternalError("Unread result found")
            executados.append((sql, params))
            sql_upper = sql.upper()
            if sql_upper.startswith("SHOW COLUMNS"):
                coluna = params[0]
                cur.fetchone.return_value = (coluna,) if coluna in colunas_existentes else None
            elif sql_upper.startswith("SHOW INDEX"):
                linhas_resultado = [(f"linha-{i}",) for i in range(indice_linhas)]
                # so ha algo "pendente" se de fato sobrar linha para ler — 0 linhas e um
                # resultado vazio ja totalmente consumido, nao um resultado pendurado.
                estado["pendente"] = linhas_resultado if linhas_resultado else None

                def fetchall():
                    linhas = estado["pendente"] or []
                    estado["pendente"] = None
                    return linhas

                def fetchone():
                    if not estado["pendente"]:
                        estado["pendente"] = None
                        return None
                    linha = estado["pendente"].pop(0)
                    if not estado["pendente"]:
                        estado["pendente"] = None
                    return linha

                cur.fetchall.side_effect = fetchall
                cur.fetchone.side_effect = fetchone
            elif sql_upper.startswith("ALTER TABLE"):
                for nome in COLUNAS:
                    if f"ADD COLUMN {nome} " in sql:
                        colunas_existentes.add(nome)
                        break

        cur.execute.side_effect = execute
        return cur

    conn.cursor.side_effect = cursor
    conn._executados = executados
    conn._estado = estado
    return conn


class MigrarDetalheAnuncioTest(unittest.TestCase):
    def test_banco_zerado_cria_todas_colunas_e_indice(self):
        conn = conexao_falsa(colunas_existentes=set(), indice_linhas=0)
        migrar(conn)
        sqls = [sql for sql, _ in conn._executados]
        for coluna in COLUNAS:
            self.assertTrue(any(f"ADD COLUMN {coluna} " in sql for sql in sqls),
                             f"coluna {coluna} deveria ter sido criada")
        self.assertTrue(any("CREATE INDEX" in sql for sql in sqls))

    def test_rodar_duas_vezes_na_segunda_nao_tenta_recriar_nada(self):
        conn = conexao_falsa(colunas_existentes=set(), indice_linhas=0)
        migrar(conn)  # primeira execucao: cria tudo
        conn._executados.clear()

        # segunda execucao simulada: tudo ja existe agora — indice composto de 3 colunas
        # devolve 3 linhas do SHOW INDEX, exatamente o cenario que causou o bug real.
        conn2 = conexao_falsa(colunas_existentes=set(COLUNAS.keys()), indice_linhas=3)
        migrar(conn2)  # nao pode levantar InternalError
        sqls = [sql for sql, _ in conn2._executados]
        self.assertFalse(any("ALTER TABLE" in sql for sql in sqls),
                          "nao deveria tentar ALTER TABLE quando a coluna ja existe")
        self.assertFalse(any("CREATE INDEX" in sql for sql in sqls),
                          "nao deveria tentar CREATE INDEX quando ja existe")

    def test_estado_parcial_so_cria_o_que_falta(self):
        parcial = {"carroceria", "tracao"}
        conn = conexao_falsa(colunas_existentes=set(parcial), indice_linhas=3)
        migrar(conn)
        sqls = [sql for sql, _ in conn._executados]
        self.assertFalse(any("ADD COLUMN carroceria " in sql for sql in sqls))
        self.assertFalse(any("ADD COLUMN tracao " in sql for sql in sqls))
        self.assertTrue(any("ADD COLUMN opcionais " in sql for sql in sqls))
        self.assertFalse(any("CREATE INDEX" in sql for sql in sqls))

    def test_indice_existe_consome_todas_as_linhas_do_indice_composto(self):
        # Regressao direta do bug relatado: SHOW INDEX de um indice de 3 colunas devolve
        # 3 linhas; indice_existe() precisa ler todas (fetchall), nao so a primeira.
        conn = conexao_falsa(colunas_existentes=set(), indice_linhas=3)
        self.assertTrue(indice_existe(conn, INDICE_NOME))
        self.assertIsNone(conn._estado["pendente"],
                           "sobrou resultado nao lido depois de indice_existe()")

    def test_indice_existe_nao_deixa_resultado_pendente_para_proxima_query(self):
        # Confirma o efeito colateral real do bug: se indice_existe() deixar linhas
        # pendentes, a PROXIMA query na mesma conexao quebra com InternalError. Aqui
        # chamamos indice_existe() e depois disparamos outra query qualquer — nao pode
        # levantar excecao.
        conn = conexao_falsa(colunas_existentes=set(), indice_linhas=3)
        indice_existe(conn, INDICE_NOME)
        try:
            coluna_existe(conn, "cor")
        except mysql_errors.InternalError:
            self.fail("proxima query levantou 'Unread result found' — indice_existe() "
                      "deixou linhas do SHOW INDEX sem consumir")

    def test_indice_inexistente_nao_deixa_nada_pendente(self):
        conn = conexao_falsa(colunas_existentes=set(), indice_linhas=0)
        self.assertFalse(indice_existe(conn, INDICE_NOME))
        self.assertIsNone(conn._estado["pendente"])


if __name__ == "__main__":
    unittest.main()

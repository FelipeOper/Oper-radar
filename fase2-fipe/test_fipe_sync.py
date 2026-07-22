import unittest
from unittest.mock import patch
from pathlib import Path
import sys
import types

sys.path.insert(0, str(Path(__file__).resolve().parent))

# Os testes de matching sao puros e nao precisam abrir rede/banco. Permite executa-los
# tambem em ambientes de CI que ainda nao instalaram as dependencias operacionais.
try:
    import requests  # noqa: F401
except ModuleNotFoundError:
    sys.modules["requests"] = types.ModuleType("requests")

try:
    import mysql.connector  # noqa: F401
except ModuleNotFoundError:
    mysql_mod = types.ModuleType("mysql")
    connector_mod = types.ModuleType("mysql.connector")
    mysql_mod.connector = connector_mod
    sys.modules["mysql"] = mysql_mod
    sys.modules["mysql.connector"] = connector_mod

from fipe_sync import (
    ano_modelo, avalia, com_referencia, eixos, emissao_no_texto,
    emissao_preferida, escolhe, normaliza, obtem_referencia_atual,
    parse_preco, palavras_chave, processa_anuncios,
)
from importar_fipe_csv import codigo_pelo_nome, preco_decimal


class MatchingFipeTest(unittest.TestCase):
    def test_normaliza_numero_com_pontuacao(self):
        self.assertIn("11180", normaliza("VW 11.180 Delivery"))

    def test_daf_xf_530_casa_por_numero(self):
        score, motivo = avalia("DAF XF FTS 530 2024/2024", "XF 530 6x2 Diesel")
        self.assertGreaterEqual(score, 0.5)
        self.assertEqual("so numero", motivo)

    def test_scania_nao_mistura_series(self):
        score, _ = avalia("SCANIA R440 2014", "G-440 A 6x4 Diesel")
        self.assertEqual(0.0, score)

    def test_detecta_eixo(self):
        self.assertEqual("6X4", eixos("DAF XF 530 cavalo 6x4"))

    def test_fipe_usa_ano_modelo(self):
        self.assertEqual(2023, ano_modelo({"ano_inicial": 2022, "ano_final": 2023}))
        self.assertEqual(2022, ano_modelo({"ano_inicial": 2022, "ano_final": None}))

    def test_norma_emissoes_explicita_supera_ano(self):
        anuncio = {"titulo": "DAF XF 530 EURO 6", "url": "", "ano_inicial": 2022}
        self.assertEqual(("E6", "explicita"), emissao_preferida(anuncio))
        self.assertEqual("E5", emissao_no_texto("XF 530 6x2 (diesel)(E5)"))

    def test_fabricacao_2022_modelo_2023_prefere_euro_5(self):
        anuncio = {
            "titulo": "DAF XF 530 2022/2023", "url": "", "marca": "DAF",
            "ano_inicial": 2022, "ano_final": 2023,
        }
        e5 = {"id": 1, "modelo_fipe": "XF 530 6x2 (diesel)(E5)"}
        e6 = {"id": 2, "modelo_fipe": "XF 530 6x2 (diesel)(E6)"}
        with patch("fipe_sync.melhores_candidatos", return_value=[
            (0.95, "numero+serie", e6), (0.95, "numero+serie", e5),
        ]):
            candidatos, _ = escolhe(None, anuncio)
        self.assertEqual([e5], candidatos)

    def test_fabricacao_2023_prefere_euro_6(self):
        self.assertEqual(
            ("E6", "estimada_fabricacao"),
            emissao_preferida({"titulo": "DAF XF 530 2023/2023", "ano_inicial": 2023}),
        )

    def test_remove_acabamento_das_palavras_chave(self):
        self.assertNotIn("HIGH", palavras_chave("R-450 High. 6x2 Diesel"))

    def test_preco_brasileiro(self):
        self.assertEqual(539900.0, parse_preco("R$ 539.900,00"))

    def test_preco_csv_sem_perder_centavos(self):
        self.assertEqual("539900.25", str(preco_decimal("R$ 539.900,25")))

    def test_codigo_da_referencia_no_nome_csv(self):
        self.assertEqual(335, codigo_pelo_nome("tabela-fipe-335.csv"))

    def test_adiciona_referencia_mensal(self):
        self.assertEqual("/trucks/brands?reference=321", com_referencia("/trucks/brands", 321))
        self.assertEqual("/rota?a=1&reference=321", com_referencia("/rota?a=1", 321))

    @patch("fipe_sync.api_get")
    def test_referencia_mais_recente(self, api_get):
        api_get.return_value = [
            {"code": "321", "month": "julho de 2026"},
            {"code": "320", "month": "junho de 2026"},
        ]
        self.assertEqual((321, "julho de 2026"), obtem_referencia_atual())

    def test_modo_local_nao_chama_api_quando_cache_falta(self):
        anuncio = {"id": 1, "titulo": "MB 2430 2021", "marca": "MB", "ano_inicial": 2021, "ano_final": 2022}
        candidato = {"id": 10, "marca_fipe": "MERCEDES-BENZ", "modelo_fipe": "Atego 2430"}
        conn = object()
        with patch("fipe_sync.anuncios_pendentes", return_value=[anuncio]), \
             patch("fipe_sync.escolhe", return_value=([candidato], "medio")), \
             patch("fipe_sync.busca_preco_cache", return_value=None) as busca_cache, \
             patch("fipe_sync.api_get") as api_get, \
             patch("fipe_sync.registra_resultado") as registra:
            resumo = processa_anuncios(conn, lote=1, permitir_api=False)
        api_get.assert_not_called()
        registra.assert_not_called()
        busca_cache.assert_called_once_with(conn, candidato, 2022, None)
        self.assertEqual(1, resumo["aguardando_cache"])


if __name__ == "__main__":
    unittest.main()

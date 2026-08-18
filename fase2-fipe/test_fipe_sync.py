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
    ano_modelo, avalia, cabine_daf, cambio_daf, com_referencia, eixo_do_anuncio, eixos, emissao_no_texto,
    emissao_preferida, escolhe, familia_comercial, identificadores_modelo, normaliza, numero_modelo,
    obtem_referencia_atual, parse_preco, palavras_chave, pontua_sugestao, potencia_daf,
    processa_anuncios,
)
from importar_fipe_csv import codigo_pelo_nome, preco_decimal
from reabrir_fipe_taxonomia_daf import dados_derivados


class MatchingFipeTest(unittest.TestCase):
    def test_normaliza_numero_com_pontuacao(self):
        self.assertIn("11180", normaliza("VW 11.180 Delivery"))

    def test_numero_tecnico_nao_e_confundido_com_ano(self):
        self.assertEqual("1938", numero_modelo("MB 1938 2001/2001"))
        self.assertEqual("11180", numero_modelo("VW 11.180 Delivery 2021/2022"))

    def test_formatos_tecnicos_equivalentes(self):
        self.assertIn("29480", identificadores_modelo("MAN TGX 29 480 2018/2019"))
        self.assertIn("29480", identificadores_modelo("TGX 29.480 6x4"))
        self.assertIn("31300", identificadores_modelo("TECTOR 31-300 8x2"))
        self.assertIn("440", identificadores_modelo("STRALIS 490-S44T"))

    def test_sugestao_restringe_familia_comercial(self):
        anuncio = {
            "titulo": "VW Delivery 2022/2022", "url": "", "marca": "VW",
            "ano_inicial": 2022, "ano_final": 2022,
        }
        delivery = {"modelo_fipe": "11-180 Delivery 2p (diesel)(E5)"}
        worker = {"modelo_fipe": "17-190 E Worker 2p (diesel)(E5)"}
        self.assertEqual("DELIVERY", familia_comercial(anuncio["titulo"]))
        self.assertGreaterEqual(pontua_sugestao(anuncio, delivery)[0], 65)
        self.assertEqual(0, pontua_sugestao(anuncio, worker)[0])

    def test_daf_xf_530_casa_por_numero(self):
        score, motivo = avalia("DAF XF FTS 530 2024/2024", "XF 530 6x2 Diesel")
        self.assertGreaterEqual(score, 0.5)
        self.assertEqual("potencia 530", motivo)

    def test_scania_nao_mistura_series(self):
        score, _ = avalia("SCANIA R440 2014", "G-440 A 6x4 Diesel")
        self.assertEqual(0.0, score)

    def test_detecta_eixo(self):
        self.assertEqual("6X4", eixos("DAF XF 530 cavalo 6x4"))

    def test_daf_traduz_configuracao_em_eixo(self):
        self.assertEqual("4X2", eixos("XF FT530 4x2 Space Cab"))
        self.assertEqual("6X2", eixos("DAF XF FTS 530"))
        self.assertEqual("6X4", eixos("DAF XF FTT 530"))

    def test_daf_combina_eixo_do_titulo_e_da_url(self):
        anuncio = {
            "titulo": "DAF XF FTT 530 2021/2021",
            "url": "https://portal/veiculo/daf/daf-xf-ftt-530/2021/cavalo-6x4/1",
        }
        self.assertEqual(("6X4", None), eixo_do_anuncio(anuncio))

    def test_daf_detecta_conflito_de_eixo(self):
        anuncio = {"titulo": "DAF XF FTS 530", "url": "https://portal/cavalo-6x4/1"}
        self.assertEqual((None, "conflito eixo (6X2/6X4)"), eixo_do_anuncio(anuncio))

    def test_daf_105_e_geracao_e_530_e_potencia(self):
        self.assertEqual("530", potencia_daf("DAF XF105 530 2021/2021"))
        score, motivo = avalia("DAF XF105 530 2021/2021", "XF 105 FTT 510 6x4 (diesel)(E5)")
        self.assertEqual(0.0, score)
        self.assertIn("potencia", motivo)

    def test_daf_xf105_530_nao_casa_com_nova_geracao(self):
        score, motivo = avalia("DAF XF105 530 2021/2021", "XF FTT530 6x4 Space Cab (diesel)(E5)")
        self.assertEqual(0.0, score)
        self.assertIn("geracao", motivo)

    def test_reconhece_cabines_daf(self):
        self.assertEqual("SPACE", cabine_daf("XF FTT530 6x4 Space Cab"))
        self.assertEqual("SUPER SPACE", cabine_daf("XF FTT530 6x4 Super Space Cab"))
        self.assertEqual("DAY", cabine_daf("CF FAS 300 Day Cab"))
        self.assertEqual("SLEEPER", cabine_daf("CF FAS 300 SPLEEP CAB"))

    def test_reconhece_cambio_daf(self):
        self.assertEqual("AUTOMATICO", cambio_daf("Day Cab Aut (Die)"))
        self.assertEqual("MECANICO", cambio_daf("Space Cab Mec (Die)"))

    def test_daf_nao_mistura_familias_cf_e_xf(self):
        score, motivo = avalia("DAF CF 410 2020/2020", "XF 105 FTS 410 6x2 (diesel)(E5)")
        self.assertEqual(0.0, score)
        self.assertEqual("familia CF!=XF", motivo)

    def test_daf_cf85_explicito_nao_casa_com_cf_atual(self):
        score, motivo = avalia("DAF CF85 360 2017/2017", "CF FT 360 4x2 (diesel)(E5)")
        self.assertEqual(0.0, score)
        self.assertIn("geracao", motivo)

    def test_daf_cf_sem_cabine_fica_ambiguo(self):
        anuncio = {
            "titulo": "DAF CF 300 2022/2022", "url": "https://portal/truck-6x2/1",
            "marca": "DAF", "tracao": "6X2", "ano_inicial": 2022, "ano_final": 2022,
        }
        day = {"id": 1, "modelo_fipe": "CF FAS 300 6x2 Day Cab Aut (Die)(E5)"}
        space = {"id": 2, "modelo_fipe": "CF FAS 300 6x2 Space Cab Aut (Die)(E5)"}
        sleeper = {"id": 3, "modelo_fipe": "CF FAS 300 6x2 Sleep. Cab Aut (Die)(E5)"}
        with patch("fipe_sync.melhores_candidatos", return_value=[
            (0.90, "potencia", day), (0.90, "potencia", space), (0.90, "potencia", sleeper),
        ]):
            candidatos, motivo = escolhe(None, anuncio)
        self.assertIsNone(candidatos)
        self.assertEqual("ambiguo cabine (DAY/SLEEPER/SPACE)", motivo)

    def test_fipe_usa_ano_modelo(self):
        self.assertEqual(2023, ano_modelo({"ano_inicial": 2022, "ano_final": 2023}))
        self.assertEqual(2022, ano_modelo({"ano_inicial": 2022, "ano_final": None}))

    def test_norma_emissoes_explicita_supera_ano(self):
        anuncio = {"titulo": "DAF XF 530 EURO 6", "url": "", "ano_inicial": 2022}
        self.assertEqual(("E6", "explicita"), emissao_preferida(anuncio))
        self.assertEqual("E5", emissao_no_texto("XF 530 6x2 (diesel)(E5)"))

    def test_fabricacao_2022_modelo_2023_preserva_transicao(self):
        anuncio = {
            "titulo": "DAF XF 530 2022/2023", "url": "", "marca": "DAF",
            "ano_inicial": 2022, "ano_final": 2023,
        }
        e5 = {"id": 1, "modelo_fipe": "XF 530 6x2 (diesel)(E5)"}
        e6 = {"id": 2, "modelo_fipe": "XF 530 6x2 (diesel)(E6)"}
        with patch("fipe_sync.melhores_candidatos", return_value=[
            (0.95, "numero+serie", e6), (0.95, "numero+serie", e5),
        ]):
            candidatos, motivo = escolhe(None, anuncio)
        self.assertIsNone(candidatos)
        self.assertEqual("ambiguo emissao (E5/E6)", motivo)

    def test_daf_sem_cabine_nao_escolhe_space_ao_acaso(self):
        anuncio = {
            "titulo": "DAF XF FTT 530 2021/2021",
            "url": "https://portal/daf-xf-ftt-530/2021/cavalo-6x4/1",
            "marca": "DAF", "ano_inicial": 2021, "ano_final": 2021,
        }
        space = {"id": 1, "modelo_fipe": "XF FTT530 6x4 Space Cab (diesel)(E5)"}
        super_space = {"id": 2, "modelo_fipe": "XF FTT530 6x4 Super Space Cab (die)(E5)"}
        with patch("fipe_sync.melhores_candidatos", return_value=[
            (0.99, "potencia+configuracao", space),
            (0.99, "potencia+configuracao", super_space),
        ]):
            candidatos, motivo = escolhe(None, anuncio)
        self.assertIsNone(candidatos)
        self.assertEqual("ambiguo cabine (SPACE/SUPER SPACE)", motivo)

    def test_daf_sem_configuracao_prioriza_ambiguidade_de_eixo(self):
        anuncio = {
            "titulo": "DAF XF 480 2021/2022", "url": "https://portal/daf-xf-480/2022/1",
            "marca": "DAF", "ano_inicial": 2021, "ano_final": 2022,
        }
        ft = {"id": 1, "modelo_fipe": "XF FT480 4x2 Space Cab (diesel)(E5)"}
        fts = {"id": 2, "modelo_fipe": "XF FTS480 6x2 Space Cab (diesel)(E5)"}
        ftt = {"id": 3, "modelo_fipe": "XF FTT480 6x4 Space Cab (diesel)(E5)"}
        with patch("fipe_sync.melhores_candidatos", return_value=[
            (0.90, "potencia", ft), (0.90, "potencia", fts), (0.90, "potencia", ftt),
        ]):
            candidatos, motivo = escolhe(None, anuncio)
        self.assertIsNone(candidatos)
        self.assertEqual("ambiguo eixo (4X2/6X2/6X4)", motivo)

    def test_daf_cabine_explicita_define_versao(self):
        anuncio = {
            "titulo": "DAF XF FTT 530 SUPER SPACE 2021/2021",
            "url": "https://portal/daf-xf-ftt-530/2021/cavalo-6x4/1",
            "marca": "DAF", "ano_inicial": 2021, "ano_final": 2021,
        }
        space = {"id": 1, "modelo_fipe": "XF FTT530 6x4 Space Cab (diesel)(E5)"}
        super_space = {"id": 2, "modelo_fipe": "XF FTT530 6x4 Super Space Cab (die)(E5)"}
        with patch("fipe_sync.melhores_candidatos", return_value=[
            (0.99, "potencia+configuracao", space),
            (0.99, "potencia+configuracao", super_space),
        ]):
            candidatos, _ = escolhe(None, anuncio)
        self.assertEqual([super_space], candidatos)

    def test_backfill_daf_extrai_url_e_corrige_anos_pelo_titulo(self):
        dados = dados_derivados({
            "titulo": "DAF XF FTT 530 2022/2023",
            "url": "https://portal/veiculo/cidade/uf/caminhao/daf/daf-xf-ftt-530/2023/cavalo-6x4/1",
            "marca": "DAF", "modelo": None, "tracao": None,
            "ano_inicial": 2021, "ano_final": 2022,
        })
        self.assertEqual("XF FTT 530", dados["modelo"])
        self.assertEqual("6X4", dados["tracao"])
        self.assertEqual((2022, 2023), (dados["ano_inicial"], dados["ano_final"]))

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

    def test_modo_local_nao_escolhe_primeiro_quando_dois_precos_sao_validos(self):
        anuncio = {
            "id": 1, "titulo": "DAF XF FTT 530 2021/2021", "marca": "DAF",
            "ano_inicial": 2021, "ano_final": 2021,
        }
        space = {"id": 10, "marca_fipe": "DAF", "modelo_fipe": "XF FTT530 Space Cab"}
        super_space = {"id": 11, "marca_fipe": "DAF", "modelo_fipe": "XF FTT530 Super Space Cab"}
        conn = object()
        with patch("fipe_sync.anuncios_pendentes", return_value=[anuncio]), \
             patch("fipe_sync.escolhe", return_value=([space, super_space], "alto")), \
             patch("fipe_sync.busca_preco_cache", side_effect=[101, 102]), \
             patch("fipe_sync.registra_resultado") as registra:
            resumo = processa_anuncios(conn, lote=1, permitir_api=False)
        registra.assert_called_once_with(
            conn, 1, "ambiguo", "ambiguo 2 candidatos FIPE no ano-modelo 2021",
        )
        self.assertEqual(1, resumo["ambiguos"])
        self.assertEqual(0, resumo["vinculados"])


if __name__ == "__main__":
    unittest.main()

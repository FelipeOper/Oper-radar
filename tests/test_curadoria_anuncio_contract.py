from pathlib import Path
import importlib.util
import sys
import unittest


ROOT = Path(__file__).resolve().parents[1]


class CuradoriaAnuncioContractTest(unittest.TestCase):
    def test_api_exige_papel_csrf_e_grava_auditoria(self):
        source = (ROOT / "oper-radar-api" / "anuncio_detalhe.php").read_text(encoding="utf-8")
        self.assertIn("['admin', 'gestor']", source)
        self.assertIn("exige_csrf()", source)
        self.assertIn("anuncio_curadoria_log", source)
        self.assertIn("restaurar_fipe_automatico", source)

    def test_vinculo_manual_preserva_resultado_automatico(self):
        api = (ROOT / "oper-radar-api" / "anuncio_detalhe.php").read_text(encoding="utf-8")
        sync = (ROOT / "fase2-fipe" / "fipe_sync.py").read_text(encoding="utf-8")
        self.assertIn("fipe_preco_automatico_id", api)
        self.assertIn("fipe_match_status_automatico", api)
        self.assertIn("fipe_vinculo_origem='automatico'", api)
        self.assertIn("COALESCE(fipe_vinculo_origem, 'automatico') <> 'manual'", sync)

    def test_frontend_tem_painel_comparacao_fipe_e_km(self):
        app = (ROOT / "app" / "src" / "App.jsx").read_text(encoding="utf-8")
        for fragment in [
            "function PainelAnuncio", "Comparação de produto", "Curadoria interna",
            "Quilometragem confirmada", "Restaurar automático", "Clique para comparar",
        ]:
            self.assertIn(fragment, app)

    def test_migracao_e_idempotente(self):
        migrador = (ROOT / "fase4-acesso" / "migrar_curadoria_anuncio.php").read_text(encoding="utf-8")
        self.assertIn("coluna_anuncio_existe", migrador)
        self.assertIn("CREATE TABLE IF NOT EXISTS anuncio_curadoria_log", migrador)
        self.assertIn("Curadoria de anuncios: banco preparado", migrador)

    def test_parser_captura_km_e_horas_quando_explicitos(self):
        pasta = ROOT / "fase1-coleta"
        sys.path.insert(0, str(pasta))
        try:
            spec = importlib.util.spec_from_file_location("parser_oper_radar", pasta / "parser.py")
            modulo = importlib.util.module_from_spec(spec)
            sys.modules[spec.name] = modulo
            spec.loader.exec_module(modulo)
            base = '''<div class="list-product list-view-item">
                <a href="/veiculo/curitiba/pr/caminhao/daf/daf-xf-530/2023/cavalo/loja/123"></a>
                <h2 class="h16">DAF XF 530 2023/2023</h2>
                <span class="money">R$ 500.000,00</span>
                {uso}</div>'''
            km = modulo.parse_listings(base.format(uso="Quilometragem: 123.456 km"))[0]
            horas = modulo.parse_listings(base.replace("/123", "/124").format(uso="Horímetro: 2.340 horas"))[0]
            self.assertEqual(km.km_ou_horas, "123456 km")
            self.assertEqual(horas.km_ou_horas, "2340 horas")
        finally:
            sys.path.pop(0)

    def test_parser_separa_fabricacao_e_modelo_com_ano_abreviado(self):
        pasta = ROOT / "fase1-coleta"
        sys.path.insert(0, str(pasta))
        try:
            spec = importlib.util.spec_from_file_location("parser_anos_oper_radar", pasta / "parser.py")
            modulo = importlib.util.module_from_spec(spec)
            sys.modules[spec.name] = modulo
            spec.loader.exec_module(modulo)
            html = '''<div class="list-product list-view-item">
                <a href="/veiculo/curitiba/pr/caminhao/daf/daf-xf-530/2022/cavalo/loja/999"></a>
                <h2 class="h16">DAF XF 530 2021/22 (2022)</h2>
                <span class="money">R$ 500.000,00</span></div>'''
            anuncio = modulo.parse_listings(html)[0]
            self.assertEqual(2021, anuncio.ano_inicial)
            self.assertEqual(2022, anuncio.ano_final)
        finally:
            sys.path.pop(0)

    def test_php_tambem_separa_fabricacao_e_modelo(self):
        source = (ROOT / "fase1-coleta-php" / "parser.php").read_text(encoding="utf-8")
        self.assertIn("function extrai_anos", source)
        self.assertIn("strlen($m[2]) === 2", source)

    def test_reauditoria_preserva_manual_e_vinculo_ate_processar(self):
        source = (ROOT / "fase2-fipe" / "reabrir_fipe_fabricacao_modelo.py").read_text(encoding="utf-8")
        sync = (ROOT / "fase2-fipe" / "fipe_sync.py").read_text(encoding="utf-8")
        self.assertIn("<> 'manual'", source)
        self.assertIn("reprocessar_ano_modelo", source)
        self.assertNotIn("fipe_preco_id = NULL", source)
        self.assertIn("fipe_match_status = 'reprocessar_ano_modelo'", sync)


if __name__ == "__main__":
    unittest.main()

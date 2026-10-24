import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import _sem_banco  # noqa: F401
from cabine import ROTULOS_ALTOS, cabine_compativel, cabine_marca

FIXTURE = json.loads((Path(__file__).resolve().parent / "fixtures" / "fipe_nomes_cabine.json").read_text(encoding="utf-8"))


class NomesReaisDaFipeTest(unittest.TestCase):
    """Cada nome do catalogo real da FIPE tem que cair no rotulo de cabine do seu grupo."""

    def test_todo_nome_real_cai_no_rotulo_do_seu_grupo(self):
        for marca, grupos in FIXTURE.items():
            if marca == "fonte":
                continue
            for rotulo, nomes in grupos.items():
                esperado = None if rotulo == "NENHUM" else rotulo
                for nome in nomes:
                    with self.subTest(marca=marca, nome=nome):
                        self.assertEqual(esperado, cabine_marca(nome, marca))

    def test_a_fixture_cobre_todas_as_marcas_com_cabine_no_nome(self):
        self.assertEqual({"VOLVO", "SCANIA", "MERCEDES-BENZ", "IVECO", "DAF", "VOLKSWAGEN"}, set(FIXTURE) - {"fonte"})


class TitulosDeAnuncioTest(unittest.TestCase):
    def test_volvo(self):
        self.assertEqual("GLOBETROTTER XL", cabine_marca("Volvo FH 540 6x4 Globetrotter XL 2024/2024", "VOLVO"))
        self.assertEqual("GLOBETROTTER XL", cabine_marca("VOLVO FH 460 XL 4x2", "VOLVO"))
        self.assertEqual("GLOBETROTTER", cabine_marca("Volvo FH 540 6x4 Globetrotter 2021", "VOLVO"))
        self.assertEqual("GLOBETROTTER", cabine_marca("VOLVO FH 460 GLOBE 6X2", "VOLVO"))
        self.assertIsNone(cabine_marca("Volvo FH 540 6x4 2022/2022", "VOLVO"))

    def test_xl_solto_fora_de_volvo_fh_nao_vira_cabine(self):
        self.assertIsNone(cabine_marca("Volvo VM 270 XL carroceria", "VOLVO"))
        self.assertIsNone(cabine_marca("Scania R 450 XL", "SCANIA"))

    def test_scania(self):
        self.assertEqual("HIGHLINE", cabine_marca("Scania R450 A 6x2 Highline 2015", "SCANIA"))
        self.assertEqual("HIGHLINE", cabine_marca("SCANIA R 440 HIGH LINE 4x2", "SCANIA"))
        self.assertEqual("TOPLINE", cabine_marca("Scania R 124 360 Topline 4x2", "SCANIA"))
        self.assertEqual("TOPLINE", cabine_marca("Scania R 440 Top Line", "SCANIA"))

    def test_streamline_sozinho_nao_diz_a_cabine(self):
        self.assertIsNone(cabine_marca("Scania R450 Streamline 6x2 2018", "SCANIA"))
        self.assertEqual("HIGHLINE", cabine_marca("Scania R450 Streamline Highline 6x2", "SCANIA"))

    def test_mercedes_so_olha_ls_e_s_de_actros_e_axor(self):
        self.assertEqual("LS", cabine_marca("MERCEDES-BENZ ACTROS 2651 LS 6x4 2020", "MERCEDES BENZ"))
        self.assertEqual("LS", cabine_marca("Mercedes Actros 2651 6x4 LS", "MERCEDES-BENZ"))
        self.assertEqual("S", cabine_marca("Mercedes-Benz Actros 2651 S 6x4", "MERCEDES-BENZ"))
        self.assertEqual("S", cabine_marca("MB AXOR 2644 S 6X4", "MERCEDES-BENZ"))
        self.assertIsNone(cabine_marca("Mercedes-Benz Actros 2651 6x4 2020", "MERCEDES-BENZ"))
        self.assertIsNone(cabine_marca("Mercedes-Benz Atego 1726 S", "MERCEDES-BENZ"))
        self.assertIsNone(cabine_marca("Mercedes-Benz Accelo 815 S", "MERCEDES-BENZ"))

    def test_iveco(self):
        self.assertEqual("MEGA CAB", cabine_marca("Iveco S-Way 480 Mega Cab 6x2", "IVECO"))
        self.assertEqual("GRAND CAB", cabine_marca("IVECO S WAY 480 GRAND CAB", "IVECO"))
        self.assertIsNone(cabine_marca("Iveco Hi-Way 440 4x2", "IVECO"))

    def test_daf_mantem_os_rotulos_de_sempre(self):
        self.assertEqual("SUPER SPACE", cabine_marca("DAF XF 530 6x4 Super Space Cab", "DAF"))
        self.assertEqual("SPACE", cabine_marca("DAF XF 530 6x4 Space Cab", "DAF"))
        self.assertEqual("DAY", cabine_marca("DAF CF 300 Day Cab", "DAF"))
        self.assertEqual("SLEEPER", cabine_marca("DAF CF 410 Sleeper Cab", "DAF"))

    def test_teto_alto_em_xf_da_daf_e_super_space(self):
        self.assertEqual("SUPER SPACE", cabine_marca("DAF XF 530 6x4 teto alto 2022", "DAF"))
        self.assertEqual("ALTO", cabine_marca("Scania R450 teto alto", "SCANIA"))
        self.assertEqual("ALTO", cabine_marca("Volvo FH 540 teto alto", "VOLVO"))

    def test_marca_sem_rotulo_conhecido_nao_inventa(self):
        self.assertIsNone(cabine_marca("VW Constellation 25.420 Highline", "VOLKSWAGEN"))
        self.assertIsNone(cabine_marca("Ford Cargo 2429 teto alto", "FORD"))
        self.assertIsNone(cabine_marca("", "VOLVO"))
        self.assertIsNone(cabine_marca(None, None))

    def test_o_rotulo_mais_especifico_vence(self):
        self.assertEqual("GLOBETROTTER XL", cabine_marca("FH 540 GLOBETROTTER XL", "VOLVO"))
        self.assertEqual("SUPER SPACE", cabine_marca("XF 530 SUPER SPACE", "DAF"))


class CompatibilidadeTest(unittest.TestCase):
    def test_rotulos_iguais_sao_compativeis(self):
        self.assertTrue(cabine_compativel("GLOBETROTTER XL", "GLOBETROTTER XL"))
        self.assertFalse(cabine_compativel("GLOBETROTTER XL", "GLOBETROTTER"))
        self.assertFalse(cabine_compativel("HIGHLINE", None))

    def test_registro_fipe_que_junta_variantes_serve_para_as_duas(self):
        self.assertTrue(cabine_compativel("S", "S/LS"))
        self.assertTrue(cabine_compativel("LS", "S/LS"))
        self.assertFalse(cabine_compativel("S", "LS"))

    def test_teto_alto_so_serve_para_variante_alta_conhecida(self):
        self.assertTrue(cabine_compativel("ALTO", "HIGHLINE"))
        self.assertTrue(cabine_compativel("ALTO", "SUPER SPACE"))
        self.assertFalse(cabine_compativel("ALTO", None))
        self.assertFalse(cabine_compativel("ALTO", "S"))
        self.assertFalse(cabine_compativel("ALTO", "LS"))
        self.assertNotIn("LS", ROTULOS_ALTOS)


if __name__ == "__main__":
    unittest.main()

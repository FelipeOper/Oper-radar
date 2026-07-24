import json
import re
import unittest
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))

from parser_detalhe import (
    parse_detalhe,
    parece_bloqueio_ou_pagina_invalida,
    contem_marcador_de_bloqueio,
    pagina_sem_campos_esperados,
)

DIRETORIO = Path(__file__).resolve().parent
HTML_REAL = (DIRETORIO / "sample_detalhe_real.html").read_text(encoding="utf-8")


class ParserDetalheTest(unittest.TestCase):
    def test_extrai_ficha_tecnica_completa(self):
        campos = parse_detalhe(HTML_REAL)
        self.assertEqual("VOLVO FH 540", campos["modelo"])
        self.assertEqual("BRANCO", campos["cor"])
        self.assertEqual("Cavalo Mecânico", campos["carroceria"])
        self.assertEqual("Cavalo 6x4", campos["tracao"])
        self.assertEqual("708782 km", campos["km_ou_horas"])

    def test_extrai_opcionais(self):
        campos = parse_detalhe(HTML_REAL)
        opcionais = json.loads(campos["opcionais_json"])
        self.assertIn("Direção Hidráulica", opcionais)
        self.assertIn("Freios ABS", opcionais)
        self.assertEqual(9, len(opcionais))

    def test_extrai_descricao_preserva_quebras(self):
        campos = parse_detalhe(HTML_REAL)
        self.assertIn("Único dono.", campos["descricao"])
        self.assertIn("\n", campos["descricao"])

    def test_campo_individual_ausente_vira_none_sem_quebrar(self):
        # Renomeia so o rotulo "Cor:" (preservando indentacao real do arquivo, sem depender
        # de reproduzir o whitespace exato) para simular um anuncio sem esse campo.
        html_sem_cor, trocas = re.subn(r"(?<=\n)(\s*)Cor:", r"\1XCor:", HTML_REAL)
        self.assertEqual(1, trocas, "fixture mudou — rotulo 'Cor:' nao encontrado como esperado")
        campos = parse_detalhe(html_sem_cor)
        self.assertIsNone(campos["cor"])
        # os demais campos continuam extraidos normalmente
        self.assertEqual("VOLVO FH 540", campos["modelo"])
        self.assertEqual("708782 km", campos["km_ou_horas"])

    def test_pagina_de_bloqueio_e_detectada_por_palavra_chave(self):
        self.assertTrue(parece_bloqueio_ou_pagina_invalida(
            "<html><body>Cloudflare - Attention Required</body></html>", 0))

    def test_pagina_pequena_sem_specs_e_suspeita(self):
        self.assertTrue(parece_bloqueio_ou_pagina_invalida("<html>pagina curta</html>", 0))

    def test_pagina_valida_grande_sem_specs_nao_e_falso_positivo(self):
        pagina_grande_sem_specs = "<html>" + ("x" * 9000) + "</html>"
        self.assertFalse(parece_bloqueio_ou_pagina_invalida(pagina_grande_sem_specs, 0))

    def test_pagina_real_nao_e_falso_positivo_do_breaker(self):
        campos = parse_detalhe(HTML_REAL)
        self.assertFalse(parece_bloqueio_ou_pagina_invalida(HTML_REAL, campos["campos_encontrados"]))

    def test_marcador_de_bloqueio_isolado(self):
        self.assertTrue(contem_marcador_de_bloqueio("<html>Cloudflare - Attention Required</html>"))
        self.assertFalse(contem_marcador_de_bloqueio("<html>pagina normal sem marcador</html>"))

    def test_pagina_sem_campos_esperados_isolada(self):
        self.assertTrue(pagina_sem_campos_esperados("<html>curta e vazia</html>", 0))
        self.assertFalse(pagina_sem_campos_esperados("<html>" + ("x" * 9000) + "</html>", 0))
        campos = parse_detalhe(HTML_REAL)
        self.assertFalse(pagina_sem_campos_esperados(HTML_REAL, campos["campos_encontrados"]))


if __name__ == "__main__":
    unittest.main()

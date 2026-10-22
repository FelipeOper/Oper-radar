"""Importe antes de fipe_sync em testes puros: dispensa requests e mysql instalados."""
import sys
import types

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

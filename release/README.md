# Pacotes locais — 19/08/2026

Estes arquivos foram gerados para revisão. Nenhum deles foi enviado ao servidor.

| Pacote | SHA-256 | Destino futuro |
|---|---|---|
| `oper-radar-frontend-evolucao-20260819.zip` | `8F71292EE986110D074B2C4A9286AF9C5036C5316F05420930248BDAD60FE3A3` | conteúdo em `/home1/pro93061/agenciaoper.com.br/oper-radar/` |
| `oper-radar-api-evolucao-20260819.zip` | `EE5EDB83DC01C94854B666A1D9B5C90B9AD6BA3BB5ABBE49ECF8181915A54676` | extrair a partir de `/home1/pro93061/agenciaoper.com.br/` |
| `oper-radar-eventos-fundacao-20260819.zip` | `A86E9C9844E992A06B8FA05DF5AC8BFFE3676E8DDC2A037511DAF9D35D5F0040` | extrair em diretório temporário e copiar separadamente `fase3-series/` e `oper-radar-api/eventos.php` |

O pacote de eventos não deve ser ativado diretamente. Primeiro é necessário executar a
simulação, fazer backup do banco, aplicar a migração e validar um dia manualmente. O executor
está incluído, mas nenhum cron novo foi instalado.

# Pacotes locais — 19/08/2026

Estes arquivos foram gerados para revisão. Nenhum deles foi enviado ao servidor.

| Pacote | SHA-256 | Destino futuro |
|---|---|---|
| `oper-radar-frontend-evolucao-20260819.zip` | `10A3C24D80BBE07632F36BC6D89630E0F22D1BCC5FA423DE1907994A48352A81` | conteúdo em `/home1/pro93061/agenciaoper.com.br/oper-radar/` |
| `oper-radar-api-evolucao-20260819.zip` | `ED7F0168AC1E4AD8386371D1B8E18BB12DF12B9D1F6E9511592B5202ADEF49B6` | extrair a partir de `/home1/pro93061/agenciaoper.com.br/` |
| `oper-radar-eventos-fundacao-20260819.zip` | `A86E9C9844E992A06B8FA05DF5AC8BFFE3676E8DDC2A037511DAF9D35D5F0040` | extrair em diretório temporário e copiar separadamente `fase3-series/` e `oper-radar-api/eventos.php` |

O pacote de eventos não deve ser ativado diretamente. Primeiro é necessário executar a
simulação, fazer backup do banco, aplicar a migração e validar um dia manualmente. O executor
está incluído, mas nenhum cron novo foi instalado.

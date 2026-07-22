# Curadoria de anúncio: FIPE, KM e comparação

Esta entrega adiciona uma leitura aprofundada aos cards do Mercado sem alterar o dado bruto coletado.

## Decisões de produto

- O título, preço, revenda, localização e URL continuam sendo a fotografia do portal de origem.
- Admin e Gestor podem corrigir a FIPE, confirmar uma quilometragem e registrar uma observação interna.
- O vínculo automático anterior é preservado. A ação **Restaurar automático** desfaz a correção manual.
- Cada mudança registra usuário, data, FIPE anterior/nova, KM anterior/novo e observação.
- Analista e Visualizador enxergam o painel e os comparativos, mas não editam.
- KM só é coletado automaticamente quando estiver explicitamente visível no HTML já baixado. A coleta não abre milhares de páginas adicionais.
- Fabricação e modelo são preservados como campos diferentes. `2021/22 (2022)` vira fabricação 2021 e modelo 2022.
- A consulta de preço FIPE usa o ano-modelo. O ano de fabricação nunca substitui o ano-modelo quando este está disponível.
- Euro 5/Euro 6 explícito no anúncio tem prioridade. Sem informação explícita, fabricação 2012–2022 apenas prefere E5 e fabricação 2023+ apenas prefere E6; a estimativa não força um vínculo incompatível.
- Casos não seguros recebem até oito sugestões locais, ranqueadas por marca, número do modelo, família comercial, ano-modelo, série, eixo e emissão.
- Sugestão não é vínculo: ela não altera FIPE, comparativos ou KPIs até Admin/Gestor confirmar no painel.
- O Mercado possui uma fila `FIPE · com sugestão` e separa `dados insuficientes`, evitando forçar uma referência errada apenas para zerar a fila.
- Números técnicos que parecem anos (`MB 1938`, por exemplo) são preservados; somente expressões posicionadas como ano de fabricação/modelo são removidas do texto antes do matching.

## Publicação segura

1. Faça backup do banco, da API e do frontend.
2. Atualize o repositório com `git pull --ff-only origin main`.
3. Carregue as variáveis de ambiente e execute:

```bash
php fase4-acesso/migrar_curadoria_anuncio.php
```

4. Publique na pasta da API:

- `oper-radar-api/anuncio_detalhe.php`
- `oper-radar-api/anuncios.php`

5. O coletor e o motor FIPE passam a depender das novas colunas. Depois da migração, o `git pull` já deixa os arquivos de cron atualizados.
6. Publique o bundle gerado pelo frontend.
7. Gere a primeira fila de sugestões usando somente o catálogo local (zero chamadas à API FIPE):

```bash
set -a; . /home1/pro93061/.oper-radar.env; set +a
cd fase2-fipe
python3 fipe_sync.py --modo=sugestoes --lote=10000
```

As próximas execuções locais do cron atualizam essa fila automaticamente.

### Reauditoria única de fabricação, modelo e emissões

Depois do backup e da publicação, carregue o ambiente e confira primeiro a simulação:

```bash
set -a; . /home1/pro93061/.oper-radar.env; set +a
python3 fase2-fipe/reabrir_fipe_fabricacao_modelo.py
```

Se a contagem estiver correta, marque a fila e execute o cruzamento local, sem consumir a API:

```bash
python3 fase2-fipe/reabrir_fipe_fabricacao_modelo.py --aplicar
cd fase2-fipe
for rodada in 1 2 3 4 5; do bash executar_fipe_job.sh local; done
```

Cada rodada processa até 1.000 registros; a última normalmente encontrará a fila vazia. O vínculo anterior permanece disponível até o registro ser reprocessado. Correções manuais nunca entram nessa fila.

## Validação

- Abra Mercado e clique em um card.
- Confirme que o painel mostra anúncio, FIPE, média de mercado e ofertas comparáveis.
- Como Admin/Gestor, pesquise uma FIPE, salve e confira o selo `CURADORIA MANUAL`.
- Em Mercado, selecione `FIPE · com sugestão`, abra um card e confirme que aparecem os candidatos e suas evidências.
- Confirme uma sugestão e verifique que ela desaparece da fila, passa a alimentar os comparativos e fica registrada no histórico.
- Use `Restaurar automático` e confira o histórico.
- Digite KM manual, salve e confirme o indicador `validado` no card.

# Curadoria de anúncio: FIPE, KM e comparação

Esta entrega adiciona uma leitura aprofundada aos cards do Mercado sem alterar o dado bruto coletado.

## Decisões de produto

- O título, preço, revenda, localização e URL continuam sendo a fotografia do portal de origem.
- Admin e Gestor podem corrigir a FIPE, confirmar uma quilometragem e registrar uma observação interna.
- O vínculo automático anterior é preservado. A ação **Restaurar automático** desfaz a correção manual.
- Cada mudança registra usuário, data, FIPE anterior/nova, KM anterior/novo e observação.
- Analista e Visualizador enxergam o painel e os comparativos, mas não editam.
- KM só é coletado automaticamente quando estiver explicitamente visível no HTML já baixado. A coleta não abre milhares de páginas adicionais.

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

## Validação

- Abra Mercado e clique em um card.
- Confirme que o painel mostra anúncio, FIPE, média de mercado e ofertas comparáveis.
- Como Admin/Gestor, pesquise uma FIPE, salve e confira o selo `CURADORIA MANUAL`.
- Use `Restaurar automático` e confira o histórico.
- Digite KM manual, salve e confirme o indicador `validado` no card.

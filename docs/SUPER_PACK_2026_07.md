# OPER RADAR — Super Pack de produto e UX

## Objetivo

Transformar o piloto em uma interface nacional simples e confiável, com a mesma qualidade de navegação no celular e no desktop. A organização geográfica passa a ser sempre **Região → Estado → Cidade**.

## Melhorias entregues

- Mercado, Oportunidades e Concorrentes filtram por região e estado.
- Cidade e revenda só aparecem depois da escolha do estado, evitando listas nacionais enormes e nomes ambíguos.
- Contagens de segmentos, estados, cidades e revendas acompanham o recorte geográfico.
- Revendas são filtradas pelo identificador do banco, não apenas pelo nome.
- KPIs de entradas e saídas em 48 horas usam o banco completo, não uma amostra do front-end.
- O painel Hoje se adapta a telas estreitas sem colunas fixas.
- O menu mobile tem quatro destinos principais e uma folha “Mais” para Análise, Ações e Ajustes.
- Ações ficam salvas localmente no navegador. Não foi criado um endpoint público de escrita sem autenticação.
- Ajustes agora mostra saúde real do radar, progresso FIPE e cobertura coletada; controles de permissão sem efeito foram removidos.
- Insights toleram falhas parciais e explicam a diferença entre saída detectada e venda comprovada.
- O Analista IA informa quando está desativado e recomenda autenticação antes da ativação.
- Recharts foi removido: o JavaScript inicial caiu de aproximadamente 586 kB para cerca de 214 kB somando os arquivos minificados, com divisão de React e ícones em cache independente.
- Controles têm alvos de toque, foco visível, suporte a área segura do celular e movimento reduzido.

## Decisões de integridade

- “Saída” continua significando ausência confirmada após duas coletas; não é apresentada como venda.
- FIPE sem vínculo aparece como “FIPE ainda não vinculada”, sem sugerir que a fase ainda não existe.
- Estados sem dados permanecem visíveis, esmaecidos e desabilitados. Eles são ativados automaticamente quando a coleta chega.
- `config.php` e credenciais nunca fazem parte do pacote de publicação.

## Arquivos de API a publicar

- `analista.php`
- `analista_status.php`
- `anuncios.php`
- `facetas.php`
- `insights.php`
- `kpis.php`

## Validação

- Build de produção Vite.
- Testes do orquestrador regional.
- Parser PHP em todos os endpoints alterados.
- Verificação de whitespace do Git.
- Backup Git completo anterior ao trabalho em branch e bundle verificável.


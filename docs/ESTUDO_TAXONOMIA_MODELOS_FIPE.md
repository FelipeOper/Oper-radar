# Estudo — taxonomia canônica de caminhões e vínculo FIPE

## Decisão

Não agrupar modelos pelas primeiras palavras do título e não vincular FIPE somente por
marca + número + ano. Antes, decompor cada anúncio em dimensões independentes e auditáveis.

O primeiro piloto será DAF XF. A estrutura deve ser reutilizável por outras marcas, mas as
regras de equivalência são específicas por fabricante e não podem ser generalizadas sem fonte.

## O que a nomenclatura DAF representa

Para a linha XF, os códigos de configuração não são parte da potência:

| Código DAF | Configuração equivalente |
|---|---|
| `FT` | cavalo mecânico 4x2 |
| `FTS` | cavalo mecânico 6x2 |
| `FTT` | cavalo mecânico 6x4 |

Assim, estas duas descrições representam a mesma configuração física:

- `DAF XF FTT 530`
- `DAF XF 530 6x4`

E um anúncio pode trazer os dois sinais, como `DAF XF FTT 530 6x4`. Eles são redundantes,
mas aumentam a confiança quando concordam. Se `FTT` aparecer com `6x2`, há conflito e o
anúncio não pode receber FIPE automaticamente.

Fontes oficiais:

- [DAF XF — brochura e configurações](https://www.dafcaminhoes.com.br/-/media/files/countries/br/brochures/novo-daf-xf/brochura-novo-xf-digital.pdf): FT 4x2, FTS 6x2 e FTT 6x4; XF 480 e XF 530.
- [DAF XF105 — trem de força](https://www.dafcaminhoes.com.br/pt-br/linha-daf/daf-xf105/trem-de-forca): confirma FTS 6x2 e FTT 6x4 na geração anterior.
- [Lançamento do Novo DAF XF em 2020](https://www.dafcaminhoes.com.br/pt-br/noticias-e-midia/news-articles/br/2020/q3/19-08-2020-novo-xf-produto): potências 480/530 e configurações 4x2, 6x2 e 6x4.

## Ano, modelo e emissões são dimensões diferentes

- `ano_inicial` = fabricação.
- `ano_final` = ano-modelo.
- A consulta do preço FIPE usa o **ano-modelo**.
- A fabricação ajuda a inferir a geração de emissões, mas não prova sozinha E5/E6 no ano de
  transição.

A Resolução CONAMA 490/2018 tornou P8 obrigatório em 2022 para modelos novos e em 2023 para
os demais, além de permitir atendimento antecipado. A DAF lançou oficialmente sua linha 2023
P8/Euro 6 em novembro de 2022. Portanto, `2022/2023` sem menção explícita a E5/E6 é
**ambíguo**, não automaticamente E5.

Fontes oficiais:

- [Resolução CONAMA 490/2018](https://conama.mma.gov.br/?id=767&option=com_sisconama&task=arquivo.download), art. 1º.
- [Lançamento da linha DAF 2023 P8/Euro 6](https://www.dafcaminhoes.com.br/pt-br/noticias-e-midia/news-articles/br/2022/q4/07-11-2022-daf-apresenta-na-fenatran-novos-caminhoes-xf-e-cf--euro-6).

Regra segura inicial para DAF:

1. E5/E6 ou P7/P8 explícito no anúncio vence qualquer inferência.
2. Fabricação até 2021, dentro da linha brasileira aplicável, permite sugerir E5.
3. Fabricação a partir de 2023 permite sugerir E6.
4. Fabricação 2022, especialmente modelo 2023, fica ambígua sem evidência explícita.
5. Inferência e informação explícita precisam ser armazenadas com origens diferentes.

## Dimensões canônicas

Cada anúncio de caminhão deve resultar, quando possível, nestes campos:

| Dimensão | Exemplo | Observação |
|---|---|---|
| marca | `DAF` | normalizada |
| família | `XF` | não confundir com geração `XF105` |
| potência/modelo numérico | `530` | em DAF XF representa potência comercial |
| código de configuração | `FTT` | código do fabricante |
| configuração de eixos | `6x4` | equivalente físico de FTT |
| ano de fabricação | `2022` | primeiro ano do anúncio |
| ano-modelo | `2023` | segundo ano; usado na FIPE |
| emissão | `E5` / `E6` | explícita, inferida ou ambígua |
| cabine | `Space Cab` / `Super Space Cab` | a FIPE separa preços por cabine |
| modificador FIPE | `HR` | preservar sem interpretar até validação técnica |
| geração | `Novo XF` | quando houver evidência suficiente |
| nome canônico | `DAF XF 530 6x4 E5 Super Space Cab` | derivado; nunca é a fonte original |

Devem ser preservados separadamente os valores brutos de `titulo`, `modelo`, `tracao`, URL e
descrição. A classificação canônica não pode apagar a origem.

## Granularidades de agrupamento

Um único rótulo de “modelo” não atende todas as análises:

1. **Família/potência:** `DAF XF 530` — volume amplo de mercado.
2. **Versão operacional:** `DAF XF 530 6x4` — compara aplicação e capacidade equivalentes.
3. **Versão regulatória:** `DAF XF 530 6x4 E5` — separa gerações com FIPE diferente.
4. **Referência FIPE:** modelo FIPE exato + ano-modelo — usada somente para preço.

O painel deve declarar qual granularidade está mostrando. O ranking “Top modelos” deve usar a
versão operacional; análises FIPE devem usar a referência exata.

## Estrutura de banco proposta

### `modelo_canonico`

Catálogo versionado de configurações conhecidas:

- `id`, `marca`, `familia`, `potencia_cv`;
- `codigo_configuracao`, `configuracao_eixos`;
- `emissao`, `geracao`, `nome_canonico`;
- faixa opcional de fabricação/modelo;
- fonte e data da validação;
- unicidade pela combinação técnica, não pelo texto do anúncio.

### `anuncio_classificacao`

Resultado auditável do classificador:

- `anuncio_id`, `modelo_canonico_id` opcional;
- dimensões extraídas mesmo quando a classificação estiver incompleta;
- `status`: `completo`, `parcial`, `ambiguo`, `conflito` ou `nao_mapeado`;
- confiança e evidências usadas (`titulo`, `modelo`, `tracao`, URL, descrição, ano);
- versão do classificador e data de processamento.

### `modelo_canonico_fipe`

Relação explícita entre a configuração canônica e `fipe_modelo`:

- pode considerar faixa de ano-modelo e emissão;
- permite revisão sem reescrever o anúncio;
- nunca cria vínculo quando mais de uma FIPE continua possível.

## Pipeline de classificação

1. Combinar evidências de `titulo`, `modelo`, `tracao`, URL e descrição, sem perder a origem.
2. Extrair família, número/potência, código de configuração, eixos, anos e emissão.
3. Traduzir aliases específicos da marca (`FTS` = 6x2; `FTT` = 6x4).
4. Detectar contradições antes de pontuar candidatos.
5. Resolver um `modelo_canonico` somente quando a combinação for única.
6. Consultar FIPE pelo mapeamento canônico e pelo ano-modelo.
7. Se faltar eixo ou emissão e existirem múltiplas referências, enviar para curadoria; não
   escolher a primeira opção.

## Falhas encontradas no código atual

1. `fipe_sync.py` lê `titulo`, URL, marca e anos, mas ignora `anuncio.modelo` e
   `anuncio.tracao`, embora a coleta de detalhe já grave esses campos.
2. A tração é procurada somente no título durante a escolha FIPE; o exemplo real do repositório
   traz `FTT` no título e `cavalo-6x4` na URL, então a informação existe e não é usada.
3. `serie()` aceita apenas uma ou duas letras; não interpreta `FTS`/`FTT` como configuração.
4. Fabricação 2022 é hoje forçada para E5, apesar de a DAF ter lançado a linha 2023 Euro 6 no
   fim de 2022 e a norma permitir atendimento antecipado.
5. O protótipo de ranking pelas três primeiras palavras descarta potência/eixo ou divide aliases
   equivalentes. Ele não deve ser publicado.
6. O `ON DUPLICATE KEY UPDATE` da coleta atualiza anos e preço, mas não atualiza `titulo`, URL,
   tipo ou marca. Um anúncio editado pode ficar com título antigo e anos novos, criando uma
   combinação impossível para o classificador.

## Amostra de anúncios DAF XF em produção

Uma amostra de 80 anúncios ativos extraída em 18/08/2026 mostrou:

- 80 sem `modelo` da página de detalhe;
- 80 sem `tracao` da página de detalhe;
- 80 sem vínculo FIPE;
- muitos títulos já contêm FT, FTS ou FTT e podem ser classificados parcialmente;
- as URLs de listagem conhecidas também carregam modelo e eixos, como
  `daf-xf-ftt-530/.../cavalo-6x4`, mas o parser atual não persiste esses segmentos;
- títulos sem configuração, como `DAF XF 480`, continuam ambíguos até obter eixo pela URL,
  página de detalhe ou curadoria;
- títulos `XF105 530` conflitam com o catálogo observado: a geração XF105 termina nas potências
  FIPE 510/520, enquanto 530 pertence à geração XF atual;
- títulos `XF 460`/`XF 510` dos anos 2015–2020 provavelmente omitem `105`, mas ainda precisam
  de configuração de eixos para uma referência exata;
- no anúncio interno `144205`, o título armazenado diz `2022/2023` e as colunas de ano dizem
  `2021/2022`, evidência concreta de campos brutos desatualizados de forma desigual.

Consequência operacional: antes da taxonomia, a coleta deve manter os campos brutos sincronizados
e extrair modelo/eixos da URL sem nova requisição. Mudanças de título, URL, modelo, tração ou anos
devem invalidar a classificação automática anterior e colocá-la em reauditoria, preservando
vínculos manuais.

## Matriz observada no catálogo FIPE de produção

Extração somente de leitura realizada em 18/08/2026 confirmou:

- A geração `XF 105` é separada da geração `XF` atual e usa potências 410, 460, 510 e 520,
  dependendo da configuração.
- A geração atual usa 480 e 530 nas configurações FT/4x2, FTS/6x2 e FTT/6x4.
- Para cada configuração atual, a FIPE separa `Space Cab` de `Super Space Cab`.
- As referências E5 e E6 se sobrepõem no ano-modelo 2023. Portanto, ano-modelo 2023 não
  identifica sozinho a emissão.
- A fabricação continua necessária para a regra regulatória, mas fabricação 2022 permanece
  transição ambígua sem E5/E6 explícito.
- Para FTT 530 E6 aparecem ainda versões `HR` a partir do ano-modelo 2024. `HR` deve ser
  preservado como modificador distinto até entendermos sua definição e como identificá-lo no
  anúncio.
- O valor `3200` visto na listagem de anos não é ano civil: resulta de cortar os quatro primeiros
  caracteres do código especial de zero quilômetro da FIPE. Ele deve ser excluído de relatórios
  de anos, sem apagar o preço correspondente do catálogo.

Consequência: uma referência FIPE DAF XF exata exige, no mínimo, geração + potência + eixos +
emissão + cabine + ano-modelo. Se qualquer dimensão que diferencia candidatos estiver ausente,
o resultado deve ser sugestão para curadoria, não vínculo automático.

## Validação necessária antes da migração

Antes de criar tabelas ou reprocessar vínculos:

1. ~~Extrair do banco todos os nomes FIPE DAF XF 480/530, com anos disponíveis.~~ Concluído
   em 18/08/2026.
2. ~~Extrair uma amostra dos anúncios DAF com `titulo`, `modelo`, `tracao`, anos, URL e motivo
   de matching.~~ Concluído em 18/08/2026, inclusive com 12 URLs completas representativas.
3. Aplicar o classificador corrigido em modo somente leitura e medir quantos casos ficam em:
   vínculo único, ambiguidade de emissão, ambiguidade de cabine, conflito ou sem FIPE.
4. Revisar manualmente uma amostra de cada grupo, formando a matriz de verdade inicial.
5. Somente após essa medição executar o backfill com `--aplicar` e reprocessar os vínculos
   automáticos; vínculos manuais permanecem intocados.

Critério de segurança: número incorreto é pior que número ausente. Uma classificação parcial
continua útil para agrupamento, mas não autoriza uma FIPE exata.

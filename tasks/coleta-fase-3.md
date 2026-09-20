# Coleta — Fase 3 do plano de melhoria da checklist

Instrumento de trabalho da **Fase 3** do plano de melhoria do checklist (já
concluído e removido), na mesma forma da
[coleta de vistos](coleta-vistos-br.md): aqui se pesquisa, se registra a fonte e
se marca a confiança. **Este arquivo não é migration.** Nenhuma linha vai para o
banco antes de uma pessoa abrir a página oficial e confirmar.

As regras da coleta de vistos valem inteiras aqui — elas estão em "Regras de
negócio → Regras de visto", no `AGENTS.md`, e na forma longa na
[coleta de vistos](coleta-vistos-br.md). Em especial estas três:

- `verified_at` é a data em que **uma pessoa** leu a fonte. As tabelas abaixo
  saem de uma primeira passada feita em **2026-09-12** por consulta às páginas
  oficiais, então **nenhuma linha tem `verified_at`** ainda.
- Fonte primária é o órgão do país de destino. Blog, agência, comparador e
  Wikipédia não fundamentam nada.
- Na dúvida, não cadastra. O requisito genérico de exigências de entrada já
  cobre o destino sem regra.

Legenda de confiança, igual à da coleta de vistos:

- **Alta** — a página oficial foi aberta e afirma o caso de forma explícita.
- **Média** — a fonte é oficial, mas a afirmação veio de resumo de busca e não
  foi lida na página inteira. Confirmar antes de usar.
- **Pendente** — não foi possível confirmar nesta passada. Não cadastrar.

---

## 1. O achado que muda o desenho da fase

A pesquisa de 7.1 foi feita antes de qualquer migration, e ela **contraria o
schema proposto** na seção 9.2 do plano:

```sql
alter table public.visa_rules
  add column passport_validity_months integer,
  add column passport_validity_basis  text;  -- 'entry' | 'exit'
```

Esse par de colunas parte de uma premissa que a coleta desmente: a de que toda
exigência de validade de passaporte é **um número de meses contado da entrada ou
da saída**. Das exigências efetivamente lidas, quatro não cabem aí:

| Destino         | Exigência real                                                                            | Por que não cabe                                                                                                                                               |
| --------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Espaço Schengen | 3 meses além da saída prevista **e** passaporte emitido nos últimos 10 anos               | São duas regras independentes. A segunda não é um prazo contado de data de viagem nenhuma — é sobre a data de emissão, e barra passaporte com validade futura. |
| Türkiye         | 60 dias além da **duração de estada permitida** — 150 dias no total para uma estada de 90 | A base não é entrada nem saída: é o prazo que a autorização concede. E a unidade é dia, não mês.                                                               |
| Índia           | 6 meses **na data do pedido** do visto eletrônico                                         | A base é o momento da solicitação, que acontece antes da viagem.                                                                                               |
| Israel          | 3 meses além da chegada com ETA-IL; 6 meses se for preciso visto                          | O prazo depende do canal de entrada. Este é o único dos quatro que o schema resolve sozinho, porque a linha de `visa_rules` já carrega `requirement_type`.     |

Some-se a isso um quinto fato que a coleta encontrou em dois destinos — África do
Sul e Índia pedem **páginas em branco** em número declarado —, que não é prazo e
não tem onde morar nas duas colunas propostas.

### 1.1 Recomendação

**Não criar as colunas como estão no plano.** Se a exigência for modelada, a
forma que cobre todos os casos observados é esta:

```sql
alter table public.visa_rules
  add column passport_validity_days  integer,   -- dias, não meses
  add column passport_validity_basis text,      -- 'entry' | 'exit' | 'permitted_stay'
  add column passport_issued_within_years integer,
  add column passport_blank_pages integer;
```

Quatro colunas, todas nulas por padrão, todas sobre a mesma chave (passaporte,
destino) que a tabela já tem — e nenhuma delas afirma nada quando está nula, que
é o estado da esmagadora maioria dos pares.

E vale repetir a conclusão a que a própria seção 9.2 do plano já tinha chegado:
**o número deve aparecer no item de exigências de entrada daquele país**, que já
é por país, e não no item global de passaporte. Fazer um item `global` buscar
dado por país seria a primeira exceção ao desenho do motor, e ela não é
necessária.

### 1.2 O que fazer antes de escrever a migration

Nada disso deve ser construído com a tabela vazia. A ordem sã é: **fechar a
coleta da seção 2 primeiro**, ver quantos destinos realmente têm um número a
declarar, e só então decidir se quatro colunas se pagam. Se a resposta for
"quase todos dizem apenas válido durante a estada", a melhor migration é
nenhuma — e a copy que a Fase 1 já entregou ("o prazo varia conforme o país,
confira nas exigências de entrada") continua sendo a resposta honesta.

---

## 2. 7.1 — Validade de passaporte por destino

Primeira passada, **passaporte comum brasileiro**, viagem de turismo. Nenhuma
linha está pronta para cadastro.

### 2.1 Espaço Schengen — 20 destinos

`AT` `BE` `CH` `CZ` `DE` `DK` `ES` `FI` `FR` `GR` `HR` `HU` `IS` `IT` `NL` `NO`
`PL` `PT` `RO` `SE`

| Campo               | Valor                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------- |
| Exigência           | Válido por pelo menos **3 meses após a data prevista de saída** da UE                 |
| Exigência adicional | Emitido **nos últimos 10 anos** no dia da entrada                                     |
| `source_name`       | União Europeia — Your Europe, documentos de viagem para não cidadãos da UE            |
| `source_url`        | https://europa.eu/youreurope/citizens/travel/entry-exit/non-eu-nationals/index_en.htm |
| Confiança           | **Alta** — a página foi aberta e traz as duas frases textualmente                     |

A redação oficial: _"Your passport should be valid for at least 3 months after
the date you intend to leave the EU"_ e _"Your travel document must have been
issued within the previous 10 years the day you enter the EU on condition that it
is valid until the end of your stay plus an additional 3 months."_

A regra de fundo é o artigo 6 do Código de Fronteiras Schengen (Regulamento (UE)
2016/399). Antes de cadastrar, vale ancorar a linha no regulamento e não só na
página de divulgação.

### 2.2 Demais destinos

| Destino                | Código | Exigência apurada                                                           | Base             | Confiança                  |
| ---------------------- | ------ | --------------------------------------------------------------------------- | ---------------- | -------------------------- |
| Reino Unido            | `GB`   | Válido por toda a estada                                                    | saída            | Média                      |
| Irlanda                | `IE`   | não apurado                                                                 | —                | **Pendente**               |
| Estados Unidos         | `US`   | 6 meses além da estada pretendida, **salvo isenção**                        | entrada          | **Pendente** — ver 2.3     |
| Canadá                 | `CA`   | Válido pela duração da estada                                               | saída            | Média                      |
| México                 | `MX`   | Sem prazo mínimo; válido durante a estada                                   | saída            | Média                      |
| Japão                  | `JP`   | Válido no desembarque; a isenção exige passaporte eletrônico no padrão ICAO | entrada          | Média                      |
| China                  | `CN`   | Válido pela duração da estada (máximo de 30 dias)                           | saída            | Média                      |
| Coreia do Sul          | `KR`   | Sem exigência de prazo remanescente; válido durante a estada                | saída            | Média                      |
| Israel                 | `IL`   | 3 meses além da chegada com ETA-IL; 6 meses quando é preciso visto          | entrada          | Média                      |
| Nova Zelândia          | `NZ`   | 3 meses além da data prevista de saída                                      | saída            | Média                      |
| Austrália              | `AU`   | não apurado                                                                 | —                | **Pendente**               |
| Índia                  | `IN`   | 6 meses na data do pedido do e-Visa, e 2 páginas em branco                  | pedido           | Média                      |
| Indonésia              | `ID`   | 6 meses a partir da chegada                                                 | entrada          | Média                      |
| Vietnã                 | `VN`   | 6 meses                                                                     | entrada          | Média                      |
| Tailândia              | `TH`   | 6 meses                                                                     | entrada          | Média                      |
| Türkiye                | `TR`   | 60 dias além da duração de estada concedida — 150 dias para estada de 90    | estada + 60 dias | **Alta**                   |
| Egito                  | `EG`   | não apurado                                                                 | —                | **Pendente**               |
| Emirados Árabes Unidos | `AE`   | 6 meses a partir da chegada                                                 | entrada          | Média                      |
| Singapura              | `SG`   | 6 meses                                                                     | entrada          | Média                      |
| África do Sul          | `ZA`   | 30 dias além da saída prevista, com páginas em branco                       | saída            | Média                      |
| Argentina              | `AR`   | não apurado                                                                 | —                | **Pendente**               |
| Chile                  | `CL`   | não apurado                                                                 | —                | **Pendente**               |
| Colômbia               | `CO`   | não apurado                                                                 | —                | **Pendente**               |
| Peru                   | `PE`   | não apurado                                                                 | —                | **Pendente**               |
| Uruguai                | `UY`   | não apurado                                                                 | —                | **Pendente**               |
| Marrocos               | `MA`   | não apurado                                                                 | —                | **Pendente** — ver seção 4 |

### 2.3 Estados Unidos — o caso que ficou aberto

A regra geral da CBP é passaporte válido por 6 meses além da estada pretendida.
Existe uma lista de países isentos — o _six-month club_ —, e os nacionais desses
países precisam apenas de passaporte válido pelo período da estada. A página da
CBP confirma a existência e o efeito da isenção, mas **a lista de países está só
no PDF anexo**, e o arquivo não pôde ser lido nesta passada.

Sem abrir a lista, não dá para dizer se o Brasil está nela. Fica **pendente**, e
é uma pendência barata de resolver: é um PDF público, basta alguém abrir.

- Página: https://www.cbp.gov/document/bulletins/six-month-validity-update
- PDF (18/12/2025): `Six-Month Passport Validity Update 20251218`

### 2.4 Fontes por destino

| Código   | `source_name`                                                  | `source_url`                                                                                                                                         |
| -------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Schengen | União Europeia — Your Europe                                   | https://europa.eu/youreurope/citizens/travel/entry-exit/non-eu-nationals/index_en.htm                                                                |
| `GB`     | GOV.UK — Entering the UK                                       | https://www.gov.uk/uk-border-control/before-you-leave-for-the-uk                                                                                     |
| `US`     | U.S. Customs and Border Protection — Six-Month Validity Update | https://www.cbp.gov/document/bulletins/six-month-validity-update                                                                                     |
| `CA`     | IRCC — Valid passports and other travel documents              | https://www.canada.ca/en/immigration-refugees-citizenship/services/passport-travel-document.html                                                     |
| `MX`     | SRE — Documentos para ingressar ao México                      | https://consulmex.sre.gob.mx/montreal/index.php/en/foreigners/visa/355-what-documents-do-i-need-to-enter-mexico                                      |
| `JP`     | MOFA — Visas and Landing Permission                            | https://www.mofa.go.jp/j_info/visit/visa/system/index.html                                                                                           |
| `KR`     | K-ETA — Application Guide                                      | https://www.k-eta.go.kr/portal/guide/viewetaapplication.do?locale=EN                                                                                 |
| `IL`     | Israel PIBA — Israel Entry                                     | https://israel-entry.piba.gov.il/                                                                                                                    |
| `NZ`     | Immigration New Zealand — Before you travel                    | https://www.immigration.govt.nz/visit/what-you-need-to-visit-new-zealand/before-you-travel-to-new-zealand/                                           |
| `IN`     | Government of India — e-Visa                                   | https://indianvisaonline.gov.in/evisa/tvoa.html                                                                                                      |
| `ID`     | Direktorat Jenderal Imigrasi — e-Visa, informações gerais      | https://evisa.imigrasi.go.id/front/faq/85e0d4e0-6093-4a72-8f88-c15e6ab0d2ea                                                                          |
| `VN`     | Vietnam National Electronic Visa system — FAQ                  | https://evisa.gov.vn/faq                                                                                                                             |
| `TH`     | MFA Thailand — General information                             | https://www.mfa.go.th/en/page/general-information                                                                                                    |
| `TR`     | Türkiye MFA — Passport Validity Requirements                   | https://www.mfa.gov.tr/passport-validity-requirements-while-entering-turkey-in-accordance-with-law-on-foreigners-and-international-protection.en.mfa |
| `AE`     | UAE MOFA — serviços consulares                                 | https://www.mofa.gov.ae/en/missions/the-hague/services/visas                                                                                         |
| `SG`     | ICA — Entering Singapore                                       | https://www.ica.gov.sg/enter-transit-depart/entering-singapore                                                                                       |
| `ZA`     | BMA — Visas, informações gerais                                | https://www.bma.gov.za/wp-content/uploads/2025/08/VISAS-1.pdf                                                                                        |

> Duas fontes acima precisam de cuidado antes do uso. A dos Emirados é a página
> de uma missão diplomática, não do órgão de imigração (ICP) — vale procurar a
> equivalente em `icp.gov.ae`. A da África do Sul é PDF, e a seção 6 da coleta de
> vistos desaconselha PDF sem data visível.

### 2.5 Divergência encontrada, e não resolvida

A página de informações gerais do MFA da Tailândia descreve a isenção de visto
como **30 dias**, enquanto a fonte usada no seed de vistos — o PDF de isenção de
60 dias do mesmo ministério — diz **60**. Uma das duas está desatualizada.
Enquanto a divergência existir, ela **bloqueia** qualquer alteração da linha da
Tailândia, exatamente como manda a seção 2 da coleta de vistos. O prazo de
permanência não entra em texto de item.

---

## 3. 7.4 — Vacinas exigidas na entrada

A pesquisa aqui produziu uma conclusão mais útil que uma tabela: **a exigência de
febre amarela não é um fato sobre o destino**, e por isso não cabe em um template
de escopo `country` como o plano supunha.

O que as fontes dizem:

- A febre amarela é a **única** doença para a qual um Estado pode exigir
  comprovante de vacinação como condição de entrada, nos termos dos artigos 35 e
  36 e do Anexo 7 do Regulamento Sanitário Internacional (2005).
- O certificado passou a ter **validade vitalícia** a partir de 11/07/2016, e um
  certificado válido não pode ser recusado por terem se passado mais de dez anos
  da vacinação.
- A exigência é dirigida a quem **vem de** ou **passou por** país com risco de
  transmissão, não a todo viajante. Singapura pede o certificado de quem esteve
  em país de risco nos **seis dias** anteriores à chegada, incluindo trânsito
  aeroportuário acima de 12 horas. A África do Sul pede de quem viaja a partir de
  país de risco.
- **O Brasil está na lista de países com risco de transmissão.** Ou seja, para
  quem parte do Brasil, a exigência dispara com frequência.

### 3.1 Por que isso não vira regra de país

O TripReady modela **para onde** a pessoa vai. Não modela de onde ela parte, por
onde conecta, em que ordem visita os destinos, nem onde esteve nos seis dias
anteriores. Um template `country` + `required` de "certificado de febre amarela"
para Singapura estaria certo para quem embarca no Brasil e errado para quem
embarca de Lisboa depois de duas semanas na Europa — e erraria **afirmando**, que
é o pior modo de errar.

**Recomendação: manter `vaccination-requirements` como está** — `recommended`,
`each_country`, mandando conferir na fonte oficial do destino. É a resposta certa
para um app que não conhece a rota. A conversa só muda se um dia o produto
modelar origem e escalas, e essa é uma decisão de produto, não de dados.

### 3.2 O que sobra de aproveitável

Uma frase a mais na descrição do item, verdadeira para qualquer rota e sem
afirmar exigência: **o comprovante de febre amarela costuma ser pedido de quem
vem de país com risco de transmissão, e o Brasil é um deles**. Ainda assim isso
nomeia um país de origem, e o produto não presume passaporte brasileiro — então,
se entrar, tem de entrar como "o seu país de partida pode estar na lista".

Fica registrado como sugestão, **não aplicado**.

### 3.3 Fontes

| Fonte                                                                            | URL                                                                                                                                                       |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OMS — países com risco de transmissão e países que exigem vacinação (18/11/2022) | https://www.who.int/publications/m/item/countries-with-risk-of-yellow-fever-transmission-and-countries-requiring-yellow-fever-vaccination-(november-2022) |
| OMS — emenda ao Anexo 7 do RSI, validade vitalícia do certificado                | https://www.who.int/docs/default-source/documents/emergencies/travel-advice/extension-to-life-on-yellow-fever-vaccination-en.pdf                          |
| ICA Singapura — Yellow Fever Vaccination Certificate                             | https://www.ica.gov.sg/enter-transit-depart/entering-singapore/yellow-fever-vaccination-certificate                                                       |

---

## 4. 7.8 — Marrocos

> **Resolvido depois desta passada, na coleta de vistos.** O Marrocos entrou
> como `visa_free` pela Embaixada do Brasil em Rabat, e a linha `MA` está na
> migration aplicada — com o desvio de fonte anotado lá (o MRE é corroborativo,
> não primário). O que segue abaixo fica só como registro das portas que não
> abriram; **a validade de passaporte do Marrocos**, na tabela da seção 2,
> continua pendente, porque é outra pergunta.

Nesta passada foram tentadas quatro portas:

| Tentativa                                                   | Resultado                                                                        |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `consulat.ma` — lista de países isentos de visto            | Requisição rejeitada pelo servidor ("Request Rejected")                          |
| `diplomatie.ma` — Visiting Morocco                          | Certificado TLS inválido                                                         |
| `us.diplomatie.ma` — visa requirements                      | Certificado TLS inválido                                                         |
| `acces-maroc.ma` — portal oficial de autorização eletrônica | Abre, mas a resposta só existe depois de preencher o formulário de elegibilidade |

As únicas páginas que afirmaram o caso brasileiro foram sites de agência, que a
seção 2 da coleta de vistos proíbe.

**O caminho mais curto é humano e é o portal de elegibilidade.** Em
https://www.acces-maroc.ma basta preencher nacionalidade "Brasil", passaporte
comum e finalidade turismo, e ler o resultado — que é a posição oficial do
próprio Reino do Marrocos. A URL a registrar em `source_url` deve ser a página de
resultado ou a lista de isenção em `consulat.ma`, se ela abrir de um navegador
comum:

https://www.consulat.ma/en/list-countries-whose-citizens-are-exempted-entry-visa-morocco

Até lá, o Marrocos segue coberto pelo requisito genérico de exigências de
entrada, que é exatamente o comportamento desenhado para destino sem regra.

---

## 5. 7.3 — Seguro viagem exigido na entrada

Também aqui a pesquisa mudou a pergunta. A hipótese do plano era transformar
`travel-insurance` em `required` nos destinos que exigem seguro. Para o
passaporte brasileiro, **o principal candidato não se sustenta**.

O seguro com cobertura mínima de € 30.000 é **requisito do pedido de visto
Schengen**, exigido de quem precisa de visto. Quem entra no Espaço Schengen com
isenção de visto não precisa apresentar seguro: as condições de entrada do artigo
6 do Código de Fronteiras Schengen falam em justificar a finalidade da viagem e
comprovar meios de subsistência, não em apólice. Como o passaporte brasileiro é
isento para estadas curtas, **os 20 destinos Schengen não entram como seguro
obrigatório** — e cadastrá-los assim seria cobrar do usuário algo que a fronteira
não vai pedir.

Destinos que de fato exigem seguro de todo visitante existem — Cuba é o exemplo
mais citado —, mas **Cuba não está no escopo dos 46 destinos do MVP**, e nenhum
outro destino do escopo foi confirmado nesta passada.

**Recomendação: não criar template de seguro obrigatório agora.** A copy que a
Fase 1 entregou já diz a coisa certa — _"alguns destinos pedem seguro com valor
mínimo na entrada, confira nas exigências do país antes de fechar"_ — e ela vale
inclusive para quem for pedir visto Schengen, caso em que a exigência é real.

Fontes:

- Código de Fronteiras Schengen, Regulamento (UE) 2016/399 — condições de
  entrada: https://eur-lex.europa.eu/eli/reg/2016/399/oj/eng
- Comissão Europeia — política de vistos:
  https://home-affairs.ec.europa.eu/policies/schengen/visa-policy_en

---

## 6. 7.5 — Tomada e voltagem

A fonte é boa e estável: a IEC publica o **World Plugs**, com o tipo de tomada e
a tensão de cada país.

https://www.iec.ch/world-plugs

O que a pesquisa sugere é uma decisão de escopo, não de dados. Modelar isso em
`visa_rules` seria errado — não é exigência de entrada, não depende do passaporte
e não tem vigência. E uma tabela nova de catálogo para dois campos por país
custa, pela regra do AGENTS.md, RLS própria, policies por operação, `grant` de
`select` e nada para `anon`.

**Recomendação: deixar como está.** O item `power-adapter` que a Fase 2 criou já
manda conferir o padrão do destino, e essa é a ação que o viajante precisa
tomar — saber o tipo da tomada não muda o que ele faz, que é comprar um adaptador
universal. Se algum dia o dado entrar, ele é um bom primeiro caso de
`scope = 'country'`, e não de `visa_rules`.

---

## 7. Fase 4 — o que a passada confirmou de vigência

Dois itens de manutenção foram conferidos de passagem, porque eram baratos.

| #   | Situação                                                                                                                                                                                               | O que fazer                                                                                                                              |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 7.6 | **ETIAS continua sem data.** A Comissão mantém o "último trimestre de 2026" e diz que a data exata será anunciada com meses de antecedência. A taxa está confirmada em € 20.                           | Nada a fazer ainda. O mecanismo de `valid_until` + linhas novas com `valid_from` já existe e continua sendo o plano correto.             |
| 7.7 | **A isenção chinesa foi estendida até 31/12/2026**, 24h, para portadores de passaporte comum de 45 países, incluindo o Brasil, com estada de até 30 dias. O `valid_until` da linha atual está correto. | Reconferir perto da data. Se não houver nova prorrogação, o destino volta ao requisito genérico sozinho, que é o comportamento desejado. |

Fontes: https://travel-europe.europa.eu/etias/about-etias/news-corner/revised-timeline-ees-and-etias
e https://hr.china-embassy.gov.cn/eng/qzfw/Visa/202511/t20251104_11746850.htm

---

## 8. O que fazer a seguir, em ordem

1. **Abrir o PDF do six-month club da CBP** e responder se o Brasil está isento.
   É a pendência mais barata e um dos destinos mais buscados.
2. ~~Resolver o Marrocos~~ — **feito na coleta de vistos**, ver seção 4.
3. **Fechar a tabela da seção 2**, marcando `verified_at` linha a linha. São 10
   destinos pendentes e 16 em confiança média.
4. **Só então** decidir sobre as colunas da seção 1.1 — com a tabela na mão, e
   não antes.
5. Resolver a divergência da Tailândia (seção 2.5) na fonte do próprio MFA.

Nada nas fases 1 e 2 depende de qualquer um destes passos: toda a copy que já
está no banco manda conferir em vez de afirmar, justamente para não ficar
esperando esta coleta.

---

## 9. Revisão antes de qualquer migration desta fase

- [ ] toda linha tem `source_url` oficial que abre e mostra a informação citada;
- [ ] nenhum `source_url` é home page, PDF sem data ou domínio não governamental;
- [ ] toda linha tem `verified_at` da conferência real, não a data da migration;
- [ ] destinos em confiança média ou pendente ficaram **fora**;
- [ ] nenhuma divergência entre fontes virou escolha silenciosa;
- [ ] nenhum texto de item afirma número que a tabela não sustenta;
- [ ] se uma tabela nova for criada, ela liga RLS, escreve policies por operação
      `to authenticated`, concede só `select` ao cliente e nada a `anon`, e o
      `diff` de conferência do AGENTS.md roda antes do `db push`.

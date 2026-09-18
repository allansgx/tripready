# Coleta — regras de visto para o passaporte brasileiro

Instrumento de trabalho da feature de regras de visto por passaporte, cujo plano
já foi concluído e removido.

Aqui se preenche, confere e valida o que depois vira uma migration de seed em
`visa_rules`. **Este arquivo não é a migration**: nenhuma linha vai para o banco
antes de estar conferida contra a fonte oficial e revisada pela lista da seção
final.

---

## 1. Por que a coleta é humana

O schema já obriga o que a política exige: `source_name`, `source_url` e
`verified_at` são `not null` em `visa_rules`. Não existe regra sem fonte oficial
e sem data de conferência.

`verified_at` significa **a data em que uma pessoa abriu a página oficial e leu
a informação**. Não é a data da migration, nem a data em que a informação foi
encontrada em qualquer outro lugar. É essa coluna que responde "o quanto este
dado é recente", e ela só tem valor se for verdadeira.

Uma classificação errada aqui não é um bug de tela: é um viajante que chega ao
aeroporto sem o visto que precisava. Por isso a regra do plano é dura — **na
dúvida, não cadastre**. O destino sem regra continua coberto pelo requisito
genérico "Conferir as exigências de entrada", que já pede a consulta à fonte
oficial.

## 2. Fontes

**Primária, obrigatória:** o órgão oficial de imigração ou a chancelaria **do
país de destino**. É quem define a regra e quem responde por ela. É esta que vai
em `source_url`, apontando para a **página específica de requisitos de entrada**
— nunca a home do órgão.

**Corroborativa, recomendada:** Portal Consular do Ministério das Relações
Exteriores (gov.br/mre). Serve para detectar divergência, não para fundamentar a
linha.

**Proibidas:** blogs, agências de viagem, comparadores de visto, Wikipédia,
mapas de "visa requirements" de terceiros, e qualquer resposta gerada por modelo
de linguagem sem conferência humana na página oficial.

**Divergência entre a fonte do destino e o MRE bloqueia a linha.** Não cadastre;
anote o caso na coluna de observação e decida depois.

## 3. Como classificar

Para **passaporte brasileiro comum** (não diplomático, não oficial), em viagem
de **turismo**:

| Tipo              | Quando usar                                                  |
| ----------------- | ------------------------------------------------------------ |
| `visa_free`       | Entra sem visto, apenas com o passaporte                     |
| `visa_required`   | Precisa de visto emitido antes da viagem                     |
| `evisa`           | Visto solicitado e emitido online, antes da viagem           |
| `eta`             | Autorização eletrônica de viagem, aprovada antes do embarque |
| `visa_on_arrival` | Visto emitido no posto de fronteira, na chegada              |
| `conditional`     | A página não permite classificar sem ambiguidade             |

Regras de preenchimento:

- **Nunca chute entre `visa_free` e `visa_required`.** Sem clareza, use
  `conditional` e transcreva a condição em `notes`.
- `conditional` **exige** `notes` — o banco recusa a linha sem isso.
- `notes` em português, uma frase, orientada à ação: pode chegar ao usuário como
  descrição do item da checklist, no lugar do texto genérico do template.
- `valid_from` só quando a fonte declara a data de entrada em vigor. Sem data
  explícita, deixe vazio — nunca estime.
- `valid_until` só quando a regra tem fim previsto.

> Nota sobre `conditional`: o tipo já existe em `visa_rules`, mas **ainda não há
> template** que o transforme em item de checklist (decisão registrada na seção
> 7.2 do plano). Uma regra `conditional` fica cadastrada e silenciosa até esse
> template ser criado — o destino segue coberto pelo requisito genérico. Se a
> coleta produzir muitos `conditional`, vale criar o template antes do seed.

## 4. Planilha

Escopo do MVP: os 46 destinos que o app já trata como principais (os que têm
sugestão de cidade em `src/constants/cities.ts`). O Brasil fica fora — a
constraint `visa_rules_not_self` recusa passaporte e destino iguais.

A coluna **Grupo** é só um auxílio de organização: os 20 destinos do Espaço
Schengen compartilham o mesmo arcabouço de entrada para nacionais de países
terceiros, então costumam ser resolvidos numa tacada. **Pertencer ao grupo não
determina o resultado** — cada linha ainda precisa da sua própria fonte.

### 4.1 Estado da primeira passada

Preenchida por consulta a fontes oficiais em **2026-09-06**, como primeira
passada — **`verified_at` está propositalmente em branco em todas as linhas**.
A coluna só é preenchida quando uma pessoa abrir a fonte e confirmar.

Legenda de confiança:

- **Alta** — a página oficial afirma o caso brasileiro de forma explícita.
- **Média** — a fonte é oficial, mas a afirmação sobre o Brasil veio de
  resumo de busca e não foi lida na página inteira; confirmar antes de usar.
- **Pendente** — não foi possível confirmar nesta passada. **Não cadastrar.**

### 4.2 Espaço Schengen — 20 destinos

`AT` `BE` `CH` `CZ` `DE` `DK` `ES` `FI` `FR` `GR` `HR` `HU` `IS` `IT` `NL` `NO`
`PL` `PT` `RO` `SE`

| Campo         | Valor proposto                                                      |
| ------------- | ------------------------------------------------------------------- |
| Tipo          | `visa_free`                                                         |
| `source_name` | Comissão Europeia — Política de vistos (Regulamento (UE) 2018/1806) |
| `source_url`  | https://home-affairs.ec.europa.eu/policies/schengen/visa-policy_en  |
| `notes`       | Entrada sem visto para estadas de até 90 dias a cada 180.           |
| Confiança     | **Média**                                                           |

O Brasil consta do Anexo II do Regulamento (UE) 2018/1806, que lista as
nacionalidades isentas de visto para estadas curtas. A competência é da União,
e não de cada país — por isso um único par fonte/regra serve aos 20 destinos.
Ainda assim, o resumo de busca não exibiu o Anexo II na íntegra: **antes de
cadastrar, confirme o Brasil na lista do próprio regulamento.**

> ### ⚠️ ETIAS muda esses 20 destinos ainda em 2026
>
> O ETIAS **ainda não está em operação**. A Comissão indica início no **último
> trimestre de 2026**, com data exata a ser anunciada. Quando entrar em vigor,
> o viajante isento de visto passará a precisar de autorização eletrônica — ou
> seja, estes 20 destinos deixam de ser `visa_free` e passam a `eta`.
>
> Como tratar: cadastrar agora como `visa_free` e, quando a data for
> anunciada, preencher `valid_until` com o último dia antes da vigência e
> inserir as novas linhas `eta` com `valid_from`. O motor já resolve a virada
> sozinho, porque avalia a vigência contra a data da viagem — uma viagem para
> janeiro passa a exigir ETIAS enquanto uma para outubro continua isenta.
>
> Fonte: https://travel-europe.europa.eu/etias

### 4.3 Demais destinos — 26

| Destino                | Código | Tipo proposto     | Confiança    | `notes` proposto                                                                                                                                        |
| ---------------------- | ------ | ----------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reino Unido            | `GB`   | `eta`             | Alta         | Autorização eletrônica (ETA) aprovada antes do embarque, para visitas de até 6 meses.                                                                   |
| Irlanda                | `IE`   | `visa_free`       | Média        | Nacionalidade não sujeita a visto de entrada.                                                                                                           |
| Estados Unidos         | `US`   | `visa_required`   | Alta         | O Brasil não participa do Visa Waiver Program: é preciso visto de visitante (B-2).                                                                      |
| Canadá                 | `CA`   | `conditional`     | Alta         | eTA apenas para quem já teve visto canadense nos últimos 10 anos ou tem visto americano válido, e viaja de avião. Nos demais casos, visto de visitante. |
| México                 | `MX`   | `eta`             | Média        | Autorização eletrônica (SAE) para chegada por via aérea com passaporte eletrônico. Por terra ou mar, é preciso visto.                                   |
| Japão                  | `JP`   | `visa_free`       | Alta         | Isenção válida para passaporte eletrônico no padrão ICAO, em estadas de até 90 dias.                                                                    |
| China                  | `CN`   | `visa_free`       | Alta         | Entrada sem visto por até 30 dias. Política vigente até 31/12/2026.                                                                                     |
| Coreia do Sul          | `KR`   | `eta`             | Alta         | Autorização eletrônica (K-ETA) aprovada antes do embarque, para até 90 dias.                                                                            |
| Israel                 | `IL`   | `eta`             | Alta         | Autorização eletrônica (ETA-IL) solicitada até 72 horas antes da chegada.                                                                               |
| Nova Zelândia          | `NZ`   | `eta`             | Alta         | Autorização eletrônica (NZeTA) obtida antes da viagem.                                                                                                  |
| Austrália              | `AU`   | `visa_required`   | Média        | O eVisitor é restrito a passaportes europeus: é preciso visto de visitante, solicitado online.                                                          |
| Índia                  | `IN`   | `evisa`           | Alta         | Visto eletrônico solicitado com pelo menos 4 dias de antecedência.                                                                                      |
| Indonésia              | `ID`   | `visa_on_arrival` | Alta         | Visto na chegada, que pode ser pago online antes da viagem (e-VOA), para até 30 dias.                                                                   |
| Vietnã                 | `VN`   | `evisa`           | Alta         | Visto eletrônico de até 90 dias, apresentado impresso na chegada.                                                                                       |
| Tailândia              | `TH`   | `visa_free`       | Alta         | Entrada sem visto para turismo por até 60 dias.                                                                                                         |
| Turquia                | `TR`   | `visa_free`       | Média        | Entrada sem visto para estadas de até 90 dias a cada 180.                                                                                               |
| Egito                  | `EG`   | `evisa`           | **Baixa**    | Visto eletrônico solicitado antes da viagem.                                                                                                            |
| Emirados Árabes Unidos | `AE`   | `visa_free`       | Alta         | Entrada sem visto por até 90 dias a cada 12 meses; o carimbo é dado na chegada.                                                                         |
| Singapura              | `SG`   | `visa_free`       | Alta         | Entrada sem visto por até 30 dias. É preciso enviar o SG Arrival Card antes da chegada.                                                                 |
| África do Sul          | `ZA`   | `visa_free`       | Alta         | Entrada sem visto por até 90 dias.                                                                                                                      |
| Argentina              | `AR`   | `visa_free`       | Alta         | Entrada sem visto para turismo.                                                                                                                         |
| Chile                  | `CL`   | `visa_free`       | Alta         | Entrada sem visto para turismo; por ser membro do MERCOSUL, o documento de identidade é aceito no lugar do passaporte.                                  |
| Colômbia               | `CO`   | `visa_free`       | Alta         | Entrada sem visto para turismo por até 90 dias, prorrogáveis conforme a regulamentação.                                                                 |
| Peru                   | `PE`   | `visa_free`       | Alta         | Entrada sem visto para turismo; o documento de identidade é aceito no lugar do passaporte.                                                              |
| Uruguai                | `UY`   | `visa_free`       | Alta         | Entrada sem visto para turismo; o documento de identidade é aceito no lugar do passaporte.                                                              |
| Marrocos               | `MA`   | —                 | **Pendente** | não confirmado — ver abaixo                                                                                                                             |

Os cinco sul-americanos foram confirmados um a um na autoridade migratória do
próprio destino, e não pelo fato de pertencerem ao MERCOSUL — deduzir do bloco
é a inferência que esta coleta proíbe. O que o bloco explica é o documento
aceito: Chile, Peru e Uruguai admitem a carteira de identidade no lugar do
passaporte, e isso entrou em `notes` porque é informação útil ao viajante.

> **Marrocos segue pendente.** A lista oficial de países dispensados de visto
> está em `consulat.ma`, mas o servidor rejeitou as requisições em três
> tentativas, e a página do Ministério das Relações Exteriores apresentou
> certificado inválido. Nenhuma fonte alternativa aceitável foi encontrada —
> as que apareceram eram sites de agências, proibidos pela seção 2. **O
> Marrocos fica fora do seed** e continua coberto pelo requisito genérico de
> exigências de entrada, até alguém abrir a lista oficial manualmente.

### 4.4 Fontes por destino

| Código | `source_name`                                                        | `source_url`                                                                                                    |
| ------ | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `GB`   | GOV.UK — Electronic travel authorisation                             | https://www.gov.uk/guidance/check-when-you-can-get-an-electronic-travel-authorisation-eta                       |
| `IE`   | Irish Immigration Service — Visa and non-visa required nationalities | https://www.irishimmigration.ie/visa-non-visa-required-nationalities/                                           |
| `US`   | U.S. Department of State — Visitor Visa                              | https://travel.state.gov/content/travel/en/us-visas/tourism-visit/visitor.html                                  |
| `CA`   | IRCC — eTA: citizens from some visa-required countries               | https://www.canada.ca/en/immigration-refugees-citizenship/services/visit-canada/eta/eligibility/eta-x.html      |
| `MX`   | Instituto Nacional de Migración — Autorización electrónica           | https://www.inm.gob.mx/sae/publico/en/solicitud.html                                                            |
| `JP`   | MOFA — Visa Waiver Measure for nationals of Brazil                   | https://www.mofa.go.jp/press/release/press4e_003290.html                                                        |
| `CN`   | Embaixada da China — Política de isenção de visto                    | https://br.china-embassy.gov.cn/por/lqfw/lqfw2/                                                                 |
| `KR`   | Korea Immigration Service — K-ETA                                    | https://www.k-eta.go.kr/                                                                                        |
| `IL`   | Israel PIBA — ETA-IL                                                 | https://israel-entry.piba.gov.il/learn-about                                                                    |
| `NZ`   | Immigration New Zealand — Visa waiver countries                      | https://www.immigration.govt.nz/visit/what-you-need-to-visit-new-zealand/visa-waiver-countries-and-territories/ |
| `AU`   | Department of Home Affairs — Visitor visa (subclass 600)             | https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/visitor-600                                   |
| `IN`   | Government of India — e-Visa                                         | https://indianvisaonline.gov.in/evisa/tvoa.html                                                                 |
| `ID`   | Direktorat Jenderal Imigrasi — e-VOA                                 | https://evisa.imigrasi.go.id/front/info/evoa                                                                    |
| `VN`   | Vietnam National Electronic Visa system                              | https://evisa.gov.vn/                                                                                           |
| `TH`   | MFA Thailand — Tourist visa exemption (60 dias)                      | https://image.mfa.go.th/mfa/0/YLjhuT4Hho/Consular_Service/Tourist_Visa_Exempt_60_days.pdf                       |
| `TR`   | Türkiye MFA — Visa information for foreigners                        | https://www.mfa.gov.tr/visa-information-for-foreigners.en.mfa                                                   |
| `EG`   | Egypt e-Visa Portal                                                  | https://visa2egypt.gov.eg/eVisa/FAQ                                                                             |
| `AE`   | UAE MOFA — Embaixada em Brasília, vistos                             | https://www.mofa.gov.ae/en/missions/brasilia/services/visas                                                     |
| `SG`   | Embaixada de Singapura em Brasília — Visa-free entry for Brazilians  | https://brasilia.mfa.gov.sg/important-information/visa-free-entry-for-brazilians/                               |
| `ZA`   | DIRCO — Passport holders exempt from South African visas             | https://dirco.gov.za/uk/visa-countries-waivers/                                                                 |
| `AR`   | Dirección Nacional de Migraciones — Régimen de visas                 | https://www.migraciones.gob.ar/accesible/indexdnm.php?visas=                                                    |
| `CL`   | Servicio Nacional de Migraciones — Documentos de viaje               | https://serviciomigraciones.cl/guia/documentos-viaje/                                                           |
| `CO`   | Cancillería de Colombia — Necesito una visa                          | https://www.cancilleria.gov.co/tramites_servicios/visa/requisitos                                               |
| `PE`   | Superintendencia Nacional de Migraciones — Viajar con DNI            | https://www.gob.pe/158-viajar-con-dni                                                                           |
| `UY`   | Ministerio del Interior — Régimen de visas de admisión               | https://www.gub.uy/ministerio-interior/comunicacion/publicaciones/regimen-visas-admision                        |

> A fonte da Tailândia é um PDF: confirme se continua sendo a versão vigente
> antes de usá-la, já que a seção 6 desaconselha PDF sem data.

### 4.5 O que exige decisão antes do seed

1. **O Canadá é `conditional`, e `conditional` ainda não tem template.** A regra
   entraria no banco e ficaria silenciosa — o destino seguiria coberto apenas
   pelo requisito genérico. Como é um destino relevante e o caso é legítimo,
   vale criar o template `visa-conditional` antes deste seed. É uma linha a
   mais na migration da Etapa 4, sem código.
2. **China tem prazo.** A política vigente termina em **31/12/2026**, então a
   linha nasce com `valid_until = 2026-12-31`. Depois dessa data o motor deixa
   de aplicá-la, e o destino volta a ser coberto pelo requisito genérico — que
   é o comportamento correto para uma política que pode não ser renovada.
3. **ETIAS.** Ver o aviso na seção 4.2.
4. **México mudou em fevereiro de 2026** (reativação da autorização eletrônica).
   É a linha mais volátil da lista depois da China; confirmar com atenção.

#### Conferências pendentes — encerradas

As duas que faltavam foram feitas e viraram linha de seed:

- **Quênia** — a regra geral e a lista de isenções estão em
  https://etakenya.go.ke/how-to-apply, que substituiu `am.afdb.org` como
  `source_url`. O Brasil aparece na lista de isenções **apenas para passaporte
  diplomático, oficial ou de serviço**; o passaporte comum precisa de eTA.
- **Equador** — o Brasil não consta da lista de países que precisam de visto,
  conferida na Cancillería.

A **Venezuela** segue fora, por falta de fonte oficial venezuelana atualizada, e
não bloqueia nada: a filiação dela ao MERCOSUL está encerrada desde 2016-12-01
em `destination_group_members`.

O seed está em `supabase/migrations/20260917120000_visa_rules_br_expansion.sql`.

### 4.6 Segunda passada — ampliação para a cobertura mínima

Consulta a fontes oficiais em **2026-09-17**, motivada pelo critério de cobertura
mínima que está em `AGENTS.md`, na seção "Regras de negócio → Passaportes": o app
passou de 46 para 81 destinos com sugestão de cidade, e as 45 regras do primeiro
seed cobrem 56% deles.

Vale aqui tudo o que a §1 diz: **`verified_at` continua em branco**. Esta passada
abriu páginas oficiais e transcreveu o que elas dizem, mas quem assina a data é
quem conferir.

#### Confirmado nesta passada

| Destino              | Código | Tipo        | Confiança | `notes` proposto                                                                                          |
| -------------------- | ------ | ----------- | --------- | --------------------------------------------------------------------------------------------------------- |
| Bulgária             | `BG`   | `visa_free` | Alta      | Entrada sem visto para estadas de até 90 dias a cada 180.                                                 |
| Chipre               | `CY`   | `visa_free` | Alta      | Entrada sem visto para estadas de até 90 dias a cada 180.                                                 |
| Eslováquia           | `SK`   | `visa_free` | Alta      | Entrada sem visto para estadas de até 90 dias a cada 180.                                                 |
| Eslovênia            | `SI`   | `visa_free` | Alta      | Entrada sem visto para estadas de até 90 dias a cada 180.                                                 |
| Estônia              | `EE`   | `visa_free` | Alta      | Entrada sem visto para estadas de até 90 dias a cada 180.                                                 |
| Letônia              | `LV`   | `visa_free` | Alta      | Entrada sem visto para estadas de até 90 dias a cada 180.                                                 |
| Lituânia             | `LT`   | `visa_free` | Alta      | Entrada sem visto para estadas de até 90 dias a cada 180.                                                 |
| Luxemburgo           | `LU`   | `visa_free` | Alta      | Entrada sem visto para estadas de até 90 dias a cada 180.                                                 |
| Malta                | `MT`   | `visa_free` | Alta      | Entrada sem visto para estadas de até 90 dias a cada 180.                                                 |
| Paraguai             | `PY`   | `visa_free` | Alta      | Entrada sem visto para turismo por até 90 dias; a carteira de identidade é aceita no lugar do passaporte. |
| República Dominicana | `DO`   | `visa_free` | Alta      | Entrada sem visto para turismo por até 60 dias.                                                           |
| Geórgia              | `GE`   | `visa_free` | Alta      | Entrada sem visto por até um ano.                                                                         |
| Sérvia               | `RS`   | `visa_free` | Alta      | Entrada sem visto para estadas de até 90 dias a cada 6 meses.                                             |
| Sri Lanka            | `LK`   | `eta`       | Alta      | Autorização eletrônica (ETA) aprovada antes do embarque.                                                  |
| Catar                | `QA`   | `visa_free` | **Média** | Entrada sem visto; o carimbo é dado na chegada.                                                           |

Sobre o bloco europeu: o Anexo II do Regulamento (UE) 2018/1806 foi aberto no
EUR-Lex e **o Brasil consta da lista**. O mesmo texto diz que o regulamento
vincula todos os Estados-Membros exceto Irlanda e Reino Unido — por isso ele
resolve também **Chipre**, que é da União mas não do Espaço Schengen. Nenhuma das
nove linhas foi deduzida do bloco: todas saem do mesmo ato legal, que é o que
determina a regra.

O Catar ficou **Média** de propósito: a página oficial confirma que o brasileiro
entra sem visto, mas não exibiu o prazo. O `notes` proposto, por isso, não promete
número de dias.

#### Não confirmado — não cadastrar

| Destino        | Código | Motivo                                                                                                                                                   |
| -------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bolívia        | `BO`   | **Divergência.** Uma fonte consular coloca o Brasil no Grupo II, que exige visto de turismo; outra indica flexibilização recente. A §2 bloqueia a linha. |
| Equador        | `EC`   | O servidor do Ministério do Governo recusou a conexão                                                                                                    |
| Venezuela      | `VE`   | Não pesquisado nesta passada                                                                                                                             |
| Liechtenstein  | `LI`   | Não é da União, então o Anexo II não o alcança por si; `llv.li` respondeu 403                                                                            |
| Costa Rica     | `CR`   | A diretriz de vistos vigente é um PDF que respondeu 403                                                                                                  |
| Panamá         | `PA`   | A lista oficial de países isentos não foi localizada no site do SNM                                                                                      |
| Filipinas      | `PH`   | Indício de 59 dias por acordo bilateral, mas as páginas do DFA responderam 403                                                                           |
| Rússia         | `RU`   | O registro de acordos do Itamaraty devolveu página vazia                                                                                                 |
| Marrocos       | `MA`   | Segue pendente desde a primeira passada                                                                                                                  |
| Arábia Saudita | `SA`   | A página de opções de visto não expôs a lista de países                                                                                                  |
| Quênia         | `KE`   | A página de elegibilidade do eTA não expôs o conteúdo                                                                                                    |
| Nepal          | `NP`   | Certificado inválido no site de imigração                                                                                                                |
| Cuba           | `CU`   | Não pesquisado: a natureza da _tarjeta del turista_ exige decisão de classificação antes da coleta                                                       |

A Bolívia é o caso que mais pede conferência humana. Ela é membro do MERCOSUL, o
que cria a expectativa de isenção, e é exatamente por isso que a §2 proíbe deduzir
do bloco: se a regra mudou, deduzir produz o erro mais caro que esta coleta pode
cometer.

#### Fontes desta passada

| Código                                       | `source_name`                                                    | `source_url`                                                                                                      |
| -------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `BG` `CY` `EE` `LT` `LU` `LV` `MT` `SI` `SK` | Regulamento (UE) 2018/1806 — Anexo II                            | https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32018R1806                                            |
| `PY`                                         | Dirección General de Migraciones — Requerimientos migratorios    | https://migraciones.gov.py/entrada-y-salida-del-pais/requerimientos-migratorios-de-ingreso-y-salida-del-paraguay/ |
| `DO`                                         | Consulado Geral da República Dominicana no Rio de Janeiro        | https://bra.mirex.gob.do/consular/rio-de-janeiro/no-necesitas-visa-para-visitar-republica-dominicana/             |
| `GE`                                         | Legislative Herald of Georgia — lista de países isentos de visto | https://matsne.gov.ge/en/document/view/2867361                                                                    |
| `RS`                                         | Ministry of Foreign Affairs of Serbia — Visa regime: Brazil      | https://www.mfa.gov.rs/en/citizens/travel-serbia/visa-regime/brazil                                               |
| `LK`                                         | Sri Lanka Electronic Travel Authorization System                 | https://www.eta.gov.lk/slvisa/                                                                                    |
| `QA`                                         | Visit Qatar — Visa details                                       | https://visitqatar.com/intl-en/plan-your-trip/visas/visa-details                                                  |

O Anexo II é a mesma base legal das 20 linhas do Espaço Schengen já cadastradas,
com uma diferença que vale registrar: naquela passada a fonte ficou **Média**
porque o Anexo II não tinha sido aberto. Agora foi — e isso **eleva também a
confiança das 20 linhas antigas**, que citam a página de política de vistos da
Comissão. Vale trocar o `source_url` das vinte para o EUR-Lex na próxima
atualização, já que é lá que o Brasil aparece nominalmente. Como manda a regra do
projeto, essa troca é migration nova, nunca edição da que já foi aplicada.

#### Onde isso deixa a cobertura

Seis das quinze linhas confirmadas são de destinos que **não têm sugestão de
cidade** no app (`EE`, `LT`, `LU`, `LV`, `SK`, `PY`) e por isso não contam para o
piso, embora contem para a condição de grupo.

| Momento                | Regras | Cobertura |
| ---------------------- | ------ | --------- |
| Antes desta passada    | 45     | 56%       |
| Com as 15 confirmadas  | 54     | 67,5%     |
| Piso exigido pela §3.4 | 60     | 75%       |

**Faltam seis destinos com sugestão de cidade.** Eles não estão por descobrir:
estão todos na tabela de não confirmados acima. O que travou não foi ausência de
destino a coletar, foi ausência de fonte que abrisse.

As duas condições de grupo também seguem abertas: `BO`, `EC` e `VE` seguram o
MERCOSUL e a Comunidade Andina, e `LI` segura o Espaço Schengen.

#### Conferência humana — 2026-09-17

Seis dos destinos travados na passada automática foram abertos por uma pessoa.
É o procedimento que a §1 descreve, e é o que destrava o que 403 e certificado
inválido tinham impedido.

| Destino   | Código | Tipo        | Confiança | `notes` proposto                                                                |
| --------- | ------ | ----------- | --------- | ------------------------------------------------------------------------------- |
| Bolívia   | `BO`   | `visa_free` | Alta      | Entrada sem visto para turismo.                                                 |
| Filipinas | `PH`   | `visa_free` | Alta      | Entrada sem visto para turismo ou negócios por até 59 dias.                     |
| Rússia    | `RU`   | `visa_free` | Alta      | Entrada sem visto para estadas de até 90 dias a cada 180, em viagem de turismo. |

| Código | `source_name`                                     | `source_url`                                                                                                                                      |
| ------ | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BO`   | MRE — Consulado-Geral em Santa Cruz de la Sierra  | https://www.gov.br/mre/pt-br/consulado-santa-cruz-de-la-sierra/conselho-aos-viajante/requisitos-para-entrada-na-bolivia                           |
| `PH`   | MRE — Embaixada em Manila                         | https://www.gov.br/mre/pt-br/embaixada-manila/setor-consular/informacoes-a-viajantes-e-residentes-brasileiros/entrada-e-permanencia-nas-filipinas |
| `RU`   | Embaixada da Rússia no Brasil — Entrada na Rússia | https://brazil.mid.ru/pt/consular-services/informacoes_gerais/entrada_na_r_ssia/                                                                  |

A Bolívia resolve a divergência da passada anterior no sentido da isenção, e
fecha o MERCOSUL junto com o Paraguai — faltam `VE` e, na Comunidade Andina,
`EC`.

**Desvio de fonte a registrar.** `BO` e `PH` saem do MRE, que a §2 classifica
como fonte **corroborativa**, não primária. É desvio menor — é órgão oficial, e a
página trata especificamente do brasileiro que viaja — mas continua sendo desvio,
e fica anotado para que uma passada futura substitua pelo órgão do destino. A
Rússia não tem esse problema: `brazil.mid.ru` é a representação oficial do
próprio destino.

##### Rússia — o registro eletrônico prévio está com vigência vencida

A página oficial descreve, além da isenção, um **procedimento obrigatório de
registro prévio** no sistema unificado de identificação para quem entra sem
visto, com vigência declarada de **30/06/2025 a 30/06/2026**.

Hoje é 17/09/2026: **a janela declarada já passou**. Ou o procedimento foi
prorrogado e a página não reflete isso, ou ele terminou. As duas leituras levam a
linhas diferentes, e nenhuma delas pode ser adivinhada:

- se o registro continua valendo, o tipo honesto é `eta` — é exatamente a forma
  de uma autorização eletrônica aprovada antes do embarque, como no K-ETA e no
  NZeTA já cadastrados;
- se terminou, o tipo é `visa_free` e o `notes` não menciona registro nenhum.

Enquanto isso não for lido na fonte, a linha da Rússia **fica fora do seed**.
Cadastrá-la como `visa_free` sem o registro é o erro que a §1 descreve: o
viajante chega ao embarque sem um documento que precisava.

> **Resolvido na rodada seguinte**, com o MFA russo: o acordo está em vigor desde
> 2010 e nenhuma fonte posterior menciona o registro. A Rússia entra como
> `visa_free`.

#### Ainda sem fonte aceitável — Costa Rica, Malásia e Panamá

Os três vieram de `mundialvistos.com.br`, ou sem fonte. A §2 proíbe agência de
vistos e comparador, e a proibição não é formalidade: é uma página comercial, sem
data de conferência e sem responsabilidade sobre a regra.

O que as fontes oficiais responderam nesta rodada:

| Destino    | Código | O que a fonte oficial mostrou                                                                                                                                                   |
| ---------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Costa Rica | `CR`   | A diretriz geral de vistos vigente respondeu 403 nas duas versões tentadas (2023 e novembro de 2025). O Grupo 1 existe e dispensa visto; **falta ler o Brasil nele**.           |
| Malásia    | `MY`   | A lista oficial de imigração tem 33 países que exigem visto e 50 isentos, e **o Brasil não está em nenhuma das duas**. O MDAC também não aparece nessa página.                  |
| Panamá     | `PA`   | O SNM confirma os requisitos de turista — passaporte com 3 meses de validade, solvência de no mínimo B/. 500 e reserva de saída —, mas **não expõe a lista de países isentos**. |

O Panamá é o caso mais próximo de fechar: o que falta é só a lista de países. Os
requisitos que a fonte oficial confirma já são bons candidatos a `notes`, porque
são o que o viajante precisa levar.

A Malásia é o oposto — a ausência do Brasil nas duas listas oficiais é um sinal
de que a página não é a fonte certa, não de que a regra seja ambígua. Vale
procurar no portal de vistos (`malaysiavisa.imi.gov.my`) antes de concluir
qualquer coisa.

> **Resolvido na rodada seguinte:** a fonte certa era a embaixada da Malásia em
> Brasília, e não a página de listas da imigração. A Malásia entra como
> `visa_free`. Costa Rica e Panamá seguem abertos.

#### Cobertura depois desta rodada

| Momento                                   | Regras | Cobertura |
| ----------------------------------------- | ------ | --------- |
| Antes da segunda passada                  | 45     | 56%       |
| Com as 15 da passada automática           | 54     | 67,5%     |
| Com `PH` (a `BO` não tem cidade sugerida) | 55     | 68,75%    |
| Se `CR`, `MY`, `PA` e `RU` entrarem       | 59     | 73,75%    |
| Piso exigido pela §3.4                    | 60     | 75%       |

**Mesmo confirmando todos os seis, falta um destino.** A conta não fecha por
pouco: 59 de 80. O candidato mais barato é qualquer um dos que já estão nomeados
como pendentes — Marrocos, Cuba, Arábia Saudita, Quênia, Jordânia, Nepal,
Cazaquistão ou Tunísia.

#### Malásia e Rússia — confirmados

| Destino | Código | Tipo        | Confiança | `notes` proposto                                                                            |
| ------- | ------ | ----------- | --------- | ------------------------------------------------------------------------------------------- |
| Malásia | `MY`   | `visa_free` | Alta      | Entrada sem visto para visita social ou de negócios, por até 90 dias.                       |
| Rússia  | `RU`   | `visa_free` | Alta      | Entrada sem visto para estadas de até 90 dias a cada 180, em viagem de turismo ou negócios. |

| Código | `source_name`                                                          | `source_url`                                                                            |
| ------ | ---------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `MY`   | Embaixada da Malásia em Brasília — informações consulares (KLN)        | https://www.kln.gov.my/web/bra_brasilia/post/other-consular-information-3-1             |
| `RU`   | MFA da Rússia — marco regulatório das relações consulares com o Brasil | https://www.kdmid.ru/docs/brazil/regulatory-framework-for-bilateral-consular-relations/ |

Os dois saem do órgão do próprio destino, que é o que a §2 pede como fonte
primária — sem o desvio anotado para `BO` e `PH`.

##### Rússia — o registro eletrônico não se sustenta como exigência

A dúvida levantada na rodada anterior era o procedimento de registro prévio com
vigência declarada de 30/06/2025 a 30/06/2026, já vencida. Três fontes
posteriores ou independentes falam da entrada sem visto e **nenhuma delas
menciona o registro**: o Decreto nº 7.271/2010, que promulga o acordo; o aviso do
MRE de maio de 2026; e a página do MFA russo, que confirma o acordo em vigor
desde 7 de junho de 2010, com permanência de até 90 dias a cada 180.

Por isso a linha entra como `visa_free`, sem mencionar registro. O caso fica
anotado na §8 como candidato a reconferência: procedimento com janela vencida
tende a voltar, e se voltar o tipo correto passa a ser `eta`.

##### MDAC — é requisito, não é regra de visto

O Malaysia Digital Arrival Card não pertence a `visa_rules`. A tabela responde
"este passaporte precisa de visto para este destino"; o MDAC é obrigatório
**independentemente** da dispensa, e por isso é um `requirement_template` com
escopo de país, ligado a `MY` por `requirement_template_countries` — a mesma
forma que já vale para qualquer exigência de entrada específica de um destino.

Antes de virar linha, ele precisa do que todo template precisa:

1. **fonte oficial própria**, no portal de imigração da Malásia — a página
   consular da embaixada confirma a isenção de visto, e não o MDAC. A observação
   de que o formulário é preenchido nos três dias anteriores à chegada é
   justamente o tipo de detalhe operacional que não pode entrar sem ser lido na
   fonte;
2. **as três traduções** no mesmo arquivo de migration, como manda o AGENTS.md;
3. prioridade `required`, porque sem ele o embarque é negado.

##### Nota sobre o formato dos campos

`visa_rules` não tem coluna de prazo nem de confiança. O prazo de permanência vai
no texto de `notes` — é o que as 45 linhas do primeiro seed já fazem — e a
confiança é um instrumento **deste documento**, que serve para decidir se a linha
entra no arquivo, e não viaja para o banco. O que o banco guarda sobre a
qualidade do dado é `verified_at`.

#### Cobertura depois desta rodada

| Momento                                 | Regras | Cobertura |
| --------------------------------------- | ------ | --------- |
| Com `BG CY MT SI DO GE RS LK QA` e `PH` | 55     | 68,75%    |
| Com `MY` e `RU`                         | 57     | 71,25%    |
| Piso exigido pela §3.4                  | 60     | 75%       |

Faltam **três destinos com sugestão de cidade**. Costa Rica e Panamá já estão em
andamento e resolvem dois; o terceiro pode ser qualquer um dos pendentes —
Marrocos, Cuba, Arábia Saudita, Quênia, Jordânia, Nepal, Cazaquistão ou Tunísia.

Fora do piso, seguem abertas as condições de grupo: `VE` no MERCOSUL, `EC` na
Comunidade Andina e `LI` no Espaço Schengen.

#### Marrocos, Cuba e Quênia

| Destino  | Código | Tipo        | Confiança | `notes` proposto                                                                                                        |
| -------- | ------ | ----------- | --------- | ----------------------------------------------------------------------------------------------------------------------- |
| Marrocos | `MA`   | `visa_free` | Alta      | Entrada sem visto para turismo por até 90 dias.                                                                         |
| Cuba     | `CU`   | `evisa`     | Alta      | Tarjeta de Turista solicitada online antes da viagem; também vendida no balcão da companhia aérea. Permite até 90 dias. |
| Quênia   | `KE`   | `eta`       | Alta      | Autorização eletrônica (eTA) aprovada antes do embarque, para estadas de até 90 dias.                                   |

| Código | `source_name`                                       | `source_url`                                                                                               |
| ------ | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `MA`   | MRE — Embaixada em Rabat, informações úteis         | https://www.gov.br/mre/pt-br/embaixada-rabat/rabat-arquivos/informacoes-uteis                              |
| `CU`   | MRE — Embaixada em Havana, recomendações a turistas | https://www.gov.br/mre/pt-br/embaixada-havana/consular-1/recomendacoes-a-turistas-e-visitantes-brasileiros |
| `KE`   | _(pendente — ver abaixo)_                           | https://www.etakenya.go.ke/                                                                                |

**O Marrocos sai da pendência aberta na primeira passada**, onde estava desde
2026-09-06 por o `consulat.ma` recusar as requisições. Entra com o mesmo desvio
de fonte anotado para `BO` e `PH`: o MRE é corroborativo pela §2, não primário.

##### Quênia — a fonte precisa trocar antes do seed

A informação está certa e bate com o portal oficial, mas `am.afdb.org` é o site
de um encontro do Banco Africano de Desenvolvimento. Não é o órgão que determina
a regra, e a §6 é explícita: nenhum `source_url` em domínio não governamental.

A troca é barata, porque o próprio Quênia publica a regra: `etakenya.go.ke` é o
portal oficial do eTA, em domínio `.go.ke`. Ele não abriu para leitura
automática — a página de elegibilidade devolveu só a navegação —, então falta
alguém abri-lo e confirmar duas coisas: que a eTA vale para toda nacionalidade
desde 1º de janeiro de 2024, e que a estada de turismo é de até 90 dias.

Enquanto isso não acontecer, a linha fica pronta mas fora do arquivo.

##### Cuba — por que `evisa` e não `visa_required`

A Tarjeta de Turista é visto de turismo, e a pergunta é só qual dos tipos do
vocabulário descreve melhor o que o viajante faz. `evisa` significa solicitado e
emitido online antes da viagem, que é exatamente o caminho principal hoje. A
venda no balcão da companhia aérea no check-in não muda isso e também não é
`visa_on_arrival`, que descreve emissão no posto de fronteira, na chegada.

`visa_required` também seria defensável e tem template. A diferença que o usuário
vê é o texto do item: `evisa` manda solicitar online, `visa_required` manda
providenciar o visto. **Escolhi `evisa` por ser mais específico**, e a alternativa
fica registrada caso se prefira o texto mais genérico.

##### Os requisitos que não são regra de visto

Cuba e Quênia trouxeram exigências que, como o MDAC, não pertencem a
`visa_rules` — são `requirement_template` com escopo de país:

| Exigência                          | Destino   | Observação                                                      |
| ---------------------------------- | --------- | --------------------------------------------------------------- |
| Seguro viagem com cobertura médica | `CU`      | Obrigatório, e hoje o catálogo só tem o item genérico de seguro |
| Certificado de vacinação (CIVP)    | `CU` `KE` | Febre amarela, exigido de quem parte do Brasil                  |
| Formulário D'Viajeros              | `CU`      | Preenchido online nos dias anteriores ao voo                    |

A vacina merece nota à parte. O catálogo tem hoje `Conferir as vacinas —
{country}`, criado de propósito como `recommended` e com texto que **manda
conferir em vez de afirmar**, porque não havia coleta com fonte. Agora há, para
dois destinos. Isso permite um item `required` de febre amarela ligado a `CU` e
`KE` — mas é decisão a tomar junto com a fonte de saúde de cada um, não junto
com esta coleta de vistos.

#### Cobertura — o piso é alcançado

| Momento                                | Regras | Cobertura |
| -------------------------------------- | ------ | --------- |
| Antes da segunda passada               | 45     | 56%       |
| Com `MY` e `RU`                        | 57     | 71,25%    |
| Com `MA` e `CU`                        | 59     | 73,75%    |
| **Com `KE`, depois da troca da fonte** | **60** | **75%**   |

Os três destinos desta rodada têm sugestão de cidade, então os três contam. Com o
Quênia confirmado no portal oficial, o Brasil **atinge exatamente o piso da
§3.4** — 60 de 80.

As condições restantes são as de grupo: `VE` no MERCOSUL, `EC` na Comunidade
Andina e `LI` no Espaço Schengen. Nenhuma delas tem sugestão de cidade, então
nenhuma mexe no piso — mas as três precisam entrar antes de o Brasil ser
liberado, porque a §3.4 exige grupo inteiro.

Costa Rica e Panamá deixaram de ser necessários para o piso. Continuam valendo a
pena: são destinos com cidade sugerida, e cada um deles dá folga a um critério
que hoje passa no limite.

#### As três linhas de grupo — Liechtenstein resolvido

| Destino       | Código | Tipo        | Confiança | `notes` proposto                                          |
| ------------- | ------ | ----------- | --------- | --------------------------------------------------------- |
| Liechtenstein | `LI`   | `visa_free` | Alta      | Entrada sem visto para estadas de até 90 dias a cada 180. |

| Código | `source_name`                                                         | `source_url`                                                                                                       |
| ------ | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `LI`   | SEM (Suíça) — Lista 1: documentos e vistos por nacionalidade, letra B | https://www.sem.admin.ch/sem/en/home/publiservice/weisungen-kreisschreiben/visa/liste1_staatsangehoerigkeit/b.html |

O Liechtenstein não é da União, então o Anexo II não o alcançava por si — era
essa a pendência. A saída não foi deduzir do Espaço Schengen, e sim achar quem
responde pela regra: **a Suíça administra os vistos do principado**, e a SEM
publica a lista oficial por nacionalidade. A entrada do Brasil diz "visto para
estadas até 90 dias: **não**", e a lista vale para os dois países.

Com essa linha, o **Espaço Schengen fica completo**: 29 de 29.

##### Venezuela — a fonte não responde a pergunta

O MPPRE publica os requisitos do visto de turismo — passaporte com seis meses,
comprovante de residência, carta bancária, certificado médico —, mas **não diz
quais nacionalidades estão dispensadas**, nem por quanto tempo. Uma página sobre
como pedir o visto não responde se o brasileiro precisa dele.

Falta: a lista de países isentos, ou uma página do SAIME/MPPRE que trate do caso
brasileiro. Sem isso a linha não entra — é exatamente o cenário da §1, em que o
silêncio não pode virar `visa_free`.

##### Equador — a página existe, o servidor é que não abre

A fonte certa está identificada: a Cancillería mantém **"Lista de países que deben
presentar visa al ingresar al Ecuador"**, baseada no Acuerdo Ministerial 0000198,
em https://www.cancilleria.gob.ec/2020/06/30/lista-de-paises-que-deben-presentar-visa-al-ingresar-al-ecuador/

O host respondeu com certificado inválido, e o Ministerio de Gobierno recusou
conexão nas duas tentativas. O que se sabe da listagem de busca é que ela reúne
cerca de 46 países de regime especial — Afeganistão, Cuba, Índia, China, Nigéria,
Venezuela e outros — e **o Brasil não está entre eles**.

Falta: abrir a página e confirmar duas coisas — que o Brasil realmente não consta
da lista, e qual o prazo de permanência do turista sul-americano, que a Lei de
Mobilidade Humana trata em separado. Ausência de um país numa lista de exigência
é evidência de isenção, mas precisa ser lida, não inferida de resumo de busca.

#### Situação das condições da §3.4

| Condição               | Situação                                                             |
| ---------------------- | -------------------------------------------------------------------- |
| Viagem doméstica       | Cumprida                                                             |
| Espaço Schengen (29)   | **Completo**, com `LI`                                               |
| MERCOSUL (5)           | Falta `VE`                                                           |
| Comunidade Andina (4)  | Falta `EC`                                                           |
| Trinta destinos comuns | Cumprida — o último pendente era o Marrocos                          |
| Piso de 75%            | 60 de 80, atingido no limite, dependendo da troca da fonte do Quênia |

#### Quênia e Equador — conferidos, e o critério fecha

| Destino | Código | Tipo        | Confiança | `notes` proposto                                                                                        |
| ------- | ------ | ----------- | --------- | ------------------------------------------------------------------------------------------------------- |
| Quênia  | `KE`   | `eta`       | Alta      | Autorização eletrônica (eTA) aprovada antes do embarque; o processamento leva cerca de três dias úteis. |
| Equador | `EC`   | `visa_free` | Alta      | Entrada sem visto para turismo.                                                                         |

| Código | `source_name`                                                      | `source_url`                                                                                               |
| ------ | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `KE`   | Kenya eTA — Citizenship and Immigration (Amendment) Rules, 2025    | https://etakenya.go.ke/how-to-apply                                                                        |
| `EC`   | Cancillería del Ecuador — Lista de países que deben presentar visa | https://www.cancilleria.gob.ec/2020/06/30/lista-de-paises-que-deben-presentar-visa-al-ingresar-al-ecuador/ |

##### O Quênia confirma por contraste, que é o melhor tipo de confirmação

A página lista o Brasil entre os isentos **apenas para passaporte diplomático,
oficial ou de serviço**, por até 90 dias. Como esta coleta é de **passaporte
comum** (§3), a leitura é direta: o brasileiro comum não está isento, e vale a
regra geral — "todos os visitantes, incluindo bebês e crianças, devem possuir uma
eTA aprovada antes do início da viagem".

É mais forte do que achar o Brasil numa lista de exigência: aqui o país aparece
nominalmente, e aparece numa exceção que não alcança o viajante do app.

O `notes` não menciona os 90 dias justamente por isso — os 90 dias da página são
os do passaporte diplomático. O prazo do turista comum não foi lido.

##### Equador

O Brasil não consta da lista de países que precisam de visto. O `notes` fica em
"Entrada sem visto para turismo", sem prazo, porque a lista responde quem precisa
de visto e não por quanto tempo o turista fica — mesma forma já usada na linha da
Argentina.

##### Venezuela permanece fora

A pesquisa indica isenção de 90 dias para passaporte comum, mas **sem fonte
venezuelana oficial atualizada**. A §1 é clara: na dúvida, não cadastre. E não
custa nada deixar fora, porque a filiação da Venezuela ao MERCOSUL está encerrada
desde 2016-12-01 em `destination_group_members` — ela não entra na conta de
nenhuma condição.

#### O passaporte brasileiro passa no critério da §3.4

| Condição                    | Situação                                                          |
| --------------------------- | ----------------------------------------------------------------- |
| Viagem doméstica            | **Cumprida** — `domestic-photo-id`                                |
| Espaço Schengen (29)        | **Completo**, com `LI` pela lista da SEM                          |
| MERCOSUL (membros vigentes) | **Completo** — `AR` `PY` `UY` `BO`; `VE` está suspensa desde 2016 |
| Comunidade Andina (4)       | **Completo** — `BO` `CO` `EC` `PE`                                |
| Trinta destinos comuns      | **Cumprida** — o último pendente era o Marrocos                   |
| Piso de 75%                 | **60 de 80**, atingido no limite                                  |

O piso passa exatamente no limite, e vale saber de quem ele depende: **se a linha
do Catar sair, a cobertura cai para 59 e o critério deixa de fechar.** O Catar
está como Média porque a página oficial confirma a isenção para brasileiros mas
não exibiu o prazo — e é por isso que o `notes` dele não promete dias. Se a
preferência for segurar o Catar, Costa Rica e Panamá voltam a ser necessários.

Folga é o que não há. Costa Rica, Panamá e Venezuela continuam valendo a pena
como próxima leva, por isso mesmo.

## 5. Forma da migration

Preenchida a planilha, o seed vira um arquivo
`supabase/migrations/<timestamp>_visa_rules_br_seed.sql` com esta forma. O
`on conflict` deixa a migration **idempotente**: reexecutar não duplica, e
atualizar uma regra é reeditar a linha.

```sql
insert into public.visa_rules (
  passport_country_code, destination_country_code, requirement_type,
  source_name, source_url, verified_at, notes
)
values
  (
    'BR', 'XX', 'visa_required',
    'Nome do órgão oficial',
    'https://exemplo.gov.xx/requisitos-de-entrada',
    date '2026-09-06',
    null
  )
  -- ... uma linha por destino conferido
on conflict (passport_country_code, destination_country_code) do update
set requirement_type = excluded.requirement_type,
    source_name      = excluded.source_name,
    source_url       = excluded.source_url,
    verified_at      = excluded.verified_at,
    notes            = excluded.notes,
    valid_from       = excluded.valid_from,
    valid_until      = excluded.valid_until;
```

**Destinos não conferidos simplesmente não entram no arquivo.** Uma lista
parcial é o resultado esperado, não uma falha: o requisito genérico cobre o
resto.

## 6. Revisão antes do merge

- [ ] toda linha tem `source_url` oficial que abre e mostra a informação citada;
- [ ] nenhum `source_url` é home page, PDF sem data ou domínio não governamental;
- [ ] toda linha tem `verified_at` da conferência real, não a data da migration;
- [ ] todo `conditional` tem `notes` descrevendo a condição;
- [ ] nenhum `valid_from` estimado;
- [ ] casos de dúvida ficaram **fora** do seed, não viraram `visa_free`;
- [ ] o seed é idempotente (`on conflict ... do update`);
- [ ] a classificação é de **passaporte comum**, em viagem de turismo.

## 7. Conferência depois de aplicar

```sql
-- Quantas regras por resultado, e qual a conferência mais antiga.
select requirement_type, count(*), min(verified_at) as conferencia_mais_antiga
from public.visa_rules
where passport_country_code = 'BR'
group by requirement_type
order by 2 desc;

-- Destinos do escopo que ficaram sem regra — o esperado é que sobrem alguns.
select code
from (values ('DE'),('AT'),('BE'),('HR'),('DK'),('ES'),('FI'),('FR'),('GR'),
             ('HU'),('IS'),('IT'),('NO'),('NL'),('PL'),('PT'),('RO'),('SE'),
             ('CH'),('CZ'),('ZA'),('AR'),('AU'),('CA'),('CL'),('CN'),('CO'),
             ('KR'),('EG'),('AE'),('US'),('IN'),('ID'),('IE'),('IL'),('JP'),
             ('MA'),('MX'),('NZ'),('PE'),('GB'),('SG'),('TH'),('TR'),('UY'),
             ('VN')) as escopo (code)
where code not in (
  select destination_country_code from public.visa_rules
  where passport_country_code = 'BR'
);

-- Regra que nenhum template sabe exibir (hoje: `conditional`).
select distinct r.requirement_type
from public.visa_rules r
where not exists (
  select 1 from public.requirement_templates t
  where t.scope = 'visa' and t.visa_requirement_type = r.requirement_type
);
```

## 8. Manutenção

`verified_at` é o termômetro. Uma revisão periódica — reabrir as fontes dos
destinos mais usados e atualizar a data — mantém o dado honesto sem exigir
versionamento. Regra que mudou é `update` na linha; regra revogada ganha
`valid_until`, e o motor para de aplicá-la a viagens que começam depois.

# Coleta — regras de visto para o passaporte brasileiro

Instrumento de trabalho da **Etapa 5** do
[plano de regras de visto](plano-regras-de-visto-por-passaporte.md).

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

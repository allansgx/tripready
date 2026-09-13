# Plano — Regras de visto por passaporte

Feature: determinar se o viajante precisa de visto para cada país da viagem, a
partir do passaporte principal cadastrado, e transformar essa resposta em item
de checklist.

Status: **implementado**. O motor, as tabelas `visa_rules` e os templates de
escopo `visa` estão no app; a coleta de regras continua em
[coleta-vistos-br.md](coleta-vistos-br.md).

---

## 1. Diagnóstico da implementação atual

O diagnóstico abaixo veio de leitura do código e das migrations, não de
suposição. Duas premissas do enunciado estão **desatualizadas** e mudam bastante
o tamanho da feature.

### 1.1 O que já existe

| Item verificado                                    | Situação real                                                |
| -------------------------------------------------- | ------------------------------------------------------------ |
| `passports`                                        | Existe. `supabase/migrations/20260905120000_init_schema.sql` |
| Passaporte principal                               | Existe e é confiável                                         |
| `trips` / `trip_countries` / `trip_cities`         | Existem, com FK composta                                     |
| `trip_requirements`                                | Existe, já com `template_id` e `group_id`                    |
| Requisitos hardcoded no frontend                   | **Já migrados para o banco**                                 |
| `requirement_templates`                            | **Já existe**                                                |
| `destination_groups` / `destination_group_members` | **Já existem, com seed**                                     |
| Geração da checklist                               | Motor puro e testado, em `requirement-matching.ts`           |
| RLS                                                | Configurado em todas as tabelas, incluindo o catálogo        |

Ou seja: **o item 5 do enunciado ("requisitos hardcoded no frontend") não é mais
verdade**, e os itens 6 e 7 ("se já existe `requirement_templates` /
`destination_groups`") são afirmativos. A migração já aconteceu nos commits
`960dbd4` e seguintes.

### 1.2 `passports` e o passaporte principal

[supabase/migrations/20260905120000_init_schema.sql](supabase/migrations/20260905120000_init_schema.sql):

```sql
create table public.passports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  country_code text not null check (country_code ~ '^[A-Z]{2}$'),
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  constraint passports_user_country_unique unique (user_id, country_code)
);

create unique index passports_single_primary_idx
  on public.passports (user_id) where is_primary;
```

O índice único parcial garante **no máximo um** principal por usuário. A garantia
de que existe **pelo menos um** é da aplicação, em
[passports-context.tsx](src/features/passports/passports-context.tsx):

- o primeiro passaporte cadastrado nasce `is_primary`;
- o principal não pode ser removido enquanto houver outros;
- o principal não pode ser removido se for o único.

O contexto expõe `primary: Passport | null`, e o layout raiz bloqueia o app no
onboarding enquanto `hasPassport` for falso. Na prática, todo usuário dentro do
app tem passaporte principal.

**Conclusão: identificar o passaporte principal não é um problema.** A dúvida do
enunciado ("dificuldade de identificar o passaporte principal") não se confirma.

### 1.3 `trips`, `trip_countries` e `trip_requirements`

- `trip_countries (trip_id, country_code)` tem `unique (trip_id, country_code)`,
  que é justamente o alvo da FK composta usada por `trip_cities` e por
  `trip_requirements`.
- `trip_requirements.country_code` é **nulo para itens de viagem inteira** e,
  quando preenchido, tem FK composta `(trip_id, country_code) →
trip_countries`. Ou seja, um requisito de país só existe se o país estiver na
  viagem, e some por cascata quando o país sai.
- `trip_requirements` já carrega `template_id` (regra de origem) e `group_id`
  (grupo que tornou a regra aplicável), ambos nulos em itens criados à mão.
- Existe índice único parcial impedindo a mesma regra entrar duas vezes na mesma
  viagem/país/grupo.

**Isso é exatamente a estrutura que a feature de visto precisa.** Um item de
visto é um `trip_requirement` com `country_code` preenchido e `template_id`
apontando para a regra que o originou.

### 1.4 Como a checklist é gerada hoje

Fluxo real, em três camadas:

1. **Serviço** — [requirement-catalog.ts](src/services/requirement-catalog.ts)
   carrega `requirement_templates` (todos os ativos) e os grupos que contêm
   algum país da viagem. Só carrega e traduz linhas.
2. **Motor puro** —
   [requirement-matching.ts](src/features/trips/requirement-matching.ts)
   `resolveTripRequirements(trip, catalog, options)`. Sem Supabase, sem React,
   testado com `node --test`. A ordem de avaliação é:
   - descarta template inativo;
   - descarta fora de `valid_from`/`valid_until`;
   - descarta quando `passport_country_code` não bate com o passaporte principal;
   - resolve o escopo (`global`, `each_country`, `group`, `country`);
   - aplica a condição de estação.
3. **Persistência** —
   [trip-persistence.ts](src/features/trips/trip-persistence.ts)
   `resolveChecklist()` é o ponto único de entrada; a criação usa o resultado
   inteiro ([trip-preparing.tsx](src/app/trip-preparing.tsx)) e a edição compara
   com o gravado via `diffTripRequirements` ([trip-edit.tsx](src/app/trip-edit.tsx)).

O passaporte principal **já circula** por esse caminho:
`usePassports().primary?.country_code ?? null` → `ChecklistInput.passportCountryCode`
→ `TripContext.passportCountryCode`. E `requirement_templates` já tem a coluna
`passport_country_code`, usada hoje pelo template `emergency-contacts` (BR).

**Conclusão: o motor já é sensível ao passaporte.** O que falta não é o gancho —
é a fonte de dados por par (passaporte, destino).

### 1.5 Por que os templates atuais não bastam

A coluna `requirement_templates.passport_country_code` resolve "esta regra vale
para quem tem passaporte X". Ela **não** resolve "a regra depende da combinação
X + destino Y". Modelar visto só com templates significaria uma linha de
template por par (BR→JP, BR→CN, BR→US...): ~200 linhas por passaporte, com
título, descrição, prioridade e categoria repetidos, e a fonte oficial misturada
com o texto de apresentação.

Isso quebra dois princípios do projeto: evita duplicação de lógica, e "adicionar
PT deve ser só adicionar dados". Com templates por par, adicionar PT seria
duplicar 200 templates.

**Daí a proposta: separar o fato da apresentação.**

### 1.6 Estado da árvore de trabalho

Há alterações não commitadas em `requirement-matching.ts`, `requirement-matching.test.ts`
e `AGENTS.md` (ordenação por prioridade dentro da seção + a regra de nunca
assumir passaporte brasileiro). Não conflitam com esta feature, mas convém
commitar antes de começar.

---

## 2. Arquitetura proposta

### 2.1 Princípio central

Separar duas coisas que hoje o enunciado trata como uma:

| Camada           | Responde                                    | Onde mora                        |
| ---------------- | ------------------------------------------- | -------------------------------- |
| **Fato**         | "Brasileiro precisa de visto para a China?" | `visa_rules` (nova)              |
| **Apresentação** | "Como isso vira um item de checklist?"      | `requirement_templates` (existe) |

O fato é dado de referência com fonte oficial, validade e observação. A
apresentação é texto, prioridade e categoria — decisão de produto, escrita uma
vez por tipo de resultado.

Adicionar Portugal = inserir linhas em `visa_rules` com
`passport_country_code = 'PT'`. Zero templates novos, zero código novo.

### 2.2 Entidades e relacionamento

```
profiles ──< passports (is_primary)
                 │ country_code
                 │
                 ▼
           visa_rules ─────────────► requirement_templates
     (passport_country_code,          (scope = 'visa',
      destination_country_code,        visa_requirement_type = ...)
      requirement_type,                       │
      source_name, source_url,                │
      valid_from, valid_until,                │
      verified_at, notes)                     │
                 ▲                            │
                 │ destination_country_code   │
                 │                            ▼
trips ──< trip_countries ──────────► trip_requirements
                                     (template_id, country_code,
                                      source_name, source_url)
```

O casamento entre `visa_rules` e `requirement_templates` é por
`requirement_type` — não há FK entre elas. É intencional: uma regra descreve o
mundo, um template descreve o app. Se amanhã o produto decidir que
`visa_on_arrival` vira `informational`, muda uma linha de template e nenhuma
regra.

### 2.3 O novo escopo `visa`

Adicionar o valor `'visa'` ao enum `requirement_scope`, e a coluna
`requirement_templates.visa_requirement_type`.

Um template de escopo `visa` significa: _"para cada país da viagem cuja regra de
visto, com o passaporte principal do viajante, seja deste tipo, gere um item"_.

No motor, isso é um novo `case` em `targetsFor()` — a única alteração de lógica
da feature inteira:

```ts
case 'visa': {
  const type = template.visaRequirementType;
  return tripCountries
    .filter((code) => visaRuleFor(passport, code)?.requirementType === type)
    .map((code) => ({ countryCode: code, group: null, seasonCountries: [code] }));
}
```

Tudo o mais vem de graça, porque já está construído:

- o marcador `{country}` no título;
- o filtro por `valid_from`/`valid_until` do template;
- a condição de estação (irrelevante para visto hoje, mas gratuita);
- `diffTripRequirements` — mudar de destino recalcula os vistos;
- `groupRequirementsByScope` — o item de visto cai na seção do país;
- `computeTripProgress` — a prioridade do template decide se bloqueia a viagem;
- o índice único que impede duplicar o item;
- a cascata que remove o item quando o país sai da viagem.

### 2.4 Onde a fonte oficial aparece

`visa_rules` guarda `source_name`, `source_url`, `verified_at` e `notes`. Para o
usuário ver o link oficial na checklist, esses dados precisam chegar em
`trip_requirements`. Duas opções:

|              | Snapshot em `trip_requirements`                                              | Join em tempo de leitura                                          |
| ------------ | ---------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Como         | 2 colunas novas, preenchidas na geração                                      | tela consulta `visa_rules` ao abrir                               |
| Coerente com | "`trip_requirements` é o snapshot da checklist" — já é a filosofia do schema | dados sempre atuais                                               |
| Custo        | 2 colunas nullable                                                           | join extra, e o item precisaria carregar o par (passaporte, país) |

**Decidido: snapshot.** É a filosofia já adotada (o título do item também é
snapshot — `{country}` já vem resolvido). E a atualização de regras tem um plano
próprio (seção 7).

**A fonte aparece na tela** (decisão 3). Não é um extra: mostrar de onde veio a
informação é o que torna a regra verificável pelo usuário, e é coerente com a
proibição de inventar dados. Isso promove a exibição do link de opcional a
**parte do MVP** — ver Etapa 6 na seção 10.

### 2.5 O que muda em código

| Arquivo                   | Mudança                                                                                                                              |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `requirement-matching.ts` | tipo `VisaRule`, campo `visaRules` no catálogo, `case 'visa'` em `targetsFor()`, `source_name`/`source_url` em `ResolvedRequirement` |
| `requirement-catalog.ts`  | carregar `visa_rules` filtrado por passaporte + países                                                                               |
| `trip-persistence.ts`     | passar `passportCountryCode` ao serviço (hoje ele não recebe)                                                                        |
| `types/database.ts`       | tipos de `visa_rules`, novo enum, novas colunas                                                                                      |
| `types/models.ts`         | aliases `VisaRule`, `VisaRequirementType`                                                                                            |
| Telas                     | nenhuma mudança obrigatória; link da fonte é opcional                                                                                |

Nenhum arquivo novo de lógica. Nenhuma abstração nova.

---

## 3. Alterações no banco

Três migrations, na ordem: schema → RLS/grants → seed.

### 3.1 Novo tipo `visa_requirement_type`

```sql
create type public.visa_requirement_type as enum (
  'visa_free',
  'visa_required',
  'evisa',
  'eta',
  'visa_on_arrival',
  'conditional'
);
```

Os seis tipos entram no enum agora — adicionar valor a enum depois é barato, mas
ter o vocabulário fechado desde o início evita que a coleta de dados invente
categorias. **Nem todos geram item no MVP** (seção 7).

### 3.2 Nova tabela `visa_rules`

| Campo                       | Tipo                    | Nulo    | Finalidade                                               |
| --------------------------- | ----------------------- | ------- | -------------------------------------------------------- |
| `id`                        | `uuid` PK               | não     | chave                                                    |
| `passport_country_code`     | `text`                  | não     | ISO-3166-1 alpha-2 do passaporte. `check ~ '^[A-Z]{2}$'` |
| `destination_country_code`  | `text`                  | não     | ISO-3166-1 alpha-2 do destino. Mesmo check               |
| `requirement_type`          | `visa_requirement_type` | não     | o fato                                                   |
| `source_name`               | `text`                  | **não** | nome do órgão oficial                                    |
| `source_url`                | `text`                  | **não** | URL da fonte oficial                                     |
| `verified_at`               | `date`                  | **não** | quando um humano conferiu a fonte                        |
| `notes`                     | `text`                  | sim     | condição/observação. Obrigatório quando `conditional`    |
| `valid_from`                | `date`                  | sim     | início de vigência, quando a fonte informa               |
| `valid_until`               | `date`                  | sim     | fim de vigência, quando aplicável                        |
| `created_at` / `updated_at` | `timestamptz`           | não     | auditoria; `updated_at` por trigger                      |

```sql
create table public.visa_rules (
  id uuid primary key default gen_random_uuid(),
  passport_country_code text not null check (passport_country_code ~ '^[A-Z]{2}$'),
  destination_country_code text not null check (destination_country_code ~ '^[A-Z]{2}$'),
  requirement_type public.visa_requirement_type not null,
  source_name text not null check (length(btrim(source_name)) > 0),
  source_url text not null check (source_url ~ '^https://'),
  verified_at date not null,
  notes text,
  valid_from date,
  valid_until date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint visa_rules_pair_unique
    unique (passport_country_code, destination_country_code),
  constraint visa_rules_period_check check (
    valid_from is null or valid_until is null or valid_until >= valid_from
  ),
  constraint visa_rules_not_self check (
    passport_country_code <> destination_country_code
  ),
  constraint visa_rules_conditional_needs_notes check (
    requirement_type <> 'conditional' or length(btrim(coalesce(notes, ''))) > 0
  )
);

```

**Correção feita na Etapa 1:** o plano previa aqui um
`create index visa_rules_lookup_idx (passport_country_code,
destination_country_code)`. Ele foi descartado por ser **redundante** — a
constraint `visa_rules_pair_unique` já cria um índice btree exatamente sobre
esse par, nessa ordem, e ele cobre o único padrão de consulta da feature
(igualdade no passaporte, `in` nos destinos). Um segundo índice idêntico seria
pago em toda escrita e nunca escolhido pelo planejador.

Decisões que valem explicação:

- **`source_name`, `source_url` e `verified_at` são `not null`.** É a tradução em
  schema da regra "não inventar dados": não existe regra de visto sem fonte
  oficial e sem data de conferência. As tabelas do catálogo deixam essas colunas
  nulas porque itens como "montar a lista de bagagem" não têm fonte oficial —
  aqui, todos têm.
- **`unique (passport, destination)`** — uma regra vigente por par. Alternativa
  seria permitir histórico com `valid_from`, mas isso é versionamento, que a
  seção 7 recomenda não construir agora.
- **`visa_rules_not_self`** — o próprio país do passaporte nunca gera regra.
- **`conditional` exige `notes`** — sem a condição escrita, o tipo é inútil ao
  usuário.
- **Sem FK para `countries`** — o app não tem tabela de países; a fonte única é
  `src/constants/countries.ts`, e o schema já valida por regex em toda parte.

### 3.3 Alterações em `requirement_templates`

```sql
alter type public.requirement_scope add value 'visa';

alter table public.requirement_templates
  add column visa_requirement_type public.visa_requirement_type;

alter table public.requirement_templates
  add constraint requirement_templates_visa_scope_check check (
    (scope = 'visa') = (visa_requirement_type is not null)
  );
```

O check amarra os dois: escopo `visa` exige o tipo, e o tipo só existe em escopo
`visa`. Impede um template `global` com tipo de visto pendurado.

> **Cuidado operacional:** `alter type ... add value` não pode rodar dentro do
> mesmo bloco de transação que usa o valor novo, no Postgres. A migration precisa
> separar o `add value` das inserções que o utilizam — na prática, duas
> migrations, ou `add value` em migration própria antes do seed.

### 3.4 Alterações em `trip_requirements`

```sql
alter table public.trip_requirements
  add column source_name text,
  add column source_url text;
```

Nulos em todo item que não vem de regra de visto — que é a maioria. Preenchidos
no snapshot pela geração da checklist.

### 3.5 Contagem de objetos novos

Uma tabela, um tipo, três colunas. Nada além disso.

---

## 4. Fluxo da feature

### 4.1 Fluxo completo

```
Usuário
  └─ passports (is_primary = true)          → passportCountryCode = 'BR'
       │
       ▼
    trips                                   → start_date, end_date
       └─ trip_countries                    → ['JP', 'CN', 'PT']
            │
            ▼
    visa_rules  where passport = 'BR'       → JP: visa_free
                  and destination in (...)     CN: visa_required
                                               PT: visa_free
            │
            ▼
    requirement_templates  scope = 'visa'   → template de visa_required
                                               template de visa_free
            │
            ▼
    resolveTripRequirements()               → 1 item para CN (obter visto)
                                               2 itens informativos (JP, PT)
            │
            ▼
    trip_requirements                       → gravados, com country_code
                                               e source_url
            │
            ▼
    groupRequirementsByScope()              → item de CN na seção "China"
    computeTripProgress()                   → o item de CN é required,
                                               entra no "pronta para viajar"
```

### 4.2 Ponto de entrada — criação da viagem

`trip-preparing.tsx` já lê `usePassports().primary` e passa
`passportCountryCode` para `resolveChecklist()`. **Nenhuma mudança de tela.** O
que muda é que `requirementCatalogService.loadForCountries()` passa a receber
também o passaporte, para carregar as regras.

Assinatura sugerida:

```ts
loadForTrip(countryCodes: readonly string[], passportCountryCode: string | null)
```

Quando `passportCountryCode` é `null`, nenhuma regra é carregada e nenhum item
de visto é gerado — o comportamento seguro, e o mesmo que o motor já faz hoje
com templates restritos a passaporte.

### 4.3 Ponto de entrada — edição da viagem

`trip-edit.tsx` já passa `primary?.country_code`. `updateTripWithDestinations()`
recalcula a checklist inteira e aplica só a diferença. Adicionar um país passa a
adicionar também o item de visto daquele país; remover o país leva o item junto
pela cascata da FK composta.

### 4.4 Quando não há regra cadastrada

Se `visa_rules` não tem linha para (BR, XX), **nenhum item de visto é gerado** e
o template existente `country-entry-requirements` ("Conferir as exigências de
entrada — {country}", `required`/`documents`) continua cobrindo o país.

Isso é deliberado: o item genérico é a rede de segurança para dados ausentes, e
por isso o MVP **não** precisa de cobertura mundial de regras. Silêncio nunca é
lido como "não precisa de visto".

---

## 5. Plano de dados para BR

### 5.1 Escopo da carga inicial

**Não cadastrar os ~195 países de uma vez.** Escopo decidido (decisão 5): os **47 países
que já têm sugestão de cidade** em `src/constants/cities.ts` —
AE, AR, AT, AU, BE, BR, CA, CH, CL, CN, CO, CZ, DE, DK, EG, ES, FI, FR, GB, GR,
HR, HU, ID, IE, IL, IN, IS, IT, JP, KR, MA, MX, NL, NO, NZ, PE, PL, PT, RO, SE,
SG, TH, TR, US, UY, VN, ZA (menos BR, que a constraint `not_self` exclui: **46
regras**).

Esses são exatamente os destinos que o app já trata como principais, então a
cobertura percebida é alta com esforço contido, e o item genérico cobre o resto.

### 5.2 Fontes — hierarquia obrigatória

**Fonte primária (obrigatória, é ela que autoriza a linha existir):** o órgão
oficial de imigração ou o ministério das relações exteriores **do país de
destino**. É quem define a regra e quem responde por ela.

**Fonte corroborativa (recomendada, não substitui a primária):** Portal Consular
do Ministério das Relações Exteriores do Brasil (gov.br/mre). Serve para
detectar divergência, não para fundamentar a linha.

**Proibido como fonte:** blogs, agências de viagem, comparadores de visto,
Wikipédia, mapas de "visa requirements" de terceiros, e qualquer resposta gerada
por modelo de linguagem sem conferência humana na página oficial.

`source_url` deve apontar para a **página específica de requisitos de entrada**,
não para a home do órgão. `source_name` deve nomear o órgão, no formato já usado
no seed do catálogo (ex.: `'Comissão Europeia — Espaço Schengen'`).

### 5.3 Procedimento de coleta

Para cada um dos 46 destinos:

1. Abrir a página oficial de requisitos de entrada do país de destino e
   localizar a informação para **portadores de passaporte brasileiro comum**
   (não diplomático, não oficial).
2. Classificar em um dos seis tipos. Se a página não permitir classificação sem
   ambiguidade, o tipo é `conditional`, com a condição transcrita em `notes` —
   **nunca chutar entre `visa_free` e `visa_required`**.
3. Registrar `source_name`, `source_url` e `verified_at` (a data da conferência).
4. Preencher `valid_from` **apenas** se a fonte declarar a data de entrada em
   vigor. Sem data explícita, fica nulo — a mesma regra já aplicada ao seed de
   `destination_group_members`.
5. Conferir contra o Portal Consular do MRE. **Divergência entre as duas fontes
   bloqueia a linha**: não cadastrar, e registrar o caso para decisão.
6. `notes` em português, uma frase, orientada à ação — o texto pode chegar ao
   usuário como descrição do item.

### 5.4 Validação antes de aplicar a migration

Checklist de revisão do seed, antes do merge:

- [ ] toda linha tem `source_url` oficial que abre e mostra a informação citada;
- [ ] toda linha tem `verified_at` da conferência real, não a data da migration;
- [ ] nenhum `source_url` é home page, PDF sem data, ou domínio não governamental;
- [ ] todo `conditional` tem `notes` que descreve a condição;
- [ ] nenhum `valid_from` estimado;
- [ ] casos de dúvida ficaram **fora** do seed, não entraram como `visa_free`;
- [ ] o seed é idempotente, com `on conflict ... do update` sobre o par
      (passaporte, destino), para reexecução ser segura.

### 5.5 O que este plano deliberadamente não faz

Não lista quais países exigem visto de brasileiros. Essa lista é o produto da
coleta descrita acima, feita contra fontes oficiais por uma pessoa, e inventá-la
aqui seria exatamente o risco que o enunciado manda evitar.

---

## 6. Plano futuro para outros passaportes

### 6.1 O que adicionar Portugal exige

```sql
insert into public.visa_rules (
  passport_country_code, destination_country_code, requirement_type,
  source_name, source_url, verified_at
) values
  ('PT', 'JP', 'visa_free', '...', 'https://...', date '...'),
  ('PT', 'CN', 'visa_free', '...', 'https://...', date '...'),
  ...
```

**Uma migration de seed. Zero linhas de TypeScript. Zero mudança de schema.**

O motor já filtra por `trip.passportCountryCode`; os templates de escopo `visa`
já são agnósticos de nacionalidade; a tela já lê o passaporte principal. Adicionar
um passaporte é adicionar dados, e essa é a verificação de que a arquitetura da
seção 2 está certa.

### 6.2 O único ajuste de produto que a expansão pede

Hoje o motor gera `null` quando não há regra, e o item genérico cobre. Com
vários passaportes, vale medir a cobertura: um usuário com passaporte argentino
veria zero item de visto e poderia interpretar a ausência como "não preciso".
Mitigação, quando isso passar a importar: um item `informational` de escopo
`each_country` condicionado a **não existir** regra — mas isso é lógica nova, e
fica explicitamente fora do MVP.

### 6.3 Dupla nacionalidade

`passports` já permite múltiplos passaportes, e a regra do produto é usar o
principal. Escolher o melhor passaporte por destino (ex.: usar o PT para entrar
na UE e o BR para o Mercosul) é uma feature de produto interessante e
**totalmente fora do escopo aqui** — mas a arquitetura suporta, porque
`visa_rules` é indexada pelo par e nada impede consultar dois passaportes. Não
implementar agora.

---

## 7. Integração com a checklist

### 7.1 Templates de escopo `visa` — definido

Um template por tipo que gera item. Todos em `category = 'documents'`.

| Tipo              | Gera item no MVP? | `code`             | Título                                                     | Prioridade      |
| ----------------- | ----------------- | ------------------ | ---------------------------------------------------------- | --------------- |
| `visa_required`   | **sim**           | `visa-required`    | `Solicitar o visto de entrada — {country}`                 | `required`      |
| `evisa`           | **sim**           | `visa-evisa`       | `Solicitar o visto eletrônico (e-Visa) — {country}`        | `required`      |
| `eta`             | **sim**           | `visa-eta`         | `Solicitar a autorização eletrônica de viagem — {country}` | `required`      |
| `visa_on_arrival` | **sim**           | `visa-on-arrival`  | `Preparar o visto na chegada — {country}`                  | `recommended`   |
| `visa_free`       | **sim**           | `visa-free`        | `Entrada sem visto — {country}`                            | `informational` |
| `conditional`     | **não** no MVP    | `visa-conditional` | `Confirmar as condições de entrada — {country}`            | `required`      |

As prioridades de `visa_on_arrival` e `visa_free` foram confirmadas (decisões 1
e 2); o porquê fica registrado abaixo.

Descrição de cada item: `notes` da regra quando houver, senão a descrição do
template. Assim a observação oficial ("permanência de até 90 dias para turismo")
chega ao usuário sem virar coluna nova.

### 7.2 As decisões e o porquê

**`visa_on_arrival` como `recommended`, não `required`** (decisão 2, confirmada).
`required` é o que decide se a viagem está pronta (`computeTripProgress`). Um
visto emitido no balcão do aeroporto não pode ser concluído antes de viajar;
marcá-lo `required` deixaria toda viagem para esses destinos permanentemente
"não pronta". O que o viajante _pode_ fazer antes é preparar foto, taxa e
comprovantes — e isso é `recommended`. A descrição do item deve deixar claro que
o visto é emitido na chegada, para o usuário não procurar onde solicitar antes.

**`visa_free` como `informational`** (decisão 1, confirmada). Não contribui para
o progresso (`computeTripProgress` ignora informativos), então não polui a
barra, e dá ao usuário a confirmação positiva que ele foi buscar — coerente com
o tom do produto, que evita mensagens negativas e sempre indica o próximo passo.
A alternativa, não gerar item nenhum, deixaria o usuário abrir a checklist sem
encontrar resposta sobre visto.

**`conditional` fora do MVP.** O tipo existe no enum e a coluna aceita, mas o
template não é semeado agora. Motivo: um item "confirmar as condições" só é útil
se `notes` estiver muito bem escrito, e isso depende da qualidade da coleta.
Ativar depois é inserir **uma linha** de template — sem código.

### 7.3 A sobreposição com `country-entry-requirements`

O template `country-entry-requirements` já gera, hoje, um item `required` por
país: _"Conferir as exigências de entrada — {country}"_. Com a feature, um país
como o Japão passaria a ter **dois** itens na mesma seção:

```
Japão
  ☐ Conferir as exigências de entrada — Japão      (required)
  ☐ Entrada sem visto — Japão                      (informational)
```

Três caminhos:

| Opção                                  | Efeito                                                                                                    | Avaliação                                                                      |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| **A. Manter os dois**                  | O genérico cobre vacina, comprovante de fundos, passagem de saída — coisas que a regra de visto não cobre | **Decidido.** Sem código novo, e o genérico é a rede de segurança da seção 4.4 |
| B. Suprimir o genérico quando há regra | Checklist mais limpa                                                                                      | Exige lógica nova no motor e perde a cobertura de não-visto                    |
| C. Rebaixar o genérico a `recommended` | Reduz peso no progresso                                                                                   | Enfraquece um item que hoje é a única garantia de conferência                  |

**Decidido: A** (decisão 3), com um ajuste barato de texto — reescrever a
descrição do genérico para deixar claro que ele trata do _restante_ das
exigências (vacinas, comprovantes, passagem de retorno). É um `update` de uma
linha no seed.

A mesma decisão trouxe junto que **a fonte oficial precisa aparecer na tela**.
Isso desfaz boa parte do incômodo dos dois itens lado a lado: o item de visto
deixa de ser uma afirmação solta e passa a ser uma resposta com origem citada,
enquanto o genérico continua sendo o convite a conferir o resto. Detalhe de
implementação na Etapa 6.

### 7.4 Exemplo completo

Viagem: Brasil → China + Japão, passaporte principal BR.

```
visa_rules:  BR→CN = visa_required   BR→JP = visa_free
                 │                        │
                 ▼                        ▼
trip_requirements:
  country_code='CN'  "Solicitar o visto de entrada — China"     required
                     source_url = <órgão oficial chinês>        ← exibido
  country_code='JP'  "Entrada sem visto — Japão"                informational
                     source_url = <órgão oficial japonês>       ← exibido
  country_code='CN'  "Conferir as exigências de entrada — China" required
  country_code='JP'  "Conferir as exigências de entrada — Japão" required
  (+ os globais: passaporte válido, seguro, bagagem...)
```

O item da China entra no cálculo de "pronta para viajar"; o do Japão não altera
o progresso. É exatamente o comportamento descrito no AGENTS.md.

---

## 8. RLS e segurança

### 8.1 `visa_rules` é dado de referência público (para autenticados)

Mesma natureza de `requirement_templates` e `destination_groups`: todo usuário
autenticado lê as mesmas linhas, e ninguém escreve pelo app. A escrita acontece
por migration, executada pelo dono das tabelas, que não passa pelas policies.

**As regras de visto não são dado pessoal.** "Brasileiros precisam de visto para
a China" é informação pública de governo. Não há nada a proteger no conteúdo —
o que se protege é a _integridade_: o cliente não pode alterar a regra.

```sql
alter table public.visa_rules enable row level security;

create policy "visa_rules_select_authenticated"
  on public.visa_rules for select to authenticated
  using (true);

revoke insert, update, delete on public.visa_rules from authenticated;
grant select on public.visa_rules to authenticated;
```

**O `revoke` é obrigatório, não decorativo.** A migration
`20260905120200_table_grants.sql` deixou um `alter default privileges` que
concede INSERT/UPDATE/DELETE a `authenticated` em **toda tabela nova** do schema
`public`. Sem o `revoke`, `visa_rules` nasceria gravável no nível de privilégio —
o RLS ainda barraria por falta de policy de escrita, mas o catálogo não deve
depender de uma só camada. É exatamente o cuidado que
`20260906120100_requirement_catalog_rls.sql` já documenta.

### 8.2 Nada para `anon`

O app não tem tela pública. Nenhum grant para `anon`, seguindo o padrão de todas
as migrations existentes.

### 8.3 `trip_requirements` — sem mudança

As duas colunas novas (`source_name`, `source_url`) entram em tabela já coberta
por policies `is_trip_owner(trip_id)` em SELECT/INSERT/UPDATE/DELETE. Colunas
novas herdam a policy da tabela. **Nenhuma policy nova.**

### 8.4 `passports` — sem mudança

O passaporte principal é lido no cliente, pelo próprio dono, sob
`passports_select_own`. A resolução da checklist acontece no app com dados que o
usuário já pode ver. Nenhuma travessia de fronteira de segurança nova.

### 8.5 Superfície de ataque

O pior caso é um usuário autenticado enumerar `visa_rules` inteira. Isso é
informação pública de governo, com a fonte citada na própria linha. **Não é
risco.**

---

## 9. Impedimentos e bloqueios

### Bloqueador

**Não foram identificados bloqueadores técnicos.**

O único bloqueador é de processo, não de código:

- **A coleta de dados oficiais precisa acontecer antes do seed, por uma pessoa.**
  Nenhuma parte da implementação depende dela — schema, motor e templates podem
  ser construídos e testados com dados de teste. Mas a feature não vai a produção
  com dados não conferidos, e nenhum agente deve gerar essa lista.
  _Classificação: bloqueador de release, não de implementação._

### Importante

- **Trocar o passaporte principal não recalcula viagens existentes.** A checklist
  só é recalculada na criação e na edição da viagem. Um usuário que cadastra o
  passaporte português e o promove a principal continua vendo os itens de visto
  do passaporte brasileiro nas viagens já criadas. Hoje isso quase não aparece
  (só o template `emergency-contacts` depende do passaporte); com a feature,
  passa a ser visível e errado. **Decidido** (decisão 4): reconciliar na
  promoção do passaporte, poupando as viagens concluídas — Etapa 7.

- **`alter type ... add value` e transação.** O valor `'visa'` no enum
  `requirement_scope` não pode ser usado na mesma transação em que é criado.
  Exige separar em migrations. É conhecido e resolvido por ordenação — mas
  descobrir isso durante o deploy custa caro.

### Pode ser resolvido durante a implementação

- **`requirementCatalogService.loadForCountries` não recebe o passaporte.**
  Assinatura muda para incluí-lo. Dois chamadores, ambos já têm o dado em mãos.

- **`src/types/database.ts` é mantido à mão.** Precisa das definições de
  `visa_rules`, do novo enum e das colunas novas. O arquivo documenta o comando
  de regeneração; regenerar é preferível a editar.

- **`primary` pode ser `null` em teoria.** O motor já trata (`passportCountryCode:
null` → nenhuma regra de visto). Na prática o onboarding garante que existe.

- **Cobertura parcial de dados** (46 de ~195 países). Mitigado por desenho: sem
  regra, o item genérico cobre o país. Ampliar é inserir linhas.

- **Alterações não commitadas na árvore de trabalho.** Commitar antes de começar.

### Não é impedimento

- **Identificar o passaporte principal** — resolvido, com índice único parcial no
  banco e regras no contexto (seção 1.2).
- **Requisitos hardcoded no frontend** — já migrados. `checklist-catalog.ts` só
  tem rótulos e ícones.
- **`requirement_templates` / `destination_groups`** — existem, com seed e RLS.
- **Geração da checklist** — o motor é puro, testado e já sensível a passaporte,
  data e estação. Recebe um `case` novo.
- **RLS** — o padrão para dado de referência já existe e é replicado tal e qual.
- **Remoção de país da viagem** — a cascata da FK composta já leva os requisitos
  daquele país, incluindo os de visto.
- **Duplicação de itens** — o índice único parcial de `trip_requirements` já
  impede.

---

## 10. Plano de implementação em etapas

Cada etapa termina com `npm check` verde e é commitável isoladamente.

### Etapa 0 — Preparação

Commitar as alterações pendentes em `requirement-matching.ts`,
`requirement-matching.test.ts` e `AGENTS.md`.

### Etapa 1 — Schema

Migration `..._visa_rules.sql`:

- tipo `visa_requirement_type`;
- tabela `visa_rules` com constraints e índice;
- trigger `set_updated_at`;
- colunas `source_name` / `source_url` em `trip_requirements`;
- `alter type requirement_scope add value 'visa'` **em migration separada**
  (restrição de transação, seção 9).

Migration `..._visa_rules_rls.sql`: policy de SELECT, `revoke` de escrita, grant
de SELECT. Nada para `anon`.

Migration `..._requirement_templates_visa_column.sql`: coluna
`visa_requirement_type` e o check que amarra escopo e tipo.

_Entregável:_ schema pronto, nenhum dado, app inalterado.

### Etapa 2 — Motor

Em `requirement-matching.ts`:

- tipo `VisaRequirementType` e `VisaRule`;
- `visaRules` em `RequirementCatalog`;
- índice interno por `destination_country_code` para a busca;
- `case 'visa'` em `targetsFor()`;
- `source_name` / `source_url` em `ResolvedRequirement`, vindos da regra;
- descrição = `notes` da regra, com fallback para a do template.

Testes em `requirement-matching.test.ts` (o padrão de fixtures já existe):

- passaporte BR + destino com `visa_required` gera o item;
- passaporte BR + destino sem regra **não** gera item de visto;
- passaporte nulo não gera item de visto;
- passaporte PT com regra própria gera item diferente do BR no mesmo destino —
  **é o teste que prova que expandir é só adicionar dados**;
- regra fora de `valid_from`/`valid_until` não gera item;
- `diffTripRequirements` remove o item de visto quando o país sai da viagem;
- o item de visto cai na seção do país em `groupRequirementsByScope`.

_Entregável:_ regra implementada e testada sem tocar em banco nem em tela.

### Etapa 3 — Carga e persistência

- `requirement-catalog.ts`: carregar `visa_rules` filtrado por
  `passport_country_code` e `destination_country_code in (países da viagem)`;
  renomear para `loadForTrip(countryCodes, passportCountryCode)`.
- `trip-persistence.ts`: repassar o passaporte ao serviço.
- `types/database.ts` e `types/models.ts`: tipos novos.
- `trip-requirements.ts`: `createMany` já usa `TripRequirementInsert`, que ganha
  os campos por regeneração de tipo — conferir.

_Entregável:_ app funcionando igual (não há regra semeada ainda), agora carregando
a tabela nova.

### Etapa 4 — Templates de apresentação

Migration de seed com os cinco templates de escopo `visa` da seção 7.1
(`conditional` fica fora). Ajuste do texto de `country-entry-requirements`
conforme a seção 7.3.

_Entregável:_ apresentação pronta. Ainda sem itens gerados, porque não há regra.

### Etapa 5 — Dados BR

**Precede a coleta humana descrita na seção 5.** Migration de seed com as regras
conferidas, idempotente, revisada contra a checklist da seção 5.4.

_Entregável:_ a feature funcionando de ponta a ponta.

### Etapa 6 — Fonte oficial na tela — **MVP** (decisão 3)

Mostrar `source_name` / `source_url` no item de visto, em
[src/app/(app)/trips/[id].tsx](<src/app/(app)/trips/[id].tsx>). O item já renderiza
`description` por volta da linha 490; o link entra logo abaixo, visível só
quando `source_url` existe — ou seja, nos itens de visto, sem alterar a
aparência de nenhum outro.

Pontos a resolver:

- abrir o link fora do app (`expo-web-browser` já é dependência do projeto, e é
  o que a tela de auth usa);
- o rótulo do link é `source_name`, não a URL crua;
- o toque no link **não pode** marcar o item como concluído — hoje a linha
  inteira é a área de toque de `toggle()`.

_Entregável:_ toda afirmação sobre visto na checklist é rastreável até o órgão
oficial que a emitiu.

### Etapa 7 — Recálculo ao trocar o passaporte principal (decisão 4)

Ao promover um passaporte a principal (`passportsService.setPrimary`, hoje
chamado por `passports-context.tsx`), reconciliar a checklist das viagens do
usuário — `resolveChecklist` + `diffTripRequirements` já fazem o trabalho, sem
lógica nova.

**Viagens concluídas não são recalculadas.** O status é derivado das datas e
nunca armazenado, então o filtro é o mesmo critério de `getTripStatus`
(`completed` ⟺ `end_date` existe e é menor que hoje). Na consulta:

```
.or(`end_date.is.null,end_date.gte.${todayISO()}`)
```

Isso alcança `upcoming` e `ongoing`, inclusive viagens sem data — que
`getTripStatus` trata como `upcoming` —, e deixa intacta a checklist de quem já
viajou. É a decisão certa: a viagem concluída é registro histórico do que a
pessoa de fato preparou, e reescrevê-la com as regras de outro passaporte
apagaria esse registro.

Dois cuidados:

- `diffTripRequirements` já preserva os itens **verificados**, então mesmo numa
  viagem futura nada que a pessoa marcou é descartado;
- a reconciliação é em lote e pode ser lenta com muitas viagens. Como acontece
  em uma ação deliberada e rara do usuário, um retorno visual em
  `passports-section.tsx` basta — não é caso para fila nem para trabalho em
  segundo plano.

_Entregável:_ a checklist deixa de mentir depois de uma troca de passaporte.

### Fora de escopo

Escolha automática do melhor passaporte por destino; versionamento histórico de
regras; regras por motivo de viagem ou por duração; painel de administração do
catálogo; importação automatizada de fontes.

---

## Decisões de produto — tomadas

Todas confirmadas. Nenhuma pergunta em aberto.

| #   | Decisão                                                      | Resultado                                               | Onde no plano     |
| --- | ------------------------------------------------------------ | ------------------------------------------------------- | ----------------- |
| 1   | `visa_free` gera item informativo                            | **Sim** — `informational`, não afeta o progresso        | 7.1, 7.2          |
| 2   | Prioridade de `visa_on_arrival`                              | **`recommended`** — não bloqueia o "pronta para viajar" | 7.1, 7.2          |
| 3   | Manter `country-entry-requirements` ao lado do item de visto | **Sim**, e **a fonte oficial aparece na tela**          | 7.3, 2.4, Etapa 6 |
| 4   | Recalcular ao trocar o passaporte principal                  | **Sim**, na promoção — **exceto viagens concluídas**    | 9, Etapa 7        |
| 5   | Escopo de dados do MVP                                       | **Sim** — os 46 destinos com cidade sugerida            | 5.1               |

A decisão 3 foi a que mais mexeu no plano: exibir a fonte deixou de ser etapa
opcional e virou parte do MVP (Etapa 6). A decisão 4 acrescentou uma restrição
que o plano original não tinha — viagem concluída é registro histórico e não se
reescreve —, hoje registrada na Etapa 7 com o filtro exato.

### Ordem de execução

Etapas 1 → 4 são independentes das decisões acima e podem começar assim que a
Etapa 0 (commit da árvore de trabalho) sair. A Etapa 5 depende da coleta humana
dos dados oficiais, que é o único bloqueador de release e pode correr em
paralelo com 1–4. As Etapas 6 e 7 fecham o MVP.

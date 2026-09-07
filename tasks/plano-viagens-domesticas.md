# Plano — viagens domésticas vs. internacionais

Bug: com passaporte principal 🇧🇷 e destino único 🇧🇷, a checklist gera
"Passaporte válido para toda a viagem" (obrigatório) e "Conferir as exigências
de entrada — Brasil". Nenhum dos dois cabe em uma viagem doméstica.

Status: **plano**. Nada implementado nesta etapa.

---

## 1. Diagnóstico

### 1.1 O que o motor produz hoje para 🇧🇷 → 🇧🇷

Percorrendo [requirement-matching.ts](src/features/trips/requirement-matching.ts)
com o catálogo real
([seed](supabase/migrations/20260906120200_requirement_catalog_seed.sql)):

| Template                     | Escopo         | Entra? | Correto para viagem doméstica?                    |
| ---------------------------- | -------------- | ------ | ------------------------------------------------- |
| `passport-validity`          | `global`       | sim    | **não** — pressupõe fronteira                     |
| `country-entry-requirements` | `each_country` | sim    | **não** — "exigências de entrada" é internacional |
| `document-copies`            | `global`       | sim    | texto cita passaporte                             |
| `travel-insurance`           | `global`       | sim    | sim                                               |
| `emergency-contacts`         | `global` (BR)  | sim    | texto cita consulado                              |
| `payment-methods`            | `global`       | sim    | sim                                               |
| `budget-plan`                | `global`       | sim    | sim                                               |
| `connectivity-plan`          | `global`       | sim    | texto cita plano internacional                    |
| `luggage-list`               | `global`       | sim    | sim                                               |
| `airline-luggage-rules`      | `global`       | sim    | sim                                               |
| `schengen-short-stay`        | `group`        | não    | — BR não é membro do grupo                        |
| `visa-*` (6 templates)       | `visa`         | não    | — ver 1.3                                         |

### 1.2 Onde exatamente o passaporte "vaza"

Em [requirement-matching.ts:376-401](src/features/trips/requirement-matching.ts#L376-L401),
`resolveTripRequirements` avalia, por template: `active`, vigência
(`valid_from`/`valid_until`), `passport_country_code` e, por alvo, `season`.

**Não existe nenhuma condição que relacione o país do passaporte aos países da
viagem.** O passaporte só é usado para dois fins:

1. filtrar templates que declaram `passport_country_code` (é uma condição de
   _nacionalidade do viajante_, não de _travessia de fronteira_);
2. indexar `visa_rules` em `visaRulesByCountry`.

`passport-validity` tem `scope = 'global'` e `passport_country_code = null`, ou
seja: **vale para toda viagem de todo viajante**. É exatamente o que o catálogo
declara hoje, e o motor está obedecendo corretamente a uma declaração
incompleta.

### 1.3 O escopo `visa` já está correto — por acidente feliz

A tabela `visa_rules` tem a constraint
[`visa_rules_not_self`](supabase/migrations/20260906130100_visa_rules.sql):

```sql
constraint visa_rules_not_self check (
  passport_country_code <> destination_country_code
)
```

Não existe nem pode existir linha `BR → BR`. Como `targetsFor` no caso `visa`
só gera alvo quando encontra regra
([requirement-matching.ts:341-353](src/features/trips/requirement-matching.ts#L341-L353)),
uma viagem 🇧🇷 → 🇧🇷 **já não gera item de visto nenhum**. O bug relatado não
inclui visto justamente por isso.

### 1.4 Causa

| Camada        | Culpada? | Por quê                                                                           |
| ------------- | -------- | --------------------------------------------------------------------------------- |
| **Catálogo**  | sim      | Nenhum template consegue dizer "só valho quando há fronteira internacional"       |
| **Matching**  | sim      | Não existe o conceito de viagem doméstica; nada compara destinos com o passaporte |
| Geração       | não      | `resolveChecklist` apenas repassa dados já corretos (países, datas, passaporte)   |
| Reconciliação | não      | `diffTripRequirements` compara chaves de origem; não julga aplicabilidade         |

**Combinação de catálogo + matching.** O vocabulário do catálogo não tem como
expressar a distinção, e o motor não tem como derivá-la. Corrigir só um dos dois
não resolve: marcar o template sem o motor avaliar não muda nada; filtrar no
motor sem marcar o template obrigaria a escrever a lista de exceções em código.

---

## 2. Solução recomendada

### 2.1 O conceito nasce derivado, no módulo puro

Uma função exportada em `requirement-matching.ts`, ao lado das demais regras de
viagem:

```ts
/**
 * A viagem acontece inteira dentro do país do passaporte principal?
 *
 * Sem passaporte principal não há como afirmar que a viagem é doméstica, e a
 * resposta é `false` — o comportamento seguro, idêntico ao de hoje.
 */
export function isDomesticTrip(
  countryCodes: readonly string[],
  passportCountryCode: string | null,
): boolean {
  if (!passportCountryCode) return false;
  const codes = unique(countryCodes);
  if (codes.length === 0) return false;
  return codes.every((code) => code === upper(passportCountryCode));
}
```

Derivado, nunca armazenado — a mesma disciplina do status da viagem
(`upcoming`/`in_progress`/`completed`) e das estações. Editar países ou trocar o
passaporte principal muda a resposta sozinho, sem migração de dados.

`resolveTripRequirements` calcula uma vez e guarda em `Resolution`; os
chamadores (`resolveChecklist`, as telas) não passam nada de novo.

### 2.2 O catálogo ganha uma condição, no mesmo formato das que já existem

`requirement_templates` já é uma lista de condições opcionais: `season`,
`passport_country_code`, `valid_from`/`valid_until`, `active`. A menor mudança
consistente é **uma condição a mais, do mesmo formato**:

```sql
create type public.trip_kind as enum ('domestic', 'international');

alter table public.requirement_templates
  add column trip_kind public.trip_kind;
```

`null` = vale para as duas (o padrão, e o que preserva todo o catálogo atual).
`'international'` = só com travessia de fronteira. `'domestic'` = só dentro do
próprio país.

No motor, uma linha ao lado das outras condições:

```ts
if (template.tripKind === 'domestic' && !isDomestic) continue;
if (template.tripKind === 'international' && isDomestic) continue;
```

### 2.3 O caso 🇧🇷 + 🇦🇷: o alvo também precisa da regra

Uma viagem BR+AR é internacional, então `passport-validity` entra — correto.
Mas `country-entry-requirements` tem escopo `each_country` e geraria
**"Conferir as exigências de entrada — Brasil"** para o próprio país do
viajante, que é onde ele não passa por imigração estrangeira.

Correção no alvo, dentro de `targetsFor`, restrita aos templates internacionais:

```ts
// Um requisito internacional não se aplica ao próprio país do viajante:
// ele não cruza fronteira ao voltar para casa.
case 'each_country':
  return tripCountries
    .filter((code) => !(template.tripKind === 'international' && code === passport))
    .map((code) => ({ ... }));
```

O escopo `country` recebe o mesmo filtro pela mesma razão. O escopo `visa` já
está coberto por `visa_rules_not_self` (1.3) e não precisa de nada.

### 2.4 Por que não as alternativas

| Alternativa                                                    | Por que não                                                                                            |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `if` de viagem doméstica dentro do motor, com lista de códigos | Move a regra do catálogo para o código; cada requisito novo exigiria editar TypeScript                 |
| Novos escopos (`each_foreign_country`, `foreign_global`)       | Multiplica o enum `requirement_scope` por dois e mistura "como a regra chega" com "quando vale"        |
| Tabela `requirement_template_trip_kinds`                       | Tabela de ligação para um valor único e excludente; as tabelas de ligação existem para cardinalidade N |
| Marcar só o texto e filtrar na tela                            | A checklist é snapshot gravado; item errado gravado é item errado no progresso e no próximo passo      |

---

## 3. Alterações necessárias

### 3.1 Migration nova — `requirement_templates.trip_kind`

`supabase/migrations/2026XXXXXXXXXX_requirement_templates_trip_kind.sql`

1. `create type public.trip_kind as enum ('domestic', 'international');`
2. `alter table public.requirement_templates add column trip_kind public.trip_kind;`
3. `comment on column` explicando que nulo = vale para as duas.
4. `update` marcando os templates internacionais (ver §4).

Cabe em **um arquivo só**: a restrição do Postgres que motivou
[20260906130000_requirement_scope_visa.sql](supabase/migrations/20260906130000_requirement_scope_visa.sql)
vale para `alter type ... add value`, não para `create type` — um tipo criado na
mesma transação pode ser usado nela.

**Sem RLS nova**: a coluna entra em tabela que já é dado de referência, com
política de leitura e `revoke` de escrita em
[requirement_catalog_rls.sql](supabase/migrations/20260906120100_requirement_catalog_rls.sql).

### 3.2 Migration opcional — limpeza das viagens já criadas

`supabase/migrations/2026XXXXXXXXXX_domestic_requirements_cleanup.sql`

As checklists já gravadas não se corrigem sozinhas: a reconciliação só roda na
edição da viagem ou na troca do passaporte principal, e mesmo então
`diffTripRequirements` **preserva itens já verificados**
([requirement-matching.ts:437-449](src/features/trips/requirement-matching.ts#L437-L449)).
Sem esta limpeza, quem já criou uma viagem BR→BR continua com o item errado.

A migration apaga, **apenas de viagens domésticas e apenas itens não
verificados**, as linhas originadas dos templates marcados como internacionais:
viagem cujo conjunto de `trip_countries` é exatamente `{país do passaporte
principal do dono}`. Respeitar `completed = false` é a mesma regra do diff — não
desfazer trabalho da pessoa.

### 3.3 [src/types/database.ts](src/types/database.ts)

- `export type TripKind = 'domestic' | 'international';` junto dos outros enums
  (linha ~22).
- `trip_kind: TripKind | null` em `requirement_templates` Row / `?` em Insert e
  Update.
- `trip_kind: TripKind` no bloco `Enums` (linha ~571, ao lado de
  `requirement_scope`).

### 3.4 [src/types/models.ts](src/types/models.ts)

Reexportar `TripKind`, como já é feito com `RequirementScope` e
`VisaRequirementType`.

### 3.5 [src/features/trips/requirement-matching.ts](src/features/trips/requirement-matching.ts)

| Ponto                                    | Alteração                                                           | Motivo                                        |
| ---------------------------------------- | ------------------------------------------------------------------- | --------------------------------------------- |
| `CatalogTemplate`                        | `tripKind: TripKind \| null`                                        | O motor precisa ler a condição nova           |
| novo `isDomesticTrip()` (exportado)      | a regra de §2.1                                                     | Ponto único do conceito, testável sem banco   |
| `Resolution`                             | `isDomestic: boolean` e `passportCountryCode: string \| null`       | Calculado uma vez, disponível em `targetsFor` |
| `resolveTripRequirements`                | duas linhas de filtro por `tripKind`                                | Onde as demais condições do template já moram |
| `targetsFor` (`each_country`, `country`) | descartar o alvo igual ao país do passaporte em regra internacional | Caso 🇧🇷+🇦🇷 (§2.3)                             |

### 3.6 [src/services/requirement-catalog.ts](src/services/requirement-catalog.ts)

`TemplateRow` ganha `trip_kind`, e o `map` passa a preencher `tripKind`. O
`select` já é `'*'` — a consulta não muda.

Opcional: em `loadForTrip`, pular `loadVisaRules` quando a viagem é doméstica —
economiza um round-trip. Não é correção (a consulta já volta vazia), é higiene;
fica como item independente.

### 3.7 [src/features/trips/requirement-matching.test.ts](src/features/trips/requirement-matching.test.ts)

Casos novos (§6). O helper `template()` ganha `tripKind: null` no default.

### 3.8 O que **não** muda, e por quê

| Arquivo                                                                                            | Por quê                                                    |
| -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| [trip-persistence.ts](src/features/trips/trip-persistence.ts)                                      | Já recebe países e passaporte; o conceito é derivado deles |
| [trip-requirements.ts](src/services/trip-requirements.ts) / `apply_requirement_diff`               | A gravação não julga aplicabilidade                        |
| [trip-preparing.tsx](src/app/trip-preparing.tsx), [trips/[id].tsx](<src/app/(app)/trips/[id].tsx>) | Consomem o resultado; não decidem nada                     |
| `trip_requirements`                                                                                | Continua sendo snapshot; nada de coluna nova               |
| `visa_rules`, `destination_groups`, tabelas de ligação                                             | Nenhuma delas descreve a natureza da viagem                |

---

## 4. Impacto no catálogo

Sim: a coluna nova, mais o `update` de marcação. A tabela em si já suporta tudo
— é o padrão "condição opcional" que `season` e `passport_country_code`
inauguraram.

### 4.1 Marcação recomendada

| Template                     | `trip_kind`     | Motivo                                                                                      |
| ---------------------------- | --------------- | ------------------------------------------------------------------------------------------- |
| `passport-validity`          | `international` | **A causa direta do bug**: passaporte é documento de fronteira                              |
| `country-entry-requirements` | `international` | **A segunda causa**: "exigências de entrada" pressupõe imigração                            |
| `schengen-short-stay`        | `international` | Nenhum passaporte torna Schengen doméstico hoje; explicitar protege regras de grupo futuras |
| `visa-*` (6 templates)       | `international` | Redundante com `visa_rules_not_self`, mas declara a intenção                                |
| demais 8 templates           | `null`          | Seguro, dinheiro, bagagem, orçamento e conectividade valem nas duas                         |

### 4.2 Três textos que citam contexto internacional — decisão sua

Não são o bug e mudá-los é reescrever requisito, não corrigir aplicabilidade.
Registro para decisão explícita:

- `document-copies` — "Deixe **passaporte** e reservas acessíveis mesmo sem
  internet."
- `emergency-contacts` — "**Consulado**, seguradora e um contato no Brasil." (já
  restrito a `passport_country_code = 'BR'`)
- `connectivity-plan` — "**Plano internacional**, eSIM ou chip local."

Opções: (a) deixar como estão — aparecem em viagem doméstica com texto levemente
fora de contexto; (b) marcar como `international` — somem da viagem doméstica,
mas "guardar cópias dos documentos" é bom conselho em qualquer viagem; (c)
reescrever os textos para servirem às duas. **Recomendo (a)** para esta correção
e tratar o texto em tarefa própria, se incomodar.

### 4.3 Lacuna documentada — documento de identificação doméstico

**Não existe no catálogo nenhum requisito de documento para viagem doméstica.**
Depois desta correção, uma viagem 🇧🇷 → 🇧🇷 fica **sem nenhum item de
documento** — o que é melhor que um item errado, mas ainda é uma lacuna.

O requisito conceitualmente correto seria "documento de identificação válido
para o embarque", que no Brasil é regido pela ANAC. **Não estou criando essa
regra aqui**: ela precisa de fonte oficial conferida por uma pessoa, exatamente
como foi feito para os vistos em [coleta-vistos-br.md](tasks/coleta-vistos-br.md).

Quando houver fonte, a regra entra **sem nenhuma lógica nova**: uma linha de
`requirement_templates` com `trip_kind = 'domestic'`,
`passport_country_code = 'BR'`, `category = 'documents'`, `source_name`/
`source_url` da ANAC. É a prova de que a solução é a certa: representar o
requisito doméstico passa a ser inserir dado, não escrever código.

---

## 5. Impacto em `visa_rules`

**Nenhuma alteração de dados nem de schema.**

- A constraint `visa_rules_not_self` **já garante** que não existe regra
  `BR → BR`. Uma viagem 🇧🇷 → 🇧🇷 não gera item de visto hoje e não geraria
  mesmo sem esta correção.
- `visaRulesByCountry` indexa por destino; sem linha para BR, o mapa não tem a
  chave, e `targetsFor` no caso `visa` devolve `[]`.
- Em 🇧🇷 + 🇦🇷, as regras continuam sendo consultadas normalmente para AR. O BR
  simplesmente não tem par correspondente.
- A marcação `international` nos templates `visa-*` (§4.1) é **declarativa**:
  não muda comportamento, documenta a intenção e protege caso a constraint mude.

Confirmado: **🇧🇷 → 🇧🇷 não consulta nem gera regra de visto**, antes e depois
da correção.

---

## 6. Testes

Todos em [requirement-matching.test.ts](src/features/trips/requirement-matching.test.ts),
com `node --test`, sem banco.

### 6.1 `isDomesticTrip` — a regra isolada

| Caso                                      | Esperado              |
| ----------------------------------------- | --------------------- |
| passaporte BR, destino [BR]               | `true`                |
| passaporte BR, destino [AR]               | `false`               |
| passaporte BR, destinos [AR, UY]          | `false`               |
| passaporte BR, destinos [BR, AR]          | `false`               |
| passaporte PT, destino [PT]               | `true`                |
| passaporte PT, destino [BR]               | `false`               |
| passaporte `null`, destino [BR]           | `false`               |
| destinos [] (viagem sem país)             | `false`               |
| passaporte `'br'` minúsculo, destino [BR] | `true` (normalização) |
| destinos [BR, BR] duplicados              | `true`                |

### 6.2 `resolveTripRequirements` — o efeito na checklist

1. **BR → BR não gera requisito internacional**: template `international` +
   template sem marcação → só o segundo entra.
2. **BR → BR gera requisito doméstico**: template `domestic` entra; o
   `international` não.
3. **BR → AR gera os internacionais**: `international` entra, `domestic` não.
4. **BR → [BR, AR] é internacional**: o `international` de escopo `global` entra
   **uma vez**.
5. **BR → [BR, AR], escopo `each_country` internacional**: gera item para AR e
   **não** para BR (§2.3).
6. **BR → [BR, AR], escopo `each_country` sem marcação**: gera para os dois — a
   marcação é o que exclui, não o escopo.
7. **PT → PT é doméstica**: a regra não é sobre o Brasil.
8. **Sem passaporte principal, destino [BR]**: comportamento de hoje preservado
   — os `international` continuam entrando.
9. **Escopo `visa` em viagem doméstica**: com `visaRules` vazio (o que o banco
   garante), nenhum item de visto.
10. **Escopo `group` marcado `international` em viagem doméstica**: não entra
    (protege uma regra MERCOSUL futura — §7).
11. **`trip_kind` combinado com `season`**: as duas condições valem juntas; um
    template `international` + `winter` fora da estação continua fora.

### 6.3 Reconciliação

12. **Trip doméstica que ganha destino internacional**: `diffTripRequirements`
    entre o desejado antes e depois → o `international` aparece em `toInsert` e
    nada em `toRemoveIds`.
13. **Trip internacional que vira doméstica** (o país estrangeiro sai): o item
    internacional **não verificado** entra em `toRemoveIds`.
14. **O mesmo, com o item verificado**: **não** entra em `toRemoveIds` — a regra
    de preservar o que a pessoa marcou continua valendo acima desta correção.

---

## 7. Riscos e edge cases

| #   | Risco / caso                                                | Avaliação                                                                                                                                                                   |
| --- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Viagem doméstica fica sem item de documento**             | Consequência esperada; é a lacuna de §4.3. Melhor um vazio honesto que um item errado                                                                                       |
| 2   | **Checklists já gravadas continuam erradas**                | Só a migration de limpeza (§3.2) resolve; sem ela, corrige na próxima edição e apenas se o item não estiver verificado                                                      |
| 3   | **Item errado já verificado nunca sai**                     | Comportamento deliberado do diff. A limpeza também o preserva. Aceitar e documentar                                                                                         |
| 4   | **Dupla nacionalidade**                                     | O app só conhece o passaporte **principal**. Alguém com BR e PT viajando a Portugal verá a viagem como internacional. Correto para o dado disponível; fora do escopo do MVP |
| 5   | **Residente de outro país**                                 | O passaporte não diz onde a pessoa mora. Um brasileiro morando em Lisboa que viaja ao Porto verá viagem internacional. Limitação conhecida do modelo, não introduzida aqui  |
| 6   | **Territórios ultramarinos** (GF, PF, RE…)                  | ISO alpha-2 os trata como países distintos de FR: a viagem sai como internacional. Simplificação já presente em todo o app                                                  |
| 7   | **Viagem sem país**                                         | `isDomesticTrip` devolve `false` → mantém o comportamento atual                                                                                                             |
| 8   | **Troca do passaporte principal**                           | `rebuildChecklistsForPassport` já recalcula e grava atomicamente; a natureza da viagem muda junto, sem código novo                                                          |
| 9   | **Viagens concluídas**                                      | `listForRebuild` filtra por `end_date >= hoje`; não são tocadas — são registro do que já aconteceu                                                                          |
| 10  | **Regra de grupo futura (MERCOSUL) atingindo viagem BR→BR** | Coberto se o template for marcado `international`. Convenção a seguir para toda regra de grupo                                                                              |
| 11  | **Esquecer a marcação em um template novo**                 | O default (`null` = vale para as duas) é o comportamento de hoje: falha para o lado do excesso, não da omissão                                                              |
| 12  | **Normalização de código de país**                          | Comparar sem `toUpperCase` faria `'br' !== 'BR'`. `isDomesticTrip` normaliza os dois lados; o teste de §6.1 cobre                                                           |
| 13  | **`each_country` internacional em viagem doméstica**        | O template já não passa no filtro de `trip_kind`; o filtro de alvo é a segunda linha de defesa, para a viagem mista                                                         |

---

## 8. Menor mudança arquitetural

O que **não** entra: nenhum rule engine, nenhuma tabela nova, nenhuma abstração
genérica de "contexto de viagem", nenhuma coluna em `trip_requirements`, nenhuma
mudança nas telas, nos serviços de gravação ou na função
`apply_requirement_diff`.

O que entra: **uma coluna, uma função pura de dez linhas e duas linhas de
filtro** — seguindo exatamente o padrão que `season` e `passport_country_code`
já estabeleceram no catálogo. A regra continua sendo dado, não código, e o
próximo requisito doméstico entra por `insert`.

Balanço: 1 migration (+1 opcional de limpeza), 4 arquivos de código tocados, 0
arquivos criados.

---

## Plano recomendado

**Plano recomendado:** acrescentar a coluna opcional `trip_kind`
(`domestic` | `international` | nulo = ambas) a `requirement_templates` — a
mesma forma das condições `season` e `passport_country_code` que já existem —,
marcar `passport-validity`, `country-entry-requirements`, `schengen-short-stay`
e os `visa-*` como `international`, e derivar no motor puro a função
`isDomesticTrip(countryCodes, passportCountryCode)` (verdadeira quando há
passaporte principal e todos os destinos são o país dele), usada em duas linhas
de filtro em `resolveTripRequirements` e no descarte do próprio país do viajante
nos alvos `each_country`/`country` de regras internacionais. Sem passaporte
principal, nada muda. `visa_rules` não é tocada — a constraint
`visa_rules_not_self` já impede regra BR→BR. A ausência de um requisito de
documento de identificação doméstico fica registrada como lacuna, a ser
preenchida por dado com fonte oficial, sem código novo.

Aguardando aprovação antes de tocar em qualquer arquivo.

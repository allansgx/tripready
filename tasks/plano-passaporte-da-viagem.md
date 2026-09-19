# Plano — ciclo de vida do passaporte e impacto nas viagens

Documento de decisão. Nada aqui foi implementado: não há migration criada, nem
arquivo de código alterado.

Convenções deste documento:

- **[F]** fato encontrado no projeto, com o arquivo;
- **[R]** recomendação arquitetural;
- **[D]** decisão pendente.

## Decisões já tomadas

| #   | Decisão                                         | Resolução                                                                                                                                                                                 |
| --- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Viagem sem passaporte                           | **Exigir passaporte no perfil e na viagem.** A coluna nasce anulável e o estado `none` fica implementado no domínio, para relaxar depois sem migration nem retrabalho                     |
| D2  | Onde entra a escolha na criação                 | **Etapa própria, primeira das cinco**, sempre presente                                                                                                                                    |
| D3  | `passport_selected_at`                          | **Entra**                                                                                                                                                                                 |
| D4  | Versão do PostgreSQL                            | **17.6** — todos os recursos considerados estão disponíveis                                                                                                                               |
| D5  | Remover o passaporte principal havendo outros   | **Permitir**, promovendo outro automaticamente e **informando a pessoa antes e depois**. Não impedir a exclusão só por ser o principal                                                    |
| D6  | Trigger de coerência do snapshot                | **Dissolvida** pela decisão D9 — não há mais duas colunas a manter em sincronia. Análise completa em 4.6                                                                                  |
| D7  | Testes de banco e RLS                           | **Roteiro manual versionado agora + suíte automatizada como fase obrigatória** antes de o plano ser considerado concluído (Fase 11). Não fica indefinidamente para depois                 |
| D8  | Nome da seção de itens superados                | **"Não se aplicam mais"**                                                                                                                                                                 |
| D9  | Modelo de armazenamento do passaporte da viagem | **Só `passport_country_code`, chave natural, sem `passport_id` e sem chave estrangeira.** É o único desenho em que excluir um passaporte não escreve nada em `trips`. Análise em 4.1 e 13 |

**Nenhuma decisão pendente.** O plano está fechado para execução; o que resta
são os riscos aceitos da seção 13, já com mitigação definida.

---

## 1. Resumo executivo

Hoje o passaporte de uma viagem **não existe como dado**. Ele é lido da
preferência do perfil no instante em que a tela roda: `usePassports().primary`
é passado para `resolveChecklist` em `trip-preparing.tsx`, `trip-edit.tsx`,
`trips/[id].tsx` e `trips/item/[requirementId].tsx`. A mesma viagem pode ser
lida com um passaporte hoje e outro amanhã — e promover um passaporte no Perfil
**reescreve as checklists de todas as viagens não concluídas**
(`passports-context.tsx` → `rebuildChecklistsForPassport`).

O plano, no menor modelo que sustenta as regras:

1. `trips` ganha **duas** colunas: `passport_country_code` (o passaporte-base da
   viagem, que é ao mesmo tempo o snapshot histórico) e `passport_selected_at`.
   **Não há `passport_id` e não há chave estrangeira** — ver 4.1 e D9.
2. O estado do vínculo não é armazenado: sai da comparação entre o código
   gravado na viagem e os passaportes que o perfil tem agora, como o status da
   viagem sai das datas.
3. `trip_requirements` ganha `superseded_at`: o item que deixou de valer por
   troca de passaporte não é apagado nem fica indistinguível — sai do progresso
   e continua visível e explicado.
4. A troca do passaporte de uma viagem roda em **uma transação**, na função nova
   `apply_trip_passport_change`. Quem decide o que muda continua sendo
   TypeScript testável.
5. **Excluir um passaporte do perfil não escreve nada em `trips`.** Nenhuma
   viagem — concluída, em andamento ou futura — tem uma linha tocada. As
   futuras e em andamento passam a pedir revisão por derivação; as concluídas
   continuam explicadas pelo código gravado nelas.
6. `rebuildChecklistsForPassport` é **removido**. A preferência do perfil deixa
   de tocar em viagem alguma; passa a ser só o valor pré-selecionado ao criar.

A auditoria também achou **três defeitos que já existem hoje**, independentes
desta feature — item 2.5.

---

## 2. Resultado da auditoria

### 2.1. O que já existe e funciona

| Área                    | Onde                                                                                                                              | Situação                                                                                                                           |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Passaportes do usuário  | `supabase/migrations/20260905120000_init_schema.sql`, `src/services/passports.ts`, `src/features/passports/passports-context.tsx` | Tabela com `unique (user_id, country_code)` e índice único parcial de um principal por usuário. RLS por `user_id`.                 |
| Cobertura de regras     | `20260917130000_supported_passport_countries.sql`, `passports-context.hasPendingRules`                                            | Tabela de catálogo somente leitura; avisa, nunca restringe.                                                                        |
| Motor de requisitos     | `src/features/trips/domain/requirement-matching.ts`                                                                               | Puro, sem banco, com testes. Recebe `passportCountryCode` em `TripContext`.                                                        |
| Diferença da checklist  | `diffTripRequirements` + `apply_requirement_diff` (`20260906130700`)                                                              | Chave de equivalência já é `template_id \| group_id \| country_code`, nunca o texto. Aplicação atômica via RPC `security invoker`. |
| Regras de visto         | `20260906130100_visa_rules.sql`                                                                                                   | Par (passaporte, destino) com fonte, `verified_at` e vigência. Uma regra vigente por par.                                          |
| Rastreabilidade do item | `trip_requirements.template_id`, `group_id`, `visa_rule_id`, `source_name`, `source_url`                                          | O item já sabe de que template, grupo e regra veio.                                                                                |
| Status da viagem        | `src/features/trips/domain/trip-status.ts`                                                                                        | Derivado das datas, nunca armazenado. `todayISO()` usa a data local do aparelho.                                                   |
| Progresso               | `src/features/trips/domain/trip-progress.ts`                                                                                      | Centralizado; informativos fora da conta.                                                                                          |
| i18n                    | `src/i18n/messages/*.ts` + `tests/completeness.test.ts`                                                                           | pt-BR canônico; chave sem `en`/`es` quebra o `npm check`.                                                                          |
| Aviso de cobertura      | `src/features/trips/domain/visa-coverage.ts`                                                                                      | Devolve códigos, nunca texto; já exclui o país do passaporte.                                                                      |

### 2.2. A lacuna central

**[F]** Não existe nenhuma coluna, tabela ou relação que ligue uma viagem a um
passaporte, em `src/types/database.ts` nem em `supabase/migrations/*.sql`.

O passaporte entra na geração por quatro caminhos, todos lendo a preferência do
perfil no momento da execução:

| Arquivo                                        | Linha | O que faz com `primary`                                           |
| ---------------------------------------------- | ----- | ----------------------------------------------------------------- |
| `src/app/trip-preparing.tsx`                   | 36    | Gera a checklist inteira da viagem recém-criada.                  |
| `src/app/trip-edit.tsx`                        | 179   | Recalcula a checklist ao salvar a edição de destinos/datas.       |
| `src/app/(app)/trips/[id].tsx`                 | 391   | Decide quais destinos aparecem no aviso de "sem regra conferida". |
| `src/app/(app)/trips/item/[requirementId].tsx` | 145   | Filtra as ofertas de parceiros por passaporte.                    |

E um quinto, o mais grave para as novas regras:

**[F]** `passports-context.tsx`, `setPrimary` chama
`rebuildChecklistsForPassport(userId, promoted.country_code)`, que percorre
**todas** as viagens não concluídas (`tripsService.listForRebuild`) e reescreve
as checklists. É a preferência do perfil virando regra definitiva de todas as
viagens. O recálculo é best-effort — o `catch` engole a falha.

### 2.3. Inconsistências de comportamento

**[F]** `diffTripRequirements` nunca remove item verificado. Bom para não perder
progresso, mas um "Solicitar o visto de entrada — China" verificado com
passaporte BR **permanece indistinguível de um item vigente** depois de uma
troca para um passaporte isento. O item não pode sumir calado, mas também não
pode continuar se apresentando como exigência.

**[F]** O item **não verificado** que deixa de valer é apagado de vez — some sem
explicação.

**[F]** Um item preservado pela chave de equivalência mantém `visa_rule_id`,
`source_name`, `source_url`, `title` e `description` do passaporte anterior.
Numa troca BR → PT em que os dois resultam `visa_free` para o mesmo destino, o
item sobrevive **apontando para a fonte oficial da regra brasileira**.

**[F]** `passports-context.removePassport` recusa remover o principal
(`passports.error.mustPromoteFirst` / `onlyOne`). Por D5, passa a permitir,
promovendo outro — mantida a recusa para o **último** passaporte, porque por D1
o perfil exige pelo menos um.

### 2.4. A regra 1.1 e o portão de onboarding — resolvido por D1

**[F]** `<Stack.Protected guard={!!session && hasPassport}>` em
`src/app/_layout.tsx` exige passaporte para entrar, e o `AGENTS.md` justifica
isso. Por **D1**, o portão fica, e a viagem passa a exigir passaporte também. O
que o plano preserva é a **porta de saída**: a coluna é anulável, o estado
`none` existe no domínio e é testado, e a tela sabe desenhá-lo. Relaxar a regra
depois é mudar validação de tela, não schema nem migration.

### 2.5. Três defeitos que existem hoje

**[F] Defeito 1 — `apply_requirement_diff` não grava `visa_rule_id`.**
`20260906130700_apply_requirement_diff.sql` insere
`trip_id, template_id, group_id, country_code, title, description, priority,
category, source_name, source_url`. A coluna `visa_rule_id` foi acrescentada
depois, em `20260915120000_trip_requirements_visa_rule.sql`, e a função nunca
foi atualizada. `ResolvedRequirement` carrega o campo, o payload chega, e a
função o descarta.

Efeito hoje: todo item de visto criado pelo caminho da **edição** de viagem
nasce com `visa_rule_id` nulo. Com isso (a) `destinationsWithoutVerifiedRule`
lista aquele destino como "sem regra conferida" mesmo tendo regra, e (b) a
leitura traduzida não acha `visa_rule_translations.notes` e cai no texto gravado
em pt-BR. Itens criados por `trip-preparing` (`createMany`) não têm o problema,
então o sintoma é intermitente.

**[F] Defeito 2 — recálculo silencioso.** O erro de
`rebuildChecklistsForPassport` é engolido; a promoção vale e as checklists ficam
com o passaporte antigo, sem aviso. Resolvido por eliminação.

**[F] Defeito 3 — `passportsService.setPrimary` faz duas escritas sem
transação.** Limpa o principal atual e depois marca o novo, em duas chamadas
PostgREST. Entre as duas, o usuário não tem principal nenhum; se a segunda
falhar, fica assim. Como o plano já vai criar uma função de passaportes para a
promoção automática de D5, cabe resolver no mesmo arquivo (6.7).

### 2.6. Segurança — estado atual

**[F]** RLS ligada em `profiles`, `passports`, `trips`, `trip_countries`,
`trip_cities`, `trip_requirements` (`20260905120100_rls_policies.sql`) e nas
tabelas de catálogo, com `revoke` de escrita. `is_trip_owner` é
`security definer`, `stable`, `set search_path = ''`, com `revoke ... from
public, anon`. `apply_requirement_diff` é `security invoker` de propósito.

**[F]** `20260905120200_table_grants.sql` deixa `alter default privileges ...
grant select, insert, update, delete on tables to authenticated`. Toda tabela
nova nasce gravável no nível de privilégio. **Este plano não cria tabela**, o
que zera essa superfície.

### 2.7. Testes e ferramentas

**[F]** `npm check` = `expo lint && tsc --noEmit && prettier --check . && npm test`.
`npm test` = `node --test "src/**/*.test.ts"`. Todos os testes são de domínio
puro. Convenção: arquivo em `<feature>/tests/*.test.ts`, importando o domínio
por **caminho relativo com extensão `.ts`** (o `node --test` não resolve o alias
`@/`).

**[F]** Não existe teste de banco, de RLS nem de migration. `functions:check`
cobre as Edge Functions com Deno. Por **D7**, isso deixa de ser aceitável ao
final: a Fase 11 é obrigatória.

**[F]** Não há React Query nem cache de dados do usuário. As telas buscam por
`useFocusEffect`/`useEffect` e guardam em `useState`. O único cache em disco é
`src/features/trips/data/catalog-cache.ts` (catálogo traduzido, 24h,
stale-while-revalidate). Não existe fila offline.

---

## 3. Modelo de domínio recomendado

### 3.1. Entidades e relações

```
profiles 1 ──── N passports        (user_id, country_code) é único
   │                 ▲
   │                 ╎ correspondência por país, resolvida na leitura
   └──── N trips ────╯  passport_country_code
            │
            ├── N trip_countries ── N trip_cities
            └── N trip_requirements ── 0..1 visa_rules
```

A linha tracejada é intencional: **não é uma chave estrangeira**. A viagem
guarda o país do passaporte-base; o perfil guarda os passaportes. Quem está
vinculado a quê é uma pergunta respondida na leitura, não uma restrição gravada.

Isso é possível porque `passports` já tem `unique (user_id, country_code)`: para
um usuário, **o país é a chave natural do passaporte**. Não há ambiguidade a
resolver com um id.

Evolução futura para passaporte por trecho: `trip_countries` ganharia a mesma
coluna, com a de `trips` virando o padrão da viagem. Nada aqui precisa ser
desfeito.

### 3.2. Estado do vínculo — derivado, não armazenado

| Situação   | `passport_country_code` | Perfil tem esse país? | Significado                                                                           |
| ---------- | ----------------------- | --------------------- | ------------------------------------------------------------------------------------- |
| `none`     | null                    | —                     | A viagem nunca teve passaporte escolhido (só dado legado ou futuro relaxamento de D1) |
| `linked`   | preenchido              | sim                   | Normal                                                                                |
| `detached` | preenchido              | não                   | O passaporte foi removido do perfil                                                   |

A derivação é local e sem consulta extra: `PassportsProvider` já carrega a lista
de passaportes do usuário para a sessão inteira.

```ts
linkState(trip, passports) =
  trip.passport_country_code === null
    ? 'none'
    : passports.some((p) => p.country_code === trip.passport_country_code)
      ? 'linked'
      : 'detached';
```

### 3.3. Quatro estados diferentes, mantidos separados

| Conceito                   | Fonte                                   | Valores                              |
| -------------------------- | --------------------------------------- | ------------------------------------ |
| Status da viagem           | datas (`trip-status.ts`)                | `upcoming` · `ongoing` · `completed` |
| Estado da checklist        | contagem dos itens (`trip-progress.ts`) | progresso, `isReady`                 |
| Vínculo com o passaporte   | 3.2                                     | `none` · `linked` · `detached`       |
| Revisão de regras pendente | **derivado dos dois primeiros**         | booleano                             |

```
needsEntryRulesReview(trip, passports) =
  linkState(trip, passports) !== 'linked' && status(trip) !== 'completed'
```

É essa linha que implementa "alterações no cadastro de passaportes afetam
somente viagens futuras e em andamento". Viagem concluída com passaporte
removido fica `detached` e **não** pede revisão — o histórico continua explicado
pelo código gravado nela.

**[R]** Não existe estado "checklist em atualização" nem "falha na atualização".
A troca roda numa transação: ou valeu, ou não aconteceu.

### 3.4. Item da checklist — dois eixos independentes

| `completed` | `superseded_at` | Como aparece                                                                                             |
| ----------- | --------------- | -------------------------------------------------------------------------------------------------------- |
| false       | null            | Pendente, conta no progresso                                                                             |
| true        | null            | Verificado, conta no progresso                                                                           |
| false       | preenchido      | "Não se aplica mais", fora do progresso                                                                  |
| true        | preenchido      | "Não se aplica mais", fora do progresso, e a marcação fica registrada para o caso de o passaporte voltar |

### 3.5. Invariantes

1. Excluir um passaporte **não escreve em `trips`**. Verificável: `updated_at` de
   toda viagem permanece igual.
2. `passport_country_code`, quando preenchido, é um ISO-3166-1 alfa-2 maiúsculo —
   check constraint. Não há segunda coluna com que ele possa divergir.
3. Uma regra do catálogo entra no máximo uma vez **vigente** por (viagem,
   template, país, grupo). Itens superados não ocupam a vaga.
4. Viagem concluída nunca tem `trip_requirements` alterado por causa de
   passaporte — garantido pelo domínio e reforçado na função (6.6).
5. Item superado nunca entra em progresso, em "próximo passo" nem em lembrete.
6. O perfil tem sempre pelo menos um passaporte (D1), e no máximo um principal
   (índice único parcial já existente).

---

## 4. Alternativas analisadas

### 4.1. Como guardar o passaporte da viagem

A restrição decisiva: **excluir um passaporte não pode alterar viagem
concluída**. Ela elimina, sozinha, todo desenho baseado em chave estrangeira —
porque com FK a exclusão da linha referenciada obriga a escrever nas linhas que
a referenciam, e `on delete set null` escreve em _todas_, inclusive nas
concluídas. Não existe FK que ignore parte das linhas filhas.

| Alternativa                                              | Viagem concluída na exclusão         | Integridade                                   | Histórico         | Complexidade                               | Veredito                                                                   |
| -------------------------------------------------------- | ------------------------------------ | --------------------------------------------- | ----------------- | ------------------------------------------ | -------------------------------------------------------------------------- |
| **A.** Só `passport_id`, `on delete set null`            | **Alterada**                         | FK garante                                    | Perdido           | Mínima                                     | Reprovada duas vezes                                                       |
| **B.** `passport_id` + snapshot `passport_country_code`  | **Alterada** (`passport_id` anulado) | FK garante a propriedade                      | Preservado        | 3 colunas, FK composta, trigger, check     | Reprovada pela nova restrição                                              |
| **C.** Cópia completa dos dados do passaporte            | Intacta                              | Sem FK                                        | Preservado demais | Média                                      | Reprovada: número, validade e foto nem existem no schema, e o plano proíbe |
| **D.** Tabela `trip_passport_contexts`                   | Intacta se sem FK                    | —                                             | Preservado        | +1 tabela, +1 RLS, +1 join em toda leitura | Reprovada para o MVP                                                       |
| **E.** Só `passport_country_code`, chave natural, sem FK | **Zero escritas**                    | Validada na escrita, autocorrigida na leitura | Preservado        | 2 colunas, 1 check                         | **Adotada (D9)**                                                           |

**Modelo adotado: E.** O que ele ganha, além de satisfazer a restrição na forma
mais forte possível (não é "alterado de leve", é _nenhuma linha tocada_):

- **Uma coluna só de identidade** — logo, nada a manter em sincronia, logo a
  decisão D6 deixa de existir (4.6).
- **Nada de outro usuário é gravado em `trips`.** O código do país é dado do
  próprio usuário e público; não há id alheio a forjar, então não há oráculo de
  existência nem policy nova a escrever (seção 7).
- **Religa sozinha.** Quem remove o passaporte português e o cadastra de novo vê
  as viagens voltarem a ficar `linked`, sem nenhuma escrita de reparo.
- **Não depende da versão do Postgres.** O desenho B dependia de
  `on delete set null (coluna)`, exclusivo do PG 15+.

O que ela abre mão, honestamente:

- **Não há garantia no banco** de que o código gravado corresponde a um
  passaporte que o usuário teve. A garantia passa a ser dos caminhos de escrita
  (a criação e a RPC de troca só oferecem passaportes reais da lista). Um código
  forjado por chamada direta produz uma viagem `detached`, que a própria
  interface manda corrigir — o pior caso é autoinfligido e autocurável.
- **Depende de `unique (user_id, country_code)` em `passports`.** Se algum dia o
  produto aceitar dois passaportes do mesmo país para a mesma pessoa, a chave
  natural deixa de ser chave. Hoje a constraint existe no schema e é decisão de
  produto; registrado como risco R2.

**[R] Por que não validar a propriedade numa policy:** um `with check` em
`trips_update_own` exigindo que o código corresponda a um passaporte existente
**impediria editar o nome ou as datas de uma viagem `detached`** — a policy
avalia a linha resultante, e a linha resultante tem um código sem passaporte. O
usuário ficaria preso: não conseguiria nem renomear a viagem que o app está
pedindo para ele revisar. A validação fica nos caminhos de escrita, não na
policy.

### 4.2. O que fazer com a checklist quando o passaporte da viagem muda

| Alternativa                            | Progresso                    | Equivalentes                     | Removidos                      | Histórico        | Idempotência | Veredito                                                             |
| -------------------------------------- | ---------------------------- | -------------------------------- | ------------------------------ | ---------------- | ------------ | -------------------------------------------------------------------- |
| **A.** Regenerar tudo                  | Perdido                      | Perdidos                         | Somem                          | Nenhum           | Trivial      | Reprovada                                                            |
| **B.** Diff com supersessão (4 baldes) | Preservado por chave estável | Preservados e **atualizados**    | Marcados, visíveis, explicados | Na própria linha | Boa          | **Recomendada**                                                      |
| **C.** Nova versão da checklist        | Preservado se copiado        | Precisa do mesmo mapeamento de B | Ficam na versão anterior       | Completo         | Boa          | Reprovada para o MVP                                                 |
| **D.** Invalidar tudo e gerar novo     | Perdido                      | Perdidos                         | Visíveis                       | Completo         | Boa          | Reprovada: 15 verificados virariam 15 "não se aplica" + 15 pendentes |

**[R] Recomendo B**, com **quatro baldes** no lugar dos dois de hoje:

```
toInsert       — chave nova
toRestoreIds   — superado que voltou a valer
toUpdate       — mesma chave, conteúdo diferente (visa_rule_id, fonte, texto)
toSupersedeIds — chave sumiu
```

`toUpdate` corrige o achado 2.3: sem ele, o item preservado continua exibindo a
fonte oficial do passaporte anterior. `toRestoreIds` faz a troca ida-e-volta
devolver o progresso.

**Falha no meio:** não existe meio — é uma transação. **Duplicidade:** índice
único parcial + `on conflict do nothing`.

### 4.3. Exclusão do passaporte do perfil

Com o modelo E, a exclusão é **um `delete` em `passports` e nada mais**:

| Tipo de viagem                    | Escritas em `trips` | Efeito                                                                                           |
| --------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------ |
| Concluída                         | **nenhuma**         | Nada muda para o usuário. O cabeçalho continua dizendo com que passaporte a viagem foi preparada |
| Em andamento                      | **nenhuma**         | Vira `detached` por derivação; a tela pede a escolha de outro                                    |
| Futura                            | **nenhuma**         | Idem                                                                                             |
| Sem vínculo com aquele passaporte | **nenhuma**         | Nada                                                                                             |

A única escrita além do `delete` é a **promoção automática de outro principal**
(D5), que acontece em `passports`, não em `trips`.

**Por que não exclusão lógica**, que também preservaria tudo: `passports` tem
`unique (user_id, country_code)`, então uma linha soft-deleted impediria
recadastrar o mesmo país sem uma lógica de "ressuscitar" que não existe em lugar
nenhum do projeto; toda consulta e a própria policy passariam a precisar de
`where deleted_at is null`; e a promessa da política de privacidade ("remove de
forma permanente ... os seus passaportes", `pt-BR.ts` linha 225) ficaria falsa.
O modelo E entrega o mesmo resultado sem nenhum desses custos.

### 4.4. Estado da viagem depois da exclusão

Derivado (3.2/3.3). Sem coluna de estado, sem enum, sem flag de "checklist
desatualizada". Um estado gravado precisaria ser mantido em sincronia com a
exclusão, com a troca, com o recadastro do mesmo país e com a mudança de datas —
e o primeiro bug seria uma viagem marcada "precisa revisão" depois de revisada.

### 4.5. Critério de equivalência entre requisitos

**[R]** Dois itens são o mesmo requisito quando coincidem:

```
template_id  ∧  coalesce(group_id, ∅)  ∧  coalesce(country_code, '')
```

É a chave que `originKey` já usa e a mesma do índice único
`trip_requirements_template_unique`. Manter as duas iguais é o que garante que
"o que o domínio considera o mesmo item" e "o que o banco recusa duplicar" nunca
divirjam.

Fora da chave, de propósito:

- **`visa_rule_id`** — incluí-lo faria toda troca recriar todo item de visto,
  inclusive quando o resultado é idêntico (BR e PT igualmente `visa_free` para a
  França), destruindo progresso à toa. É carga útil, não identidade: quando muda
  com a chave igual, o item é **atualizado**.
- **`title` / `description`** — o texto gravado é sempre pt-BR e a leitura é
  traduzida por cima. Comparar texto compararia idioma.
- **`priority` / `category`** — atributos do template; mudam por migration.
- **Versão da regra** — `visa_rules` não tem versionamento, por decisão
  registrada em `20260906130100_visa_rules.sql`. Não inventar uma agora.

O tipo de visto não precisa entrar na chave porque **já está codificado no
`template_id`**: há um template por tipo (`visa-required`, `visa-evisa`,
`visa-eta`, `visa-on-arrival`, `visa-free`, `visa-conditional`).

### 4.6. D6 — análise pedida: trigger, RPC, ou nenhum dos dois

A pergunta original era como manter `passport_country_code` coerente com
`passport_id`. Comparando as duas saídas **dentro do modelo B**:

|                                                | Trigger `before insert or update on trips`                                                                                       | Só RPC transacional                                                                                                                                    |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Invariante vale em qualquer caminho de escrita | **Sim**                                                                                                                          | Só nos caminhos que passam pela RPC                                                                                                                    |
| Visibilidade da regra                          | Baixa: um valor que o chamador mandou é trocado sem ele saber                                                                    | Alta: a regra está num arquivo só, legível                                                                                                             |
| Testabilidade                                  | Exige banco                                                                                                                      | Também exige banco, mas o teste é o mesmo da operação                                                                                                  |
| Custo                                          | Uma chamada de função por linha em **toda** atualização de viagem, inclusive renomear e mudar datas, que nada têm com passaporte | Zero fora da operação                                                                                                                                  |
| Cobre a criação da viagem                      | Sim                                                                                                                              | **Não**: hoje a criação é um `insert` direto em `tripsService.create`, não uma RPC. Seria preciso mover a criação para RPC também, ou duplicar a regra |

O ponto que decide: **as duas saídas são imperfeitas porque o problema é ter
duas colunas dizendo a mesma coisa.** O trigger esconde lógica; a RPC deixa uma
porta aberta na criação. Sua objeção — "adiciona lógica oculta ao banco" — está
certa, e a alternativa explícita também não fecha.

**[R] Conclusão: D6 não deve ser respondida, deve ser eliminada.** No modelo E
existe uma coluna só, ela não tem par com que divergir, e não há trigger nem
regra de coerência a escrever em lugar nenhum. A validação que sobra — "este
código corresponde a um passaporte que eu tenho?" — é feita onde a escolha
acontece (a tela só oferece passaportes reais) e reconferida na leitura, de
graça, pela derivação de `linkState`.

Com D9 adotada, **não há trigger algum a escrever neste plano**. Fica registrado
apenas para o caso de o modelo B voltar algum dia: ali a saída seria o trigger
com guarda `when (new.passport_id is distinct from old.passport_id)`, para não
cobrar nada das edições de nome e data.

---

## 5. Fluxos completos de UX

Textos em **pt-BR canônico**, para virar chave de `t()` (chaves na seção 9.7).
`en` e `es` entram no mesmo commit, porque chave sem tradução quebra o
`npm check`.

### Fluxo A — Criar viagem com um passaporte

**Onde:** `src/app/trip-new.tsx`. Por **D2**:
`STEPS = ['passport','countries','cities','dates','name']`, com o passaporte na
primeira etapa, sempre presente.

Por **D1**, escolher é obrigatório: `canContinue` na etapa 1 exige seleção. Como
o perfil sempre tem ao menos um passaporte, sempre há o que escolher e o botão
nunca fica preso.

| Cenário                     | Estado inicial                           | Ação                          | Validação                         | Mensagem                                                                        | Banco      | Estado final                      |
| --------------------------- | ---------------------------------------- | ----------------------------- | --------------------------------- | ------------------------------------------------------------------------------- | ---------- | --------------------------------- |
| Um passaporte               | Etapa 1, o único pré-selecionado         | "Continuar"                   | seleção existe                    | —                                                                               | nada ainda | Etapa 2                           |
| Vários                      | Etapa 1, o **principal** pré-selecionado | Toca outro, "Continuar"       | idem                              | —                                                                               | —          | Etapa 2 com a escolha no rascunho |
| Altera a seleção            | Etapa 5 (conferência)                    | "Alterar" leva à etapa 1      | —                                 | —                                                                               | —          | Escolha trocada; nada gravado     |
| Passaporte sem cobertura    | Etapa 1                                  | Toca um com `hasPendingRules` | Nunca bloqueia                    | Linha de estado abaixo do nome, o mesmo texto do Perfil: "Regras em preparação" | —          | Segue normalmente                 |
| Cancela                     | Qualquer                                 | Fecha                         | —                                 | —                                                                               | Nada       | Sem viagem                        |
| Consulta de cobertura falha | Etapa 1                                  | —                             | `listSupportedCountryCodes` falha | **Silêncio** — regra já vigente em `passports-context`, não muda                | —          | —                                 |
| Sem passaporte no perfil    | **Inalcançável** por D1                  | —                             | —                                 | —                                                                               | —          | —                                 |

**Conferência (etapa 5):** bloco `ReviewHeader` "PASSAPORTE" com bandeira, nome
do país e "Alterar" → etapa 1, no mesmo padrão de datas e roteiro, sem corte.

**Gravação:** `createTripWithDestinations` recebe o `passportCountryCode` do
rascunho e o grava no `insert` de `trips`, junto com `passport_selected_at`.
`trip-preparing.tsx` deixa de ler `usePassports().primary` e passa a ler o
passaporte **da viagem**, que `getWithDestinations` já traz.

**Falhas:** inalteradas. `trip-preparing` já retoma de onde parou por
`insertedRef`.

### Fluxo B — Alterar o passaporte de uma viagem

**Onde:** `src/app/trip-edit.tsx`, seção "PASSAPORTE".
**[R]** A troca **não** entra no `save()` com destinos e datas: é ação própria,
com confirmação própria, porque tem consequência própria. Misturada, o botão
"Salvar" às vezes reescreveria a checklist e às vezes não, sem a pessoa saber
qual das duas coisas fez.

> **Alterar o passaporte da viagem?**
> Alguns itens da sua checklist podem mudar porque as exigências de entrada
> dependem do passaporte selecionado. Vamos revisar os itens afetados e
> preservar seu progresso sempre que possível.
>
> [Cancelar] [Alterar e revisar checklist]

| Cenário                          | Estado inicial    | Ação     | Mensagem                                                           | Banco                              | Estado final                          |
| -------------------------------- | ----------------- | -------- | ------------------------------------------------------------------ | ---------------------------------- | ------------------------------------- |
| Sem checklist gerada             | 0 itens           | Confirma | "Passaporte atualizado."                                           | `update trips` + inserts           | Checklist nasce com o novo            |
| Só pendentes                     | n itens           | Confirma | "Passaporte atualizado. {a} itens novos, {b} não se aplicam mais." | 4 baldes                           | Lista redesenhada, animação encadeada |
| Com concluídos                   | k verificados     | Confirma | Idem; equivalentes seguem verificados                              | `toUpdate` refresca fonte e texto  | Progresso preservado                  |
| Viagem pronta que deixa de estar | `isReady`         | Confirma | Idem; o anel volta a mostrar pendência                             | —                                  | `isReady` recalculado                 |
| Cancela                          | qualquer          | Fecha    | —                                                                  | Nenhuma escrita                    | Inalterado                            |
| Volta ao passaporte anterior     | há superados      | Confirma | Idem                                                               | `toRestoreIds`                     | Progresso anterior de volta           |
| Falha                            | qualquer          | —        | "Não foi possível atualizar agora. Tente de novo."                 | Transação desfeita                 | Tudo intacto                          |
| Trocado em outro lugar antes     | código divergente | Confirma | "A viagem mudou em outro lugar. Vamos recarregar."                 | RPC recusa (concorrência otimista) | Recarrega e reoferece                 |
| Viagem concluída                 | `completed`       | —        | A seção **não é oferecida**                                        | —                                  | —                                     |

**O que mudou, para a pessoa ver:** enquanto houver item superado não
dispensado, a tela da viagem mostra um bloco informativo — não clicável —
nomeando o que aconteceu, e uma seção **"Não se aplicam mais"** (D8) ao final da
checklist, recolhida, com um botão "Entendi, ocultar". Sem item superado, sem
bloco.

### Fluxo C — Excluir passaporte do perfil

**Onde:** `src/features/passports/passports-section.tsx`.
**[R]** A confirmação **conta as viagens afetadas antes de perguntar** (uma
consulta por `passport_country_code` trazendo `end_date`; quem classifica o
status é `getTripStatus`, no cliente, pela data local). O aviso só aparece
quando tem o que citar.

| Cenário                           | Mensagem da confirmação                                                                                                           | Depois                                               |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Nenhuma viagem vinculada          | "Você pode adicioná-lo de novo quando quiser."                                                                                    | Removido                                             |
| n futuras/em andamento            | "{n} viagem(ns) usam este passaporte. Elas continuam salvas, com a checklist intacta, e vão pedir a escolha de outro passaporte." | Removido; viagens ficam `detached`                   |
| Só concluídas                     | "Suas viagens concluídas continuam como estão."                                                                                   | Removido; nada a revisar                             |
| Estados misturados                | A frase das futuras — é a que tem ação                                                                                            | Idem                                                 |
| **É o principal, há outros** (D5) | Acrescenta: "{país} passará a ser o seu passaporte principal."                                                                    | Removido e o outro promovido, **na mesma transação** |
| É o último                        | Recusa (`passports.error.onlyOne`), porque por D1 o perfil exige um                                                               | —                                                    |
| Cancela                           | —                                                                                                                                 | Nada                                                 |
| Falha                             | "Não foi possível remover agora. Tente de novo."                                                                                  | Nada mudou                                           |

Depois de concluída a exclusão com promoção, um aviso curto confirma:
"{país} agora é o seu passaporte principal." — a pessoa é informada **antes**,
para decidir, e **depois**, para não descobrir por acaso.

**Ao abrir uma viagem `detached` não concluída:**

> **Escolha o passaporte desta viagem**
> O passaporte que você usava aqui foi removido do perfil. Escolha outro para as
> exigências de entrada voltarem a ser conferidas.
> [Escolher passaporte]

O CTA abre o mesmo diálogo do Fluxo B. Os itens continuam todos lá, marcados e
contados como antes — a exclusão **não** superou item nenhum.

### Fluxo D — Acessar uma viagem histórica

| Cenário                                                  | O que a tela mostra                                                                                             |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Concluída, passaporte ainda no perfil                    | Linha discreta no cabeçalho: bandeira + "Passaporte: Brasil". Sem ação                                          |
| Concluída, passaporte removido                           | **A mesma linha, idêntica** — o código está gravado na viagem e não foi tocado. Sem aviso, sem CTA, sem revisão |
| Concluída sem código (dado legado sem backfill possível) | A linha **não aparece**. Nada é afirmado sobre um passaporte que não se sabe qual era                           |
| Futura, `detached`                                       | Bloco do Fluxo C                                                                                                |

---

## 6. Plano de banco e migrations

Nenhum arquivo abaixo existe. Nenhuma migration existente é editada — correção
vai sempre em arquivo novo.

### 6.1. `..._apply_requirement_diff_visa_rule.sql` — defeito 1

`create or replace function public.apply_requirement_diff(uuid[], jsonb)` com a
mesma assinatura, acrescentando `visa_rule_id` à lista de colunas e
`(item->>'visa_rule_id')::uuid` ao `select`. Mantém `security invoker`,
`set search_path = ''`, e repete `revoke`/`grant` para o arquivo ficar
autossuficiente.

**Independente do resto do plano.** Pode ir sozinha.

O backfill de `visa_rule_id` nos itens antigos depende de saber o passaporte da
viagem, então vem depois de 6.3, dentro de 6.4. Sem ele, itens antigos continuam
com `visa_rule_id` nulo e caem no texto gravado em pt-BR — degradação conhecida,
não quebra.

### 6.2. `..._trips_passport.sql`

```
alter table public.trips
  add column passport_country_code text
    check (passport_country_code ~ '^[A-Z]{2}$'),
  add column passport_selected_at timestamptz;

create index trips_user_passport_idx
  on public.trips (user_id, passport_country_code)
  where passport_country_code is not null;
```

Sem chave estrangeira, sem constraint única em `passports`, sem trigger — ver
4.1 e 4.6. Anulável por D1, para o relaxamento futuro não exigir migration.

O índice serve à contagem do Fluxo C. Parcial porque toda viagem legada nasce
com nulo até o backfill.

Grants: nenhum. `trips` já tem os quatro privilégios para `authenticated` e
coluna nova herda o da tabela.

Comentários de coluna, no estilo das migrations existentes: dizer que o código é
**ao mesmo tempo o vínculo e o snapshot histórico**, que não há FK de propósito,
e que a correspondência com `passports` é por `(user_id, country_code)`.

### 6.3. `..._trip_requirements_superseded.sql`

```
alter table public.trip_requirements
  add column superseded_at timestamptz;

drop index public.trip_requirements_template_unique;

create unique index trip_requirements_template_unique
  on public.trip_requirements (
    trip_id, template_id,
    coalesce(country_code, ''),
    coalesce(group_id, '00000000-0000-0000-0000-000000000000'::uuid)
  )
  where template_id is not null and superseded_at is null;
```

O predicado novo permite um item superado conviver com o substituto sem
colisão. Efeito aceito: dois superados da mesma origem podem coexistir — são
história, e a supersessão só ocorre quando não há item vigente daquela chave.

**[R]** Sem índice de leitura para `superseded_at`: as consultas já filtram por
`trip_id`, o volume por viagem é de dezenas de linhas e o filtro sai no mesmo
scan. Mesmo raciocínio que `20260906130100_visa_rules.sql` registra sobre não
duplicar índice.

**Anotar no próprio arquivo:** o rollback exige apagar as linhas com
`superseded_at not null` **antes** de recriar o índice antigo, senão a recriação
falha por duplicata.

### 6.4. `..._trips_passport_backfill.sql`

Duas passadas:

1. **Do rastro real.** Para cada viagem com ao menos um
   `trip_requirements.visa_rule_id`, o passaporte é
   `visa_rules.passport_country_code` daquela regra — fato, não estimativa. Como
   o modelo E guarda só o código, a passada é um `update ... from` direto, sem
   precisar resolver id de passaporte.
2. **Do principal atual, para o resto.** Viagens domésticas, sem destino
   coberto, ou com itens criados pelo caminho do defeito 1 não têm rastro. Para
   essas, o principal atual é a melhor aproximação — e não é suposição nova: é
   **exatamente o valor que o app já usa hoje** para ler essas viagens.
3. `passport_selected_at` fica **nulo** nas duas. Não se inventa data.
4. Depois, o backfill de `visa_rule_id` de 6.1, agora possível.

**Não recuperável:** qual passaporte de fato estava principal quando uma viagem
sem item de visto foi gerada, e a data da escolha. A passada 2 assume
continuidade. Como o app **não está publicado**, o universo real é o do
desenvolvimento — risco de conferência, não de usuário.

### 6.5. `..._apply_trip_passport_change.sql`

**Onde a atualização roda: [R] RPC `security invoker`.**

| Onde                       | Atomicidade                                              | Segurança                                                                 | Regra testável em TS | Veredito        |
| -------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------- | -------------------- | --------------- |
| Cliente, várias chamadas   | **Nenhuma** — o PostgREST abre uma transação por chamada | RLS ok                                                                    | Sim                  | Reprovada       |
| **RPC `security invoker`** | Total                                                    | RLS linha a linha; payload forjado não alcança viagem alheia              | Sim                  | **Recomendada** |
| RPC `security definer`     | Total                                                    | Contornaria o RLS sem necessidade                                         | Sim                  | Reprovada       |
| Edge Function              | Total se usar RPC por dentro                             | Mais superfície, mais deploy; `service_role` é proibido no caminho do app | Sim                  | Reprovada       |

```
apply_trip_passport_change(
  p_trip_id uuid,
  p_expected_country_code text,   -- concorrência otimista; null é válido
  p_passport_country_code text,
  p_today date,                   -- data local do aparelho
  p_supersede_ids uuid[],
  p_restore_ids uuid[],
  p_updates jsonb,
  p_inserts jsonb
) returns void
```

Corpo:

1. `select ... from trips where id = p_trip_id for update` — serializa duas
   trocas simultâneas e é a checagem de existência sob RLS.
2. `end_date < p_today` ⇒ `raise exception`. Viagem concluída não muda de
   passaporte; a UI já não oferece, isto é defesa em profundidade.
3. `passport_country_code is distinct from p_expected_country_code` ⇒
   `raise exception`. Alguém mudou no meio; o cliente recarrega.
4. `update trips set passport_country_code = ..., passport_selected_at = now()`.
5. `update trip_requirements set superseded_at = now() where id = any(...)
and trip_id = p_trip_id and superseded_at is null` — idempotente.
6. `update ... set superseded_at = null where id = any(p_restore_ids) ...`
7. `update` de conteúdo (`visa_rule_id`, `source_name`, `source_url`, `title`,
   `description`) a partir de `p_updates`.
8. `insert ... on conflict do nothing`, com a lista de colunas de 6.1.

Todo `update`/`insert` filtra por `trip_id = p_trip_id` **além** do RLS: duas
camadas, como o projeto já faz com policy + grant. `revoke execute from public,
anon`, `grant execute to authenticated`.

**Sobre `p_today` vir do cliente:** `current_date` é UTC e o app trabalha com a
data local (`todayISO()` existe por isso). Uma viagem terminando hoje seria
"concluída" para o banco e "em andamento" para o aparelho. Um cliente pode
forjar `p_today`; a consequência é reescrever a checklist da **própria** viagem
concluída — integridade do próprio histórico, não vazamento nem escalada. Risco
aceito **R4**.

### 6.6. `..._passport_write_functions.sql` — D5 e defeito 3

Duas funções `security invoker`, `set search_path = ''`, com `revoke`/`grant`:

```
delete_passport(p_passport_id uuid) returns text   -- código promovido, ou null
set_primary_passport(p_passport_id uuid) returns void
```

`delete_passport`: apaga a linha e, se ela era a principal e sobrou alguma,
promove a mais antiga na **mesma transação**, devolvendo o código para a tela
informar a pessoa (D5). Recusa quando é o último passaporte, por D1.

`set_primary_passport`: limpa o principal atual e marca o novo numa transação
só, fechando o defeito 3 — hoje são duas chamadas PostgREST com uma janela sem
principal nenhum.

**[R]** As duas no mesmo arquivo porque são a mesma família e a segunda é um
conserto de duas linhas; separá-las custaria mais do que rende. O índice único
parcial `passports_single_primary_idx` continua sendo a garantia final.

### 6.7. Ordem segura e compatibilidade

| #   | Migration                                   | Depende de | App antigo continua funcionando? |
| --- | ------------------------------------------- | ---------- | -------------------------------- |
| 1   | `apply_requirement_diff` com `visa_rule_id` | —          | Sim                              |
| 2   | `trips_passport`                            | —          | Sim (colunas anuláveis)          |
| 3   | `trip_requirements_superseded`              | —          | Sim                              |
| 4   | `trips_passport_backfill`                   | 2          | Sim                              |
| 5   | `apply_trip_passport_change`                | 2, 3       | Sim (ninguém chama ainda)        |
| 6   | `passport_write_functions`                  | —          | Sim (ninguém chama ainda)        |

Todas aditivas e anuláveis: **o banco pode ser migrado antes de o app novo
sair**, o que importa porque o Expo Go roda o código local contra o Supabase
remoto já migrado.

**Rollback:** por migration nova, nunca editando as existentes. Ordem inversa
6 → 5 → 3 → 2 (a 4 é dado; a 1 volta com outro `create or replace`). O rollback
da 3 precisa apagar as linhas superadas antes de recriar o índice antigo.

**Antes do `db push`:** o `diff` de `create table` × `enable row level security`
do AGENTS.md. Este plano **não cria tabela**, então as listas continuam batendo.

---

## 7. Segurança e RLS

### 7.1. O que muda

**Nenhuma policy nova, nenhuma policy alterada, nenhuma função `security
definer` nova.** Esse é o resultado direto do modelo E: `trips` passa a guardar
um dado que já era do próprio usuário e que não identifica linha de tabela
nenhuma.

| Garantia pedida                         | Como é garantida                                                                         | Camada       |
| --------------------------------------- | ---------------------------------------------------------------------------------------- | ------------ |
| Só vê os próprios passaportes           | `passports_select_own`                                                                   | RLS (existe) |
| Só altera as próprias viagens           | `trips_update_own`                                                                       | RLS (existe) |
| Não associa passaporte de outro usuário | **Não há o que associar**: o código é do próprio usuário e não referencia linha alheia   | Modelo       |
| Não altera requisitos de outra pessoa   | `trip_requirements_*_own` via `is_trip_owner` + filtro explícito por `trip_id` na função | RLS + função |
| Histórico não alterado indevidamente    | guarda `end_date < p_today` na função + UI não oferece                                   | Função + UI  |
| Exclusão não vaza informação            | exclusão só toca `passports`, sob RLS própria                                            | RLS          |
| Função privilegiada não expõe dado      | as três funções novas são `security invoker`                                             | —            |

### 7.2. O que o modelo E fecha e o que ele deixa aberto

**Fecha:** o desenho com `passport_id` precisava de uma chave estrangeira
composta `(user_id, passport_id)` justamente para que uma tentativa de referenciar
passaporte alheio falhasse do mesmo jeito que um UUID inexistente — sem isso,
erro de policy e erro de FK seriam distinguíveis e formariam um oráculo de
existência. Sem id alheio gravado, o problema não nasce.

**Deixa aberto:** o banco não recusa um `passport_country_code` que o usuário
não possui. A validação mora nos caminhos de escrita, e a policy **não** pode
assumi-la (4.1: um `with check` desses impediria renomear uma viagem
`detached`). O pior caso é o usuário gravar, por chamada direta, um código sem
passaporte correspondente e ver a própria viagem pedindo revisão. Autoinfligido,
autocurável, sem alcance sobre terceiros.

### 7.3. Vulnerabilidades a testar

| #   | Cenário                                                           | Esperado                                                               |
| --- | ----------------------------------------------------------------- | ---------------------------------------------------------------------- |
| S1  | A grava na própria viagem um código de país que não tem no perfil | Aceito pelo banco; a viagem aparece `detached` e a UI pede correção    |
| S2  | A chama `apply_trip_passport_change` com `p_trip_id` de B         | Exceção / zero linhas: o RLS não enxerga a viagem                      |
| S3  | A manda `p_supersede_ids` com ids de requisitos de B              | Zero linhas: `where trip_id = p_trip_id` + policy                      |
| S4  | A manda `p_inserts` com `trip_id` alheio no JSON                  | Policy de insert recusa                                                |
| S5  | A chama `delete_passport` com id de passaporte de B               | Zero linhas: policy de delete de `passports`                           |
| S6  | `anon` lê `trips`/`passports` ou chama qualquer das funções       | Negado                                                                 |
| S7  | A tenta ler viagens de B filtrando por `passport_country_code`    | Nada: `trips_select_own`                                               |
| S8  | Duas trocas simultâneas na mesma viagem                           | A segunda falha na concorrência otimista                               |
| S9  | Retry da mesma chamada após timeout                               | Idempotente                                                            |
| S10 | Excluir passaporte e conferir `trips`                             | **Zero linhas alteradas**; `updated_at` de todas as viagens inalterado |
| S11 | `delete_passport` do último passaporte                            | Recusado (D1)                                                          |
| S12 | `set_primary_passport` concorrente                                | O índice único parcial impede dois principais                          |

Execução: roteiro manual agora, suíte automatizada na Fase 11 (D7).

---

## 8. Plano de atualização da checklist

### 8.1. Onde a regra mora

Em `src/features/trips/domain/requirement-matching.ts`, ao lado de
`diffTripRequirements` e **sem substituí-la** — a edição de destinos e datas
continua usando a existente, que não supera nada (lá a causa já é visível: o
país saiu da viagem).

```ts
export type PassportChangeDiff = {
  toInsert: ResolvedRequirement[];
  toRestoreIds: string[];
  toUpdate: RequirementContentUpdate[];
  toSupersedeIds: string[];
};

export function diffForPassportChange(
  current: readonly ExistingRequirementForPassport[],
  desired: readonly ResolvedRequirement[],
): PassportChangeDiff;
```

`ExistingRequirement` cresce com `superseded_at` e `visa_rule_id`, os dois já
disponíveis em `trip_requirements`.

**A comparação é por `visa_rule_id`, nunca por texto.** `getCountryName` resolve
o nome do país no **idioma ativo**, então o `title` gravado em
`trip_requirements` carrega o idioma do momento da geração. Comparar título ou
descrição faria uma simples troca de idioma marcar a checklist inteira como
alterada e reescrevê-la — e faria uma decisão de domínio depender de string
traduzida, que o AGENTS.md proíbe. A regra de visto é a única parte do item que
depende do passaporte, e é fato, não texto.

Por isso `RequirementContentUpdate` também **não carrega `title`**: o título vem
do mesmo template e só mudaria de idioma. Ele leva `visa_rule_id`,
`description`, `source_name` e `source_url` — tudo o que vem da regra, e tudo em
pt-BR, porque `loadForTrip` lê as colunas base do catálogo, não as traduções.

| Situação                                                          | Balde                                             |
| ----------------------------------------------------------------- | ------------------------------------------------- |
| Desejado, sem par vigente nem superado                            | `toInsert`                                        |
| Desejado, com par **superado**                                    | `toRestoreIds` (+ `toUpdate` se o conteúdo mudou) |
| Desejado, com par vigente e conteúdo igual                        | nenhum                                            |
| Desejado, com par vigente e `visa_rule_id`/fonte/texto diferentes | `toUpdate`                                        |
| Vigente, sem correspondente, **com** `template_id`                | `toSupersedeIds`                                  |
| Vigente, sem `template_id` (criado à mão)                         | nunca tocado                                      |
| Superado, sem correspondente                                      | fica superado                                     |

Item criado à mão não existe hoje na interface, mas o schema permite
(`template_id` nulo) e `diffTripRequirements` já o respeita. A regra nova mantém
o mesmo respeito.

### 8.2. O que a mudança devolve para a apresentação

Sem texto, como manda o AGENTS.md:

```ts
export type PassportChangeOutcome = {
  added: number;
  superseded: number;
  restored: number;
  refreshed: number;
};
```

A tela resolve `t('trip.passport.changed.summary', { added, superseded })` com as
formas de plural do dicionário.

### 8.3. Progresso e quem o consome

`computeTripProgress` continua recebendo o que lhe derem; o filtro
`superseded_at === null` é aplicado **na borda**, não dentro do cálculo.

- `features/trips/domain/trip-summary.ts` — progresso e `selectNextRequirement`;
- `app/(app)/trips/[id].tsx` — progresso, seções, `nextPendingCategory`,
  `destinationsWithoutVerifiedRule`;
- `features/notifications/domain/trip-reminders.ts` — item superado não é
  pendência;
- `services/trips.ts` — `listWithRelations` e `getDetail` passam a trazer
  `superseded_at`; as telas de visão geral filtram no próprio `select` com
  `.is('superseded_at', null)`, menos bytes no aparelho fraco. A tela de detalhe
  traz tudo, porque precisa da seção "não se aplicam mais".

### 8.4. Falhas, idempotência e duplicidade

- **Falha antes da resposta:** o cliente não sabe se aplicou. O retry é seguro
  (passos 5 e 8 idempotentes) e, se já tinha aplicado, a concorrência otimista
  recusa — o cliente trata como "já está feito", recarrega e segue.
- **Duplicidade:** índice único parcial + `on conflict do nothing`.
- **Falha no meio:** impossível, é uma transação.

---

## 9. Impactos no projeto

### 9.1. Banco

`trips` (2 colunas, 1 check, 1 índice) · `trip_requirements` (1 coluna, 1 índice
recriado) · 4 funções (1 corrigida, 3 novas). **Nenhuma tabela, nenhuma FK,
nenhum trigger, nenhuma policy.**

### 9.2. Tipos

`src/types/database.ts`: `trips.Row/Insert/Update` +2 campos;
`trip_requirements.*` + `superseded_at`; `Functions` +
`apply_trip_passport_change`, `delete_passport`, `set_primary_passport`.
`src/types/models.ts`: nada — os aliases derivam.

### 9.3. Domínio

| Arquivo                                             | Mudança                                                                               |
| --------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `features/trips/domain/requirement-matching.ts`     | `diffForPassportChange`, `activeRequirements`, `describePassportChange`, tipos novos  |
| `features/trips/domain/trip-passport.ts` **(novo)** | `linkState`, `needsEntryRulesReview`                                                  |
| `features/trips/domain/trip-summary.ts`             | filtra superados                                                                      |
| `features/trips/domain/visa-coverage.ts`            | recebe o passaporte **da viagem** (a assinatura já é parametrizada — muda quem chama) |
| `features/notifications/domain/trip-reminders.ts`   | filtra superados                                                                      |
| `features/trips/domain/trip-progress.ts`            | **nenhuma**                                                                           |

### 9.4. Dados e serviços

| Arquivo                                   | Mudança                                                                                                                                                    |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `features/trips/data/trip-persistence.ts` | `createTripWithDestinations` grava o passaporte; `resolveChecklist` recebe o da viagem; **`rebuildChecklistsForPassport` sai**; entra `changeTripPassport` |
| `services/trips.ts`                       | `create`/`update` com passaporte; selects com as colunas novas; **`listForRebuild` e `TripForRebuild` saem**; entra `countTripsByPassportCountry`          |
| `services/trip-requirements.ts`           | `applyPassportChange` chamando a RPC                                                                                                                       |
| `services/passports.ts`                   | `remove` e `setPrimary` passam a chamar as funções de 6.6                                                                                                  |

### 9.5. Telas

| Tela                                       | Mudança                                                                                                   |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `app/trip-new.tsx`                         | Etapa `passport` + bloco na conferência                                                                   |
| `features/trips/hooks/use-trip-draft.ts`   | `passportCountryCode` no rascunho, em `normalize()` e `hydrate()`                                         |
| `app/trip-preparing.tsx`                   | Lê o passaporte da viagem                                                                                 |
| `app/trip-edit.tsx`                        | Seção PASSAPORTE + diálogo + RPC; `save()` para de mandar `primary`                                       |
| `app/(app)/trips/[id].tsx`                 | Bloco de revisão, linha "Passaporte: X", seção "Não se aplicam mais", cobertura pelo passaporte da viagem |
| `app/(app)/trips/item/[requirementId].tsx` | Ofertas pelo passaporte **da viagem** (hoje `primary`, linha 145)                                         |
| `features/passports/passports-section.tsx` | Contagem na confirmação; promoção automática e o aviso de D5                                              |
| `features/passports/passports-context.tsx` | `removePassport` sem a recusa do principal; `setPrimary` sem recálculo                                    |
| `app/(app)/index.tsx`, `trips/index.tsx`   | Filtram superados; **[R]** nenhum aviso novo no card                                                      |

**[R] Home e lista:** um selo "precisa revisão" em cada card transforma a lista
em painel de pendências. O bloco vive na tela da viagem, onde há o que citar e
onde a ação existe.

### 9.6. Áreas sem impacto

Autenticação, splash, dicas, `affiliate_clicks`, Edge Function `delete-account`
(a cascata a partir de `profiles` continua correta), deep links,
`catalog-cache` (guarda catálogo, não dado do usuário).

### 9.7. i18n

Nenhuma string em componente. Chaves propostas:

```
trip.new.title.passport / trip.new.subtitle.passport
trip.review.passport.label / trip.review.passport.action
trip.edit.section.passport
trip.passport.change.title             "Alterar o passaporte da viagem?"
trip.passport.change.message
trip.passport.change.confirm           "Alterar e revisar checklist"
trip.passport.changed.summary          (plural em added e superseded)
trip.passport.change.error
trip.passport.change.conflict
trips.checklist.superseded.title       "NÃO SE APLICAM MAIS"
trips.checklist.superseded.hint
trips.checklist.superseded.dismiss     "Entendi, ocultar"
trips.passport.review.title            "Escolha o passaporte desta viagem"
trips.passport.review.message
trips.passport.review.action           "Escolher passaporte"
trips.passport.label                   "Passaporte: {country}"
passports.dialog.removeConfirm.withTrips      (plural em count)
passports.dialog.removeConfirm.completedOnly
passports.dialog.removeConfirm.willPromote    "{country} passará a ser o seu passaporte principal."
passports.promoted.notice                     "{country} agora é o seu passaporte principal."
a11y.tripPassport.select / a11y.tripPassport.change
```

Reservadas para o relaxamento futuro de D1, **não usadas agora**:
`trip.passport.none`, `trip.passport.noneHint`. Como chave sem uso passa no
`npm check` mas vira lixo, **[R]** só entram no dicionário quando a tela usar.

Regras: nada de concatenação, plural pelo dicionário, caixa alta escrita no
dicionário, nome de país sempre por `getCountryName` e nunca gravado.

### 9.8. Textos legais

A política de privacidade e os termos afirmam que a checklist vem do **passaporte
principal** — `src/features/legal/data/pt-BR.ts` linhas 98, 108, 318 e 344.
Deixa de ser verdade. Reescrever para "o passaporte que você escolheu para cada
viagem", nos três idiomas, e bumpar `privacyPolicy.version` e `sourceVersion`,
senão `legal-version.test.ts` reprova — o mecanismo funcionando.

**Não** muda a classificação do dado: continua pessoal comum. Sem nome técnico
de banco nos textos.

### 9.9. Desempenho, offline e sincronização

- **Aparelho fraco:** a troca é uma requisição e um `resolveChecklist`, que já
  carrega ~20 templates + grupos + regras dos destinos. O diff é O(n) sobre
  dezenas de itens. A derivação de `linkState` é uma busca em um array de dois
  ou três elementos, por render — irrelevante.
- **Bytes:** `.is('superseded_at', null)` nas telas de visão geral.
- **Offline:** não há fila de escrita e o plano não cria uma. A troca exige
  rede; sem rede, o diálogo falha e nada muda. A tela continua legível com o que
  estiver em `useState`.
- **Sincronização:** `useFocusEffect` recarrega. Sem cache a invalidar.

### 9.10. Acessibilidade e telas pequenas

Seleção reutiliza `CountryPickerList`/`CountryFlag`, já acessíveis.
`accessibilityLabel` por `t()`. Bloco de revisão não é área clicável — a ação
sai de um botão com rótulo próprio. "{a} novos, {b} não se aplicam" precisa
caber com font scaling: duas linhas, nunca truncar. A reordenação da lista
depois da troca é animada e encadeada.

### 9.11. Logs e observabilidade

Não existe telemetria além de `affiliate_clicks`. **[R]** Não criar nenhuma
aqui: registrar troca de passaporte seria dado novo sobre a pessoa, com impacto
em política de privacidade, sem pergunta de produto que o justifique.

---

## 10. Plano de implementação por fases

Cada fase fecha com `npm check` verde e pode ser commitada sozinha.

### Fase 0 — Correção independente (pode ir hoje)

- **Objetivo:** `apply_requirement_diff` gravar `visa_rule_id`.
- **Cria:** migration 6.1. **Altera:** nada no app.
- **Risco:** nenhum — a função passa a gravar uma coluna que já existe.
- **Conclusão:** editar destinos de uma viagem com item de visto e conferir que
  o item mantém `visa_rule_id` e que o aviso de cobertura não reaparece.
- **Rollback:** `create or replace` de volta, em arquivo novo.

### Fase 1 — Domínio, sem banco

- **Cria:** `features/trips/domain/trip-passport.ts`,
  `features/trips/tests/trip-passport.test.ts`; casos novos em
  `requirement-matching.test.ts`.
- **Altera:** `requirement-matching.ts`.
- **Risco:** baixo; código novo não chamado ainda.
- **Conclusão:** matriz D1–D23 da seção 11.
- **Rollback:** remover os arquivos.

### Fase 2 — Modelo de dados

- **Cria:** migrations 6.2 e 6.3. **Altera:** `src/types/database.ts`.
- **Risco:** baixo. Sem FK, sem trigger, sem dependência de versão — o risco que
  dominava a versão anterior deste plano desapareceu com D9.
- **Conclusão:** colunas presentes; `diff` de RLS do AGENTS.md conferido;
  criar e editar viagem pelo app antigo continua funcionando.
- **Rollback:** migration nova; para `superseded_at`, apagar as linhas superadas
  antes de recriar o índice antigo.

### Fase 3 — Backfill

- **Cria:** migration 6.4. **Depende de:** Fase 2.
- **Risco:** a passada 2 é aproximação (6.4).
- **Conclusão:** toda viagem de usuário com principal tem código preenchido;
  amostra conferida contra o `visa_rule_id` dos itens.
- **Rollback:** `update trips set passport_country_code = null` — perde o
  backfill, não perde dado original.

### Fase 4 — Funções de escrita

- **Cria:** migrations 6.5 e 6.6; `services/trip-requirements.applyPassportChange`;
  `trip-persistence.changeTripPassport`; ajustes em `services/passports.ts`.
- **Depende de:** Fases 1–3.
- **Risco:** médio (concorrência, idempotência, promoção automática).
- **Conclusão:** S1–S12 executados à mão com dois usuários de teste.
- **Rollback:** `drop function`; a tela ainda não chama.

### Fase 5 — Criação de viagem com passaporte

- **Altera:** `use-trip-draft.ts`, `trip-new.tsx`,
  `trip-persistence.createTripWithDestinations`, `services/trips.create`,
  `trip-preparing.tsx`; dicionários.
- **Risco:** baixo; possível regressão no `isDirty` do rascunho.
- **Conclusão:** viagem nova nasce com código preenchido; a checklist é a mesma
  de antes quando o escolhido é o principal.

### Fase 6 — Leitura pelo passaporte da viagem

- **Altera:** `trips/[id].tsx`, `trips/item/[requirementId].tsx`,
  `trip-edit.tsx` (`save`), `trip-summary.ts`, `trip-reminders.ts`,
  `services/trips.ts`.
- **Risco:** é o commit que **remove** `rebuildChecklistsForPassport` e
  `listForRebuild`. `tsc --noEmit` pega qualquer órfão.
- **Conclusão:** trocar o principal no Perfil **não** altera checklist nenhuma.

### Fase 7 — Alterar o passaporte da viagem

- **Altera:** `trip-edit.tsx`, `trips/[id].tsx`; dicionários.
- **Depende de:** Fases 4 e 6.
- **Conclusão:** matriz B inteira.

### Fase 8 — Exclusão do passaporte e revisão

- **Altera:** `passports-section.tsx`, `passports-context.tsx`,
  `trips/[id].tsx`; `services/passports.ts`; dicionários.
- **Depende de:** Fase 7 (o CTA reaproveita o diálogo de troca).
- **Conclusão:** matriz C, incluindo S10 — zero escritas em `trips`.

### Fase 9 — Textos legais e documentação

- **Altera:** `legal/data/{pt-BR,en,es}.ts` + versões; `AGENTS.md`.
- **Conclusão:** `legal-version.test.ts` e `legal-structure.test.ts` verdes.

### Fase 10 — Validação funcional

Seção 14, blocos de modelo, regra de negócio, produto e qualidade.

### Fase 11 — Testes automatizados de banco e RLS **(obrigatória, D7)**

- **Objetivo:** transformar o roteiro manual em suíte executável.
- **Cria:** `supabase/tests/` com pgTAP (ou equivalente), cobrindo S1–S12,
  B1–B11 e as invariantes de 3.5; script `db:test` no `package.json`; job no
  `.github/workflows/check.yml`, ao lado de `functions:check`.
- **Depende de:** Fases 4 e 8 estarem fechadas — os testes descrevem o
  comportamento final, não um intermediário.
- **Gate:** **o plano não é considerado concluído e este documento não sai de
  `tasks/` antes desta fase.** É o mesmo princípio que já vale para as Edge
  Functions: o que fica de fora do `npm check` precisa ganhar validação
  equivalente, não ficar sem checagem nenhuma.
- **Risco:** ferramenta nova no projeto; precisa rodar no CI contra um Postgres
  descartável, não contra o Supabase remoto.
- **Rollback:** remover o job; nenhum código de app depende dele.

---

## 11. Matriz de testes

### 11.1. Domínio — `node --test`, sem Supabase

| #   | Caso                                             | Esperado                                                                               |
| --- | ------------------------------------------------ | -------------------------------------------------------------------------------------- |
| D1  | `linkState` com código nulo                      | `none`                                                                                 |
| D2  | Código presente e passaporte no perfil           | `linked`                                                                               |
| D3  | Código presente e nenhum passaporte daquele país | `detached`                                                                             |
| D4  | Código presente, perfil com outros países        | `detached`                                                                             |
| D5  | `needsEntryRulesReview` em futura `detached`     | `true`                                                                                 |
| D6  | Idem em andamento                                | `true`                                                                                 |
| D7  | Idem concluída                                   | `false`                                                                                |
| D8  | Idem `linked`                                    | `false`                                                                                |
| D9  | Idem `none` não concluída                        | `true`                                                                                 |
| D10 | Troca BR→PT, destino com regras diferentes       | antigo em `toSupersedeIds`, novo em `toInsert`                                         |
| D11 | Troca BR→PT, mesmo `requirement_type`            | sem insert nem supersessão; `toUpdate` com o `visa_rule_id` novo                       |
| D12 | Item verificado que deixou de valer              | `toSupersedeIds`, **nunca** apagado                                                    |
| D13 | Item superado que voltou a valer                 | `toRestoreIds`, `completed` intacto                                                    |
| D14 | Item sem `template_id`                           | nunca em balde nenhum                                                                  |
| D15 | Troca para passaporte sem regras                 | nenhum item de visto; **os genéricos permanecem** — ausência de regra não vira isenção |
| D16 | Viagem que vira doméstica                        | itens de fronteira superados, `domestic-photo-id` inserido                             |
| D17 | Viagem que deixa de ser doméstica                | o inverso                                                                              |
| D18 | Viagem sem passaporte (`none`)                   | só itens sem condição de passaporte; nenhum item de visto                              |
| D19 | Progresso ignora superados                       | sobre a lista filtrada                                                                 |
| D20 | `selectNextRequirement` ignora superado          | o próximo passo pula                                                                   |
| D21 | Lembrete não conta superado                      | contagem de pendências                                                                 |
| D22 | Diff idempotente                                 | segundo diff vazio                                                                     |
| D23 | Ordem da entrada não importa                     | mesmo resultado embaralhado                                                            |

### 11.2. Banco e segurança — manual na Fase 10, automatizado na Fase 11

S1–S12 da seção 7.3, mais:

| #   | Caso                                                  | Esperado                                                                                 |
| --- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| B1  | Excluir passaporte com viagem futura vinculada        | **Zero linhas de `trips` alteradas**; viagem vira `detached` por derivação               |
| B2  | Excluir passaporte com viagem **concluída** vinculada | **Zero linhas alteradas**; `updated_at` idêntico; checklist, progresso e código intactos |
| B3  | Recadastrar o mesmo país depois de excluir            | Viagens voltam a `linked`, sem escrita de reparo                                         |
| B4  | Excluir o principal havendo outros                    | Exclusão e promoção na mesma transação; exatamente um principal ao final                 |
| B5  | Excluir o último passaporte                           | Recusado                                                                                 |
| B6  | Excluir usuário (Edge Function)                       | Tudo em cascata; sem linha órfã                                                          |
| B7  | Superado e vigente da mesma origem                    | Índice único aceita                                                                      |
| B8  | Dois vigentes da mesma origem                         | Índice único recusa                                                                      |
| B9  | RPC de troca em viagem concluída                      | Exceção                                                                                  |
| B10 | RPC com `p_expected_country_code` errado              | Exceção                                                                                  |
| B11 | RPC repetida com o mesmo payload                      | Sem duplicata, sem erro                                                                  |

### 11.3. Interface — manual

Um passaporte · vários · confirmação · cancelamento · loading do diálogo · falha
de rede · recuperação · os três idiomas · font scaling máximo nos textos de
contagem · tela de 320 pt · VoiceOver/TalkBack nos rótulos novos · animação
encadeada ao reordenar · aviso de promoção automática antes e depois.

### 11.4. Regressão

| #   | Caso                                  | Esperado                                                            |
| --- | ------------------------------------- | ------------------------------------------------------------------- |
| R1  | Criar viagem escolhendo o principal   | Checklist idêntica à de antes do plano                              |
| R2  | Editar destinos e datas               | Comportamento atual, sem supersessão                                |
| R3  | Marcar e desmarcar item               | Inalterado                                                          |
| R4  | Viagem concluída anterior à migration | Abre igual; sem bloco de revisão                                    |
| R5  | Trocar o principal no Perfil          | **Nenhuma** checklist muda                                          |
| R6  | Lembretes                             | Mesmos disparos, descontados os superados                           |
| R7  | Trocar de idioma                      | Textos novos traduzidos; nome da viagem e cidades intocados         |
| R8  | Aviso de cobertura                    | Some nos casos do defeito 1; aparece só onde falta regra de verdade |
| R9  | Definir principal                     | Uma transação; nunca uma janela sem principal (defeito 3)           |

### 11.5. Casos-limite

Viagem sem datas (`upcoming` — troca permitida) · viagem terminando hoje com
aparelho em UTC−3 (6.5) · dois passaportes do mesmo país (impossível hoje;
risco R2) · troca durante a preparação da checklist (`trip-preparing` não
oferece) · destino removido e passaporte trocado na mesma sessão (duas ações,
duas transações, nesta ordem) · 20 destinos × troca de passaporte
(`MAX_TRIP_COUNTRIES`) · viagem legada sem código e sem rastro (`none`,
cabeçalho sem a linha do passaporte).

---

## 12. Atualizações de documentação

### `AGENTS.md`

**Regras de negócio → Viagens:** o passaporte-base é **da viagem**, escolhido na
criação e alterável enquanto ela não estiver concluída. A linha atual — "o
passaporte usado deve ser determinado pelo passaporte principal cadastrado" —
passa a valer só como valor **pré-selecionado**.

**Passaportes:** o principal é preferência de perfil e não reescreve viagem
nenhuma. Remover um passaporte **não escreve em `trips`**: viagens futuras e em
andamento passam a pedir revisão por derivação, as concluídas não mudam em nada.
O perfil exige pelo menos um passaporte; remover o principal havendo outros é
permitido, promovendo outro automaticamente e avisando a pessoa. A viagem guarda
o **código do país**, nunca número, validade, foto ou biometria.

**Checklist:** o eixo `superseded_at` — item que deixou de valer sai do
progresso, continua visível e é explicado; nunca é apagado calado e nunca segue
se apresentando como exigência vigente.

**Migrations:** operação que grava em mais de uma tabela ou linha relacionada vai
para função no Postgres, `security invoker`; a data de referência vem do cliente
porque `current_date` é UTC; e uma validação de propriedade que a policy não
possa assumir sem travar edições legítimas mora no caminho de escrita, não na
policy.

### Este documento

Fica em `tasks/` até a **Fase 11** fechar (D7). Ao sair, conferir se algum
arquivo de `tasks/` passou a apontar para ele.

### Textos legais

9.8: quatro trechos, três idiomas, duas versões bumpadas.

### Sem pasta `docs/`

Não criar. O que sobrevive à feature é regra de trabalho e vai para o
`AGENTS.md`.

---

## 13. Riscos e a decisão de modelo

### Riscos

| #   | Risco                                                                      | Mitigação                                                                                                                                                   |
| --- | -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | Sem FK, o banco não recusa um código de país que o usuário não possui      | Validado nos caminhos de escrita; a leitura autocorrige (`detached`); o pior caso é autoinfligido e sem alcance sobre terceiros. Policy **não** serve (4.1) |
| R2  | A chave natural depende de `unique (user_id, country_code)` em `passports` | Constraint existe no schema e é decisão de produto. Se um dia cair, este plano precisa de um id — registrar no `AGENTS.md` junto da regra                   |
| R3  | Backfill atribuir passaporte errado a viagem antiga sem rastro             | Passada 1 usa fato; app não publicado reduz o universo                                                                                                      |
| R4  | `p_today` forjável pelo cliente                                            | Consequência restrita ao próprio histórico; aceito e documentado                                                                                            |
| R5  | Fase 6 remove `rebuildChecklistsForPassport`                               | `tsc --noEmit` pega órfãos; é chamada em um lugar só                                                                                                        |
| R6  | Recadastrar o mesmo país religa viagens automaticamente                    | Comportamento desejado, mas precisa estar escrito no `AGENTS.md` para não parecer bug                                                                       |
| R7  | Testes de banco só na Fase 11                                              | Fase obrigatória e bloqueante (D7); roteiro manual executado a cada fase até lá                                                                             |

### D9 — a decisão de modelo, e por quê

**Adotado: só `passport_country_code`, chave natural, sem `passport_id` e sem
chave estrangeira.**

A restrição de que viagem concluída não pode ser alterada pela exclusão de um
passaporte elimina, sozinha, qualquer desenho com chave estrangeira: com FK,
apagar a linha referenciada **obriga** a escrever em todas as linhas que a
referenciam, e não existe `on delete` que ignore parte delas. Não era possível
ter a garantia referencial e a viagem concluída intocada ao mesmo tempo.

O que o modelo adotado entrega:

- excluir um passaporte faz **zero escritas em `trips`** — a forma mais forte de
  cumprir a restrição, e verificável por `updated_at`;
- some a segunda coluna, e com ela a decisão D6 inteira: não há trigger nem
  lógica oculta no banco;
- some a dependência de recurso de versão do Postgres, a constraint única extra
  em `passports` e toda a discussão de vazamento por id alheio;
- `trips` deixa de guardar qualquer identificador de outra tabela, o que é o
  motivo de este plano não precisar de nenhuma policy nova.

Do que se abriu mão, e como fica coberto:

- a garantia referencial no banco, substituída por validação nos caminhos de
  escrita e autocorreção na leitura (risco **R1**);
- a dependência de `unique (user_id, country_code)` em `passports` continuar
  valendo — se um dia o produto aceitar dois passaportes do mesmo país para a
  mesma pessoa, a chave natural deixa de ser chave e o modelo precisa de um id
  (risco **R2**, que por isso vai para o `AGENTS.md`).

Registrado para o histórico: o desenho descartado era `passport_id` + snapshot,
com chave estrangeira composta `(user_id, passport_id)` e `on delete set null
(passport_id)`. Ele resolvia a propriedade no banco, mas anulava o `passport_id`
também nas viagens concluídas.

---

## 14. Checklist final de aceite

**Modelo e integridade**

- [ ] `trips` tem `passport_country_code` e `passport_selected_at`
- [ ] **Excluir um passaporte não altera nenhuma linha de `trips`** — o `updated_at` de todas as viagens permanece igual (S10, B1, B2)
- [ ] Viagem concluída com passaporte excluído continua com checklist, progresso e cabeçalho idênticos
- [ ] Recadastrar o mesmo país religa as viagens, sem escrita de reparo
- [ ] `trip_requirements.superseded_at` existe e o índice único ignora superados
- [ ] Nenhuma tabela nova; as listas de `create table` e de `enable row level security` continuam batendo

**Regra de negócio**

- [ ] Criar viagem exige escolher o passaporte (D1), e a coluna segue anulável
- [ ] O estado `none` está implementado e testado, para o relaxamento futuro
- [ ] Trocar o principal no Perfil **não** altera checklist nenhuma
- [ ] Trocar o passaporte da viagem preserva o progresso dos equivalentes
- [ ] Item que deixou de valer fica visível, explicado e fora do progresso
- [ ] Item que voltou a valer recupera o estado anterior
- [ ] Item preservado tem `visa_rule_id`, fonte e texto do passaporte novo
- [ ] Ausência de regra nunca vira "não precisa de visto"
- [ ] Remover o principal havendo outros é permitido, promove outro **na mesma transação** e a pessoa é informada antes e depois (D5)
- [ ] Remover o último passaporte é recusado
- [ ] Viagem futura e em andamento sem passaporte ativo pedem revisão; concluída não

**Atomicidade e segurança**

- [ ] Troca de passaporte + checklist em uma transação só
- [ ] Exclusão + promoção em uma transação só
- [ ] `set_primary_passport` sem janela sem principal (defeito 3)
- [ ] Repetir a mesma chamada não duplica nem quebra
- [ ] Troca concorrente é recusada e recuperável
- [ ] S1–S12 executados e aprovados
- [ ] Nenhuma policy nova, nenhuma função `security definer` nova, nenhum `service_role` no app

**Produto e apresentação**

- [ ] Todo texto novo vem de `t()`, nos três idiomas, com plural do dicionário
- [ ] Nenhuma chave no dicionário sem uso na tela
- [ ] Nenhuma decisão de domínio depende de string traduzida
- [ ] Nenhum nome de país gravado — só código
- [ ] Bloco de revisão só aparece quando há o que citar e não é área clicável
- [ ] Reordenação da checklist é animada e encadeada
- [ ] Textos legais atualizados nos três idiomas, com versão bumpada
- [ ] Nada do plano exige build nativo — o Expo Go continua rodando

**Qualidade**

- [ ] `npm check` verde
- [ ] Matriz D1–D23 implementada
- [ ] R1–R9 conferidos à mão
- [ ] **Fase 11 concluída**: suíte automatizada de banco/RLS rodando no CI (D7)
- [ ] `AGENTS.md` atualizado, incluindo R2 e R6
- [ ] Este documento fechado e removido de `tasks/`, sem link quebrado

# Plano — Checklist com progresso circular, accordions e tela de detalhe do item

Feature: reorganizar a tela de checklist da viagem em três frentes — progresso
em anel, seções por categoria em accordion, e uma tela própria para o item, com
sugestões de contratação (links de afiliado).

Status: **plano**. Nada implementado nesta etapa.

---

## 1. Ponto de partida

Tudo hoje mora em uma tela só,
[src/app/(app)/trips/[id].tsx](<src/app/(app)/trips/[id].tsx>) (~500 linhas):

| Elemento atual                                                       | Onde está                                                                                           | O que acontece com ele                                                 |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Cabeçalho (bandeiras, nome, cidades, datas, menu •••)                | `[id].tsx`                                                                                          | Permanece                                                              |
| Card "Viagem pronta! 🎉"                                             | `[id].tsx`                                                                                          | Permanece                                                              |
| Card de progresso com `ProgressBar` horizontal                       | `[id].tsx` + [progress-bar.tsx](src/components/ui/progress-bar.tsx)                                 | **Vira anel**                                                          |
| Linha da estação, dentro do card de progresso                        | `[id].tsx`                                                                                          | Permanece, abaixo do anel                                              |
| Chips de filtro por categoria                                        | `[id].tsx` (`FilterChip`)                                                                           | **Sai** — a categoria vira a própria seção                             |
| Seções por escopo (viagem / grupo / país)                            | `groupRequirementsByScope` em [requirement-matching.ts](src/features/trips/requirement-matching.ts) | **Deixa de organizar a tela**; o escopo passa a ser informação do item |
| Linha do requisito com título, prioridade, descrição e link da fonte | `RequirementRow` em `[id].tsx`                                                                      | **Encolhe**: título + prioridade + checkbox; toque abre o detalhe      |
| Descrição e fonte oficial                                            | dentro da linha                                                                                     | **Vão para a tela de detalhe**                                         |
| Sugestões de contratação                                             | não existe                                                                                          | **Nova tabela + nova seção na tela de detalhe**                        |

O que já existe e será reaproveitado sem alteração de regra:

- `computeTripProgress` / `formatProgressLabel` / `formatPendingRequiredLabel` em
  [trip-progress.ts](src/features/trips/trip-progress.ts) — a regra de progresso
  (obrigatório + recomendado contam, informativo não) continua sendo a única.
- `CHECKLIST_CATEGORIES`, `CATEGORY_LABELS`, `CATEGORY_ICONS`, `PRIORITY_LABELS`
  em [checklist-catalog.ts](src/features/trips/checklist-catalog.ts) — os ícones
  por categoria já existem e nunca foram usados; agora são o ícone do accordion.
- `react-native-svg@15.15.4` já é dependência (usada em
  [season-shapes.tsx](src/features/trips/season-shapes.tsx)) — o anel não
  adiciona biblioteca nenhuma.
- `useFocusEffect` do `expo-router`, já usado em
  [trips/index.tsx](<src/app/(app)/trips/index.tsx>) — é como o detalhe devolve
  o item marcado para a checklist.
- Padrão de tabela de referência (RLS de leitura + `revoke` de escrita) de
  [requirement_catalog_rls.sql](supabase/migrations/20260906120100_requirement_catalog_rls.sql)
  e [visa_rules_rls.sql](supabase/migrations/20260906130200_visa_rules_rls.sql).

---

## 2. Tarefa 1 — Progresso em anel

### 2.1 Componente novo: `src/components/ui/progress-ring.tsx`

Anel de progresso em SVG, irmão do `ProgressBar` (que continua existindo — é
usado pelo card de viagem, pela Home e passará a ser usado dentro de cada
accordion).

```tsx
export function ProgressRing({
  percent,
  size = 56,
  strokeWidth = 5,
  label, // texto no centro; padrão: `${percent}%`
}: {
  percent: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
});
```

- Dois `<Circle>` concêntricos: trilho em `colors.progressTrack` e preenchimento
  em `colors.primary`, com `strokeDasharray` = circunferência e `strokeDashoffset`
  proporcional ao percentual, `strokeLinecap="round"`, rotação `-90°` para
  começar no topo.
- `accessibilityRole="progressbar"` com `accessibilityValue`, igual ao
  `ProgressBar` — a leitura por VoiceOver não pode piorar.
- Sem animação nesta etapa (o valor muda por toque, não por carregamento). Se
  animar depois, consultar `useReduceMotion` de [animation.ts](src/lib/animation.ts).

### 2.2 Card de progresso em `[id].tsx`

Layout novo, seguindo a referência:

```
┌───────────────────────────────────────────┐
│  ( 50% )   7 de 14 itens verificados      │
│            2 obrigatórios pendentes  ← vermelho
├───────────────────────────────────────────┤
│  ❄️  Inverno em Viena · dez–fev            │
└───────────────────────────────────────────┘
```

- Linha 1: `ProgressRing` à esquerda + textos à direita.
  - Primeiro texto: `formatProgressLabel(progress)` (já existe).
  - Segundo texto: pendentes obrigatórios em `priorityColors.required`.
- A frase atual "Próximo passo: verificar N itens obrigatórios" é substituída
  pela linha curta de pendentes. Para manter o tom orientado à ação sem repetir,
  quando `progress.isReady` a segunda linha vira "Tudo obrigatório verificado".
  Quando `progress.total === 0`, some.
- Reutilizar `formatPendingRequiredLabel` (hoje só usada pelo
  [trip-card.tsx](src/features/trips/trip-card.tsx), que devolve "2 obrigatórios").
  A tela acrescenta a palavra "pendentes" no local, **sem alterar a função** — o
  card da listagem não pode mudar de texto por causa desta tela.
- A pintura por estação do card (`seasonSoftColors` / `seasonBorderColors`) e a
  linha da estação permanecem exatamente como estão, abaixo do bloco do anel.

### 2.3 Arquivos

| Arquivo                               | Ação                                                    |
| ------------------------------------- | ------------------------------------------------------- |
| `src/components/ui/progress-ring.tsx` | criar                                                   |
| `src/app/(app)/trips/[id].tsx`        | trocar `ProgressBar` por `ProgressRing` no card de topo |

---

## 3. Tarefa 2 — Checklist em accordions por categoria

### 3.1 A mudança de eixo (decisão a registrar)

Hoje a lista é agrupada por **escopo** (Toda a viagem / Espaço Schengen /
Áustria). A referência agrupa por **categoria** (Documentos, Saúde, Dinheiro,
Conectividade, Bagagem). São eixos concorrentes; manter os dois aninhados
(categoria → escopo → item) devolveria três níveis de hierarquia numa tela
que a mudança quer simplificar.

**Proposta:** a categoria vira a seção (accordion) e o escopo vira informação do
item — uma linha de contexto com bandeira/ícone dentro da própria tela de
detalhe (`📋 Documentos · 🌍 Geral — todos os países`, como na referência), e um
marcador discreto na linha da checklist quando o item é de um país específico
(bandeira ao lado do título). Assim nenhuma informação some, ela muda de lugar.

`groupRequirementsByScope` **continua existindo e testada**: ela deixa de ser
usada pela tela, mas a função que dá nome ao escopo é extraída dela e passa a
servir também ao detalhe (§4.3).

Os chips de filtro saem: com cinco accordions colapsáveis, filtrar por categoria
é a mesma ação de abrir uma seção.

### 3.2 Nova função pura (testável, sem React)

Em [requirement-matching.ts](src/features/trips/requirement-matching.ts), junto
do bloco "Organização para a tela":

```ts
export type ChecklistCategorySection<T> = {
  category: RequirementCategory;
  items: T[];
  done: number;    // itens que contam para o progresso e estão verificados
  total: number;   // itens que contam para o progresso
};

export function groupRequirementsByCategory<T extends ...>(
  requirements: readonly T[],
): ChecklistCategorySection<T>[]
```

- Ordem das seções: `CHECKLIST_CATEGORIES` (ordem de produto já definida).
  Como o módulo é puro e não importa nada de execução, a ordem entra por
  parâmetro (`readonly RequirementCategory[]`) ou o módulo passa a exportar a
  ordem — preferir o parâmetro, para não mover constante de apresentação para
  dentro do motor.
- Seção sem item nenhum não aparece (mesma regra do agrupamento por escopo).
- Ordenação interna: reaproveitar `byPriorityThenCreation`, já existente —
  obrigatórios primeiro, empate pela criação.
- `done`/`total` da seção usam **a mesma regra do anel**: informativos ficam
  fora da fração. É isso que faz "2/4 + 1/3 + 1/2 + 1/2 + 2/3" fechar com o
  "7 de 14" do topo. Categoria composta só de informativos mostra a contagem de
  itens em vez de barra (`3 itens`), porque `0/0` não diz nada.

Testes novos em
[requirement-matching.test.ts](src/features/trips/requirement-matching.test.ts):
ordem das seções, seção vazia omitida, informativo fora da fração, ordenação por
prioridade dentro da seção.

### 3.3 Componente do accordion: `src/components/ui/accordion-section.tsx`

Genérico o bastante para a checklist e nada além disso (sem virar biblioteca):

```tsx
<AccordionSection
  icon={<Ionicons name={CATEGORY_ICONS[category]} … />}
  iconBackground={…}
  title="Documentos"
  progress={{ done: 2, total: 4 }}   // opcional
  meta="3 itens"                     // usado quando não há fração
  expanded={…}
  onToggle={…}>
  {children}
</AccordionSection>
```

- Cabeçalho: `Pressable` com `accessibilityRole="button"` e
  `accessibilityState={{ expanded }}`; ícone no quadrado arredondado (mesmo
  tratamento de [list-row.tsx](src/components/ui/list-row.tsx)), título, uma
  `ProgressBar` fina, a fração à direita e o chevron (`chevron-down` /
  `chevron-up`).
- Corpo: renderizado só quando aberto. Animação com
  `LayoutAnimation.configureNext` no toque, respeitando `useReduceMotion` — sem
  Reanimated e sem medir altura, que é o caminho mais barato e não introduz
  dependência nova. O app não usa `@expo/ui` hoje e o pacote não oferece
  accordion nativo, então não há componente de plataforma a preferir aqui.
- No Android, `LayoutAnimation` exige
  `UIManager.setLayoutAnimationEnabledExperimental(true)` na New Architecture?
  Não — na New Architecture (padrão no Expo 57 / RN 0.86) já vem habilitado.
  Verificar em execução antes de fechar a tarefa.

### 3.4 Estado de abertura em `[id].tsx`

- `const [expanded, setExpanded] = useState<Set<RequirementCategory>>(...)`.
- Padrão de abertura: **a primeira categoria com item obrigatório pendente
  nasce aberta**; as demais colapsadas. Alinha com o tom do app ("o próximo
  passo primeiro") e com a referência, que mostra tudo fechado quando não há o
  que cobrar. Viagem pronta abre nada.
- O estado é da tela, não persistido — reabrir a viagem recalcula.

### 3.5 A linha do requisito

`RequirementRow` encolhe para: checkbox + título + etiqueta de prioridade
(+ bandeira quando `country_code`) + chevron à direita.

- **Checkbox** (`Pressable` interno, `accessibilityRole="checkbox"`) → marca /
  desmarca, com o mesmo otimismo e rollback de hoje.
- **Resto da linha** (`Pressable` externo, `accessibilityRole="button"`) → abre
  a tela de detalhe. O aninhamento já é o padrão usado hoje para o link da
  fonte: o alvo mais interno vence o toque.
- Saem da linha: `description` e o bloco da fonte oficial (`source_name` /
  `source_url` + `openSource`) — os dois vão para o detalhe, junto com
  `WebBrowser`.

### 3.6 Arquivos

| Arquivo                                           | Ação                                                                                  |
| ------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `src/features/trips/requirement-matching.ts`      | + `groupRequirementsByCategory`, + `describeRequirementScope` (§4.3)                  |
| `src/features/trips/requirement-matching.test.ts` | + testes das duas funções                                                             |
| `src/components/ui/accordion-section.tsx`         | criar                                                                                 |
| `src/app/(app)/trips/[id].tsx`                    | remover chips e `FilterChip`, trocar seções por accordions, encolher `RequirementRow` |

---

## 4. Tarefa 3 — Tela de detalhe do item

### 4.1 Rota

`src/app/(app)/trips/item/[requirementId].tsx`, dentro da stack da aba Viagens
([trips/_layout.tsx](<src/app/(app)/trips/_layout.tsx>)) — empilha sobre o
detalhe da viagem, mantém a tab bar nativa e o gesto de voltar do sistema, como
a referência (cabeçalho "‹ Detalhes"). Não conflita com `trips/[id].tsx`:
`/trips/xyz` tem um segmento, `/trips/item/xyz` tem três.

Navegação: `router.push({ pathname: '/trips/item/[requirementId]', params: { requirementId, tripId } })`.
`tripId` viaja junto para o botão de voltar ter destino em abertura por deep
link, seguindo o cuidado que `goBackToTrips` já toma em `[id].tsx`.

Ao voltar, a checklist precisa refletir o que foi marcado lá dentro. Usar
`useFocusEffect` em `[id].tsx` para recarregar ao reganhar foco — mesmo padrão
de [trips/index.tsx](<src/app/(app)/trips/index.tsx>) e
[(app)/index.tsx](<src/app/(app)/index.tsx>). Cuidado: o `useEffect` de
comemoração dispara na **virada**; recarregar em foco não pode fazer a
comemoração repetir — o `previousRef` já protege, mas incluir isso no teste
manual.

### 4.2 Conteúdo, na ordem da referência

1. Etiqueta de prioridade (`PRIORITY_LABELS` + `priorityColors` / `prioritySoftColors`).
2. Título do requisito.
3. Linha de contexto: `📋 Documentos · 🌍 Geral — todos os países` (ícone e
   rótulo da categoria + escopo, com `CountryFlag` quando for de país).
4. Bloco "O QUE VERIFICAR" (`SectionLabel` + card) com `description`.
   Sem descrição, o bloco não aparece.
5. Bloco "ONDE CONTRATAR" — as ofertas (§4.4). Só aparece se houver alguma.
6. Nota de transparência, quando alguma oferta exibida for afiliada:
   "Algumas indicações podem gerar comissão para o TripReady, sem custo
   adicional para você." — texto fixo no app, não no banco.
7. Fonte oficial (`source_name` / `source_url`), quando houver, com
   `WebBrowser.openBrowserAsync` — o `openSource` migra de `[id].tsx` para cá.
8. Aviso "💡 Confirme sempre nos canais oficiais antes de viajar."
9. Botão fixo no rodapé: "✓ Marcar como verificado" / "Desmarcar item", usando
   [button.tsx](src/components/ui/button.tsx) e
   `tripRequirementsService.setCompleted`.

### 4.3 Rótulo de escopo, sem duplicar regra

Extrair de `groupRequirementsByScope` uma função exportada:

```ts
export function describeRequirementScope<T extends ScopedRequirement>(
  requirement: T,
  countryName: (code: string) => string,
): { kind: ChecklistSectionKind; label: string; countryCode: string | null };
```

`groupRequirementsByScope` passa a chamá-la (mesmo comportamento, um lugar só) e
a tela de detalhe a usa direto. Rótulo de viagem inteira exibido como
"Geral — todos os países", coerente com a referência.

### 4.4 Nova tabela: `requirement_offers`

Migration `supabase/migrations/<timestamp>_requirement_offers.sql`, no mesmo
estilo comentado das existentes.

**Chave de ligação: `requirement_template_id`.** É o "tipo de requerimento" que
o app já tem — `trip_requirements.template_id` aponta para ele desde
[20260906120000](supabase/migrations/20260906120000_requirement_catalog.sql), e
é estável entre viagens e usuários. Ligar por categoria seria grosso demais
("Documentos" cobre passaporte, visto e seguro); ligar por `trip_requirements.id`
seria por viagem, e a oferta é do catálogo. Itens criados à mão pelo usuário
(`template_id` nulo) simplesmente não têm oferta.

```sql
create table public.requirement_offers (
  id uuid primary key default gen_random_uuid(),
  requirement_template_id uuid not null
    references public.requirement_templates (id) on delete cascade,
  name text not null check (length(btrim(name)) > 0),
  description text,
  url text not null check (url ~ '^https://'),
  -- Ícone exibido no card. Emoji ou nome de Ionicons; nulo cai no ícone da categoria.
  icon text,
  -- Restrições opcionais de aplicabilidade. Nulo = vale para qualquer um.
  destination_country_code text check (destination_country_code ~ '^[A-Z]{2}$'),
  passport_country_code text check (passport_country_code ~ '^[A-Z]{2}$'),
  -- Se o link rende comissão — decide a exibição da nota de transparência.
  is_affiliate boolean not null default true,
  position integer not null default 0,
  active boolean not null default true,
  valid_from date,
  valid_until date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint requirement_offers_period_check check (
    valid_from is null or valid_until is null or valid_until >= valid_from
  )
);

create index requirement_offers_template_idx
  on public.requirement_offers (requirement_template_id) where active;

create trigger requirement_offers_set_updated_at
before update on public.requirement_offers
for each row execute function public.set_updated_at();
```

- `position` + `name` dão a ordem estável do bloco.
- `valid_from` / `valid_until` seguem a convenção do catálogo: campanha de
  afiliado tem prazo, e expirar uma oferta não deve exigir apagá-la.
- `destination_country_code` / `passport_country_code` existem porque um seguro
  ou eSIM pode fazer sentido só para um destino — mas o MVP pode deixar os dois
  nulos em todas as linhas e o filtro segue funcionando.

**RLS** (arquivo próprio, `<timestamp>_requirement_offers_rls.sql`, como as
outras tabelas de referência): `enable row level security`, policy de `select`
para `authenticated`, `revoke insert, update, delete ... from authenticated`
(o `alter default privileges` de
[table_grants.sql](supabase/migrations/20260905120200_table_grants.sql) concede
escrita por padrão a toda tabela nova — o revoke não é decorativo) e
`grant select`. Nada para `anon`.

**Seed inicial** (`<timestamp>_requirement_offers_seed.sql`): as ofertas ficam a
cargo do usuário (são links de afiliado reais dele). O seed entra com o esqueleto
ligado a `travel-insurance` e `connectivity-plan` por `code`, e o usuário troca
as URLs — ou o seed nasce vazio e ele insere pelo painel do Supabase. **Decidir
com o usuário; nenhum link inventado entra no repositório.**

### 4.5 Camada de acesso

| Arquivo                              | Ação                                                                                                                                                                                     |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/types/database.ts`              | + entrada `requirement_offers` (Row/Insert/Update/Relationships). O arquivo é mantido à mão, seguindo o padrão das tabelas vizinhas                                                      |
| `src/types/models.ts`                | + `export type RequirementOffer = Tables['requirement_offers']['Row']`                                                                                                                   |
| `src/services/requirement-offers.ts` | criar: `listForTemplate(templateId, { destinationCountryCode, passportCountryCode, today })`, filtrando `active` no banco e vigência/restrições na consulta; ordena por `position, name` |
| `src/services/trip-requirements.ts`  | + `getById(requirementId)` — o detalhe carrega o item por id; a policy `trip_requirements_select_own` já garante que só o dono enxerga                                                   |
| `src/services/index.ts`              | exportar o serviço novo                                                                                                                                                                  |

O passaporte principal para o filtro vem de `usePassports()`
([passports-context.tsx](src/features/passports/passports-context.tsx)), que a
tela já tem à disposição — nunca assumir `BR`.

### 4.6 Falhas e tom

- Item não encontrado (ou sem permissão): a tela mostra "Este item não está mais
  na sua checklist." + botão "Voltar para a viagem" — sem linguagem de erro.
- Falha ao carregar ofertas **não** derruba a tela: o bloco "Onde contratar"
  simplesmente não aparece. Descrição e fonte oficial já bastam para o item ser
  útil, e é o mesmo raciocínio do `openSource`, que falha em silêncio hoje.
- Falha ao marcar: reverte o estado local e mostra "Sua conexão oscilou. Toque
  de novo para salvar." (texto igual ao da checklist).

---

## 5. Ordem de execução sugerida

1. **Banco** — migrations de `requirement_offers` (tabela, RLS, seed) + tipos em
   `database.ts` / `models.ts` + serviço. Nada visível ainda, e desbloqueia a
   tela de detalhe.
2. **Funções puras** — `groupRequirementsByCategory` e
   `describeRequirementScope` + testes. `pnpm test` verde antes de qualquer UI.
3. **Componentes** — `ProgressRing` e `AccordionSection`, isolados.
4. **Tela de detalhe** — rota nova, consumindo o que já está pronto.
5. **Reescrita de `[id].tsx`** — anel, accordions, linha encolhida, navegação
   para o detalhe, `useFocusEffect`. É o passo com mais risco de regressão e
   entra por último, com tudo em que ele se apoia já testado.
6. `pnpm check` (ESLint + TypeScript + Prettier + testes).

## 6. Verificação manual antes de dar como concluído

- Viagem com itens em todas as categorias: as frações das seções somam o número
  do anel.
- Viagem só com informativos em uma categoria: seção mostra "N itens", sem barra.
- Marcar pelo checkbox na lista → anel e fração da seção atualizam sem recarga.
- Marcar pelo botão do detalhe → voltar → lista já reflete, sem comemoração
  repetida.
- Item de país mostra bandeira na linha e escopo correto no detalhe; item de
  grupo (Schengen) mostra o nome do grupo.
- Item sem oferta cadastrada: bloco "Onde contratar" ausente, sem espaço vazio.
- Item de visto: fonte oficial abre no navegador a partir do detalhe.
- Android: animação do accordion e chevron; iOS: fim da lista não fica sob a
  tab bar (o `contentInsetAdjustmentBehavior="automatic"` de hoje precisa
  continuar valendo na tela nova também).

## 7. Decisões que precisam do usuário

1. **Eixo das seções** (§3.1): confirmar que agrupar por categoria e mover o
   escopo para dentro do item é o desejado — hoje a lista é por escopo, e essa é
   a única informação que muda de lugar de forma perceptível.
2. **Fração da seção** (§3.2): informativos fora da conta (fecha com o anel) —
   confirmar, já que "2/4" numa categoria com informativo vai parecer contar
   menos itens do que a seção mostra.
3. **Seed das ofertas** (§4.4): quais programas de afiliado já existem e para
   quais requisitos, ou se a tabela nasce vazia para preenchimento pelo painel
   do Supabase.

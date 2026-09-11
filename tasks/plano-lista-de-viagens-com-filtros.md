# Plano — Lista de viagens com filtros rápidos

Feature: trocar o layout da aba **Viagens** pelo do protótipo. Entram filtros
rápidos abaixo do título, a lista deixa de ter seções e o card é recomposto: o
título passa a ser só o nome da viagem, e o que hoje está solto vira faixa do
momento, chips de país e um rodapé com data, fração de itens e obrigatórios
pendentes.

Status: **plano**. Nada implementado nesta etapa.

---

## 1. Ponto de partida — o que já existe

| Peça                     | Onde está                                                                       | O que faz hoje                                                             |
| ------------------------ | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Tela da lista            | [src/app/(app)/trips/index.tsx](<src/app/(app)/trips/index.tsx>)                | Carrega, decide entre loading / erro / vazio / lista, separa em 2 seções   |
| Card                     | [trip-card.tsx](src/features/trips/components/trip-card.tsx)                    | Bandeiras + % no topo, nome, contagem, barra, datas e pílula de pendentes  |
| Ordenação e resumo       | [trip-summary.ts](src/features/trips/domain/trip-summary.ts)                    | `TripSummary`, `buildTripSummaries` (ordem final), `splitTripSections`     |
| Status e contagem        | [trip-status.ts](src/features/trips/domain/trip-status.ts)                      | `getTripStatus`, `daysUntilStart`, `formatStartCountdown` (janela de 30 d) |
| Progresso                | [trip-progress.ts](src/features/trips/domain/trip-progress.ts)                  | `computeTripProgress`, `formatProgressLabel`, `formatPendingRequiredLabel` |
| Datas                    | `formatTripDates` em [trip-format.ts](src/features/trips/domain/trip-format.ts) | `"10–17 set 2026"` — já é o formato do protótipo                           |
| Anel de progresso        | [progress-ring.tsx](src/components/ui/progress-ring.tsx)                        | SVG com trilho + arco, `accessibilityRole="progressbar"`, texto no centro  |
| Bandeira por código      | [country-flag.tsx](src/components/ui/country-flag.tsx)                          | Emoji no iOS/web, sigla de 2 letras no Android                             |
| Nome do país             | `getCountryName` em [countries.ts](src/constants/countries.ts)                  | Fonte única de países — nenhuma tela mantém lista própria                  |
| Cores de prioridade/tema | [tokens.ts](src/theme/tokens.ts)                                                | `colors`, `priorityColors`, `prioritySoftColors`, `radius`, `typography`   |

**Conclusão:** a ordenação, o status, o progresso e a formatação de datas já
estão prontos e continuam valendo. O trabalho é de composição visual mais quatro
regras pequenas e puras: filtro, momento da viagem (texto + tom), fração
compacta de itens e tom da pílula de obrigatórios.

---

## 2. Diferenças entre a tela de hoje e o protótipo

| No protótipo                                        | Hoje                                                 | Mudança                                                             |
| --------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------- |
| Botão "+" roxo sólido, ícone branco                 | Círculo `primarySoft` com borda e ícone roxo         | Fundo `colors.primary`, ícone `contrastText`                        |
| Chips "Todas / Em andamento / Futuras / Concluídas" | Não existe                                           | **Novo** `TripFilterBar`                                            |
| Lista plana, sem cabeçalhos                         | Seções "Próximas viagens" e "Histórico"              | Remove `SectionLabel` da tela; `splitTripSections` continua p/ Home |
| Nome da viagem como título do card                  | Bandeiras no topo e nome abaixo                      | Nome sobe para o topo; bandeiras saem da linha do título            |
| Anel de progresso no canto superior direito         | Percentual em texto + barra no meio do card          | `ProgressRing` sem texto, colorido pelo tom; barra sai              |
| Faixa do momento ("Viagem em andamento")            | Linha de texto com bolinha, ou contagem em texto     | Faixa de largura total, fundo diluído no tom do momento             |
| Chips de país com bandeira + nome                   | `FlagRow` só com bandeiras                           | **Novo** `TripCountryChips` (máx. 3 + "+N")                         |
| Divisor antes do rodapé                             | Não existe                                           | Hairline `colors.divider`                                           |
| Rodapé: 🗓 data · "1/8 itens" · pílula               | Datas e pílula separadas, "1 de 8 itens verificados" | Uma linha só; fração compacta nova                                  |
| Pílula âmbar ou vermelha                            | Sempre vermelha (`#FDECEC` / `#C6383C`)              | Vermelha só na véspera/no dia; âmbar nos demais casos               |

Regra de ouro: **um tom por card**. O momento da viagem define a cor da faixa e
do anel, e nada mais na lista inventa cor própria.

---

## 3. Anatomia do card novo

```
┌────────────────────────────────────────────────┐
│ América do Norte                          ◔    │  nome (typography.title) + anel
│                                                │
│ ┌────────────────────────────────────────────┐ │
│ │ ● Viagem em andamento                      │ │  faixa do momento (tom)
│ └────────────────────────────────────────────┘ │
│                                                │
│ [🇺🇸 Estados Unidos] [🇨🇦 Canadá] [+3]          │  chips de país, máx. 3
│ ────────────────────────────────────────────── │  divisor
│ 🗓 10–17 set 2026   1/8 itens    [3 obrigat.]  │  rodapé
└────────────────────────────────────────────────┘
```

- O card inteiro continua sendo **um único** `Pressable` que abre o detalhe.
  Faixa e chips são informação, não alvos de toque.
- Viagem concluída usa o mesmo desenho, no tom cinza, e mantém o fundo
  levemente rebaixado que o card já tem hoje (`#FAFAFB`, sem sombra).

---

## 4. Regras novas (puras, no domínio)

### 4.1 Filtro da lista — `trip-summary.ts`

```ts
export type TripFilter = 'all' | 'ongoing' | 'upcoming' | 'completed';

export function filterTripSummaries(
  summaries: readonly TripSummary[],
  filter: TripFilter,
): TripSummary[];
```

Filtra por `summary.status` preservando a ordem de `buildTripSummaries` — a
ordenação continua sendo a regra única do produto (em andamento, próximas por
início, concluídas por término mais recente). Viagem sem datas é `upcoming`,
então aparece em "Futuras".

### 4.2 Momento da viagem — `trip-status.ts`

```ts
export type TripMomentTone = 'ongoing' | 'imminent' | 'upcoming' | 'completed';
export type TripMoment = { tone: TripMomentTone; label: string };

export function buildTripMoment(trip: DateRange, today?: string): TripMoment;
```

| Situação              | Tom         | Texto                 |
| --------------------- | ----------- | --------------------- |
| Término já passou     | `completed` | `Concluída`           |
| Começa hoje           | `imminent`  | `Embarque hoje`       |
| Começa amanhã         | `imminent`  | `Começa amanhã`       |
| Em andamento          | `ongoing`   | `Viagem em andamento` |
| Começa em até 45 dias | `upcoming`  | `Começa em 13 dias`   |
| Começa depois disso   | `upcoming`  | `Começa em 4 meses`   |
| Sem data de início    | `upcoming`  | `Escolha as datas`    |

"Embarque hoje" é a mesma palavra que a Home usa no dia do embarque, de
propósito. A janela de 45 dias existe para não exibir "Começa em 240 dias";
`formatStartCountdown` (janela de 30 dias) continua como está, servindo a quem
já a usa.

### 4.3 Fração compacta — `trip-progress.ts`

```ts
/** "1/8 itens" — versão curta de formatProgressLabel, para o rodapé do card. */
export function formatProgressFraction(progress: TripProgress): string;
```

Mesmo recorte da porcentagem (obrigatórios + recomendados; informativos fora).
Sem itens, devolve `Checklist em preparação`.

### 4.4 Tom da pílula de obrigatórios

Sem regra nova no domínio: usa `formatPendingRequiredLabel` (já existe) e o tom
do momento. Vermelha quando `tone === 'imminent'` — véspera ou dia do embarque,
que é quando o obrigatório pendente vira urgência real; âmbar nos demais casos.
Com tudo verificado, continua valendo a pílula "Pronta 🎉" de hoje.

---

## 5. Onde cada peça mora

**Alterados**

- `src/theme/tokens.ts` — novo `tripMomentColors` (accent / soft / text por tom).
  `ongoing` reaproveita `primary` + `primarySoft`; `imminent` reaproveita os
  âmbares de `priorityColors.recommended`; `upcoming` traz um verde novo;
  `completed` usa cinzas já existentes.
- `src/components/ui/progress-ring.tsx` — dois parâmetros opcionais: `color`
  (padrão `colors.primary`) e `label: string | null` (com `null` não renderiza o
  texto central). Mudança retrocompatível: o detalhe da viagem não muda.
- `src/features/trips/domain/trip-status.ts` — `buildTripMoment`.
- `src/features/trips/domain/trip-summary.ts` — `TripFilter` + `filterTripSummaries`.
- `src/features/trips/domain/trip-progress.ts` — `formatProgressFraction`.
- `src/features/trips/components/trip-card.tsx` — reescrito (mesmas props).
- `src/app/(app)/trips/index.tsx` — filtros, lista plana, vazios por filtro,
  botão "+" sólido.

**Novos**

- `src/features/trips/components/trip-filter-bar.tsx` — os quatro chips.
- `src/features/trips/components/trip-country-chips.tsx` — bandeira + nome, no
  máximo 3, com chip "+N" para o restante. Reusa `CountryFlag` e
  `getCountryName`.
- `src/features/trips/tests/trip-moment.test.ts` e casos novos em
  `trip-summary` / `trip-progress`.

`FlagRow` continua como está — quem usa é a Home e o detalhe da viagem.

---

## 6. Estados vazios

O vazio geral (nenhuma viagem cadastrada) continua o de hoje, com o botão
"Criar viagem". Os filtros ganham vazios próprios, sempre com o próximo passo:

| Filtro       | Texto                                           | Ação           |
| ------------ | ----------------------------------------------- | -------------- |
| Em andamento | "Quando sua viagem começar, ela aparece aqui."  | "Ver futuras"  |
| Futuras      | "Que tal marcar a próxima?"                     | "Criar viagem" |
| Concluídas   | "Suas viagens concluídas ficam guardadas aqui." | "Ver todas"    |

As ações dos dois primeiros só trocam o filtro — nada de navegação nova.

---

## 7. Acessibilidade

- Chip de filtro: `accessibilityRole="button"` +
  `accessibilityState={{ selected }}`, rótulo "Filtrar por futuras".
- Card: um alvo só, com rótulo composto — "América do Norte, viagem em
  andamento, Estados Unidos e Canadá, 10 a 17 de setembro de 2026, 1 de 8 itens
  verificados, 3 obrigatórios pendentes".
- Anel: mantém `accessibilityRole="progressbar"` com o percentual real, mesmo
  sem texto visível.
- Em 0% o arco recebe um mínimo visível (um ponto no topo), para o anel nunca
  parecer quebrado — o valor lido pelo leitor de tela continua sendo 0.

---

## 8. Passo a passo

1. **Domínio + testes**: `filterTripSummaries`, `buildTripMoment`,
   `formatProgressFraction`. Nada de UI ainda.
2. **Tokens**: `tripMomentColors`.
3. **`ProgressRing`**: `color` e `label: null`.
4. **`TripFilterBar`** e **`TripCountryChips`** isolados.
5. **`TripCard`** reescrito sobre as peças acima.
6. **Tela**: estado do filtro, lista plana, vazios por filtro, botão "+".
7. `pnpm check` e conferência no app (iOS, Android e web — a bandeira degrada
   para sigla no Android, então o chip fica "US Estados Unidos"; é o mesmo
   comportamento já aceito nas outras telas).

Os passos 1–3 não mudam nada na tela e podem ir em um commit; 4–6 é o
redesenho em si.

---

## 9. Testes

Só domínio, em `node:test`, como o resto da feature:

- `filterTripSummaries`: cada filtro devolve o subconjunto certo e preserva a
  ordem original.
- `buildTripMoment`: concluída, em andamento, embarque hoje, véspera, dentro da
  janela de dias, além dela (meses) e viagem sem datas.
- `formatProgressFraction`: `0/15`, `1/8` e checklist vazia.

---

## 10. Decisões assumidas

1. **Nome completo do país no chip.** O protótipo mostra "EUA"; o catálogo do
   app diz "Estados Unidos" e é a fonte única de países. O chip usa o nome do
   catálogo com uma linha só e reticências, em vez de criar uma segunda lista de
   nomes curtos.
2. **Três chips de país, não quatro.** Com nomes por extenso, três já ocupam a
   largura do card; o restante vira "+N", como no protótipo.
3. **Chips desenhados em JS, e não `SegmentedControl` nativo.** O visual dos
   filtros (pílula roxa preenchida) é o do protótipo e não é o do controle
   nativo de nenhuma das plataformas. Se preferir o componente nativo do
   `@expo/ui`, o layout dos filtros muda e o resto do plano segue igual.
4. **O filtro não persiste.** Ao voltar para a aba, a lista abre em "Todas".
5. **Sem contadores nos chips.** Os quatro aparecem sempre, mesmo vazios, para a
   barra não mudar de tamanho conforme as viagens.

---

## 11. Fora de escopo

Busca, ordenação manual, paginação, seleção múltipla, mudança na Home ou no
detalhe da viagem e qualquer alteração de schema.

# Plano — Home full-screen com ambientação sazonal

Feature: transformar a Home de "um card branco no centro da tela com partículas
atrás" em uma tela inteira que é o ambiente da viagem — fundo sazonal,
partículas em toda a área, conteúdo achatado sobre o fundo e interação por toque
com as partículas como easter egg.

Status: **plano**. Nada implementado nesta etapa.

---

## 1. Ponto de partida — o que a Home é hoje

| Peça                       | Onde está                                                                                                | O que ela faz hoje                                                                                         |
| -------------------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Tela da Home               | [src/app/(app)/index.tsx](<src/app/(app)/index.tsx>)                                                     | Carrega as viagens, escolhe a próxima, resolve as estações, decide entre loading / erro / card / vazio     |
| Card protagonista          | [next-trip-hero.tsx](src/features/trips/next-trip-hero.tsx)                                              | Card branco com eyebrow, bandeiras, nome, contagem, datas, estações, divisor, progresso e rodapé roxo      |
| Campo de partículas        | [season-field.tsx](src/features/trips/season-field.tsx)                                                  | Simulação física em worklet (`useFrameCallback`), `StyleSheet.absoluteFill`, `pointerEvents="none"`        |
| Silhuetas das partículas   | [season-shapes.tsx](src/features/trips/season-shapes.tsx)                                                | `leaf`, `petal`, `flake`, `mote` em `react-native-svg`, viewBox 24×24                                      |
| Navegação inferior         | [(app)/\_layout.tsx](<src/app/(app)/_layout.tsx>) + [.web.tsx](<src/app/(app)/_layout.web.tsx>)          | `NativeTabs` (UITabBarController / BottomNavigationView); web tem variante `js-tabs`                       |
| Estação da viagem          | `tripSeasons` / `seasonAt` em [requirement-matching.ts](src/features/trips/requirement-matching.ts)      | Deriva a estação de **destino + datas** (hemisfério sul invertido)                                         |
| Contagem regressiva        | `buildTripCountdown` em [trip-status.ts](src/features/trips/trip-status.ts)                              | Devolve `kind` + `days` + `message` + `label`; já cobre hoje / amanhã / em andamento / sem data            |
| Progresso                  | `computeTripProgress` / `formatProgressLabel` em [trip-progress.ts](src/features/trips/trip-progress.ts) | Regra única: obrigatório + recomendado contam, informativo não                                             |
| Próxima viagem e ordenação | `buildTripSummaries` / `splitTripSections` em [trip-summary.ts](src/features/trips/trip-summary.ts)      | `active[0]` já é exatamente a viagem que a Home destaca                                                    |
| Próximo passo              | `selectNextRequirement` em `requirement-matching.ts`                                                     | Item pendente mais importante da checklist                                                                 |
| Textos de estação          | `formatSeasonTrail` / `summarizeTripSeasons` em [trip-format.ts](src/features/trips/trip-format.ts)      | `"🍂 Outono · ❄️ Inverno"` já existe pronto                                                                |
| Datas formatadas           | `formatTripDates` em `trip-format.ts`                                                                    | `"10–17 set 2026"` — exatamente o formato do protótipo                                                     |
| Barra de progresso         | [progress-bar.tsx](src/components/ui/progress-bar.tsx)                                                   | Trilho + preenchimento, `accessibilityRole="progressbar"`                                                  |
| Bandeiras                  | [flag-row.tsx](src/features/trips/flag-row.tsx)                                                          | Emojis de bandeira (código de 2 letras no Android)                                                         |
| Reduzir movimento          | `useReduceMotion` em [animation.ts](src/lib/animation.ts)                                                | Toda animação decorativa consulta isto                                                                     |
| Tokens                     | [tokens.ts](src/theme/tokens.ts)                                                                         | `seasonColors`, `seasonSoftColors`, `seasonBorderColors`, `typography.countdown` (88px, fonte arredondada) |

**Conclusão: quase toda a regra que a nova Home precisa já existe.** O trabalho é
de composição visual e de física de partículas — nenhum cálculo de negócio novo.

O que **não** existe hoje e o protótipo pede:

1. Fundo sazonal (tint/gradiente) na tela inteira.
2. Dica contextual da estação ("Período de folhas douradas...").
3. Badge de estação em pílula no canto superior direito.
4. Interação das partículas com o dedo.
5. Layout achatado (sem card branco envolvendo tudo).

---

## 2. Diferenças entre o que existe e o layout do protótipo

| Elemento no protótipo                    | Hoje                                                  | Mudança                                                                                     |
| ---------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Fundo bege quente com tint da estação    | `colors.background` cinza neutro, sem tint            | **Novo** `SeasonalBackdrop` pintando base + tint radial                                     |
| Partículas na tela toda                  | Já ocupam a tela toda (ficam atrás do card)           | Mantém; ganham profundidade e reação ao toque                                               |
| "SUA PRÓXIMA VIAGEM" + destino + nome    | Dentro do card, com bandeiras acima do nome           | Sai do card; vira cabeçalho da tela. Bandeiras entram na linha do destino                   |
| Pílula "🍂 Outono" no topo direito       | Linha de texto abaixo das datas (`formatSeasonTrail`) | **Move** para pílula no cabeçalho; usa o mesmo `formatSeasonTrail`                          |
| Numeral gigante centralizado             | Já existe (88px), mas dentro do card                  | Passa a flutuar sobre o fundo, sem container                                                |
| "DIAS PARA VIAJAR" + datas               | Já existe                                             | Mantém, só reordena (label acima das datas)                                                 |
| Divisor hairline                         | Já existe (`styles.divider`)                          | Mantém, agora sobre o fundo                                                                 |
| Preparação + % + barra + "1 de 8"        | Já existe                                             | Mantém achatado, sem card                                                                   |
| Card "Próximo passo" com botão Verificar | Rodapé roxo colado no card, largura total             | Vira **o único bloco com container**: cantos arredondados, fundo roxo diluído, botão sólido |
| "🍂 Dica do outono" + parágrafo          | Não existe                                            | **Novo** texto plano, sem card                                                              |
| Bottom navigation                        | `NativeTabs` do sistema                               | **Sem mudança** — continua nativa                                                           |

**Regra de ouro do redesenho:** um container só na tela — o do próximo passo,
porque é o único bloco acionável que precisa de alvo de toque delimitado. Todo o
resto vive direto sobre o fundo.

---

## 3. Estrutura de componentes recomendada

```
src/app/(app)/index.tsx                     (tela — orquestra dados + estados)
└── <View> raiz  ← onTouchStart/Move/End: alimenta o ponteiro das partículas
    ├── <SeasonalBackdrop seasons pointer/>  ← NOVO arquivo
    │   ├── base + tint radial (react-native-svg)
    │   └── <SeasonField/>                   ← arquivo existente, estendido
    │
    ├── <SafeAreaView edges={['top']}>
    │   └── <ScrollView>
    │       └── <NextTripHome/>              ← next-trip-hero.tsx reescrito
    │           ├── HomeHeader   (eyebrow, destino+bandeiras, nome, pílula)
    │           ├── Countdown    (numeral, label, datas)
    │           ├── Preparation  (título, %, ProgressBar, "1 de 8")
    │           ├── NextStep     (único card)
    │           └── SeasonTip    (texto plano)
    │       ou <HomeEmptyState/> / loading / retry
    │
    └── (NativeTabs desenha a barra por fora, no _layout)
```

### 3.1 Arquivos

| Arquivo                                    | Ação            | Responsabilidade                                                                                              |
| ------------------------------------------ | --------------- | ------------------------------------------------------------------------------------------------------------- |
| `src/app/(app)/index.tsx`                  | **altera**      | Passa a hospedar o backdrop, o `SharedValue` do ponteiro e os handlers de toque. Dados e estados não mudam.   |
| `src/features/trips/seasonal-backdrop.tsx` | **cria**        | Base quente + tint radial da estação + `SeasonField`. Recebe `seasons`, `seed` e o `SharedValue` do ponteiro. |
| `src/features/trips/season-field.tsx`      | **altera**      | Ganha `depth` por partícula e a força do ponteiro. A simulação segue toda em worklet.                         |
| `src/features/trips/next-trip-hero.tsx`    | **reescreve**   | Deixa de ser card e vira a composição achatada. Mantém nome e contrato (`summary`, `seasons`, `onOpen`).      |
| `src/features/trips/season-shapes.tsx`     | **altera leve** | Variante de baixo detalhe para partículas de fundo (sem nervura/farpas), no lugar do `blur` do canvas.        |
| `src/features/trips/trip-format.ts`        | **altera**      | Ganha `formatSeasonTip(seasons)` — o `SEASONS` com emoji/label já mora lá.                                    |
| `src/theme/tokens.ts`                      | **altera**      | Ganha `seasonBackdropColors` (base quente + cor do tint por estação).                                         |
| `src/app/(app)/_layout.tsx` / `.web.tsx`   | **não muda**    | A navegação continua nativa.                                                                                  |

Nenhum componente de `components/ui/` é criado: `ProgressBar` e `FlagRow` são
reaproveitados como estão.

### 3.2 Por que reescrever `next-trip-hero.tsx` em vez de criar `home-content.tsx`

O componente já é o "bloco protagonista da Home", já recebe exatamente
`summary` + `seasons` + `onOpen`, e não é usado em nenhuma outra tela
(confirmado por busca). Criar um arquivo novo e deixar o antigo é duplicar. As
sub-partes (`HomeHeader`, `Countdown`, ...) ficam como funções locais no mesmo
arquivo enquanto não forem reusadas em outra tela — é o que o AGENTS.md pede
sobre não criar camadas desnecessárias.

---

## 4. Tecnologia para as partículas

**Recomendação: manter exatamente a pilha atual — Reanimated 4 (`useFrameCallback`

- `useSharedValue` + worklets) desenhando `Animated.View` com `react-native-svg`
  dentro.** Zero dependência nova.

Justificativa contra as alternativas:

| Alternativa                     | Por que não                                                                                                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@shopify/react-native-skia`    | É a opção "certa" para milhares de partículas em canvas. Para ~24 partículas é peso de binário, config de build e uma segunda engine de render no app — sem ganho perceptível. |
| `expo-gl` / WebGL               | Mesma objeção, com mais superfície de bug e sem suporte a texto/SVG nativo por cima.                                                                                           |
| `WebView` com o canvas do Figma | Copiaria o HTML literal, que é justamente o que não se quer; custo de WebView na Home é proibitivo.                                                                            |
| `Animated` da RN (JS driver)    | A simulação passaria a rodar na thread de JS e travaria durante scroll e durante o `fetch` das viagens.                                                                        |

O que a pilha atual já garante: simulação inteira na UI thread, JS sem
participar de nenhum quadro, laço parado quando a Home perde foco.

---

## 5. Adaptando a física do Figma Make para React Native

O protótipo Web e o `SeasonField` atual são **dois modelos diferentes de queda**.
O do app é mais rico (gravidade real, velocidade terminal, giro em profundidade
com achatamento); o da Web tem duas coisas que o app não tem: **profundidade** e
**ponteiro**. O plano é importar essas duas, não trocar de modelo.

### 5.1 Mapa conceito a conceito

| Conceito no Web                                   | Equivalente no app                                  | Ação                                                                            |
| ------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------- |
| `x, y, vx, vy`                                    | `Body.x/y/vx/vy`                                    | Já existe                                                                       |
| `natVx, natVy` (velocidade natural)               | `gravity` + `terminal` + `sway` no `Descriptor`     | Já existe, e é mais fiel — a velocidade natural é _derivada_, não fixa          |
| `rotation, rotSpeed`                              | `Body.spin` + `Descriptor.spin`                     | Já existe                                                                       |
| `wobbleOffset/Speed/Amp`                          | `sway` modulado por `Math.sin(body.tumble)`         | Já existe, com origem física melhor                                             |
| `depth` (0.2–1.0)                                 | **não existe**                                      | **Adicionar** ao `Descriptor`                                                   |
| `blur` (canvas filter)                            | **não existe**                                      | **Substituir** por tamanho + opacidade + forma de baixo detalhe                 |
| `type` (variação de silhueta)                     | `SeasonShapeKind` (uma por estação)                 | Manter uma silhueta por estação — é a identidade do app                         |
| `pointer` + raio + força                          | **não existe**                                      | **Adicionar** (§5.3)                                                            |
| `sort(depth)` para pintar de trás para frente     | Ordem dos `Animated.View` no JSX                    | Ordenar os `descriptors` por `depth` **uma vez**, na criação — nunca por quadro |
| wrap horizontal (sai à direita, entra à esquerda) | Paredes com `WALL_RETENTION` (quica)                | Manter o quique: com poucas partículas grandes, o wrap chama atenção            |
| respawn no topo                                   | `RECYCLE_MARGIN` + reposicionamento aleatório       | Já existe, e melhor                                                             |
| unidades por **frame** (`p.x += p.vx`)            | unidades por **segundo** (`body.x += body.vx * dt`) | Manter o `dt` do app — os números do Web precisam ser reescalados, não copiados |

> ⚠️ Ponto de atenção: **nenhuma constante numérica do `App.jsx` deve ser
> copiada.** O Web trabalha em px/frame a 60fps num viewport de 390×844; o app
> trabalha em px/segundo numa tela medida em runtime. Copiar `0.3` de força ou
> `80` de raio dá comportamento errado nos dois eixos.

### 5.2 Profundidade (`depth`)

Distribuição igual à do protótipo, que é boa: 55% ao fundo, 30% no meio, 15% à
frente. `depth ∈ [0.2, 1.0]` sorteado no `createDescriptors` e usado para
modular o que já existe:

- `size` — `size * lerp(0.55, 1, depth)`; fundo menor.
- `opacity` — fundo **mais** apagado que o protótipo, porque no app o texto fica
  por cima e não há blur para separar as camadas.
- `gravity` / `terminal` — multiplicados por `depth`: o fundo cai devagar, o que
  é o próprio efeito de paralaxe.
- raio e força do ponteiro (§5.3).
- ordem de pintura: `descriptors.sort((a, b) => a.depth - b.depth)` **uma vez**,
  depois do sorteio.

Sem blur: `expo-blur` por partícula seria uma view de blur por elemento (caro no
Android, e no iOS um `UIVisualEffectView` por folha). A leitura de profundidade
vem de **tamanho menor + opacidade menor + queda mais lenta + silhueta sem
detalhe interno** — em movimento, o olho lê isso como distância.

### 5.3 Ponteiro

Estado novo no `FieldState` (ou em um `SharedValue` irmão), escrito de fora:

```ts
type Pointer = { x: number; y: number; active: boolean };
```

No worklet do quadro, para cada partícula, na mesma ordem do protótipo:

1. `radius = POINTER_RADIUS * (0.7 + 0.5 * depth)` — quem está à frente sente
   mais longe. `POINTER_RADIUS` em px de tela (ordem de 110–140), não em px/frame.
2. Se `active` e `dist < radius`: `force = (1 - dist / radius) * POINTER_FORCE * depth`,
   aplicada como **aceleração** (`vx += nx * force * dt`), não como incremento
   direto de velocidade — é o que traduz o modelo por-frame do Web para o modelo
   por-segundo do app. Empuxo lateral maior que o vertical, como no protótipo.
3. Retorno suave: o app já tem `AIR_DRAG` no eixo X e clamp de `terminal` no
   eixo Y. Basta somar um clamp de velocidade máxima empurrada (`vx` e `vy`
   limitados a um múltiplo da `terminal` da partícula) para que, solto o dedo, o
   arrasto e a gravidade devolvam a queda natural em ~1s. **Não é preciso**
   guardar `natVx/natVy` como o Web faz: no app a velocidade natural é o atrator
   do sistema, não um valor memorizado.
4. `active: false` quando o dedo sai: a força some, o retorno acontece sozinho.

### 5.4 O que sai do protótipo e não entra

- Blur por partícula (§5.2).
- Quatro variações de silhueta por estação — o app já tem uma silhueta autoral
  por estação e multiplicá-las é ruído.
- Gradiente radial por partícula do `drawDust`: no app o `mote` já é um núcleo
  com halo em SVG, o que basta.

---

## 6. Interação por toque, sem quebrar nada

### 6.1 Recomendação: eventos de toque bubbling no `View` raiz

```tsx
<View
  style={styles.screen}
  onTouchStart={handleTouch}
  onTouchMove={handleTouch}
  onTouchEnd={releaseTouch}
  onTouchCancel={releaseTouch}>
```

Por que essa é a menor solução que funciona:

- `onTouchStart/Move/End` do RN **borbulham** por toda a subárvore e são
  independentes do sistema de responder. O `View` raiz recebe as coordenadas de
  qualquer toque na Home **sem nunca reivindicar o toque**. Scroll, `Pressable`
  do próximo passo, abas nativas e o gesto de voltar continuam intactos — não há
  competição de gesto para resolver.
- Funciona inclusive **durante** o scroll, o que é desejável: arrastar a tela
  também sopra as folhas.
- Zero configuração nova: não exige `GestureHandlerRootView` (que hoje **não**
  está montado no [layout raiz](src/app/_layout.tsx) — o
  `react-native-gesture-handler` entra pela navegação e não é usado em nenhum
  arquivo de `src/`).

Custo: o handler roda na thread de JS e escreve `pointer.value = {...}` a cada
evento de movimento. É **uma atribuição de shared value por evento**, só
enquanto o dedo está na tela. Não há re-render de React: `pointer` é um
`SharedValue` e nada o lê no lado do JS.

### 6.2 Alternativa, se o custo de JS incomodar na medição

`react-native-gesture-handler` com `Gesture.Pan().manualActivation(true)` e
`onTouchesDown/Move/Up` — os callbacks são worklets (ponteiro escrito direto na
UI thread) e, por nunca chamar `state.activate()`, o gesto jamais rouba o toque.
Exige montar `GestureHandlerRootView` no layout raiz. **Só adotar se a medição
mostrar problema**, porque acrescenta uma peça de infraestrutura que o app hoje
não tem.

### 6.3 Regras do easter egg

- Nenhum texto do tipo "deslize para interagir", nenhum badge, nenhuma dica.
- O campo continua `pointerEvents="none"` e
  `accessibilityElementsHidden` / `importantForAccessibility="no-hide-descendants"`:
  para o VoiceOver/TalkBack a tela não muda em nada.
- Com "reduzir movimento" ligado o `SeasonField` já devolve `null` — não há
  partícula, e portanto não há interação. Correto: quem pediu menos movimento
  não deve conseguir provocar movimento.

---

## 7. Scroll e navegação

### 7.1 A composição cabe? Medição

Somando o layout do protótipo com os tokens atuais (topo 52 + cabeçalho ~76 +
contagem 88 + rótulos ~170 + divisor + progresso ~72 + próximo passo ~96 + dica
~60 + respiros), a composição fica em **~640–680 pt** de conteúdo. Contra a área
útil:

| Aparelho                    | Altura útil (fora status bar e tab bar) | Cabe?          |
| --------------------------- | --------------------------------------- | -------------- |
| iPhone 16 Pro / 15 Pro      | ~740                                    | sim, com folga |
| iPhone SE (3ª ger.)         | ~560                                    | **não** — rola |
| Android médio (720×1600 dp) | ~700                                    | sim            |
| Fonte do sistema ampliada   | qualquer                                | **não** — rola |

Ou seja: **o scroll precisa existir, mas não pode ser o padrão.** É exatamente o
que a Home já faz hoje e deve ser preservado:

```tsx
<ScrollView
  contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between' }}
  contentInsetAdjustmentBehavior="automatic"
  bounces={false}
  alwaysBounceVertical={false}
  overScrollMode="never">
```

`flexGrow: 1` + `space-between` distribui a composição na tela grande (cabeçalho
no topo, contagem no centro visual, progresso/passo/dica embaixo) e vira rolagem
natural quando o conteúdo passa da altura. Nenhum scroll artificial é criado.

### 7.2 O fundo fica fora do `ScrollView`

`SeasonalBackdrop` é irmão do `SafeAreaView`, em `StyleSheet.absoluteFill`, e
**não** rola: a tela é a paisagem, e paisagem não se move com o conteúdo. Isso
também evita o pior caso de performance — partículas dentro de um container que
recebe `translateY` a cada quadro de scroll.

### 7.3 Navegação inferior

`NativeTabs` fica como está. O que muda é só o entorno:

- O `SeasonalBackdrop` cobre a tela inteira, inclusive a faixa sob a tab bar. No
  iOS 26 a barra é translúcida e o fundo sazonal aparece por baixo dela — que é
  precisamente o "integrada ao layout" pedido, obtido de graça pelo sistema.
- O `SafeAreaView` continua com `edges={['top']}` apenas; o inset inferior vem do
  `contentInsetAdjustmentBehavior="automatic"`, como hoje.
- `contentStyle: { backgroundColor: colors.background }` no `NativeTabs.Trigger`
  do `index` deve passar para a cor base quente da Home, senão a troca de aba
  pisca cinza antes da tela pintar.
- Nada de tab bar customizada em JS. (A variante web em `_layout.web.tsx`
  continua como está.)

---

## 8. Impacto em performance

### 8.1 Orçamento de partículas

Hoje: 16 (outono) a 24 (inverno) por estação; com duas estações, split 60/40 — o
total já fica na mesma ordem. **A tela ficar full-screen não é motivo para
aumentar a contagem**: a área de partículas já era a tela inteira; só o card
branco que as escondia parcialmente sai.

Recomendação: **teto de 26 partículas** e contagem escalada pela área da tela
(`count * clamp(area / areaBase, 0.7, 1.15)`), para o iPhone SE não ficar
saturado nem o tablet ficar vazio.

### 8.2 Custo por quadro

| Custo                | Onde                          | Avaliação                                                                             |
| -------------------- | ----------------------------- | ------------------------------------------------------------------------------------- |
| Integração da física | worklet do `useFrameCallback` | ~26 corpos × aritmética simples. Desprezível na UI thread.                            |
| `state.modify`       | 1 por quadro                  | Notifica os `useAnimatedStyle`; é o custo dominante, e é O(n) em n=26.                |
| `useAnimatedStyle`   | 1 por partícula               | 26 avaliações de worklet + 26 commits de transform por quadro. É o número a vigiar.   |
| Render de SVG        | **nenhum por quadro**         | O `<Svg>` é montado uma vez; só o `transform` da `Animated.View` que o embrulha muda. |
| Re-render de React   | **nenhum por quadro**         | Nada da simulação passa por `useState`. Confirmado no código atual.                   |
| Tint do fundo        | 1 SVG estático                | Pintado uma vez; nenhum custo por quadro.                                             |
| Ponteiro (§6.1)      | thread de JS                  | 1 escrita de shared value por evento de toque, só durante o arrasto.                  |
| GPU                  | 26 layers com transform       | Composição pura; sem blur, sem sombra animada, sem `overflow: hidden` animado.        |

### 8.3 Bateria e foco

- `useFocusEffect` já para o laço quando a Home perde foco (troca de aba,
  navegação para a checklist). **Manter** — é a maior economia disponível.
- Com o app em segundo plano, o `useFrameCallback` para junto com o display link
  da plataforma; nada a fazer.
- "Reduzir movimento" desliga tudo e mantém só o fundo tingido.
- **Item de verificação na etapa 5:** medir consumo com a Home aberta e parada
  por 5 min no iOS e no Android. Se passar de ~3%/h, o próximo corte é reduzir o
  teto para 18 partículas — não trocar de tecnologia.

### 8.4 Durante o scroll

O backdrop fica fora do `ScrollView`, então o scroll não move as partículas e não
invalida layer nenhuma delas. O scroll do RN roda nativo; a simulação roda na UI
thread. Não competem pela thread de JS.

### 8.5 iOS × Android × Expo Go

- Reanimated 4.5.1 + `react-native-worklets` 0.10.1 + New Architecture: é a
  configuração atual, e o `SeasonField` **já roda hoje**. Nada muda de suporte.
- **Expo Go:** funciona, com a ressalva de sempre — o JS roda sem otimização de
  produção. A avaliação de fluidez precisa ser feita em **development build ou
  release**, nunca em Expo Go.
- **Android:** a `elevation` do `shadow.card` some junto com o card branco, o que
  na prática _melhora_ o custo. Atenção ao emoji de bandeira, que o Android não
  desenha — o `FlagRow` já trata com o código de 2 letras.
- **Web:** `useFrameCallback` funciona; o `_layout.web.tsx` continua com a barra
  em JS. A web não é alvo desta feature, mas não pode quebrar (`pnpm check` cobre
  tipos; a verificação visual é manual).

---

## 9. Arquivos alterados e criados

**Criados (1)**

- `src/features/trips/seasonal-backdrop.tsx`

**Alterados (6)**

- `src/app/(app)/index.tsx` — backdrop, ponteiro, handlers de toque, `ScrollView`.
- `src/features/trips/next-trip-hero.tsx` — reescrito como composição achatada.
- `src/features/trips/season-field.tsx` — `depth` + ponteiro + escala por área.
- `src/features/trips/season-shapes.tsx` — variante de baixo detalhe.
- `src/features/trips/trip-format.ts` — `formatSeasonTip`.
- `src/theme/tokens.ts` — `seasonBackdropColors`.

**Não tocados**

`_layout.tsx` (raiz e `(app)`), `trip-status.ts`, `trip-progress.ts`,
`trip-summary.ts`, `requirement-matching.ts`, `progress-bar.tsx`, `flag-row.tsx`,
serviços, banco. **Nenhuma migration.**

---

## 10. Dependências

**Nenhuma nova.**

| Precisaria de…        | Já temos                                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------------------------ |
| Gradiente do fundo    | `react-native-svg@15.15.4` (`<RadialGradient>` reproduz o `radial-gradient(ellipse at 50% 0%)` do protótipo) |
| Física e animação     | `react-native-reanimated@4.5.1` + `react-native-worklets@0.10.1`                                             |
| Formas das partículas | `react-native-svg`                                                                                           |
| Ícones                | `@expo/vector-icons`                                                                                         |
| Navegação             | `expo-router` + `NativeTabs`                                                                                 |

Descartados de propósito: `expo-linear-gradient` (o SVG já resolve, e o gradiente
do protótipo é radial), `expo-blur` (§5.2), `@shopify/react-native-skia` (§4).

**Fonte serifada do numeral:** o protótipo usa _Fraunces_. A recomendação é
**manter `typography.countdown` com a fonte arredondada do sistema** — é a
identidade que o app já construiu e evita carregar um arquivo de fonte. Se a
serifada for inegociável, é um item isolado (`expo-font`, que já é dependência, +
o `.ttf` em `assets/`), e deve virar tarefa própria, não parte desta.

---

## 11. Plano de implementação por etapas

Cada etapa termina com `pnpm check` verde e a Home funcionando — nada de etapa
que deixa a tela quebrada no meio.

### Etapa 1 — Fundo sazonal (sem mexer no conteúdo)

1. `seasonBackdropColors` em `tokens.ts`: base quente (na linha do `#F8F6F2` do
   protótipo) + cor do tint por estação, derivada de `seasonColors`.
2. `seasonal-backdrop.tsx`: `View` da base + `<Svg>` com `<RadialGradient>`
   elíptico no topo + `<SeasonField>` por dentro.
3. `index.tsx` troca `<SeasonField>` por `<SeasonalBackdrop>`.
4. `contentStyle` da aba `index` passa a usar a base quente.

_Resultado:_ mesma Home, fundo novo. Reversível em um commit.

### Etapa 2 — Layout achatado

1. Reescrever `next-trip-hero.tsx`: cabeçalho + pílula, contagem, divisor,
   progresso, card do próximo passo, dica.
2. `formatSeasonTip` em `trip-format.ts` (uma frase por estação, no tom do
   produto — positiva e acionável, como manda o AGENTS.md).
3. `index.tsx`: `justifyContent: 'space-between'` no `contentContainerStyle`.
4. Rever alvos de toque: a área da contagem/progresso continua abrindo a
   checklist (`onOpen`), e o botão "Verificar" é o alvo primário.

_Resultado:_ o layout do protótipo, com as partículas antigas.

### Etapa 3 — Profundidade nas partículas

1. `depth` no `Descriptor`, com a distribuição 55/30/15.
2. Modulação de `size`, `opacity`, `gravity`, `terminal`.
3. `sort` por `depth` na criação.
4. Variante de baixo detalhe em `season-shapes.tsx` para `depth < 0.45`.
5. Escala de contagem por área, com teto de 26.

_Resultado:_ paralaxe. Ainda sem toque.

### Etapa 4 — Ponteiro

1. `SharedValue<Pointer>` criado em `index.tsx`, repassado ao backdrop.
2. `onTouchStart/Move/End/Cancel` no `View` raiz.
3. Força no worklet (§5.3) + clamp de velocidade empurrada.
4. Conferir na mão: scroll, botão "Verificar", toque no bloco da viagem, troca de
   aba, voltar do Android, modais.

_Resultado:_ o easter egg.

### Etapa 5 — Estados e acabamento

1. **Próxima viagem** — `kind: 'days'`: numeral + "dias para viajar". Já pronto.
2. **Amanhã** — `kind: 'tomorrow'`: "Falta 1 dia" / "Últimos preparativos". Já pronto.
3. **Hoje** — `kind: 'today'`: "Chegou a hora!" / "Boa viagem!". A tipografia
   `countdownMessage` (32px) substitui o numeral. Já pronto.
4. **Em andamento** — `kind: 'ongoing'`: "Aproveite!" / "Viagem em andamento", com
   o eyebrow virando "Sua viagem". Já pronto.
5. **Sem datas** — `kind: 'undated'`: "Quase lá..." + "Escolha as datas para ver a
   contagem". Sem estação ⇒ **sem partículas e sem tint**: o backdrop cai para a
   base neutra. Vale conferir se a tela sem clima não fica pobre demais.
6. **Concluída** — não chega aqui: `splitTripSections` filtra, e `active[0]` nunca
   é uma viagem concluída. Sem contagem negativa, por construção.
7. **Nenhuma viagem** — empty state redesenhado para o novo ambiente: "Para onde
   você vai?" + "Criar viagem", sobre o fundo, sem card. Sem viagem não há
   estação; o fundo fica na base neutra e sem partículas.
8. **Loading / falha de rede** — mantidos como estão, centralizados sobre o fundo.
9. Medição de bateria e frame rate (§8.3) em development build, iOS e Android.
10. `pnpm check`.

---

## 12. Riscos e casos de borda

| Risco                                                                 | Gravidade | Mitigação                                                                                                                                                                      |
| --------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Legibilidade do texto sobre partículas em movimento                   | **alta**  | Reduzir a opacidade das partículas de frente (§5.2) e nunca deixá-las passar por cima do numeral com opacidade alta. Verificar contraste no maior tamanho de fonte do sistema. |
| `onTouchMove` não borbulhar como esperado em alguma superfície nativa | média     | Verificar na Etapa 4 em iOS e Android, dentro e fora do `ScrollView`. Plano B pronto em §6.2.                                                                                  |
| Sem card branco, o texto perde o "chão" e a tela fica lavada          | média     | O tint radial e o divisor hairline são o contraste. Se não bastar, um véu branco de ~55% de opacidade atrás do bloco de texto — ainda sem virar card.                          |
| Fundo quente destoar do resto do app (cinza `#F5F5F7`)                | média     | O `colors.background` **não muda**: só a Home é quente. Conferir a transição visual Home → Viagens.                                                                            |
| Contagem grande (ex.: "365") estourar a largura                       | baixa     | `adjustsFontSizeToFit` + `numberOfLines={1}` já estão no código atual — manter.                                                                                                |
| Nome de viagem longo empurrar a composição                            | baixa     | `numberOfLines={2}` já existe; o `ScrollView` absorve o resto.                                                                                                                 |
| Duas estações: pílula "🍂 Outono · ❄️ Inverno" ficar larga demais     | baixa     | `formatSeasonTrail` já monta a string; a pílula usa `numberOfLines={1}` e encolhe antes do nome da viagem.                                                                     |
| Estação de hemisfério sul parecer errada para quem olha               | baixa     | Já é assim hoje e é intencional (`seasonAt`): a estação é do **destino**, não de quem olha. A pílula deixa isso explícito.                                                     |
| Bandeiras não renderizarem no Android                                 | baixa     | `FlagRow` já cai para o código de 2 letras.                                                                                                                                    |
| Aba trocada durante um arrasto deixar o ponteiro "preso" ativo        | baixa     | `useFocusEffect` zera `pointer.active` ao sair, além do `onTouchCancel`.                                                                                                       |
| Teste de regra quebrar                                                | nenhuma   | `trip-status.test.ts` e `requirement-matching.test.ts` não tocam em UI; nenhum arquivo testado é alterado.                                                                     |
| iPhone SE com fonte ampliada                                          | média     | É o caso que o `flexGrow` + rolagem resolve. Testar explicitamente na Etapa 2.                                                                                                 |

---

## 13. O que este plano deliberadamente não faz

- Não vira planejador de viagem: nenhuma lista de viagens, nenhum clima real,
  nenhuma previsão. A aba Viagens continua sendo o lugar da lista.
- Não adiciona horas/minutos/segundos à contagem.
- Não cria seletor manual de estação.
- Não customiza a bottom navigation.
- Não muda nenhuma regra de negócio, nenhum serviço e nenhuma tabela.

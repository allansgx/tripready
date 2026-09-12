# Splash animado

A abertura do TripReady: um avião que decola sobre as nuvens e a Home entrando.
Referência de fluidez: o splash do Duolingo.

Status: **implementado.** Falta conferir a costura com o splash nativo em build
nativo — §10.

---

## 1. De onde se partiu

Antes disso existiam **três telas** entre o toque no ícone e a Home: o splash
nativo azul, um `ActivityIndicator` roxo sobre fundo cinza e, por fim, a tela.
Cada troca era um corte seco. O ícone do app ainda era o do template do Expo e o
fundo do splash era azul, enquanto a cor da marca é roxa.

## 2. O resultado

1. Céu claro com um banco de nuvens baixo, o avião parado no centro.
2. O avião decola. O alto do céu escurece no roxo da marca e camadas de nuvem
   descem por baixo dele — é a passagem delas que diz que ele está subindo.
3. O avião some pelo topo e a cena fica inteira por um instante.
4. O céu se abre para a frente e a Home já está lá.

Não há rastro atrás do avião: houve, em quatro formatos, e nenhum ficou bom
(§5.1). Também não há tela de marca com texto — ela existiu e custava segundos
de toda abertura para dizer o que o ícone do app já tinha dito. O roxo da marca
continua na tela, como altitude e não como cartaz.

## 3. As duas costuras

Fluidez aqui não é questão de biblioteca de animação. É de **não existir nenhum
corte perceptível** em dois pontos.

**Costura 1 — splash nativo → animação.** O sistema desenha o splash nativo
antes de o JavaScript existir; não há como animá-lo. A saída é fazer o **primeiro
quadro da animação ser visualmente idêntico a ele**: mesmo fundo, mesmo avião,
mesmo tamanho, mesma posição. Aí a troca é invisível e a decolagem parece começar
do próprio ícone do app.

Por isso o avião **parte do centro**, e não de baixo: o centro é onde o splash
nativo desenha o ícone.

Três coisas sustentam essa igualdade, e quebrar qualquer uma faz a troca piscar:

- `PLANE_MARK_SIZE` e o `imageWidth` do `app.json` são o mesmo número.
- A cor do céu do primeiro quadro e o `backgroundColor` do `app.json` são a
  mesma cor, e ela é **chapada** — nuvens e gradiente entram depois, a partir do
  zero.
- O PNG e o SVG saem do mesmo `plane-art.ts` (§9).

O `SplashScreen.hideAsync()` acontece quando o overlay pinta o primeiro quadro
(no `onLayout`), e não quando o app fica pronto. Junto vai um
`setOptions({ fade: true, duration: 150 })` como seguro, caso o PNG e o SVG não
casem pixel a pixel.

**Costura 2 — animação → app.** A animação não pode terminar antes de o app
estar pronto (voltaria o indicador de carga) nem esperar por ele parada (viraria
espera). Quando o avião sai pelo topo, a cena fica inteira e sem movimento
pendente: esse é o **ponto de absorção**, em que dá para segurar quanto for
preciso sem ninguém perceber. E a saída não é uma cortina que some — o céu **se
abre para a frente** e sai de quadro, deixando a Home no lugar. A última parte da
abertura é a entrada dela.

## 4. Escolha de tecnologia

O pedido original citava Rive. Os quatro caminhos avaliados:

| Caminho                  | Dependência nova                                               | Expo Go    | Custo de produção                              |
| ------------------------ | -------------------------------------------------------------- | ---------- | ---------------------------------------------- |
| **Reanimated + SVG**     | nenhuma (4.5.1 e 15.15.4 já no projeto)                        | funciona   | código; sem ferramenta externa                 |
| **Rive**                 | `@rive-app/react-native` + `react-native-nitro-modules`        | **quebra** | arquivo `.riv` autorado no editor da Rive      |
| **Lottie**               | `lottie-react-native` ou `@lottiefiles/dotlottie-react-native` | **quebra** | animação autorada no After Effects/LottieFiles |
| **Vídeo / WebP animado** | `expo-video` ou nada                                           | funciona   | render fixo                                    |

- **Rive não roda no Expo Go.** A documentação é explícita: o pacote tem código
  nativo próprio e exige development build. Como o time roda `npx expo start` no
  Expo Go no dia a dia, adotá-lo significaria que ninguém mais abre o app sem
  gerar um build — para uma tela de splash, é um preço alto.
- O runtime novo está em **0.4.20**, pré-1.0, e depende de
  `react-native-nitro-modules`. Exige iOS 15.1+, Android SDK 24+, Xcode 16.4+. O
  projeto está em SDK 57 com New Architecture, então encaixa; o problema é
  maturidade e Expo Go, não compatibilidade.
- **Lottie tem o mesmo defeito e menos vantagem:** também é nativo, também exige
  build, e ainda perde o recurso que justificaria o Rive (máquina de estados).
- **Vídeo é o pior negócio:** não se adapta a proporções de tela, não conversa
  com o estado de carregamento e pesa no bundle.

E, sobretudo: **a animação é geométrica.** Translação, escala, opacidade e um
gradiente. Não há personagem, deformação de malha nem física — nada do que faz o
Rive valer a pena.

> **Decisão: Reanimated + `react-native-svg`.** Zero dependência nova, continua
> no Expo Go, ritmo ajustável no próprio código.

### 4.1 Mantendo a porta do Rive aberta

A troca só compensa no dia em que o splash virar animação orgânica — um mascote,
um personagem — ou quando alguém de design precisar iterar sem passar por
release. Para esse dia não custar refatoração, o `_layout.tsx` conhece só o
`<SplashOverlay/>` e as props dele: trocar o miolo por um `RiveView` é alteração
de um arquivo.

Vale registrar o que o Rive resolveria de graça: a máquina de estados dele tem
_trigger_, então "segurar no ponto de absorção até o app estar pronto" seria um
input do arquivo `.riv` em vez de lógica em JS.

## 5. Coreografia

Cerca de **1,46s** do primeiro quadro à Home, quando o app já está pronto.

| t (ms)      | O que acontece                                                                       | Curva                     |
| ----------- | ------------------------------------------------------------------------------------ | ------------------------- |
| 0           | Overlay pinta o primeiro quadro, idêntico ao splash nativo; só então ele é escondido | —                         |
| 0 – 520     | O banco de nuvens da frente sobe para o lugar; o avião espera no centro              | `ease-out`                |
| 220 – 320   | Antecipação: o avião recua ~9px                                                      | `ease-out`                |
| 300 – 1000  | Altitude: o roxo desce sobre o azul, do topo para baixo                              | `ease-in-out`             |
| 320 – 980   | Decolagem: acelera até sair pelo topo, com leve arco em X e ganho de escala          | `ease-in` (quadrática)    |
| 360 – 880   | A camada média de nuvens desce para o lugar                                          | `ease-out`                |
| 520 – 1000  | A camada distante desce para o lugar                                                 | `ease-out`                |
| 620         | A barra de status vira clara — o alto da tela já está roxo                           | —                         |
| 1040        | **Ponto de absorção** — a cena inteira, nada em movimento                            | —                         |
| 1040 – 1460 | O céu se abre (escala 1 → 1.14) e se apaga sobre a Home                              | `bezier(0.45, 0, 0.9, 1)` |

### 5.1 O que veio de ver rodando

Quase tudo abaixo foi erro corrigido depois de olhar a tela, não decisão tomada
antes. Está registrado para não ser refeito.

**A subida acelera.** Ela usava uma curva de desaceleração, que joga quase todo
o deslocamento nos primeiros quadros: o avião saltava e sumia, e o resto da
janela passava com a tela vazia — justamente enquanto as camadas de nuvem
entravam para dizer que ele estava subindo. Uma decolagem acelera.

**O céu ganha altitude, e as camadas passam.** Um avião subindo sobre um fundo
parado sobe parado: é a tela que precisa dizer que ele está indo a algum lugar.
Duas coisas dizem isso juntas — o alto do céu escurecendo no roxo da marca e as
camadas de nuvem que descem e ficam para trás.

**Nenhuma camada pode ter borda dentro da tela — nem embaixo, nem dos lados.**
Foi o mesmo defeito aparecendo três vezes, em lugares diferentes, antes de a
causa ficar clara: onde a camada acaba, a borda reta denuncia o truque.

- _Embaixo:_ a camada não tem fim. Abaixo do desenho, cada uma continua em uma
  faixa cheia que desce até sair da tela e some atrás da camada da frente. A
  faixa leva a mesma opacidade do grupo de nuvens da frente, porque as duas se
  encontram na borda de baixo do SVG — valores diferentes fariam uma linha
  aparecer justamente onde a emenda deveria sumir.
- _Dos lados:_ tamanho da nuvem e largura do banco eram o mesmo número, então
  camada distante virava banco estreito e a lateral dela aparecia no meio do
  céu. São coisas separadas: a crista é **gerada** na largura da tela mais uma
  folga, e a escala controla só o tamanho da nuvem. Isso também deixou de
  depender do tamanho do aparelho, que ainda quebraria em telas largas.
- _No topo:_ encaixar o desenho numa caixa por corte decepa o topo das nuvens em
  linha reta, e nuvem de topo plano não existe. Os bancos são desenhados na
  proporção exata do `viewBox`. O banco de base é mais largo que a tela de
  propósito — o que se vê dele é o miolo.

**Uma crista de nuvens precisa de duas frequências.** Sorteando só o raio de
cada círculo, sai uma fila de bolhas de tamanho parecido, que lê como barra
ondulada. É uma onda lenta por cima do sorteio que junta os círculos em massas
com vales entre elas, que é a forma de uma nuvem; o sorteio por círculo só tira
a regularidade de dentro de cada massa. E o passo entre círculos tem de ser
curto o bastante para o menor par vizinho ainda se sobrepor, senão abre um vão e
voltam as bolhas.

**O rastro não existe mais, depois de quatro tentativas.** Passou por sopros em
formato de nuvem, por sopros de borda difusa em degradê radial, por sopros
chapados em cone e por uma linha branca. Nuvem não tem direção, desfoque lê como
brilho, sopros chapados encostados viram um casulo, e a linha é uma linha. Com as
camadas de nuvem passando, a subida se lê sozinha.

Se um dia ele voltar a ser feito de peças sobrepostas, elas precisam ter
**opacidade cheia**: peças translúcidas somam onde se cruzam, e cada cruzamento
vira uma mancha mais clara denunciando a costura.

### 5.2 Notas de execução

- Os tempos moram em `splash-timing.ts`, com uma exceção: os das camadas de
  nuvem ficam em `cloud-decks.ts`, ao lado da geometria que animam.
- A ordem de `CLOUD_DECKS` é a de desenho, da mais distante para a mais próxima.
  Invertida, a camada de fundo aparece por cima da da frente.
- O gradiente de altitude entra por opacidade, a partir do zero — ver costura 1.
- Nuvens e avião são SVG dentro de contêineres animados. Só `transform` e
  `opacity` se movem: nada passa pelo layout, nada usa `setState` por quadro.

## 6. O encontro com o estado real do app

`splash-timing.ts` responde uma pergunta só: **já pode sair?**

1. Nunca antes do ponto de absorção (1040ms), quando o avião já saiu da tela.
   Cortar a animação no meio é pior que não ter animação.
2. Nunca antes de `isAppReady`. Sair para uma tela que ainda não existe traz o
   indicador de carga de volta.
3. Passados os dois, sair **imediatamente**. Nada de tempo mínimo decorativo
   além do que a animação já consome.
4. Se a espera passar de 2s **além** do ponto de absorção, entra uma linha
   discreta sobre o céu: "Estamos preparando tudo para você." Conta a partir do
   ponto de absorção, e não do início, para nunca aparecer em uma abertura que
   correu bem.

As funções são puras e entram em `splash-timing.test.ts`, junto com o teto de
1,5s da abertura inteira e com as invariantes das camadas de nuvem.

## 7. Quando o splash aparece

**Só na abertura fria do app.** Não aparece ao entrar na conta, ao sair, ao
voltar do OAuth nem em remontagem de rota. O overlay se monta uma vez no layout
raiz e, depois de sair, não volta — sem flag persistida.

## 8. Montagem no layout raiz

O overlay é irmão do navegador e precisa **continuar montado** atravessando a
virada de `isReady`, senão a animação reinicia no meio:

```
<AuthProvider>
  <PassportsProvider>
    <StatusBar/>
    <RootNavigator/>                    ← monta a Home quando pronto
    <SplashOverlay isAppReady={...}/>   ← absoluto, por cima
    <DialogHost/>
  </PassportsProvider>
</AuthProvider>
```

Não foi preciso um `use-app-readiness`: o `isReady` continua sendo calculado
onde sempre esteve, e o overlay entrou como irmão no mesmo componente.

**O indicador de carga não podia sumir de vez.** Logo depois do login os
passaportes recarregam e `isReady` volta a ser falso; sem nada ali, a tela
ficaria em branco. O splash não volta nessa hora — ele é a chegada ao app, não
uma tela de espera —, então o indicador antigo sobrevive no componente
`Readying`, só para esse intervalo.

A tela de "Sua conexão oscilou" continua onde estava: é estado de erro, não de
carregamento.

## 9. Assets da marca

Os PNGs não são desenhados à mão: saem do mesmo `plane-art.ts` que o SVG da
animação, rasterizados por
[build-brand-assets.mjs](scripts/build-brand-assets.mjs) — `npm run brand`. É o
que garante que o avião do splash nativo e o do primeiro quadro sejam o mesmo
traço, e não dois desenhos parecidos. Mexeu no avião, roda o comando e commita os
PNGs.

O gerador não trouxe dependência nova: interpreta os comandos de caminho, achata
as curvas, preenche por varredura com suavização e escreve o PNG com o `zlib` do
Node.

| Asset             | O que é                                   |
| ----------------- | ----------------------------------------- |
| `splash-icon.png` | avião sozinho, fundo transparente         |
| `icon.png`        | avião branco sobre o roxo da marca        |
| `android-icon-*`  | frente, fundo e monocromático adaptativos |
| `favicon.png`     | mesma marca, para a web                   |

O `ios.icon` saiu do `app.json` e o bundle `assets/expo.icon` foi removido: era o
template do Expo intocado e, enquanto existisse, o iOS ignoraria o `icon.png`
novo. Quem quiser o ícone em camadas do iOS 26 depois autora um Icon Composer de
verdade.

Também vale saber: no **Android 12+** o sistema desenha o próprio splash com o
ícone do app antes de o `expo-splash-screen` entrar. Não dá para eliminar; dá
para atenuar deixando o fundo dos dois igual.

## 10. Acessibilidade, desempenho e plataformas

- **Reduzir movimento.** Com `AccessibilityInfo.isReduceMotionEnabled()` ligado,
  não há voo nem camadas descendo: o avião fica onde o splash nativo o deixou, o
  céu muda de cor e a Home entra logo em seguida. Trocar de cor não é movimento;
  a tela continua existindo, só não se move.
- **Thread de UI.** Toda animação em `useSharedValue` + `useAnimatedStyle`. O JS
  está ocupado nesse exato momento carregando sessão, passaportes e fonte — o que
  depender dele vai tremer.
- **Aparelho fraco.** Nada de sombra animada, blur ou gradiente redesenhado por
  quadro. Escala, translação e opacidade resolvem tudo aqui.
- **Fonte.** A abertura não tem texto de marca e por isso não espera fonte
  nenhuma. A única frase que pode aparecer é a da espera longa, na fonte do
  sistema.
- **Web.** O app também roda em web. Reanimated funciona lá, mas não há splash
  nativo para costurar — verificar; se destoar, o overlay não monta na web.
- **Expo Go.** A costura 1 **não é verificável no Expo Go**, que mostra o splash
  do próprio Expo. A conferência precisa de `npx expo run:ios` / `run:android`.

## 11. Onde está cada peça

| Peça                            | Arquivo                                                                       |
| ------------------------------- | ----------------------------------------------------------------------------- |
| Geometria e cores do avião      | [plane-art.ts](src/features/splash/domain/plane-art.ts)                       |
| Tempos, curvas e regra de saída | [splash-timing.ts](src/features/splash/domain/splash-timing.ts)               |
| Camadas de nuvem                | [cloud-decks.ts](src/features/splash/domain/cloud-decks.ts)                   |
| Orquestração da animação        | [splash-overlay.tsx](src/features/splash/components/splash-overlay.tsx)       |
| Avião em SVG                    | [plane-mark.tsx](src/features/splash/components/plane-mark.tsx)               |
| Bancos e cristas de nuvem       | [sky-clouds.tsx](src/features/splash/components/sky-clouds.tsx)               |
| Céu ganhando altitude           | [altitude-gradient.tsx](src/features/splash/components/altitude-gradient.tsx) |
| Montagem e saída                | [\_layout.tsx](src/app/_layout.tsx)                                           |
| Gerador dos PNGs                | [build-brand-assets.mjs](scripts/build-brand-assets.mjs)                      |

## 12. O que falta verificar

Nada disso é verificável fora de um aparelho, e é onde a atenção deve ir na
primeira rodada em build nativo:

- A costura 1, que no Expo Go não aparece (§10).
- O ritmo. Se ficar rápido ou lento, é mexer nos números de `splash-timing.ts`.
- A web, se o overlay faz sentido lá sem splash nativo atrás.
- Aparelho Android de entrada, para confirmar que nada treme.

## 13. Fora de escopo

Onboarding animado, splash com conteúdo variável (saudação, próxima viagem),
animação de transição entre abas e qualquer reúso dessa cena em outra tela.

## 14. Decisões tomadas

1. **Expo Go continua sendo o fluxo padrão.** Não se migra para development
   build por causa do splash. Se um dia migrar, o Rive volta à mesa — e o
   `SplashOverlay` é a única peça que precisaria mudar (§4.1).
2. **Avião e nuvens são SVG no código**, sem arte externa.
3. **Sem tela de marca com texto.** O roxo entra como altitude.
4. **Ícone do app refeito** a partir do mesmo traço do avião (§9).

# Plano — lembretes de viagem

Notificações que avisam o viajante quando há algo relevante para revisar na
checklist. Primeira etapa: **notificações locais**, testáveis no Expo Go.

Status: **notificações locais implementadas e validadas no Expo Go (iPhone).**
Pendente: o que só um dev build assinado permite conferir (§11) e a etapa de
push remoto (§10). Este documento fica em `tasks/` por causa dessas pendências;
quando elas fecharem, ele sai da pasta.

---

## 1. Escopo desta etapa

Entra:

- lembrete a 7 dias da partida, quando há pendências relevantes;
- lembrete na véspera, como última revisão;
- pedido de permissão em contexto, depois da primeira viagem criada;
- toque na notificação abrindo a checklist da viagem correta;
- recálculo automático a cada criação, edição, marcação de item e exclusão.

Não entra:

- push remoto, tabela de tokens, Edge Function ou cron;
- Firebase;
- qualquer notificação que não seja sobre uma viagem.

Dependência nova: **`expo-notifications`**, e só ela — o `expo-dev-client` é
incompatível com o Expo Go e entra só na hora do build (§11.1).

## 2. Situação verificada

| Ponto                | Situação                                                                                                                                 |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `expo-notifications` | instalado em `~57.0.18`                                                                                                                  |
| Expo / RN            | Expo `~57.0.20`, RN `0.86.3`, React `19.2.3`, Expo Router `~57.0.19`                                                                     |
| Expo Go              | notificações **locais funcionam** nas duas plataformas; push remoto saiu do Expo Go no Android desde o SDK 53                            |
| Insumo do cálculo    | [trips.ts](src/services/trips.ts) — `listWithRelations` já devolve viagem, países e requisitos com `priority` e `completed`              |
| Regra de pendências  | [trip-progress.ts](src/features/trips/domain/trip-progress.ts) — `computeTripProgress` já separa as três prioridades                     |
| Regra de datas       | [trip-status.ts](src/features/trips/domain/trip-status.ts) — `todayISO`, `daysUntilStart`, `getTripStatus`                               |
| Rota da checklist    | [trips/[id].tsx](<src/app/(app)/trips/[id].tsx>) — a rota `/trips/[id]` **é** a checklist; navegar até ela já cumpre "abrir a checklist" |
| Proteção de rotas    | [\_layout.tsx](src/app/_layout.tsx) usa `Stack.Protected`: as rotas de viagem só existem com sessão e passaporte                         |

As duas regras existentes são reutilizadas, não reescritas.

## 3. Quando notificar

Dois marcos, ambos às **09:00** no fuso do aparelho.

| Marco   | Dispara quando                                         |
| ------- | ------------------------------------------------------ |
| **D-7** | há `required` **ou** `recommended` pendente            |
| **D-1** | sempre, para viagem com data de início e não concluída |

`informational` nunca entra na contagem de pendências, em nenhum dos dois.

Com tudo verificado, **só o D-1 dispara** — e com a mensagem de revisão, sem
número e sem alarme. Não existe caminho que gere notificação diária.

Marco cujo horário já passou no momento do agendamento não é agendado.

### Teto de agendamentos

O iOS mantém no máximo **64 notificações locais pendentes por app** e descarta o
excedente em silêncio. A reconciliação agenda apenas para viagens que começam em
até **90 dias**, e no máximo as **5 mais próximas** — pior caso, 10
agendamentos. As duas constantes ficam juntas no domínio.

### Textos

| Situação                    | Título                      | Mensagem                                                  |
| --------------------------- | --------------------------- | --------------------------------------------------------- |
| D-7, obrigatórios pendentes | ✈️ Sua viagem está chegando | Você ainda tem 3 itens obrigatórios para revisar.         |
| D-7, só recomendados        | ✈️ Sua viagem está chegando | Você tem 2 itens recomendados para dar uma olhada.        |
| D-1, obrigatórios pendentes | ✈️ Amanhã é o grande dia!   | Você ainda tem 2 itens obrigatórios para revisar.         |
| D-1, tudo obrigatório feito | ✈️ Amanhã é o grande dia!   | Faça uma última revisão da sua checklist antes de viajar. |

Singular e plural resolvidos no domínio. Sem "você esqueceu", sem "sua viagem
está em risco", sem ⚠️ — o objetivo é lembrar, não gerar ansiedade.

## 4. Arquivos

### Novos, em `src/features/notifications/`

| Arquivo                                | Responsabilidade                                                            |
| -------------------------------------- | --------------------------------------------------------------------------- |
| `domain/trip-reminders.ts`             | quais lembretes deveriam existir, com que texto, e o diff contra o agendado |
| `tests/trip-reminders.test.ts`         | §8                                                                          |
| `data/reminder-scheduler.ts`           | agenda, cancela e reconcilia — o ponto de troca para push                   |
| `data/reminder-permission.ts`          | status, pedido e a marca de "já perguntei" em AsyncStorage                  |
| `hooks/use-notification-navigation.ts` | toque na notificação para a rota                                            |
| `components/reminder-opt-in-card.tsx`  | o convite, sobre `Card` e `Button` existentes                               |

A feature mora em pasta própria porque tem infraestrutura própria; o domínio de
viagens é dependência dela, não o contrário.

Superfície do domínio, sem nenhum import de `expo-notifications`:

```ts
export type ReminderKind = 'approaching' | 'eve';

export type TripReminder = {
  /** Chave estável `${tripId}:${kind}` — base do dedupe. */
  key: string;
  tripId: string;
  kind: ReminderKind;
  fireAt: Date;
  title: string;
  body: string;
  /** Muda quando texto ou data mudam; força reagendamento. */
  signature: string;
};

getTripNotificationCandidates(trip, requirements, now?: Date): TripReminder[]
selectTripsForReminders(trips, today?: string): ReminderTrip[]
diffReminders(scheduled, desired): { toCancel: string[]; toSchedule: TripReminder[] }
```

`requirements` recebe o `ProgressItem` que já existe em `trip-progress.ts`.

O `now` é um `Date`, e não a data em texto dos outros domínios, porque o marco
tem hora: é ele que decide se as 09:00 já passaram.

Superfície da infraestrutura:

```ts
syncAllTripReminders(rows); // reconcilia tudo, cancela órfãs
syncTripReminders(trip, requirements); // reconcilia uma viagem
cancelTripReminders(tripId); // exclusão
scheduleReminderPreview(trip, requirements); // só __DEV__: dispara em segundos
readTripId(data); // payload do toque, para o hook
```

`setNotificationHandler` roda no import do módulo e `ensureAndroidChannel` é
interno, chamado logo antes de agendar — não há inicialização a amarrar em
nenhuma tela.

### Alterados

| Arquivo                                                  | Mudança                                                                                                              |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `package.json`                                           | `expo-notifications` (o `expo-dev-client` foi removido, §11.1)                                                       |
| `app.json`                                               | plugin com ícone monocromático e `#6C4EE3`; `bundleIdentifier`/`package`; `projectId` e `owner` vindos do `eas init` |
| `eas.json`                                               | novo — perfis de build (§11)                                                                                         |
| `src/features/trips/domain/trip-status.ts`               | `todayISO` passou a aceitar um `Date` opcional, para o domínio de lembretes não duplicar a conversão                 |
| [(app)/\_layout.tsx](<src/app/(app)/_layout.tsx>)        | uma linha: `useNotificationNavigation()`                                                                             |
| [(app)/index.tsx](<src/app/(app)/index.tsx>)             | no `load` existente, após o fetch: `void syncAllTripReminders(rows)`                                                 |
| [(app)/trips/index.tsx](<src/app/(app)/trips/index.tsx>) | idem                                                                                                                 |
| [(app)/trips/[id].tsx](<src/app/(app)/trips/[id].tsx>)   | `syncTripReminders` no toggle, `cancelTripReminders` na exclusão, card de convite, entrada `__DEV__` no menu (§9)    |

`trip-persistence.ts`, `trip-new.tsx`, `trip-edit.tsx` e `trip-preparing.tsx`
ficam intocados — §6 explica por quê.

## 5. Fluxo

```
listWithRelations (já existe)
        │
        ▼
selectTripsForReminders        ← ≤ 90 dias, 5 mais próximas, não concluídas
        │
        ▼
getTripNotificationCandidates  ← puro; usa computeTripProgress + daysUntilStart
        │
        ▼  desired: TripReminder[]
diffReminders( getAllScheduledNotificationsAsync() , desired )
        │
        ├──► toCancel   → cancelScheduledNotificationAsync
        └──► toSchedule → scheduleNotificationAsync({ trigger: DATE, data })
```

O domínio nunca toca no sistema operacional. A infraestrutura nunca decide o que
notificar.

## 6. Dedupe, cancelamento e reagendamento

**O registro do que está agendado é o próprio sistema operacional**, lido por
`getAllScheduledNotificationsAsync()`. Não existe cópia em AsyncStorage: um
segundo estado só criaria uma segunda chance de dessincronizar.

Toda notificação carrega `data: { tripId, kind, signature }`. A reconciliação é
sempre um diff completo, nunca incremental:

| Agendada                          | Ação                                         |
| --------------------------------- | -------------------------------------------- |
| sem `kind`                        | não é nossa — ignorada                       |
| `tripId` fora da lista            | cancelada (cobre exclusão e saída da janela) |
| `signature` diferente da desejada | cancelada e reagendada                       |
| idêntica à desejada               | deixada em paz                               |
| desejada sem correspondente       | agendada                                     |

Como o diff é idempotente, rodar duas vezes seguidas não produz nada, e a chave
`${tripId}:${kind}` torna a duplicata impossível por construção.

Gatilhos:

| Evento                       | Cobertura                                                                                     |
| ---------------------------- | --------------------------------------------------------------------------------------------- |
| viagem criada                | `trip-preparing` navega para a checklist; o retorno a Início/Viagens refaz o fetch            |
| viagem editada               | `trip-edit` volta para a checklist, que já recarrega no `useFocusEffect`                      |
| item marcado ou desmarcado   | `syncTripReminders` no próprio toggle, sem esperar o usuário voltar à lista                   |
| viagem excluída              | `cancelTripReminders(id)` antes do `router.replace('/trips')`, e o diff remove qualquer resto |
| passaporte principal trocado | `rebuildChecklistsForPassport` muda a checklist; o próximo foco reconcilia                    |

Consequência da terceira linha: **marcar todos os obrigatórios antes do D-7
cancela o lembrete de pendência no ato**, sem esperar a data chegar.

Toda chamada é disparada sem espera e com erro engolido: falha de agendamento
nunca pode quebrar uma tela nem impedir um salvamento.

## 7. Toque, permissão e Android

### Navegação

Dois caminhos, mesmo destino:

- app aberto ou em segundo plano — `addNotificationResponseReceivedListener`;
- app fechado — `useLastNotificationResponse()`.

O hook mora em `(app)/_layout.tsx`, que só monta com sessão e passaporte: assim
a navegação nunca corre antes de a rota existir. Navega por
`router.push({ pathname: '/trips/[id]', params: { id: tripId } })` — **sempre
pelo `tripId` do payload, nunca pelo nome**. Se a viagem não existir mais, a
tela devolve para `/trips`.

Não há URL scheme envolvido: o payload `{ tripId, kind }` é idêntico ao que o
Expo Push Service entregaria, então o mesmo listener atende os dois casos.

### Permissão

Nada é pedido na abertura do app. O convite aparece **na checklist**, depois de
ela carregar, quando a permissão está `undetermined`, a viagem tem início
futuro, e a marca `reminders:asked` ainda não existe.

```
Quer receber lembretes desta viagem?
Vamos avisar quando estiver chegando a hora de revisar os itens pendentes.

[ Ativar lembretes ]   [ Agora não ]
```

Na checklist, e não na tela de preparação, porque `trip-preparing` navega
sozinha ao terminar e uma pergunta no meio quebra a animação — e porque ali o
usuário está olhando exatamente os itens que o lembrete vai citar.

Os dois botões gravam a marca; "Agora não" não volta a perguntar. Permissão
negada não bloqueia nada: a reconciliação simplesmente não agenda.

### Android

`setNotificationChannelAsync` no start, sob `Platform.OS === 'android'`. Sem
canal, notificação agendada não aparece.

## 8. Testes

`src/features/notifications/tests/trip-reminders.test.ts`, em `node:test` como
os demais, sem importar `expo-notifications` — roda no `npm test` atual.

Candidatos:

- D-7 com obrigatório pendente gera lembrete de pendência;
- D-7 sem obrigatório, com recomendado pendente, gera a mensagem leve;
- D-7 com tudo verificado não gera nada em D-7;
- D-1 com pendências cita a quantidade de obrigatórios;
- D-1 sem pendências traz a mensagem de revisão, sem número;
- viagem concluída devolve lista vazia;
- viagem em andamento devolve lista vazia;
- viagem sem data devolve lista vazia;
- `informational` pendente sozinho não gera alerta de pendência;
- todos os `required` concluídos não geram alerta de pendência.

Diff:

- desejado já agendado devolve `toCancel` e `toSchedule` vazios;
- viagem ausente da lista tem os lembretes dela em `toCancel`;
- contagem alterada cancela e reagenda a mesma chave;
- `selectTripsForReminders` respeita os 90 dias e o teto de 5 viagens.

Fechamento com `npm check`, sem `any` e sem `@ts-ignore`.

## 9. Como testar no Expo Go

Com os marcos em D-7 e D-1 às 09:00, não há como ver uma notificação no mesmo
dia pelo caminho normal. Por isso o menu `•••` da checklist ganha a entrada
**"Testar lembretes", visível só quando `__DEV__` é verdadeiro** — o bundler a
elimina do build de produção. Ela agenda os candidatos reais daquela viagem
(mesmo título, mesmo texto, mesma contagem) com gatilho de 5 e 10 segundos em
vez da data. Não é uma notificação de mentira: é a que chegaria no dia,
antecipada.

1. `npx expo install expo-notifications` e reiniciar o Expo Go.
2. Criar uma viagem e aceitar o convite de lembretes.
3. Tocar em "Testar lembretes", fechar o app, ver as duas chegarem, tocar e
   conferir se abre a checklist certa.
4. Marcar todos os obrigatórios e tocar de novo: só a da véspera deve chegar, na
   versão sem número.
5. Excluir a viagem e confirmar que nada mais chega.

## 10. Limitações do local frente ao push

|                          | Local (agora)               | Push (depois)           |
| ------------------------ | --------------------------- | ----------------------- |
| Quem agenda              | o app, só quando aberto     | o servidor              |
| App nunca mais aberto    | nada chega                  | chega normalmente       |
| Mudança fora do aparelho | não reflete                 | reflete                 |
| Vários aparelhos         | cada um com seu conjunto    | um envio alcança todos  |
| Texto da mensagem        | congelado no agendamento    | calculado no envio      |
| Teto                     | 64 pendentes no iOS         | sem teto                |
| Entrega                  | sem confirmação nem reenvio | recibos do Expo Push    |
| Expo Go                  | funciona                    | Android exige dev build |

Custo da migração: `domain/trip-reminders.ts`, os testes e o handler de toque
ficam **intactos** — o cálculo e o payload são os mesmos. Muda só
`data/reminder-scheduler.ts`, que passa a registrar o Expo Push Token numa
tabela nova em vez de chamar `scheduleNotificationAsync`, mais uma Edge Function
em cron rodando `getTripNotificationCandidates` do lado do servidor. A tabela de
tokens exigirá RLS, policies e grants explícitos, como toda tabela do projeto.

## 11. O que revisar quando houver credenciais

O Expo Go valida o conteúdo, o horário, o cancelamento e a navegação — tudo o
que tem decisão de produto. O que sobra depende de um build assinado, porque
depende da identidade do app.

### 11.1 O `expo-dev-client` só entra na hora do build

Instalar o pacote **quebra o Expo Go**, e o `--go` não salva. O CLI decide o
scheme dos links em `resolveOptions.js` perguntando apenas se `expo-dev-launcher`
resolve — a flag não é consultada nessa decisão. Com o pacote presente, o QR
passa a apontar para `tripready://` e o iPhone abre o navegador em vez do app.

Por isso ele foi removido. Reinstalar com `npx expo install expo-dev-client`
imediatamente antes do primeiro `eas build --profile development`, que é quando
o perfil `developmentClient: true` passa a exigi-lo. Enquanto o Expo Go for o
ambiente de teste, o projeto fica sem ele.

### 11.2 Antes de gastar o primeiro build

**Conferir o App ID do Sign in with Apple.** O app já usa login com Apple, então
existe um App ID registrado no portal da Apple, com um bundle identifier
próprio. Se ele não for `com.tripready.app`, o login para de funcionar no build
assinado. Trocar o identificador antes do primeiro envio é trivial; depois de
publicar na App Store é impossível. O mesmo valor está em `ios.bundleIdentifier`
e em `android.package`.

**Primeiro build do `appVersionSource: "remote"`.** O `eas.json` deixa o
`buildNumber` sob controle da EAS. No primeiro build ela inicializa a contagem;
conferir que o número que saiu é o esperado antes de submeter.

### 11.3 O que o dev build finalmente mostra

| Item                           | Situação hoje                                                           |
| ------------------------------ | ----------------------------------------------------------------------- |
| Ícone da notificação no iOS    | é o ícone do app, sem configuração; no Expo Go aparece o do Expo Go     |
| Ícone monocromático no Android | configurado no plugin, nunca visto — o Expo Go não aplica config plugin |
| Tinta `#6C4EE3` no Android     | idem                                                                    |
| Canal `trip-reminders`         | criado em tempo de execução; conferir nome e importância na bandeja     |

**Refazer o fluxo de permissão.** No Expo Go quem pede a permissão é o Expo Go,
e é o nome dele que aparece no diálogo do sistema. No build assinado a permissão
nasce do zero e o diálogo diz "TripReady". Vale repetir o roteiro da §9 inteiro
uma vez, incluindo o convite — a marca `tripready:reminders-asked` vive no
AsyncStorage do app, que também nasce vazio.

A entrada `__DEV__` de teste continua disponível no perfil `development`, porque
ali o bundle ainda roda em modo de desenvolvimento.

### 11.4 Push remoto

Só depois de o dev build estar de pé, porque push no iOS exige APNs e APNs exige
a conta paga da Apple. O desenho e o custo estão na §10; some-se a ele:

- chave APNs gerada e guardada pela EAS (`eas credentials`);
- `enableBackgroundRemoteNotifications` no plugin, se a entrega em segundo plano
  passar a ser necessária;
- tabela de tokens com RLS, policies por operação e grants explícitos, como toda
  tabela do projeto;
- decidir o que fazer quando o mesmo usuário tem vários aparelhos, que é
  justamente o caso que a notificação local não resolve.

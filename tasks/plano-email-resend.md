# Plano — e-mails transacionais com Resend

Confirmação de cadastro e recuperação de senha por e-mail, com o Resend como
transporte. Escopo fechado: nenhum outro e-mail entra.

Status: **plano em avaliação, nada implementado.** Várias decisões dependem de
investigação que ainda não foi feita (§13, fase 0) e de aprovação (§16).

Legenda usada no documento:

- **[F]** fato verificado no projeto ou na documentação do fornecedor;
- **[R]** recomendação, com o motivo junto;
- **[H]** hipótese ainda não confirmada — nada que dependa dela pode ser tratado
  como decidido;
- **[D]** decisão pendente de aprovação.

A distinção não é enfeite: metade dos pontos difíceis deste plano depende de
comportamento do Supabase Auth que não está documentado de forma conclusiva, e
tratar hipótese como fato é como se erra este tipo de trabalho.

---

## 1. Resumo

O projeto já tem quase tudo o que este escopo precisa. Três conclusões mudam o
desenho:

**O Resend entra como SMTP personalizado do Supabase Auth para a confirmação de
cadastro.** [F] O Resend está na lista de provedores SMTP compatíveis do
Supabase. Com SMTP, o GoTrue continua sendo quem gera token, valida, expira e
aplica limite — nada disso precisa ser reescrito. **Atualização de
19/09/2026:** a recuperação de senha é uma exceção a essa regra, decidida depois
de um achado da fase 0 — ver §3 e §5.4. Ela passa a precisar de uma Edge
Function, porque o Supabase não oferece nenhuma forma nativa de recusar o envio
para conta só-OAuth sem abrir um oráculo de enumeração.

**A verificação prévia de existência da conta já existe, nativa.** [F] A
documentação do Supabase afirma que `resetPasswordForEmail()` não revela se a
conta existe e não envia e-mail quando não há conta correspondente. O objetivo
"não gastar envio do Resend com endereço inexistente" já está atendido, do lado
do servidor. Construir uma consulta prévia própria trocaria uma proteção nativa
por um oráculo de enumeração novo. O trade-off completo está em §5.3, porque ele
não é tão simples quanto parece à primeira vista.

**Para a confirmação de conta, o caminho recomendado é o código numérico — e ele
também é nativo.** [F] Os templates `Confirm signup` e `Reset password` expõem
`{{ .Token }}`, um OTP validado por `verifyOtp()`. Não é implementação
customizada: é trocar uma variável no template e chamar outro método. O motivo
de preferir código a link neste projeto é concreto — o desenvolvimento acontece
no Expo Go, e o `authRedirectUri` é montado a partir do host do dev server, que
muda de IP e de porta. **A recomendação só vira decisão depois de validada em
aparelho físico** (§12.4).

O que **não** está resolvido: a confirmação de e-mail está desligada hoje; a
proteção de rotas do `_layout.tsx` colide com o fluxo de redefinição; os e-mails
do GoTrue são de idioma único enquanto o app fala três; não há domínio de envio
definido; e o comportamento da recuperação em conta OAuth é desconhecido.

---

## 2. Auditoria da autenticação atual

### 2.1. O que existe

| Área                  | Situação                                                                               | Onde                                                                  |
| --------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Cliente Supabase      | único, `flowType: 'pkce'`, AsyncStorage no nativo, auto-refresh pausado em background  | [client.ts](src/lib/supabase/client.ts)                               |
| Variáveis             | duas, ambas `EXPO_PUBLIC_*`, com guarda de ausência                                    | [env.ts](src/lib/env.ts)                                              |
| Cadastro e-mail       | `signUp` com `emailRedirectTo`, `normalizeEmail` e metadata `display_name`/`full_name` | [auth-service.ts:162](src/features/auth/auth-service.ts#L162)         |
| Login e-mail          | `signInWithPassword`                                                                   | [auth-service.ts:152](src/features/auth/auth-service.ts#L152)         |
| Login Google          | OAuth pelo navegador, `openAuthSessionAsync`                                           | [auth-service.ts:66](src/features/auth/auth-service.ts#L66)           |
| Login Apple           | nativo no iOS (`signInWithIdToken`), navegador no resto                                | [auth-service.ts:119](src/features/auth/auth-service.ts#L119)         |
| Recuperação           | `resetPasswordForEmail` com `redirectTo`                                               | [auth-service.ts:208](src/features/auth/auth-service.ts#L208)         |
| Troca de senha        | `updateUser` com `current_password`                                                    | [auth-service.ts:228](src/features/auth/auth-service.ts#L228)         |
| Callback              | rota fora dos grupos protegidos; a troca do `code` acontece no provider                | [callback.tsx](src/app/auth/callback.tsx)                             |
| Redirect URI          | `AuthSession.makeRedirectUri`, com diagnóstico em `__DEV__`                            | [auth-redirect.ts](src/features/auth/auth-redirect.ts)                |
| Sessão                | `getSession` + `onAuthStateChange`, persistida                                         | [auth-context.tsx:67](src/features/auth/auth-context.tsx#L67)         |
| Provedor da conta     | `getAccountProvider` — `'email'` sempre que houver identidade de senha                 | [user-profile.ts:62](src/features/auth/user-profile.ts#L62)           |
| Erros                 | mapa de mensagens do GoTrue → chaves i18n, com fallback genérico                       | [auth-errors.ts](src/features/auth/auth-errors.ts)                    |
| Operação privilegiada | uma Edge Function (`delete-account`), `verify_jwt = true`, Service Role só no runtime  | [delete-account/index.ts](supabase/functions/delete-account/index.ts) |

### 2.2. O que falta

**[F] A confirmação de e-mail está desligada no local, mas ligada no projeto
remoto.** [config.toml:227](supabase/config.toml#L227) traz
`enable_confirmations = false` — vale só para o Supabase local. **[F] Auditado em
19/09/2026 via `supabase config diff` (leitura, sem escrita): no projeto remoto
`enable_confirmations = true`.** O código já prevê os dois caminhos —
`signUpWithEmail` devolve `'signed-in' | 'confirm-email'` e a tela de cadastro
tem o bloco "Confirme seu e-mail"
([sign-up.tsx:86](<src/app/(auth)/sign-up.tsx#L86>)) — e esse bloco **já aparece
hoje em produção**, para quem se cadastra por e-mail.

**[F] Achado investigado e descartado em 19/09/2026.** A princípio, com a
confirmação já ligada e sem SMTP customizado, existia o risco de alguém preso na
tela "Confirme seu e-mail" sem receber nada, já que o provedor embutido do
Supabase só entrega a endereços pré-autorizados. O usuário conferiu os logs de
Auth do painel: **ninguém está preso nesse estado.** Não há impacto de produção
a corrigir com urgência; o achado fica registrado aqui só como lição de auditoria
— vale a pena olhar o painel remoto cedo, porque `config.toml` local não é a
verdade sobre produção.

**[F] Não existe tela para consumir código nem para concluir uma redefinição.**
`supabase.auth.resend()` e `verifyOtp()` não aparecem em `src/`.

**[F] Nada no app lê `email_confirmed_at`.** A única reação a uma conta não
confirmada é a mensagem `auth.error.emailNotConfirmed`, traduzida a partir do
erro de login. Ou entra, ou vê um erro.

**[F] `normalizeEmail` é aplicada de forma inconsistente.** `signUpWithEmail`
normaliza; `signInWithEmail` e `sendPasswordReset` só fazem `.trim()`. O GoTrue
guarda em minúsculas e a diferença é invisível hoje, mas some neste trabalho.

**[F] A proteção de rotas colide com a redefinição de senha.** Em
[\_layout.tsx:177](src/app/_layout.tsx#L177), o grupo `(auth)` só é montado com
`guard={!session}`. Tanto o link de recuperação quanto
`verifyOtp({ type: 'recovery' })` criam sessão **antes** de a pessoa digitar a
senha nova. Nesse instante `(auth)` é desmontado e o app salta para `(app)` ou
para o onboarding — a tela de nova senha nunca aparece. A rota `auth/callback` já
mostra o padrão de saída: viver fora dos grupos protegidos
([\_layout.tsx:182](src/app/_layout.tsx#L182)).

**[F] Não há rate limiting próprio.** Nenhuma tabela, nenhum contador. Existe só
o que o GoTrue aplica. [config.toml:198](supabase/config.toml#L198) tem
`[auth.rate_limit]`, mas vale apenas para o ambiente local. **[F] Auditado em
19/09/2026:** `sign_in_sign_ups`, `token_verifications`, `token_refresh`,
`sms_sent` e `web3` já batem com os valores declarados no `config.toml` local
(30, 30, 150, 30, 30) — o diff não acusou divergência nesses campos, o que só
acontece quando remoto e local coincidem. **[F] Confirmado por captura de tela do
painel em 19/09/2026:** `email_sent = 2` (o padrão de fábrica, porque não há SMTP
customizado ainda) e todos os demais batendo com os valores acima.

**[F] Não há domínio de envio.** `LEGAL_IDENTITY` em
[identity.ts](src/features/legal/data/identity.ts) já tem `contactEmail`
preenchido (`suporte-tripready@gmail.com`), mas `website` continua `{{DOMINIO}}`.
Isso importa duas vezes: o `reply-to` já tem destino definido, e o `from` ainda
não tem — não se envia a partir de um endereço `gmail.com` pelo Resend.

### 2.3. Como as contas OAuth estão representadas

**[F]** `getAccountProvider` decide por `identities[].provider`, com
`app_metadata.provider` como segundo recurso, e dá precedência a `'email'` quando
as duas existem. A tela de perfil usa isso corretamente: só conta de e-mail vê
"Alterar senha" e tem nome editável
([edit.tsx:43](<src/app/(app)/profile/edit.tsx#L43>)).

**[F]** Uma conta pode ter identidade Google **e** identidade de e-mail ao mesmo
tempo — há teste cobrindo isso em
[user-profile.test.ts:41](src/features/auth/tests/user-profile.test.ts#L41).
"Conta do Google" e "conta sem senha" não são a mesma coisa, e nenhuma regra ou
texto pode assumir que são.

**[F]** No iOS, o Apple nativo usa `signInWithIdToken`, que não passa por
`redirectTo`. O e-mail privado da Apple chega como e-mail real da conta, e é para
ele que qualquer mensagem seria enviada.

---

## 3. Arquitetura recomendada

**[R] Resend como servidor SMTP personalizado do Supabase Auth, para a
confirmação de cadastro. Para a recuperação de senha, uma exceção decidida em
19/09/2026 — ver abaixo.**

```
Confirmação de cadastro (sem mudança):

App (Expo)                Supabase Auth (GoTrue)           Resend (SMTP)
    │                              │                              │
    ├─ signUp ───────────────────▶ │                              │
    │                              ├─ gera token, aplica limites  │
    │                              ├─ renderiza template ───────▶ │
    │                              │                              ├─▶ caixa de entrada
    ├─ verifyOtp(código) ────────▶ │                              │
    │ ◀──────────── sessão ────────┤                              │
```

O que isso entrega sem código: geração e validação de token pelo GoTrue, com
expiração e uso único; rate limiting por IP, por usuário e por projeto aplicado
no servidor; nenhum segredo novo no app, porque o app não fala com o Resend;
nenhuma tabela e nenhuma migration.

**⚠ Exceção decidida para a recuperação de senha, depois do achado do §12.6.**
O `/recover` nativo manda o e-mail para qualquer conta com aquele endereço,
sem olhar o provedor — confirmado por teste real. O usuário decidiu **não**
aceitar esse comportamento: uma conta só-Google não deve poder ganhar senha por
esse caminho, porque isso pode confundir o dono da conta e criar comportamento
inesperado no app (dois jeitos de entrar na mesma conta, um deles nunca
solicitado).

Um filtro ingênuo na frente do fluxo nativo recriaria o problema do §5.3: um
pré-check que decide "manda" ou "não manda" se comporta diferente por dentro
nos dois casos, e essa diferença vaza por tempo de resposta — o oráculo de
enumeração que o `/recover` nativo não tem.

**[F] Implementado em 19/09/2026, com um desenho mais simples do que a versão
original deste plano previa — e corrigido no mesmo dia depois de um bug real
encontrado em teste.** A ideia inicial era usar
`admin.generateLink({ type: 'recovery', email })` só para checar a identidade,
sem mandar nada, e depois chamar o `resetPasswordForEmail` **nativo** — que
gera seu próprio token e dispara o envio de verdade, pelo SMTP já configurado,
**com o template "Reset password" que já está no painel do Supabase**. Não é
preciso enviar nada pela API do Resend nem manter um segundo template lá — o
mesmo SMTP e o mesmo template da confirmação servem os dois e-mails.

**O bug:** `generateLink`, apesar de não enviar e-mail, passa pelo mesmo
caminho interno do GoTrue que grava `recovery_sent_at` — o mesmo campo que o
`resetPasswordForEmail` checa para decidir se já pode enviar de novo. Como a
função chamava os dois em sequência na mesma requisição, a própria checagem de
identidade rearmava o cooldown de 60s um instante antes do envio real
verificar esse cooldown — resultado: `resetPasswordForEmail` sempre recebia
"429 — only request this after N seconds", em toda chamada, para sempre,
porque cada tentativa nova recomeçava o próprio ciclo. Encontrado ao testar o
reenvio de código (nenhum e-mail chegava, mesmo esperando minutos entre
tentativas — o log de execução da função mostrou o 429 e confirmou a causa).

**A correção:** trocar `generateLink` por `GET /admin/users?filter=` (o mesmo
parâmetro que a busca de usuários do Supabase Studio usa) para achar o id do
usuário, seguido de `admin.getUserById` para checar as identidades — nenhum
dos dois toca `recovery_sent_at`. Só o `resetPasswordForEmail` de fato, no
passo seguinte, mexe nesse cooldown, e só quando a conta é elegível.

```
Recuperação de senha:

App (Expo)          Edge Function (Service Role)         Supabase Auth (GoTrue) ──SMTP──▶ Resend
    │                         │                                    │
    ├─ pedido de recovery ──▶ │                                    │
    │                         ├─ GET /admin/users?filter= ───────▶ │
    │                         │  (acha o id, não toca cooldown)    │
    │                         │  ◀───────────── id do usuário ─────┤
    │                         ├─ admin.getUserById(id) ──────────▶ │
    │                         │  (não toca cooldown)                │
    │                         │  ◀─── identidades do usuário ──────┤
    │                         ├─ se tem identidade "email":        │
    │                         │  resetPasswordForEmail(email) ───▶ │── envia, com o
    │                         │  (único passo que toca o cooldown) │   template do painel
    │ ◀── resposta genérica ──┤  (mesmo tempo, elegível ou não)    │
    ├─ verifyOtp(código) ───────────────────────────────────────▶ │
    │ ◀────────────────────────────── sessão ────────────────────┤
```

Isso não muda a resposta do §4.1 tanto quanto a primeira versão deste plano
presumia: a recuperação continua sem precisar da API do Resend nem de uma
segunda credencial (§8.2) — só precisa de uma Edge Function com Service Role
para o passo de identificação, o mesmo padrão já usado em `delete-account`. A
confirmação de cadastro continua exatamente como estava, sem Edge Function.

**Risco que este desenho não resolve sozinho, registrado no código da função e
no risco #13:** a chamada ao `resetPasswordForEmail` acontece de dentro da Edge
Function, então o GoTrue enxerga o pedido vindo da infraestrutura do Supabase,
não do IP de quem pediu a recuperação. **O rate limit nativo por IP
(`sign_in_sign_ups`) deixa de proteger este caminho especificamente** — só a
janela de 60s por usuário continua valendo, porque essa é aplicada pelo próprio
`resetPasswordForEmail`. Aceitável para o volume atual; precisa de atenção
antes de produção com tráfego real (item novo em §16).

**[R] Fora do MVP mesmo assim:** tabela de rate limit própria, geração própria
de código (o `generateLink`/`resetPasswordForEmail` continuam usando o gerador
nativo do GoTrue), API do Resend, backend Node. A Edge Function de recuperação é
a única exceção à recomendação original de "nada além do SMTP" — e mesmo essa
exceção continua saindo pelo SMTP no final, só decide antes se deve acontecer.

---

## 4. Alternativas de integração com o Resend

### 4.1. Comparação

|                            | A. SMTP no Supabase Auth **[R]** | B. Edge Function + API do Resend    | C. Backend próprio |
| -------------------------- | -------------------------------- | ----------------------------------- | ------------------ |
| Código novo                | nenhum                           | função + erros + retry              | serviço inteiro    |
| Quem gera e valida o token | GoTrue                           | GoTrue (via hook) ou você           | você               |
| Anti-enumeração            | nativa                           | precisa ser reconstruída            | idem               |
| Rate limiting              | nativo, servidor                 | nativo + o que você fizer na função | tudo seu           |
| Segredo                    | painel do Supabase               | secret da função                    | seu cofre          |
| E-mail por idioma          | não, template único              | **sim**                             | sim                |
| Manutenção                 | quase zero                       | média                               | alta               |
| Adequação ao MVP           | alta                             | baixa                               | nenhuma            |

**[F] O Supabase Auth envia confirmação e recuperação diretamente pelo SMTP do
Resend.** É o modo suportado e documentado. **[F] A API do Resend não é
necessária** para nenhum dos dois e-mails deste escopo.

### 4.2. Quando a Edge Function é necessária

**[F] Confirmado que é necessária para um caso: bloquear a recuperação de senha
em conta só-OAuth**, decisão tomada em 19/09/2026 depois do achado do §12.6 —
detalhada em §3 e §5.4. O desenho: uma Edge Function com Service Role recebe o
e-mail, verifica as identidades daquele usuário (sem revelar nada ao cliente),
decide internamente se chama `admin.generateLink({ type: 'recovery' })` e envia
o e-mail pela API do Resend, ou não faz nada — e responde ao cliente com a
mesma mensagem genérica e o mesmo tempo, nos dois casos. A confirmação de
cadastro **não** precisa disso: continua saindo pelo SMTP, sem intermediário.

Há também um segundo requisito plausível, ainda em aberto, que levaria pelo
mesmo caminho: **e-mail no idioma da pessoa**. O GoTrue tem um template por tipo
de mensagem, sem variação por usuário. Se o requisito for "quem escolheu inglês
recebe em inglês, lido de `profiles.locale`", o caminho seria o **Send Email
Hook**: o GoTrue chama uma Edge Function em vez de enviar, e ela escolhe o texto
e envia pela API do Resend — mas isso afetaria a confirmação de cadastro
também, não só a recuperação, e seria um Edge Function diferente do desta
seção.

**[H]** Existe um meio-termo: os templates do GoTrue são Go templates e expõem
`{{ .Data }}` (metadata do usuário). Como `signUpWithEmail` já grava metadata,
seria possível gravar também o idioma e ramificar o template. **Isto é hipótese e
nada deve ser planejado em cima dela**: não está confirmado que o editor de
templates aceita condicionais. Verificação na fase 0.

### 4.3. Riscos de um fluxo de recuperação personalizado

Listados porque a pergunta foi feita, não porque sejam recomendados:
reimplementar entropia e comparação de token, com risco de comparação não
constante; reimplementar expiração, uso único e invalidação de tokens anteriores;
criar um endpoint que responde diferente para endereço existente e inexistente;
pôr Service Role em um caminho novo alcançável da internet; perder a integração
com `email_confirmed_at`; duplicar rate limiting numa versão provavelmente pior
que a nativa. Tudo isso sem ganho sobre o que o SMTP entrega.

---

## 5. Enumeração de contas e economia de envios

### 5.1. O que já está resolvido

| Exigência                              | Situação                                                                                                                    |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Não retornar `user_exists`             | **[F]** `resetPasswordForEmail` devolve `{ error: null }` nos dois casos                                                    |
| Não informar se o endereço existe      | **[F]** garantido pelo fornecedor no `/recover`                                                                             |
| Não diferenciar visualmente            | **[F]** [forgot-password.tsx:66](<src/app/(auth)/forgot-password.tsx#L66>) já mostra mensagem única, com o motivo no código |
| Sem diferença perceptível de tempo     | **[H]** precisa ser medido (§12.2, S3)                                                                                      |
| Rate limit por IP e por e-mail         | §8.4, nativo                                                                                                                |
| Não registrar o e-mail completo em log | **[F]** o padrão do projeto já é esse ([delete-account/index.ts:114](supabase/functions/delete-account/index.ts#L114))      |
| Normalização                           | **[R]** `normalizeEmail` em todos os caminhos                                                                               |

### 5.2. O vazamento que já existe no cadastro

**[F]** O cadastro detecta e-mail já registrado por `identities.length === 0` e
lança `'User already registered'`
([auth-service.ts:183](src/features/auth/auth-service.ts#L183)). Isso **é** um
oráculo de enumeração no `/signup`, introduzido de propósito — o próprio
comentário no código explica que o Supabase ofusca a resposta justamente para
evitá-lo.

**[R] Manter**, aceitando o vazamento. A justificativa é de experiência e é
legítima: sem essa mensagem, quem já tem conta e esqueceu fica preso numa tela de
código que nunca chega. **[D]** Se a decisão for fechar, o preço é mandar todo
cadastro para a tela de código e deixar o e-mail explicar o que houve, ao custo
de um envio por tentativa.

O que não pode acontecer é a regra "não revelar se um e-mail existe" entrar no
`AGENTS.md` em forma absoluta enquanto este código existe: seria uma regra que o
próprio projeto desobedece, e regra assim não sobrevive à primeira leitura
atenta.

### 5.3. O trade-off entre economia do Resend e prevenção de enumeração

Este é o ponto onde o raciocínio ingênuo erra, e ele merece ser explicitado.

**A tentação.** "Antes de mandar o Supabase enviar, consulto se existe conta
elegível; se não existir, não gasto envio." Parece economia pura.

**Por que a economia é ilusória aqui.** [F] O `/recover` do GoTrue já não envia
e-mail para endereço sem conta. A consulta prévia não economizaria **nenhum**
envio que já não esteja economizado. O ganho marginal é zero, e o custo é real.

**Por que o custo é real.** Uma pré-consulta precisa olhar antes de decidir.
Mesmo respondendo sempre a mesma coisa ao app, ela se comporta de forma diferente
por dentro nos dois casos, e essa diferença vaza por tempo de resposta, por
consumo de rate limit e por volume de log. O oráculo que o `/recover` não tem
passaria a existir num endpoint nosso. Fazer isso direito exigiria enviar sempre,
ou dormir um tempo fixo maior que o pior caso — o que anula a economia que
motivou a ideia.

**Onde o trade-off existe de verdade.** Ele não está na recuperação; está no
**reenvio de confirmação** e no **cadastro**. Ali sim, cada tentativa gera envio,
e limitar o gasto significa limitar tentativas — o que produz, como efeito
colateral, respostas diferentes para quem estourou o limite e quem não estourou.
A saída é fazer o limite depender de coisas que **não** revelam a existência da
conta: IP, endereço digitado e projeto, sempre com a mesma mensagem de espera
para todos os motivos. É o que §8.4 faz.

**Síntese, para não restar dúvida.** Neste desenho, economia e segurança **não**
estão em conflito, porque a economia é nativa e a segurança também. O conflito só
nasce se a pré-consulta for construída — e é exatamente por isso que ela não deve
ser. Se em algum momento futuro surgir um caso em que o conflito seja real, a
regra de desempate é: **prevenir enumeração vence economia de envio**, e o custo
do envio vira um problema de limite, não de filtro.

### 5.4. Sobre filtrar contas OAuth

**[F] Confirmado em 19/09/2026 (§12.6): não há filtro nativo.** O `/recover`
envia o e-mail de recuperação para uma conta só-Google exatamente como enviaria
para uma conta com senha — testado contra uma conta real do projeto. Isso
confirma o que a seção original só suspeitava: não existe forma de pedir ao
Supabase que ignore contas sem identidade de senha.

**[R] Não construir esse filtro.** Fazer isso exigiria, no mínimo: uma Edge
Function na frente do fluxo, Service Role para ler `auth.users`, decisão sobre o
que fazer quando a leitura falha, tratamento de tempo constante para não virar
oráculo, e rate limiting próprio — ou seja, a arquitetura B do §4.1 inteira, para
o único ganho de recusar um caso que, pelo teste, é inofensivo de aceitar: o
comportamento nativo apenas oferece a quem já tem conta Google a opção de também
ganhar uma senha, o que é comportamento comum em muitos produtos. A decisão
final de aceitar ou intervir está em §16.6, e falta só confirmar que o fluxo
completa sem quebrar no meio (checklist em §12.6).

---

## 6. Fluxos de UX

Premissa: **código numérico nos dois e-mails, sem deep link** (justificativa em
§6.5). O deep link do OAuth continua exatamente como está.

### 6.1. Cadastro com e-mail e senha

```
sign-up ──(sucesso)──▶ confirm-email ──(código ok)──▶ sessão ──▶ onboarding
   │                        ├─ reenviar (com contagem regressiva)
   │                        ├─ código errado ou expirado → erro no campo
   │                        └─ trocar e-mail → volta a sign-up
   └─ e-mail já cadastrado → mensagem + atalho para entrar
```

| Estado                        | Comportamento                                                                                 |
| ----------------------------- | --------------------------------------------------------------------------------------------- |
| Sucesso                       | navega para `confirm-email` com o e-mail normalizado                                          |
| Enviado                       | texto neutro; aqui não há o que esconder, o endereço acabou de ser digitado                   |
| E-mail já cadastrado          | decisão do §5.2                                                                               |
| E-mail inválido ou com espaço | **[F]** `validateEmail` + `normalizeEmail` já cobrem, com sugestão de domínio digitado errado |
| Senha inválida                | **[F]** `PasswordField` já mostra os requisitos em tempo real                                 |
| Falha no envio                | **[R]** conta criada, código não chegou: a mensagem aponta o reenvio, nunca "falhou"          |
| App fechado no meio           | **[R]** o endereço pendente precisa sobreviver, em AsyncStorage, e ser limpo ao confirmar     |
| Tenta entrar sem confirmar    | **[F]** o GoTrue recusa; **[R]** a tela passa a oferecer "confirmar agora"                    |
| Código expirado ou inválido   | **[R]** erro no campo, com o reenvio à mão; nunca uma tela de erro                            |
| Reenvio                       | `supabase.auth.resend({ type: 'signup' })`, com contagem regressiva visível                   |

### 6.2. Google e Apple

**Nada muda.** **[F]** Provedor externo não passa por `enable_confirmations`; o
Supabase marca o e-mail como confirmado a partir do provedor, e nenhum e-mail do
TripReady é enviado nesses fluxos. Cadastro novo, login existente, conta já
vinculada, e-mail privado da Apple, cancelamento (`AuthCancelledError`) e falha
do provedor (`auth.error.callbackFailed`) seguem como estão.

"Esqueci minha senha" em conta OAuth: **[D]** depende de §12.6. Em nenhum cenário
a tela pode dizer "esta conta é do Google" — isso confirmaria a existência do
endereço.

### 6.3. Recuperação de senha

```
forgot-password ──(sempre)──▶ reset-password ──(código ok)──▶ nova senha ──▶ entra
                                    ├─ reenviar (contagem regressiva)
                                    └─ código errado ou expirado → erro no campo
```

**A mudança de desenho:** hoje a tela termina numa mensagem final. Ela passa a
**sempre** avançar para a tela de código, para qualquer endereço com formato
válido. Isso mantém a neutralidade — a tela seguinte é idêntica exista ou não a
conta — e melhora a experiência de quem tem conta, que não sai do app.

| Caso                           | Comportamento                                                                                  |
| ------------------------------ | ---------------------------------------------------------------------------------------------- |
| Conta válida com senha         | recebe o código, redefine, entra                                                               |
| E-mail inexistente             | **[F]** nenhum envio; a tela avança igual                                                      |
| Conta Google ou Apple          | **[H]** §12.6                                                                                  |
| E-mail inválido                | validação local, antes da requisição                                                           |
| Espaços ou maiúsculas          | `normalizeEmail`                                                                               |
| Solicitações repetidas         | **[F]** janela por usuário no `/recover`; **[R]** contagem regressiva espelhando               |
| Rate limit atingido            | **[R]** mensagem de espera, sem número e igual para todo motivo — o texto não pode virar sinal |
| Falha do Resend ou do Supabase | **[R]** mesma mensagem neutra; a diferença não ajuda o usuário e informa quem sonda            |
| Código expirado ou já usado    | erro no campo + reenvio                                                                        |
| Outro dispositivo              | **[R]** funciona: o código não é vinculado ao aparelho — a vantagem prática sobre o link       |
| Redefine com sucesso           | sessão criada, entra                                                                           |
| Cancela                        | volta ao login, nada foi alterado                                                              |

### 6.4. Mensagens

Todas as chaves novas entram nos três dicionários, e cada mensagem indica o
próximo passo em vez de descrever o erro.

| Estado                     | Direção do texto (pt-BR canônico)                                                                                 |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Solicitação recebida       | "Confira seu e-mail" + "Se existir uma conta com este endereço, o código chega em instantes. Olhe também o spam." |
| Código enviado             | "Digite o código que enviamos para {email}."                                                                      |
| Falha temporária           | "Não conseguimos enviar agora. Tente de novo em instantes."                                                       |
| Limite atingido            | "Aguarde um momento antes de pedir outro código." — sem número, igual para todo motivo                            |
| Expirado                   | "Este código expirou. Peça um novo."                                                                              |
| Inválido                   | "Código incorreto. Confira os dígitos."                                                                           |
| Senha atualizada           | "Senha atualizada" + próximo passo                                                                                |
| Conta ainda não confirmada | "Confirme seu e-mail para continuar" + botão que leva à tela de código                                            |
| Conta de provedor externo  | reutiliza `profile.edit.managedBy`; **nunca** na tela de recuperação                                              |

**[R]** A mensagem sugerida originalmente está boa e obedece à regra de não
confirmar nem negar. Duas melhorias: separar em título e corpo, como as outras
telas fazem com `ScreenHeader`, e falar em código, não em link. A frase sobre
spam fica — é a causa mais comum de "não chegou".

**[R] Nenhum texto cita a quantidade de dígitos nem o prazo exato.** Os dois são
configuráveis (§7.4), e escrever o número no dicionário cria uma promessa que a
configuração pode contradizer depois. "Os dígitos" e "poucos minutos" envelhecem
melhor — e é o que permite decidir o tamanho do OTP mais tarde sem reescrever
texto em três idiomas.

### 6.5. Link × código

| Critério                        | A. Link                                                                    | B. Código numérico                                          |
| ------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Nativo no Supabase              | **[F]** sim, `{{ .ConfirmationURL }}`                                      | **[F]** sim, `{{ .Token }}` + `verifyOtp()`                 |
| Código customizado              | nenhum                                                                     | **nenhum** — o ponto central                                |
| Expo Go                         | **[F]** frágil: `exp://IP:porta` muda; o Gmail pode não entregar o esquema | indiferente, não há link                                    |
| Deep link e redirect URL        | configuração obrigatória por ambiente                                      | **nenhuma**                                                 |
| Aparelho físico                 | **[H]** precisa ser medido (§12.4)                                         | **[H]** precisa ser medido também (§12.4)                   |
| E-mail aberto em outro aparelho | sessão nasce no aparelho errado                                            | funciona                                                    |
| iOS × Android                   | entrega de deep link difere                                                | idêntico                                                    |
| Acessibilidade                  | depende do navegador                                                       | campo numérico, `autoComplete="one-time-code"`              |
| Entropia                        | alta (`token_hash`)                                                        | 10^n, n = tamanho do OTP — a fraqueza real                  |
| Rate limit                      | `/verify` por IP                                                           | mesmo limite, e aqui ele é a **única** trava de força bruta |
| Expiração                       | **[F]** mesma configuração para os dois                                    | mesma                                                       |
| Consumo do Resend               | idêntico                                                                   | idêntico                                                    |
| Testabilidade                   | exige aparelho e caixa de entrada                                          | exige caixa de entrada; o resto é campo de texto            |

**[R] Alternativa B, para os dois e-mails — condicionada ao teste em aparelho
físico da fase 0.** A recomendação não é um palpite sobre o Expo Go; ela precisa
ser confirmada nos dois sistemas antes de virar decisão, e o protocolo está em
§12.4.

**A limitação assumida, sem maquiagem.** Com OTP de `n` dígitos, o espaço é 10^n.
Para n = 6, são 10^6 combinações; com 30 verificações por 5 minutos por IP, dão
360 tentativas por hora por IP, e cobrir o espaço exigiria da ordem de 2.800 IPs
agindo em paralelo contra um endereço conhecido dentro da janela de expiração de
uma hora. Não é trivial, mas também não é impossível. Cada dígito a mais divide
esse risco por dez, e **[H]** não foi confirmado que o GoTrue bloqueie o código
após N erros — não há contador de tentativas por token documentado. Mitigações,
todas de configuração: reduzir a expiração do OTP, aumentar o tamanho do OTP e
apertar `token_verifications`. **[R]** Não construir contador próprio de
tentativas: ele viveria no cliente, e o cliente não é camada de segurança.

**[D]** Se esse perfil de risco não for aceitável, a alternativa é A, com a
fricção de deep link no Expo Go e uma rota `auth/confirm` trocando `token_hash`
por sessão.

**[R] O que não fazer em nenhuma hipótese: código customizado.** Geração
criptográfica, hash em vez de texto puro, invalidação de códigos anteriores, uso
único, tabela de armazenamento, Service Role, Edge Function e integração manual
com `email_confirmed_at` são trabalho que o GoTrue já faz. Um código próprio seria
mais superfície, menos testado, e ainda precisaria de uma segunda chamada para
marcar a conta como confirmada, com a janela de inconsistência que isso abre.

---

## 7. Configuração do Supabase e do Resend

### 7.1. Resend

| Item             | Decisão                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Conta            | uma, com 2FA                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Domínio          | **[D] ainda não comprado.** Esclarecido em 19/09/2026: `tripready.app` e `noreply@tripready.app` que chegaram a entrar em `identity.ts` eram valores de exemplo digitados sem domínio real por trás; **revertido para os marcadores `{{DOMINIO}}`/`{{EMAIL_CONTATO}}`** para não arriscar publicar algo que ninguém possui. `tripready.dev` está adicionado no Resend com status "Not Started" (nenhum registro de DNS configurado) — pode ser usado se for esse o domínio comprado, ou removido se a escolha for outra. Compra e escolha de domínio seguem em aberto, sem bloquear o resto do plano (ver linha `from` abaixo) |
| SPF, DKIM, DMARC | **[F]** o Resend gera os registros na verificação. **[R]** DMARC começa em `p=none` com `rua`, e só endurece com relatório limpo. Só se aplica depois de haver domínio                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `from`           | **[F] resolvido para a fase de testes em 19/09/2026: `onboarding@resend.dev`.** É o remetente de sandbox do próprio Resend, verificado por padrão, que **não exige domínio próprio** — a limitação é que só entrega para o e-mail com que a conta do Resend foi criada. Substitui o `admin_email = tripready@app.com` que estava configurado (domínio inexistente, teria falhado). Válido só até a fase 1 acontecer de verdade; produção exige domínio próprio verificado                                                                                                                                                      |
| `reply-to`       | **[D]** adiado junto com o domínio — `LEGAL_IDENTITY.contactEmail` voltou a `{{EMAIL_CONTATO}}`. Quando o domínio existir, vale um endereço monitorado, nunca um `noreply@`, porque o e-mail de recuperação orienta a procurar ajuda                                                                                                                                                                                                                                                                                                                                                                                           |
| API Key          | **[F]** necessária em dois papéis agora, não só um: como senha de SMTP (confirmação de cadastro) **e** como chave de API de verdade, usada pela Edge Function da recuperação de senha (§3, §4.2). Pode ser a mesma chave nos dois papéis ou uma para cada — decidir ao implementar. Uma por ambiente, escopo mínimo de envio                                                                                                                                                                                                                                                                                                   |
| Dev × prod       | **[R]** duas chaves, nunca compartilhadas. **[F]** antes do domínio, o Resend só entrega ao endereço do dono da conta                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Rotação          | **[R]** procedimento escrito: cria a nova, troca no painel, confirma um envio, revoga a antiga. **[D]** periodicidade                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Limites          | **[F] confirmado em 19/09/2026:** plano free, **100 e-mails/dia** e **3.000/mês**. A trava de verdade continua sendo o `email_sent` do Supabase (§8.4), agora dimensionado por esse teto real                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Bounce e spam    | **[R]** painel do Resend, conferido nas primeiras semanas. Sem webhook e sem armazenamento próprio — seria dado pessoal novo sem finalidade                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |

### 7.2. Painel do Supabase

| Onde                     | O quê                                                                      |
| ------------------------ | -------------------------------------------------------------------------- |
| Auth → SMTP              | host, porta, usuário e senha do Resend; sender name e `from`               |
| Auth → Providers → Email | **Confirm email ligado** — **[D]**, muda contas existentes não confirmadas |
| Auth → Email Templates   | `Confirm signup` e `Reset password` reescritos com `{{ .Token }}`          |
| Auth → Rate Limits       | §8.4                                                                       |
| Auth → OTP               | expiração e tamanho — §7.4                                                 |
| Auth → URL Configuration | **[F]** sem mudança: com código, os e-mails não usam `redirect_to`         |

### 7.3. `config.toml` (local)

`enable_confirmations = true`, `otp_expiry`, `otp_length`, `[auth.email.smtp]`
com `pass = "env(RESEND_SMTP_PASSWORD)"`, `[auth.email.template.confirmation]` e
`[auth.email.template.recovery]` apontando para `supabase/templates/`, e os
valores de `[auth.rate_limit]`.

**[F] Divergência estrutural a registrar.** `config.toml` não governa o projeto
remoto, e `db push` não publica template nem configuração de Auth. O arquivo e o
painel vão divergir em silêncio, como `minimum_password_length` já diverge hoje
([config.toml:180](supabase/config.toml#L180) documenta isso). **[R]** Comentar
cada valor como espelho do painel e cobrir os templates com checagem automática
(§8.5).

### 7.4. Tamanho e expiração do OTP — como configurar

**[D] Decidido em 19/09/2026: 6 dígitos.** O projeto remoto estava com
`otp_length = 8` (configurado antes deste plano, por motivo desconhecido), e foi
alterado para **6** diretamente no painel. A escolha prioriza a experiência de
digitar o código; a entropia menor é compensada por uma janela de expiração mais
curta (abaixo) e por um limite de verificação mais apertado (§8.4, #5). Como
nenhum texto de interface cita o número (§6.4) e a validação de formato é
parametrizada (§11.2), essa decisão não deixou rastro em nenhum outro lugar do
código.

**[F] Local, em `config.toml`:**

```toml
[auth.email]
otp_length = 6    # padrão 6; faixa aceita: 6 a 10
otp_expiry = 3600 # segundos; padrão 3600 (1 hora)
```

O bloco já existe no arquivo do projeto
([config.toml:233](supabase/config.toml#L233)), com os dois valores no padrão.
Vale **apenas** para o Supabase local.

**[F] Remoto, no painel:** a expiração fica em _Authentication → Sign In /
Providers → Email → Email OTP expiration_ — e **[F] o tamanho também apareceu
nessa mesma tela do painel**, ao contrário do que a hipótese original supunha; a
Management API não foi necessária.

**[D] Expiração recomendada: 600 segundos (10 minutos), reduzindo de 3600.** O
motivo é o mesmo que levou a apertar o limite de verificação em #5 do §8.4: com
6 dígitos (10⁶ combinações) em vez de 8, o parâmetro que sobra para conter força
bruta é a janela de tempo. Em 3600s, com 30 verificações/5min por IP, forçar o
código exigiria cerca de 2.800 IPs simultâneos dentro da hora; em 600s, o mesmo
ataque precisaria de ordem de 16.700 IPs dentro dos 10 minutos, porque o
atacante tem muito menos tempo para acumular tentativas antes do código expirar.
Dez minutos continua confortável para quem está lendo o e-mail e digitando o
código.

**[F] Consequência importante da expiração:** ela governa **todos** os links e
códigos de e-mail — confirmação, recuperação, troca de e-mail e convite. Não é
possível dar prazos diferentes para confirmação e recuperação.

**[R]** Qualquer que seja o valor escolhido, ele é registrado em dois lugares que
precisam continuar de acordo: `config.toml` e painel remoto.

---

## 8. Variáveis de ambiente, segredos e rate limiting

### 8.1. O app não ganha nenhuma variável

**[F]** [env.ts](src/lib/env.ts) continua com duas entradas. O app nunca fala com
o Resend, então não há chave a embutir. **Nada nesta implementação pode ser
`EXPO_PUBLIC_*`.**

### 8.2. A única credencial nova

**[F] Atualizado em 19/09/2026:** o desenho final da recuperação (§3) não
precisou de uma segunda credencial. A Edge Function usa Service Role — o mesmo
segredo que `delete-account` já usa — não a API do Resend.

| Campo       | Valor                                                                                                |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| Nome        | `RESEND_SMTP_PASSWORD`                                                                               |
| O que é     | API key do Resend, usada como senha de SMTP                                                          |
| Usada por   | Supabase Auth, na confirmação de cadastro **e** na recuperação de senha (mesmo SMTP, dois templates) |
| Produção    | **só** no painel do Supabase (Auth → SMTP); não vive em arquivo do repositório                       |
| Local       | `supabase/.env.local` — **[F]** já coberto por [supabase/.gitignore](supabase/.gitignore)            |
| Pública?    | não, nunca                                                                                           |
| No bundle?  | nunca; sem prefixo `EXPO_PUBLIC_`, o Expo não a inclui                                               |
| Documentada | nome e finalidade no README e no `.env.example`                                                      |

**[R]** Não pôr no `.env` da raiz, mesmo gitignorado: esse arquivo é o do Expo,
e misturar segredo de servidor ali convida o erro futuro.

### 8.3. Separação por camada

| Camada               | Conteúdo                                    | Local                                                                                                               |
| -------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `EXPO_PUBLIC_*`      | URL e chave publicável do Supabase          | `.env`, embutido no bundle                                                                                          |
| Segredo de servidor  | senha SMTP do Resend, API key do Resend     | painel do Supabase; secrets da Edge Function                                                                        |
| Segredos do Supabase | Service Role, client secrets Google e Apple | **[F]** painel, e agora também os secrets de **duas** Edge Functions (`delete-account` e a de recuperação de senha) |
| Operação             | access token da Management API              | fora do repositório                                                                                                 |
| Painel do Resend     | domínio, DNS, chaves, logs                  | painel                                                                                                              |

### 8.4. Rate limiting — requisito obrigatório

**Princípio que ordena esta seção: o limite nativo é a primeira opção, sempre.**
Só se cogita construir algo depois de demonstrado que nenhum limite nativo cobre
o caso — e, neste escopo, todos cobrem. A razão não é preguiça: o limite nativo
roda antes de a requisição chegar a qualquer código nosso, já resolve
concorrência e expiração de contador, e não tem manutenção. Qualquer alternativa
começa perdendo nesses três pontos, e precisa justificar a diferença.

**Por que o cliente não pode ser a única camada:** o app é um binário na mão do
usuário. Qualquer contagem nele é observável e alterável, e a requisição pode ser
feita direto ao endpoint do GoTrue com a chave publicável, que está no bundle por
definição. Contagem no cliente reduz acidente, não ataque.

| #   | O que limita                                      | Escopo       | Padrão **[F]** | Proposto **[R]/[D]**   | Status               | Observação                                                                     |
| --- | ------------------------------------------------- | ------------ | -------------- | ---------------------- | -------------------- | ------------------------------------------------------------------------------ |
| 1   | e-mails enviados                                  | projeto/hora | 2 (sem SMTP)   | **10/h** **[D]**       | pendente no painel   | dimensionado pelo teto real do Resend free — 100/dia, 3.000/mês (§7.1)         |
| 2   | `/signup`, `/recover`, `/resend`, `/otp`, `/user` | IP / 5 min   | 30             | 20                     | ainda em 30          | cobre pedido de código e de recuperação                                        |
| 3   | confirmação de cadastro                           | usuário      | janela de 60 s | manter                 | ok                   | espelhado por contagem regressiva                                              |
| 4   | recuperação                                       | usuário      | janela de 60 s | manter                 | ok                   | idem                                                                           |
| 5   | `/verify` — validação de código                   | IP / 5 min   | 30             | **15** **[D]**         | pendente no painel   | única trava de força bruta do OTP; mais importante agora que o OTP é 6 dígitos |
| 6   | `/token`                                          | IP / 5 min   | 150            | manter                 | ok                   | login e refresh                                                                |
| 7   | expiração do OTP                                  | projeto      | 3600 s         | **600 s** **[D]**      | pendente no painel   | reduz a janela de ataque — justificativa em §7.4                               |
| 8   | tamanho do OTP                                    | projeto      | 8 (estava)     | **6** **[F] aplicado** | **feito 19/09/2026** | decidido e já alterado no painel                                               |

**Nenhum desses números é definitivo**, exceto o #8, já aplicado. Os que mais
pedem julgamento são #1, #5 e #7 — apertam a experiência de quem erra de boa-fé
ou de quem manda muitos e-mails de uma vez, mas são também os três que mais
protegem contra o cenário real (teto diário apertado do Resend, código mais
curto).

**Por usuário:** **[F]** #3 e #4 já são por usuário, aplicados pelo GoTrue. **[R]
Por dispositivo, não fazer nada:** não existe identificador confiável sem coletar
dado novo, e coletar dado novo para este fim contraria a minimização que a
política de privacidade promete.

**Por que não haverá tabela nem Redis:** cada endpoint deste escopo já tem limite
nativo por IP e por usuário; uma tabela própria só teria efeito se algo nosso
estivesse no caminho da requisição, e não está nem deve estar; Redis é
infraestrutura nova para um MVP sem backend. **[D]** Se rate limiting próprio for
exigido mesmo assim, ele arrasta a arquitetura B do §4.1 inteira — melhor decidir
isso agora do que no meio da implementação.

**Cota do Resend — confirmada em 19/09/2026: plano free, 100 e-mails/dia, 3.000
e-mails/mês.** O limite #1 é o instrumento que protege essa cota, e a
recomendação final é **10 por hora**, não os 30 do cálculo inicial. A 30/h o teto
teórico diário seria 720 — mais de sete vezes o que o Resend aceita por dia. A
10/h o teto teórico é 240/dia, ainda acima de 100 num cenário de uso contínuo no
limite, mas o app está pré-lançamento e o volume real de hoje é muito menor que
isso; 10/h dá folga confortável para os testes sem chegar perto do teto diário.
**Isto é uma configuração de fase, não definitiva:** antes de qualquer
lançamento real com volume maior, o valor de #1 precisa ser revisto junto com o
plano contratado do Resend — nesse momento o app ainda não estará mais na
condição "recém-criado, poucos usuários" que torna 10/h seguro hoje. O que não
se deve fazer é deixar a cota do Resend ser a trava de fato: quando ela estoura,
quem para de receber é o usuário legítimo, e o painel do Supabase não sabe
disso — o objetivo de #1 é nunca deixar a requisição chegar perto desse ponto.

**Concorrência e contorno:** **[F]** token bucket aplicado pelo GoTrue —
concorrência, limpeza e expiração de contador são problema dele. Contornos
possíveis: IPs rotativos (mitigado por #3 e #4, que são por usuário) e e-mails
variados contra #1 (mitigado pelo próprio #1, que é por projeto).

### 8.5. Observabilidade

**[R]** Logs de Auth no painel do Supabase e log de entrega no Resend. Nada novo
no cliente, nada de e-mail em log. **[R]** Uma checagem automática comparando os
templates de `supabase/templates/` com o publicado — sem ela, a divergência do
§7.3 aparece como "o e-mail está com o texto antigo" semanas depois. **[D]** Se o
esforço não se justificar agora, o substituto é item de checklist manual com
prazo definido, não adiamento aberto.

---

## 9. Templates e conteúdo dos e-mails

### 9.1. Onde moram

**[F] Confirmado em 19/09/2026: o template de Templates do Resend só funciona
pela API, nunca por SMTP.** A documentação do Resend é explícita — o template é
referenciado por `id` numa chamada da API, e `template` não pode ser combinado
com `html`/`text`/`react`; não há suporte documentado a template por SMTP.

**[F] Decisão final, mais simples do que a primeira leitura deste plano
supunha: os dois e-mails usam templates do Supabase, nenhum usa template do
Resend.** A Edge Function da recuperação (§3) não manda e-mail pela API — ela só
decide se chama o `resetPasswordForEmail` nativo, que dispara o SMTP com o
template "Reset password" do próprio Supabase, do mesmo jeito que a confirmação
usa "Confirm signup". Um template do Resend chegou a ser cogitado e até criado
no painel durante a investigação, mas fica **sem uso** neste desenho — pode ser
apagado ou guardado para outra finalidade futura, sem custo.

- **Confirmação de cadastro** — template "Confirm signup" no Supabase.
- **Recuperação de senha** — template "Reset password" no Supabase, o mesmo que
  o usuário já preparou.

**[R]** Fonte única para os dois em `supabase/templates/confirmacao.html` e
`supabase/templates/recuperacao.html`, versionados. `config.toml` aponta para
eles no local; o remoto recebe o mesmo conteúdo pelo painel ou pela Management
API — a divergência remota é o risco conhecido do §7.3.

### 9.2. Conteúdo

**Confirmação** — assunto em pt-BR, na linha de "Seu código de confirmação do
TripReady": identificação do TripReady (marca em texto; **[R]** sem imagem
remota, que muitos clientes bloqueiam e que ainda mede abertura); uma frase de
contexto; **o código**, grande e selecionável; o prazo, sem número exato; aviso
de que quem não pediu pode ignorar; `reply-to` para contato.

**Recuperação** — mesma estrutura, deixando claro que foi pedida uma redefinição.

**[F] Já existe um rascunho real, próximo do desenho acima.** Duas referências
salvas em `tasks/`:

- `exemplo-tela-codigo-email.png` — **não é e-mail**, é a tela do app onde a
  pessoa digita o código (Fase 5, §11.2). Registrado como referência visual
  daquela tela, apesar do nome do arquivo.
- `exemplo-tela-confirmar-email.png` — o e-mail de confirmação de verdade, já
  com a caixa do código, passo a passo numerado e aviso de "se não foi você".
  Bate com o template já escrito no editor do Supabase (Auth → Email Templates
  → Confirm signup), com as cores do app.

**Quatro correções encontradas no template real, decididas em 19/09/2026:**

1. `{{{company_name}}}` não é variável do Supabase — é texto fixo, `TripReady`
   direto, sem chaves.
2. `{{{first_name}}}` também não existe (e a sintaxe de chave tripla nem é a do
   Supabase — o template parece ter sido colado de outra ferramenta). O nome
   gravado no cadastro está em `.Data.display_name`; recomendação, com proteção
   para quando não vier nome: `{{ if .Data.display_name }}Olá,
{{ .Data.display_name }} 👋{{ else }}Olá! 👋{{ end }}`. **[H]** Não testado se
   `.Data` aceita indexação por chave dessa forma no motor de template do
   Supabase — conferir ao aplicar.
3. O texto tinha "Expira em 15 minutos", que não batia com `otp_expiry = 600`
   (10 minutos) já configurado — **[D] decidido: trocar por texto sem número
   exato** ("expira em poucos minutos"), pelo mesmo motivo que já vale para o
   app (§6.4): o valor é configurável e o texto não pode prometer um número que
   a configuração pode contradizer depois. **[R]** O mesmo raciocínio vale para
   "código de 6 dígitos" no passo a passo — trocar por "o código de
   verificação", sem o número, para não precisar editar o e-mail se o tamanho do
   OTP mudar.
4. O link "Entre em contato com o suporte" usava `{{support_url}}` — mesmo
   problema dos outros, variável que não existe. **[D] decidido: link fixo**
   `mailto:suporte-tripready@gmail.com`, escolhido por já ter aparecido nesta
   conversa como e-mail de suporte. **[R]** Vale revisitar se esse mesmo
   endereço deve virar `LEGAL_IDENTITY.contactEmail` quando a identidade legal
   for preenchida de verdade — hoje são decisões independentes, mas é natural
   que convirjam.

**[R]** HTML de e-mail: tabela, estilo inline, largura máxima de cerca de 600 px,
uma coluna, sem fonte externa, com versão em texto puro. É o subconjunto que
sobrevive ao Outlook. A identidade visual vem de `src/theme/tokens.ts`, copiada à
mão — o e-mail não importa TypeScript. O rascunho real já segue essa linha.

### 9.3. O problema do idioma

**[F] Contradição explícita:** o app fala três idiomas; o GoTrue tem um template
por tipo de mensagem, sem variação por usuário. Não há forma nativa de o e-mail
seguir `profiles.locale`.

| Opção | Descrição                                       | Custo | Risco                                                                             |
| ----- | ----------------------------------------------- | ----- | --------------------------------------------------------------------------------- |
| a)    | só pt-BR no MVP                                 | zero  | usuário en/es recebe em português — coerente com o fallback canônico, mas visível |
| b)    | um e-mail com os três idiomas empilhados        | zero  | longo e feio; nenhum idioma fica bem                                              |
| c)    | condicional Go template sobre `{{ .Data }}`     | baixo | não avaliada — a decisão foi direto para (a)                                      |
| d)    | Send Email Hook + Edge Function + API do Resend | alto  | a arquitetura que este plano recusa para o MVP                                    |

**[D] Decidido em 19/09/2026: opção (a), só pt-BR por enquanto.** A hipótese (c)
não chegou a ser testada — o usuário optou direto pela opção mais simples em vez
de gastar tempo confirmando se o editor de templates aceita condicionais. (d)
continua documentada como caminho para quando houver usuário de fato fora do
pt-BR, mas não é trabalho deste plano.

**[F]** Os textos de e-mail **não** entram em `src/i18n/messages/*`: não passam
por `t()` e o teste de completude não os enxergaria. É uma exceção real à regra do
`AGENTS.md` e merece ficar escrita lá para não parecer descuido.

### 9.4. Testar os links

Com código **não há link a testar** — é parte do ganho. Resta conferir
renderização em Gmail, Outlook e Apple Mail, e que o `reply-to` chega em caixa
viva.

---

## 10. Segurança e privacidade

| Vetor                     | Situação                                                                                                                                                                                                                                                                                                 |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Enumeração                | §5. `/signup` tem a exceção conhecida (decisão consciente). O `/recover` nativo **não** filtra por provedor (§12.6) — por isso a recuperação passa a ter uma Edge Function própria, que precisa manter a mesma resposta e o mesmo tempo nos dois casos, sob risco de recriar a enumeração num lugar novo |
| Exposição de `auth.users` | **[F]** não exposta pelo PostgREST. **Atualizado:** a Edge Function da recuperação **lê** identidades por Service Role, mas só decide um booleano interno — nunca devolve o que leu ao cliente                                                                                                           |
| Service Role              | **[F] Atualizado em 19/09/2026: usada em duas Edge Functions**, não mais só na `delete-account` — a nova função de recuperação também precisa dela para checar identidades e gerar o link de recuperação                                                                                                 |
| Variáveis públicas        | nenhuma nova                                                                                                                                                                                                                                                                                             |
| Logs do cliente           | **[R]** nenhum endereço, nenhum código; revisar os `console.log` de `__DEV__` em `auth-redirect.ts` e `auth-service.ts`                                                                                                                                                                                  |
| Vazamento de token        | o código vai por e-mail, em claro — é a natureza do canal; mitigado por expiração curta e uso único                                                                                                                                                                                                      |
| Redirect URLs abertas     | **[F]** superfície reduzida: com código, os e-mails deixam de carregar `redirect_to`                                                                                                                                                                                                                     |
| Deep links                | inalterados                                                                                                                                                                                                                                                                                              |
| Link em outro dispositivo | **[F]** deixa de ser problema — o código não cria sessão no aparelho que abriu o e-mail                                                                                                                                                                                                                  |
| Rate limiting e abuso     | §8.4                                                                                                                                                                                                                                                                                                     |
| Phishing                  | **[R]** DMARC, remetente consistente, e um e-mail que nunca pede senha nem dado pessoal — só mostra um código                                                                                                                                                                                            |
| Segurança do template     | **[R]** sem imagem remota, sem rastreador, sem conteúdo de terceiro                                                                                                                                                                                                                                      |
| Dado pessoal no e-mail    | só o endereço, para o próprio dono. Nenhum dado de viagem, nenhum país de passaporte                                                                                                                                                                                                                     |
| Retenção de logs          | do fornecedor; nenhum log novo criado por nós                                                                                                                                                                                                                                                            |
| LGPD e minimização        | **nenhum dado pessoal novo é coletado ou armazenado**; o endereço já existia, e passa a transitar por mais um operador                                                                                                                                                                                   |
| Política de privacidade   | **precisa mudar** — §11.4                                                                                                                                                                                                                                                                                |

---

## 11. Impactos no código

### 11.1. Arquivos existentes — implementado em 19/09/2026

| Arquivo                                                     | Mudança                                                                                                                                                                                                                                                                  |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [auth-service.ts](src/features/auth/auth-service.ts)        | `confirmSignUpCode`, `resendSignUpCode`, `requestPasswordReset` (chama a Edge Function), `verifyRecoveryCode`, `setNewPasswordAfterRecovery`; `signInWithEmail` passou a usar `normalizeEmail`; o antigo `sendPasswordReset` foi removido e virou `requestPasswordReset` |
| [auth-context.tsx](src/features/auth/auth-context.tsx)      | expõe os métodos novos e `isRecovering`; **lê o `_event` de `onAuthStateChange`** para detectar `PASSWORD_RECOVERY`                                                                                                                                                      |
| [auth-errors.ts](src/features/auth/auth-errors.ts)          | `auth.error.invalidOrExpiredCode` e `isEmailNotConfirmedError`, usada pela tela de login                                                                                                                                                                                 |
| [\_layout.tsx](src/app/_layout.tsx)                         | **feito**: os guards de `(app)` e `onboarding` ganharam `&& !isRecovering`; `auth/new-password` entrou como tela fora dos grupos, ao lado de `auth/callback`                                                                                                             |
| [sign-up.tsx](<src/app/(auth)/sign-up.tsx>)                 | o bloco `sentTo` virou navegação para `/confirm-email`                                                                                                                                                                                                                   |
| [forgot-password.tsx](<src/app/(auth)/forgot-password.tsx>) | o estado `sent` virou navegação para `/reset-password`; chama `requestPasswordReset` em vez do método nativo direto; cooldown de 60s lido de `recovery-cooldown.ts` — persistido, não zera ao voltar da tela seguinte                                                    |
| [reset-password.tsx](<src/app/(auth)/reset-password.tsx>)   | o cooldown do "reenviar" também passou a ler/gravar em `recovery-cooldown.ts`, em vez de um contador local que reiniciava a cada montagem da tela                                                                                                                        |
| `src/features/auth/recovery-cooldown.ts` (novo)             | cooldown de 60s persistido em `AsyncStorage`, compartilhado entre as duas telas — sem isso, voltar de uma tela para a outra reiniciava a contagem e permitia acionar a Edge Function sem limite                                                                          |
| [email-login.tsx](<src/app/(auth)/email-login.tsx>)         | `Email not confirmed` reenvia o código e navega para `/confirm-email` — sem isso, quem fecha o app antes de confirmar não tinha volta                                                                                                                                    |
| `src/i18n/messages/{pt-BR,en,es}.ts`                        | chaves novas nos três — os 247 testes, inclusive o de completude, passaram                                                                                                                                                                                               |
| [config.toml](supabase/config.toml)                         | `request-password-reset` registrada (`verify_jwt = false`)                                                                                                                                                                                                               |

Ainda pendentes desta lista original: `src/features/legal/data/{pt-BR,en,es}.ts`
(§11.4, a política de privacidade) e `.env.example`/README/`AGENTS.md` (§14) —
não fazem parte do fluxo funcional, ficam para o fechamento do plano.

### 11.2. Arquivos novos — implementados em 19/09/2026

- `src/app/(auth)/confirm-email.tsx` — tela de código da confirmação
- `src/app/(auth)/reset-password.tsx` — tela de código da recuperação (step 1)
- `src/app/auth/new-password.tsx` — tela de nova senha (step 2), **fora** dos
  grupos protegidos, pelo §2.2
- `src/features/auth/verification-code.ts` — validação de formato, pura e
  testável, **parametrizada pelo tamanho** escolhido em §7.4
- `src/features/auth/code-field.tsx` — as caixas de dígito, reutilizadas nas
  duas telas de código (confirmação e recuperação)
- `supabase/functions/request-password-reset/index.ts` — decidida em §3/§5.4,
  com o desenho mais simples: `GET /admin/users?filter=` + `getUserById` para
  identificar sem tocar no cooldown de envio (ver §3 sobre o bug do
  `generateLink`, corrigido no mesmo dia), `resetPasswordForEmail` nativo
  quando elegível, resposta e tempo constantes. `verify_jwt = false` — quem
  chama ainda não tem sessão

**Não implementado, por decisão consciente, não por esquecimento:**
`src/features/auth/pending-email.ts` (persistência do endereço pendente entre
fechamentos do app, F8 do plano) ficou de fora desta rodada — o caso mais
importante que ela resolveria (tentar logar sem ter confirmado) já foi coberto
de outro jeito, pelo fix em `email-login.tsx`. Fica como melhoria futura, não
como pendência bloqueante.

**[R]** As telas de código reaproveitam o mesmo `CodeField`, com textos e ação
diferentes. Ele fica em `src/features/auth/` enquanto servir só à autenticação.

### 11.3. O que não muda

**Nenhuma migration. Nenhuma tabela. Nenhuma função no Postgres. Nenhuma policy
de RLS.** Este escopo não toca o banco, e `supabase/tests/*.sql` não ganha caso
novo — o workflow `database.yml` será acionado pela mudança no `config.toml` e
passará sem alteração. **Atualização de 19/09/2026:** a frase original dizia
também "nenhuma Edge Function" — isso deixou de valer com a decisão do §3/§5.4;
`request-password-reset` é a única exceção, e `npm run functions:check` passa a
cobrir duas funções, não uma.

### 11.4. Política de privacidade — concluída em 19/09/2026

**[F]** A política afirmava, nos três idiomas, que o Supabase "é também o
serviço que envia as mensagens de confirmação de cadastro e de redefinição de
senha". Com o Resend no caminho, essa frase estava errada — corrigida.

O que aconteceu, junto e não depois:

1. §7 ganhou o **Resend** como operador, numa linha, sem nome técnico: "SMTP" e
   "GoTrue" ficam fora de texto voltado ao usuário.
2. **[F]** Região de processamento do Resend, pesquisada antes de escrever
   qualquer coisa: dados de conta, metadados e logs do Resend ficam nos
   **Estados Unidos**, independentemente da região escolhida para o envio —
   o mesmo país já citado em §6 para o Supabase, então a frase de §6 ganhou uma
   sentença sobre o Resend, sem mudar de conclusão.
3. A frase sobre o Supabase enviar os e-mails foi corrigida — quem envia agora é
   o Resend, o Supabase orquestra.
4. `version` subiu de `1.1` para `1.2` no pt-BR, `sourceVersion` acompanhou em
   `en` e `es` — [legal-version.test.ts](src/features/legal/tests/legal-version.test.ts)
   confirma que bateram.
5. `npm run site` regerado.

**[F]** A frase "se você criar uma conta e nunca confirmar o e-mail, o cadastro
permanece registrado" seguiu fiel — a confirmação passou a ser exigida
(Fase 6), mas a conta não confirmada continua existindo, sem dados de viagem,
até ser concluída ou removida.

---

## 12. Plano de testes

### 12.1. Funcionais

| #   | Caso                                             | Critério de aceite                                                 |
| --- | ------------------------------------------------ | ------------------------------------------------------------------ |
| F1  | cadastro com e-mail novo                         | conta criada, código chega em menos de 60 s, tela de código aberta |
| F2  | confirmação com código correto                   | sessão criada, app vai ao onboarding                               |
| F3  | código errado                                    | erro no campo, sem sessão, campo continua utilizável               |
| F4  | código expirado                                  | erro específico + reenvio disponível                               |
| F5  | código reutilizado                               | recusado                                                           |
| F6  | reenvio                                          | novo código chega; **[H]** confirmar se o anterior é invalidado    |
| F7  | login sem confirmar                              | recusado, com caminho para confirmar                               |
| F8  | fechar e reabrir no meio                         | o endereço pendente sobrevive                                      |
| F9  | recuperação em conta válida                      | código chega, senha redefinida, entra                              |
| F10 | login com a senha nova                           | sucesso                                                            |
| F11 | login com a senha antiga                         | recusado                                                           |
| F12 | login Google e Apple                             | inalterados, nenhum e-mail enviado                                 |
| F13 | conta OAuth existente que se cadastra por e-mail | comportamento coerente com a decisão do §5.2                       |

### 12.2. Segurança

| #   | Caso                                   | Critério de aceite                                                                    |
| --- | -------------------------------------- | ------------------------------------------------------------------------------------- |
| S1  | recuperação para e-mail inexistente    | resposta idêntica ao caso válido; **nenhum envio no log do Resend**                   |
| S2  | **recuperação em conta só-OAuth**      | protocolo completo em §12.6 — é o teste que decide §5.4                               |
| S3  | diferença de tempo                     | N ≥ 30 amostras de cada caso; a diferença mediana não deve permitir separar os grupos |
| S4  | enumeração pelo `/signup`              | comportamento efetivo documentado conforme a decisão tomada                           |
| S5  | rate limit #2 estourado                | 429, mensagem neutra, sem revelar contagem                                            |
| S6  | rate limit #5 estourado                | 429; força bruta interrompida                                                         |
| S7  | `auth.users` pelo cliente              | inacessível — regressão                                                               |
| S8  | segredo no bundle                      | `grep` por `RESEND` e pela chave: zero ocorrência                                     |
| S9  | Service Role                           | ausente de todo `src/`                                                                |
| S10 | redirect manipulado                    | sem efeito: os e-mails não carregam `redirect_to`                                     |
| S11 | nova senha sem código válido           | a rota não é alcançável sem o estado de recuperação                                   |
| S12 | rotas protegidas durante a recuperação | a sessão de recuperação não dá acesso a `(app)` antes da senha nova                   |

### 12.3. Rate limiting

| #   | Cenário                                           | Esperado                                                 |
| --- | ------------------------------------------------- | -------------------------------------------------------- |
| R1  | 2 pedidos de recuperação em menos de 60 s         | o segundo é recusado pela janela por usuário             |
| R2  | 25 pedidos em 5 min, mesmo IP, e-mails diferentes | bloqueio pelo limite #2                                  |
| R3  | mesmo e-mail, IPs diferentes                      | o limite por usuário continua valendo                    |
| R4  | e-mails diferentes, mesmo IP                      | o limite por IP continua valendo                         |
| R5  | 20 códigos errados seguidos                       | bloqueio pelo #5                                         |
| R6  | código expirado depois do limite                  | erro coerente, sem vazar estado                          |
| R7  | tentativa após bloqueio                           | continua bloqueado até a janela virar                    |
| R8  | **10 pedidos simultâneos, mesmo e-mail**          | **no máximo um e-mail enviado** — condição de corrida    |
| R9  | contagem regressiva do cliente burlada            | o servidor recusa mesmo assim                            |
| R10 | volume até o limite #1                            | envios param no teto do projeto, antes da cota do Resend |

**[R]** R1–R7 e R10 exigem ambiente de teste separado do de desenvolvimento:
estourar limite de propósito derruba o envio para todo mundo naquele projeto pela
janela inteira.

### 12.4. Aparelho físico — validação obrigatória do código nativo

**O código nativo precisa ser validado em aparelho físico antes de a alternativa
B virar decisão.** Rodar só no simulador não prova nada sobre o que este plano
afirma: a fragilidade do link e a robustez do código são afirmações sobre
aparelhos reais, com apps de e-mail reais, em redes reais. Enquanto D1–D10 não
tiverem sido feitos, §6.5 continua sendo **[R]**, não decisão.

| #   | Caso                                                              | Critério de aceite                                                                    |
| --- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| D1  | iPhone físico, Expo Go, cadastro completo com código              | confirma e entra, sem passar pelo navegador                                           |
| D2  | Android físico, Expo Go, cadastro completo com código             | idem                                                                                  |
| D3  | iPhone físico, recuperação completa com código                    | redefine e entra                                                                      |
| D4  | Android físico, recuperação completa com código                   | idem                                                                                  |
| D5  | e-mail lido no Gmail do próprio aparelho, código copiado e colado | funciona sem sair do fluxo                                                            |
| D6  | e-mail lido em outro aparelho, código digitado à mão              | funciona — é a vantagem central sobre o link                                          |
| D7  | preenchimento automático do código pelo teclado do iOS            | oferecido; se não for, `autoComplete` precisa ser revisto                             |
| D8  | app em segundo plano enquanto a pessoa abre o e-mail, e volta     | o estado da tela e o endereço pendente sobrevivem                                     |
| D9  | aparelho Android modesto                                          | a tela responde sem travar; sem animação por dígito                                   |
| D10 | comparação com link, na mesma sessão de teste                     | registra o que de fato acontece ao tocar no link no Expo Go — é o dado que fecha §6.5 |

**[R]** Anotar o resultado de D1–D10 neste documento, com aparelho, versão de
sistema e data. Sem esse registro, a decisão de §16.1 fica sem base escrita e
alguém vai refazer o teste daqui a três meses.

### 12.5. Integração e interface

Supabase Auth, SMTP do Resend, Expo Router nas telas novas, deep link do OAuth
**inalterado** (regressão), Gmail, Outlook e Apple Mail, ambientes de dev e
produção separados. **Atualizado em 19/09/2026:** a API do Resend e a Edge
Function `request-password-reset` **entram** no escopo de teste — a confirmação
de cadastro continua sem nenhuma das duas.

Interface: loading, erro, sucesso, reenvio com contagem, **font scaling até
200%**, tela pequena, teclado aberto sobre o campo de código, leitor de tela
anunciando campo e erro, e-mail longo sem quebrar o cabeçalho, e-mail com espaço
acidental, os três idiomas.

**[R]** Quando a tela se reorganizar sozinha (sucesso, transição), a mudança é
animada e encadeada em tempos separados, nunca instantânea — a mesma regra que o
resto do app segue.

### 12.6. Protocolo de investigação — recuperação em conta OAuth

Este item decide §5.4 e §6.2. **Parcialmente resolvido em 19/09/2026** — o fato
central já foi medido; o que falta é só completar o fluxo até o fim.

**Restrição descoberta na preparação:** o plano original previa usar aliases
`+` do Gmail para simular 4 contas diferentes sob o remetente sandbox
`onboarding@resend.dev`. Isso **não funciona** — o Resend rejeita com
`Error sending confirmation email` (500) qualquer destinatário que não seja o
endereço **exato** da conta do Resend; um alias `+conta1` já conta como um
endereço diferente para essa checagem, mesmo caindo na mesma caixa do Gmail.
Sem domínio verificado, só é possível testar contra **um único endereço**: o da
própria conta do Resend (`allangomes826@gmail.com`). Isso limita o protocolo a
testar os estados que essa conta específica já tem ou pode assumir, em vez de 4
contas paralelas.

**Resultado do teste com o endereço real:**

Uma tentativa de `signUp` com `allangomes826@gmail.com` devolveu
`identities: []` sem erro — o mesmo padrão que o código do app já trata como
"e-mail já cadastrado" ([auth-service.ts:183](src/features/auth/auth-service.ts#L183)).
Ou seja, **essa conta já existia** no projeto, de testes anteriores. Consulta ao
painel confirmou: identidade **só Google**, nunca teve senha — exatamente o
caso 2 do protocolo original, já pronto sem precisar ser criado.

Chamado `resetPasswordForEmail('allangomes826@gmail.com')` nessa conta:

| O que foi observado                    | Resultado **[F]**                                                                                              |
| -------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `resetPasswordForEmail` devolveu erro? | não — resposta idêntica à de um e-mail comum, como a documentação promete                                      |
| saiu e-mail?                           | **sim** — chegou de fato na caixa de entrada, remetente `onboarding@resend.dev`, assunto "Reset your password" |
| Auth Logs do painel                    | não deu para conferir — "Write audit logs to the database" está desligado no projeto                           |
| tempo de resposta                      | não medido com rigor estatístico ainda (pendente para S3)                                                      |

**Achado central, agora [F]: o Supabase envia o e-mail de recuperação para uma
conta só-OAuth exatamente como enviaria para uma conta com senha. Não há
filtro nativo por provedor no `/recover`.** Isso confirma a suspeita levantada
em §4.4 e fecha a primeira metade da investigação. A pergunta que resta — e que
ainda depende de completar o fluxo — é se `verifyOtp` + `updateUser({password})`
de fato funcionam nessa conta e a transformam em "Google + senha", ou se falham
em algum ponto no meio (o pior cenário, que gasta envio e frustra sem entregar
nada).

**[D] Decisão tomada em 19/09/2026: não completar o fluxo nessa conta.** A conta
usada é a conta pessoal e real do usuário, e terminar o reset criaria de fato uma
senha nela. O usuário optou por **intervir** em vez de aceitar o comportamento
nativo — decisão registrada em §3, §5.4 e §16.6, que já assume o pior caso sem
precisar completar o teste até o fim nessa conta específica.

**Casos 1, 3 e 4 do protocolo original: fechados por ora, sem condição de teste
confiável.**

- **Caso 4 (Google + senha):** descartado por decisão — é exatamente a ação que
  o usuário optou por não fazer na conta real, e não há outra conta disponível
  para tentar sem domínio.
- **Casos 1 (só e-mail/senha) e 3 (só Apple):** exigiriam um endereço diferente
  de `allangomes826@gmail.com` para não colidir com a identidade Google já
  existente — mas o sandbox `onboarding@resend.dev` só entrega para esse
  endereço exato (confirmado no teste do alias, mais acima). Um teste com outro
  endereço não teria como confirmar entrega real de e-mail; o resultado não
  seria confiável, então não foi tentado. **[D]** Só ficam disponíveis quando
  houver domínio verificado no Resend (§7.1).

**Conclusão prática do §12.6 para efeitos de decisão:** o achado que importava —
se o Supabase filtra por provedor — já está confirmado (não filtra) e já gerou
uma decisão (intervir, §5.4). Os casos restantes são refinamento, não mudam essa
decisão; ficam registrados como pendência de teste, não como bloqueio.

**Checklist do que já foi observado no fluxo nativo (não será completado nessa
conta — a validação segue na Fase 4B, contra a Edge Function nova):**

| O que observar                                      | Onde se vê                        | Status                                              |
| --------------------------------------------------- | --------------------------------- | --------------------------------------------------- |
| `resetPasswordForEmail` devolveu erro?              | resposta do cliente               | **[F]** não                                         |
| saiu e-mail?                                        | log de entrega do Resend          | **[F]** sim                                         |
| o GoTrue registrou tentativa de recuperação?        | logs de Auth do painel            | não verificável — audit log desligado neste projeto |
| o código/link chegou e foi aceito pelo `verifyOtp`? | fluxo manual                      | pendente                                            |
| `updateUser({ password })` funcionou depois?        | fluxo manual                      | pendente                                            |
| a conta passou a ter identidade de e-mail?          | `identities` do usuário no painel | pendente                                            |
| `getAccountProvider` mudou de resultado?            | app, tela de perfil               | pendente                                            |
| o login pelo Google continuou funcionando?          | fluxo manual                      | pendente                                            |
| tempo de resposta                                   | medição, junto com S1 e S3        | uma amostra: ~2,2 s                                 |

**O que a resposta determina:**

- se o e-mail **não** sai para conta só-OAuth, não há nada a decidir: o
  comportamento nativo já faz o que se queria, e §5.4 se encerra;
- se sai e o fluxo completa, adicionando senha à conta, a decisão do §16.6 fica
  entre aceitar (recomendado) e intervir — sabendo o custo real do §5.4;
- se sai mas o fluxo falha no meio, é o pior caso: gasta envio e frustra. Aí a
  intervenção passa a ter justificativa de produto, além de segurança, e vale
  reabrir a comparação do §4.1.

**[R]** A conclusão **não** vale para sempre: é comportamento de fornecedor, e
deve ser reconferida se o GoTrue mudar de versão. Por isso ela fica aqui, com
data, e não vira regra no `AGENTS.md` (§14).

### 12.7. Testes automatizados

**[F]** `npm test` roda `src/**/*.test.ts` no Node, sem mocks de rede. Cabem ali:
formato do código, `normalizeEmail` em todos os caminhos, mapeamento dos erros
novos em `toAuthMessage`, completude dos três dicionários (já automática) e
versão dos documentos legais (já automática). O resto é manual por natureza —
envolve caixa de entrada real.

---

## 13. Fases

Ordem das dependências: 0 → 1 → 2 → (3 ‖ 7) → 4 → 4B → 5 → 6 → 8.

### Fase 0 — Investigar antes de escrever qualquer código

**Objetivo:** derrubar as hipóteses que mudam o desenho.
**Arquivos:** nenhum.
**O que fazer:** auditar o painel remoto (confirmação, rate limits, expiração e
tamanho do OTP, SMTP); rodar o protocolo do §12.6; testar a hipótese (c) do §9.3;
confirmar os limites da conta do Resend; e rodar D1–D10 do §12.4 num protótipo
descartável, para validar o código em aparelho físico **antes** de a alternativa
B virar decisão.
**Conclusão:** cada **[H]** deste documento vira **[F]** ou é descartada, com o
resultado anotado aqui.
**Risco:** baixo — nada é alterado.
**Rollback:** não se aplica.

**Status: fase encerrada em 19/09/2026.** Configuração de painel concluída,
achado central do §12.6 confirmado e decisão tomada, idioma decidido. O que
resta (domínio próprio, a Edge Function da Fase 4B, os testes de aparelho em
D1–D10) já está migrado para as fases seguintes do §13, não é mais trabalho de
investigação.

Feito por duas rodadas de auditoria de leitura (`supabase config diff` e
`supabase config pull --dry-run`, sem escrita em nenhum arquivo nem no painel
em nenhuma das duas):

- **[F]** `enable_confirmations = true` no remoto. Gerou um alerta de possível
  usuário preso na confirmação — **investigado pelo usuário nos logs de Auth e
  descartado: ninguém está preso** (§2.2).
- **[F]** `otp_length`: estava em 8 no remoto; **decidido e aplicado — 6**
  (§7.4, §16.2). `config.toml` já nasceu com 6, sem precisar de mudança.
- **[F]** `otp_expiry`: **aplicado — 600 s**, confirmado pela segunda auditoria.
  `config.toml` atualizado para espelhar (§7.4, §16.3).
- **[F]** `token_verifications`: **aplicado — 15**, confirmado pela segunda
  auditoria. `config.toml` atualizado para espelhar (§8.4, #5).
- **[F]** `email_sent`: o usuário aplicou 10/h no painel; a CLI não compara esse
  campo (fica em `unmanaged`), então não há confirmação automática — só o
  registro de que foi feito. `config.toml` atualizado para 10 (§8.4).
- **[F]** `sign_in_sign_ups`, `token_refresh`, `sms_sent` e `web3` no remoto já
  batem com os valores declarados no `config.toml` local — mantidos como estão.
- **[F]** `max_frequency` no remoto é `1m` (a janela de 60 s por usuário do
  §5.1, já efetiva).
- **[F]** SMTP customizado **está habilitado**: `host = smtp.resend.com`,
  `port = 465`, `user = resend`, `sender_name = TripReady`. Adiantou parte da
  fase 2 antes da hora, o que é seguro — a fase só existe para isolar a
  investigação, não para bloquear o painel.
- **[F] Esclarecido:** não existe domínio comprado ainda. `tripready.app` e
  `app.com` que apareceram no meio do processo eram valores de exemplo sem
  registro real por trás — `identity.ts` foi revertido para os marcadores
  originais. O `admin_email` do SMTP foi trocado para **`onboarding@resend.dev`**,
  o remetente de sandbox do Resend, que não exige domínio e entrega para o
  e-mail da própria conta do Resend — suficiente para todos os testes
  funcionais deste plano. Domínio próprio continua bloqueando só a fase 1 de
  verdade (produção), não o resto (§7.1).
- **[F]** Conta do Resend já existe, plano free: **100 e-mails/dia, 3.000/mês**
  (§7.1). Usado para recalcular a recomendação do limite #1 (§8.4).
- **[F]** Google já está habilitado e configurado no remoto (`client_id`
  presente); Apple aparece com segredo mascarado, presença não confirmada de
  outro modo.
- **[F]** iPhone físico disponível para D1, D3, D5–D8, D10 do §12.4; sem
  Android no momento — D2, D4, D9 ficam sem cobertura por ora.
- **[F]** Protocolo do §12.6 rodado contra a única conta disponível sob o
  sandbox — achado central confirmado (Supabase não filtra por provedor),
  decisão tomada (intervir, Edge Function nova). Casos 1, 3 e 4 do protocolo
  original ficaram sem teste confiável possível sem domínio verificado.
- **[F]** Idioma dos e-mails: **decidido, só pt-BR por enquanto** (§9.3). A
  hipótese (c) — condicional por idioma no template — não foi testada; a
  decisão foi direto pela opção mais simples.
- **[F]** Testes D1–D10 em aparelho físico (§12.4): o usuário vai executá-los
  por conta própria, fora desta sessão.

**Fase 0 considerada encerrada em 19/09/2026**, com as pendências que restam
(domínio próprio, Fase 4B, telas) já migradas para as fases seguintes do §13.

### Fase 1 — Domínio e DNS ⚠ bloqueante

**Objetivo:** ter um remetente verificado.
**Dependências:** o domínio precisa existir. `LEGAL_IDENTITY.website` ainda é
`{{DOMINIO}}`, e é a mesma decisão.
**Conclusão:** domínio verificado no Resend, SPF e DKIM propagados, DMARC em
`p=none`, e-mail de teste entregue.
**Risco:** propagação de DNS pode levar horas.
**Rollback:** remover o domínio do Resend.

### Fase 2 — SMTP ligado, sem mudança de fluxo

**Objetivo:** provar que o Supabase envia pelo Resend, com o produto ainda no
comportamento atual.
**Arquivos:** painel do Supabase; [config.toml](supabase/config.toml).
**Conclusão:** um "esqueci minha senha" na tela atual gera envio visível no log do
Resend.
**Risco:** baixo — o fluxo atual não muda.
**Rollback:** desligar o SMTP personalizado.
**Por que é separada:** isola a integração de transporte de toda mudança de
produto. Se um e-mail não chegar depois, esta fase já está descartada como
suspeita.

### Fase 3 — Templates com código

**Objetivo:** o e-mail passa a trazer o código.
**Arquivos novos:** `supabase/templates/confirmacao.html`,
`supabase/templates/recuperacao.html`.
**Dependências:** fases 1 e 2; decisão de idioma (§9.3) e de tamanho do OTP
(§7.4).
**Conclusão:** e-mail legível em Gmail, Outlook e Apple Mail, com código visível e
nenhum link.
**Rollback:** restaurar os templates padrão.

### Fase 4 — Limites e expiração

**Objetivo:** aplicar §8.4 e §7.4.
**Arquivos:** painel e Management API; `[auth.rate_limit]`, `otp_expiry` e
`otp_length` no `config.toml`.
**Testes:** R1–R10, em ambiente separado.
**Risco:** médio — apertar demais trava usuário legítimo. Por isso vem antes do
produto novo, com tempo de observação.
**Rollback:** imediato, é configuração.

### Fase 4B — Edge Function de recuperação de senha

**Objetivo:** implementar `request-password-reset` (§3, §4.2, §11.2) — decisão
tomada em 19/09/2026, não fazia parte do desenho original.
**Arquivos novos:** `supabase/functions/request-password-reset/index.ts` e seu
template de e-mail embutido.
**Dependências:** fase 1 (domínio, para o `from` real) e fase 4 (limites já
ajustados). Pode ser testada com o sandbox `onboarding@resend.dev` antes de
haver domínio, do mesmo jeito que o restante deste plano.
**Conclusão:** S1–S3 e R8 passando contra a função (não mais contra o
`/recover` direto); tempo de resposta idêntico para e-mail elegível, inelegível
e inexistente, medido com amostras reais, não só lido no código.
**Risco:** alto — é a única peça deste plano que reintroduz o desenho de "função
decide o que responder", que o resto do plano evita de propósito. Um erro aqui
recria exatamente a enumeração que o `/recover` nativo já resolvia sozinho.
**Rollback:** a tela de recuperação volta a chamar `resetPasswordForEmail`
direto, aceitando o comportamento nativo — reversível a qualquer momento, é
troca de uma chamada.
**Decisões que precisam de aprovação:** o desenho exato da resposta
constante-no-tempo (dormir até um piso fixo? processar sempre os dois ramos?).

### Fase 5 — Telas de código

**Objetivo:** confirmação e recuperação funcionando no app.
**Arquivos:** §11.1 e §11.2, incluindo a mudança em `_layout.tsx`. A tela de
recuperação chama `request-password-reset` (fase 4B), não mais
`resetPasswordForEmail` direto.
**Dependências:** fases 3, 4 e 4B.
**Conclusão:** F1–F13 e D1–D9 passando; `npm check` e `npm run functions:check`
verdes (duas funções agora); deep link do OAuth intacto.
**Risco:** alto — mexer na proteção de rotas atinge todo mundo, não só quem usa
e-mail.
**Rollback:** reverter o commit; os e-mails continuam saindo pelo Resend, sem as
telas.
**[R]** A alteração do `_layout.tsx` é feita e verificada isoladamente antes de as
telas entrarem.

### Fase 6 — Ligar a confirmação de e-mail

**Objetivo:** `enable_confirmations = true` em produção.
**Dependências:** fase 5 completa, sem exceção. Ligar antes deixa quem se cadastra
sem caminho para confirmar.
**Risco:** alto e irreversível na prática — muda o comportamento de contas
existentes não confirmadas. **[H]** O efeito sobre elas precisa ser conferido na
fase 0.
**Rollback:** desligar volta o cadastro ao normal, mas quem já ficou pendente
segue pendente.

**Status: concluída.** Já estava `true` no painel remoto desde a Fase 0 —
`config.toml` só não espelhava (corrigido em 19/09/2026, junto com
`max_frequency`, também desatualizado localmente). O efeito sobre contas
existentes não confirmadas foi investigado pelo usuário nos logs de Auth e
descartado (§2.2): ninguém ficou preso.

### Fase 7 — Política de privacidade e site

**Objetivo:** o texto legal voltar a descrever a realidade.
**Arquivos:** os três `legal/data/*.ts`; `npm run site`.
**Dependências:** fase 2 — a partir dali o Resend já está no caminho.
**Conclusão:** `npm check` verde, incluindo o teste de versão; `site/` regerado.
**[R]** Na prática acompanha a fase 2, não a sucede.

**Status: concluída em 19/09/2026.** A frase que atribuía o envio dos e-mails
só ao Supabase foi corrigida, e o **Resend** entrou em §7 como operador, numa
linha, sem nome técnico. Região de processamento do Resend confirmada por
pesquisa antes de escrever qualquer coisa (não presumida): dados de conta,
metadados e logs ficam nos Estados Unidos independentemente da região de envio
escolhida — o mesmo país já citado em §6 para o Supabase, então a frase de §6
só ganhou uma sentença, não mudou de conclusão. `version` subiu de `1.1` para
`1.2` no pt-BR, `en` e `es` acompanharam (`version` e `sourceVersion`),
`npm run site` regerado, os 248 testes passam.

### Fase 8 — Documentação e observabilidade

**Objetivo:** §14.
**Conclusão:** `AGENTS.md`, README e `.env.example` atualizados; conferência de
entrega definida; este documento removido de `tasks/` quando não restar pendência.

**Status: concluída em 19/09/2026.** `AGENTS.md` ganhou a seção "Autenticação",
separando o que é regra (nunca revelar existência de conta, segredo nunca no
app, rate limit é do servidor, checagem de identidade não pode passar por
endpoint que arma envio) do que é decisão registrada com data e motivo (código
em vez de link, a Edge Function de recuperação, os valores de rate limit,
idioma dos e-mails). O README ganhou o deploy de `request-password-reset`
junto com `delete-account`, um passo novo para configurar SMTP/confirmação no
painel, e a nota de que Redirect URLs não vale para os e-mails (usam código).
O `.env.example` ganhou a advertência sobre `RESEND_SMTP_PASSWORD` e o
Management API token não serem variáveis do app.

**Ainda não é o fechamento deste documento** — a Fase 1 (domínio) segue
bloqueada, sem decisão de nome ainda, e os itens do §15/§16 que dependem dela
(calibrar `MIN_RESPONSE_MS`, decidir o risco #14 do rate limit por IP) também
seguem em aberto. Este arquivo continua em `tasks/` até a Fase 1 acontecer.

---

## 14. Documentação

**`AGENTS.md`** ganha uma seção de autenticação. A redação precisa distinguir o
que é decisão firme do que ainda é hipótese: o arquivo é lido como regra, e uma
hipótese escrita em forma de regra vira fato falso na cabeça de quem ler depois.
Só entra ali o que já passou pela fase 0 e pela aprovação — o resto fica neste
documento, marcado como **[H]**, que é o lugar de coisa não resolvida.

Entram como **regra**, porque já são verdade hoje:

- segredo nunca vai para o app; `EXPO_PUBLIC_*` é, por definição, público;
- Service Role só no runtime de Edge Function;
- a recuperação de senha não revela a existência de conta, e a proteção é nativa
  do `/recover` — **não construir consulta prévia**;
- o `/signup` tem um vazamento deliberado, com o motivo (§5.2), para que ninguém o
  "corrija" sem saber;
- conta com senha e conta OAuth são distinguidas por `getAccountProvider`, nunca
  por presunção a partir do e-mail;
- rate limiting é do servidor, e o limite nativo é a primeira opção; o cliente só
  espelha;
- texto de e-mail é exceção à regra do `t()`, porque mora no Supabase;
- `config.toml` não governa o projeto remoto — os dois são mantidos em par.

Entram como **decisão registrada, com a data e o motivo**, não como lei natural:

- confirmação e recuperação por código em vez de link, pelo comportamento do Expo
  Go medido em §12.4;
- valores de limite, expiração e tamanho do OTP, que são parâmetros e mudam;
- o idioma dos e-mails;
- a recuperação de senha passa por uma Edge Function que decide se envia,
  porque o `/recover` nativo não filtra por provedor (medido em 19/09/2026,
  §12.6) e o produto decidiu não aceitar esse comportamento — decisão de
  produto, não limitação técnica descoberta depois.

**Não entra enquanto for [H]:** o comportamento da recuperação em conta OAuth, a
possibilidade de condicional no template, e qualquer afirmação sobre invalidação
de código anterior no reenvio.

**README:** os passos 5 e 6 ganham o SMTP do Resend e a configuração de
confirmação; a lista de Redirect URLs ganha a nota de que os e-mails deixaram de
usá-la.

**`.env.example`:** comentário sobre `RESEND_SMTP_PASSWORD` deixando claro que não
é variável do app e que não deve ser posta ali.

**`tasks/`:** este documento sai da pasta quando as pendências fecharem. Não criar
`docs/`. A configuração de DNS e do Resend é procedimento operacional e vai para o
README.

---

## 15. Riscos

| #   | Risco                                                                                                                                                                                                   | Prob.              | Impacto         | Mitigação                                                                                                                        |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------ | --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 1   | força bruta do OTP                                                                                                                                                                                      | baixa              | alto            | expiração curta, `/verify` apertado, tamanho do OTP (§7.4)                                                                       |
| 2   | a mudança no `_layout.tsx` quebra navegação de quem não usa e-mail                                                                                                                                      | média              | alto            | fase isolada, regressão de OAuth                                                                                                 |
| 3   | `config.toml` e painel divergem em silêncio                                                                                                                                                             | alta               | médio           | comentários + checagem automática (§8.5)                                                                                         |
| 4   | confirmação ligada antes das telas                                                                                                                                                                      | baixa              | alto            | ordem das fases, sem atalho                                                                                                      |
| 5   | e-mail cai em spam                                                                                                                                                                                      | média              | alto            | SPF, DKIM, DMARC, subdomínio, sem imagem remota                                                                                  |
| 6   | recuperação funciona em conta OAuth-only                                                                                                                                                                | **[F] confirmado** | resolvido       | intervenção decidida — Edge Function própria (§3, §5.4)                                                                          |
| 7   | usuário perde o e-mail pendente ao fechar o app                                                                                                                                                         | média              | médio           | persistência local                                                                                                               |
| 8   | limite apertado trava usuário legítimo                                                                                                                                                                  | média              | médio           | fase 4 antes do produto, com observação                                                                                          |
| 9   | e-mail em português para usuário en/es                                                                                                                                                                  | alta, se (a)       | baixo           | §9.3                                                                                                                             |
| 10  | política de privacidade desatualizada em produção                                                                                                                                                       | média              | alto (jurídico) | fase 7 junto da fase 2                                                                                                           |
| 11  | cota do Resend exaurida                                                                                                                                                                                 | baixa              | alto            | limite #1 abaixo do teto do plano                                                                                                |
| 12  | hipótese deste plano tratada como fato na implementação                                                                                                                                                 | média              | alto            | a legenda, a fase 0 e a regra de redação do §14                                                                                  |
| 13  | a Edge Function de recuperação vira um oráculo de tempo, se a checagem de identidade e o envio não levarem o mesmo tempo nos dois casos                                                                 | média              | alto            | resposta e tempo idênticos independente do resultado interno (`MIN_RESPONSE_MS`, ainda não calibrado — teste S3), testado por S3 |
| 14  | a chamada ao `resetPasswordForEmail` de dentro da Edge Function chega ao GoTrue com o IP da infraestrutura do Supabase, não o de quem pediu — o rate limit nativo por IP deixa de proteger este caminho | média              | médio           | janela de 60s por usuário continua valendo; limite por IP próprio fica para antes de produção com tráfego real                   |

---

## 16. Decisões pendentes

1. **Código em vez de link**, nos dois e-mails, aceitando a limitação de entropia
   do §6.5 — condicionado ao resultado de D1–D10.
2. ~~**Tamanho do OTP**~~ — **decidido e aplicado em 19/09/2026: 6 dígitos** (§7.4).
3. ~~**Expiração do OTP**~~ — **decidido e aplicado em 19/09/2026: 600 s** (§7.4).
4. **Domínio próprio: decisão explícita em 19/09/2026 de adiar.** Seguir com o
   sandbox do Resend (`onboarding@resend.dev`) por todo o desenvolvimento, e só
   comprar/verificar um domínio quando for de fato para produção. **Isso não é
   "usar o Resend em vez de domínio" — é usar o modo de teste do Resend**: a
   restrição de só entregar ao e-mail da própria conta do Resend continua valendo
   para sempre, enquanto não houver domínio, e nenhuma configuração contorna
   isso — não é possível abrir para outros usuários sem domínio verificado, ponto.
   **O que já está preparado para a troca**, quando o dia chegar: o remetente é
   um único campo no painel do Supabase (Auth → SMTP), usado tanto pela
   confirmação quanto pela recuperação (§8.2); `LEGAL_IDENTITY.website` é um
   único campo em `identity.ts`. Trocar de sandbox para domínio real é
   configuração, não código novo.
5. ~~**Idioma dos e-mails**~~ — **decidido em 19/09/2026: só pt-BR por enquanto**
   (§9.3, opção a). A hipótese do condicional por idioma (opção c) não foi
   testada, por escolha direta pela opção mais simples.
6. ~~**Recuperação em conta OAuth-only**~~ — **decidido em 19/09/2026:
   intervir.** O Supabase envia o e-mail sem filtrar por provedor (§5.4, §12.6),
   e o usuário decidiu não aceitar esse comportamento — risco de confusão e de
   "bugs" numa conta Google/Apple que ganha senha sem ter sido pedido. Isso
   passou a exigir uma Edge Function nova (`request-password-reset`, §3, §4.2,
   §11.2), porque um filtro na frente do fluxo nativo sem assumir o envio
   inteiro reabriria o oráculo de enumeração do §5.3. Os casos 1, 3 e 4 do
   protocolo original ficaram sem teste confiável possível no sandbox atual
   (§12.6) — sem efeito sobre esta decisão, que já assume o pior caso. A
   validação segue na Fase 4B, contra a função nova, não mais contra o
   `/recover` direto.
7. **O vazamento de enumeração no `/signup`** (§5.2): manter ou fechar.
8. ~~**`token_verifications`**~~ — **decidido e aplicado em 19/09/2026: 15** (§8.4).
9. ~~**`email_sent` por hora**~~ — **decidido e aplicado em 19/09/2026: 10/h**,
   sobre o teto real do Resend free (100/dia, 3.000/mês); valor temporário até
   o app ser publicado com volume maior (§8.4).
10. ~~**Quando ligar a confirmação de e-mail**~~ — **já estava ligada em
    produção** antes deste plano (achado da fase 0, §2.2); não há mais decisão
    de "quando", só de manter.
11. **Checagem automática dos templates** (§8.5): agora, ou item manual com prazo.
12. **Rate limiting próprio**: confirmar que fica fora do MVP.
13. **Ambiente de teste separado** para a matriz de rate limiting.
14. ~~**Cobertura de Android**~~ — **confirmado em 19/09/2026: sem Android
    disponível.** D2, D4 e D9 do §12.4 ficam sem cobertura de teste; a
    alternativa B (código) é validada só em iOS antes de virar decisão final.
15. **Cuidado a lembrar quando o domínio (item 4) for decidido:** um endereço
    `noreply@` não deveria ser o contato oficial de Termos e Política de
    Privacidade nem o `reply-to` do e-mail de recuperação, que orienta a
    procurar ajuda. Foi o erro que apareceu e foi revertido em 19/09/2026
    (§7.1) — vale conferir de novo quando `LEGAL_IDENTITY.contactEmail` for
    preenchido de verdade.

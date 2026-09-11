# Plano — Exclusão permanente da conta

Feature: um botão **Excluir conta** no fim do Perfil, fora dos cartões, que abre
um modal de confirmação por digitação (`Excluir`), apaga o usuário e todos os
seus dados de forma definitiva, encerra a sessão e devolve a pessoa ao fluxo de
login existente.

Status: **implementado**. O código vale mais que o plano onde os dois
divergirem — o esboço da §3.1 é anterior ao ajuste de idempotência pedido na
aprovação, que está descrito na §7 e implementado em
[supabase/functions/delete-account/index.ts](supabase/functions/delete-account/index.ts).

---

## 1. Ponto de partida — o que já existe

| Peça                      | Onde está                                                                                      | O que faz hoje                                                                   |
| ------------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Tela do Perfil            | [src/app/(app)/profile.tsx](<src/app/(app)/profile.tsx>)                                       | Identidade, `PassportsSection` e um cartão "Conta" com uma única linha, **Sair** |
| Contexto de autenticação  | [auth-context.tsx](src/features/auth/auth-context.tsx)                                         | `session`, `user`, `isLoading`, `signOut`, logins; escuta `onAuthStateChange`    |
| Chamadas ao Supabase Auth | [auth-service.ts](src/features/auth/auth-service.ts)                                           | Google, Apple, e-mail/senha, `signOut`, `getSession`                             |
| Mensagens de erro do Auth | [auth-errors.ts](src/features/auth/auth-errors.ts)                                             | Mapa inglês → português, com passagem direta do que não estiver no mapa          |
| Cliente Supabase          | [client.ts](src/lib/supabase/client.ts)                                                        | Sessão persistida em AsyncStorage, PKCE, auto-refresh em primeiro plano          |
| Proteção de rotas         | [src/app/\_layout.tsx](src/app/_layout.tsx)                                                    | `Stack.Protected` por sessão e por existência de passaporte                      |
| Modais de tela cheia      | `trip-new`, `trip-edit`, `passport-picker`                                                     | Rotas com `presentation: 'modal'` registradas no layout raiz                     |
| Confirmação destrutiva    | `confirmDelete` em [trips/[id].tsx](<src/app/(app)/trips/[id].tsx>)                            | `showDialog` com botão `destructive` — padrão para exclusão **sem digitação**    |
| Diálogo multiplataforma   | [dialog.tsx](src/components/ui/dialog.tsx)                                                     | `Alert` nativo no iOS/Android, `DialogHost` próprio na web                       |
| Campo e botão             | [text-field.tsx](src/components/ui/text-field.tsx), [button.tsx](src/components/ui/button.tsx) | `TextField` com rótulo; `Button` já trata `disabled` e `loading`                 |
| Base de formulário        | [form-layout.tsx](src/components/ui/form-layout.tsx)                                           | Área segura + `KeyboardAvoidingView` + rolagem                                   |
| RPC atômica existente     | [apply_requirement_diff.sql](supabase/migrations/20260906130700_apply_requirement_diff.sql)    | Referência de como o projeto escreve função + `revoke`/`grant`                   |

**Conclusão:** não falta nenhum componente de UI. O trabalho é um modal de
confirmação, um botão no Perfil, um método no serviço de autenticação e **uma
Edge Function** — mais nada no banco.

---

## 2. Banco de dados — mapa dos dados do usuário

### 2.1 O que está ligado a uma pessoa

```
auth.users (id)
│
└── profiles.id ──────────────────────────────── on delete cascade
    │
    ├── passports.user_id ─────────────────────── on delete cascade
    │
    └── trips.user_id ─────────────────────────── on delete cascade
        │
        ├── trip_countries.trip_id ────────────── on delete cascade
        │   ├── trip_cities (trip_id, country_code) ────── on delete cascade
        │   └── trip_requirements (trip_id, country_code) ─ on delete cascade
        │
        ├── trip_cities.trip_id ───────────────── on delete cascade
        └── trip_requirements.trip_id ─────────── on delete cascade
```

| Tabela              | Coluna que liga ao usuário | Aponta para       | Cascade?                             |
| ------------------- | -------------------------- | ----------------- | ------------------------------------ |
| `profiles`          | `id` (PK)                  | `auth.users (id)` | ✅ `on delete cascade`               |
| `passports`         | `user_id`                  | `profiles (id)`   | ✅ `on delete cascade`               |
| `trips`             | `user_id`                  | `profiles (id)`   | ✅ `on delete cascade`               |
| `trip_countries`    | `trip_id`                  | `trips (id)`      | ✅ `on delete cascade`               |
| `trip_cities`       | `trip_id`                  | `trips (id)`      | ✅ `on delete cascade` (FK direta)   |
| `trip_cities`       | `(trip_id, country_code)`  | `trip_countries`  | ✅ `on delete cascade` (FK composta) |
| `trip_requirements` | `trip_id`                  | `trips (id)`      | ✅ `on delete cascade`               |
| `trip_requirements` | `(trip_id, country_code)`  | `trip_countries`  | ✅ `on delete cascade`               |

**Nenhuma relação de dado pessoal está desprotegida.** A cadeia inteira é
`cascade` desde `auth.users`, verificada em
[20260905120000_init_schema.sql](supabase/migrations/20260905120000_init_schema.sql)
e
[20260905120300_trip_cities_trip_fkey.sql](supabase/migrations/20260905120300_trip_cities_trip_fkey.sql).

### 2.2 O que **não** é dado do usuário

`destination_groups`, `destination_group_members`, `requirement_templates`,
`requirement_template_groups`, `requirement_template_countries`, `visa_rules` e
`requirement_offers` são catálogo compartilhado, escrito só por migration e sem
nenhuma coluna de usuário (confirmado por varredura: apenas
`20260905120000_init_schema.sql` e `20260905120100_rls_policies.sql` citam
`user_id`/`auth.uid()`).

As colunas `trip_requirements.template_id` e `trip_requirements.group_id`
apontam **para** o catálogo com `on delete set null` — é o sentido inverso.
Apagar o usuário não encosta em nenhuma linha de catálogo.

### 2.3 Schema `auth`

`auth.identities`, `auth.sessions`, `auth.refresh_tokens` e `auth.mfa_factors`
são cascateados a partir de `auth.users` pelo próprio GoTrue. Nome, e-mail e
foto do provedor moram em `raw_user_meta_data`, na própria linha de
`auth.users`, e somem com ela.

### 2.4 Storage

O projeto não usa Supabase Storage — a foto do perfil é uma URL do Google/Apple
lida de `user_metadata`
([user-profile.ts](src/features/auth/user-profile.ts)). Não há arquivo a apagar.

### 2.5 Migrations necessárias

**Nenhuma.** O cascade já existe e é exatamente o que o requisito pede: um único
`delete from auth.users where id = …` não deixa órfão.

Criar uma função SQL que apague tabela por tabela seria lógica duplicada do que
as foreign keys já garantem — e, pior, uma segunda definição de "todos os dados
do usuário" que envelheceria a cada tabela nova.

### 2.6 Impacto no RLS

**Nenhuma policy muda.** Vale registrar por quê:

- `profiles` **não tem** policy de DELETE nem `grant delete` para
  `authenticated` — decisão deliberada e documentada em
  [20260905120200_table_grants.sql](supabase/migrations/20260905120200_table_grants.sql).
  Ela continua válida: o perfil some em cascata, não por escrita do app.
- Se a exclusão fosse feita pelo cliente, seria preciso abrir DELETE em
  `profiles` para `authenticated` — abrir superfície de escrita no app para
  resolver algo que o servidor resolve melhor. **Mais um motivo para a Edge
  Function.**
- A Edge Function usa `service_role`, que passa por cima do RLS por natureza. A
  proteção ali não é policy, é a **origem do id** (ver §8).

Sobre o risco de um usuário alcançar dados de outro: as policies atuais filtram
tudo por `auth.uid()`, direta (`profiles`, `passports`, `trips`) ou
indiretamente via `is_trip_owner(trip_id)` (`trip_countries`, `trip_cities`,
`trip_requirements`). Não há policy `using (true)` em tabela de usuário, e
`is_trip_owner` é `security definer` com `search_path` vazio. Nada nesta feature
afrouxa isso.

---

## 3. Backend / Supabase — como apagar `auth.users` com segurança

`auth.users` não é exposta pelo PostgREST e não pode ser apagada pelo role
`authenticated`. Só há dois caminhos.

### 3.1 Caminho recomendado — Edge Function `delete-account`

Arquivo novo: `supabase/functions/delete-account/index.ts`.

```ts
import { createClient } from 'jsr:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const authorization = req.headers.get('Authorization');
  if (!authorization) return json({ error: 'unauthorized' }, 401);

  // A chave privilegiada existe apenas aqui, injetada pela plataforma.
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // Quem será apagado sai do token verificado, nunca do corpo da requisição.
  const token = authorization.replace(/^Bearer\s+/i, '');
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return json({ error: 'unauthorized' }, 401);

  const { error: deleteError } = await admin.auth.admin.deleteUser(data.user.id);
  if (deleteError) return json({ error: 'delete_failed' }, 500);

  return json({ ok: true }, 200);
});
```

Pontos que sustentam a segurança:

1. **A função não recebe nenhum id.** O alvo é sempre o dono do token. Não
   existe payload capaz de alcançar outra conta.
2. `verify_jwt` fica ligado (padrão da plataforma), então chamada sem token nem
   chega ao código.
3. `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` são **injetadas pelo runtime**
   das Edge Functions. Não entram no repositório, não entram no `.env` do app e
   não viram `EXPO_PUBLIC_*`. Nada muda em [env.ts](src/lib/env.ts).
4. `admin.auth.admin.deleteUser(id)` faz exclusão **definitiva** (o soft delete
   é opt-in e não será usado). O GoTrue apaga a linha de `auth.users`, o que
   dispara a cascata do §2.1 e invalida sessões e refresh tokens.

Configuração e publicação:

```toml
# supabase/config.toml
[functions.delete-account]
enabled = true
verify_jwt = true
```

```
npx supabase functions deploy delete-account
```

O projeto já está linkado (`supabase/.temp/linked-project.json`), então não há
setup novo. Na publicação, confirmar no painel o nome da variável de chave
privilegiada injetada — o projeto usa o sistema novo de chaves
(`sb_publishable_…`), e se `SUPABASE_SERVICE_ROLE_KEY` não estiver disponível,
cadastrar a secret equivalente (`sb_secret_…`) como secret da função. **Em
nenhuma hipótese essa chave entra no app.**

### 3.2 Caminho alternativo (não recomendado)

Uma função `security definer` no Postgres com
`delete from auth.users where id = auth.uid()`. Funciona e dispensa
infraestrutura nova, mas:

- depende de o role dono da migration manter privilégio de escrita no schema
  `auth`, que é território da plataforma e pode mudar sem aviso;
- contorna o GoTrue, que é quem deveria decidir como um usuário deixa de
  existir;
- a superfície passa a ser uma função executável por qualquer usuário
  autenticado, e um bug de parâmetro nela vale uma conta alheia.

Fica registrado como plano B caso a publicação de Edge Functions seja inviável.
**A implementação deve seguir §3.1.**

---

## 4. Frontend — o fluxo

### 4.1 Perfil → modal

```
Perfil
├── cartão "Conta"
│   └── Sair                (como é hoje)
└── [ Excluir conta ]       setIsDeleteOpen(true) — fora do cartão, por último
```

O botão fica **fora da seção**, sozinho no fim da rolagem, em `variant="outline"`
com `tone="danger"`: excluir a conta não é uma opção entre outras do cartão, é a
saída definitiva. **O desenho do resto do Perfil não muda.**

### 4.2 O modal de confirmação

`src/features/auth/delete-account-modal.tsx`, montado pelo próprio Perfil e
controlado por estado — **não é uma rota**. A decisão pertence à tela onde ela
começou, e cancelar devolve a pessoa exatamente de onde ela veio, sem navegação
no meio.

```tsx
<DeleteAccountModal visible={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} />
```

É o `Modal` do React Native — o componente de modal da própria plataforma —
apresentado como folha ancorada embaixo: alça, cantos arredondados no topo,
fundo escurecido e `KeyboardAvoidingView` para o teclado não cobrir os botões.
Fechar pelo fundo, pelo "Cancelar" ou pelo botão físico de voltar do Android
(`onRequestClose`) passa pelo mesmo caminho, e nenhum deles exclui nada.

Conteúdo da folha:

```
┌──────────────────────────────────────────────┐
│  Excluir sua conta?                          │
│                                              │
│  Sua conta e todos os dados associados       │
│  serão excluídos permanentemente, incluindo  │
│  seus passaportes, viagens e checklists.     │
│                                              │
│  Essa ação não pode ser desfeita.            │
│                                              │
│  DIGITE EXCLUIR PARA CONFIRMAR               │
│  ┌────────────────────────────────────────┐  │
│  │                                        │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  [       Excluir conta (desabilitado)      ] │
│  [                Cancelar                 ] │
└──────────────────────────────────────────────┘
```

- "Excluir conta": `Button` primário pintado com `colors.danger`. Decidir na
  implementação entre uma prop `tone="danger"` no `Button` compartilhado ou um
  estilo local — preferindo **não** inchar o componente se só esta tela precisar.
- "Cancelar": `Button variant="ghost"`, que faz `router.back()`.
- Fechar pelo gesto ou pelo botão nunca exclui nada: sair da tela é só sair.

### 4.3 A regra do campo

Arquivo novo, minúsculo e puro — é a única parte testável automaticamente:

```ts
// src/features/auth/delete-account.ts
export const DELETE_CONFIRMATION_WORD = 'Excluir';

export function isDeleteConfirmed(value: string): boolean {
  return value.trim() === DELETE_CONFIRMATION_WORD;
}
```

- Comparação **exata e sensível a maiúsculas**: `excluir`, `EXCLUIR`, `Excluír`,
  `Deletar` não habilitam o botão.
- O `trim()` tolera apenas espaço em volta (teclado de celular adiciona com
  facilidade); não é variação da palavra. **Se você preferir rigor total, é uma
  linha a menos — diga na aprovação.**
- O `TextInput` vai com `autoCapitalize="none"`, `autoCorrect={false}`,
  `spellCheck={false}`, `returnKeyType="done"` e `editable={!isDeleting}`, para o
  autocorretor não atrapalhar quem digita certo.

### 4.4 A chamada

```ts
// auth-service.ts
async deleteAccount() {
  const { error } = await supabase.functions.invoke('delete-account');
  if (error) throw error;
  // Sem a conta não há nada a encerrar no servidor: `local` limpa a sessão do
  // dispositivo sem uma ida de rede que só poderia falhar.
  await supabase.auth.signOut({ scope: 'local' });
}
```

`supabase.functions.invoke` já envia o `access_token` da sessão corrente como
`Authorization` — nada a montar à mão.

No `auth-context.tsx`, `deleteAccount` entra como os métodos de e-mail/senha:
**lança** o erro em vez de escrever no `error` global, porque quem mostra a
mensagem é a própria tela, no seu contexto. A tela não fala com o `auth-service`
direto, mantendo o mesmo caminho de todo o resto da autenticação.

### 4.5 Depois da exclusão — processamento, confirmação e navegação

A sessão **não** cai junto com a exclusão. Derrubá-la na mesma hora trocaria a
tela e a pessoa veria o login aparecer sem nenhuma resposta sobre o que
aconteceu. Por isso `authService.deleteAccount()` apenas exclui, e
`signOutLocal()` é chamado depois — quem decide o momento é a tela.

O modal só confirma. Quem exclui é `src/app/account-deleting.tsx`, uma **tela**
registrada no layout raiz com `presentation: 'modal'` e `gestureEnabled: false`
— o mesmo tratamento de `trip-preparing`, porque é o mesmo tipo de momento:
processamento que não se cancela no meio. O modal fecha e a tela assume.

1. **Excluindo** — "Excluindo sua conta...", com a lista do que sai (viagens e
   checklists, passaportes, dados do perfil, conta e acesso) marcando uma linha
   por vez, com o `StepRow` extraído de `trip-preparing`.

   As marcações aparecem **depois** de o servidor confirmar. A exclusão é uma
   chamada só e uma transação só, então a lista é o retrato do que a cascata
   removeu, não etapas que o app executa uma a uma — animar antes da resposta
   seria inventar progresso, que é justamente o que `trip-preparing` evita.

2. **Concluída** — "Conta excluída" e "Sua conta e seus dados foram excluídos
   com sucesso.", com o botão "Ir para o login". **Não há saída automática:**
   ninguém é levado embora de uma confirmação que talvez ainda esteja lendo. O
   botão é a única saída, protegido por uma trava para o logout não acontecer
   duas vezes, e no Android o botão físico de voltar cai no mesmo caminho.

3. **Não concluída** — a mensagem do motivo, "Tentar de novo" (que repete a
   chamada, segura porque a função é idempotente) e "Voltar ao perfil".

Daí para frente nada de `router.replace` na mão: o logout zera a sessão →
`onAuthStateChange` atualiza o `AuthProvider` → no layout raiz o guard
`!!session && hasPassport` vira falso e `guard={!session}` vira verdadeiro → o
grupo `(app)` e esta tela saem juntos e `(auth)` monta com a tela de login.

É exatamente o mesmo caminho do botão "Sair" de hoje. **Não há arquitetura de
navegação nova.** Quem criar conta de novo cai no onboarding do passaporte,
porque a ausência de passaporte é o próprio estado — como já era.

---

## 5. Estados da interface

| #   | Estado          | Como aparece                                                                            |
| --- | --------------- | --------------------------------------------------------------------------------------- |
| 1   | Modal fechado   | Perfil normal, com o botão "Excluir conta" no fim da rolagem                            |
| 2   | Modal aberto    | Campo vazio, "Excluir minha conta" desabilitado (o `Button` já escurece com `disabled`) |
| 3   | Texto incorreto | Botão segue desabilitado. **Sem mensagem de erro enquanto digita** — nada falhou ainda  |
| 4   | Texto correto   | Botão habilitado                                                                        |
| 5   | Excluindo       | Tela de processamento: título, lista do que está sendo removido e nenhuma saída         |
| 6   | Concluída       | Confirmação e o botão "Ir para o login", que é a única saída — nada é automático        |
| 7   | Não concluída   | Na mesma tela: a mensagem do motivo, "Tentar de novo" e "Voltar ao perfil"              |

Textos do estado 7, por causa:

| Causa                       | Mensagem                                                              |
| --------------------------- | --------------------------------------------------------------------- |
| Sem rede / falha de conexão | `Sua conexão oscilou. Toque para tentar de novo.`                     |
| Sessão expirada (401)       | `Sua sessão expirou. Entre de novo para excluir a conta.` + `signOut` |
| Qualquer outra              | `Não foi possível concluir agora. Tente de novo em instantes.`        |

Nenhuma delas usa "falhou", cita Supabase, status HTTP ou nome de função. O "Sua
conexão oscilou" reaproveita a fórmula que a tela de viagem já usa.

---

## 6. Dados locais — o que limpar

| Mecanismo                    | Existe?                                     | O que fazer                                                       |
| ---------------------------- | ------------------------------------------- | ----------------------------------------------------------------- |
| AsyncStorage                 | Sim — só a sessão, gravada pelo supabase-js | `signOut()` remove a chave. **Nada manual.**                      |
| SecureStore                  | Não (nem é dependência)                     | —                                                                 |
| Zustand / Redux / persist    | Não                                         | —                                                                 |
| Contexto de autenticação     | Sim                                         | `onAuthStateChange` zera sozinho                                  |
| Contexto de passaportes      | Sim                                         | O cache guarda de qual `userId` é; com `user = null` ele se anula |
| Estado de tela               | Sim                                         | Desmonta junto com o grupo `(app)`                                |
| Cache de imagem (expo-image) | Sim, implícito                              | Só a foto pública do provedor. Fora de escopo                     |

O `PassportsProvider` merece o registro: ele guarda `{ userId, rows }` e compara
na renderização, então não existe janela mostrando passaportes da conta apagada.
Nenhum efeito de limpeza precisa ser escrito.

Também não há chave própria do app no AsyncStorage — a varredura por
`getItem`/`setItem` só encontra [client.ts](src/lib/supabase/client.ts).

---

## 7. Tratamento de erros

| Situação                                 | Comportamento                                                                                              |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Sem rede                                 | `FunctionsFetchError` → estado 7, mensagem de conexão. Nada foi apagado                                    |
| Sessão inválida ou expirada (401)        | Estado 7 com "Sua sessão expirou. Entre de novo para excluir a conta." Nada é apagado                      |
| Erro interno da função (500)             | Estado 7, mensagem genérica. O `delete` é uma transação só: ou apagou tudo, ou nada                        |
| Toque duplo no botão                     | Guarda `if (isDeleting) return` + `Button loading`, que já ignora o toque                                  |
| App fechado no meio da chamada           | O servidor conclui ou não conclui; na volta, se a conta sumiu, a sessão cai na primeira renovação de token |
| Repetição depois de um sucesso "perdido" | Segunda chamada devolve `200 already_deleted`. A tela encerra a sessão, como no primeiro sucesso           |

**401 nunca é lido como sucesso.** A função separa os dois casos no servidor,
onde a informação existe: quando o token não resolve um usuário, ela lê o `sub`
do próprio token e pergunta ao GoTrue se aquela conta ainda existe. Existe →
`401` (a sessão é que está ruim). Não existe → `200 already_deleted`. E se a
consulta não puder ser feita, a resposta é `500`, nunca um sucesso presumido.

Esse desenho é o que evita o pior efeito colateral possível: a pessoa vendo
"não foi possível" sobre uma conta que já foi excluída.

---

## 8. Segurança

| Risco                                         | Como é evitado                                                                                                                                                                              |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Chave privilegiada no app                     | A `service_role` só existe no runtime da Edge Function. O app segue com `EXPO_PUBLIC_*` apenas                                                                                              |
| Um usuário excluir a conta de outro           | A função não aceita id. O alvo sai de `getUser(token)`, com o token verificado pelo GoTrue                                                                                                  |
| Chamada sem autenticação                      | `verify_jwt = true` barra antes do código rodar; a checagem do header é a segunda camada                                                                                                    |
| Exclusão acidental                            | Modal dedicado + digitação exata de `Excluir` + botão desabilitado por padrão                                                                                                               |
| Dados órfãos                                  | Cascade completo desde `auth.users` (§2.1), sem ordem manual e sem tabela esquecida                                                                                                         |
| Token ainda válido depois da exclusão         | `jwt_expiry = 3600`: o JWT continua assinado até expirar, mas as linhas sumiram, `auth.uid()` não casa com nada e qualquer INSERT quebra na FK para `profiles`. Não dá acesso a dado nenhum |
| Ampliação de superfície de escrita no cliente | Nenhuma policy nova, nenhum `grant` novo. `profiles` continua sem DELETE para `authenticated`                                                                                               |

Fora de escopo, anotado para depois: reautenticação antes de excluir (exigir
login recente). Nenhum provedor atual exige, e a digitação já é a confirmação
consciente pedida.

Vale lembrar que ter a exclusão dentro do app é exigência da App Store para
qualquer app que crie conta — a feature também resolve isso.

---

## 9. Testes

### 9.1 Automatizados

O runner é `node --test "src/**/*.test.ts"`, sem biblioteca de renderização de
componentes. Então o que é testável em CI é a regra pura:

`src/features/auth/tests/delete-account.test.ts`

| Caso                                  | Espera  |
| ------------------------------------- | ------- |
| `''`                                  | `false` |
| `'exc'`, `'Excl'`                     | `false` |
| `'excluir'`, `'EXCLUIR'`, `'ExCluir'` | `false` |
| `'Excluír'`, `'Deletar'`, `'Apagar'`  | `false` |
| `'Excluir conta'`, `'Excluir!'`       | `false` |
| `'Excluir'`                           | `true`  |
| `'  Excluir  '`                       | `true`  |

O comportamento da tela (botão desabilitado, estado de processamento, envio
único) não tem como ser coberto por teste automatizado com o setup atual, e
instalar uma biblioteca de testes de componente está fora do escopo desta
tarefa. Por isso o roteiro abaixo é explícito.

### 9.2 Manuais (roteiro de QA)

| #   | Verificação                    | Como                                                                       |
| --- | ------------------------------ | -------------------------------------------------------------------------- |
| 1   | Botão começa desabilitado      | Abrir o modal e tentar tocar                                               |
| 2   | Palavra incorreta não habilita | Digitar `excluir` e depois `Excluir conta`                                 |
| 3   | Palavra correta habilita       | Digitar `Excluir`                                                          |
| 4   | Cancelar não altera nada       | Cancelar pelo botão **e** pelo gesto; conferir viagens e passaportes       |
| 5   | Exclusão conclui               | Confirmar com conta de teste                                               |
| 6   | Sessão encerrada               | O app cai no login sozinho; fechar e reabrir continua no login             |
| 7   | Dados relacionados removidos   | SQL abaixo, com o `id` anotado antes                                       |
| 8   | Sem acesso depois              | Entrar com o mesmo Google/Apple: entra como conta nova, sem viagens        |
| 9   | Erro tratado                   | Modo avião no passo 5: mensagem de conexão, dados intactos, retry funciona |
| 10  | Duplo toque                    | Tocar duas vezes rápido: uma chamada só                                    |

```sql
-- Antes: guardar o id.  Depois: todas as contagens precisam voltar 0.
select
  (select count(*) from auth.users       where id = :id)      as usuario,
  (select count(*) from public.profiles  where id = :id)      as perfil,
  (select count(*) from public.passports where user_id = :id) as passaportes,
  (select count(*) from public.trips     where user_id = :id) as viagens,
  (select count(*) from public.trip_countries tc
     where not exists (select 1 from public.trips t where t.id = tc.trip_id)) as paises_orfaos,
  (select count(*) from public.trip_cities ci
     where not exists (select 1 from public.trips t where t.id = ci.trip_id)) as cidades_orfas,
  (select count(*) from public.trip_requirements r
     where not exists (select 1 from public.trips t where t.id = r.trip_id))  as requisitos_orfaos;
```

### 9.3 Qualidade do repositório

`supabase/functions/**` é código Deno: usa o global `Deno` e imports `jsr:`. O
`tsconfig.json` de hoje inclui `**/*.ts`, então **`pnpm check` quebraria** ao
compilar a função com as libs do React Native. O plano inclui:

- `"exclude": ["supabase/functions"]` no [tsconfig.json](tsconfig.json);
- `'supabase/functions/*'` nos `ignores` do [eslint.config.js](eslint.config.js).

O Prettier continua formatando o arquivo normalmente.

---

## 10. Arquivos

### 10.1 Alterados

| Arquivo                                                                      | Motivo                                                            |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| [src/app/(app)/profile.tsx](<src/app/(app)/profile.tsx>)                     | Botão "Excluir conta" fora do cartão e o estado que abre o modal  |
| [src/app/\_layout.tsx](src/app/_layout.tsx)                                  | Registrar `account-deleting` como tela de processamento           |
| [src/features/auth/auth-context.tsx](src/features/auth/auth-context.tsx)     | Expor `deleteAccount` e `signOutLocal`, o par do fluxo            |
| [src/features/auth/auth-service.ts](src/features/auth/auth-service.ts)       | `deleteAccount()` (só exclui) e `signOutLocal()` (encerra depois) |
| [src/components/ui/button.tsx](src/components/ui/button.tsx)                 | Variante `outline` e `tone="danger"`, sem mexer no que já existia |
| [src/app/trip-preparing.tsx](src/app/trip-preparing.tsx)                     | Passa a consumir o `StepRow` extraído, sem mudança visual         |
| [src/theme/tokens.ts](src/theme/tokens.ts)                                   | `dangerPressed` e `dangerSoft`                                    |
| [supabase/config.toml](supabase/config.toml)                                 | Bloco `[functions.delete-account]`                                |
| [tsconfig.json](tsconfig.json)                                               | Excluir `supabase/functions` da checagem de tipos do app          |
| [eslint.config.js](eslint.config.js)                                         | Ignorar `supabase/functions`                                      |
| [package.json](package.json), [.vscode/settings.json](.vscode/settings.json) | `functions:check` e o LSP do Deno só nessa pasta                  |

O layout raiz volta à lista: a confirmação é modal e não tem rota, mas a tela de
processamento tem.

### 10.2 Novos

| Arquivo                                          | Por que precisa existir                                                         |
| ------------------------------------------------ | ------------------------------------------------------------------------------- |
| `src/features/auth/delete-account-modal.tsx`     | O fluxo pede campo de texto e botão condicional — o `Alert` nativo não faz isso |
| `src/app/account-deleting.tsx`                   | A exclusão em si, com o processamento e a confirmação em tela cheia             |
| `src/components/ui/step-row.tsx`                 | A linha de etapa concluída, agora usada pela preparação e pela exclusão         |
| `src/features/auth/delete-account.ts`            | A regra da palavra, pura e testável sem Supabase (≈6 linhas)                    |
| `src/features/auth/tests/delete-account.test.ts` | Testes da regra, no padrão `node --test` já usado em `trips/tests/`             |
| `supabase/functions/delete-account/index.ts`     | Onde a chave privilegiada pode existir                                          |
| `supabase/functions/deno.json`                   | Tipos e lint do código Deno, que sai da checagem do app                         |

Nada de service novo, repository, use-case ou `utils`. Nenhuma dependência nova:
`@supabase/supabase-js` já traz `functions.invoke`.

### 10.3 Não muda

`src/types/database.ts` (Edge Function não é RPC, não entra em `Functions`),
migrations, policies, grants, checklist, requisitos de viagem, tema e qualquer
outra tela.

---

## 11. Analytics / logs

Não existe analytics no projeto — a varredura só encontra `console.log` de
diagnóstico de OAuth, protegido por `__DEV__`, em
[auth-redirect.ts](src/features/auth/auth-redirect.ts) e
[auth-service.ts](src/features/auth/auth-service.ts).

**Nada será adicionado.** Os logs da própria Edge Function (visíveis no painel do
Supabase) já registram a chamada, e o plano não escreve nenhum dado pessoal
neles: em caso de erro, logar no máximo o código, nunca e-mail ou id.

---

## 12. Ordem de implementação sugerida

1. `supabase/functions/delete-account/index.ts` + `config.toml` + os dois
   ajustes de `tsconfig`/`eslint`; publicar e testar com `curl` usando o token de
   uma conta de teste.
2. `delete-account.ts` (regra) + testes; `pnpm check` verde.
3. `auth-service.deleteAccount` e `auth-context`.
4. `src/features/auth/delete-account-modal.tsx` e `src/app/account-deleting.tsx`.
5. A linha no Perfil.
6. Roteiro de QA do §9.2 com conta descartável.

---

## 13. Critérios de aceite

- [ ] O Perfil tem "Excluir conta" no cartão "Conta", e o resto da tela está igual.
- [ ] O modal mostra título, aviso de permanência, campo e os dois botões.
- [ ] "Excluir conta" nasce desabilitado e só habilita com `Excluir` exato.
- [ ] Cancelar, pelo botão ou pelo gesto, não apaga absolutamente nada.
- [ ] Fechar o modal nunca dispara exclusão.
- [ ] Durante a exclusão há indicador de processamento e um único envio possível.
- [ ] Ao concluir, o app volta sozinho ao login, sem tela intermediária.
- [ ] Reabrir o app continua no login: a sessão não volta.
- [ ] A consulta SQL do §9.2 retorna zero em todas as colunas.
- [ ] O login com o mesmo provedor cria uma conta nova, sem nenhum dado antigo.
- [ ] Sem rede, a mensagem é de conexão, os dados continuam lá e o retry funciona.
- [ ] Nenhuma mensagem usa "falhou", termo técnico ou nome de serviço.
- [ ] Nenhuma chave privilegiada aparece no app, no `.env` ou no bundle.
- [ ] `pnpm check` passa.

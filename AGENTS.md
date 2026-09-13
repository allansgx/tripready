# TripReady — Development Guidelines

## Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## Stack

React Native · Expo · Expo Router · TypeScript · Supabase (PostgreSQL) · npm

Estrutura atual em `src/`: `app/` (rotas), `features/` (domínios: auth, trips, passports), `components/ui/`, `services/` (acesso a dados), `lib/`, `theme/`, `constants/`, `types/`.

## Código

- Usar TypeScript corretamente e evitar `any`.
- Preferir componentes simples e reutilizáveis.
- Evitar duplicação de lógica.
- Não criar abstrações ou camadas desnecessárias para o MVP.
- Manter a lógica de negócio separada da UI quando isso melhorar a reutilização/testabilidade.
- Respeitar a estrutura existente antes de criar novas pastas ou padrões.
- Preferir componentes nativos da plataforma (ex.: `@expo/ui`) a reimplementações customizadas em JS.
- Não faça comentários no código, exceto se for extremamente necessário, e comentário curtos se precisar.

### Comentários

O limite prático é **três linhas**. Acima disso, o comentário virou texto e
precisa ser cortado ou movido para `tasks/`.

Um comentário só se justifica quando explica **por que** o código é daquele
jeito e a resposta não está no próprio código — uma armadilha de plataforma, uma
decisão que parece errada até ser explicada, um valor que veio de fora.

Nunca comentar:

- o que o nome da função, do tipo ou da constante já diz;
- justificativa de produto ou de design que não muda a leitura do código;
- histórico ("antes era assim", "isto substituiu aquilo") — quem guarda isso é
  o git;
- banners de seção (`// ===== Catálogo =====`) — se o arquivo precisa de
  divisórias, ele precisa é de ser dividido.

Comentário e código envelhecem juntos: ao alterar um trecho, conferir se o que
está escrito acima dele ainda é verdade.

## Antes de implementar

1. Verificar se já existe componente, função ou serviço reutilizável.
2. Reutilizar o que existe em vez de duplicar.
3. Fazer a menor alteração necessária para resolver o problema.
4. Não alterar funcionalidades existentes sem necessidade.

## Qualidade

Antes de considerar uma implementação concluída, executar:

```
npm check
```

Verifica ESLint, TypeScript e Prettier.

Não esconder erros com `any`, `@ts-ignore` ou `@ts-nocheck`.

## Supabase

- Nunca expor secrets no app mobile.
- No cliente, usar apenas variáveis públicas `EXPO_PUBLIC_*`.
- Nunca usar `service_role` ou `SUPABASE_SECRET_KEY` no app.
- Respeitar RLS.
- Não alterar o schema do banco sem necessidade.

### Migrations

O app fala direto com o banco. Quem protege os dados é a policy, não o código do
cliente — uma tabela sem RLS fica aberta para qualquer usuário logado, sem erro e
sem aviso.

Toda migration que cria tabela precisa, no mesmo arquivo:

1. `enable row level security` — sem isso a tabela nasce legível e gravável,
   porque `20260905120200_table_grants.sql` deixou um `alter default privileges`
   concedendo tudo a `authenticated` em cada tabela nova do schema.
2. Policies explícitas por operação, sempre `to authenticated`, filtrando pelo
   dono (`auth.uid()` ou `is_trip_owner`).
3. `grant` só do que a tabela precisa e `revoke` do que ela não deve aceitar —
   tabela de catálogo é somente leitura para o cliente.
4. Nada para `anon`: o app não tem dado público.

`using (true)` só vale em SELECT de tabela de catálogo. Nunca em dado de usuário.

Funções: `security invoker` por padrão. `security definer` apenas quando a
operação exigir privilégio que o usuário não tem e, nesse caso, sempre com
`set search_path = ''` e `revoke execute ... from public, anon`.

Antes de `db push`, conferir que as duas listas batem:

```bash
diff \
  <(grep -h "^create table public\." supabase/migrations/*.sql | sed 's/create table public\.//;s/ (//' | sort) \
  <(grep -h "^alter table public\..*enable row level security" supabase/migrations/*.sql | sed 's/alter table public\.//;s/ enable row level security;//' | sort)
```

Os padrões são ancorados em `^` de propósito: sem isso, a mesma frase escrita no
comentário de uma migration entra na contagem e o resultado mente.

## Regras de negócio

### Viagens

Status derivado das datas, nunca armazenado no banco: `upcoming`, `in_progress`, `completed`.

Ordenação:

1. Em andamento
2. Próximas, pela data de início
3. Concluídas, pela data de término mais recente

Nunca assumir que o passaporte do usuário é brasileiro. O passaporte usado deve ser determinado pelo passaporte principal cadastrado pelo usuário. Atualmente o catálogo de regras de visto possui dados para BR, mas a arquitetura deve suportar outros países.

### Checklist

Prioridades: `required`, `recommended`, `informational`.

- `required` determina se a viagem está pronta — pronta quando todos os `required` estiverem verificados.
- `recommended` contribui para o progresso.
- `informational` não contribui para o progresso.

Manter essa lógica centralizada e reutilizável.

## UX

O TripReady é simples, claro, mobile-first, orientado à ação e positivo.

- Evitar mensagens negativas ou técnicas para o usuário.
- Toda mensagem deve indicar claramente o próximo passo.
- Não transformar o MVP em um planejador de viagens completo.
- Evitar funcionalidades fora do escopo atual sem necessidade.

## Commits

- Não faça commit automatico após uma alteração, mas quando for solicitado para fazer um commit, utilize o convetional commits, em português.
- Sempre claro, objetivo e curto, mas não deixe faltar informação.
- Pode usar tópicos se necessário.

## Documentos de trabalho

`tasks/` guarda só o que ainda está em aberto: plano em execução, avaliação sem
decisão tomada, coleta de dados em andamento. Plano concluído sai da pasta —
o que ele decidiu já está no código e nas migrations, e o histórico está no git.

Não existe pasta `docs/`. Um documento que continua útil depois de a feature
ficar pronta é ou uma coleta de dados com fonte e data de conferência, que
permanece em `tasks/` porque será retomada, ou uma regra de como o projeto
trabalha, que pertence a este arquivo.

Ao concluir ou abandonar um documento, conferir se alguém aponta para ele:
link quebrado dentro de `tasks/` é o sintoma mais comum de plano removido pela
metade.

## Feature organization

Organize feature code by responsibility when the feature has enough files to justify it:

- `components/` — UI específica da feature
- `domain/` — regras de negócio puras
- `data/` — acesso, persistência e normalização de dados
- `hooks/` — hooks específicos da feature
- `tests/` — testes da feature

Do not create additional layers such as services, repositories, use-cases, utils or abstractions unless there is a concrete need.
Prefer the smallest structure that keeps responsibilities clear.

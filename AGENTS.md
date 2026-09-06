# TripReady — Development Guidelines

## Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## Stack

React Native · Expo · Expo Router · TypeScript · Supabase (PostgreSQL) · pnpm

Estrutura atual em `src/`: `app/` (rotas), `features/` (domínios: auth, trips, passports), `components/ui/`, `services/` (acesso a dados), `lib/`, `theme/`, `constants/`, `types/`.

## Código

- Usar TypeScript corretamente e evitar `any`.
- Preferir componentes simples e reutilizáveis.
- Evitar duplicação de lógica.
- Não criar abstrações ou camadas desnecessárias para o MVP.
- Manter a lógica de negócio separada da UI quando isso melhorar a reutilização/testabilidade.
- Respeitar a estrutura existente antes de criar novas pastas ou padrões.
- Preferir componentes nativos da plataforma (ex.: `@expo/ui`) a reimplementações customizadas em JS.
- Não deixar comentários desnecessários no código, deixe somente quando for muito válido.

## Antes de implementar

1. Verificar se já existe componente, função ou serviço reutilizável.
2. Reutilizar o que existe em vez de duplicar.
3. Fazer a menor alteração necessária para resolver o problema.
4. Não alterar funcionalidades existentes sem necessidade.

## Qualidade

Antes de considerar uma implementação concluída, executar:

```
pnpm check
```

Verifica ESLint, TypeScript e Prettier.

Não esconder erros com `any`, `@ts-ignore` ou `@ts-nocheck`.

## Supabase

- Nunca expor secrets no app mobile.
- No cliente, usar apenas variáveis públicas `EXPO_PUBLIC_*`.
- Nunca usar `service_role` ou `SUPABASE_SECRET_KEY` no app.
- Respeitar RLS.
- Não alterar o schema do banco sem necessidade.

## Regras de negócio

### Viagens

Status derivado das datas, nunca armazenado no banco: `upcoming`, `in_progress`, `completed`.

Ordenação:

1. Em andamento
2. Próximas, pela data de início
3. Concluídas, pela data de término mais recente

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

- O commit não é feito automatico após uma alteração, mas quando for solicitado para fazer um commit, utilize o convetional commits, em português.
- Sempre claro, objetivo e curto, mas não deixe faltar informação.

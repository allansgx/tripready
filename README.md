# TripReady

App mobile (React Native + Expo + TypeScript) para organizar o que é preciso
antes de viajar. Backend: Supabase (Auth + PostgreSQL com RLS). Não há backend
Node próprio.

## Requisitos

- Node 20+
- Conta e projeto no [Supabase](https://supabase.com)
- Supabase CLI (`npx supabase`) para aplicar as migrations

## Configuração

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Copie `.env.example` para `.env` e preencha:

   ```
   EXPO_PUBLIC_SUPABASE_URL=...
   EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
   ```

   Só entram aqui chaves públicas (`EXPO_PUBLIC_*`). A `service_role key` e os
   client secrets do Google/Apple ficam apenas no painel do Supabase.

3. Aplique as migrations no projeto Supabase:

   ```bash
   npx supabase init          # apenas na primeira vez (cria supabase/config.toml)
   npx supabase link --project-ref <ref-do-projeto>
   npx supabase db push
   ```

4. Em **Supabase → Authentication → Providers**, habilite Google e Apple com os
   respectivos client id/secret.

5. Em **Supabase → Authentication → URL Configuration → Redirect URLs**,
   adicione:

   - `tripready://auth/callback` (development/production build)
   - `exp://**` (Expo Go — o IP/porta do dev server muda a cada máquina/rede,
     por isso o curinga; opcionalmente use a URL exata mostrada na tela de
     login em modo dev)
   - `http://localhost:8081/auth/callback` (web)

   Se a URL de retorno não estiver nessa lista, o Supabase ignora o
   `redirect_to` e manda o navegador para a **Site URL** (que por padrão é
   `http://localhost:3000`) — é exatamente o sintoma de "o login termina em
   localhost e não volta para o app".

   Nada precisa mudar no Google Cloud Console: o Google só enxerga o callback
   do Supabase (`https://<ref>.supabase.co/auth/v1/callback`).

6. Rode o app:

   ```bash
   npx expo start
   ```

   O login com Apple nativo exige build de desenvolvimento em iOS
   (`npx expo run:ios` ou EAS); nas demais plataformas usa-se o fluxo OAuth
   pelo navegador.

## Estrutura

```
src/
  app/                  rotas do Expo Router
    _layout.tsx         providers + proteção de rotas por sessão
    (auth)/login.tsx    tela de login
    (app)/              área autenticada (abas Início, Viagens, Perfil)
  components/ui/        componentes visuais reutilizáveis
  features/auth/        AuthProvider + serviço de autenticação
  lib/                  env e cliente Supabase
  services/             camada de acesso a dados (uma por entidade)
  theme/                tokens visuais
  types/                tipos do banco e aliases das entidades
supabase/migrations/    schema e policies de RLS versionados
```

Regra: telas não chamam `supabase.from(...)` direto — sempre via `src/services`.

# TripReady

App mobile (React Native + Expo + TypeScript) para organizar o que é preciso
antes de viajar. Backend: Supabase (Auth + PostgreSQL com RLS). Não há backend
Node próprio.

## Requisitos

- Node 22+ — os testes e o gerador do site rodam TypeScript direto no Node, sem
  passo de build
- Conta e projeto no [Supabase](https://supabase.com)
- Supabase CLI (`npx supabase`) para aplicar as migrations e publicar a Edge
  Function
- [Deno](https://deno.com) apenas para checar a Edge Function (`npm run
functions:check`)

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

4. Publique as Edge Functions:

   ```bash
   npx supabase functions deploy delete-account
   npx supabase functions deploy request-password-reset
   ```

   Sem a primeira o botão **Excluir conta** não funciona; sem a segunda, a
   recuperação de senha não filtra contas só-Google/Apple (ver seção
   "Autenticação" do [AGENTS.md](AGENTS.md)). A chave de serviço que as duas
   usam é injetada pelo runtime do Supabase e nunca chega ao aplicativo.

5. Configure o envio de e-mail em **Supabase → Authentication → Emails**:

   - **SMTP customizado**, apontando para o [Resend](https://resend.com) —
     sem isso, os e-mails de confirmação de cadastro e de recuperação de
     senha saem pelo remetente de teste do Supabase, com limites bem menores.
   - **Confirm signup** habilitado (`enable_confirmations`), para exigir a
     confirmação de e-mail antes do primeiro login por e-mail/senha.
   - Os templates "Confirm signup" e "Reset password" precisam exibir
     `{{ .Token }}` (o código de 6 dígitos) — o app usa código, não link, pelo
     comportamento do Expo Go (ver [AGENTS.md](AGENTS.md)).

6. Em **Supabase → Authentication → Providers**, habilite Google e Apple com os
   respectivos client id/secret.

7. Em **Supabase → Authentication → URL Configuration → Redirect URLs**,
   adicione:

   - `tripready://auth/callback` (development/production build)
   - `exp://**` (Expo Go — o IP/porta do dev server muda a cada máquina/rede,
     por isso o curinga; opcionalmente use a URL exata mostrada na tela de
     login em modo dev)
   - `http://localhost:8081/auth/callback` (web)

   Se a URL de retorno não estiver nessa lista, o Supabase ignora o
   `redirect_to` e manda o navegador para a **Site URL** (que por padrão é
   `http://localhost:3000`) — é exatamente o sintoma de "o login termina em
   localhost e não volta para o app". Essa lista só vale para o login por
   Google/Apple: os e-mails de confirmação e recuperação usam código, não
   link, e não passam por nenhuma dessas URLs.

   Nada precisa mudar no Google Cloud Console: o Google só enxerga o callback
   do Supabase (`https://<ref>.supabase.co/auth/v1/callback`).

8. Rode o app:

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
    (auth)/             login, cadastro e recuperação de senha
    (app)/              área autenticada (abas Início, Viagens, Perfil)
    legal/              Política e Termos — fora dos grupos protegidos, porque
                        são alcançados com e sem sessão
    onboarding.tsx      escolha do primeiro passaporte
  components/ui/        componentes visuais reutilizáveis
  constants/            países, cidades e destinos
  features/auth/        AuthProvider + serviço de autenticação
  features/passports/   passaportes do usuário e passaporte principal
  features/trips/       viagens, checklist e regras de requisitos
  features/legal/       texto dos documentos legais + renderização
  lib/                  env e cliente Supabase
  services/             camada de acesso a dados (uma por entidade)
  theme/                tokens visuais
  types/                tipos do banco e aliases das entidades
scripts/                utilitários de linha de comando
site/                   site público estático (gerado — ver abaixo)
supabase/
  migrations/           schema e policies de RLS versionados
  functions/            Edge Function da exclusão de conta
```

Regra: telas não chamam `supabase.from(...)` direto — sempre via `src/services`.

## Scripts

```bash
npm run check       # eslint + tsc + prettier + testes
npm test            # testes unitários das regras de negócio
npm run site        # gera o site público em site/
npm run functions:check   # checa a Edge Function (precisa de Deno)
```

## Site público

As lojas exigem uma URL pública de política de privacidade, e a App Store exige
também uma URL de suporte. `npm run site` gera `index.html`, `privacidade.html`,
`termos.html` e `suporte.html` em `site/`, a partir do mesmo
`src/features/legal/data/legal-documents.ts` que alimenta as telas do app — não
existe segunda cópia do texto.

O que vai para o ar é apenas a pasta `site/`: HTML e CSS, sem bundle do
aplicativo. Na Vercel, basta apontar o **Root Directory** para `site`, sem build
command.

> **Antes de apontar um domínio:** a identidade do responsável (razão social,
> CNPJ, e-mail, domínio e foro) ainda está preenchida com marcadores `{{...}}`.
> Substitua-os em `LEGAL_IDENTITY`, rode `npm run site` de novo e confira que
> `grep -r "{{" site/` não devolve nada. Detalhes em
> [tasks/plano-legal.md](tasks/plano-legal.md).

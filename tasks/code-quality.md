# Plano de Implementação — Qualidade do MVP

Objetivo:
Adicionar apenas o básico de qualidade ao TripReady antes do projeto crescer.

IMPORTANTE:

- O projeto já utiliza ESLint + eslint-config-expo.
- Não reinstalar ou substituir o ESLint existente.
- Manter o package manager atual (pnpm).
- Não alterar UI, UX ou funcionalidades.
- Não fazer refatorações desnecessárias.

## 1. ESLint

Revisar a configuração atual do ESLint e garantir que ela esteja adequada para:

- Expo
- React Native
- React
- TypeScript
- React Hooks

Manter o script existente:

pnpm lint

Corrigir problemas encontrados sem esconder erros usando `any`, `@ts-ignore` ou `@ts-nocheck`.

## 2. Prettier

Adicionar Prettier ao projeto.

Criar uma configuração simples e compatível com o código existente.

Adicionar:

pnpm format

pnpm format:check

Não formatar `node_modules`, `.expo`, build/output ou arquivos gerados.

## 3. TypeScript

Verificar o `tsconfig.json`.

Ativar `strict` se ainda não estiver habilitado.

Adicionar:

pnpm typecheck

usando:

tsc --noEmit

Corrigir os erros de tipagem encontrados.

## 4. Check

Adicionar um comando único:

pnpm check

Ele deve executar:

- lint
- typecheck
- format:check

Se qualquer etapa falhar, o comando deve falhar.

## 5. Validação

Após implementar:

pnpm check

Corrigir todos os problemas encontrados.

Não modificar funcionalidades existentes.

Ao final, informar:

- dependências adicionadas
- arquivos modificados
- scripts adicionados
- resultado do `pnpm check`

// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintConfigPrettier = require('eslint-config-prettier/flat');

module.exports = defineConfig([
  // `eslint-config-expo` já traz Expo, React Native, React, React Hooks e
  // TypeScript. Nada aqui substitui essas regras — só delimitamos o alvo e
  // desligamos o que colidiria com o Prettier.
  expoConfig,

  // Saídas de build e arquivos gerados: não são código nosso para corrigir.
  // `supabase/functions` é código Deno, validado por `deno lint`/`deno check`
  // (`pnpm functions:check`) em vez das regras de React Native.
  {
    ignores: ['dist/*', '.expo/*', 'expo-env.d.ts', 'supabase/functions/*'],
  },

  // Precisa ser o último: apaga as regras de formatação, que são do Prettier.
  eslintConfigPrettier,
]);

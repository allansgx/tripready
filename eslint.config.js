// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintConfigPrettier = require('eslint-config-prettier/flat');

module.exports = defineConfig([
  expoConfig,

  // `supabase/functions` é código Deno, validado por `npm run functions:check`.
  {
    ignores: ['dist/*', '.expo/*', 'expo-env.d.ts', 'supabase/functions/*'],
  },

  // Precisa ser o último: apaga as regras de formatação, que são do Prettier.
  eslintConfigPrettier,
]);

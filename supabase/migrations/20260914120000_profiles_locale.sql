-- =============================================================================
-- TripReady — idioma escolhido pelo usuário
--
-- A coluna guarda **a escolha**, não a detecção: nulo significa "segue o
-- aparelho". É o que faz o comportamento ficar certo dos dois lados — quem
-- nunca escolheu recebe o idioma do telefone que estiver usando, e quem
-- escolheu carrega a escolha para qualquer aparelho.
--
-- Gravar aqui o idioma detectado na criação da conta pareceria equivalente e
-- não é: quem cria a conta num telefone em português e depois instala num
-- telefone em inglês ficaria preso ao português sem nunca ter pedido isso.
--
-- Sem policy nova: `profiles_select_own` e `profiles_update_own`, de
-- `20260905120100_rls_policies.sql`, já cobrem a leitura e a escrita da própria
-- linha, e a coluna nasce dentro delas. `handle_new_user()` continua inserindo
-- só o `id`, porque a coluna é nula por padrão.
--
-- A lista de idiomas fica no `check` porque são três valores, com a mesma lista
-- do lado do cliente em `src/i18n/locales.ts`. Vira enum quando passar de meia
-- dúzia.
-- =============================================================================

alter table public.profiles
  add column locale text check (locale in ('pt-BR', 'en', 'es'));

comment on column public.profiles.locale is
  'Idioma escolhido pela pessoa no app. Nulo = segue o idioma do aparelho, e '
  'nunca é preenchido por detecção — só por escolha explícita.';

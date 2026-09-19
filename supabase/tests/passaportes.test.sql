-- =============================================================================
-- TripReady — funções de escrita de passaporte
--
-- Cobre os cenários S5, S11, S12, B4 e B5 do plano: propriedade, recusa do
-- último passaporte e promoção automática do principal.
--
-- Cada arquivo roda dentro de uma transação que termina em `rollback`, então os
-- dados de teste nunca sobrevivem à execução.
--
-- O papel é trocado com `set local role` e `request.jwt.claims`, que é de onde
-- `auth.uid()` lê o usuário. Voltar para `postgres` desliga o RLS (a role é dona
-- das tabelas) e é assim que a conferência enxerga as duas contas.
-- =============================================================================

begin;

create extension if not exists pgtap with schema extensions;
set local search_path to extensions, public;

select plan(6);

-- -----------------------------------------------------------------------------
-- Cenário: duas contas. A tem dois passaportes, B tem um só.
-- -----------------------------------------------------------------------------
insert into auth.users (id, email)
values
  ('11111111-1111-1111-1111-111111111111', 'a@tripready.test'),
  ('22222222-2222-2222-2222-222222222222', 'b@tripready.test');

insert into public.passports (id, user_id, country_code, is_primary, created_at)
values
  ('aaaaaaa1-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
   'BR', true, '2026-01-01'),
  ('aaaaaaa1-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111',
   'PT', false, '2026-02-01'),
  ('bbbbbbb2-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222',
   'AR', true, '2026-01-01');

-- -----------------------------------------------------------------------------
-- S5 — passaporte de outra pessoa é indistinguível de um id inexistente
-- -----------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select throws_ok(
  $$ select public.delete_passport('bbbbbbb2-0000-0000-0000-000000000001') $$,
  'TR404',
  null,
  'A não remove o passaporte de B'
);

select throws_ok(
  $$ select public.set_primary_passport('bbbbbbb2-0000-0000-0000-000000000001') $$,
  'TR404',
  null,
  'A não promove o passaporte de B'
);

-- -----------------------------------------------------------------------------
-- B5 — o último passaporte do perfil não sai
-- -----------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';

select throws_ok(
  $$ select public.delete_passport('bbbbbbb2-0000-0000-0000-000000000001') $$,
  'TR403',
  null,
  'B não remove o único passaporte que tem'
);

-- -----------------------------------------------------------------------------
-- B4 — remover o principal promove o mais antigo dos restantes
-- -----------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select is(
  public.delete_passport('aaaaaaa1-0000-0000-0000-000000000001'),
  'PT',
  'remover o principal devolve o país promovido, para a tela poder avisar'
);

set local role postgres;

select is(
  (select count(*)::int from public.passports
   where user_id = '11111111-1111-1111-1111-111111111111' and is_primary),
  1,
  'sobra exatamente um passaporte principal'
);

select is(
  (select country_code from public.passports
   where user_id = '11111111-1111-1111-1111-111111111111' and is_primary),
  'PT',
  'o promovido é o mais antigo dos que ficaram'
);

select * from finish();

rollback;

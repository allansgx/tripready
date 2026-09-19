-- =============================================================================
-- TripReady — o passaporte da viagem
--
-- O primeiro teste é o que sustenta a decisão de não haver chave estrangeira
-- entre `trips` e `passports`: excluir um passaporte do perfil **não escreve em
-- viagem nenhuma**, nem futura, nem concluída. É invisível na interface e só se
-- confere aqui.
--
-- Cobre também S2, S3, S4, B9, B10 e B11 do plano.
-- =============================================================================

begin;

create extension if not exists pgtap with schema extensions;
set local search_path to extensions, public;

select plan(9);

-- -----------------------------------------------------------------------------
-- Cenário: A tem BR (principal) e PT, uma viagem futura e uma concluída, as
-- duas montadas com BR. B tem a sua própria viagem.
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

insert into public.trips (id, user_id, name, start_date, end_date, passport_country_code)
values
  ('7a1b0000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
   'Futura', '2030-01-10', '2030-01-20', 'BR'),
  ('7a1b0000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111',
   'Concluída', '2020-01-10', '2020-01-20', 'BR'),
  ('7a1b0000-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222',
   'De B', '2030-03-10', '2030-03-20', 'AR');

insert into public.trip_countries (trip_id, country_code)
values
  ('7a1b0000-0000-0000-0000-000000000001', 'CN'),
  ('7a1b0000-0000-0000-0000-000000000002', 'CN'),
  ('7a1b0000-0000-0000-0000-000000000003', 'CN');

insert into public.trip_requirements (id, trip_id, country_code, title, priority, category)
values
  ('4e900000-0000-0000-0000-000000000001', '7a1b0000-0000-0000-0000-000000000001',
   'CN', 'Item da viagem futura', 'required', 'documents'),
  ('4e900000-0000-0000-0000-000000000002', '7a1b0000-0000-0000-0000-000000000003',
   'CN', 'Item da viagem de B', 'required', 'documents');

create temporary table viagens_antes as
select id, updated_at, passport_country_code from public.trips;

-- -----------------------------------------------------------------------------
-- S10 / B1 / B2 — excluir passaporte não toca em `trips`
-- -----------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select lives_ok(
  $$ select public.delete_passport('aaaaaaa1-0000-0000-0000-000000000001') $$,
  'A remove o passaporte principal'
);

set local role postgres;

select is_empty(
  $$ select t.id
     from public.trips t
     join viagens_antes v on v.id = t.id
     where t.updated_at is distinct from v.updated_at $$,
  'excluir um passaporte não altera o updated_at de viagem nenhuma'
);

select is(
  (select passport_country_code from public.trips
   where id = '7a1b0000-0000-0000-0000-000000000002'),
  'BR',
  'a viagem concluída continua explicada pelo passaporte com que foi preparada'
);

-- -----------------------------------------------------------------------------
-- B9 — viagem concluída não troca de passaporte
-- -----------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select throws_ok(
  $$ select public.apply_trip_passport_change(
       '7a1b0000-0000-0000-0000-000000000002', 'BR', 'PT', '2026-09-19',
       array[]::uuid[], array[]::uuid[], '[]'::jsonb, '[]'::jsonb) $$,
  'TR403',
  null,
  'a viagem concluída recusa a troca de passaporte'
);

-- -----------------------------------------------------------------------------
-- B10 — concorrência otimista
-- -----------------------------------------------------------------------------
select throws_ok(
  $$ select public.apply_trip_passport_change(
       '7a1b0000-0000-0000-0000-000000000001', 'XX', 'PT', '2026-09-19',
       array[]::uuid[], array[]::uuid[], '[]'::jsonb, '[]'::jsonb) $$,
  'TR409',
  null,
  'a troca é recusada quando o passaporte já mudou em outro lugar'
);

-- -----------------------------------------------------------------------------
-- S2 — viagem de outra pessoa é indistinguível de uma que não existe
-- -----------------------------------------------------------------------------
select throws_ok(
  $$ select public.apply_trip_passport_change(
       '7a1b0000-0000-0000-0000-000000000003', 'AR', 'PT', '2026-09-19',
       array[]::uuid[], array[]::uuid[], '[]'::jsonb, '[]'::jsonb) $$,
  'TR404',
  null,
  'A não troca o passaporte da viagem de B'
);

-- -----------------------------------------------------------------------------
-- S3 / S4 — o payload não alcança outra viagem
--
-- `p_supersede_ids` cita um requisito de B e `p_inserts` traz um `trip_id`
-- forjado. A função filtra por `trip_id` e monta o insert com o parâmetro.
-- -----------------------------------------------------------------------------
select lives_ok(
  $$ select public.apply_trip_passport_change(
       '7a1b0000-0000-0000-0000-000000000001', 'BR', 'PT', '2026-09-19',
       array['4e900000-0000-0000-0000-000000000002']::uuid[],
       array[]::uuid[],
       '[]'::jsonb,
       '[{"trip_id":"7a1b0000-0000-0000-0000-000000000003","country_code":"CN","title":"Forjado","priority":"required","category":"documents"}]'::jsonb) $$,
  'a troca roda com um payload apontando para a viagem de B'
);

set local role postgres;

select is(
  (select superseded_at from public.trip_requirements
   where id = '4e900000-0000-0000-0000-000000000002'),
  null,
  'o requisito de B não foi superado pelo payload de A'
);

select is(
  (select count(*)::int from public.trip_requirements
   where trip_id = '7a1b0000-0000-0000-0000-000000000003'),
  1,
  'o insert forjado entrou na viagem do parâmetro, não na de B'
);

select * from finish();

rollback;

-- =============================================================================
-- TripReady — isolamento entre contas e o índice único da checklist
--
-- Cobre S6, S7 e as invariantes B7/B8: item superado e item vigente da mesma
-- origem convivem, dois vigentes não.
-- =============================================================================

begin;

create extension if not exists pgtap with schema extensions;
set local search_path to extensions, public;

select plan(6);

insert into auth.users (id, email)
values
  ('11111111-1111-1111-1111-111111111111', 'a@tripready.test'),
  ('22222222-2222-2222-2222-222222222222', 'b@tripready.test');

insert into public.passports (id, user_id, country_code, is_primary)
values
  ('aaaaaaa1-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'BR', true),
  ('bbbbbbb2-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'AR', true);

insert into public.trips (id, user_id, name, passport_country_code)
values
  ('7a1b0000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'De A', 'BR'),
  ('7a1b0000-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'De B', 'AR');

insert into public.trip_requirements (id, trip_id, title, priority, category, completed)
values
  ('4e900000-0000-0000-0000-000000000002', '7a1b0000-0000-0000-0000-000000000003',
   'Item de B', 'required', 'documents', false);

-- -----------------------------------------------------------------------------
-- S7 — cada conta só enxerga o que é dela
-- -----------------------------------------------------------------------------
set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select is_empty(
  $$ select id from public.trips where user_id = '22222222-2222-2222-2222-222222222222' $$,
  'A não enxerga as viagens de B'
);

select is_empty(
  $$ select id from public.passports where user_id = '22222222-2222-2222-2222-222222222222' $$,
  'A não enxerga os passaportes de B'
);

-- A escrita não falha: ela simplesmente não encontra a linha.
update public.trip_requirements
set completed = true
where id = '4e900000-0000-0000-0000-000000000002';

set local role postgres;

select is(
  (select completed from public.trip_requirements
   where id = '4e900000-0000-0000-0000-000000000002'),
  false,
  'A não marca um item da checklist de B'
);

-- -----------------------------------------------------------------------------
-- S6 — o app não tem tela pública
-- -----------------------------------------------------------------------------
set local role anon;

-- Erro de privilégio, e não uma lista vazia: `anon` não tem GRANT em `trips`,
-- então a policy nem chega a ser avaliada. São as duas camadas que o AGENTS.md
-- pede, e é por isso que o teste espera 42501.
select throws_ok(
  $$ select id from public.trips $$,
  '42501',
  null,
  'anon não alcança a tabela de viagens'
);

set local role postgres;

-- -----------------------------------------------------------------------------
-- B7 / B8 — o índice único só recorta os itens vigentes
-- -----------------------------------------------------------------------------
insert into public.requirement_templates (id, code, title, priority, category, scope)
values ('c0a10000-0000-0000-0000-000000000001', 'teste-unico', 'Item de catálogo',
        'required', 'documents', 'global');

insert into public.trip_requirements
  (trip_id, template_id, country_code, title, priority, category, superseded_at)
values
  ('7a1b0000-0000-0000-0000-000000000001', 'c0a10000-0000-0000-0000-000000000001',
   null, 'Vigente', 'required', 'documents', null);

select lives_ok(
  $$ insert into public.trip_requirements
       (trip_id, template_id, country_code, title, priority, category, superseded_at)
     values ('7a1b0000-0000-0000-0000-000000000001',
             'c0a10000-0000-0000-0000-000000000001',
             null, 'Superado', 'required', 'documents', now()) $$,
  'um item superado convive com o vigente da mesma origem'
);

select throws_ok(
  $$ insert into public.trip_requirements
       (trip_id, template_id, country_code, title, priority, category, superseded_at)
     values ('7a1b0000-0000-0000-0000-000000000001',
             'c0a10000-0000-0000-0000-000000000001',
             null, 'Duplicado', 'required', 'documents', null) $$,
  '23505',
  null,
  'dois itens vigentes da mesma origem continuam proibidos'
);

select * from finish();

rollback;

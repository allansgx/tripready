-- =============================================================================
-- TripReady — o teto de 10 viagens por conta
--
-- A tela avisa antes de abrir o fluxo de criação; aqui é a outra margem, a que
-- vale mesmo com a lista do app desatualizada.
-- =============================================================================

begin;

create extension if not exists pgtap with schema extensions;
set local search_path to extensions, public;

select plan(5);

insert into auth.users (id, email)
values
  ('11111111-1111-1111-1111-111111111111', 'cheia@tripready.test'),
  ('22222222-2222-2222-2222-222222222222', 'vizinha@tripready.test');

set local role authenticated;
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

insert into public.trips (user_id, name, passport_country_code)
select '11111111-1111-1111-1111-111111111111', 'Viagem ' || n, 'BR'
from generate_series(1, 9) as n;

select lives_ok(
  $$ insert into public.trips (user_id, name, passport_country_code)
     values ('11111111-1111-1111-1111-111111111111', 'A décima', 'BR') $$,
  'a décima viagem entra'
);

select throws_ok(
  $$ insert into public.trips (user_id, name, passport_country_code)
     values ('11111111-1111-1111-1111-111111111111', 'A décima primeira', 'BR') $$,
  '42501',
  null,
  'a décima primeira viagem é recusada'
);

-- Conta cheia continua editando o que tem: o teto é só do insert.
select lives_ok(
  $$ update public.trips set name = 'A décima, renomeada'
     where user_id = '11111111-1111-1111-1111-111111111111'
       and name = 'A décima' $$,
  'a conta no teto continua editando as viagens dela'
);

delete from public.trips
where user_id = '11111111-1111-1111-1111-111111111111'
  and name = 'Viagem 1';

select lives_ok(
  $$ insert into public.trips (user_id, name, passport_country_code)
     values ('11111111-1111-1111-1111-111111111111', 'No lugar da excluída', 'BR') $$,
  'excluir uma viagem devolve a vaga'
);

-- -----------------------------------------------------------------------------
-- O teto é por conta
-- -----------------------------------------------------------------------------
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';

select lives_ok(
  $$ insert into public.trips (user_id, name, passport_country_code)
     values ('22222222-2222-2222-2222-222222222222', 'A primeira de B', 'AR') $$,
  'o volume de uma conta não alcança a vizinha'
);

select * from finish();

rollback;

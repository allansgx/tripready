-- =============================================================================
-- TripReady — escritas de passaporte que precisam ser atômicas
--
-- Duas operações do perfil mexem em mais de uma linha de `passports` e, feitas
-- em chamadas separadas pelo PostgREST, deixam o usuário em um estado que
-- ninguém pediu:
--
--   remover o principal  — apagar a linha e promover outra são duas escritas;
--                          entre elas o usuário fica sem principal nenhum, e se
--                          a segunda falhar, fica assim.
--   definir o principal  — `passportsService.setPrimary` limpa o principal
--                          atual e depois marca o novo. A mesma janela, e o
--                          mesmo risco, desde a primeira versão do app.
--
-- Remover o principal passa a ser permitido: com o passaporte escolhido por
-- viagem, o principal é só o valor pré-selecionado na criação, e exigir que a
-- pessoa promova outro antes era uma tarefa sem propósito. O que continua
-- recusado é remover o **último** — o app exige um passaporte no perfil para
-- decidir qualquer coisa sobre uma viagem nova.
--
-- Nenhuma das duas escreve em `trips`. É a garantia central do modelo: a viagem
-- guarda o país do passaporte, não o cadastro, então excluir um passaporte não
-- toca em viagem alguma — nem futura, nem em andamento, nem concluída.
--
-- `security invoker` em ambas: o `select ... for update` só enxerga passaporte
-- do próprio usuário, então passaporte de outra pessoa cai no mesmo TR404 de um
-- id inexistente, sem revelar qual dos dois é.
--
--   TR404  passaporte inacessível
--   TR403  é o último passaporte do perfil
-- =============================================================================

create or replace function public.delete_passport(p_passport_id uuid)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_was_primary boolean;
  v_promoted text;
begin
  select p.user_id, p.is_primary
    into v_user_id, v_was_primary
  from public.passports p
  where p.id = p_passport_id
  for update;

  if not found then
    raise exception 'passaporte inacessível' using errcode = 'TR404';
  end if;

  if (select count(*) from public.passports where user_id = v_user_id) <= 1 then
    raise exception 'último passaporte do perfil' using errcode = 'TR403';
  end if;

  delete from public.passports where id = p_passport_id;

  -- O mais antigo herda a posição: é o passaporte com que a pessoa vem usando
  -- o app há mais tempo. O índice único parcial continua sendo a garantia de
  -- que só existe um principal.
  if v_was_primary then
    update public.passports
    set is_primary = true
    where id = (
      select p.id
      from public.passports p
      where p.user_id = v_user_id
      order by p.created_at, p.id
      limit 1
    )
    returning country_code into v_promoted;
  end if;

  return v_promoted;
end;
$$;

comment on function public.delete_passport(uuid) is
  'Remove um passaporte do perfil e, se ele era o principal, promove o mais '
  'antigo dos restantes na mesma transação. Devolve o país promovido, para a '
  'tela poder avisar, ou nulo quando não houve promoção. Nunca escreve em '
  '`trips`.';

create or replace function public.set_primary_passport(p_passport_id uuid)
returns public.passports
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_row public.passports;
begin
  select p.user_id into v_user_id
  from public.passports p
  where p.id = p_passport_id
  for update;

  if not found then
    raise exception 'passaporte inacessível' using errcode = 'TR404';
  end if;

  update public.passports
  set is_primary = false
  where user_id = v_user_id
    and is_primary
    and id <> p_passport_id;

  update public.passports
  set is_primary = true
  where id = p_passport_id
  returning * into v_row;

  return v_row;
end;
$$;

comment on function public.set_primary_passport(uuid) is
  'Troca o passaporte principal em uma transação, sem a janela sem principal '
  'que duas chamadas separadas deixavam. Não recalcula checklist: o principal '
  'é preferência de perfil e não manda em viagem nenhuma.';

revoke execute on function public.delete_passport(uuid) from public, anon;
grant execute on function public.delete_passport(uuid) to authenticated;

revoke execute on function public.set_primary_passport(uuid) from public, anon;
grant execute on function public.set_primary_passport(uuid) to authenticated;

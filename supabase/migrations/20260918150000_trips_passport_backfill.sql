-- =============================================================================
-- TripReady — preenche o passaporte das viagens que já existem
--
-- Viagem criada antes de `20260918130000_trips_passport.sql` não registrou com
-- que passaporte a checklist dela foi montada: o motor lia o passaporte
-- principal do perfil no instante em que a tela rodava, e não guardava nada.
--
-- Duas passadas, da mais confiável para a menos. A primeira é fato; a segunda é
-- aproximação, e está documentada como tal.
--
-- Uma passada de reparo fecha o arquivo: agora que a viagem sabe o passaporte,
-- dá para reencontrar a regra de visto dos itens que perderam a referência pelo
-- defeito corrigido em `20260918120000_apply_requirement_diff_visa_rule.sql`.
--
-- O gatilho de `updated_at` dispara nas três passadas. É aceito: nenhuma tela
-- lê essa coluna, e este é o único momento do plano em que escrever em viagem
-- existente é justamente o objetivo.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Do rastro real
--
-- Se algum item da checklist veio de uma regra de visto, a regra diz de que
-- passaporte ela é. Isso não é estimativa: é o passaporte que de fato gerou
-- aquele item.
--
-- `order by created_at desc` escolhe o item mais recente quando a viagem tem
-- itens de passaportes diferentes — o que acontece em viagem cujo principal foi
-- trocado, porque o recálculo antigo nunca removia item já verificado. O mais
-- recente é o que reflete a última geração.
--
-- A viagem fica com o país mesmo que o usuário já tenha removido aquele
-- passaporte do perfil. É o resultado certo: ela foi preparada com ele, e a
-- interface vai pedir a escolha de outro por derivação.
-- -----------------------------------------------------------------------------
update public.trips t
set passport_country_code = origem.passport_country_code
from (
  select distinct on (r.trip_id)
    r.trip_id,
    v.passport_country_code
  from public.trip_requirements r
  join public.visa_rules v on v.id = r.visa_rule_id
  order by r.trip_id, r.created_at desc
) as origem
where t.id = origem.trip_id
  and t.passport_country_code is null;

-- -----------------------------------------------------------------------------
-- 2. Do principal atual
--
-- Viagem doméstica, viagem sem destino coberto por regra e viagem cujos itens
-- de visto foram criados pelo caminho defeituoso não deixaram rastro. Para
-- essas, o principal de hoje é a melhor aproximação disponível — e não é uma
-- suposição nova: é exatamente o valor que o app já usava para ler essas
-- viagens antes desta feature.
--
-- `passport_selected_at` continua nulo nas duas passadas. Não se inventa data.
-- -----------------------------------------------------------------------------
update public.trips t
set passport_country_code = p.country_code
from public.passports p
where p.user_id = t.user_id
  and p.is_primary
  and t.passport_country_code is null;

-- -----------------------------------------------------------------------------
-- 3. Reparo da referência à regra de visto
--
-- `apply_requirement_diff` descartava `visa_rule_id` até a migration anterior,
-- então todo item de visto criado pela edição de uma viagem nasceu sem ele. Com
-- o passaporte da viagem conhecido, o par (passaporte, destino) reencontra a
-- regra.
--
-- A igualdade de `requirement_type` é a trava de segurança: só religa o item ao
-- que a regra vigente ainda diz. Se a exigência mudou desde a geração, o item
-- fica como está — apontá-lo para uma regra de outro tipo seria inventar uma
-- informação que ninguém conferiu.
-- -----------------------------------------------------------------------------
update public.trip_requirements r
set visa_rule_id = v.id
from public.requirement_templates tpl,
     public.trips t,
     public.visa_rules v
where r.template_id = tpl.id
  and r.visa_rule_id is null
  and r.country_code is not null
  and tpl.scope = 'visa'
  and t.id = r.trip_id
  and t.passport_country_code is not null
  and v.passport_country_code = t.passport_country_code
  and v.destination_country_code = r.country_code
  and v.requirement_type = tpl.visa_requirement_type;

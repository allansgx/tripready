-- =============================================================================
-- TripReady — viagem doméstica ou internacional no catálogo
--
-- O catálogo sabia dizer para quem uma regra vale (`passport_country_code`),
-- quando ela vale (`season`, `valid_from`/`valid_until`) e por onde ela chega à
-- viagem (`scope`) — mas não sabia dizer que ela só existe quando há uma
-- fronteira internacional no caminho.
--
-- A consequência: uma viagem de quem tem passaporte brasileiro para um destino
-- no Brasil recebia "Passaporte válido para toda a viagem" e "Conferir as
-- exigências de entrada — Brasil". Nenhum dos dois cabe em voo doméstico.
--
-- Esta coluna é a condição que faltava, no mesmo formato das que já existem:
-- opcional, avaliada no motor, nula por padrão. Nada no catálogo atual muda de
-- comportamento sem ser marcado abaixo.
--
-- O tipo pode ser criado e usado no mesmo arquivo: a restrição do Postgres que
-- motivou `20260906130000_requirement_scope_visa.sql` vale para
-- `alter type ... add value`, não para `create type`.
-- =============================================================================

create type public.trip_kind as enum ('domestic', 'international');

comment on type public.trip_kind is
  'Natureza da viagem, derivada da comparação entre os destinos e o passaporte '
  'principal do viajante. Nunca é armazenada em `trips`: uma viagem é doméstica '
  'enquanto todos os seus destinos forem o país do passaporte, e deixa de ser '
  'no instante em que um destino estrangeiro entra.';

alter table public.requirement_templates
  add column trip_kind public.trip_kind;

comment on column public.requirement_templates.trip_kind is
  'Condição opcional de natureza da viagem. Nulo = vale para as duas, que é o '
  'padrão e o comportamento de toda regra já cadastrada. `international` = só '
  'quando há travessia de fronteira. `domestic` = só dentro do próprio país.';

-- -----------------------------------------------------------------------------
-- Marcação das regras que pressupõem fronteira
--
-- Passaporte e exigências de entrada são as duas causas diretas do bug.
--
-- O limite de permanência no Espaço Schengen entra por precaução: nenhum
-- passaporte torna o bloco doméstico hoje, mas a marcação vira a convenção para
-- as próximas regras de grupo — uma regra do MERCOSUL, por exemplo, alcançaria
-- uma viagem inteiramente brasileira se ninguém a marcasse.
--
-- Os itens de visto são redundantes: `visa_rules_not_self` já impede uma regra
-- de um país para ele mesmo, então eles nunca apareceriam em viagem doméstica.
-- Marcá-los declara a intenção em vez de deixá-la dependendo de uma constraint
-- de outra tabela.
--
-- O que fica sem marcação continua valendo para as duas: seguro, dinheiro,
-- orçamento, bagagem, conectividade e cópias de documento são bons conselhos em
-- qualquer viagem, e reescrever seus textos é outro assunto.
-- -----------------------------------------------------------------------------
update public.requirement_templates
set trip_kind = 'international'
where code in (
  'passport-validity',
  'country-entry-requirements',
  'schengen-short-stay',
  'visa-required',
  'visa-evisa',
  'visa-eta',
  'visa-on-arrival',
  'visa-free',
  'visa-conditional'
);

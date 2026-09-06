-- =============================================================================
-- TripReady — ligação entre o template e o tipo de visto
--
-- Um template de escopo `visa` precisa dizer *a qual resultado* ele responde:
-- o texto de "solicitar o visto de entrada" não serve para quem entra sem
-- visto. Esta coluna é esse endereço, e é por ela que `visa_rules` e
-- `requirement_templates` se encontram na geração da checklist.
--
-- Um template por tipo, e não um por par de países: é o que mantém a promessa
-- de que adicionar um passaporte novo é só adicionar regras.
--
-- Depende de `20260906130000_requirement_scope_visa.sql`, que acrescentou o
-- valor `visa` ao enum de escopo em transação própria — o check abaixo o
-- utiliza, e por isso não poderia estar no mesmo arquivo.
-- =============================================================================

alter table public.requirement_templates
  add column visa_requirement_type public.visa_requirement_type;

comment on column public.requirement_templates.visa_requirement_type is
  'Resultado de visto ao qual este template responde. Preenchido apenas em '
  'templates de escopo `visa`.';

-- Amarra os dois lados: escopo `visa` exige o tipo, e o tipo só existe nesse
-- escopo. Sem isso caberia um template `global` com um tipo de visto pendurado
-- que nada leria, ou um template `visa` sem tipo que nunca casaria com regra
-- nenhuma — os dois erros silenciosos, descobertos só pela checklist vindo
-- errada.
alter table public.requirement_templates
  add constraint requirement_templates_visa_scope_check check (
    (scope = 'visa') = (visa_requirement_type is not null)
  );

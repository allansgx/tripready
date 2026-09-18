-- =============================================================================
-- TripReady — origem do item na regra de visto
--
-- `trip_requirements` já sabe de que template e grupo um item veio
-- (`20260906120000_requirement_catalog.sql`), mas não de qual linha de
-- `visa_rules` — a fonte oficial da observação foi copiada em `source_name`/
-- `source_url` (`20260906130100_visa_rules.sql`) e nunca mais reencontrada.
--
-- Sem essa referência, a leitura traduzida do item (§8.3 do plano de i18n) não
-- tem como buscar `visa_rule_translations.notes`: precisaria adivinhar a linha
-- de `visa_rules` a partir de `(passport_country_code, country_code)`, que pode
-- ter mudado desde a geração da checklist.
-- =============================================================================

alter table public.trip_requirements
  add column visa_rule_id uuid references public.visa_rules (id) on delete set null;

comment on column public.trip_requirements.visa_rule_id is
  'Regra de visto que originou o item, quando veio de uma. Nulo nos demais '
  'itens. Permite reencontrar a observação oficial traduzida na leitura, sem '
  'mudar `title`/`description`, que continuam gravados em pt-BR.';

create index trip_requirements_visa_rule_id_idx
  on public.trip_requirements (visa_rule_id)
  where visa_rule_id is not null;

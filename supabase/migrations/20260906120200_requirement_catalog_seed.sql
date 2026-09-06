-- =============================================================================
-- TripReady — carga inicial do catálogo
--
-- Duas coisas acontecem aqui:
--   1. os grupos de aplicabilidade e seus membros, a partir de fontes oficiais;
--   2. os requisitos que estavam fixos no app, migrados sem reescrever textos.
--
-- Sobre as datas: `valid_from` só é preenchido quando a data oficial é
-- conhecida. Onde a fonte não dá o dia exato, a coluna fica nula — um grupo sem
-- data de entrada continua valendo para qualquer viagem, que é o comportamento
-- correto, enquanto uma data estimada seria uma informação inventada.
--
-- Sobre as regras: pertencer a um grupo não gera requisito. Só o Espaço
-- Schengen recebe uma regra nesta carga, porque o limite de permanência é
-- definido em norma única para todos os membros. Os demais grupos entram como
-- estrutura, prontos para receber regras quando houver fonte oficial que valha
-- para o grupo inteiro.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Grupos
-- -----------------------------------------------------------------------------
insert into public.destination_groups (code, name, description, source_name, source_url)
values
  (
    'SCHENGEN',
    'Espaço Schengen',
    'Área de livre circulação com regras comuns de entrada e de permanência de curta duração.',
    'Comissão Europeia — Espaço Schengen',
    'https://home-affairs.ec.europa.eu/policies/schengen-borders-and-visa/schengen-area_en'
  ),
  (
    'MERCOSUL',
    'MERCOSUL',
    'Mercado Comum do Sul. Estados Partes; membros suspensos ficam com período de validade encerrado.',
    'MERCOSUR — Países do MERCOSUL',
    'https://www.mercosur.int/quienes-somos/paises-del-mercosur/'
  ),
  (
    'CAN',
    'Comunidade Andina',
    'Comunidade Andina de Nações (CAN), criada pelo Acordo de Cartagena.',
    'Comunidad Andina — Quiénes somos',
    'https://www.comunidadandina.org/quienes-somos/'
  ),
  (
    'CA4',
    'CA-4',
    'Acordo de livre mobilidade entre Guatemala, El Salvador, Honduras e Nicarágua.',
    'SICA — Sistema da Integração Centro-Americana',
    'https://www.sica.int/'
  ),
  (
    'ASEAN',
    'ASEAN',
    'Associação de Nações do Sudeste Asiático.',
    'ASEAN — Member States',
    'https://asean.org/member-states/'
  ),
  (
    'EAC',
    'Comunidade da África Oriental',
    'East African Community (EAC).',
    'EAC — Partner States',
    'https://www.eac.int/eac-partner-states'
  ),
  (
    'ECOWAS',
    'CEDEAO',
    'Comunidade Econômica dos Estados da África Ocidental (ECOWAS/CEDEAO).',
    'ECOWAS — Member States',
    'https://ecowas.int/member-states/'
  ),
  (
    'GCC',
    'Conselho de Cooperação do Golfo',
    'Gulf Cooperation Council (GCC).',
    'GCC — Secretaria-Geral',
    'https://www.gcc-sg.org/'
  ),
  (
    'PACIFIC_ALLIANCE',
    'Aliança do Pacífico',
    'Bloco de integração entre Chile, Colômbia, México e Peru.',
    'Alianza del Pacífico',
    'https://alianzapacifico.net/'
  ),
  (
    'CARICOM',
    'CARICOM',
    'Comunidade do Caribe.',
    'CARICOM — Member States',
    'https://caricom.org/member-states-and-associate-members/'
  );

-- -----------------------------------------------------------------------------
-- Membros dos grupos — ISO 3166-1 alpha-2
-- -----------------------------------------------------------------------------
insert into public.destination_group_members (group_id, country_code, valid_from, valid_until)
select g.id, m.country_code, m.valid_from, m.valid_until
from (
  values
    -- Espaço Schengen: 29 Estados. As datas são as de entrada em aplicação
    -- plena do acervo Schengen para cada país.
    ('SCHENGEN', 'BE', date '1995-03-26', null::date),
    ('SCHENGEN', 'FR', date '1995-03-26', null::date),
    ('SCHENGEN', 'DE', date '1995-03-26', null::date),
    ('SCHENGEN', 'LU', date '1995-03-26', null::date),
    ('SCHENGEN', 'NL', date '1995-03-26', null::date),
    ('SCHENGEN', 'PT', date '1995-03-26', null::date),
    ('SCHENGEN', 'ES', date '1995-03-26', null::date),
    ('SCHENGEN', 'IT', date '1997-10-26', null::date),
    ('SCHENGEN', 'AT', date '1997-12-01', null::date),
    ('SCHENGEN', 'GR', date '2000-01-26', null::date),
    ('SCHENGEN', 'DK', date '2001-03-25', null::date),
    ('SCHENGEN', 'FI', date '2001-03-25', null::date),
    ('SCHENGEN', 'SE', date '2001-03-25', null::date),
    ('SCHENGEN', 'IS', date '2001-03-25', null::date),
    ('SCHENGEN', 'NO', date '2001-03-25', null::date),
    ('SCHENGEN', 'CZ', date '2007-12-21', null::date),
    ('SCHENGEN', 'EE', date '2007-12-21', null::date),
    ('SCHENGEN', 'HU', date '2007-12-21', null::date),
    ('SCHENGEN', 'LV', date '2007-12-21', null::date),
    ('SCHENGEN', 'LT', date '2007-12-21', null::date),
    ('SCHENGEN', 'MT', date '2007-12-21', null::date),
    ('SCHENGEN', 'PL', date '2007-12-21', null::date),
    ('SCHENGEN', 'SK', date '2007-12-21', null::date),
    ('SCHENGEN', 'SI', date '2007-12-21', null::date),
    ('SCHENGEN', 'CH', date '2008-12-12', null::date),
    ('SCHENGEN', 'LI', date '2011-12-19', null::date),
    ('SCHENGEN', 'HR', date '2023-01-01', null::date),
    ('SCHENGEN', 'BG', date '2025-01-01', null::date),
    ('SCHENGEN', 'RO', date '2025-01-01', null::date),

    -- MERCOSUL: Estados Partes. A Venezuela entra com validade encerrada
    -- porque está suspensa desde dezembro de 2016.
    ('MERCOSUL', 'AR', date '1991-03-26', null::date),
    ('MERCOSUL', 'BR', date '1991-03-26', null::date),
    ('MERCOSUL', 'PY', date '1991-03-26', null::date),
    ('MERCOSUL', 'UY', date '1991-03-26', null::date),
    ('MERCOSUL', 'BO', date '2024-07-08', null::date),
    ('MERCOSUL', 'VE', date '2012-08-12', date '2016-12-01'),

    -- Comunidade Andina: Acordo de Cartagena.
    ('CAN', 'BO', date '1969-05-26', null::date),
    ('CAN', 'CO', date '1969-05-26', null::date),
    ('CAN', 'EC', date '1969-05-26', null::date),
    ('CAN', 'PE', date '1969-05-26', null::date),

    -- CA-4: acordo de livre mobilidade em vigor desde 2006; o dia exato não
    -- consta da fonte usada, então `valid_from` fica nulo.
    ('CA4', 'GT', null::date, null::date),
    ('CA4', 'SV', null::date, null::date),
    ('CA4', 'HN', null::date, null::date),
    ('CA4', 'NI', null::date, null::date),

    -- ASEAN: 11 membros desde a entrada de Timor-Leste.
    ('ASEAN', 'ID', date '1967-08-08', null::date),
    ('ASEAN', 'MY', date '1967-08-08', null::date),
    ('ASEAN', 'PH', date '1967-08-08', null::date),
    ('ASEAN', 'SG', date '1967-08-08', null::date),
    ('ASEAN', 'TH', date '1967-08-08', null::date),
    ('ASEAN', 'BN', date '1984-01-07', null::date),
    ('ASEAN', 'VN', date '1995-07-28', null::date),
    ('ASEAN', 'LA', date '1997-07-23', null::date),
    ('ASEAN', 'MM', date '1997-07-23', null::date),
    ('ASEAN', 'KH', date '1999-04-30', null::date),
    ('ASEAN', 'TL', date '2025-10-26', null::date),

    -- EAC: 8 Estados Parceiros. Datas de adesão de Sudão do Sul, RD Congo e
    -- Somália ficam nulas por falta de dia exato na fonte.
    ('EAC', 'KE', date '2000-07-07', null::date),
    ('EAC', 'TZ', date '2000-07-07', null::date),
    ('EAC', 'UG', date '2000-07-07', null::date),
    ('EAC', 'RW', date '2007-07-01', null::date),
    ('EAC', 'BI', date '2007-07-01', null::date),
    ('EAC', 'SS', null::date, null::date),
    ('EAC', 'CD', null::date, null::date),
    ('EAC', 'SO', null::date, null::date),

    -- CEDEAO: Burkina Faso, Mali e Níger deixaram o bloco em 29/01/2025.
    ('ECOWAS', 'BJ', date '1975-05-28', null::date),
    ('ECOWAS', 'CI', date '1975-05-28', null::date),
    ('ECOWAS', 'GM', date '1975-05-28', null::date),
    ('ECOWAS', 'GH', date '1975-05-28', null::date),
    ('ECOWAS', 'GN', date '1975-05-28', null::date),
    ('ECOWAS', 'GW', date '1975-05-28', null::date),
    ('ECOWAS', 'LR', date '1975-05-28', null::date),
    ('ECOWAS', 'NG', date '1975-05-28', null::date),
    ('ECOWAS', 'SN', date '1975-05-28', null::date),
    ('ECOWAS', 'SL', date '1975-05-28', null::date),
    ('ECOWAS', 'TG', date '1975-05-28', null::date),
    ('ECOWAS', 'CV', null::date, null::date),
    ('ECOWAS', 'BF', date '1975-05-28', date '2025-01-29'),
    ('ECOWAS', 'ML', date '1975-05-28', date '2025-01-29'),
    ('ECOWAS', 'NE', date '1975-05-28', date '2025-01-29'),

    -- Conselho de Cooperação do Golfo.
    ('GCC', 'BH', date '1981-05-25', null::date),
    ('GCC', 'KW', date '1981-05-25', null::date),
    ('GCC', 'OM', date '1981-05-25', null::date),
    ('GCC', 'QA', date '1981-05-25', null::date),
    ('GCC', 'SA', date '1981-05-25', null::date),
    ('GCC', 'AE', date '1981-05-25', null::date),

    -- Aliança do Pacífico: Declaração de Lima.
    ('PACIFIC_ALLIANCE', 'CL', date '2011-04-28', null::date),
    ('PACIFIC_ALLIANCE', 'CO', date '2011-04-28', null::date),
    ('PACIFIC_ALLIANCE', 'MX', date '2011-04-28', null::date),
    ('PACIFIC_ALLIANCE', 'PE', date '2011-04-28', null::date),

    -- CARICOM: 15 membros plenos. As adesões de 1974 ficam sem data por não
    -- haver dia exato na fonte.
    ('CARICOM', 'BB', date '1973-08-01', null::date),
    ('CARICOM', 'GY', date '1973-08-01', null::date),
    ('CARICOM', 'JM', date '1973-08-01', null::date),
    ('CARICOM', 'TT', date '1973-08-01', null::date),
    ('CARICOM', 'AG', null::date, null::date),
    ('CARICOM', 'BZ', null::date, null::date),
    ('CARICOM', 'DM', null::date, null::date),
    ('CARICOM', 'GD', null::date, null::date),
    ('CARICOM', 'MS', null::date, null::date),
    ('CARICOM', 'KN', null::date, null::date),
    ('CARICOM', 'LC', null::date, null::date),
    ('CARICOM', 'VC', null::date, null::date),
    ('CARICOM', 'BS', date '1983-07-04', null::date),
    ('CARICOM', 'SR', date '1995-07-04', null::date),
    ('CARICOM', 'HT', date '2002-07-02', null::date)
) as m (group_code, country_code, valid_from, valid_until)
join public.destination_groups g on g.code = m.group_code;

-- -----------------------------------------------------------------------------
-- Requisitos migrados do app
--
-- Textos idênticos aos que estavam em `checklist-catalog.ts`. Nenhum requisito
-- novo foi criado nesta migração.
--
-- `source_name`/`source_url` ficam nulos nos itens de preparação (seguro,
-- bagagem, dinheiro, conectividade): são passos de organização da viagem, não
-- obrigações legais, e não têm fonte oficial a citar. O item de exigências de
-- entrada é justamente o lembrete de consultar a fonte oficial do destino, que
-- varia por país e entra depois como regra de escopo `country`.
-- -----------------------------------------------------------------------------
insert into public.requirement_templates (
  code, title, description, priority, category, scope, passport_country_code,
  source_name, source_url
)
values
  (
    'passport-validity',
    'Passaporte válido para toda a viagem',
    'Confira a data de validade e se ainda há páginas em branco.',
    'required', 'documents', 'global', null,
    null, null
  ),
  (
    'country-entry-requirements',
    'Conferir as exigências de entrada — {country}',
    'Documentos, vistos e comprovantes pedidos na chegada.',
    'required', 'documents', 'each_country', null,
    null, null
  ),
  (
    'document-copies',
    'Guardar cópias digitais dos documentos',
    'Deixe passaporte e reservas acessíveis mesmo sem internet.',
    'recommended', 'documents', 'global', null,
    null, null
  ),
  (
    'travel-insurance',
    'Contratar seguro viagem',
    'Compare a cobertura médica e o período da apólice.',
    'recommended', 'health', 'global', null,
    null, null
  ),
  -- O texto original cita um contato no Brasil, então a regra passa a valer
  -- para quem viaja com passaporte brasileiro. Generalizá-la exigiria
  -- reescrever o requisito, e reescrever não é migrar.
  (
    'emergency-contacts',
    'Anotar contatos de emergência',
    'Consulado, seguradora e um contato no Brasil.',
    'informational', 'health', 'global', 'BR',
    null, null
  ),
  (
    'payment-methods',
    'Organizar meios de pagamento',
    'Leve mais de uma opção e avise o banco sobre a viagem.',
    'recommended', 'money', 'global', null,
    null, null
  ),
  (
    'budget-plan',
    'Planejar o orçamento da viagem',
    'Hospedagem, transporte, alimentação e um extra de reserva.',
    'informational', 'money', 'global', null,
    null, null
  ),
  (
    'connectivity-plan',
    'Resolver internet no destino',
    'Plano internacional, eSIM ou chip local.',
    'recommended', 'connectivity', 'global', null,
    null, null
  ),
  (
    'luggage-list',
    'Montar a lista de bagagem',
    'Roupas conforme a estação, adaptador de tomada e remédios de uso.',
    'recommended', 'luggage', 'global', null,
    null, null
  ),
  (
    'airline-luggage-rules',
    'Conferir as regras de bagagem da companhia',
    'Peso, dimensões e itens que não podem ir na mão.',
    'informational', 'luggage', 'global', null,
    null, null
  );

-- -----------------------------------------------------------------------------
-- Primeira regra de grupo
--
-- O limite de permanência de curta duração vale para o Espaço Schengen como um
-- todo, e não por país: é exatamente o caso em que um único item na checklist
-- representa vários destinos.
-- -----------------------------------------------------------------------------
insert into public.requirement_templates (
  code, title, description, priority, category, scope, source_name, source_url
)
values
  (
    'schengen-short-stay',
    'Conferir o limite de 90 dias a cada 180 no Espaço Schengen',
    'A permanência de curta duração soma os dias passados em todos os países do Espaço Schengen.',
    'required',
    'documents',
    'group',
    'Comissão Europeia — Espaço Schengen',
    'https://home-affairs.ec.europa.eu/policies/schengen-borders-and-visa/schengen-area_en'
  );

insert into public.requirement_template_groups (requirement_template_id, group_id)
select t.id, g.id
from public.requirement_templates t
join public.destination_groups g on g.code = 'SCHENGEN'
where t.code = 'schengen-short-stay';

-- -----------------------------------------------------------------------------
-- Viagens que já existem
--
-- As checklists já criadas continuam como estão; só ganham a referência à regra
-- que as originou. Sem isso, a próxima edição da viagem veria os itens como
-- ausentes e criaria uma segunda cópia de cada um.
-- -----------------------------------------------------------------------------
update public.trip_requirements r
set template_id = t.id
from public.requirement_templates t
where r.template_id is null
  and r.country_code is null
  and r.title = t.title
  and t.scope = 'global';

update public.trip_requirements r
set template_id = t.id
from public.requirement_templates t
where r.template_id is null
  and r.country_code is not null
  and t.code = 'country-entry-requirements'
  and r.title like 'Conferir as exigências de entrada — %';

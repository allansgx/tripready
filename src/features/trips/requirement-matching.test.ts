import assert from 'node:assert/strict';
import test from 'node:test';

import {
  diffTripRequirements,
  groupRequirementsByScope,
  resolveTripRequirements,
  seasonAt,
  seasonsInRange,
  tripSeasons,
  type CatalogGroup,
  type CatalogTemplate,
  type TripContext,
  type VisaRule,
} from './requirement-matching.ts';

/**
 * Testes da regra de aplicabilidade dos requisitos.
 *
 * Rodam com `pnpm test`, sem bundler e sem banco: o módulo testado é puro, e o
 * catálogo abaixo é fabricado aqui justamente para os casos não dependerem dos
 * dados reais do Supabase — mudar um seed não deve quebrar a regra.
 */

const TODAY = '2026-09-06';

const schengen: CatalogGroup = {
  id: 'g-schengen',
  code: 'SCHENGEN',
  name: 'Espaço Schengen',
  members: [
    { countryCode: 'HU', validFrom: '2007-12-21', validUntil: null },
    { countryCode: 'AT', validFrom: '1997-12-01', validUntil: null },
    { countryCode: 'CZ', validFrom: '2007-12-21', validUntil: null },
  ],
};

const ecowas: CatalogGroup = {
  id: 'g-ecowas',
  code: 'ECOWAS',
  name: 'CEDEAO',
  members: [
    { countryCode: 'NG', validFrom: '1975-05-28', validUntil: null },
    // Saiu do bloco: não deve mais puxar regra de grupo.
    { countryCode: 'ML', validFrom: '1975-05-28', validUntil: '2025-01-29' },
  ],
};

function template(overrides: Partial<CatalogTemplate> & Pick<CatalogTemplate, 'id'>) {
  return {
    code: overrides.id,
    title: 'Requisito',
    description: null,
    priority: 'required',
    category: 'documents',
    scope: 'global',
    season: null,
    passportCountryCode: null,
    visaRequirementType: null,
    validFrom: null,
    validUntil: null,
    active: true,
    groupIds: [],
    countryCodes: [],
    ...overrides,
  } satisfies CatalogTemplate;
}

function visaRule(
  overrides: Partial<VisaRule> &
    Pick<VisaRule, 'passportCountryCode' | 'destinationCountryCode' | 'requirementType'>,
): VisaRule {
  return {
    sourceName: 'Órgão oficial',
    sourceUrl: 'https://exemplo.gov/vistos',
    notes: null,
    validFrom: null,
    validUntil: null,
    ...overrides,
  };
}

function trip(overrides: Partial<TripContext> = {}): TripContext {
  return {
    tripId: 'trip-1',
    countryCodes: ['HU', 'AT', 'CZ'],
    startDate: '2026-12-10',
    endDate: '2026-12-20',
    passportCountryCode: 'BR',
    ...overrides,
  };
}

/**
 * Completa o catálogo com o que o caso não declara, para cada teste citar
 * apenas a parte que exercita — um caso de estação não precisa dizer que a
 * viagem não tem regra de visto.
 */
function resolve(
  catalog: {
    groups?: readonly CatalogGroup[];
    templates: readonly CatalogTemplate[];
    visaRules?: readonly VisaRule[];
  },
  context: TripContext = trip(),
) {
  return resolveTripRequirements(
    context,
    {
      groups: catalog.groups ?? [],
      templates: catalog.templates,
      visaRules: catalog.visaRules ?? [],
    },
    { countryName: (code) => `País ${code}`, today: TODAY },
  );
}

test('requisito global entra uma única vez, mesmo com vários países', () => {
  const catalog = {
    groups: [schengen],
    templates: [template({ id: 'passport', title: 'Passaporte válido' })],
  };

  const items = resolve(catalog);

  assert.equal(items.length, 1);
  assert.equal(items[0].title, 'Passaporte válido');
  assert.equal(items[0].country_code, null);
  assert.equal(items[0].group_id, null);
});

test('requisito de grupo entra uma vez para vários países do mesmo grupo', () => {
  const catalog = {
    groups: [schengen],
    templates: [
      template({
        id: 'schengen-stay',
        title: 'Conferir o limite de 90 dias a cada 180',
        scope: 'group',
        groupIds: ['g-schengen'],
      }),
    ],
  };

  const items = resolve(catalog);

  assert.equal(items.length, 1);
  assert.equal(items[0].group_id, 'g-schengen');
  assert.equal(items[0].country_code, null);
});

test('requisito de grupo não entra quando nenhum país da viagem é membro', () => {
  const catalog = {
    groups: [schengen, ecowas],
    templates: [template({ id: 'ecowas-rule', scope: 'group', groupIds: ['g-ecowas'] })],
  };

  assert.deepEqual(resolve(catalog), []);
});

test('país que saiu do grupo não puxa mais a regra do grupo', () => {
  const catalog = {
    groups: [ecowas],
    templates: [template({ id: 'ecowas-rule', scope: 'group', groupIds: ['g-ecowas'] })],
  };

  const withFormerMember = resolve(catalog, trip({ countryCodes: ['ML'] }));
  const withMember = resolve(catalog, trip({ countryCodes: ['NG'] }));

  assert.deepEqual(withFormerMember, []);
  assert.equal(withMember.length, 1);
});

test('requisito de país entra somente para o país correto', () => {
  const catalog = {
    groups: [schengen],
    templates: [
      template({
        id: 'hu-rule',
        title: 'Regra da Hungria',
        scope: 'country',
        countryCodes: ['HU'],
      }),
    ],
  };

  const items = resolve(catalog);

  assert.equal(items.length, 1);
  assert.equal(items[0].country_code, 'HU');
});

test('requisito por país gera um item por destino, com o nome no título', () => {
  const catalog = {
    groups: [],
    templates: [
      template({
        id: 'entry',
        title: 'Conferir as exigências de entrada — {country}',
        scope: 'each_country',
      }),
    ],
  };

  const items = resolve(catalog);

  assert.deepEqual(
    items.map((item) => item.title),
    [
      'Conferir as exigências de entrada — País HU',
      'Conferir as exigências de entrada — País AT',
      'Conferir as exigências de entrada — País CZ',
    ],
  );
});

test('requisito sazonal respeita a estação no hemisfério do destino', () => {
  const catalog = {
    groups: [],
    templates: [template({ id: 'winter-clothes', title: 'Roupa de frio', season: 'winter' })],
  };

  // Dezembro na Europa é inverno; no Brasil, verão.
  const europe = resolve(catalog, trip({ countryCodes: ['AT'] }));
  const brazil = resolve(catalog, trip({ countryCodes: ['BR'] }));

  assert.equal(europe.length, 1);
  assert.deepEqual(brazil, []);
});

test('requisito sazonal não entra em viagem sem data de início', () => {
  const catalog = {
    groups: [],
    templates: [template({ id: 'winter-clothes', season: 'winter' })],
  };

  assert.deepEqual(resolve(catalog, trip({ startDate: null, endDate: null })), []);
});

test('requisito condicionado ao passaporte respeita o passaporte', () => {
  const catalog = {
    groups: [],
    templates: [
      template({ id: 'br-contacts', title: 'Contatos no Brasil', passportCountryCode: 'BR' }),
    ],
  };

  assert.equal(resolve(catalog, trip({ passportCountryCode: 'BR' })).length, 1);
  assert.deepEqual(resolve(catalog, trip({ passportCountryCode: 'PT' })), []);
  assert.deepEqual(resolve(catalog, trip({ passportCountryCode: null })), []);
});

test('regra inativa ou fora do período de validade não vira requisito', () => {
  const catalog = {
    groups: [],
    templates: [
      template({ id: 'inactive', active: false }),
      template({ id: 'expired', validUntil: '2020-01-01' }),
      template({ id: 'future', validFrom: '2030-01-01' }),
      template({ id: 'current' }),
    ],
  };

  const items = resolve(catalog, trip({ startDate: null, endDate: null }));

  assert.deepEqual(
    items.map((item) => item.template_id),
    ['current'],
  );
});

test('a validade é avaliada na data da viagem, não na de hoje', () => {
  const catalog = {
    groups: [],
    templates: [template({ id: 'from-2026-11', validFrom: '2026-11-01' })],
  };

  assert.equal(resolve(catalog, trip({ startDate: '2026-12-10' })).length, 1);
  assert.deepEqual(resolve(catalog, trip({ startDate: '2026-10-01' })), []);
});

// =============================================================================
// Regras de visto
//
// O catálogo destes casos tem sempre os dois lados: o template de escopo `visa`
// diz como o item aparece, e a regra diz o que vale para aquele par
// (passaporte, destino). Nenhum caso depende dos dados reais do Supabase.
// =============================================================================

/** Templates de apresentação, um por resultado de visto. */
const visaTemplates = [
  template({
    id: 'visa-required',
    title: 'Solicitar o visto de entrada — {country}',
    description: 'Confira o prazo de emissão.',
    scope: 'visa',
    visaRequirementType: 'visa_required',
  }),
  template({
    id: 'visa-free',
    title: 'Entrada sem visto — {country}',
    priority: 'informational',
    scope: 'visa',
    visaRequirementType: 'visa_free',
  }),
];

test('destino com visto exigido vira item do país, com a fonte oficial junto', () => {
  const items = resolve(
    {
      templates: visaTemplates,
      visaRules: [
        visaRule({
          passportCountryCode: 'BR',
          destinationCountryCode: 'CZ',
          requirementType: 'visa_required',
          sourceName: 'Imigração da Tchéquia',
          sourceUrl: 'https://exemplo.gov.cz/vistos',
        }),
      ],
    },
    trip({ countryCodes: ['HU', 'CZ'] }),
  );

  assert.equal(items.length, 1);
  assert.equal(items[0].country_code, 'CZ');
  assert.equal(items[0].title, 'Solicitar o visto de entrada — País CZ');
  assert.equal(items[0].priority, 'required');
  assert.equal(items[0].source_name, 'Imigração da Tchéquia');
  assert.equal(items[0].source_url, 'https://exemplo.gov.cz/vistos');
});

test('cada resultado de visto usa o seu próprio template', () => {
  const items = resolve(
    {
      templates: visaTemplates,
      visaRules: [
        visaRule({
          passportCountryCode: 'BR',
          destinationCountryCode: 'CZ',
          requirementType: 'visa_required',
        }),
        visaRule({
          passportCountryCode: 'BR',
          destinationCountryCode: 'HU',
          requirementType: 'visa_free',
        }),
      ],
    },
    trip({ countryCodes: ['HU', 'CZ'] }),
  );

  assert.deepEqual(
    items.map((item) => [item.country_code, item.priority]),
    [
      ['CZ', 'required'],
      ['HU', 'informational'],
    ],
  );
});

test('a observação da regra vira a descrição do item', () => {
  const [semNota, comNota] = [null, 'Permanência de até 90 dias para turismo.'].map(
    (notes) =>
      resolve(
        {
          templates: visaTemplates,
          visaRules: [
            visaRule({
              passportCountryCode: 'BR',
              destinationCountryCode: 'CZ',
              requirementType: 'visa_required',
              notes,
            }),
          ],
        },
        trip({ countryCodes: ['CZ'] }),
      )[0],
  );

  // Sem observação vale o texto do template; com observação, o texto oficial.
  assert.equal(semNota.description, 'Confira o prazo de emissão.');
  assert.equal(comNota.description, 'Permanência de até 90 dias para turismo.');
});

test('destino sem regra cadastrada não gera item de visto', () => {
  const items = resolve(
    {
      templates: visaTemplates,
      visaRules: [
        visaRule({
          passportCountryCode: 'BR',
          destinationCountryCode: 'CZ',
          requirementType: 'visa_required',
        }),
      ],
    },
    trip({ countryCodes: ['HU'] }),
  );

  // O silêncio não vira "não precisa de visto": simplesmente não há item.
  assert.deepEqual(items, []);
});

test('sem passaporte principal nenhuma regra de visto se aplica', () => {
  const items = resolve(
    {
      templates: visaTemplates,
      visaRules: [
        visaRule({
          passportCountryCode: 'BR',
          destinationCountryCode: 'CZ',
          requirementType: 'visa_required',
        }),
      ],
    },
    trip({ countryCodes: ['CZ'], passportCountryCode: null }),
  );

  assert.deepEqual(items, []);
});

/**
 * O teste que sustenta a promessa da arquitetura: o mesmo destino, o mesmo
 * catálogo de templates e o mesmo motor produzem itens diferentes só porque o
 * passaporte é outro. Acrescentar um país de passaporte é acrescentar regras.
 */
test('o mesmo destino gera itens diferentes conforme o passaporte', () => {
  const catalog = {
    templates: visaTemplates,
    visaRules: [
      visaRule({
        passportCountryCode: 'BR',
        destinationCountryCode: 'CZ',
        requirementType: 'visa_required',
      }),
      visaRule({
        passportCountryCode: 'PT',
        destinationCountryCode: 'CZ',
        requirementType: 'visa_free',
      }),
    ],
  };

  const brasileiro = resolve(catalog, trip({ countryCodes: ['CZ'], passportCountryCode: 'BR' }));
  const portugues = resolve(catalog, trip({ countryCodes: ['CZ'], passportCountryCode: 'PT' }));

  assert.deepEqual(
    [brasileiro[0].title, brasileiro[0].priority],
    ['Solicitar o visto de entrada — País CZ', 'required'],
  );
  assert.deepEqual(
    [portugues[0].title, portugues[0].priority],
    ['Entrada sem visto — País CZ', 'informational'],
  );
});

test('regra fora do período de vigência não gera item', () => {
  const catalog = {
    templates: visaTemplates,
    visaRules: [
      visaRule({
        passportCountryCode: 'BR',
        destinationCountryCode: 'CZ',
        requirementType: 'visa_required',
        validFrom: '2026-11-01',
        validUntil: '2026-11-30',
      }),
    ],
  };

  const dentro = resolve(catalog, trip({ countryCodes: ['CZ'], startDate: '2026-11-10' }));
  const depois = resolve(catalog, trip({ countryCodes: ['CZ'], startDate: '2026-12-10' }));

  assert.equal(dentro.length, 1);
  assert.deepEqual(depois, []);
});

test('template de escopo `visa` sem tipo não gera item', () => {
  const items = resolve(
    {
      templates: [template({ id: 'visa-sem-tipo', scope: 'visa' })],
      visaRules: [
        visaRule({
          passportCountryCode: 'BR',
          destinationCountryCode: 'CZ',
          requirementType: 'visa_required',
        }),
      ],
    },
    trip({ countryCodes: ['CZ'] }),
  );

  assert.deepEqual(items, []);
});

test('o item de visto sai da checklist quando o país deixa a viagem', () => {
  const catalog = {
    templates: visaTemplates,
    visaRules: [
      visaRule({
        passportCountryCode: 'BR',
        destinationCountryCode: 'CZ',
        requirementType: 'visa_required',
      }),
    ],
  };

  const current = resolve(catalog, trip({ countryCodes: ['CZ'] })).map((item, index) => ({
    id: `req-${index}`,
    template_id: item.template_id,
    group_id: item.group_id,
    country_code: item.country_code,
    completed: false,
  }));

  const desired = resolve(catalog, trip({ countryCodes: ['HU'] }));
  const diff = diffTripRequirements(current, desired);

  assert.deepEqual(diff.toInsert, []);
  assert.deepEqual(diff.toRemoveIds, ['req-0']);
});

test('edição não recria o que já existe e limpa só o que deixou de valer', () => {
  const catalog = {
    groups: [schengen],
    templates: [
      template({ id: 'passport' }),
      template({ id: 'hu-rule', scope: 'country', countryCodes: ['HU'] }),
    ],
  };

  const desired = resolve(catalog, trip({ countryCodes: ['AT'] }));

  const current = [
    // Já gravado e ainda válido: não pode duplicar.
    {
      id: 'r1',
      template_id: 'passport',
      group_id: null,
      country_code: null,
      completed: false,
    },
    // Deixou de valer (Hungria saiu da viagem) e não foi verificado: sai.
    {
      id: 'r2',
      template_id: 'hu-rule',
      group_id: null,
      country_code: 'HU',
      completed: false,
    },
    // Também deixou de valer, mas o usuário já verificou: fica.
    {
      id: 'r3',
      template_id: 'old-rule',
      group_id: null,
      country_code: null,
      completed: true,
    },
    // Item criado à mão pelo usuário: o catálogo não mexe.
    { id: 'r4', template_id: null, group_id: null, country_code: null, completed: false },
  ];

  const diff = diffTripRequirements(current, desired);

  assert.deepEqual(diff.toInsert, []);
  assert.deepEqual(diff.toRemoveIds, ['r2']);
});

test('edição insere apenas o requisito do país que entrou', () => {
  const catalog = {
    groups: [],
    templates: [
      template({ id: 'passport' }),
      template({ id: 'entry', title: 'Entrada — {country}', scope: 'each_country' }),
    ],
  };

  const desired = resolve(catalog, trip({ countryCodes: ['AT', 'PT'] }));

  const current = [
    { id: 'r1', template_id: 'passport', group_id: null, country_code: null, completed: false },
    { id: 'r2', template_id: 'entry', group_id: null, country_code: 'AT', completed: false },
  ];

  const diff = diffTripRequirements(current, desired);

  assert.deepEqual(
    diff.toInsert.map((item) => item.country_code),
    ['PT'],
  );
  assert.deepEqual(diff.toRemoveIds, []);
});

/** Item de checklist reduzido ao que o agrupamento enxerga. */
function scoped(
  overrides: Partial<{
    country_code: string | null;
    group_id: string | null;
    priority: 'required' | 'recommended' | 'informational';
    created_at: string;
    destination_groups: { name: string } | null;
  }> = {},
) {
  return {
    country_code: null,
    group_id: null,
    priority: 'required' as const,
    created_at: '2026-09-01T12:00:00Z',
    destination_groups: null,
    ...overrides,
  };
}

test('a checklist é agrupada por viagem, grupo e país, sem seção vazia', () => {
  const sections = groupRequirementsByScope(
    [
      scoped(),
      scoped({ country_code: 'HU' }),
      scoped({ group_id: 'g-schengen', destination_groups: { name: 'Espaço Schengen' } }),
      scoped({ country_code: 'AT' }),
      // Sem o nome do grupo carregado, cai na seção da viagem inteira.
      scoped({ group_id: 'g-desconhecido' }),
    ],
    (code) => (code === 'HU' ? 'Hungria' : 'Áustria'),
  );

  assert.deepEqual(
    sections.map((section) => [section.kind, section.label, section.items.length]),
    [
      ['trip', 'Toda a viagem', 2],
      ['group', 'Espaço Schengen', 1],
      ['country', 'Áustria', 1],
      ['country', 'Hungria', 1],
    ],
  );
});

test('dentro da seção, os itens saem por prioridade e depois por criação', () => {
  const [section] = groupRequirementsByScope(
    [
      scoped({ priority: 'informational', created_at: '2026-09-01T12:00:00Z' }),
      scoped({ priority: 'recommended', created_at: '2026-09-01T12:00:03Z' }),
      scoped({ priority: 'required', created_at: '2026-09-01T12:00:02Z' }),
      scoped({ priority: 'recommended', created_at: '2026-09-01T12:00:01Z' }),
      scoped({ priority: 'required', created_at: '2026-09-01T12:00:04Z' }),
    ],
    (code) => code,
  );

  assert.deepEqual(
    section.items.map((item) => [item.priority, item.created_at.slice(-3)]),
    [
      ['required', '02Z'],
      ['required', '04Z'],
      ['recommended', '01Z'],
      ['recommended', '03Z'],
      ['informational', '00Z'],
    ],
  );
});

test('a estação segue o hemisfério do destino', () => {
  assert.equal(seasonAt('AT', '2026-12-10'), 'winter');
  assert.equal(seasonAt('BR', '2026-12-10'), 'summer');
  assert.equal(seasonAt('AU', '2026-07-01'), 'winter');

  // Uma viagem longa atravessa mais de uma estação.
  assert.deepEqual([...seasonsInRange('AT', '2026-11-20', '2026-12-05')], ['autumn', 'winter']);
  assert.deepEqual([...seasonsInRange('AT', '2026-12-10', '2026-12-20')], ['winter']);
});

test('as estações da viagem saem dos destinos, em ordem cronológica', () => {
  // Um destino, uma estação.
  assert.deepEqual(tripSeasons(['AT'], '2026-12-10', '2026-12-20'), ['winter']);

  // A virada de estação aparece na ordem em que a viagem a atravessa.
  assert.deepEqual(tripSeasons(['AT'], '2026-11-20', '2026-12-05'), ['autumn', 'winter']);

  // Hemisférios opostos na mesma viagem: sai do inverno europeu para o verão.
  assert.deepEqual(tripSeasons(['AT', 'BR'], '2026-12-10', '2026-12-20'), ['winter', 'summer']);

  // Países diferentes no mesmo hemisfério não repetem a estação.
  assert.deepEqual(tripSeasons(['AT', 'HU', 'CZ'], '2026-12-10', '2026-12-20'), ['winter']);

  // Sem datas não há estação a afirmar.
  assert.deepEqual(tripSeasons(['AT'], null, null), []);
});

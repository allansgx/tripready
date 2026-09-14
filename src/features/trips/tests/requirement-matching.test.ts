import assert from 'node:assert/strict';
import test from 'node:test';

import {
  describeRequirementScope,
  diffTripRequirements,
  groupRequirementsByCategory,
  groupRequirementsByScope,
  isDomesticTrip,
  isSectionComplete,
  nextPendingCategory,
  resolveTripRequirements,
  seasonAt,
  selectNextRequirement,
  seasonsInRange,
  tripSeasons,
  type CatalogGroup,
  type CatalogTemplate,
  type TripContext,
  type VisaRule,
} from '../domain/requirement-matching.ts';
import { computeTripProgress } from '../domain/trip-progress.ts';

/**
 * Testes da regra de aplicabilidade. O catálogo abaixo é fabricado aqui para os
 * casos não dependerem dos dados reais: mudar um seed não quebra a regra.
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
    tripKind: null,
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

/** Completa o catálogo para cada teste citar só a parte que exercita. */
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

  // Depois do solstício de dezembro é inverno na Europa e verão no Brasil. As
  // datas são explícitas porque o padrão do `trip()` cai antes do solstício,
  // quando a Europa ainda está no outono.
  const dates = { startDate: '2026-12-26', endDate: '2026-12-30' };
  const europe = resolve(catalog, trip({ countryCodes: ['AT'], ...dates }));
  const brazil = resolve(catalog, trip({ countryCodes: ['BR'], ...dates }));

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
// Viagem doméstica e viagem internacional
//
// A natureza da viagem não está no banco: sai da comparação entre os destinos e
// o passaporte principal. Estes casos exercitam a derivação e o efeito dela na
// checklist — quem voa de Recife a São Paulo não precisa de passaporte.
// =============================================================================

test('a viagem é doméstica só quando todo destino é o país do passaporte', () => {
  assert.equal(isDomesticTrip(['BR'], 'BR'), true);
  assert.equal(isDomesticTrip(['AR'], 'BR'), false);
  assert.equal(isDomesticTrip(['AR', 'UY'], 'BR'), false);
  // Um destino estrangeiro basta para a viagem inteira ser internacional.
  assert.equal(isDomesticTrip(['BR', 'AR'], 'BR'), false);
  // A regra não é sobre o Brasil: vale para qualquer passaporte.
  assert.equal(isDomesticTrip(['PT'], 'PT'), true);
  assert.equal(isDomesticTrip(['BR'], 'PT'), false);
});

test('sem passaporte principal a viagem nunca é doméstica', () => {
  assert.equal(isDomesticTrip(['BR'], null), false);
});

test('viagem sem destino não é doméstica — não há o que comparar', () => {
  assert.equal(isDomesticTrip([], 'BR'), false);
});

test('a comparação normaliza o código do país dos dois lados', () => {
  assert.equal(isDomesticTrip(['br'], 'BR'), true);
  assert.equal(isDomesticTrip(['BR'], 'br'), true);
  assert.equal(isDomesticTrip(['BR', 'BR'], 'BR'), true);
});

/** As três naturezas possíveis de uma regra, no mesmo catálogo. */
const kindTemplates = [
  template({ id: 'passport', title: 'Passaporte válido', tripKind: 'international' }),
  template({ id: 'id-card', title: 'Documento com foto', tripKind: 'domestic' }),
  template({ id: 'luggage', title: 'Montar a bagagem' }),
];

function titlesFor(context: TripContext) {
  return resolve({ templates: kindTemplates }, context)
    .map((item) => item.title)
    .sort();
}

test('viagem doméstica não recebe requisito internacional', () => {
  assert.deepEqual(titlesFor(trip({ countryCodes: ['BR'], passportCountryCode: 'BR' })), [
    'Documento com foto',
    'Montar a bagagem',
  ]);
});

test('viagem internacional não recebe requisito doméstico', () => {
  assert.deepEqual(titlesFor(trip({ countryCodes: ['AR'], passportCountryCode: 'BR' })), [
    'Montar a bagagem',
    'Passaporte válido',
  ]);
});

test('viagem com um destino estrangeiro entre os nacionais é internacional', () => {
  assert.deepEqual(titlesFor(trip({ countryCodes: ['BR', 'AR'], passportCountryCode: 'BR' })), [
    'Montar a bagagem',
    'Passaporte válido',
  ]);
});

test('a natureza da viagem não é sobre o Brasil', () => {
  assert.deepEqual(titlesFor(trip({ countryCodes: ['PT'], passportCountryCode: 'PT' })), [
    'Documento com foto',
    'Montar a bagagem',
  ]);

  assert.deepEqual(titlesFor(trip({ countryCodes: ['BR'], passportCountryCode: 'PT' })), [
    'Montar a bagagem',
    'Passaporte válido',
  ]);
});

test('sem passaporte principal a checklist continua como era', () => {
  assert.deepEqual(titlesFor(trip({ countryCodes: ['BR'], passportCountryCode: null })), [
    'Montar a bagagem',
    'Passaporte válido',
  ]);
});

test('requisito internacional por país pula o próprio país do viajante', () => {
  const catalog = {
    templates: [
      template({
        id: 'entry',
        title: 'Conferir as exigências de entrada — {country}',
        scope: 'each_country',
        tripKind: 'international',
      }),
    ],
  };

  const items = resolve(catalog, trip({ countryCodes: ['BR', 'AR'], passportCountryCode: 'BR' }));

  assert.deepEqual(
    items.map((item) => item.country_code),
    ['AR'],
  );
});

test('requisito por país sem marcação continua valendo para todo destino', () => {
  const catalog = {
    templates: [
      template({ id: 'plug', title: 'Adaptador de tomada — {country}', scope: 'each_country' }),
    ],
  };

  const items = resolve(catalog, trip({ countryCodes: ['BR', 'AR'], passportCountryCode: 'BR' }));

  assert.deepEqual(
    items.map((item) => item.country_code),
    ['BR', 'AR'],
  );
});

test('requisito doméstico por país alcança o país do viajante', () => {
  const catalog = {
    templates: [
      template({
        id: 'domestic-id',
        title: 'Documento de embarque — {country}',
        scope: 'each_country',
        tripKind: 'domestic',
      }),
    ],
  };

  const items = resolve(catalog, trip({ countryCodes: ['BR'], passportCountryCode: 'BR' }));

  assert.deepEqual(
    items.map((item) => item.country_code),
    ['BR'],
  );
});

test('regra de grupo internacional não alcança viagem doméstica', () => {
  const mercosul: CatalogGroup = {
    id: 'g-mercosul',
    code: 'MERCOSUL',
    name: 'MERCOSUL',
    members: [
      { countryCode: 'BR', validFrom: '1991-03-26', validUntil: null },
      { countryCode: 'AR', validFrom: '1991-03-26', validUntil: null },
    ],
  };

  const catalog = {
    groups: [mercosul],
    templates: [
      template({
        id: 'mercosul-rule',
        title: 'Regra do bloco',
        scope: 'group',
        groupIds: ['g-mercosul'],
        tripKind: 'international',
      }),
    ],
  };

  assert.deepEqual(resolve(catalog, trip({ countryCodes: ['BR'], passportCountryCode: 'BR' })), []);

  assert.equal(
    resolve(catalog, trip({ countryCodes: ['BR', 'AR'], passportCountryCode: 'BR' })).length,
    1,
  );
});

test('viagem doméstica não gera item de visto', () => {
  // O banco impede regra de um país para ele mesmo (`visa_rules_not_self`), e o
  // motor não inventa nenhuma: sem regra para o destino, não há item.
  const items = resolve(
    { templates: visaTemplates, visaRules: [] },
    trip({ countryCodes: ['BR'], passportCountryCode: 'BR' }),
  );

  assert.deepEqual(items, []);
});

test('a natureza da viagem vale junto com a estação, não no lugar dela', () => {
  const catalog = {
    templates: [
      template({
        id: 'winter-abroad',
        title: 'Casaco para o inverno',
        tripKind: 'international',
        season: 'winter',
      }),
    ],
  };

  // Internacional, mas em pleno verão do destino: continua fora.
  assert.deepEqual(
    resolve(
      catalog,
      trip({ countryCodes: ['AR'], startDate: '2027-01-10', endDate: '2027-01-20' }),
    ),
    [],
  );

  assert.equal(
    resolve(catalog, trip({ countryCodes: ['AT'], startDate: '2027-01-10', endDate: '2027-01-20' }))
      .length,
    1,
  );
});

test('a checklist se ajusta quando a viagem deixa de ser doméstica', () => {
  const catalog = { templates: kindTemplates };

  const domestic = resolve(catalog, trip({ countryCodes: ['BR'], passportCountryCode: 'BR' }));
  const current = domestic.map((item) => ({
    id: `req-${item.template_id}`,
    template_id: item.template_id,
    group_id: item.group_id,
    country_code: item.country_code,
    completed: false,
  }));

  const desired = resolve(catalog, trip({ countryCodes: ['BR', 'AR'], passportCountryCode: 'BR' }));
  const diff = diffTripRequirements(current, desired);

  assert.deepEqual(
    diff.toInsert.map((item) => item.title),
    ['Passaporte válido'],
  );
  // O documento de embarque deixou de valer e ainda não foi verificado: sai.
  assert.deepEqual(diff.toRemoveIds, ['req-id-card']);
});

test('viagem doméstica recebe obrigatório e pode ser declarada pronta', () => {
  // Sem obrigatório a viagem nunca é declarada pronta, por mais que a pessoa
  // verifique tudo o que existe na checklist.
  const catalog = {
    templates: [
      template({ id: 'passport', title: 'Passaporte válido', tripKind: 'international' }),
      template({ id: 'id-card', title: 'Documento com foto', tripKind: 'domestic' }),
      template({ id: 'luggage', title: 'Montar a bagagem', priority: 'recommended' }),
    ],
  };

  const items = resolve(catalog, trip({ countryCodes: ['BR'], passportCountryCode: 'BR' }));

  assert.deepEqual(
    items.filter((item) => item.priority === 'required').map((item) => item.title),
    ['Documento com foto'],
  );

  const progress = computeTripProgress(
    items.map((item) => ({ priority: item.priority, completed: true })),
  );
  assert.equal(progress.isReady, true);
});

test('item já verificado sobrevive à mudança de natureza da viagem', () => {
  const catalog = { templates: kindTemplates };

  const international = resolve(catalog, trip({ countryCodes: ['AR'], passportCountryCode: 'BR' }));
  const current = international.map((item) => ({
    id: `req-${item.template_id}`,
    template_id: item.template_id,
    group_id: item.group_id,
    country_code: item.country_code,
    completed: item.template_id === 'passport',
  }));

  const desired = resolve(catalog, trip({ countryCodes: ['BR'], passportCountryCode: 'BR' }));
  const diff = diffTripRequirements(current, desired);

  assert.deepEqual(
    diff.toInsert.map((item) => item.title),
    ['Documento com foto'],
  );
  // "Passaporte válido" não vale mais, mas a pessoa já o verificou: fica.
  assert.deepEqual(diff.toRemoveIds, []);
});

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
 * Mesmo destino e mesmo catálogo produzem itens diferentes só porque o
 * passaporte é outro: acrescentar um país de passaporte é acrescentar regras.
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
  assert.equal(seasonAt('AT', '2026-12-26'), 'winter');
  assert.equal(seasonAt('BR', '2026-12-26'), 'summer');
  assert.equal(seasonAt('AU', '2026-07-01'), 'winter');
});

test('a estação vira no equinócio, e não no primeiro dia do mês', () => {
  // O caso que motivou a regra: quem sai da Alemanha em 21 de setembro parte
  // no verão, e só entra no outono no dia seguinte.
  assert.equal(seasonAt('DE', '2026-09-21'), 'summer');
  assert.equal(seasonAt('DE', '2026-09-22'), 'autumn');

  // Os outros três limites, com o dia anterior a cada um.
  assert.equal(seasonAt('DE', '2026-03-19'), 'winter');
  assert.equal(seasonAt('DE', '2026-03-20'), 'spring');
  assert.equal(seasonAt('DE', '2026-06-20'), 'spring');
  assert.equal(seasonAt('DE', '2026-06-21'), 'summer');
  assert.equal(seasonAt('DE', '2026-12-20'), 'autumn');
  assert.equal(seasonAt('DE', '2026-12-21'), 'winter');

  // No sul o limite é o mesmo dia do calendário, com a estação oposta.
  assert.equal(seasonAt('BR', '2026-09-21'), 'winter');
  assert.equal(seasonAt('BR', '2026-09-22'), 'spring');
});

test('o intervalo encontra a virada mesmo no meio do mês', () => {
  // Setembro inteiro: amostrar só o primeiro dia do mês lia tudo como verão.
  assert.deepEqual([...seasonsInRange('DE', '2026-09-01', '2026-09-30')], ['summer', 'autumn']);

  // A viagem curta que atravessa a virada.
  assert.deepEqual([...seasonsInRange('DE', '2026-09-21', '2026-09-25')], ['summer', 'autumn']);

  // Começar no próprio dia da virada já é a estação nova, e só ela.
  assert.deepEqual([...seasonsInRange('DE', '2026-09-22', '2026-09-30')], ['autumn']);

  // Duas datas dentro da mesma estação, sem limite no caminho.
  assert.deepEqual([...seasonsInRange('AT', '2026-11-20', '2026-12-05')], ['autumn']);
});

test('as estações da viagem saem dos destinos, em ordem cronológica', () => {
  // Um destino, uma estação.
  assert.deepEqual(tripSeasons(['AT'], '2026-12-26', '2026-12-30'), ['winter']);

  // A virada de estação aparece na ordem em que a viagem a atravessa.
  assert.deepEqual(tripSeasons(['AT'], '2026-12-15', '2026-12-25'), ['autumn', 'winter']);

  // Hemisférios opostos na mesma viagem: sai do inverno europeu para o verão.
  assert.deepEqual(tripSeasons(['AT', 'BR'], '2026-12-26', '2026-12-30'), ['winter', 'summer']);

  // Países diferentes no mesmo hemisfério não repetem a estação.
  assert.deepEqual(tripSeasons(['AT', 'HU', 'CZ'], '2026-12-26', '2026-12-30'), ['winter']);

  // Sem datas não há estação a afirmar.
  assert.deepEqual(tripSeasons(['AT'], null, null), []);
});

test('o próximo passo é o pendente mais importante, informativos de fora', () => {
  const items = [
    { priority: 'informational' as const, completed: false, created_at: '2026-01-01T00:00:00Z' },
    { priority: 'recommended' as const, completed: false, created_at: '2026-01-01T00:00:01Z' },
    { priority: 'required' as const, completed: true, created_at: '2026-01-01T00:00:02Z' },
    { priority: 'required' as const, completed: false, created_at: '2026-01-01T00:00:03Z' },
    { priority: 'required' as const, completed: false, created_at: '2026-01-01T00:00:04Z' },
  ];

  // Obrigatório pendente mais antigo — o mesmo que abre a checklist.
  assert.equal(selectNextRequirement(items)?.created_at.slice(-3), '03Z');

  // Sem obrigatórios pendentes, o recomendado assume.
  const withoutRequired = items.filter((item) => item.priority !== 'required');
  assert.equal(selectNextRequirement(withoutRequired)?.priority, 'recommended');

  // Informativo nunca vira próximo passo: ele não trava a viagem.
  assert.equal(selectNextRequirement(withoutRequired.slice(0, 1)), null);
  assert.equal(selectNextRequirement([]), null);
});

/** Item de checklist reduzido ao que o agrupamento por categoria enxerga. */
function categorized(
  overrides: Partial<{
    category: 'documents' | 'health' | 'money' | 'connectivity' | 'luggage';
    priority: 'required' | 'recommended' | 'informational';
    completed: boolean;
    created_at: string;
  }> = {},
) {
  return {
    category: 'documents' as const,
    priority: 'required' as const,
    completed: false,
    created_at: '2026-09-01T12:00:00Z',
    ...overrides,
  };
}

const CATEGORY_ORDER = ['documents', 'health', 'money', 'connectivity', 'luggage'] as const;

test('as seções por categoria seguem a ordem pedida e omitem as vazias', () => {
  const sections = groupRequirementsByCategory(
    [
      categorized({ category: 'luggage' }),
      categorized({ category: 'documents' }),
      categorized({ category: 'money' }),
      categorized({ category: 'documents' }),
    ],
    CATEGORY_ORDER,
  );

  assert.deepEqual(
    sections.map((section) => [section.category, section.items.length]),
    [
      ['documents', 2],
      ['money', 1],
      ['luggage', 1],
    ],
  );
});

test('a fração da categoria deixa informativos de fora, como o progresso da viagem', () => {
  const [section] = groupRequirementsByCategory(
    [
      categorized({ priority: 'required', completed: true }),
      categorized({ priority: 'recommended', completed: false }),
      categorized({ priority: 'informational', completed: true }),
    ],
    CATEGORY_ORDER,
  );

  // Três itens na seção, dois na conta: o informativo verificado não soma.
  assert.equal(section.items.length, 3);
  assert.deepEqual([section.done, section.total], [1, 2]);
});

test('categoria só de informativos não tem fração a mostrar', () => {
  const [section] = groupRequirementsByCategory(
    [categorized({ priority: 'informational' }), categorized({ priority: 'informational' })],
    CATEGORY_ORDER,
  );

  assert.deepEqual([section.done, section.total], [0, 0]);
});

test('dentro da categoria, os itens saem por prioridade e depois por criação', () => {
  const [section] = groupRequirementsByCategory(
    [
      categorized({ priority: 'recommended', created_at: '2026-09-01T12:00:03Z' }),
      categorized({ priority: 'required', created_at: '2026-09-01T12:00:02Z' }),
      categorized({ priority: 'informational', created_at: '2026-09-01T12:00:00Z' }),
      categorized({ priority: 'required', created_at: '2026-09-01T12:00:01Z' }),
    ],
    CATEGORY_ORDER,
  );

  assert.deepEqual(
    section.items.map((item) => [item.priority, item.created_at.slice(-3)]),
    [
      ['required', '01Z'],
      ['required', '02Z'],
      ['recommended', '03Z'],
      ['informational', '00Z'],
    ],
  );
});

test('a origem de um item é a mesma que o agrupamento por escopo enxerga', () => {
  const countryName = (code: string) => (code === 'HU' ? 'Hungria' : code);

  assert.deepEqual(describeRequirementScope(scoped({ country_code: 'hu' }), countryName), {
    kind: 'country',
    key: 'country:HU',
    label: 'Hungria',
    countryCode: 'HU',
  });

  assert.deepEqual(
    describeRequirementScope(
      scoped({ group_id: 'g-schengen', destination_groups: { name: 'Espaço Schengen' } }),
      countryName,
    ),
    { kind: 'group', key: 'group:g-schengen', label: 'Espaço Schengen', countryCode: null },
  );

  assert.deepEqual(describeRequirementScope(scoped(), countryName), {
    kind: 'trip',
    key: 'trip',
    label: 'Toda a viagem',
    countryCode: null,
  });

  // Sem o nome do grupo carregado, o item é da viagem inteira — o mesmo que o
  // agrupamento faz, e não uma origem sem nome.
  assert.equal(
    describeRequirementScope(scoped({ group_id: 'g-desconhecido' }), countryName).kind,
    'trip',
  );
});

test('a seção só está completa quando nenhum item ficou por verificar', () => {
  const [pending] = groupRequirementsByCategory(
    [
      categorized({ priority: 'required', completed: true }),
      categorized({ priority: 'informational', completed: false }),
    ],
    CATEGORY_ORDER,
  );

  const [done] = groupRequirementsByCategory(
    [
      categorized({ priority: 'required', completed: true }),
      categorized({ priority: 'informational', completed: true }),
    ],
    CATEGORY_ORDER,
  );

  assert.equal(isSectionComplete(pending), false);
  assert.equal(isSectionComplete(done), true);
});

test('ao completar uma seção, a vez passa para a próxima com item pendente', () => {
  const sections = groupRequirementsByCategory(
    [
      categorized({ category: 'documents', completed: true }),
      categorized({ category: 'health', completed: true }),
      categorized({ category: 'money', completed: false }),
      categorized({ category: 'luggage', completed: false }),
    ],
    CATEGORY_ORDER,
  );

  assert.equal(nextPendingCategory(sections, 'documents'), 'money');
});

test('sem pendência abaixo, a vez volta para uma seção acima', () => {
  const sections = groupRequirementsByCategory(
    [
      categorized({ category: 'documents', completed: false }),
      categorized({ category: 'luggage', completed: true }),
    ],
    CATEGORY_ORDER,
  );

  assert.equal(nextPendingCategory(sections, 'luggage'), 'documents');
});

test('checklist inteira verificada não tem próxima seção a abrir', () => {
  const sections = groupRequirementsByCategory(
    [
      categorized({ category: 'documents', completed: true }),
      categorized({ category: 'luggage', completed: true }),
    ],
    CATEGORY_ORDER,
  );

  assert.equal(nextPendingCategory(sections, 'documents'), null);
});

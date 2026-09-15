// Caminho relativo, e não o alias `@/`: é o que deixa o módulo carregar no
// `node --test`, que resolve pelo arquivo real. Só o tipo — sem custo em runtime.
import type { Locale } from '../../../i18n/locales.ts';
import type {
  RequirementCategory,
  RequirementPriority,
  RequirementScope,
  Season,
  TripKind,
  VisaRequirementType,
} from '@/types/models';

// Destinos cujo território principal fica no hemisfério sul. Países equatoriais
// entram pelo lado onde está a maior parte do território.
const SOUTHERN_HEMISPHERE = new Set(
  (
    'AO AQ AR AU BI BO BR BV BW CD CK CL FJ FK GS HM ID KM LS MG MU MW MZ NA NC NF NU NZ ' +
    'PE PF PG PN PY RE RW SB SC SH ST SZ TF TL TO TV TZ UY VU WF WS YT ZA ZM ZW'
  ).split(' '),
);

// Equinócios e solstícios, com data fixa: o instante astronômico oscila um dia
// entre anos, e essa diferença não muda o que levar na mala.
const NORTHERN_SEASON_STARTS: readonly { month: number; day: number; season: Season }[] = [
  { month: 3, day: 20, season: 'spring' },
  { month: 6, day: 21, season: 'summer' },
  { month: 9, day: 22, season: 'autumn' },
  { month: 12, day: 21, season: 'winter' },
];

const OPPOSITE_SEASON: Record<Season, Season> = {
  winter: 'summer',
  summer: 'winter',
  spring: 'autumn',
  autumn: 'spring',
};

function isSouthernHemisphere(countryCode: string): boolean {
  return SOUTHERN_HEMISPHERE.has(countryCode.toUpperCase());
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Estação em um destino numa data `YYYY-MM-DD`. */
export function seasonAt(countryCode: string, isoDate: string): Season | null {
  if (!ISO_DATE.test(isoDate)) return null;

  const month = Number(isoDate.slice(5, 7));
  const day = Number(isoDate.slice(8, 10));
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  // Antes do equinócio de março o ano ainda está no inverno de dezembro.
  let northern: Season = 'winter';
  for (const start of NORTHERN_SEASON_STARTS) {
    if (month > start.month || (month === start.month && day >= start.day)) {
      northern = start.season;
    }
  }

  return isSouthernHemisphere(countryCode) ? OPPOSITE_SEASON[northern] : northern;
}

// Uma viagem que vira o ano já atravessa as quatro estações.
const MAX_EXTRA_YEARS = 1;

// Partida, volta e cada virada de estação entre as duas: como a estação só muda
// nesses limites, isso encontra toda estação atravessada.
function datesInRange(startDate: string | null, endDate: string | null): string[] {
  if (!startDate || !ISO_DATE.test(startDate)) return [];

  const last = endDate && endDate > startDate ? endDate : startDate;
  const dates = [startDate];

  const firstYear = Number(startDate.slice(0, 4));
  const lastYear = Math.min(Number(last.slice(0, 4)), firstYear + MAX_EXTRA_YEARS);

  // Ordem cronológica: é a ordem que `tripSeasons` promete à tela.
  for (let year = firstYear; year <= lastYear; year++) {
    for (const start of NORTHERN_SEASON_STARTS) {
      const boundary = `${year}-${`${start.month}`.padStart(2, '0')}-${`${start.day}`.padStart(2, '0')}`;
      if (boundary > startDate && boundary <= last) dates.push(boundary);
    }
  }

  if (last !== startDate) dates.push(last);

  return dates;
}

/** Estações que a viagem atravessa em um destino. */
export function seasonsInRange(
  countryCode: string,
  startDate: string | null,
  endDate: string | null,
): Set<Season> {
  const seasons = new Set<Season>();

  for (const date of datesInRange(startDate, endDate)) {
    const season = seasonAt(countryCode, date);
    if (season) seasons.add(season);
  }

  return seasons;
}

/** Estações da viagem inteira, na ordem cronológica em que aparecem. */
export function tripSeasons(
  countryCodes: readonly string[],
  startDate: string | null,
  endDate: string | null,
): Season[] {
  const seasons = new Set<Season>();

  for (const date of datesInRange(startDate, endDate)) {
    for (const countryCode of countryCodes) {
      const season = seasonAt(countryCode, date);
      if (season) seasons.add(season);
    }
  }

  return [...seasons];
}

export type CatalogGroupMember = {
  countryCode: string;
  validFrom: string | null;
  validUntil: string | null;
};

export type CatalogGroup = {
  id: string;
  code: string;
  name: string;
  members: readonly CatalogGroupMember[];
};

export type CatalogTemplate = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  priority: RequirementPriority;
  category: RequirementCategory;
  scope: RequirementScope;
  season: Season | null;
  passportCountryCode: string | null;
  /** Condição de natureza da viagem; nula quando a regra vale para as duas. */
  tripKind: TripKind | null;
  validFrom: string | null;
  validUntil: string | null;
  active: boolean;
  /** Grupos aos quais a regra está associada (escopo `group`). */
  groupIds: readonly string[];
  /** Países aos quais a regra está associada (escopo `country`). */
  countryCodes: readonly string[];
  /** Resultado de visto ao qual a regra responde (escopo `visa`). */
  visaRequirementType: VisaRequirementType | null;
};

/** Exigência de visto para um par (passaporte, destino), com fonte e vigência. */
export type VisaRule = {
  passportCountryCode: string;
  destinationCountryCode: string;
  requirementType: VisaRequirementType;
  sourceName: string;
  sourceUrl: string;
  /** Condição ou observação oficial; vira a descrição do item quando existe. */
  notes: string | null;
  validFrom: string | null;
  validUntil: string | null;
};

export type RequirementCatalog = {
  groups: readonly CatalogGroup[];
  templates: readonly CatalogTemplate[];
  visaRules: readonly VisaRule[];
};

export type TripContext = {
  tripId: string;
  countryCodes: readonly string[];
  startDate: string | null;
  endDate: string | null;
  /** País do passaporte principal do viajante; nulo quando não há. */
  passportCountryCode: string | null;
};

export type ResolveOptions = {
  /** Nome do país para o marcador `{country}` do título. */
  countryName: (code: string) => string;
  /** Data de referência em `YYYY-MM-DD`, usada quando a viagem não tem início. */
  today: string;
};

/** Item pronto para virar linha em `trip_requirements`. */
export type ResolvedRequirement = {
  trip_id: string;
  template_id: string;
  group_id: string | null;
  country_code: string | null;
  title: string;
  description: string | null;
  priority: RequirementPriority;
  category: RequirementCategory;
  /** Órgão oficial que embasa o item; só itens de visto têm um a citar. */
  source_name: string | null;
  source_url: string | null;
};

const MARKER_COUNTRY = '{country}';

function upper(code: string): string {
  return code.toUpperCase();
}

function unique(codes: readonly string[]): string[] {
  return [...new Set(codes.map(upper))];
}

/**
 * A viagem acontece inteira dentro do país do passaporte principal? Derivada,
 * nunca armazenada — é o que separa item de fronteira de item doméstico.
 */
export function isDomesticTrip(
  countryCodes: readonly string[],
  passportCountryCode: string | null,
): boolean {
  if (!passportCountryCode) return false;

  const codes = unique(countryCodes);
  if (codes.length === 0) return false;

  const passport = upper(passportCountryCode);
  return codes.every((code) => code === passport);
}

/** Uma data está dentro de um período aberto nas duas pontas. */
function isWithinPeriod(date: string, from: string | null, until: string | null): boolean {
  if (from && date < from) return false;
  if (until && date > until) return false;
  return true;
}

/** Países que fazem parte do grupo na data de referência. */
function groupCountriesAt(group: CatalogGroup, date: string): string[] {
  return group.members
    .filter((member) => isWithinPeriod(date, member.validFrom, member.validUntil))
    .map((member) => upper(member.countryCode));
}

/** Onde o item vai aparecer: viagem inteira, um grupo ou um país. */
type Target = {
  countryCode: string | null;
  group: CatalogGroup | null;
  /** Países que respondem pela condição de estação deste alvo. */
  seasonCountries: readonly string[];
  /** Regra de visto que originou o alvo; nula nos demais escopos. */
  rule: VisaRule | null;
};

/** O que a resolução já apurou da viagem, antes de percorrer os templates. */
type Resolution = {
  tripCountries: readonly string[];
  groups: readonly CatalogGroup[];
  referenceDate: string;
  /** País do passaporte principal, normalizado; nulo quando não há. */
  passport: string | null;
  /** Todos os destinos são o país do passaporte principal. */
  isDomestic: boolean;
  /** Regra de visto por destino, já filtrada pelo passaporte e pela data. */
  visaRuleByCountry: ReadonlyMap<string, VisaRule>;
};

// Sem passaporte principal o mapa volta vazio e nenhum item de visto é gerado.
function visaRulesByCountry(
  rules: readonly VisaRule[],
  passportCountryCode: string | null,
  referenceDate: string,
): Map<string, VisaRule> {
  const byCountry = new Map<string, VisaRule>();
  if (!passportCountryCode) return byCountry;

  for (const rule of rules) {
    if (upper(rule.passportCountryCode) !== passportCountryCode) continue;
    if (!isWithinPeriod(referenceDate, rule.validFrom, rule.validUntil)) continue;
    byCountry.set(upper(rule.destinationCountryCode), rule);
  }

  return byCountry;
}

function targetsFor(template: CatalogTemplate, resolution: Resolution): Target[] {
  const { tripCountries, groups, referenceDate } = resolution;

  // Uma regra internacional não alcança o próprio país do viajante: ele não
  // passa por imigração ao voltar para casa.
  const reachesCountry = (code: string) =>
    template.tripKind !== 'international' || code !== resolution.passport;

  switch (template.scope) {
    case 'global':
      return [{ countryCode: null, group: null, seasonCountries: tripCountries, rule: null }];

    case 'each_country':
      return tripCountries.filter(reachesCountry).map((code) => ({
        countryCode: code,
        group: null,
        seasonCountries: [code],
        rule: null,
      }));

    case 'country': {
      const linked = new Set(template.countryCodes.map(upper));
      return tripCountries
        .filter((code) => linked.has(code) && reachesCountry(code))
        .map((code) => ({ countryCode: code, group: null, seasonCountries: [code], rule: null }));
    }

    case 'group': {
      const linked = new Set(template.groupIds);

      // Um item só, mesmo que a viagem cruze vários grupos da mesma regra: é o
      // que impede "Hungria + Áustria + Tchéquia" virar três avisos do Schengen.
      const match = [...groups]
        .filter((group) => linked.has(group.id))
        .sort((a, b) => a.code.localeCompare(b.code))
        .map((group) => ({
          group,
          countries: groupCountriesAt(group, referenceDate).filter((code) =>
            tripCountries.includes(code),
          ),
        }))
        .find((candidate) => candidate.countries.length > 0);

      if (!match) return [];
      return [
        {
          countryCode: null,
          group: match.group,
          seasonCountries: match.countries,
          rule: null,
        },
      ];
    }

    // Destino sem regra cadastrada não gera item: o silêncio nunca vira "não
    // precisa de visto" — quem cobre esse caso é o requisito genérico.
    case 'visa': {
      const type = template.visaRequirementType;
      if (!type) return [];

      return tripCountries.flatMap((code) => {
        const rule = resolution.visaRuleByCountry.get(code);
        if (!rule || rule.requirementType !== type) return [];

        return [{ countryCode: code, group: null, seasonCountries: [code], rule }];
      });
    }
  }
}

function matchesSeason(template: CatalogTemplate, target: Target, trip: TripContext): boolean {
  const season = template.season;
  if (!season) return true;

  return target.seasonCountries.some((code) =>
    seasonsInRange(code, trip.startDate, trip.endDate).has(season),
  );
}

function renderTitle(
  template: CatalogTemplate,
  countryCode: string | null,
  countryName: (code: string) => string,
): string {
  if (!template.title.includes(MARKER_COUNTRY)) return template.title;
  if (!countryCode) return template.title.replace(MARKER_COUNTRY, '').trim();
  return template.title.replace(MARKER_COUNTRY, countryName(countryCode));
}

/** Requisitos aplicáveis a uma viagem, no máximo um item por regra e país. */
export function resolveTripRequirements(
  trip: TripContext,
  catalog: RequirementCatalog,
  options: ResolveOptions,
): ResolvedRequirement[] {
  const referenceDate = trip.startDate ?? options.today;
  const tripCountries = unique(trip.countryCodes);
  const passport = trip.passportCountryCode ? upper(trip.passportCountryCode) : null;

  const resolution: Resolution = {
    tripCountries,
    groups: catalog.groups,
    referenceDate,
    passport,
    isDomestic: isDomesticTrip(tripCountries, passport),
    visaRuleByCountry: visaRulesByCountry(catalog.visaRules, passport, referenceDate),
  };

  const resolved: ResolvedRequirement[] = [];

  for (const template of catalog.templates) {
    if (!template.active) continue;
    if (!isWithinPeriod(referenceDate, template.validFrom, template.validUntil)) continue;
    if (template.passportCountryCode && upper(template.passportCountryCode) !== passport) continue;
    // Regra sem `tripKind` vale para as duas naturezas.
    if (template.tripKind === 'domestic' && !resolution.isDomestic) continue;
    if (template.tripKind === 'international' && resolution.isDomestic) continue;

    for (const target of targetsFor(template, resolution)) {
      if (!matchesSeason(template, target, trip)) continue;

      resolved.push({
        trip_id: trip.tripId,
        template_id: template.id,
        group_id: target.group?.id ?? null,
        country_code: target.countryCode,
        title: renderTitle(template, target.countryCode, options.countryName),
        // A observação oficial da regra é mais específica que o texto do template.
        description: target.rule?.notes ?? template.description,
        priority: template.priority,
        category: template.category,
        source_name: target.rule?.sourceName ?? null,
        source_url: target.rule?.sourceUrl ?? null,
      });
    }
  }

  return resolved;
}

/** O mínimo que a comparação precisa saber de um item já gravado. */
export type ExistingRequirement = {
  id: string;
  template_id: string | null;
  group_id: string | null;
  country_code: string | null;
  completed: boolean;
};

export type RequirementDiff = {
  toInsert: ResolvedRequirement[];
  toRemoveIds: string[];
};

function originKey(item: {
  template_id: string | null;
  group_id: string | null;
  country_code: string | null;
}): string {
  return `${item.template_id ?? ''}|${item.group_id ?? ''}|${item.country_code ?? ''}`;
}

/**
 * O que muda na checklist quando a viagem é editada. Itens criados à mão (sem
 * `template_id`) e itens já verificados nunca são removidos.
 */
export function diffTripRequirements(
  current: readonly ExistingRequirement[],
  desired: readonly ResolvedRequirement[],
): RequirementDiff {
  const fromCatalog = current.filter((item) => item.template_id !== null);
  const currentKeys = new Set(fromCatalog.map(originKey));
  const desiredKeys = new Set(desired.map(originKey));

  return {
    toInsert: desired.filter((item) => !currentKeys.has(originKey(item))),
    toRemoveIds: fromCatalog
      .filter((item) => !item.completed && !desiredKeys.has(originKey(item)))
      .map((item) => item.id),
  };
}

export type ChecklistSectionKind = 'trip' | 'group' | 'country';

export type ChecklistSection<T> = {
  key: string;
  kind: ChecklistSectionKind;
  /** Nulo na seção `'trip'` — ver `RequirementScopeDescription.label`. */
  label: string | null;
  /** Preenchido apenas em seções de país, para a tela mostrar a bandeira. */
  countryCode: string | null;
  items: T[];
};

/** O que a tela precisa expor de cada requisito para o agrupamento. */
export type ScopedRequirement = {
  country_code: string | null;
  group_id: string | null;
  priority: RequirementPriority;
  created_at: string;
  destination_groups?: { name: string } | null;
};

// Mesma hierarquia que decide o progresso da viagem.
const PRIORITY_ORDER: Record<RequirementPriority, number> = {
  required: 0,
  recommended: 1,
  informational: 2,
};

/** O que basta para ordenar um requisito. */
type OrderedRequirement = Pick<ScopedRequirement, 'priority' | 'created_at'>;

// Empate fica com a ordem de criação, estável entre aberturas — ao contrário da
// ordem em que o banco devolve as linhas.
function byPriorityThenCreation(a: OrderedRequirement, b: OrderedRequirement): number {
  const priority = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
  if (priority !== 0) return priority;
  return a.created_at.localeCompare(b.created_at);
}

/** O mínimo para escolher o próximo passo: prioridade, ordem e estado. */
export type PendingRequirement = OrderedRequirement & { completed: boolean };

/**
 * O item que a pessoa deve resolver primeiro. Informativos ficam de fora: são
 * conteúdo de consulta e não travam a viagem.
 */
export function selectNextRequirement<T extends PendingRequirement>(
  requirements: readonly T[],
): T | null {
  const pending = requirements.filter(
    (requirement) => !requirement.completed && requirement.priority !== 'informational',
  );

  return pending.sort(byPriorityThenCreation)[0] ?? null;
}

/** De onde veio um item da checklist, pronto para virar rótulo na tela. */
export type RequirementScopeDescription = {
  kind: ChecklistSectionKind;
  /** Identifica a seção do item; itens de mesma origem compartilham a chave. */
  key: string;
  /**
   * Nulo quando `kind` é `'trip'`: o texto ("Toda a viagem") sai do idioma
   * ativo, não do dado — `t('trips.checklist.wholeTrip')`. Nos outros dois
   * casos vem do banco (nome do país ou do grupo) e permanece como está.
   */
  label: string | null;
  /** Preenchido apenas em itens de país, para a tela mostrar a bandeira. */
  countryCode: string | null;
};

/**
 * A origem de um item: viagem inteira, grupo de destinos ou país. Item de grupo
 * sem o nome carregado vira item da viagem inteira.
 */
export function describeRequirementScope<T extends ScopedRequirement>(
  requirement: T,
  countryName: (code: string) => string,
): RequirementScopeDescription {
  if (requirement.country_code) {
    const code = upper(requirement.country_code);
    return { kind: 'country', key: `country:${code}`, label: countryName(code), countryCode: code };
  }

  const groupName = requirement.destination_groups?.name;
  if (requirement.group_id && groupName) {
    return {
      kind: 'group',
      key: `group:${requirement.group_id}`,
      label: groupName,
      countryCode: null,
    };
  }

  return { kind: 'trip', key: 'trip', label: null, countryCode: null };
}

/**
 * Agrupa a checklist por origem. Seções nascem dos itens, nunca vazias.
 * `locale` só decide a ordem alfabética entre grupos e países — o rótulo da
 * viagem inteira é resolvido pela tela a partir de `kind === 'trip'`.
 */
export function groupRequirementsByScope<T extends ScopedRequirement>(
  requirements: readonly T[],
  countryName: (code: string) => string,
  locale: Locale,
): ChecklistSection<T>[] {
  const trip: ChecklistSection<T> = {
    key: 'trip',
    kind: 'trip',
    label: null,
    countryCode: null,
    items: [],
  };
  const groups = new Map<string, ChecklistSection<T>>();
  const countries = new Map<string, ChecklistSection<T>>();

  for (const requirement of requirements) {
    const scope = describeRequirementScope(requirement, countryName);

    if (scope.kind === 'country' && scope.countryCode) {
      const section = countries.get(scope.countryCode) ?? {
        key: scope.key,
        kind: 'country' as const,
        label: scope.label,
        countryCode: scope.countryCode,
        items: [],
      };
      section.items.push(requirement);
      countries.set(scope.countryCode, section);
      continue;
    }

    if (scope.kind === 'group' && requirement.group_id) {
      const section = groups.get(requirement.group_id) ?? {
        key: scope.key,
        kind: 'group' as const,
        label: scope.label,
        countryCode: null,
        items: [],
      };
      section.items.push(requirement);
      groups.set(requirement.group_id, section);
      continue;
    }

    trip.items.push(requirement);
  }

  // Só grupos e países chegam aqui, e os dois sempre têm `label` — a seção da
  // viagem inteira (`label: null`) nunca entra nestas duas listas.
  const byLabel = (a: ChecklistSection<T>, b: ChecklistSection<T>) =>
    (a.label ?? '').localeCompare(b.label ?? '', locale);

  const sections = [
    ...(trip.items.length > 0 ? [trip] : []),
    ...[...groups.values()].sort(byLabel),
    ...[...countries.values()].sort(byLabel),
  ];

  for (const section of sections) {
    section.items.sort(byPriorityThenCreation);
  }

  return sections;
}

/** Seção da checklist por categoria — o eixo dos accordions da tela. */
export type ChecklistCategorySection<T> = {
  category: RequirementCategory;
  items: T[];
  /** Itens que contam para o progresso e já foram verificados. */
  done: number;
  /** Itens que contam para o progresso. Informativos ficam de fora. */
  total: number;
};

/** O que basta para colocar um requisito na sua categoria e contá-lo. */
export type CategorizedRequirement = OrderedRequirement & {
  category: RequirementCategory;
  completed: boolean;
};

/**
 * Agrupa a checklist por categoria, na ordem recebida. `done`/`total` seguem a
 * regra do progresso da viagem, então a soma das seções fecha com o topo.
 */
export function groupRequirementsByCategory<T extends CategorizedRequirement>(
  requirements: readonly T[],
  order: readonly RequirementCategory[],
): ChecklistCategorySection<T>[] {
  const sections: ChecklistCategorySection<T>[] = [];

  for (const category of order) {
    const items = requirements
      .filter((requirement) => requirement.category === category)
      .sort(byPriorityThenCreation);

    if (items.length === 0) continue;

    const scored = items.filter((item) => item.priority !== 'informational');

    sections.push({
      category,
      items,
      done: scored.filter((item) => item.completed).length,
      total: scored.length,
    });
  }

  return sections;
}

/** Seção sem nada por verificar — informativos incluídos. */
export function isSectionComplete<T extends CategorizedRequirement>(
  section: ChecklistCategorySection<T>,
): boolean {
  return section.items.every((item) => item.completed);
}

/**
 * Para onde a checklist continua quando uma seção fecha completa: a próxima com
 * item pendente, voltando ao começo se as de baixo já estiverem verificadas.
 */
export function nextPendingCategory<T extends CategorizedRequirement>(
  sections: readonly ChecklistCategorySection<T>[],
  after: RequirementCategory,
): RequirementCategory | null {
  const start = sections.findIndex((section) => section.category === after);
  if (start < 0) return null;

  for (let step = 1; step <= sections.length; step++) {
    const section = sections[(start + step) % sections.length];
    if (!isSectionComplete(section)) return section.category;
  }

  return null;
}

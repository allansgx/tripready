import type {
  RequirementCategory,
  RequirementPriority,
  RequirementScope,
  Season,
} from '@/types/models';

/**
 * Quais regras do catálogo se aplicam a uma viagem.
 *
 * O módulo é propositalmente puro: recebe a viagem e o catálogo já carregados,
 * devolve os itens a gravar. Nada aqui conhece Supabase, React ou o app — é o
 * que permite testar a regra com `node --test` e o que mantém a decisão em um
 * lugar só, longe das telas.
 *
 * Por não ter import de execução (só de tipo, que some na compilação), o
 * arquivo também não arrasta configuração de bundler para dentro do teste.
 */

// =============================================================================
// Estação do ano
//
// Único ponto do app que converte data em estação. Fica aqui, e não em um
// arquivo separado, para o módulo continuar sem dependências de execução.
// =============================================================================

/**
 * Destinos cujo território principal fica no hemisfério sul.
 *
 * É geografia, não regra de viagem: define apenas em que meses cai cada
 * estação no destino. Países equatoriais estão classificados pelo lado onde
 * está a maior parte do território — uma simplificação conhecida, já que em
 * clima tropical a estação diz pouco. Quando isso passar a importar, o passo a
 * evoluir é `seasonAt`, sem tocar no restante do módulo.
 */
const SOUTHERN_HEMISPHERE = new Set(
  (
    'AO AQ AR AU BI BO BR BV BW CD CK CL FJ FK GS HM ID KM LS MG MU MW MZ NA NC NF NU NZ ' +
    'PE PF PG PN PY RE RW SB SC SH ST SZ TF TL TO TV TZ UY VU WF WS YT ZA ZM ZW'
  ).split(' '),
);

/** Estação de cada mês (1–12) no hemisfério norte. */
const NORTHERN_SEASON_BY_MONTH: readonly Season[] = [
  'winter', // janeiro
  'winter',
  'spring',
  'spring',
  'spring',
  'summer',
  'summer',
  'summer',
  'autumn',
  'autumn',
  'autumn',
  'winter', // dezembro
];

const OPPOSITE_SEASON: Record<Season, Season> = {
  winter: 'summer',
  summer: 'winter',
  spring: 'autumn',
  autumn: 'spring',
};

export function isSouthernHemisphere(countryCode: string): boolean {
  return SOUTHERN_HEMISPHERE.has(countryCode.toUpperCase());
}

/** Estação em um destino numa data `YYYY-MM-DD`. */
export function seasonAt(countryCode: string, isoDate: string): Season | null {
  const month = Number(isoDate.slice(5, 7));
  if (!Number.isInteger(month) || month < 1 || month > 12) return null;

  const northern = NORTHERN_SEASON_BY_MONTH[month - 1];
  return isSouthernHemisphere(countryCode) ? OPPOSITE_SEASON[northern] : northern;
}

/** Limite de meses percorridos — uma viagem mais longa cobre o ano inteiro. */
const MAX_MONTHS_IN_RANGE = 12;

/**
 * Datas a consultar para cobrir a viagem: o dia de partida e o primeiro dia de
 * cada mês seguinte, em ordem. Um mês é a menor unidade em que a estação muda,
 * então essa amostragem encontra toda estação atravessada sem percorrer dia a
 * dia.
 *
 * Sem data de início não há o que percorrer, e a lista volta vazia.
 */
function datesInRange(startDate: string | null, endDate: string | null): string[] {
  if (!startDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) return [];

  const dates = [startDate];
  const last = endDate && endDate > startDate ? endDate : startDate;
  let year = Number(startDate.slice(0, 4));
  let month = Number(startDate.slice(5, 7));

  for (let step = 0; step < MAX_MONTHS_IN_RANGE; step++) {
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }

    const cursor = `${year}-${`${month}`.padStart(2, '0')}-01`;
    if (cursor > last) break;
    dates.push(cursor);
  }

  return dates;
}

/**
 * Estações que a viagem atravessa em um destino.
 *
 * Sem data de início não há estação: o conjunto volta vazio e todo requisito
 * sazonal deixa de se aplicar, em vez de ser incluído por engano.
 */
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

/**
 * Estações da viagem inteira, na ordem em que aparecem.
 *
 * Percorre o tempo por fora e os destinos por dentro, então a ordem é
 * cronológica: uma viagem que começa em novembro na Europa devolve outono antes
 * de inverno. Destinos em hemisférios opostos entram na mesma lista — quem sai
 * do inverno europeu para o verão brasileiro atravessa as duas.
 */
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

// =============================================================================
// Catálogo
// =============================================================================

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
  validFrom: string | null;
  validUntil: string | null;
  active: boolean;
  /** Grupos aos quais a regra está associada (escopo `group`). */
  groupIds: readonly string[];
  /** Países aos quais a regra está associada (escopo `country`). */
  countryCodes: readonly string[];
};

export type RequirementCatalog = {
  groups: readonly CatalogGroup[];
  templates: readonly CatalogTemplate[];
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
};

const MARKER_COUNTRY = '{country}';

function upper(code: string): string {
  return code.toUpperCase();
}

function unique(codes: readonly string[]): string[] {
  return [...new Set(codes.map(upper))];
}

/** Uma data está dentro de um período aberto nas duas pontas. */
function isWithinPeriod(date: string, from: string | null, until: string | null): boolean {
  if (from && date < from) return false;
  if (until && date > until) return false;
  return true;
}

/** Países que fazem parte do grupo na data de referência. */
export function groupCountriesAt(group: CatalogGroup, date: string): string[] {
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
};

function targetsFor(
  template: CatalogTemplate,
  tripCountries: readonly string[],
  groups: readonly CatalogGroup[],
  referenceDate: string,
): Target[] {
  switch (template.scope) {
    case 'global':
      return [{ countryCode: null, group: null, seasonCountries: tripCountries }];

    case 'each_country':
      return tripCountries.map((code) => ({
        countryCode: code,
        group: null,
        seasonCountries: [code],
      }));

    case 'country': {
      const linked = new Set(template.countryCodes.map(upper));
      return tripCountries
        .filter((code) => linked.has(code))
        .map((code) => ({ countryCode: code, group: null, seasonCountries: [code] }));
    }

    case 'group': {
      const linked = new Set(template.groupIds);

      // Um item só, mesmo que a viagem cruze vários grupos da mesma regra: é o
      // que impede "Hungria + Áustria + Tchéquia" virar três avisos do
      // Schengen. A ordem por código deixa a escolha estável entre execuções.
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
      return [{ countryCode: null, group: match.group, seasonCountries: match.countries }];
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

/**
 * Requisitos aplicáveis a uma viagem.
 *
 * A ordem de avaliação é a mesma descrita no produto: descarta o que não vale
 * na data, o que não vale para o passaporte, e então resolve o escopo. Cada
 * regra produz no máximo um item por país (ou um só, nos escopos de viagem
 * inteira e de grupo), então a saída já nasce sem duplicatas.
 */
export function resolveTripRequirements(
  trip: TripContext,
  catalog: RequirementCatalog,
  options: ResolveOptions,
): ResolvedRequirement[] {
  const referenceDate = trip.startDate ?? options.today;
  const tripCountries = unique(trip.countryCodes);
  const passport = trip.passportCountryCode ? upper(trip.passportCountryCode) : null;

  const resolved: ResolvedRequirement[] = [];

  for (const template of catalog.templates) {
    if (!template.active) continue;
    if (!isWithinPeriod(referenceDate, template.validFrom, template.validUntil)) continue;
    if (template.passportCountryCode && upper(template.passportCountryCode) !== passport) continue;

    for (const target of targetsFor(template, tripCountries, catalog.groups, referenceDate)) {
      if (!matchesSeason(template, target, trip)) continue;

      resolved.push({
        trip_id: trip.tripId,
        template_id: template.id,
        group_id: target.group?.id ?? null,
        country_code: target.countryCode,
        title: renderTitle(template, target.countryCode, options.countryName),
        description: template.description,
        priority: template.priority,
        category: template.category,
      });
    }
  }

  return resolved;
}

// =============================================================================
// Reconciliação com o que já está gravado
// =============================================================================

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
 * O que precisa mudar na checklist quando a viagem é editada.
 *
 * Itens criados à mão pelo usuário (sem `template_id`) nunca entram na conta:
 * não são gerados pelo catálogo e não cabe ao catálogo removê-los. Entre os
 * gerados, só saem os que deixaram de valer **e** ainda não foram verificados —
 * apagar algo que a pessoa já marcou seria desfazer trabalho dela.
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

// =============================================================================
// Organização para a tela
// =============================================================================

export type ChecklistSectionKind = 'trip' | 'group' | 'country';

export type ChecklistSection<T> = {
  key: string;
  kind: ChecklistSectionKind;
  label: string;
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

const TRIP_SECTION_LABEL = 'Toda a viagem';

/**
 * Ordem dos itens dentro de uma seção: o que impede a viagem primeiro.
 *
 * É a mesma hierarquia que decide o progresso — obrigatório define se a viagem
 * está pronta, recomendado soma, informativo não conta —, então a leitura da
 * lista bate com o que a barra de cima diz.
 */
const PRIORITY_ORDER: Record<RequirementPriority, number> = {
  required: 0,
  recommended: 1,
  informational: 2,
};

/**
 * Empate dentro da prioridade fica com a ordem de criação, que é a ordem das
 * categorias em que a checklist foi montada — estável entre uma abertura e
 * outra, ao contrário da ordem em que o banco devolve as linhas.
 */
function byPriorityThenCreation(a: ScopedRequirement, b: ScopedRequirement): number {
  const priority = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
  if (priority !== 0) return priority;
  return a.created_at.localeCompare(b.created_at);
}

/**
 * Agrupa a checklist por origem: viagem inteira, grupo de destinos e país.
 *
 * Seções nascem dos itens, então nunca existe seção vazia. Um item de grupo
 * sem o nome do grupo carregado cai na seção da viagem inteira — melhor do que
 * abrir uma seção sem título. Dentro de cada seção os itens saem ordenados por
 * prioridade.
 */
export function groupRequirementsByScope<T extends ScopedRequirement>(
  requirements: readonly T[],
  countryName: (code: string) => string,
): ChecklistSection<T>[] {
  const trip: ChecklistSection<T> = {
    key: 'trip',
    kind: 'trip',
    label: TRIP_SECTION_LABEL,
    countryCode: null,
    items: [],
  };
  const groups = new Map<string, ChecklistSection<T>>();
  const countries = new Map<string, ChecklistSection<T>>();

  for (const requirement of requirements) {
    const groupName = requirement.destination_groups?.name;

    if (requirement.country_code) {
      const code = upper(requirement.country_code);
      const section = countries.get(code) ?? {
        key: `country:${code}`,
        kind: 'country' as const,
        label: countryName(code),
        countryCode: code,
        items: [],
      };
      section.items.push(requirement);
      countries.set(code, section);
      continue;
    }

    if (requirement.group_id && groupName) {
      const section = groups.get(requirement.group_id) ?? {
        key: `group:${requirement.group_id}`,
        kind: 'group' as const,
        label: groupName,
        countryCode: null,
        items: [],
      };
      section.items.push(requirement);
      groups.set(requirement.group_id, section);
      continue;
    }

    trip.items.push(requirement);
  }

  const byLabel = (a: ChecklistSection<T>, b: ChecklistSection<T>) =>
    a.label.localeCompare(b.label, 'pt-BR');

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

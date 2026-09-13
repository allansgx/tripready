import type {
  RequirementCategory,
  RequirementPriority,
  RequirementScope,
  Season,
  TripKind,
  VisaRequirementType,
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

/**
 * Dia em que cada estação começa no hemisfério norte.
 *
 * São os equinócios e solstícios, e não o primeiro dia do mês: uma viagem que
 * sai em 21 de setembro parte no verão europeu, e só entra no outono no dia
 * seguinte. Dizer "outono" no dia 21 é errar a estação por um dia inteiro, e o
 * erro aparece na tela justamente nas viagens de virada de estação, que são as
 * que mais precisam de acerto na hora de fazer a mala.
 *
 * As datas são fixas de propósito. O instante astronômico oscila um dia entre
 * um ano e outro, e calcular isso de verdade exigiria efemérides — muito preço
 * por uma diferença que ninguém percebe ao arrumar a bagagem. O que valia a
 * pena corrigir era a diferença de três semanas do mapa por mês.
 *
 * No hemisfério sul o limite é o mesmo dia do calendário: é o mesmo evento
 * astronômico, só que entrando na estação oposta — daí `OPPOSITE_SEASON`.
 */
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

export function isSouthernHemisphere(countryCode: string): boolean {
  return SOUTHERN_HEMISPHERE.has(countryCode.toUpperCase());
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Estação em um destino numa data `YYYY-MM-DD`. */
export function seasonAt(countryCode: string, isoDate: string): Season | null {
  if (!ISO_DATE.test(isoDate)) return null;

  const month = Number(isoDate.slice(5, 7));
  const day = Number(isoDate.slice(8, 10));
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  // Antes do equinócio de março o ano ainda está no inverno que começou em
  // dezembro, então é ele o ponto de partida da varredura.
  let northern: Season = 'winter';
  for (const start of NORTHERN_SEASON_STARTS) {
    if (month > start.month || (month === start.month && day >= start.day)) {
      northern = start.season;
    }
  }

  return isSouthernHemisphere(countryCode) ? OPPOSITE_SEASON[northern] : northern;
}

/**
 * Anos de limites percorridos além do ano de partida.
 *
 * Uma viagem que passa de um ano para o outro já atravessa as quatro estações,
 * então varrer dois anos de limites encontra todas elas. O teto existe só para
 * a varredura não depender do tamanho do intervalo.
 */
const MAX_EXTRA_YEARS = 1;

/**
 * Datas a consultar para cobrir a viagem.
 *
 * São o dia de partida, o dia de volta e cada virada de estação entre os dois.
 * Amostrar o primeiro dia de cada mês não serve mais: com os limites caindo no
 * meio do mês, uma viagem de 1 a 30 de setembro seria lida inteira como verão,
 * quando na verdade vira outono no dia 22.
 *
 * Como a estação só muda nesses limites, consultar a partida, a volta e as
 * viradas encontra toda estação atravessada — sem percorrer dia a dia e sem
 * depender da duração da viagem.
 *
 * Sem data de início não há o que percorrer, e a lista volta vazia.
 */
function datesInRange(startDate: string | null, endDate: string | null): string[] {
  if (!startDate || !ISO_DATE.test(startDate)) return [];

  const last = endDate && endDate > startDate ? endDate : startDate;
  const dates = [startDate];

  const firstYear = Number(startDate.slice(0, 4));
  const lastYear = Math.min(Number(last.slice(0, 4)), firstYear + MAX_EXTRA_YEARS);

  // Os limites saem em ordem cronológica — anos crescentes, meses crescentes —,
  // que é a ordem que `tripSeasons` promete à tela.
  for (let year = firstYear; year <= lastYear; year++) {
    for (const start of NORTHERN_SEASON_STARTS) {
      const boundary = `${year}-${`${start.month}`.padStart(2, '0')}-${`${start.day}`.padStart(2, '0')}`;
      if (boundary > startDate && boundary <= last) dates.push(boundary);
    }
  }

  if (last !== startDate) dates.push(last);

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

/**
 * Exigência de visto para um par (passaporte, destino).
 *
 * É um fato sobre o mundo, com fonte oficial e vigência — separado de como ele
 * aparece na checklist, que é assunto do template de escopo `visa`. As duas
 * coisas se encontram por `requirementType`.
 */
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
 * A viagem acontece inteira dentro do país do passaporte principal?
 *
 * É o que separa "conferir a validade do passaporte" de "levar um documento com
 * foto": quem voa de São Paulo para Recife não cruza fronteira nenhuma, e um
 * item de fronteira na checklist cobra um preparo que não existe.
 *
 * Derivada, nunca armazenada, como o status da viagem: mudar os destinos ou
 * trocar o passaporte principal muda a resposta sozinho.
 *
 * Sem passaporte principal não há como afirmar que a viagem é doméstica, e a
 * resposta é `false` — o mesmo comportamento de antes desta regra existir. Uma
 * viagem ainda sem destino também não é doméstica: não há o que comparar.
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
  /** Regra de visto que originou o alvo; nula nos demais escopos. */
  rule: VisaRule | null;
};

/**
 * O que a resolução já apurou da viagem, antes de percorrer os templates.
 *
 * Existe para `targetsFor` não crescer numa fila de parâmetros posicionais a
 * cada condição nova — é um agrupamento local, não uma abstração exportada.
 */
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

/**
 * Regras que valem para este viajante nesta data, indexadas pelo destino.
 *
 * O filtro por passaporte fica aqui, e não só na consulta ao banco: o módulo é
 * puro e não pode supor que quem carregou o catálogo já filtrou. Sem passaporte
 * principal não há regra aplicável, e o mapa volta vazio — nenhum item de visto
 * é gerado, que é o comportamento seguro.
 */
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

  /**
   * Uma regra internacional não alcança o próprio país do viajante.
   *
   * Vale para a viagem mista, que é internacional como um todo: quem sai do
   * Brasil para a Argentina confere as exigências de entrada argentinas, e não
   * as brasileiras — ele não passa por imigração ao voltar para casa. Regras
   * sem marcação e regras domésticas não são afetadas.
   */
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
      return [
        {
          countryCode: null,
          group: match.group,
          seasonCountries: match.countries,
          rule: null,
        },
      ];
    }

    // Um item por país cuja regra de visto seja deste tipo. Destino sem regra
    // cadastrada não gera item nenhum: o silêncio nunca vira "não precisa de
    // visto" — quem cobre esse caso é o requisito genérico de exigências de
    // entrada, que vale para todo país da viagem.
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

/**
 * Requisitos aplicáveis a uma viagem.
 *
 * A ordem de avaliação é a mesma descrita no produto: descarta o que não vale
 * na data, o que não vale para o passaporte, o que não vale para a natureza da
 * viagem — doméstica ou internacional —, e então resolve o escopo. Cada
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
    // Uma regra sem `tripKind` vale para as duas naturezas: é o padrão do
    // catálogo e o que mantém intacto tudo o que não foi marcado.
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
        // A observação oficial da regra é mais específica que o texto genérico
        // do template — "permanência de até 90 dias para turismo" diz mais do
        // que "solicite o visto". Sem observação, vale o texto do template.
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

/** O que basta para ordenar um requisito. */
type OrderedRequirement = Pick<ScopedRequirement, 'priority' | 'created_at'>;

/**
 * Empate dentro da prioridade fica com a ordem de criação, que é a ordem das
 * categorias em que a checklist foi montada — estável entre uma abertura e
 * outra, ao contrário da ordem em que o banco devolve as linhas.
 */
function byPriorityThenCreation(a: OrderedRequirement, b: OrderedRequirement): number {
  const priority = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
  if (priority !== 0) return priority;
  return a.created_at.localeCompare(b.created_at);
}

/** O mínimo para escolher o próximo passo: prioridade, ordem e estado. */
export type PendingRequirement = OrderedRequirement & { completed: boolean };

/**
 * O item que a pessoa deve resolver primeiro.
 *
 * Segue a mesma hierarquia da lista — obrigatórios antes de recomendados, e
 * empate pela ordem de criação —, então o "próximo passo" da Home é sempre o
 * primeiro item pendente que ela encontra ao abrir a checklist. Informativos
 * ficam de fora: são conteúdo de consulta e não travam a viagem.
 *
 * `null` quando não há nada pendente que valha cobrar.
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
  label: string;
  /** Preenchido apenas em itens de país, para a tela mostrar a bandeira. */
  countryCode: string | null;
};

/**
 * A origem de um item: viagem inteira, grupo de destinos ou país.
 *
 * Um item de grupo sem o nome do grupo carregado é tratado como item da viagem
 * inteira — melhor do que anunciar uma origem sem nome.
 *
 * Mora aqui, e não dentro do agrupamento, porque a tela de detalhe precisa da
 * mesma resposta para um item só. Duas leituras da mesma regra dariam dois
 * rótulos diferentes para o mesmo item.
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

  return { kind: 'trip', key: 'trip', label: TRIP_SECTION_LABEL, countryCode: null };
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

/**
 * Seção da checklist por categoria — o eixo que a tela usa para os accordions.
 */
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
 * Agrupa a checklist por categoria: Documentos, Saúde, Dinheiro...
 *
 * A ordem das categorias entra por parâmetro porque é decisão de apresentação
 * (`CHECKLIST_CATEGORIES`), e este módulo responde por regra de viagem. Uma
 * categoria sem item nenhum não vira seção.
 *
 * `done`/`total` seguem a mesma regra do progresso da viagem — informativos
 * ficam de fora da fração —, então a soma das seções fecha exatamente com o
 * número mostrado no topo da tela. Uma categoria só de informativos devolve
 * `0/0`, e cabe à tela mostrar a contagem de itens no lugar da fração.
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

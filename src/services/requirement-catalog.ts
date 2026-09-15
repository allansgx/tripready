import type {
  CatalogGroup,
  CatalogGroupMember,
  CatalogTemplate,
  RequirementCatalog,
  VisaRule,
} from '@/features/trips/domain/requirement-matching';
import type { Locale } from '@/i18n/locales';
import { supabase } from '@/lib/supabase/client';
import { unwrapRequired } from '@/services/errors';
import type {
  RequirementCategory,
  RequirementPriority,
  RequirementScope,
  Season,
  TripKind,
  VisaRequirementType,
} from '@/types/models';

const FAILURE_MESSAGE = 'Tente preparar a checklist novamente';

/** Linha de `destination_group_members` com o grupo embutido. */
type MemberRow = {
  group_id: string;
  country_code: string;
  valid_from: string | null;
  valid_until: string | null;
  destination_groups: { id: string; code: string; name: string } | null;
};

/** Linha de `requirement_templates` com as duas tabelas de aplicabilidade. */
type TemplateRow = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  priority: RequirementPriority;
  category: RequirementCategory;
  scope: RequirementScope;
  season: Season | null;
  passport_country_code: string | null;
  trip_kind: TripKind | null;
  visa_requirement_type: VisaRequirementType | null;
  valid_from: string | null;
  valid_until: string | null;
  active: boolean;
  requirement_template_groups: { group_id: string }[];
  requirement_template_countries: { country_code: string }[];
};

/** Linha de `visa_rules`. */
type VisaRuleRow = {
  id: string;
  passport_country_code: string;
  destination_country_code: string;
  requirement_type: VisaRequirementType;
  source_name: string;
  source_url: string;
  notes: string | null;
  valid_from: string | null;
  valid_until: string | null;
};

/** Só os grupos que têm algum país da viagem; a vigência é avaliada no motor. */
async function loadGroups(countryCodes: readonly string[]): Promise<CatalogGroup[]> {
  if (countryCodes.length === 0) return [];

  const rows = unwrapRequired(
    await supabase
      .from('destination_group_members')
      .select(
        'group_id, country_code, valid_from, valid_until, destination_groups!inner(id, code, name)',
      )
      .in('country_code', [...countryCodes]),
    FAILURE_MESSAGE,
  ) as unknown as MemberRow[];

  type MutableGroup = Omit<CatalogGroup, 'members'> & { members: CatalogGroupMember[] };
  const groups = new Map<string, MutableGroup>();

  for (const row of rows) {
    const group = row.destination_groups;
    if (!group) continue;

    const current = groups.get(group.id);
    const member = {
      countryCode: row.country_code,
      validFrom: row.valid_from,
      validUntil: row.valid_until,
    };

    if (current) {
      current.members.push(member);
    } else {
      groups.set(group.id, { id: group.id, code: group.code, name: group.name, members: [member] });
    }
  }

  return [...groups.values()];
}

async function loadTemplates(): Promise<CatalogTemplate[]> {
  const rows = unwrapRequired(
    await supabase
      .from('requirement_templates')
      .select(
        '*, requirement_template_groups(group_id), requirement_template_countries(country_code)',
      )
      .eq('active', true)
      .order('code', { ascending: true }),
    FAILURE_MESSAGE,
  ) as unknown as TemplateRow[];

  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    title: row.title,
    description: row.description,
    priority: row.priority,
    category: row.category,
    scope: row.scope,
    season: row.season,
    passportCountryCode: row.passport_country_code,
    tripKind: row.trip_kind,
    visaRequirementType: row.visa_requirement_type,
    validFrom: row.valid_from,
    validUntil: row.valid_until,
    active: row.active,
    groupIds: row.requirement_template_groups.map((link) => link.group_id),
    countryCodes: row.requirement_template_countries.map((link) => link.country_code),
  }));
}

/**
 * Regras de visto do viajante para os destinos da viagem. Sem passaporte
 * principal a lista volta vazia; a vigência é avaliada no motor.
 */
async function loadVisaRules(
  countryCodes: readonly string[],
  passportCountryCode: string | null,
): Promise<VisaRule[]> {
  if (!passportCountryCode || countryCodes.length === 0) return [];

  const rows = unwrapRequired(
    await supabase
      .from('visa_rules')
      .select(
        'id, passport_country_code, destination_country_code, requirement_type, source_name, source_url, notes, valid_from, valid_until',
      )
      .eq('passport_country_code', passportCountryCode.toUpperCase())
      .in('destination_country_code', [...countryCodes]),
    FAILURE_MESSAGE,
  ) as unknown as VisaRuleRow[];

  return rows.map((row) => ({
    id: row.id,
    passportCountryCode: row.passport_country_code,
    destinationCountryCode: row.destination_country_code,
    requirementType: row.requirement_type,
    sourceName: row.source_name,
    sourceUrl: row.source_url,
    notes: row.notes,
    validFrom: row.valid_from,
    validUntil: row.valid_until,
  }));
}

export type TranslatedTemplate = { id: string; title: string; description: string | null };
export type TranslatedGroup = { id: string; name: string; description: string | null };

/** Catálogo com texto já resolvido para a leitura — nunca usado na geração, que grava sempre pt-BR (§8.3 do plano de i18n). */
export type TranslatedCatalog = {
  templates: TranslatedTemplate[];
  groups: TranslatedGroup[];
};

type LocalizedRow = { locale: string };

/** A linha do idioma pedido; na ausência, a linha pt-BR — nunca a coluna original, porque quem chama já decidiu que quer texto traduzido. */
function pickTranslation<T extends LocalizedRow>(
  rows: readonly T[] | undefined,
  locale: Locale,
): T | undefined {
  return rows?.find((row) => row.locale === locale) ?? rows?.find((row) => row.locale === 'pt-BR');
}

type TemplateTranslationRow = { locale: string; title: string; description: string | null };
type TemplateWithTranslationsRow = {
  id: string;
  title: string;
  description: string | null;
  requirement_template_translations: TemplateTranslationRow[];
};

async function loadTranslatedTemplates(locale: Locale): Promise<TranslatedTemplate[]> {
  const rows = unwrapRequired(
    await supabase
      .from('requirement_templates')
      .select(
        'id, title, description, requirement_template_translations(locale, title, description)',
      )
      .eq('active', true)
      .in('requirement_template_translations.locale', [locale, 'pt-BR']),
    FAILURE_MESSAGE,
  ) as unknown as TemplateWithTranslationsRow[];

  return rows.map((row) => {
    const translation = pickTranslation(row.requirement_template_translations, locale);
    return {
      id: row.id,
      title: translation?.title ?? row.title,
      description: translation?.description ?? row.description,
    };
  });
}

type GroupTranslationRow = { locale: string; name: string; description: string | null };
type GroupWithTranslationsRow = {
  id: string;
  name: string;
  description: string | null;
  destination_group_translations: GroupTranslationRow[];
};

async function loadTranslatedGroups(locale: Locale): Promise<TranslatedGroup[]> {
  const rows = unwrapRequired(
    await supabase
      .from('destination_groups')
      .select('id, name, description, destination_group_translations(locale, name, description)')
      .in('destination_group_translations.locale', [locale, 'pt-BR']),
    FAILURE_MESSAGE,
  ) as unknown as GroupWithTranslationsRow[];

  return rows.map((row) => {
    const translation = pickTranslation(row.destination_group_translations, locale);
    return {
      id: row.id,
      name: translation?.name ?? row.name,
      description: translation?.description ?? row.description,
    };
  });
}

type VisaRuleNotesRow = {
  id: string;
  notes: string | null;
  visa_rule_translations: { locale: string; notes: string | null }[];
};

/**
 * Observação de visto traduzida, só para as regras pedidas — fora do cache,
 * porque depende do par (passaporte, destino) da viagem aberta (§11 do plano
 * de i18n).
 */
async function loadVisaRuleNotes(
  visaRuleIds: readonly string[],
  locale: Locale,
): Promise<Map<string, string | null>> {
  const ids = [...new Set(visaRuleIds)];
  if (ids.length === 0) return new Map();

  const rows = unwrapRequired(
    await supabase
      .from('visa_rules')
      .select('id, notes, visa_rule_translations(locale, notes)')
      .in('id', ids)
      .in('visa_rule_translations.locale', [locale, 'pt-BR']),
    FAILURE_MESSAGE,
  ) as unknown as VisaRuleNotesRow[];

  return new Map(
    rows.map((row) => [
      row.id,
      pickTranslation(row.visa_rule_translations, locale)?.notes ?? row.notes,
    ]),
  );
}

/**
 * Catálogo de requisitos: o serviço só carrega e traduz linhas. Quem decide o
 * que se aplica é `resolveTripRequirements`, que não conhece banco nenhum.
 */
export const requirementCatalogService = {
  async loadForTrip(
    countryCodes: readonly string[],
    passportCountryCode: string | null,
  ): Promise<RequirementCatalog> {
    const codes = [...new Set(countryCodes.map((code) => code.toUpperCase()))];

    const [groups, templates, visaRules] = await Promise.all([
      loadGroups(codes),
      loadTemplates(),
      loadVisaRules(codes, passportCountryCode),
    ]);

    return { groups, templates, visaRules };
  },

  /** Catálogo traduzido para o idioma ativo, pronto para a leitura da checklist. */
  async loadTranslatedCatalog(locale: Locale): Promise<TranslatedCatalog> {
    const [templates, groups] = await Promise.all([
      loadTranslatedTemplates(locale),
      loadTranslatedGroups(locale),
    ]);

    return { templates, groups };
  },

  loadVisaRuleNotes,
};

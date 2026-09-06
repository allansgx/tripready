import type {
  CatalogGroup,
  CatalogGroupMember,
  CatalogTemplate,
  RequirementCatalog,
  VisaRule,
} from '@/features/trips/requirement-matching';
import { supabase } from '@/lib/supabase/client';
import { unwrapRequired } from '@/services/errors';
import type {
  RequirementCategory,
  RequirementPriority,
  RequirementScope,
  Season,
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
  visa_requirement_type: VisaRequirementType | null;
  valid_from: string | null;
  valid_until: string | null;
  active: boolean;
  requirement_template_groups: { group_id: string }[];
  requirement_template_countries: { country_code: string }[];
};

/** Linha de `visa_rules`. */
type VisaRuleRow = {
  passport_country_code: string;
  destination_country_code: string;
  requirement_type: VisaRequirementType;
  source_name: string;
  source_url: string;
  notes: string | null;
  valid_from: string | null;
  valid_until: string | null;
};

/**
 * Só os grupos que têm algum país da viagem.
 *
 * O filtro por país fica no banco para o app não baixar a composição de blocos
 * inteiros a cada checklist. O período de validade de cada participação vem
 * junto e é avaliado depois, contra a data da viagem.
 */
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
    visaRequirementType: row.visa_requirement_type,
    validFrom: row.valid_from,
    validUntil: row.valid_until,
    active: row.active,
    groupIds: row.requirement_template_groups.map((link) => link.group_id),
    countryCodes: row.requirement_template_countries.map((link) => link.country_code),
  }));
}

/**
 * Regras de visto do viajante para os destinos da viagem.
 *
 * Sem passaporte principal não há o que consultar, e a lista volta vazia — o
 * mesmo resultado de um destino sem regra cadastrada.
 *
 * O filtro por passaporte e por destino fica na consulta para o app não baixar
 * a tabela inteira a cada checklist. A vigência de cada regra vem junto e é
 * avaliada no motor, contra a data da viagem: é lá que a decisão mora, e é lá
 * que ela pode ser testada sem banco.
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
        'passport_country_code, destination_country_code, requirement_type, source_name, source_url, notes, valid_from, valid_until',
      )
      .eq('passport_country_code', passportCountryCode.toUpperCase())
      .in('destination_country_code', [...countryCodes]),
    FAILURE_MESSAGE,
  ) as unknown as VisaRuleRow[];

  return rows.map((row) => ({
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

/**
 * Catálogo de requisitos.
 *
 * O serviço só carrega e traduz linhas; quem decide o que se aplica é
 * `resolveTripRequirements`, que não conhece banco nenhum. É essa separação que
 * permite testar a regra sem Supabase.
 *
 * As tabelas do catálogo são dados de referência: todo usuário autenticado lê
 * as mesmas linhas e ninguém escreve por aqui.
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
};

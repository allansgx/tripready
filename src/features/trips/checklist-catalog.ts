import { getCountryName } from '@/constants/countries';
import type { RequirementCategory, TripRequirementInsert } from '@/types/models';

/** Ordem em que as categorias aparecem na checklist e na tela de preparação. */
export const CHECKLIST_CATEGORIES: readonly RequirementCategory[] = [
  'documents',
  'health',
  'money',
  'connectivity',
  'luggage',
] as const;

export const CATEGORY_LABELS: Record<RequirementCategory, string> = {
  documents: 'Documentos',
  health: 'Saúde',
  money: 'Dinheiro',
  connectivity: 'Conectividade',
  luggage: 'Bagagem',
};

/** Ícones do Ionicons por categoria. */
export const CATEGORY_ICONS: Record<RequirementCategory, string> = {
  documents: 'document-text',
  health: 'medkit',
  money: 'card',
  connectivity: 'wifi',
  luggage: 'bag-handle',
};

export const PRIORITY_LABELS = {
  required: 'Obrigatório',
  recommended: 'Recomendado',
  informational: 'Informativo',
} as const;

/**
 * Checklist base de uma viagem nova.
 *
 * Propositalmente **genérica e independente de destino**: são passos de
 * preparação que valem para qualquer viagem internacional, e nenhum deles
 * afirma exigência de país nenhum. O item por país é um lembrete de conferir
 * as regras na fonte oficial — não uma regra inventada aqui.
 *
 * Quando existir o motor de requisitos reais, ele substitui esta função sem
 * mexer no restante da tela: o formato de saída é o mesmo insert da tabela.
 */
/**
 * Requisito específico de um país.
 *
 * Fica em função separada porque a edição da viagem também precisa dele: ao
 * adicionar um país, só este item entra, sem recriar a checklist inteira. Usa a
 * chave estrangeira composta (trip_id, country_code) para amarrar o requisito
 * ao destino — é isso que faz o banco remover o item em cascata quando o país
 * sai da viagem.
 */
export function buildCountryRequirement(tripId: string, code: string): TripRequirementInsert {
  return {
    trip_id: tripId,
    country_code: code.toUpperCase(),
    title: `Conferir as exigências de entrada — ${getCountryName(code)}`,
    description: 'Documentos, vistos e comprovantes pedidos na chegada.',
    priority: 'required',
    category: 'documents',
  };
}

export function buildBaseChecklist(
  tripId: string,
  countryCodes: readonly string[],
): Record<RequirementCategory, TripRequirementInsert[]> {
  return {
    documents: [
      {
        trip_id: tripId,
        title: 'Passaporte válido para toda a viagem',
        description: 'Confira a data de validade e se ainda há páginas em branco.',
        priority: 'required',
        category: 'documents',
      },
      ...countryCodes.map((code) => buildCountryRequirement(tripId, code)),
      {
        trip_id: tripId,
        title: 'Guardar cópias digitais dos documentos',
        description: 'Deixe passaporte e reservas acessíveis mesmo sem internet.',
        priority: 'recommended',
        category: 'documents',
      },
    ],
    health: [
      {
        trip_id: tripId,
        title: 'Contratar seguro viagem',
        description: 'Compare a cobertura médica e o período da apólice.',
        priority: 'recommended',
        category: 'health',
      },
      {
        trip_id: tripId,
        title: 'Anotar contatos de emergência',
        description: 'Consulado, seguradora e um contato no Brasil.',
        priority: 'informational',
        category: 'health',
      },
    ],
    money: [
      {
        trip_id: tripId,
        title: 'Organizar meios de pagamento',
        description: 'Leve mais de uma opção e avise o banco sobre a viagem.',
        priority: 'recommended',
        category: 'money',
      },
      {
        trip_id: tripId,
        title: 'Planejar o orçamento da viagem',
        description: 'Hospedagem, transporte, alimentação e um extra de reserva.',
        priority: 'informational',
        category: 'money',
      },
    ],
    connectivity: [
      {
        trip_id: tripId,
        title: 'Resolver internet no destino',
        description: 'Plano internacional, eSIM ou chip local.',
        priority: 'recommended',
        category: 'connectivity',
      },
    ],
    luggage: [
      {
        trip_id: tripId,
        title: 'Montar a lista de bagagem',
        description: 'Roupas conforme a estação, adaptador de tomada e remédios de uso.',
        priority: 'recommended',
        category: 'luggage',
      },
      {
        trip_id: tripId,
        title: 'Conferir as regras de bagagem da companhia',
        description: 'Peso, dimensões e itens que não podem ir na mão.',
        priority: 'informational',
        category: 'luggage',
      },
    ],
  };
}

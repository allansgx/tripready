import type { Locale } from './locales.ts';

/**
 * Tabelas linguísticas para formatação de data. Ficam separadas de
 * `messages/*` porque não são frases — são índices consultados por posição
 * (`monthNames(locale)[cursor.month]`), e misturar as duas coisas no mesmo
 * dicionário tornaria `completeness.test.ts` inútil para pegar uma chave de
 * frase esquecida.
 */

const MONTH_NAMES: Record<Locale, readonly string[]> = {
  'pt-BR': [
    'janeiro',
    'fevereiro',
    'março',
    'abril',
    'maio',
    'junho',
    'julho',
    'agosto',
    'setembro',
    'outubro',
    'novembro',
    'dezembro',
  ],
  en: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
  es: [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
  ],
};

/**
 * Primeira letra de cada dia, começando no domingo. `es-ES` começaria na
 * segunda; aceito como perda conhecida — ver o plano de i18n, §5.4.
 */
const WEEKDAY_INITIALS: Record<Locale, readonly string[]> = {
  'pt-BR': ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'],
  en: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
  es: ['D', 'L', 'M', 'X', 'J', 'V', 'S'],
};

/** Três letras, para os intervalos de data da checklist e da Home. */
const MONTH_ABBREVIATIONS: Record<Locale, readonly string[]> = {
  'pt-BR': ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  es: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
};

export function monthNames(locale: Locale): readonly string[] {
  return MONTH_NAMES[locale];
}

export function monthAbbreviations(locale: Locale): readonly string[] {
  return MONTH_ABBREVIATIONS[locale];
}

export function weekdayInitials(locale: Locale): readonly string[] {
  return WEEKDAY_INITIALS[locale];
}

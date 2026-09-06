/**
 * Tokens visuais do TripReady, extraídos da referência do Figma Make
 * (tela de Perfil). Toda tela nova deve consumir estes valores em vez de
 * hardcodar cores/espaçamentos.
 */

import { Platform } from 'react-native';

export const colors = {
  /** Fundo cinza claro das telas. */
  background: '#F5F5F7',
  /** Cartões brancos com cantos arredondados. */
  surface: '#FFFFFF',
  border: '#ECECEF',
  divider: '#F0F0F2',
  /** Roxo de destaque (badge, links, aba ativa). */
  primary: '#6C4EE3',
  primaryPressed: '#5B3FCB',
  /** Roxo bem claro usado no avatar e nos fundos de ícone. */
  primarySoft: '#EFEAFF',
  text: '#16161A',
  textSecondary: '#8A8A8F',
  /** Botão preto (Apple). */
  contrast: '#111114',
  contrastText: '#FFFFFF',
  danger: '#D93025',
  /** Trilho cinza das barras de progresso. */
  progressTrack: '#ECEBF2',
} as const;

/** Cores por prioridade de requisito, usadas nos pontos e etiquetas. */
export const priorityColors = {
  required: '#E5484D',
  recommended: '#F5A524',
  informational: '#3E63DD',
} as const;

/** Fundos claros das etiquetas de prioridade. */
export const prioritySoftColors = {
  required: '#FDECEC',
  recommended: '#FDF3E0',
  informational: '#EBEFFD',
} as const;

/** Cor de destaque de cada estação, usada no texto e no ícone. */
export const seasonColors = {
  winter: '#3E7FD5',
  spring: '#D4568F',
  summer: '#E08A15',
  autumn: '#B4652F',
} as const;

/**
 * Fundos das estações: a mesma cor bem diluída, para o card do progresso
 * lembrar a estação da viagem sem competir com o conteúdo.
 */
export const seasonSoftColors = {
  winter: '#EDF4FD',
  spring: '#FCEEF4',
  summer: '#FDF4E7',
  autumn: '#F9F0E9',
} as const;

/**
 * Bordas das estações: entre o fundo diluído e a cor de destaque, para o card
 * ganhar contorno sem virar um bloco colorido.
 */
export const seasonBorderColors = {
  winter: '#C9DDF5',
  spring: '#F2CFDF',
  summer: '#F5DEB8',
  autumn: '#EBD5C4',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 16,
  pill: 999,
} as const;

export const fontFamily = Platform.select({
  ios: { sans: 'system-ui', rounded: 'ui-rounded' },
  web: {
    sans: 'Inter, ui-sans-serif, system-ui, sans-serif',
    rounded: '"SF Pro Rounded", Inter, ui-sans-serif, system-ui, sans-serif',
  },
  default: { sans: 'normal', rounded: 'normal' },
})!;

export const typography = {
  /** Título de tela: "Perfil" na referência. */
  screenTitle: { fontSize: 28, lineHeight: 34, fontWeight: '700' as const },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '700' as const },
  /** Nome do usuário / rótulo principal de linha. */
  body: { fontSize: 16, lineHeight: 22, fontWeight: '500' as const },
  bodyStrong: { fontSize: 16, lineHeight: 22, fontWeight: '600' as const },
  /** Texto de apoio (e-mail, descrições). */
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const },
  /** Rótulos de seção em caixa alta ("PASSAPORTES", "CONTA"). */
  sectionLabel: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600' as const,
    letterSpacing: 0.6,
  },
} as const;

export const shadow = {
  card: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOpacity: 0.04,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 2 },
    },
    android: { elevation: 1 },
    default: {},
  })!,
} as const;

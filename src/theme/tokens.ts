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
  dangerPressed: '#B4261C',
  /** Vermelho bem claro, usado atrás de ícones e em botões destrutivos. */
  dangerSoft: '#FDECEA',
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

/**
 * Cores por momento da viagem, usadas no card da lista.
 *
 * Cada card tem um tom só, e ele diz em que ponto a viagem está: `accent` pinta
 * o anel de progresso e a bolinha da faixa, `soft` é o fundo da faixa e `text` é
 * a frase — escurecida o bastante para ler sobre o fundo diluído.
 *
 * A véspera e o dia do embarque reaproveitam o âmbar dos recomendados, que já é
 * o tom de atenção do app; o verde das futuras é o único valor novo aqui.
 */
export const tripMomentColors = {
  ongoing: { accent: colors.primary, soft: colors.primarySoft, text: colors.primary },
  imminent: {
    accent: priorityColors.recommended,
    soft: prioritySoftColors.recommended,
    text: '#946200',
  },
  upcoming: { accent: '#2FA36B', soft: '#E8F5EE', text: '#1E7A4E' },
  completed: { accent: '#C4C4CA', soft: '#F0F0F2', text: colors.textSecondary },
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

/**
 * O fundo da Home.
 *
 * `base` é um cinza levemente quente — a Home é a única tela que não usa o
 * `colors.background` neutro, porque é a única que precisa parecer um ambiente
 * e não uma folha. Sobre ela é pintado o halo da estação, em cor cheia e
 * opacidade baixíssima: é atmosfera, não bloco de cor.
 */
export const seasonBackdropColors = {
  base: '#F8F6F2',
  winter: '#5A9BE6',
  spring: '#FFA0C3',
  summer: '#FFCD46',
  autumn: '#C36428',
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
  /** Blocos protagonistas, como a contagem regressiva da Home. */
  xl: 24,
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

/**
 * Fonte de exibição, empacotada em `assets/fonts` e registrada no layout raiz.
 *
 * Só o dia do embarque usa. É o único momento em que o nome da viagem vira o
 * protagonista da tela, e a serifada dá a ele um tom de acontecimento que a
 * fonte do sistema não tem. O nome é o da família registrada pelo `expo-font`,
 * igual nas três plataformas.
 */
export const displayFont = 'Fraunces_700Bold';

export const typography = {
  /** Título de tela: "Perfil" na referência. */
  screenTitle: { fontSize: 28, lineHeight: 34, fontWeight: '700' as const },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '700' as const },
  /** Nome do usuário / rótulo principal de linha. */
  body: { fontSize: 16, lineHeight: 22, fontWeight: '500' as const },
  bodyStrong: { fontSize: 16, lineHeight: 22, fontWeight: '600' as const },
  /** Texto de apoio (e-mail, descrições). */
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const },
  /**
   * Contagem regressiva da Home: o número é o maior elemento do app, com a
   * fonte arredondada do sistema para os dígitos terem cara de viagem, e não
   * de painel de números.
   *
   * A entrelinha é um pouco maior que o corpo de propósito. Em fonte desse
   * tamanho, uma `lineHeight` justa corta a parte de cima e de baixo dos
   * dígitos no Android; a folga é a mínima que evita isso, porque cada ponto
   * gasto aqui afasta o número do rótulo logo abaixo.
   */
  countdown: {
    fontSize: 104,
    lineHeight: 112,
    fontWeight: '800' as const,
    letterSpacing: -4,
    fontFamily: fontFamily.rounded,
  },
  /** Frase que substitui o número quando não há dias a contar ("É hoje! ✈️"). */
  countdownMessage: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700' as const,
    fontFamily: fontFamily.rounded,
  },
  /**
   * O nome da viagem no dia do embarque, ocupando o lugar da contagem.
   *
   * Sem `fontWeight`: a família registrada já é a Bold e, no Android, pedir
   * peso a uma família de arquivo único faz o sistema engrossar a fonte por
   * conta própria em vez de desenhar o arquivo como ele é.
   */
  departureName: {
    fontSize: 40,
    lineHeight: 48,
    letterSpacing: -1,
    fontFamily: displayFont,
  },
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

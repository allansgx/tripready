import type { Message } from '../message.ts';

/**
 * Dicionário canônico: toda chave nasce aqui. `en.ts` e `es.ts` são tipados
 * contra `MessageKey`, então esquecer uma tradução é erro de compilação, e não
 * texto faltando em produção.
 */
export const messages = {
  'profile.language.title': 'IDIOMA',
  'profile.language.system': 'Padrão do dispositivo',

  'common.action.back': 'Voltar',
  'common.action.close': 'Fechar',
  'common.action.ok': 'OK',
  'common.search.placeholder': 'Buscar...',

  'a11y.avatar.profilePhoto': 'Foto do perfil',
  'a11y.textField.showPassword': 'Mostrar senha',
  'a11y.textField.hidePassword': 'Ocultar senha',
  'a11y.accordion.sectionProgress': '{title}, {done} de {total} verificados',

  'date.picker.previousYear': 'Ano anterior',
  'date.picker.nextYear': 'Próximo ano',
  'date.picker.backToCalendar': 'Voltar ao calendário',
  'date.picker.previousMonth': 'Mês anterior',
  'date.picker.nextMonth': 'Próximo mês',
  'date.picker.monthYear.display': '{month} de {year}',
  'date.picker.monthYear.label': '{month} de {year}. Escolher outro mês',
  'date.picker.day.label': '{day} de {month}',

  'profile.section.security': 'SEGURANÇA',
  'profile.section.legal': 'LEGAL',
  'profile.section.account': 'CONTA',
  'requirement.section.whatToCheck': 'O QUE VERIFICAR',
  'requirement.section.offers': 'OPÇÕES PARA CONTRATAR',
  'requirement.section.source': 'FONTE OFICIAL',
  'auth.login.section.signIn': 'ENTRAR',
  'trip.edit.section.name': 'NOME',
  'trip.edit.section.countries': 'PAÍSES',
  'trip.edit.section.cities': 'CIDADES',
  'trip.edit.section.dates': 'DATAS',
  'passports.section.title': 'PASSAPORTES',
  'trips.tips.sectionTitle': 'DICA PARA SUA PRÓXIMA VIAGEM',
} as const satisfies Record<string, Message>;

export type MessageKey = keyof typeof messages;

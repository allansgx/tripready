import type { Message } from '../message.ts';
import type { MessageKey } from './pt-BR.ts';

export const messages: Readonly<Record<MessageKey, Message>> = {
  'profile.language.title': 'IDIOMA',
  'profile.language.system': 'Predeterminado del dispositivo',

  'common.action.back': 'Volver',
  'common.action.close': 'Cerrar',
  'common.action.ok': 'OK',
  'common.search.placeholder': 'Buscar...',

  'a11y.avatar.profilePhoto': 'Foto de perfil',
  'a11y.textField.showPassword': 'Mostrar contraseña',
  'a11y.textField.hidePassword': 'Ocultar contraseña',
  'a11y.accordion.sectionProgress': '{title}, {done} de {total} verificados',

  'date.picker.previousYear': 'Año anterior',
  'date.picker.nextYear': 'Año siguiente',
  'date.picker.backToCalendar': 'Volver al calendario',
  'date.picker.previousMonth': 'Mes anterior',
  'date.picker.nextMonth': 'Mes siguiente',
  'date.picker.monthYear.display': '{month} de {year}',
  'date.picker.monthYear.label': '{month} de {year}. Elegir otro mes',
  'date.picker.day.label': '{day} de {month}',

  'profile.section.security': 'SEGURIDAD',
  'profile.section.legal': 'LEGAL',
  'profile.section.account': 'CUENTA',
  'requirement.section.whatToCheck': 'QUÉ VERIFICAR',
  'requirement.section.offers': 'DÓNDE CONTRATARLO',
  'requirement.section.source': 'FUENTE OFICIAL',
  'auth.login.section.signIn': 'INICIAR SESIÓN',
  'trip.edit.section.name': 'NOMBRE',
  'trip.edit.section.countries': 'PAÍSES',
  'trip.edit.section.cities': 'CIUDADES',
  'trip.edit.section.dates': 'FECHAS',
  'passports.section.title': 'PASAPORTES',
  'trips.tips.sectionTitle': 'CONSEJO PARA TU PRÓXIMO VIAJE',
};

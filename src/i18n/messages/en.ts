import type { Message } from '../message.ts';
import type { MessageKey } from './pt-BR.ts';

export const messages: Readonly<Record<MessageKey, Message>> = {
  'profile.language.title': 'LANGUAGE',
  'profile.language.system': 'System default',

  'common.action.back': 'Back',
  'common.action.close': 'Close',
  'common.action.ok': 'OK',
  'common.search.placeholder': 'Search...',

  'a11y.avatar.profilePhoto': 'Profile photo',
  'a11y.textField.showPassword': 'Show password',
  'a11y.textField.hidePassword': 'Hide password',
  'a11y.accordion.sectionProgress': '{title}, {done} of {total} checked',

  'date.picker.previousYear': 'Previous year',
  'date.picker.nextYear': 'Next year',
  'date.picker.backToCalendar': 'Back to calendar',
  'date.picker.previousMonth': 'Previous month',
  'date.picker.nextMonth': 'Next month',
  'date.picker.monthYear.display': '{month} {year}',
  'date.picker.monthYear.label': '{month} {year}. Choose another month',
  'date.picker.day.label': '{month} {day}',

  'profile.section.security': 'SECURITY',
  'profile.section.legal': 'LEGAL',
  'profile.section.account': 'ACCOUNT',
  'requirement.section.whatToCheck': 'WHAT TO CHECK',
  'requirement.section.offers': 'WHERE TO GET IT',
  'requirement.section.source': 'OFFICIAL SOURCE',
  'auth.login.section.signIn': 'SIGN IN',
  'trip.edit.section.name': 'NAME',
  'trip.edit.section.countries': 'COUNTRIES',
  'trip.edit.section.cities': 'CITIES',
  'trip.edit.section.dates': 'DATES',
  'passports.section.title': 'PASSPORTS',
  'trips.tips.sectionTitle': 'TIP FOR YOUR NEXT TRIP',
};

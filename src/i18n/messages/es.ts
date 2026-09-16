import type { Message } from '../message.ts';
import type { MessageKey } from './pt-BR.ts';

export const messages: Readonly<Record<MessageKey, Message>> = {
  'profile.language.title': 'IDIOMA',
  'profile.language.system': 'Predeterminado del dispositivo',

  'common.action.back': 'Volver',
  'common.action.close': 'Cerrar',
  'common.action.ok': 'OK',
  'common.action.check': 'Verificar',
  'common.action.open': 'Abrir',
  'common.action.continue': 'Continuar',
  'common.action.clear': 'Borrar',
  'common.action.change': 'Cambiar',
  'common.action.retry': 'Intentar de nuevo',
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

  'common.action.cancel': 'Cancelar',
  'common.field.email.label': 'Correo electrónico',
  'common.field.email.placeholder': 'tu@email.com',
  'common.field.password.label': 'Contraseña',
  'common.field.name.label': 'Nombre',
  'common.field.name.placeholder': 'Cómo quieres que te llamemos',

  'legal.consent.continue': 'Al continuar, aceptas los {terms} y la {privacy}.',
  'legal.consent.createAccount': 'Al crear tu cuenta, aceptas los {terms} y la {privacy}.',
  'legal.termsOfUse.linkLabel': 'Términos de uso',
  'legal.privacyPolicy.linkLabel': 'Política de privacidad',
  'legal.document.subtitle': 'Versión {version} · vigente desde {date}',
  'legal.document.footer': 'Versión {version} — {date}',

  'auth.error.unexpected': 'Error inesperado en la autenticación.',
  'auth.error.invalidCredentials': 'Correo electrónico o contraseña incorrectos.',
  'auth.error.emailNotConfirmed':
    'Confirma tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.',
  'auth.error.userAlreadyRegistered': 'Este correo electrónico ya está registrado.',
  'auth.error.invalidEmailFormat': 'Correo electrónico inválido.',
  'auth.error.invalidPassword': 'Ingresa una contraseña válida.',
  'auth.error.rateLimited': 'Demasiados intentos seguidos. Espera unos minutos.',
  'auth.error.tooManyRequests': 'Por seguridad, espera 60 segundos antes de intentar de nuevo.',
  'auth.error.currentPasswordRequired': 'Ingresa tu contraseña actual.',
  'auth.error.currentPasswordInvalid': 'La contraseña actual no coincide.',
  'auth.error.samePassword': 'La nueva contraseña debe ser diferente de la actual.',
  'auth.error.passwordRejected':
    'La contraseña todavía no cumple todos los requisitos de la lista.',
  'auth.error.callbackFailed': 'Error de autenticación: {code}',
  'auth.error.missingAuthUrl': 'Supabase no devolvió la URL de autenticación.',
  'auth.error.missingAppleToken': 'Apple no devolvió el identity token.',

  'auth.password.rule.length': 'Al menos {min} caracteres',
  'auth.password.rule.uppercase': 'Letra mayúscula',
  'auth.password.rule.lowercase': 'Letra minúscula',
  'auth.password.rule.digit': 'Número',
  'auth.password.rule.symbol': 'Símbolo',
  'auth.password.strength.weak': 'Débil',
  'auth.password.strength.medium': 'Media',
  'auth.password.strength.strong': 'Fuerte',
  'auth.password.placeholder.minLength': 'Mínimo de {min} caracteres',
  'a11y.password.strength': 'Seguridad de la contraseña: {strength}',
  'a11y.password.rule': '{rule}: {status}',
  'auth.password.rule.status.met': 'cumplido',
  'auth.password.rule.status.pending': 'pendiente',

  'auth.email.error.empty': 'Ingresa tu correo electrónico.',
  'auth.email.error.invalid': 'Ingresa un correo electrónico válido.',
  'auth.email.error.typo': '¿Quisiste decir @{suggestion}?',

  'auth.deleteAccount.confirmationWord': 'Eliminar',
  'auth.deleteAccount.title': 'Eliminar cuenta',
  'auth.deleteAccount.warning':
    'Esta acción es **permanente e irreversible**. Todos tus datos, viajes y documentos serán eliminados.',
  'auth.deleteAccount.field.label': 'Escribe {word} para confirmar',
  'auth.deleteAccount.field.a11yLabel': 'Escribe {word} para confirmar la eliminación de la cuenta',
  'auth.deleteAccount.confirmButton': 'Eliminar mi cuenta',

  'auth.profile.defaultDisplayName': 'Usuario',
  'auth.provider.google': 'Google',
  'auth.provider.apple': 'Apple',

  'auth.login.tagline': 'Todo lo que necesitas antes de viajar, organizado en un solo lugar.',
  'auth.login.continueWithGoogle': 'Continuar con Google',
  'auth.login.continueWithApple': 'Continuar con Apple',
  'auth.login.continueWithEmail': 'Iniciar sesión con correo',

  'auth.emailLogin.title': 'Iniciar sesión',
  'auth.emailLogin.subtitle': 'Usa el correo y la contraseña de tu cuenta de TripReady.',
  'auth.emailLogin.error.empty': 'Completa el correo y la contraseña.',
  'auth.emailLogin.submit': 'Iniciar sesión',
  'auth.emailLogin.forgotPassword': 'Olvidé mi contraseña',
  'auth.emailLogin.createAccount': 'Crear una cuenta',

  'auth.signUp.title': 'Crear cuenta',
  'auth.signUp.subtitle': 'Regístrate con correo y contraseña.',
  'auth.signUp.error.missingName': 'Ingresa tu nombre.',
  'auth.signUp.error.invalidPassword': 'La contraseña todavía no cumple todos los requisitos.',
  'auth.signUp.error.passwordMismatch': 'Las contraseñas no coinciden.',
  'auth.signUp.confirmEmail.title': 'Confirma tu correo electrónico',
  'auth.signUp.confirmEmail.subtitle':
    'Enviamos un enlace de confirmación a {email}. Abre el enlace y vuelve para iniciar sesión.',
  'auth.signUp.confirmEmail.backToLogin': 'Volver al inicio de sesión',
  'auth.signUp.field.confirmPassword.label': 'Confirmar contraseña',
  'auth.signUp.field.confirmPassword.placeholder': 'Repite la contraseña',
  'auth.signUp.submit': 'Crear cuenta',

  'auth.forgotPassword.title': 'Recuperar contraseña',
  'auth.forgotPassword.subtitle': 'Te enviaremos un enlace para que vuelvas a acceder a la cuenta.',
  'auth.forgotPassword.error.empty': 'Ingresa el correo de la cuenta.',
  'auth.forgotPassword.success':
    'Si existe una cuenta con ese correo, el enlace de recuperación ya está en camino. El enlace abre la app con la sesión iniciada.',
  'auth.forgotPassword.submit': 'Enviar enlace de recuperación',

  'auth.changePassword.title': 'Cambiar contraseña',
  'auth.changePassword.error.missingCurrent': 'Ingresa tu contraseña actual.',
  'auth.changePassword.error.invalidNew':
    'La nueva contraseña todavía no cumple todos los requisitos.',
  'auth.changePassword.error.mismatch': 'Las contraseñas no coinciden.',
  'auth.changePassword.successTitle': 'Contraseña actualizada',
  'auth.changePassword.successMessage': 'Usa la nueva contraseña en el próximo acceso.',
  'auth.changePassword.field.current.label': 'Contraseña actual',
  'auth.changePassword.field.new.label': 'Nueva contraseña',
  'auth.changePassword.field.new.placeholder': 'Escribe la nueva contraseña',
  'auth.changePassword.field.confirmNew.label': 'Confirmar nueva contraseña',
  'auth.changePassword.field.confirmNew.placeholder': 'Repite la nueva contraseña',
  'auth.changePassword.submit': 'Cambiar contraseña',

  'profile.title': 'Perfil',
  'profile.editButton': 'Editar',
  'profile.privacyPolicy': 'Política de privacidad',
  'profile.termsOfUse': 'Términos de uso',
  'profile.signOut': 'Cerrar sesión',
  'profile.deleteAccount': 'Eliminar cuenta',

  'profile.edit.title': 'Editar perfil',
  'profile.edit.managedBy': 'Gestionado por tu cuenta de {provider}',
  'profile.edit.externalNotice':
    'Tu cuenta está vinculada a {provider}. Para cambiar el nombre, el correo o la contraseña, ve a la configuración de tu cuenta de {provider}.',
  'profile.edit.submit': 'Guardar cambios',
  'profile.security.passwordRow.label': 'Contraseña',
  'profile.security.passwordRow.description': 'Cambia tu contraseña de acceso',

  'passports.addPassport': 'Agregar pasaporte',
  'passports.section.primaryTag': 'Principal',
  'passports.error.connection': 'Tu conexión falló. Inténtalo de nuevo.',
  'passports.error.loginRequired': 'Inicia sesión para agregar un pasaporte.',
  'passports.error.onlyOne':
    'Este es tu único pasaporte. Agrega otro y defínelo como principal para poder eliminar este.',
  'passports.error.mustPromoteFirst':
    'Este es tu pasaporte principal. Define otro como principal antes de eliminarlo.',

  'passports.dialog.cannotComplete': 'No se pudo completar',
  'passports.dialog.onlyPrimary.message':
    'Este es tu único pasaporte y está definido como principal. Para eliminarlo, agrega otro pasaporte y defínelo como principal.',
  'passports.dialog.primary.message':
    'Pasaporte principal. Para eliminarlo, define otro pasaporte como principal antes.',
  'passports.dialog.setPrimary': 'Definir como principal',
  'passports.dialog.remove': 'Eliminar pasaporte',
  'passports.dialog.removeConfirm.title': '¿Eliminar {name}?',
  'passports.dialog.removeConfirm.message': 'Puedes agregarlo de nuevo cuando quieras.',
  'passports.dialog.removeConfirm.confirm': 'Eliminar',

  'passports.picker.search.byCity': 'Buscar país o ciudad...',
  'passports.picker.search.byCountry': 'Buscar país...',
  'passports.picker.empty.byCity': 'No se encontró ningún destino para “{query}”.',
  'passports.picker.empty.byCountry': 'No se encontró ningún país para “{query}”.',
  'passports.picker.title': 'Agregar pasaporte',
  'passports.picker.addFailed.title': 'No se pudo agregar',
  'passports.picker.addFailed.fallback': 'Inténtalo de nuevo.',

  'a11y.passport.primary': '{name}, pasaporte principal',
  'a11y.passport.openOptions': 'Abre las opciones del pasaporte',
  'a11y.countryRow.withCity': '{country}, {city}',
  'a11y.countryRow.alreadyAdded': 'Ya agregado',

  'onboarding.saveFailed.title': 'No se pudo guardar',
  'onboarding.title': '¿Con qué pasaporte viajas?',
  'onboarding.subtitle':
    'Usamos esta información para encontrar los requisitos de cada destino. Puedes agregar otros pasaportes más adelante, en tu perfil.',

  'trip.limit.countries': 'Puedes agregar hasta {max} países por viaje.',
  'trip.limit.duration': 'Elige un período de hasta {max} días.',
  'trip.limit.range': 'Elige la fecha de regreso a partir de la fecha de ida.',
  'trip.limit.durationHint': 'Hasta {max} días por viaje',
  'trip.countrySelection.atLimit': '{max} de {max} países',
  'trip.countrySelection': {
    one: '{count} país seleccionado',
    other: '{count} países seleccionados',
  },

  'trips.progress.empty': 'Lista en preparación',
  'trips.progress.checked': {
    one: '{done} de {total} elemento verificado',
    other: '{done} de {total} elementos verificados',
  },
  'trips.progress.fraction': { one: '{done}/{total} elemento', other: '{done}/{total} elementos' },
  'trips.progress.pending': {
    one: '{count} elemento pendiente',
    other: '{count} elementos pendientes',
  },
  'trips.progress.allChecked': 'Todo verificado',
  'trips.progress.referenceEmpty': 'Tu lista sigue a mano.',
  'trips.progress.reference': {
    one: '1 información para consultar cuando la necesites.',
    other: '{count} informaciones para consultar cuando las necesites.',
  },
  'trips.progress.requiredPending': { one: '1 obligatorio', other: '{count} obligatorios' },

  'trip.moment.completed': 'Concluido',
  'trip.moment.boardingToday': 'Embarque hoy',
  'trip.moment.ongoing': 'Viaje en curso',
  'trip.moment.undated': 'Elige las fechas',
  'trip.moment.tomorrow': 'Comienza mañana',
  'trip.moment.daysUntil': 'Comienza en {days} días',
  'trip.moment.monthsUntil': {
    one: 'Comienza en {months} mes',
    other: 'Comienza en {months} meses',
  },

  'trip.countdown.today.message': '¡Llegó la hora!',
  'trip.countdown.today.label': '¡BUEN VIAJE!',
  'trip.countdown.ongoing.label': 'DE {totalDays} DÍAS',
  'trip.countdown.ongoingUndated.message': '¡Disfruta!',
  'trip.countdown.ongoingUndated.label': 'VIAJE EN CURSO',
  'trip.countdown.undated.message': 'Ya casi...',
  'trip.countdown.undated.label': 'ELIGE LAS FECHAS PARA VER LA CUENTA REGRESIVA',
  'trip.countdown.tomorrow.message': 'Falta 1 día',
  'trip.countdown.tomorrow.label': 'ÚLTIMOS PREPARATIVOS',
  'trip.countdown.days.label': 'DÍAS PARA VIAJAR',

  'trip.returnCountdown.lastDay': 'último día',
  'trip.returnCountdown.tomorrow': 'regresa mañana',
  'trip.returnCountdown.daysLeft': 'regresa en {days} días',

  'date.range.undated': 'Fechas por definir',
  'date.range.openStart': 'Desde el {day} {month} {year}',
  'date.range.openEnd': 'Hasta el {day} {month} {year}',
  'date.range.diffYear': '{fromDay} {fromMonth} {fromYear} – {toDay} {toMonth} {toYear}',
  'date.range.diffMonth': '{fromDay} {fromMonth} – {toDay} {toMonth} {year}',
  'date.range.sameMonth': '{fromDay}–{toDay} {month} {year}',
  'date.single': '{day} {month} {year}',

  'trip.name.default': 'Mi viaje',
  'trip.name.twoCountries': '{a} y {b}',
  'trip.name.moreCountries': '{a}, {b} y {count} más',

  'trip.region.centralEurope': 'Europa Central',
  'trip.region.westernEurope': 'Europa Occidental',
  'trip.region.southernEurope': 'Sur de Europa',
  'trip.region.scandinavia': 'Escandinavia',
  'trip.region.balkans': 'Balcanes',
  'trip.region.southeastAsia': 'Sudeste Asiático',
  'trip.region.eastAsia': 'Este de Asia',
  'trip.region.middleEast': 'Oriente Medio',
  'trip.region.southAmerica': 'América del Sur',
  'trip.region.centralAmerica': 'América Central',
  'trip.region.northAmerica': 'América del Norte',
  'trip.region.oceania': 'Oceanía',
  'trip.region.northAfrica': 'Norte de África',

  'season.name.winter': 'Invierno',
  'season.name.spring': 'Primavera',
  'season.name.summer': 'Verano',
  'season.name.autumn': 'Otoño',
  'season.complement.winter': 'en invierno',
  'season.complement.spring': 'en primavera',
  'season.complement.summer': 'en verano',
  'season.complement.autumn': 'en otoño',
  'season.context.allSeasons': '🌎 {count} estaciones',
  'season.plural': 'estaciones',

  'trip.travelVerb.upcoming': 'Viajarás',
  'trip.travelVerb.ongoing': 'Estás viajando',
  'trip.travelVerb.completed': 'Viajaste',
  'trip.crossingVerb.upcoming': 'Tu viaje pasa por',
  'trip.crossingVerb.ongoing': 'Tu viaje pasa por',
  'trip.crossingVerb.completed': 'Tu viaje pasó por',
  'trip.seasonCount.two': 'dos',
  'trip.seasonCount.three': 'tres',
  'trip.seasonCount.four': 'cuatro',

  'trips.checklist.wholeTrip': 'Todo el viaje',

  'trips.requiredPendingCount': {
    one: '1 obligatorio pendiente',
    other: '{count} obligatorios pendientes',
  },
  'a11y.tripCard.openChecklist': 'Abre la lista del viaje',
  'trip.card.ready': '¡Lista! 🎉',

  'a11y.tripHero.dayOf': 'Día {day} de {total}',
  'a11y.tripHero.checkItem': 'Verificar: {title}',
  'a11y.tripHero.openChecklist': 'Abrir la lista del viaje',
  'a11y.tripHero.openChecklistHint': 'Abre la lista del viaje',

  'trip.hero.section.ongoing': 'En el viaje',
  'trip.hero.section.departure': 'Antes de embarcar',
  'trip.hero.section.preparing': 'Preparación',
  'trip.hero.nextStep.checkNow': '✨ VERIFICA AHORA',
  'trip.hero.nextStep.next': '✨ SIGUIENTE PASO',
  'trip.hero.nextStep.ready': '🎉 TODO LISTO',
  'trip.hero.nextStep.start': '✨ EMPIEZA AQUÍ',
  'trip.hero.allChecked': 'Ya verificaste todos los elementos importantes.',
  'trip.hero.pendingHint': 'Mira qué falta revisar antes de viajar.',
  'trip.hero.tipLabel': '💡 Consejo del viaje',

  'trips.cityStep.none': 'Aún no hay ciudades',
  'trips.cityStep.emptyCountry': 'Ciudades por definir en este país.',
  'trips.cityStep.addPlaceholder': 'Agregar otra ciudad',
  'trips.cityStep.addPlaceholderEmpty': 'Escribe una ciudad de este país',
  'a11y.cityStep.openCountry': 'Muestra las ciudades de este país',
  'a11y.cityStep.removeCountry': 'Quitar {country} del itinerario',
  'a11y.cityStep.addCity': 'Agregar ciudad',
  'a11y.cityStep.removeCity': 'Quitar {city}',

  'a11y.celebration.close': 'Cerrar celebración',

  'a11y.tripCountryChips.more': {
    one: 'y 1 destino más',
    other: 'y {count} destinos más',
  },

  'trips.filter.all': 'Todas',
  'trips.filter.ongoing': 'En curso',
  'trips.filter.upcoming': 'Próximas',
  'trips.filter.completed': 'Concluidas',
  'a11y.tripFilter.filterBy': 'Filtrar por {filter}',

  'trips.dateRange.hint': 'Elige la fecha de ida en el calendario.',
  'trips.dateRange.depart': 'IDA',
  'trips.dateRange.return': 'VUELTA',
  'trips.dateRange.pending': 'por elegir',
  'trips.dateRange.chooseReturn': 'Ahora toca la fecha de vuelta.',
  'trips.dateRange.duration': {
    one: '{days} día de viaje',
    other: '{days} días de viaje',
  },
  'a11y.dateRange.clear': 'Borrar fechas',

  'trips.action.create': 'Crear viaje',
  'trips.action.edit': 'Editar viaje',
  'trips.action.delete': 'Eliminar viaje',
  'trips.action.backToTrip': 'Volver al viaje',
  'trips.error.loadRetry': 'Tu conexión falló. Toca para cargar de nuevo.',
  'trips.error.menuRetry': 'Tu conexión falló. Toca el menú para volver a intentar.',
  'a11y.openItem': 'Abrir {name}',

  'trips.home.loading': 'Buscando tu próximo viaje...',
  'trips.home.loadRetryButton': 'Cargar viaje',
  'trips.home.emptyTitle': '¿A dónde vas?',
  'trips.home.emptyText':
    'Crea tu viaje y sigue aquí la cuenta regresiva y todo lo que preparar antes de embarcar.',

  'trips.list.title': 'Mis viajes',
  'a11y.trips.createNew': 'Crear nuevo viaje',
  'trips.list.loading': 'Buscando tus viajes...',
  'trips.list.loadRetryButton': 'Cargar viajes',
  'trips.list.emptyTitle': 'Aún no tienes ningún viaje',
  'trips.list.emptyText': 'Crea tu primer viaje para descubrir qué verificar antes de embarcar.',

  'trips.filterEmpty.ongoing.text': 'Cuando tu viaje empiece, aparecerá aquí.',
  'trips.filterEmpty.ongoing.action': 'Ver las próximas',
  'trips.filterEmpty.upcoming.text': '¿Qué tal planear el próximo?',
  'trips.filterEmpty.completed.text': 'Tus viajes concluidos se guardan aquí.',
  'trips.filterEmpty.completed.action': 'Ver todas',

  'trips.menu.testReminders': 'Probar recordatorios',
  'trips.reminders.permissionNeeded':
    'Activa los recordatorios en los ajustes del sistema para ver la prueba.',
  'trips.reminders.none': 'Este viaje no tiene ningún recordatorio para mostrar ahora.',
  'trips.reminders.scheduled': {
    one: '1 recordatorio en camino. Cierra la app para verlo.',
    other: '{count} recordatorios en camino. Cierra la app para verlos.',
  },

  'trips.deleteConfirm.title': '¿Eliminar este viaje?',
  'trips.deleteConfirm.message': 'Este viaje y su lista se eliminarán de tu historial.',

  'trips.checklist.loading': 'Abriendo tu lista...',
  'trips.checklist.loadRetry': 'Tu conexión falló. Toca actualizar para ver la lista.',
  'trips.checklist.toggleRetry': 'Tu conexión falló. Toca el elemento de nuevo para guardar.',
  'a11y.trips.menuOptions': 'Opciones del viaje',
  'trips.checklist.empty': 'Tu lista aparece aquí en cuanto esté lista.',
  'trips.checklist.itemCount': { one: '{count} elemento', other: '{count} elementos' },
  'trips.checklist.refresh': 'Actualizar lista',
  'trips.checklist.allRequiredDone': '✓ ¡Todo listo con los elementos obligatorios!',

  'trips.celebration.allDone.title': '¡Todo listo! 🎉',
  'trips.celebration.allDone.message': 'Verificaste todos los elementos de la lista. ¡Buen viaje!',
  'trips.celebration.ready.title': '¡Viaje listo! 🎉',
  'trips.celebration.ready.message': 'Verificaste todos los elementos obligatorios.',

  'a11y.requirement.uncheck': 'Desmarcar {title}',
  'a11y.requirement.check': 'Marcar {title} como verificado',

  'requirement.affiliateDisclosure':
    'Algunas sugerencias pueden generar una comisión para TripReady, sin costo adicional para ti.',
  'requirement.officialReminder': 'Confirma siempre en los canales oficiales antes de viajar.',
  'requirement.notFound': 'Este elemento ya no está en tu lista.',
  'requirement.error.loadRetry': 'Tu conexión falló. Vuelve y abre el elemento de nuevo.',
  'requirement.error.toggleRetry': 'Tu conexión falló. Toca de nuevo para guardar.',
  'a11y.requirement.openSource': 'Abrir la fuente oficial: {name}',
  'requirement.uncheckButton': 'Desmarcar elemento',
  'requirement.checkButton': '✓ Marcar como verificado',
  'trips.detail.title': 'Detalles',

  'trip.name.label': 'Nombre del viaje',
  'trip.countryStep.title': '¿A dónde vas?',

  'trip.new.title.countries': '¿A dónde vas?',
  'trip.new.title.cities': '¿Qué ciudades piensas visitar?',
  'trip.new.title.dates': '¿Cuándo viajas?',
  'trip.new.title.name': '¿Cómo quieres llamar a este viaje?',
  'trip.new.subtitle.countries': 'Elige uno o más países de tu itinerario.',
  'trip.new.subtitle.cities':
    'Elige las ciudades que ya están en el plan. Puedes decidirlo después.',
  'trip.new.subtitle.dates': 'Toca la fecha de ida y luego la de vuelta.',
  'trip.new.subtitle.name': 'Revisa el itinerario y ajusta el nombre si quieres.',
  'trip.new.stepIndicator': 'Paso {current} de {total}',
  'trip.new.error.createRetry': 'Tu conexión falló. Toca "Crear viaje" para volver a intentar.',
  'trip.new.hint.chooseCountry': 'Elige al menos un país para continuar.',
  'trip.new.continueWithCountries': {
    one: 'Continuar con {count} país',
    other: 'Continuar con {count} países',
  },
  'trip.new.skipForNow': 'Omitir por ahora',
  'trip.new.continueWithCities': {
    one: 'Continuar con {count} ciudad',
    other: 'Continuar con {count} ciudades',
  },
  'trip.new.name.placeholder': 'Mi viaje',

  'trip.review.dates.label': 'FECHAS',
  'trip.review.dates.action': 'Cambiar fechas',
  'trip.review.itinerary.label': 'ITINERARIO',
  'trip.review.itinerary.action': 'Cambiar itinerario',

  'trip.edit.error.loadRetry': 'Tu conexión falló. Toca guardar para volver a intentar.',
  'trip.edit.discardConfirm.title': '¿Descartar cambios?',
  'trip.edit.discardConfirm.message': 'Tienes cambios que aún no se guardaron.',
  'trip.edit.discardConfirm.continue': 'Seguir editando',
  'trip.edit.discardConfirm.discard': 'Descartar',
  'trip.edit.error.saveRetry': 'Tu conexión falló. Toca "Guardar cambios" para volver a intentar.',
  'trip.edit.loading': 'Abriendo tu viaje...',
  'trip.edit.countryPicker.subtitle': 'Toca para agregar o quitar países del itinerario.',
  'trip.edit.countryPicker.done': 'Terminar selección',
  'trip.edit.hint.keepCountry': 'Mantén al menos un país en el itinerario.',
  'trip.edit.savedBanner': '¡Viaje actualizado! 🎉',
  'trip.edit.name.placeholder': 'Europa Central',
  'a11y.tripEdit.removeCountry': 'Quitar {country}',
  'trip.edit.addRemoveCountries': 'Agregar o quitar países',
  'trip.edit.save': 'Guardar cambios',
  'trip.edit.hint.changeToSave': 'Cambia algo arriba para guardar.',

  'trip.preparing.title.loading': 'Preparando tu lista...',
  'trip.preparing.title.done': '¡Lista lista! 🎉',
  'trip.preparing.subtitle.loading': 'Estamos organizando lo que necesitas verificar.',
  'trip.preparing.subtitle.done': 'Tu lista personalizada está lista.',
  'trip.preparing.error.retry': 'Tu conexión falló. Toca para continuar la preparación.',
  'trip.preparing.continueButton': 'Continuar preparación',
  'trip.preparing.viewNow': 'Ver el viaje ahora',

  'account.deleting.step.trips': 'Viajes y listas',
  'account.deleting.step.passports': 'Pasaportes',
  'account.deleting.step.profile': 'Datos del perfil',
  'account.deleting.step.account': 'Cuenta y acceso',
  'account.deleting.error.connection': 'Tu conexión falló. Toca para volver a intentar.',
  'account.deleting.error.session': 'Tu sesión expiró. Vuelve a entrar para eliminar la cuenta.',
  'account.deleting.error.unknown': 'No se pudo terminar ahora. Toca para volver a intentar.',
  'account.deleting.title.loading': 'Eliminando tu cuenta...',
  'account.deleting.title.done': 'Cuenta eliminada',
  'account.deleting.subtitle.loading': 'Estamos eliminando tus datos.',
  'account.deleting.subtitle.done': 'Tu cuenta y tus datos se eliminaron correctamente.',
  'account.deleting.goToLogin': 'Ir a iniciar sesión',
  'account.deleting.backToProfile': 'Volver al perfil',

  'auth.callback.loading': 'Terminando el inicio de sesión...',

  'app.connectionError': 'Tu conexión falló.',

  'tabs.home': 'Inicio',
  'tabs.trips': 'Viajes',
  'tabs.profile': 'Perfil',

  'reminder.approaching.title': '✈️ Tu viaje se acerca',
  'reminder.eve.title': '✈️ ¡Mañana es el gran día!',
  'reminder.pending.required': {
    one: 'Todavía tienes 1 elemento obligatorio por revisar.',
    other: 'Todavía tienes {count} elementos obligatorios por revisar.',
  },
  'reminder.pending.recommended': {
    one: 'Tienes 1 elemento recomendado para revisar.',
    other: 'Tienes {count} elementos recomendados para revisar.',
  },
  'reminder.eve.genericBody': 'Haz una última revisión de tu lista antes de viajar.',
  'reminder.channelName': 'Recordatorios de viaje',

  'reminder.optIn.title': '¿Quieres recibir recordatorios de este viaje?',
  'reminder.optIn.message': 'Te avisaremos cuando sea hora de revisar los elementos pendientes.',
  'reminder.optIn.enable': 'Activar recordatorios',
  'reminder.optIn.dismiss': 'Ahora no',

  'checklist.category.documents': 'Documentos',
  'checklist.category.health': 'Salud',
  'checklist.category.money': 'Dinero',
  'checklist.category.connectivity': 'Conectividad',
  'checklist.category.luggage': 'Equipaje',
  'checklist.priority.required': 'Obligatorio',
  'checklist.priority.recommended': 'Recomendado',
  'checklist.priority.informational': 'Informativo',

  'travelTip.passportValidity':
    'Verifica la vigencia de tu pasaporte. Algunos destinos exigen meses de vigencia más allá de la fecha del viaje.',
  'travelTip.documentCopies':
    'Guarda una copia de los documentos importantes. Mantenlos accesibles incluso sin internet.',
  'travelTip.backupPayment':
    'Lleva una segunda forma de pago. Una tarjeta de reserva puede ayudar si la principal falla.',
  'travelTip.offlineMaps':
    'Descarga mapas y reservas antes de salir. Así puedes acceder a ellos incluso sin internet.',
  'travelTip.medication':
    'Lleva tus medicamentos de uso continuo en el equipaje de mano. Verifica también si necesitas receta o documentación.',
  'travelTip.powerPlug':
    'Verifica el tipo de enchufe del destino. Un adaptador pequeño puede resolverlo a la llegada.',
  'travelTip.carryOnClothes':
    'Lleva una muda de ropa en el equipaje de mano. Ayuda si la maleta facturada tarda en aparecer.',
  'travelTip.travelInsurance':
    'Considera un seguro de viaje. Algunos destinos piden comprobante en la entrada.',
  'travelTip.vaccination':
    'Verifica si el destino pide comprobante de vacunación. Algunas dosis deben aplicarse con anticipación.',
  'travelTip.connectivity':
    'Piensa cómo te conectarás en el destino: roaming, chip local o eSIM. Resolverlo antes evita apuros a la llegada.',
  'travelTip.airportTiming':
    'Confirma con la aerolínea la anticipación recomendada para el embarque. Varía según el aeropuerto y el tipo de vuelo.',
  'travelTip.localCash':
    'Considera llevar algo de efectivo local. No todos los lugares aceptan tarjeta, sobre todo en transporte y tiendas pequeñas.',
  'travelTip.emergencyContacts':
    'Anota los contactos del alojamiento y de la representación de tu país en el destino. Fácil de encontrar si lo necesitas.',
  'travelTip.baggageAllowance':
    'Verifica el límite de equipaje de tu boleto antes de armar las maletas. Cada aerolínea tiene su propia regla.',
  'travelTip.weather':
    'Consulta el pronóstico cerca de la fecha del viaje. Te ayuda a decidir qué llevar.',
};

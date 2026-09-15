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

  'common.action.cancel': 'Cancel',
  'common.field.email.label': 'Email',
  'common.field.email.placeholder': 'you@email.com',
  'common.field.password.label': 'Password',
  'common.field.name.label': 'Name',
  'common.field.name.placeholder': 'What should we call you',

  'legal.consent.continue': 'By continuing, you agree to our {terms} and {privacy}.',
  'legal.consent.createAccount':
    'By creating your account, you agree to our {terms} and {privacy}.',
  'legal.termsOfUse.linkLabel': 'Terms of Use',
  'legal.privacyPolicy.linkLabel': 'Privacy Policy',

  'auth.error.unexpected': 'Unexpected authentication error.',
  'auth.error.invalidCredentials': 'Incorrect email or password.',
  'auth.error.emailNotConfirmed': 'Confirm your email before signing in. Check your inbox.',
  'auth.error.userAlreadyRegistered': 'This email is already registered.',
  'auth.error.invalidEmailFormat': 'Invalid email.',
  'auth.error.invalidPassword': 'Enter a valid password.',
  'auth.error.rateLimited': 'Too many attempts. Wait a few minutes.',
  'auth.error.tooManyRequests': 'For security, wait 60 seconds before trying again.',
  'auth.error.currentPasswordRequired': 'Enter your current password.',
  'auth.error.currentPasswordInvalid': 'Current password does not match.',
  'auth.error.samePassword': 'The new password must be different from the current one.',
  'auth.error.passwordRejected': 'The password still does not meet all the requirements.',
  'auth.error.callbackFailed': 'Authentication failed: {code}',
  'auth.error.missingAuthUrl': 'Supabase did not return the authentication URL.',
  'auth.error.missingAppleToken': 'Apple did not return the identity token.',

  'auth.password.rule.length': 'At least {min} characters',
  'auth.password.rule.uppercase': 'Uppercase letter',
  'auth.password.rule.lowercase': 'Lowercase letter',
  'auth.password.rule.digit': 'Number',
  'auth.password.rule.symbol': 'Symbol',
  'auth.password.strength.weak': 'Weak',
  'auth.password.strength.medium': 'Medium',
  'auth.password.strength.strong': 'Strong',
  'auth.password.placeholder.minLength': 'At least {min} characters',
  'a11y.password.strength': 'Password strength: {strength}',
  'a11y.password.rule': '{rule}: {status}',
  'auth.password.rule.status.met': 'met',
  'auth.password.rule.status.pending': 'pending',

  'auth.email.error.empty': 'Enter your email.',
  'auth.email.error.invalid': 'Enter a valid email.',
  'auth.email.error.typo': 'Did you mean @{suggestion}?',

  'auth.deleteAccount.confirmationWord': 'Delete',
  'auth.deleteAccount.title': 'Delete account',
  'auth.deleteAccount.warning':
    'This action is **permanent and irreversible**. All your data, trips, and documents will be deleted.',
  'auth.deleteAccount.field.label': 'Type {word} to confirm',
  'auth.deleteAccount.field.a11yLabel': 'Type {word} to confirm account deletion',
  'auth.deleteAccount.confirmButton': 'Delete my account',

  'auth.profile.defaultDisplayName': 'User',
  'auth.provider.google': 'Google',
  'auth.provider.apple': 'Apple',

  'auth.login.tagline': 'Everything you need before traveling, organized in one place.',
  'auth.login.continueWithGoogle': 'Continue with Google',
  'auth.login.continueWithApple': 'Continue with Apple',
  'auth.login.continueWithEmail': 'Sign in with email',

  'auth.emailLogin.title': 'Sign in',
  'auth.emailLogin.subtitle': 'Use the email and password from your TripReady account.',
  'auth.emailLogin.error.empty': 'Fill in email and password.',
  'auth.emailLogin.submit': 'Sign in',
  'auth.emailLogin.forgotPassword': 'Forgot my password',
  'auth.emailLogin.createAccount': 'Create an account',

  'auth.signUp.title': 'Create account',
  'auth.signUp.subtitle': 'Sign up with email and password.',
  'auth.signUp.error.missingName': 'Enter your name.',
  'auth.signUp.error.invalidPassword': 'The password still does not meet all the requirements.',
  'auth.signUp.error.passwordMismatch': 'Passwords do not match.',
  'auth.signUp.confirmEmail.title': 'Confirm your email',
  'auth.signUp.confirmEmail.subtitle':
    'We sent a confirmation link to {email}. Open the link and come back to sign in.',
  'auth.signUp.confirmEmail.backToLogin': 'Back to sign in',
  'auth.signUp.field.confirmPassword.label': 'Confirm password',
  'auth.signUp.field.confirmPassword.placeholder': 'Repeat the password',
  'auth.signUp.submit': 'Create account',

  'auth.forgotPassword.title': 'Reset password',
  'auth.forgotPassword.subtitle': "We'll send a link so you can access your account again.",
  'auth.forgotPassword.error.empty': 'Enter the account email.',
  'auth.forgotPassword.success':
    'If an account exists with this email, the reset link is already on its way. The link opens the app with your session started.',
  'auth.forgotPassword.submit': 'Send reset link',

  'auth.changePassword.title': 'Change password',
  'auth.changePassword.error.missingCurrent': 'Enter your current password.',
  'auth.changePassword.error.invalidNew':
    'The new password still does not meet all the requirements.',
  'auth.changePassword.error.mismatch': 'Passwords do not match.',
  'auth.changePassword.successTitle': 'Password changed',
  'auth.changePassword.successMessage': 'Use the new password next time you sign in.',
  'auth.changePassword.field.current.label': 'Current password',
  'auth.changePassword.field.new.label': 'New password',
  'auth.changePassword.field.new.placeholder': 'Enter the new password',
  'auth.changePassword.field.confirmNew.label': 'Confirm new password',
  'auth.changePassword.field.confirmNew.placeholder': 'Repeat the new password',
  'auth.changePassword.submit': 'Change password',

  'profile.title': 'Profile',
  'profile.editButton': 'Edit',
  'profile.privacyPolicy': 'Privacy Policy',
  'profile.termsOfUse': 'Terms of Use',
  'profile.signOut': 'Sign out',
  'profile.deleteAccount': 'Delete account',

  'profile.edit.title': 'Edit profile',
  'profile.edit.managedBy': 'Managed by your {provider} account',
  'profile.edit.externalNotice':
    'Your account is linked to {provider}. To change your name, email, or password, go to your {provider} account settings.',
  'profile.edit.submit': 'Save changes',
  'profile.security.passwordRow.label': 'Password',
  'profile.security.passwordRow.description': 'Change your sign-in password',

  'passports.addPassport': 'Add passport',
  'passports.section.primaryTag': 'Primary',
  'passports.error.connection': 'Your connection dropped. Try again.',
  'passports.error.loginRequired': 'Sign in to add a passport.',
  'passports.error.onlyOne':
    'This is your only passport. Add another and set it as primary before you can remove this one.',
  'passports.error.mustPromoteFirst':
    'This is your primary passport. Set another as primary before removing it.',

  'passports.dialog.cannotComplete': 'Could not complete',
  'passports.dialog.onlyPrimary.message':
    'This is your only passport and it is set as primary. To remove it, add another passport and set it as primary.',
  'passports.dialog.primary.message':
    'Primary passport. To remove it, set another passport as primary first.',
  'passports.dialog.setPrimary': 'Set as primary',
  'passports.dialog.remove': 'Remove passport',
  'passports.dialog.removeConfirm.title': 'Remove {name}?',
  'passports.dialog.removeConfirm.message': 'You can add it again whenever you want.',
  'passports.dialog.removeConfirm.confirm': 'Remove',

  'passports.picker.search.byCity': 'Search country or city...',
  'passports.picker.search.byCountry': 'Search country...',
  'passports.picker.empty.byCity': 'No destination found for “{query}”.',
  'passports.picker.empty.byCountry': 'No country found for “{query}”.',
  'passports.picker.title': 'Add passport',
  'passports.picker.addFailed.title': 'Could not add it',
  'passports.picker.addFailed.fallback': 'Try again.',

  'a11y.passport.primary': '{name}, primary passport',
  'a11y.passport.openOptions': 'Opens passport options',
  'a11y.countryRow.withCity': '{country}, {city}',
  'a11y.countryRow.alreadyAdded': 'Already added',

  'onboarding.saveFailed.title': 'Could not save it',
  'onboarding.title': 'Which passport do you travel with?',
  'onboarding.subtitle':
    'We use this to find the requirements for each destination. You can add other passports later, in your profile.',
};

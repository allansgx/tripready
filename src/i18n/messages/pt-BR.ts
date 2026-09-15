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

  'common.action.cancel': 'Cancelar',
  'common.field.email.label': 'E-mail',
  'common.field.email.placeholder': 'voce@email.com',
  'common.field.password.label': 'Senha',
  'common.field.name.label': 'Nome',
  'common.field.name.placeholder': 'Como você quer ser chamado',

  'legal.consent.continue': 'Ao continuar, você concorda com os {terms} e com a {privacy}.',
  'legal.consent.createAccount':
    'Ao criar sua conta, você concorda com os {terms} e com a {privacy}.',
  'legal.termsOfUse.linkLabel': 'Termos de uso',
  'legal.privacyPolicy.linkLabel': 'Política de privacidade',

  'auth.error.unexpected': 'Erro inesperado na autenticação.',
  'auth.error.invalidCredentials': 'E-mail ou senha incorretos.',
  'auth.error.emailNotConfirmed':
    'Confirme o e-mail antes de entrar. Verifique sua caixa de entrada.',
  'auth.error.userAlreadyRegistered': 'Este e-mail já está cadastrado.',
  'auth.error.invalidEmailFormat': 'E-mail inválido.',
  'auth.error.invalidPassword': 'Informe uma senha válida.',
  'auth.error.rateLimited': 'Muitas tentativas seguidas. Aguarde alguns minutos.',
  'auth.error.tooManyRequests': 'Por segurança, aguarde 60 segundos antes de tentar de novo.',
  'auth.error.currentPasswordRequired': 'Informe sua senha atual.',
  'auth.error.currentPasswordInvalid': 'A senha atual não confere.',
  'auth.error.samePassword': 'A nova senha precisa ser diferente da atual.',
  'auth.error.passwordRejected': 'A senha ainda não cumpre todos os requisitos da lista.',
  'auth.error.callbackFailed': 'Falha na autenticação: {code}',
  'auth.error.missingAuthUrl': 'O Supabase não retornou a URL de autenticação.',
  'auth.error.missingAppleToken': 'A Apple não retornou o identity token.',

  'auth.password.rule.length': 'Pelo menos {min} caracteres',
  'auth.password.rule.uppercase': 'Letra maiúscula',
  'auth.password.rule.lowercase': 'Letra minúscula',
  'auth.password.rule.digit': 'Número',
  'auth.password.rule.symbol': 'Símbolo',
  'auth.password.strength.weak': 'Fraca',
  'auth.password.strength.medium': 'Média',
  'auth.password.strength.strong': 'Forte',
  'auth.password.placeholder.minLength': 'Mínimo de {min} caracteres',
  'a11y.password.strength': 'Força da senha: {strength}',
  'a11y.password.rule': '{rule}: {status}',
  'auth.password.rule.status.met': 'atendido',
  'auth.password.rule.status.pending': 'pendente',

  'auth.email.error.empty': 'Digite seu e-mail.',
  'auth.email.error.invalid': 'Digite um e-mail válido.',
  'auth.email.error.typo': 'Você quis dizer @{suggestion}?',

  'auth.deleteAccount.confirmationWord': 'Excluir',
  'auth.deleteAccount.title': 'Excluir conta',
  'auth.deleteAccount.warning':
    'Esta ação é **permanente e irreversível**. Todos os seus dados, viagens e documentos serão apagados.',
  'auth.deleteAccount.field.label': 'Digite {word} para confirmar',
  'auth.deleteAccount.field.a11yLabel': 'Digite {word} para confirmar a exclusão da conta',
  'auth.deleteAccount.confirmButton': 'Excluir minha conta',

  'auth.profile.defaultDisplayName': 'Usuário',
  'auth.provider.google': 'Google',
  'auth.provider.apple': 'Apple',

  'auth.login.tagline': 'Tudo o que você precisa antes de viajar, organizado em um só lugar.',
  'auth.login.continueWithGoogle': 'Continuar com Google',
  'auth.login.continueWithApple': 'Continuar com Apple',
  'auth.login.continueWithEmail': 'Entrar com e-mail',

  'auth.emailLogin.title': 'Entrar',
  'auth.emailLogin.subtitle': 'Use o e-mail e a senha da sua conta TripReady.',
  'auth.emailLogin.error.empty': 'Preencha e-mail e senha.',
  'auth.emailLogin.submit': 'Entrar',
  'auth.emailLogin.forgotPassword': 'Esqueci minha senha',
  'auth.emailLogin.createAccount': 'Criar uma conta',

  'auth.signUp.title': 'Criar conta',
  'auth.signUp.subtitle': 'Cadastre-se com e-mail e senha.',
  'auth.signUp.error.missingName': 'Informe seu nome.',
  'auth.signUp.error.invalidPassword': 'A senha ainda não cumpre todos os requisitos.',
  'auth.signUp.error.passwordMismatch': 'As senhas não coincidem.',
  'auth.signUp.confirmEmail.title': 'Confirme seu e-mail',
  'auth.signUp.confirmEmail.subtitle':
    'Enviamos um link de confirmação para {email}. Abra o link e volte para entrar.',
  'auth.signUp.confirmEmail.backToLogin': 'Voltar para o login',
  'auth.signUp.field.confirmPassword.label': 'Confirmar senha',
  'auth.signUp.field.confirmPassword.placeholder': 'Repita a senha',
  'auth.signUp.submit': 'Criar conta',

  'auth.forgotPassword.title': 'Recuperar senha',
  'auth.forgotPassword.subtitle': 'Enviaremos um link para você voltar a acessar a conta.',
  'auth.forgotPassword.error.empty': 'Informe o e-mail da conta.',
  'auth.forgotPassword.success':
    'Se existir uma conta com esse e-mail, o link de recuperação já está a caminho. O link abre o app com a sessão iniciada.',
  'auth.forgotPassword.submit': 'Enviar link de recuperação',

  'auth.changePassword.title': 'Alterar senha',
  'auth.changePassword.error.missingCurrent': 'Informe sua senha atual.',
  'auth.changePassword.error.invalidNew': 'A nova senha ainda não cumpre todos os requisitos.',
  'auth.changePassword.error.mismatch': 'As senhas não coincidem.',
  'auth.changePassword.successTitle': 'Senha alterada',
  'auth.changePassword.successMessage': 'Use a nova senha no próximo acesso.',
  'auth.changePassword.field.current.label': 'Senha atual',
  'auth.changePassword.field.new.label': 'Nova senha',
  'auth.changePassword.field.new.placeholder': 'Digite a nova senha',
  'auth.changePassword.field.confirmNew.label': 'Confirmar nova senha',
  'auth.changePassword.field.confirmNew.placeholder': 'Repita a nova senha',
  'auth.changePassword.submit': 'Alterar senha',

  'profile.title': 'Perfil',
  'profile.editButton': 'Editar',
  'profile.privacyPolicy': 'Política de Privacidade',
  'profile.termsOfUse': 'Termos de Uso',
  'profile.signOut': 'Sair',
  'profile.deleteAccount': 'Excluir conta',

  'profile.edit.title': 'Editar perfil',
  'profile.edit.managedBy': 'Gerenciado pela conta {provider}',
  'profile.edit.externalNotice':
    'Sua conta está vinculada ao {provider}. Para alterar nome, e-mail ou senha, acesse as configurações da sua conta {provider}.',
  'profile.edit.submit': 'Salvar alterações',
  'profile.security.passwordRow.label': 'Senha',
  'profile.security.passwordRow.description': 'Altere sua senha de acesso',
} as const satisfies Record<string, Message>;

export type MessageKey = keyof typeof messages;

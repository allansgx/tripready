import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { FormLayout } from '@/components/ui/form-layout';
import { FormMessage } from '@/components/ui/form-message';
import { ScreenHeader } from '@/components/ui/screen-header';
import { TextField } from '@/components/ui/text-field';
import { useAuth } from '@/features/auth/auth-context';
import { toAuthMessage } from '@/features/auth/auth-errors';
import { normalizeEmail, validateEmail, type EmailIssue } from '@/features/auth/email';
import { isPasswordValid, MIN_PASSWORD_LENGTH } from '@/features/auth/password';
import { PasswordField } from '@/features/auth/password-field';
import { markSignupCodeSent } from '@/features/auth/signup-code-cooldown';
import { LegalConsentNotice } from '@/features/legal/components/legal-consent-notice';
import { t } from '@/i18n';
import { spacing } from '@/theme/tokens';

/** Traduz o descritivo de `validateEmail` no idioma ativo. */
function emailIssueMessage(issue: EmailIssue | null): string | null {
  if (!issue) return null;
  if (issue.kind === 'typo') return t('auth.email.error.typo', { suggestion: issue.suggestion });
  return t(issue.kind === 'empty' ? 'auth.email.error.empty' : 'auth.email.error.invalid');
}

/** TEMPORÁRIO — cadastro por e-mail/senha para testes no Expo Go. */
export default function SignUpScreen() {
  const { signUpWithEmail } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  // No iOS, o autofill dispara onBlur colado ao onChangeText, antes do
  // re-render: a closure do onBlur ainda veria o `email` do render anterior.
  const emailRef = useRef(email);

  /** O aviso sai ao mexer no campo e volta no blur, nunca durante a digitação. */
  function changeEmail(value: string) {
    setEmail(value);
    emailRef.current = value;
    if (emailError) setEmailError(null);
  }

  const canSubmit = validateEmail(email) === null && isPasswordValid(password);

  async function submit() {
    if (!name.trim()) {
      setError(t('auth.signUp.error.missingName'));
      return;
    }

    const emailProblem = validateEmail(email);
    if (emailProblem) {
      setError(null);
      setEmailError(emailIssueMessage(emailProblem));
      return;
    }

    if (!isPasswordValid(password)) {
      setError(t('auth.signUp.error.invalidPassword'));
      return;
    }
    if (password !== confirmation) {
      setError(t('auth.signUp.error.passwordMismatch'));
      return;
    }

    setError(null);
    setBusy(true);
    try {
      const result = await signUpWithEmail(email, password, name);
      // 'signed-in': confirmação de e-mail desligada, a sessão já veio pronta e
      // o layout raiz troca para o grupo (app) sozinho.
      if (result === 'confirm-email') {
        await markSignupCodeSent();
        router.push({ pathname: '/confirm-email', params: { email: normalizeEmail(email) } });
      }
    } catch (err) {
      setError(toAuthMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <FormLayout>
      <ScreenHeader title={t('auth.signUp.title')} subtitle={t('auth.signUp.subtitle')} />

      <View style={styles.form}>
        <TextField
          label={t('common.field.name.label')}
          value={name}
          onChangeText={setName}
          placeholder={t('common.field.name.placeholder')}
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          returnKeyType="next"
        />
        <TextField
          label={t('common.field.email.label')}
          value={email}
          onChangeText={changeEmail}
          onBlur={() => setEmailError(emailIssueMessage(validateEmail(emailRef.current)))}
          error={emailError}
          placeholder={t('common.field.email.placeholder')}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
        />
        <PasswordField
          label={t('common.field.password.label')}
          value={password}
          onChangeText={setPassword}
          placeholder={t('auth.password.placeholder.minLength', { min: MIN_PASSWORD_LENGTH })}
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
        />
        <TextField
          label={t('auth.signUp.field.confirmPassword.label')}
          value={confirmation}
          onChangeText={setConfirmation}
          placeholder={t('auth.signUp.field.confirmPassword.placeholder')}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="done"
          onSubmitEditing={submit}
        />

        {error ? <FormMessage text={error} /> : null}

        <Button
          label={t('auth.signUp.submit')}
          onPress={submit}
          loading={busy}
          disabled={!canSubmit}
        />

        <LegalConsentNotice variant="createAccount" />
      </View>
    </FormLayout>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.lg,
  },
});

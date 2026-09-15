import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { FormLayout } from '@/components/ui/form-layout';
import { FormMessage } from '@/components/ui/form-message';
import { ScreenHeader } from '@/components/ui/screen-header';
import { TextField } from '@/components/ui/text-field';
import { useAuth } from '@/features/auth/auth-context';
import { toAuthMessage } from '@/features/auth/auth-errors';
import { t } from '@/i18n';
import { colors, spacing, typography } from '@/theme/tokens';

/**
 * TEMPORÁRIO — entrada por e-mail/senha para testar o app autenticado no
 * Expo Go. Não substitui Google/Apple, que seguem intactos na tela de login.
 */
export default function EmailLoginScreen() {
  const { signInWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!email.trim() || !password) {
      setError(t('auth.emailLogin.error.empty'));
      return;
    }

    setError(null);
    setBusy(true);
    try {
      // Em caso de sucesso não há navegação manual: a sessão muda, o layout
      // raiz libera o grupo (app) e a tela sai de cena sozinha.
      await signInWithEmail(email, password);
    } catch (err) {
      setError(toAuthMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <FormLayout>
      <ScreenHeader title={t('auth.emailLogin.title')} subtitle={t('auth.emailLogin.subtitle')} />

      <View style={styles.form}>
        <TextField
          label={t('common.field.email.label')}
          value={email}
          onChangeText={setEmail}
          placeholder={t('common.field.email.placeholder')}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
        />
        <TextField
          label={t('common.field.password.label')}
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
          autoCapitalize="none"
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="done"
          onSubmitEditing={submit}
        />

        {error ? <FormMessage text={error} /> : null}

        <Button label={t('auth.emailLogin.submit')} onPress={submit} loading={busy} />
      </View>

      <View style={styles.links}>
        <Link href="/forgot-password" style={styles.link}>
          {t('auth.emailLogin.forgotPassword')}
        </Link>
        <Link href="/sign-up" style={styles.link}>
          {t('auth.emailLogin.createAccount')}
        </Link>
      </View>
    </FormLayout>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.lg,
  },
  links: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  link: {
    ...typography.body,
    fontWeight: '600',
    color: colors.primary,
  },
});

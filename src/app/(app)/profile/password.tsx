import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { showDialog } from '@/components/ui/dialog';
import { FormLayout } from '@/components/ui/form-layout';
import { FormMessage } from '@/components/ui/form-message';
import { ScreenHeader } from '@/components/ui/screen-header';
import { TextField } from '@/components/ui/text-field';
import { useAuth } from '@/features/auth/auth-context';
import { toAuthMessage } from '@/features/auth/auth-errors';
import { isPasswordValid } from '@/features/auth/password';
import { PasswordField } from '@/features/auth/password-field';
import { t } from '@/i18n';
import { spacing } from '@/theme/tokens';

export default function ChangePasswordScreen() {
  const { changePassword } = useAuth();
  const router = useRouter();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    currentPassword.length > 0 && isPasswordValid(newPassword) && newPassword === confirmation;

  async function submit() {
    if (!currentPassword) {
      setError(t('auth.changePassword.error.missingCurrent'));
      return;
    }
    if (!isPasswordValid(newPassword)) {
      setError(t('auth.changePassword.error.invalidNew'));
      return;
    }
    if (newPassword !== confirmation) {
      setError(t('auth.changePassword.error.mismatch'));
      return;
    }

    setError(null);
    setBusy(true);
    try {
      await changePassword(currentPassword, newPassword);
      showDialog(t('auth.changePassword.successTitle'), t('auth.changePassword.successMessage'));
      router.back();
    } catch (err) {
      setError(toAuthMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <FormLayout>
      <ScreenHeader title={t('auth.changePassword.title')} fallbackHref="/profile/edit" />

      <View style={styles.form}>
        <TextField
          label={t('auth.changePassword.field.current.label')}
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="••••••••"
          secureTextEntry
          autoCapitalize="none"
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="next"
        />
        <PasswordField
          label={t('auth.changePassword.field.new.label')}
          value={newPassword}
          placeholder={t('auth.changePassword.field.new.placeholder')}
          onChangeText={setNewPassword}
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
        />
        <TextField
          label={t('auth.changePassword.field.confirmNew.label')}
          value={confirmation}
          onChangeText={setConfirmation}
          placeholder={t('auth.changePassword.field.confirmNew.placeholder')}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="done"
          onSubmitEditing={submit}
        />

        {error ? <FormMessage text={error} /> : null}

        <Button
          label={t('auth.changePassword.submit')}
          onPress={submit}
          loading={busy}
          disabled={!canSubmit}
        />
      </View>
    </FormLayout>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.lg,
  },
});

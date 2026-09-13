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
      setError('Informe sua senha atual.');
      return;
    }
    if (!isPasswordValid(newPassword)) {
      setError('A nova senha ainda não cumpre todos os requisitos.');
      return;
    }
    if (newPassword !== confirmation) {
      setError('As senhas não coincidem.');
      return;
    }

    setError(null);
    setBusy(true);
    try {
      await changePassword(currentPassword, newPassword);
      showDialog('Senha alterada', 'Use a nova senha no próximo acesso.');
      router.back();
    } catch (err) {
      setError(toAuthMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <FormLayout>
      <ScreenHeader title="Alterar senha" fallbackHref="/profile/edit" />

      <View style={styles.form}>
        <TextField
          label="Senha atual"
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
          label="Nova senha"
          value={newPassword}
          placeholder="Digite a nova senha"
          onChangeText={setNewPassword}
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
        />
        <TextField
          label="Confirmar nova senha"
          value={confirmation}
          onChangeText={setConfirmation}
          placeholder="Repita a nova senha"
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="done"
          onSubmitEditing={submit}
        />

        {error ? <FormMessage text={error} /> : null}

        <Button label="Alterar senha" onPress={submit} loading={busy} disabled={!canSubmit} />
      </View>
    </FormLayout>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.lg,
  },
});

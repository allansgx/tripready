import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { FormLayout } from '@/components/ui/form-layout';
import { FormMessage } from '@/components/ui/form-message';
import { ScreenHeader } from '@/components/ui/screen-header';
import { TextField } from '@/components/ui/text-field';
import { useAuth } from '@/features/auth/auth-context';
import { toAuthMessage } from '@/features/auth/auth-errors';
import { spacing } from '@/theme/tokens';

/** TEMPORÁRIO — recuperação de senha por e-mail, para testes no Expo Go. */
export default function ForgotPasswordScreen() {
  const { sendPasswordReset } = useAuth();

  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function submit() {
    if (!email.trim()) {
      setError('Informe o e-mail da conta.');
      return;
    }

    setError(null);
    setBusy(true);
    try {
      await sendPasswordReset(email);
      setSent(true);
    } catch (err) {
      setError(toAuthMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <FormLayout>
      <ScreenHeader
        title="Recuperar senha"
        subtitle="Enviaremos um link para você voltar a acessar a conta."
      />

      <View style={styles.form}>
        <TextField
          label="E-mail"
          value={email}
          onChangeText={setEmail}
          placeholder="voce@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="done"
          onSubmitEditing={submit}
          editable={!sent}
        />

        {error ? <FormMessage text={error} /> : null}

        {sent ? (
          // Resposta neutra de propósito: o Supabase não revela se o e-mail
          // existe, e a tela não deve revelar também.
          <FormMessage
            tone="success"
            text={
              'Se existir uma conta com esse e-mail, o link de recuperação já está a caminho. ' +
              'O link abre o app com a sessão iniciada.'
            }
          />
        ) : (
          <Button label="Enviar link de recuperação" onPress={submit} loading={busy} />
        )}
      </View>
    </FormLayout>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.lg,
  },
});

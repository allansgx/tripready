import { useRouter } from 'expo-router';
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

/** Senha mínima aceita pelo Supabase Auth na configuração padrão. */
const MIN_PASSWORD_LENGTH = 6;

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
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function submit() {
    if (!name.trim()) {
      setError('Informe seu nome.');
      return;
    }
    if (!email.trim()) {
      setError('Informe o e-mail.');
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`A senha precisa ter ao menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      return;
    }
    if (password !== confirmation) {
      setError('As senhas não coincidem.');
      return;
    }

    setError(null);
    setBusy(true);
    try {
      const result = await signUpWithEmail(email, password, name);
      // 'signed-in': confirmação de e-mail desligada, a sessão já veio pronta e
      // o layout raiz troca para o grupo (app) sozinho.
      if (result === 'confirm-email') {
        setSentTo(email.trim());
      }
    } catch (err) {
      setError(toAuthMessage(err));
    } finally {
      setBusy(false);
    }
  }

  if (sentTo) {
    return (
      <FormLayout>
        <ScreenHeader
          title="Confirme seu e-mail"
          subtitle={`Enviamos um link de confirmação para ${sentTo}. Abra o link e volte para entrar.`}
        />
        <Button label="Voltar para o login" onPress={() => router.replace('/email-login')} />
      </FormLayout>
    );
  }

  return (
    <FormLayout>
      <ScreenHeader title="Criar conta" subtitle="Cadastre-se com e-mail e senha." />

      <View style={styles.form}>
        <TextField
          label="Nome"
          value={name}
          onChangeText={setName}
          placeholder="Como você quer ser chamado"
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          returnKeyType="next"
        />
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
        />
        <TextField
          label="Senha"
          value={password}
          onChangeText={setPassword}
          placeholder={`Mínimo de ${MIN_PASSWORD_LENGTH} caracteres`}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
        />
        <TextField
          label="Confirmar senha"
          value={confirmation}
          onChangeText={setConfirmation}
          placeholder="Repita a senha"
          secureTextEntry
          autoCapitalize="none"
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="done"
          onSubmitEditing={submit}
        />

        {error ? <FormMessage text={error} /> : null}

        <Button label="Criar conta" onPress={submit} loading={busy} />
      </View>
    </FormLayout>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.lg,
  },
});

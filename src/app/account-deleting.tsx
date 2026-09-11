import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { StepRow } from '@/components/ui/step-row';
import { useAuth } from '@/features/auth/auth-context';
import { DeleteAccountError, type DeleteAccountFailure } from '@/features/auth/delete-account';
import { colors, spacing, typography } from '@/theme/tokens';

/**
 * O que a exclusão levou, na ordem em que é mostrado.
 *
 * A lista é o retrato do que a cascata do banco remove a partir de
 * `auth.users`, e não etapas que o app executa uma a uma: a exclusão é uma
 * chamada só, e uma transação só. Por isso as marcações aparecem **depois** de
 * o servidor confirmar — animar antes seria inventar progresso.
 */
const REMOVAL_STEPS = [
  { label: 'Viagens e checklists', icon: 'airplane' },
  { label: 'Passaportes', icon: 'card' },
  { label: 'Dados do perfil', icon: 'person' },
  { label: 'Conta e acesso', icon: 'lock-closed' },
] as const;

/** Ritmo da revelação: rápido o bastante para não virar espera. */
const STEP_DELAY = 260;

/**
 * Nenhuma mensagem fala em falha nem menciona serviço, status ou termo técnico:
 * cada uma diz o que a pessoa pode fazer a seguir.
 */
const MESSAGES: Record<DeleteAccountFailure, string> = {
  connection: 'Sua conexão oscilou. Toque para tentar de novo.',
  session: 'Sua sessão expirou. Entre de novo para excluir a conta.',
  unknown: 'Não foi possível concluir agora. Toque para tentar de novo.',
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Exclusão da conta, do pedido confirmado até a despedida.
 *
 * A sessão só cai quando a pessoa toca em "Ir para o login". Encerrá-la junto
 * com a exclusão trocaria a tela na mesma hora, e a confirmação de que deu
 * certo não teria onde aparecer. Nada leva embora sozinho: a saída é do
 * usuário.
 */
export default function AccountDeletingScreen() {
  const { deleteAccount, signOutLocal } = useAuth();
  const router = useRouter();

  const [doneCount, setDoneCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  /** Impede execução dupla do efeito para a mesma tentativa. */
  const runRef = useRef(-1);
  /** A saída acontece uma vez só. */
  const leftRef = useRef(false);

  const leave = useCallback(() => {
    if (leftRef.current) return;
    leftRef.current = true;
    // Sem navegação: a sessão cai, o layout raiz troca de grupo e a área
    // autenticada sai de cena levando esta tela junto.
    void signOutLocal();
  }, [signOutLocal]);

  useEffect(() => {
    if (runRef.current === attempt) return;
    runRef.current = attempt;
    void remove();

    async function remove() {
      setNotice(null);

      try {
        await deleteAccount();
      } catch (error) {
        setNotice(MESSAGES[error instanceof DeleteAccountError ? error.reason : 'unknown']);
        return;
      }

      // Daqui para baixo a conta já não existe: cada linha marcada é o registro
      // do que saiu junto, não uma etapa ainda por fazer. Repetir a chamada é
      // seguro — a função responde "já estava apagada" com o mesmo sucesso.
      for (let index = 0; index < REMOVAL_STEPS.length; index++) {
        setDoneCount(index + 1);
        await delay(STEP_DELAY);
      }

      setFinished(true);
    }
  }, [attempt, deleteAccount]);

  /**
   * O botão físico de voltar do Android não atravessa esta tela: no meio da
   * exclusão não há o que cancelar, e no fim a única saída é a mesma do botão.
   */
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (finished) leave();
      return true;
    });

    return () => subscription.remove();
  }, [finished, leave]);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <Text style={styles.title}>{finished ? 'Conta excluída' : 'Excluindo sua conta...'}</Text>
        <Text style={styles.subtitle}>
          {finished
            ? 'Sua conta e seus dados foram excluídos com sucesso.'
            : 'Estamos removendo seus dados.'}
        </Text>

        <View style={styles.list}>
          {REMOVAL_STEPS.map((step, index) => (
            <StepRow
              key={step.label}
              label={step.label}
              icon={step.icon}
              done={index < doneCount}
            />
          ))}
        </View>

        {finished ? (
          <View style={styles.actions}>
            <Button label="Ir para o login" onPress={leave} />
          </View>
        ) : null}

        {notice ? (
          <View style={styles.actions}>
            <Text style={styles.notice}>{notice}</Text>
            <Button label="Tentar de novo" onPress={() => setAttempt((current) => current + 1)} />
            <Button label="Voltar ao perfil" variant="ghost" onPress={() => router.back()} />
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  title: { ...typography.screenTitle, color: colors.text, textAlign: 'center' },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  list: { gap: spacing.md },
  actions: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  notice: {
    ...typography.caption,
    color: colors.text,
    textAlign: 'center',
  },
});

import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { StepRow } from '@/components/ui/step-row';
import { useAuth } from '@/features/auth/auth-context';
import { DeleteAccountError, type DeleteAccountFailure } from '@/features/auth/delete-account';
import { t, type MessageKey } from '@/i18n';
import { colors, spacing, typography } from '@/theme/tokens';

/**
 * O que a cascata do banco remove, e não etapas que o app executa: a exclusão é
 * uma chamada só, então as marcações aparecem depois de o servidor confirmar.
 */
const REMOVAL_STEPS = [
  { labelKey: 'account.deleting.step.trips', icon: 'airplane' },
  { labelKey: 'account.deleting.step.passports', icon: 'card' },
  { labelKey: 'account.deleting.step.profile', icon: 'person' },
  { labelKey: 'account.deleting.step.account', icon: 'lock-closed' },
] as const satisfies readonly { labelKey: MessageKey; icon: string }[];

/** Ritmo da revelação: rápido o bastante para não virar espera. */
const STEP_DELAY = 260;

/** Cada mensagem diz o que a pessoa pode fazer a seguir, sem termo técnico. */
const MESSAGE_KEY: Record<DeleteAccountFailure, MessageKey> = {
  connection: 'account.deleting.error.connection',
  session: 'account.deleting.error.session',
  unknown: 'account.deleting.error.unknown',
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Exclusão da conta. A sessão só cai quando a pessoa toca em "Ir para o login":
 * encerrá-la junto deixaria a confirmação sem onde aparecer.
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
        setNotice(t(MESSAGE_KEY[error instanceof DeleteAccountError ? error.reason : 'unknown']));
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

  // O voltar do Android não atravessa: no meio da exclusão não há o que cancelar.
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
        <Text style={styles.title}>
          {t(finished ? 'account.deleting.title.done' : 'account.deleting.title.loading')}
        </Text>
        <Text style={styles.subtitle}>
          {t(finished ? 'account.deleting.subtitle.done' : 'account.deleting.subtitle.loading')}
        </Text>

        <View style={styles.list}>
          {REMOVAL_STEPS.map((step, index) => (
            <StepRow
              key={step.labelKey}
              label={t(step.labelKey)}
              icon={step.icon}
              done={index < doneCount}
            />
          ))}
        </View>

        {finished ? (
          <View style={styles.actions}>
            <Button label={t('account.deleting.goToLogin')} onPress={leave} />
          </View>
        ) : null}

        {notice ? (
          <View style={styles.actions}>
            <Text style={styles.notice}>{notice}</Text>
            <Button
              label={t('common.action.retry')}
              onPress={() => setAttempt((current) => current + 1)}
            />
            <Button
              label={t('account.deleting.backToProfile')}
              variant="ghost"
              onPress={() => router.back()}
            />
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

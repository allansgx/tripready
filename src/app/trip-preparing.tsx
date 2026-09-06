import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import {
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  CHECKLIST_CATEGORIES,
  buildBaseChecklist,
} from '@/features/trips/checklist-catalog';
import { USE_NATIVE_DRIVER } from '@/lib/animation';
import { tripDestinationsService, tripRequirementsService } from '@/services';
import { colors, radius, spacing, typography } from '@/theme/tokens';

/** Ritmo da animação: rápido o bastante para não virar espera. */
const STEP_DELAY = 260;
const FINAL_DELAY = 900;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Transição entre criar a viagem e abrir a checklist.
 *
 * Não é um loading decorativo: cada categoria marcada corresponde à gravação
 * real daquele grupo de requisitos no Supabase. A checklist é montada aqui, e
 * não na tela anterior, justamente para o progresso mostrado ser verdadeiro.
 */
export default function TripPreparingScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const router = useRouter();

  const [doneCount, setDoneCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [needsRetry, setNeedsRetry] = useState(false);
  const [attempt, setAttempt] = useState(0);

  /** Categorias já gravadas: uma nova tentativa continua daqui, sem duplicar. */
  const insertedRef = useRef(0);
  /** Impede execução dupla do efeito para a mesma tentativa. */
  const runRef = useRef(-1);

  useEffect(() => {
    if (!tripId || runRef.current === attempt) return;
    runRef.current = attempt;
    void prepare();

    async function prepare() {
      setNeedsRetry(false);
      try {
        const countries = await tripDestinationsService.listCountries(tripId);
        const checklist = buildBaseChecklist(
          tripId,
          countries.map((country) => country.country_code),
        );

        for (let index = insertedRef.current; index < CHECKLIST_CATEGORIES.length; index++) {
          await tripRequirementsService.createMany(checklist[CHECKLIST_CATEGORIES[index]]);
          insertedRef.current = index + 1;
          setDoneCount(index + 1);
          await delay(STEP_DELAY);
        }

        setFinished(true);
        await delay(FINAL_DELAY);
        openTrip();
      } catch {
        setNeedsRetry(true);
      }
    }
  }, [tripId, attempt, router]);

  function retry() {
    setAttempt((current) => current + 1);
  }

  /**
   * Fecha os modais da criação **antes** de abrir a viagem.
   *
   * Trocar este modal diretamente pela rota do detalhe (`replace`) deixava a
   * pilha da aba Viagens contendo só o detalhe, sem a listagem embaixo — daí o
   * botão voltar cair na aba Início e a aba Viagens reabrir na checklist.
   * Dispensando os modais primeiro, o `push` empilha o detalhe sobre a
   * listagem, que é a hierarquia correta.
   */
  function openTrip() {
    if (router.canDismiss()) {
      router.dismissAll();
    }
    router.push({ pathname: '/trips/[id]', params: { id: tripId } });
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <Text style={styles.title}>
          {finished ? 'Checklist pronta! 🎉' : 'Preparando sua checklist...'}
        </Text>
        <Text style={styles.subtitle}>
          {finished
            ? 'Sua checklist personalizada está pronta.'
            : 'Estamos organizando o que você precisa verificar.'}
        </Text>

        <View style={styles.list}>
          {CHECKLIST_CATEGORIES.map((category, index) => (
            <CategoryRow
              key={category}
              label={CATEGORY_LABELS[category]}
              icon={CATEGORY_ICONS[category]}
              done={index < doneCount}
            />
          ))}
        </View>

        {needsRetry ? (
          <View style={styles.retry}>
            <Text style={styles.retryText}>
              Sua conexão oscilou. Toque para continuar a preparação.
            </Text>
            <Button label="Continuar preparação" onPress={retry} />
            <Button label="Ver a viagem agora" variant="ghost" onPress={openTrip} />
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function CategoryRow({
  label,
  icon,
  done,
}: {
  label: string;
  icon: string;
  done: boolean;
}) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!done) return;
    Animated.spring(progress, {
      toValue: 1,
      useNativeDriver: USE_NATIVE_DRIVER,
      speed: 14,
      bounciness: 10,
    }).start();
  }, [done, progress]);

  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] });
  const opacity = progress.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] });

  return (
    <Animated.View style={[styles.row, { opacity }]}>
      <View style={[styles.rowIcon, done && styles.rowIconDone]}>
        <Ionicons
          name={icon as never}
          size={18}
          color={done ? colors.contrastText : colors.textSecondary}
        />
      </View>

      <Text style={[styles.rowLabel, done && styles.rowLabelDone]}>{label}</Text>

      <Animated.View style={{ transform: [{ scale }] }}>
        {done ? (
          <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
        ) : (
          <View style={styles.pendingDot} />
        )}
      </Animated.View>
    </Animated.View>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.progressTrack,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconDone: { backgroundColor: colors.primary },
  rowLabel: { ...typography.body, color: colors.textSecondary, flex: 1 },
  rowLabelDone: { color: colors.text, fontWeight: '600' },
  pendingDot: {
    width: 10,
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.progressTrack,
  },
  retry: {
    marginTop: spacing.xl,
    gap: spacing.sm,
  },
  retryText: {
    ...typography.caption,
    color: colors.text,
    textAlign: 'center',
  },
});

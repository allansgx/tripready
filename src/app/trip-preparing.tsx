import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { StepRow } from '@/components/ui/step-row';
import { usePassports } from '@/features/passports/passports-context';
import {
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  CHECKLIST_CATEGORIES,
} from '@/features/trips/data/checklist-catalog';
import { resolveChecklist } from '@/features/trips/data/trip-persistence';
import { t } from '@/i18n';
import { tripRequirementsService, tripsService } from '@/services';
import { colors, spacing, typography } from '@/theme/tokens';

/** Ritmo da animação: rápido o bastante para não virar espera. */
const STEP_DELAY = 260;
const FINAL_DELAY = 900;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Transição entre criar a viagem e abrir a checklist. Cada categoria marcada
 * corresponde à gravação real daquele grupo de requisitos.
 */
export default function TripPreparingScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const router = useRouter();
  const { primary } = usePassports();
  const passportCountryCode = primary?.country_code ?? null;

  const [doneCount, setDoneCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [needsRetry, setNeedsRetry] = useState(false);
  const [attempt, setAttempt] = useState(0);

  /** Categorias já gravadas: uma nova tentativa continua daqui, sem duplicar. */
  const insertedRef = useRef(0);
  /** Impede execução dupla do efeito para a mesma tentativa. */
  const runRef = useRef(-1);

  const openTrip = useCallback(() => {
    if (router.canDismiss()) {
      router.dismissAll();
    }
    router.push({ pathname: '/trips/[id]', params: { id: tripId } });
  }, [router, tripId]);

  useEffect(() => {
    if (!tripId || runRef.current === attempt) return;
    runRef.current = attempt;
    void prepare();

    async function prepare() {
      setNeedsRetry(false);
      try {
        const trip = await tripsService.getWithDestinations(tripId);
        if (!trip) {
          setNeedsRetry(true);
          return;
        }

        const checklist = await resolveChecklist({
          tripId,
          countryCodes: (trip.trip_countries ?? []).map((country) => country.country_code),
          startDate: trip.start_date,
          endDate: trip.end_date,
          passportCountryCode,
        });

        // Uma categoria por passo, retomando de onde parou: o índice já gravado
        // impede que uma nova tentativa insira duas vezes o mesmo grupo.
        for (let index = insertedRef.current; index < CHECKLIST_CATEGORIES.length; index++) {
          const category = CHECKLIST_CATEGORIES[index];
          await tripRequirementsService.createMany(
            checklist.filter((item) => item.category === category),
          );
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
  }, [tripId, attempt, openTrip, passportCountryCode]);

  function retry() {
    setAttempt((current) => current + 1);
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <Text style={styles.title}>
          {t(finished ? 'trip.preparing.title.done' : 'trip.preparing.title.loading')}
        </Text>
        <Text style={styles.subtitle}>
          {t(finished ? 'trip.preparing.subtitle.done' : 'trip.preparing.subtitle.loading')}
        </Text>

        <View style={styles.list}>
          {CHECKLIST_CATEGORIES.map((category, index) => (
            <StepRow
              key={category}
              label={CATEGORY_LABELS[category]}
              icon={CATEGORY_ICONS[category]}
              done={index < doneCount}
            />
          ))}
        </View>

        {needsRetry ? (
          <View style={styles.retry}>
            <Text style={styles.retryText}>{t('trip.preparing.error.retry')}</Text>
            <Button label={t('trip.preparing.continueButton')} onPress={retry} />
            <Button label={t('trip.preparing.viewNow')} variant="ghost" onPress={openTrip} />
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

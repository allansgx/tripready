import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/auth-context';
import { syncAllTripReminders } from '@/features/notifications/data/reminder-scheduler';
import { TripCard } from '@/features/trips/components/trip-card';
import { TripFilterBar } from '@/features/trips/components/trip-filter-bar';
import {
  buildTripSummaries,
  filterTripSummaries,
  type TripFilter,
  type TripSummary,
} from '@/features/trips/domain/trip-summary';
import { t } from '@/i18n';
import { tripsService } from '@/services';
import { colors, radius, spacing, typography } from '@/theme/tokens';

/**
 * A lista de viagens: uma só, na ordem de `buildTripSummaries`, com filtros
 * rápidos no topo no lugar de cabeçalhos de seção.
 */
export default function TripsScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [summaries, setSummaries] = useState<TripSummary[]>([]);
  const [filter, setFilter] = useState<TripFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [needsRetry, setNeedsRetry] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setNeedsRetry(false);
    try {
      const rows = await tripsService.listWithRelations(user.id);
      setSummaries(buildTripSummaries(rows));

      // Reconciliação completa: é aqui que lembrete de viagem excluída some.
      void syncAllTripReminders(rows).catch(() => {});
    } catch {
      setNeedsRetry(true);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Recarrega ao voltar da criação da viagem ou da checklist.
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const createTrip = () => router.push('/trip-new');
  const visible = filterTripSummaries(summaries, filter);
  const isReady = !isLoading && !needsRetry;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        <View style={styles.header}>
          <Text style={styles.title}>{t('trips.list.title')}</Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('a11y.trips.createNew')}
            hitSlop={10}
            onPress={createTrip}
            style={({ pressed }) => [styles.create, pressed && styles.createPressed]}>
            <Ionicons name="add" size={20} color={colors.contrastText} />
          </Pressable>
        </View>

        {/* Sem nenhuma viagem cadastrada os filtros não têm o que recortar. */}
        {isReady && summaries.length > 0 ? (
          <TripFilterBar value={filter} onChange={setFilter} />
        ) : null}

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.hint}>{t('trips.list.loading')}</Text>
          </View>
        ) : needsRetry ? (
          <View style={styles.centered}>
            <Text style={styles.hint}>{t('trips.error.loadRetry')}</Text>
            <Button
              label={t('trips.list.loadRetryButton')}
              onPress={() => void load()}
              variant="ghost"
            />
          </View>
        ) : summaries.length === 0 ? (
          <EmptyState onCreate={createTrip} />
        ) : visible.length === 0 ? (
          <FilterEmptyState filter={filter} onSelect={setFilter} onCreate={createTrip} />
        ) : (
          <View style={styles.list}>
            {visible.map((summary) => (
              <TripCard
                key={summary.trip.id}
                summary={summary}
                onPress={() =>
                  router.push({ pathname: '/trips/[id]', params: { id: summary.trip.id } })
                }
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/** O vazio de um filtro: cada um diz o que aparece ali e oferece uma saída. */
function FilterEmptyState({
  filter,
  onSelect,
  onCreate,
}: {
  filter: TripFilter;
  onSelect: (filter: TripFilter) => void;
  onCreate: () => void;
}) {
  // "Todas" vazio é o vazio geral da tela, que tem resposta própria.
  if (filter === 'all') return null;

  const options: Record<
    Exclude<TripFilter, 'all'>,
    { text: string; label: string; action: () => void }
  > = {
    ongoing: {
      text: t('trips.filterEmpty.ongoing.text'),
      label: t('trips.filterEmpty.ongoing.action'),
      action: () => onSelect('upcoming'),
    },
    upcoming: {
      text: t('trips.filterEmpty.upcoming.text'),
      label: t('trips.action.create'),
      action: onCreate,
    },
    completed: {
      text: t('trips.filterEmpty.completed.text'),
      label: t('trips.filterEmpty.completed.action'),
      action: () => onSelect('all'),
    },
  };

  const option = options[filter];

  return (
    <View style={styles.centered}>
      <Text style={styles.hint}>{option.text}</Text>
      <Button label={option.label} onPress={option.action} variant="ghost" />
    </View>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name="airplane" size={30} color={colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>{t('trips.list.emptyTitle')}</Text>
      <Text style={styles.emptyText}>{t('trips.list.emptyText')}</Text>
      <View style={styles.emptyAction}>
        <Button label={t('trips.action.create')} onPress={onCreate} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    padding: spacing.xl - spacing.xs,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  title: { ...typography.screenTitle, color: colors.text },
  create: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createPressed: {
    backgroundColor: colors.primaryPressed,
  },
  list: { gap: spacing.lg },
  centered: {
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.xxl,
  },
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  empty: {
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    ...typography.title,
    color: colors.text,
    textAlign: 'center',
  },
  emptyText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyAction: {
    alignSelf: 'stretch',
    marginTop: spacing.md,
  },
});

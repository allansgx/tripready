import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { SectionLabel } from '@/components/ui/section-label';
import { useAuth } from '@/features/auth/auth-context';
import { TripCard } from '@/features/trips/trip-card';
import {
  buildTripSummaries,
  splitTripSections,
  type TripSummary,
} from '@/features/trips/trip-summary';
import { tripsService } from '@/services';
import { colors, radius, spacing, typography } from '@/theme/tokens';

export default function TripsScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [summaries, setSummaries] = useState<TripSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [needsRetry, setNeedsRetry] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setNeedsRetry(false);
    try {
      const rows = await tripsService.listWithRelations(user.id);
      setSummaries(buildTripSummaries(rows));
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

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
        <View style={styles.header}>
          <Text style={styles.title}>Minhas viagens</Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Criar nova viagem"
            hitSlop={10}
            onPress={() => router.push('/trip-new')}
            style={({ pressed }) => [styles.create, pressed && styles.createPressed]}>
            <Ionicons name="add" size={18} color={colors.primary} />
          </Pressable>
        </View>

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.hint}>Buscando suas viagens...</Text>
          </View>
        ) : needsRetry ? (
          <View style={styles.centered}>
            <Text style={styles.hint}>Sua conexão oscilou. Toque para carregar de novo.</Text>
            <Button label="Carregar viagens" onPress={() => void load()} variant="ghost" />
          </View>
        ) : summaries.length === 0 ? (
          <EmptyState onCreate={() => router.push('/trip-new')} />
        ) : (
          <TripSections
            summaries={summaries}
            onOpen={(tripId) => router.push({ pathname: '/trips/[id]', params: { id: tripId } })}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * Cabeçalhos só quando eles separam algo de fato: com uma única viagem, ou com
 * apenas viagens ativas, a lista fala por si.
 */
function TripSections({
  summaries,
  onOpen,
}: {
  summaries: TripSummary[];
  onOpen: (tripId: string) => void;
}) {
  const { active, history } = splitTripSections(summaries);
  const showHeadings = summaries.length > 1 && history.length > 0;

  const cards = (group: TripSummary[]) =>
    group.map((summary) => (
      <TripCard key={summary.trip.id} summary={summary} onPress={() => onOpen(summary.trip.id)} />
    ));

  return (
    <>
      {active.length > 0 ? (
        <View style={styles.section}>
          {showHeadings ? <SectionLabel>Próximas viagens</SectionLabel> : null}
          {cards(active)}
        </View>
      ) : null}

      {history.length > 0 ? (
        <View style={styles.section}>
          {showHeadings || (summaries.length > 1 && active.length === 0) ? (
            <SectionLabel>Histórico</SectionLabel>
          ) : null}
          {cards(history)}
        </View>
      ) : null}
    </>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name="airplane" size={30} color={colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>Você ainda não tem nenhuma viagem</Text>
      <Text style={styles.emptyText}>
        Crie sua primeira viagem para descobrir o que precisa verificar antes de embarcar.
      </Text>
      <View style={styles.emptyAction}>
        <Button label="Criar viagem" onPress={onCreate} />
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
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createPressed: {
    opacity: 0.6,
  },
  section: { gap: spacing.lg },
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

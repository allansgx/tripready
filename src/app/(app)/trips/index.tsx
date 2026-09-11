import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/auth-context';
import { TripCard } from '@/features/trips/components/trip-card';
import { TripFilterBar } from '@/features/trips/components/trip-filter-bar';
import {
  buildTripSummaries,
  filterTripSummaries,
  type TripFilter,
  type TripSummary,
} from '@/features/trips/domain/trip-summary';
import { tripsService } from '@/services';
import { colors, radius, spacing, typography } from '@/theme/tokens';

/**
 * A lista de viagens.
 *
 * Uma lista só, na ordem de relevância que `buildTripSummaries` decide — em
 * andamento, próximas por data de início, concluídas por término mais recente —
 * e filtros rápidos no topo para quem quer recortar. Os cabeçalhos de seção
 * saíram junto com a chegada dos filtros: separar "próximas" de "histórico"
 * dentro de uma lista que já pode ser filtrada por isso é dizer a mesma coisa
 * duas vezes.
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
          <Text style={styles.title}>Minhas viagens</Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Criar nova viagem"
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
            <Text style={styles.hint}>Buscando suas viagens...</Text>
          </View>
        ) : needsRetry ? (
          <View style={styles.centered}>
            <Text style={styles.hint}>Sua conexão oscilou. Toque para carregar de novo.</Text>
            <Button label="Carregar viagens" onPress={() => void load()} variant="ghost" />
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

/**
 * O vazio de um filtro, que nunca é um beco sem saída: cada um diz o que vai
 * aparecer ali e oferece o caminho de volta — outro filtro ou a criação da
 * viagem que está faltando.
 */
function FilterEmptyState({
  filter,
  onSelect,
  onCreate,
}: {
  filter: TripFilter;
  onSelect: (filter: TripFilter) => void;
  onCreate: () => void;
}) {
  // "Todas" vazio significa nenhuma viagem cadastrada, e quem responde por esse
  // caso é o vazio geral da tela.
  if (filter === 'all') return null;

  const options: Record<
    Exclude<TripFilter, 'all'>,
    { text: string; label: string; action: () => void }
  > = {
    ongoing: {
      text: 'Quando sua viagem começar, ela aparece aqui.',
      label: 'Ver as futuras',
      action: () => onSelect('upcoming'),
    },
    upcoming: {
      text: 'Que tal marcar a próxima?',
      label: 'Criar viagem',
      action: onCreate,
    },
    completed: {
      text: 'Suas viagens concluídas ficam guardadas aqui.',
      label: 'Ver todas',
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

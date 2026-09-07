import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/auth-context';
import { NextTripHero } from '@/features/trips/next-trip-hero';
import { tripSeasons } from '@/features/trips/requirement-matching';
import { SeasonField } from '@/features/trips/season-field';
import {
  buildTripSummaries,
  splitTripSections,
  type TripSummary,
} from '@/features/trips/trip-summary';
import { tripsService } from '@/services';
import { colors, radius, spacing, typography } from '@/theme/tokens';

/**
 * Início: uma viagem só, a próxima.
 *
 * A tela responde a duas perguntas — quanto falta para viajar e quão preparada
 * a viagem está — e oferece um único caminho adiante, o próximo passo da
 * checklist. A lista completa continua sendo assunto da aba Viagens; aqui
 * repetir viagens seria repetir aquela tela.
 */
export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [nextTrip, setNextTrip] = useState<TripSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsRetry, setNeedsRetry] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setNeedsRetry(false);
    try {
      const rows = await tripsService.listWithRelations(user.id);
      // `buildTripSummaries` já ordena por relevância: a primeira viagem ativa
      // é a em andamento ou a que começa antes — exatamente a que a Home destaca.
      const { active } = splitTripSections(buildTripSummaries(rows));
      setNextTrip(active[0] ?? null);
    } catch {
      setNeedsRetry(true);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  /**
   * As estações saem dos destinos, não do calendário de quem olha: dezembro é
   * inverno em Viena e verão no Rio. É a mesma regra da tela de detalhe, e
   * alimenta tanto o campo de partículas quanto o card.
   */
  const seasons = useMemo(
    () =>
      nextTrip
        ? tripSeasons(nextTrip.countryCodes, nextTrip.trip.start_date, nextTrip.trip.end_date)
        : [],
    [nextTrip],
  );

  return (
    <View style={styles.screen}>
      {/* O clima fica atrás de tudo e não recebe toque nenhum: é paisagem. */}
      {nextTrip ? (
        <SeasonField key={nextTrip.trip.id} seasons={seasons} seed={nextTrip.trip.id} />
      ) : null}

      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* Sem repique: com o card cabendo na tela, arrastar não deve mover
            nada — ele fica preso no meio. A rolagem continua existindo para
            quando o conteúdo de fato passar da altura disponível (nome longo,
            fonte ampliada pelo sistema). */}
        <ScrollView
          contentContainerStyle={styles.content}
          contentInsetAdjustmentBehavior="automatic"
          bounces={false}
          alwaysBounceVertical={false}
          overScrollMode="never">
          {isLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.hint}>Buscando sua próxima viagem...</Text>
            </View>
          ) : needsRetry ? (
            <View style={styles.centered}>
              <Text style={styles.hint}>Sua conexão oscilou. Toque para carregar de novo.</Text>
              <Button label="Carregar viagem" onPress={() => void load()} variant="ghost" />
            </View>
          ) : nextTrip ? (
            <NextTripHero
              summary={nextTrip}
              seasons={seasons}
              onOpen={() =>
                router.push({ pathname: '/trips/[id]', params: { id: nextTrip.trip.id } })
              }
            />
          ) : (
            <EmptyState onCreate={() => router.push('/trip-new')} />
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name="airplane" size={30} color={colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>Para onde você vai?</Text>
      <Text style={styles.emptyText}>
        Crie sua viagem e acompanhe aqui a contagem regressiva e tudo o que preparar antes de
        embarcar.
      </Text>
      <View style={styles.emptyAction}>
        <Button label="Criar viagem" onPress={onCreate} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  safe: { flex: 1 },
  // `flexGrow` faz o conteúdo ocupar a altura da rolagem mesmo sendo menor que
  // ela — é o que permite centralizar o card na tela e ainda assim rolar quando
  // ele cresce (nome longo, próximo passo em duas linhas, fonte ampliada).
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl - spacing.xs,
    gap: spacing.lg,
  },
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

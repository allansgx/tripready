import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { getCountryName } from '@/constants/countries';
import { useAuth } from '@/features/auth/auth-context';
import { syncAllTripReminders } from '@/features/notifications/data/reminder-scheduler';
import { NextTripHero } from '@/features/trips/components/next-trip-hero';
import type { FieldPointer } from '@/features/trips/components/season-field';
import { SeasonalBackdrop } from '@/features/trips/components/seasonal-backdrop';
import { TravelTipsCarousel } from '@/features/trips/components/travel-tips-carousel';
import { catalogCache } from '@/features/trips/data/catalog-cache';
import { resolveRequirementText, tripSeasons } from '@/features/trips/domain/requirement-matching';
import {
  buildTripSummaries,
  splitTripSections,
  type TripSummary,
} from '@/features/trips/domain/trip-summary';
import { getLocale, t } from '@/i18n';
import { requirementCatalogService, tripsService, type TripWithRelations } from '@/services';
import { colors, radius, spacing, typography } from '@/theme/tokens';

/**
 * Título e descrição no idioma ativo, resolvidos por cima do que já veio
 * gravado (sempre pt-BR). Falha de rede com cache frio não derruba a tela: os
 * itens continuam com o texto gravado, em pt-BR (§8.3/§12 do plano de i18n).
 */
async function resolveDisplayText(rows: TripWithRelations[]): Promise<TripWithRelations[]> {
  const allRequirements = rows.flatMap((row) => row.trip_requirements ?? []);
  if (allRequirements.length === 0) return rows;

  try {
    const locale = getLocale();
    const visaRuleIds = allRequirements.flatMap((item) =>
      item.visa_rule_id ? [item.visa_rule_id] : [],
    );

    const [catalog, visaRuleNotes] = await Promise.all([
      catalogCache.get(locale),
      requirementCatalogService.loadVisaRuleNotes(visaRuleIds, locale),
    ]);

    const templates = new Map(catalog.templates.map((template) => [template.id, template]));

    return rows.map((row) => ({
      ...row,
      trip_requirements: (row.trip_requirements ?? []).map((item) => ({
        ...item,
        ...resolveRequirementText(item, { templates, visaRuleNotes }, getCountryName),
      })),
    }));
  } catch {
    return rows;
  }
}

/** Início: a próxima viagem e o ambiente dela. A lista fica na aba Viagens. */
export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [nextTrip, setNextTrip] = useState<TripSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsRetry, setNeedsRetry] = useState(false);

  // `SharedValue` porque quem lê é o worklet da simulação, na UI thread.
  const pointer = useSharedValue<FieldPointer>({ x: 0, y: 0, active: false });

  // Onde a tela começa na janela: o toque chega em coordenadas da janela e as
  // partículas vivem em coordenadas da tela.
  const screenRef = useRef<View>(null);
  const origin = useRef({ x: 0, y: 0 });

  function measureOrigin() {
    screenRef.current?.measureInWindow((x, y) => {
      origin.current = { x, y };
    });
  }

  const load = useCallback(async () => {
    if (!user) return;
    setNeedsRetry(false);
    try {
      const rows = await tripsService.listWithRelations(user.id);
      const resolved = await resolveDisplayText(rows);
      // `buildTripSummaries` já ordena por relevância.
      const { active } = splitTripSections(buildTripSummaries(resolved));
      setNextTrip(active[0] ?? null);

      // Sem espera e sem `catch` visível: falha de agendamento não pode
      // atrapalhar a tela, e a próxima abertura reconcilia de novo.
      void syncAllTripReminders(rows).catch(() => {});
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

  // As estações saem dos destinos: dezembro é inverno em Viena e verão no Rio.
  const seasons = useMemo(
    () =>
      nextTrip
        ? tripSeasons(nextTrip.countryCodes, nextTrip.trip.start_date, nextTrip.trip.end_date)
        : [],
    [nextTrip],
  );

  // O toque é lido, nunca capturado: `onTouch*` borbulha sem disputar o gesto
  // com a rolagem nem com os botões. `pageX/pageY` porque o evento borbulha, e
  // a origem do `location` seria a view tocada lá embaixo.
  function trackTouch(event: GestureResponderEvent) {
    const touch = event.nativeEvent.touches[0];
    if (!touch) return;
    pointer.value = {
      x: touch.pageX - origin.current.x,
      y: touch.pageY - origin.current.y,
      active: true,
    };
  }

  // `onTouchCancel` importa tanto quanto o `onTouchEnd`: quando o sistema
  // interrompe o toque, é o único aviso que chega.
  function releaseTouch() {
    pointer.value = { x: 0, y: 0, active: false };
  }

  const showsTrip = !isLoading && !needsRetry && nextTrip !== null;

  return (
    <View
      ref={screenRef}
      style={styles.screen}
      onLayout={measureOrigin}
      onTouchStart={trackTouch}
      onTouchMove={trackTouch}
      onTouchEnd={releaseTouch}
      onTouchCancel={releaseTouch}>
      {/* A `key` carrega as estações: mudar as datas remonta o campo. */}
      <SeasonalBackdrop
        key={nextTrip ? `${nextTrip.trip.id}:${seasons.join('-')}` : 'empty'}
        seasons={seasons}
        seed={nextTrip?.trip.id ?? ''}
        pointer={pointer}
      />

      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          contentContainerStyle={[styles.content, showsTrip ? null : styles.centered]}
          contentInsetAdjustmentBehavior="automatic"
          bounces={false}
          alwaysBounceVertical={false}
          overScrollMode="never">
          {isLoading ? (
            <View style={styles.status}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.hint}>{t('trips.home.loading')}</Text>
            </View>
          ) : needsRetry ? (
            <View style={styles.status}>
              <Text style={styles.hint}>{t('trips.error.loadRetry')}</Text>
              <Button
                label={t('trips.home.loadRetryButton')}
                onPress={() => void load()}
                variant="ghost"
              />
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
      <Text style={styles.emptyTitle}>{t('trips.home.emptyTitle')}</Text>
      <Text style={styles.emptyText}>{t('trips.home.emptyText')}</Text>
      <View style={styles.emptyAction}>
        <Button label={t('trips.action.create')} onPress={onCreate} />
      </View>
      <TravelTipsCarousel />
    </View>
  );
}

const styles = StyleSheet.create({
  // O bege quem pinta é o ambiente sazonal, e só quando há estação a mostrar.
  screen: { flex: 1, backgroundColor: colors.background },
  safe: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl + spacing.md,
    // A barra de abas do iOS é translúcida e flutua sobre o conteúdo.
    paddingBottom: spacing.xxl,
  },
  /** Sem viagem, carregando ou sem conexão: um bloco só, no meio da tela. */
  centered: {
    justifyContent: 'center',
  },
  status: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  empty: {
    alignItems: 'center',
    gap: spacing.md,
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

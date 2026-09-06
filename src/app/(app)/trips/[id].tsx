import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ui/progress-bar';
import { getCountryName } from '@/constants/countries';
import { CelebrationOverlay, type Celebration } from '@/features/trips/celebration-overlay';
import { FlagRow } from '@/features/trips/flag-row';
import {
  CATEGORY_LABELS,
  CHECKLIST_CATEGORIES,
  PRIORITY_LABELS,
} from '@/features/trips/checklist-catalog';
import { formatTripDates } from '@/features/trips/trip-format';
import { computeTripProgress, formatProgressLabel } from '@/features/trips/trip-progress';
import { tripRequirementsService, tripsService } from '@/services';
import type { RequirementCategory, TripCity, TripCountry, TripRequirement } from '@/types/models';
import {
  colors,
  priorityColors,
  prioritySoftColors,
  radius,
  shadow,
  spacing,
  typography,
} from '@/theme/tokens';

type Filter = RequirementCategory | 'all';

export default function TripChecklistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();

  /**
   * Volta dentro da pilha da aba Viagens.
   *
   * `router.canGoBack()` enxerga o histórico da árvore inteira e podia levar
   * para outra aba; aqui a pergunta é específica: existe tela abaixo desta
   * *nesta* pilha? Se não existir (abertura por deep link, por exemplo), a
   * listagem entra no lugar do detalhe.
   */
  function goBackToTrips() {
    const state = navigation.getState();
    if ((state?.index ?? 0) > 0) {
      navigation.goBack();
      return;
    }
    router.replace('/trips');
  }

  const [name, setName] = useState('');
  const [dates, setDates] = useState('');
  const [countries, setCountries] = useState<TripCountry[]>([]);
  const [cities, setCities] = useState<TripCity[]>([]);
  const [requirements, setRequirements] = useState<TripRequirement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');
  const [notice, setNotice] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<Celebration | null>(null);

  /** Menu ••• : edição e exclusão ficam separadas, como ações distintas. */
  function openMenu() {
    if (!id) return;

    Alert.alert(name, undefined, [
      {
        text: 'Editar viagem',
        onPress: () => router.push({ pathname: '/trip-edit', params: { tripId: id } }),
      },
      { text: 'Excluir viagem', style: 'destructive', onPress: confirmDelete },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  function confirmDelete() {
    Alert.alert(
      'Excluir esta viagem?',
      'Esta viagem e sua checklist serão removidas do seu histórico.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir viagem',
          style: 'destructive',
          onPress: async () => {
            if (!id) return;
            try {
              // A cascata do banco remove países, cidades e requisitos junto.
              await tripsService.remove(id);
              router.replace('/trips');
            } catch {
              setNotice('Sua conexão oscilou. Toque no menu para tentar de novo.');
            }
          },
        },
      ],
    );
  }

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const detail = await tripsService.getDetail(id);
      if (!detail) return;
      setName(detail.name);
      setDates(formatTripDates(detail.start_date, detail.end_date));
      setCountries(detail.trip_countries ?? []);
      setCities(detail.trip_cities ?? []);
      setRequirements(detail.trip_requirements ?? []);
    } catch {
      setNotice('Sua conexão oscilou. Toque em atualizar para ver a checklist.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const progress = useMemo(() => computeTripProgress(requirements), [requirements]);

  /**
   * Estado da leitura anterior. A comemoração dispara só na **virada** — abrir
   * uma viagem que já estava pronta não comemora de novo.
   */
  const previousRef = useRef<{ ready: boolean; complete: boolean } | null>(null);

  useEffect(() => {
    if (isLoading) return;

    const complete = progress.total > 0 && progress.done === progress.total;
    const previous = previousRef.current;
    previousRef.current = { ready: progress.isReady, complete };

    // Primeira leitura depois de carregar: só registra o ponto de partida.
    if (!previous) return;

    if (!previous.complete && complete) {
      setCelebration({
        title: 'Tudo pronto! 🎉',
        message: 'Você verificou todos os itens da checklist. Boa viagem!',
      });
      return;
    }

    if (!previous.ready && progress.isReady) {
      setCelebration({
        title: 'Viagem pronta! 🎉',
        message: 'Você verificou todos os itens obrigatórios.',
      });
    }
  }, [isLoading, progress]);

  const categoriesInUse = useMemo(
    () => CHECKLIST_CATEGORIES.filter((category) => requirements.some((r) => r.category === category)),
    [requirements],
  );

  const visible = useMemo(
    () =>
      filter === 'all'
        ? requirements
        : requirements.filter((requirement) => requirement.category === filter),
    [requirements, filter],
  );

  async function toggle(requirement: TripRequirement) {
    const next = !requirement.completed;

    // Atualiza na hora: a checklist reflete o progresso sem esperar a rede.
    setRequirements((current) =>
      current.map((item) => (item.id === requirement.id ? { ...item, completed: next } : item)),
    );
    setNotice(null);

    try {
      await tripRequirementsService.setCompleted(requirement.id, next);
    } catch {
      setRequirements((current) =>
        current.map((item) =>
          item.id === requirement.id ? { ...item, completed: requirement.completed } : item,
        ),
      );
      setNotice('Sua conexão oscilou. Toque no item de novo para salvar.');
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.screen} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.hint}>Abrindo sua checklist...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* A ScrollView do React Native nasce com `contentInsetAdjustmentBehavior`
          em "never". Dentro de uma pilha aninhada na aba, o ajuste automático
          do react-native-screens não chega até aqui e o fim da lista fica sob a
          tab bar — no iOS 26 ela é flutuante e transparente, e o corte aparece.
          Com "automatic" o próprio UIKit aplica o inset da tab bar. */}
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Voltar"
            hitSlop={12}
            onPress={goBackToTrips}
            style={styles.back}>
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>

          <View style={styles.headerTexts}>
            <FlagRow codes={countries.map((country) => country.country_code)} size={18} />
            <Text style={styles.title} numberOfLines={2}>
              {name}
            </Text>
            {cities.length > 0 ? (
              <Text style={styles.cities} numberOfLines={2}>
                {cities.map((city) => city.city_name).join(' · ')}
              </Text>
            ) : null}
            <Text style={styles.dates}>{dates}</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Opções da viagem"
            hitSlop={12}
            onPress={openMenu}
            style={styles.menuButton}>
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.text} />
          </Pressable>
        </View>

        {progress.isReady ? (
          <View style={styles.readyCard}>
            <Text style={styles.readyTitle}>Viagem pronta! 🎉</Text>
            <Text style={styles.readyText}>Você verificou todos os itens obrigatórios.</Text>
          </View>
        ) : null}

        <View style={styles.progressCard}>
          <ProgressBar percent={progress.percent} />
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>{formatProgressLabel(progress)}</Text>
            <Text style={styles.percent}>{progress.percent}%</Text>
          </View>
          {!progress.isReady && progress.requiredPending > 0 ? (
            <Text style={styles.nextStep}>
              Próximo passo: verificar {progress.requiredPending}{' '}
              {progress.requiredPending === 1 ? 'item obrigatório' : 'itens obrigatórios'}.
            </Text>
          ) : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}>
          <FilterChip
            label="Todos"
            count={`${requirements.filter((r) => r.completed).length}/${requirements.length}`}
            active={filter === 'all'}
            onPress={() => setFilter('all')}
          />
          {categoriesInUse.map((category) => {
            const items = requirements.filter((requirement) => requirement.category === category);
            return (
              <FilterChip
                key={category}
                label={CATEGORY_LABELS[category]}
                count={`${items.filter((item) => item.completed).length}/${items.length}`}
                active={filter === category}
                onPress={() => setFilter(category)}
              />
            );
          })}
        </ScrollView>

        {notice ? <Text style={styles.notice}>{notice}</Text> : null}

        <View style={styles.list}>
          {visible.length === 0 ? (
            <Text style={styles.hint}>Nada por aqui. Escolha outra categoria acima.</Text>
          ) : (
            visible.map((requirement) => (
              <RequirementRow
                key={requirement.id}
                requirement={requirement}
                onPress={() => void toggle(requirement)}
              />
            ))
          )}
        </View>

        {progress.total === 0 ? (
          <Button label="Atualizar checklist" variant="ghost" onPress={() => void load()} />
        ) : null}
      </ScrollView>

      <CelebrationOverlay celebration={celebration} onDismiss={() => setCelebration(null)} />
    </SafeAreaView>
  );
}

function FilterChip({
  label,
  count,
  active,
  onPress,
}: {
  label: string;
  count: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{label}</Text>
      <Text style={[styles.chipCount, active && styles.chipCountActive]}>{count}</Text>
    </Pressable>
  );
}

function RequirementRow({
  requirement,
  onPress,
}: {
  requirement: TripRequirement;
  onPress: () => void;
}) {
  const tone = priorityColors[requirement.priority];

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: requirement.completed }}
      accessibilityLabel={requirement.title}
      onPress={onPress}
      style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}>
      <View style={[styles.checkbox, requirement.completed && styles.checkboxDone]}>
        {requirement.completed ? (
          <Ionicons name="checkmark" size={14} color={colors.contrastText} />
        ) : null}
      </View>

      <View style={styles.itemTexts}>
        <Text
          style={[styles.itemTitle, requirement.completed && styles.itemTitleDone]}
          numberOfLines={2}>
          {requirement.title}
        </Text>

        <View style={styles.itemMeta}>
          <View style={[styles.dot, { backgroundColor: tone }]} />
          <Text style={[styles.priority, { color: tone }]}>
            {PRIORITY_LABELS[requirement.priority]}
          </Text>
          {requirement.country_code ? (
            <Text style={styles.country}>· {getCountryName(requirement.country_code)}</Text>
          ) : null}
        </View>

        {requirement.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {requirement.description}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    padding: spacing.xl - spacing.xs,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  back: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing.sm,
    marginTop: spacing.xs,
  },
  menuButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  headerTexts: { flex: 1, gap: spacing.xs },
  title: { ...typography.screenTitle, color: colors.text },
  cities: { ...typography.caption, color: colors.textSecondary },
  dates: { ...typography.caption, color: colors.textSecondary },
  readyCard: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  readyTitle: { ...typography.bodyStrong, color: colors.primary },
  readyText: { ...typography.caption, color: colors.text },
  progressCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadow.card,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressLabel: { ...typography.caption, color: colors.textSecondary },
  percent: { ...typography.bodyStrong, color: colors.primary },
  nextStep: { ...typography.caption, color: colors.text },
  chips: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipLabel: { ...typography.caption, fontWeight: '600', color: colors.text },
  chipLabelActive: { color: colors.contrastText },
  chipCount: { ...typography.caption, color: colors.textSecondary },
  chipCountActive: { color: colors.contrastText },
  notice: {
    ...typography.caption,
    color: colors.text,
    backgroundColor: prioritySoftColors.recommended,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  list: { gap: spacing.md },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  itemPressed: { backgroundColor: colors.background },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.progressTrack,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxDone: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  itemTexts: { flex: 1, gap: spacing.xs },
  itemTitle: { ...typography.body, color: colors.text },
  itemTitleDone: {
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  itemMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dot: { width: 7, height: 7, borderRadius: radius.pill },
  priority: { ...typography.caption, fontWeight: '600' },
  country: { ...typography.caption, color: colors.textSecondary },
  description: { ...typography.caption, color: colors.textSecondary },
});

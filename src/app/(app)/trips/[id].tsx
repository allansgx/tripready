import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  LayoutAnimation,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccordionSection } from '@/components/ui/accordion-section';
import { Button } from '@/components/ui/button';
import { CountryFlag } from '@/components/ui/country-flag';
import { showDialog } from '@/components/ui/dialog';
import { ProgressRing } from '@/components/ui/progress-ring';
import { ReminderOptInCard } from '@/features/notifications/components/reminder-opt-in-card';
import {
  canAskForReminders,
  markRemindersAsked,
  requestReminderPermission,
} from '@/features/notifications/data/reminder-permission';
import {
  cancelTripReminders,
  scheduleReminderPreview,
  syncTripReminders,
} from '@/features/notifications/data/reminder-scheduler';
import {
  CelebrationOverlay,
  type Celebration,
} from '@/features/trips/components/celebration-overlay';
import { FlagRow } from '@/features/trips/components/flag-row';
import {
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  CHECKLIST_CATEGORIES,
  PRIORITY_LABELS,
} from '@/features/trips/data/checklist-catalog';
import {
  groupRequirementsByCategory,
  isSectionComplete,
  nextPendingCategory,
  tripSeasons,
} from '@/features/trips/domain/requirement-matching';
import { formatTripDates, summarizeTripSeasons } from '@/features/trips/domain/trip-format';
import {
  computeTripProgress,
  formatPendingRequiredLabel,
  formatProgressLabel,
} from '@/features/trips/domain/trip-progress';
import { getTripStatus } from '@/features/trips/domain/trip-status';
import { layoutTransition, SECTION_TOGGLE_MS, useReduceMotion } from '@/lib/animation';
import { tripRequirementsService, tripsService, type TripRequirementWithGroup } from '@/services';
import {
  colors,
  priorityColors,
  prioritySoftColors,
  radius,
  seasonBorderColors,
  seasonColors,
  seasonSoftColors,
  shadow,
  spacing,
  typography,
} from '@/theme/tokens';
import type { RequirementCategory, TripCity, TripCountry } from '@/types/models';

// Uma pausa para a marcação do último item ser vista — a fração da seção fecha
// a conta — antes de a seção ceder o lugar para a próxima.
const COMPLETION_BEAT_MS = 360;

function wait(duration: number) {
  return new Promise((resolve) => setTimeout(resolve, duration));
}

export default function TripChecklistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const navigation = useNavigation();

  // `router.canGoBack()` enxerga a árvore inteira e podia levar para outra aba.
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
  /** Datas como vêm do banco — o texto formatado não serve para calcular estação. */
  const [range, setRange] = useState<{ start: string | null; end: string | null }>({
    start: null,
    end: null,
  });
  const [countries, setCountries] = useState<TripCountry[]>([]);
  const [cities, setCities] = useState<TripCity[]>([]);
  const [requirements, setRequirements] = useState<TripRequirementWithGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState<ReadonlySet<RequirementCategory>>(new Set());
  const [notice, setNotice] = useState<string | null>(null);
  const [celebration, setCelebration] = useState<Celebration | null>(null);
  const [showOptIn, setShowOptIn] = useState(false);
  const [optInBusy, setOptInBusy] = useState(false);

  const reduceMotion = useReduceMotion();

  // Rolagem até a seção recém-aberta. As posições vêm do `onLayout` de cada
  // cartão, medidas dentro da lista; o alvo espera a medida chegar atualizada.
  const scrollRef = useRef<ScrollView>(null);
  const listTopRef = useRef(0);
  const sectionTopsRef = useRef(new Map<RequirementCategory, number>());
  const scrollTargetRef = useRef<RequirementCategory | null>(null);
  /** Identifica o avanço em curso: um novo toque invalida o anterior. */
  const advanceRef = useRef(0);

  function consumeScrollTarget(category: RequirementCategory) {
    if (scrollTargetRef.current !== category) return;
    scrollTargetRef.current = null;

    const top = sectionTopsRef.current.get(category);
    if (top === undefined) return;

    scrollRef.current?.scrollTo({
      y: Math.max(listTopRef.current + top - spacing.lg, 0),
      animated: !reduceMotion,
    });
  }

  function animateSections() {
    if (!reduceMotion) LayoutAnimation.configureNext(layoutTransition());
  }

  /** Espera só quando há animação a acompanhar. */
  function beat(duration: number) {
    return reduceMotion ? Promise.resolve() : wait(duration);
  }

  /** A viagem no formato que o agendador espera. */
  const reminderTrip = { id: id ?? '', start_date: range.start, end_date: range.end };

  /** Menu ••• : edição e exclusão ficam separadas, como ações distintas. */
  function openMenu() {
    if (!id) return;

    showDialog(name, undefined, [
      {
        text: 'Editar viagem',
        onPress: () => router.push({ pathname: '/trip-edit', params: { tripId: id } }),
      },
      { text: 'Excluir viagem', style: 'destructive', onPress: confirmDelete },
      // Some do build de produção junto com o `__DEV__`.
      ...(__DEV__ ? [{ text: 'Testar lembretes', onPress: previewReminders }] : []),
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  /** Só em desenvolvimento: os lembretes reais desta viagem, em segundos. */
  async function previewReminders() {
    if (!id) return;

    try {
      if (!(await requestReminderPermission())) {
        setNotice('Ative os lembretes nos ajustes do sistema para ver o teste.');
        return;
      }

      const count = await scheduleReminderPreview(reminderTrip, requirements);
      setNotice(
        count === 0
          ? 'Esta viagem não tem lembrete para mostrar agora.'
          : `${count === 1 ? '1 lembrete a caminho' : `${count} lembretes a caminho`}. Feche o app para vê-los.`,
      );
    } catch {
      setNotice('Sua conexão oscilou. Toque no menu para tentar de novo.');
    }
  }

  function confirmDelete() {
    showDialog(
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
              await cancelTripReminders(id).catch(() => {});
              router.replace('/trips');
            } catch {
              setNotice('Sua conexão oscilou. Toque no menu para tentar de novo.');
            }
          },
        },
      ],
    );
  }

  // Abertura inicial decidida uma vez por viagem: a primeira categoria com
  // obrigatório pendente nasce aberta, e depois quem manda é a pessoa.
  const didExpandRef = useRef(false);

  const load = useCallback(async () => {
    if (!id) return;

    try {
      const detail = await tripsService.getDetail(id);
      if (!detail) return;
      setName(detail.name);
      setDates(formatTripDates(detail.start_date, detail.end_date));
      setRange({ start: detail.start_date, end: detail.end_date });
      setCountries(detail.trip_countries ?? []);
      setCities(detail.trip_cities ?? []);
      setRequirements(detail.trip_requirements ?? []);

      if (!didExpandRef.current) {
        didExpandRef.current = true;

        const first = groupRequirementsByCategory(
          detail.trip_requirements ?? [],
          CHECKLIST_CATEGORIES,
        ).find((section) =>
          section.items.some((item) => item.priority === 'required' && !item.completed),
        );

        if (first) setExpanded(new Set([first.category]));
      }
    } catch {
      setNotice('Sua conexão oscilou. Toque em atualizar para ver a checklist.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  // Recarrega ao voltar da edição da viagem ou do detalhe de um item.
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const progress = useMemo(() => computeTripProgress(requirements), [requirements]);

  // A comemoração dispara só na virada, nunca ao reabrir uma viagem pronta.
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

  // O convite espera a checklist carregar: é diante dos itens que ele se
  // explica. Viagem sem data futura não tem lembrete a oferecer.
  useEffect(() => {
    if (isLoading || !range.start) return;
    if (getTripStatus({ start_date: range.start, end_date: range.end }) !== 'upcoming') return;

    let active = true;
    void canAskForReminders()
      .then((canAsk) => {
        if (active && canAsk) setShowOptIn(true);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [isLoading, range]);

  async function enableReminders() {
    setOptInBusy(true);
    try {
      if (await requestReminderPermission()) {
        await syncTripReminders(reminderTrip, requirements);
      }
    } catch {
      // Nada a dizer: o app funciona igual sem lembrete.
    } finally {
      setOptInBusy(false);
      setShowOptIn(false);
    }
  }

  function dismissReminders() {
    setShowOptIn(false);
    void markRemindersAsked().catch(() => {});
  }

  // A estação sai dos países da viagem: dezembro é inverno em Viena e verão no Rio.
  const season = useMemo(
    () =>
      summarizeTripSeasons(
        tripSeasons(
          countries.map((country) => country.country_code),
          range.start,
          range.end,
        ),
        getTripStatus({ start_date: range.start, end_date: range.end }),
      ),
    [countries, range],
  );

  const sections = useMemo(
    () => groupRequirementsByCategory(requirements, CHECKLIST_CATEGORIES),
    [requirements],
  );

  function toggleSection(category: RequirementCategory) {
    // O toque manual assume o comando e cancela um avanço em curso.
    advanceRef.current += 1;

    // Seção lá embaixo abre fora da janela: a rolagem leva o cabeçalho para o
    // topo e os itens aparecem sem o usuário procurar.
    if (!expanded.has(category)) scrollTargetRef.current = category;

    setExpanded((current) => {
      const next = new Set(current);
      if (!next.delete(category)) next.add(category);
      return next;
    });
  }

  /**
   * Seção completa fecha e entrega a vez à próxima com item por verificar, um
   * tempo de cada vez: a marcação se vê, a seção recolhe, a seguinte abre junto
   * com a rolagem que a traz para a janela.
   */
  async function advanceAfterCompleting(
    category: RequirementCategory,
    updated: TripRequirementWithGroup[],
  ) {
    const grouped = groupRequirementsByCategory(updated, CHECKLIST_CATEGORIES);
    const section = grouped.find((item) => item.category === category);
    if (!section || !isSectionComplete(section)) return;

    const following = nextPendingCategory(grouped, category);
    const run = (advanceRef.current += 1);

    await beat(COMPLETION_BEAT_MS);
    if (advanceRef.current !== run) return;

    animateSections();
    setExpanded((current) => {
      const next = new Set(current);
      next.delete(category);
      return next;
    });

    if (!following) return;

    await beat(SECTION_TOGGLE_MS);
    if (advanceRef.current !== run) return;

    animateSections();
    setExpanded((current) => new Set(current).add(following));
    scrollTargetRef.current = following;
  }

  async function toggle(requirement: TripRequirementWithGroup) {
    const next = !requirement.completed;

    const updated = requirements.map((item) =>
      item.id === requirement.id ? { ...item, completed: next } : item,
    );

    // Atualiza na hora: a checklist reflete o progresso sem esperar a rede.
    animateSections();
    setRequirements(updated);
    setNotice(null);

    if (next) void advanceAfterCompleting(requirement.category, updated);

    try {
      await tripRequirementsService.setCompleted(requirement.id, next);

      // Aqui, e não só ao voltar para a lista: marcar o último obrigatório
      // cancela o lembrete de pendência no ato.
      void syncTripReminders(reminderTrip, updated).catch(() => {});
    } catch {
      setRequirements((current) =>
        current.map((item) =>
          item.id === requirement.id ? { ...item, completed: requirement.completed } : item,
        ),
      );
      setNotice('Sua conexão oscilou. Toque no item de novo para salvar.');
    }
  }

  function openRequirement(requirement: TripRequirementWithGroup) {
    router.push({
      pathname: '/trips/item/[requirementId]',
      params: { requirementId: requirement.id, tripId: requirement.trip_id },
    });
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
      {/* "automatic": sem isso o fim da lista fica sob a tab bar flutuante do iOS. */}
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        // Rede de segurança: quando o alvo já estava aberto, o `onLayout` dele
        // não dispara e só a mudança de altura da lista denuncia o rearranjo.
        onContentSizeChange={() => {
          const target = scrollTargetRef.current;
          if (target) requestAnimationFrame(() => consumeScrollTarget(target));
        }}
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

        <View
          style={[
            styles.progressCard,
            season
              ? {
                  backgroundColor: seasonSoftColors[season.season],
                  borderColor: seasonBorderColors[season.season],
                  borderWidth: 1,
                }
              : null,
          ]}>
          <View style={styles.progressRow}>
            <ProgressRing percent={progress.percent} />
            <View style={styles.progressTexts}>
              <Text style={styles.progressLabel}>{formatProgressLabel(progress)}</Text>
              <RequiredLine progress={progress} />
            </View>
          </View>

          {season ? (
            <View style={styles.seasonRow}>
              <View style={styles.seasonBadge}>
                <Text style={styles.seasonEmoji}>{season.emoji}</Text>
              </View>
              <View style={styles.seasonTexts}>
                <Text style={styles.seasonHeadline}>{season.headline}</Text>
                {season.detail ? (
                  <Text style={[styles.seasonDetail, { color: seasonColors[season.season] }]}>
                    {season.detail}
                  </Text>
                ) : null}
              </View>
            </View>
          ) : null}
        </View>

        {notice ? <Text style={styles.notice}>{notice}</Text> : null}

        {showOptIn ? (
          <ReminderOptInCard
            onEnable={enableReminders}
            onDismiss={dismissReminders}
            busy={optInBusy}
          />
        ) : null}

        <View
          style={styles.list}
          onLayout={(event) => {
            listTopRef.current = event.nativeEvent.layout.y;
          }}>
          {sections.length === 0 ? (
            <Text style={styles.hint}>Sua checklist aparece aqui assim que ficar pronta.</Text>
          ) : (
            sections.map((section) => (
              <View
                key={section.category}
                onLayout={(event) => {
                  sectionTopsRef.current.set(section.category, event.nativeEvent.layout.y);
                  consumeScrollTarget(section.category);
                }}>
                <AccordionSection
                  title={CATEGORY_LABELS[section.category]}
                  icon={
                    <Ionicons
                      name={CATEGORY_ICONS[section.category]}
                      size={18}
                      color={colors.primary}
                    />
                  }
                  progress={{ done: section.done, total: section.total }}
                  // Categoria só de informativos não tem fração: uma barra em
                  // zero pareceria trabalho pendente.
                  meta={`${section.items.length} ${section.items.length === 1 ? 'item' : 'itens'}`}
                  expanded={expanded.has(section.category)}
                  onToggle={() => toggleSection(section.category)}>
                  {section.items.map((requirement, index) => (
                    <RequirementRow
                      key={requirement.id}
                      requirement={requirement}
                      first={index === 0}
                      onToggle={() => void toggle(requirement)}
                      onOpen={() => openRequirement(requirement)}
                    />
                  ))}
                </AccordionSection>
              </View>
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

/** Como estão os obrigatórios: some só quando não há nenhum a responder. */
function RequiredLine({ progress }: { progress: ReturnType<typeof computeTripProgress> }) {
  if (progress.total === 0 || progress.requiredTotal === 0) return null;

  if (progress.isReady) {
    return (
      <Text style={[styles.progressPending, { color: colors.primary }]}>
        ✓ Tudo certo com os itens obrigatórios!
      </Text>
    );
  }

  const pending = formatPendingRequiredLabel(progress);
  if (!pending) return null;

  return (
    <Text style={[styles.progressPending, { color: priorityColors.required }]}>
      {pending} {progress.requiredPending === 1 ? 'pendente' : 'pendentes'}
    </Text>
  );
}

/** Dois alvos de toque: a caixa marca o item, o resto da linha abre o detalhe. */
function RequirementRow({
  requirement,
  first,
  onToggle,
  onOpen,
}: {
  requirement: TripRequirementWithGroup;
  first: boolean;
  onToggle: () => void;
  onOpen: () => void;
}) {
  const tone = priorityColors[requirement.priority];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir ${requirement.title}`}
      onPress={onOpen}
      style={({ pressed }) => [
        styles.item,
        !first && styles.itemDivided,
        pressed && styles.itemPressed,
      ]}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: requirement.completed }}
        accessibilityLabel={
          requirement.completed
            ? `Desmarcar ${requirement.title}`
            : `Marcar ${requirement.title} como verificado`
        }
        hitSlop={8}
        onPress={onToggle}
        style={[styles.checkbox, requirement.completed && styles.checkboxDone]}>
        {requirement.completed ? (
          <Ionicons name="checkmark" size={14} color={colors.contrastText} />
        ) : null}
      </Pressable>

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
            <CountryFlag code={requirement.country_code} size={13} />
          ) : null}
        </View>
      </View>

      <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
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
    gap: spacing.lg,
  },
  progressTexts: { flex: 1, gap: spacing.xs },
  progressLabel: { ...typography.bodyStrong, color: colors.text },
  progressPending: { ...typography.caption, fontWeight: '600' },
  seasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    // Filete branco: separa sem introduzir mais uma cor sobre o fundo tingido.
    borderTopWidth: 1,
    borderTopColor: colors.surface,
    paddingTop: spacing.md,
  },
  seasonBadge: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seasonEmoji: { fontSize: 16, lineHeight: 20 },
  seasonTexts: { flex: 1, gap: 2 },
  seasonHeadline: { ...typography.caption, color: colors.text, fontWeight: '600' },
  seasonDetail: { ...typography.caption, fontWeight: '600' },
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
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  itemDivided: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
  },
  itemPressed: { opacity: 0.6 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.progressTrack,
    alignItems: 'center',
    justifyContent: 'center',
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
});

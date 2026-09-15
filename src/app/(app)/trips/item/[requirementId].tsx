import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { CountryFlag } from '@/components/ui/country-flag';
import { SectionLabel } from '@/components/ui/section-label';
import { getCountryName } from '@/constants/countries';
import { usePassports } from '@/features/passports/passports-context';
import {
  CATEGORY_ICONS,
  categoryLabel,
  priorityLabel,
  type IoniconName,
} from '@/features/trips/data/checklist-catalog';
import { buildAffiliateClick } from '@/features/trips/domain/affiliate-click';
import { describeRequirementScope } from '@/features/trips/domain/requirement-matching';
import { t } from '@/i18n';
import {
  affiliateClicksService,
  requirementOffersService,
  tripDestinationsService,
  tripRequirementsService,
  type TripRequirementWithGroup,
} from '@/services';
import {
  colors,
  priorityColors,
  prioritySoftColors,
  radius,
  shadow,
  spacing,
  typography,
} from '@/theme/tokens';
import type { RequirementOffer } from '@/types/models';

/**
 * No iOS o `await` já segura a linha durante toda a visita, porque a promise só
 * resolve quando o navegador fecha; no Android ela resolve na abertura, e sem
 * esta espera a linha destravaria com a tela ainda em transição.
 */
const OFFER_PRESS_COOLDOWN_MS = 1000;

export default function RequirementDetailScreen() {
  const { requirementId, tripId } = useLocalSearchParams<{
    requirementId: string;
    tripId?: string;
  }>();
  const router = useRouter();
  const navigation = useNavigation();
  const { primary } = usePassports();

  const [requirement, setRequirement] = useState<TripRequirementWithGroup | null>(null);
  const [offers, setOffers] = useState<RequirementOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // `router.canGoBack()` enxerga a árvore inteira e poderia levar para outra aba.
  function goBack() {
    const state = navigation.getState();
    if ((state?.index ?? 0) > 0) {
      navigation.goBack();
      return;
    }
    router.replace(tripId ? { pathname: '/trips/[id]', params: { id: tripId } } : '/trips');
  }

  useEffect(() => {
    if (!requirementId) return;

    let active = true;

    async function load() {
      try {
        const item = await tripRequirementsService.getById(requirementId);
        if (!active) return;
        setRequirement(item);

        // Item criado à mão não vem do catálogo, então não tem oferta.
        if (item?.template_id) {
          void loadOffers(item);
        }
      } catch {
        if (active) setNotice(t('requirement.error.loadRetry'));
      } finally {
        if (active) setIsLoading(false);
      }
    }

    // As sugestões são um extra: falhar aqui não pode derrubar a tela.
    async function loadOffers(item: TripRequirementWithGroup) {
      if (!item.template_id) return;

      try {
        const countries = await tripDestinationsService.listCountries(item.trip_id);
        const list = await requirementOffersService.listForTemplate(item.template_id, {
          destinationCountryCodes: countries.map((country) => country.country_code),
          passportCountryCode: primary?.country_code ?? null,
          today: new Date().toISOString().slice(0, 10),
        });
        if (active) setOffers(list);
      } catch {
        // Sem ação: o bloco de sugestões simplesmente não aparece.
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, [requirementId, primary?.country_code]);

  // Marcar encerra a visita e volta; desmarcar fica, porque quem desmarca está
  // reabrindo o item para reler. A volta só acontece se a escrita der certo.
  async function toggleCompleted() {
    if (!requirement) return;

    const next = !requirement.completed;
    setIsSaving(true);
    setNotice(null);

    try {
      await tripRequirementsService.setCompleted(requirement.id, next);
      setRequirement({ ...requirement, completed: next });
      if (next) goBack();
    } catch {
      setNotice(t('requirement.error.toggleRetry'));
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <Header onBack={goBack} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!requirement) {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <Header onBack={goBack} />
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>{t('requirement.notFound')}</Text>
          <Button label={t('trips.action.backToTrip')} variant="ghost" onPress={goBack} />
        </View>
      </SafeAreaView>
    );
  }

  const tone = priorityColors[requirement.priority];
  const scope = describeRequirementScope(requirement, getCountryName);
  const sourceName = requirement.source_name;
  const sourceUrl = requirement.source_url;
  const hasSource = Boolean(sourceName && sourceUrl);
  const hasAffiliate = offers.some((offer) => offer.is_affiliate);

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <Header onBack={goBack} />

      {/* Quem responde pela tab bar aqui é o `edges={['bottom']}` do
          SafeAreaView, porque o rodapé é fixo e precisa ficar acima dela. Com
          "automatic" o UIKit somaria o mesmo inset de novo no fim da lista,
          abrindo um vão antes do botão. */}
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}>
        <View style={[styles.badge, { backgroundColor: prioritySoftColors[requirement.priority] }]}>
          <View style={[styles.dot, { backgroundColor: tone }]} />
          <Text style={[styles.badgeLabel, { color: tone }]}>
            {priorityLabel(requirement.priority)}
          </Text>
        </View>

        <Text style={styles.title}>{requirement.title}</Text>

        <View style={styles.context}>
          <Ionicons name={CATEGORY_ICONS[requirement.category]} size={14} color={colors.primary} />
          <Text style={styles.contextText}>{categoryLabel(requirement.category)}</Text>
          <Text style={styles.contextSeparator}>·</Text>
          {scope.countryCode ? (
            <CountryFlag code={scope.countryCode} />
          ) : (
            <Text style={styles.contextIcon}>{scope.kind === 'trip' ? '🌍' : '🧭'}</Text>
          )}
          <Text style={styles.contextText} numberOfLines={1}>
            {scope.label ?? t('trips.checklist.wholeTrip')}
          </Text>
        </View>

        {requirement.description ? (
          <View>
            <SectionLabel>{t('requirement.section.whatToCheck')}</SectionLabel>
            <View style={styles.card}>
              <RequirementDescription text={requirement.description} />
            </View>
          </View>
        ) : null}

        {offers.length > 0 ? (
          <View>
            <SectionLabel>{t('requirement.section.offers')}</SectionLabel>
            <View style={styles.offers}>
              {offers.map((offer) => (
                <OfferRow key={offer.id} offer={offer} tripId={requirement.trip_id} />
              ))}
            </View>
            {hasAffiliate ? (
              <Text style={styles.disclosure}>{t('requirement.affiliateDisclosure')}</Text>
            ) : null}
          </View>
        ) : null}

        {sourceName && sourceUrl ? (
          <View>
            <SectionLabel>{t('requirement.section.source')}</SectionLabel>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={t('a11y.requirement.openSource', { name: sourceName })}
              onPress={() => openLink(sourceUrl)}
              style={({ pressed }) => [styles.card, styles.source, pressed && styles.cardPressed]}>
              <Ionicons name="open-outline" size={16} color={colors.primary} />
              <Text style={styles.sourceText} numberOfLines={2}>
                {sourceName}
              </Text>
            </Pressable>
          </View>
        ) : null}

        {hasSource ? (
          <View style={styles.reminder}>
            <Text style={styles.reminderText}>💡 {t('requirement.officialReminder')}</Text>
          </View>
        ) : null}

        {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={t(requirement.completed ? 'requirement.uncheckButton' : 'requirement.checkButton')}
          variant={requirement.completed ? 'ghost' : 'primary'}
          loading={isSaving}
          onPress={() => void toggleCompleted()}
        />
      </View>
    </SafeAreaView>
  );
}

function Header({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('common.action.back')}
        hitSlop={12}
        onPress={onBack}
        style={styles.back}>
        <Ionicons name="chevron-back" size={22} color={colors.text} />
      </Pressable>
      <Text style={styles.headerTitle}>{t('trips.detail.title')}</Text>
    </View>
  );
}

/** Uma sugestão de onde resolver o requisito. */
function OfferRow({ offer, tripId }: { offer: RequirementOffer; tripId: string }) {
  // O ícone vem como nome do Ionicons ou emoji; sem testar, o emoji viraria um
  // quadrado vazio.
  const glyph = offer.icon && offer.icon in Ionicons.glyphMap ? (offer.icon as IoniconName) : null;

  // Toque repetido por ansiedade é uma intenção só, e o registro sai antes do
  // navegador: invertido, o clique de quem fecha o app de dentro dele sumiria
  // no iOS, e a métrica diria que iPhone converte menos.
  const opening = useRef(false);

  async function handlePress() {
    if (opening.current) return;
    opening.current = true;

    void affiliateClicksService.record(buildAffiliateClick(offer, tripId));
    await openLink(offer.url);

    setTimeout(() => {
      opening.current = false;
    }, OFFER_PRESS_COOLDOWN_MS);
  }

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={t('a11y.openItem', { name: offer.name })}
      onPress={() => void handlePress()}
      style={({ pressed }) => [styles.card, styles.offer, pressed && styles.cardPressed]}>
      <View style={styles.offerIcon}>
        {glyph ? (
          <Ionicons name={glyph} size={18} color={colors.primary} />
        ) : (
          <Text style={styles.offerEmoji}>{offer.icon ?? '🔗'}</Text>
        )}
      </View>

      <View style={styles.offerTexts}>
        <Text style={styles.offerName} numberOfLines={1}>
          {offer.name}
        </Text>
        {offer.description ? (
          <Text style={styles.offerDescription} numberOfLines={2}>
            {offer.description}
          </Text>
        ) : null}
      </View>

      <Ionicons name="arrow-forward" size={16} color={colors.textSecondary} />
    </Pressable>
  );
}

/**
 * A descrição do catálogo chega com a primeira linha dizendo o que fazer e as
 * seguintes listando o que conferir, uma por linha.
 */
function RequirementDescription({ text }: { text: string }) {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return null;

  const [lead, ...topics] = lines;

  return (
    <View style={styles.description}>
      <Text style={styles.descriptionLead}>{lead}</Text>
      {topics.map((topic) => (
        <View key={topic} style={styles.topic}>
          <Text style={styles.topicBullet}>•</Text>
          <Text style={styles.topicText}>{topic}</Text>
        </View>
      ))}
    </View>
  );
}

/** Falha em silêncio: a tela continua legível e correta sem o link. */
async function openLink(url: string) {
  try {
    await WebBrowser.openBrowserAsync(url);
  } catch {
    // Sem ação.
  }
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  back: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -spacing.sm,
  },
  headerTitle: { ...typography.bodyStrong, color: colors.text },
  content: {
    padding: spacing.xl - spacing.xs,
    paddingTop: spacing.sm,
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    padding: spacing.xl,
  },
  emptyTitle: { ...typography.body, color: colors.text, textAlign: 'center' },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  dot: { width: 7, height: 7, borderRadius: radius.pill },
  badgeLabel: { ...typography.caption, fontWeight: '600' },
  title: { ...typography.title, color: colors.text },
  context: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  contextText: { ...typography.caption, color: colors.textSecondary, flexShrink: 1 },
  contextSeparator: { ...typography.caption, color: colors.textSecondary },
  contextIcon: { fontSize: 14, lineHeight: 18 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadow.card,
  },
  cardPressed: { backgroundColor: colors.background },
  description: { gap: spacing.md },
  descriptionLead: { ...typography.body, color: colors.text },
  topic: { flexDirection: 'row', gap: spacing.sm },
  // Marcador fora do bloco de texto: é o que dá a indentação pendurada.
  topicBullet: { ...typography.body, color: colors.primary },
  topicText: { ...typography.body, color: colors.text, flex: 1 },
  offers: { gap: spacing.sm },
  offer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  offerIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offerEmoji: { fontSize: 16, lineHeight: 20 },
  offerTexts: { flex: 1, gap: 2 },
  offerName: { ...typography.bodyStrong, color: colors.text },
  offerDescription: { ...typography.caption, color: colors.textSecondary },
  disclosure: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginHorizontal: spacing.xs,
  },
  source: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sourceText: { ...typography.body, color: colors.primary, flexShrink: 1 },
  reminder: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  reminderText: { ...typography.caption, color: colors.text },
  notice: {
    ...typography.caption,
    color: colors.text,
    backgroundColor: prioritySoftColors.recommended,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  footer: {
    padding: spacing.lg,
    paddingTop: spacing.sm,
    // Colado no limite da área segura o botão fica sob a tab bar do iOS.
    paddingBottom: spacing.xl,
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});

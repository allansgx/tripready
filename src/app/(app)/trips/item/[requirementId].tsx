import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { CountryFlag } from '@/components/ui/country-flag';
import { SectionLabel } from '@/components/ui/section-label';
import { getCountryName } from '@/constants/countries';
import { usePassports } from '@/features/passports/passports-context';
import {
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  type IoniconName,
} from '@/features/trips/checklist-catalog';
import { describeRequirementScope } from '@/features/trips/requirement-matching';
import {
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
 * Aviso de transparência das indicações pagas.
 *
 * Fica no app, e não no banco: é uma declaração do TripReady sobre como ele se
 * sustenta, e não um atributo de cada oferta. Só aparece quando alguma das
 * ofertas exibidas é de fato afiliada.
 */
const AFFILIATE_DISCLOSURE =
  'Algumas indicações podem gerar comissão para o TripReady, sem custo adicional para você.';

const OFFICIAL_REMINDER = 'Confirme sempre nos canais oficiais antes de viajar.';

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

  /**
   * Volta para a viagem, mesmo quando a tela foi aberta direto por deep link.
   *
   * Mesmo cuidado do detalhe da viagem: `router.canGoBack()` enxerga a árvore
   * inteira e poderia levar para outra aba.
   */
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

        // Sem regra de origem não há oferta a mostrar: itens criados à mão pelo
        // usuário não vêm do catálogo.
        if (item?.template_id) {
          void loadOffers(item);
        }
      } catch {
        if (active) setNotice('Sua conexão oscilou. Volte e abra o item de novo.');
      } finally {
        if (active) setIsLoading(false);
      }
    }

    /**
     * As sugestões são um extra: falhar aqui não pode derrubar a tela, porque
     * a descrição e a fonte oficial já bastam para o item ser útil.
     */
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

  async function toggleCompleted() {
    if (!requirement) return;

    const next = !requirement.completed;
    setIsSaving(true);
    setNotice(null);

    try {
      await tripRequirementsService.setCompleted(requirement.id, next);
      setRequirement({ ...requirement, completed: next });
    } catch {
      setNotice('Sua conexão oscilou. Toque de novo para salvar.');
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
          <Text style={styles.emptyTitle}>Este item não está mais na sua checklist.</Text>
          <Button label="Voltar para a viagem" variant="ghost" onPress={goBack} />
        </View>
      </SafeAreaView>
    );
  }

  const tone = priorityColors[requirement.priority];
  const scope = describeRequirementScope(requirement, getCountryName);
  const sourceName = requirement.source_name;
  const sourceUrl = requirement.source_url;
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
            {PRIORITY_LABELS[requirement.priority]}
          </Text>
        </View>

        <Text style={styles.title}>{requirement.title}</Text>

        <View style={styles.context}>
          <Ionicons name={CATEGORY_ICONS[requirement.category]} size={14} color={colors.primary} />
          <Text style={styles.contextText}>{CATEGORY_LABELS[requirement.category]}</Text>
          <Text style={styles.contextSeparator}>·</Text>
          {scope.countryCode ? (
            <CountryFlag code={scope.countryCode} />
          ) : (
            <Text style={styles.contextIcon}>{scope.kind === 'trip' ? '🌍' : '🧭'}</Text>
          )}
          <Text style={styles.contextText} numberOfLines={1}>
            {scope.label}
          </Text>
        </View>

        {requirement.description ? (
          <View>
            <SectionLabel>O que verificar</SectionLabel>
            <View style={styles.card}>
              <Text style={styles.description}>{requirement.description}</Text>
            </View>
          </View>
        ) : null}

        {offers.length > 0 ? (
          <View>
            <SectionLabel>Onde contratar</SectionLabel>
            <View style={styles.offers}>
              {offers.map((offer) => (
                <OfferRow key={offer.id} offer={offer} />
              ))}
            </View>
            {hasAffiliate ? <Text style={styles.disclosure}>{AFFILIATE_DISCLOSURE}</Text> : null}
          </View>
        ) : null}

        {sourceName && sourceUrl ? (
          <View>
            <SectionLabel>Fonte oficial</SectionLabel>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={`Abrir a fonte oficial: ${sourceName}`}
              onPress={() => openLink(sourceUrl)}
              style={({ pressed }) => [styles.card, styles.source, pressed && styles.cardPressed]}>
              <Ionicons name="open-outline" size={16} color={colors.primary} />
              <Text style={styles.sourceText} numberOfLines={2}>
                {sourceName}
              </Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.reminder}>
          <Text style={styles.reminderText}>💡 {OFFICIAL_REMINDER}</Text>
        </View>

        {notice ? <Text style={styles.notice}>{notice}</Text> : null}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={requirement.completed ? 'Desmarcar item' : '✓ Marcar como verificado'}
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
        accessibilityLabel="Voltar"
        hitSlop={12}
        onPress={onBack}
        style={styles.back}>
        <Ionicons name="chevron-back" size={22} color={colors.text} />
      </Pressable>
      <Text style={styles.headerTitle}>Detalhes</Text>
    </View>
  );
}

/** Uma sugestão de onde resolver o requisito. */
function OfferRow({ offer }: { offer: RequirementOffer }) {
  // O ícone aceita duas formas: um nome do Ionicons ou um emoji. Testar contra
  // o mapa de glifos evita renderizar um quadrado vazio quando vier emoji.
  const glyph = offer.icon && offer.icon in Ionicons.glyphMap ? (offer.icon as IoniconName) : null;

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`Abrir ${offer.name}`}
      onPress={() => openLink(offer.url)}
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
 * Abre um link no navegador do sistema.
 *
 * Falha em silêncio de propósito: não conseguir abrir o navegador não muda o
 * que o item diz, e interromper a leitura com um aviso seria pior do que
 * simplesmente não abrir.
 */
async function openLink(url: string) {
  try {
    await WebBrowser.openBrowserAsync(url);
  } catch {
    // Sem ação: a tela continua legível e correta sem o link.
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
  description: { ...typography.body, color: colors.text },
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
    // Uma folga a mais embaixo: colado no limite da área segura o botão fica
    // sob a borda da tab bar flutuante do iOS.
    paddingBottom: spacing.xl,
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});

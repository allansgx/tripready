import { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { SectionLabel } from '@/components/ui/section-label';
import { pickTravelTips } from '@/features/trips/data/travel-tips';
import { t } from '@/i18n';
import { useReduceMotion } from '@/lib/animation';
import { colors, radius, shadow, spacing, typography } from '@/theme/tokens';

const TIP_COUNT = 5;
const AUTO_ADVANCE_MS = 6000;

/** As dicas da Home vazia. Informa e só: nada aqui é tocável. */
export function TravelTipsCarousel() {
  const { width } = useWindowDimensions();
  const reduceMotion = useReduceMotion();

  // `useState`, e não `useMemo`: o React pode recalcular um memo, e aqui isso
  // seria a dica trocando debaixo do dedo de quem lê.
  const [tips] = useState(() => pickTravelTips(TIP_COUNT));
  const [index, setIndex] = useState(0);
  const [autoAdvances, setAutoAdvances] = useState(true);

  const scrollRef = useRef<ScrollView>(null);

  const cardWidth = width - spacing.xl * 2;
  const step = cardWidth + spacing.md;

  // `setTimeout` reagendado, e não um `setInterval` que empurra a rolagem de
  // dentro de um atualizador de estado.
  useEffect(() => {
    if (reduceMotion || !autoAdvances || tips.length < 2) return;

    const timer = setTimeout(() => {
      const next = (index + 1) % tips.length;
      scrollRef.current?.scrollTo({ x: next * step, animated: true });
      setIndex(next);
    }, AUTO_ADVANCE_MS);

    return () => clearTimeout(timer);
  }, [autoAdvances, index, reduceMotion, step, tips.length]);

  function handleSettle(event: NativeSyntheticEvent<NativeScrollEvent>) {
    setIndex(Math.round(event.nativeEvent.contentOffset.x / step));
  }

  return (
    <View style={styles.container}>
      <View style={styles.label}>
        <SectionLabel>{t('trips.tips.sectionTitle')}</SectionLabel>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={step}
        snapToAlignment="start"
        contentContainerStyle={styles.track}
        // Quem tocou está no comando: o carrossel não volta a andar sozinho e
        // puxar o conteúdo sob o dedo.
        onScrollBeginDrag={() => setAutoAdvances(false)}
        onMomentumScrollEnd={handleSettle}>
        {tips.map((tip) => (
          <View key={tip.id} style={[styles.card, { width: cardWidth }]} accessible>
            <View style={styles.emojiTile}>
              <Text style={styles.emoji}>{tip.emoji}</Text>
            </View>
            <Text style={styles.text}>{t(tip.textKey)}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Os pontos são decoração: o leitor de tela já lê a dica inteira. */}
      <View
        style={styles.dots}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants">
        {tips.map((tip, position) => (
          <View key={tip.id} style={[styles.dot, position === index ? styles.dotActive : null]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Sai do padding da tela para a rolagem ir de borda a borda; o padding volta
  // no conteúdo da lista.
  container: {
    alignSelf: 'stretch',
    marginHorizontal: -spacing.xl,
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  label: {
    alignItems: 'center',
  },
  track: {
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    // Altura mínima, e não fixa: com a fonte do sistema ampliada o texto cresce
    // e precisa caber.
    minHeight: 88,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadow.card,
  },
  emojiTile: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 20,
  },
  text: {
    ...typography.caption,
    lineHeight: 20,
    color: colors.text,
    flex: 1,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.progressTrack,
  },
  dotActive: {
    width: 16,
    backgroundColor: colors.primary,
  },
});

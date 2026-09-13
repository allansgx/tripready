import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { LayoutAnimation, Pressable, StyleSheet, Text, View } from 'react-native';

import { ProgressBar } from '@/components/ui/progress-bar';
import { useReduceMotion } from '@/lib/animation';
import { colors, radius, spacing, typography } from '@/theme/tokens';

type AccordionSectionProps = {
  title: string;
  /** Ícone à esquerda, dentro do quadrado arredondado. */
  icon?: ReactNode;
  iconBackground?: string;
  /** Fração exibida à direita, com barra fina. Omitida quando não há o que contar. */
  progress?: { done: number; total: number };
  /** Texto à direita quando não há fração — "3 itens", por exemplo. */
  meta?: string;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
};

/**
 * Seção recolhível da checklist: cabeçalho sempre visível, conteúdo por baixo.
 *
 * A altura não é medida à mão: `LayoutAnimation` anima a mudança de layout que
 * a própria montagem do corpo provoca.
 */
export function AccordionSection({
  title,
  icon,
  iconBackground = colors.primarySoft,
  progress,
  meta,
  expanded,
  onToggle,
  children,
}: AccordionSectionProps) {
  const reduceMotion = useReduceMotion();

  const hasProgress = progress !== undefined && progress.total > 0;
  const percent = hasProgress ? Math.round((progress.done / progress.total) * 100) : 0;

  function toggle() {
    if (!reduceMotion) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    onToggle();
  }

  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={
          hasProgress ? `${title}, ${progress.done} de ${progress.total} verificados` : title
        }
        onPress={toggle}
        style={({ pressed }) => [styles.header, pressed && styles.headerPressed]}>
        {icon ? (
          <View style={[styles.icon, { backgroundColor: iconBackground }]}>{icon}</View>
        ) : null}

        <View style={styles.texts}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>

          <View style={styles.meta}>
            {hasProgress ? (
              <>
                <View style={styles.bar}>
                  <ProgressBar percent={percent} height={5} />
                </View>
                <Text style={styles.count}>{`${progress.done}/${progress.total}`}</Text>
              </>
            ) : meta ? (
              <Text style={styles.count}>{meta}</Text>
            ) : null}
          </View>
        </View>

        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.textSecondary}
        />
      </Pressable>

      {expanded ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  headerPressed: {
    backgroundColor: colors.background,
  },
  icon: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: {
    flex: 1,
    gap: spacing.sm,
  },
  title: {
    ...typography.body,
    color: colors.text,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  bar: {
    flex: 1,
  },
  count: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  body: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.divider,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
});

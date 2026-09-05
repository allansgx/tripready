import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme/tokens';

type ListRowProps = {
  label: string;
  description?: string;
  /** Ícone à esquerda, dentro do quadrado arredondado. */
  icon?: ReactNode;
  /** Cor de fundo do quadrado do ícone. */
  iconBackground?: string;
  /** Acessório à direita (badge, switch...). Padrão: chevron quando há onPress. */
  right?: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  tone?: 'default' | 'primary';
};

/** Linha padrão dos cartões: ícone + rótulo + acessório à direita. */
export function ListRow({
  label,
  description,
  icon,
  iconBackground = colors.primarySoft,
  right,
  onPress,
  disabled,
  loading,
  tone = 'default',
}: ListRowProps) {
  const interactive = Boolean(onPress) && !disabled && !loading;

  const accessory = loading ? (
    <ActivityIndicator size="small" color={colors.primary} />
  ) : right !== undefined ? (
    right
  ) : onPress ? (
    <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
  ) : null;

  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={{ disabled: !interactive && Boolean(onPress) }}
      onPress={interactive ? onPress : undefined}
      style={({ pressed }) => [
        styles.row,
        pressed && interactive && styles.rowPressed,
        (disabled || loading) && styles.rowDisabled,
      ]}>
      {icon ? <View style={[styles.icon, { backgroundColor: iconBackground }]}>{icon}</View> : null}

      <View style={styles.texts}>
        <Text style={[styles.label, tone === 'primary' && styles.labelPrimary]} numberOfLines={1}>
          {label}
        </Text>
        {description ? (
          <Text style={styles.description} numberOfLines={1}>
            {description}
          </Text>
        ) : null}
      </View>

      {accessory}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 56,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  rowPressed: {
    backgroundColor: colors.background,
  },
  rowDisabled: {
    opacity: 0.5,
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
    gap: 2,
  },
  label: {
    ...typography.body,
    color: colors.text,
  },
  labelPrimary: {
    color: colors.primary,
    fontWeight: '600',
  },
  description: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});

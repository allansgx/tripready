import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme/tokens';

type ButtonVariant = 'primary' | 'ghost' | 'outline' | 'soft';
type ButtonTone = 'default' | 'danger';
type ButtonSize = 'md' | 'sm';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  /** `danger` pinta a ação destrutiva; o desenho continua sendo o da variante. */
  tone?: ButtonTone;
  /** `sm` é a pílula compacta usada ao lado de um título, como "Editar". */
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
};

const tones = {
  default: {
    solid: colors.primary,
    solidPressed: colors.primaryPressed,
    soft: colors.primarySoft,
    text: colors.primary,
  },
  danger: {
    solid: colors.danger,
    solidPressed: colors.dangerPressed,
    soft: colors.dangerSoft,
    text: colors.danger,
  },
} as const;

function resolveLabelColor(variant: ButtonVariant, tone: ButtonTone, muted: boolean) {
  if (muted) return colors.textSecondary;
  if (variant === 'primary') return colors.contrastText;
  if (variant === 'soft') return tones[tone].text;
  if (tone === 'danger') return colors.danger;
  return variant === 'outline' ? colors.text : colors.primary;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  tone = 'default',
  size = 'md',
  loading = false,
  disabled = false,
}: ButtonProps) {
  const blocked = disabled || loading;
  const palette = tones[tone];

  /**
   * Ação destrutiva bloqueada fica neutra, e não apenas translúcida: um
   * vermelho desbotado ainda lê como "quase ativo", e é justamente este o botão
   * que só deve parecer disponível depois da confirmação digitada.
   */
  const muted = variant === 'primary' && tone === 'danger' && blocked;

  const background =
    variant === 'primary'
      ? palette.solid
      : variant === 'outline'
        ? colors.surface
        : variant === 'soft'
          ? palette.soft
          : 'transparent';
  const pressedBackground =
    variant === 'primary'
      ? palette.solidPressed
      : variant === 'outline'
        ? colors.background
        : variant === 'soft'
          ? colors.border
          : palette.soft;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: blocked, busy: loading }}
      onPress={blocked ? undefined : onPress}
      style={({ pressed }) => [
        styles.base,
        size === 'sm' && styles.baseSmall,
        variant === 'outline' && styles.outline,
        { backgroundColor: pressed && !blocked ? pressedBackground : background },
        blocked && (muted ? styles.muted : styles.blocked),
      ]}>
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? colors.contrastText : palette.text}
        />
      ) : (
        <Text
          style={[
            size === 'sm' ? styles.labelSmall : styles.label,
            { color: resolveLabelColor(variant, tone, muted) },
          ]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  baseSmall: {
    minHeight: 36,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
  },
  outline: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  blocked: {
    opacity: 0.6,
  },
  muted: {
    backgroundColor: colors.progressTrack,
  },
  label: {
    ...typography.bodyStrong,
  },
  labelSmall: {
    ...typography.caption,
    fontWeight: '600',
  },
});

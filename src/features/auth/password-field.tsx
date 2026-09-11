import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View, type TextInputProps } from 'react-native';

import { TextField } from '@/components/ui/text-field';
import {
  checkPassword,
  getPasswordStrength,
  PASSWORD_RULES,
  PASSWORD_STRENGTH_LABELS,
  type PasswordStrength,
} from '@/features/auth/password';
import {
  colors,
  priorityColors,
  radius,
  spacing,
  tripMomentColors,
  typography,
} from '@/theme/tokens';

const STRENGTH_COLORS: Record<PasswordStrength, string> = {
  weak: priorityColors.required,
  medium: priorityColors.recommended,
  strong: tripMomentColors.upcoming.accent,
};

const FILLED_SEGMENTS: Record<PasswordStrength, number> = { weak: 1, medium: 2, strong: 3 };

const SEGMENTS = [0, 1, 2];

const MET_COLOR = tripMomentColors.upcoming.accent;

type PasswordFieldProps = TextInputProps & {
  label: string;
  value: string;
};

/** Campo de senha com força e requisitos, atualizados a cada tecla. */
export function PasswordField({ label, value, ...rest }: PasswordFieldProps) {
  const rules = checkPassword(value);
  const strength = getPasswordStrength(value);

  const tone = STRENGTH_COLORS[strength];
  const filled = FILLED_SEGMENTS[strength];
  const strengthLabel = PASSWORD_STRENGTH_LABELS[strength];

  return (
    <View style={styles.wrapper}>
      <TextField label={label} value={value} secureTextEntry {...rest} />

      {value.length > 0 ? (
        <View style={styles.feedback}>
          <View
            style={styles.strength}
            accessible
            accessibilityLabel={`Força da senha: ${strengthLabel}`}>
            <View style={styles.bar}>
              {SEGMENTS.map((index) => (
                <View
                  key={index}
                  style={[styles.segment, index < filled && { backgroundColor: tone }]}
                />
              ))}
            </View>

            <Text style={[styles.strengthLabel, { color: tone }]}>{strengthLabel}</Text>
          </View>

          <View style={styles.rules}>
            {PASSWORD_RULES.map((rule) => {
              const met = rules[rule.id];

              return (
                <View
                  key={rule.id}
                  style={styles.rule}
                  accessible
                  accessibilityLabel={`${rule.label}: ${met ? 'atendido' : 'pendente'}`}>
                  <Ionicons
                    name={met ? 'checkmark-circle' : 'ellipse-outline'}
                    size={16}
                    color={met ? MET_COLOR : colors.textSecondary}
                  />
                  <Text style={[styles.ruleLabel, met && styles.ruleLabelMet]}>{rule.label}</Text>
                </View>
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.md,
  },
  feedback: {
    gap: spacing.md,
  },
  strength: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  bar: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.progressTrack,
  },
  strengthLabel: {
    ...typography.caption,
    fontWeight: '600',
    minWidth: 44,
    textAlign: 'right',
  },
  rules: {
    gap: spacing.sm,
  },
  rule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  ruleLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  ruleLabelMet: {
    color: colors.text,
  },
});

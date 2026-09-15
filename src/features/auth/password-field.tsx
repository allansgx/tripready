import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View, type TextInputProps } from 'react-native';

import { TextField } from '@/components/ui/text-field';
import {
  checkPassword,
  getPasswordStrength,
  MIN_PASSWORD_LENGTH,
  PASSWORD_RULE_ORDER,
  type PasswordRule,
  type PasswordStrength,
} from '@/features/auth/password';
import { t, type MessageKey } from '@/i18n';
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

const RULE_LABEL_KEYS: Record<PasswordRule, MessageKey> = {
  length: 'auth.password.rule.length',
  uppercase: 'auth.password.rule.uppercase',
  lowercase: 'auth.password.rule.lowercase',
  digit: 'auth.password.rule.digit',
  symbol: 'auth.password.rule.symbol',
};

const STRENGTH_LABEL_KEYS: Record<PasswordStrength, MessageKey> = {
  weak: 'auth.password.strength.weak',
  medium: 'auth.password.strength.medium',
  strong: 'auth.password.strength.strong',
};

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
  const strengthLabel = t(STRENGTH_LABEL_KEYS[strength]);

  return (
    <View style={styles.wrapper}>
      <TextField label={label} value={value} secureTextEntry {...rest} />

      {value.length > 0 ? (
        <View style={styles.feedback}>
          <View
            style={styles.strength}
            accessible
            accessibilityLabel={t('a11y.password.strength', { strength: strengthLabel })}>
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
            {PASSWORD_RULE_ORDER.map((rule) => {
              const met = rules[rule];
              const ruleLabel = t(RULE_LABEL_KEYS[rule], { min: MIN_PASSWORD_LENGTH });
              const status = t(
                met ? 'auth.password.rule.status.met' : 'auth.password.rule.status.pending',
              );

              return (
                <View
                  key={rule}
                  style={styles.rule}
                  accessible
                  accessibilityLabel={t('a11y.password.rule', { rule: ruleLabel, status })}>
                  <Ionicons
                    name={met ? 'checkmark-circle' : 'ellipse-outline'}
                    size={16}
                    color={met ? MET_COLOR : colors.textSecondary}
                  />
                  <Text style={[styles.ruleLabel, met && styles.ruleLabelMet]}>{ruleLabel}</Text>
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

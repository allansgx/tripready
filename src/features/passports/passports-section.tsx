import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type AlertButton,
} from 'react-native';

import { Card } from '@/components/ui/card';
import { CountryFlag } from '@/components/ui/country-flag';
import { showDialog } from '@/components/ui/dialog';
import { SectionLabel } from '@/components/ui/section-label';
import { getCountryName } from '@/constants/countries';
import { useAuth } from '@/features/auth/auth-context';
import { toPassportMessage } from '@/features/passports/passport-messages';
import { usePassports } from '@/features/passports/passports-context';
import { getTripStatus, todayISO } from '@/features/trips/domain/trip-status';
import { t } from '@/i18n';
import { passportsService } from '@/services';
import { colors, radius, spacing, typography } from '@/theme/tokens';
import type { Passport } from '@/types/models';

/** Seção "Passaportes" do Perfil: lista, principal, adicionar e remover. */
export function PassportsSection() {
  const { passports, isLoading, setPrimary, removePassport, hasPendingRules } = usePassports();
  const { user } = useAuth();
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function run(passportId: string, action: () => Promise<void>) {
    setBusyId(passportId);
    try {
      await action();
    } catch (error) {
      showDialog(t('passports.dialog.cannotComplete'), toPassportMessage(error));
    } finally {
      setBusyId(null);
    }
  }

  /**
   * Pergunta com o que está em jogo: quantas viagens usam este passaporte e o
   * que acontece com elas. O aviso só aparece quando há viagem a citar.
   */
  async function confirmRemoval(passport: Passport) {
    const name = getCountryName(passport.country_code);
    setBusyId(passport.id);

    try {
      const trips = user
        ? await passportsService.listTripsUsingPassport(user.id, passport.country_code)
        : [];

      const today = todayISO();
      const pending = trips.filter((trip) => getTripStatus(trip, today) !== 'completed').length;

      const message =
        pending > 0
          ? t('passports.dialog.removeConfirm.withTrips', { count: pending })
          : trips.length > 0
            ? t('passports.dialog.removeConfirm.completedOnly')
            : t('passports.dialog.removeConfirm.message');

      showDialog(t('passports.dialog.removeConfirm.title', { name }), message, [
        { text: t('common.action.cancel'), style: 'cancel' },
        {
          text: t('passports.dialog.removeConfirm.confirm'),
          style: 'destructive',
          onPress: () => void remove(passport),
        },
      ]);
    } catch (error) {
      showDialog(t('passports.dialog.cannotComplete'), toPassportMessage(error));
    } finally {
      setBusyId(null);
    }
  }

  async function remove(passport: Passport) {
    setBusyId(passport.id);
    try {
      const promoted = await removePassport(passport.id);

      // A promoção automática não pode acontecer em silêncio: ninguém pediu
      // por ela, e ela decide o pré-selecionado da próxima viagem.
      if (promoted) {
        showDialog(
          t('passports.promoted.title'),
          t('passports.promoted.notice', { country: getCountryName(promoted) }),
        );
      }
    } catch (error) {
      showDialog(t('passports.dialog.cannotComplete'), toPassportMessage(error));
    } finally {
      setBusyId(null);
    }
  }

  function openActions(passport: Passport) {
    const name = getCountryName(passport.country_code);

    // O último passaporte não sai: o app precisa de um no perfil. Em vez de
    // oferecer a ação e falhar depois, a explicação já indica o caminho.
    if (passports.length === 1) {
      showDialog(name, t('passports.dialog.onlyPrimary.message'), [
        { text: t('passports.addPassport'), onPress: () => router.push('/passport-picker') },
        { text: t('common.action.close'), style: 'cancel' },
      ]);
      return;
    }

    const buttons: AlertButton[] = [
      ...(passport.is_primary
        ? []
        : [
            {
              text: t('passports.dialog.setPrimary'),
              onPress: () => void run(passport.id, () => setPrimary(passport.id)),
            },
          ]),
      {
        text: t('passports.dialog.remove'),
        style: 'destructive',
        onPress: () => void confirmRemoval(passport),
      },
      { text: t('common.action.cancel'), style: 'cancel' },
    ];

    // A consequência de promover aparece antes da escolha: é este passaporte
    // que vai decidir quais regras a checklist consegue aplicar.
    showDialog(
      name,
      hasPendingRules(passport.country_code)
        ? t('passports.dialog.pendingRules.message')
        : undefined,
      buttons,
    );
  }

  return (
    <View>
      <SectionLabel>{t('passports.section.title')}</SectionLabel>

      <Card>
        {isLoading && passports.length === 0 ? (
          <View style={styles.loading}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : null}

        {passports.map((passport) => (
          <PassportRow
            key={passport.id}
            passport={passport}
            pendingRules={hasPendingRules(passport.country_code)}
            busy={busyId === passport.id}
            onPress={() => openActions(passport)}
          />
        ))}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('passports.addPassport')}
          onPress={() => router.push('/passport-picker')}
          style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
          <View style={styles.addIcon}>
            <Ionicons name="add" size={18} color={colors.primary} />
          </View>
          <Text style={styles.addLabel}>{t('passports.addPassport')}</Text>
        </Pressable>
      </Card>
    </View>
  );
}

function PassportRow({
  passport,
  pendingRules,
  busy,
  onPress,
}: {
  passport: Passport;
  pendingRules: boolean;
  busy: boolean;
  onPress: () => void;
}) {
  const name = getCountryName(passport.country_code);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={passport.is_primary ? t('a11y.passport.primary', { name }) : name}
      accessibilityHint={t('a11y.passport.openOptions')}
      onPress={busy ? undefined : onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <CountryFlag code={passport.country_code} />

      <View style={styles.texts}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        {passport.is_primary ? (
          <Text style={styles.primaryTag}>{t('passports.section.primaryTag')}</Text>
        ) : null}
        {/* Estado, e não alerta: sem cor de aviso, para quem convive com ele
            todo dia continuar lendo em vez de ignorar. */}
        {pendingRules ? (
          <Text style={styles.pendingTag}>{t('passports.section.pendingRulesTag')}</Text>
        ) : null}
      </View>

      {busy ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <>
          {passport.is_primary ? (
            <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
          ) : null}
          <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 56,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
  },
  rowPressed: {
    backgroundColor: colors.background,
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...typography.body,
    color: colors.text,
  },
  primaryTag: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.primary,
  },
  pendingTag: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  addIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addLabel: {
    ...typography.body,
    fontWeight: '600',
    color: colors.primary,
    flex: 1,
  },
  loading: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
});

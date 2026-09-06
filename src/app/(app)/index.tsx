import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/card';
import { ListRow } from '@/components/ui/list-row';
import { SectionLabel } from '@/components/ui/section-label';
import { getCountryName } from '@/constants/countries';
import { useAuth } from '@/features/auth/auth-context';
import { usePassports } from '@/features/passports/passports-context';
import { tripsService } from '@/services';
import { colors, spacing, typography } from '@/theme/tokens';

/**
 * Tela provisória (sem design final): valida sessão e leitura no banco com RLS
 * ativo. O passaporte principal já aparece aqui porque é ele que vai definir os
 * requisitos das viagens.
 */
export default function HomeScreen() {
  const { user } = useAuth();
  const { passports, primary } = usePassports();
  const [tripsCount, setTripsCount] = useState<number | null>(null);
  const [status, setStatus] = useState('Carregando...');

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (!user) return;

      tripsService
        .listByUser(user.id)
        .then((trips) => {
          if (!active) return;
          setTripsCount(trips.length);
          setStatus('Conectado ao Supabase.');
        })
        .catch((error: unknown) => {
          if (active) setStatus(error instanceof Error ? error.message : 'Erro desconhecido.');
        });

      return () => {
        active = false;
      };
    }, [user]),
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic">
        <Text style={styles.title}>Início</Text>

        <View>
          <SectionLabel>Status</SectionLabel>
          <Card>
            <ListRow label="Banco de dados" description={status} />
            <ListRow
              label="Passaporte principal"
              description={
                primary ? getCountryName(primary.country_code) : 'nenhum passaporte principal'
              }
            />
            <ListRow label="Passaportes" description={`${passports.length} cadastrado(s)`} />
            <ListRow
              label="Viagens"
              description={tripsCount === null ? '—' : `${tripsCount} registro(s)`}
            />
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl - spacing.xs, gap: spacing.xl },
  title: { ...typography.screenTitle, color: colors.text },
});

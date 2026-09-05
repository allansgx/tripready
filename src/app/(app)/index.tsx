import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';

import { Card } from '@/components/ui/card';
import { ListRow } from '@/components/ui/list-row';
import { SectionLabel } from '@/components/ui/section-label';
import { useAuth } from '@/features/auth/auth-context';
import { passportsService, profilesService, tripsService } from '@/services';
import { colors, spacing, typography } from '@/theme/tokens';

/**
 * Tela provisória (sem design final): serve para validar sessão + leitura no
 * banco com RLS ativo.
 */
export default function HomeScreen() {
  const { user } = useAuth();
  const [status, setStatus] = useState('Carregando...');
  const [counts, setCounts] = useState({ trips: 0, passports: 0 });

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (!user) return;

      (async () => {
        try {
          const [profile, trips, passports] = await Promise.all([
            profilesService.getById(user.id),
            tripsService.listByUser(user.id),
            passportsService.listByUser(user.id),
          ]);
          if (!active) return;
          setCounts({ trips: trips.length, passports: passports.length });
          setStatus(profile ? 'Conectado ao Supabase, perfil encontrado.' : 'Perfil não encontrado.');
        } catch (error) {
          if (active) setStatus(error instanceof Error ? error.message : 'Erro desconhecido.');
        }
      })();

      return () => {
        active = false;
      };
    }, [user]),
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Início</Text>

        <View>
          <SectionLabel>Status</SectionLabel>
          <Card>
            <ListRow label="Banco de dados" description={status} />
            <ListRow label="Viagens" description={`${counts.trips} registro(s)`} />
            <ListRow label="Passaportes" description={`${counts.passports} registro(s)`} />
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

import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';

import { Card } from '@/components/ui/card';
import { ListRow } from '@/components/ui/list-row';
import { SectionLabel } from '@/components/ui/section-label';
import { useAuth } from '@/features/auth/auth-context';
import { tripsService } from '@/services';
import type { Trip } from '@/types/models';
import { colors, spacing, typography } from '@/theme/tokens';

/**
 * Tela provisória (sem design final): valida escrita/leitura/remoção em `trips`
 * passando pela camada de serviços e pelas policies de RLS.
 */
export default function TripsScreen() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setTrips(await tripsService.listByUser(user.id));
    } catch (error) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Falha ao carregar.');
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function createTestTrip() {
    if (!user) return;
    setBusy(true);
    try {
      await tripsService.create({ userId: user.id, name: `Viagem de teste ${trips.length + 1}` });
      await load();
    } catch (error) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Falha ao criar.');
    } finally {
      setBusy(false);
    }
  }

  async function removeTrip(id: string) {
    try {
      await tripsService.remove(id);
      await load();
    } catch (error) {
      Alert.alert('Erro', error instanceof Error ? error.message : 'Falha ao remover.');
    }
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Viagens</Text>

        <View>
          <SectionLabel>Minhas viagens</SectionLabel>
          <Card>
            {trips.length === 0 ? (
              <ListRow label="Nenhuma viagem" description="Crie uma viagem de teste abaixo." />
            ) : (
              trips.map((trip) => (
                <ListRow
                  key={trip.id}
                  label={trip.name}
                  description={trip.start_date ?? 'sem datas definidas'}
                  icon={<Ionicons name="briefcase" size={16} color={colors.primary} />}
                  right={<Ionicons name="trash-outline" size={18} color={colors.textSecondary} />}
                  onPress={() => removeTrip(trip.id)}
                />
              ))
            )}
            <ListRow
              label="Adicionar viagem de teste"
              tone="primary"
              icon={<Ionicons name="add" size={18} color={colors.primary} />}
              right={null}
              onPress={createTestTrip}
              loading={busy}
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

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/auth-context';
import { NextTripHero } from '@/features/trips/next-trip-hero';
import { tripSeasons } from '@/features/trips/requirement-matching';
import type { FieldPointer } from '@/features/trips/season-field';
import { SeasonalBackdrop } from '@/features/trips/seasonal-backdrop';
import {
  buildTripSummaries,
  splitTripSections,
  type TripSummary,
} from '@/features/trips/trip-summary';
import { tripsService } from '@/services';
import { colors, radius, spacing, typography } from '@/theme/tokens';

/**
 * Início: uma viagem só, a próxima, e o ambiente dela.
 *
 * A tela responde a duas perguntas — quanto falta para viajar e quão preparada
 * a viagem está — e oferece um único caminho adiante, o botão do próximo passo.
 * A lista completa continua sendo assunto da aba Viagens; aqui repetir viagens
 * seria repetir aquela tela.
 *
 * O clima da viagem não é enfeite atrás de um card: é o fundo da tela inteira, e
 * o conteúdo mora dentro dele.
 */
export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [nextTrip, setNextTrip] = useState<TripSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsRetry, setNeedsRetry] = useState(false);

  /**
   * Onde o dedo está, para as partículas reagirem.
   *
   * Mora aqui, e não no campo, porque quem enxerga o toque é a tela inteira. É
   * um `SharedValue` de propósito: escrever nele não re-renderiza nada, e quem
   * lê é o worklet da simulação, na UI thread.
   */
  const pointer = useSharedValue<FieldPointer>({ x: 0, y: 0, active: false });

  /**
   * Onde a tela começa dentro da janela.
   *
   * O toque chega em coordenadas da janela e as partículas vivem em coordenadas
   * da tela; sem descontar isto, o sopro acontece deslocado do dedo. É medido
   * quando a tela assenta, e de novo a cada mudança de tamanho (giro do
   * aparelho, tela dividida no Android).
   */
  const screenRef = useRef<View>(null);
  const origin = useRef({ x: 0, y: 0 });

  function measureOrigin() {
    screenRef.current?.measureInWindow((x, y) => {
      origin.current = { x, y };
    });
  }

  const load = useCallback(async () => {
    if (!user) return;
    setNeedsRetry(false);
    try {
      const rows = await tripsService.listWithRelations(user.id);
      // `buildTripSummaries` já ordena por relevância: a primeira viagem ativa
      // é a em andamento ou a que começa antes — exatamente a que a Home destaca.
      const { active } = splitTripSections(buildTripSummaries(rows));
      setNextTrip(active[0] ?? null);
    } catch {
      setNeedsRetry(true);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  /**
   * As estações saem dos destinos, não do calendário de quem olha: dezembro é
   * inverno em Viena e verão no Rio. É a mesma regra da tela de detalhe, e
   * alimenta o fundo, as partículas, a etiqueta e a dica.
   */
  const seasons = useMemo(
    () =>
      nextTrip
        ? tripSeasons(nextTrip.countryCodes, nextTrip.trip.start_date, nextTrip.trip.end_date)
        : [],
    [nextTrip],
  );

  /**
   * O toque é lido, nunca capturado.
   *
   * `onTouch*` borbulha por toda a subárvore sem passar pela negociação de
   * responder, então a tela sabe onde está o dedo sem disputar o toque com
   * ninguém: a rolagem, o botão "Verificar" e os gestos de navegação seguem
   * exatamente como seriam sem isto. É também por isso que a interação com as
   * partículas não precisa ser anunciada — ela não custa nada a quem a ignora.
   *
   * `pageX/pageY` e não `locationX/locationY`: como o evento borbulha, a origem
   * do `location` é a view tocada lá embaixo — um botão, um texto —, enquanto o
   * campo de partículas mede a tela inteira. O `page` é o único sistema comum
   * aos dois, e `origin` desconta onde a tela começa na janela: sem isso o
   * sopro sai deslocado da barra de status para baixo no Android.
   */
  function trackTouch(event: GestureResponderEvent) {
    const touch = event.nativeEvent.touches[0];
    if (!touch) return;
    pointer.value = {
      x: touch.pageX - origin.current.x,
      y: touch.pageY - origin.current.y,
      active: true,
    };
  }

  /**
   * O sopro acaba junto com o toque. `onTouchCancel` importa tanto quanto o
   * `onTouchEnd`: quando o sistema interrompe o toque — um gesto de voltar, uma
   * chamada chegando —, é o único aviso que chega, e sem ele o dedo ficaria
   * soprando um ponto da tela para sempre.
   */
  function releaseTouch() {
    pointer.value = { x: 0, y: 0, active: false };
  }

  // A viagem se distribui pela altura da tela; carregamento, falha e tela vazia
  // são um bloco só, centralizado.
  const showsTrip = !isLoading && !needsRetry && nextTrip !== null;

  return (
    <View
      ref={screenRef}
      style={styles.screen}
      onLayout={measureOrigin}
      onTouchStart={trackTouch}
      onTouchMove={trackTouch}
      onTouchEnd={releaseTouch}
      onTouchCancel={releaseTouch}>
      {/* O ambiente fica atrás de tudo e não recebe toque nenhum: é paisagem.
          A `key` carrega as estações: editar as datas para outra estação
          remonta o campo, e as partículas nascem com a forma nova. */}
      <SeasonalBackdrop
        key={nextTrip ? `${nextTrip.trip.id}:${seasons.join('-')}` : 'empty'}
        seasons={seasons}
        seed={nextTrip?.trip.id ?? ''}
        pointer={pointer}
      />

      <SafeAreaView style={styles.safe} edges={['top']}>
        {/* `flexGrow` faz o conteúdo ocupar a altura da rolagem mesmo sendo
            menor que ela: em tela grande a composição se distribui e não rola,
            em tela pequena (ou com a fonte do sistema ampliada) ela rola. Sem
            repique — arrastar não deve mover nada quando tudo já cabe. */}
        <ScrollView
          contentContainerStyle={[styles.content, showsTrip ? null : styles.centered]}
          contentInsetAdjustmentBehavior="automatic"
          bounces={false}
          alwaysBounceVertical={false}
          overScrollMode="never">
          {isLoading ? (
            <View style={styles.status}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.hint}>Buscando sua próxima viagem...</Text>
            </View>
          ) : needsRetry ? (
            <View style={styles.status}>
              <Text style={styles.hint}>Sua conexão oscilou. Toque para carregar de novo.</Text>
              <Button label="Carregar viagem" onPress={() => void load()} variant="ghost" />
            </View>
          ) : nextTrip ? (
            <NextTripHero
              summary={nextTrip}
              seasons={seasons}
              onOpen={() =>
                router.push({ pathname: '/trips/[id]', params: { id: nextTrip.trip.id } })
              }
            />
          ) : (
            <EmptyState onCreate={() => router.push('/trip-new')} />
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name="airplane" size={30} color={colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>Para onde você vai?</Text>
      <Text style={styles.emptyText}>
        Crie sua viagem e acompanhe aqui a contagem regressiva e tudo o que preparar antes de
        embarcar.
      </Text>
      <View style={styles.emptyAction}>
        <Button label="Criar viagem" onPress={onCreate} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // O cinza das demais telas é o ponto de partida; quem pinta o bege é o
  // ambiente sazonal, e só quando existe estação a mostrar.
  screen: { flex: 1, backgroundColor: colors.background },
  safe: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    // Um respiro a mais que o padrão das outras abas: aqui o cabeçalho nasce
    // direto sobre o ambiente, sem card, e encostado no topo ele fica apertado.
    paddingTop: spacing.xxl + spacing.md,
    // Folga generosa embaixo, como nas demais abas: a barra de abas do iOS é
    // translúcida e flutua sobre o conteúdo, então o último bloco precisa de
    // espaço para não terminar atrás dela.
    paddingBottom: spacing.xxl,
  },
  /** Sem viagem, carregando ou sem conexão: um bloco só, no meio da tela. */
  centered: {
    justifyContent: 'center',
  },
  status: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  hint: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  empty: {
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    ...typography.title,
    color: colors.text,
    textAlign: 'center',
  },
  emptyText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  emptyAction: {
    alignSelf: 'stretch',
    marginTop: spacing.md,
  },
});

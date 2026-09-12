export type TravelTip = {
  id: string;
  emoji: string;
  text: string;
};

/**
 * Dicas gerais de viagem, para a Home de quem ainda não tem viagem nenhuma.
 *
 * Orientam sem virar regra: nesta tela o destino é desconhecido, então nenhum
 * texto crava exigência, prazo ou consequência. "Alguns destinos exigem", nunca
 * "todo país pede"; "pode ajudar se", nunca "evita".
 */
export const travelTips: readonly TravelTip[] = [
  {
    id: 'passport-validity',
    emoji: '🛂',
    text: 'Confira a validade do seu passaporte. Alguns destinos exigem meses de validade além da data da viagem.',
  },
  {
    id: 'document-copies',
    emoji: '📄',
    text: 'Guarde uma cópia dos documentos importantes. Deixe-os acessíveis mesmo sem internet.',
  },
  {
    id: 'backup-payment',
    emoji: '💳',
    text: 'Leve uma segunda forma de pagamento. Um cartão reserva pode ajudar se o principal não funcionar.',
  },
  {
    id: 'offline-maps',
    emoji: '📶',
    text: 'Baixe mapas e reservas antes de sair. Assim você consegue acessá-los mesmo sem internet.',
  },
  {
    id: 'medication',
    emoji: '💊',
    text: 'Leve seus medicamentos de uso contínuo na bagagem de mão. Confira também se precisa levar receita ou documentação.',
  },
  {
    id: 'power-plug',
    emoji: '🔌',
    text: 'Veja qual é o padrão de tomada do destino. Um adaptador pequeno pode resolver a chegada.',
  },
  {
    id: 'carry-on-clothes',
    emoji: '🧳',
    text: 'Separe uma muda de roupa na bagagem de mão. Ajuda se a mala despachada demorar a aparecer.',
  },
  {
    id: 'travel-insurance',
    emoji: '🏥',
    text: 'Considere um seguro viagem. Alguns destinos pedem comprovação na entrada.',
  },
  {
    id: 'vaccination',
    emoji: '💉',
    text: 'Confira se o destino pede comprovante de vacinação. Algumas doses precisam ser tomadas com antecedência.',
  },
  {
    id: 'connectivity',
    emoji: '📱',
    text: 'Veja como vai se conectar no destino: roaming, chip local ou eSIM. Resolver antes evita correria na chegada.',
  },
  {
    id: 'airport-timing',
    emoji: '🕓',
    text: 'Confirme com a companhia aérea a antecedência recomendada para o embarque. Ela varia por aeroporto e tipo de voo.',
  },
  {
    id: 'local-cash',
    emoji: '💱',
    text: 'Pense em levar um pouco de dinheiro local. Nem todo lugar aceita cartão, principalmente em transporte e lojas pequenas.',
  },
  {
    id: 'emergency-contacts',
    emoji: '📆',
    text: 'Anote os contatos da hospedagem e da representação do seu país no destino. Fica fácil de achar se você precisar.',
  },
  {
    id: 'baggage-allowance',
    emoji: '🎒',
    text: 'Confira o limite de bagagem da sua passagem antes de fazer as malas. Cada companhia tem a sua regra.',
  },
  {
    id: 'weather',
    emoji: '☂️',
    text: 'Veja a previsão do tempo perto da data da viagem. Ela ajuda a decidir o que levar.',
  },
];

/**
 * Sorteia dicas distintas do catálogo.
 *
 * Fisher-Yates parcial: embaralha só as primeiras `count` posições de uma cópia
 * e corta ali. Garante ausência de repetição por construção — sortear até
 * juntar a quantidade pedida daria o mesmo resultado sem hora marcada para
 * terminar.
 *
 * `random` é parâmetro para o teste poder ser determinístico.
 */
export function pickTravelTips(
  count: number,
  tips: readonly TravelTip[] = travelTips,
  random: () => number = Math.random,
): TravelTip[] {
  const pool = [...tips];
  const size = Math.max(0, Math.min(count, pool.length));

  for (let i = 0; i < size; i += 1) {
    const j = i + Math.floor(random() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, size);
}

/**
 * As camadas de nuvem da abertura, **da mais distante para a mais próxima**.
 *
 * A ordem é a de desenho: quem vem depois cobre quem veio antes, e é isso que
 * põe o banco de baixo na frente dos que estão mais ao fundo. Invertida, a
 * camada distante apareceria por cima da próxima e a profundidade se desfaz.
 *
 * Nenhuma camada termina: abaixo do desenho, cada uma continua em uma faixa
 * cheia que desce até sair da tela. Uma camada que acaba no meio do céu mostra
 * onde acaba, e a borda reta denuncia o truque na hora — com piso, sem piso, ou
 * qualquer que seja o recorte. Escondida atrás da camada da frente, ela não tem
 * onde aparecer.
 *
 * Geometria e tempo moram juntos aqui de propósito: separar "onde a camada
 * fica" de "quando ela entra" espalharia três linhas de dados por dois arquivos
 * sem ninguém ganhar nada. Sendo um módulo puro, o teste também alcança.
 */

export type CloudDeck = {
  id: string;
  /**
   * Onde o desenho do banco começa, em fração da altura da tela. É o topo das
   * nuvens que conta: quanto mais alto, mais distante a camada parece.
   */
  top: number;
  /**
   * Tamanho relativo ao banco de base. Menor é mais longe — é só isso que dá
   * profundidade ao conjunto, já que todas as camadas são o mesmo desenho.
   */
  scale: number;
  opacity: number;
  /**
   * Variação horizontal, para as camadas não repetirem o mesmo recorte. No
   * banco de base desloca o enquadramento do desenho; nas cristas geradas é a
   * semente do sorteio dos raios.
   */
  x: number;
  at: number;
  duration: number;
  /**
   * De onde a camada entra, em pixels. O banco de base **sobe** para o lugar
   * antes de o avião sair; os de cima **descem** durante a subida, que é o que
   * diz que o avião está ganhando altura — sozinho, um avião transladando para
   * cima sobe parado.
   */
  from: number;
};

export const CLOUD_DECKS: readonly CloudDeck[] = [
  { id: 'far', top: 0.48, scale: 0.36, opacity: 0.58, x: 58, at: 520, duration: 480, from: -38 },
  { id: 'mid', top: 0.55, scale: 0.55, opacity: 0.82, x: -68, at: 360, duration: 520, from: -46 },
  { id: 'base', top: 0.58, scale: 1, opacity: 1, x: 0, at: 0, duration: 520, from: 28 },
];

/** O banco que já está na cena antes de o avião sair do lugar. */
export const BASE_DECK_ID = 'base';

/**
 * Altura do desenho do banco de base, em fração da altura da tela. É dela que
 * sai a escala de todas as camadas, e o valor é o que o banco já tinha antes de
 * existirem camadas — mexer aqui muda o tamanho das nuvens da abertura inteira.
 *
 * Com o `top` do banco de base em `1 - BASE_DECK_HEIGHT`, ele fica exatamente
 * onde sempre esteve.
 */
export const BASE_DECK_HEIGHT = 0.42;

/**
 * Quanto as camadas passam das bordas laterais da tela.
 *
 * Camada distante tem nuvem menor, não banco mais estreito — amarrar as duas
 * coisas à mesma escala foi o que deixava a lateral do banco distante aparecer
 * como um corte reto no meio da tela. A crista é gerada na largura da tela mais
 * esta folga dos dois lados, e o tamanho da nuvem passa a ser só o tamanho da
 * nuvem.
 */
export const DECK_SIDE_MARGIN = 90;

/**
 * Raio de referência das nuvens da frente do banco de base, em unidades do
 * desenho. É daqui que sai o tamanho das nuvens das cristas geradas, para elas
 * ficarem na mesma família do banco que já existia.
 */
export const BASE_PUFF = 44;

/**
 * Quanto a faixa cheia passa da borda de baixo da tela. Existe porque as
 * camadas entram deslocadas: sem a folga, uma camada que começa alguns pixels
 * acima do lugar deixaria a mesma borda reta aparecer no rodapé.
 */
export const DECK_OVERSHOOT = 80;

/**
 * A opacidade da faixa cheia, que é a do grupo de nuvens da frente no desenho.
 * As duas se encontram na borda de baixo do SVG: valores diferentes fariam uma
 * linha aparecer justamente onde a emenda deveria sumir.
 */
export const DECK_FILL_OPACITY = 0.95;

import { Fragment, type ReactNode } from 'react';
import { Text, type StyleProp, type TextStyle } from 'react-native';

/**
 * Divide um texto traduzido nos trechos entre `**`, para o negrito não
 * depender de HTML nem de quebrar a frase em várias chaves — a mesma
 * convenção que `legal-documents.ts` já usa para os documentos legais.
 */
export function renderInlineBold(text: string, boldStyle: StyleProp<TextStyle>): ReactNode {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <Text key={index} style={boldStyle}>
        {part.slice(2, -2)}
      </Text>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    ),
  );
}

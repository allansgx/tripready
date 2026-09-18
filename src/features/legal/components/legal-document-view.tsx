import { Fragment } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { LegalBlock, LegalDocument } from '@/features/legal/data/types';
import { colors, spacing, typography } from '@/theme/tokens';

/** Quebra o texto em trechos, isolando o que está entre `**`. */
function renderInline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <Text key={index} style={styles.strong}>
        {part.slice(2, -2)}
      </Text>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    ),
  );
}

function Block({ block }: { block: LegalBlock }) {
  switch (block.kind) {
    case 'heading':
      return <Text style={styles.heading}>{block.text}</Text>;
    case 'subheading':
      return <Text style={styles.subheading}>{renderInline(block.text)}</Text>;
    case 'paragraph':
      return <Text style={styles.paragraph}>{renderInline(block.text)}</Text>;
    case 'list':
      return (
        <View style={styles.list}>
          {block.items.map((item, index) => (
            <View key={index} style={styles.listItem}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.paragraph}>{renderInline(item)}</Text>
            </View>
          ))}
        </View>
      );
  }
}

/** Renderiza o corpo de um documento legal. O cabeçalho fica com a tela. */
export function LegalDocumentView({ document }: { document: LegalDocument }) {
  return (
    <View style={styles.body}>
      {document.blocks.map((block, index) => (
        <Block key={index} block={block} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.md },
  heading: {
    ...typography.bodyStrong,
    color: colors.text,
    marginTop: spacing.lg,
  },
  subheading: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.sm,
  },
  // Entrelinha maior que a do token: é o único texto longo do app, e `body`
  // é calibrado para rótulos de uma linha.
  paragraph: {
    ...typography.body,
    fontWeight: '400',
    lineHeight: 24,
    color: colors.text,
    flex: 1,
  },
  strong: {
    fontWeight: '700',
  },
  list: { gap: spacing.sm },
  listItem: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingLeft: spacing.xs,
  },
  bullet: {
    ...typography.body,
    fontWeight: '400',
    lineHeight: 24,
    color: colors.textSecondary,
  },
});

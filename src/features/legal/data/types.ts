/** Trechos entre `**` saem em negrito. */
export type LegalBlock =
  | { kind: 'heading'; text: string }
  | { kind: 'subheading'; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; items: readonly string[] };

export type LegalDocument = {
  title: string;
  version: string;
  effectiveDate: string;
  blocks: readonly LegalBlock[];
};

/**
 * Documento traduzido: `version` é a versão exibida, igual à do pt-BR;
 * `sourceVersion` registra contra qual versão do pt-BR a tradução foi feita.
 * `legal-version.test.ts` falha quando os dois divergem — é o que impede uma
 * mudança no pt-BR de ficar muda em `en`/`es`.
 */
export type TranslatedLegalDocument = LegalDocument & { sourceVersion: string };

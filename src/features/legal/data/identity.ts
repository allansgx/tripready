/**
 * Identidade do responsável. Os valores entre chaves duplas ainda não foram
 * definidos, e nenhum pode ir para a loja com o marcador.
 *
 * Compartilhada pelos três idiomas — razão social, CNPJ, e-mail, domínio e
 * foro não mudam com o idioma da interface. O foro continua brasileiro mesmo
 * nas versões em inglês e espanhol dos termos.
 */
export const LEGAL_IDENTITY = {
  companyName: '{{RAZAO_SOCIAL}}',
  cnpj: '{{CNPJ}}',
  contactEmail: '{{EMAIL_CONTATO}}',
  website: '{{DOMINIO}}',
  jurisdiction: '{{FORO}}',
  effectiveDate: '{{DATA_VIGENCIA}}',
} as const;

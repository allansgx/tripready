import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  LEGAL_IDENTITY,
  privacyPolicy,
  termsOfUse,
} from '../src/features/legal/data/legal-documents.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'site');

const TAGLINE = 'Tudo o que você precisa antes de viajar, organizado em um só lugar.';

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Mesma convenção do app: trechos entre `**` viram negrito. */
function inline(text) {
  return escapeHtml(text).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}

function renderBlock(block) {
  switch (block.kind) {
    case 'heading':
      return `<h2>${inline(block.text)}</h2>`;
    case 'subheading':
      return `<h3>${inline(block.text)}</h3>`;
    case 'paragraph':
      return `<p>${inline(block.text)}</p>`;
    case 'list':
      return `<ul>\n${block.items.map((item) => `<li>${inline(item)}</li>`).join('\n')}\n</ul>`;
    default:
      throw new Error(`Bloco desconhecido: ${JSON.stringify(block)}`);
  }
}

const STYLES = `
:root {
  color-scheme: light;
  --bg: #f5f5f7;
  --surface: #ffffff;
  --text: #16161a;
  --muted: #8a8a8f;
  --primary: #6c4ee3;
  --border: #ececef;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  padding: 0 20px 64px;
  background: var(--bg);
  color: var(--text);
  font: 16px/1.6 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}
.wrap { max-width: 720px; margin: 0 auto; }
header { padding: 32px 0 8px; }
header a { color: var(--primary); text-decoration: none; font-weight: 600; font-size: 14px; }
main {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 32px;
}
h1 { font-size: 28px; line-height: 1.2; margin: 0 0 4px; }
h2 { font-size: 18px; margin: 32px 0 0; }
h3 { font-size: 16px; margin: 24px 0 0; }
p, ul { margin: 12px 0 0; }
ul { padding-left: 20px; }
li { margin-top: 8px; }
a { color: var(--primary); }
.meta { color: var(--muted); font-size: 14px; margin: 0 0 24px; }
.footer { color: var(--muted); font-size: 14px; margin-top: 40px; }
.links { list-style: none; padding: 0; }
.links li { margin-top: 12px; font-size: 18px; font-weight: 600; }
@media (prefers-color-scheme: dark) {
  :root {
    color-scheme: dark;
    --bg: #121214;
    --surface: #1c1c1f;
    --text: #f2f2f4;
    --muted: #9a9aa0;
    --border: #2a2a2f;
  }
}
`.trim();

function page({ title, heading, meta, body, showBack = true }) {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>${STYLES}</style>
</head>
<body>
<div class="wrap">
<header>${showBack ? '<a href="/">← TripReady</a>' : ''}</header>
<main>
<h1>${escapeHtml(heading)}</h1>
${meta ? `<p class="meta">${escapeHtml(meta)}</p>` : ''}
${body}
</main>
</div>
</body>
</html>
`;
}

function documentPage(doc, fileName) {
  const meta = `Versão ${doc.version} · em vigor desde ${doc.effectiveDate}`;
  const body = [
    doc.blocks.map(renderBlock).join('\n'),
    `<p class="footer">Versão ${doc.version} — ${escapeHtml(doc.effectiveDate)}</p>`,
  ].join('\n');

  return [fileName, page({ title: `${doc.title} · TripReady`, heading: doc.title, meta, body })];
}

const email = escapeHtml(LEGAL_IDENTITY.contactEmail);

const pages = [
  [
    'index.html',
    page({
      title: 'TripReady',
      heading: 'TripReady',
      meta: TAGLINE,
      showBack: false,
      body: `<ul class="links">
<li><a href="/privacidade.html">Política de Privacidade</a></li>
<li><a href="/termos.html">Termos de Uso</a></li>
<li><a href="/suporte.html">Suporte</a></li>
<li><a href="/exclusao-de-conta.html">Excluir minha conta</a></li>
</ul>`,
    }),
  ],
  documentPage(privacyPolicy, 'privacidade.html'),
  documentPage(termsOfUse, 'termos.html'),
  [
    'suporte.html',
    page({
      title: 'Suporte · TripReady',
      heading: 'Suporte',
      body: `<p>${escapeHtml(TAGLINE)}</p>
<p>Para dúvidas, problemas ou pedidos relacionados aos seus dados, escreva para
<a href="mailto:${email}">${email}</a>. Respondemos no mesmo endereço.</p>
<h2>Excluir sua conta</h2>
<p>A exclusão é permanente e você mesmo faz, pelo aplicativo. O passo a passo, e
como pedir caso não tenha mais o aplicativo instalado, estão em
<a href="/exclusao-de-conta.html">Excluir minha conta</a>.</p>
<h2>Documentos</h2>
<ul>
<li><a href="/privacidade.html">Política de Privacidade</a></li>
<li><a href="/termos.html">Termos de Uso</a></li>
</ul>`,
    }),
  ],
  [
    'exclusao-de-conta.html',
    page({
      title: 'Excluir minha conta · TripReady',
      heading: 'Excluir minha conta',
      body: `<p>Você pode apagar a sua conta do TripReady e todos os dados ligados a ela.
A exclusão é <strong>permanente e irreversível</strong>.</p>
<h2>Pelo aplicativo</h2>
<p>É o caminho mais rápido, e não depende de ninguém:</p>
<ul>
<li>abra o TripReady e vá em <strong>Perfil</strong>;</li>
<li>toque em <strong>Excluir conta</strong>, no fim da tela;</li>
<li>digite a palavra de confirmação e conclua.</li>
</ul>
<p>A conta é apagada na hora.</p>
<h2>Sem o aplicativo</h2>
<p>Se você já desinstalou ou não consegue entrar, escreva para
<a href="mailto:${email}">${email}</a> pedindo a exclusão, a partir do endereço de
e-mail da conta. Confirmamos que o pedido parte do titular e concluímos a
exclusão.</p>
<h2>O que é apagado</h2>
<ul>
<li>a conta e os dados de login;</li>
<li>o perfil;</li>
<li>os passaportes cadastrados;</li>
<li>as viagens, com destinos e datas;</li>
<li>as checklists e os itens marcados.</li>
</ul>
<h2>O que fica guardado</h2>
<p><strong>Nada.</strong> Não mantemos cópia de segurança de onde esses dados
possam ser recuperados depois, então não há prazo de retenção a cumprir: a
exclusão é definitiva no momento em que acontece.</p>
<p>Detalhes sobre o tratamento dos seus dados estão na
<a href="/privacidade.html">Política de Privacidade</a>.</p>`,
    }),
  ],
];

mkdirSync(outDir, { recursive: true });
for (const [fileName, html] of pages) {
  writeFileSync(join(outDir, fileName), html, 'utf8');
}

const pending = Object.entries(LEGAL_IDENTITY).filter(([, value]) => value.includes('{{'));

console.log(`Geradas ${pages.length} páginas em site/`);

if (pending.length > 0) {
  console.log(
    `\nAinda com marcador (${pending.length}): ${pending.map(([key]) => key).join(', ')}` +
      '\nAs páginas foram geradas, mas nenhum domínio público deve apontar para elas antes' +
      '\nda substituição em src/features/legal/data/legal-documents.ts.',
  );
}

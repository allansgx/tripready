import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { LEGAL_IDENTITY } from '../src/features/legal/data/identity.ts';
import * as ptBR from '../src/features/legal/data/pt-BR.ts';
import * as en from '../src/features/legal/data/en.ts';
import * as es from '../src/features/legal/data/es.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'site');

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
.langs { color: var(--muted); font-size: 13px; margin: 8px 0 0; }
.langs a { margin-right: 12px; }
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

// -----------------------------------------------------------------------------
// Um perfil por idioma: nome de arquivo, `lang`, rótulos comuns às páginas e o
// texto das três páginas que hoje só existem como marcação neste script
// (index, suporte, exclusão de conta). `privacyPolicy`/`termsOfUse` vêm de
// `src/features/legal/data/<locale>.ts`, a fonte única também usada pelo app.
// -----------------------------------------------------------------------------
const LOCALES = {
  'pt-BR': {
    lang: 'pt-BR',
    dir: '',
    docs: ptBR,
    backLabel: '← TripReady',
    tagline: 'Tudo o que você precisa antes de viajar, organizado em um só lugar.',
    files: {
      home: 'index.html',
      privacy: 'privacidade.html',
      terms: 'termos.html',
      support: 'suporte.html',
      deleteAccount: 'exclusao-de-conta.html',
    },
    homeLinks: [
      ['privacy', 'Política de Privacidade'],
      ['terms', 'Termos de Uso'],
      ['support', 'Suporte'],
      ['deleteAccount', 'Excluir minha conta'],
    ],
    support: (email, deleteHref, links) => ({
      title: 'Suporte · TripReady',
      heading: 'Suporte',
      body: `<p>Tudo o que você precisa antes de viajar, organizado em um só lugar.</p>
<p>Para dúvidas, problemas ou pedidos relacionados aos seus dados, escreva para
<a href="mailto:${email}">${email}</a>. Respondemos no mesmo endereço.</p>
<h2>Excluir sua conta</h2>
<p>A exclusão é permanente e você mesmo faz, pelo aplicativo. O passo a passo, e
como pedir caso não tenha mais o aplicativo instalado, estão em
<a href="${deleteHref}">Excluir minha conta</a>.</p>
<h2>Documentos</h2>
<ul>
<li><a href="${links.privacy}">Política de Privacidade</a></li>
<li><a href="${links.terms}">Termos de Uso</a></li>
</ul>`,
    }),
    deleteAccount: (email) => ({
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
exclusão é definitiva no momento em que acontece.</p>`,
    }),
    meta: (doc) => `Versão ${doc.version} · em vigor desde ${doc.effectiveDate}`,
    footer: (doc) => `Versão ${doc.version} — ${doc.effectiveDate}`,
    privacyLinkText: (href) =>
      `<p>Detalhes sobre o tratamento dos seus dados estão na\n<a href="${href}">Política de Privacidade</a>.</p>`,
  },
  en: {
    lang: 'en',
    dir: 'en/',
    docs: en,
    backLabel: '← TripReady',
    tagline: 'Everything you need before you travel, organized in one place.',
    files: {
      home: 'index.html',
      privacy: 'privacy.html',
      terms: 'terms.html',
      support: 'support.html',
      deleteAccount: 'delete-account.html',
    },
    homeLinks: [
      ['privacy', 'Privacy Policy'],
      ['terms', 'Terms of Use'],
      ['support', 'Support'],
      ['deleteAccount', 'Delete my account'],
    ],
    support: (email, deleteHref, links) => ({
      title: 'Support · TripReady',
      heading: 'Support',
      body: `<p>Everything you need before you travel, organized in one place.</p>
<p>For questions, issues, or requests related to your data, write to
<a href="mailto:${email}">${email}</a>. We reply from the same address.</p>
<h2>Delete your account</h2>
<p>Deletion is permanent, and you do it yourself from the app. The step-by-step,
and how to request it if you no longer have the app installed, are at
<a href="${deleteHref}">Delete my account</a>.</p>
<h2>Documents</h2>
<ul>
<li><a href="${links.privacy}">Privacy Policy</a></li>
<li><a href="${links.terms}">Terms of Use</a></li>
</ul>`,
    }),
    deleteAccount: (email) => ({
      title: 'Delete my account · TripReady',
      heading: 'Delete my account',
      body: `<p>You can delete your TripReady account and all the data linked to it.
Deletion is <strong>permanent and irreversible</strong>.</p>
<h2>From the app</h2>
<p>This is the fastest way, and does not depend on anyone else:</p>
<ul>
<li>open TripReady and go to <strong>Profile</strong>;</li>
<li>tap <strong>Delete account</strong>, at the bottom of the screen;</li>
<li>type the confirmation word and finish.</li>
</ul>
<p>The account is deleted right away.</p>
<h2>Without the app</h2>
<p>If you have already uninstalled it or cannot sign in, write to
<a href="mailto:${email}">${email}</a> requesting deletion, from the account's
email address. We confirm the request comes from the account holder and
complete the deletion.</p>
<h2>What gets deleted</h2>
<ul>
<li>the account and sign-in data;</li>
<li>the profile;</li>
<li>the registered passports;</li>
<li>the trips, with destinations and dates;</li>
<li>the checklists and the items checked off.</li>
</ul>
<h2>What stays on record</h2>
<p><strong>Nothing.</strong> We do not keep a backup this data can be recovered
from afterward, so there is no retention period to observe: deletion is final
the moment it happens.</p>`,
    }),
    meta: (doc) => `Version ${doc.version} · in effect since ${doc.effectiveDate}`,
    footer: (doc) => `Version ${doc.version} — ${doc.effectiveDate}`,
    privacyLinkText: (href) =>
      `<p>Details about how your data is handled are in the\n<a href="${href}">Privacy Policy</a>.</p>`,
  },
  es: {
    lang: 'es',
    dir: 'es/',
    docs: es,
    backLabel: '← TripReady',
    tagline: 'Todo lo que necesitas antes de viajar, organizado en un solo lugar.',
    files: {
      home: 'index.html',
      privacy: 'privacidad.html',
      terms: 'terminos.html',
      support: 'soporte.html',
      deleteAccount: 'eliminar-cuenta.html',
    },
    homeLinks: [
      ['privacy', 'Política de Privacidad'],
      ['terms', 'Términos de Uso'],
      ['support', 'Soporte'],
      ['deleteAccount', 'Eliminar mi cuenta'],
    ],
    support: (email, deleteHref, links) => ({
      title: 'Soporte · TripReady',
      heading: 'Soporte',
      body: `<p>Todo lo que necesitas antes de viajar, organizado en un solo lugar.</p>
<p>Para dudas, problemas o solicitudes relacionadas con tus datos, escribe a
<a href="mailto:${email}">${email}</a>. Respondemos desde la misma dirección.</p>
<h2>Eliminar tu cuenta</h2>
<p>La eliminación es permanente y la haces tú mismo, desde la aplicación. El
paso a paso, y cómo solicitarla si ya no tienes la aplicación instalada, están
en <a href="${deleteHref}">Eliminar mi cuenta</a>.</p>
<h2>Documentos</h2>
<ul>
<li><a href="${links.privacy}">Política de Privacidad</a></li>
<li><a href="${links.terms}">Términos de Uso</a></li>
</ul>`,
    }),
    deleteAccount: (email) => ({
      title: 'Eliminar mi cuenta · TripReady',
      heading: 'Eliminar mi cuenta',
      body: `<p>Puedes eliminar tu cuenta de TripReady y todos los datos vinculados a ella.
La eliminación es <strong>permanente e irreversible</strong>.</p>
<h2>Desde la aplicación</h2>
<p>Es el camino más rápido, y no depende de nadie más:</p>
<ul>
<li>abre TripReady y ve a <strong>Perfil</strong>;</li>
<li>toca <strong>Eliminar cuenta</strong>, al final de la pantalla;</li>
<li>escribe la palabra de confirmación y termina.</li>
</ul>
<p>La cuenta se elimina de inmediato.</p>
<h2>Sin la aplicación</h2>
<p>Si ya la desinstalaste o no puedes ingresar, escribe a
<a href="mailto:${email}">${email}</a> pidiendo la eliminación, desde la
dirección de correo de la cuenta. Confirmamos que la solicitud proviene del
titular y completamos la eliminación.</p>
<h2>Qué se elimina</h2>
<ul>
<li>la cuenta y los datos de acceso;</li>
<li>el perfil;</li>
<li>los pasaportes registrados;</li>
<li>los viajes, con destinos y fechas;</li>
<li>las checklists y los ítems marcados.</li>
</ul>
<h2>Qué se conserva</h2>
<p><strong>Nada.</strong> No mantenemos copia de seguridad desde la cual estos
datos puedan recuperarse después, así que no hay plazo de retención que
cumplir: la eliminación es definitiva en el momento en que ocurre.</p>`,
    }),
    meta: (doc) => `Versión ${doc.version} · vigente desde ${doc.effectiveDate}`,
    footer: (doc) => `Versión ${doc.version} — ${doc.effectiveDate}`,
    privacyLinkText: (href) =>
      `<p>Los detalles sobre el tratamiento de tus datos están en la\n<a href="${href}">Política de Privacidad</a>.</p>`,
  },
};

const email = escapeHtml(LEGAL_IDENTITY.contactEmail);

/** URL absoluta de uma página, para os links entre idiomas e o hreflang. */
function urlFor(locale, key) {
  return `/${LOCALES[locale].dir}${LOCALES[locale].files[key]}`;
}

/** `<link rel="alternate">` para as três versões da mesma página, mais x-default na raiz. */
function alternateLinks(key) {
  const links = Object.entries(LOCALES).map(
    ([locale, config]) =>
      `<link rel="alternate" hreflang="${locale}" href="${urlFor(locale, key)}">`,
  );
  return [
    ...links,
    `<link rel="alternate" hreflang="x-default" href="${urlFor('pt-BR', key)}">`,
  ].join('\n');
}

/** Barra pequena com o link para as outras duas versões de idioma da mesma página. */
function langSwitcher(locale, key) {
  const others = Object.keys(LOCALES).filter((candidate) => candidate !== locale);
  const items = others
    .map((candidate) => `<a href="${urlFor(candidate, key)}">${candidate}</a>`)
    .join('');
  return `<p class="langs">${items}</p>`;
}

function page({ locale, key, title, heading, meta, body, showBack = true }) {
  const config = LOCALES[locale];
  return `<!doctype html>
<html lang="${config.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
${alternateLinks(key)}
<style>${STYLES}</style>
</head>
<body>
<div class="wrap">
<header>${showBack ? `<a href="${urlFor(locale, 'home')}">${config.backLabel}</a>` : ''}</header>
<main>
<h1>${escapeHtml(heading)}</h1>
${meta ? `<p class="meta">${escapeHtml(meta)}</p>` : ''}
${body}
</main>
${langSwitcher(locale, key)}
</div>
</body>
</html>
`;
}

function documentPage(locale, key, doc) {
  const config = LOCALES[locale];
  const body = [
    doc.blocks.map(renderBlock).join('\n'),
    `<p class="footer">${escapeHtml(config.footer(doc))}</p>`,
  ].join('\n');

  return page({
    locale,
    key,
    title: `${doc.title} · TripReady`,
    heading: doc.title,
    meta: config.meta(doc),
    body,
  });
}

mkdirSync(outDir, { recursive: true });

const pages = [];

for (const [locale, config] of Object.entries(LOCALES)) {
  if (config.dir) mkdirSync(join(outDir, config.dir), { recursive: true });

  const homeBody = `<ul class="links">
${config.homeLinks.map(([key, label]) => `<li><a href="${urlFor(locale, key)}">${label}</a></li>`).join('\n')}
</ul>`;

  pages.push([
    `${config.dir}${config.files.home}`,
    page({
      locale,
      key: 'home',
      title: 'TripReady',
      heading: 'TripReady',
      meta: config.tagline,
      showBack: false,
      body: homeBody,
    }),
  ]);

  pages.push([
    `${config.dir}${config.files.privacy}`,
    documentPage(locale, 'privacy', config.docs.privacyPolicy),
  ]);
  pages.push([
    `${config.dir}${config.files.terms}`,
    documentPage(locale, 'terms', config.docs.termsOfUse),
  ]);

  const supportContent = config.support(email, urlFor(locale, 'deleteAccount'), {
    privacy: urlFor(locale, 'privacy'),
    terms: urlFor(locale, 'terms'),
  });
  pages.push([
    `${config.dir}${config.files.support}`,
    page({ locale, key: 'support', ...supportContent }),
  ]);

  const deleteContent = config.deleteAccount(email);
  const deleteBody = `${deleteContent.body}\n${config.privacyLinkText(urlFor(locale, 'privacy'))}`;
  pages.push([
    `${config.dir}${config.files.deleteAccount}`,
    page({ locale, key: 'deleteAccount', ...deleteContent, body: deleteBody }),
  ]);
}

for (const [fileName, html] of pages) {
  writeFileSync(join(outDir, fileName), html, 'utf8');
}

const pending = Object.entries(LEGAL_IDENTITY).filter(([, value]) => value.includes('{{'));

console.log(`Geradas ${pages.length} páginas em site/ (pt-BR, en/, es/)`);

if (pending.length > 0) {
  console.log(
    `\nAinda com marcador (${pending.length}): ${pending.map(([key]) => key).join(', ')}` +
      '\nAs páginas foram geradas, mas nenhum domínio público deve apontar para elas antes' +
      '\nda substituição em src/features/legal/data/identity.ts.',
  );
}

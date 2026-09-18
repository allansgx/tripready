/**
 * Tradução para inglês. Rascunho gerado a partir do texto canônico pt-BR
 * (`./pt-BR.ts`), sem valor jurídico até revisão humana — §15.2 do plano de
 * i18n. `sourceVersion` registra contra qual `version` do pt-BR esta tradução
 * foi feita; `legal-version.test.ts` falha quando divergem.
 */
// Caminho relativo, e não o alias `@/`: este módulo é carregado tanto pelo
// Metro (app) quanto pelo Node puro (`npm run site`), que não conhece alias.
import { LEGAL_IDENTITY } from './identity.ts';
import type { TranslatedLegalDocument } from './types.ts';

export const privacyPolicy: TranslatedLegalDocument = {
  title: 'Privacy Policy',
  version: '1.0',
  sourceVersion: '1.0',
  effectiveDate: LEGAL_IDENTITY.effectiveDate,
  blocks: [
    {
      kind: 'paragraph',
      text: 'TripReady helps you organize what you need to prepare before traveling. To build a checklist that makes sense for your trip, the app needs to know very little about you — and this policy explains exactly what, why, and what you can do about it.',
    },

    { kind: 'heading', text: '1. Who is responsible for your data' },
    {
      kind: 'paragraph',
      text: `TripReady is offered by **${LEGAL_IDENTITY.companyName}**, registered under CNPJ number ${LEGAL_IDENTITY.cnpj}, which acts as the controller of the personal data processed in the app.`,
    },
    {
      kind: 'paragraph',
      text: `For any privacy-related matter, including exercising your rights, the contact channel is **${LEGAL_IDENTITY.contactEmail}**.`,
    },

    { kind: 'heading', text: '2. What data TripReady processes' },
    { kind: 'subheading', text: 'Your account data' },
    {
      kind: 'list',
      items: [
        '**Display name**, used to personalize the app.',
        '**Email address**, which identifies your account.',
        '**Profile photo**, when you sign in with Google and it is made available. If you sign in with Apple, there is no photo and the app shows a default avatar.',
        '**Password**, only if you create the account with email and password. It is stored encrypted by the authentication service and is not readable by us.',
        'An **internal identifier** that links your information to your account.',
      ],
    },
    { kind: 'subheading', text: 'Data you enter to build the checklist' },
    {
      kind: 'list',
      items: [
        '**The passport country** you use to travel, and which one is your main passport when you register more than one.',
        '**Your trips**: the name you give each one, the dates, the countries and the cities chosen.',
        '**Your checklist**: the items generated for the trip, the items you create yourself, and which of them you have marked as checked.',
      ],
    },
    { kind: 'subheading', text: 'Use of partner recommendations' },
    {
      kind: 'paragraph',
      text: 'TripReady logs some events related to the use of app features, such as clicks on partner links, exclusively to measure the use of these recommendations and track the performance of affiliate links.',
    },
    {
      kind: 'paragraph',
      text: 'What is logged is the partner indicated, the recommendation you tapped, the trip from which it happened, and the moment of the tap. Nothing you filled in the checklist goes along with this record, and the partner does not receive any information about you.',
    },
    { kind: 'subheading', text: 'Data stored on your device' },
    {
      kind: 'paragraph',
      text: 'So you do not have to sign in again every time you open the app, TripReady keeps your session credentials on the device itself. They are not sent to anyone and disappear when you sign out.',
    },
    { kind: 'subheading', text: 'What TripReady does not collect' },
    {
      kind: 'paragraph',
      text: 'This is worth spelling out, because it is a product choice, not an oversight. The app **does not collect**:',
    },
    {
      kind: 'list',
      items: [
        'passport number;',
        'passport expiration date;',
        'photo or copy of the passport;',
        'biometric data;',
        'health information;',
        'religion;',
        'political opinion;',
        'sexual orientation;',
        'any other sensitive personal data;',
        'your location;',
        'advertising identifiers.',
      ],
    },
    {
      kind: 'paragraph',
      text: 'TripReady **does not track your behavior outside the app, does not use your data for behavioral advertising, and does not build advertising profiles.** Inside the app, the only usage record is the one described above, about partner recommendations. If this ever changes, this policy will be updated **before** the change goes live.',
    },
    {
      kind: 'paragraph',
      text: 'About the passport country: it indicates which document you use to travel and is what lets us know which entry rules apply to you. It is treated as common personal data.',
    },

    { kind: 'heading', text: '3. How TripReady obtains this data' },
    {
      kind: 'list',
      items: [
        "**When you sign in with Google or Apple.** Authentication happens in your device's browser or in the system's own screen, and TripReady never has access to your password for these services. We only receive your name, email address, and, in Google's case, your photo. If you choose to hide your email when signing in with Apple, we receive the relay address Apple creates for you.",
        '**When you create an account with email and password.** In this case we send a message to the address provided, with a confirmation link, to make sure the email is really yours. The account is activated when you confirm it.',
        '**When you use the app.** You are the one who chooses the passport country, creates trips, and checks off checklist items.',
        '**When the app builds your checklist.** The items are generated from your main passport, the destinations, and the trip period.',
      ],
    },

    { kind: 'heading', text: '4. What the data is used for' },
    {
      kind: 'list',
      items: [
        '**Email and password** — identify your account, allow sign-in, and recover access.',
        '**Name and photo** — personalize the app for you.',
        '**Passport country** — determine which entry rules apply to you at each destination.',
        '**Trips, dates and destinations** — build the right checklist and show what stage each trip is at.',
        "**Checklist items** — keep track of what has already been checked and calculate the trip's progress.",
        '**Session on the device** — keep you signed in between one opening and the next.',
      ],
    },
    {
      kind: 'paragraph',
      text: 'These uses are necessary to provide the service you requested when you created your account. **TripReady does not use your data for advertising, to build behavioral profiles, or for any purpose other than the ones described here.**',
    },

    { kind: 'heading', text: '5. How long the data is kept' },
    {
      kind: 'paragraph',
      text: 'While your account exists, your trips and your checklist remain available to you — including trips already completed, which stay in your history until you delete them.',
    },
    {
      kind: 'paragraph',
      text: 'When you delete your account, the data is **permanently deleted at the moment of deletion**. There is no backup from which it can be recovered afterward.',
    },
    {
      kind: 'paragraph',
      text: "The only exception is the count of clicks on partner recommendations: the record stops being linked to you and your trip, and remains only as a number added to that partner's total. From that point on, it does not identify anyone.",
    },
    {
      kind: 'paragraph',
      text: 'If you create an account and never confirm your email, the registration stays on record, with no trip data, until you complete it or request removal through the contact channel.',
    },
    {
      kind: 'paragraph',
      text: 'Technical operation and security logs kept by the infrastructure that hosts the service follow the policies of the provider described in section 7.',
    },

    { kind: 'heading', text: '6. Where the data is stored' },
    {
      kind: 'paragraph',
      text: 'The information in your account and your trips is kept on servers operated by **Supabase**, located in the **United States**. This means there is an international transfer of your personal data.',
    },
    {
      kind: 'paragraph',
      text: 'The company responsible for TripReady remains the controller of this information and is accountable for it, regardless of where it is stored.',
    },

    { kind: 'heading', text: '7. Who the data is shared with' },
    {
      kind: 'paragraph',
      text: '**TripReady does not sell your personal data and does not share it with commercial partners.**',
    },
    {
      kind: 'paragraph',
      text: 'There are only the following parties involved, each with a specific role:',
    },
    {
      kind: 'list',
      items: [
        "**Supabase** — stores the information and handles authentication, acting as a processor on TripReady's behalf. It is also the service that sends the sign-up confirmation and password reset messages.",
        "**Google** and **Apple** — only when you choose to sign in through them. In that case, the provider knows you authenticated with TripReady because you authorized it. When the app displays your Google photo, it is loaded directly from Google's servers.",
        "**App Store and Google Play** — distribute the app, under each store's policies.",
      ],
    },
    {
      kind: 'paragraph',
      text: 'We may also share information when required by law or by order of a competent authority, to the extent required.',
    },

    { kind: 'heading', text: '8. Links to other sites' },
    {
      kind: 'paragraph',
      text: 'Some checklist items include links, and they are of two kinds:',
    },
    {
      kind: 'list',
      items: [
        '**Official sources** — the page of the immigration authority or foreign ministry that sets the requirement.',
        '**Suggestions of where to resolve the item** — for example, travel insurance or eSIM providers.',
      ],
    },
    {
      kind: 'paragraph',
      text: 'Some of these suggestions are **affiliate links**, which means TripReady may receive a commission if you purchase through them, **at no additional cost to you**. This commission does not influence what the checklist says you need to check: the requirement comes from the official source, and the suggestion is only where to resolve it.',
    },
    {
      kind: 'paragraph',
      text: "In all cases, the link opens in your device's browser and **TripReady does not send any of your data to these sites**. What they see is what any visit to a page reveals, such as your IP address. From the moment you leave the app, each site's own privacy policy applies.",
    },
    {
      kind: 'paragraph',
      text: 'The count of how many people tapped each suggestion is done by TripReady itself, to know which recommendations are useful. It stays with us and is not sent to the partner.',
    },
    {
      kind: 'paragraph',
      text: 'If we ever start sending any of your information to a partner — for example, for a quote requested inside the app —, this policy will be updated beforehand.',
    },

    { kind: 'heading', text: '9. Security' },
    {
      kind: 'paragraph',
      text: 'TripReady treats the protection of your data as part of the product, not as an implementation detail:',
    },
    {
      kind: 'list',
      items: [
        'each person only accesses their own information, and this rule is enforced at the database level, not only on the screens;',
        "the app does not carry any key capable of accessing other people's data;",
        'authentication uses the secure flows offered by Google, Apple, and the authentication service, and your password never travels into the app;',
        'account deletion can only reach the account of the person who requested it.',
      ],
    },
    {
      kind: 'paragraph',
      text: 'No service can promise absolute security, but we maintain measures appropriate to the kind of information processed and review these measures as the product evolves.',
    },

    { kind: 'heading', text: '10. How to delete your account and your data' },
    { kind: 'paragraph', text: 'You can delete everything without having to talk to anyone:' },
    {
      kind: 'paragraph',
      text: '**Profile → Delete account.** The app asks you to type a confirmation word and, once you finish, permanently removes your profile, your passports, your trips, the destinations, and the checklists. The action is **irreversible** and leaves no copy.',
    },
    {
      kind: 'paragraph',
      text: 'You can also delete just one trip, from its own screen. In that case, the destinations and the checklist for that trip are deleted along with it, and the rest of your account stays as it is.',
    },

    { kind: 'heading', text: '11. Your rights' },
    {
      kind: 'paragraph',
      text: "Brazil's General Data Protection Law (LGPD) guarantees you, among others, the right to:",
    },
    {
      kind: 'list',
      items: [
        'confirm whether we process your data, and access it;',
        'correct incomplete, inaccurate or outdated data;',
        'request the anonymization, blocking or deletion of unnecessary data, or data processed in violation of the law;',
        'request the portability of your data;',
        'be informed about who we share your data with;',
        'withdraw consent, when the processing is based on it.',
      ],
    },
    {
      kind: 'paragraph',
      text: `**Deleting your account you can do on your own, right in the app**, as described in section 10. For any other request, write to **${LEGAL_IDENTITY.contactEmail}**: we confirm receipt, verify that the request comes from the account holder, and respond within the timeframe set by law.`,
    },

    { kind: 'heading', text: '12. Use by minors' },
    {
      kind: 'paragraph',
      text: 'TripReady is intended for people **16 years of age or older** and is not directed at children. We do not knowingly collect data from anyone below that age. If we identify a registration under these conditions, or if a guardian notifies us through the contact channel, the account and the associated data will be removed.',
    },

    { kind: 'heading', text: '13. Changes to this policy' },
    {
      kind: 'paragraph',
      text: `TripReady keeps evolving, and this policy evolves along with it. When there is a change, the date at the top of the document is updated, and the current version is always available at ${LEGAL_IDENTITY.website} and here, under **Profile → Legal → Privacy Policy**.`,
    },
    {
      kind: 'paragraph',
      text: 'Material changes to how we process your data will be communicated before they take effect.',
    },

    { kind: 'heading', text: '14. Talk to us' },
    {
      kind: 'paragraph',
      text: `Questions, requests related to your rights, or anything about privacy: **${LEGAL_IDENTITY.contactEmail}**.`,
    },
    {
      kind: 'paragraph',
      text: "You can also file a complaint with Brazil's National Data Protection Authority (ANPD).",
    },
  ],
};

export const termsOfUse: TranslatedLegalDocument = {
  title: 'Terms of Use',
  version: '1.0',
  sourceVersion: '1.0',
  effectiveDate: LEGAL_IDENTITY.effectiveDate,
  blocks: [
    {
      kind: 'paragraph',
      text: 'These terms explain what TripReady does, what it does not do, and what is expected from each side. By creating an account and using the app, you agree to what is stated here.',
    },

    { kind: 'heading', text: '1. What TripReady is' },
    {
      kind: 'paragraph',
      text: 'TripReady is a trip organization app. It gathers, in a checklist, what you need to check before traveling, based on the passport you registered, the destinations chosen, and the trip period — and shows, whenever available, the link to the official source of each requirement.',
    },
    {
      kind: 'paragraph',
      text: '**What TripReady is not**, and this is important to make clear:',
    },
    {
      kind: 'list',
      items: [
        'it is not a government authority, consulate, or immigration agency;',
        'it is not an airline, travel agency, or customs broker;',
        'it does not provide legal advice;',
        'it does not issue, apply for, or act as an intermediary for visas or documents;',
        '**it does not guarantee your entry into any country.**',
      ],
    },
    {
      kind: 'paragraph',
      text: 'The information in the app is **guidance to help you prepare**. The final word always belongs to the official source and the authority of the destination country.',
    },

    { kind: 'heading', text: '2. How the checklist works' },
    {
      kind: 'paragraph',
      text: "Your checklist items are built from a catalog of rules, cross-referencing the main passport you registered, the trip's countries, the period, and, in some cases, whether the destination belongs to a group of countries with common rules.",
    },
    { kind: 'paragraph', text: 'Each item has a priority:' },
    {
      kind: 'list',
      items: [
        '**Required** — counts toward whether the trip is ready;',
        '**Recommended** — contributes to your progress;',
        '**Informational** — shown for you to know, without affecting progress.',
      ],
    },
    { kind: 'paragraph', text: 'Two points worth understanding:' },
    {
      kind: 'list',
      items: [
        '**The checklist is a snapshot of the moment it was created.** If a rule changes afterward, the items already generated for your trip do not rewrite themselves.',
        '**You can create your own items**, which do not come from the catalog and are solely your responsibility.',
      ],
    },

    { kind: 'heading', text: '3. Your responsibility' },
    { kind: 'paragraph', text: 'By using TripReady, you agree to:' },
    {
      kind: 'list',
      items: [
        "**check the official requirements that apply to your trip** before traveling, using each country's official channels;",
        'keep accurate the data that feeds the checklist, especially **your main passport** — it is what determines which entry rules are applied;',
        'consider that there are personal circumstances the app does not know about that can completely change what is required of you: dual nationality, country of residence, previous visas or refusals, purpose and length of the trip, among others.',
      ],
    },
    {
      kind: 'paragraph',
      text: 'Marking all items as checked means that **you** have checked them. It is not an approval by TripReady, nor a guarantee that nothing else will be required.',
    },

    { kind: 'heading', text: '4. How current the information is' },
    {
      kind: 'paragraph',
      text: "The catalog's entry rules are recorded from official sources and keep the date they were verified. Even so, **immigration rules change without prior notice**, and there may be a gap between a change and the app's update.",
    },
    {
      kind: 'paragraph',
      text: 'TripReady does not promise that all content is updated in real time, and that is why it insists, on every item, that you confirm through official channels.',
    },

    { kind: 'heading', text: '5. Travel and immigration requirements' },
    {
      kind: 'paragraph',
      text: "The decision about your entry into a country always belongs to that country's immigration authority. Fully completing the checklist **does not create a right of entry** and does not prevent additional documents from being required at the border.",
    },
    {
      kind: 'paragraph',
      text: "The catalog's coverage also has limits: depending on the passport registered, the app may not yet have specific visa rules for every destination. When there is no visa item on your checklist, this **does not mean** the visa is waived — it means you need to check directly with the official source.",
    },

    { kind: 'heading', text: '6. Official sources' },
    {
      kind: 'paragraph',
      text: 'Whenever a requirement has a responsible authority, the app shows the link to the corresponding official page.',
    },
    {
      kind: 'paragraph',
      text: '**Should there be any divergence between what TripReady presents and what the official source states, the official source prevails.**',
    },

    { kind: 'heading', text: '7. Third-party links and services' },
    {
      kind: 'paragraph',
      text: "The app includes links to third-party sites, which open in your device's browser. These services are not operated by TripReady.",
    },
    {
      kind: 'paragraph',
      text: 'Purchasing, payment, coverage, support, cancellation, and any resulting obligation are a direct relationship between you and the company chosen, under its own terms. TripReady does not control the availability, content, or price of these sites.',
    },

    { kind: 'heading', text: '8. Commercial suggestions and affiliate links' },
    {
      kind: 'paragraph',
      text: 'Some checklist items include suggestions of where to resolve that requirement, such as travel insurance or eSIM. Some of these links are affiliate links: **TripReady may receive a commission if you purchase through them, at no additional cost to you.** This is how the app sustains itself, and the notice appears on the screen itself whenever there is a suggestion of this kind.',
    },
    { kind: 'paragraph', text: 'Three commitments about this:' },
    {
      kind: 'list',
      items: [
        '**The commission does not influence what the checklist requires of you.** The requirement comes from the official rule; the suggestion is only where to resolve it. One does not change the other.',
        "**Being among the suggestions is not a technical recommendation** nor a guarantee that that service meets your destination's requirements. Checking that remains part of your own verification.",
        '**No personal data of yours is sent to these partners.** The app only opens the link.',
      ],
    },

    { kind: 'heading', text: '9. Your account' },
    {
      kind: 'paragraph',
      text: 'To use TripReady you need to create an account, and by doing so you agree to:',
    },
    {
      kind: 'list',
      items: [
        'be **16 years of age or older**;',
        'provide truthful information;',
        'keep your access secure, including the Google or Apple account used to sign in and the device itself;',
        'use the account for yourself — it is personal.',
      ],
    },

    { kind: 'heading', text: '10. Limitation of liability' },
    {
      kind: 'paragraph',
      text: `TripReady is offered as a tool to support trip organization, not as a guarantee of outcome. To the maximum extent permitted by applicable law, **${LEGAL_IDENTITY.companyName} is not liable for**:`,
    },
    {
      kind: 'list',
      items: [
        'a prevented trip, denied boarding, or refused entry into any country;',
        'a visa denied, delayed, or required in a way different from what was presented;',
        'losses resulting from outdated, incomplete, or incorrect information in the catalog;',
        "services contracted with third parties through the app's links;",
        'temporary unavailability of the service.',
      ],
    },
    {
      kind: 'paragraph',
      text: 'Nothing in these terms removes rights that Brazilian consumer law grants you on a non-waivable basis.',
    },

    { kind: 'heading', text: '11. Account deletion' },
    {
      kind: 'paragraph',
      text: 'You can close your account at any time, under **Profile → Delete account**. Deletion is **permanent and irreversible**: the profile, passports, trips, destinations, and checklists are deleted, with no recovery copy.',
    },
    {
      kind: 'paragraph',
      text: 'We may also close or suspend an account that breaches these terms, in particular section 12, communicating the reason through the contact channel when possible.',
    },

    { kind: 'heading', text: '12. Acceptable use' },
    { kind: 'paragraph', text: 'By using TripReady, you agree not to:' },
    {
      kind: 'list',
      items: [
        'automatically extract, copy, or redistribute the content of the rules catalog, in whole or in part;',
        "present the app's information as if it were official information or issued by an authority;",
        "attempt to access other people's data or bypass the service's protections;",
        'reverse-engineer the app, except to the extent permitted by law;',
        'enter unlawful, offensive, or third-party content into free-text fields, such as trip names and items you create.',
      ],
    },

    { kind: 'heading', text: '13. Intellectual property' },
    {
      kind: 'paragraph',
      text: `The TripReady brand, the interface, the item texts, the catalog's organization, and the software belong to **${LEGAL_IDENTITY.companyName}**. The content of official sources belongs to whoever publishes it.`,
    },
    {
      kind: 'paragraph',
      text: 'What you create inside the app — the names of your trips and the items you add — remains yours. We only store this content in order to provide the service.',
    },

    { kind: 'heading', text: '14. Privacy' },
    {
      kind: 'paragraph',
      text: `The processing of your personal data is described in the **Privacy Policy**, available at ${LEGAL_IDENTITY.website} and here in the app, under **Profile → Legal → Privacy Policy**, which forms part of these terms.`,
    },

    { kind: 'heading', text: '15. Changes to these terms' },
    {
      kind: 'paragraph',
      text: `These terms may be updated to keep up with the app's evolution. When that happens, the date at the top is updated and the current version is always available at ${LEGAL_IDENTITY.website} and inside the app. Material changes will be communicated before they take effect, and continuing to use TripReady afterward means agreeing to the new version.`,
    },

    { kind: 'heading', text: '16. Governing law and venue' },
    {
      kind: 'paragraph',
      text: `These terms are governed by Brazilian law. The courts of the jurisdiction of **${LEGAL_IDENTITY.jurisdiction}** are elected to settle any disputes arising from them, without prejudice to the consumer's right to bring a claim in the courts of their own domicile.`,
    },

    { kind: 'heading', text: '17. Talk to us' },
    {
      kind: 'paragraph',
      text: `Questions, suggestions, or issues: **${LEGAL_IDENTITY.contactEmail}**.`,
    },
    {
      kind: 'paragraph',
      text: `Service offered by **${LEGAL_IDENTITY.companyName}**, CNPJ ${LEGAL_IDENTITY.cnpj}.`,
    },
  ],
};

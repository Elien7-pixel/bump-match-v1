// Single source of truth for the FAQ. The website renders this at /faq and the
// support page, and the app imports it for the in-app FAQ screen — so an answer
// only ever has to be corrected in one place.
//
// Helper module only: no Convex functions are registered here.

export interface FaqEntry {
  question: string;
  answer: string;
}

export interface FaqSection {
  title: string;
  entries: FaqEntry[];
}

export const FAQ_SECTIONS: FaqSection[] = [
  {
    title: "Getting started",
    entries: [
      {
        question: "How does Bump Match work?",
        answer:
          "Swipe through baby names one at a time: swipe right on names you like, left on the ones you do not, and up to make a name a favourite. Everything you like is saved to your Liked Names list.",
      },
      {
        question: "Do I need a partner to use it?",
        answer:
          "No. You can use every part of the app on your own. Connecting a partner simply adds matching on top.",
      },
      {
        question: "Does it cost anything?",
        answer: "No. Bump Match is free to use.",
      },
    ],
  },
  {
    title: "Partners and matches",
    entries: [
      {
        question: "How do I connect with my partner?",
        answer:
          "Open Partner from the menu and share your invite code or QR code. When they enter your code, your accounts are linked.",
      },
      {
        question: "What is a match?",
        answer:
          "A match happens when you and your partner both like the same name. Matched names are highlighted with a green badge in your Liked Names.",
      },
      {
        question: "Can my partner see the names I dislike?",
        answer:
          "No. Only the names you like are shared, and only with the partner you have linked to.",
      },
    ],
  },
  {
    title: "Names and filters",
    entries: [
      {
        question: "How do I change which languages I see?",
        answer:
          "Tap the language button at the top left of the main screen. Every language starts ticked — untick any you do not want and those names stop appearing. Tick All to bring them all back.",
      },
      {
        question: "I unticked a language but still see names from it",
        answer:
          "Make sure you tapped Done to close the picker, and note that names you already have in your deck stay until you swipe past them. If it keeps happening, please send us feedback from the menu.",
      },
      {
        question: "How do I filter by boy, girl, or neutral?",
        answer:
          "Use the Boy / Girl / Neutral / All toggle just under the language row on the main screen.",
      },
      {
        question: "Can I search for a meaning?",
        answer:
          "Yes. Use the search box on the main screen to look for a meaning, an origin, or a name. Searching for something like brave or light will find names that mean it, not just names that contain the word.",
      },
      {
        question: "A name is missing. Can I add it?",
        answer:
          "Yes, please do. Use Submit a name from the menu and we will review it before it goes into the catalogue for everyone.",
      },
      {
        question: "Can I undo a swipe?",
        answer: "Yes. Tap the undo arrow to bring back the name you just swiped.",
      },
    ],
  },
  {
    title: "Your account",
    entries: [
      {
        question: "Why do you ask for my due date?",
        answer:
          "It drives the pregnancy tracker on the main screen. We only ask for the month, because most people do not know the exact day and a wrong day makes the week count wrong. You can change or clear it in your profile at any time.",
      },
      {
        question: "How do I change my details?",
        answer:
          "Open Profile from the menu and tap Edit. You can update your name, due date, location, and cultural heritage there.",
      },
      {
        question: "How do I delete my account?",
        answer:
          "Open Settings in the app and tap Delete Account, or use the account deletion page on this site. Deleting removes your names and your partner link as well.",
      },
      {
        question: "How do I turn notifications off?",
        answer: "Open Settings in the app and turn notifications off there, or change it in your device settings.",
      },
    ],
  },
];

/** Flat list, for the in-app screen and anywhere a section split is unhelpful. */
export const FAQ_ENTRIES: FaqEntry[] = FAQ_SECTIONS.flatMap((s) => s.entries);

/** Escape text for HTML rendering on the marketing pages. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Section markup for the website, so /faq and /support cannot drift apart. */
export function faqSectionsHtml(): string {
  return FAQ_SECTIONS.map(
    (section) =>
      `<h2>${escapeHtml(section.title)}</h2>` +
      section.entries
        .map(
          (entry) =>
            `<p><strong>${escapeHtml(entry.question)}</strong></p>` +
            `<p>${escapeHtml(entry.answer)}</p>`,
        )
        .join(""),
  ).join("");
}

/**
 * Single source of truth for all editable event content.
 * Organizers: update facts here — no component changes needed.
 */

/**
 * Registration link. Set this to the real URL when registration opens,
 * e.g. "https://forms.gle/…" — every Register button on the site updates
 * automatically. While null, buttons show "Registration opening soon".
 */
export const REGISTRATION_URL: string | null = null;

export const EVENT = {
  name: "Suvidha International Hackathon",
  organizer: "Suvidha International Foundation",
  tagline:
    "A grand, fully virtual build-a-thon where the next generation of creators turns bold ideas into real projects.",
  dateLabel: "Date to be announced", // e.g. "August 15–17, 2026"
  format: "Fully virtual — join from anywhere",
  eligibility: "Open to middle & high schoolers — free to join!",
  contactEmail: "hello@suvidha.org", // placeholder — replace with real contact
} as const;

export type Host = {
  name: string;
  role: string;
  initials: string;
};

export const HOSTS: Host[] = [
  { name: "Arav Parikh", role: "Host & Organizer", initials: "AP" },
  { name: "Sathvika Nivasini", role: "Host & Organizer", initials: "SN" },
  { name: "Tanvi Rathore", role: "Host & Organizer", initials: "TR" },
];

export type PrizeTier = {
  numeral: string;
  place: string;
  /** Placeholder amounts — edit freely before launch. */
  amount: string;
  details: string;
};

export const PRIZES: PrizeTier[] = [
  {
    numeral: "I",
    place: "First Place",
    amount: "$250",
    details: "Claude subscription + credits for every team member",
  },
  {
    numeral: "II",
    place: "Second Place",
    amount: "$150",
    details: "Claude credits for every team member",
  },
  {
    numeral: "III",
    place: "Third Place",
    amount: "$100",
    details: "Claude credits for every team member",
  },
];

export const PRIZE_POOL_NOTE =
  "Up to $500 in combined prizes — Claude subscriptions & credits for the winning teams.";

export type Judge = {
  name: string;
  title: string;
  /** Path under /public, e.g. "/judges/jane-doe.jpg" */
  photo?: string;
};

/**
 * Add judges here as they are confirmed — the Judges section automatically
 * switches from its "to be announced" state to a card grid.
 */
export const JUDGES: Judge[] = [];

export type Faq = { question: string; answer: string };

export const FAQS: Faq[] = [
  {
    question: "Who can participate?",
    answer:
      "Any middle school or high school student, anywhere in the world. Whether you've shipped apps before or you've never written a line of code, you belong here.",
  },
  {
    question: "How much does it cost?",
    answer:
      "Nothing — the hackathon is completely free to join. No entry fees, no hidden costs, ever.",
  },
  {
    question: "Is it in-person or virtual?",
    answer:
      "Fully virtual. All you need is an internet connection — join from your bedroom, your school library, or anywhere in between.",
  },
  {
    question: "Do I need experience?",
    answer:
      "Not at all. This event is built to be beginner-friendly, and first-time hackers are especially welcome. Come curious; leave with something you built.",
  },
  {
    question: "Can I work in a team?",
    answer:
      "Yes! You can build solo or team up with friends. Team size details will be shared when registration opens.",
  },
  {
    question: "What are the prizes?",
    answer:
      "Winning teams receive Claude subscriptions and credits, with up to $500 in combined prizes across the podium.",
  },
  {
    question: "How is judging done?",
    answer:
      "A panel of judges (to be announced) will review every submission on creativity, impact, and execution. Full judging criteria will be published before the event begins.",
  },
];

export const NAV_LINKS = [
  { label: "About", href: "#about" },
  { label: "Prizes", href: "#prizes" },
  { label: "Judges", href: "#judges" },
  { label: "FAQ", href: "#faq" },
] as const;

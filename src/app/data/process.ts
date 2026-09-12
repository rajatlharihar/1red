/* ─── The 1Red process — single source of truth ────────────────────────────
 * The site previously carried TWO different, contradicting answers to
 * "how do you work?":
 *
 *   /services (OurProcess.tsx) — Discovery → Strategy → Design →
 *                                Production → Launch & Growth
 *   /studio   (Studio.tsx)     — Discover → Define → Design →
 *                                Deliver → Refine
 *
 * A visitor comparing the two pages got two different studios. This merges
 * them the way they were asked to be merged: the tighter, more memorable
 * naming from the /studio version, carrying the richer, client-facing
 * descriptions from the /services version. Both components now render from
 * this one array, so the answer can never drift apart again.
 *
 * `detail` is kept as an alias of `description` purely so Studio.tsx's
 * existing markup keeps working untouched — same string, one definition.
 * ────────────────────────────────────────────────────────────────────────── */

export interface ProcessStep {
  number: string;
  title: string;
  description: string;
  /** Alias of `description` — see note above. */
  detail: string;
}

const steps: Array<Omit<ProcessStep, 'detail'>> = [
  {
    number: '01',
    title: 'Discover',
    description: 'Understanding goals, audience, competitors, and the hidden opportunities that make great work possible.',
  },
  {
    number: '02',
    title: 'Define',
    description: 'Building positioning, content direction, and a creative roadmap that aligns teams and focuses effort.',
  },
  {
    number: '03',
    title: 'Design',
    description: 'Creating visual systems, interfaces, and brand assets that communicate clearly and feel premium.',
  },
  {
    number: '04',
    title: 'Deliver',
    description: 'Developing websites, animations, and digital experiences built for performance and longevity.',
  },
  {
    number: '05',
    title: 'Refine',
    description: 'Optimisation, analytics review, and continuous iteration so results compound over time.',
  },
];

export const process: ProcessStep[] = steps.map((s) => ({ ...s, detail: s.description }));

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
    description: 'We ask the awkward questions early: who buys, why, and what your competitors keep getting wrong.',
  },
  {
    number: '02',
    title: 'Define',
    description: 'One idea, written in one line, that the logo, the site and the ads all have to answer to.',
  },
  {
    number: '03',
    title: 'Design',
    description: 'Systems, screens and assets. Pretty is the minimum. Clear is the actual job.',
  },
  {
    number: '04',
    title: 'Deliver',
    description: 'Built fast, shipped properly, and tested on the cheap phone too, not just the founder’s.',
  },
  {
    number: '05',
    title: 'Refine',
    description: 'We watch the numbers after launch. Then we make it better. Then again.',
  },
];

export const process: ProcessStep[] = steps.map((s) => ({ ...s, detail: s.description }));

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
  /** Short label under the title (Deeksha's content audit, 2026-10-07). */
  tag: string;
  description: string;
  /** Alias of `description` — see note above. */
  detail: string;
}

const steps: Array<Omit<ProcessStep, 'detail'>> = [
  {
    number: '01',
    title: 'Discover',
    tag: 'Research and strategy',
    description: 'We start with the awkward questions: who buys, why they buy, and what your competitors keep getting wrong.',
  },
  {
    number: '02',
    title: 'Define',
    tag: 'Brand idea',
    description: 'We boil everything down to one idea, in one line. Your logo, website and campaign all work from it.',
  },
  {
    number: '03',
    title: 'Design',
    tag: 'Brand identity, web and motion',
    description: 'We design the logo, the website, the films and the socials. Pretty is the bare minimum. Clear is the job.',
  },
  {
    number: '04',
    title: 'Deliver',
    tag: 'Build and launch',
    description: 'We build it, test it on every screen and launch it properly. Including the cheap phone, not just the founder’s.',
  },
  {
    number: '05',
    title: 'Refine',
    tag: 'The follow through',
    description: 'Launch day is the start, not the finish. We watch what works, fix what doesn’t, and keep going. Unlike the agency that ghosted you after the launch party.',
  },
];

export const process: ProcessStep[] = steps.map((s) => ({ ...s, detail: s.description }));

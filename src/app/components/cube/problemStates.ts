/* ─── Section 2 copy ───────────────────────────────────────────────────────
 * Not rendered at the moment: the section was redesigned around the cube
 * assembly and the text goes back in once its layout is decided.
 *
 * The cube stopped being a portfolio device. It is now the argument for why
 * 1Red works the way it does: each state names a friction clients actually
 * recognise, then answers it.
 *
 * TONE: recognition, not superiority. The section used to open "We know what
 * usually goes wrong", which claims a vantage point over everyone else's
 * work. "Understand" says the same thing from beside the reader rather than
 * above them — these are frictions the studio has been inside too, not a
 * charge sheet against other people.
 *
 * LENGTH: each state is a problem and an answer, and nothing else. It
 * previously also carried a `context` paragraph elaborating the problem,
 * which meant three blocks of prose per state on a surface the reader is
 * scrolling through — the elaboration was restating the headline more
 * slowly. Say it once.
 *
 * CONTENT RULE, strictly applied: every "response" below is grounded in
 * something already true and documented in this repository — the four
 * principles in Studio.tsx, or the team roster itself. Nothing about
 * turnaround times, client counts, satisfaction rates or awards appears
 * here, because none of that exists to cite. Where a response leans on the
 * roster it is a verifiable *absence* (there is no account-manager role
 * among the four people listed), not an invented promise. Shortening the
 * copy did not loosen this — each line below still traces to the same
 * source it did when it was longer.
 * ────────────────────────────────────────────────────────────────────────── */

export interface ProblemState {
  n: string;
  /** Face label — the friction category. */
  category: string;
  /** The recognisable client experience. */
  problem: string;
  /** 1Red's answer. */
  response: string;
  /** Where that answer comes from — kept in code so it can be checked. */
  grounding: string;
}

export const PROBLEM_STATES: ProblemState[] = [
  {
    n: '01',
    category: 'Intent',
    problem: 'The pitch is bigger than what ships.',
    response: 'Every creative decision is grounded in a reason.',
    grounding: 'Principle: Strategy Before Style (Studio.tsx)',
  },
  {
    n: '02',
    category: 'Ownership',
    problem: 'Everybody touched it. Nobody owns it.',
    response: 'Four people. The ones who plan the work make it.',
    grounding: 'Team roster: 4 named members with hands-on craft roles (Studio.tsx)',
  },
  {
    n: '03',
    category: 'Distance',
    problem: 'Feedback becomes a telephone game.',
    response: 'No account layer between you and the work.',
    grounding: 'Team roster contains no account-management role — a verifiable absence',
  },
  {
    n: '04',
    category: 'Clarity',
    problem: 'Process keeps flattening the idea.',
    response: 'We strip away everything that isn’t the point.',
    grounding: 'Principle: Clarity Over Complexity (Studio.tsx)',
  },
  {
    n: '05',
    category: 'Longevity',
    problem: 'It looks dated a year in.',
    response: 'We build systems, not trends.',
    grounding: 'Principle: Build For Longevity (Studio.tsx)',
  },
];

/** The closing state — the argument resolved, then the invitation. */
export const RESOLUTION = {
  eyebrow: 'The difference',
  headline: 'Less friction.\nMore momentum.',
  body: 'A small studio, close to its own work.',
  cta: 'Start a project',
};

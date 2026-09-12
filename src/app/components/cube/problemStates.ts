/* ─── The problem engine — narrative + scroll maths ────────────────────────
 * The cube stopped being a portfolio device. It is now the argument for why
 * 1Red works the way it does: each state names a friction clients actually
 * recognise, then answers it.
 *
 * CONTENT RULE, strictly applied: every "response" below is grounded in
 * something already true and documented in this repository — the four
 * principles in Studio.tsx, or the team roster itself. Nothing about
 * turnaround times, client counts, satisfaction rates or awards appears
 * here, because none of that exists to cite. Where a response leans on the
 * roster it is a verifiable *absence* (there is no account-manager role
 * among the four people listed), not an invented promise.
 *
 * The tone is observational, never an attack on other studios: these are
 * industry frictions, described as frictions.
 * ────────────────────────────────────────────────────────────────────────── */

export interface ProblemState {
  n: string;
  /** Face label — the friction category. */
  category: string;
  /** The recognisable client experience. */
  problem: string;
  /** What tends to happen, said plainly. */
  context: string;
  /** 1Red's answer. */
  response: string;
  /** Where that answer comes from — kept in code so it can be checked. */
  grounding: string;
}

export const PROBLEM_STATES: ProblemState[] = [
  {
    n: '01',
    category: 'Intent',
    problem: 'The pitch is bigger than the thing that ships.',
    context: 'Work gets sold on how it looks in a deck, then loses its reason somewhere between approval and build.',
    response: 'Aesthetics without intent is decoration. Every creative decision is grounded in a reason.',
    grounding: 'Principle: Strategy Before Style (Studio.tsx, verbatim)',
  },
  {
    n: '02',
    category: 'Ownership',
    problem: 'Everybody touched it. Nobody owns it.',
    context: 'A project moves between departments and vendors until the person accountable for the outcome is hard to name.',
    response: 'Four people. The ones who plan the work are the ones who make it.',
    grounding: 'Team roster: 4 named members with hands-on craft roles (Studio.tsx)',
  },
  {
    n: '03',
    category: 'Distance',
    problem: 'Feedback turns into a telephone game.',
    context: 'What you said travels through enough hands that the version which gets built is a translation of a translation.',
    response: 'There is no account layer between you and the people doing the work.',
    grounding: 'Team roster contains no account-management role — a verifiable absence',
  },
  {
    n: '04',
    category: 'Clarity',
    problem: 'Process keeps flattening the idea.',
    context: 'Every extra stage rounds off another edge, until what ships is the safest possible version of what you wanted.',
    response: 'The best design removes confusion. We strip away the unnecessary until only what matters remains.',
    grounding: 'Principle: Clarity Over Complexity (Studio.tsx, verbatim)',
  },
  {
    n: '05',
    category: 'Longevity',
    problem: 'It looks dated a year after launch.',
    context: 'Work built around whatever was current ages at exactly the speed of the trend it borrowed.',
    response: 'We don’t chase trends. We build systems that stay relevant long after launch.',
    grounding: 'Principle: Build For Longevity (Studio.tsx, verbatim)',
  },
];

/** The closing state — the argument resolved, then the invitation. */
export const RESOLUTION = {
  eyebrow: 'The difference',
  headline: 'Less friction.\nMore momentum.',
  body: 'A small studio, close to its own work — so the thinking and the making never drift apart.',
  cta: 'Start a project',
};

export const STATE_COUNT = PROBLEM_STATES.length + 1; // problems + resolution

/* ── Scroll maths — same pinned pattern used across this codebase ────────*/
const DWELL_VH = 38;
const SEGMENT_VH = 60;
export const CUBE_TOTAL_VH = DWELL_VH * 2 + SEGMENT_VH * (STATE_COUNT - 1);
const DWELL_FRAC = DWELL_VH / CUBE_TOTAL_VH;
const SEG_FRAC = SEGMENT_VH / CUBE_TOTAL_VH;

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Raw 0–1 scroll → continuous state index (e.g. 2.4 = 40% into state 03). */
export function stateValue(p: number): number {
  if (p <= DWELL_FRAC) return 0;
  return Math.min((p - DWELL_FRAC) / SEG_FRAC, STATE_COUNT - 1);
}

/** Scroll position that lands exactly on a given state — used for jumps. */
export function progressForState(i: number): number {
  if (i <= 0) return DWELL_FRAC * 0.5;
  return Math.min(1, DWELL_FRAC + i * SEG_FRAC);
}

/* ── The visual argument ─────────────────────────────────────────────────
 * The cube is eight blocks. While the frictions are being named it sits
 * broken apart — misaligned, gaps showing. As the argument resolves the
 * blocks close into one solid object and the red mark-square appears on its
 * face. The interaction states the point before the copy does. */
export interface CubeVisualState {
  /** 1 = fully broken apart, 0 = closed and square. */
  fragment: number;
  /** Radians about Y — one quarter turn per state, so a new face leads. */
  rotY: number;
  rotX: number;
  /** 0 → 1 as the mark resolves on the front face. */
  mark: number;
}

export function cubeVisual(v: number): CubeVisualState {
  const last = STATE_COUNT - 1;
  // Holds broken through the frictions, then closes over the final two
  // segments so the assembly *is* the resolution rather than decoration.
  const fragment = 1 - easeInOutCubic(clamp01((v - (last - 2)) / 2));
  return {
    fragment,
    rotY: v * (Math.PI / 2),
    rotX: Math.sin(v * 0.7) * 0.16,
    mark: easeInOutCubic(clamp01((v - (last - 1)) / 1)),
  };
}

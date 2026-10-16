import { StudioEntrance } from '../components/hero/StudioEntrance';
import { ProblemCube } from '../components/cube/ProblemCube';
import { WhatsNext } from '../components/WhatsNext';
import { RedFlags } from '../components/home/RedFlags';
import { TheDeal } from '../components/home/TheDeal';
import { ScrollCue } from '../components/ScrollCue';
import { ScrollTunePanel } from '../components/ScrollTunePanel';
import { BlockTransitions, type BlockStep } from '../components/home/BlockTransitions';
import { useReducedMotion } from 'motion/react';

/* One block transition only (Rajat, 2026-10-17): the red flags board hands
   over to the deal as white blocks reforming. The board itself still rises
   as a card over who-we-are, and the CTA follows the deal as before. */
// The deal is flat underneath: clipped out of sight while the blocks pop in
// at random over the board (the whole screen of its rise), then revealed as
// they clear at random. hold: false, so no block is pinned to its rising
// edge (that read as a band rising from the bottom).
const STEPS: BlockStep[] = [
  { el: () => document.querySelector('section[aria-label="The deal"]'), color: '#FFFFFF', hold: false, clip: true, rangeVh: 100 },
];

/* Homepage chapters:
 *   ENTER    — StudioEntrance: the door into Studio.glb
 *   THINK    — ProblemCube: the frictions, and how this studio answers them
 *   WHO      — inside ProblemCube now: the box falls, lands and rolls out under the paragraph
 *   (Receipts/FlashWork removed from home 2026-10-04; the work lives on /work and /case-studies)
 *   EMPATHISE — RedFlags: the self-audit, our thinking as proof
 *   TRUST    — TheDeal: being new, said out loud
 *   INVITE   — WhatsNext
 *
 * The cube used to sit here as a second portfolio device, playing project
 * videos on its faces with a paired project card. That duplicated the proof
 * section's job, so the videos and the card now live only in FlashWork /
 * the case studies, and the cube carries the argument instead. No project
 * assets were deleted — projects.json and the videos are still used by
 * FlashWork and /case-studies/:slug. */
export function HomePage() {
  const reduce = useReducedMotion() ?? false;
  return (
    // clip, not hidden: the tilting cards must not widen the page, and
    // `hidden` would break every sticky section inside.
    <div style={{ overflowX: 'clip' }}>
      <StudioEntrance />
      <ProblemCube />
      <RedFlags />
      <TheDeal />
      <WhatsNext />
      <ScrollCue />
      <ScrollTunePanel />
      <BlockTransitions steps={STEPS} off={reduce} />
    </div>
  );
}

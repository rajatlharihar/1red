import { StudioEntrance } from '../components/hero/StudioEntrance';
import { ProblemCube } from '../components/cube/ProblemCube';
import { WhatsNext } from '../components/WhatsNext';
import { RedFlags } from '../components/home/RedFlags';
import { TheDeal } from '../components/home/TheDeal';

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
  return (
    <>
      <StudioEntrance />
      <ProblemCube />
      <RedFlags />
      <TheDeal />
      <WhatsNext />
    </>
  );
}

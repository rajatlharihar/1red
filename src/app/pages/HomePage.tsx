import { StudioEntrance } from '../components/hero/StudioEntrance';
import { ProblemCube } from '../components/cube/ProblemCube';
import { FlashWork } from '../components/FlashWork';
import { WhatsNext } from '../components/WhatsNext';

/* Homepage chapters:
 *   ENTER    — StudioEntrance: the door into Studio.glb
 *   THINK    — ProblemCube: the frictions, and how this studio answers them
 *   PROVE    — FlashWork: the work itself
 *   INVITE   — WhatsNext
 *
 * The cube used to sit here as a second portfolio device, playing project
 * videos on its faces with a paired project card. That duplicated the proof
 * section's job, so the videos and the card now live only in FlashWork /
 * the case studies, and the cube carries the argument instead. No project
 * assets were deleted — projects.json and the videos are still used by
 * FlashWork and /work/:slug. */
export function HomePage() {
  return (
    <>
      <StudioEntrance />
      <ProblemCube />
      <FlashWork />
      <WhatsNext />
    </>
  );
}

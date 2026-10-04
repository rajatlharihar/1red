import { EvidenceBoard } from '../components/studio/EvidenceBoard';
import { TeamZoom } from '../components/studio/TeamZoom';
import { TeamTable } from '../components/studio/TeamTable';

/* /the-box (2026-10-04, Rajat): the process is an evidence board followed
   along its red thread (EvidenceBoard), whose last pin is the team polaroid;
   the camera dives into it and TeamZoom opens on that very frame, full
   bleed, then the card table. "What we cover" (ServicesGrid) and the 3D
   panels (ProcessSpace) are off this page; both files stay on disk. */
export function StudioPage() {
  return (
    <>
      <EvidenceBoard />
      <TeamZoom />
      <TeamTable />
    </>
  );
}

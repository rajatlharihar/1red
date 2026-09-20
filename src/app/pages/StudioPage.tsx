import { ProcessSpace } from '../components/studio/ProcessSpace';
import { TeamZoom } from '../components/studio/TeamZoom';
import { TeamTable } from '../components/studio/TeamTable';
import { ServicesGrid } from '../components/ServicesGrid';

/* /studio: the process in depth (S1), whose camera runs on into "What we
   cover" (S2, the same grid the Services page uses), then closes on the
   team film (S3), and ends on the team card and its long table (S4). The
   print version (StudioProcess.tsx) and the
   older editorial page (Studio.tsx) are on disk / in git history if any of
   it is wanted back. */
export function StudioPage() {
  return (
    <>
      <ProcessSpace arrival={(inert) => <ServicesGrid still inert={inert} />} />
      <TeamZoom />
      <TeamTable />
    </>
  );
}

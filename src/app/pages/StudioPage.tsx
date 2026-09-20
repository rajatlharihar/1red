import { ProcessSpace } from '../components/studio/ProcessSpace';
import { TeamZoom } from '../components/studio/TeamZoom';
import { ServicesGrid } from '../components/ServicesGrid';

/* /studio: the process in depth (S1), whose camera runs on into "What we
   cover" (S2, the same grid the Services page uses), then closes on the
   team film (S3). S4, the team card and the long table, mounts after it:
   see `STUDIO_AFTER_TEAM`. The print version (StudioProcess.tsx) and the
   older editorial page (Studio.tsx) are on disk / in git history if any of
   it is wanted back. */
export const STUDIO_AFTER_TEAM = 'studio-after-team';

export function StudioPage() {
  return (
    <>
      <ProcessSpace arrival={<ServicesGrid still />} />
      <TeamZoom />
      <div id={STUDIO_AFTER_TEAM} style={{ height: '20vh', background: '#FFFFFF' }} />
    </>
  );
}

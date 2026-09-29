/* ─── The Work showcase: every piece, one list ────────────────────────────
 * Seeded from the plates and films already in the repo (public/work/<slug>
 * from Rajat's Behance projects, public/videos). One entry per piece, in
 * the order the grid shows them under "All". `caseStudy` is set where the
 * piece belongs to a project with its own page; the tile then carries the
 * "Case study" tag and the lightbox links through.
 *
 * To add a piece: drop the file in public/, add an entry here. Films are
 * muted loops; `still` is the time (s) of the frame shown before playback.
 * ────────────────────────────────────────────────────────────────────────── */

export const WORK_FILTERS = ['Campaigns', 'Motion graphics', 'Animation', 'Graphic design', 'Video editing'] as const;
export type WorkFilter = (typeof WORK_FILTERS)[number];

export type WorkPiece = {
  id: string;
  title: string;
  client: string;
  category: WorkFilter;
  caseStudy?: string;
} & (
  | { kind: 'image'; src: string; focus?: string }
  | { kind: 'video'; mp4: string; webm?: string; still?: number; aspect: string }
);

export const WORKS: WorkPiece[] = [
  { id: 'apptile-launch', title: 'Launch stage', client: 'Apptile', category: 'Campaigns', caseStudy: 'apptile', kind: 'image', src: '/work/apptile/12.webp' },
  { id: 'yui-reservation-film', title: 'AI reservation film', client: 'Yui', category: 'Video editing', caseStudy: 'yui', kind: 'video', mp4: '/work/yui/v04.mp4', webm: '/work/yui/v04.webm', still: 2, aspect: '1920 / 1080' },
  { id: 'illus-characters', title: 'Character design', client: 'Illusdoodle', category: 'Graphic design', caseStudy: 'illusdoodle', kind: 'image', src: '/work/illusdoodle/06.webp' },
  { id: 'apptile-3d', title: 'The tile in 3D', client: 'Apptile', category: 'Animation', caseStudy: 'apptile', kind: 'video', mp4: '/work/apptile/v01.mp4', webm: '/work/apptile/v01.webm', still: 1.5, aspect: '1920 / 1080' },
  { id: 'terrabarn-socials', title: 'Social reels', client: 'Terrabarn', category: 'Campaigns', kind: 'video', mp4: '/videos/terrabarn-socials.mp4', still: 1, aspect: '1080 / 1350' },
  { id: 'yui-logo-grid', title: 'Logo in motion', client: 'Yui', category: 'Motion graphics', caseStudy: 'yui', kind: 'video', mp4: '/work/yui/v01.mp4', webm: '/work/yui/v01.webm', still: 1, aspect: '1920 / 1364' },
  { id: 'yui-patterns', title: 'Patterns, reimagined', client: 'Yui', category: 'Graphic design', caseStudy: 'yui', kind: 'image', src: '/work/yui/06.webp' },
  { id: 'team-film', title: 'The team, drawn', client: '1Red', category: 'Animation', kind: 'video', mp4: '/videos/Fg-01_3.mp4', still: 5, aspect: '1920 / 1080' },
  { id: 'apptile-think-bigger', title: 'Think bigger', client: 'Apptile', category: 'Campaigns', caseStudy: 'apptile', kind: 'image', src: '/work/apptile/01.webp' },
  { id: 'ground-logo', title: 'Logo animation', client: 'Ground', category: 'Motion graphics', kind: 'video', mp4: '/videos/ground-logo.mp4', still: 3, aspect: '1080 / 1080' },
  { id: 'apptile-type', title: 'Type system', client: 'Apptile', category: 'Graphic design', caseStudy: 'apptile', kind: 'image', src: '/work/apptile/06.webp' },
  { id: 'yui-beyond-the-mark', title: 'Beyond the mark', client: 'Yui', category: 'Video editing', caseStudy: 'yui', kind: 'video', mp4: '/work/yui/v03.mp4', webm: '/work/yui/v03.webm', still: 2, aspect: '1920 / 1000' },
  { id: 'yui-social', title: 'Made for the feed', client: 'Yui', category: 'Campaigns', caseStudy: 'yui', kind: 'image', src: '/work/yui/08.webp' },
  { id: 'apptile-colour', title: 'Colour in motion', client: 'Apptile', category: 'Motion graphics', caseStudy: 'apptile', kind: 'video', mp4: '/work/apptile/v02.mp4', webm: '/work/apptile/v02.webm', still: 1, aspect: '2800 / 1750' },
  { id: 'illus-stickers', title: 'Sticker collection', client: 'Illusdoodle', category: 'Graphic design', caseStudy: 'illusdoodle', kind: 'image', src: '/work/illusdoodle/07.webp' },
  { id: 'apptile-logomotion', title: 'Logo motion', client: 'Apptile', category: 'Animation', caseStudy: 'apptile', kind: 'video', mp4: '/videos/apptile-logomotion.mp4', still: 1, aspect: '720 / 1280' },
  { id: 'yui-packaging', title: 'Packaging on the table', client: 'Yui', category: 'Graphic design', caseStudy: 'yui', kind: 'image', src: '/work/yui/11.webp' },
  { id: 'apptile-banner', title: 'Banner film', client: 'Apptile', category: 'Campaigns', caseStudy: 'apptile', kind: 'video', mp4: '/work/apptile/v04.mp4', webm: '/work/apptile/v04.webm', still: 1.5, aspect: '1920 / 1080' },
  { id: 'yui-site-walkthrough', title: 'Site walkthrough', client: 'Yui', category: 'Video editing', caseStudy: 'yui', kind: 'video', mp4: '/work/yui/v05.mp4', webm: '/work/yui/v05.webm', still: 3, aspect: '1920 / 984' },
  { id: 'illus-identity', title: 'Identity', client: 'Illusdoodle', category: 'Graphic design', caseStudy: 'illusdoodle', kind: 'image', src: '/work/illusdoodle/01.webp' },
  { id: 'apptile-fast', title: 'Quick cut', client: 'Apptile', category: 'Motion graphics', caseStudy: 'apptile', kind: 'video', mp4: '/work/apptile/v03.mp4', webm: '/work/apptile/v03.webm', still: 1, aspect: '1920 / 1080' },
  { id: 'illus-posters', title: 'Posters', client: 'Illusdoodle', category: 'Graphic design', caseStudy: 'illusdoodle', kind: 'image', src: '/work/illusdoodle/10.webp', focus: 'center top' },
  { id: 'app-showcase', title: 'Product showcase', client: '1Red', category: 'Video editing', kind: 'video', mp4: '/videos/app-showcase.mp4', still: 4, aspect: '1920 / 1080' },
  { id: 'apptile-merch', title: 'Merch', client: 'Apptile', category: 'Campaigns', caseStudy: 'apptile', kind: 'image', src: '/work/apptile/11.webp' },
];

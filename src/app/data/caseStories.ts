/* ─── Case study stories (2026-10-04) ──────────────────────────────────────
 * Each project's page tells the brand's struggle and how it got out of it,
 * then shows a short, tidy edit of the Behance presentation instead of the
 * whole scroll. Facts come from the presentation plates themselves; nothing
 * here is a client result we can't back up.
 *
 * A grid row is a list of tiles shown side by side at their natural aspect
 * (a justified row: widths follow the aspect ratios, so every tile in a row
 * is the same height and nothing gets cropped).
 * ────────────────────────────────────────────────────────────────────────── */

export type Tile =
  | { img: string; w: number; h: number; alt: string }
  | { film: string; w: number; h: number; alt: string };

export interface CaseStory {
  /** Grey second line under the title. */
  tagline: string;
  scope: string[];
  /** Shown in small type under the meta row when the work wasn't commissioned. */
  note?: string;
  chapters: Array<{ title: string; body: string }>;
  /** The live site, run inside a laptop. */
  site?: { url: string; label: string; title: string; deck: string; dashboard?: string };
  /** Rows of the edit. `laptopAfter`: the laptop goes in after this many rows. */
  rows: Tile[][];
  laptopAfter?: number;
  closer: string;
}

const y = (n: string, w: number, h: number, alt: string): Tile => ({ img: `/work/yui/${n}.webp`, w, h, alt });
const a = (n: string, w: number, h: number, alt: string): Tile => ({ img: `/work/apptile/${n}.webp`, w, h, alt });
const d = (n: string, w: number, h: number, alt: string): Tile => ({ img: `/work/illusdoodle/${n}.webp`, w, h, alt });
const film = (slug: string, n: string, w: number, h: number, alt: string): Tile => ({ film: `/work/${slug}/${n}`, w, h, alt });

export const CASE_STORIES: Record<string, CaseStory> = {
  yui: {
    tagline: 'The fifth flavour is connection.',
    scope: ['Brand identity', 'Pattern & packaging', 'Social', 'Website', 'AI reservations', 'Staff dashboard'],
    chapters: [
      {
        title: 'The struggle',
        body:
          'A Japanese fine-dining room opening in JP Nagar, Bengaluru. The city is not short of sushi. It is short of places that feel like an occasion without feeling like a museum. Yui had to look five-star and still feel like dinner with people you actually like.',
      },
      {
        title: 'The idea',
        body:
          'Yui means to tie, to bind. Two Japanese things already do exactly that: the bento, made to share, and mizuhiki, the knotted cord tied on gifts for shared moments. Two stories, one symbol. The red knot became the mark, the pattern, the wax seal and the reason. The fifth flavour on the menu is the people at the table.',
      },
      {
        title: 'How it stands out',
        body:
          'The knot ties everything together, literally: gift wrap, totes, bento sleeves with dish cards and allergen stickers, the feed. Then we built the website in the same voice, plus booking by chat and one dashboard for the floor, so a website booking, a chat booking and a walk-in all land in the same place. No more "wait, let me check the other tab".',
      },
    ],
    site: {
      url: 'https://yuiii.vercel.app/',
      dashboard: 'https://yuiii.vercel.app/dashboard',
      label: 'yuiii.vercel.app',
      title: 'Take a seat.',
      deck: 'The real site, running live inside this laptop. Scroll it, click around, book a table. We won’t tell the chef.',
    },
    rows: [
      [y('01', 1400, 788, 'A Yui bento by a snowy window')],
      [film('yui', 'v01', 1920, 1364, 'The knot in motion'), y('03', 1400, 992, 'Two stories, one symbol: bento and mizuhiki')],
      [y('02', 1400, 1133, 'The mark, its regional signature and favicon'), y('04', 1400, 1073, 'Colour, with meaning')],
      [y('06', 1400, 1392, 'Patterns, reimagined'), y('08', 1400, 1241, 'Social, made for the feed')],
      [y('07', 1400, 695, 'Gift wrap with a wax seal, and the bento')],
      [film('yui', 'v03', 1920, 1000, 'Beyond the mark, in motion')],
    ],
    laptopAfter: 3,
    closer: 'Branding and the build, by the same table. That’s the whole trick.',
  },

  apptile: {
    tagline: 'In a sea of purple SaaS, be the green tile.',
    scope: ['Brand identity', 'Logo system', 'Type', 'Social', 'Merch', 'Keynote'],
    note: 'A self-initiated concept, not commissioned by Apptile. All trademarks belong to their owners.',
    chapters: [
      {
        title: 'The struggle',
        body:
          'No-code app builders all make the same promise in the same outfit: purple gradient, floating phone, the word "seamless". Apptile does something real (drag, drop, an app on iOS and Android) and looked like everyone else saying it. A product whose whole job is standing out on a home screen could not keep blending in on one.',
      },
      {
        title: 'The idea',
        body:
          'Start where the product lives: the app icon. The mark is a tile, an "a" and a grid at once, so it reads at 40 pixels and on a stage screen. One deep green nobody else in the category owns, and a voice that talks like a developer on a good day: "Compile? Nahh." "Logic > Language." "Apps, minus the dev drama."',
      },
      {
        title: 'How it stands out',
        body:
          'A logo system with a regional Devanagari signature, a notched sans that echoes the tile, and one green doing all the heavy lifting from ID cards to tees to a keynote wall. Same brand on a phone, a tote and a stage. Constant standing out, on purpose.',
      },
    ],
    rows: [
      [a('01', 1400, 788, 'Think bigger'), film('apptile', 'v01', 1920, 1080, 'The tile in motion')],
      [a('04', 1400, 761, 'Primary signature'), a('06', 1400, 932, 'Type: Stack Sans Notch and Satoshi')],
      [a('05', 1400, 1444, 'Secondary and regional signatures'), a('08', 1400, 1323, 'Social posts')],
      [film('apptile', 'v02', 2800, 1750, 'Colour in motion')],
      [a('09', 1400, 821, 'ID cards and the app icon'), a('10', 1400, 821, 'The platform on a tablet')],
      [a('11', 1400, 1642, 'Merch: Compile? Nahh.'), a('12', 1400, 1083, 'The keynote stage')],
    ],
    closer: 'Nobody asked. We did it anyway. That’s kind of the point.',
  },

  illusdoodle: {
    tagline: 'A brand that doodles back.',
    scope: ['Brand identity', 'Character', 'Type', 'Stickers', 'Merch', 'Print'],
    chapters: [
      {
        title: 'The struggle',
        body:
          'Illusdoodles makes illustration and doodle art: characters, stickers, custom shoes, phone skins, posters. The work is loud, crowded and hand-drawn. A brand for that usually goes one of two ways: a polite logo that apologises for the art, or a second doodle fighting the first one for attention.',
      },
      {
        title: 'The idea',
        body:
          'We pulled the "oo" out of doodles and gave it pupils. The eyes became the identity: in the wordmark, on the business card, on the character’s cap. A hand-drawn display face for the noise, Futura for the calm, and red, black and off-white to keep everyone in one room.',
      },
      {
        title: 'How it stands out',
        body:
          'One character carries the brand everywhere it goes: stickers, tees, custom skins, sneakers, framed posters. The doodles stay wild. The brand around them stays recognisable at a glance. Eyes on it, basically.',
      },
    ],
    rows: [
      [d('01', 1400, 860, 'The Illusdoodles wordmark')],
      [d('02', 1400, 1451, 'Logo, eyes and wordmark'), d('03', 1400, 872, 'Chinchilla display type')],
      [d('06', 1400, 938, 'Character design'), d('07', 1400, 933, 'Sticker collection')],
      [d('05', 1400, 965, 'Business cards'), d('08', 1400, 846, 'Custom skins and shoes')],
      [d('09', 1400, 825, 'Merch'), d('10', 1400, 1705, 'Posters')],
    ],
    closer: 'Loud work deserves a brand that can keep up.',
  },
};

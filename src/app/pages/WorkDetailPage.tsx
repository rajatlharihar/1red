import { useParams, Link } from 'react-router';
import { motion } from 'motion/react';

const EASE = [0.22, 1, 0.36, 1] as const;
const RED = '#EA3323';

const DETAILS: Record<string, { title: string; category: string; year: string; description: string }> = {
  apptile: {
    title: 'Apptile',
    category: 'Branding',
    year: '2025',
    description:
      'A modular brand system built for scale — logo motion, typography, and a flexible identity that holds together across app icons, decks, and product surfaces.',
  },
  illusdoodle: {
    title: 'Illusdoodle',
    category: 'Brand Strategy',
    year: '2025',
    description:
      'Positioning framework and creative direction that gave a fast-growing creative studio a voice worth listening to — and a brand worth remembering.',
  },
  yui: {
    title: 'Yui',
    category: 'UI/UX Design',
    year: '2025',
    description:
      'Human-centred product design from discovery to high-fidelity. We reduced friction at every touchpoint and built an experience users wanted to return to.',
  },
  terrabarn: {
    title: 'Terrabarn',
    category: 'Social Media',
    year: '2025',
    description:
      'Strategic content architecture and scroll-stopping creative that built a loyal community from zero through relentless consistency and on-brand storytelling.',
  },
  ground: {
    title: 'Ground',
    category: 'Motion Graphics',
    year: '2026',
    description:
      'Cinematic motion identity — animated brand assets, transitions, and social reels that made the brand impossible to ignore across every screen.',
  },
};

export function WorkDetailPage() {
  const { slug } = useParams();
  const d = (slug && DETAILS[slug]) || {
    title: 'Work',
    category: 'Project',
    year: '',
    description: 'Details coming soon.',
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#fff',
        paddingTop: 'clamp(8rem, 16vh, 12rem)',
        paddingBottom: '8rem',
        paddingLeft: 'clamp(1.5rem, 4vw, 5rem)',
        paddingRight: 'clamp(1.5rem, 4vw, 5rem)',
      }}
    >
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}
        >
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 11,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              opacity: 0.5,
            }}
          >
            {d.category}{d.year ? ` — ${d.year}` : ''}
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE, delay: 0.05 }}
          style={{
            fontFamily: 'var(--font-sans)',
            fontWeight: 700,
            fontSize: 'clamp(48px, 9vw, 120px)',
            lineHeight: 1,
            letterSpacing: '-0.03em',
            margin: 0,
            marginBottom: 36,
          }}
        >
          {d.title}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: EASE, delay: 0.14 }}
          style={{
            fontFamily: 'var(--font-sans)',
            fontWeight: 300,
            fontSize: 'clamp(16px, 1.6vw, 21px)',
            lineHeight: 1.7,
            opacity: 0.7,
            maxWidth: 620,
            margin: 0,
            marginBottom: 48,
          }}
        >
          {d.description}
        </motion.p>

        <Link
          to="/work"
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: 12,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            textDecoration: 'none',
            color: 'rgb(10,10,10)',
            borderBottom: `2px solid ${RED}`,
            paddingBottom: 4,
          }}
        >
          ← All Work
        </Link>
      </div>
    </main>
  );
}

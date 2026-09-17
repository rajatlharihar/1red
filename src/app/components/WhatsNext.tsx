import { useRef, useState, useCallback } from 'react';
import { motion, useInView, useScroll, useTransform, useSpring } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { Logo } from './Logo';

const EASE = [0.22, 1, 0.36, 1] as const;
const RED = '#EA3323';
const BAR_COUNT = 42;

/* ─── Wordless waveform — idle "music" pulse, no labels ──────────────────── */

function Waveform() {
  const [bars] = useState(() =>
    Array.from({ length: BAR_COUNT }, (_, i) => {
      const seed = Math.sin(i * 12.9898) * 43758.5453;
      return 0.18 + (seed - Math.floor(seed)) * 0.82;
    })
  );

  return (
    <div
      aria-hidden
      style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 3, height: 40 }}
    >
      {bars.map((h, i) => (
        <motion.span
          key={i}
          style={{
            width: 2,
            height: Math.max(6, Math.round(h * 40)),
            borderRadius: 1,
            background: i === Math.floor(BAR_COUNT / 2) ? RED : 'rgba(0,0,0,0.25)',
            transformOrigin: 'bottom',
          }}
          animate={{ scaleY: [0.35, 1, 0.35] }}
          transition={{
            duration: 1.4 + (i % 6) * 0.12,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: (i % 8) * 0.08,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Magnetic button ────────────────────────────────────────────────────── */

function MagneticButton({
  children,
  primary = false,
}: {
  children: React.ReactNode;
  primary?: boolean;
}) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPos({
      x: (e.clientX - (rect.left + rect.width / 2)) * 0.3,
      y: (e.clientY - (rect.top + rect.height / 2)) * 0.3,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHovered(false);
    setPos({ x: 0, y: 0 });
  }, []);

  return (
    <motion.button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      animate={{ x: pos.x, y: pos.y, scale: hovered ? 1.04 : 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28, mass: 0.8 }}
      className="btn-corners"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        paddingLeft: 36,
        paddingRight: 36,
        paddingTop: 18,
        paddingBottom: 18,
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: '0.09em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        border: primary ? 'none' : '1px solid rgba(0,0,0,0.22)',
        background: primary
          ? hovered ? 'rgba(20,20,20,1)' : 'rgba(10,10,10,1)'
          : hovered ? 'rgba(10,10,10,1)' : 'transparent',
        color: primary ? 'white' : hovered ? 'white' : 'rgb(10,10,10)',
        transition: 'background 0.28s ease, color 0.28s ease',
        willChange: 'transform',
      }}
    >
      {children}
    </motion.button>
  );
}

/* ─── Main section ───────────────────────────────────────────────────────── */

export function WhatsNext() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const inView = useInView(contentRef, { once: true, margin: '-80px' });

  /* Parallax for background watermark — uses window scroll, no target needed */
  const { scrollY } = useScroll();
  const watermarkY = useTransform(scrollY, (y) => {
    const el = sectionRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const centre = rect.top + rect.height / 2;
    // Map distance from viewport centre to a ±40px drift
    return (centre / window.innerHeight - 0.5) * -80;
  });

  return (
    <section
      id="contact"
      ref={sectionRef}
      style={{
        minHeight: '82vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        paddingTop: 'clamp(5rem, 12vh, 9rem)',
        paddingBottom: 'clamp(5rem, 12vh, 9rem)',
        paddingLeft: 'clamp(1.5rem, 4vw, 5rem)',
        paddingRight: 'clamp(1.5rem, 4vw, 5rem)',
        background: 'white',
      }}
    >
      {/* ── Background watermark ── */}
      <motion.div
        style={{ y: watermarkY }}
        aria-hidden
        className="pointer-events-none select-none absolute inset-0 flex items-center justify-center overflow-hidden"
      >
        <Logo width={420} className="w-[clamp(220px,32vw,520px)] h-auto opacity-[0.028]" />
      </motion.div>

      {/* Soft vignette edges */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 70% 60% at 50% 50%, transparent 40%, rgba(255,255,255,0.6) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* ── Content ── */}
      <div
        ref={contentRef}
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          maxWidth: 820,
          gap: 0,
        }}
      >
        {/* Trust indicator */}
        <div style={{ overflow: 'hidden', marginBottom: 36 }}>
          <motion.div
            initial={{ y: '110%' }}
            animate={inView ? { y: 0 } : {}}
            transition={{ duration: 0.62, ease: EASE }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 11,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              opacity: 0.38,
            }}
          >
            Available for Projects in 2026
          </motion.div>
        </div>

        {/* Heading — line by line mask reveal */}
        {['Let\'s Create', "What's Next."].map((line, i) => (
          <div key={line} style={{ overflow: 'hidden' }}>
            <motion.h2
              initial={{ y: '110%' }}
              animate={inView ? { y: 0 } : {}}
              transition={{ duration: 0.84, ease: EASE, delay: 0.04 + i * 0.07 }}
              style={{
                fontSize: 'clamp(52px, 8vw, 120px)',
                fontWeight: 700,
                letterSpacing: '-0.04em',
                lineHeight: 1.0,
                margin: 0,
              }}
            >
              {line}
            </motion.h2>
          </div>
        ))}

        {/* Supporting text */}
        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.68, ease: EASE, delay: 0.22 }}
          style={{
            fontSize: 'clamp(14px, 1.2vw, 17px)',
            lineHeight: 1.72,
            opacity: 0.44,
            maxWidth: 480,
            marginTop: 28,
            marginBottom: 0,
          }}
        >
          We partner with ambitious brands to create experiences that stand out,
          scale faster, and leave a lasting impression.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.68, ease: EASE, delay: 0.34 }}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 14,
            justifyContent: 'center',
            marginTop: 48,
          }}
        >
          <MagneticButton primary>
            Start a Project
            <motion.span
              animate={{ x: 0, y: 0 }}
              whileHover={{ x: 2, y: -2 }}
              transition={{ duration: 0.25 }}
            >
              <ArrowUpRight size={15} strokeWidth={2} />
            </motion.span>
          </MagneticButton>

          <MagneticButton>
            Book a Call
          </MagneticButton>
        </motion.div>

        {/* Client tags */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, ease: EASE, delay: 0.5 }}
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            justifyContent: 'center',
            marginTop: 52,
          }}
        >
          {['Startups', 'Scale-ups', 'Creatives', 'Founders', 'Brands'].map((label, i) => (
            <motion.span
              key={label}
              initial={{ opacity: 0, y: 8 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, ease: EASE, delay: 0.52 + i * 0.05 }}
              style={{
                fontSize: 10,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                padding: '6px 14px',
                borderRadius: 3,
                border: '1px solid rgba(0,0,0,0.09)',
                opacity: 0.36,
              }}
            >
              {label}
            </motion.span>
          ))}
        </motion.div>

        {/* Wordless waveform flourish */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, ease: EASE, delay: 0.58 }}
          style={{ marginTop: 56 }}
        >
          <Waveform />
        </motion.div>
      </div>

      {/* Bottom divider */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={inView ? { scaleX: 1 } : {}}
        transition={{ duration: 1, ease: EASE, delay: 0.6 }}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 'clamp(1.5rem, 4vw, 5rem)',
          right: 'clamp(1.5rem, 4vw, 5rem)',
          height: 1,
          background: 'rgba(0,0,0,0.07)',
          transformOrigin: 'left',
        }}
      />
    </section>
  );
}

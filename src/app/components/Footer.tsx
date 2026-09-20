import { useRef, useState, useCallback } from 'react';
import { motion, useInView } from 'motion/react';
import { Link, useNavigate } from 'react-router';
import { ArrowUpRight } from 'lucide-react';
import { Logo } from './Logo';
import { StudioWord } from './StudioWord';

const EASE = [0.22, 1, 0.36, 1] as const;

// Real contact details don't exist yet — one deliberate placeholder set,
// exported so the standalone /contact page (Contact.tsx) reuses the exact
// same values instead of duplicating them.
export const CONTACT_EMAIL = 'hi@1red.in';
export const socialLinks = [
  { label: 'LinkedIn',  href: '#' },
  { label: 'Instagram', href: '#' },
  { label: 'Behance',   href: '#' },
  { label: 'Dribbble',  href: '#' },
];

const secondaryLinks = ['Contact', 'About', 'FAQs', 'Privacy Policy'];

const tags = [
  'Branding',
  'Website Design',
  'UI/UX Design',
  'Social Media',
  'Motion Graphics',
  'Creative Strategy',
];

const headlineLines = [
  'Ready to build',
  'something people',
  "won't forget?",
];

/* ─── Magnetic CTA button ────────────────────────────────────────────────── */

function MagneticCTA() {
  const navigate = useNavigate();
  const mouseX = useRef(0);
  const mouseY = useRef(0);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    mouseX.current = (e.clientX - cx) * 0.32;
    mouseY.current = (e.clientY - cy) * 0.32;
    setPos({ x: mouseX.current, y: mouseY.current });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHovered(false);
    setPos({ x: 0, y: 0 });
  }, []);

  return (
    <motion.button
      onClick={() => navigate('/contact')}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      animate={{
        x: pos.x,
        y: pos.y,
        scale: hovered ? 1.04 : 1,
        borderColor: hovered ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.14)',
        boxShadow: hovered
          ? '0 0 40px rgba(255,255,255,0.08), 0 8px 32px rgba(255,255,255,0.06)'
          : '0 4px 16px rgba(255,255,255,0.04)',
      }}
      transition={{ duration: 0.4, ease: EASE }}
      className="btn-corners"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        paddingLeft: 36,
        paddingRight: 36,
        paddingTop: 18,
        paddingBottom: 18,
        border: '1px solid rgba(255,255,255,0.14)',
        background: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        color: 'white',
        userSelect: 'none',
      } as React.CSSProperties}
    >
      Start a Project
      <motion.span
        animate={{ x: hovered ? 3 : 0, y: hovered ? -3 : 0 }}
        transition={{ duration: 0.35, ease: EASE }}
      >
        <ArrowUpRight size={16} strokeWidth={1.8} />
      </motion.span>
    </motion.button>
  );
}

/* ─── Social link row ────────────────────────────────────────────────────── */

function SocialLink({ label, href, delay }: { label: string; href: string; delay: number }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [hovered, setHovered] = useState(false);

  return (
    <motion.a
      ref={ref}
      href={href}
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.62, ease: EASE, delay }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 13,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        textDecoration: 'none',
        color: 'white',
        opacity: hovered ? 1 : 0.44,
        transition: 'opacity 280ms ease-out',
      }}
    >
      <motion.span
        animate={{ y: hovered ? -1 : 0 }}
        transition={{ duration: 0.28, ease: EASE }}
      >
        {label}
      </motion.span>
      <motion.span
        animate={{ x: hovered ? 2 : 0, y: hovered ? -2 : 0, opacity: hovered ? 1 : 0.5 }}
        transition={{ duration: 0.28, ease: EASE }}
      >
        <ArrowUpRight size={13} strokeWidth={1.6} />
      </motion.span>
    </motion.a>
  );
}

/* ─── Expertise tag ──────────────────────────────────────────────────────── */

function Tag({ label, delay }: { label: string; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-30px' });
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 14 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.58, ease: EASE, delay }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link to="/studio" style={{ textDecoration: 'none', color: 'inherit' }}>
      <motion.span
        animate={{
          backgroundColor: hovered ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0)',
          borderColor: hovered ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.12)',
          y: hovered ? -2 : 0,
        }}
        transition={{ duration: 0.3, ease: EASE }}
        className="btn-corners"
        style={{
          display: 'inline-block',
          padding: '8px 18px',
          border: '1px solid rgba(255,255,255,0.12)',
          fontSize: 11,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          cursor: 'pointer',
          userSelect: 'none',
        } as React.CSSProperties}
      >
        {label}
      </motion.span>
      </Link>
    </motion.div>
  );
}

/* ─── Main footer ────────────────────────────────────────────────────────── */

export function Footer() {
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: '-80px' });

  const [emailHovered, setEmailHovered] = useState(false);

  return (
    <footer
      ref={sectionRef}
      style={{
        minHeight: '100vh',
        background: '#0A0A0A',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        paddingTop: 'clamp(3rem, 7vh, 6rem)',
        paddingBottom: 'clamp(2rem, 5vh, 4rem)',
        paddingLeft: 'clamp(1.5rem, 4vw, 5rem)',
        paddingRight: 'clamp(1.5rem, 4vw, 5rem)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient watermark, in Rajat's block letters */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          bottom: -24,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'clamp(420px, 62vw, 1100px)',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        <StudioWord fill="rgba(255,255,255,0.03)" style={{ width: '100%', height: 'auto', display: 'block' }} />
      </div>

      {/* ── Top row: Logo + Headline ── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(2rem, 4vh, 3.5rem)',
        }}
      >
        {/* 1Red logo */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.72, ease: EASE }}
          whileHover={{ scale: 1.03, y: -2 }}
        >
          {/* cropped aspect ≈2.66:1 → width=220 gives height≈83px */}
          {/* 1.66:1 ratio → width=200 gives height≈120px — footer hero mark */}
          <Logo width={200} />
        </motion.div>

        {/* Headline */}
        <div>
          {headlineLines.map((line, i) => (
            <div key={i} style={{ overflow: 'hidden' }}>
              <motion.h2
                initial={{ y: '110%' }}
                animate={inView ? { y: 0 } : {}}
                transition={{ duration: 0.85, ease: EASE, delay: 0.08 + i * 0.07 }}
                style={{
                  fontSize: 'clamp(36px, 6vw, 88px)',
                  fontWeight: 700,
                  letterSpacing: '-0.035em',
                  lineHeight: 1.06,
                  margin: 0,
                }}
              >
                {line}
              </motion.h2>
            </div>
          ))}
        </div>

        {/* Email */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.68, ease: EASE, delay: 0.32 }}
        >
          <a
            href="mailto:hi@1red.in"
            onMouseEnter={() => setEmailHovered(true)}
            onMouseLeave={() => setEmailHovered(false)}
            style={{
              fontSize: 'clamp(18px, 2.4vw, 34px)',
              fontWeight: 500,
              letterSpacing: '-0.02em',
              textDecoration: 'none',
              color: 'white',
              opacity: emailHovered ? 1 : 0.7,
              transition: 'opacity 320ms ease-out',
              display: 'inline-block',
              position: 'relative',
            }}
          >
            hi@1red.in
            <motion.div
              animate={{ scaleX: emailHovered ? 1 : 0 }}
              transition={{ duration: 0.36, ease: EASE }}
              style={{
                position: 'absolute',
                bottom: -2,
                left: 0,
                right: 0,
                height: 1,
                background: 'currentColor',
                originX: 0,
                opacity: 0.5,
              }}
            />
          </a>
        </motion.div>

        {/* CTA + Socials row */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            gap: 'clamp(1.5rem, 3vw, 3rem)',
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.62, ease: EASE, delay: 0.42 }}
          >
            <MagneticCTA />
          </motion.div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(20px, 2.5vw, 36px)' }}>
            {socialLinks.map((s, i) => (
              <SocialLink key={s.label} label={s.label} href={s.href} delay={0.48 + i * 0.06} />
            ))}
          </div>
        </div>
      </div>

      {/* ── Middle: Expertise tags ── */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          paddingTop: 'clamp(2.5rem, 6vh, 5rem)',
          paddingBottom: 'clamp(2.5rem, 6vh, 5rem)',
        }}
      >
        {tags.map((tag, i) => (
          <Tag key={tag} label={tag} delay={0.06 * i} />
        ))}
      </div>

      {/* ── Bottom bar ── */}
      <div>
        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={inView ? { scaleX: 1 } : {}}
          transition={{ duration: 0.9, ease: EASE, delay: 0.1 }}
          style={{
            height: 1,
            background: 'rgba(255,255,255,0.08)',
            originX: 0,
            marginBottom: 24,
          }}
        />

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          {/* Secondary links */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(16px, 2vw, 32px)' }}>
            {secondaryLinks.map((link, i) => {
              const sharedStyle: React.CSSProperties = {
                fontSize: 11,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                color: 'white',
                opacity: 0.36,
                transition: 'opacity 260ms ease-out',
              };
              const motionProps = {
                initial: { opacity: 0 },
                animate: inView ? { opacity: 1 } : {},
                transition: { duration: 0.5, ease: EASE, delay: 0.6 + i * 0.05 },
                onMouseEnter: (e: React.MouseEvent<HTMLElement>) => ((e.currentTarget as HTMLElement).style.opacity = '0.72'),
                onMouseLeave: (e: React.MouseEvent<HTMLElement>) => ((e.currentTarget as HTMLElement).style.opacity = '0.36'),
              };
              const routedLinks: Record<string, string> = { Contact: '/contact', 'Privacy Policy': '/privacy' };
              if (routedLinks[link]) {
                return (
                  <Link
                    key={link}
                    to={routedLinks[link]}
                    style={{ ...sharedStyle, textDecoration: 'none' }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = '0.72')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = '0.36')}
                  >
                    {link}
                  </Link>
                );
              }
              return (
                <motion.a
                  key={link}
                  {...motionProps}
                  href="#"
                  style={sharedStyle}
                >
                  {link}
                </motion.a>
              );
            })}
          </div>

          {/* Copyright */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, ease: EASE, delay: 0.8 }}
            style={{
              fontSize: 11,
              letterSpacing: '0.1em',
              opacity: 0.24,
            }}
          >
            © 2026 Studio. All rights reserved.
          </motion.p>
        </div>
      </div>
    </footer>
  );
}

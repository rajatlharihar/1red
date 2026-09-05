import { useRef, useState, useEffect } from 'react';
import { motion, useInView, useScroll, useSpring } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';

const EASE = [0.22, 1, 0.36, 1] as const;

const sections = [
  {
    number: '01',
    title: 'Information We Collect',
    body: 'We may collect information that you voluntarily provide through contact forms, project enquiries, consultation requests, or direct communication.',
    items: ['Name', 'Email address', 'Phone number', 'Company information', 'Project requirements', 'Any information you choose to share with us'],
  },
  {
    number: '02',
    title: 'How We Use Information',
    body: 'We use collected information solely to serve you better and deliver our work. We never sell personal information to third parties.',
    items: ['Respond to enquiries', 'Discuss potential projects', 'Deliver services', 'Improve website performance', 'Improve user experience', 'Communicate project updates'],
  },
  {
    number: '03',
    title: 'Analytics & Cookies',
    body: 'Like most modern websites, we may use analytics tools and cookies to understand visitor behaviour and improve website performance. This data may include:',
    items: ['Browser type', 'Device information', 'Pages visited', 'Session duration', 'General geographic information'],
  },
  {
    number: '04',
    title: 'Data Protection',
    body: 'We take reasonable technical and organisational measures to protect information from unauthorised access, misuse, disclosure, or loss. While no online system can guarantee absolute security, we are committed to maintaining industry-standard security practices.',
    items: [],
  },
  {
    number: '05',
    title: 'Third-Party Services',
    body: 'Our website may use trusted third-party services to operate effectively. These providers may process limited information necessary to perform their services.',
    items: ['Website analytics', 'Contact forms', 'Hosting providers', 'Scheduling platforms'],
  },
  {
    number: '06',
    title: 'Your Rights',
    body: 'You have rights over your personal information. You may request any of the following at any time:',
    items: ['Access to your information', 'Correction of inaccurate information', 'Deletion of personal information', 'Withdrawal of consent where applicable'],
  },
  {
    number: '07',
    title: 'Contact',
    body: 'Questions regarding privacy or data handling? We\'re happy to help.',
    items: [],
    contact: 'hello@yourdomain.com',
  },
];

/* ─── Reading progress bar ───────────────────────────────────────────────── */

function ReadingProgress() {
  const { scrollYProgress } = useScroll();
  const scaleY = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  return (
    <motion.div
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        width: 2,
        background: 'rgba(0,0,0,0.12)',
        zIndex: 100,
        transformOrigin: 'top',
        scaleY,
      }}
    />
  );
}

/* ─── Reveal wrapper ─────────────────────────────────────────────────────── */

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.72, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

/* ─── Policy section card ────────────────────────────────────────────────── */

function PolicySection({ section, index }: { section: (typeof sections)[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 36 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.72, ease: EASE, delay: 0.05 }}
      style={{
        display: 'grid',
        gap: 'clamp(1.5rem, 3vw, 3rem)',
        paddingTop: 'clamp(2.5rem, 5vh, 4rem)',
        paddingBottom: 'clamp(2.5rem, 5vh, 4rem)',
        borderTop: '1px solid rgba(0,0,0,0.07)',
      }}
      className="lg:grid-cols-[200px_1fr]"
    >
      {/* Left: number + title */}
      <div>
        <span style={{ fontSize: 10, letterSpacing: '0.2em', opacity: 0.3, display: 'block', marginBottom: 10 }}>
          {section.number}
        </span>
        <h3
          style={{
            fontSize: 'clamp(18px, 2vw, 26px)',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
            margin: 0,
          }}
        >
          {section.title}
        </h3>
      </div>

      {/* Right: content */}
      <div>
        <p style={{ fontSize: 15, lineHeight: 1.78, opacity: 0.55, marginBottom: section.items.length ? 20 : 0 }}>
          {section.body}
        </p>

        {section.items.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {section.items.map((item, i) => (
              <motion.div
                key={item}
                initial={{ opacity: 0, x: -8 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, ease: EASE, delay: 0.1 + i * 0.04 }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, opacity: 0.52 }}
              >
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'currentColor', opacity: 0.5, flexShrink: 0 }} />
                {item}
              </motion.div>
            ))}
          </div>
        )}

        {section.contact && (
          <a
            href={`mailto:${section.contact}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 'clamp(16px, 2vw, 24px)',
              fontWeight: 600,
              letterSpacing: '-0.02em',
              color: 'inherit',
              textDecoration: 'none',
              marginTop: 8,
              opacity: 0.8,
              transition: 'opacity 0.26s ease',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '0.8')}
          >
            {section.contact}
            <ArrowUpRight size={18} strokeWidth={1.6} />
          </a>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */

export function Privacy() {
  const heroRef = useRef<HTMLDivElement>(null);
  const heroInView = useInView(heroRef, { once: true, margin: '-40px' });

  return (
    <main style={{ background: 'white', minHeight: '100vh' }}>
      <ReadingProgress />

      {/* ── Hero ── */}
      <section
        style={{
          paddingTop: 'clamp(8rem, 16vh, 13rem)',
          paddingBottom: 'clamp(4rem, 8vh, 7rem)',
          paddingLeft: 'clamp(1.5rem, 4vw, 5rem)',
          paddingRight: 'clamp(1.5rem, 4vw, 5rem)',
          position: 'relative',
          overflow: 'hidden',
          borderBottom: '1px solid rgba(0,0,0,0.07)',
        }}
      >
        {/* Background watermark */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            right: '-4%',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 'clamp(120px, 20vw, 320px)',
            fontWeight: 900,
            letterSpacing: '-0.06em',
            color: 'rgba(0,0,0,0.025)',
            userSelect: 'none',
            lineHeight: 1,
            pointerEvents: 'none',
          }}
        >
          Privacy
        </div>

        <div ref={heroRef} style={{ maxWidth: 1400, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          {/* Eyebrow */}
          <div style={{ overflow: 'hidden', marginBottom: 14 }}>
            <motion.p
              initial={{ y: '110%' }}
              animate={heroInView ? { y: 0 } : {}}
              transition={{ duration: 0.6, ease: EASE }}
              style={{ fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', opacity: 0.35, margin: 0 }}
            >
              Legal
            </motion.p>
          </div>

          {/* Heading */}
          {['Privacy', 'Policy'].map((word, i) => (
            <div key={word} style={{ overflow: 'hidden' }}>
              <motion.h1
                initial={{ y: '110%' }}
                animate={heroInView ? { y: 0 } : {}}
                transition={{ duration: 0.84, ease: EASE, delay: 0.04 + i * 0.08 }}
                style={{
                  fontSize: 'clamp(52px, 8vw, 120px)',
                  fontWeight: 700,
                  letterSpacing: '-0.04em',
                  lineHeight: 1.0,
                  margin: 0,
                }}
              >
                {word}
              </motion.h1>
            </div>
          ))}

          {/* Meta row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 32, marginTop: 36 }}>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.62, ease: EASE, delay: 0.22 }}
              style={{ fontSize: 15, opacity: 0.48, lineHeight: 1.74, maxWidth: 480, margin: 0 }}
            >
              We believe trust is built through transparency. This page explains what information we collect, why we collect it, and how we protect it.
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={heroInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.34 }}
              style={{ fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.28 }}
            >
              Last updated: June 2026
            </motion.p>
          </div>
        </div>
      </section>

      {/* ── Policy sections ── */}
      <section
        style={{
          paddingLeft: 'clamp(1.5rem, 4vw, 5rem)',
          paddingRight: 'clamp(1.5rem, 4vw, 5rem)',
          paddingBottom: 'clamp(4rem, 8vh, 7rem)',
          maxWidth: 1400,
          margin: '0 auto',
        }}
      >
        {sections.map((section, i) => (
          <PolicySection key={section.number} section={section} index={i} />
        ))}
      </section>

      {/* ── Footer CTA ── */}
      <section
        style={{
          background: 'rgb(10,10,10)',
          color: 'white',
          textAlign: 'center',
          padding: 'clamp(5rem, 10vh, 9rem) clamp(1.5rem, 4vw, 5rem)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <span style={{ fontSize: 'clamp(80px, 18vw, 260px)', fontWeight: 900, letterSpacing: '-0.06em', color: 'rgba(255,255,255,0.03)', userSelect: 'none', whiteSpace: 'nowrap' }}>
            1RED.
          </span>
        </div>

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 640, margin: '0 auto' }}>
          <Reveal>
            <p style={{ fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 20 }}>
              Our Promise
            </p>
            <h2
              style={{
                fontSize: 'clamp(28px, 4vw, 56px)',
                fontWeight: 700,
                letterSpacing: '-0.03em',
                lineHeight: 1.1,
                color: 'white',
                margin: '0 0 20px',
              }}
            >
              Built on trust.<br />Designed for meaningful partnerships.
            </h2>
            <p style={{ fontSize: 14, opacity: 0.42, lineHeight: 1.72, color: 'white', margin: '0 0 40px' }}>
              Every project we take on starts with honesty, transparency, and a shared commitment to doing great work.
            </p>

            <motion.a
              href="mailto:hello@yourdomain.com"
              whileHover={{ scale: 1.04 }}
              transition={{ duration: 0.25, ease: EASE }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                padding: '18px 36px',
                borderRadius: 3,
                background: 'white',
                color: 'rgb(10,10,10)',
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.09em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                cursor: 'pointer',
              }}
            >
              Start a Project <ArrowUpRight size={14} strokeWidth={2} />
            </motion.a>
          </Reveal>
        </div>
      </section>
    </main>
  );
}

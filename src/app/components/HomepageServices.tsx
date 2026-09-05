import { useState, useRef } from 'react';
import { motion, AnimatePresence, useInView, useReducedMotion } from 'motion/react';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import { GLASS, GlassAmbient, GlassReflectionSweep } from './GlassLayers';

const EASE = [0.22, 1, 0.36, 1] as const;

/* ─── Data ───────────────────────────────────────────────────────────────── */

const services = [
  {
    number: '01',
    title: 'Branding',
    description: 'Build memorable identities that create recognition and long-term value across every surface.',
    tags: ['Brand Strategy', 'Identity Design', 'Visual Systems'],
    keywords: ['Identity', 'Recognition', 'System', 'Voice', 'Mark'],
    detail: 'We build brand systems from the ground up — positioning, naming, visual identity, and communication frameworks that hold up across every context. From logo to launch, everything is crafted to be unmistakably yours.',
    deliverables: ['Logo & Mark System', 'Brand Guidelines', 'Typography Scale', 'Colour System', 'Brand Voice Framework'],
    process: ['Discovery & Positioning', 'Concept Development', 'Visual Identity', 'System Design', 'Brand Launch'],
  },
  {
    number: '02',
    title: 'Website Design',
    description: 'Craft fast, conversion-focused digital experiences that elevate brands online.',
    tags: ['UI Design', 'Web Design', 'Development'],
    keywords: ['Performance', 'Conversion', 'UX', 'Responsive', 'CMS'],
    detail: 'We design and build websites that are as strategic as they are beautiful. Every page, interaction, and flow is considered for its role in converting visitors into customers.',
    deliverables: ['UX Architecture', 'Visual Design', 'Responsive Build', 'CMS Integration', 'Performance Optimisation'],
    process: ['Discovery & Strategy', 'UX Planning', 'Design', 'Development', 'Launch & Iterate'],
  },
  {
    number: '03',
    title: 'UI/UX Design',
    description: 'Create intuitive interfaces and seamless user experiences that drive engagement.',
    tags: ['Research', 'Wireframing', 'Prototyping'],
    keywords: ['Flows', 'Usability', 'Research', 'Journey', 'Clarity'],
    detail: 'Human-centred design from discovery to high-fidelity. We map user journeys, remove friction, and design products that feel effortless — because the best interfaces are the ones nobody notices.',
    deliverables: ['User Research', 'Journey Mapping', 'Wireframes', 'Prototypes', 'Design System'],
    process: ['Research', 'Information Architecture', 'Wireframing', 'Prototyping', 'Testing & Handoff'],
  },
  {
    number: '04',
    title: 'Social Media',
    description: 'Develop content systems and campaigns that grow communities and increase visibility.',
    tags: ['Content Strategy', 'Campaigns', 'Growth'],
    keywords: ['Community', 'Reach', 'Content', 'Engagement', 'Strategy'],
    detail: 'We build the strategy, the content system, and the creative output that makes your brand scroll-stopping. Consistently on-brand, always audience-first.',
    deliverables: ['Content Strategy', 'Monthly Content Plan', 'Ad Creatives', 'Analytics Reporting', 'Community Playbook'],
    process: ['Audit & Strategy', 'Content System', 'Creative Production', 'Scheduling', 'Review & Optimise'],
  },
  {
    number: '05',
    title: 'Motion Graphics',
    description: 'Bring stories to life through motion, animation, and dynamic visual communication.',
    tags: ['Animation', 'Video Content', 'Creative Direction'],
    keywords: ['Motion', 'Animate', 'Cinematic', 'Story', 'Dynamic'],
    detail: 'From brand animations to social reels to product explainers — we create motion that feels intentional, premium, and impossible to scroll past.',
    deliverables: ['Brand Animation', 'Social Reels', 'Lottie Files', 'Explainer Videos', 'Motion Guidelines'],
    process: ['Creative Brief', 'Storyboard', 'Style Frames', 'Animation', 'Delivery'],
  },
];

/* ─── Abstract right-side visual panel ──────────────────────────────────── */

function ServiceVisual({
  service,
  hovered,
  expanded,
}: {
  service: (typeof services)[0];
  hovered: boolean;
  expanded: boolean;
}) {
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        minHeight: 220,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Giant background number */}
      <motion.div
        animate={{
          scale: hovered ? 1.06 : 1,
          opacity: hovered ? 0.055 : 0.038,
        }}
        transition={{ duration: 0.5, ease: EASE }}
        style={{
          position: 'absolute',
          fontSize: 'clamp(140px, 18vw, 240px)',
          fontWeight: 900,
          letterSpacing: '-0.06em',
          lineHeight: 1,
          userSelect: 'none',
          color: 'black',
          right: '-2%',
          top: '50%',
          transform: 'translateY(-50%)',
          whiteSpace: 'nowrap',
        }}
      >
        {service.number}
      </motion.div>

      {/* Floating keywords */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {service.keywords.map((kw, i) => {
          const positions = [
            { top: '14%', left: '8%' },
            { top: '28%', right: '18%' },
            { top: '52%', left: '12%' },
            { bottom: '20%', right: '12%' },
            { bottom: '12%', left: '28%' },
          ];
          const pos = positions[i % positions.length];

          return (
            <motion.span
              key={kw}
              animate={{
                opacity: hovered ? 0.28 : 0.13,
                y: hovered ? (i % 2 === 0 ? -4 : 4) : 0,
              }}
              transition={{ duration: 0.5, ease: EASE, delay: i * 0.04 }}
              style={{
                position: 'absolute',
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                userSelect: 'none',
                ...pos,
              }}
            >
              {kw}
            </motion.span>
          );
        })}
      </div>

      {/* Abstract line grid */}
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: hovered ? 0.09 : 0.05, transition: 'opacity 0.4s ease' }}
        viewBox="0 0 400 280"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
      >
        <line x1="0" y1="80" x2="400" y2="80" stroke="black" strokeWidth="0.8" />
        <line x1="0" y1="160" x2="400" y2="160" stroke="black" strokeWidth="0.8" />
        <line x1="100" y1="0" x2="100" y2="280" stroke="black" strokeWidth="0.8" />
        <line x1="260" y1="0" x2="260" y2="280" stroke="black" strokeWidth="0.8" />
        <circle cx="100" cy="80" r="3" fill="black" />
        <circle cx="260" cy="160" r="3" fill="black" />
        <circle cx="100" cy="160" r="24" stroke="black" strokeWidth="0.8" fill="none" />
        <circle cx="260" cy="80" r="40" stroke="black" strokeWidth="0.5" fill="none" />
      </svg>

      {/* Service title ghost */}
      <motion.div
        animate={{ opacity: hovered ? 0.06 : 0.03 }}
        transition={{ duration: 0.4, ease: EASE }}
        style={{
          position: 'absolute',
          bottom: 16,
          left: 20,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          userSelect: 'none',
        }}
      >
        {service.title}
      </motion.div>
    </div>
  );
}

/* ─── Expanded detail ────────────────────────────────────────────────────── */

function ServiceDetail({ service }: { service: (typeof services)[0] }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.52, ease: EASE }}
      style={{ overflow: 'hidden' }}
    >
      <div
        style={{
          borderTop: '1px solid rgba(0,0,0,0.07)',
          marginTop: 28,
          paddingTop: 32,
          display: 'grid',
          gap: '2rem',
        }}
        className="lg:grid-cols-3"
      >
        {/* Detail */}
        <div>
          <p style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.32, marginBottom: 12 }}>Overview</p>
          <p style={{ fontSize: 14, lineHeight: 1.76, opacity: 0.54 }}>{service.detail}</p>
        </div>

        {/* Deliverables */}
        <div>
          <p style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.32, marginBottom: 12 }}>Deliverables</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {service.deliverables.map((d) => (
              <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, opacity: 0.55 }}>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'currentColor', opacity: 0.4, flexShrink: 0 }} />
                {d}
              </div>
            ))}
          </div>
        </div>

        {/* Process */}
        <div>
          <p style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.32, marginBottom: 12 }}>Process</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {service.process.map((step, i) => (
              <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, opacity: 0.55 }}>
                <span style={{ fontSize: 9, opacity: 0.4, letterSpacing: '0.1em', flexShrink: 0, width: 16 }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                {step}
              </div>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.03, x: 4 }}
            transition={{ duration: 0.25, ease: EASE }}
            style={{
              marginTop: 28,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 24px',
              borderRadius: 3,
              border: '1px solid rgba(0,0,0,0.14)',
              background: 'rgba(0,0,0,0.03)',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.09em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            Start a Project <ArrowRight size={13} strokeWidth={1.8} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Single service card ────────────────────────────────────────────────── */

function ServiceCard({
  service,
  index,
}: {
  service: (typeof services)[0];
  index: number;
}) {
  const [hovered, setHovered] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const reduceMotion = useReducedMotion() ?? false;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50, scale: 0.98 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.72, ease: EASE, delay: index * 0.08 }}
    >
      <motion.div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        animate={{
          y: hovered && !expanded ? -8 : 0,
          background: hovered ? GLASS.surface.hover : GLASS.surface.idle,
          borderColor: hovered ? GLASS.border.hover : GLASS.border.idle,
          boxShadow: hovered ? GLASS.shadow.hover : GLASS.shadow.idle,
        }}
        transition={{ duration: 0.4, ease: EASE }}
        style={{
          position: 'relative',
          borderWidth: 1,
          borderStyle: 'solid',
          borderRadius: 48,
          backdropFilter: GLASS.blur,
          WebkitBackdropFilter: GLASS.blur,
          overflow: 'hidden',
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <GlassAmbient hovered={hovered} />
        <GlassReflectionSweep hovered={hovered} reduceMotion={reduceMotion} />

        {/* Card inner */}
        <div
          style={{
            position: 'relative',
            display: 'grid',
            gridTemplateColumns: '1fr',
            minHeight: 280,
          }}
          className="lg:grid-cols-[55%_45%]"
        >
          {/* Left: content */}
          <div
            style={{
              padding: 'clamp(36px, 4vw, 56px)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 28,
              borderRight: '1px solid rgba(0,0,0,0.05)',
            }}
          >
            <div>
              {/* Number + title row */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
                <motion.span
                  animate={{ opacity: hovered ? 0.6 : 0.2 }}
                  transition={{ duration: 0.36 }}
                  style={{
                    fontSize: 11,
                    letterSpacing: '0.18em',
                    marginTop: 6,
                    flexShrink: 0,
                  }}
                >
                  {service.number}
                </motion.span>

                <motion.h3
                  animate={{ x: hovered ? 4 : 0 }}
                  transition={{ duration: 0.4, ease: EASE }}
                  style={{
                    fontSize: 'clamp(32px, 3.8vw, 56px)',
                    fontWeight: 700,
                    letterSpacing: '-0.03em',
                    lineHeight: 1.06,
                    margin: 0,
                  }}
                >
                  {service.title}
                </motion.h3>
              </div>

              <p style={{ fontSize: 14, opacity: 0.5, lineHeight: 1.74, maxWidth: 400, margin: '0 0 24px' }}>
                {service.description}
              </p>

              {/* Tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {service.tags.map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: 10,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      padding: '7px 16px',
                      borderRadius: 3,
                      border: '1px solid rgba(0,0,0,0.1)',
                      opacity: 0.55,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* CTA */}
            <motion.div
              animate={{ x: hovered ? 6 : 0, opacity: hovered ? 1 : 0.45 }}
              transition={{ duration: 0.36, ease: EASE }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
              }}
            >
              {expanded ? 'Close' : 'Find Out More'}
              <motion.span
                animate={{ rotate: expanded ? 90 : 0 }}
                transition={{ duration: 0.36, ease: EASE }}
              >
                <ArrowUpRight size={14} strokeWidth={1.8} />
              </motion.span>
            </motion.div>
          </div>

          {/* Right: visual panel */}
          <div style={{ position: 'relative', minHeight: 220 }}>
            <ServiceVisual service={service} hovered={hovered} expanded={expanded} />
          </div>
        </div>

        {/* Expanded detail */}
        <div style={{ position: 'relative', paddingLeft: 'clamp(36px, 4vw, 56px)', paddingRight: 'clamp(36px, 4vw, 56px)', paddingBottom: expanded ? 'clamp(36px, 4vw, 56px)' : 0 }}>
          <AnimatePresence>
            {expanded && <ServiceDetail key="detail" service={service} />}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Main export ────────────────────────────────────────────────────────── */

export function HomepageServices() {
  const headingRef = useRef<HTMLDivElement>(null);
  const headingInView = useInView(headingRef, { once: true, margin: '-60px' });

  return (
    <section style={{ background: 'rgb(246,246,246)', paddingTop: '7rem', paddingBottom: '7rem' }}>
      <div
        style={{
          maxWidth: 1400,
          margin: '0 auto',
          paddingLeft: 'clamp(1.5rem, 3vw, 3rem)',
          paddingRight: 'clamp(1.5rem, 3vw, 3rem)',
        }}
      >
        {/* ── Section heading ── */}
        <div ref={headingRef} style={{ marginBottom: 'clamp(3rem, 7vh, 5rem)' }}>
          <div style={{ overflow: 'hidden', marginBottom: 12 }}>
            <motion.p
              initial={{ y: '110%' }}
              animate={headingInView ? { y: 0 } : {}}
              transition={{ duration: 0.62, ease: EASE }}
              style={{ fontSize: 10, letterSpacing: '0.28em', textTransform: 'uppercase', opacity: 0.35, margin: 0 }}
            >
              Capabilities
            </motion.p>
          </div>

          <div style={{ overflow: 'hidden', marginBottom: 20 }}>
            <motion.h2
              initial={{ y: '110%' }}
              animate={headingInView ? { y: 0 } : {}}
              transition={{ duration: 0.78, ease: EASE, delay: 0.05 }}
              style={{
                fontSize: 'clamp(38px, 5vw, 76px)',
                fontWeight: 700,
                letterSpacing: '-0.035em',
                lineHeight: 1.03,
                margin: 0,
              }}
            >
              What We Bring
              <br />
              To The Table
            </motion.h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={headingInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.62, delay: 0.16, ease: EASE }}
              style={{ fontSize: 14, opacity: 0.42, maxWidth: 440, lineHeight: 1.72, margin: 0 }}
            >
              We combine strategy, creativity, technology, and storytelling to build
              brands that leave lasting impressions.
            </motion.p>

            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={headingInView ? { scaleX: 1, opacity: 1 } : {}}
              transition={{ duration: 0.7, delay: 0.26, ease: EASE }}
              style={{ flex: 1, height: 1, background: 'rgba(0,0,0,0.09)', transformOrigin: 'left' }}
              className="hidden sm:block"
            />

            <motion.span
              initial={{ opacity: 0 }}
              animate={headingInView ? { opacity: 0.28 } : {}}
              transition={{ duration: 0.5, delay: 0.38 }}
              style={{ fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', flexShrink: 0 }}
            >
              {services.length} capabilities
            </motion.span>
          </div>
        </div>

        {/* ── Service cards ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {services.map((service, i) => (
            <ServiceCard key={service.number} service={service} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

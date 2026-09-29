import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { services } from '../components/ServicesGrid';
import projectsData from '../data/projects.json';

/* ─── /about — who we are, what we do, why ─────────────────────────────────
 * The plain facts, in the site's own voice (collab, short). The disciplines
 * are ServicesGrid's own list, so the two pages never disagree; the long
 * version of how we work is The Box. Brands are listed as "on the table",
 * not as "clients": some of the work is concept work (Apptile's Behance
 * case is marked Concept).
 * ────────────────────────────────────────────────────────────────────────── */

const RED = '#EA3323';
const INK = 'rgb(10,10,10)';
const EASE = [0.22, 1, 0.36, 1] as const;

type Project = (typeof projectsData)[0] & { hidden?: boolean; page?: boolean };
const BRANDS = (projectsData as Project[]).filter((p) => !p.hidden);

const label: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 10,
  fontWeight: 600,
  letterSpacing: '0.24em',
  textTransform: 'uppercase',
};
const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#EA3323]';

/** Materialises as it enters: opacity, a short rise, a little blur. */
function Reveal({ children, delay = 0, reduceMotion }: { children: ReactNode; delay?: number; reduceMotion: boolean }) {
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 24, filter: 'blur(6px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ duration: 0.8, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

/** A chapter: eyebrow with the red square on the left, content right. */
function Chapter({ eyebrow, children, reduceMotion }: { eyebrow: string; children: ReactNode; reduceMotion: boolean }) {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-12" style={{ gap: 'clamp(16px, 3vw, 48px)', borderTop: '1px solid rgba(10,10,10,0.14)', padding: 'clamp(32px, 6vh, 64px) 0' }}>
      <div className="lg:col-span-3">
        <Reveal reduceMotion={reduceMotion}>
          <span style={{ ...label, display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 6, height: 6, background: RED, display: 'inline-block' }} />
            {eyebrow}
          </span>
        </Reveal>
      </div>
      <div className="lg:col-span-9">{children}</div>
    </section>
  );
}

const big: React.CSSProperties = { margin: 0, fontFamily: 'var(--font-sans)', fontSize: 'clamp(26px, 3vw, 48px)', fontWeight: 500, letterSpacing: '-0.03em', lineHeight: 1.12 };

export function AboutPage() {
  const reduceMotion = useReducedMotion() ?? false;
  return (
    <main style={{ minHeight: '100vh', background: '#fff', color: INK, padding: 'clamp(7rem, 15vh, 10rem) clamp(1rem, 4vw, 5rem) clamp(5rem, 10vh, 8rem)' }}>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        {/* The Swiss row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24 }}>
          <div className="overflow-hidden">
            <motion.h1
              initial={reduceMotion ? false : { y: '110%' }}
              animate={{ y: 0 }}
              transition={{ duration: 0.8, ease: EASE }}
              style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(48px, 8vw, 150px)', fontWeight: 500, letterSpacing: '-0.045em', lineHeight: 0.94, margin: 0 }}
            >
              Every skill.
              <br />
              One box.
            </motion.h1>
          </div>
          <div className="overflow-hidden" style={{ flexShrink: 0, paddingTop: '0.8em' }}>
            <motion.p initial={reduceMotion ? false : { y: '110%' }} animate={{ y: 0 }} transition={{ duration: 0.6, ease: EASE, delay: 0.1 }} style={{ ...label, margin: 0, textAlign: 'right', lineHeight: 1.6 }}>
              About
              <br />
              1Red
            </motion.p>
          </div>
        </div>
        <motion.div
          initial={reduceMotion ? false : { scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.9, delay: 0.2, ease: EASE }}
          style={{ height: 1, background: INK, transformOrigin: 'left center', margin: 'clamp(24px, 4vh, 40px) 0 clamp(32px, 6vh, 64px)' }}
        />
        <Reveal reduceMotion={reduceMotion} delay={0.3}>
          <p style={{ ...big, maxWidth: 1000, fontSize: 'clamp(22px, 2.4vw, 38px)', opacity: 0.8, marginBottom: 'clamp(48px, 9vh, 96px)' }}>
            1Red is a creative collective. Strategists, designers, animators, developers and editors who take a brief on together, from the first idea to the last frame.
          </p>
        </Reveal>

        <Chapter eyebrow="Who we are" reduceMotion={reduceMotion}>
          <Reveal reduceMotion={reduceMotion}>
            <p style={big}>
              Not a chain of hand-offs. The person who names your brand sits next to the one who animates it and the one who builds your site, so nothing gets lost between them.
            </p>
            <p style={{ margin: 'clamp(16px, 3vh, 28px) 0 0', fontSize: 'clamp(15px, 1.2vw, 18px)', lineHeight: 1.6, opacity: 0.6, maxWidth: 640 }}>
              Small enough to talk to. Wide enough to do all of it. You get one team, one conversation and work that feels like it came from the same hands.
            </p>
          </Reveal>
        </Chapter>

        <Chapter eyebrow="What we do" reduceMotion={reduceMotion}>
          <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 'clamp(24px, 3vw, 40px)' }}>
            {services.map((s, i) => (
              <Reveal key={s.number} reduceMotion={reduceMotion} delay={i * 0.08}>
                <div style={{ borderTop: `2px solid ${RED}`, paddingTop: 18 }}>
                  <span style={{ ...label, color: RED }}>{s.number}</span>
                  <h3 style={{ margin: '10px 0 0', fontFamily: 'var(--font-sans)', fontSize: 'clamp(22px, 1.9vw, 30px)', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.05 }}>{s.title}</h3>
                  <p style={{ margin: '12px 0 0', fontSize: 15, lineHeight: 1.55, opacity: 0.6 }}>{s.description}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal reduceMotion={reduceMotion}>
            <Link to="/the-box" className={focusRing} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginTop: 'clamp(24px, 4vh, 40px)', textDecoration: 'none', color: INK }}>
              <span style={{ ...label, fontSize: 11, letterSpacing: '0.16em' }}>See how we work, inside The Box</span>
              <ArrowRight size={16} strokeWidth={2} color={RED} />
            </Link>
          </Reveal>
        </Chapter>

        <Chapter eyebrow="Why we do it" reduceMotion={reduceMotion}>
          <Reveal reduceMotion={reduceMotion}>
            <p style={{ ...big, fontSize: 'clamp(30px, 3.8vw, 64px)', lineHeight: 1.04, letterSpacing: '-0.04em' }}>
              The best ideas need every skill in the room from day one. A mark, a site and a campaign should feel like one voice. <span style={{ color: RED }}>With us, they do.</span>
            </p>
          </Reveal>
        </Chapter>

        <Chapter eyebrow="On the table lately" reduceMotion={reduceMotion}>
          <ul style={{ padding: 0, margin: 0 }}>
            {BRANDS.map((b, i) => {
              const row = (
                <span style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, padding: '14px 0', borderBottom: '1px solid rgba(10,10,10,0.08)' }}>
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(24px, 2.6vw, 42px)', fontWeight: 700, letterSpacing: '-0.035em' }}>{b.title}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ ...label, fontSize: 9, opacity: 0.45 }}>{b.category}</span>
                    {b.page && <ArrowUpRight size={15} strokeWidth={2} color={RED} />}
                  </span>
                </span>
              );
              return (
                <motion.li
                  key={b.id}
                  initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-6% 0px' }}
                  transition={{ duration: 0.6, ease: EASE, delay: i * 0.05 }}
                  style={{ listStyle: 'none' }}
                >
                  {b.page ? (
                    <Link to={`/case-studies/${b.id}`} className={focusRing} style={{ textDecoration: 'none', color: INK }}>
                      {row}
                    </Link>
                  ) : (
                    row
                  )}
                </motion.li>
              );
            })}
          </ul>
        </Chapter>

        <Chapter eyebrow="The people" reduceMotion={reduceMotion}>
          <Reveal reduceMotion={reduceMotion}>
            <img src="/images/team-poster.jpg" alt="The 1Red team, drawn in line" loading="lazy" style={{ display: 'block', width: '100%', height: 'auto', border: '1px solid rgba(10,10,10,0.14)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16, flexWrap: 'wrap', marginTop: 16 }}>
              <p style={{ margin: 0, fontFamily: 'var(--font-sans)', fontStyle: 'italic', fontWeight: 300, fontSize: 'clamp(18px, 1.8vw, 28px)' }}>Everyone you need, at one table.</p>
              <Link to="/the-box" className={focusRing} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: INK }}>
                <span style={{ ...label, fontSize: 11, letterSpacing: '0.16em' }}>Meet the table</span>
                <ArrowRight size={16} strokeWidth={2} color={RED} />
              </Link>
            </div>
          </Reveal>
        </Chapter>

        <section style={{ borderTop: `1px solid ${INK}`, padding: 'clamp(48px, 10vh, 112px) 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 32, flexWrap: 'wrap' }}>
          <Reveal reduceMotion={reduceMotion}>
            <p style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: 'clamp(36px, 5vw, 88px)', fontWeight: 500, letterSpacing: '-0.04em', lineHeight: 0.98 }}>
              Got an idea that
              <br />
              needs every skill?
            </p>
          </Reveal>
          <Reveal reduceMotion={reduceMotion} delay={0.1}>
            <Link
              to="/contact"
              className={`${focusRing} btn-corners`}
              style={{ ...label, fontSize: 12, letterSpacing: '0.16em', display: 'inline-flex', alignItems: 'center', gap: 10, padding: '18px 28px', background: RED, color: 'white', textDecoration: 'none' }}
            >
              Start a project <ArrowUpRight size={15} strokeWidth={2} />
            </Link>
          </Reveal>
        </section>
      </div>
    </main>
  );
}

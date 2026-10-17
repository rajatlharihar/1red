import { motion } from 'motion/react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { FillLink } from '../home/FillLink';
import { INTRO, WHO, WHAT, WHY } from './shared';
import { InkCard, InkRule, HandNote, Prop, TILTS, paperTiles, RED, INK } from '../paper/Paper';

/* ─── /about on the paper (Rajat, 2026-10-17) ─────────────────────────────
 * The same language as the red flags table: cream tiled paper, red type,
 * black ink, red ink rules edge to edge, drawn props, and what's in the box
 * as three ink cards a little turned. Copy is the existing About copy
 * (shared.tsx); nothing new was written. The previous white layout is
 * AboutHero + AboutCTA, still exported. */

const EASE = [0.22, 1, 0.36, 1] as const;
const NOTES = ['the mark.', 'the site.', 'the noise.'];

export function AboutPaper({ reduceMotion }: { reduceMotion: boolean }) {
  const wrap = { maxWidth: 1400, margin: '0 auto', padding: '0 clamp(1rem, 4vw, 5rem)', position: 'relative' as const };
  const rise = (delay = 0) =>
    reduceMotion ? {} : { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-10% 0px' }, transition: { duration: 0.8, ease: EASE, delay } };
  return (
    <main style={{ ...paperTiles, position: 'relative', overflowX: 'clip', color: INK, paddingBottom: 'clamp(5rem, 12vh, 8rem)' }}>
      <Prop src="/images/cta/box.png" style={{ right: 'clamp(-30px, 2vw, 60px)', top: 'clamp(90px, 11vh, 130px)', width: 'clamp(200px, 22vw, 340px)', transform: 'rotate(-6deg)' }} />

      {/* Hero */}
      <section style={{ ...wrap, paddingTop: 'clamp(7rem, 15vh, 10rem)' }}>
        <div className="overflow-hidden">
          <motion.h1
            initial={reduceMotion ? false : { y: '110%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.8, ease: EASE }}
            style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(56px, 9vw, 168px)', fontWeight: 500, letterSpacing: '-0.045em', lineHeight: 0.92, margin: 0 }}
          >
            Every skill.
            <br />
            One <span style={{ color: RED }}>box.</span>
          </motion.h1>
        </div>
        <HandNote size={28} style={{ marginTop: 14 }}>about 1red.</HandNote>
        <InkRule bleed seed={5} style={{ margin: 'clamp(24px, 4vh, 40px) 0' }} />
        <motion.p {...rise(0.2)} style={{ margin: 0, maxWidth: 980, fontFamily: 'var(--font-sans)', fontSize: 'clamp(22px, 2.4vw, 38px)', fontWeight: 500, letterSpacing: '-0.03em', lineHeight: 1.15, color: RED }}>
          {INTRO}
        </motion.p>
      </section>

      {/* Who we are */}
      <section style={{ ...wrap, marginTop: 'clamp(4rem, 10vh, 7rem)' }}>
        <InkRule bleed seed={19} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))', gap: 'clamp(24px, 4vw, 64px)', paddingTop: 'clamp(28px, 5vh, 48px)' }}>
          <motion.div {...rise()}>
            <HandNote size={22}>{WHO.eyebrow.toLowerCase()}.</HandNote>
            <h2 style={{ margin: '10px 0 0', fontFamily: 'var(--font-sans)', fontSize: 'clamp(34px, 4vw, 64px)', fontWeight: 500, letterSpacing: '-0.04em', lineHeight: 0.98, color: RED }}>{WHO.line}</h2>
          </motion.div>
          <motion.p {...rise(0.1)} style={{ margin: 0, alignSelf: 'end', fontSize: 'clamp(16px, 1.25vw, 20px)', lineHeight: 1.6 }}>{WHO.body}</motion.p>
        </div>
      </section>

      {/* What's in the box: three cards on the table */}
      <section style={{ ...wrap, marginTop: 'clamp(4rem, 10vh, 7rem)' }}>
        <InkRule bleed seed={29} />
        <motion.div {...rise()} style={{ paddingTop: 'clamp(28px, 5vh, 48px)' }}>
          <HandNote size={22}>{WHAT.eyebrow.toLowerCase()}.</HandNote>
          <h2 style={{ margin: '10px 0 0', fontFamily: 'var(--font-sans)', fontSize: 'clamp(34px, 4vw, 64px)', fontWeight: 500, letterSpacing: '-0.04em', lineHeight: 0.98, color: RED }}>{WHAT.line}</h2>
        </motion.div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 'clamp(20px, 2.6vw, 40px)', marginTop: 'clamp(28px, 5vh, 48px)' }}>
          {WHAT.list.map((w, i) => (
            <motion.div key={w.title} {...rise(i * 0.08)}>
              <InkCard tilt={TILTS[i]} pad={0} style={{ aspectRatio: '6 / 5' }}>
                <div style={{ height: '100%', padding: 'clamp(18px, 2vw, 28px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'var(--font-hand)', fontSize: 44, lineHeight: 1, color: RED }}>0{i + 1}</span>
                  <div>
                    <HandNote size={22} style={{ marginBottom: 6 }}>{NOTES[i]}</HandNote>
                    <h3 style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: 'clamp(22px, 2vw, 30px)', fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.05 }}>{w.title}</h3>
                    <p style={{ margin: '8px 0 0', fontSize: 'clamp(15px, 1.1vw, 17px)', lineHeight: 1.45 }}>{w.line}</p>
                  </div>
                </div>
              </InkCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Why we bother */}
      <section style={{ ...wrap, marginTop: 'clamp(4rem, 10vh, 7rem)' }}>
        <Prop src="/images/cta/megaphone.png" style={{ right: 'clamp(0px, 3vw, 60px)', top: 'clamp(40px, 6vh, 80px)', width: 'clamp(150px, 15vw, 230px)', transform: 'rotate(6deg)' }} />
        <InkRule bleed seed={43} />
        <motion.div {...rise()} style={{ paddingTop: 'clamp(28px, 5vh, 48px)', maxWidth: 900 }}>
          <HandNote size={22}>{WHY.eyebrow.toLowerCase()}.</HandNote>
          <h2 style={{ margin: '10px 0 0', fontFamily: 'var(--font-sans)', fontSize: 'clamp(34px, 4vw, 64px)', fontWeight: 500, letterSpacing: '-0.04em', lineHeight: 0.98, color: RED }}>{WHY.line}</h2>
          <p style={{ margin: '18px 0 0', fontSize: 'clamp(16px, 1.25vw, 20px)', lineHeight: 1.6, maxWidth: 640 }}>{WHY.body}</p>
        </motion.div>
      </section>

      {/* Close */}
      <section style={{ ...wrap, marginTop: 'clamp(4rem, 10vh, 7rem)' }}>
        <InkRule bleed seed={61} />
        <div style={{ paddingTop: 'clamp(40px, 8vh, 88px)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 32, flexWrap: 'wrap' }}>
          <motion.p {...rise()} style={{ margin: 0, fontFamily: 'var(--font-sans)', fontSize: 'clamp(40px, 6vw, 104px)', fontWeight: 500, letterSpacing: '-0.045em', lineHeight: 0.96 }}>
            Enough about us.
            <br />
            <span style={{ color: RED }}>What are you making?</span>
          </motion.p>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <FillLink to="/contact" icon={<ArrowUpRight size={15} strokeWidth={2} />}>Start a project</FillLink>
            <FillLink to="/the-box" outline icon={<ArrowRight size={15} strokeWidth={2} />}>Meet the table</FillLink>
          </div>
        </div>
      </section>
    </main>
  );
}

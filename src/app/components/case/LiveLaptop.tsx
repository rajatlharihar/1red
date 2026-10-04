import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { ArrowUpRight, MousePointer2 } from 'lucide-react';
import { usePinned, smooth, INK } from '../about/shared';

/* ─── The live site in a laptop (after nknstudio.com's Yui page) ───────────
 * A pinned stretch in which the laptop lifts from lying back (rotateX 24°)
 * to facing you, scroll-driven on the site's one glide. The screen is a
 * real iframe of the live site, laid out at a 1440 px desktop width and
 * scaled to the display, so it is the actual site, not a picture of it.
 * The iframe ignores the pointer until "Take it for a spin" is clicked,
 * so the page's own scroll never gets swallowed by the embed.
 * ────────────────────────────────────────────────────────────────────────── */

const RED = '#EB3F43';
const SECTION_VH = 200;
const VIRTUAL_W = 1440;
const VIRTUAL_H = 900;

export function LiveLaptop({ url, dashboard, label, title, deck }: { url: string; dashboard?: string; label: string; title: string; deck: string }) {
  const reduce = !!useReducedMotion();
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const apply = () => setNarrow(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);
  const still = reduce || narrow;

  const wrapRef = useRef<HTMLElement>(null);
  const lidRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  const [live, setLive] = useState(false);
  const [tab, setTab] = useState<'site' | 'dash'>('site');

  useEffect(() => {
    const el = screenRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setScale(e.contentRect.width / VIRTUAL_W));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  usePinned(
    wrapRef,
    SECTION_VH,
    (p) => {
      const t = smooth(0, 0.55, p);
      if (lidRef.current) lidRef.current.style.transform = `perspective(1400px) rotateX(${((1 - t) * 24).toFixed(2)}deg) scale(${(0.92 + 0.08 * t).toFixed(4)})`;
    },
    still,
  );

  const src = tab === 'dash' && dashboard ? dashboard : url;

  return (
    <section ref={wrapRef} aria-label={title} style={{ height: still ? 'auto' : `${SECTION_VH}vh`, background: '#FFFFFF', margin: 'clamp(3rem, 8vh, 6rem) 0' }}>
      <div
        style={{
          position: still ? 'relative' : 'sticky',
          top: 0,
          minHeight: still ? 0 : '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 'clamp(4.5rem, 9vh, 6rem) clamp(1rem, 4vw, 5rem) 2rem',
          boxSizing: 'border-box',
          color: INK,
        }}
      >
        <div style={{ width: '100%', maxWidth: 1100, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 20, flexWrap: 'wrap', marginBottom: 'clamp(1rem, 3vh, 2rem)' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(30px, 4vw, 64px)', fontWeight: 500, letterSpacing: '-0.035em', lineHeight: 1, margin: 0 }}>{title}</h2>
            <p style={{ margin: '10px 0 0', maxWidth: 520, fontSize: 'clamp(14px, 1.1vw, 17px)', lineHeight: 1.5, opacity: 0.55 }}>{deck}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {dashboard && (
              <div role="tablist" style={{ display: 'inline-flex', padding: 3, borderRadius: 12, background: 'rgba(10,10,10,0.05)' }}>
                {(['site', 'dash'] as const).map((k) => (
                  <button
                    key={k}
                    role="tab"
                    aria-selected={tab === k}
                    onClick={() => setTab(k)}
                    className="btn-corners"
                    style={{ border: 0, cursor: 'pointer', padding: '8px 14px', fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', background: tab === k ? '#fff' : 'transparent', color: tab === k ? RED : INK, boxShadow: tab === k ? '0 2px 8px rgba(0,0,0,0.08)' : 'none' }}
                  >
                    {k === 'site' ? 'Website' : 'Staff dashboard'}
                  </button>
                ))}
              </div>
            )}
            <a href={src} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: INK, textDecoration: 'none', padding: '9px 4px' }}>
              {label} <ArrowUpRight size={13} strokeWidth={2} color={RED} />
            </a>
          </div>
        </div>

        {/* The laptop: lid (bezel + screen) over a thin base. */}
        <div style={{ width: '100%', maxWidth: still ? 1000 : 'min(1000px, calc((100vh - 300px) * 1.5))' }}>
          <div ref={lidRef} style={{ transformOrigin: '50% 100%', transform: still ? 'none' : 'perspective(1400px) rotateX(24deg) scale(0.92)', willChange: still ? undefined : 'transform' }}>
            <div style={{ background: '#121212', borderRadius: '18px 18px 4px 4px', padding: 'clamp(8px, 1.4%, 16px) clamp(8px, 1.4%, 16px) clamp(10px, 1.8%, 20px)', boxShadow: '0 0 0 1px #2a2a2a inset, 0 30px 60px rgba(0,0,0,0.18)' }}>
              <div ref={screenRef} style={{ position: 'relative', aspectRatio: `${VIRTUAL_W} / ${VIRTUAL_H}`, overflow: 'hidden', borderRadius: 4, background: '#fff' }}>
                <iframe
                  key={src}
                  src={src}
                  title={`${label}, live`}
                  loading="lazy"
                  allow="clipboard-write"
                  style={{ position: 'absolute', top: 0, left: 0, width: VIRTUAL_W, height: VIRTUAL_H, border: 0, transform: `scale(${scale})`, transformOrigin: '0 0', pointerEvents: live ? 'auto' : 'none' }}
                />
                {!live && (
                  <button
                    onClick={() => setLive(true)}
                    aria-label="Use the live site"
                    style={{ position: 'absolute', inset: 0, border: 0, cursor: 'pointer', background: 'linear-gradient(to top, rgba(10,10,10,0.35), transparent 45%)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: '4%' }}
                  >
                    <span className="btn-corners" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: RED, color: '#fff', padding: '12px 18px', fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                      <MousePointer2 size={14} strokeWidth={2} /> Take it for a spin
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
          {/* Base: a slab a touch wider than the lid, with the thumb notch. */}
          <div style={{ position: 'relative', margin: '0 -5%', height: 'clamp(10px, 1.6vw, 18px)', background: 'linear-gradient(#e6e6e6, #bdbdbd)', borderRadius: '0 0 14px 14px', boxShadow: '0 18px 30px rgba(0,0,0,0.12)' }}>
            <div style={{ position: 'absolute', left: '50%', top: 0, transform: 'translateX(-50%)', width: '14%', height: '45%', background: '#cfcfcf', borderRadius: '0 0 8px 8px' }} />
          </div>
        </div>
      </div>
    </section>
  );
}

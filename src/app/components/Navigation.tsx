import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { useScroll, useMotionValue, useSpring, useTransform, motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Home, Monitor, Camera, Menu, X } from 'lucide-react';
import { Logo } from './Logo';

/* ─── 1Red floating navigation — two independent glass islands ────────────
 * Deliberately not one bar spanning the viewport: a small logo island
 * (top-left) and a segmented nav island (top-right) read as distinct
 * floating instruments rather than a conventional attached navbar.
 *
 * The signature interaction is the magnetic indicator inside the nav
 * island: one shared `layoutId` element slides/resizes between whichever
 * segment is hovered (falling back to the active route when nothing is
 * hovered). Motion's layout animations use FLIP + spring physics, which is
 * what makes this feel like liquid glass rather than a CSS `transition`
 * cross-fade — it's the single biggest "smoothness" lever available here,
 * and it doubles as a genuinely distinctive piece of motion design rather
 * than decoration for its own sake.
 *
 * Everything else is driven through motion values (never React state, never
 * per-frame setState) so scrolling triggers zero re-renders:
 *  - `entranceT` — homepage-only reveal after the hero is scrolled past,
 *    spring-smoothed so fast/jerky scrolling never yanks it (other routes
 *    render at full presence immediately — there's no hero to wait for).
 *  - `compactT` — direction-aware "reduce footprint while reading" state.
 *    Scrolling down past a small threshold nudges it to 1 (slightly
 *    smaller, slightly higher, slightly less opaque); any upward scroll
 *    immediately relaxes it back to 0. A touch of hysteresis (min delta,
 *    always-relax near the very top) keeps it from flickering on tiny
 *    sub-pixel scroll noise. This also doubles as the "adapt near content"
 *    behavior the brief asks for — true per-section collision detection
 *    would require instrumenting every other section with observers, which
 *    is out of scope for a nav-only change and would risk exactly the kind
 *    of scroll jank this brief explicitly rules out.
 * Both motion values feed transform/opacity only (translateY, scale,
 * opacity) — never layout properties — so there's no reflow, ever.
 * ────────────────────────────────────────────────────────────────────────── */

const RED = '#EA3323';
const EASE = [0.22, 1, 0.36, 1] as const;
const SPRING = { type: 'spring', stiffness: 420, damping: 34, mass: 0.6 } as const;

const NAV_ITEMS = [
  { label: 'Home', path: '/', icon: Home },
  { label: 'Studio', path: '/studio', icon: Camera },
];

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EA3323] focus-visible:rounded-[10px]';

/* Fluid stagger for the mobile menu items */
const listVariants = {
  open: { transition: { staggerChildren: 0.06, delayChildren: 0.06 } },
  closed: { transition: { staggerChildren: 0.04, staggerDirection: -1 } },
};
const itemVariants = {
  open: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { type: 'spring', stiffness: 320, damping: 26 } },
  closed: { opacity: 0, y: -14, filter: 'blur(5px)' },
};

/* Shared glass recipe for both islands — light, warm-tinted, thin
   red-hinted border, soft shadow with a bright inset top edge. */
const glassStyle: React.CSSProperties = {
  background: 'rgba(255,253,251,0.74)',
  backdropFilter: 'blur(18px) saturate(165%)',
  WebkitBackdropFilter: 'blur(18px) saturate(165%)',
  border: '1px solid rgba(234,51,35,0.14)',
  borderRadius: 14,
  boxShadow: '0 20px 44px rgba(0,0,0,0.08), 0 2px 10px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.7)',
};

/* ─── Desktop nav segment — icon + label, magnetic shared-layout pill ───── */

function NavSegment({
  item,
  active,
  indicated,
  onHover,
}: {
  item: (typeof NAV_ITEMS)[0];
  active: boolean;
  indicated: boolean;
  onHover: () => void;
}) {
  const Icon = item.icon;
  const lit = active || indicated;

  return (
    <Link
      to={item.path}
      aria-current={active ? 'page' : undefined}
      onMouseEnter={onHover}
      onFocus={onHover}
      className={focusRing}
      style={{ position: 'relative', display: 'block', textDecoration: 'none' }}
    >
      {/* Magnetic indicator — one shared element that slides/resizes to
          whichever segment is hovered, or the active route otherwise. */}
      {indicated && (
        <motion.span
          layoutId="nav-indicator"
          transition={SPRING}
          className="btn-corners"
          style={{
            position: 'absolute',
            inset: 4,
            background: active ? 'rgba(234,51,35,0.08)' : 'rgba(0,0,0,0.045)',
            border: active ? '1px solid rgba(234,51,35,0.16)' : '1px solid transparent',
            zIndex: 0,
          }}
        />
      )}

      <span className="relative z-10 flex flex-col items-center" style={{ padding: '12px 16px 10px', gap: 5 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Icon size={14} strokeWidth={1.5} color={active ? RED : `rgba(10,10,10,${indicated ? 0.85 : 0.55})`} style={{ transition: 'color 200ms ease-out' }} />
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 13,
              fontWeight: 500,
              whiteSpace: 'nowrap',
              color: active ? 'rgb(10,10,10)' : `rgba(10,10,10,${indicated ? 0.85 : 0.55})`,
              transition: 'color 200ms ease-out',
            }}
          >
            {item.label}
          </span>
        </span>
        {/* Precise-instrument active marker — a hairline, not a fill */}
        <span
          style={{
            width: active ? 12 : 0,
            height: 2,
            background: RED,
            borderRadius: 1,
            transition: 'width 260ms cubic-bezier(0.22,1,0.36,1)',
          }}
        />
      </span>
    </Link>
  );
}

export function Navigation() {
  const { scrollY } = useScroll();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [hoverPath, setHoverPath] = useState<string | null>(null);
  const reduceMotion = useReducedMotion() ?? false;
  const isHome = location.pathname === '/';
  const indicatorPath = hoverPath ?? location.pathname;

  /* ── Entrance: homepage reveals after the hero; other routes are just present.
     Spring-smoothed so fast/jerky scrolling can't yank it around. ── */
  const entranceRaw = useMotionValue(isHome && !reduceMotion ? 0 : 1);
  const entranceT = useSpring(entranceRaw, { stiffness: 260, damping: 30, mass: 0.5 });

  /* ── Compact-on-scroll-down, relax-on-scroll-up, with a little hysteresis ── */
  const compactRaw = useMotionValue(0);
  const compactT = useSpring(compactRaw, { stiffness: 300, damping: 27, mass: 0.5 });
  const lastYRef = useRef(0);

  /* ── The footer carries the mark itself, so the logo island steps aside
     while the footer is on screen: one logo at a time. ── */
  const footerRaw = useMotionValue(0);
  const footerT = useSpring(footerRaw, { stiffness: 220, damping: 30, mass: 0.6 });
  useEffect(() => {
    const footer = document.querySelector('footer');
    if (!footer) return;
    // Bottom margin -1px: a footer that merely touches the viewport's bottom
    // edge (a page that is exactly 100vh, like /studio) counts as
    // intersecting otherwise, and the island would hide at the top of it.
    const io = new IntersectionObserver((e) => footerRaw.set(e[0].isIntersecting ? 1 : 0), { rootMargin: '-120px 0px -1px 0px' });
    io.observe(footer);
    return () => io.disconnect();
  }, [footerRaw, location.pathname]);

  useEffect(() => {
    lastYRef.current = scrollY.get();
    const unsub = scrollY.on('change', (y) => {
      if (isHome) {
        const p = Math.max(0, Math.min(1, (y - 90) / 60));
        entranceRaw.set(reduceMotion ? 1 : p);
      }

      if (reduceMotion) return; // stay fully settled, no compact/expand motion at all

      const delta = y - lastYRef.current;
      lastYRef.current = y;
      if (y < 32) {
        compactRaw.set(0);
      } else if (delta > 2) {
        compactRaw.set(1);
      } else if (delta < -2) {
        compactRaw.set(0);
      }
    });
    return unsub;
  }, [scrollY, isHome, reduceMotion, entranceRaw, compactRaw]);

  /* Close the mobile menu on route change */
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const islandOpacity = useTransform([entranceT, compactT], (v) => (v as number[])[0] * (1 - (v as number[])[1] * 0.1));
  const islandY = useTransform(compactT, (v: number) => -v * 5);
  const islandScale = useTransform(compactT, (v: number) => 1 - v * 0.055);
  const logoOpacity = useTransform([islandOpacity, footerT], (v) => (v as number[])[0] * (1 - (v as number[])[1]));
  const logoScale = useTransform([islandScale, footerT], (v) => (v as number[])[0] * (1 - (v as number[])[1] * 0.12));
  const logoPointer = useTransform([entranceT, footerT], (v) => ((v as number[])[0] > 0.15 && (v as number[])[1] < 0.5 ? 'auto' : 'none')) as unknown as 'auto' | 'none';
  const pointerEvents = useTransform(entranceT, (v: number) => (v > 0.15 ? 'auto' : 'none')) as unknown as 'auto' | 'none';

  return (
    <nav
      aria-label="Primary"
      style={{
        position: 'fixed',
        inset: 0,
        height: 0,
        zIndex: 70,
        pointerEvents: 'none',
      }}
    >
      {/* ══════════ Logo island — top-left, floats independently; steps aside for the footer ══════════ */}
      <motion.div
        style={{
          position: 'fixed',
          top: 'clamp(14px, 2.6vw, 26px)',
          left: 'clamp(14px, 2.6vw, 26px)',
          opacity: logoOpacity,
          y: islandY,
          scale: logoScale,
          pointerEvents: logoPointer,
          ...glassStyle,
        }}
      >
        <Link
          to="/"
          aria-label="1Red — Home"
          className={focusRing}
          style={{ display: 'flex', alignItems: 'center', lineHeight: 0, textDecoration: 'none', padding: '10px 12px' }}
        >
          <Logo width={60} />
        </Link>
      </motion.div>

      {/* ══════════ Desktop nav island — top-right, segmented, magnetic indicator ══════════ */}
      <motion.div
        className="hidden lg:block"
        onMouseLeave={() => setHoverPath(null)}
        style={{
          position: 'fixed',
          top: 'clamp(14px, 2.6vw, 26px)',
          right: 'clamp(14px, 2.6vw, 26px)',
          opacity: islandOpacity,
          y: islandY,
          scale: islandScale,
          pointerEvents,
          ...glassStyle,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'stretch' }}>
          {NAV_ITEMS.map((item, i) => (
            <div key={item.path} style={{ display: 'flex', alignItems: 'center' }}>
              {i > 0 && <span style={{ width: 1, alignSelf: 'stretch', margin: '10px 0', background: 'rgba(0,0,0,0.08)' }} />}
              <NavSegment
                item={item}
                active={location.pathname === item.path}
                indicated={indicatorPath === item.path}
                onHover={() => setHoverPath(item.path)}
              />
            </div>
          ))}
        </div>
      </motion.div>

      {/* ══════════ Mobile: compact boxy trigger, top-right ══════════ */}
      <motion.div
        className="flex lg:hidden"
        style={{
          position: 'fixed',
          top: 'clamp(14px, 4vw, 20px)',
          right: 'clamp(14px, 4vw, 20px)',
          opacity: islandOpacity,
          y: islandY,
          scale: islandScale,
          pointerEvents,
        }}
      >
        <button
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className={`${focusRing} btn-corners`}
          style={{
            width: 48,
            height: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'background 260ms ease-out, border-color 260ms ease-out',
            ...glassStyle,
            borderRadius: undefined,
            background: open ? RED : glassStyle.background,
            border: open ? '1px solid transparent' : glassStyle.border,
          }}
        >
          <span style={{ position: 'relative', width: 18, height: 18, display: 'block' }}>
            <Menu
              size={18}
              strokeWidth={1.75}
              color={open ? 'white' : 'rgb(10,10,10)'}
              style={{
                position: 'absolute',
                inset: 0,
                transition: 'transform 300ms ease-in-out, opacity 300ms ease-in-out',
                transform: open ? 'scale(0) rotate(180deg)' : 'scale(1) rotate(0deg)',
                opacity: open ? 0 : 1,
              }}
            />
            <X
              size={18}
              strokeWidth={1.75}
              color="white"
              style={{
                position: 'absolute',
                inset: 0,
                transition: 'transform 300ms ease-in-out, opacity 300ms ease-in-out',
                transform: open ? 'scale(1) rotate(0deg)' : 'scale(0) rotate(-180deg)',
                opacity: open ? 1 : 0,
              }}
            />
          </span>
        </button>
      </motion.div>

      {/* Mobile expanded panel — same object, same glass */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="lg:hidden"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={reduceMotion ? { duration: 0.01 } : SPRING}
            style={{
              position: 'fixed',
              top: 'clamp(66px, 14vw, 76px)',
              left: 'clamp(14px, 4vw, 20px)',
              right: 'clamp(14px, 4vw, 20px)',
              pointerEvents: 'auto',
              padding: 8,
              ...glassStyle,
            }}
          >
            <motion.div variants={listVariants} initial="closed" animate="open" exit="closed" style={{ display: 'flex', gap: 8 }}>
              {NAV_ITEMS.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <motion.div key={item.path} variants={itemVariants} style={{ flex: 1 }}>
                    <Link
                      to={item.path}
                      onClick={() => setOpen(false)}
                      aria-label={item.label}
                      aria-current={isActive ? 'page' : undefined}
                      className={`${focusRing} btn-corners`}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        height: 58,
                        border: isActive ? '1px solid rgba(234,51,35,0.25)' : '1px solid transparent',
                        background: isActive ? 'rgba(234,51,35,0.06)' : 'transparent',
                      }}
                    >
                      <Icon size={19} strokeWidth={1.5} color={isActive ? RED : 'rgba(10,10,10,0.6)'} />
                      <span
                        style={{
                          width: isActive ? 10 : 0,
                          height: 2,
                          background: RED,
                          borderRadius: 1,
                          transition: 'width 260ms cubic-bezier(0.22,1,0.36,1)',
                        }}
                      />
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

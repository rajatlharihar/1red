import { motion } from 'motion/react';

/* ─── OneRed shared glass-card material system ───────────────────────────────
 * One material language reused by every card-based section (FlashWork's
 * project grid, Studio's principle cards, the services accordion + 3D
 * labels, Work's idea grid + process cards, the homepage HUD). Sections keep
 * their own layout, arrangement, and interaction logic — this only supplies
 * the shared "paint": surface, border, shadow, blur, and the three glossy
 * overlay layers (ambient red glow, soft top highlight, hover reflection
 * sweep). Concrete rgba/CSS strings (not custom properties) on purpose —
 * `motion`'s `animate` needs literal values to interpolate colors between
 * idle/hover states; CSS variables can't be crossfaded that way.
 * ────────────────────────────────────────────────────────────────────────── */

export const GLASS_RED = '#EA3323';

export const GLASS = {
  /** Standard backdrop-filter for a full glass surface. */
  blur: 'blur(20px) saturate(180%)',
  /** Lighter variant for cost-sensitive contexts (many simultaneous surfaces, e.g. six floating 3D labels). */
  blurLight: 'blur(14px) saturate(160%)',

  /** Base translucent fill — flat and neutral; any colour comes from what's behind it, never painted onto the fill itself. */
  surface: {
    idle: 'rgba(255,255,255,0.46)',
    hover: 'rgba(255,255,255,0.68)',
  },
  /** Denser variant for cards that sit over busy/dynamic backgrounds (video, 3D) and need stronger legibility. */
  surfaceDense: {
    idle: 'rgba(255,255,255,0.62)',
    hover: 'rgba(255,255,255,0.78)',
  },

  /** Red-tinted border — the "1Red accent as border" pattern. */
  border: {
    idle: 'rgba(234,51,35,0.16)',
    hover: 'rgba(234,51,35,0.34)',
  },

  /** Layered shadow: soft red-tinted ambient glow + tight neutral contact shadow + bright inset top edge ("light catching the material"). */
  shadow: {
    idle: '0 16px 40px rgba(234,51,35,0.1), 0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)',
    hover: '0 26px 54px rgba(234,51,35,0.16), 0 4px 14px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.75)',
  },

  /** Shared spring for hover-state transitions ("smoothest possible", per the Navigation precedent). */
  spring: { type: 'spring' as const, bounce: 0, duration: 0.4 },
} as const;

/**
 * Ambient red reflection + soft top highlight — the two "always present"
 * glossy layers. Sits ON the glass as a reflection, never mixed into the
 * card's own flat neutral fill. Render first, right after the card's
 * `animate`d background/border/shadow wrapper opens.
 */
export function GlassAmbient({ hovered }: { hovered: boolean }) {
  return (
    <>
      <motion.span
        aria-hidden
        animate={{ opacity: hovered ? 1 : 0.55 }}
        transition={GLASS.spring}
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'radial-gradient(120% 90% at 100% 0%, rgba(234,51,35,0.14), transparent 55%)',
        }}
      />
      <span
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 32%)',
          mixBlendMode: 'overlay',
        }}
      />
    </>
  );
}

/**
 * Hover-triggered diagonal light sweep — the glossy "moving reflection".
 * Transform/opacity-only (GPU-friendly), fully skipped under
 * `prefers-reduced-motion` rather than merely slowed. Render last, above any
 * card-specific decoration (e.g. a grain texture) so it reads on top.
 */
export function GlassReflectionSweep({ hovered, reduceMotion }: { hovered: boolean; reduceMotion: boolean }) {
  if (reduceMotion) return null;
  return (
    <motion.span
      aria-hidden
      animate={{ x: hovered ? '260%' : '-40%', opacity: hovered ? 1 : 0 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: 'absolute',
        top: '-50%',
        left: '-30%',
        width: '60%',
        height: '200%',
        background: 'linear-gradient(75deg, transparent 40%, rgba(255,255,255,0.35) 50%, transparent 60%)',
        pointerEvents: 'none',
        willChange: 'transform',
      }}
    />
  );
}

/**
 * Convenience wrapper for cards with no content between the ambient layers
 * and the reflection sweep — renders both, back to back, in the correct
 * paint order. Requires the wrapper to already have `position: relative`,
 * `overflow: hidden`, and its own `borderRadius`.
 */
export function GlassLayers({ hovered, reduceMotion }: { hovered: boolean; reduceMotion: boolean }) {
  return (
    <>
      <GlassAmbient hovered={hovered} />
      <GlassReflectionSweep hovered={hovered} reduceMotion={reduceMotion} />
    </>
  );
}

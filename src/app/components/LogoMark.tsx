import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Logo } from './Logo';

export function LogoMark() {
  const ref = useRef<HTMLDivElement>(null);
  // Tracks whether the footer is close enough to hide the logo
  const footerNear = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // --- Scroll-based visibility (matches nav: visible after scrollY 90–150) ---
    const updateVisibility = () => {
      const scrollVal = window.scrollY;
      // Same formula the nav uses so both reveal in perfect sync
      const navVisibility = Math.max(0, Math.min(1, (scrollVal - 90) / 60));
      const opacity = footerNear.current ? 0 : navVisibility;
      el.style.opacity = String(opacity);
    };

    let rafId: number;
    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updateVisibility);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    updateVisibility(); // set initial state (opacity: 0 before any scroll)

    // --- Footer intersection: fade out 200px before footer enters viewport ---
    const footer = document.querySelector('footer');
    let observer: IntersectionObserver | null = null;

    if (footer) {
      observer = new IntersectionObserver(
        ([entry]) => {
          footerNear.current = entry.isIntersecting;
          updateVisibility();
        },
        { rootMargin: '0px 0px 200px 0px', threshold: 0 },
      );
      observer.observe(footer);
    }

    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafId);
      observer?.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        top: 'clamp(16px, 2vw, 24px)',
        left: 'clamp(16px, 2vw, 24px)',
        zIndex: 1000,
        opacity: 0, // hidden until scroll syncs it
        transition: 'opacity 0.45s cubic-bezier(0.22,1,0.36,1)',
        willChange: 'opacity',
      }}
    >
      <motion.div
        whileHover={{ scale: 1.03, y: -2 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: 'top left' }}
      >
        <Link to="/" aria-label="1Red — Home" style={{ display: 'block', lineHeight: 0 }}>
          {/* 1.34:1 ratio → width=52 gives height≈39px — compact nav mark */}
          {/* 1.66:1 ratio → width=110 gives height≈66px — balanced nav mark */}
          <Logo width={110} />
        </Link>
      </motion.div>
    </div>
  );
}

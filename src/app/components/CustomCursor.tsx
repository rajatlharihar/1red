import { useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'motion/react';

export function CustomCursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const springX = useSpring(x, { stiffness: 800, damping: 40, mass: 0.2 });
  const springY = useSpring(y, { stiffness: 800, damping: 40, mass: 0.2 });

  useEffect(() => {
    const move = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener('mousemove', move);
    return () => window.removeEventListener('mousemove', move);
  }, [x, y]);

  return (
    <motion.div
      aria-hidden
      className="hidden md:block"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        x: springX,
        y: springY,
        translateX: '-50%',
        translateY: '-50%',
        pointerEvents: 'none',
        zIndex: 9999,
        width: 20,
        height: 20,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: '50%',
          left: 0,
          right: 0,
          height: 1.5,
          background: 'black',
          transform: 'translateY(-50%)',
        }}
      />
      <span
        style={{
          position: 'absolute',
          left: '50%',
          top: 0,
          bottom: 0,
          width: 1.5,
          background: 'black',
          transform: 'translateX(-50%)',
        }}
      />
    </motion.div>
  );
}

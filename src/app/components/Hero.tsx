import { motion } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { Logo } from './Logo';

export function Hero() {
  const scrollToHome = () => {
    const element = document.getElementById('home');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      className="h-screen flex flex-col items-center justify-center relative bg-gradient-to-br from-neutral-50 to-neutral-100 overflow-hidden"
    >
      {/* Subtle background texture */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.2 }}
        className="text-center z-10"
      >
        <motion.div
          className="mb-8 flex justify-center"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1.2 }}
        >
          <Logo width={220} />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="text-lg tracking-wide max-w-md mx-auto"
        >
          Building thoughtful brands and digital experiences.
        </motion.p>
      </motion.div>

      {/* Scroll indicator */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, 10, 0] }}
        transition={{
          opacity: { duration: 1, delay: 1.5 },
          y: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
        }}
        onClick={scrollToHome}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 hover:opacity-50 transition-opacity"
      >
        <span className="text-xs uppercase tracking-wider">Scroll</span>
        <ChevronDown size={20} />
      </motion.button>
    </section>
  );
}

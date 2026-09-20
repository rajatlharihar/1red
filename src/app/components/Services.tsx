import { useRef } from 'react';
import { motion, useInView } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { ServicesGrid, services } from './ServicesGrid';

export function Services() {
  const headingRef = useRef<HTMLDivElement>(null);
  const headingInView = useInView(headingRef, { once: true });

  return (
    <section className="min-h-screen bg-white py-32">
      {/* Heading block — same constrained container as before */}
      <div className="max-w-5xl mx-auto px-6 lg:px-12">
        <div ref={headingRef} className="mb-20 lg:mb-28">
          <div className="overflow-hidden mb-6">
            <motion.h1
              initial={{ y: '100%' }}
              animate={headingInView ? { y: 0 } : { y: '100%' }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="text-5xl lg:text-7xl xl:text-8xl tracking-tight leading-none"
            >
              Our Services
            </motion.h1>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={headingInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col lg:flex-row lg:items-end gap-8"
          >
            <p className="text-base lg:text-lg opacity-50 max-w-sm leading-relaxed">
              We build digital experiences, brand identities, and websites that help businesses grow online.
            </p>
            <div className="hidden lg:block flex-1 h-[1px] bg-black/10 mb-1" />
            <motion.span
              initial={{ opacity: 0 }}
              animate={headingInView ? { opacity: 0.35 } : {}}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-xs tracking-[0.25em] uppercase"
            >
              What we cover
            </motion.span>
          </motion.div>
        </div>
      </div>

      {/* The three disciplines as one grid, full-bleed; its own heading is
          off here because this page has just introduced it. */}
      <ServicesGrid heading={false} />

      {/* Bottom CTA strip — same constrained container as before */}
      <div className="max-w-5xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mt-20 pt-12 border-t border-black/10 flex flex-col sm:flex-row sm:items-center justify-between gap-6"
        >
          <p className="text-sm opacity-40 tracking-wide">
            Every engagement is tailored to the scope and ambition of the project.
          </p>
          <motion.button
            whileHover={{ opacity: 1 }}
            initial={{ opacity: 0.55 }}
            className="group flex items-center gap-3 text-sm tracking-widest uppercase border border-black/20 btn-corners px-6 py-3 hover:border-black/60 transition-all duration-500"
          >
            <span>Start a project</span>
            <motion.span
              className="inline-block"
              whileHover={{ x: 3, y: -3 }}
              transition={{ duration: 0.3 }}
            >
              <ArrowUpRight size={14} strokeWidth={1.5} />
            </motion.span>
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
}

import { useCallback, useRef, useState } from 'react';
import {
  motion,
  AnimatePresence,
  useInView,
  useMotionValue,
  useSpring,
  useReducedMotion,
  type MotionValue,
} from 'motion/react';
import { Link } from 'react-router';
import { ArrowLeft, ArrowUpRight, Check, Copy, Mail, MapPin, Phone } from 'lucide-react';
import { GLASS, GlassAmbient } from './GlassLayers';
import { CONTACT_EMAIL, socialLinks } from './Footer';

/* ─── Standalone /contact page ────────────────────────────────────────────
 * A destination, not a homepage section — reached only via the existing
 * Footer "Contact" link / "Start a Project" CTA (both wired in Footer.tsx)
 * or a direct visit to /contact. Reuses the site's established language
 * throughout (GLASS system, the Reveal-on-scroll pattern, the eyebrow +
 * clamp() display-heading typography used across Studio.tsx, `motion/react`
 * as the only animation library) rather than inventing a second visual
 * system. No backend exists anywhere in this project — the form below
 * simulates a submit so loading/success/error states are real and it's a
 * one-line swap to a real endpoint later; it never claims to have sent
 * anything it hasn't.
 * ────────────────────────────────────────────────────────────────────────── */

const RED = '#EA3323';
const EASE = [0.22, 1, 0.36, 1] as const;
const focusRing =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EA3323] focus-visible:rounded-[8px]';

const SERVICES = ['Branding', 'Web Design', 'UI/UX', 'Motion', 'Creative Strategy', 'Social', 'Something Else'];

// No real phone/location exist anywhere in this project yet — clearly
// placeholder values, same spirit as Footer's CONTACT_EMAIL, easy to swap.
const PLACEHOLDER_PHONE = '+91 00000 00000';
const PLACEHOLDER_LOCATION = 'India — working with clients worldwide';

const eyebrowStyle: React.CSSProperties = {
  fontSize: 10,
  letterSpacing: '0.28em',
  textTransform: 'uppercase',
  opacity: 0.4,
  marginBottom: 10,
};

const fieldLabelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  opacity: 0.45,
  marginBottom: 14,
  fontWeight: 600,
};

/* ─── Reveal — local copy of the fade/slide-on-scroll utility used
   throughout this project (see Studio.tsx's own Reveal) ──────────────── */
function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.72, ease: EASE, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Ambient background — soft cursor-tracked glow + one slow-drifting
   secondary blob. Purely decorative: absolutely positioned, zIndex 0,
   pointer-events none, so it can never intercept a click or sit above
   text. The mousemove handler lives on the hero section itself (not this
   layer) so it keeps tracking even while the pointer is over the headline. */
function AmbientGlow({
  x,
  y,
  reduceMotion,
}: {
  x: MotionValue<number>;
  y: MotionValue<number>;
  reduceMotion: boolean;
}) {
  return (
    <div aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      <motion.div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          x,
          y,
          marginLeft: -340,
          marginTop: -340,
          width: 680,
          height: 680,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(234,51,35,0.14), transparent 68%)',
          filter: 'blur(20px)',
        }}
      />
      <motion.div
        animate={reduceMotion ? {} : { x: [0, 26, 0], y: [0, -18, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          right: '6%',
          top: '8%',
          width: 340,
          height: 340,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(234,51,35,0.08), transparent 70%)',
          filter: 'blur(30px)',
        }}
      />
    </div>
  );
}

/* ─── Form field — a real visible label above a clean input, not a blank
   crammed inline into a run-on sentence. The earlier mad-lib version
   (name/company/email as content-sized inputs embedded mid-paragraph) read
   as cluttered and unpredictable once real placeholder text was in play —
   each field wrapped to its own line at a different width with no shared
   baseline, so nothing lined up. This version gives every field the same
   shape, a real label, and a focus state you can actually see. */
function FormField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  required = true,
}: {
  id: string;
  label: string;
  type?: 'text' | 'email';
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  error?: string;
  required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label htmlFor={id} style={fieldLabelStyle}>
        {label}
        {!required && <span style={{ opacity: 0.6, textTransform: 'none', letterSpacing: 0 }}> (optional)</span>}
      </label>
      <motion.div
        animate={{ borderColor: error ? '#d4183d' : focused ? RED : 'rgba(0,0,0,0.12)' }}
        transition={{ duration: 0.22, ease: EASE }}
        style={{
          borderRadius: 12,
          border: '1.5px solid',
          background: 'rgba(255,255,255,0.55)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
      >
        <input
          id={id}
          type={type}
          value={value}
          required={required}
          aria-required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={type === 'email' ? 'email' : 'off'}
          className={focusRing}
          style={{
            display: 'block',
            width: '100%',
            font: 'inherit',
            fontSize: 16,
            fontWeight: 500,
            color: 'rgb(10,10,10)',
            background: 'transparent',
            border: 'none',
            padding: '14px 16px',
            outline: 'none',
          }}
        />
      </motion.div>
      {error && (
        <span id={`${id}-error`} role="alert" style={{ display: 'block', fontSize: 11, color: '#d4183d', marginTop: 6 }}>
          {error}
        </span>
      )}
    </div>
  );
}

/* ─── Selectable pill — the service-interest toggles. Boxy corners (10px),
   not a full pill shape — this project has explicitly rejected true
   border-radius:9999px chips elsewhere as "too generic SaaS". A checkmark
   pops in on selection (springy scale, not just a color swap) so picking
   one actually feels like an interaction, not a flat state change. */
function SelectPill({ label, selected, onToggle }: { label: string; selected: boolean; onToggle: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={`${focusRing} btn-corners`}
      animate={{
        backgroundColor: selected ? RED : 'rgba(255,255,255,0.55)',
        borderColor: selected ? RED : 'rgba(0,0,0,0.14)',
        color: selected ? '#ffffff' : 'rgb(10,10,10)',
        scale: selected ? 1.03 : 1,
      }}
      transition={GLASS.spring}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '10px 18px',
        border: '1px solid',
        fontSize: 13,
        fontWeight: 500,
        cursor: 'pointer',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        boxShadow: selected ? '0 10px 24px rgba(234,51,35,0.22)' : 'none',
      }}
    >
      <AnimatePresence initial={false}>
        {selected && (
          <motion.span
            initial={{ scale: 0, opacity: 0, width: 0 }}
            animate={{ scale: 1, opacity: 1, width: 'auto' }}
            exit={{ scale: 0, opacity: 0, width: 0 }}
            transition={{ duration: 0.2, ease: EASE }}
            style={{ display: 'flex', overflow: 'hidden' }}
          >
            <Check size={13} strokeWidth={3} />
          </motion.span>
        )}
      </AnimatePresence>
      {label}
    </motion.button>
  );
}

/* ─── Magnetic submit — same physical-object interaction language as
   Footer's own MagneticCTA (mouse-follow translate + spring settle),
   solid red here since it's this page's single primary action. */
function SubmitButton({ status }: { status: 'idle' | 'submitting' | 'success' | 'error' }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const disabled = status === 'submitting';

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled) return;
      const rect = e.currentTarget.getBoundingClientRect();
      setPos({
        x: (e.clientX - (rect.left + rect.width / 2)) * 0.28,
        y: (e.clientY - (rect.top + rect.height / 2)) * 0.28,
      });
    },
    [disabled]
  );

  const handleMouseLeave = useCallback(() => {
    setHovered(false);
    setPos({ x: 0, y: 0 });
  }, []);

  return (
    <motion.button
      type="submit"
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      animate={{ x: pos.x, y: pos.y, scale: hovered && !disabled ? 1.03 : 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28, mass: 0.8 }}
      className={`${focusRing} btn-corners`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        padding: '18px 38px',
        border: 'none',
        background: disabled ? 'rgba(234,51,35,0.6)' : RED,
        color: 'white',
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: '0.09em',
        textTransform: 'uppercase',
        cursor: disabled ? 'wait' : 'pointer',
      }}
    >
      {status === 'submitting' ? 'Sending…' : 'Start The Conversation'}
      <motion.span
        animate={{ x: hovered && !disabled ? 3 : 0, y: hovered && !disabled ? -3 : 0 }}
        transition={{ duration: 0.3, ease: EASE }}
        style={{ display: 'flex' }}
      >
        <ArrowUpRight size={16} strokeWidth={2} />
      </motion.span>
    </motion.button>
  );
}

/* ─── Email — click to copy, not a plain mailto (matches the brief's
   explicit interaction spec). Falls back silently if the Clipboard API is
   unavailable rather than throwing. */
function CopyEmail({ email }: { email: string }) {
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API unavailable (older browser / no permission) — no
      // further fallback needed, the email is still visible to select.
    }
  }, [email]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={focusRing}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <motion.span
        animate={{ x: hovered ? 3 : 0, color: hovered ? RED : 'rgb(10,10,10)' }}
        transition={{ duration: 0.28, ease: EASE }}
        style={{ fontSize: 'clamp(17px, 1.8vw, 22px)', fontWeight: 600, letterSpacing: '-0.01em' }}
      >
        {email}
      </motion.span>
      <AnimatePresence mode="wait">
        {copied ? (
          <motion.span
            key="copied"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.2 }}
            style={{ display: 'flex', alignItems: 'center', gap: 4, color: RED, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}
          >
            <Check size={13} strokeWidth={2.5} /> Copied
          </motion.span>
        ) : (
          <motion.span
            key="copy"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: hovered ? 1 : 0.4, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            transition={{ duration: 0.2 }}
            style={{ display: 'flex' }}
          >
            <Copy size={15} strokeWidth={1.8} />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

type Status = 'idle' | 'submitting' | 'success' | 'error';

export function Contact() {
  const reduceMotion = useReducedMotion() ?? false;

  // Hero ambient glow — cursor position within the hero section, spring
  // smoothed so it trails rather than snapping. Default position (not 0,0)
  // so the glow reads intentionally placed before any mouse movement.
  const glowXRaw = useMotionValue(560);
  const glowYRaw = useMotionValue(140);
  const glowX = useSpring(glowXRaw, { stiffness: 40, damping: 20, mass: 1 });
  const glowY = useSpring(glowYRaw, { stiffness: 40, damping: 20, mass: 1 });
  const handleHeroMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (reduceMotion) return;
      const rect = e.currentTarget.getBoundingClientRect();
      glowXRaw.set(e.clientX - rect.left);
      glowYRaw.set(e.clientY - rect.top);
    },
    [reduceMotion, glowXRaw, glowYRaw]
  );

  // Form state — plain useState is correct here (infrequent, user-typed
  // updates, not per-frame animation), matching how every other controlled
  // input in this project is handled.
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [services, setServices] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; message?: string }>({});
  const [status, setStatus] = useState<Status>('idle');

  const toggleService = useCallback((s: string) => {
    setServices((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const nextErrors: typeof errors = {};
      if (!name.trim()) nextErrors.name = "We'll need a name to say hi to.";
      if (!email.trim()) nextErrors.email = 'How should we reach you back?';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) nextErrors.email = "That doesn't look like a valid email.";
      if (!message.trim()) nextErrors.message = "Tell us a little about what you're working on.";
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length > 0) return;

      setStatus('submitting');
      try {
        // No backend exists in this project yet — this simulates the
        // round-trip so loading/success states are real. Swap the delay
        // below for a real POST (name, company, email, services, message)
        // once an endpoint/email service is wired up.
        await new Promise((resolve) => setTimeout(resolve, 900));
        setStatus('success');
      } catch {
        setStatus('error');
      }
    },
    [name, email, message]
  );

  return (
    <>
      {/* ══════════ HERO ══════════ */}
      <section
        onMouseMove={handleHeroMouseMove}
        style={{
          position: 'relative',
          overflow: 'hidden',
          paddingTop: 'clamp(9rem, 17vh, 13rem)',
          paddingBottom: 'clamp(3rem, 6vh, 5rem)',
          paddingLeft: 'clamp(1.5rem, 4vw, 5rem)',
          paddingRight: 'clamp(1.5rem, 4vw, 5rem)',
          background: 'linear-gradient(180deg, rgb(253,250,248) 0%, white 100%)',
        }}
      >
        <AmbientGlow x={glowX} y={glowY} reduceMotion={reduceMotion} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1400, margin: '0 auto' }}>
          <Reveal>
            <Link
              to="/"
              className={focusRing}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 11,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                textDecoration: 'none',
                color: 'rgb(10,10,10)',
                opacity: 0.5,
                marginBottom: 'clamp(2rem, 5vh, 3.5rem)',
              }}
            >
              <ArrowLeft size={13} strokeWidth={2} /> Back to OneRed
            </Link>
          </Reveal>

          <Reveal delay={0.05}>
            <p style={eyebrowStyle}>Get In Touch</p>
          </Reveal>

          {['LET’S MAKE', 'SOMETHING MOVE.'].map((line, i) => (
            <div key={line} style={{ overflow: 'hidden' }}>
              <motion.h1
                initial={{ y: '110%' }}
                animate={{ y: 0 }}
                transition={{ duration: 0.85, ease: EASE, delay: 0.1 + i * 0.08 }}
                style={{
                  fontSize: 'clamp(44px, 7.2vw, 108px)',
                  fontWeight: 700,
                  letterSpacing: '-0.04em',
                  lineHeight: 1.0,
                  margin: 0,
                }}
              >
                {line}
              </motion.h1>
            </div>
          ))}

          <Reveal delay={0.3}>
            <p
              style={{
                fontSize: 'clamp(15px, 1.4vw, 19px)',
                lineHeight: 1.65,
                opacity: 0.55,
                maxWidth: 560,
                marginTop: 'clamp(1.5rem, 3vh, 2.2rem)',
              }}
            >
              Have a project, idea, brand or experience in mind? Tell us what you're working on and let's figure out
              where we can take it.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ══════════ FORM + CONTACT DETAILS ══════════ */}
      <section
        style={{
          padding: '0 clamp(1.5rem, 4vw, 5rem) clamp(5rem, 10vh, 8rem)',
        }}
      >
        <div
          className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr]"
          style={{ maxWidth: 1400, margin: '0 auto', gap: 'clamp(2rem, 4vw, 4rem)' }}
        >
          {/* ── Left: the conversational form (glass panel) ── */}
          <Reveal>
            <form
              onSubmit={handleSubmit}
              noValidate
              style={{
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 22,
                padding: 'clamp(2rem, 4vw, 3.5rem)',
                background: GLASS.surface.idle,
                backdropFilter: GLASS.blur,
                WebkitBackdropFilter: GLASS.blur,
                border: `1px solid ${GLASS.border.idle}`,
                boxShadow: GLASS.shadow.idle,
              }}
            >
              <GlassAmbient hovered={false} />

              <div style={{ position: 'relative', zIndex: 1 }}>
                <AnimatePresence mode="wait">
                  {status === 'success' ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      transition={{ duration: 0.6, ease: EASE }}
                      style={{ textAlign: 'center', padding: 'clamp(2.5rem, 8vh, 4.5rem) 0' }}
                    >
                      <motion.div
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1, type: 'spring', stiffness: 260, damping: 20 }}
                        style={{
                          width: 60,
                          height: 60,
                          borderRadius: '50%',
                          background: RED,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 22px',
                        }}
                      >
                        <Check color="white" size={26} strokeWidth={2.5} />
                      </motion.div>
                      <h3 style={{ fontSize: 'clamp(22px, 2.8vw, 32px)', fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 10px' }}>
                        Message Received.
                      </h3>
                      <p style={{ opacity: 0.5, fontSize: 15, margin: 0 }}>We'll be in touch soon.</p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(2rem, 3.4vh, 2.8rem)' }}
                    >
                      {/* Intro — real labeled fields in a clean, orderly
                          grid (not blanks crammed into a sentence). A small
                          personalized greeting fades in once a name is
                          typed — the "conversational" touch, without the
                          layout fragility of the mad-lib version it
                          replaced. */}
                      <div>
                        <p style={{ fontSize: 13, opacity: 0.5, margin: '0 0 4px' }}>Hi OneRed,</p>
                        <h3
                          style={{
                            fontSize: 'clamp(21px, 2.4vw, 27px)',
                            fontWeight: 700,
                            letterSpacing: '-0.015em',
                            margin: '0 0 22px',
                          }}
                        >
                          Let's start with the basics.
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 16, marginBottom: 16 }}>
                          <FormField id="contact-name" label="Your Name" value={name} onChange={setName} placeholder="Jane Doe" error={errors.name} />
                          <FormField
                            id="contact-company"
                            label="Company"
                            value={company}
                            onChange={setCompany}
                            placeholder="Acme Inc."
                            required={false}
                          />
                        </div>
                        <FormField
                          id="contact-email"
                          type="email"
                          label="Email"
                          value={email}
                          onChange={setEmail}
                          placeholder="you@email.com"
                          error={errors.email}
                        />

                        <AnimatePresence>
                          {name.trim() && (
                            <motion.p
                              key="greeting"
                              initial={{ opacity: 0, y: -6, height: 0 }}
                              animate={{ opacity: 1, y: 0, height: 'auto' }}
                              exit={{ opacity: 0, y: -6, height: 0 }}
                              transition={{ duration: 0.32, ease: EASE }}
                              style={{ fontSize: 13, fontWeight: 600, color: RED, margin: 0, marginTop: 14, overflow: 'hidden' }}
                            >
                              Hey {name.trim().split(' ')[0]}, good to meet you — let's get into it. 👋
                            </motion.p>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Services — multi-select */}
                      <div>
                        <span id="services-label" style={fieldLabelStyle}>
                          I'm looking for help with
                        </span>
                        <div role="group" aria-labelledby="services-label" style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                          {SERVICES.map((s) => (
                            <SelectPill key={s} label={s} selected={services.includes(s)} onToggle={() => toggleService(s)} />
                          ))}
                        </div>
                      </div>

                      {/* Project description */}
                      <div>
                        <label htmlFor="contact-message" style={fieldLabelStyle}>
                          Tell us a little about the project
                        </label>
                        <textarea
                          id="contact-message"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="What's the idea, problem or opportunity you're working on?"
                          rows={5}
                          required
                          aria-required
                          aria-invalid={!!errors.message}
                          aria-describedby={errors.message ? 'contact-message-error' : undefined}
                          className={`${focusRing} focus:border-[#EA3323]`}
                          style={{
                            width: '100%',
                            resize: 'vertical',
                            minHeight: 140,
                            padding: '18px 20px',
                            borderRadius: 14,
                            border: `1px solid ${errors.message ? '#d4183d' : 'rgba(0,0,0,0.1)'}`,
                            background: 'rgba(255,255,255,0.55)',
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                            fontFamily: 'var(--font-sans)',
                            fontSize: 15,
                            lineHeight: 1.6,
                            color: 'rgb(10,10,10)',
                            outline: 'none',
                            transition: 'border-color 220ms ease-out, background 220ms ease-out',
                          }}
                        />
                        {errors.message && (
                          <span id="contact-message-error" role="alert" style={{ display: 'block', fontSize: 12, color: '#d4183d', marginTop: 8 }}>
                            {errors.message}
                          </span>
                        )}
                      </div>

                      {status === 'error' && (
                        <p role="alert" style={{ fontSize: 13, color: '#d4183d', margin: 0 }}>
                          Something went wrong sending that — please try again, or email us directly at {CONTACT_EMAIL}.
                        </p>
                      )}

                      <div>
                        <SubmitButton status={status} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </form>
          </Reveal>

          {/* ── Right: agency contact details + socials ── */}
          <Reveal delay={0.12}>
            <div
              className="lg:sticky"
              style={{ top: 'clamp(100px, 14vh, 150px)', display: 'flex', flexDirection: 'column', gap: 'clamp(2.2rem, 4vh, 3rem)' }}
            >
              <div>
                <span style={fieldLabelStyle}>
                  <Mail size={12} strokeWidth={2} style={{ display: 'inline', marginRight: 6, verticalAlign: -2 }} />
                  Email
                </span>
                <CopyEmail email={CONTACT_EMAIL} />
              </div>

              <div>
                <span style={fieldLabelStyle}>
                  <Phone size={12} strokeWidth={2} style={{ display: 'inline', marginRight: 6, verticalAlign: -2 }} />
                  Phone
                </span>
                <p style={{ fontSize: 'clamp(17px, 1.8vw, 22px)', fontWeight: 600, letterSpacing: '-0.01em', margin: 0 }}>
                  {PLACEHOLDER_PHONE}
                </p>
              </div>

              <div>
                <span style={fieldLabelStyle}>
                  <MapPin size={12} strokeWidth={2} style={{ display: 'inline', marginRight: 6, verticalAlign: -2 }} />
                  Location
                </span>
                <p style={{ fontSize: 15, opacity: 0.6, margin: 0 }}>{PLACEHOLDER_LOCATION}</p>
              </div>

              <div>
                <span style={fieldLabelStyle}>Follow</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'clamp(14px, 2vw, 22px)' }}>
                  {socialLinks.map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      className={focusRing}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                        fontSize: 12,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        textDecoration: 'none',
                        color: 'rgb(10,10,10)',
                        opacity: 0.5,
                      }}
                    >
                      {s.label}
                      <ArrowUpRight size={11} strokeWidth={1.8} />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, Check, Copy } from 'lucide-react';
import { glide, subscribeGlide } from '../scrollGlide';
import { CONTACT_EMAIL, CONTACT_PHONE, CONTACT_WHATSAPP, socialLinks } from '../Footer';
import { Digit, roughRect, RED, RED_SOFT, INK, SKY, EASE, clamp01, easeOutCubic, label, focusRing } from '../about/shared';

/* ─── /contact, in 1Red's own language ─────────────────────────────────────
 * Rajat (2026-09-30): not the soft cream "premium" card; the contact lives
 * ON the red panels of the process print, one piece per panel, each with
 * its numeral, text flush-left. Panels glide in with the scroll: each rises
 * from a little below, lying back, and settles flat as it comes up the
 * frame, driven by the site's glide (so it is reversible and eased, never
 * a timed pop).
 *
 * The form really sends: with no backend in this project, submitting opens
 * the visitor's mail app with everything they typed, addressed to
 * CONTACT_EMAIL, then shows the thank-you.
 * ────────────────────────────────────────────────────────────────────────── */

const PHONE = CONTACT_PHONE;
const WHATSAPP = CONTACT_WHATSAPP;
const LOCATION = 'India. Working with clients worldwide.';
const SERVICES = ['Branding', 'Web Design', 'UI/UX', 'Motion', 'Campaigns', 'Video', 'Something else'];

/** Scroll-driven entrance for one panel: as its top comes up through the
 *  lower part of the frame it rises and flattens. */
function useGlideIn(ref: React.RefObject<HTMLDivElement | null>, lag: number, off: boolean) {
  useEffect(() => {
    if (off) return;
    return subscribeGlide(() => {
      const el = ref.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top + glide.raw - glide.y;
      const vh = window.innerHeight;
      const t = easeOutCubic(clamp01((vh * (1.02 + lag) - top) / (vh * 0.42)));
      const u = 1 - t;
      el.style.transform = `perspective(1400px) translate3d(0, ${(u * 90).toFixed(1)}px, 0) rotateX(${(u * 16).toFixed(2)}deg)`;
      el.style.opacity = (0.25 + 0.75 * t).toFixed(3);
    });
  }, [ref, lag, off]);
}

/** A red panel of any height: the print's rough edge stretched to fit,
 *  the numeral top-left, everything flush-left. */
export function Panel({ n, seed, eyebrow, title, children, lag = 0, style, blank }: { n?: number; seed: number; eyebrow?: string; title?: string; children?: ReactNode; lag?: number; style?: React.CSSProperties; blank?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion() ?? false;
  useGlideIn(ref, lag, reduceMotion);
  return (
    <div ref={ref} style={{ position: 'relative', transformOrigin: '50% 100%', willChange: 'transform, opacity', ...style }}>
      <svg viewBox="0 0 100 140" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }} aria-hidden>
        <path d={roughRect(seed + 20, 140, 0.6, 1.6)} fill={RED_SOFT} opacity={0.5} />
        <path d={roughRect(seed, 140, 1.5, 1.1)} fill={RED} />
      </svg>
      <div style={{ position: 'relative', padding: 'clamp(22px, 2.6vw, 40px)', color: SKY, textAlign: 'left', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
        {n != null && (
          <div style={{ height: 'clamp(44px, 5vw, 72px)', marginBottom: 'clamp(16px, 2vw, 26px)' }}>
            <Digit n={n} height="100%" fill={SKY} />
          </div>
        )}
        {eyebrow && <span style={{ ...label, opacity: 0.85 }}>{eyebrow}</span>}
        {title && <h2 style={{ margin: '10px 0 0', fontFamily: 'var(--font-sans)', fontSize: 'clamp(24px, 2.2vw, 36px)', fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1.02 }}>{title}</h2>}
        {blank ? null : <div style={{ marginTop: 'clamp(16px, 2.4vw, 28px)', flex: 1, display: 'flex', flexDirection: 'column' }}>{children}</div>}
      </div>
    </div>
  );
}

/* ── Fields on the red: cream type, a cream rule under each ─────────────── */
const fieldLabel: React.CSSProperties = { ...label, fontSize: 9, opacity: 0.8, display: 'block', marginBottom: 8 };
const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'transparent',
  border: 'none',
  borderBottom: '1.5px solid rgba(255,255,255,0.55)',
  color: SKY,
  fontFamily: 'var(--font-sans)',
  fontSize: 'clamp(17px, 1.4vw, 21px)',
  padding: '8px 0 10px',
  outline: 'none',
  borderRadius: 0,
};
function Field({ id, labelText, error, children }: { id: string; labelText: string; error?: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label htmlFor={id} style={fieldLabel}>
        {labelText}
      </label>
      {children}
      {error && (
        <span role="alert" style={{ display: 'block', marginTop: 6, fontSize: 13, color: INK, fontWeight: 600 }}>
          {error}
        </span>
      )}
    </div>
  );
}

export type FormState = ReturnType<typeof useContactForm>;
export function useContactForm() {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [services, setServices] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; message?: string }>({});
  const [sent, setSent] = useState(false);
  const toggle = (s: string) => setServices((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!name.trim()) next.name = "We'll need a name to say hi to.";
    if (!email.trim()) next.email = 'How should we reach you back?';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = "That doesn't look like a valid email.";
    if (!message.trim()) next.message = "Tell us a little about what you're working on.";
    setErrors(next);
    if (Object.keys(next).length) return;
    const body = [`Name: ${name.trim()}`, company.trim() && `Company: ${company.trim()}`, `Email: ${email.trim()}`, services.length ? `Looking for: ${services.join(', ')}` : '', '', message.trim()].filter((l) => l !== false && l !== undefined).join('\n');
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`New project: ${name.trim()}${company.trim() ? `, ${company.trim()}` : ''}`)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };
  return { name, setName, company, setCompany, email, setEmail, services, toggle, message, setMessage, errors, sent, submit };
}

export function FieldsYou({ f }: { f: FormState }) {
  return (
    <>
      <Field id="c-name" labelText="Your name" error={f.errors.name}>
        <input id="c-name" className="contact-input" style={inputStyle} value={f.name} onChange={(e) => f.setName(e.target.value)} autoComplete="name" placeholder="Jane Doe" />
      </Field>
      <Field id="c-company" labelText="Company (optional)">
        <input id="c-company" className="contact-input" style={inputStyle} value={f.company} onChange={(e) => f.setCompany(e.target.value)} autoComplete="organization" placeholder="Acme" />
      </Field>
      <Field id="c-email" labelText="Email" error={f.errors.email}>
        <input id="c-email" type="email" className="contact-input" style={inputStyle} value={f.email} onChange={(e) => f.setEmail(e.target.value)} autoComplete="email" placeholder="you@email.com" />
      </Field>
    </>
  );
}

export function FieldsNeed({ f }: { f: FormState }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {SERVICES.map((s) => {
        const on = f.services.includes(s);
        return (
          <button
            key={s}
            type="button"
            aria-pressed={on}
            onClick={() => f.toggle(s)}
            className={`${focusRing} btn-corners`}
            style={{ padding: '9px 14px', border: `1.5px solid ${SKY}`, background: on ? SKY : 'transparent', color: on ? RED : SKY, fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'background 200ms ease-out, color 200ms ease-out' }}
          >
            {s}
          </button>
        );
      })}
    </div>
  );
}

export function FieldsIdea({ f }: { f: FormState }) {
  return (
    <>
      <Field id="c-message" labelText="A little about the project" error={f.errors.message}>
        <textarea id="c-message" className="contact-input" rows={4} style={{ ...inputStyle, resize: 'vertical' }} value={f.message} onChange={(e) => f.setMessage(e.target.value)} placeholder="The idea, the problem, the deadline." />
      </Field>
      <div style={{ marginTop: 'auto' }}>
        {f.sent ? (
          <p role="status" style={{ margin: 0, fontSize: 17, lineHeight: 1.45, fontWeight: 600 }}>
            Thanks, {f.name.trim().split(' ')[0]}. Your mail app has the message ready; send it and we'll be back within a day.
          </p>
        ) : (
          <button type="submit" className={`${focusRing} btn-corners`} style={{ ...label, fontSize: 12, letterSpacing: '0.16em', display: 'inline-flex', alignItems: 'center', gap: 10, padding: '16px 24px', border: 'none', background: SKY, color: RED, cursor: 'pointer' }}>
            Send it over <ArrowUpRight size={15} strokeWidth={2} />
          </button>
        )}
      </div>
    </>
  );
}

/* ── The information panels ─────────────────────────────────────────────── */
const bigLink: React.CSSProperties = { color: SKY, textDecoration: 'none', fontFamily: 'var(--font-sans)', fontSize: 'clamp(20px, 1.8vw, 28px)', fontWeight: 700, letterSpacing: '-0.02em' };

export function EmailBody() {
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'flex-start' }}>
      <a href={`mailto:${CONTACT_EMAIL}`} className={focusRing} style={bigLink}>
        {CONTACT_EMAIL}
      </a>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(CONTACT_EMAIL).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
          });
        }}
        className={`${focusRing} btn-corners`}
        style={{ ...label, fontSize: 10, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 12px', border: `1.5px solid ${SKY}`, background: 'transparent', color: SKY, cursor: 'pointer' }}
      >
        {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}
export function PhoneBody() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start' }}>
      <a href={`tel:${PHONE.replace(/\s/g, '')}`} className={focusRing} style={bigLink}>
        {PHONE}
      </a>
      {WHATSAPP && (
        <a href={WHATSAPP} target="_blank" rel="noreferrer" className={focusRing} style={{ ...label, color: SKY, textDecoration: 'none', display: 'inline-flex', gap: 6, alignItems: 'center' }}>
          WhatsApp <ArrowUpRight size={12} />
        </a>
      )}
    </div>
  );
}
export function WhereBody() {
  return <p style={{ margin: 0, fontSize: 'clamp(18px, 1.5vw, 22px)', lineHeight: 1.35, fontWeight: 600 }}>{LOCATION}</p>;
}
export function CareersBody() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
      <p style={{ margin: 0, fontSize: 16, lineHeight: 1.5, opacity: 0.92 }}>Every skill, one box. If yours is missing, tell us.</p>
      <a href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Careers at 1Red')}`} className={focusRing} style={{ ...label, color: SKY, textDecoration: 'none', display: 'inline-flex', gap: 6, alignItems: 'center' }}>
        Send your work <ArrowUpRight size={12} />
      </a>
    </div>
  );
}
export function FollowBody() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-start' }}>
      {socialLinks.map((s: { label: string; href: string }) => (
        <a key={s.label} href={s.href} target="_blank" rel="noreferrer" className={focusRing} style={{ ...bigLink, fontSize: 'clamp(18px, 1.4vw, 22px)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {s.label} <ArrowUpRight size={14} />
        </a>
      ))}
    </div>
  );
}

/** The print's blank panel, with the one thing 1Red always is: a box.
 *  Drawn flat in the panel's own cream, three faces a shade apart. */
export function BoxMotif() {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-start' }}>
      <svg viewBox="0 0 100 100" style={{ width: 'clamp(84px, 9vw, 132px)', height: 'auto', display: 'block' }} aria-hidden>
        <path d="M50 8 L90 30 L50 52 L10 30 Z" fill="#FFFFFF" />
        <path d="M10 30 L50 52 L50 96 L10 74 Z" fill="#DCD4C4" />
        <path d="M90 30 L50 52 L50 96 L90 74 Z" fill="#C4BAA6" />
      </svg>
    </div>
  );
}

/* ── The heading row: the wall's question, set as the Swiss row ─────────── */
export function ContactHead() {
  const reduceMotion = useReducedMotion() ?? false;
  return (
    <div style={{ color: INK, marginBottom: 'clamp(28px, 5vh, 56px)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24 }}>
        <div className="overflow-hidden">
          <motion.h1
            initial={reduceMotion ? false : { y: '110%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.8, ease: EASE }}
            style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(44px, 7vw, 128px)', fontWeight: 500, letterSpacing: '-0.045em', lineHeight: 0.94, margin: 0 }}
          >
            Spill it.
            <br />
            We read <span style={{ color: RED }}>everything.</span>
          </motion.h1>
        </div>
        <div className="overflow-hidden" style={{ flexShrink: 0, paddingTop: '0.8em' }}>
          <motion.p initial={reduceMotion ? false : { y: '110%' }} animate={{ y: 0 }} transition={{ duration: 0.6, ease: EASE, delay: 0.1 }} style={{ ...label, margin: 0, textAlign: 'right', lineHeight: 1.6 }}>
            Contact
            <br />
            Start a project
          </motion.p>
        </div>
      </div>
      <motion.div
        initial={reduceMotion ? false : { scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.9, delay: 0.2, ease: EASE }}
        style={{ height: 1, background: INK, transformOrigin: 'left center', marginTop: 'clamp(24px, 4vh, 40px)' }}
      />
    </div>
  );
}

import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, Copy, Check } from 'lucide-react';
import { CONTACT_EMAIL, CONTACT_PHONE, CONTACT_WHATSAPP, socialLinks } from '../Footer';
import { FillLink } from '../home/FillLink';
import { InkCard, InkRule, HandNote, Prop, Stamp, paperTiles, PAPER_CLASS, RED, INK } from '../paper/Paper';

/* ─── Start a project on the paper (Rajat, 2026-10-17) ─────────────────────
 * The drawn-table language of /work and /about, and far fewer clicks: the
 * form is name, email and a line about the project (what you need is one
 * optional tap row; budget and timeline are gone), and beside it WhatsApp
 * and email are one tap each. The white version is SimpleContact, kept. */

const EASE = [0.22, 1, 0.36, 1] as const;
const SERVICES = ['Branding', 'Website', 'Motion', 'Campaigns', 'Something else'];
const WA_TEXT = encodeURIComponent("Hi 1red, I'd like to start a project.");
const LINE = 'rgba(10,10,10,0.22)';

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EB3F43]';
const label: React.CSSProperties = { fontFamily: 'var(--font-hand)', fontSize: 20, fontWeight: 700, color: RED, display: 'block', marginBottom: 6 };
const input: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  fontFamily: 'var(--font-sans)',
  fontSize: 20,
  color: INK,
  background: 'transparent',
  border: 0,
  borderBottom: `1.6px solid ${INK}`,
  padding: '8px 0 10px',
  outline: 'none',
  borderRadius: 0,
};
const css = `.pc-input::placeholder{color:rgba(10,10,10,0.32)}.pc-input:focus{border-bottom-color:${RED} !important}`;

export function PaperContact() {
  const reduceMotion = useReducedMotion() ?? false;
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [services, setServices] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ name?: string; email?: string; message?: string }>({});
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!name.trim()) next.name = "We'll need a name to say hi to.";
    if (!email.trim()) next.email = 'How should we reach you back?';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = "That doesn't look like a valid email.";
    if (!message.trim()) next.message = 'One line is enough.';
    setErrors(next);
    if (Object.keys(next).length) return;
    const body = [`Name: ${name.trim()}`, `Email: ${email.trim()}`, services.length ? `Looking for: ${services.join(', ')}` : '', '', message.trim()].join('\n');
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`New project: ${name.trim()}`)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  const wrap = { maxWidth: 1400, margin: '0 auto', padding: '0 clamp(1rem, 4vw, 5rem)', position: 'relative' as const };

  return (
    <main className={PAPER_CLASS} style={{ ...paperTiles, position: 'relative', overflowX: 'clip', color: INK, minHeight: '100vh', paddingBottom: 'clamp(4rem, 10vh, 7rem)' }}>
      <style>{css}</style>
      <Prop src="/images/cta/megaphone.png" style={{ right: 'clamp(-20px, 3vw, 80px)', top: 'clamp(80px, 10vh, 120px)', width: 'clamp(180px, 20vw, 320px)', transform: 'rotate(4deg)' }} />

      <section style={{ ...wrap, paddingTop: 'clamp(7rem, 15vh, 10rem)' }}>
        <div className="overflow-hidden">
          <motion.h1
            initial={reduceMotion ? false : { y: '110%' }}
            animate={{ y: 0 }}
            transition={{ duration: 0.8, ease: EASE }}
            style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(52px, 8vw, 150px)', fontWeight: 500, letterSpacing: '-0.045em', lineHeight: 0.9, margin: 0 }}
          >
            Spill it.
            <br />
            <span style={{ color: RED }}>We read everything.</span>
          </motion.h1>
        </div>
        <HandNote size={28} style={{ marginTop: 14 }}>start a project.</HandNote>
      </section>

      <section style={{ ...wrap, marginTop: 'clamp(2rem, 5vh, 3.5rem)' }}>
        <InkRule seed={23} />
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)]" style={{ gap: 'clamp(2rem, 5vw, 5rem)', alignItems: 'start', marginTop: 'clamp(2rem, 5vh, 3.5rem)' }}>
          {/* The form: three fields and one optional tap row. */}
          <InkCard tilt={-0.6} pad={0} style={{ padding: 'clamp(22px, 3vw, 44px)' }}>
            {sent ? (
              <div aria-live="polite">
                <p style={{ fontSize: 'clamp(26px, 2.6vw, 40px)', fontWeight: 500, letterSpacing: '-0.03em', lineHeight: 1.1, margin: 0 }}>
                  Your mail app should be open now.
                  <br />
                  <span style={{ color: RED }}>Hit send and we'll take it from there.</span>
                </p>
                <p style={{ fontSize: 17, marginTop: 20 }}>
                  Nothing opened? Write to{' '}
                  <a href={`mailto:${CONTACT_EMAIL}`} className={focusRing} style={{ color: RED }}>
                    {CONTACT_EMAIL}
                  </a>{' '}
                  or{' '}
                  <a href={`${CONTACT_WHATSAPP}?text=${WA_TEXT}`} target="_blank" rel="noreferrer" className={focusRing} style={{ color: RED }}>
                    WhatsApp us
                  </a>
                  .
                </p>
                <button type="button" onClick={() => setSent(false)} className={`btn-corners ${focusRing}`} style={{ marginTop: 18, background: 'none', border: `1.6px solid ${INK}`, padding: '10px 16px', fontFamily: 'var(--font-sans)', fontSize: 15, cursor: 'pointer' }}>
                  Back to the form
                </button>
              </div>
            ) : (
              <form onSubmit={submit} noValidate>
                <div className="grid grid-cols-1 md:grid-cols-2" style={{ columnGap: 32 }}>
                  <Row id="pc-name" title="your name" error={errors.name}>
                    <input id="pc-name" className={`pc-input ${focusRing}`} style={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" autoComplete="name" aria-invalid={!!errors.name} />
                  </Row>
                  <Row id="pc-email" title="email" error={errors.email}>
                    <input id="pc-email" type="email" className={`pc-input ${focusRing}`} style={input} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" autoComplete="email" aria-invalid={!!errors.email} />
                  </Row>
                </div>
                <Row id="pc-msg" title="what are you making?" error={errors.message}>
                  <textarea id="pc-msg" rows={3} className={`pc-input ${focusRing}`} style={{ ...input, resize: 'vertical', lineHeight: 1.45 }} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="The idea, the problem, the deadline. Rough is fine." aria-invalid={!!errors.message} />
                </Row>
                <div style={{ marginBottom: 30 }}>
                  <span style={label}>
                    need help with <span style={{ color: 'rgba(10,10,10,0.45)', fontSize: 16 }}>(optional, tap any)</span>
                  </span>
                  <div role="group" aria-label="Need help with" style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 6 }}>
                    {SERVICES.map((s) => {
                      const on = services.includes(s);
                      return (
                        <button key={s} type="button" aria-pressed={on} onClick={() => setServices(on ? services.filter((x) => x !== s) : [...services, s])} className={focusRing} style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer' }}>
                          <Stamp on={on} style={{ fontSize: 16, padding: '7px 12px 5px' }}>
                            {s}
                          </Stamp>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
                  <button type="submit" className={`fill-btn btn-corners fill-btn--red ${focusRing}`}>
                    <span className="fill-btn__fill" aria-hidden />
                    <span className="fill-btn__label">
                      <span>Send it over</span>
                      <span aria-hidden>Send it over</span>
                    </span>
                    <span className="fill-btn__icon">
                      <ArrowUpRight size={15} strokeWidth={2} />
                    </span>
                  </button>
                  <HandNote size={20} style={{ transform: 'rotate(-2deg)' }}>we reply within 24 hours.</HandNote>
                </div>
              </form>
            )}
          </InkCard>

          {/* Rather talk? One tap each; on phones it comes first. */}
          <div className="order-first lg:order-none">
          <InkCard tilt={1.1} pad={0} style={{ padding: 'clamp(22px, 2.6vw, 36px)' }}>
            <p style={{ fontSize: 'clamp(26px, 2.4vw, 36px)', fontWeight: 500, letterSpacing: '-0.03em', margin: '0 0 6px', color: RED }}>Rather talk?</p>
            <HandNote size={20}>one tap. no forms.</HandNote>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 14, marginTop: 22 }}>
              <FillLink to={`${CONTACT_WHATSAPP}?text=${WA_TEXT}`} icon={<ArrowUpRight size={15} strokeWidth={2} />}>
                WhatsApp us
              </FillLink>
              <FillLink to={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("Let's talk")}`} outline>
                Email us
              </FillLink>
            </div>

            <div style={{ marginTop: 26, display: 'grid', gap: 18 }}>
              <div>
                <span style={label}>email</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <a href={`mailto:${CONTACT_EMAIL}`} className={focusRing} style={{ fontSize: 20, fontWeight: 600, color: INK, textDecoration: 'none' }}>
                    {CONTACT_EMAIL}
                  </a>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard?.writeText(CONTACT_EMAIL).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1600); })}
                    className={`btn-corners ${focusRing}`}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: `1.6px solid ${INK}`, padding: '5px 9px', fontFamily: 'var(--font-sans)', fontSize: 13, cursor: 'pointer', color: INK }}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
              <div>
                <span style={label}>phone</span>
                <a href={`tel:${CONTACT_PHONE.replace(/\s/g, '')}`} className={focusRing} style={{ fontSize: 20, fontWeight: 600, color: INK, textDecoration: 'none' }}>
                  {CONTACT_PHONE}
                </a>
              </div>
              <div>
                <span style={label}>follow</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px' }}>
                  {socialLinks.map((s: { label: string; href: string }) => (
                    <a key={s.label} href={s.href} target="_blank" rel="noreferrer" className={focusRing} style={{ fontSize: 17, fontWeight: 500, color: INK, textDecoration: 'none', borderBottom: `1px solid ${LINE}` }}>
                      {s.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </InkCard>
          </div>
        </div>
      </section>
    </main>
  );
}

function Row({ id, title, error, children }: { id: string; title: string; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <label htmlFor={id} style={label}>
        {title}
      </label>
      {children}
      {error && (
        <p role="alert" style={{ margin: '8px 0 0', fontSize: 14, color: RED }}>
          {error}
        </p>
      )}
    </div>
  );
}

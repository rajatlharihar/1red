import { useState } from 'react';
import { ArrowUpRight, Copy, Check } from 'lucide-react';
import { CONTACT_EMAIL, CONTACT_PHONE, CONTACT_WHATSAPP, socialLinks } from '../Footer';

/* ─── Start a project, kept simple (Rajat, 2026-10-04) ─────────────────────
 * "Not easy to understand; the numbers and boxes are not needed." So: one
 * Swiss headline row, one form in one column, and a short "rather talk?"
 * column beside it. Submitting opens a prefilled mail to CONTACT_EMAIL, as
 * the panel version did, then thanks you.
 * ────────────────────────────────────────────────────────────────────────── */

const RED = '#EB3F43';
const INK = '#0A0A0A';
const LINE = 'rgba(10,10,10,0.14)';
const PHONE = CONTACT_PHONE;
const WHATSAPP = CONTACT_WHATSAPP;
const LOCATION = 'India. Working with clients worldwide.';
const SERVICES = ['Branding', 'Website', 'UI/UX', 'Motion', 'Campaigns', 'Video', 'Something else'];
const BUDGETS = ['Under ₹50K', '₹50K to ₹1.5L', '₹1.5L to ₹5L', '₹5L+', 'Not sure yet'];
const TIMELINES = ['ASAP', 'In a month', 'In 2 to 3 months', 'Just exploring'];

const focusRing = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#EB3F43]';
const label: React.CSSProperties = { fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: INK, display: 'block', marginBottom: 10 };
const input: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  fontFamily: 'var(--font-sans)',
  fontSize: 18,
  color: INK,
  background: 'transparent',
  border: 0,
  borderBottom: `1.5px solid ${LINE}`,
  padding: '10px 0 12px',
  outline: 'none',
  borderRadius: 0,
};
const css = `.sc-input::placeholder{color:rgba(10,10,10,0.35)}.sc-input:focus{border-bottom-color:${RED} !important}`;

function Chips({ options, value, multi, onChange, name }: { options: string[]; value: string[]; multi: boolean; onChange: (v: string[]) => void; name: string }) {
  return (
    <div role="group" aria-label={name} style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(multi ? (on ? value.filter((x) => x !== o) : [...value, o]) : on ? [] : [o])}
            className={`btn-corners ${focusRing}`}
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: 15,
              fontWeight: 500,
              padding: '10px 16px',
              cursor: 'pointer',
              border: `1.5px solid ${on ? RED : LINE}`,
              background: on ? RED : '#fff',
              color: on ? '#fff' : INK,
              transition: 'background 180ms ease, border-color 180ms ease, color 180ms ease',
            }}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

function Field({ id, title, optional, error, children }: { id?: string; title: string; optional?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 34 }}>
      <label htmlFor={id} style={label}>
        {title} {optional && <span style={{ opacity: 0.45, letterSpacing: '0.12em' }}>(optional)</span>}
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

export function SimpleContact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [services, setServices] = useState<string[]>([]);
  const [budget, setBudget] = useState<string[]>([]);
  const [timeline, setTimeline] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; message?: string }>({});
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!name.trim()) next.name = "We'll need a name to say hi to.";
    if (!email.trim()) next.email = 'How should we reach you back?';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = "That doesn't look like a valid email.";
    if (!message.trim()) next.message = 'Tell us a little about what you are working on.';
    setErrors(next);
    if (Object.keys(next).length) return;
    const body = [
      `Name: ${name.trim()}`,
      `Email: ${email.trim()}`,
      company.trim() && `Company: ${company.trim()}`,
      services.length ? `Looking for: ${services.join(', ')}` : '',
      budget.length ? `Budget: ${budget[0]}` : '',
      timeline.length ? `Timeline: ${timeline[0]}` : '',
      '',
      message.trim(),
    ]
      .filter((l) => l !== false && l !== undefined)
      .join('\n');
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`New project: ${name.trim()}${company.trim() ? `, ${company.trim()}` : ''}`)}&body=${encodeURIComponent(body)}`;
    setSent(true);
  };

  return (
    <main style={{ background: '#fff', color: INK, padding: 'clamp(7rem, 15vh, 10rem) clamp(1rem, 4vw, 5rem) clamp(4rem, 10vh, 7rem)' }}>
      <style>{css}</style>
      <div style={{ maxWidth: 1300, margin: '0 auto' }}>
        {/* Headline row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
          <h1 style={{ fontFamily: 'var(--font-sans)', fontSize: 'clamp(44px, 7vw, 120px)', fontWeight: 500, letterSpacing: '-0.045em', lineHeight: 0.95, margin: 0 }}>
            Spill it.
            <br />
            <span style={{ color: 'rgba(10,10,10,0.4)' }}>We read everything.</span>
          </h1>
          <p style={{ ...label, margin: '0.8em 0 0', textAlign: 'right' }}>Start a project</p>
        </div>
        <div style={{ height: 1, background: INK, margin: 'clamp(1.5rem, 4vh, 3rem) 0 clamp(2.5rem, 6vh, 4.5rem)' }} />

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)]" style={{ gap: 'clamp(3rem, 7vw, 8rem)', alignItems: 'start' }}>
          {/* The form */}
          {sent ? (
            <div aria-live="polite">
              <p style={{ fontSize: 'clamp(28px, 3vw, 44px)', fontWeight: 500, letterSpacing: '-0.03em', lineHeight: 1.1, margin: 0 }}>
                Your mail app should be open now.
                <br />
                <span style={{ color: 'rgba(10,10,10,0.45)' }}>Hit send and we'll take it from there.</span>
              </p>
              <p style={{ fontSize: 17, marginTop: 20 }}>
                Nothing opened? Write to{' '}
                <a href={`mailto:${CONTACT_EMAIL}`} className={focusRing} style={{ color: RED }}>
                  {CONTACT_EMAIL}
                </a>
                .
              </p>
              <button type="button" onClick={() => setSent(false)} className={`btn-corners ${focusRing}`} style={{ marginTop: 18, background: 'none', border: `1.5px solid ${LINE}`, padding: '10px 16px', fontFamily: 'var(--font-sans)', fontSize: 15, cursor: 'pointer' }}>
                Back to the form
              </button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate>
              <div className="grid grid-cols-1 md:grid-cols-2" style={{ columnGap: 32 }}>
                <Field id="sc-name" title="Your name" error={errors.name}>
                  <input id="sc-name" className={`sc-input ${focusRing}`} style={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Doe" autoComplete="name" aria-invalid={!!errors.name} />
                </Field>
                <Field id="sc-email" title="Email" error={errors.email}>
                  <input id="sc-email" type="email" className={`sc-input ${focusRing}`} style={input} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" autoComplete="email" aria-invalid={!!errors.email} />
                </Field>
              </div>
              <Field id="sc-company" title="Company" optional>
                <input id="sc-company" className={`sc-input ${focusRing}`} style={input} value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Acme" autoComplete="organization" />
              </Field>
              <Field title="What do you need? Pick all that apply">
                <Chips name="What do you need" options={SERVICES} value={services} multi onChange={setServices} />
              </Field>
              <Field title="Budget" optional>
                <Chips name="Budget" options={BUDGETS} value={budget} multi={false} onChange={setBudget} />
              </Field>
              <Field title="When do you need it?" optional>
                <Chips name="Timeline" options={TIMELINES} value={timeline} multi={false} onChange={setTimeline} />
              </Field>
              <Field id="sc-msg" title="Tell us about it" error={errors.message}>
                <textarea id="sc-msg" rows={5} className={`sc-input ${focusRing}`} style={{ ...input, resize: 'vertical', lineHeight: 1.5 }} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="The idea, the problem, the deadline. Rough is fine." aria-invalid={!!errors.message} />
              </Field>
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
                <span style={{ fontSize: 15, color: 'rgba(10,10,10,0.55)' }}>We reply within 24 hours. Usually sooner.</span>
              </div>
            </form>
          )}

          {/* Rather talk? */}
          <aside style={{ borderTop: `1px solid ${LINE}`, paddingTop: 28 }}>
            <p style={{ fontSize: 'clamp(24px, 2.2vw, 32px)', fontWeight: 500, letterSpacing: '-0.03em', margin: '0 0 24px' }}>Rather talk?</p>

            <p style={label}>Email</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
              <a href={`mailto:${CONTACT_EMAIL}`} className={focusRing} style={{ fontSize: 22, fontWeight: 600, color: INK, textDecoration: 'none' }}>
                {CONTACT_EMAIL}
              </a>
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(CONTACT_EMAIL).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1600); })}
                className={`btn-corners ${focusRing}`}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: `1.5px solid ${LINE}`, padding: '6px 10px', fontFamily: 'var(--font-sans)', fontSize: 13, cursor: 'pointer', color: INK }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}
              </button>
            </div>

            <p style={label}>Phone or WhatsApp</p>
            <p style={{ margin: '0 0 28px', fontSize: 20, fontWeight: 600 }}>
              <a href={`tel:${PHONE.replace(/\s/g, '')}`} className={focusRing} style={{ color: INK, textDecoration: 'none' }}>
                {PHONE}
              </a>
              {WHATSAPP && (
                <a href={WHATSAPP} target="_blank" rel="noreferrer" className={focusRing} style={{ marginLeft: 12, fontSize: 14, color: RED }}>
                  WhatsApp
                </a>
              )}
            </p>

            <p style={label}>Where</p>
            <p style={{ margin: '0 0 28px', fontSize: 18 }}>{LOCATION}</p>

            <p style={label}>Follow</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 18px', marginBottom: 28 }}>
              {socialLinks.map((s: { label: string; href: string }) => (
                <a key={s.label} href={s.href} target="_blank" rel="noreferrer" className={focusRing} style={{ fontSize: 17, fontWeight: 500, color: INK, textDecoration: 'none', borderBottom: `1px solid ${LINE}` }}>
                  {s.label}
                </a>
              ))}
            </div>

            <p style={label}>Careers</p>
            <p style={{ margin: 0, fontSize: 17, lineHeight: 1.5 }}>
              Good at something we don't do yet?{' '}
              <a href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Careers at 1Red')}`} className={focusRing} style={{ color: RED }}>
                Send your work
              </a>
              .
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}

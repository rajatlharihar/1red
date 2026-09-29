import {
  Panel,
  ContactHead,
  useContactForm,
  FieldsYou,
  FieldsNeed,
  FieldsIdea,
  EmailBody,
  PhoneBody,
  WhereBody,
  CareersBody,
  FollowBody,
  BoxMotif,
} from '../components/contact/ContactPanels';

/* ─── /contact ─────────────────────────────────────────────────────────────
 * The 3x3 print (Rajat's pick, 2026-09-30): the form over panels 1 to 3,
 * then one piece of contact per panel, and the print's blank panel holding
 * a box. Three columns, two on a tablet, one on a phone. */
const pad = 'clamp(7rem, 15vh, 10rem) clamp(1rem, 4vw, 5rem) clamp(4rem, 10vh, 7rem)';
const placeholderCss = `.contact-input::placeholder{color:rgba(242,239,232,0.55)}.contact-input:focus{border-bottom-color:#F2EFE8 !important}`;

export function ContactPage() {
  const f = useContactForm();
  return (
    <main style={{ background: '#fff', padding: pad }}>
      <style>{placeholderCss}</style>
      <div style={{ maxWidth: 1400, margin: '0 auto' }}>
        <ContactHead />
        <form onSubmit={f.submit} noValidate>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: 'clamp(14px, 1.6vw, 24px)', alignItems: 'stretch' }}>
              <Panel n={1} seed={5} eyebrow="Start a project" title="Hi there"><FieldsYou f={f} /></Panel>
              <Panel n={2} seed={12} eyebrow="Start a project" title="What do you need?" lag={0.05}><FieldsNeed f={f} /></Panel>
              <Panel n={3} seed={19} eyebrow="Start a project" title="What's the idea?" lag={0.1}><FieldsIdea f={f} /></Panel>
              <Panel n={4} seed={26} eyebrow="Email"><EmailBody /></Panel>
              <Panel n={5} seed={33} eyebrow="Phone or WhatsApp" lag={0.05}><PhoneBody /></Panel>
              <Panel n={6} seed={40} eyebrow="Where" lag={0.1}><WhereBody /></Panel>
              <Panel n={7} seed={47} eyebrow="Careers"><CareersBody /></Panel>
              <Panel seed={54} lag={0.05} style={{ minHeight: 200 }}>
                <BoxMotif />
              </Panel>
              <Panel n={8} seed={61} eyebrow="Follow" lag={0.1}><FollowBody /></Panel>
            </div>
        </form>
      </div>
    </main>
  );
}

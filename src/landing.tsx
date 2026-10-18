import { Link } from 'react-router-dom';
import { ArrowDownRight, ArrowRight, BadgeCheck, BookmarkCheck, Check, Download, FileDown, FileText, Info, Languages, Layers3, ListChecks, LockKeyhole, PenLine, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';
import { TEMPLATE_META, type TemplateId } from './model';
import { message } from './strings';

const features = [
  { icon: <BookmarkCheck size={20} />, title: 'A reusable profile', text: 'Keep the career details you use often in one local profile, ready for the next version.' },
  { icon: <Layers3 size={20} />, title: 'More than one version', text: 'Save different CVs for different opportunities without changing their source snapshots.' },
  { icon: <FileText size={20} />, title: 'A live preview', text: 'See your writing take shape as you edit, with selectable text and print-ready styling.' },
  { icon: <ListChecks size={20} />, title: 'Sections you control', text: 'Skip, reorder, show, or hide sections. Empty sections stay out of the final document.' },
  { icon: <PenLine size={20} />, title: 'Four original templates', text: 'Choose a clear, modern, compact, or editorial layout without changing your content.' },
  { icon: <RefreshCw size={20} />, title: 'A matching cover letter', text: 'Optional, editable, and never a requirement for building your CV.' },
  { icon: <Languages size={20} />, title: 'Localization-ready', text: 'Dates and phone details support international formats. English is the current interface language.' },
  { icon: <LockKeyhole size={20} />, title: 'A portable backup', text: 'Export or import your local data as JSON when you want to move or back it up.' },
];

const advice = [
  ['Tailor to the vacancy', 'Move the most relevant experience and skills forward. Keep the underlying facts accurate.'],
  ['Choose clear language', 'Prefer direct verbs and concrete details over a dense list of buzzwords.'],
  ['Use reverse chronology', 'For most work histories, start with your most recent role and move backwards.'],
  ['Show the action', 'Where useful, explain what you changed, delivered, supported, or learned.'],
  ['Proofread the final file', 'Check names, dates, links, and how the saved PDF looks at its actual size.'],
  ['Explain a gap only when useful', 'A short, honest note can add context; you do not have to include personal details.'],
];

const trustDetails = [
  { icon: <Download size={18} />, title: 'Free PDF download', sub: 'No paywall, no watermark' },
  { icon: <FileText size={18} />, title: 'No account needed', sub: 'Start writing right away' },
  { icon: <LockKeyhole size={18} />, title: 'Data stays on your device', sub: 'Private by design' },
];

function LandingTemplateCard({ id }: { id: TemplateId }) {
  return <Link className="landing-template-card" to="/templates"><TemplateMini id={id} /><div className="landing-template-meta"><div><strong>{TEMPLATE_META[id].name}</strong><span>{TEMPLATE_META[id].descriptor}</span></div><span className="template-arrow"><ArrowRight size={16} /></span></div></Link>;
}

export function TemplateMini({ id, fictional = false }: { id: TemplateId; fictional?: boolean }) {
  return <div className={`template-mini template-mini-${id}`} aria-label={`${TEMPLATE_META[id].name} CV preview`}>
    {fictional && <span className="mini-fictional">FICTIONAL SAMPLE</span>}
    <div className="mini-paper-head"><i /><b /><em /></div><div className="mini-paper-body"><span /><span /><span className="short" /><i /><span /><span className="short" /></div>
  </div>;
}

export function LandingPage() {
  return <main className="landing-page">
    <section className="hero-section">
      <div className="hero-glow" aria-hidden="true" />
      <div className="page-width hero-grid">
        <div className="hero-copy">
          <div className="hero-badge"><span className="hero-badge-dot"><Sparkles size={12} /></span> Free forever · No signup needed</div>
          <div className="hero-overline"><span className="overline-rule" />YOUR WORK, YOUR WAY</div>
          <h1>A CV that<br /><em>moves with you.</em></h1>
          <p className="hero-subtitle">Create, tailor, preview, and download a professional CV — completely free, right in your browser.</p>
          <div className="hero-actions"><Link to="/builder" className="button button-primary button-large">Create my CV free <ArrowRight size={18} /></Link><Link to="/templates" className="button button-outline button-large">Browse templates</Link></div>
          <p className="hero-promise"><ShieldCheck size={15} />{message('promise')}</p>
          <div className="hero-stats">
            <div className="hero-stat"><strong>04</strong><span>Original templates</span></div>
            <div className="hero-stat"><strong>A4</strong><span>Print-ready PDF</span></div>
            <div className="hero-stat"><strong>100%</strong><span>Private &amp; local</span></div>
          </div>
        </div>
        <div className="hero-visual" aria-label="Illustration of a CV being edited and previewed">
          <div className="mock-note"><span className="mock-note-dot" /> YOUR NEXT CHAPTER</div>
          <div className="hero-paper-stack">
            <div className="hero-paper-back" aria-hidden="true" />
            <div className="hero-paper">
              <div className="mock-person"><div><span className="mock-name-line" /><span className="mock-role-line" /></div><div className="mock-avatar">M</div></div>
              <div className="mock-contact"><span /><span /><span /></div>
              <div className="mock-section"><strong>PROFILE</strong><span /><span /><span className="short" /></div>
              <div className="mock-section"><strong>EXPERIENCE</strong><div className="mock-experience"><i /><div><b /><span /><span /></div></div><div className="mock-experience"><i /><div><b /><span /><span /></div></div></div>
              <div className="mock-section mock-skills"><strong>SKILLS</strong><div><i /><i /><i /></div></div>
              <span className="paper-stamp">PATHCV · PREVIEW</span>
            </div>
          </div>
          <div className="mock-pdf-chip"><FileDown size={14} /> Print-ready PDF</div>
          <div className="mock-floating-card"><span className="floating-check"><Check size={15} /></span><span><strong>Your draft</strong><small>Every detail stays editable.</small></span></div>
          <div className="hero-side-label">A calmer way to get started <ArrowDownRight size={16} /></div>
        </div>
      </div>
    </section>

    <section className="trust-strip page-width" aria-label="PathCV promises">{trustDetails.map((item) => <div key={item.title}><span className="trust-icon">{item.icon}</span><span>{item.title}<small>{item.sub}</small></span></div>)}</section>

    <section className="how-section section-space" id="how-it-works"><div className="page-width"><div className="section-heading-row"><div><div className="eyebrow">A SIMPLE ROUTE FORWARD</div><h2>Three steps.<br /><em>Your story.</em></h2></div><p>Start anywhere. Leave out what does not fit. You can change the order whenever you like.</p></div><div className="steps-grid">
      <article><div className="step-top"><span className="step-number">01</span><span className="step-icon"><PenLine size={19} /></span></div><div className="step-rule" /><h3>Add your details</h3><p>Write your experience, education, and strengths in a guided editor.</p></article>
      <article><div className="step-top"><span className="step-number">02</span><span className="step-icon"><Layers3 size={19} /></span></div><div className="step-rule" /><h3>Tailor for the opportunity</h3><p>Save a separate version and bring the most relevant details into focus.</p></article>
      <article><div className="step-top"><span className="step-number">03</span><span className="step-icon"><BadgeCheck size={19} /></span></div><div className="step-rule" /><h3>Download or print</h3><p>Review the live layout, then save or print a clean PDF from your browser.</p></article>
    </div></div></section>

    <section className="features-section section-space"><div className="page-width"><div className="eyebrow">BUILT AROUND YOUR CHOICES</div><div className="section-heading-row feature-heading"><h2>Useful, not complicated.</h2><p>No hidden steps or surprise gates. Just the parts that help you make a document that feels like yours.</p></div><div className="feature-grid">{features.map((feature) => <article className="feature-card" key={feature.title}><span className="feature-icon">{feature.icon}</span><h3>{feature.title}</h3><p>{feature.text}</p></article>)}</div></div></section>

    <section className="templates-section section-space"><div className="page-width"><div className="section-heading-row"><div><div className="eyebrow">FOUR WAYS TO FRAME IT</div><h2>Start with a shape.<br /><em>Make it your own.</em></h2></div><Link to="/templates" className="arrow-link">See all templates <ArrowRight size={16} /></Link></div><div className="landing-templates-grid">{(['clear', 'modern', 'compact', 'editorial'] as TemplateId[]).map((id) => <LandingTemplateCard key={id} id={id} />)}</div><p className="sample-disclaimer"><Info size={14} /> Template thumbnails are layout illustrations. Your own content stays editable and is not shared.</p></div></section>

    <section className="advice-section section-space"><div className="page-width advice-layout"><div className="advice-intro"><div className="eyebrow">A FEW GOOD HABITS</div><h2>Make the reader’s next step easy.</h2><p>A CV cannot promise an outcome. Clear choices can help someone understand your experience.</p><Link to="/help" className="text-link">Read the practical FAQs <ArrowRight size={15} /></Link></div><div className="advice-list">{advice.map(([title, body], index) => <article key={title}><span>{String(index + 1).padStart(2, '0')}</span><div><h3>{title}</h3><p>{body}</p></div></article>)}</div></div></section>

    <section className="faq-section section-space"><div className="page-width faq-layout"><div><div className="eyebrow">GOOD TO KNOW</div><h2>Small answers,<br /><em>no fine print.</em></h2><Link to="/help" className="arrow-link">Visit Help <ArrowRight size={16} /></Link></div><div className="faq-list"><details><summary>Is PathCV really free?</summary><p>Yes. Building, all four templates, and the print-to-PDF flow are free. There is no paywall.</p></details><details><summary>Do I need an account?</summary><p>No account is needed. Your information stays in this browser on this device.</p></details><details><summary>Does PathCV translate my CV?</summary><p>No. The interface is prepared for future localization, but your CV content is not automatically translated.</p></details><details><summary>Will my CV pass every ATS?</summary><p>No tool can guarantee that. The layouts are designed to be straightforward and readable, but outcomes vary.</p></details></div></div></section>

    <section className="last-cta-section"><div className="page-width"><div className="last-cta">
      <div className="last-cta-copy"><div className="eyebrow">READY WHEN YOU ARE</div><h2>Your next role starts with a clear CV.</h2><p>Build it free, keep every version, and download a polished PDF — no signup, no watermark.</p></div>
      <div className="last-cta-actions"><Link to="/builder" className="button button-light button-large">Create my CV free <ArrowRight size={18} /></Link><Link to="/templates" className="button button-outline button-large">Browse templates</Link></div>
    </div></div></section>

  </main>;
}

import { Link } from 'react-router-dom';
import { ArrowDownRight, ArrowRight, BadgeCheck, BookOpen, BookmarkCheck, Check, Code2, Download, FileDown, FileText, GraduationCap, HeartPulse, History, Info, Languages, Layers3, ListChecks, LockKeyhole, Palette, PenLine, RefreshCw, ShieldCheck, Sparkles, Store, Zap } from 'lucide-react';
import { TEMPLATE_META, TEMPLATE_ORDER, type TemplateId } from './model';
import { useAppData } from './app-context';
import { CountUp, Reveal } from './reveal';
import { message } from './strings';

const features = [
  { icon: <BookmarkCheck size={20} />, title: 'A reusable profile', text: 'Keep the career details you use often in one local profile, ready for the next version.' },
  { icon: <Layers3 size={20} />, title: 'More than one version', text: 'Save different CVs for different opportunities without changing their source snapshots.' },
  { icon: <FileText size={20} />, title: 'A live preview', text: 'See your writing take shape as you edit, with selectable text and print-ready styling.' },
  { icon: <ListChecks size={20} />, title: 'Sections you control', text: 'Skip, reorder, show, or hide sections. Empty sections stay out of the final document.' },
  { icon: <PenLine size={20} />, title: 'Ten original templates', text: 'Choose from ten layouts — classic to creative — without changing your content.' },
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

const personas = [
  { kit: 'student', icon: <GraduationCap size={20} />, title: 'Students', text: 'First CV? Start with strengths, projects, and volunteering.' },
  { kit: 'engineer', icon: <Code2 size={20} />, title: 'Engineers', text: 'Show stack, shipped work, and measurable impact.' },
  { kit: 'designer', icon: <Palette size={20} />, title: 'Designers', text: 'Lead with process, systems, and outcomes.' },
  { kit: 'teacher', icon: <BookOpen size={20} />, title: 'Teachers', text: 'Highlight classes, results, and care for learners.' },
  { kit: 'nurse', icon: <HeartPulse size={20} />, title: 'Healthcare', text: 'Wards, skills, and calm, trusted experience.' },
  { kit: 'retail', icon: <Store size={20} />, title: 'Retail & service', text: 'Customers served, teams trained, shifts owned.' },
];

const stats = [
  { value: 6, suffix: '', label: 'Role starter kits' },
  { value: 10, suffix: '', label: 'Original templates' },
  { value: 9, suffix: '', label: 'Guided builder steps' },
  { value: 100, suffix: '%', label: 'Private & free' },
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
  const { data } = useAppData();
  const latest = [...data.documents].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  return <main className="landing-page">
    <section className="hero-section">
      <div className="hero-glow" aria-hidden="true" />
      <div className="hero-orb hero-orb-a" aria-hidden="true" />
      <div className="hero-orb hero-orb-b" aria-hidden="true" />
      <div className="page-width hero-grid">
        <div className="hero-copy">
          <div className="hero-badge"><span className="hero-badge-dot"><Sparkles size={12} /></span> Free forever · No signup needed</div>
          <div className="hero-overline"><span className="overline-rule" />YOUR WORK, YOUR WAY</div>
          <h1>A CV that<br /><em>moves with you.</em></h1>
          <p className="hero-subtitle">Create, tailor, preview, and download a professional CV — completely free, right in your browser.</p>
          <div className="hero-actions"><Link to="/builder" className="button button-primary button-large">Create my CV free <ArrowRight size={18} /></Link><Link to="/templates" className="button button-outline button-large">Browse templates</Link></div>
          <p className="hero-promise"><ShieldCheck size={15} />{message('promise')}</p>
          {latest && <Link to={`/builder?id=${encodeURIComponent(latest.id)}`} className="resume-card"><span className="resume-icon"><History size={16} /></span><span className="resume-text"><strong>Continue: {latest.name || 'Untitled CV'}</strong><small>Pick up where you left off</small></span><ArrowRight size={16} /></Link>}
          <Link to="/express" className="express-link"><Zap size={14} /> In a rush? Try Express mode — a CV in about 2 minutes</Link>
          <div className="hero-stats">
            <div className="hero-stat"><strong>10</strong><span>Original templates</span></div>
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
      <div className="hero-wave" aria-hidden="true"><svg viewBox="0 0 1440 70" preserveAspectRatio="none"><path d="M0,40 C240,75 480,5 720,30 C960,55 1200,70 1440,35 L1440,70 L0,70 Z" /></svg></div>
    </section>

    <section className="trust-strip page-width" aria-label="PathCV promises">{trustDetails.map((item, i) => <Reveal key={item.title} delay={i * 90}><div className="trust-card"><span className="trust-icon">{item.icon}</span><span>{item.title}<small>{item.sub}</small></span></div></Reveal>)}</section>

    <section className="stats-band" aria-label="PathCV at a glance"><div className="page-width stats-grid">{stats.map((s) => <div className="stat-item" key={s.label}><strong><CountUp to={s.value} suffix={s.suffix} /></strong><span>{s.label}</span></div>)}</div></section>

    <section className="how-section section-space" id="how-it-works"><div className="page-width"><Reveal><div className="section-heading-row"><div><div className="eyebrow">A SIMPLE ROUTE FORWARD</div><h2>Three steps.<br /><em>Your story.</em></h2></div><p>Start anywhere. Leave out what does not fit. You can change the order whenever you like.</p></div></Reveal><div className="steps-grid">
      <Reveal delay={0}><article><div className="step-top"><span className="step-number">01</span><span className="step-icon"><PenLine size={19} /></span></div><div className="step-rule" /><h3>Add your details</h3><p>Write your experience, education, and strengths in a guided editor.</p></article></Reveal>
      <Reveal delay={110}><article><div className="step-top"><span className="step-number">02</span><span className="step-icon"><Layers3 size={19} /></span></div><div className="step-rule" /><h3>Tailor for the opportunity</h3><p>Save a separate version and bring the most relevant details into focus.</p></article></Reveal>
      <Reveal delay={220}><article><div className="step-top"><span className="step-number">03</span><span className="step-icon"><BadgeCheck size={19} /></span></div><div className="step-rule" /><h3>Download or print</h3><p>Review the live layout, then save or print a clean PDF from your browser.</p></article></Reveal>
    </div></div></section>

    <section className="features-section section-space"><div className="page-width"><Reveal><div className="eyebrow">BUILT AROUND YOUR CHOICES</div></Reveal><Reveal delay={80}><div className="section-heading-row feature-heading"><h2>Useful, not complicated.</h2><p>No hidden steps or surprise gates. Just the parts that help you make a document that feels like yours.</p></div></Reveal><div className="feature-grid">{features.map((feature, i) => <Reveal key={feature.title} delay={(i % 4) * 80}><article className="feature-card"><span className="feature-icon">{feature.icon}</span><h3>{feature.title}</h3><p>{feature.text}</p></article></Reveal>)}</div></div></section>

    <section className="personas-section section-space"><div className="page-width"><Reveal><div className="section-heading-row"><div><div className="eyebrow">MADE FOR EVERY STAGE</div><h2>Start as <em>yourself.</em></h2></div><Link to="/express" className="arrow-link">Try Express mode <ArrowRight size={16} /></Link></div></Reveal><div className="personas-grid">{personas.map((persona, i) => <Reveal key={persona.kit} delay={(i % 3) * 90}><Link className="persona-card" to={`/express?kit=${persona.kit}`}><span className="persona-icon">{persona.icon}</span><div><strong>{persona.title}</strong><p>{persona.text}</p></div><span className="persona-go"><ArrowRight size={16} /></span></Link></Reveal>)}</div></div></section>

    <section className="templates-section section-space"><div className="page-width"><Reveal><div className="section-heading-row"><div><div className="eyebrow">TEN WAYS TO FRAME IT</div><h2>Start with a shape.<br /><em>Make it your own.</em></h2></div><Link to="/templates" className="arrow-link">See all templates <ArrowRight size={16} /></Link></div></Reveal><div className="landing-templates-grid">{TEMPLATE_ORDER.map((id, i) => <Reveal key={id} delay={i * 90}><LandingTemplateCard id={id} /></Reveal>)}</div><Reveal><p className="sample-disclaimer"><Info size={14} /> Template thumbnails are layout illustrations. Your own content stays editable and is not shared.</p></Reveal></div></section>

    <section className="advice-section section-space"><div className="page-width advice-layout"><Reveal><div className="advice-intro"><div className="eyebrow">A FEW GOOD HABITS</div><h2>Make the reader’s next step easy.</h2><p>A CV cannot promise an outcome. Clear choices can help someone understand your experience.</p><Link to="/help" className="text-link">Read the practical FAQs <ArrowRight size={15} /></Link></div></Reveal><div className="advice-list">{advice.map(([title, body], index) => <Reveal key={title} delay={(index % 2) * 90}><article><span>{String(index + 1).padStart(2, '0')}</span><div><h3>{title}</h3><p>{body}</p></div></article></Reveal>)}</div></div></section>

    <section className="faq-section section-space"><div className="page-width faq-layout"><Reveal><div><div className="eyebrow">GOOD TO KNOW</div><h2>Small answers,<br /><em>no fine print.</em></h2><Link to="/help" className="arrow-link">Visit Help <ArrowRight size={16} /></Link><Link to="/resources" className="arrow-link">Read in-depth guides <ArrowRight size={16} /></Link></div></Reveal><Reveal delay={120}><div className="faq-list"><details><summary>Is PathCV really free?</summary><p>Yes. Building, all ten templates, and the print-to-PDF flow are free. There is no paywall.</p></details><details><summary>Do I need an account?</summary><p>No account is needed. Your information stays in this browser on this device.</p></details><details><summary>Does PathCV translate my CV?</summary><p>No. The interface is prepared for future localization, but your CV content is not automatically translated.</p></details><details><summary>Will my CV pass every ATS?</summary><p>No tool can guarantee that. The layouts are designed to be straightforward and readable, but outcomes vary. <Link to="/resources/tailor-cv-for-ats">Read our ATS guide</Link>.</p></details></div></Reveal></div></section>

    <section className="last-cta-section"><div className="page-width"><Reveal><div className="last-cta">
      <div className="last-cta-copy"><div className="eyebrow">READY WHEN YOU ARE</div><h2>Your next role starts with a clear CV.</h2><p>Build it free, keep every version, and download a polished PDF — no signup, no watermark.</p></div>
      <div className="last-cta-actions"><Link to="/builder" className="button button-light button-large">Create my CV free <ArrowRight size={18} /></Link><Link to="/templates" className="button button-outline button-large">Browse templates</Link></div>
    </div></Reveal></div></section>

  </main>;
}

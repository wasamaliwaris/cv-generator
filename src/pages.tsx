import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, BadgeCheck, Copy, FilePlus2, Heart, Mail, Pencil, Send, ShieldCheck, Trash2 } from 'lucide-react';
import type { CVDocument, Profile, TemplateId } from './model';
import { TEMPLATE_META, TEMPLATE_ORDER, isValidEmail, newDocument, sampleProfile, uid } from './model';
import { scoreCV } from './cv-utils';
import { useAppData } from './app-context';
import { AdditionalSectionFields, EducationFields, LanguageFields, PersonalFields, SkillsFields, SummaryFields, WorkExperienceFields } from './forms';
import { DataTools } from './data-tools';
import { TemplateMini } from './landing';
import { CVPreview } from './cv-preview';
import { CONTACT_EMAIL } from './site';
import { Button, EmptyState, Field, InlineNotice, LocalDataNotice, PageHeading, SelectField, TextAreaField, usePageTitle } from './ui';

const templateIds: TemplateId[] = TEMPLATE_ORDER;

function displaySampleProfile(): Profile {
  const profile = sampleProfile();
  const clean = (value: string) => value.replace(/ · fictional( sample)?/g, '');
  profile.personal.headline = clean(profile.personal.headline);
  profile.workExperience.forEach((entry) => { entry.employer = clean(entry.employer); });
  profile.education.forEach((entry) => { entry.institution = clean(entry.institution); });
  return profile;
}

export function TemplatesPage() {
  const [filter, setFilter] = useState('All');
  const navigate = useNavigate();
  const filters = ['All', 'Classic', 'Modern', 'Compact', 'Creative'];
  const visible = templateIds.filter((id) => filter === 'All' || TEMPLATE_META[id].category === filter);
  const sampleDocs = useMemo(() => Object.fromEntries(templateIds.map((id) => [id, newDocument(displaySampleProfile(), id, 'Sample CV')])) as Record<TemplateId, CVDocument>, []);
  return <main className="page-width standard-page templates-page">
    <PageHeading eyebrow="TEN ORIGINAL LAYOUTS" title="A good starting point." description="Every preview shows the same fictional sample CV, so you can compare designs fairly. Pick a structure that suits your story — switching designs never removes your content." />
    <div className="template-filters" role="group" aria-label="Filter templates">{filters.map((item) => <button type="button" key={item} className={filter === item ? 'active' : ''} aria-pressed={filter === item} onClick={() => setFilter(item)}>{item}</button>)}</div>
    <div className="gallery-grid">{visible.map((id) => <article className="gallery-card" key={id}><div className="gallery-preview"><div className="gallery-sample" aria-hidden="true" ref={(node) => { node?.setAttribute('inert', ''); }}><CVPreview document={sampleDocs[id]} showControls={false} printable={false} paperId={`sample-cv-${id}`} /></div><span className="gallery-stamp">Fictional sample</span><span className="gallery-category">{TEMPLATE_META[id].category}</span>{id === 'modern' && <span className="gallery-popular">Most popular</span>}</div><div className="gallery-card-body"><h2>{TEMPLATE_META[id].name}</h2><p>{TEMPLATE_META[id].descriptor}</p><p className="fictional-copy">Previewed with a fictional sample CV · Maya Rahman, product designer</p><div className="gallery-card-actions"><Button type="button" onClick={() => navigate(`/builder?template=${id}`)}>Use this template <ArrowRight size={16} /></Button><Button type="button" variant="secondary" onClick={() => navigate(`/builder?template=${id}&sample=1`)}>Try with sample data</Button></div></div></article>)}</div>
    <InlineNotice tone="info">Every preview shows the same fictional sample CV, so designs are easy to compare. Your own details are never used in this gallery.</InlineNotice>
  </main>;
}

const faqGroups = [
  { q: 'Is PathCV free?', a: 'Yes. Building, all ten templates, and PDF export are free. There is no paywall, watermark, or signup requirement.' },
  { q: 'Do I need an account?', a: 'No. There is no account in this build. Your CV data is saved only in localStorage in this browser on this device.' },
  { q: 'Where is my data saved?', a: 'In this browser on this device only. It is not synced to an account or cloud. Clearing browser data removes it; you can export a JSON backup from Profile or Saved CVs.' },
  { q: 'Can I create multiple CVs?', a: 'Yes. Each saved CV is a separate local document with its own snapshot. Open another version without changing the source profile.' },
  { q: 'Can I change sections and their order?', a: 'Yes. In Choose design, show or hide sections and move them up or down. Empty sections are omitted from the preview.' },
  { q: 'Does PathCV translate my content?', a: 'No. The interface is structured so more languages can be added later, but it is English-only today. Your CV content is not automatically translated.' },
  { q: 'Is the CV guaranteed to pass ATS?', a: 'No. These templates are designed to be straightforward and readable, but no tool can guarantee how a particular system or employer will handle a CV.' },
  { q: 'How do I remove my data?', a: 'Use Clear all data on Profile or Saved CVs and confirm the action. You can also clear this site’s browser storage through your browser settings.' },
  { q: 'How do I save a PDF?', a: 'Choose “Download PDF (opens print dialog)” and select “Save as PDF” in your browser. For the intended layout, select A4 and turn off browser headers and footers.' },
  { q: 'Can I try a template with sample data?', a: 'Yes. On Templates, every design shows a fictional sample CV. Choose “Try with sample data” to open it in the builder, then replace each detail with your own.' },
  { q: 'What is Express mode?', a: 'Express mode builds a CV from one short page of essentials in about 2 minutes. You land in the builder at the design step, where everything stays editable and you can download the PDF.' },
  { q: 'Are there keyboard shortcuts?', a: 'In the builder: Ctrl (or ⌘) + Z undoes, Ctrl/⌘ + Shift + Z or Ctrl + Y redoes, and Alt + Left/Right arrows move between steps. Shortcuts never trigger while you are typing.' },
  { q: 'Can I get a plain-text version of my CV?', a: 'Yes. On the Review step, copy a clean plain-text version for “paste your CV” boxes on job portals, or download it as a .txt file.' },
  { q: 'What is the completeness score?', a: 'A friendly 0–100 guide showing how much of the essentials your CV covers — name, contact, summary, roles, skills, and more. Each missing item shows its point value on the Review step.' },
  { q: 'Can I contact PathCV?', a: 'Yes. The Contact page lets you send a question, bug report, or idea through your own email app. We read every message.' },
];

export function HelpPage() {
  return <main className="page-width standard-page help-page"><PageHeading eyebrow="HELP, WITHOUT THE MYSTERY" title="Straight answers." description="What the builder does, what it does not do, and where your information lives." /><div className="help-top-note"><LocalDataNotice /></div><div className="help-top-note"><InlineNotice tone="info">Want the full story behind these answers? Our <Link to="/resources">guides & articles</Link> cover ATS tailoring, cover letters, and role-specific advice.</InlineNotice></div><div className="help-faq-list">{faqGroups.map((item) => <details key={item.q}><summary>{item.q}<span>+</span></summary><p>{item.a}</p></details>)}</div><section id="contact" className="contact-placeholder"><div className="eyebrow">CONTACT</div><h2>Prefer to ask directly?</h2><p>Send us a question, a bug report, or a template idea — we read every message and reply from a real inbox.</p><div className="contact-placeholder-actions"><Link to="/contact" className="button button-primary">Contact us <ArrowRight size={15} /></Link><Link to="/privacy" className="text-link">Read the privacy details</Link></div></section></main>;
}

export function PrivacyPage() {
  return <main className="page-width standard-page privacy-page"><PageHeading eyebrow="YOUR DATA, YOUR DEVICE" title="Privacy by design." description="A plain-language explanation of how this version of PathCV handles your CV information." /><div className="privacy-callout"><div className="privacy-symbol">◎</div><div><h2>Stored in this browser only</h2><p>This build has no account, cloud sync, or CV upload service. Your profile, saved CV versions, photo, and cover-letter draft are held in browser localStorage on this device.</p></div></div><div className="privacy-content-grid"><aside className="privacy-toc"><strong>On this page</strong><a href="#storage">Storage</a><a href="#backup">Backups and imports</a><a href="#removal">Removing data</a><a href="#limits">Current limitations</a></aside><div className="privacy-article"><section id="storage"><h2>What is stored, and where?</h2><p>PathCV stores the profile, CV snapshots, template preferences, and cover-letter draft in this browser’s localStorage. The CV content is not sent to a PathCV account or cloud service by this build. The browser still downloads the app itself like any website.</p><p>Local storage is tied to this browser and device. It is not a secure vault: anyone with access to this browser profile may be able to use or inspect its saved data. Avoid entering information you do not want stored here, especially on a shared device.</p></section><section id="backup"><h2>Exporting and importing</h2><p>Export JSON creates a file containing your local profile, saved CV documents, and cover-letter draft. The file is downloaded to your device; keep it somewhere private. Import reads a JSON file you choose, validates its basic structure, and asks before replacing current PathCV data.</p></section><section id="removal"><h2>Removing your data</h2><p>Use “Clear all data” on the Profile or Saved CVs page and confirm. This removes PathCV’s local data from this browser. Clearing site data or browser storage has the same effect. If you previously exported JSON, remove that file separately.</p></section><section id="limits"><h2>What this build does not do</h2><ul><li>No account, cloud save, public sharing link, or CV upload.</li><li>No automatic translation, AI writing, or ATS scoring.</li><li>No guarantee of interviews, employment, or ATS results.</li><li>No DOCX export. PDF saving uses the browser print dialog, where you can choose “Save as PDF”.</li></ul><p>PathCV is English-only in this build. Dates use your browser locale when a month name is displayed; your CV wording remains as you entered it.</p></section></div></div></main>;
}

export function ProfilePage() {
  const { data, updateProfile, saveState } = useAppData();
  const profile = data.profile;
  const sectionNames = ['Personal details', 'Profile summary', 'Work experience', 'Education and training', 'Skills', 'Languages', 'Additional sections'];
  return <main className="page-width standard-page profile-page"><PageHeading eyebrow="LOCAL CAREER PROFILE" title="Your reusable profile." description="Keep useful career details here, then copy them into a new CV when you choose. Editing a saved CV does not change this profile automatically." actions={<Link to="/builder?template=clear" className="button button-primary"><FilePlus2 size={16} /> Create CV from profile</Link>} /><LocalDataNotice /><div className="profile-save-line"><span className={`save-status ${saveState}`}><span className="status-dot" />{saveState === 'saving' ? 'Saving…' : saveState === 'error' ? 'Could not save' : 'Saved locally'}</span><span>Only you, using this browser, can access this local profile.</span></div>
    <div className="profile-edit-sections">{sectionNames.map((name, index) => <details className="profile-accordion" key={name} open><summary><span className="profile-accordion-number">{String(index + 1).padStart(2, '0')}</span><strong>{name}</strong><span className="accordion-chevron">⌄</span></summary><div className="profile-accordion-content">
      {index === 0 && <PersonalFields profile={profile} onChange={updateProfile} />}
      {index === 1 && <SummaryFields profile={profile} onChange={updateProfile} />}
      {index === 2 && <WorkExperienceFields profile={profile} onChange={updateProfile} />}
      {index === 3 && <EducationFields profile={profile} onChange={updateProfile} />}
      {index === 4 && <SkillsFields profile={profile} onChange={updateProfile} />}
      {index === 5 && <LanguageFields profile={profile} onChange={updateProfile} />}
      {index === 6 && <AdditionalSectionFields profile={profile} onChange={updateProfile} />}
    </div></details>)}</div>
    <DataTools />
  </main>;
}

function formatUpdated(value: string) {
  try { return new Intl.DateTimeFormat(typeof navigator !== 'undefined' ? navigator.language : 'en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)); }
  catch { return 'Recently updated'; }
}

export function MyCVsPage() {
  const { data, setData, saveState } = useAppData();
  const [renameId, setRenameId] = useState('');
  const [renameValue, setRenameValue] = useState('');
  const documents = useMemo(() => [...data.documents].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), [data.documents]);
  const duplicate = (doc: CVDocument) => {
    const copy = { ...structuredClone(doc), id: uid(), name: `${doc.name || 'My CV'} — copy`, updatedAt: new Date().toISOString() };
    setData((current) => ({ ...current, documents: [copy, ...current.documents] }));
  };
  const deleteDocument = (doc: CVDocument) => {
    if (!window.confirm(`Delete “${doc.name}” from this browser? This cannot be undone.`)) return;
    setData((current) => ({ ...current, documents: current.documents.filter((item) => item.id !== doc.id) }));
  };
  const startRename = (doc: CVDocument) => { setRenameId(doc.id); setRenameValue(doc.name); };
  const saveRename = (doc: CVDocument) => {
    const name = renameValue.trim() || 'Untitled CV';
    setData((current) => ({ ...current, documents: current.documents.map((item) => item.id === doc.id ? { ...item, name, updatedAt: new Date().toISOString() } : item) }));
    setRenameId('');
  };

  return <main className="page-width standard-page my-cvs-page"><PageHeading eyebrow="SAVED ON THIS DEVICE" title="Your CV versions." description="Each version has its own saved snapshot. Open one to continue editing without replacing the others." actions={<Link to="/builder?template=clear" className="button button-primary"><FilePlus2 size={16} /> New CV from profile</Link>} /><LocalDataNotice /><div className="profile-save-line"><span className={`save-status ${saveState}`}><span className="status-dot" />{saveState === 'saving' ? 'Saving…' : saveState === 'error' ? 'Save issue' : 'Saved locally'}</span><span>{documents.length} {documents.length === 1 ? 'version' : 'versions'} stored in this browser</span></div>
    {documents.length === 0 ? <EmptyState title="No saved CVs yet" description="Start a new CV from your reusable profile, or begin with a blank one. Your first draft will save here automatically." action={<div className="empty-actions"><Link className="button button-primary" to="/builder?template=clear">Create from profile</Link><Link className="button button-secondary" to="/builder">Start from scratch</Link></div>} /> : <div className="saved-cv-grid">{documents.map((doc) => {
      const p = doc.profileSnapshot;
      const person = [p.personal.firstName, p.personal.lastName].filter(Boolean).join(' ') || 'Name not added';
      const count = p.workExperience.length + p.education.length + p.skills.length + p.languages.length + p.optionalSections.length;
      return <article className="saved-cv-card" key={doc.id}><div className="saved-cv-card-top"><TemplateMini id={doc.templateId} /><div className="saved-cv-label"><span className="template-label">{TEMPLATE_META[doc.templateId].name}</span><span>{formatUpdated(doc.updatedAt)}</span></div></div><div className="saved-cv-card-body">{renameId === doc.id ? <div className="rename-form"><label htmlFor={`rename-${doc.id}`}>CV version name</label><input id={`rename-${doc.id}`} value={renameValue} autoFocus onChange={(e) => setRenameValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') saveRename(doc); if (e.key === 'Escape') setRenameId(''); }} /><div><Button type="button" onClick={() => saveRename(doc)}>Save name</Button><Button type="button" variant="ghost" onClick={() => setRenameId('')}>Cancel</Button></div></div> : <><h2>{doc.name || 'Untitled CV'}</h2><p>{person}{p.personal.headline ? ` · ${p.personal.headline}` : ''}</p><p className="saved-cv-count">{count} {count === 1 ? 'entry' : 'entries'} · {p.workExperience.length} work roles</p><p className="saved-cv-score"><span className="score-pill">{scoreCV(doc).score}% complete</span></p><div className="saved-cv-actions"><Link className="button button-primary" to={`/builder?id=${encodeURIComponent(doc.id)}`}>Open version <ArrowRight size={15} /></Link><div className="saved-icon-actions"><button type="button" aria-label={`Rename ${doc.name}`} onClick={() => startRename(doc)}><Pencil size={15} /></button><button type="button" aria-label={`Duplicate ${doc.name}`} onClick={() => duplicate(doc)}><Copy size={15} /></button><button type="button" aria-label={`Delete ${doc.name}`} onClick={() => deleteDocument(doc)}><Trash2 size={15} /></button></div></div></>}</div></article>;
    })}</div>}
    <DataTools />
  </main>;
}

export function AboutPage() {
  usePageTitle('About us \u2014 PathCV');
  return <main className="page-width standard-page about-page"><PageHeading eyebrow="ABOUT PATHCV" title="Built for job-seekers, not for signups." description="PathCV is a free CV builder that runs entirely in your browser. No accounts, no watermarks, no paywalled download \u2014 just a calm tool and honest guides." />
    <div className="about-grid"><div className="about-story"><h2>Why we built this</h2><p>PathCV started with a familiar frustration: most \u201cfree\u201d CV builders let you build for an hour, then charge you at the download button. We thought the tool should respect the effort people put into it \u2014 so we made the builder, all ten templates, and the PDF export free, with no account standing between you and your own work.</p><p>We are a small team who believes career tools should be private by default. A CV holds your life story; it should not have to travel to a server to become a PDF. That is why PathCV stores everything in your own browser, on your own device.</p><h2>What we believe</h2><div className="about-principles"><div className="about-principle"><span className="about-icon"><Heart size={20} /></span><h3>Free means free</h3><p>Building, templates, and PDF export cost nothing. There is no premium tier holding your own work hostage.</p></div><div className="about-principle"><span className="about-icon"><ShieldCheck size={20} /></span><h3>Private by design</h3><p>No accounts, no uploads, no tracking of your CV content. Clear your browser data and we hold nothing.</p></div><div className="about-principle"><span className="about-icon"><BadgeCheck size={20} /></span><h3>Honest by default</h3><p>We make no promises about interviews or ATS scores. Our guides say what works, what is myth, and what nobody can guarantee.</p></div></div></div>
    <aside className="about-facts"><div className="about-facts-card"><h2>PathCV in numbers</h2><ul><li><strong>10</strong><span>original CV templates</span></li><li><strong>6</strong><span>in-depth career guides</span></li><li><strong>6</strong><span>role kits for fast starts</span></li><li><strong>0</strong><span>accounts required, ever</span></li></ul><div className="about-facts-actions"><Link to="/builder" className="button button-primary">Build my CV <ArrowRight size={16} /></Link><Link to="/contact" className="button button-secondary">Contact us</Link></div></div></aside></div>
  </main>;
}

const CONTACT_TOPICS = ['General question', 'Bug report', 'Template or feature idea', 'Privacy & your data', 'Something else'];

export function ContactPage() {
  usePageTitle('Contact \u2014 PathCV');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState(CONTACT_TOPICS[0]);
  const [details, setDetails] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!details.trim()) { setError('Please write a few words about how we can help.'); return; }
    if (email.trim() && !isValidEmail(email)) { setError('That email address does not look complete.'); return; }
    setError('');
    const subject = encodeURIComponent(`[PathCV] ${topic}${name.trim() ? ` \u2014 ${name.trim()}` : ''}`);
    const body = encodeURIComponent(`${details.trim()}${email.trim() ? `\n\nReply to: ${email.trim()}` : ''}${name.trim() ? `\nFrom: ${name.trim()}` : ''}`);
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    setSent(true);
  };
  return <main className="page-width standard-page contact-page"><PageHeading eyebrow="CONTACT" title="Talk to us." description="Questions, bug reports, template ideas, or privacy concerns \u2014 we read every message." />
    <div className="contact-grid"><form className="contact-form" onSubmit={submit}><div className="form-grid form-grid-two"><Field label="Your name (optional)" value={name} onChange={(e) => setName(e.target.value)} placeholder="Maya Rahman" autoComplete="name" /><Field label="Email for reply (optional)" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" inputMode="email" /></div><SelectField label="Topic" value={topic} onChange={(e) => setTopic(e.target.value)}>{CONTACT_TOPICS.map((item) => <option key={item} value={item}>{item}</option>)}</SelectField><TextAreaField label="Message" rows={7} value={details} onChange={(e) => setDetails(e.target.value)} placeholder="How can we help?" hint="A few sentences is plenty. Please do not paste sensitive documents \u2014 describe the issue instead." />{error && <p className="field-error" role="alert">{error}</p>}{sent && <InlineNotice tone="success">Your email app should have opened with your message ready to send. Nothing goes out until you press send there.</InlineNotice>}<div><Button type="submit">Send via email <Send size={16} /></Button></div><p className="contact-note">This opens your own email app addressed to {CONTACT_EMAIL}. We usually reply within a few days.</p></form>
    <aside className="contact-side"><div className="contact-card"><span className="about-icon"><Mail size={20} /></span><h2>Prefer email directly?</h2><p>Write to <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> any time. A support email is the only thing that ever leaves your device \u2014 and only when you choose to write.</p></div><div className="contact-card"><h2>Looking for answers?</h2><p>Most questions are covered in <Link to="/help">Help</Link> or our <Link to="/resources">guides & articles</Link>, including ATS tailoring and cover letters.</p></div></aside></div>
  </main>;
}

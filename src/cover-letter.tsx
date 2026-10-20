import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Download, FileText, Lightbulb } from 'lucide-react';
import { ACCENT_PALETTE, TEMPLATE_META, TEMPLATE_ORDER, type CoverLetterData, type TemplateId } from './model';
import { useAppData } from './app-context';
import { Button, Field, InlineNotice, SelectField, TextAreaField, usePageMeta } from './ui';
import { message } from './strings';

function displayDate(value: string) {
  if (!value) return '';
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(typeof navigator !== 'undefined' ? navigator.language : 'en', { dateStyle: 'long' }).format(date);
}

function CoverLetterPreview({ letter, profile }: { letter: CoverLetterData; profile: ReturnType<typeof useAppData>['data']['profile'] }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLElement>(null);
  const [scale, setScale] = useState(0.6);
  const [height, setHeight] = useState(1123);
  const p = profile.personal;
  const name = [p.firstName, p.lastName].filter(Boolean).join(' ');
  const contacts = [p.email, p.phone.trim() && [p.phoneCountryCode, p.phone].filter(Boolean).join(' '), [p.city, p.region, p.country].filter(Boolean).join(', '), p.website].filter((value): value is string => Boolean(value));
  const style = { '--cv-accent': letter.accentColor } as React.CSSProperties;
  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const update = () => setScale(Math.min(1, Math.max(0.3, viewport.clientWidth / 794)));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);
  useLayoutEffect(() => {
    const paper = paperRef.current;
    if (!paper) return;
    const update = () => setHeight(Math.max(1123, paper.scrollHeight));
    update();
    const observer = new ResizeObserver(update);
    observer.observe(paper);
    return () => observer.disconnect();
  }, [letter, profile]);
  return <div className="letter-preview-viewport" ref={viewportRef}><div className="letter-preview-stage" style={{ width: `${210 * scale}mm`, height: `${height * scale}px` }}><article ref={paperRef} id="printable-letter" className={`letter-paper printable-document cv-${letter.templateId}`} style={{ ...style, transform: `scale(${scale})` }}>
    <header className="letter-header"><div><h1>{name || <span className="letter-placeholder">Your name</span>}</h1>{p.headline && <p>{p.headline}</p>}</div><div className="letter-contact">{contacts.map((value, index) => <span key={`${value}-${index}`}>{value}</span>)}</div></header>
    <div className="letter-date-line">{displayDate(letter.date)}</div>
    <div className="letter-recipient">{letter.recipient && <div>{letter.recipient}</div>}{letter.organization && <div>{letter.organization}</div>}{letter.role && <div>Re: {letter.role}</div>}</div>
    <div className="letter-copy"><p>{letter.greeting || 'Dear Hiring Team,'}</p>{letter.opening && <p>{letter.opening}</p>}{letter.body.split(/\n\s*\n/).map((paragraph, index) => paragraph.trim() && <p key={index}>{paragraph}</p>)}{letter.closing && <p>{letter.closing}</p>}<p className="letter-signature">{letter.signature || name || <span className="letter-placeholder">Your name</span>}</p></div>
    <footer className="cv-print-footer">Made with PathCV</footer>
  </article></div></div>;
}

export function CoverLetterPage() {
  usePageMeta({ title: 'Free Cover Letter Builder \u2014 PathCV', description: 'Write a matching cover letter with live preview and free PDF export. Optional, editable, and never required.', path: '/cover-letter' });
  const { data, setData, saveState } = useAppData();
  const letter = data.coverLetter;
  const set = (key: 'recipient' | 'organization' | 'role' | 'date' | 'greeting' | 'opening' | 'body' | 'closing' | 'signature' | 'accentColor', value: string) => setData((current) => ({ ...current, coverLetter: { ...current.coverLetter, [key]: value } }));
  const useStarter = () => setData((current) => ({ ...current, coverLetter: {
    ...current.coverLetter,
    opening: 'I am writing to apply for the [role] position at [organization]. My experience in [relevant area] has prepared me to contribute to your team.',
    body: 'In my recent work, I [describe a relevant contribution]. I am especially interested in this opportunity because [specific reason connected to the organization or role].\n\nI would welcome the chance to discuss how my experience in [skill or area] could support your work.',
    closing: 'Thank you for considering my application.',
  } }));
  const print = () => { try { window.print(); } catch { window.alert('The print dialog could not open. Try your browser’s print command.'); } };
  const applyTemplate = (templateId: TemplateId) => setData((current) => ({ ...current, coverLetter: { ...current.coverLetter, templateId } }));
  const fields = useMemo(() => TEMPLATE_ORDER.map((id) => [TEMPLATE_META[id].name, id] as const), []);

  return <main className="page-width standard-page cover-letter-page"><div className="cover-letter-head"><div><div className="eyebrow">OPTIONAL, ALWAYS</div><h1>A letter that sounds like you.</h1><p>A matching cover letter is here if it helps. It is never required to create or download your CV.</p></div><span className={`save-status ${saveState}`}><span className="status-dot" />{saveState === 'saving' ? 'Saving…' : saveState === 'error' ? 'Save issue' : 'Saved locally'}</span></div>
    <InlineNotice tone="info">This draft is stored only in this browser. Your profile contact details appear in the preview; the letter text is yours to write.</InlineNotice>
    <div className="cover-letter-layout"><section className="letter-editor-card"><div className="letter-editor-top"><div><FileText size={19} /><h2>Write your letter</h2></div><Button type="button" variant="secondary" onClick={useStarter}>Use editable starter</Button></div><p className="starter-hint">Starter text includes brackets to replace. It is not tailored or sent anywhere.</p>
      <div className="form-grid form-grid-two"><Field label="Recipient (optional)" value={letter.recipient} onChange={(e) => set('recipient', e.target.value)} placeholder="Hiring manager" /><Field label="Organization" value={letter.organization} onChange={(e) => set('organization', e.target.value)} /><Field label="Role" value={letter.role} onChange={(e) => set('role', e.target.value)} /><Field label="Date" type="date" value={letter.date} onChange={(e) => set('date', e.target.value)} /><Field label="Greeting" className="span-two" value={letter.greeting} onChange={(e) => set('greeting', e.target.value)} /><TextAreaField label="Opening" className="span-two" rows={3} value={letter.opening} onChange={(e) => set('opening', e.target.value)} /><TextAreaField label="Body" className="span-two" rows={8} value={letter.body} onChange={(e) => set('body', e.target.value)} hint="Separate paragraphs with a blank line. Include one or two specific, accurate examples." /><TextAreaField label="Closing" className="span-two" rows={2} value={letter.closing} onChange={(e) => set('closing', e.target.value)} /><Field label="Signature" className="span-two" value={letter.signature} onChange={(e) => set('signature', e.target.value)} placeholder="Your name" /></div>
      <div className="letter-tips"><div className="tips-heading"><Lightbulb size={17} /><strong>Short writing tips</strong></div><ul><li>Connect one experience to this specific role.</li><li>Use an example rather than repeating your CV summary.</li><li>Keep the tone natural, concise, and accurate.</li><li>Remove every bracketed placeholder before sending.</li></ul></div>
      <div className="letter-design-options">
        <h3>Match the CV style</h3>
        <SelectField label="Template" value={letter.templateId} onChange={(e) => applyTemplate(e.target.value as TemplateId)}>
          {fields.map(([label, value]) => <option key={value} value={value}>{label} — {TEMPLATE_META[value].descriptor}</option>)}
        </SelectField>
        <div>
          <span className="field-label">Accent color</span>
          <div className="color-picker" role="group" aria-label="Cover letter accent color">
            {ACCENT_PALETTE.map((color) => <button type="button" key={color.value} className={`color-swatch ${letter.accentColor === color.value ? 'active' : ''}`} style={{ '--swatch': color.value } as React.CSSProperties} aria-label={`${color.name}${letter.accentColor === color.value ? ', selected' : ''}`} aria-pressed={letter.accentColor === color.value} onClick={() => set('accentColor', color.value)} />)}
          </div>
        </div>
      </div>
      <div className="letter-export-row"><Button type="button" onClick={print}><Download size={16} /> {message('export').downloadPdf}</Button><span>Choose “Save as PDF” in the browser print dialog.</span></div>
    </section>
    <aside className="letter-preview-card"><div className="preview-heading"><div><span className="eyebrow">LIVE PREVIEW</span><h2>Letter preview</h2></div><button type="button" className="preview-refresh" onClick={print}><Download size={15} /><span>Print</span></button></div><CoverLetterPreview letter={letter} profile={data.profile} /><p className="preview-print-note">A4 print layout with selectable text. Select A4 and turn off browser headers and footers for the cleanest output.</p></aside></div>
    <p className="letter-data-footnote">The contact details shown here come from <a href="/profile">your local profile</a>. Changing them here is not available; edit them on Profile.</p>
  </main>;
}

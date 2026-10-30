import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Award, Briefcase, Check, CircleHelp, Copy, Download, Eye, EyeOff, FileDown, FilePlus2, FileText, GraduationCap, Languages, Lightbulb, Palette, Plus, Rocket, RotateCcw, RotateCw, Save, ShieldCheck, Sparkles, UserRound, Wrench, Zap } from 'lucide-react';
import type { BuilderSetup, CVDocument, DateFormat, Profile, SectionKey, TemplateId } from './model';
import { ACCENT_PALETTE, DEFAULT_SECTION_ORDER, SECTION_LABELS, TEMPLATE_META, TEMPLATE_ORDER, emptyProfile, newDocument, sampleProfile } from './model';
import { useAppData } from './app-context';
import { AdditionalSectionFields, EducationFields, LanguageFields, PersonalFields, SkillsFields, SummaryFields, WorkExperienceFields } from './forms';
import { TemplateMini } from './landing';
import { ROLE_KITS, STEP_TIPS, profileFromKit } from './starters';
import { copyText, downloadTextFile, profileToPlainText, scoreCV, scoreLabel } from './cv-utils';
import { Button, Field, InlineNotice, ScoreRing, SelectField, usePageMeta } from './ui';
import { CVPreview } from './cv-preview';
import { message as t } from './strings';

const steps = [
  { title: 'Personal details', description: 'The details you want people to use to reach you.', icon: <UserRound size={14} /> },
  { title: 'Profile / summary', description: 'A short introduction to your experience and direction.', icon: <Sparkles size={14} /> },
  { title: 'Work experience', description: 'Start with your most recent or most relevant role.', icon: <Briefcase size={14} /> },
  { title: 'Education and training', description: 'Qualifications, training, and relevant learning.', icon: <GraduationCap size={14} /> },
  { title: 'Skills', description: 'Specific abilities that fit the opportunity.', icon: <Wrench size={14} /> },
  { title: 'Languages', description: 'Languages and a level that feels accurate.', icon: <Languages size={14} /> },
  { title: 'Additional sections', description: 'Projects, volunteering, certifications, and more.', icon: <Award size={14} /> },
  { title: 'Choose design', description: 'Adjust the look, order, and visibility of your sections.', icon: <Palette size={14} /> },
  { title: 'Review and download', description: 'Check the details and print or save your PDF.', icon: <Rocket size={14} /> },
];

const STEP_SECTION: Partial<Record<number, SectionKey>> = { 1: 'summary', 2: 'experience', 3: 'education', 4: 'skills', 5: 'languages' };

type SetupState = BuilderSetup & { dateFormat: DateFormat };

function isComplete(step: number, doc: CVDocument) {
  const p = doc.profileSnapshot;
  switch (step) {
    case 0: return Boolean(p.personal.firstName || p.personal.lastName || p.personal.email);
    case 1: return Boolean(p.summary.trim());
    case 2: return p.workExperience.length > 0;
    case 3: return p.education.length > 0;
    case 4: return p.skills.length > 0;
    case 5: return p.languages.length > 0;
    case 6: return p.optionalSections.length > 0;
    case 7: return true;
    case 8: return true;
    default: return false;
  }
}

function upsertDocument(doc: CVDocument, update: (callback: (current: import('./model').AppData) => import('./model').AppData) => void) {
  update((current) => ({ ...current, documents: [doc, ...current.documents.filter((item) => item.id !== doc.id)] }));
}

export function BuilderPage() {
  usePageMeta({ title: 'CV Builder \u2014 PathCV', description: 'Build a professional CV step by step with live preview, ten templates, and free PDF export. No signup \u2014 your data stays in your browser.', path: '/builder' });
  const { data, setData, saveState } = useAppData();
  const location = useLocation();
  const [draft, setDraft] = useState<CVDocument | null>(null);
  const draftRef = useRef<CVDocument | null>(null);
  const initializedSearch = useRef<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [past, setPast] = useState<CVDocument[]>([]);
  const [future, setFuture] = useState<CVDocument[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewVisible, setPreviewVisible] = useState<boolean>(() => {
    try { return localStorage.getItem('pathcv-builder-preview') !== 'hidden'; } catch { return true; }
  });
  const togglePreview = () => {
    setPreviewVisible((visible) => {
      try { localStorage.setItem('pathcv-builder-preview', visible ? 'hidden' : 'shown'); } catch { /* storage unavailable */ }
      return !visible;
    });
  };
  const [setupOpen, setSetupOpen] = useState(false);
  const [setup, setSetup] = useState<SetupState>({ purpose: 'General', targetRole: '', targetCountry: '', documentLanguage: 'English', dateFormat: 'month-year' });
  const [message, setMessage] = useState('');
  const [pageCount, setPageCount] = useState(1);

  const storeDraft = useCallback((next: CVDocument) => {
    const stamped = { ...next, updatedAt: new Date().toISOString() };
    draftRef.current = stamped;
    setDraft(stamped);
    upsertDocument(stamped, setData);
  }, [setData]);

  useEffect(() => {
    if (initializedSearch.current === location.search) return;
    initializedSearch.current = location.search;
    const params = new URLSearchParams(location.search);
    const existingId = params.get('id');
    const requestedTemplate = params.get('template') as TemplateId | null;
    const hasStep = params.get('step') !== null;
    const requestedStep = Math.min(8, Math.max(0, Number.parseInt(params.get('step') || '', 10) || 0));
    if (existingId) {
      const existing = data.documents.find((item) => item.id === existingId);
      if (existing) {
        draftRef.current = existing;
        setDraft(existing);
        setCurrentStep(hasStep ? requestedStep : 0);
      } else {
        const fresh = newDocument(data.profile, 'clear');
        draftRef.current = fresh; setDraft(fresh); storeDraft(fresh);
      }
    } else if (requestedTemplate && TEMPLATE_ORDER.includes(requestedTemplate)) {
      const useSample = params.get('sample') === '1';
      const fresh = newDocument(useSample ? sampleProfile() : data.profile, requestedTemplate, useSample ? 'Sample CV' : 'Untitled CV');
      draftRef.current = fresh; setDraft(fresh); storeDraft(fresh);
      setCurrentStep(hasStep ? requestedStep : 7);
    } else {
      draftRef.current = null; setDraft(null); setPast([]); setFuture([]); setCurrentStep(0);
    }
    setShowPreview(false);
  }, [location.search, data.documents, data.profile, storeDraft]);

  const commit = (mutate: (current: CVDocument) => CVDocument) => {
    const current = draftRef.current;
    if (!current) return;
    setPast((items) => [...items.slice(-39), current]);
    setFuture([]);
    storeDraft(mutate(current));
  };

  const undo = () => {
    const current = draftRef.current;
    if (!current || past.length === 0) return;
    const previous = past[past.length - 1];
    setPast((items) => items.slice(0, -1));
    setFuture((items) => [...items, current]);
    storeDraft(previous);
  };
  const redo = () => {
    const current = draftRef.current;
    if (!current || future.length === 0) return;
    const next = future[future.length - 1];
    setFuture((items) => items.slice(0, -1));
    setPast((items) => [...items, current]);
    storeDraft(next);
  };

  useEffect(() => {
    if (!draft) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = Boolean(target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable));
      if ((event.ctrlKey || event.metaKey) && !typing && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) redo(); else undo();
      } else if ((event.ctrlKey || event.metaKey) && !typing && event.key.toLowerCase() === 'y') {
        event.preventDefault();
        redo();
      } else if (event.altKey && event.key === 'ArrowRight') {
        event.preventDefault();
        setCurrentStep((step) => Math.min(steps.length - 1, step + 1));
        setShowPreview(false);
      } else if (event.altKey && event.key === 'ArrowLeft') {
        event.preventDefault();
        setCurrentStep((step) => Math.max(0, step - 1));
        setShowPreview(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const begin = (profile: Profile, template: TemplateId = 'clear') => {
    const doc = newDocument(profile, template, 'My CV');
    doc.dateFormat = setup.dateFormat;
    doc.setup = { purpose: setup.purpose, targetRole: setup.targetRole.trim(), targetCountry: setup.targetCountry.trim(), documentLanguage: setup.documentLanguage };
    setPast([]); setFuture([]); setCurrentStep(0); setMessage(''); setShowPreview(false);
    storeDraft(doc);
  };

  const updateProfileSnapshot = (profile: Profile) => commit((current) => ({ ...current, profileSnapshot: profile }));
  const updateVisibility = (key: SectionKey, visible: boolean) => commit((current) => ({ ...current, sectionVisibility: { ...current.sectionVisibility, [key]: visible } }));
  const printDocument = () => {
    try { window.print(); } catch { setMessage('The print dialog could not open. Try your browser’s print command instead.'); }
  };

  const progress = draft ? Math.round(((currentStep + 1) / steps.length) * 100) : 0;
  const completedCount = draft ? steps.slice(0, 7).filter((_, index) => isComplete(index, draft)).length : 0;
  const score = useMemo(() => (draft ? scoreCV(draft).score : 0), [draft]);

  if (!draft) {
    return <div className="builder-start page-width">
      <div className="builder-start-copy"><div className="eyebrow">PathCV builder</div><h1>Start with what you have.</h1><p>Build a clear, editable CV in small steps. Your work saves in this browser as you go.</p><div className="start-trust"><span><ShieldCheck size={16} /> Free PDF, no account</span><span><Save size={16} /> Local autosave</span></div></div>
      <div className="start-choice-grid">
        <article className="start-choice-card"><div className="choice-icon"><FilePlus2 size={21} /></div><h2>Start from scratch</h2><p>Begin with a blank CV and add only the details you want to share.</p><Button type="button" onClick={() => begin(emptyProfile())}>Start from scratch <ArrowRight size={16} /></Button></article>
        <article className="start-choice-card sample-choice"><div className="choice-icon"><FileText size={21} /></div><h2>Use a sample CV</h2><p>Explore the editor with fictional example content. Replace or remove every detail.</p><Button type="button" variant="secondary" onClick={() => begin(sampleProfile())}>Use a sample CV <ArrowRight size={16} /></Button><span className="fictional-stamp">FICTIONAL SAMPLE</span></article>
        <article className="start-choice-card express-choice"><div className="choice-icon"><Zap size={21} /></div><h2>Express · 2 minutes</h2><p>Answer the essentials on one page and get an instant CV. Perfect for first-timers.</p><Link to="/express" className="button button-primary">Try Express <ArrowRight size={16} /></Link><span className="fictional-stamp">FASTEST</span></article>
      </div>
      <div className="kit-strip"><div className="kit-strip-head"><span>Popular role kits</span><small>Start the full builder with an editable headline, summary &amp; skills</small></div><div className="kit-strip-row">{ROLE_KITS.map((k) => <button key={k.id} type="button" className="kit-strip-btn" onClick={() => begin(profileFromKit(k))}>{k.label}</button>)}</div></div>
      <div className="setup-disclosure">
        <button type="button" className="disclosure-toggle" aria-expanded={setupOpen} onClick={() => setSetupOpen(!setupOpen)}><span>Optional setup questions</span><span>{setupOpen ? 'Hide' : 'Skip or set preferences'} <span aria-hidden="true">⌄</span></span></button>
        {setupOpen && <div className="setup-fields"><p>Everything here is optional. These preferences are saved with this CV, but they do not generate, score, or translate content. Date format changes how dates display.</p><div className="form-grid form-grid-two"><SelectField label="CV purpose" value={setup.purpose} onChange={(e) => setSetup({ ...setup, purpose: e.target.value as BuilderSetup['purpose'] })}>{['Job', 'Education', 'Volunteering', 'General'].map((value) => <option key={value}>{value}</option>)}</SelectField><Field label="Target role (optional)" value={setup.targetRole} onChange={(e) => setSetup({ ...setup, targetRole: e.target.value })} placeholder="e.g. Laboratory technician" /><Field label="Target country (optional)" value={setup.targetCountry} onChange={(e) => setSetup({ ...setup, targetCountry: e.target.value })} placeholder="Country" /><SelectField label="Document language" value={setup.documentLanguage} onChange={(e) => setSetup({ ...setup, documentLanguage: e.target.value })}><option>English</option></SelectField><SelectField label="Date format" value={setup.dateFormat} onChange={(e) => setSetup({ ...setup, dateFormat: e.target.value as DateFormat })}><option value="month-year">Month and year</option><option value="short-month">Short month and year</option><option value="numeric">MM/YYYY</option></SelectField></div><InlineNotice>English is the only interface language in this build. Your CV content stays exactly as you enter it; it is not automatically translated.</InlineNotice></div>}
      </div>
      <p className="start-existing">Have CV versions saved here? <Link to="/my-cvs">Open your saved CVs</Link></p>
    </div>;
  }

  const profile = draft.profileSnapshot;
  const saveLabel = saveState === 'saving' ? 'Saving…' : saveState === 'quota' ? 'Storage full' : saveState === 'error' ? 'Save issue' : 'Saved';

  return <div className={`builder-page ${showPreview ? 'builder-show-preview' : ''} ${previewVisible ? '' : 'builder-hide-preview'}`}>
    <div className="builder-topbar page-width">
      <div className="builder-doc-name"><FileText size={17} /><span>{draft.name || 'Untitled CV'}</span><span className={`save-status ${saveState}`} title={saveState === 'quota' ? 'Browser storage is full \u2014 delete old CV versions or remove photos, then keep editing.' : undefined}><span className="status-dot" />{saveLabel}</span></div>
      <div className="builder-top-actions"><button type="button" className="builder-icon-action preview-toggle" aria-pressed={previewVisible} title={previewVisible ? 'Hide the live CV preview' : 'Show the live CV preview'} onClick={togglePreview}>{previewVisible ? <EyeOff size={16} /> : <Eye size={16} />}<span>{previewVisible ? 'Hide' : 'Preview'}</span></button><button type="button" className="builder-icon-action" disabled={past.length === 0} onClick={undo} aria-label="Undo last change" title="Undo"><RotateCcw size={16} /><span>Undo</span></button><button type="button" className="builder-icon-action" disabled={future.length === 0} onClick={redo} aria-label="Redo last change" title="Redo"><RotateCw size={16} /><span>Redo</span></button><Link className="builder-exit" to="/my-cvs">Save and exit <ArrowRight size={15} /></Link></div>
    </div>
    <div className="builder-progress-wrap"><div className="page-width builder-progress-inner"><div className="progress-copy"><span>Step {currentStep + 1} of {steps.length}</span><strong>{steps[currentStep].title}</strong><small>{completedCount} of 7 content sections started</small></div><div className="progress-score" title="CV completeness — see the Review step for details"><ScoreRing score={score} size={40} /><span><strong>{score}%</strong><small>{scoreLabel(score)}</small></span></div><div className="progress-track" role="progressbar" aria-label="Builder progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><span style={{ width: `${progress}%` }} /></div></div></div>
    <div className="builder-workspace page-width">
      <aside className="builder-step-nav" aria-label="CV sections">
        <div className="step-nav-heading"><span>YOUR CV</span><small>Move between steps anytime</small></div>
        {steps.map((step, index) => {
          const sectionKey = STEP_SECTION[index];
          const visible = sectionKey ? draft.sectionVisibility[sectionKey] !== false : true;
          return <div key={step.title} className="step-nav-row">
            <button type="button" className={`step-nav-item ${index === currentStep ? 'active' : ''}`} aria-current={index === currentStep ? 'step' : undefined} onClick={() => { setCurrentStep(index); setShowPreview(false); }}><span className={`step-indicator ${isComplete(index, draft) ? 'complete' : ''}`}>{isComplete(index, draft) ? <Check size={13} /> : step.icon}</span><span>{step.title}</span></button>
            {sectionKey && <button type="button" className={`step-eye ${visible ? "" : "off"}`} title={visible ? `Hide ${step.title} from CV` : `Show ${step.title} in CV`} aria-label={visible ? `Hide ${step.title} section` : `Show ${step.title} section`} onClick={() => updateVisibility(sectionKey, !visible)}>{visible ? <Eye size={13} /> : <EyeOff size={13} />}</button>}
          </div>;
        })}
        <div className="step-nav-help"><CircleHelp size={16} /><span>Every section is optional. Skip anything that does not fit.</span></div>
      </aside>

      <main className="builder-editor-column">
        <div className="builder-editor-card">
          <div className="editor-heading"><div className="eyebrow">SECTION {String(currentStep + 1).padStart(2, '0')}</div><h1>{steps[currentStep].title}</h1><p>{steps[currentStep].description}</p></div>
          <div className="pro-tip"><Lightbulb size={15} /><span><strong>Pro tip: </strong>{STEP_TIPS[currentStep]}</span></div>
          {message && <InlineNotice tone="warning">{message}</InlineNotice>}
          {currentStep === 0 && <PersonalFields profile={profile} onChange={updateProfileSnapshot} onPhotoAdded={() => commit((current) => (current.showPhoto ? current : { ...current, showPhoto: true }))} />}
          {currentStep === 1 && <SummaryFields profile={profile} onChange={updateProfileSnapshot} />}
          {currentStep === 2 && <WorkExperienceFields profile={profile} onChange={updateProfileSnapshot} />}
          {currentStep === 3 && <EducationFields profile={profile} onChange={updateProfileSnapshot} />}
          {currentStep === 4 && <SkillsFields profile={profile} onChange={updateProfileSnapshot} />}
          {currentStep === 5 && <LanguageFields profile={profile} onChange={updateProfileSnapshot} />}
          {currentStep === 6 && <AdditionalSectionFields profile={profile} onChange={updateProfileSnapshot} visibility={draft.sectionVisibility} onVisibilityChange={updateVisibility} />}
          {currentStep === 7 && <DesignEditor document={draft} onChange={commit} />}
          {currentStep === 8 && <ReviewEditor document={draft} onChange={commit} onPrint={printDocument} onCopyToProfile={() => {
            if (window.confirm('Copy this CV’s details to your reusable local profile? This replaces the current reusable profile but does not change any saved CV version.')) {
              setData((current) => ({ ...current, profile: structuredClone(profile) }));
              setMessage('Copied this version to your reusable profile. Saved CV snapshots remain separate.');
            }
          }} />}
          <div className="editor-step-controls"><Button type="button" variant="ghost" disabled={currentStep === 0} onClick={() => { setCurrentStep((step) => Math.max(0, step - 1)); setShowPreview(false); }}><ArrowLeft size={16} /> Previous</Button><span>{currentStep + 1} / {steps.length}</span><Button type="button" onClick={() => { if (currentStep < steps.length - 1) { setCurrentStep((step) => Math.min(steps.length - 1, step + 1)); setShowPreview(false); } else printDocument(); }}>{currentStep === steps.length - 1 ? t('export').downloadPdf : 'Continue'} {currentStep === steps.length - 1 ? <Download size={16} /> : <ArrowRight size={16} />}</Button></div>
        </div>
      </main>

      <aside className="builder-preview-column" aria-label="Live CV preview">
        <div className="preview-heading"><div><span className="eyebrow">LIVE PREVIEW</span><h2>Your CV, taking shape</h2><span className="page-pill">{pageCount} {pageCount === 1 ? 'page' : 'pages'} · {pageCount <= 1 ? 'Ideal length' : pageCount === 2 ? 'Great length' : 'Consider trimming'}</span></div><button type="button" className="preview-refresh" onClick={() => { setShowPreview(false); setPreviewVisible(false); }} title="Hide preview and keep editing"><FileText size={16} /><span>Edit</span></button></div>
        <QuickDesignBar doc={draft} onTemplate={(id) => commit((current) => ({ ...current, templateId: id }))} onAccent={(color) => commit((current) => ({ ...current, accentColor: color }))} />
        <CVPreview document={draft} onPageCount={setPageCount} />
        <p className="preview-print-note">PDF export uses your browser’s print dialog. Choose “Save as PDF” to download; text remains selectable.</p>
      </aside>
    </div>
    <div className="mobile-builder-bar"><button type="button" className="button button-secondary" onClick={() => setShowPreview(!showPreview)}><Eye size={16} /> {showPreview ? 'Back to editor' : 'Preview'}</button><button type="button" className="button button-primary" onClick={printDocument}><Download size={16} /> {t('export').downloadPdf}</button></div>
  </div>;
}

function QuickDesignBar({ doc, onTemplate, onAccent }: { doc: CVDocument; onTemplate: (id: TemplateId) => void; onAccent: (color: string) => void }) {
  return <div className="quick-design">
    <div className="quick-templates" role="group" aria-label="Quick template switcher">
      {TEMPLATE_ORDER.map((id) => <button key={id} type="button" className={`quick-template ${doc.templateId === id ? 'selected' : ''}`} title={TEMPLATE_META[id].name} aria-label={`Use ${TEMPLATE_META[id].name} template`} aria-pressed={doc.templateId === id} onClick={() => onTemplate(id)}><TemplateMini id={id} />{doc.templateId === id && <span className="quick-check"><Check size={11} /></span>}</button>)}
    </div>
    <div className="quick-accents" role="group" aria-label="Quick accent color">
      {ACCENT_PALETTE.map((c) => <button key={c.value} type="button" className={`quick-dot ${doc.accentColor === c.value ? 'active' : ''}`} style={{ '--swatch': c.value } as React.CSSProperties} title={c.name} aria-label={`${c.name} accent`} aria-pressed={doc.accentColor === c.value} onClick={() => onAccent(c.value)} />)}
    </div>
  </div>;
}

function DesignEditor({ document: doc, onChange }: { document: CVDocument; onChange: (mutate: (current: CVDocument) => CVDocument) => void }) {
  const templateIds: TemplateId[] = TEMPLATE_ORDER;
  const move = (key: SectionKey, direction: -1 | 1) => onChange((current) => {
    const order = [...current.sectionOrder]; const index = order.indexOf(key); const next = index + direction;
    if (index < 0 || next < 0 || next >= order.length) return current;
    [order[index], order[next]] = [order[next], order[index]];
    return { ...current, sectionOrder: order };
  });
  return <div className="form-stack design-editor">
    <section className="design-section"><div className="design-section-title"><div><h2>Choose a template</h2><p>Switch any time; your content stays with this CV.</p></div></div><div className="template-select-grid">{templateIds.map((id) => <button type="button" key={id} className={`template-select-card ${doc.templateId === id ? 'selected' : ''}`} aria-pressed={doc.templateId === id} onClick={() => onChange((current) => ({ ...current, templateId: id }))}><TemplateMini id={id} /><strong>{TEMPLATE_META[id].name}</strong><small>{TEMPLATE_META[id].descriptor}</small>{doc.templateId === id && <span className="selected-label"><Check size={13} /> Selected</span>}</button>)}</div></section>
    <section className="design-section"><h2>Personalize the details</h2><div className="form-grid form-grid-two"><div className="span-two"><span className="field-label">Accent color</span><div className="color-picker" role="group" aria-label="Accent color">{ACCENT_PALETTE.map((color) => <button type="button" key={color.value} className={`color-swatch ${doc.accentColor === color.value ? 'active' : ''}`} style={{ '--swatch': color.value } as React.CSSProperties} aria-label={`${color.name}${doc.accentColor === color.value ? ', selected' : ''}`} title={color.name} aria-pressed={doc.accentColor === color.value} onClick={() => onChange((current) => ({ ...current, accentColor: color.value }))} />)}</div></div><SelectField label="Font" value={doc.fontChoice} onChange={(e) => onChange((current) => ({ ...current, fontChoice: e.target.value as CVDocument['fontChoice'] }))}><option value="system">System sans-serif</option><option value="humanist">Humanist sans-serif</option><option value="serif">Editorial serif</option></SelectField><SelectField label="Date format" value={doc.dateFormat} onChange={(e) => onChange((current) => ({ ...current, dateFormat: e.target.value as DateFormat }))}><option value="month-year">Full month and year</option><option value="short-month">Short month and year</option><option value="numeric">MM/YYYY</option></SelectField><label className="checkbox-row span-two"><input type="checkbox" checked={doc.showPhoto} onChange={(e) => onChange((current) => ({ ...current, showPhoto: e.target.checked }))} /><span>Show my photo in this CV</span></label>{doc.showPhoto && !doc.profileSnapshot.personal.photoDataUrl && <p className="field-hint span-two">Add a photo in Personal details first. You can keep it hidden here.</p>}</div></section>
    <section className="design-section"><div className="design-section-title"><div><h2>Sections and order</h2><p>Use the arrows to adjust the reading order. Empty sections are omitted in the preview.</p></div></div><div className="section-order-list">{doc.sectionOrder.map((key, index) => <div className="section-order-row" key={key}><label className="switch-label visibility-switch"><input type="checkbox" checked={doc.sectionVisibility[key]} onChange={(e) => onChange((current) => ({ ...current, sectionVisibility: { ...current.sectionVisibility, [key]: e.target.checked } }))} /><span>{SECTION_LABELS[key]}</span></label><div><button type="button" className="icon-button" title="Move section up" aria-label={`Move ${SECTION_LABELS[key]} up`} disabled={index === 0} onClick={() => move(key, -1)}><ArrowUp size={15} /></button><button type="button" className="icon-button" title="Move section down" aria-label={`Move ${SECTION_LABELS[key]} down`} disabled={index === doc.sectionOrder.length - 1} onClick={() => move(key, 1)}><ArrowDown size={15} /></button></div></div>)}</div><button type="button" className="text-action" onClick={() => onChange((current) => ({ ...current, sectionOrder: [...DEFAULT_SECTION_ORDER] }))}>Reset section order</button></section>
  </div>;
}

function ReviewEditor({ document: doc, onChange, onPrint, onCopyToProfile }: { document: CVDocument; onChange: (mutate: (current: CVDocument) => CVDocument) => void; onPrint: () => void; onCopyToProfile: () => void }) {
  const started = steps.slice(0, 7).filter((_, index) => isComplete(index, doc)).length;
  const [copied, setCopied] = useState(false);
  const { score: reviewScore, checks } = scoreCV(doc);
  const remaining = checks.filter((c) => !c.done);
  return <div className="form-stack review-editor">
    <InlineNotice tone="success">Your CV is saved in this browser. No account is needed to keep editing or print it.</InlineNotice>
    <div className="score-card"><ScoreRing score={reviewScore} size={56} /><div><strong>{reviewScore}% complete · {scoreLabel(reviewScore)}</strong><p>{remaining.length === 0 ? 'Everything essential is covered. Proofread once, then export!' : `${remaining.length} quick wins left — each shows its point value.`}</p></div></div>
    <div className="score-checks">{checks.map((c) => <div key={c.label} className={`score-check ${c.done ? 'done' : ''}`}><span className="score-check-icon">{c.done ? <Check size={12} /> : <Plus size={12} />}</span><span className="score-check-text"><strong>{c.label}</strong><small>{c.done ? 'Done' : c.hint}</small></span><small className="score-weight">+{c.weight}</small></div>)}</div>
    {(doc.setup.targetRole || doc.setup.targetCountry || doc.setup.purpose !== 'General') && <InlineNotice tone="info"><strong>Saved setup notes · not printed.</strong> {[doc.setup.purpose !== 'General' && doc.setup.purpose, doc.setup.targetRole, doc.setup.targetCountry].filter(Boolean).join(' · ')}. These notes do not automatically tailor your content.</InlineNotice>}
    <Field label="Name this CV version" value={doc.name} onChange={(e) => onChange((current) => ({ ...current, name: e.target.value || 'Untitled CV' }))} hint="This label is only for your saved versions; it is not printed." />
    <div className="review-checklist"><div><strong>Quick review</strong><span>{started} of {steps.length} steps have content. Empty sections are optional.</span></div><ul>{steps.slice(0, 7).map((step, index) => <li key={step.title}><span className={isComplete(index, doc) ? 'review-done' : 'review-empty'}>{isComplete(index, doc) ? <Check size={13} /> : '—'}</span><button type="button" onClick={() => document.querySelector<HTMLButtonElement>(`[aria-label="CV sections"] .step-nav-row:nth-child(${index + 2}) .step-nav-item`)?.click()}>{step.title}</button></li>)}</ul></div>
    <div className="review-export-card"><div><h3>Ready to print or save a PDF?</h3><p>Opens your browser’s print dialog. Choose “Save as PDF” for a selectable-text PDF. The exact print layout depends on your browser’s print settings.</p></div><Button type="button" onClick={onPrint}><Download size={16} /> {t('export').downloadPdf}</Button><button type="button" className="text-action" onClick={onPrint}>Print this CV</button></div>
    <div className="review-export-card"><div><h3>Need plain text for job portals?</h3><p>Copy a clean text version for “paste your CV” boxes, or download it as a .txt file.</p></div><div className="plain-actions"><Button type="button" variant="secondary" onClick={async () => setCopied(await copyText(profileToPlainText(doc)))}><Copy size={15} /> {copied ? 'Copied!' : 'Copy plain text'}</Button><Button type="button" variant="secondary" onClick={() => downloadTextFile(`${doc.name || 'cv'}.txt`, profileToPlainText(doc))}><FileDown size={15} /> Download .txt</Button></div></div>
    <div className="profile-copy-card"><div><h3>Keep a reusable profile</h3><p>Copy this snapshot to your local profile only when you choose. Saved CV versions remain separate.</p></div><Button type="button" variant="secondary" onClick={onCopyToProfile}>Copy to reusable profile</Button></div>
    <p className="print-explanation">For clean output, select A4 paper size and turn off browser headers and footers. PathCV adds a small “Made with PathCV” line to the document.</p>
  </div>;
}

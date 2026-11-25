import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowDownToLine, ArrowRight, ChartNoAxesCombined, Check, ChevronRight, CircleHelp, ClipboardList, FileCheck2, FileText, LockKeyhole, ScanLine, ShieldCheck, Sparkles, UploadCloud, X } from 'lucide-react';
import { useAppData } from './app-context';
import { atsAction, atsStatus, analyzeUpload, ATS_DIRECT_LIMIT, ATS_LIMIT } from './ats-client';
import type { AtsAccess, AtsJob, AtsReport, AtsResponse } from './ats-client';
import { saveAtsScore } from './ats-storage';
import { profileToPlainText } from './cv-utils';
import type { CVDocument } from './model';
import { Button, Field, InlineNotice, ScoreRing, SelectField, TextAreaField, usePageMeta } from './ui';

const defaultAccess: AtsAccess = { premium: false, ai: false, accessCodes: false, uploadLimit: ATS_DIRECT_LIMIT };
const bytes = (n: number) => n < 1024 * 1024 ? `${Math.max(1, Math.ceil(n / 1024))} KB` : `${(n / (1024 * 1024)).toFixed(1)} MB`;
function draftText(doc: CVDocument) {
  const personal = { ...doc.profileSnapshot.personal, presentAddress: '', dateOfBirth: '', maritalStatus: '', nationality: '', religion: '' };
  return profileToPlainText({ ...doc, profileSnapshot: { ...doc.profileSnapshot, personal } });
}

function Result({ report, comparison, premium }: { report: AtsReport; comparison?: AtsReport; premium: boolean }) {
  const delta = comparison ? report.score - comparison.score : 0;
  return <>
    <div className="ats-result-top"><ScoreRing score={report.score} size={106} label="PathCV ATS score" suffix="%" /><div><p className="eyebrow">{report.label}</p><h2 id="ats-result-heading" tabIndex={-1}>{report.classification}</h2><p>{report.explanation}</p><span className="ats-small">{report.points} of {report.max} points · {report.format === 'Text' ? 'Text only' : report.format}</span></div></div>
    {comparison && <div className="ats-compare" aria-label="Recheck comparison"><div><small>Original score</small><strong>{comparison.score}%</strong></div><div><small>New score</small><strong>{report.score}%</strong></div><div><small>Change</small><strong>{delta > 0 ? '+' : ''}{delta} pts</strong></div>{comparison.format !== report.format && <p>Recheck evaluates the edited text, not the original file layout. The scores are not a like-for-like comparison of layout.</p>}</div>}
    <p className="ats-small ats-disclaimer">This is a PathCV estimate, not an employer’s ATS score or a guarantee of an interview. {report.layoutLimits}</p>
    <h3>Score breakdown</h3>
    <div className="ats-breakdown">{report.categories.map(c => <div key={c.name}><div className="ats-bar-label"><span>{c.name}</span><strong>{c.score} / {c.max}{comparison && <small> (was {comparison.categories.find(p => p.name === c.name)?.score ?? '—'})</small>}</strong></div><progress aria-label={c.name} value={c.score} max={c.max} /></div>)}</div>
    <div className="ats-feedback-grid"><div><h3><Check size={17} /> Strengths</h3>{report.strengths.length ? <ul>{report.strengths.map(x => <li key={x}>{x}</li>)}</ul> : <p>No distinct strengths were detected.</p>}</div><div><h3><CircleHelp size={17} /> {comparison ? 'Remaining issues' : 'Needs attention'}</h3>{report.weaknesses.length ? <ul>{report.weaknesses.map(x => <li key={x}>{x}</li>)}</ul> : <p>No issues were detected by these checks.</p>}</div></div>
    <div className="ats-status"><h3>Section check</h3><ul>{report.sections.map(s => <li key={s.name}><span>{s.name}</span><strong data-status={s.status}>{s.status === 'good' ? 'Looks good' : s.status === 'improve' ? 'Needs detail' : 'Not detected'}</strong></li>)}</ul></div>
    {report.keyword && <div className="ats-keywords"><h3>Job keyword coverage{report.keyword.coverage !== null && <span>{report.keyword.coverage}%</span>}</h3>{report.keyword.coverage === null ? <p>No scorable job terms were identified. The keyword category was excluded. Try pasting the requirements and responsibilities from the ad.</p> : <><p>{report.keyword.total} terms identified. Exact matches count in full; partial matches count half. Terms marked required can carry more weight. Only add terms you can back up.</p>{premium && report.keyword.terms ? <div className="ats-keyword-groups">{(['matched', 'partial', 'missing'] as const).map(status => <div key={status}><h4>{status === 'partial' ? 'Partial' : status === 'matched' ? 'Matched' : 'Missing'}</h4><div className="ats-tags">{report.keyword?.terms?.filter(t => t.status === status).map(t => <span key={t.label} data-status={status}>{t.label}{t.weight > 1 && <small> · required</small>}</span>)}</div>{!report.keyword?.terms?.some(t => t.status === status) && <small>None</small>}</div>)}</div> : <div className="ats-lock-label"><LockKeyhole size={14} /> Individual terms require verified Premium access.</div>}</>}</div>}
    {report.recommendations.length > 0 && <div className="ats-recommendations"><h3>Recommended next steps</h3><ol>{report.recommendations.map((x, i) => <li key={x}><span>{i + 1}</span>{x}</li>)}</ol></div>}
  </>;
}

const printableHead = /^(?:(?:professional|career|technical|work|relevant|academic|core|key|selected|volunteer) )?(?:summary|profile|objective|skills(?: and qualifications)?|experience|employment history|work history|education(?: and training)?|projects|certifications?(?: and licenses)?|internships|volunteering|training|publications|languages|awards|achievements|contact(?: information)?)\s*:?[\s]*$/i;
function PrintCV({ text }: { text: string }) {
  const lines = text.split('\n').flatMap(raw => {
    const line = raw.trim();
    if (!line || /^[-=─_\s]{3,}$/.test(line)) return [];
    const colon = line.indexOf(':');
    return colon > 0 && printableHead.test(line.slice(0, colon)) ? [line.slice(0, colon), line.slice(colon + 1).trim()].filter(Boolean) : [line];
  });
  return <article className="printable-document ats-print" aria-hidden="true">{lines.map((line, i) => i === 0 && !printableHead.test(line) ? <h1 key={i}>{line}</h1> : printableHead.test(line) ? <h2 key={i}>{line.replace(/:\s*$/, '')}</h2> : <p key={i}>{line}</p>)}</article>;
}

export function AtsCheckerPage() {
  usePageMeta({ title: 'ATS Score Checker for PDF and Word CVs — PathCV', description: 'Check how readable your CV is and compare it with a job description. Get a real breakdown and practical next steps.', path: '/ats-checker' });
  const { data } = useAppData();
  const [params] = useSearchParams();
  const requested = params.get('cv');
  const [source, setSource] = useState<'file' | 'saved'>(requested && data.documents.some(d => d.id === requested) ? 'saved' : 'file');
  const [draftId, setDraftId] = useState(requested || '');
  const draft = data.documents.find(d => d.id === draftId);
  const [access, setAccess] = useState(defaultAccess);
  const [checked, setChecked] = useState(false);
  const [file, setFile] = useState<File>();
  const [dragging, setDragging] = useState(false);
  const [job, setJob] = useState('');
  const [title, setTitle] = useState('');
  const [submitConsent, setSubmitConsent] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [workError, setWorkError] = useState('');
  const [notice, setNotice] = useState('');
  const [response, setResponse] = useState<AtsResponse>();
  const [comparison, setComparison] = useState<AtsReport>();
  const [analyzedInput, setAnalyzedInput] = useState<AtsJob>({ job: '', title: '' });
  const [linkedSource, setLinkedSource] = useState<{ id: string; version: string }>();
  const [edit, setEdit] = useState('');
  const [proposal, setProposal] = useState<string | null>(null);
  const [aiConsent, setAiConsent] = useState(false);
  const [printText, setPrintText] = useState('');
  const [name, setName] = useState('');
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [code, setCode] = useState('');
  const [revealCode, setRevealCode] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const liveRequest = useRef<AbortController>();
  useEffect(() => {
    const ctrl = new AbortController();
    atsStatus(ctrl.signal).then(setAccess).catch(() => {}).finally(() => { if (!ctrl.signal.aborted) setChecked(true); });
    return () => { ctrl.abort(); liveRequest.current?.abort(); };
  }, []);
  useEffect(() => {
    if (!printText) return;
    const clear = () => setPrintText('');
    window.addEventListener('afterprint', clear, { once: true });
    const id = requestAnimationFrame(() => window.print());
    return () => { cancelAnimationFrame(id); window.removeEventListener('afterprint', clear); };
  }, [printText]);

  function chooseFile(found?: File) {
    setError(''); setFile(undefined);
    if (fileInput.current) fileInput.current.value = '';
    if (!found) return;
    if (!/\.(pdf|docx)$/i.test(found.name)) return setError('Select a PDF or a Word document ending in .docx.');
    if (!found.size) return setError('The selected file is empty.');
    if (found.size > ATS_LIMIT) return setError('Choose a file no larger than 5 MB.');
    setFile(found);
  }
  function start(label: string, form = false) {
    const ctrl = new AbortController();
    liveRequest.current = ctrl;
    setBusy(label); setNotice(''); setWorkError(''); if (form) setError('');
    return ctrl;
  }
  function finish(ctrl: AbortController) {
    if (liveRequest.current === ctrl) { setBusy(''); liveRequest.current = undefined; }
  }
  function focusResult() { requestAnimationFrame(() => document.querySelector<HTMLElement>('#ats-result-heading')?.focus()); }
  async function analyze(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!submitConsent) return setError('Confirm private processing before you analyze your CV.');
    if (source === 'file' && !file) return setError('Choose a PDF or DOCX first.');
    if (source === 'saved' && !draft) return setError('Choose a saved CV first.');
    if (source === 'file' && file && file.size > access.uploadLimit) return setError('Uploads over 4 MB are not enabled here. Compress your CV or export a smaller copy.');
    const ctrl = start('Analyzing your CV…', true);
    const input = { title: title.trim(), job: job.trim() };
    try {
      const found = source === 'file' && file ? await analyzeUpload(file, input, ctrl.signal) : await atsAction<AtsResponse>('analyze', { ...input, text: draftText(draft!) }, ctrl.signal);
      setResponse(found); setEdit(found.text || ''); setComparison(undefined); setProposal(null); setAiConsent(false); setSaved(false); setSaveError('');
      setAnalyzedInput(input);
      setLinkedSource(source === 'saved' && draft ? { id: draft.id, version: draft.updatedAt } : undefined);
      setName((source === 'file' ? file?.name.replace(/\.(pdf|docx)$/i, '') : draft?.name)?.slice(0, 75) || 'ATS check');
      focusResult();
    } catch (err) { if (!ctrl.signal.aborted) setError((err as Error).message); }
    finally { finish(ctrl); }
  }
  async function doPremium(action: 'recheck' | 'improve' | 'export') {
    if (!response || !edit.trim() || busy) return;
    if (proposal !== null) return setWorkError('Apply or discard the AI suggestions before continuing.');
    const ctrl = start(action === 'improve' ? 'Drafting suggestions…' : action === 'export' ? 'Preparing your CV…' : 'Rechecking your CV…');
    try {
      const input = { ...analyzedInput, text: edit };
      if (action === 'improve') {
        const ans = await atsAction<{ proposal: string }>('improve', { ...input, consent: aiConsent }, ctrl.signal);
        setProposal(ans.proposal);
      } else if (action === 'export') {
        const ans = await atsAction<{ text: string }>('export', input, ctrl.signal);
        setPrintText(ans.text);
      } else {
        const ans = await atsAction<AtsResponse>('recheck', input, ctrl.signal);
        setComparison(comparison ?? response.result); setResponse(ans); setSaved(false); setSaveError(''); if (edit !== response.text) setLinkedSource(undefined); focusResult();
      }
    } catch (err) { if (!ctrl.signal.aborted) setWorkError((err as Error).message); }
    finally { finish(ctrl); }
  }
  async function activate(e: React.FormEvent) {
    e.preventDefault(); if (!code.trim() || busy) return;
    const ctrl = start('Verifying access…');
    try {
      const result = await atsAction<Pick<AtsAccess, 'premium' | 'ai'>>('redeem', { code: code.trim() }, ctrl.signal);
      setAccess(old => ({ ...old, ...result })); setRevealCode(false); setCode(''); setNotice('Premium access verified. Analyze again to open the full report and editor.');
    } catch (err) { if (!ctrl.signal.aborted) setWorkError((err as Error).message); }
    finally { finish(ctrl); }
  }
  function save(e: React.FormEvent) {
    e.preventDefault(); if (!response) return;
    try { saveAtsScore(response.result, name, linkedSource); setSaved(true); setSaveError(''); }
    catch (err) { setSaveError((err as Error).message || 'Could not save this score on this device.'); }
  }
  const report = response?.result;
  const canEdit = Boolean(access.premium && response?.text);
  const belongsToChange = response?.text !== undefined && edit.trim() !== response.text.trim();
  return <main className="page-width ats-page">
    <header className="ats-hero"><div className="ats-hero-copy"><div className="eyebrow"><ScanLine size={16} /> PATHCV CAREER TOOLS</div><h1>ATS Score Checker<span>.</span></h1><p>See how clearly your CV reads. Add a job description to check how well your experience matches a specific role.</p><div className="ats-hero-tags"><span><Check size={15} /> Free basic check</span><span><ShieldCheck size={15} /> No account required</span></div></div><div className="ats-hero-decoration" aria-hidden="true"><div><FileCheck2 size={49} strokeWidth={1.35} /></div><span /><span /><i /><i /></div></header>
    <div className="ats-workspace">
      <section className="ats-card ats-input" aria-labelledby="ats-input-heading">
        <div className="ats-card-title"><span className="ats-icon"><FileText size={19} /></span><div><h2 id="ats-input-heading">Check your CV</h2><p>Upload a file or use a CV saved in this browser.</p></div></div>
        <form onSubmit={analyze}>
          <fieldset className="ats-form" disabled={Boolean(busy)}>
            <legend className="sr-only">CV analysis details</legend>
            {data.documents.length > 0 && <div className="ats-source" aria-label="CV source"><button type="button" aria-pressed={source === 'file'} onClick={() => { setSource('file'); setError(''); }}>Upload file</button><button type="button" aria-pressed={source === 'saved'} onClick={() => { setSource('saved'); setError(''); }}>Use saved CV</button></div>}
            {source === 'file' ? <div className={`ats-upload${dragging ? ' ats-dragging' : ''}`} onDragOver={e => { e.preventDefault(); if (!busy) setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); if (!busy) chooseFile(e.dataTransfer.files[0]); }}>
              <input type="file" aria-label="Select a PDF or DOCX" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" ref={fileInput} className="ats-file-input" onChange={e => chooseFile(e.target.files?.[0])} tabIndex={-1} />
              <UploadCloud size={24} aria-hidden="true" />
              {file ? <div className="ats-file-info"><strong>{file.name}</strong><small>{bytes(file.size)}</small><button type="button" aria-label="Remove selected file" onClick={() => chooseFile()}><X size={17} /></button></div> : <><button className="ats-file-button" type="button" onClick={() => fileInput.current?.click()}>Choose a CV file</button><span>or drop it here</span></>}
              {file && <button className="ats-file-button" type="button" onClick={() => fileInput.current?.click()}>Change file</button>}
              <small>PDF or DOCX · up to {checked && access.uploadLimit < ATS_LIMIT ? '4' : '5'} MB</small>
            </div> : <><SelectField label="Saved CV" value={draftId} onChange={e => setDraftId(e.target.value)}><option value="">Choose a CV version</option>{data.documents.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</SelectField><p className="ats-small">The checker uses the saved CV’s text. To check its layout, upload the exported PDF.</p></>}
            {checked && access.uploadLimit < ATS_LIMIT && source === 'file' && <p className="ats-small">Uploads over 4 MB aren’t enabled on this deployment.</p>}
            <Field label="Job title (optional)" value={title} onChange={e => setTitle(e.target.value)} maxLength={130} placeholder="e.g. Financial Analyst" />
            <TextAreaField label="Paste job description (optional)" rows={5} value={job} onChange={e => setJob(e.target.value)} maxLength={24_000} placeholder="Paste the role’s responsibilities and requirements here…" hint="Leave blank for a general CV check." />
            <label className="ats-check"><input type="checkbox" checked={submitConsent} onChange={e => setSubmitConsent(e.target.checked)} /><span>I agree to send this CV and any job description to PathCV for this check. Results are not saved unless I choose to save a score.</span></label>
            {error && <InlineNotice tone="error">{error}</InlineNotice>}
            <Button type="submit" className="ats-submit" disabled={Boolean(busy)}>{busy === 'Analyzing your CV…' ? busy : 'Analyze My CV'}{busy === 'Analyzing your CV…' ? <span className="ats-spinner" aria-hidden="true" /> : <ArrowRight size={17} />}</Button>
          </fieldset>
          <p className="ats-small ats-input-note"><ShieldCheck size={14} /> Your CV is processed privately. <Link to="/privacy#ats-processing">How processing works</Link></p>
        </form>
      </section>
      <section className={`ats-card ats-output${report ? ' ats-has-result' : ''}`} aria-labelledby={report ? 'ats-result-heading' : 'ats-empty-heading'} aria-busy={busy === 'Analyzing your CV…'}>
        {report ? <Result report={report} comparison={comparison} premium={access.premium} /> : <div className="ats-empty"><span className="ats-empty-icon"><ChartNoAxesCombined size={34} strokeWidth={1.65} /></span><div className="eyebrow">YOUR SCORE REPORT</div><h2 id="ats-empty-heading">Start with your CV</h2><p>After you run a check, your score, category breakdown, and what to improve will appear here.</p><div className="ats-empty-modes"><span><FileText size={16} /> General CV quality &amp; readability</span><span><ClipboardList size={16} /> Job-specific compatibility</span></div></div>}
        {saveError && <InlineNotice tone="error">{saveError}</InlineNotice>}
        {report && <form className="ats-save" onSubmit={save}><Field label="Name this score snapshot" value={name} onChange={e => { setName(e.target.value); setSaved(false); }} maxLength={75} /><Button variant="secondary" type="submit" disabled={saved || Boolean(busy)}>{saved ? <><Check size={16} /> Saved</> : 'Save score to My CVs'}</Button><p className="ats-small">Saves the name, score and category breakdown in this browser, not the CV file, text, or job description. {saved && <Link to="/my-cvs#ats-scores">View saved scores <ChevronRight size={12} /></Link>}</p></form>}
      </section>
    </div>
    <section className="ats-card ats-premium" aria-labelledby="ats-premium-heading">
      <div className="ats-card-title"><span className="ats-icon"><Sparkles size={19} /></span><div><div className="eyebrow">PATHCV PREMIUM</div><h2 id="ats-premium-heading">Review, improve, and recheck</h2><p>See what’s missing, revise the wording, and export a simple one-column CV.</p></div></div>
      {notice && <InlineNotice tone="success">{notice}</InlineNotice>}{workError && <InlineNotice tone="error">{workError}</InlineNotice>}
      <p className="ats-sr-status" role="status">{busy || (saved ? 'Score saved to My CVs.' : '')}</p>
      {!access.premium && <><div className="ats-lock-label"><LockKeyhole size={16} /> {access.accessCodes ? 'Premium tools require a verified access code.' : 'Premium access is not available here yet. The basic score checker is free.'}</div>{access.accessCodes && <Button type="button" variant="secondary" onClick={() => setRevealCode(x => !x)} aria-expanded={revealCode}>I have an access code</Button>}</>}
      {revealCode && <form className="ats-code" onSubmit={activate}><Field label="Premium access code" type="password" autoComplete="off" value={code} onChange={e => setCode(e.target.value)} maxLength={1024} /><Button type="submit" disabled={!code.trim() || Boolean(busy)}>Verify code</Button></form>}
      {access.premium && !canEdit && <p>Run an analysis with verified access to open the editor.</p>}
      {canEdit && <div className="ats-edit">
        <TextAreaField label="Edit your CV text" value={edit} onChange={e => setEdit(e.target.value)} rows={14} maxLength={65_000} disabled={Boolean(busy)} hint="This is a separate text copy. Your original file or builder draft is unchanged." />
        {belongsToChange && <p className="ats-small">The displayed score is for the last checked version. Recheck to score these edits.</p>}
        {access.ai ? <label className="ats-check"><input type="checkbox" checked={aiConsent} disabled={Boolean(busy)} onChange={e => setAiConsent(e.target.checked)} /><span>I agree to send the CV text as shown, and the optional job details from this check, to OpenAI for wording suggestions. Remove anything you don’t want to share before proceeding.</span></label> : <p className="ats-small">AI assistance isn’t configured. You can still edit, recheck, and export manually.</p>}
        <div className="ats-edit-actions">{access.ai && <Button type="button" disabled={!aiConsent || !edit.trim() || Boolean(busy) || proposal !== null} onClick={() => void doPremium('improve')}><Sparkles size={16} /> Improve My CV with AI</Button>}<Button type="button" variant="secondary" disabled={!edit.trim() || Boolean(busy) || proposal !== null} onClick={() => void doPremium('recheck')}>Recheck My CV Score</Button><Button type="button" variant="secondary" disabled={!edit.trim() || Boolean(busy) || Boolean(printText) || proposal !== null} onClick={() => void doPremium('export')}><ArrowDownToLine size={16} /> Export ATS-friendly PDF</Button></div>
        <p className="ats-small">Export opens the browser print dialog. Choose “Save as PDF” and disable headers and footers if shown.</p>
        {proposal !== null && <aside className="ats-proposal"><h3>Review AI suggestions</h3><p>Check every employer, title, credential, date, and result before accepting. You can edit the proposal below. Don’t add claims you can’t support.</p><TextAreaField label="Suggested CV text" value={proposal} maxLength={65_000} onChange={e => setProposal(e.target.value)} rows={14} /><div className="ats-edit-actions"><Button type="button" disabled={!proposal.trim()} onClick={() => { setEdit(proposal); setProposal(null); }}>Apply reviewed text</Button><Button type="button" variant="secondary" onClick={() => setProposal(null)}>Discard suggestions</Button></div></aside>}
      </div>}
    </section>
    {printText && <PrintCV text={printText} />}
  </main>;
}

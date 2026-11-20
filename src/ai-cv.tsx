import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowDown, ArrowLeft, ArrowRight, Check, CreditCard, Download, FileText, FolderOpen, Layers3, LockKeyhole, ScanText, Sparkles, Target, WandSparkles } from 'lucide-react';
import { useAppData } from './app-context';
import { CVPreview } from './cv-preview';
import { readCvText, draftFromText } from './cv-file-import';
import { DEFAULT_SECTION_ORDER, SECTION_LABELS, TEMPLATE_META, TEMPLATE_ORDER, emptyProfile, newDocument, sampleProfile, uid, type CVDocument, type PersonalDetails, type Profile, type TemplateId } from './model';
import { defaultStatus, formatPrice, premiumRequest, suggestedCurrency, type CheckoutResult, type PremiumStatus, type Price } from './premium-client';
import { Button, Field, InlineNotice, SelectField, TextAreaField, usePageMeta } from './ui';
import './premium.css';

type Mode = 'create' | 'improve' | 'match';
type Draft = { mode: Mode; name: string; email: string; phone: string; location: string; role: string; evidence: string; job: string };
type Pending = { id: string; draft: Draft };
type Match = { suggestions: string[]; matching: { skill: string; evidence: string }[]; missing: string[]; keywords: string[] };
type GeneratedProfile = Pick<Profile, 'summary'> & {
  workExperience: Omit<Profile['workExperience'][number], 'id' | 'order' | 'links'>[];
  education: Omit<Profile['education'][number], 'id' | 'order' | 'location' | 'currentlyStudying' | 'grade' | 'coursework' | 'credentialLink'>[];
  skills: Pick<Profile['skills'][number], 'name' | 'category'>[];
  languages: Pick<Profile['languages'][number], 'language' | 'proficiency'>[];
  optionalSections: Omit<Profile['optionalSections'][number], 'id' | 'order' | 'location' | 'link'>[];
};
type Result = Match & { profile: GeneratedProfile };
type Job<T> = { state: 'done' | 'running' | 'failed'; result: T | null };
const modes = [
  { id: 'create', name: 'Create', description: 'Start from your notes', icon: WandSparkles },
  { id: 'improve', name: 'Improve', description: 'Polish an existing CV', icon: ScanText },
  { id: 'match', name: 'Job match', description: 'Tailor to a job post', icon: Target },
] as const;
const draftKey = 'pathcv-premium-checkout-draft';
const pendingKey = 'pathcv-premium-generation';
const currencyKey = 'pathcv-premium-currency';
type PaymentReference = { sessionId: string } | { paymentId: string };
type PaymentFeedback = { tone: 'info' | 'success' | 'error'; message: string; resume?: { url: string; price: Price }; processing?: boolean };
const paymentLabels = { paid: 'Paid', pending: 'Not yet confirmed', expired: 'Closed · unpaid', refunded: 'Refunded' } as const;
function paymentFeedback(result: CheckoutResult): PaymentFeedback {
  if (result.state === 'paid') return { tone: 'success', message: result.credits ? 'Payment confirmed. Your AI credit is ready to use.' : 'Payment confirmed. There are no unused credits from your purchases.' };
  if (result.state === 'open') return { tone: 'info', message: 'This checkout is still open. Continue the same payment below.', resume: { url: result.url, price: result.price } };
  if (result.state === 'closed') return { tone: 'info', message: 'This checkout is no longer active. Check your history before starting a new payment.' };
  if (result.state === 'not_started') return { tone: 'info', message: 'This checkout did not open. Try checkout again in the same currency.' };
  return { tone: 'info', message: 'Your payment is processing. Don’t pay again. Check this payment in a moment.', processing: true };
}
function tabRead<T>(key: string): T | null { try { return JSON.parse(sessionStorage.getItem(key) ?? 'null') as T | null; } catch { return null; } }
function tabWrite(key: string, value: unknown) { try { value === null ? sessionStorage.removeItem(key) : sessionStorage.setItem(key, JSON.stringify(value)); } catch { /* Storage can be disabled. */ } }
function initialDraft(personal: PersonalDetails): Draft {
  return tabRead<Draft>(draftKey) ?? { mode: 'create', name: [personal.firstName, personal.lastName].filter(Boolean).join(' '), email: personal.email, phone: [personal.phoneCountryCode, personal.phone].filter(Boolean).join(' '), location: personal.city, role: personal.headline, evidence: '', job: '' };
}
function makeDocument(result: Result, draft: Draft, premiumId: string): CVDocument {
  const [firstName = '', ...last] = draft.name.trim().split(/\s+/);
  const base = emptyProfile();
  const withIds = <T,>(rows: T[]) => rows.map((row, order) => ({ ...row, id: uid(), order }));
  const profile: Profile = {
    ...base, summary: result.profile.summary,
    personal: { ...base.personal, firstName, lastName: last.join(' '), email: draft.email.trim(), phone: draft.phone.trim(), city: draft.location.trim(), headline: draft.role.trim() },
    workExperience: withIds(result.profile.workExperience.map((row) => ({ ...row, links: [] }))),
    education: withIds(result.profile.education.map((row) => ({ ...row, location: '', currentlyStudying: false, grade: '', coursework: '', credentialLink: '' }))),
    skills: withIds(result.profile.skills.map((row) => ({ ...row, customCategory: '', proficiency: '' }))),
    languages: withIds(result.profile.languages.map((row) => ({ ...row, cefr: '' }))),
    optionalSections: withIds(result.profile.optionalSections.map((row) => ({ ...row, location: '', link: '' }))),
  };
  return { ...newDocument(profile, 'clear', [draft.name.trim(), draft.role.trim() || 'AI CV'].filter(Boolean).join(' — ').slice(0, 120)), aiGenerationId: premiumId, setup: { purpose: 'Job', targetRole: draft.role.trim(), targetCountry: '', documentLanguage: 'English' } };
}

export function AICVPage() {
  usePageMeta({ title: 'AI CV Generator — PathCV', description: 'Create, improve, and tailor a CV with PathCV Premium. Pay once per generated CV.', path: '/ai-cv' });
  const { data, setData, saveState } = useAppData();
  const [params, setParams] = useSearchParams();
  const initialDoc = data.documents.find((item) => item.id === params.get('cv') && item.aiGenerationId);
  const [draft, setDraft] = useState(() => initialDraft(data.profile.personal));
  const [status, setStatus] = useState<PremiumStatus>(defaultStatus);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState('USD');
  const [payment, setPayment] = useState<PaymentFeedback | null>(null);
  const [paymentBusy, setPaymentBusy] = useState('');
  const [paymentRef, setPaymentRef] = useState<PaymentReference | null>(null);
  const [document, setDocument] = useState<CVDocument | null>(initialDoc ?? null);
  const [advice, setAdvice] = useState<Match | null>(null);
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [pending, setPending] = useState<Pending | null>(() => tabRead<Pending>(pendingKey));
  const [showHistory, setShowHistory] = useState(params.get('panel') === 'payments');
  const editorRef = useRef<HTMLElement>(null);
  const walletRef = useRef<HTMLElement>(null);
  const checkout = params.get('checkout');
  const checkoutId = params.get('session_id');
  const cancelledPaymentId = params.get('payment_id');
  const price = status.prices.find((item) => item.currency === currency) ?? status.prices[0];
  const total = payment?.resume?.price ?? price;
  const latestPending = status.payments.find((entry) => entry.state === 'pending');
  const checkReference = paymentRef ?? (latestPending ? { paymentId: latestPending.id } : null);
  const update = (field: keyof Draft, value: string) => setDraft((current) => ({ ...current, [field]: value }));
  const refresh = async () => {
    const next = await premiumRequest<PremiumStatus>('status');
    setStatus(next);
    return next;
  };
  const reloadStatus = async () => {
    setLoading(true); setLoadError('');
    try {
      const next = await refresh();
      const saved = tabRead<string>(currencyKey);
      setCurrency(next.prices.find((item) => item.currency === saved)?.currency ?? suggestedCurrency(next.prices).currency);
    }
    catch { setLoadError('Could not load premium status.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void reloadStatus(); }, []);
  useEffect(() => {
    if (params.get('cv') && editorRef.current) editorRef.current.scrollIntoView({ block: 'start' });
    else if (params.get('panel') === 'payments' || params.has('checkout')) walletRef.current?.scrollIntoView({ block: 'start' });
    // Run only on entry, not after edits or a completed checkout.
  }, []);

  const enabled = status.enabled;
  useEffect(() => {
    if (!enabled || !checkout) return;
    if (checkout === 'cancelled' && !cancelledPaymentId) {
      setPayment({ tone: 'info', message: 'You left checkout. Check payment history to see whether you can resume it.' });
      return;
    }
    const reference = checkout === 'success' && checkoutId ? { sessionId: checkoutId } : checkout === 'cancelled' && cancelledPaymentId ? { paymentId: cancelledPaymentId } : null;
    if (!reference) return;
    let active = true;
    setPaymentRef(reference);
    setPaymentBusy('Confirming your payment…');
    premiumRequest<CheckoutResult>('confirm', reference)
      .then((result) => { if (active) applyPaymentStatus(result); })
      .catch((e: Error) => { if (active) setPayment({ tone: 'error', message: e.message }); })
      .finally(() => { if (active) setPaymentBusy(''); });
    return () => { active = false; };
  }, [enabled, checkout, checkoutId, cancelledPaymentId]);

  function applyPaymentStatus(result: CheckoutResult) {
    setStatus((current) => ({ ...current, credits: result.credits, payments: result.payments }));
    setPayment(paymentFeedback(result));
    setPaymentRef(result.state === 'paid' || result.state === 'closed' ? null : { paymentId: result.paymentId });
  }

  async function checkPayment(reference: PaymentReference) {
    setPaymentRef(reference);
    setPaymentBusy('Checking your payment…'); setPayment(null);
    try { applyPaymentStatus(await premiumRequest<CheckoutResult>('confirm', reference)); }
    catch (e) { setPayment({ tone: 'error', message: (e as Error).message }); }
    finally { setPaymentBusy(''); }
  }

  function saveDoc(doc: CVDocument) {
    setDocument(doc);
    setData((current) => ({ ...current, documents: [doc, ...current.documents.filter((item) => item.id !== doc.id)] }));
  }
  const complete = (request: Pending, job: Job<Result>) => {
    if (job.state === 'running') { setNotice('Your request is still running. Check for your result in a moment.'); return; }
    setPending(null); tabWrite(pendingKey, null);
    if (job.state === 'failed') { setError('AI could not complete the request. Your credit was restored.'); return; }
    if (!job.result) { setError('The temporary recovery copy expired. Check My CVs for a saved version.'); return; }
    tabWrite(draftKey, null);
    const existing = data.documents.find((item) => item.aiGenerationId === request.id);
    saveDoc(existing ?? makeDocument(job.result, request.draft, request.id));
    setAdvice(job.result);
    setNotice('Your draft is ready. Review every claim before sharing it.');
    setParams({}, { replace: true });
    requestAnimationFrame(() => editorRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
  };
  async function generateCv(evt: React.FormEvent) {
    evt.preventDefault(); setError(''); setNotice('');
    if (draft.evidence.trim().length < 15 || (draft.mode === 'match' && draft.job.trim().length < 20)) { setError('Add your career evidence and, for Job match, a full job description.'); return; }
    if (!status.enabled || status.credits < 1) { walletRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }); return; }
    const request = { id: crypto.randomUUID(), draft: { ...draft } };
    setPending(request); tabWrite(pendingKey, request); setBusy('Writing your CV…');
    try { complete(request, await premiumRequest<Job<Result>>('generate', { id: request.id, mode: draft.mode, role: draft.role, evidence: draft.evidence, job: draft.mode === 'match' ? draft.job : '' })); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(''); void refresh().catch(() => {}); }
  }
  async function recover() {
    if (!pending) return;
    setBusy('Checking your request…'); setError(''); setNotice('');
    try { complete(pending, await premiumRequest<Job<Result>>('job', undefined, pending.id)); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(''); void refresh().catch(() => {}); }
  }
  function openCheckout(url: string, selectedCurrency: string) {
    tabWrite(draftKey, draft);
    tabWrite(currencyKey, selectedCurrency);
    window.location.assign(url);
  }
  async function buy() {
    setPaymentBusy('Opening secure checkout…'); setPayment(null);
    try {
      const result = await premiumRequest<CheckoutResult>('checkout', { currency: price.currency, quotedAmount: price.amount });
      if (result.state === 'open') { openCheckout(result.url, result.price.currency); return; }
      applyPaymentStatus(result);
    } catch (e) {
      setPayment({ tone: 'error', message: (e as Error).message });
      void refresh().catch(() => {});
    } finally { setPaymentBusy(''); }
  }
  async function upload(file?: File) {
    if (!file) return;
    setBusy('Reading your CV…'); setError(''); setNotice('');
    try {
      const text = await readCvText(file);
      const imported = draftFromText(text, file.name).document.profileSnapshot.personal;
      setDraft((current) => ({ ...current, evidence: text.slice(0, 16000), name: current.name || [imported.firstName, imported.lastName].filter(Boolean).join(' '), email: current.email || imported.email, phone: current.phone || imported.phone }));
      setNotice(text.length > 16000 ? 'Only the first 16,000 characters were imported. Review the text before continuing.' : 'Text extracted locally. Check your contact details and remove anything you do not want to send to AI.');
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(''); }
  }
  function demo() {
    setDocument(newDocument(sampleProfile(), 'clear', 'Fictional sample')); setAdvice(null);
    requestAnimationFrame(() => editorRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
  }
  return <main className="premium-workspace">
    <header className="premium-hero"><div className="page-width premium-hero-inner">
      <div className="premium-hero-copy"><Link className="premium-back" to="/"><ArrowLeft size={15} /> Back to PathCV</Link><div className="premium-kicker"><Sparkles size={14} /> PATHCV PREMIUM</div><h1>AI CV Generator<span>.</span></h1><p>Turn your real experience into a polished CV. Start from scratch, improve an existing draft, or tailor it to your next role.</p><div className="premium-hero-tags"><span><Check size={15} /> One-time payment</span><span><Check size={15} /> 10 templates</span><span><Check size={15} /> Free PDF downloads</span></div></div>
      <div className="premium-hero-art" aria-hidden="true"><span className="premium-art-glow"/><span className="premium-art-sheet"><span className="art-avatar">CV</span><i/><i/><b/><i/><i/><b/><i/></span><span className="premium-art-icon"><Sparkles size={27}/></span><span className="premium-art-label"><Check size={14}/> Ready to edit</span></div>
    </div></header>
    <div className="page-width premium-body">
      <div className="premium-body-top"><div><div className="eyebrow">YOUR WORKSPACE</div><h2>Build your next CV</h2></div><Link to="/my-cvs" className="button button-secondary"><FolderOpen size={16}/> My CVs</Link></div>
      {(error || notice || busy) && <div className="premium-feedback" aria-live="polite">{error && <InlineNotice tone="error">{error}</InlineNotice>}{notice && <InlineNotice tone="info">{notice}</InlineNotice>}{busy && <p className="premium-working"><span className="route-spinner" aria-hidden="true" />{busy}</p>}</div>}
      <div className="premium-grid">
        <form className="premium-panel premium-form" onSubmit={(e) => void generateCv(e)}>
          <div className="premium-step"><span>01</span><div><h3>Choose how to start</h3><p>Pick the option that fits where you are today.</p></div></div>
          <div className="premium-modes" role="group" aria-label="CV workflow">{modes.map(({ id, name, description, icon: Icon }) => <button type="button" aria-pressed={draft.mode === id} disabled={!!busy} key={id} onClick={() => update('mode', id)}><Icon size={19}/><strong>{name}</strong><small>{description}</small></button>)}</div>
          <div className="premium-step premium-step-next"><span>02</span><div><h3>{draft.mode === 'create' ? 'Tell us about yourself' : 'Add your career evidence'}</h3><p>AI can rewrite what you provide, but it should never make up experience.</p></div></div>
          <fieldset disabled={!!busy} className="premium-fields">
            <div className="form-grid form-grid-two"><Field label="Full name" autoComplete="name" placeholder="e.g. Maya Rahman" value={draft.name} maxLength={180} onChange={(e) => update('name', e.target.value)} /><Field label="Target role" placeholder="e.g. Product designer" value={draft.role} maxLength={180} onChange={(e) => update('role', e.target.value)} /><Field label="Email (optional)" type="email" autoComplete="email" placeholder="you@example.com" value={draft.email} maxLength={254} onChange={(e) => update('email', e.target.value)} /><Field label="Phone (optional)" type="tel" autoComplete="tel" value={draft.phone} maxLength={45} onChange={(e) => update('phone', e.target.value)} /><Field label="Location (optional)" placeholder="City, country" value={draft.location} maxLength={120} onChange={(e) => update('location', e.target.value)} /></div>
            {draft.mode !== 'create' && <label className="premium-upload"><FileText size={19}/><span><strong>Upload a CV</strong><small>PDF, DOCX, TXT or MD · up to 20 MB</small></span><input type="file" accept=".pdf,.docx,.txt,.md" onChange={(e) => { void upload(e.target.files?.[0]); e.target.value = ''; }} /></label>}
            <TextAreaField label={draft.mode === 'create' ? 'Career notes' : 'CV text or career notes'} required minLength={15} maxLength={16000} rows={7} value={draft.evidence} onChange={(e) => update('evidence', e.target.value)} placeholder={'Work: employer, role, dates, responsibilities, and real results\nEducation: degree, school, and dates\nSkills: tools and strengths you actually use\nProjects and certifications: what you did or earned'} />
            {draft.mode === 'match' && <TextAreaField label="Job description" required minLength={20} maxLength={10000} rows={6} value={draft.job} onChange={(e) => update('job', e.target.value)} placeholder="Paste the role, responsibilities, and requirements here." />}
          </fieldset>
          <p className="premium-privacy"><LockKeyhole size={15}/> Career text and job descriptions are sent to the AI provider only when you generate or revise. Remove sensitive details first. <Link to="/privacy#ai">Privacy</Link></p>
          {pending ? <div className="premium-actions"><Button type="button" disabled={!!busy} onClick={() => void recover()}>Check for my result <ArrowRight size={16}/></Button><Button type="button" variant="ghost" disabled={!!busy} onClick={() => { setPending(null); tabWrite(pendingKey, null); }}>Dismiss recovery</Button></div> : status.enabled && status.credits > 0 ? <Button type="submit" disabled={!!busy}><Sparkles size={16}/> Generate CV · 1 credit</Button> : <Button type="button" disabled={loading || !!busy} onClick={() => walletRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>{status.enabled ? 'Unlock AI generation' : 'View premium availability'} <ArrowDown size={16}/></Button>}
        </form>
        <aside className="premium-aside" ref={walletRef} aria-label="Premium credits and payment">
          <div className="premium-panel premium-wallet">
            <div className="premium-wallet-head"><span className="premium-tile-icon"><CreditCard size={20}/></span><span className="premium-pill">PREMIUM</span></div>
            <h3>One CV. One payment.</h3>
            <p>One AI generation credit, with no subscription.</p>
            <div className="premium-wallet-balance" aria-live="polite"><span>Available credits</span><strong>{loading ? '—' : status.credits}</strong></div>
            {status.enabled ? <>
              {!payment?.resume && status.prices.length > 1 && <SelectField label="Checkout currency" value={price.currency} disabled={!!paymentBusy} onChange={(e) => { setCurrency(e.target.value); tabWrite(currencyKey, e.target.value); }}>{status.prices.map((entry) => <option key={entry.currency} value={entry.currency}>{entry.currency} — {formatPrice(entry)}</option>)}</SelectField>}
              <div className="premium-order-total"><div><strong>Checkout total</strong><small>1 AI CV credit</small></div><div><strong>{formatPrice(total)}</strong><small>{total.currency}</small></div></div>
              {(paymentBusy || payment) && <div className="premium-payment-feedback" role="status">{paymentBusy ? <p className="premium-working"><span className="route-spinner" aria-hidden="true" />{paymentBusy}</p> : payment && <InlineNotice tone={payment.tone}>{payment.message}</InlineNotice>}</div>}
              {payment?.resume ? <>
                <Button type="button" disabled={!!paymentBusy || !!busy} onClick={() => { if (payment.resume) openCheckout(payment.resume.url, payment.resume.price.currency); }}><LockKeyhole size={15}/> Resume Stripe checkout <ArrowRight size={16}/></Button>
                <Button type="button" variant="ghost" disabled={!!paymentBusy || !!busy} onClick={() => setPayment(null)}>Back to checkout options</Button>
              </> : !payment?.processing && <Button type="button" disabled={!!paymentBusy || !!busy} onClick={() => void buy()}><LockKeyhole size={15}/> Continue to Stripe <ArrowRight size={16}/></Button>}
              <small className="premium-checkout-note">Stripe shows the payment methods available for your location and device.</small>
              {checkReference && <Button type="button" variant={payment?.processing ? 'primary' : 'secondary'} disabled={!!paymentBusy || !!busy} onClick={() => void checkPayment(checkReference)}>Check payment status</Button>}
            </> : <><div className="premium-price">{formatPrice(price)} <small>{price.currency} / CV</small></div><p className="premium-unavailable">{loading ? 'Checking availability…' : loadError || 'Checkout isn’t enabled on this site yet. Explore the sample below or build a CV for free.'}</p></>}
            {loadError && <Button type="button" variant="ghost" disabled={loading} onClick={() => void reloadStatus()}>Retry loading checkout</Button>}
            {status.enabled && <Button type="button" variant="ghost" disabled={loading || !!paymentBusy || !!busy} onClick={() => void reloadStatus()}>Refresh balance</Button>}
            <button className="premium-history-toggle" type="button" aria-expanded={showHistory} onClick={() => setShowHistory(!showHistory)}>Payment history <ArrowDown size={15}/></button>
            {showHistory && <div className="premium-history">{status.payments.length ? status.payments.map((entry) => <article key={entry.id}><div className="premium-payment-row"><span>{new Date(entry.created_at).toLocaleDateString()}<small>{paymentLabels[entry.state]}</small></span><strong>{formatPrice(entry)} {entry.currency}</strong></div>{entry.state === 'pending' && <Button type="button" variant="secondary" disabled={!!paymentBusy || !!busy} onClick={() => { walletRef.current?.scrollIntoView({ block: 'start' }); void checkPayment({ paymentId: entry.id }); }}>Check or resume payment</Button>}</article>) : <p>No payments on this browser yet.</p>}{status.wallet && <small className="premium-wallet-ref">Wallet reference: {status.wallet}</small>}</div>}
          </div>
          <div className="premium-panel premium-included"><h3><Layers3 size={18}/> Included with your CV</h3><ul>{[`Up to ${status.revisions} AI text revisions`, 'Unlimited manual editing', 'All 10 PathCV templates', 'Repeat PDF downloads', 'Credit back if generation fails'].map((item) => <li key={item}><Check size={15}/>{item}</li>)}</ul><Button type="button" variant="secondary" disabled={!!busy} onClick={demo}>Explore a sample CV <ArrowRight size={15}/></Button><p>CVs and credits stay tied to this browser. Back up your saved CVs before clearing site data.</p></div>
        </aside>
      </div>
      {document && <section className="premium-result" ref={editorRef}><div className="premium-body-top"><div><div className="eyebrow">{document.aiGenerationId ? 'SAVED ON THIS DEVICE' : 'FICTIONAL SAMPLE'}</div><h2>{document.aiGenerationId ? 'Review your CV' : 'Explore the editor'}</h2></div></div>
        {document.aiGenerationId && (saveState === 'quota' || saveState === 'error') && <InlineNotice tone="error">This browser could not save your latest edits. Download a PDF before leaving the page.</InlineNotice>}
        {advice && <MatchAdvice advice={advice}/>}
        <ResultEditor key={document.id} doc={document} enabled={status.enabled} onChange={(next) => next.aiGenerationId ? saveDoc(next) : setDocument(next)} />
      </section>}
      <div className="premium-bottom"><span>Prefer to write it yourself?</span><Link to="/builder?new=1">Use the free manual builder <ArrowRight size={16}/></Link></div>
    </div>
  </main>;
}

function MatchAdvice({ advice }: { advice: Match }) {
  const groups = [{ name: 'Matching skills', items: advice.matching.map((row) => `${row.skill} — “${row.evidence}”`) }, { name: 'Not evidenced in your CV', items: advice.missing }, { name: 'Relevant keywords', items: advice.keywords }, { name: 'Skills to consider', items: advice.suggestions }].filter(({ items }) => items.length);
  return groups.length ? <div className="premium-advice">{groups.map(({ name, items }) => <article className="premium-panel" key={name}><h3>{name}</h3><ul>{items.map((item, index) => <li key={index}>{item}</li>)}</ul></article>)}<p>Suggestions and gaps are not added as claims. Include a skill only if you actually have it.</p></div> : null;
}

type Passage = { id: string; name: string; value: string; update: (profile: Profile, value: string) => Profile };
function passages(profile: Profile): Passage[] {
  return [
    { id: 'summary', name: 'Professional summary', value: profile.summary, update: (p, value) => ({ ...p, summary: value }) },
    ...profile.workExperience.flatMap((row, index) => (['description', 'achievements'] as const).map((key): Passage => ({ id: `${row.id}-${key}`, name: `${row.title || `Role ${index + 1}`} · ${key}`, value: row[key], update: (p, value) => ({ ...p, workExperience: p.workExperience.map((job) => job.id === row.id ? { ...job, [key]: value } : job) }) }))),
    ...profile.optionalSections.map((row): Passage => ({ id: row.id, name: row.title || SECTION_LABELS[row.sectionKey], value: row.description, update: (p, value) => ({ ...p, optionalSections: p.optionalSections.map((item) => item.id === row.id ? { ...item, description: value } : item) }) })),
  ];
}
function ResultEditor({ doc, enabled, onChange }: { doc: CVDocument; enabled: boolean; onChange: (doc: CVDocument) => void }) {
  const fields = passages(doc.profileSnapshot);
  const [fieldId, setFieldId] = useState('summary');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [suggestion, setSuggestion] = useState<{ replacement: string; start: number; end: number } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const field = fields.find((entry) => entry.id === fieldId) ?? fields[0];
  const patch = (changes: Partial<CVDocument>) => onChange({ ...doc, ...changes, updatedAt: new Date().toISOString() });
  const write = (value: string) => { setSuggestion(null); patch({ profileSnapshot: field.update(doc.profileSnapshot, value) }); };
  async function revise(instruction: 'regenerate' | 'polish') {
    if (!doc.aiGenerationId || !field.value.trim()) return;
    const start = instruction === 'polish' ? textareaRef.current?.selectionStart ?? 0 : 0;
    const end = instruction === 'polish' ? textareaRef.current?.selectionEnd ?? 0 : field.value.length;
    const selection = field.value.slice(start, end);
    setError(''); setNote(''); setSuggestion(null);
    if (!selection.trim()) { setError('Highlight a sentence in the text box first.'); return; }
    const { personal: _personal, ...career } = doc.profileSnapshot;
    setBusy(true);
    try {
      const job = await premiumRequest<Job<{ replacement: string }>>('generate', { id: crypto.randomUUID(), mode: 'revise', parent: doc.aiGenerationId, instruction, evidence: JSON.stringify(career).slice(0, 16000), section: field.name.slice(0, 180), selection });
      if (job.state !== 'done' || !job.result) throw new Error('No revision was used. Please try again.');
      setSuggestion({ replacement: job.result.replacement, start, end });
      setNote('Review the suggestion before applying it.');
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  }
  return <div className="premium-edit-grid"><div className="premium-panel premium-editor">
    <h3><WandSparkles size={18}/> Edit your content</h3><p>Edits appear instantly in the preview.</p>
    <fieldset disabled={busy} className="premium-fields">
      <SelectField label="Text section" value={field.id} onChange={(e) => { setFieldId(e.target.value); setSuggestion(null); setNote(''); setError(''); }}>{fields.map((entry) => <option value={entry.id} key={entry.id}>{entry.name}</option>)}</SelectField>
      <label className="field"><span className="field-label">Section text</span><textarea ref={textareaRef} rows={7} maxLength={4000} value={field.value} onChange={(e) => write(e.target.value)}/></label>
      {enabled && doc.aiGenerationId && <div className="premium-actions"><Button type="button" variant="secondary" disabled={!field.value.trim()} onClick={() => void revise('regenerate')}><Sparkles size={15}/> Regenerate</Button><Button type="button" variant="secondary" disabled={!field.value.trim()} onMouseDown={(e) => e.preventDefault()} onClick={() => void revise('polish')}>Improve selection</Button></div>}
      {suggestion && <div className="premium-suggestion"><p>{suggestion.replacement}</p><div className="premium-actions"><Button type="button" onClick={() => { write(field.value.slice(0, suggestion.start) + suggestion.replacement + field.value.slice(suggestion.end)); setNote('Suggestion applied.'); }}>Apply</Button><Button type="button" variant="ghost" onClick={() => { setSuggestion(null); setNote(''); }}>Dismiss</Button></div></div>}
      <SelectField label="CV template" value={doc.templateId} onChange={(e) => patch({ templateId: e.target.value as TemplateId })}>{TEMPLATE_ORDER.map((id) => <option value={id} key={id}>{TEMPLATE_META[id].name}</option>)}</SelectField>
      <details className="premium-section-toggle"><summary>Show or hide sections</summary>{DEFAULT_SECTION_ORDER.map((key) => <label key={key}><input type="checkbox" checked={doc.sectionVisibility[key]} onChange={(e) => patch({ sectionVisibility: { ...doc.sectionVisibility, [key]: e.target.checked } })}/>{SECTION_LABELS[key]}</label>)}</details>
    </fieldset>
    <div aria-live="polite">{busy && <p>Working on your revision…</p>}{note && <p>{note}</p>}{error && <InlineNotice tone="error">{error}</InlineNotice>}</div>
    <div className="premium-actions">{doc.aiGenerationId && <Link className="button button-secondary" to={`/builder?id=${encodeURIComponent(doc.id)}`}>Open full editor <ArrowRight size={15}/></Link>}<Button type="button" onClick={() => window.print()}><Download size={16}/> Download PDF</Button></div><small className="premium-checkout-note">Choose “Save as PDF” in your browser’s print dialog.</small>
  </div><div className="premium-panel premium-preview"><CVPreview document={doc} /></div></div>;
}

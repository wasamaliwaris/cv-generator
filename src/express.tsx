import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Briefcase, Check, GraduationCap, Plus, Sparkles, Trash2, UserRound, Wrench, Zap } from 'lucide-react';
import type { MonthDate } from './model';
import { emptyProfile, isValidEmail, newDocument, uid } from './model';
import { kitById, ROLE_KITS } from './starters';
import { useAppData } from './app-context';
import { DateFields } from './forms';
import { BackLink, Button, Field, InlineNotice, TextAreaField, usePageMeta } from './ui';

interface QuickJob {
  id: string;
  title: string;
  employer: string;
  location: string;
  start: MonthDate;
  end: MonthDate;
  current: boolean;
  bullets: string;
}

interface QuickEdu {
  id: string;
  qualification: string;
  institution: string;
  location: string;
  end: MonthDate;
}

const blankJob = (): QuickJob => ({ id: uid(), title: '', employer: '', location: '', start: null, end: null, current: false, bullets: '' });
const blankEdu = (): QuickEdu => ({ id: uid(), qualification: '', institution: '', location: '', end: null });

function splitList(value: string): string[] {
  return value.split(',').map((s) => s.trim()).filter(Boolean);
}

export function ExpressPage() {
  usePageMeta({ title: 'Express CV Maker: a CV in 2 Minutes \u2014 PathCV', description: 'Answer six quick steps and get a complete CV in about two minutes. Free templates and PDF export, no account needed.', path: '/express' });
  const { setData } = useAppData();
  const navigate = useNavigate();
  const [kitId, setKitId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [headline, setHeadline] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [link, setLink] = useState('');
  const [summary, setSummary] = useState('');
  const [jobs, setJobs] = useState<QuickJob[]>([blankJob()]);
  const [edu, setEdu] = useState<QuickEdu[]>([blankEdu()]);
  const [skillsText, setSkillsText] = useState('');
  const [langsText, setLangsText] = useState('');
  const [error, setError] = useState('');
  const kit = kitId ? kitById(kitId) : undefined;

  const essentials = useMemo(() => {
    const items = [
      Boolean(firstName.trim() || lastName.trim()),
      Boolean(email.trim()) && isValidEmail(email),
      Boolean(headline.trim()),
      summary.trim().length >= 40,
      jobs.some((j) => j.title.trim() && j.employer.trim()),
      splitList(skillsText).length >= 3,
    ];
    return { done: items.filter(Boolean).length, total: items.length };
  }, [firstName, lastName, email, headline, summary, jobs, skillsText]);

  const applyKit = (id: string) => {
    setKitId(id);
    const selected = kitById(id);
    if (!selected) return;
    if (!headline.trim()) setHeadline(selected.headlines[0]);
    if (!summary.trim()) setSummary(selected.summaries[0]);
    if (!skillsText.trim()) setSkillsText(selected.skills.join(', '));
  };

  const [searchParams] = useSearchParams();
  const kitApplied = useRef(false);
  useEffect(() => {
    if (kitApplied.current) return;
    const requested = searchParams.get('kit');
    if (requested && kitById(requested)) {
      kitApplied.current = true;
      applyKit(requested);
    }
  });

  const patchJob = (id: string, patch: Partial<QuickJob>) =>
    setJobs((rows) => rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  const patchEdu = (id: string, patch: Partial<QuickEdu>) =>
    setEdu((rows) => rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));

  const create = () => {
    setError('');
    if (!firstName.trim() && !lastName.trim()) {
      setError('Add at least your first or last name to create your CV.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (email.trim() && !isValidEmail(email)) {
      setError('That email address does not look valid yet. Fix it or leave it empty for now.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const profile = emptyProfile();
    profile.personal = {
      ...profile.personal,
      firstName: firstName.trim(), lastName: lastName.trim(), headline: headline.trim(),
      email: email.trim(), phone: phone.trim(), city: city.trim(), country: country.trim(),
      website: link.trim() && !/linkedin/i.test(link) ? link.trim() : '',
      linkedin: /linkedin/i.test(link) ? link.trim() : '',
    };
    profile.summary = summary.trim();
    profile.workExperience = jobs
      .filter((j) => j.title.trim() || j.employer.trim() || j.bullets.trim())
      .map((j, index) => ({
        id: uid(), order: index, title: j.title.trim(), employer: j.employer.trim(), location: j.location.trim(),
        startDate: j.start, endDate: j.current ? null : j.end, current: j.current,
        description: j.bullets.trim(), achievements: '', links: [],
      }));
    profile.education = edu
      .filter((e) => e.qualification.trim() || e.institution.trim())
      .map((e, index) => ({
        id: uid(), order: index, qualification: e.qualification.trim(), institution: e.institution.trim(),
        location: e.location.trim(), startDate: null, endDate: e.end, currentlyStudying: false,
        fieldOfStudy: '', grade: '', coursework: '', credentialLink: '',
      }));
    profile.skills = splitList(skillsText).map((name, index) => ({
      id: uid(), order: index, category: 'Professional' as const, customCategory: '', name, proficiency: '',
    }));
    profile.languages = splitList(langsText).map((language, index) => ({
      id: uid(), order: index, language, proficiency: 'Intermediate' as const, cefr: '' as const,
    }));

    const name = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
    const doc = newDocument(profile, 'modern', name ? `${name}'s CV` : 'My Express CV');
    setData((current) => ({ ...current, documents: [doc, ...current.documents] }));
    navigate(`/builder?id=${encodeURIComponent(doc.id)}&step=7`);
  };

  return (
    <main className="page-width standard-page express-page">
      <BackLink to="/builder">Back to builder options</BackLink>
      <div className="express-head">
        <div>
          <div className="eyebrow">EXPRESS MODE · ABOUT 2 MINUTES</div>
          <h1>A solid CV, <em>fast.</em></h1>
          <p>Answer the essentials on one page. We will build your CV instantly — then you pick a design and download. First-timers and pros alike finish this in minutes.</p>
        </div>
        <div className="essentials-pill" aria-live="polite">
          <span className="essentials-ring" style={{ background: `conic-gradient(var(--teal) 0 ${Math.round((essentials.done / essentials.total) * 100)}%, var(--line) 0 100%)` }}>{essentials.done}/{essentials.total}</span>
          <span>essentials<br />complete</span>
        </div>
      </div>

      <ol className="express-steps" aria-label="Express progress">
        {[
          { label: 'Start', done: Boolean(kitId) },
          { label: 'Contact', done: Boolean((firstName.trim() || lastName.trim()) && email.trim()) },
          { label: 'Summary', done: summary.trim().length >= 40 },
          { label: 'Roles', done: jobs.some((j) => j.title.trim() && j.employer.trim()) },
          { label: 'Education', done: edu.some((e) => e.qualification.trim()) },
          { label: 'Skills', done: splitList(skillsText).length >= 3 },
        ].map((step, i) => <li key={step.label} className={step.done ? 'done' : ''}><span className="express-step-dot">{step.done ? <Check size={12} /> : i + 1}</span><span className="express-step-label">{step.label}</span></li>)}
      </ol>
      {error && <div className="express-error"><InlineNotice tone="error">{error}</InlineNotice></div>}

      <section className="express-card" aria-label="Choose a starting point">
        <div className="express-card-head"><span className="express-step-icon"><Zap size={17} /></span><div><h2>1 · Pick a starting point</h2><p>Optional. A role kit fills your headline, summary, and skills with editable examples.</p></div></div>
        <div className="kit-grid" role="group" aria-label="Role starter kits">
          {ROLE_KITS.map((k) => (
            <button key={k.id} type="button" className={`kit-card ${kitId === k.id ? 'selected' : ''}`} aria-pressed={kitId === k.id} onClick={() => applyKit(k.id)}>
              <strong>{k.label}</strong><small>{k.tagline}</small>
              {kitId === k.id && <span className="kit-check"><Check size={12} /> Using</span>}
            </button>
          ))}
        </div>
        {kit && <p className="kit-note"><Sparkles size={13} /> Using the {kit.label} kit — every filled word stays editable. {kitId && <button type="button" className="text-action" onClick={() => setKitId('')}>Stop using kit</button>}</p>}
      </section>

      <section className="express-card" aria-label="Contact details">
        <div className="express-card-head"><span className="express-step-icon"><UserRound size={17} /></span><div><h2>2 · How do they reach you?</h2><p>Name and one contact method is enough to start.</p></div></div>
        <div className="form-grid form-grid-two">
          <Field label="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" placeholder="Maya" />
          <Field label="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" placeholder="Rahman" />
          <Field label="Headline" className="span-two" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="e.g. Customer Service Associate" hint="Your role in a few words — it appears under your name." />
          <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" error={email.trim() && !isValidEmail(email) ? 'Enter a valid email, or leave empty for now.' : undefined} />
          <Field label="Phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" placeholder="+92 300 1234567" />
          <Field label="City" value={city} onChange={(e) => setCity(e.target.value)} autoComplete="address-level2" placeholder="Lahore" />
          <Field label="Country" value={country} onChange={(e) => setCountry(e.target.value)} autoComplete="country-name" placeholder="Pakistan" />
          <Field label="Link (optional)" className="span-two" value={link} onChange={(e) => setLink(e.target.value)} placeholder="linkedin.com/in/you or your website" />
        </div>
      </section>

      <section className="express-card" aria-label="Summary">
        <div className="express-card-head"><span className="express-step-icon"><Sparkles size={17} /></span><div><h2>3 · Say it in 3 sentences</h2><p>What you do, who you help, and one proof point. {kit ? 'Starter text from your kit is below — make it yours.' : 'Stuck? Pick a role kit above for starter text.'}</p></div></div>
        <TextAreaField label="Professional summary" rows={5} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="I am a … with experience in …" hint={`${summary.trim().length} characters · aim for 40+`} />
      </section>

      <section className="express-card" aria-label="Experience">
        <div className="express-card-head"><span className="express-step-icon"><Briefcase size={17} /></span><div><h2>4 · Your best roles ({jobs.length}/3)</h2><p>Most recent first. One bullet per line — start each with what you did.</p></div></div>
        <div className="express-repeat-list">
          {jobs.map((job, i) => (
            <div className="express-repeat-card" key={job.id}>
              <div className="express-repeat-head"><strong>{job.title.trim() || job.employer.trim() || `Role ${i + 1}`}</strong>
                {jobs.length > 1 && <button type="button" className="icon-button" aria-label={`Remove role ${i + 1}`} onClick={() => setJobs((rows) => rows.filter((r) => r.id !== job.id))}><Trash2 size={15} /></button>}
              </div>
              <div className="form-grid form-grid-two">
                <Field label="Job title" value={job.title} onChange={(e) => patchJob(job.id, { title: e.target.value })} placeholder="Sales Assistant" />
                <Field label="Employer" value={job.employer} onChange={(e) => patchJob(job.id, { employer: e.target.value })} placeholder="City Mart" />
                <Field label="Location" value={job.location} onChange={(e) => patchJob(job.id, { location: e.target.value })} placeholder="Lahore" />
                <div className="express-date-wrap"><DateFields label="Start date" value={job.start} onChange={(v) => patchJob(job.id, { start: v })} /></div>
                {!job.current && <div className="express-date-wrap"><DateFields label="End date" value={job.end} onChange={(v) => patchJob(job.id, { end: v })} /></div>}
                <label className="checkbox-row"><input type="checkbox" checked={job.current} onChange={(e) => patchJob(job.id, { current: e.target.checked, end: e.target.checked ? null : job.end })} /><span>I work here now</span></label>
                <TextAreaField label="What did you do? (one per line)" className="span-two" rows={3} value={job.bullets} onChange={(e) => patchJob(job.id, { bullets: e.target.value })} placeholder={'Served 100+ customers daily\nTrained 3 new staff members'} />
              </div>
              {kit && !job.bullets.trim() && (
                <button type="button" className="text-action" onClick={() => patchJob(job.id, { bullets: kit.bullets.join('\n') })}>
                  <Sparkles size={14} /> Insert {kit.label.toLowerCase()} example bullets
                </button>
              )}
            </div>
          ))}
        </div>
        {jobs.length < 3 ? (
          <Button type="button" variant="secondary" onClick={() => setJobs((rows) => [...rows, blankJob()])}><Plus size={16} /> Add another role</Button>
        ) : (
          <p className="field-hint">3 roles is plenty for Express — add more later in the full builder.</p>
        )}
      </section>

      <section className="express-card" aria-label="Education">
        <div className="express-card-head"><span className="express-step-icon"><GraduationCap size={17} /></span><div><h2>5 · Education</h2><p>Your highest or most recent qualification.</p></div></div>
        <div className="express-repeat-list">
          {edu.map((e, i) => (
            <div className="express-repeat-card" key={e.id}>
              <div className="express-repeat-head"><strong>{e.qualification.trim() || `Education ${i + 1}`}</strong>
                {edu.length > 1 && <button type="button" className="icon-button" aria-label={`Remove education ${i + 1}`} onClick={() => setEdu((rows) => rows.filter((r) => r.id !== e.id))}><Trash2 size={15} /></button>}
              </div>
              <div className="form-grid form-grid-two">
                <Field label="Qualification" value={e.qualification} onChange={(ev) => patchEdu(e.id, { qualification: ev.target.value })} placeholder="BBA, Intermediate, Matric…" />
                <Field label="Institution" value={e.institution} onChange={(ev) => patchEdu(e.id, { institution: ev.target.value })} placeholder="University of the Punjab" />
                <Field label="Location" value={e.location} onChange={(ev) => patchEdu(e.id, { location: ev.target.value })} placeholder="Lahore" />
                <div className="express-date-wrap"><DateFields label="Completion date" value={e.end} onChange={(v) => patchEdu(e.id, { end: v })} /></div>
              </div>
            </div>
          ))}
        </div>
        {edu.length < 2 && <Button type="button" variant="secondary" onClick={() => setEdu((rows) => [...rows, blankEdu()])}><Plus size={16} /> Add education</Button>}
      </section>

      <section className="express-card" aria-label="Skills and languages">
        <div className="express-card-head"><span className="express-step-icon"><Wrench size={17} /></span><div><h2>6 · Skills & languages</h2><p>Comma-separated — we will format them for you.</p></div></div>
        <div className="form-grid form-grid-two">
          <Field label="Skills (comma-separated)" className="span-two" value={skillsText} onChange={(e) => setSkillsText(e.target.value)} placeholder="Customer service, Cash handling, MS Excel" hint={`${splitList(skillsText).length} skills · aim for 3+`} />
          <Field label="Languages (comma-separated)" className="span-two" value={langsText} onChange={(e) => setLangsText(e.target.value)} placeholder="Urdu, English, Punjabi" hint="You can set exact levels later in the full builder." />
        </div>
      </section>

      <div className="express-footer">
        <Link to="/builder" className="button button-ghost"><ArrowLeft size={16} /> All options</Link>
        <span className="express-footer-count">{essentials.done} of {essentials.total} essentials ready</span>
        <Button type="button" onClick={create}>Create my CV <ArrowRight size={16} /></Button>
      </div>
      <p className="express-next">Next: pick a design, preview your CV, and download the PDF — everything stays editable.</p>
    </main>
  );
}

import type { CVDocument, Profile } from './model';
import { dateRange, isValidEmail } from './model';

/* ---------- Completeness score ---------- */

export interface ScoreCheck {
  label: string;
  done: boolean;
  hint: string;
  weight: number;
}

export function scoreChecks(doc: CVDocument): ScoreCheck[] {
  const p: Profile = doc.profileSnapshot;
  const personal = p.personal;
  const hasName = Boolean(personal.firstName.trim() && personal.lastName.trim());
  const roles = p.workExperience.filter((w) => w.title.trim() || w.employer.trim());
  const firstRole = p.workExperience.find((w) => w.title.trim() || w.employer.trim());
  const roleBullets = firstRole
    ? [...firstRole.description.split(/\r?\n/), ...firstRole.achievements.split(/\r?\n/)]
        .map((l) => l.replace(/^\s*[•*-]\s*/, '').trim())
        .filter(Boolean).length
    : 0;
  const hasLinks = Boolean(personal.website.trim() || personal.linkedin.trim() || personal.portfolio.trim() || personal.otherLink.trim());

  return [
    { label: 'Full name', done: hasName, hint: 'Add your first and last name.', weight: 10 },
    { label: 'Headline', done: Boolean(personal.headline.trim()), hint: 'One line: your role or strength.', weight: 5 },
    { label: 'Valid email', done: Boolean(personal.email.trim()) && isValidEmail(personal.email), hint: 'Add an email you actually check.', weight: 10 },
    { label: 'Phone number', done: Boolean(personal.phone.trim()), hint: 'Include a country code for international roles.', weight: 5 },
    { label: 'Location', done: Boolean(personal.city.trim() || personal.country.trim()), hint: 'City and country is enough.', weight: 5 },
    { label: 'Summary', done: p.summary.trim().length >= 40, hint: 'Write 2–3 specific sentences (40+ characters).', weight: 10 },
    { label: 'Work experience', done: roles.length > 0, hint: 'Add at least one role with title and employer.', weight: 15 },
    { label: 'Role dates', done: Boolean(firstRole && (firstRole.startDate || firstRole.current)), hint: 'Add a start date to your most recent role.', weight: 5 },
    { label: 'Achievement bullets', done: roleBullets >= 2, hint: 'Add 2+ bullets to your top role. Numbers help.', weight: 10 },
    { label: 'Education', done: p.education.some((e) => e.qualification.trim() || e.institution.trim()), hint: 'Add your highest or most relevant qualification.', weight: 5 },
    { label: 'Skills', done: p.skills.filter((s) => s.name.trim()).length >= 3, hint: 'List at least 3 relevant skills.', weight: 10 },
    { label: 'Languages', done: p.languages.some((l) => l.language.trim()), hint: 'Even one language helps.', weight: 5 },
    { label: 'Links or portfolio', done: hasLinks, hint: 'LinkedIn, portfolio, or website.', weight: 5 },
  ];
}

export function scoreCV(doc: CVDocument): { score: number; checks: ScoreCheck[] } {
  const checks = scoreChecks(doc);
  const score = checks.reduce((total, c) => total + (c.done ? c.weight : 0), 0);
  return { score, checks };
}

export function scoreLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 70) return 'Strong';
  if (score >= 50) return 'Good start';
  if (score >= 25) return 'Getting there';
  return 'Just started';
}

/* ---------- Plain-text export (for pasting into job portals) ---------- */

function bulletLines(value: string): string[] {
  return value.split(/\r?\n/).map((l) => l.replace(/^\s*[•*-]\s*/, '').trim()).filter(Boolean);
}

export function profileToPlainText(doc: CVDocument): string {
  const p = doc.profileSnapshot;
  const lines: string[] = [];
  const fullName = [p.personal.firstName, p.personal.lastName].filter(Boolean).join(' ').toUpperCase() || 'YOUR NAME';
  lines.push(fullName);
  if (p.personal.headline.trim()) lines.push(p.personal.headline.trim());
  const contactBits = [
    p.personal.email.trim(),
    [p.personal.phoneCountryCode, p.personal.phone].filter(Boolean).join(' '),
    [p.personal.city, p.personal.region, p.personal.country].filter(Boolean).join(', '),
  ].filter(Boolean);
  if (contactBits.length) lines.push(contactBits.join(' | '));
  const links = [p.personal.website, p.personal.linkedin, p.personal.portfolio, p.personal.otherLink]
    .map((l) => l.trim()).filter(Boolean);
  if (links.length) lines.push(links.join(' | '));
  lines.push('='.repeat(48));

  const pushSection = (title: string, body: string[]) => {
    if (!body.length) return;
    lines.push('', title.toUpperCase(), '-'.repeat(title.length));
    lines.push(...body);
  };

  for (const key of doc.sectionOrder) {
    if (!doc.sectionVisibility[key]) continue;
    if (key === 'summary' && p.summary.trim()) {
      pushSection('Profile', [p.summary.trim()]);
    } else if (key === 'experience') {
      const rows = [...p.workExperience].sort((a, b) => a.order - b.order);
      const body: string[] = [];
      for (const w of rows) {
        const head = [w.title.trim(), w.employer.trim()].filter(Boolean).join(' — ');
        if (!head && !w.description.trim() && !w.achievements.trim()) continue;
        if (head) body.push(head);
        const meta = [[w.location.trim(), dateRange(w.startDate, w.endDate, w.current, doc.dateFormat)].filter(Boolean).join(' | ')];
        if (meta[0]) body.push(meta[0]);
        for (const b of [...bulletLines(w.description), ...bulletLines(w.achievements)]) body.push(`- ${b}`);
        body.push('');
      }
      pushSection('Experience', body);
    } else if (key === 'education') {
      const rows = [...p.education].sort((a, b) => a.order - b.order);
      const body: string[] = [];
      for (const e of rows) {
        const head = [e.qualification.trim(), e.institution.trim()].filter(Boolean).join(' — ');
        if (!head) continue;
        body.push(head);
        const meta = [[e.location.trim(), dateRange(e.startDate, e.endDate, e.currentlyStudying, doc.dateFormat)].filter(Boolean).join(' | ')];
        if (meta[0]) body.push(meta[0]);
        if (e.fieldOfStudy.trim() || e.grade.trim()) {
          body.push([e.fieldOfStudy.trim(), e.grade.trim() && `Grade: ${e.grade.trim()}`].filter(Boolean).join(' | '));
        }
        body.push('');
      }
      pushSection('Education', body);
    } else if (key === 'skills') {
      const rows = [...p.skills].sort((a, b) => a.order - b.order).filter((s) => s.name.trim());
      if (rows.length) {
        pushSection('Skills', [rows.map((s) => (s.proficiency.trim() ? `${s.name.trim()} (${s.proficiency.trim()})` : s.name.trim())).join(', ')]);
      }
    } else if (key === 'languages') {
      const rows = [...p.languages].sort((a, b) => a.order - b.order).filter((l) => l.language.trim());
      if (rows.length) {
        pushSection('Languages', rows.map((l) => `- ${l.language.trim()}${l.proficiency ? ` (${l.proficiency})` : ''}${l.cefr ? `, CEFR ${l.cefr}` : ''}`));
      }
    } else {
      const rows = [...p.optionalSections]
        .filter((o) => o.sectionKey === key && (o.title.trim() || o.organization.trim() || o.description.trim()))
        .sort((a, b) => a.order - b.order);
      if (rows.length) {
        const title = key === 'custom' ? rows[0].customTitle.trim() || 'Additional' : key;
        const body: string[] = [];
        for (const o of rows) {
          const head = [o.title.trim(), o.organization.trim()].filter(Boolean).join(' — ');
          if (head) body.push(head);
          const range = dateRange(o.startDate, o.endDate, false, doc.dateFormat);
          if (range) body.push(range);
          for (const b of bulletLines(o.description)) body.push(`- ${b}`);
          if (o.link.trim()) body.push(o.link.trim());
          body.push('');
        }
        pushSection(title, body);
      }
    }
  }
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* fall through to legacy method */ }
  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  } catch {
    return false;
  }
}

export function downloadTextFile(filename: string, text: string): void {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

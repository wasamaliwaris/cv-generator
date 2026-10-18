import {
  ACCENT_PALETTE, DEFAULT_SECTION_ORDER, OPTIONAL_SECTION_KEYS, blankCoverLetter,
  emptyProfile, type AppData, type BuilderSetup, type CVDocument, type CoverLetterData, type DateFormat, type EducationEntry,
  type FontChoice, type LanguageEntry, type MonthDate, type OptionalSectionEntry, type Profile,
  type SectionKey, type SkillEntry, type TemplateId, type WorkExperience,
} from './model';

export const STORAGE_KEY = 'pathcv-local-v1';

const text = (value: unknown): string => typeof value === 'string' ? value : '';
const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);
const validDate = (value: unknown): MonthDate => {
  if (!isRecord(value) || typeof value.month !== 'number' || typeof value.year !== 'number') return null;
  if (!Number.isInteger(value.month) || value.month < 1 || value.month > 12 || !Number.isInteger(value.year) || value.year < 1900 || value.year > 2200) return null;
  return { month: value.month, year: value.year };
};
const idOr = (value: unknown, fallback: string) => typeof value === 'string' && value ? value : fallback;
const arrayOfRecords = (value: unknown) => Array.isArray(value) ? value.filter(isRecord) : [];

function normalizeProfile(value: unknown): Profile {
  const defaults = emptyProfile();
  if (!isRecord(value)) return defaults;
  const p = isRecord(value.personal) ? value.personal : {};
  const workExperience: WorkExperience[] = arrayOfRecords(value.workExperience).map((row, index) => ({
    id: idOr(row.id, `job-${index}`), order: typeof row.order === 'number' ? row.order : index,
    title: text(row.title), employer: text(row.employer), location: text(row.location),
    startDate: validDate(row.startDate), endDate: validDate(row.endDate), current: row.current === true,
    description: text(row.description), achievements: text(row.achievements),
    links: arrayOfRecords(row.links).map((link, i) => ({ id: idOr(link.id, `link-${index}-${i}`), label: text(link.label), url: text(link.url) })),
  }));
  const education: EducationEntry[] = arrayOfRecords(value.education).map((row, index) => ({
    id: idOr(row.id, `education-${index}`), order: typeof row.order === 'number' ? row.order : index,
    qualification: text(row.qualification), institution: text(row.institution), location: text(row.location),
    startDate: validDate(row.startDate), endDate: validDate(row.endDate), currentlyStudying: row.currentlyStudying === true,
    fieldOfStudy: text(row.fieldOfStudy), grade: text(row.grade), coursework: text(row.coursework), credentialLink: text(row.credentialLink),
  }));
  const skills: SkillEntry[] = arrayOfRecords(value.skills).map((row, index) => {
    const category = ['Professional', 'Technical', 'Interpersonal', 'Digital', 'Custom'].includes(String(row.category))
      ? row.category as SkillEntry['category'] : 'Professional';
    return { id: idOr(row.id, `skill-${index}`), order: typeof row.order === 'number' ? row.order : index,
      category, customCategory: text(row.customCategory), name: text(row.name), proficiency: text(row.proficiency) };
  });
  const languages: LanguageEntry[] = arrayOfRecords(value.languages).map((row, index) => {
    const levels = ['Native', 'Beginner', 'Intermediate', 'Advanced', 'Fluent'];
    const cefrs = ['', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    return { id: idOr(row.id, `language-${index}`), order: typeof row.order === 'number' ? row.order : index,
      language: text(row.language), proficiency: levels.includes(String(row.proficiency)) ? row.proficiency as LanguageEntry['proficiency'] : 'Intermediate',
      cefr: cefrs.includes(String(row.cefr)) ? row.cefr as LanguageEntry['cefr'] : '' };
  });
  const optionalSections: OptionalSectionEntry[] = arrayOfRecords(value.optionalSections).map((row, index) => ({
    id: idOr(row.id, `optional-${index}`), order: typeof row.order === 'number' ? row.order : index,
    sectionKey: OPTIONAL_SECTION_KEYS.includes(row.sectionKey as OptionalSectionEntry['sectionKey']) ? row.sectionKey as OptionalSectionEntry['sectionKey'] : 'custom',
    customTitle: text(row.customTitle), title: text(row.title), organization: text(row.organization), location: text(row.location),
    startDate: validDate(row.startDate), endDate: validDate(row.endDate), description: text(row.description), link: text(row.link),
  }));
  return {
    personal: {
      firstName: text(p.firstName), lastName: text(p.lastName), headline: text(p.headline), email: text(p.email),
      phone: text(p.phone), phoneCountryCode: text(p.phoneCountryCode), city: text(p.city), region: text(p.region),
      country: text(p.country), postalCode: text(p.postalCode), website: text(p.website), linkedin: text(p.linkedin),
      portfolio: text(p.portfolio), otherLink: text(p.otherLink), photoDataUrl: text(p.photoDataUrl),
    },
    summary: text(value.summary), workExperience, education, skills, languages, optionalSections,
  };
}

function normalizeDocument(value: unknown): CVDocument | null {
  if (!isRecord(value) || typeof value.id !== 'string') return null;
  const templates: TemplateId[] = ['clear', 'modern', 'compact', 'editorial'];
  const fonts: FontChoice[] = ['system', 'humanist', 'serif'];
  const dates: DateFormat[] = ['month-year', 'short-month', 'numeric'];
  const templateId = templates.includes(value.templateId as TemplateId) ? value.templateId as TemplateId : 'clear';
  const sectionOrder = Array.isArray(value.sectionOrder)
    ? value.sectionOrder.filter((key): key is SectionKey => DEFAULT_SECTION_ORDER.includes(key as SectionKey))
    : [...DEFAULT_SECTION_ORDER];
  const uniqueOrder = [...new Set(sectionOrder)];
  for (const key of DEFAULT_SECTION_ORDER) if (!uniqueOrder.includes(key)) uniqueOrder.push(key);
  const visibility = isRecord(value.sectionVisibility) ? value.sectionVisibility : {};
  const setupRaw = isRecord(value.setup) ? value.setup : {};
  const purpose = ['Job', 'Education', 'Volunteering', 'General'].includes(String(setupRaw.purpose)) ? setupRaw.purpose as BuilderSetup['purpose'] : 'General';
  return {
    id: value.id,
    name: text(value.name) || 'Untitled CV',
    setup: { purpose, targetRole: text(setupRaw.targetRole), targetCountry: text(setupRaw.targetCountry), documentLanguage: text(setupRaw.documentLanguage) || 'English' },
    templateId,
    accentColor: ACCENT_PALETTE.some((color) => color.value === value.accentColor) ? String(value.accentColor) : ACCENT_PALETTE[0].value,
    fontChoice: fonts.includes(value.fontChoice as FontChoice) ? value.fontChoice as FontChoice : 'system',
    showPhoto: value.showPhoto === true,
    sectionOrder: uniqueOrder,
    sectionVisibility: Object.fromEntries(DEFAULT_SECTION_ORDER.map((key) => [key, visibility[key] !== false])) as Record<SectionKey, boolean>,
    profileSnapshot: normalizeProfile(value.profileSnapshot),
    dateFormat: dates.includes(value.dateFormat as DateFormat) ? value.dateFormat as DateFormat : 'month-year',
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : new Date().toISOString(),
  };
}

function normalizeCover(value: unknown): CoverLetterData {
  const base = blankCoverLetter();
  if (!isRecord(value)) return base;
  const templates: TemplateId[] = ['clear', 'modern', 'compact', 'editorial'];
  return {
    recipient: text(value.recipient), organization: text(value.organization), role: text(value.role), date: text(value.date),
    greeting: text(value.greeting), opening: text(value.opening), body: text(value.body), closing: text(value.closing), signature: text(value.signature),
    templateId: templates.includes(value.templateId as TemplateId) ? value.templateId as TemplateId : base.templateId,
    accentColor: ACCENT_PALETTE.some((color) => color.value === value.accentColor) ? String(value.accentColor) : base.accentColor,
  };
}

export function normalizeAppData(value: unknown): AppData {
  const raw = isRecord(value) ? value : {};
  const documents = arrayOfRecords(raw.documents).map(normalizeDocument).filter((doc): doc is CVDocument => doc !== null);
  return { profile: normalizeProfile(raw.profile), documents, coverLetter: normalizeCover(raw.coverLetter) };
}

export function loadAppData(): AppData {
  if (typeof window === 'undefined') return normalizeAppData({});
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return normalizeAppData({});
    return normalizeAppData(JSON.parse(raw));
  } catch (error) {
    console.warn('PathCV local data could not be read; using an empty profile.', error);
    return normalizeAppData({});
  }
}

export function persistAppData(value: AppData): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('PathCV could not save local data.', error);
    return false;
  }
}

export function parseBackup(raw: string): AppData {
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw new Error('This file is not valid JSON.'); }
  if (!isRecord(parsed)) throw new Error('The backup must contain a PathCV data object.');
  if (parsed.schemaVersion !== undefined && parsed.schemaVersion !== 1) throw new Error('This backup version is not supported.');
  const payload = isRecord(parsed.data) ? parsed.data : parsed;
  if (!isRecord(payload.profile) || !Array.isArray(payload.documents)) {
    throw new Error('This file does not look like a PathCV backup. No data was changed.');
  }
  return normalizeAppData(payload);
}

export function makeBackup(data: AppData): string {
  return JSON.stringify({ app: 'PathCV', schemaVersion: 1, exportedAt: new Date().toISOString(), data }, null, 2);
}

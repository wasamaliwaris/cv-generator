export type TemplateId = 'clear' | 'modern' | 'compact' | 'editorial' | 'bold' | 'minimal' | 'sidebar' | 'classic' | 'sleek' | 'fresh';
export type FontChoice = 'system' | 'humanist' | 'serif';
export type DateFormat = 'month-year' | 'short-month' | 'numeric';
export type SectionKey =
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'languages'
  | 'projects'
  | 'volunteering'
  | 'certifications'
  | 'publications'
  | 'awards'
  | 'memberships'
  | 'courses'
  | 'references'
  | 'interests'
  | 'custom';

export type MonthDate = { month: number; year: number } | null;

export interface LinkItem {
  id: string;
  label: string;
  url: string;
}

export interface PersonalDetails {
  firstName: string;
  lastName: string;
  headline: string;
  email: string;
  phone: string;
  phoneCountryCode: string;
  city: string;
  region: string;
  country: string;
  postalCode: string;
  website: string;
  linkedin: string;
  portfolio: string;
  otherLink: string;
  photoDataUrl: string;
}

export interface WorkExperience {
  id: string;
  order: number;
  title: string;
  employer: string;
  location: string;
  startDate: MonthDate;
  endDate: MonthDate;
  current: boolean;
  description: string;
  achievements: string;
  links: LinkItem[];
}

export interface EducationEntry {
  id: string;
  order: number;
  qualification: string;
  institution: string;
  location: string;
  startDate: MonthDate;
  endDate: MonthDate;
  currentlyStudying: boolean;
  fieldOfStudy: string;
  grade: string;
  coursework: string;
  credentialLink: string;
}

export type SkillCategory = 'Professional' | 'Technical' | 'Interpersonal' | 'Digital' | 'Custom';
export interface SkillEntry {
  id: string;
  order: number;
  category: SkillCategory;
  customCategory: string;
  name: string;
  proficiency: string;
}

export type LanguageLevel = 'Native' | 'Beginner' | 'Intermediate' | 'Advanced' | 'Fluent';
export type CefrLevel = '' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
export interface LanguageEntry {
  id: string;
  order: number;
  language: string;
  proficiency: LanguageLevel;
  cefr: CefrLevel;
}

export interface OptionalSectionEntry {
  id: string;
  order: number;
  sectionKey: Exclude<SectionKey, 'summary' | 'experience' | 'education' | 'skills' | 'languages'>;
  customTitle: string;
  title: string;
  organization: string;
  location: string;
  startDate: MonthDate;
  endDate: MonthDate;
  description: string;
  link: string;
}

export interface Profile {
  personal: PersonalDetails;
  summary: string;
  workExperience: WorkExperience[];
  education: EducationEntry[];
  skills: SkillEntry[];
  languages: LanguageEntry[];
  optionalSections: OptionalSectionEntry[];
}

export interface BuilderSetup {
  purpose: 'Job' | 'Education' | 'Volunteering' | 'General';
  targetRole: string;
  targetCountry: string;
  documentLanguage: string;
}

export interface CVDocument {
  id: string;
  name: string;
  setup: BuilderSetup;
  templateId: TemplateId;
  accentColor: string;
  fontChoice: FontChoice;
  showPhoto: boolean;
  sectionOrder: SectionKey[];
  sectionVisibility: Record<SectionKey, boolean>;
  profileSnapshot: Profile;
  dateFormat: DateFormat;
  updatedAt: string;
}

export interface CoverLetterData {
  recipient: string;
  organization: string;
  role: string;
  date: string;
  greeting: string;
  opening: string;
  body: string;
  closing: string;
  signature: string;
  templateId: TemplateId;
  accentColor: string;
}

export interface AppData {
  profile: Profile;
  documents: CVDocument[];
  coverLetter: CoverLetterData;
}

export const SECTION_LABELS: Record<SectionKey, string> = {
  summary: 'Profile',
  experience: 'Work experience',
  education: 'Education and training',
  skills: 'Skills',
  languages: 'Languages',
  projects: 'Projects',
  volunteering: 'Volunteering',
  certifications: 'Certifications',
  publications: 'Publications',
  awards: 'Awards',
  memberships: 'Memberships',
  courses: 'Courses',
  references: 'References',
  interests: 'Interests',
  custom: 'Additional section',
};

export const DEFAULT_SECTION_ORDER: SectionKey[] = [
  'summary', 'experience', 'education', 'skills', 'languages', 'projects',
  'volunteering', 'certifications', 'publications', 'awards', 'memberships',
  'courses', 'references', 'interests', 'custom',
];

export const OPTIONAL_SECTION_KEYS: OptionalSectionEntry['sectionKey'][] = [
  'projects', 'volunteering', 'certifications', 'publications', 'awards',
  'memberships', 'courses', 'references', 'interests', 'custom',
];

export const TEMPLATE_META: Record<TemplateId, { name: string; descriptor: string; category: string }> = {
  clear: { name: 'Clear', descriptor: 'Quietly confident. Classic single-column.', category: 'Classic' },
  modern: { name: 'Modern', descriptor: 'A clear hierarchy with a small accent.', category: 'Modern' },
  compact: { name: 'Compact', descriptor: 'Tighter rhythm for a longer career story.', category: 'Compact' },
  editorial: { name: 'Editorial', descriptor: 'Refined type with a considered header.', category: 'Modern' },
  bold: { name: 'Bold', descriptor: 'Confident and high-contrast with a strong header bar.', category: 'Modern' },
  minimal: { name: 'Minimal', descriptor: 'Quiet and spacious with fine hairline rules.', category: 'Classic' },
  sidebar: { name: 'Sidebar', descriptor: 'Two-column layout with a smart side rail.', category: 'Modern' },
  classic: { name: 'Classic', descriptor: 'Timeless centered serif for formal industries.', category: 'Classic' },
  sleek: { name: 'Sleek', descriptor: 'Dark header block with a sharp, modern edge.', category: 'Modern' },
  fresh: { name: 'Fresh', descriptor: 'Friendly pill titles with a light, open feel.', category: 'Creative' },
};

export const TEMPLATE_ORDER: TemplateId[] = [
  'clear', 'modern', 'compact', 'editorial', 'bold', 'minimal', 'sidebar', 'classic', 'sleek', 'fresh',
];

export const ACCENT_PALETTE = [
  { name: 'Deep teal', value: '#147d78' },
  { name: 'Cobalt', value: '#3156a6' },
  { name: 'Rust', value: '#a65035' },
  { name: 'Forest', value: '#35624a' },
  { name: 'Plum', value: '#765277' },
  { name: 'Ink', value: '#263746' },
];

export function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export function emptyProfile(): Profile {
  return {
    personal: {
      firstName: '', lastName: '', headline: '', email: '', phone: '', phoneCountryCode: '',
      city: '', region: '', country: '', postalCode: '', website: '', linkedin: '', portfolio: '',
      otherLink: '', photoDataUrl: '',
    },
    summary: '',
    workExperience: [],
    education: [],
    skills: [],
    languages: [],
    optionalSections: [],
  };
}

export function defaultVisibility(): Record<SectionKey, boolean> {
  return Object.fromEntries(DEFAULT_SECTION_ORDER.map((key) => [key, true])) as Record<SectionKey, boolean>;
}

export function newDocument(profile: Profile, templateId: TemplateId = 'clear', name = 'Untitled CV'): CVDocument {
  return {
    id: uid(),
    name,
    setup: { purpose: 'General', targetRole: '', targetCountry: '', documentLanguage: 'English' },
    templateId,
    accentColor: ACCENT_PALETTE[0].value,
    fontChoice: 'system',
    showPhoto: false,
    sectionOrder: [...DEFAULT_SECTION_ORDER],
    sectionVisibility: defaultVisibility(),
    profileSnapshot: structuredClone(profile),
    dateFormat: 'month-year',
    updatedAt: new Date().toISOString(),
  };
}

export function blankCoverLetter(): CoverLetterData {
  return {
    recipient: '', organization: '', role: '', date: new Date().toISOString().slice(0, 10),
    greeting: 'Dear Hiring Team,', opening: '', body: '', closing: 'Thank you for your time and consideration.',
    signature: '', templateId: 'clear', accentColor: ACCENT_PALETTE[0].value,
  };
}

export function sampleProfile(): Profile {
  return {
    personal: {
      firstName: 'Maya', lastName: 'Rahman', headline: 'Product designer · fictional sample',
      email: 'maya.rahman@example.com', phone: '555 014 8821', phoneCountryCode: '+1',
      city: 'Brooklyn', region: 'New York', country: 'United States', postalCode: '',
      website: 'maya-rahman.example', linkedin: 'linkedin.com/in/maya-rahman-example',
      portfolio: '', otherLink: '', photoDataUrl: '',
    },
    summary: 'Curious product designer who turns complex workflows into calm, useful experiences. I work closely with research, engineering, and content partners to make thoughtful improvements from first sketch to launch.',
    workExperience: [
      {
        id: uid(), order: 0, title: 'Product designer', employer: 'Northstar Studio · fictional', location: 'New York, NY',
        startDate: { month: 4, year: 2022 }, endDate: null, current: true,
        description: 'Led discovery and interaction design for a small-business planning tool.\nPartnered with engineering to simplify onboarding across web and mobile.',
        achievements: 'Reduced the number of setup steps from eight to five after usability sessions.', links: [],
      },
      {
        id: uid(), order: 1, title: 'Associate designer', employer: 'Fieldnote Labs · fictional', location: 'Remote',
        startDate: { month: 8, year: 2019 }, endDate: { month: 3, year: 2022 }, current: false,
        description: 'Created research-ready prototypes and maintained a shared component library.', achievements: '', links: [],
      },
    ],
    education: [
      {
        id: uid(), order: 0, qualification: 'BDes, Communication Design', institution: 'Harbor School of Art · fictional',
        location: 'New York, NY', startDate: { month: 9, year: 2015 }, endDate: { month: 5, year: 2019 },
        currentlyStudying: false, fieldOfStudy: 'Communication design', grade: '', coursework: 'Information design, prototyping', credentialLink: '',
      },
    ],
    skills: [
      { id: uid(), order: 0, category: 'Professional', customCategory: '', name: 'Product discovery', proficiency: '' },
      { id: uid(), order: 1, category: 'Technical', customCategory: '', name: 'Figma', proficiency: '' },
      { id: uid(), order: 2, category: 'Interpersonal', customCategory: '', name: 'Workshop facilitation', proficiency: '' },
    ],
    languages: [
      { id: uid(), order: 0, language: 'English', proficiency: 'Fluent', cefr: '' },
      { id: uid(), order: 1, language: 'Bengali', proficiency: 'Native', cefr: '' },
    ],
    optionalSections: [
      {
        id: uid(), order: 0, sectionKey: 'projects', customTitle: '', title: 'Neighbourhood atlas',
        organization: 'Independent project', location: '', startDate: { month: 2, year: 2023 }, endDate: { month: 5, year: 2023 },
        description: 'Mapped local services with community volunteers and published a small, accessible directory.',
        link: 'neighbourhood-atlas.example',
      },
    ],
  };
}

export function isValidEmail(value: string): boolean {
  if (!value.trim()) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function dateToLabel(date: MonthDate, format: DateFormat): string {
  if (!date || !Number.isFinite(date.month) || !Number.isFinite(date.year)) return '';
  const month = Math.min(12, Math.max(1, date.month)) - 1;
  if (format === 'numeric') return `${String(month + 1).padStart(2, '0')}/${date.year}`;
  const locale = typeof navigator !== 'undefined' ? navigator.language : 'en';
  const options: Intl.DateTimeFormatOptions = format === 'short-month'
    ? { month: 'short', year: 'numeric' }
    : { month: 'long', year: 'numeric' };
  return new Intl.DateTimeFormat(locale, options).format(new Date(date.year, month, 1));
}

export function dateRange(start: MonthDate, end: MonthDate, current: boolean, format: DateFormat): string {
  const left = dateToLabel(start, format);
  const right = current ? 'Present' : dateToLabel(end, format);
  if (!left && !right) return '';
  if (!left) return right;
  if (!right) return left;
  return `${left} — ${right}`;
}

export function cleanUrl(raw: string): string {
  const value = raw.trim();
  if (!value) return '';
  if (/^(https?:|mailto:|tel:)/i.test(value)) return value;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return `mailto:${value}`;
  return `https://${value}`;
}

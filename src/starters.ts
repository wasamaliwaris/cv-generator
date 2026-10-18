import type { Profile } from './model';
import { emptyProfile, uid } from './model';

/* One-click action verbs for experience bullets. */
export const ACTION_VERBS = [
  'Led', 'Built', 'Designed', 'Improved', 'Launched', 'Managed',
  'Created', 'Reduced', 'Increased', 'Coordinated', 'Delivered', 'Trained',
];

/* Generic summary starters (Insert → then edit to fit). */
export const SUMMARY_EXAMPLES = [
  {
    label: 'Concise',
    text: '[Your role] with [number] years of experience in [area]. Known for [strength] and [strength], with a record of [concrete contribution].',
  },
  {
    label: 'Detailed',
    text: 'Detail-oriented [your role] with [number] years across [industry or setting]. I help [who you help] by [what you do well], combining [skill] with [skill]. Recently, I [specific achievement with a number or outcome].',
  },
  {
    label: 'Career change',
    text: 'Motivated [your new direction] bringing [number] years of transferable experience from [previous field]. Strengths include [skill], [skill], and [skill]. Currently [course, project, or step you are taking] to deepen my expertise in [area].',
  },
];

/* Generic example bullets with placeholders to replace. */
export const BULLET_EXAMPLES = [
  'Improved [process or task], reducing [time, cost, or errors] by [number]%',
  'Coordinated [project or team of N people] to deliver [result] on schedule',
  'Created [report, tool, or resource] used by [team or customers] every [week/month]',
  'Trained [number] new team members on [system or process]',
];

export interface RoleKit {
  id: string;
  label: string;
  tagline: string;
  headlines: string[];
  summaries: string[];
  skills: string[];
  bullets: string[];
}

export const ROLE_KITS: RoleKit[] = [
  {
    id: 'engineer',
    label: 'Software Engineer',
    tagline: 'For developers & IT pros',
    headlines: ['Software Engineer', 'Full-Stack Developer'],
    summaries: [
      'Software engineer with [number] years of experience building [web apps/APIs/tools] with [stack, e.g. React and Node.js]. I care about clean code, fast feedback, and measurable impact — recently [achievement, e.g. cut page load time by 40%].',
      'Detail-oriented developer experienced across the full lifecycle from design to deployment. Strong in [skill] and [skill], comfortable collaborating with designers, PMs, and stakeholders in agile teams.',
    ],
    skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'SQL', 'Git', 'REST APIs', 'Testing'],
    bullets: [
      'Built [feature] used by [number] users, improving [metric] by [number]%',
      'Reduced [load time/build time/bugs] by [number]% through [technique]',
      'Led code reviews and mentored [number] junior developers',
      'Shipped [project] with [team size] engineers on a [timeframe] schedule',
    ],
  },
  {
    id: 'designer',
    label: 'Designer',
    tagline: 'Product, UI & graphic',
    headlines: ['Product Designer', 'UI/UX Designer'],
    summaries: [
      'Product designer with [number] years turning complex workflows into calm, usable experiences. I partner with research and engineering from discovery to launch — recently [achievement, e.g. lifted onboarding completion by 25%].',
      'Designer with strengths in [interaction design/visual design/prototyping]. Comfortable running usability sessions, maintaining design systems, and presenting work to stakeholders.',
    ],
    skills: ['Figma', 'Prototyping', 'User research', 'Design systems', 'Wireframing', 'Usability testing', 'Adobe Creative Suite', 'Interaction design'],
    bullets: [
      'Redesigned [flow or screen], lifting [metric] by [number]%',
      'Ran [number] usability sessions and shipped findings with engineering',
      'Built and maintained a [number]-component design system',
      'Partnered with PMs to define roadmap for [product area]',
    ],
  },
  {
    id: 'teacher',
    label: 'Teacher',
    tagline: 'Schools & tutoring',
    headlines: ['Primary School Teacher', 'English Language Tutor'],
    summaries: [
      'Caring teacher with [number] years helping [age group] learners grow in [subject]. Known for engaging lesson plans, calm classroom management, and strong parent communication.',
      'Educator experienced in [curriculum], differentiated instruction, and assessment. Recently [achievement, e.g. raised class pass rate from 72% to 91%].',
    ],
    skills: ['Lesson planning', 'Classroom management', 'Student assessment', 'Differentiated instruction', 'Parent communication', 'Educational technology', 'Curriculum design', 'Mentoring'],
    bullets: [
      'Planned and delivered engaging lessons for classes of [number] students',
      'Raised [subject] pass rate from [number]% to [number]% in one year',
      'Introduced [tool or method] to support struggling learners',
      'Organized [event or club] with [number] participating students',
    ],
  },
  {
    id: 'nurse',
    label: 'Nurse',
    tagline: 'Healthcare & care work',
    headlines: ['Registered Nurse', 'Staff Nurse · [Ward]'],
    summaries: [
      'Compassionate nurse with [number] years in [setting, e.g. medical-surgical ward]. Skilled in patient assessment, medication administration, and calm communication with patients and families.',
      'Healthcare professional experienced in [area]. Recognized for [strength, e.g. thorough documentation] and teamwork across shifts in fast-paced environments.',
    ],
    skills: ['Patient assessment', 'Medication administration', 'Wound care', 'Vital signs monitoring', 'Care planning', 'Infection control', 'Patient education', 'Team handover'],
    bullets: [
      'Provided direct care for [number] patients per shift in [ward]',
      'Administered medications and maintained accurate records with zero errors',
      'Educated patients and families on [discharge care/condition management]',
      'Precepted [number] new nurses during onboarding',
    ],
  },
  {
    id: 'retail',
    label: 'Retail & Service',
    tagline: 'Shops, hospitality, support',
    headlines: ['Customer Service Associate', 'Retail Sales Assistant'],
    summaries: [
      'Friendly service professional with [number] years in [retail/hospitality/support]. Known for resolving issues fast, upselling with honesty, and keeping regulars coming back.',
      'Reliable team member experienced in [cashiering/stock/customer care]. Comfortable with busy periods, POS systems, and training newcomers.',
    ],
    skills: ['Customer service', 'Cash handling', 'POS systems', 'Stock management', 'Conflict resolution', 'Upselling', 'Teamwork', 'Time management'],
    bullets: [
      'Served [number]+ customers daily with a [number]% satisfaction rating',
      'Handled cash, card, and returns accurately across busy shifts',
      'Trained [number] new staff on [POS/stock/customer procedures]',
      'Grew [loyalty signups/average basket] by [number]% in [timeframe]',
    ],
  },
  {
    id: 'student',
    label: 'Student / Intern',
    tagline: 'First CV, no experience yet',
    headlines: ['[Degree] Student', 'Aspiring [role] · Open to internships'],
    summaries: [
      'Motivated [degree] student at [university] with strong foundations in [skill] and [skill]. Eager to contribute through internships and part-time roles — recently [project, volunteering, or coursework highlight].',
      'Quick learner combining academic work in [field] with hands-on practice in [tool or activity]. Known among peers for [strength] and reliability.',
    ],
    skills: ['Microsoft Office', 'Google Workspace', 'Research', 'Time management', 'Teamwork', 'Communication', 'Problem solving', 'Basic [tool, e.g. Excel]'],
    bullets: [
      'Completed [project or coursework] on [topic] with [grade or outcome]',
      'Volunteered [number] hours with [organization], helping with [task]',
      'Organized [event or society activity] for [number] attendees',
      'Built [small project] using [tool] to practice [skill]',
    ],
  },
];

/* Short pro tip shown at the top of each builder step. */
export const STEP_TIPS = [
  'Only add contact details you actually check. Recruiters rarely need your full street address.',
  'Two or three specific sentences beat a long paragraph. Say what you do, who you help, and one proof point.',
  'Start each bullet with a strong verb and add a number where you can — time saved, money saved, people helped.',
  'New graduate? Put education higher and add relevant coursework. Experienced? Keep it short and factual.',
  'List skills the job ad mentions — but only ones you can actually demonstrate in an interview.',
  'Be honest about levels. “Conversational” today beats “Fluent” in an awkward interview later.',
  'One strong extra section beats five thin ones. Pick what supports this specific application.',
  'When in doubt: Clear or Modern with a dark accent. Fancy layouts never rescue weak content.',
  'Read it once out loud, check every date and link, then export. Fresh eyes catch what tired eyes miss.',
];

/* Build a starter profile from a role kit (headline + summary + skills only). */
export function profileFromKit(kit: RoleKit): Profile {
  const profile = emptyProfile();
  profile.personal.headline = kit.headlines[0];
  profile.summary = kit.summaries[0];
  profile.skills = kit.skills.map((name, index) => ({
    id: uid(),
    order: index,
    category: 'Professional' as const,
    customCategory: '',
    name,
    proficiency: '',
  }));
  return profile;
}

export function kitById(id: string): RoleKit | undefined {
  return ROLE_KITS.find((kit) => kit.id === id);
}

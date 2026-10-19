import type { Article } from './resources';

export const ARTICLES_B: Article[] = [
  {
    slug: 'cover-letter-that-gets-read',
    title: 'How to Write a Cover Letter That Gets Read',
    excerpt: 'A four-paragraph structure, strong openings, and the mistakes that get letters skipped — with examples you can adapt to any role.',
    category: 'Writing',
    minutes: 8,
    updated: 'October 2026',
    intro: [
      'A CV shows what you have done. A cover letter explains why it matters for this role, at this company, right now. Many hiring managers skim letters in under a minute — so yours must earn its first thirty seconds and respect the rest.',
      'This guide gives you a structure that works for almost any application, plus the small choices that separate letters that get read from letters that get skipped.',
    ],
    sections: [
      {
        heading: 'What a cover letter is actually for',
        paragraphs: [
          'A cover letter has three jobs: name the role you want, connect your strongest proof to the employer\u2019s needs, and make a polite, specific ask for the next step. It is not a CV in paragraph form — anything the CV already says does not need repeating.',
          'Think of it as the answer to one question: “Why should we interview this person for this job?” Every sentence that does not serve that answer is a candidate for deletion.',
        ],
      },
      {
        heading: 'A structure that works',
        paragraphs: [
          'Four short paragraphs, one page, generous white space. Here is the shape:',
        ],
        bullets: [
          'Paragraph 1 — the hook and the target: the role you are applying for, where you saw it, and one line on why this company specifically.',
          'Paragraph 2 — the proof: your two most relevant achievements, each tied to something the job post asks for. Numbers and specifics beat adjectives.',
          'Paragraph 3 — the fit: what you know about the team or company, and what you would focus on first. Research shows here.',
          'Paragraph 4 — the close: a thank-you, a clear next step (“I would welcome the chance to discuss…”), and your contact details.',
        ],
      },
      {
        heading: 'Openings that earn attention',
        paragraphs: [
          '“I am writing to apply for…” wastes your best sentence stating the obvious. Open with the intersection of you and them instead: a result you delivered that mirrors their need, or a specific observation about their work that shows genuine interest.',
          'Compare “I am excited to apply for the support role” with “In two years on a support desk, I kept a 97% satisfaction rating across 4,000 tickets — and I use your product daily.” Both are honest; only the second gives a reason to keep reading.',
        ],
        tip: 'If you cannot write a specific opening, you have not researched enough yet. Ten minutes on the company site, recent news, and the job post usually supplies one.',
      },
      {
        heading: 'Show the research, briefly',
        paragraphs: [
          'One or two sentences of company knowledge transform a generic letter into a targeted one. Mention a recent launch, a value that matches how you work, or a team challenge the role description hints at. Keep it factual and brief — flattery is transparent, but informed interest is compelling.',
        ],
      },
      {
        heading: 'Mistakes that get letters skipped',
        paragraphs: [
          'These faults appear constantly, and each is easy to avoid:',
        ],
        bullets: [
          'Wrong company or role name — the classic copy-paste error. Check every proper noun before sending.',
          'Restating the entire CV instead of selecting proof. Choose two achievements; leave the rest to the CV.',
          '“To whom it may concern” when a name is findable. Spend two minutes looking; fall back to “Dear Hiring Team” only if the search fails.',
          'More than one page, tiny margins, or walls of text. If it looks tiring, it will not be finished.',
          'Apologizing for what you lack. Frame honest gaps as motivation (“I am building depth in…”) or leave them for the interview.',
        ],
      },
      {
        heading: 'A final checklist',
        paragraphs: [
          'Before you send, verify: the right company and role names, one page maximum, your phone and email present and correct, no typos (read it aloud), and a file name like “Maya-Rahman-Cover-Letter.pdf.” Then tailor the proof paragraph per application — it is the highest-leverage minute you will spend.',
        ],
      },
      {
        heading: 'Cover letters for tricky situations',
        paragraphs: [
          'Standard advice assumes a straightforward path. When yours bends, bend the letter with it — honestly and briefly:',
        ],
        bullets: [
          'Career changers: name the switch in paragraph one, then translate two achievements into the new field’s language. Show the bridge, don’t just declare the destination.',
          'Employment gaps: one factual clause — “after two years of full-time caregiving” — then forward. Confidence here reads as professionalism.',
          'No experience: lead with education and projects, and let genuine enthusiasm for this specific company carry the motivation paragraph.',
          'Internal moves: skip the company research (you live it) and focus on what you have delivered in your current seat plus why the new team fits.',
          'Overqualified applicants: address it head-on — name what draws you to this specific role so they stop guessing.',
        ],
        tip: 'Tricky situations need shorter letters, not longer ones. Explain in a clause, prove in a paragraph, and move on.',
      },
    ],
    closing: [
      'Short, specific, and researched beats long, generic, and effusive every time. Write the four paragraphs, cut a third of the words, and send it.',
    ],
  },
  {
    slug: 'cv-tips-software-engineers',
    title: 'CV Tips for Software Engineers',
    excerpt: 'What engineering hiring managers scan for: impact-led bullets, a skills section that works, and projects that prove you ship.',
    category: 'By role',
    minutes: 8,
    updated: 'October 2026',
    intro: [
      'Engineering hiring managers read CVs fast and skeptically. They are looking for evidence of shipped work, technical depth in the right areas, and impact you can explain under questioning. Buzzwords and twenty-item skill lists do not survive that filter — specifics do.',
      'These tips apply whether you are applying to startups, agencies, or large companies, and whether you write frontend, backend, mobile, or infrastructure code.',
    ],
    sections: [
      {
        heading: 'Lead every role with impact',
        paragraphs: [
          '“Built REST APIs with Node.js” describes millions of developers. “Designed the checkout API serving 40k daily orders; cut p95 latency from 900ms to 220ms” describes a hire. For each role, give two to four bullets in the shape: what you built, the scale or constraint, and the measured outcome.',
          'If your employer treats numbers as confidential, use honest ranges and relative improvements instead — “cut build times roughly in half” or “served high-six-figures of monthly users.” Never invent metrics; interviewers probe them.',
        ],
        tip: 'Keep a running “brag file” of shipped features, metrics, and praise. Future-you will not remember this quarter\u2019s numbers — write them down now.',
      },
      {
        heading: 'Make the skills section scannable',
        paragraphs: [
          'Group skills by category — Languages, Frameworks, Data, Cloud & DevOps, Practices — and order each group by real proficiency, strongest first. Mirror the job post\u2019s terms for tools you genuinely know, since recruiters search those exact words.',
          'Cut anything you could not discuss in an interview. A long tail of half-remembered tools invites questions you cannot answer well, and one weak answer colors the rest. Depth signals seniority far more than breadth.',
        ],
      },
      {
        heading: 'Projects that prove you ship',
        paragraphs: [
          'Side projects, open source, and freelance work matter most for juniors and career-switchers, and they still help seniors show range. For each project include: one line on what it is, the stack in parentheses, and one line on outcome — users, stars, downloads, or simply what it taught you.',
          'Link to live demos and repositories, and make sure every link works. A dead GitHub link is worse than no link: it suggests the work — and the maintenance habit — stopped.',
        ],
      },
      {
        heading: 'Junior vs. senior: different emphasis',
        paragraphs: [
          'Juniors should front-load education, coursework, internships, and projects — evidence of trajectory and fundamentals. Seniors should front-load scope and leadership: team size, systems owned, migrations led, mentoring, and business outcomes. Mid-level engineers sit between: show growing ownership with at least one bullet per role carrying a number.',
        ],
        bullets: [
          'Junior: fundamentals, projects, internships, eagerness to learn — demonstrated, not declared.',
          'Mid-level: ownership of features and services, collaboration across roles, measurable improvements.',
          'Senior and above: scope, ambiguity handled, technical direction, mentorship, organizational impact.',
        ],
      },
      {
        heading: 'Format for humans and parsers',
        paragraphs: [
          'Engineering CVs survive on clarity: single column, standard headings, reverse-chronological roles, consistent dates. Put your strongest material — usually experience, or projects for juniors — high on page one. One page under roughly five years of experience; two pages beyond that, with older roles condensed to a line or two.',
          'Skip photos, graphics, and proficiency bars. Nobody ever got hired for a five-star JavaScript icon, and parsers often mangle visual elements. Let the content carry the weight.',
        ],
      },
      {
        heading: 'Open source and community signals',
        paragraphs: [
          'Hiring managers trust public proof. Even modest open-source activity \u2014 a merged pull request, maintained docs, a thoughtful bug report \u2014 shows you can read other people\u2019s code and collaborate with strangers, which is most of professional engineering.',
          'You do not need a famous repository. A short write-up of something you debugged, a Stack Overflow answer that earned votes, or slides from a small meetup talk all signal the same thing: this person communicates and finishes. Link the best two or three; leave the rest off.',
        ],
        bullets: [
          'One merged contribution to a project you did not start \u2014 shows collaboration.',
          'Docs or tests you wrote \u2014 shows you care about the next reader.',
          'A short write-up of something you fixed \u2014 shows communication skill.',
        ],
      },
      {
        heading: 'What to cut from an engineering CV',
        paragraphs: [
          'Engineering CVs bloat in predictable ways. Cut ruthlessly \u2014 every weak line dilutes the strong ones around it:',
        ],
        bullets: [
          'Objective statements \u2014 your target role belongs in the application, not the CV.',
          'Full street address \u2014 city and country (or \u201cremote\u201d) is enough.',
          'Outdated tech you never want to touch again \u2014 listing it invites questions about it.',
          'Every online course \u2014 keep education to a line or two; nobody hires a certificate list.',
          '\u201cReferences available on request\u201d \u2014 assumed, and a wasted line.',
          'Photos, graphics, and skill bars \u2014 parsers mangle them and managers ignore them.',
        ],
        tip: 'If your CV runs past two pages, the problem is almost never experience \u2014 it is old roles and filler. Condense anything over five years old to a line each.',
      },
    ],
    closing: [
      'Impact, depth, and working links: that is the engineering CV in six words. Write bullets you can defend in an interview, and the interview will come.',
    ],
  },
  {
    slug: 'cv-with-no-experience',
    title: 'How to Write a CV With No Experience',
    excerpt: 'No job history? No problem. Lead with education, projects, and transferable skills — a complete structure for first-time applicants.',
    category: 'Basics',
    minutes: 7,
    updated: 'October 2026',
    intro: [
      'Everyone\u2019s first CV has the same problem: the experience section is empty, and every template seems built for someone with ten years of history. But employers hiring juniors, interns, and trainees do not expect a long record — they expect potential, presented clearly.',
      'This guide shows you what to put where when paid experience is thin or missing entirely, and how to draw strong material from parts of your life you may not have considered “CV-worthy.”',
    ],
    sections: [
      {
        heading: 'Reorder the CV around strengths',
        paragraphs: [
          'The standard order — summary, experience, education, skills — assumes experience is your headline. When it is not, rearrange honestly: summary, education, projects, skills, then experience (including informal work), volunteering, and interests. The rule is simple: strongest evidence first, whatever its category.',
          'Your summary should name your direction and your proof in two lines: what you studied or built, and what you are looking for. “Computer science graduate with three shipped web projects, seeking a junior frontend role” says more than any list of adjectives.',
        ],
      },
      {
        heading: 'Mine your life for material',
        paragraphs: [
          '“No experience” usually means “no full-time job titles.” Look wider and most people find plenty:',
        ],
        bullets: [
          'Education: degree, relevant modules, grades if strong, thesis or capstone topics.',
          'Projects: coursework builds, personal projects, hackathons, freelance gigs — each with stack and outcome.',
          'Informal work: tutoring, family business help, part-time retail, delivery work — all demonstrate reliability.',
          'Volunteering and societies: organizing events, managing social accounts, treasurer roles, team leadership.',
          'Self-study: certifications, online courses, and portfolios — but only ones you finished.',
        ],
        tip: 'One finished project beats five half-started ones. Employers read completion as the signal that you will finish their work too.',
      },
      {
        heading: 'Translate everything into transferable skills',
        paragraphs: [
          'Retail work becomes “handled cash, resolved complaints, trained two new starters.” A group project becomes “coordinated a four-person team to deliver a working prototype in six weeks.” A volunteer role becomes “organized weekly schedules for fifteen volunteers.” Same facts, professional framing — no invention required.',
          'Group these under a skills section by type: technical skills, tools, languages, and interpersonal strengths demonstrated through examples. Each claim should trace back to something concrete elsewhere on the page.',
        ],
      },
      {
        heading: 'Keep it to one honest page',
        paragraphs: [
          'Thin content stretched across two pages with huge fonts and filler reads worse than a tight single page. One page, standard sections, real details: that is the whole format. Leave white space rather than padding — it signals confidence, not emptiness.',
          'And skip the traps first-timers fall into: objectives begging for “any opportunity,” skill bars rating yourself (“Teamwork: 90%”), copied job descriptions from the post, and references “available on request” (assumed — save the line).',
        ],
      },
      {
        heading: 'A first-job application checklist',
        paragraphs: [
          'Before you send each application, confirm the essentials:',
        ],
        bullets: [
          'Summary names your direction and strongest proof in two lines.',
          'Every project links somewhere live and clickable.',
          'Skills mirror the job post\u2019s terms for things you truly know.',
          'One page, consistent dates, zero typos — read aloud once.',
          'File named properly: “Your-Name-CV.pdf”, never “CV_final_v7.pdf”.',
        ],
      },
      {
        heading: 'Where to find your first roles',
        paragraphs: [
          'First jobs rarely come from cold applications alone. Spread your search across channels built for beginners, and treat every small win as CV material for the next application:',
        ],
        bullets: [
          'Internships and apprenticeships \u2014 structured, often paid or credited, and designed for people with no history.',
          'Volunteering that converts \u2014 charities and community groups frequently hire reliable volunteers first.',
          'Freelance platforms and gig work \u2014 small paid projects become portfolio entries fast.',
          'Referrals \u2014 tell everyone what you are looking for; most first jobs travel by word of mouth.',
          'Campus and community boards \u2014 career centers and local groups hide less-competed listings.',
        ],
        tip: 'Apply in small batches and tailor each one. Ten thoughtful applications beat a hundred identical ones \u2014 especially when your CV is short and every line gets read.',
      },
      {
        heading: 'Your cover letter carries more weight',
        paragraphs: [
          'When your CV is thin, your cover letter does extra duty: it explains your motivation, connects scattered experience to this specific role, and proves you can write. Hiring managers forgive a short CV far more easily when the letter shows genuine interest and clear thinking.',
          'Keep it to three short paragraphs: why this role at this company, your two strongest proof points (projects, grades, volunteer wins), and a polite close with your contact details. Our cover letter guide walks through the structure with examples you can adapt.',
        ],
      },
    ],
    closing: [
      'Your first CV is not a record of jobs — it is evidence of trajectory. Show what you have built, learned, and finished, and give employers a reason to bet on what comes next.',
    ],
  },
];

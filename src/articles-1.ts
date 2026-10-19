import type { Article } from './resources';

export const ARTICLES_A: Article[] = [
  {
    slug: 'tailor-cv-for-ats',
    title: 'How to Tailor Your CV for ATS (Applicant Tracking Systems)',
    excerpt: 'What hiring software actually does with your CV, which formatting survives parsing, and a 15-minute routine for tailoring every application — without myths or guarantees.',
    category: 'Job search',
    minutes: 9,
    updated: 'October 2026',
    intro: [
      'When you apply for a job online, your CV usually meets software before it meets a person. Applicant Tracking Systems — ATS for short — store applications, pull out key details, and help recruiters search and filter candidates.',
      'This guide explains what that software really does, which habits help your CV get read accurately, and how to tailor each application in about fifteen minutes. We will also clear up a few myths, because no layout choice can guarantee you pass any particular system.',
    ],
    sections: [
      {
        heading: 'What an ATS actually does',
        paragraphs: [
          'An ATS is mostly a database with a search box. When you upload your CV, the system tries to parse it: it reads the text and sorts it into fields such as name, contact details, work history, education, and skills. Recruiters then search those fields — for example, “show me project managers in Lahore with budgeting experience” — and review the matches.',
          'The important consequence is simple: if the parser misreads your CV, the recruiter searches against wrong or missing information. Your goal is therefore not to “beat” the system but to make your CV easy to read accurately — for software first, and for the human who comes next.',
        ],
      },
      {
        heading: 'Let us clear up the myths',
        paragraphs: [
          'CV advice is full of confident claims about ATS software. Most of them overstate what anyone outside the hiring company can know. Keep these realities in mind:',
        ],
        bullets: [
          'There is no single “ATS score.” Different companies use different systems with different settings, so a score from one tool does not predict another.',
          'No template, keyword trick, or file type guarantees you pass. Tailoring improves your chances; it cannot promise an outcome.',
          'Most rejections are ordinary: another candidate fit better, the role changed, or the timing was wrong. The software is rarely the whole story.',
          'Design is not the enemy, but complicated design is risky. Multi-column layouts, text boxes, icons-as-text, and scanned images are the usual parsing hazards.',
        ],
      },
      {
        heading: 'Borrow keywords from the job post',
        paragraphs: [
          'Recruiters search using the vocabulary of the job advertisement. If the post asks for “client onboarding” and your CV only says “new customer setup,” a keyword search may miss you even though you did the same work. Mirroring the employer\u2019s terminology — honestly — is the highest-value tailoring you can do.',
          'Read the advertisement twice. Circle the repeated nouns: tools, methods, qualifications, and responsibilities. Then check that your CV names the ones you genuinely have, in both your skills section and your work history. Use the full phrase at least once (“search engine optimization”) before any abbreviation (“SEO”), since you cannot know which form will be searched.',
        ],
        tip: 'Never add skills you do not have. Keyword stuffing can backfire in interviews and reference checks. Tailoring means presenting your real experience in the employer\u2019s words — not inventing experience.',
      },
      {
        heading: 'Formatting that parses cleanly',
        paragraphs: [
          'Parsers read text in order, top to bottom. Anything that breaks that order — columns, tables used for layout, headers and footers carrying key details — raises the chance of scrambled output. A calm, single-column layout with standard section headings is the safest choice.',
        ],
        bullets: [
          'Do use standard headings: Summary, Work Experience, Education, Skills. Creative headings like “My Journey” may not be recognized.',
          'Do put your name and contact details in the main body of the page, not in a header, footer, or text box.',
          'Do use simple bullet points and consistent date formats, such as “Mar 2022 – Present.”',
          'Avoid tables, graphics, logos, and photos for layout purposes. A photo is ignored at best and mistranslated at worst.',
          'Avoid unusual fonts. Common system fonts and clean exports parse most reliably.',
        ],
      },
      {
        heading: 'A 15-minute tailoring routine',
        paragraphs: [
          'You do not need to rewrite your CV for every application. Keep one strong master copy, then run this short routine per job:',
        ],
        bullets: [
          'Minutes 0–3: Read the advertisement and highlight repeated skills, tools, and duties.',
          'Minutes 3–7: Adjust your summary so the first two lines echo the role\u2019s core ask.',
          'Minutes 7–11: Reorder bullet points under each job so the most relevant achievement comes first.',
          'Minutes 11–14: Update your skills section with matching terms you genuinely hold.',
          'Minute 14–15: Export, check the file name (“Maya-Rahman-CV.pdf”), and re-read once for typos.',
        ],
        tip: 'Save each tailored version separately. If the employer calls weeks later, you will want to remember exactly what they read.',
      },
      {
        heading: 'What PathCV can and cannot do',
        paragraphs: [
          'PathCV\u2019s templates are designed to be straightforward: single-column reading order, standard headings, and clean text export. The plain-text copy on the Review step is a useful self-check — if your CV reads well as plain text, it will usually parse well too.',
          'What no builder can do is guarantee results. Hiring systems differ, recruiters differ, and most outcomes come down to fit and timing. Treat ATS advice as risk reduction, not a cheat code, and spend your saved energy on the parts only you can write: clear, specific, honest achievements.',
        ],
      },
    ],
    closing: [
      'Tailor with the employer\u2019s words, keep the formatting boring, and give every application its fifteen minutes. That is the whole strategy — unglamorous, repeatable, and effective.',
    ],
  },
  {
    slug: 'cv-vs-resume',
    title: 'CV vs. Resume: What\u2019s the Difference?',
    excerpt: 'Length, content, and regional expectations explained — plus how to decide which one a job post is really asking for.',
    category: 'Basics',
    minutes: 6,
    updated: 'October 2026',
    intro: [
      'People use “CV” and “resume” interchangeably, and half the time nobody minds. But the two documents have different traditions, and in some regions and industries the distinction matters. Here is a practical explanation without the pedantry.',
    ],
    sections: [
      {
        heading: 'The short answer',
        paragraphs: [
          'A resume is a short, tailored summary — usually one page, two at most — aimed at one specific job. A CV (curriculum vitae, Latin for “course of life”) is a fuller record of your career: every role, qualification, publication, or project, in whatever length that honestly takes.',
          'Put another way: a resume argues “here is why I fit this role,” while a CV documents “here is everything I have done.” Most private-sector job applications want the first, whatever word the advertisement uses.',
        ],
      },
      {
        heading: 'How they differ in practice',
        paragraphs: [
          'Beyond length, the documents differ in what they include and how often they change:',
        ],
        bullets: [
          'Length: a resume is 1–2 pages; an academic or medical CV can run several pages and keeps growing.',
          'Focus: a resume is tailored per application; a CV is a complete record you rarely trim.',
          'Content: CVs may list publications, grants, teaching, and conferences. Resumes usually skip anything irrelevant to the target role.',
          'Tone: resumes lead with impact and outcomes; CVs lead with completeness and chronology.',
        ],
      },
      {
        heading: 'Where you are matters',
        paragraphs: [
          'In the United States and Canada, “resume” is the default word for job applications, and “CV” is reserved for academic, research, and medical roles. In the UK, Ireland, most of Europe, South Asia, and the Middle East, “CV” is the everyday word for what Americans would call a resume — typically a concise 1–2 page document.',
          'International companies mix the terms freely. A job post in Dubai asking for your “CV” almost always wants a short tailored document, not a ten-page life record. When in doubt, read the post for clues: page limits, requested sections, and example formats tell you more than the title does.',
        ],
        tip: 'Applying across regions? Keep one master record of everything, then export a short tailored version per application. That is exactly the workflow PathCV\u2019s profile-plus-versions design supports.',
      },
      {
        heading: 'What employers actually mean',
        paragraphs: [
          'Recruiters spend seconds on a first scan, whatever the document is called. They look for a match on role, seniority, skills, and recency — then decide whether to read on. A clear one-to-two-page document tailored to the post satisfies the overwhelming majority of hiring managers in business, technology, and creative roles.',
          'The exceptions are fields where completeness is the point: academia, scientific research, medicine, and some legal and grant-funded roles. If your field expects publications and full history, give it the full CV treatment.',
        ],
      },
      {
        heading: 'Turning one into the other',
        paragraphs: [
          'To shrink a CV into a resume: cut everything unrelated to the target role, merge older roles into one line each, move education below experience (unless you are a recent graduate), and rewrite duties as achievements with outcomes. Aim for one page if you have under ten years of experience.',
          'To expand a resume into a CV: restore the full chronology, add every qualification, publication, talk, award, and project with dates, and organize with clear headings so length never becomes confusion.',
        ],
      },
      {
        heading: 'Regional formats at a glance',
        paragraphs: [
          'Expectations shift by market. The broad pattern across major hiring regions:',
        ],
        bullets: [
          'United States and Canada: \u201cresume,\u201d one page (two max), no photo, no date of birth, city only for location.',
          'UK and Ireland: \u201cCV,\u201d two pages standard, no photo, brief personal profile at the top.',
          'Continental Europe: \u201cCV,\u201d one to two pages; the Europass format is common for EU institutions and cross-border roles.',
          'Gulf and Middle East: \u201cCV,\u201d one to two pages; photos and nationality or visa status are commonly included.',
          'South Asia: \u201cCV\u201d or \u201cresume\u201d interchangeably, one to two pages; photos common in some sectors, rare in tech.',
        ],
        tip: 'When a market\u2019s norms are unclear, mirror the job post: its requested sections outrank any general rule.',
      },
      {
        heading: 'Should you keep both documents?',
        paragraphs: [
          'Yes \u2014 but think of them as two views of one record. Maintain a private master file with everything: every role, date, project, and achievement, untrimmed. Then derive each application version from it by cutting, never by inventing.',
          'This is also the easiest way to stay honest: when every tailored version traces back to one complete record, dates and titles stay consistent everywhere, and background checks hold no surprises.',
        ],
      },
    ],
    closing: [
      'Call it whatever your market calls it — what gets you interviewed is a clear, tailored, honest document. Start with the short version, keep the full record for yourself, and you will be ready for either request.',
    ],
  },
  {
    slug: 'common-cv-mistakes',
    title: '10 Common CV Mistakes and How to Fix Them',
    excerpt: 'Vague summaries, duty-lists, typos, and seven more — each with a concrete fix you can apply to your own CV today.',
    category: 'Writing',
    minutes: 11,
    updated: 'October 2026',
    intro: [
      'Most CVs are rejected for unglamorous reasons: they are hard to scan, vague about results, or simply too long. The good news is that every item on this list is fixable in minutes. Work through all ten and your CV will be clearer than most of the pile.',
    ],
    sections: [
      {
        heading: '1. A summary that says nothing',
        paragraphs: [
          '“Hardworking team player seeking new opportunities” could describe anyone, so it describes no one. Fix it with a summary that names your lane, your level, and your proof: role, years, one specialty, one result. Two to three lines is enough — the rest of the CV supplies the evidence.',
        ],
      },
      {
        heading: '2. Listing duties instead of achievements',
        paragraphs: [
          '“Responsible for social media accounts” tells the reader what you were assigned, not what you accomplished. Rewrite each bullet as action plus outcome: what you did, and what changed because of it. Numbers help, but specific descriptions work too when numbers are unavailable or confidential.',
        ],
        tip: 'Try the “so what?” test on every bullet. If a bullet cannot answer why it mattered, rewrite it or cut it.',
      },
      {
        heading: '3. One generic CV for every job',
        paragraphs: [
          'Sending the same document everywhere saves minutes and costs interviews. You do not need a rewrite each time — fifteen minutes of tailoring is enough: mirror the post\u2019s key terms, reorder bullets by relevance, and adjust your summary\u2019s first lines. Read our ATS guide for the full routine.',
        ],
      },
      {
        heading: '4. Typos and inconsistent formatting',
        paragraphs: [
          'A single typo suggests haste; mixed date formats and wandering bullet styles suggest carelessness. Read your CV aloud once, then check dates, capitalization, and punctuation mechanically. Ask one other person to proofread — familiarity makes your own errors invisible to you.',
        ],
      },
      {
        heading: '5. Burying contact details — or the lead',
        paragraphs: [
          'Recruiters should find your name, email, phone, and location within seconds. Put them at the top in the main body of the page, not in headers, footers, images, or text boxes that software may skip. Likewise, put your most relevant section — usually experience — before older or weaker material.',
        ],
      },
      {
        heading: '6. A skills section full of filler',
        paragraphs: [
          '“Microsoft Word, communication, hard worker” wastes prime space. List specific, checkable skills grouped by type — tools, methods, languages — and mirror the job post\u2019s vocabulary for skills you genuinely hold. Soft claims belong in achievement bullets, demonstrated rather than declared.',
        ],
      },
      {
        heading: '7. Unexplained gaps that invite guessing',
        paragraphs: [
          'Gaps are normal: study, family, health, freelance stretches, job hunting. A short, honest line — “Career break: full-time caregiving, 2023–2024” — closes the question far better than silence, which invites the reader to assume the worst. You owe no one private details; one factual line is enough.',
        ],
      },
      {
        heading: '8. Too long, or too clever',
        paragraphs: [
          'Under ten years of experience: aim for one page. Beyond that: two pages at most, with older roles condensed. And resist exotic layouts — multi-column designs, graphics, and photos may look striking but often parse badly and distract from content. Boring formatting is a feature.',
        ],
      },
      {
        heading: '9. Lies and exaggerations',
        paragraphs: [
          'Inflated titles, invented degrees, and padded employment dates are discovered more often than people think — through references, background checks, and interviews that probe depth. The fix is absolute: claim only what you can defend calmly. Honest framing of real experience beats impressive fiction every time.',
        ],
      },
      {
        heading: '10. No proof it is maintained',
        paragraphs: [
          'Stale CVs show: an “objective” from 2019, a portfolio link that 404s, a phone number you no longer answer. Before every application round, click every link, confirm every number, and update your most recent role. A CV is a living document — treat it like one.',
        ],
      },
      {
        heading: 'Bonus: the 5-minute pre-send ritual',
        paragraphs: [
          'Fixes applied? Run this final ritual before every single application. Five minutes now prevents the small errors that undo good work:',
        ],
        bullets: [
          'Read the whole CV aloud once — stumbles reveal typos, repetition, and wordy bullets spellcheck cannot catch.',
          'Click every link: portfolio, LinkedIn, email. One dead link suggests the whole document is stale.',
          'Check the file name: “Your-Name-CV.pdf” — never “CV_final_v7.pdf.”',
          'Confirm the tailoring: does the summary’s first line echo this specific role? Is the most relevant bullet first under each job?',
          'Get one second pair of eyes — a friend, a mentor, anyone unfamiliar. Familiarity makes your own errors invisible.',
          'Re-read the job post once more. If it names a requirement you hold but never mention, add it now.',
        ],
      },
    ],
    closing: [
      'Fix these ten and you have handled the large majority of what goes wrong in CVs. The remaining work — tailoring, targeting, following up — is where applications are actually won.',
    ],
  },
];

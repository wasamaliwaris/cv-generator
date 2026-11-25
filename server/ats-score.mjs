const HEADINGS = {
  Summary: /^(?:(?:professional|career|executive|personal|profile|qualifications?) )?(?:summary(?: of qualifications)?|profile|objective|about me|personal statement)$/i,
  Experience: /^(?:(?:work|professional|relevant|employment|career|industry|selected) )?(?:experience|work history|employment history|employment|career history)$/i,
  Skills: /^(?:(?:technical|core|professional|key|relevant|computer|soft) )?(?:skills|skills and qualifications|competencies|expertise|technologies|tools and technologies)$/i,
  Education: /^(?:education(?: and training)?|academic (?:background|qualifications)|qualifications)$/i,
  Certifications: /^(?:certifications?(?: and licenses)?|licenses?(?: and certifications?)?|credentials|training|courses|professional development)$/i,
  Projects: /^(?:(?:academic|personal|selected|capstone|relevant|research) )?(?:projects?|research|publications)$/i,
  Internships: /^(?:internships?|placements?|practicum|clinical experience)$/i,
  Volunteering: /^(?:volunteer(?:ing| experience)?|community (?:work|service)|leadership(?: experience)?)$/i,
  Additional: /^(?:languages|awards|honou?rs|achievements|interests|memberships|affiliations|references|activities)$/i,
  Contact: /^(?:contact(?: information| details)?|personal (?:information|details))$/i,
};
const letterWords = (s) => s.match(/[\p{L}\p{N}]+(?:[’'][\p{L}]+)?/gu) || [];
const norm = (s) => s.toLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N}+#.]+/gu, ' ').trim().replace(/\s+/g, ' ');
const escaped = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const normalizedText = (s) => ` ${norm(s).replace(/\.(?=\s|$)/g, '')} `;
const includes = (s, key) => new RegExp(`(?:^| )${escaped(norm(key).replace(/\.$/, ''))}(?= |$)`, 'iu').test(s);
const action = /^(?:managed|led|built|created|developed|designed|improved|implemented|reduced|increased|delivered|supported|coordinated|trained|analyzed|analysed|organized|organised|launched|planned|documented|resolved|served|maintained|prepared|tested|automated|worked|taught|researched|presented|processed|reviewed|assisted|supervised|achieved|participated|optimized|optimised|collaborated|completed|evaluated|produced|conducted|established|audited|monitored|deployed|facilitated)\b/i;
const impact = /\b(?:increased|reduced|saved|grew|lowered|raised|boosted|cut|improved|exceeded|delivered|handled|processed|served|trained|supported|managed|completed)\b.{0,90}(?:\b\d[\d,.]*\s*(?:%|hours?|days?|weeks?|customers?|students?|patients?|tickets?|people|accounts?|requests?|units?|projects?|orders?|users?|clients?|reports?|teams?|times|k\b)|\b(?:USD|PKR|EUR|GBP)\s*\d|[$€£]\s*\d)|\b(?:increased|reduced|saved|improved|exceeded|grew|accelerated|achieved)\b.{0,80}\b(?:by|to|from)\s+\d/i;
const weak = /\b(?:responsible for|duties included|various tasks|helped out|hard[- ]working|team player|results[- ]driven|go[- ]getter|think outside the box|references available upon request)\b/i;
const dates = /\b(?:(?:19|20)\d{2}|present|current)\b/i;
export function headingFor(line) {
  const cleaned = line.trim().replace(/^[-–—#•\s]+|[:–—\s]+$/g, '');
  return Object.entries(HEADINGS).find(([, rx]) => rx.test(cleaned))?.[0];
}
export function splitSections(text) {
  const sections = {};
  const intro = [];
  const entries = [];
  let current;
  text.split('\n').forEach((raw, index) => {
    const line = raw.trim();
    if (!line || /^[-=─_\s]{3,}$/.test(line)) return;
    const [head, ...tail] = line.split(':');
    const heading = headingFor(line) || (tail.length && headingFor(head));
    if (heading) { current = heading; sections[current] ??= []; }
    const content = heading ? (headingFor(line) ? '' : tail.join(':').trim()) : line;
    if (!content) return;
    if (current) sections[current].push(content);
    else intro.push(content);
    entries.push({ index, section: current || '', text: content, inline: Boolean(heading) });
  });
  return { sections, intro, entries };
}
const concepts = [
  'Python','JavaScript|JS','TypeScript|TS','Java','C++','C#','.NET|dotnet','Go programming|Golang','Rust','PHP','Ruby','Swift','Kotlin','SQL','PostgreSQL|Postgres','MySQL','MongoDB','Redis','NoSQL','Oracle Database','React|React.js|ReactJS','Next.js|NextJS','Vue.js|VueJS|Vue','Angular','Node.js|NodeJS|Node JS','Express.js|ExpressJS','Django','Flask','FastAPI','Spring Boot','HTML|HTML5','CSS|CSS3','Tailwind CSS|Tailwind','REST APIs|RESTful APIs|REST API','GraphQL','AWS|Amazon Web Services','Microsoft Azure|Azure','Google Cloud|GCP','Docker','Kubernetes|K8s','Terraform','CI/CD|continuous integration|continuous delivery','Git','GitHub Actions','Jenkins','Linux','Bash','unit testing','integration testing','Selenium','Playwright','software testing','QA|quality assurance','accessibility|WCAG','machine learning|ML','natural language processing|NLP','data engineering','data analysis|data analytics','data visualization','data modeling','business intelligence|BI','ETL','data pipelines','Power BI','Tableau','Microsoft Excel|Excel','Google Sheets','Looker','Snowflake','Databricks','Pandas','NumPy','Spark|Apache Spark','statistics','A/B testing','forecasting','financial reporting','financial analysis','financial modeling','budgeting','account reconciliation|reconciliation','bookkeeping','accounts payable','accounts receivable','QuickBooks','SAP','ERP','tax preparation','IFRS','CPA','ACCA','CFA','CRM','Salesforce','HubSpot','lead generation','account management','customer service|customer support','customer success','sales forecasting','business development','digital marketing','SEO|search engine optimization','SEM|search engine marketing','Google Analytics|GA4','paid search','content strategy','copywriting','social media marketing','email marketing','campaign management','UX design|user experience design','UI design|user interface design','Figma','Adobe Photoshop|Photoshop','Adobe Illustrator|Illustrator','Adobe InDesign|InDesign','wireframing','prototyping','user research','design systems','graphic design','project management','project planning','Agile','Scrum','Kanban','Jira','PMP','PRINCE2','stakeholder management','change management','risk management','program management','product management','roadmap planning','requirements gathering','process improvement','Lean Six Sigma|Six Sigma','business analysis','supply chain','inventory management','procurement','logistics','warehouse management','operations management','quality control','AutoCAD','SolidWorks','CAD|computer-aided design','mechanical engineering','electrical engineering','civil engineering','HVAC','technical documentation','cybersecurity|information security','network security','incident response','information technology|IT support','CompTIA','ITIL','ISO 9001','GDPR','HIPAA','clinical documentation','patient care','patient assessment','electronic health records|EHR','registered nurse|RN','BLS|basic life support','CPR','infection control','curriculum development','classroom management','lesson planning','student assessment','special education','instructional design','recruitment','employee relations','talent acquisition','onboarding','performance management','HRIS','payroll','training and development','research methods','data entry','event planning','communications','public speaking','team leadership','problem solving','cross-functional collaboration','written communication','bachelor’s degree|bachelor degree|bachelors degree|BSc|BS degree','master’s degree|master degree|masters degree|MSc','MBA','PhD|doctorate','diploma',
].map((raw) => raw.split('|'));
const jobNoise = /^(?:about (?:us|the company|our company)|benefits|what we offer|equal opportunity|how to apply|perks|compensation|our culture|nice to meet you|salary|our mission)\b/i;
const jobHeading = /^(?:requirements|qualifications|responsibilities|duties|skills|what you(?:'ll| will) do|what you bring|must.have|preferred|nice.to.have|role overview|job description|the role|about the role)\b/i;
const filler = new Set('a an and or for of to in at with by on as the you your our we is are be will can should must have has who that these this those from into other all up per within across about including required preferred desirable strong excellent great proven demonstrated ability experience years year skills knowledge understanding familiar familiarity related relevant using supporting support working work team teams highly good best fast paced looking ideal successful candidate role job company help assist also well plus level minimum bachelor master equivalent degree’.'.replace(/[’.]/g, '').split(' '));
const phraseLead = /^(?:develop|design|manage|monitor|prepare|build|maintain|deliver|implement|conduct|coordinate|handle|track|evaluate|optimize|analyse|analyze|provide|perform|oversee|create|review|lead|report|process|write|plan)\s+(?:the\s+)?/i;
function jobKeywords(job, cv) {
  const parts = [];
  let boilerplate = false;
  for (const raw of job.split(/\n+/)) {
    const line = raw.trim().replace(/^[-*•\s]+/, '');
    if (jobNoise.test(line)) { boilerplate = true; continue; }
    if (jobHeading.test(line)) { boilerplate = false; if (line.length < 34 && !line.includes(': ')) continue; }
    if (!boilerplate && line) parts.push(line);
  }
  const sentences = parts.flatMap(line => line.split(/(?<=[.!?])\s+|\s*;\s*/)).filter(Boolean);
  const normalized = normalizedText(parts.join(' '));
  const picks = new Map();
  const add = (label, aliases, required = false) => {
    const k = norm(label);
    if (picks.has(k)) { if (required) picks.get(k).weight = 2; return; }
    picks.set(k, { label, aliases, weight: required ? 2 : 1 });
  };
  for (const aliases of concepts) {
    if (!aliases.some(a => includes(normalized, a))) continue;
    const required = sentences.some(s => /\b(?:must|required|minimum|essential|mandatory)\b/i.test(s) && aliases.some(a => includes(normalizedText(s), a)));
    add(aliases[0], aliases, required);
  }
  const acronymIgnore = new Set(['A','AN','AND','OR','THE','YOU','YOUR','OUR','CV','JD','APPLY','USA','UK','EEO','EOE','USD','PKR','EUR','MUST','ETC','FULL','TIME','REMOTE','ROLE','JOB','BA','BS','BE','MS','NO']);
  for (const s of sentences) {
    for (const raw of s.match(/\b[A-Z][A-Z0-9]{1,8}\b/g) ?? []) {
      if (!acronymIgnore.has(raw) && ![...picks.values()].some(p => p.aliases.some(a => norm(a) === norm(raw)))) add(raw, [raw]);
    }
    const obligation = /\b(?:must|required|experience (?:with|in)|proficien(?:cy|t) (?:with|in)|knowledge of|familiar(?:ity)? with|certified in|responsible for|ability to)\b/i;
    const matches = s.match(obligation);
    const candidate = s.replace(/^\s*\d+[.)]\s*/, '');
    const tail = matches ? candidate.slice(candidate.search(obligation)).replace(obligation, '').trim() : phraseLead.test(candidate) ? candidate.replace(phraseLead, '') : '';
    for (const fragment of tail.split(/[,;:()]|\b(?:and|or|using|while|to ensure|for the|with the|is required|are required)\b/i).slice(0, 4)) {
      const tokens = norm(fragment).split(' ').map(w => w.replace(/\.$/, '')).filter(Boolean);
      while (tokens.length && (filler.has(tokens[0]) || /^\d+$/.test(tokens[0]))) tokens.shift();
      while (tokens.length && filler.has(tokens.at(-1))) tokens.pop();
      if (tokens.length < 2 || tokens.length > 5 || tokens.filter(x => !filler.has(x) && x.length > 2).length < 2) continue;
      const label = tokens.join(' ');
      if (/(?:years? of|equal opportunity|work environment|we offer|salary range|application process|qualified applicants|fast paced|meet deadlines)/i.test(label)) continue;
      if ([...picks.values()].some(p => p.aliases.some(a => includes(normalizedText(label), a) || includes(normalizedText(a), label)))) continue;
      add(label, [label], /\b(?:must|required|minimum|essential)\b/i.test(s));
    }
  }
  const cvNorm = normalizedText(cv);
  const cvTokens = new Set(norm(cv).split(' ').map(stem));
  return [...picks.values()].sort((a, b) => b.weight - a.weight).slice(0, 35).map(({ label, aliases, weight }) => {
    const full = aliases.some(a => includes(cvNorm, a));
    const partial = !full && aliases.some(a => {
      const words = [...new Set(norm(a).split(' ').filter(w => w.length > 2 && !filler.has(w)))];
      return words.length >= 2 && words.filter(w => cvTokens.has(stem(w))).length >= Math.ceil(words.length * .5);
    });
    return { label, status: full ? 'matched' : partial ? 'partial' : 'missing', weight };
  });
}
function stem(word) { return word.length > 4 ? word.replace(/(?:ies|ing|ed|s)$/, m => m === 'ies' ? 'y' : '') : word; }
const typo = /\b(?:recieve[ds]?|seperate|mangage[ds]?|managment|enviroment|acheivements?|acheived|sucessful|experiance|reponsible|skils|proffesional|profesional|excellant|teh|thier|accomodate[ds]?)\b/gi;
const verbForms = /^(?:manage|lead|build|create|develop|design|implement|deliver|support|coordinate|train|plan|document|resolve|maintain|prepare|test|automate|review|process)\b/i;
function distinctSkills(lines) { return new Set(lines.join(',').split(/[,;|•\n]/).map(x => x.trim()).filter(x => x.length > 1 && x.length <= 70).map(norm)); }
export function classify(score) {
  return score >= 90 ? 'Excellent' : score >= 80 ? 'Very Good' : score >= 70 ? 'Good' : score >= 60 ? 'Needs Improvement' : 'Poor';
}
const explanations = {
  Excellent: 'The CV meets most checks in this rubric. Review any flagged items before sending it.',
  'Very Good': 'The CV meets most core checks, with some room to improve specific areas.',
  Good: 'The CV has a solid foundation, with several changes that could make it clearer or more relevant.',
  'Needs Improvement': 'Several checks found gaps that may make your CV harder to read or assess.',
  Poor: 'Start with the highest-priority issues below to make your CV easier to parse and review.',
};

export function analyzeCV({ text, format = { kind: 'Text' }, job = '', title = '', premium = false }) {
  const { sections: s, intro, entries } = splitSections(text);
  const jobMode = Boolean(job.trim());
  const detected = Object.keys(s);
  const bodyLines = entries.filter(x => x.section !== 'Contact' && x.section).map(x => x.text);
  const skillLines = s.Skills || [], skills = distinctSkills(skillLines);
  const qualifications = [...(s.Education || []), ...(s.Certifications || [])].filter(x => letterWords(x).length >= 2);
  const experience = [...(s.Experience || []), ...(s.Projects || []), ...(s.Internships || []), ...(s.Volunteering || []), ...(s.Education || []).filter(x => action.test(x.replace(/^[-*•]\s*/, '')))];
  const lines = experience.map(x => x.replace(/^[-*•]\s*/, ''));
  const bullets = lines.filter(x => letterWords(x).length >= 5);
  const actions = bullets.filter(x => action.test(x) || verbForms.test(x));
  const strongActions = actions.filter(x => !weak.test(x) && !/^(?:worked|assisted|participated|helped)\b/i.test(x));
  const outcomes = bullets.filter(x => impact.test(x));
  const dated = lines.some(x => dates.test(x));
  const hasRole = lines.some(x => letterWords(x).length >= 2 && letterWords(x).length <= 12 && !action.test(x) && !dates.test(x)) || lines.some(x => /\b(?:developer|engineer|assistant|analyst|consultant|manager|specialist|coordinator|intern|lead|designer|teacher|nurse|student|volunteer)\b/i.test(x));
  const categories = [], strengths = [], weaknesses = [], recommendations = [];
  const record = (name, max, score) => categories.push({ name, max, score: Math.max(0, Math.min(max, score)) });
  const good = (message) => strengths.push(message);
  const issue = (message, advice) => { weaknesses.push(message); recommendations.push(advice); };

  const words = letterWords(text).length;
  const symbolRatio = (text.match(/[^\p{L}\p{N}\s.,:;!?()'’"\-–—@%&/+#=•|$€£]/gu)?.length || 0) / text.length;
  const fragmented = bodyLines.length > 12 && bodyLines.filter(l => /^\p{L}$/u.test(l)).length / bodyLines.length > .15;
  const long = (format.pages || 0) > 3 || words > 1100;
  const odd = fragmented || symbolRatio > .055 || (format.blankPages || 0) > 0;
  let formatScore = 20 - (detected.length >= 3 ? 0 : detected.length ? 3 : 6) - (format.columns ? 3 : 0) - (format.tables ? Math.min(4, format.tables * 2) : 0) - (format.textBoxes ? 3 : 0) - ((format.graphics || 0) > 3 ? 2 : 0) - (long ? 3 : 0) - (odd ? 4 : 0);
  if (words < 60) formatScore -= 3;
  record('ATS Readability & Formatting', 20, formatScore);
  good(format.kind === 'Text' ? 'The submitted CV has readable text.' : `Readable text was extracted from the ${format.kind}.`);
  if (format.columns || format.tables || format.textBoxes || (format.graphics || 0) > 3) {
    const flags = [format.columns && 'possible columns', format.tables && `${format.tables} table${format.tables === 1 ? '' : 's'}`, format.textBoxes && 'text boxes', (format.graphics || 0) > 3 && 'multiple graphics'].filter(Boolean).join(', ');
    issue(`Layout signals found: ${flags}.`, 'Move essential information into normal paragraphs in a single column.');
  }
  if (long) issue(`The CV is lengthy (${words} words${format.pages ? ` across ${format.pages} pages` : ''}).`, 'Trim repeated points and keep the strongest evidence for the role near the top.');
  if (odd) issue('Some text appears fragmented, unusually encoded, or absent on one or more pages.', 'Check the copied text in reading order and re-export unreadable pages as selectable text.');
  if (detected.length >= 3) good(`${detected.length} recognizable section headings help organize the CV.`);
  else issue('Few standard section headings were detected.', 'Put headings such as Summary, Skills, Experience, and Education on their own lines where relevant.');

  const keywords = jobMode ? jobKeywords(job, text) : [];
  const totalWeight = keywords.reduce((sum, k) => sum + k.weight, 0);
  const covered = keywords.reduce((sum, k) => sum + k.weight * (k.status === 'matched' ? 1 : k.status === 'partial' ? .5 : 0), 0);
  const coverage = totalWeight ? Math.round(covered / totalWeight * 100) : null;
  if (jobMode && totalWeight) {
    record('Job-Specific Keywords', 25, Math.round(covered / totalWeight * 25));
    if (coverage >= 70) good(`The CV shows ${coverage}% weighted coverage of the extracted job terms.`);
    if (coverage < 80) issue('Some role terms were not evidenced clearly.', 'Review the role requirements and add specific examples only for skills or duties you have actually used.');
  }

  const target = jobMode ? keywords : title.trim() ? jobKeywords(`Experience with ${title}`, text) : [];
  const targetInSkills = target.filter(k => k.status === 'matched' && includes(normalizedText([...skillLines, ...qualifications].join(' ')), k.label)).length;
  const concrete = concepts.filter(aliases => aliases.some(a => includes(normalizedText([...skillLines, ...bodyLines].join(' ')), a))).length;
  const skillsPresence = skills.size >= 3 ? 6 : skills.size ? 4 : concrete >= 2 ? 3 : concrete ? 2 : 0;
  const skillsClarity = skillLines.length && skillLines.every(x => letterWords(x).length <= 28) ? 3 : skills.size ? 1 : 0;
  const qualificationsScore = qualifications.length >= 2 || (s.Certifications?.length && qualifications.length) ? 3 : qualifications.length ? 2 : concrete >= 3 ? 2 : 0;
  const relevance = target.length ? (targetInSkills ? 3 : target.some(k => k.status === 'matched') ? 2 : 0) : (skills.size >= 2 || concrete >= 3 ? 3 : concrete || skills.size ? 1 : 0);
  record('Skills & Qualifications', 15, skillsPresence + skillsClarity + qualificationsScore + relevance);
  if (skills.size >= 3) good(`The Skills section lists ${skills.size} distinct entries.`);
  if (qualifications.length) good('The CV includes education, training, or certification information.');
  if (skills.size < 3) issue('Few clearly separated skills were found in a dedicated Skills section.', 'List the actual tools, techniques, or professional skills you can demonstrate, using short labels.');
  if (target.length && !targetInSkills && !target.some(k => k.status === 'matched')) issue('The CV does not clearly evidence the identified target-role terms.', 'If you have relevant experience, show where you applied it rather than adding a bare keyword.');

  const nonEmployment = Boolean(s.Projects?.length || s.Internships?.length || s.Volunteering?.length || s.Education?.length);
  const experienceMatch = target.some(k => k.status === 'matched' && includes(normalizedText(experience.join(' ')), k.label));
  const responsibility = bullets.filter(l => !weak.test(l));
  record('Experience & Achievements', 15,
    (experience.length ? 3 : nonEmployment ? 2 : 0) + (hasRole || nonEmployment ? 2 : 0) + (dated || !s.Experience?.length && nonEmployment ? 2 : 0)
    + (responsibility.length >= 2 ? 2 : responsibility.length ? 1 : 0) + (strongActions.length >= 2 ? 2 : strongActions.length ? 1 : 0)
    + (outcomes.length ? 3 : bullets.some(x => /\b(?:resulting in|so that|leading to|successfully|delivered|completed|published)\b/i.test(x)) ? 2 : 0)
    + (experienceMatch || !target.length && bullets.length ? 1 : 0));
  if (outcomes.length) good('Experience or project descriptions include measurable evidence of impact.');
  else if (bullets.length) issue('No clear measurable outcome was detected in the experience or project descriptions.', 'Add an outcome or scope you can verify, such as the size of a group, time saved, or the deliverable produced. Don’t invent a number.');
  if (!experience.length) issue('Little practical experience or project detail was detected.', 'If you’re early in your career, describe an academic project, placement, internship, or volunteering experience and what you did.');
  if (s.Experience?.length && !dated) issue('No year or “Present” marker was detected in the work history.', 'Add honest date ranges to roles where dates apply.');
  if (bullets.length >= 2 && strongActions.length === 0) issue('Experience descriptions rarely start with a specific action.', 'Start responsibility bullets with a verb that describes what you actually did.');

  const sections = detected.filter(x => x !== 'Contact').map(name => {
    const list = s[name];
    const meaningful = name === 'Summary' ? letterWords(list.join(' ')).length >= 14 : name === 'Skills' ? skills.size >= 3 : name === 'Experience' ? list.length >= 2 && list.some(x => letterWords(x).length >= 5) : letterWords(list.join(' ')).length >= 3;
    return { name, status: meaningful ? 'good' : 'improve' };
  });
  if (!s.Skills) sections.push({ name: 'Skills', status: 'missing' });
  if (!s.Summary && detected.length < 4) sections.push({ name: 'Summary', status: 'missing' });
  if (!nonEmployment && !s.Experience) sections.push({ name: 'Experience, projects or education', status: 'missing' });
  if (s.Summary && letterWords(s.Summary.join(' ')).length < 14) issue('The summary is very brief or empty.', 'Use two short lines to state your focus and one strength or accomplishment supported by your CV.');
  record('CV Structure & Sections', 10, (s.Summary?.length ? 2 : detected.length >= 4 ? 1 : 0) + (skillLines.length ? 2 : 0) + (experience.length || nonEmployment ? 3 : 0) + (qualifications.length || experience.length >= 3 ? 2 : 0) + (detected.length >= 3 ? 1 : 0));

  const prose = (bodyLines.length ? bodyLines : entries.map(x => x.text)).filter(x => letterWords(x).length >= 4);
  const typos = [...new Set((prose.join(' ').match(typo) || []).map(x => x.toLowerCase()))].slice(0, 8);
  const repetitions = prose.length - new Set(prose.map(norm)).size;
  const longLines = prose.filter(l => letterWords(l).length > 35 && !/[.!?]\s+\p{Lu}/u.test(l)).length;
  const weakLines = prose.filter(l => weak.test(l)).length;
  const duplicatedWords = prose.filter(l => /\b([a-z]{2,})\s+\1\b/i.test(l)).length;
  const mechanics = prose.filter(l => /\s+[,.!?]|[!?]{2,}|\b(?:I has|we was|they was|has went|have went|I is|he have|she have)\b/i.test(l)).length;
  // Mixed openings are only a signal within a block with no explicit current dates.
  const tense = !experience.some(x => /\b(?:present|current)\b/i.test(x)) && bullets.some(l => verbForms.test(l)) && bullets.some(l => /^(?:managed|led|created|developed|implemented|delivered|coordinated)\b/i.test(l));
  record('Grammar & Professional Language', 10, (prose.length ? 10 : 6) - Math.min(3, typos.length + duplicatedWords) - Math.min(2, longLines) - Math.min(2, weakLines) - Math.min(2, repetitions + mechanics) - (tense ? 1 : 0));
  if (typos.length) issue(`Possible spelling issues: ${typos.join(', ')}.`, 'Check the flagged spellings in context before correcting them.');
  if (longLines) issue(`${longLines} line${longLines === 1 ? ' is' : 's are'} longer than 35 words without a clear sentence break.`, 'Split long descriptions into shorter, focused statements.');
  if (weakLines) issue('Vague or overused phrases appear in the CV.', 'Replace phrases such as “responsible for” with a concrete action or example.');
  if (repetitions || duplicatedWords || mechanics) issue('Repeated text or possible punctuation/grammar issues were detected.', 'Remove duplicate wording and proofread the affected sentences aloud.');
  if (tense) issue('Experience bullets mix past- and present-tense openings.', 'Check that previous positions use past tense and current responsibilities use present tense where appropriate.');
  if (prose.length && !typos.length && !weakLines && !longLines && !repetitions && !mechanics && !duplicatedWords && !tense) good('The writing passed the basic clarity and repetition checks.');

  const top = [...intro.slice(0, 7), ...(s.Contact || [])].join('\n');
  const email = text.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i)?.[0];
  const name = intro.slice(0, 3).some(l => /^(?:name:\s*)?[\p{L}][\p{L}'’.-]+(?:\s+[\p{L}][\p{L}'’.-]*){1,5}$/u.test(l) && !/^(?:curriculum vitae|professional resume|your name|contact information)$/i.test(l));
  const personalEmail = email && /(?:[._-]{2,}|\d{5,}|\b(?:noreply|example|test)@)/i.test(email);
  const phone = top.match(/(?:\+?\d[\d(). -]{6,}\d)/)?.[0];
  const badPhone = /\b(?:phone|mobile|tel)\s*:/i.test(top) && (!phone || phone.replace(/\D/g, '').length > 15);
  const badLinkedIn = /\blinkedin\b/i.test(top) && !/linkedin\.com\/(?:in|pub)\/[\w%-]+/i.test(top);
  record('Contact Information', 5, (name ? 2 : 0) + (email ? (personalEmail ? 1 : 2) : 0) + ((name || email) && !badPhone && !badLinkedIn ? 1 : 0));
  if (name && email && !personalEmail) good('A candidate name and plausible professional email were detected.');
  if (!name || !email) issue(`Could not confidently identify ${!name && !email ? 'a name or email' : !name ? 'a candidate name' : 'a valid email address'}.`, 'Put your name and an email you check near the top of the CV. City or region is enough if you choose to include a location.');
  if (personalEmail || badPhone || badLinkedIn) issue('One or more provided contact details look incomplete or informal.', 'Verify the email, country or area code, or full LinkedIn profile link you chose to include.');

  const max = categories.reduce((a, c) => a + c.max, 0);
  const points = categories.reduce((a, c) => a + c.score, 0);
  const score = Math.round(points / max * 100);
  const classification = classify(score);
  return {
    score, points, max, classification, explanation: explanations[classification],
    label: jobMode ? 'Job-Specific ATS Compatibility Analysis' : 'General CV Quality & ATS Readability',
    categories, sections, strengths: strengths.slice(0, premium ? 10 : 4),
    weaknesses: weaknesses.slice(0, premium ? 22 : 4), recommendations: recommendations.slice(0, premium ? 22 : 3),
    keyword: jobMode ? { coverage, total: keywords.length, ...(premium ? { terms: keywords } : {}) } : null,
    format: format.kind, layoutLimits: format.kind === 'PDF' ? 'PDF checks use selectable text and spacing; graphics, text boxes and complex tables may not be detectable.' : format.kind === 'Text' ? 'Plain-text checks do not measure the layout of an exported document.' : 'Word layout checks detect common structures, not every possible formatting issue.',
  };
}

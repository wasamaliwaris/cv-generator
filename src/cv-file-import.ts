import type { AppData, CVDocument, OptionalSectionEntry } from './model';
import { emptyProfile, newDocument, uid } from './model';
import { parseBackup } from './storage';

export type CvFileKind = 'backup' | 'pdf' | 'docx' | 'text' | 'unknown';

export const OPEN_FILE_ACCEPT = '.pdf,.docx,.txt,.md,.json,application/pdf,application/json,text/plain';

export const MAX_OPEN_BYTES = 20 * 1024 * 1024;

export function fileKind(file: File): CvFileKind {
  const name = file.name.toLowerCase();
  if (name.endsWith('.json')) return 'backup';
  if (name.endsWith('.pdf') || file.type === 'application/pdf') return 'pdf';
  if (name.endsWith('.docx')) return 'docx';
  if (name.endsWith('.txt') || name.endsWith('.md') || file.type.startsWith('text/')) return 'text';
  return 'unknown';
}

/** A PathCV JSON backup, opened non-destructively by the caller. */
export async function readBackupFile(file: File): Promise<AppData> {
  return parseBackup(await file.text());
}

function xmlToText(xml: string): string {
  return xml
    .replace(/<w:tab[^>]*\/>/g, '\t')
    .replace(/<w:br[^>]*\/>/g, '\n')
    .replace(/<\/w:p>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n');
}

async function readDocx(file: File): Promise<string> {
  const { unzipSync, strFromU8 } = await import('fflate');
  const zip = unzipSync(new Uint8Array(await file.arrayBuffer()));
  const entry = zip['word/document.xml'];
  if (!entry) throw new Error('That Word file could not be read. Try saving it as a PDF and opening that instead.');
  return xmlToText(strFromU8(entry));
}

type PromiseExtras = {
  withResolvers?: unknown;
  try?: (fn: (...args: unknown[]) => unknown, ...args: unknown[]) => Promise<unknown>;
};

function ensurePromiseHelpers() {
  const promiseConstructor = Promise as unknown as PromiseExtras;
  if (typeof promiseConstructor.withResolvers !== 'function') {
    promiseConstructor.withResolvers = function withResolvers<T>() {
      let resolve!: (value: T | PromiseLike<T>) => void;
      let reject!: (reason?: unknown) => void;
      const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
      return { promise, resolve, reject };
    };
  }
  if (typeof promiseConstructor.try !== 'function') {
    promiseConstructor.try = function promiseTry(fn: (...args: unknown[]) => unknown, ...args: unknown[]) {
      return new Promise((resolve) => resolve(fn(...args)));
    };
  }
}

async function readPdf(file: File): Promise<string> {
  ensurePromiseHelpers();
  const pdfjs = await import('pdfjs-dist');
  const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url').catch(() => null);
  if (worker && typeof worker.default === 'string') pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  const pdf = await loadingTask.promise;
  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const lines: string[] = [];
    let lastY: number | null = null;
    let current = '';
    for (const item of content.items) {
      if (!('str' in item)) continue;
      const y = item.transform[5] as number;
      if (lastY !== null && Math.abs(y - lastY) > 2.5 && current.trim()) {
        lines.push(current.trim());
        current = '';
      }
      current += (current && !current.endsWith(' ') ? ' ' : '') + item.str;
      lastY = y;
    }
    if (current.trim()) lines.push(current.trim());
    pages.push(lines.join('\n'));
    page.cleanup();
  }
  await loadingTask.destroy();
  return pages.join('\n\n');
}

const NAME_LINE = /^\p{Lu}[\p{L}.'\u2019-]*(?:\s+\p{Lu}[\p{L}.'\u2019-]*){1,3}$/u;
const NOT_A_NAME = /^(?:curriculum vitae|curriculum vit\u00e6|resume|r\u00e9sum\u00e9|cv|my cv|my resume|personal details|personal information|profile|contact|contact details)$/i;

function normalizeName(line: string): string {
  return line
    .split(/\s+/)
    .map((word) => {
      if (word !== word.toUpperCase() || !/\p{Lu}/u.test(word)) return word;
      return word.toLowerCase().replace(/(^|['\u2019.-])(\p{L})/gu, (_match, prefix: string, letter: string) => prefix + letter.toUpperCase());
    })
    .join(' ');
}

export interface DraftFromText {
  document: CVDocument;
  notice: string;
}

/** Builds an editable CV draft from the plain text of an uploaded document. */
export function draftFromText(rawText: string, fileName: string): DraftFromText {
  const text = rawText.replace(/\r\n?/g, '\n').replace(/\u00a0/g, ' ').trim();
  if (!text) throw new Error('No readable text was found in that file. If it is a scanned image, try a text-based PDF or a Word file.');

  const email = text.match(/[\w.+-]+@[\w-]+\.[\w.-]{2,}/)?.[0] ?? '';
  const linkedin = text.match(/https?:\/\/(?:www\.)?linkedin\.com\/[^\s)>,]+/i)?.[0] ?? '';
  const website = text.match(/https?:\/\/(?![^\s)>,]*linkedin)[^\s)>,]+/i)?.[0] ?? '';
  const phone = text.match(/(?:\+\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?){2,4}\d{2,4}/)?.[0].trim() ?? '';

  const headLines = text.split('\n').map((line) => line.trim()).filter(Boolean).slice(0, 8);
  const rawName = headLines.find((line) => line.length <= 48 && NAME_LINE.test(line) && !NOT_A_NAME.test(line)) ?? '';
  const nameLine = rawName ? normalizeName(rawName) : '';

  const body = text
    .split('\n')
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed) return false;
      if (nameLine && trimmed === nameLine) return false;
      if (email && trimmed.includes(email)) return false;
      if (linkedin && trimmed.includes(linkedin)) return false;
      if (website && trimmed.includes(website)) return false;
      if (phone && trimmed.includes(phone)) return false;
      return true;
    })
    .join('\n')
    .trim();

  const profile = emptyProfile();
  if (nameLine) {
    const parts = nameLine.split(/\s+/);
    profile.personal.firstName = parts[0] ?? '';
    profile.personal.lastName = parts.slice(1).join(' ');
  }
  profile.personal.email = email;
  profile.personal.phone = phone;
  profile.personal.linkedin = linkedin;
  profile.personal.website = website;

  const title = nameLine ? `${nameLine} - imported CV` : fileName.replace(/\.[^.]+$/, '') || 'Imported CV';
  const document = newDocument(profile, 'clear', title.slice(0, 80));

  if (body) {
    const section: OptionalSectionEntry = {
      id: uid(), order: 0, sectionKey: 'custom', customTitle: 'Imported CV text',
      title: '', organization: '', location: '', startDate: null, endDate: null,
      description: body.slice(0, 12000), link: '',
    };
    document.profileSnapshot.optionalSections = [section];
  }

  const notice = body
    ? 'Imported the text from your file. Formatting and layout are not copied, so move the content into the right sections and check every field.'
    : 'Imported the contact details we could find. No other text was detected, so please add your sections now.';
  return { document, notice };
}

/** Reads a PDF, Word, or text file and returns an editable draft. */
export async function openCvDocument(file: File): Promise<DraftFromText> {
  const kind = fileKind(file);
  if (kind === 'unknown') throw new Error('Choose a PDF, Word (.docx), text, or PathCV .json file.');
  if (file.size > MAX_OPEN_BYTES) throw new Error('That file is larger than 20 MB. Choose a smaller file.');
  const text = kind === 'pdf' ? await readPdf(file) : kind === 'docx' ? await readDocx(file) : await file.text();
  return draftFromText(text, file.name);
}

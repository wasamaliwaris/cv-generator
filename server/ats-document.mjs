import { Worker } from 'node:worker_threads';
import { crc32 } from 'node:zlib';
import yauzl from 'yauzl';
import { SaxesParser } from 'saxes';
import { decodeText, readHTML, readRTF } from './ats-text-formats.mjs';

export const FILE_LIMIT = 5 * 1024 * 1024;
export const DIRECT_LIMIT = 4 * 1024 * 1024;
export const TEXT_LIMIT = 65_000;
export class AtsError extends Error {
  constructor(status, message, code) { super(message); this.status = status; this.code = code; }
}
const badDocument = () => new AtsError(422, 'This file could not be read. If it is password-protected or corrupt, save a fresh copy as DOCX or PDF, or paste the CV text.');
export function cleanText(text) {
  return text.normalize('NFKC').replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u200b\u202a-\u202e\u2066-\u2069]/g, '');
}
export function validateText(text) {
  if (typeof text !== 'string') throw new AtsError(400, 'Enter or upload a CV to analyze.');
  if (text.length > TEXT_LIMIT) throw new AtsError(413, 'This CV contains too much text to analyze. Shorten it and try again.');
  const clean = cleanText(text).trim();
  if (clean.length < 30 || (clean.match(/\p{L}/gu)?.length ?? 0) < 20 || clean.split(/\s+/).length < 5) {
    throw new AtsError(422, 'Not enough readable text was found. For a scan, try text recognition or paste the CV text.', 'unreadable_text');
  }
  return clean;
}

// Read only the main document and its small packaging metadata. No files are extracted to disk or external links followed.
async function packageParts(bytes) {
  const zip = await yauzl.fromBufferPromise(bytes, { validateEntrySizes: true, strictFileNames: true });
  try {
    if (zip.entryCount > 1500) throw badDocument();
    const parts = new Map();
    for await (const entry of zip.eachEntry()) {
      if (!['word/document.xml', '[Content_Types].xml', '_rels/.rels', 'mimetype', 'content.xml'].includes(entry.fileName)) continue;
      const limit = entry.fileName === 'mimetype' ? 512 : ['word/document.xml', 'content.xml'].includes(entry.fileName) ? 2 * 1024 * 1024 : 96 * 1024;
      if (parts.has(entry.fileName) || entry.uncompressedSize > limit || entry.isEncrypted()) throw badDocument();
      const stream = await zip.openReadStreamPromise(entry);
      const chunks = [];
      let size = 0;
      for await (const data of stream) {
        size += data.length;
        if (size > limit) throw badDocument();
        chunks.push(data);
      }
      const binary = Buffer.concat(chunks);
      if (crc32(binary) !== entry.crc32) throw badDocument();
      parts.set(entry.fileName, new TextDecoder('utf-8', { fatal: true }).decode(binary));

    }
    return parts;
  } finally { zip.close(); }
}
function parseXML(xml, handlers) {
  if (!xml) throw badDocument();
  const parser = new SaxesParser({ xmlns: true });
  parser.on('doctype', () => { throw badDocument(); });
  parser.on('error', () => { throw badDocument(); });
  for (const [event, fn] of Object.entries(handlers)) parser.on(event, fn);
  parser.write(xml).close();
}
const wordNamespaces = new Set(['http://schemas.openxmlformats.org/wordprocessingml/2006/main', 'http://purl.oclc.org/ooxml/wordprocessingml/main']);
function parseWord(parts) {
  let isDocx = false;
  parseXML(parts.get('[Content_Types].xml'), { opentag: (tag) => {
    if (tag.local === 'Override' && tag.uri === 'http://schemas.openxmlformats.org/package/2006/content-types' && tag.attributes.PartName?.value === '/word/document.xml' && tag.attributes.ContentType?.value === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml') isDocx = true;
  } });
  if (!isDocx) throw badDocument();
  let pointsToDocument = false;
  parseXML(parts.get('_rels/.rels'), { opentag(tag) {
    if (tag.local !== 'Relationship' || tag.uri !== 'http://schemas.openxmlformats.org/package/2006/relationships') return;
    const type = tag.attributes.Type?.value;
    if (['http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument', 'http://purl.oclc.org/ooxml/officeDocument/relationships/officeDocument'].includes(type) && /^\/?word\/document\.xml$/.test(tag.attributes.Target?.value || '') && tag.attributes.TargetMode?.value !== 'External') pointsToDocument = true;
  } });
  if (!pointsToDocument) throw badDocument();
  let depth = 0, insideText = 0, isWord = false, foundBody = false, body = false, length = 0;
  let tables = 0, textBoxes = 0, graphics = 0, columns = false;
  const out = [];
  const add = (v) => { length += v.length; if (length > TEXT_LIMIT) throw new AtsError(413, 'This CV contains too much text to analyze.'); out.push(v); };
  parseXML(parts.get('word/document.xml'), {
    opentag(tag) {
      if (++depth > 100) throw badDocument();
      if (depth === 1) isWord = tag.local === 'document' && wordNamespaces.has(tag.uri);
      if (!wordNamespaces.has(tag.uri)) return;
      if (depth === 2 && tag.local === 'body') { body = true; foundBody = true; }
      if (!body) return;
      if (tag.local === 't') insideText++;
      if (tag.local === 'tab') add(' ');
      if (['br', 'cr'].includes(tag.local)) add('\n');
      if (tag.local === 'tbl') tables++;
      if (tag.local === 'txbxContent') textBoxes++;
      if (tag.local === 'drawing') graphics++;
      if (tag.local === 'cols' && Object.values(tag.attributes).some(a => a.local === 'num' && Number(a.value) > 1)) columns = true;
      if (tag.local === 'col') columns = true;
    },
    text(str) { if (insideText) add(str); },
    closetag(tag) {
      depth--;
      if (!body || !wordNamespaces.has(tag.uri)) return;
      if (depth === 1 && tag.local === 'body') body = false;
      if (tag.local === 't') insideText--;
      if (['p', 'tc', 'tr'].includes(tag.local)) add('\n');
    },
  });
  if (!isWord || !foundBody) throw badDocument();
  return { text: out.join(''), format: { kind: 'DOCX', tables, textBoxes, graphics, columns } };
}

const ODT_MIME = 'application/vnd.oasis.opendocument.text';
const OFFICE_NS = 'urn:oasis:names:tc:opendocument:xmlns:office:1.0';
const TEXT_NS = 'urn:oasis:names:tc:opendocument:xmlns:text:1.0';
const TABLE_NS = 'urn:oasis:names:tc:opendocument:xmlns:table:1.0';
const DRAW_NS = 'urn:oasis:names:tc:opendocument:xmlns:drawing:1.0';
function collector() {
  let text = '';
  return {
    add(part) { if (text.length + part.length > TEXT_LIMIT) throw new AtsError(413, 'This CV contains too much text to analyze.'); text += part; },
    text: () => text,
  };
}
function readODT(parts) {
  let depth = 0, document = false, body = false, seenText = false, textDepth = 0, paragraph = 0, hidden = 0;
  let tables = 0, textBoxes = 0, graphics = 0;
  const out = collector();
  parseXML(parts.get('content.xml'), {
    opentag(tag) {
      if (++depth > 100) throw badDocument();
      if (depth === 1) document = tag.uri === OFFICE_NS && tag.local === 'document-content';
      if (depth === 2 && tag.uri === OFFICE_NS && tag.local === 'body') body = true;
      if (body && depth === 3 && tag.uri === OFFICE_NS && tag.local === 'text') { textDepth = depth; seenText = true; }
      if (!textDepth) return;
      if ((tag.uri === TEXT_NS && ['tracked-changes', 'soft-page-break', 'hidden-text'].includes(tag.local)) || (tag.uri === OFFICE_NS && tag.local === 'annotation')) hidden ||= depth;
      if (hidden) return;
      if (tag.uri === TABLE_NS && tag.local === 'table') tables++;
      if (tag.uri === DRAW_NS && tag.local === 'text-box') textBoxes++;
      if (tag.uri === DRAW_NS && tag.local === 'image') graphics++;
      if (tag.uri === TEXT_NS) {
        if (['p', 'h'].includes(tag.local)) { if (paragraph) out.add('\n'); paragraph++; }
        if (paragraph && tag.local === 'tab') out.add('\t');
        if (paragraph && tag.local === 'line-break') out.add('\n');
        if (paragraph && tag.local === 's') out.add(' '.repeat(Math.min(100, Math.max(1, Number(Object.values(tag.attributes).find(a => a.uri === TEXT_NS && a.local === 'c')?.value) || 1))));
      }
    },
    text(value) { if (paragraph && !hidden) out.add(value); },
    closetag(tag) {
      if (textDepth && !hidden && tag.uri === TEXT_NS && ['p', 'h'].includes(tag.local)) { out.add('\n'); paragraph--; }
      if (depth === hidden) hidden = 0;
      if (depth === textDepth) textDepth = 0;
      if (depth === 2 && tag.uri === OFFICE_NS && tag.local === 'body') body = false;
      depth--;
    },
  });
  if (!document || !seenText) throw badDocument();
  return { text: out.text(), format: { kind: 'ODT', tables, textBoxes, graphics } };
}

async function parseInWorker(bytes, kind) {
  if (kind === 'PDF' && !bytes.subarray(-2048).includes(Buffer.from('%%EOF'))) throw badDocument();
  const entry = kind === 'PDF' ? new URL('./ats-pdf-worker.mjs', import.meta.url) : new URL('./ats-doc-worker.mjs', import.meta.url);
  return new Promise((resolve, reject) => {
    const data = Uint8Array.from(bytes);
    const worker = new Worker(entry, {
      workerData: data, transferList: [data.buffer], resourceLimits: { maxOldGenerationSizeMb: 96, maxYoungGenerationSizeMb: 16 },
      execArgv: [], stdout: true, stderr: true,
    });
    worker.stdout.resume(); worker.stderr.resume();
    const timer = setTimeout(() => { reject(new AtsError(422, 'That document took too long to read. Export a simpler copy or paste the CV text.')); stop(); }, 9000);
    worker.once('message', message => {
      if (message.data) resolve(message.data);
      else reject(message.status ? new AtsError(message.status, message.error) : badDocument());
    });
    worker.once('error', () => reject(badDocument()));
    worker.once('exit', () => reject(badDocument()));
    // Terminate on completion, timeout, or failure; don't keep a parser running on untrusted data.
    const stop = () => { clearTimeout(timer); void worker.terminate().catch(() => {}); };
    worker.once('message', stop);
    worker.once('exit', stop);
  });
}
export const SUPPORTED_ERROR = 'Choose PDF, DOCX, DOC, ODT, RTF, TXT, Markdown or HTML. For a scan, use text recognition or paste your CV text.';
export function documentKind(bytes, hint) {
  if (/^%PDF-\d\.\d/.test(bytes.subarray(0, 12).toString('ascii'))) return 'PDF';
  if (bytes.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 3, 4]))) return 'ZIP';
  if (bytes.subarray(0, 8).equals(Buffer.from('d0cf11e0a1b11ae1', 'hex'))) return 'DOC';
  const prefix = bytes.subarray(0, 1024).toString('utf8').replace(/^\uFEFF/, '').trimStart();
  if (/^\{\\rtf[1-9]\d*\b/.test(prefix)) return 'RTF';
  if (/^(?:<!doctype\s+html\b|<!--|<(?:html|head|body|article|main|section|div|p|h[1-6])(?:\s|>))/i.test(prefix) && (!['txt', 'md', 'markdown'].includes(hint))) return 'HTML';
  if (hint === 'txt') return 'TXT';
  if (hint === 'md' || hint === 'markdown') return 'Markdown';
  return null;
}
export async function parseDocument(bytes, hint) {
  if (!bytes.length) throw new AtsError(422, 'The selected file is empty.');
  if (bytes.length > FILE_LIMIT) throw new AtsError(413, 'Choose a CV file no larger than 5 MB.');
  const kind = documentKind(bytes, hint);
  if (!kind) throw new AtsError(415, SUPPORTED_ERROR);
  try {
    let parsed;
    if (kind === 'ZIP') {
      const parts = await packageParts(bytes);
      parsed = parts.get('mimetype') === ODT_MIME ? readODT(parts) : parseWord(parts);
    } else if (kind === 'PDF' || kind === 'DOC') {
      parsed = await parseInWorker(bytes, kind);
    } else if (kind === 'RTF') {
      if (bytes.length > 2 * 1024 * 1024) throw new AtsError(413, 'This RTF file is too complex. Save it as DOCX or paste the CV text.');
      parsed = readRTF(bytes, collector());
    } else if (kind === 'HTML') {
      if (bytes.length > 512 * 1024) throw new AtsError(413, 'This HTML file is too large to check. Save it as PDF or paste the CV text.');
      parsed = readHTML(decodeText(bytes), collector());
    } else {
      if (bytes.length > 4 * TEXT_LIMIT + 2) throw new AtsError(413, 'This CV contains too much text to analyze.');
      const text = decodeText(bytes);
      parsed = { text: kind === 'Markdown' ? text.replace(/^\s{0,3}#{1,6}\s+(.+?)\s*#*$/gm, '$1').replace(/\*\*(.*?)\*\*/g, '$1') : text, format: { kind } };
    }
    return { ...parsed, text: validateText(parsed.text) };
  } catch (error) {
    if (error instanceof AtsError) throw error;
    throw badDocument();
  }
}

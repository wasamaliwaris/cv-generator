import { Worker } from 'node:worker_threads';
import { crc32 } from 'node:zlib';
import yauzl from 'yauzl';
import { SaxesParser } from 'saxes';

export const FILE_LIMIT = 5 * 1024 * 1024;
export const DIRECT_LIMIT = 4 * 1024 * 1024;
export const TEXT_LIMIT = 65_000;
export class AtsError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const badDocument = () => new AtsError(422, 'This file could not be read. Try a fresh Word document or a text-based PDF, without a password.');
export function cleanText(text) {
  return text.normalize('NFKC').replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u200b\u202a-\u202e\u2066-\u2069]/g, '');
}
export function validateText(text) {
  if (typeof text !== 'string') throw new AtsError(400, 'Enter or upload a CV to analyze.');
  if (text.length > TEXT_LIMIT) throw new AtsError(413, 'This CV contains too much text to analyze. Shorten it and try again.');
  const clean = cleanText(text).trim();
  if (clean.length < 30 || (clean.match(/\p{L}/gu)?.length ?? 0) < 20 || clean.split(/\s+/).length < 5) {
    throw new AtsError(422, 'Not enough readable text was found. Scanned PDFs need selectable text; try exporting a text-based PDF or DOCX.');
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
      if (!['word/document.xml', '[Content_Types].xml', '_rels/.rels'].includes(entry.fileName)) continue;
      const limit = entry.fileName === 'word/document.xml' ? 2 * 1024 * 1024 : 96 * 1024;
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

async function parsePDF(bytes) {
  if (!bytes.subarray(-2048).includes(Buffer.from('%%EOF'))) throw badDocument();
  return new Promise((resolve, reject) => {
    const data = Uint8Array.from(bytes);
    const worker = new Worker(new URL('./ats-pdf-worker.mjs', import.meta.url), {
      workerData: data, transferList: [data.buffer], resourceLimits: { maxOldGenerationSizeMb: 96, maxYoungGenerationSizeMb: 16 },
      execArgv: [], stdout: true, stderr: true,
    });
    worker.stdout.resume(); worker.stderr.resume();
    const timer = setTimeout(() => { reject(new AtsError(422, 'That PDF took too long to read. Export a simpler text-based PDF.')); stop(); }, 9000);
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
export function documentKind(bytes) {
  if (/^%PDF-\d\.\d/.test(bytes.subarray(0, 12).toString('ascii'))) return 'PDF';
  if (bytes.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 3, 4]))) return 'DOCX';
  return null;
}
export async function parseDocument(bytes) {
  if (!bytes.length) throw new AtsError(422, 'The selected file is empty.');
  if (bytes.length > FILE_LIMIT) throw new AtsError(413, 'Choose a PDF or DOCX no larger than 5 MB.');
  const kind = documentKind(bytes);
  if (!kind) throw new AtsError(415, 'Only valid PDF and Word (.docx) files are accepted.');
  try {
    const parsed = kind === 'PDF' ? await parsePDF(bytes) : parseWord(await packageParts(bytes));
    return { ...parsed, text: validateText(parsed.text) };
  } catch (error) {
    if (error instanceof AtsError) throw error;
    throw badDocument();
  }
}

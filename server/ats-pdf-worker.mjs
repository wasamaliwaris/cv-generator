import { parentPort, workerData } from 'node:worker_threads';
import { createRequire } from 'node:module';
import { dirname, join, sep } from 'node:path';

const require = createRequire(import.meta.url);
const root = dirname(require.resolve('pdfjs-dist/package.json'));
const pdfAssets = dir => join(root, dir) + sep;
class AtsError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const TEXT_LIMIT = 65_000;

async function extract(bytes) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const task = pdfjs.getDocument({ data: Uint8Array.from(bytes), isEvalSupported: false, stopAtErrors: true, useSystemFonts: false, disableFontFace: true, useWasm: false, standardFontDataUrl: pdfAssets('standard_fonts'), cMapUrl: pdfAssets('cmaps'), cMapPacked: true, verbosity: 0 });
  try {
    const pdf = await task.promise;
    if (pdf.numPages < 1 || pdf.numPages > 20) throw new AtsError(422, 'Upload a CV of up to 20 pages.');
    const pages = [];
    let total = 0, columns = false, blankPages = 0, tables = 0, graphics = 0;
    for (let n = 1; n <= pdf.numPages; n++) {
      const page = await pdf.getPage(n);
      const tree = await page.getStructTree();
      const nodes = tree ? [tree] : [];
      for (let i = 0; nodes.length && i < 5000; i++) {
        const node = nodes.pop();
        if (node.role === 'Table') tables++;
        if (node.role === 'Figure') graphics++;
        if (node.children?.length) for (const child of node.children.slice(0, 5000 - nodes.length)) nodes.push(child);
      }
      const stream = page.streamTextContent();
      const reader = stream.getReader();
      const width = Math.abs(page.view[2] - page.view[0]);
      let previous, line = '', largeGaps = 0;
      const rows = [];
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          for (const item of value.items) {
            if (typeof item.str !== 'string') continue;
            const x = item.transform[4], y = item.transform[5];
            const gap = previous ? x - (previous.x + previous.width) : 0;
            if (previous && (Math.abs(y - previous.y) > Math.max(3, item.height * 0.6) || gap < -width * 0.16)) {
              rows.push(line); line = ''; previous = undefined;
            }
            if (previous && gap > width * 0.18) largeGaps++;
            if (previous && gap > 1.5 && !line.endsWith(' ')) line += ' ';
            line += item.str;
            total += item.str.length + 2;
            if (total > TEXT_LIMIT) throw new AtsError(413, 'This CV contains too much text to analyze.');
            if (item.hasEOL) { rows.push(line); line = ''; previous = undefined; }
            else previous = { x, y, width: item.width };
          }
        }
      } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
      rows.push(line);
      const text = rows.join('\n');
      if (!text.trim()) blankPages++;
      if (largeGaps >= 4) columns = true;
      pages.push(text);
      page.cleanup();
    }
    return { text: pages.join('\n\n'), format: { kind: 'PDF', pages: pdf.numPages, blankPages, columns, tables, graphics } };
  } finally { await task.destroy().catch(() => {}); }
}

try { parentPort.postMessage({ data: await extract(workerData) }); }
catch (error) { parentPort.postMessage(error instanceof AtsError ? { error: error.message, status: error.status } : {}); }

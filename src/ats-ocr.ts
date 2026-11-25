import { createWorker, OEM } from 'tesseract.js';
import type { Worker as OcrWorker } from 'tesseract.js';
import workerPath from 'tesseract.js/dist/worker.min.js?url';
import corePath from 'tesseract.js-core/tesseract-core-lstm.wasm.js?url';
import languagePath from '@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz?url';

const OCR_TIMEOUT = 90_000;
const OCR_SIZE = 2450;
const OCR_PAGES = 5;
const waitWithAbort = <T>(promise: Promise<T>, signal: AbortSignal) => new Promise<T>((resolve, reject) => {
  if (signal.aborted) { promise.catch(() => {}); reject(signal.reason); return; }
  const abort = () => reject(signal.reason);
  signal.addEventListener('abort', abort, { once: true });
  void promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', abort));
});

function canvasAt(width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width)); canvas.height = Math.max(1, Math.round(height));
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) throw new Error('Your browser could not prepare an image. Paste the text of the CV instead.');
  context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height);
  return { canvas, context };
}

export async function recognizeCV(file: File, isPDF: boolean, signal: AbortSignal, onStatus: (message: string) => void) {
  const bounded = new AbortController();
  const cancel = () => bounded.abort(signal.reason);
  signal.addEventListener('abort', cancel, { once: true });
  if (signal.aborted) cancel();
  const timer = window.setTimeout(() => bounded.abort(new Error('Text recognition took too long. Try a smaller, clearer image or paste your CV text.')), OCR_TIMEOUT);
  const work = bounded.signal;
  let worker: OcrWorker | undefined;
  let releasePdf: (() => Promise<void>) | undefined;
  try {
    let count = 1;
    let page: (n: number) => Promise<HTMLCanvasElement>;
    if (isPDF) {
      const [pdfjs, pdfAsset, data] = await waitWithAbort(Promise.all([import('pdfjs-dist/legacy/build/pdf.mjs'), import('pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'), file.arrayBuffer()]), work);
      pdfjs.GlobalWorkerOptions.workerSrc = pdfAsset.default;
      const loading = pdfjs.getDocument({ data: new Uint8Array(data), isEvalSupported: false });
      releasePdf = () => loading.destroy();
      const pdf = await waitWithAbort(loading.promise, work);
      count = pdf.numPages;
      if (count > OCR_PAGES) throw new Error(`Text recognition supports scans up to ${OCR_PAGES} pages. Use a shorter PDF or paste the CV text.`);
      page = async n => {
        const entry = await waitWithAbort(pdf.getPage(n), work);
        const base = entry.getViewport({ scale: 1 });
        const viewport = entry.getViewport({ scale: Math.min(4, OCR_SIZE / Math.max(base.width, base.height)) });
        const { canvas, context } = canvasAt(viewport.width, viewport.height);
        const task = entry.render({ canvasContext: context, viewport });
        try { await waitWithAbort(task.promise, work); return canvas; }
        finally { if (work.aborted) task.cancel(); entry.cleanup(); }
      };
    } else {
      page = async () => {
        const image = await createImageBitmap(file);
        try {
          work.throwIfAborted();
          const scale = Math.min(1, OCR_SIZE / Math.max(image.width, image.height));
          const { canvas, context } = canvasAt(image.width * scale, image.height * scale);
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          return canvas;
        } finally { image.close(); }
      };
    }
    const langPath = new URL('.', new URL(languagePath, window.location.href)).href;
    const initializing = createWorker('eng', OEM.LSTM_ONLY, {
      workerPath, corePath, langPath, cacheMethod: 'none', workerBlobURL: false,
      errorHandler: () => bounded.abort(new Error('Text recognition could not start or complete. Try again or paste your CV text.')),
    });
    void initializing.then(created => { if (work.aborted) void created.terminate().catch(() => {}); }, () => {});
    worker = await waitWithAbort(initializing, work);
    const results = [];
    for (let n = 1; n <= count; n++) {
      onStatus(count === 1 ? 'Reading CV text…' : `Reading page ${n} of ${count}…`);
      const canvas = await waitWithAbort(page(n), work);
      try { results.push((await waitWithAbort(worker.recognize(canvas), work)).data.text.trim()); }
      finally { canvas.width = 0; canvas.height = 0; }
    }
    const text = results.join('\n\n').trim();
    if ((text.match(/\p{L}/gu)?.length || 0) < 20) throw new Error('Not enough text was recognized. Try a clearer image or paste the CV text.');
    if (text.length > 65_000) throw new Error('This scan contains too much text. Try a shorter copy.');
    return text;
  } finally {
    window.clearTimeout(timer);
    signal.removeEventListener('abort', cancel);
    await worker?.terminate().catch(() => {});
    await releasePdf?.().catch(() => {});
  }
}

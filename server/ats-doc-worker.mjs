import { parentPort, workerData } from 'node:worker_threads';
import WordExtractor from 'word-extractor';

try {
  const doc = await new WordExtractor().extract(Buffer.from(workerData));
  const text = doc.getBody();
  parentPort.postMessage(text.length > 65_000 ? { status: 413, error: 'This CV contains too much text to analyze.' } : { data: { text, format: { kind: 'DOC' } } });
} catch { parentPort.postMessage({}); }

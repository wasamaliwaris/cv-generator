import type { AtsCategory, AtsReport } from './ats-client';

const KEY = 'pathcv-ats-scores-v1';
const CHANGE = 'pathcv-ats-saved';
export interface SavedAtsScore { id: string; docId?: string; version?: string; name: string; savedAt: string; score: number; points: number; max: number; classification: string; label: string; categories: AtsCategory[] }
let lastRaw: string | null | undefined;
let cache: SavedAtsScore[] = [];
export function savedAtsScores(): SavedAtsScore[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === lastRaw) return cache;
    const value: unknown = raw ? JSON.parse(raw) : [];
    cache = Array.isArray(value) ? value.filter(x => x && typeof x.id === 'string' && typeof x.name === 'string' && typeof x.label === 'string' && typeof x.classification === 'string' && typeof x.savedAt === 'string' && Number.isInteger(x.score) && x.score >= 0 && x.score <= 100 && Array.isArray(x.categories)).slice(0, 40) : [];
    lastRaw = raw;
    return cache;
  } catch { return cache; }
}
export function subscribeAtsScores(fn: () => void) {
  const onStorage = (e: StorageEvent) => { if (e.key === KEY || e.key === null) fn(); };
  window.addEventListener('storage', onStorage); window.addEventListener(CHANGE, fn);
  return () => { window.removeEventListener('storage', onStorage); window.removeEventListener(CHANGE, fn); };
}
function update(scores: SavedAtsScore[]) {
  localStorage.setItem(KEY, JSON.stringify(scores));
  window.dispatchEvent(new Event(CHANGE));
}
export function saveAtsScore(report: AtsReport, name: string, source?: { id: string; version: string }) {
  const score: SavedAtsScore = {
    id: crypto.randomUUID(), docId: source?.id, version: source?.version, name: name.trim().slice(0, 75) || 'ATS check', savedAt: new Date().toISOString(),
    score: report.score, points: report.points, max: report.max, classification: report.classification, label: report.label, categories: report.categories,
  };
  const scores = savedAtsScores();
  // One latest snapshot per CV; separate uploads can be kept as separate named snapshots.
  if (scores.length >= 40 && !scores.some(item => score.docId && item.docId === score.docId)) throw new Error('Saved scores are full. Remove an older score from My CVs to make room.');
  update([score, ...scores.filter(item => !score.docId || item.docId !== score.docId)]);
}
export function removeAtsScore(id: string) { update(savedAtsScores().filter(x => x.id !== id)); }
export function clearAtsScores() { localStorage.removeItem(KEY); window.dispatchEvent(new Event(CHANGE)); }

export const ATS_LIMIT = 5 * 1024 * 1024;
export const ATS_DIRECT_LIMIT = 4 * 1024 * 1024;
const FIRST_PART = 2_621_440;
export interface AtsCategory { name: string; score: number; max: number }
export interface AtsReport {
  score: number; points: number; max: number; label: string; classification: string; explanation: string;
  categories: AtsCategory[];
  sections: { name: string; status: 'good' | 'improve' | 'missing' }[];
  strengths: string[]; weaknesses: string[]; recommendations: string[];
  keyword: { coverage: number | null; total: number; terms?: { label: string; status: 'matched' | 'partial' | 'missing'; weight: number }[] } | null;
  format: string; layoutLimits: string;
}
export interface AtsAccess { premium: boolean; ai: boolean; accessCodes: boolean; uploadLimit: number }
export interface AtsJob { title: string; job: string }
export interface AtsResponse { result: AtsReport; text?: string }
async function request<T>(action: string, options: RequestInit, signal?: AbortSignal): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/ats${action ? `?action=${action}` : ''}`, { ...options, signal, cache: 'no-store', credentials: 'same-origin', referrerPolicy: 'same-origin' });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new Error('Could not reach the checker. Check your connection and try again.');
  }
  const data = await response.json().catch(() => null);
  if (!response.ok || !data) throw new Error(data?.error || (response.status === 413 ? 'That upload is too large. Choose a smaller file.' : 'The checker is temporarily unavailable. Please try again.'));
  return data as T;
}
export const atsStatus = (signal?: AbortSignal) => request<AtsAccess>('', {}, signal);
export function atsAction<T>(action: string, data: object, signal?: AbortSignal) {
  return request<T>(action, { method: 'POST', body: JSON.stringify(data), headers: { 'Content-Type': 'application/json' } }, signal);
}
export async function analyzeUpload(file: File, input: AtsJob, signal: AbortSignal) {
  const send = <T>(action: string, body: Blob) => request<T>(action, { method: 'POST', headers: { 'Content-Type': 'application/octet-stream' }, body }, signal);
  let ticket: string | undefined;
  let payload: Blob = file;
  if (file.size > ATS_DIRECT_LIMIT) {
    ({ ticket } = await send<{ ticket: string }>('stage', file.slice(0, FIRST_PART)));
    payload = file.slice(FIRST_PART);
  }
  const info = new TextEncoder().encode(JSON.stringify({ ...input, ticket }));
  const length = new ArrayBuffer(4); new DataView(length).setUint32(0, info.length);
  return send<AtsResponse>('analyze', new Blob([length, info, payload]));
}

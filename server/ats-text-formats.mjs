import { parse } from 'parse5';

export function decodeText(bytes) {
  const encoding = bytes[0] === 0xff && bytes[1] === 0xfe ? 'utf-16le' : bytes[0] === 0xfe && bytes[1] === 0xff ? 'utf-16be' : 'utf-8';
  const text = new TextDecoder(encoding, { fatal: true }).decode(bytes);
  if (/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text)) throw new Error('Not a text file');
  return text;
}

const omit = new Set(['script', 'style', 'noscript', 'head', 'template', 'iframe', 'object', 'svg', 'canvas', 'audio', 'video']);
const blocks = new Set(['address', 'article', 'aside', 'blockquote', 'br', 'div', 'footer', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr', 'li', 'main', 'ol', 'p', 'pre', 'section', 'table', 'tr', 'ul']);
export function readHTML(text, collector) {
  const root = parse(text, { scriptingEnabled: false });
  const stack = [{ node: root }];
  let tables = 0, graphics = 0, visits = 0;
  while (stack.length) {
    const { node, end } = stack.pop();
    if (++visits > 45_000) throw new Error('HTML is too complex');
    const tag = node.tagName;
    if (end) { collector.add(tag === 'td' || tag === 'th' ? ' ' : '\n'); continue; }
    if (node.nodeName === '#text') { collector.add(node.value.replace(/\s+/gu, ' ')); continue; }
    if (omit.has(tag) || node.attrs?.some(a => a.name === 'hidden' || a.name === 'aria-hidden' && a.value === 'true' || a.name === 'style' && /(?:display\s*:\s*none|visibility\s*:\s*hidden)\b/i.test(a.value))) continue;
    if (tag === 'img') { graphics++; continue; }
    if (tag === 'table') tables++;
    if (blocks.has(tag) || tag === 'td' || tag === 'th') stack.push({ node, end: true });
    if (blocks.has(tag)) collector.add(tag === 'li' ? '\n- ' : '\n');
    for (let i = (node.childNodes?.length || 0) - 1; i >= 0; i--) stack.push({ node: node.childNodes[i] });
  }
  return { text: collector.text().replace(/[ \t]*\n[ \t]*/g, '\n').replace(/\n{3,}/g, '\n\n'), format: { kind: 'HTML', tables, graphics } };
}

const destinations = new Set(['fonttbl', 'colortbl', 'stylesheet', 'info', 'pict', 'object', 'datastore', 'themedata', 'listtable', 'listoverridetable', 'xmlnstbl', 'generator', 'filetbl', 'fldinst', 'shp', 'nonshppict', 'header', 'headerr', 'headerl', 'headerf', 'footer', 'footerr', 'footerl', 'footerf', 'annotation', 'footnote']);
const controlText = { par: '\n', line: '\n', tab: '\t', cell: '\t', row: '\n', emdash: '—', endash: '–', bullet: '•', lquote: '‘', rquote: '’', ldblquote: '“', rdblquote: '”' };
// A text-only RTF reader. Formatting instructions and embedded payloads are not executed.
export function readRTF(bytes, out) {
  const src = bytes.toString('latin1').replace(/^\xef\xbb\xbf/, '').trim();
  if (!/^\{\\rtf[1-9]\d*\b/.test(src)) throw new Error('Invalid RTF');
  const stack = [];
  let state = { skip: false, start: true, uc: 1, codepage: 'windows-1252' }, fallback = 0, tables = 0, graphics = 0;
  let pending = [];
  const flush = () => {
    if (pending.length) out.add(new TextDecoder(state.codepage, { fatal: true }).decode(Uint8Array.from(pending)));
    pending = [];
  };
  const emit = (v, isByte = false) => {
    if (state.skip) return;
    if (fallback) { fallback--; return; }
    if (isByte) {
      pending.push(v);
      if (pending.length > 70_000) throw new Error('Too much RTF text');
    } else { flush(); out.add(v); }
  };
  for (let i = 0; i < src.length;) {
    const c = src[i++];
    if (c === '{') {
      flush(); if (stack.length >= 100) throw new Error('RTF is too deeply nested');
      stack.push(state); state = { ...state, start: true }; continue;
    }
    if (c === '}') {
      flush(); if (!stack.length) throw new Error('Invalid RTF');
      state = stack.pop(); if (!stack.length && i !== src.length) throw new Error('Invalid RTF');
      continue;
    }
    if (c !== '\\') {
      if (c !== '\n' && c !== '\r') { state.start = false; emit(c.charCodeAt(0), true); }
      continue;
    }
    const symbol = src[i++];
    if (symbol === "'") {
      if (!/^[\da-f]{2}$/i.test(src.slice(i, i + 2))) throw new Error('Invalid RTF encoding');
      emit(parseInt(src.slice(i, i + 2), 16), true); i += 2; state.start = false; continue;
    }
    if (!symbol || !/[a-z]/i.test(symbol)) {
      if (symbol === '*' && state.start) state.skip = true;
      else if (symbol === '~') emit(' ');
      else if (symbol === '_' || symbol === '-') emit('-');
      else if (symbol && '\\{}'.includes(symbol)) emit(symbol);
      continue;
    }
    const begin = i - 1;
    while (i < src.length && /[a-z]/i.test(src[i])) i++;
    const word = src.slice(begin, i);
    const arg = i;
    if (src[i] === '-') i++;
    while (i < src.length && /\d/.test(src[i])) i++;
    const value = i > arg ? Number(src.slice(arg, i)) : undefined;
    if (src[i] === ' ') i++;
    if (word === 'bin') {
      if (!Number.isSafeInteger(value) || value < 0 || i + value > src.length) throw new Error('Invalid RTF data');
      i += value;
    }
    if (state.start && destinations.has(word)) { if (word === 'pict' && !state.skip) graphics++; state.skip = true; }
    state.start = false;
    if (state.skip) continue;
    if (word === 'trowd') tables = 1;
    if (word === 'uc' && Number.isInteger(value) && value >= 0 && value <= 10) state.uc = value;
    if (word === 'ansicpg') {
      flush();
      const cp = value === 65001 ? 'utf-8' : [932, 936, 949, 950].includes(value) ? ({ 932: 'shift_jis', 936: 'gbk', 949: 'euc-kr', 950: 'big5' })[value] : `windows-${value}`;
      state.codepage = new TextDecoder(cp).encoding;
    }
    if (word === 'u' && Number.isInteger(value) && value >= -32768 && value <= 65535) { fallback = 0; emit(String.fromCharCode(value & 0xffff)); fallback = state.uc; }
    if (Object.hasOwn(controlText, word)) emit(controlText[word]);
  }
  if (stack.length) throw new Error('Unclosed RTF document');
  return { text: out.text(), format: { kind: 'RTF', tables, graphics } };
}

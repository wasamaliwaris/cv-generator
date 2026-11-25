import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { zipSync, strToU8 } from 'fflate';
import { createAtsHandler } from '../api/ats.mjs';
import { analyzeCV, classify } from '../server/ats-score.mjs';
import { parseDocument, FILE_LIMIT, DIRECT_LIMIT } from '../server/ats-document.mjs';
import { FIRST_PART, tempUploads } from '../server/ats-staging.mjs';
import { makeGrant, signToken, time } from '../server/ats-access.mjs';
import { cv, jd, docx, legacyDoc, odt, pdf } from './ats-fixtures.mjs';
const secret = 'secret for testing only with enough length';

async function harness(t, env = {}, fetcher = fetch) {
  const server = createServer(createAtsHandler(env, fetcher));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const origin = `http://127.0.0.1:${server.address().port}`;
  return async (action, data, extras = {}) => {
    const binary = Buffer.isBuffer(data);
    const response = await fetch(`${origin}/api/ats${action ? '?action=' + action : ''}`, { method: data === undefined ? 'GET' : 'POST', body: data === undefined ? undefined : binary ? data : JSON.stringify(data), headers: { Origin: origin, 'Content-Type': binary ? 'application/octet-stream' : 'application/json', ...extras } });
    return { status: response.status, headers: response.headers, body: await response.json() };
  };
}
function packet(bytes, meta = {}) { const header = Buffer.from(JSON.stringify(meta)); const len = Buffer.alloc(4); len.writeUInt32BE(header.length); return Buffer.concat([len, header, bytes]); }
const code = () => makeGrant(secret, 600);
async function access(request) {
  const redeemed = await request('redeem', { code: code() });
  assert.equal(redeemed.status, 200);
  assert.match(redeemed.headers.get('set-cookie'), /HttpOnly; SameSite=Strict/);
  return { Cookie: redeemed.headers.get('set-cookie').split(';')[0] };
}

test('reads real PDF and Word structures; reports evidence independently of text extraction', async () => {
  const parsedPDF = await parseDocument(pdf());
  assert.equal(parsedPDF.format.kind, 'PDF'); assert.equal(parsedPDF.format.pages, 1); assert.match(parsedPDF.text, /Python/);
  const parsedWord = await parseDocument(docx());
  assert.equal(parsedWord.format.kind, 'DOCX'); assert.equal(parsedWord.format.tables, 1); assert.equal(parsedWord.format.columns, true); assert.match(parsedWord.text, /Education/);
  assert.ok(analyzeCV(parsedWord).categories[0].score < analyzeCV(parsedPDF).categories[0].score);
});

test('rejects fake, corrupt, empty, unreadable, XML DTD and oversize documents', async () => {
  const invalid = [[Buffer.alloc(0), 422], [Buffer.from('PDF extension is not a file signature'), 415], [Buffer.from('%PDF-1.4\nbroken\n%%EOF'), 422], [pdf(''), 422], [docx({ text: '', table: false }), 422], [Buffer.from(zipSync({ 'note.txt': strToU8(cv) })), 422], [docx({ override: '<!DOCTYPE w:document [<!ENTITY e "ignored">]><w:document/>' }), 422], [Buffer.alloc(FILE_LIMIT + 1), 413]];
  for (const [bytes, status] of invalid) await assert.rejects(parseDocument(bytes), { status });
});

test('general and role-specific scoring, aliases, weighted keywords, breakdown math, and bands', () => {
  const general = analyzeCV({ text: cv });
  assert.equal(general.label, 'General CV Quality & ATS Readability'); assert.equal(general.max, 75); assert.equal(general.keyword, null);
  assert.equal(general.score, Math.round((general.points / 75) * 100));
  const specific = analyzeCV({ text: cv, job: jd, title: 'Data Analyst', premium: true });
  assert.equal(specific.max, 100); assert.equal(specific.label, 'Job-Specific ATS Compatibility Analysis');
  assert.equal(specific.score, specific.categories.reduce((a, c) => a + c.score, 0));
  const find = label => specific.keyword.terms.find(k => k.label === label);
  assert.deepEqual(find('SQL'), { label: 'SQL', status: 'matched', weight: 2 });
  assert.equal(find('inventory management').status, 'partial'); assert.equal(find('Kubernetes').status, 'missing'); assert.equal(find('AWS'), undefined);
  const alias = analyzeCV({ text: cv + '\nAmazon Web Services', job: 'Experience with AWS and PostgreSQL', premium: true });
  assert.equal(alias.keyword.terms.find(x => x.label === 'AWS').status, 'matched');
  assert.equal(alias.keyword.terms.find(x => x.label === 'PostgreSQL').status, 'missing');
  const coverage = specific.keyword.terms.reduce((a, k) => a + k.weight * (k.status === 'matched' ? 1 : k.status === 'partial' ? .5 : 0), 0);
  const possible = specific.keyword.terms.reduce((a, k) => a + k.weight, 0);
  assert.equal(specific.keyword.coverage, Math.round(100 * coverage / possible));
  assert.equal(specific.categories.find(c => c.max === 25).score, Math.round(25 * coverage / possible));
  assert.equal(analyzeCV({ text: cv, job: 'Please contact us about this role.' }).keyword.coverage, null);
  assert.deepEqual([0, 59, 60, 69, 70, 79, 80, 89, 90, 100].map(classify), ['Poor', 'Poor', 'Needs Improvement', 'Needs Improvement', 'Good', 'Good', 'Very Good', 'Very Good', 'Excellent', 'Excellent']);
});

test('early-career evidence, optional contact fields, and grammar diagnostics', () => {
  const student = cv.replace(/Experience\n[\s\S]*?Education/, 'Projects\nCampus Dashboard\n- Built a dashboard and trained 20 students to use it.\n- Automated weekly calculations and produced audit notes.\nEducation');
  const result = analyzeCV({ text: student, premium: true });
  assert.ok(result.categories.find(c => c.name.startsWith('Experience')).score >= 12);
  assert.equal(result.categories.find(c => c.name.startsWith('Contact')).score, 5);
  assert.ok(!result.sections.find(c => /Experience, projects/.test(c.name)));
  const worse = analyzeCV({ text: student.replace('Built a dashboard', 'Responsible for teh the the dashboard'), premium: true });
  assert.ok(worse.categories.find(c => c.name.startsWith('Grammar')).score < result.categories.find(c => c.name.startsWith('Grammar')).score);
});

test('free API validates files and never returns extracted text or premium detail', async t => {
  const call = await harness(t);
  const status = await call(); assert.deepEqual(status.body, { premium: false, ai: false, accessCodes: false, uploadLimit: DIRECT_LIMIT });
  const result = await call('analyze', packet(pdf(), { job: jd, premium: true }));
  assert.equal(result.status, 200); assert.equal(result.body.result.max, 100); assert.equal(result.body.result.keyword.terms, undefined); assert.equal(result.body.text, undefined);
  assert.match(result.headers.get('cache-control'), /no-store/);
  assert.equal((await call('analyze', packet(Buffer.from('bad PDF')))).status, 415);
  assert.equal((await call('analyze', packet(docx()))).status, 200);
  assert.equal((await call('analyze', packet(Buffer.alloc(DIRECT_LIMIT + 1)))).status, 413);
  assert.equal((await call('analyze', { text: cv }, { Origin: 'https://not-pathcv.example' })).status, 403);
  for (const action of ['improve', 'export', 'recheck']) assert.equal((await call(action, { text: cv, premium: true }, { Cookie: 'pathcv_ats_access=true' })).status, 403);
});

test('server-verified access, edit/recheck may lower or hold score, and print returns only CV text', async t => {
  const call = await harness(t, { ATS_ACCESS_SECRET: secret });
  assert.equal((await call('redeem', { code: 'different' })).status, 403);
  const expired = signToken(secret, { purpose: 'grant', id: 'a'.repeat(24), exp: time() - 5 });
  assert.equal((await call('redeem', { code: expired })).status, 403);
  const cookie = await access(call);
  const original = await call('analyze', packet(docx({ table: false }), { job: jd }), cookie);
  assert.match(original.body.text, /Amira Malik/);
  assert.ok(original.body.result.keyword.terms.length > 0);
  const plain = (await call('analyze', { text: cv, job: jd }, cookie)).body.result;
  const unchanged = (await call('recheck', { text: cv, job: jd }, cookie)).body.result;
  assert.equal(unchanged.score, plain.score);
  const edit = 'Amira Malik\nData Analyst\nResponsible for lots of work and various tasks.';
  const recheck = await call('recheck', { text: edit, job: jd }, cookie);
  assert.ok(recheck.body.result.score < plain.score);
  const output = await call('export', { text: edit, job: jd }, cookie);
  assert.deepEqual(output.body, { text: edit });
  assert.equal((await call('improve', { text: cv, consent: true }, cookie)).status, 503);
});

test('AI requires consent and rejects new numerical claims; no provider in standard analysis', async t => {
  let requests = 0;
  let proposal = cv.replace('builds reliable', 'creates reliable');
  const fake = async (url, options) => {
    requests++;
    assert.equal(new URL(url).hostname, 'api.openai.com');
    const body = JSON.parse(options.body);
    assert.match(body.messages[0].content, /untrusted source documents/);
    assert.match(JSON.parse(body.messages[1].content).cv, /Amira Malik/);
    return Response.json({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({ text: proposal }) } }] });
  };
  const call = await harness(t, { ATS_ACCESS_SECRET: secret, OPENAI_API_KEY: 'mock-key' }, fake);
  const cookie = await access(call);
  await call('analyze', { text: cv, job: jd }, cookie);
  assert.equal((await call('improve', { text: cv }, cookie)).status, 400); assert.equal(requests, 0);
  assert.equal((await call('improve', { text: cv, job: jd, consent: true }, cookie)).body.proposal, proposal);
  proposal += '\nIncreased engagement by 75%';
  assert.equal((await call('improve', { text: cv, consent: true }, cookie)).status, 502);
});

function mockRedis() {
  const store = new Map();
  let expiry;
  const redis = async (op, ...args) => {
    if (op === 'SET') { store.set(args[0], args[1]); expiry = args[3]; return 'OK'; }
    if (op === 'GETDEL') { const value = store.get(args[0]); store.delete(args[0]); return value ?? null; }
    if (op === 'DEL') { args.forEach(k => store.delete(k)); return args.length; }
    if (op === 'EVAL') { const n = (store.get(args[2]) || 0) + 1; store.set(args[2], n); return n; }
    throw new Error('Unexpected command');
  };
  return { redis, store, get expiry() { return expiry; } };
}

test('large files use encrypted expiring parts, cleanup, and reject replay', async t => {
  const mock = mockRedis();
  const buffer = docx({ padding: FILE_LIMIT - docx({ padding: 1 }).length + 1 });
  assert.equal(buffer.length, FILE_LIMIT);
  const temp = tempUploads(mock.redis, secret);
  const ticket = await temp.stage(buffer.subarray(0, FIRST_PART));
  assert.equal(mock.expiry, 120);
  assert.ok([...mock.store.values()].every(x => !Buffer.from(x, 'base64').includes(Buffer.from('Amira Malik'))));
  assert.deepEqual(await temp.take(ticket), buffer.subarray(0, FIRST_PART));
  assert.equal(mock.store.size, 0); await assert.rejects(temp.take(ticket), { status: 422 });
  const proxy = async (_url, opts) => { const result = await mock.redis(...JSON.parse(opts.body)); return Response.json({ result }); };
  const call = await harness(t, { ATS_REDIS_URL: 'https://redis.example', ATS_REDIS_TOKEN: 'mock', ATS_UPLOAD_SECRET: secret }, proxy);
  assert.equal((await call()).body.uploadLimit, FILE_LIMIT);
  const staged = await call('stage', buffer.subarray(0, FIRST_PART));
  const analyzed = await call('analyze', packet(buffer.subarray(FIRST_PART), { ticket: staged.body.ticket }));
  assert.equal(analyzed.status, 200); assert.equal(analyzed.body.result.format, 'DOCX');
  assert.equal((await call('analyze', packet(buffer.subarray(FIRST_PART), { ticket: staged.body.ticket }))).status, 422);
  assert.ok([...mock.store.keys()].every(k => !k.includes(':tmp:')));
});

test('rate limits attempts even without optional Redis', async t => {
  const call = await harness(t);
  for (let n = 0; n < 8; n++) assert.equal((await call('redeem', { code: 'bad' })).status, 403);
  assert.equal((await call('redeem', { code: 'bad' })).status, 429);
});


test('directly scores legacy Word, ODT, RTF, TXT, Markdown and HTML uploads', async t => {
  const call = await harness(t);
  const html = `<html><head><title>hidden title</title></head><body><script>invisible JavaScript</script><p hidden>ignored hidden text</p>${cv.split('\n').map(line => `<p>${line}</p>`).join('')}</body></html>`;
  const rtf = String.raw`{\rtf1\ansi{\fonttbl{\f0 hiddenFont;}}` + cv.replaceAll('\n', String.raw`\par `).replace('—', String.raw`\emdash `) + String.raw`{\*\unsupported ignored destination}}`;
  for (const [file, extension, format] of [
    [legacyDoc(), 'doc', 'DOC'], [odt(), 'odt', 'ODT'], [Buffer.from(rtf), 'rtf', 'RTF'],
    [Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(cv, 'utf16le')]), 'txt', 'TXT'],
    [Buffer.from(cv.replace('Summary', '## Summary').replace('Skills', '**Skills**')), 'md', 'Markdown'], [Buffer.from(html), 'html', 'HTML'],
  ]) {
    const parsed = await parseDocument(file, extension);
    assert.equal(parsed.format.kind, format); assert.match(parsed.text, /Amira Malik/);
    assert.doesNotMatch(parsed.text, /hidden title|invisible JavaScript|ignored hidden text|hiddenFont|ignored destination/);
    const analyzed = await call('analyze', packet(file, { extension, job: jd }));
    assert.equal(analyzed.status, 200, format);
    assert.equal(analyzed.body.result.format, format);
    assert.ok(analyzed.body.result.score > 0);
    assert.ok(analyzed.body.result.sections.some(section => section.name === 'Summary' && section.status === 'good'));
  }
});

test('rejects renamed binary, broken RTF, non-text ODF, and empty HTML; reports OCR suggestion for no selectable text', async t => {
  await assert.rejects(parseDocument(Buffer.from([0, 255, 32, 128, 44]), 'txt'), { status: 422 });
  await assert.rejects(parseDocument(Buffer.from(String.raw`{\rtf1\ansi Unclosed document`), 'rtf'), { status: 422 });
  await assert.rejects(parseDocument(odt(cv, 'application/vnd.oasis.opendocument.spreadsheet'), 'odt'), { status: 422 });
  await assert.rejects(parseDocument(Buffer.from('<html><script>lots of invisible words that must not be scored</script></html>'), 'html'), { status: 422 });
  const call = await harness(t);
  const result = await call('analyze', packet(pdf(''), { extension: 'pdf' }));
  assert.equal(result.status, 422);
  assert.equal(result.body.code, 'unreadable_text');
  const pasted = await call('analyze', { text: cv, job: jd });
  assert.equal(pasted.status, 200); assert.equal(pasted.body.result.format, 'Text');
});

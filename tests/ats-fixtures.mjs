import { zipSync, strToU8 } from 'fflate';
export const cv = `Amira Malik
Data Analyst
amira.malik@example.org
Summary
Analyst who builds reliable reporting workflows and helps operations teams interpret trends in customer activity.
Skills
SQL, Python, Excel, Tableau
Experience
Data Analyst — Northline Services
2022 – Present
- Built data dashboards in Tableau for recurring operations reviews.
- Automated weekly reporting with Python and reduced manual review time by 20%.
- Reviewed inventory reports to resolve inconsistent records.
Education
Bachelor of Science, University of Greenfield
Statistics, 2022`;
export const jd = 'Requirements\nSQL and Python are required.\nExperience with inventory management and Kubernetes.\nCreate data visualization reports.\nBenefits\nAWS course subscription for all employees.';
const xmlns = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const types = '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>';
const rels = '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>';
const xml = str => str.replaceAll('&', '&amp;').replaceAll('<', '&lt;');
export function docx({ text = cv, table = true, padding = 0, override } = {}) {
  const body = text.split('\n').map(l => `<w:p><w:r><w:t>${xml(l)}</w:t></w:r></w:p>`).join('');
  const extras = table ? '<w:tbl><w:tr><w:tc><w:p><w:r><w:t>Optional context</w:t></w:r></w:p></w:tc></w:tr></w:tbl><w:sectPr><w:cols w:num="2"/></w:sectPr>' : '';
  return Buffer.from(zipSync({ '[Content_Types].xml': strToU8(types), '_rels/.rels': strToU8(rels), 'word/document.xml': strToU8(override ?? `<w:document xmlns:w="${xmlns}"><w:body>${body}${extras}</w:body></w:document>`), ...(padding ? { 'word/media/image.png': [new Uint8Array(padding), { level: 0 }] } : {}) }));
}
export function pdf(text = cv) {
  const content = 'BT /F1 11 Tf 50 790 Td\n' + text.replace(/[^\x20-\x7e\n]/g, '-').split('\n').map((l, i) => `${i ? '0 -18 Td ' : ''}(${l.replace(/[()\\]/g, '\\$&')}) Tj\n`).join('') + 'ET\n';
  const objs = ['<< /Type /Catalog /Pages 2 0 R >>', '<< /Type /Pages /Kids [3 0 R] /Count 1 >>', '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>', `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}endstream`];
  let data = '%PDF-1.4\n'; const offsets = [0];
  objs.forEach((body, i) => { offsets.push(data.length); data += `${i + 1} 0 obj\n${body}\nendobj\n`; });
  const at = data.length;
  data += `xref\n0 ${offsets.length}\n0000000000 65535 f \n` + offsets.slice(1).map(n => `${String(n).padStart(10, '0')} 00000 n \n`).join('') + `trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${at}\n%%EOF\n`;
  return Buffer.from(data);
}

export function odt(text = cv, mime = 'application/vnd.oasis.opendocument.text') {
  const content = `<office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"><office:body><office:text>${text.split('\n').map(l => `<text:p>${xml(l)}</text:p>`).join('')}</office:text></office:body></office:document-content>`;
  return Buffer.from(zipSync({ mimetype: [strToU8(mime), { level: 0 }], 'content.xml': strToU8(content) }));
}

// Minimal Word 97–2003 OLE fixture, with regular 4 KiB streams and one Unicode text piece.
export function legacyDoc(text = cv) {
  const header = Buffer.alloc(512);
  Buffer.from('d0cf11e0a1b11ae1', 'hex').copy(header);
  [0x3e, 3, 0xfffe, 9, 6].forEach((n, i) => header.writeUInt16LE(n, 24 + 2 * i));
  header.writeUInt32LE(1, 44); header.writeInt32LE(1, 48);
  header.writeUInt32LE(4096, 56); header.writeInt32LE(-2, 60); header.writeInt32LE(-2, 68);
  header.fill(0xff, 76); header.writeInt32LE(0, 76);
  const fat = Buffer.alloc(512, 0xff); fat.writeInt32LE(-3, 0); fat.writeInt32LE(-2, 4);
  for (let i = 2; i < 18; i++) fat.writeInt32LE(i === 9 || i === 17 ? -2 : i + 1, i * 4);
  const dir = Buffer.alloc(512);
  const entry = (n, label, type, sector, child, right, size) => {
    const at = n * 128;
    dir.write(label, at, 'utf16le'); dir.writeUInt16LE((label.length + 1) * 2, at + 64);
    dir[at + 66] = type; dir[at + 67] = 1;
    dir.writeInt32LE(-1, at + 68); dir.writeInt32LE(right, at + 72); dir.writeInt32LE(child, at + 76);
    dir.writeInt32LE(sector, at + 116); dir.writeUInt32LE(size, at + 120);
  };
  entry(0, 'Root Entry', 5, -2, 2, -1, 0);
  entry(1, 'WordDocument', 2, 2, -1, -1, 4096);
  entry(2, '0Table', 2, 10, -1, 1, 4096);
  const word = Buffer.alloc(4096);
  const body = text.replaceAll('\n', '\r');
  word.writeUInt16LE(0xa5ec, 0); word.writeUInt16LE(0xc1, 2); word.writeUInt32LE(1024, 0x18);
  word.writeUInt32LE(body.length, 0x4c); word.write(body, 1024, 'utf16le');
  const table = Buffer.alloc(4096);
  table[0] = 2; table.writeUInt32LE(16, 1); table.writeUInt32LE(body.length, 9); table.writeUInt32LE(1024, 15);
  return Buffer.concat([header, fat, dir, word, table]);
}

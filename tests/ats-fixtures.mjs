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

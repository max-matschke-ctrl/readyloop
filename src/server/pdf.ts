// PDF-Hilfen (serverseitig).
import { createHash } from 'node:crypto';

/** Minimales gültiges PDF mit einer Textzeile (Platzhalter-Nachweis). */
export function platzhalterPdf(text: string): Uint8Array {
  const sicher = text.replace(/[()\\]/g, ' ').replace(/[^\x20-\x7e]/g, '?');
  const inhalt = `BT /F1 14 Tf 72 760 Td (Readyloop Demo-Nachweis) Tj 0 -24 Td (${sicher}) Tj ET`;
  const objekte = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${inhalt.length} >>\nstream\n${inhalt}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  objekte.forEach((o, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objekte.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) pdf += `${String(off).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objekte.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new TextEncoder().encode(pdf);
}

export function sha256Hex(daten: Uint8Array): string {
  return createHash('sha256').update(daten).digest('hex');
}

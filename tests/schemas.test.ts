import { describe, expect, it } from 'vitest';
import nextConfig from '../next.config';
import { nachweisErfassenSchema, PDF_MAX_BYTES } from '@/domain/schemas';

const MB = 1024 * 1024;

const werte = (pdf: File) => ({
  geraetPruefartId: 'p1',
  pruefdatum: '2026-11-19',
  ergebnis: 'ohne_maengel',
  pruefumfang: 'Wiederkehrende Prüfung',
  prueferName: 'Tobias Berger',
  unterschriftImPdf: 'on',
  pdf,
});
const pdfMit = (bytes: number) => new File([new Uint8Array(bytes)], 'bericht.pdf', { type: 'application/pdf' });

describe('Nachweis-PDF bis 10 MB', () => {
  it('Schema akzeptiert ein PDF über 1 MB (5 MB)', () => {
    expect(nachweisErfassenSchema.safeParse(werte(pdfMit(5 * MB))).success).toBe(true);
  });

  it('Schema akzeptiert genau 10 MB, lehnt mehr ab', () => {
    expect(nachweisErfassenSchema.safeParse(werte(pdfMit(PDF_MAX_BYTES))).success).toBe(true);
    const r = nachweisErfassenSchema.safeParse(werte(pdfMit(PDF_MAX_BYTES + 1)));
    expect(r.success).toBe(false);
  });

  it('Server-Action-Bodylimit liegt über 10 MB (Next-Standard wäre 1 MB)', () => {
    const limit = nextConfig.experimental?.serverActions?.bodySizeLimit;
    expect(limit).toBe('11mb');
    expect(Number.parseInt(String(limit), 10) * MB).toBeGreaterThan(PDF_MAX_BYTES);
  });
});

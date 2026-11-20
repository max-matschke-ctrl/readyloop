import { describe, expect, it } from 'vitest';
import nextConfig from '../next.config';
import {
  betriebsstatusSetzenSchema,
  fristFreigebenSchema,
  gbuDokumentSetzenSchema,
  mitgliedEinladenSchema,
  nachweisErfassenSchema,
  passwortSetzenSchema,
  PDF_MAX_BYTES,
} from '@/domain/schemas';

const MB = 1024 * 1024;

const werte = (pdf: File) => ({
  geraetPruefartId: 'p1',
  pruefdatum: '2026-11-19',
  ergebnis: 'ohne_maengel',
  pruefumfang: 'Wiederkehrende Prüfung',
  prueferName: 'Tobias Berger',
  unterschriftImPdf: 'on',
  pdf,
  fristEmpfehlungMonate: null, // formData.get liefert null für fehlende Felder
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

describe('Frist-Empfehlung im Nachweis (F-13)', () => {
  const mit = (v: string | null) => nachweisErfassenSchema.safeParse({ ...werte(pdfMit(10)), fristEmpfehlungMonate: v });
  it('leer → null, Zahl → Monate', () => {
    expect(mit('').data?.fristEmpfehlungMonate).toBeNull();
    expect(mit(null).data?.fristEmpfehlungMonate).toBeNull();
    expect(mit('6').data?.fristEmpfehlungMonate).toBe(6);
  });
  it('außerhalb 1–120 oder keine ganze Zahl → Fehler', () => {
    for (const v of ['0', '121', '6.5', 'abc']) expect(mit(v).success).toBe(false);
  });
});

describe('Schemas I2 (§5.2)', () => {
  it('GBU-Verweis: nur https, Link nur mit Titel, leerer Titel entfernt', () => {
    expect(gbuDokumentSetzenSchema.safeParse({ geraetPruefartId: 'p1', titel: 'GBU Lager 2025', url: 'https://intranet.example/gbu' }).success).toBe(true);
    expect(gbuDokumentSetzenSchema.safeParse({ geraetPruefartId: 'p1', titel: 'GBU Lager 2025', url: 'http://intranet.example/gbu' }).success).toBe(false);
    expect(gbuDokumentSetzenSchema.safeParse({ geraetPruefartId: 'p1', titel: '', url: 'https://intranet.example/gbu' }).success).toBe(false);
    expect(gbuDokumentSetzenSchema.safeParse({ geraetPruefartId: 'p1', titel: '', url: '' }).data).toMatchObject({ titel: null, url: null });
  });
  it('Einladen: Verantwortlicher ohne Bereich → Fehler am Feld bereichIds; E-Mail normalisiert', () => {
    const r = mitgliedEinladenSchema.safeParse({ email: 'x@example.org', name: 'Max Muster', rolle: 'verantwortlicher', bereichIds: [], prueferTypen: [] });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].path).toEqual(['bereichIds']);
    const ok = mitgliedEinladenSchema.safeParse({ email: ' X@Example.org ', name: 'Max Muster', rolle: 'pruefer', bereichIds: [], prueferTypen: ['efk'] });
    expect(ok.data?.email).toBe('x@example.org');
    expect(mitgliedEinladenSchema.safeParse({ email: 'x@example.org', name: 'Max Muster', rolle: 'mitarbeiter', bereichIds: [], prueferTypen: [] }).success).toBe(true); // I3M: einladbar (F-20)
  });
  it('Passwort: min. 10 Zeichen, Wiederholung gleich', () => {
    expect(passwortSetzenSchema.safeParse({ passwort: 'kurz', passwortWiederholung: 'kurz' }).success).toBe(false);
    expect(passwortSetzenSchema.safeParse({ passwort: 'lang-genug-1', passwortWiederholung: 'anders-1234' }).success).toBe(false);
    expect(passwortSetzenSchema.safeParse({ passwort: 'lang-genug-1', passwortWiederholung: 'lang-genug-1' }).success).toBe(true);
  });
  it('Betriebsstatus: ausgemustert nicht wählbar (F-11)', () => {
    expect(betriebsstatusSetzenSchema.safeParse({ geraetId: 'g1', betriebsstatus: 'ausgemustert', begruendung: null }).success).toBe(false);
    expect(betriebsstatusSetzenSchema.safeParse({ geraetId: 'g1', betriebsstatus: 'ausser_betrieb', begruendung: '' }).success).toBe(true);
  });
  it('Frist freigeben: nachweisId optional (leer → null)', () => {
    expect(fristFreigebenSchema.safeParse({ modus: 'vorschlag', geraetPruefartId: 'p1', nachweisId: '' }).data).toMatchObject({ nachweisId: null });
  });
});

// BE-13: Mapping snake_case ↔ Vertrag (hin und zurück) und Postgres-Fehlertexte.
import { describe, expect, it } from 'vitest';
import type { Anlass, Bereich, FestgelegteFrist, GeraetPruefart, Mangel, Nachweis } from '@/domain/types';
import {
  isoZeit,
  nachweisPfad,
  pgFehlerText,
  vonAnlass,
  vonBereich,
  vonFrist,
  vonGbuDokument,
  vonGeraet,
  vonMangel,
  vonMitgliedschaft,
  vonNachweis,
  vonPruefart,
  zuAnlass,
  zuBenutzer,
  zuBereich,
  zuEreignis,
  zuFrist,
  zuGbuDokument,
  zuGeraet,
  zuKatalog,
  zuMangel,
  zuMitgliedschaft,
  zuNachweis,
  zuPruefart,
  type PruefartZeile,
} from '@/server/repo/supabase/mapping';
import { erzeugeDemoStand } from '@/server/repo/demo/daten';

const stand = erzeugeDemoStand('2026-11-19');

describe('Mapping hin und zurück', () => {
  it('Bereich', () => {
    for (const b of stand.bereiche) expect(zuBereich(vonBereich(b))).toEqual(b);
    const b: Bereich = stand.bereiche[0];
    expect(vonBereich(b)).toMatchObject({ organisation_id: b.organisationId, standort_id: b.standortId });
  });
  it('Gerät inkl. Betriebsstatus', () => {
    for (const g of stand.geraete) expect(zuGeraet(vonGeraet(g))).toEqual(g);
  });
  it('Prüfart mit FestgelegteFrist-Snapshot und GbuDokument', () => {
    for (const p of stand.pruefarten) expect(zuPruefart(vonPruefart(p))).toEqual(p);
    const mitDok = stand.pruefarten.find((p) => p.gbuDokument !== null)!;
    expect(vonPruefart(mitDok)).toMatchObject({ gbu_dokument_titel: 'GBU Lager 2025, Abschn. 3 Regale', gbu_dokument_url: null });
    const herst = stand.pruefarten.find((p) => p.frist?.quelle === 'hersteller')!;
    expect(vonPruefart(herst)).toMatchObject({ frist_quelle: 'hersteller', frist_stufe: 'C', frist_monate: 6, frist_freigegeben_von_name: 'Dr. Jens Hartmann' });
  });
  it('FestgelegteFrist: alle Felder, Zeitpunkt aus Postgres normalisiert', () => {
    const frist: FestgelegteFrist = {
      monate: 12, quelle: 'katalog', stufe: 'A', fundstelle: 'BetrSichV Anh. 3', quelleUrl: 'https://x.example',
      katalogEintragId: 'k1', katalogVersion: 2, begruendung: null,
      freigegebenVon: 'u1', freigegebenVonName: 'Jens', freigegebenAm: '2026-11-19T08:30:00.000Z',
    };
    const p: GeraetPruefart = { ...stand.pruefarten[0], frist };
    const zeile: PruefartZeile = { ...vonPruefart(p), frist_freigegeben_am: '2026-11-19 08:30:00+00' };
    expect(zuFrist(zeile)).toEqual(frist);
    expect(vonFrist(frist)).toEqual({
      frist_monate: 12, frist_quelle: 'katalog', frist_stufe: 'A', frist_fundstelle: 'BetrSichV Anh. 3',
      frist_quelle_url: 'https://x.example', frist_katalog_eintrag_id: 'k1', frist_katalog_version: 2, frist_begruendung: null,
    });
    expect(Object.keys(vonFrist(frist))).not.toContain('frist_freigegeben_von'); // stempelt der Trigger
    expect(zuFrist({ ...zeile, frist_monate: null })).toBeNull();
    expect(vonFrist(null).frist_monate).toBeNull();
  });
  it('GbuDokument', () => {
    expect(zuGbuDokument(vonGbuDokument({ titel: 'GBU', url: 'https://g.example' }))).toEqual({ titel: 'GBU', url: 'https://g.example' });
    expect(zuGbuDokument(vonGbuDokument(null))).toBeNull();
  });
  it('Nachweis mit Pfad, Dateiname, Empfehlung', () => {
    for (const n of stand.nachweise) expect(zuNachweis(vonNachweis(n))).toEqual(n);
    const n: Nachweis = { ...stand.nachweise[0], fristEmpfehlungMonate: 6 };
    expect(vonNachweis(n)).toMatchObject({
      pdf_pfad: `${n.organisationId}/${n.geraetId}/${n.geraetPruefartId}/${n.id}.pdf`,
      pdf_dateiname: n.pdfDateiname,
      frist_empfehlung_monate: 6,
    });
    expect(nachweisPfad(n)).toBe(vonNachweis(n).pdf_pfad);
  });
  it('Mangel in allen Status', () => {
    expect(new Set(stand.maengel.map((m) => m.status))).toEqual(new Set(['offen', 'in_bearbeitung', 'behoben']));
    for (const m of stand.maengel) expect(zuMangel(vonMangel(m))).toEqual(m);
    const behoben = stand.maengel.find((m) => m.status === 'behoben') as Mangel;
    expect(vonMangel(behoben)).toMatchObject({ behoben_am: behoben.behobenAm, behoben_durch: behoben.behobenDurch, nachweis_id: behoben.nachweisId });
  });
  it('Anlass offen und aufgehoben', () => {
    const a: Anlass = stand.anlaesse[0];
    expect(zuAnlass(vonAnlass(a))).toEqual(a);
    const auf: Anlass = { ...a, aufgehobenVon: 'u', aufgehobenVonName: 'Jens', aufgehobenAm: '2026-11-19T10:00:00.000Z', aufhebungsgrund: 'versehentlich erfasst' };
    expect(zuAnlass(vonAnlass(auf))).toEqual(auf);
    expect(zuAnlass({ ...vonAnlass(a), datum: '2026-11-16', erfasst_am: '2026-11-16T11:00:00+00:00' }).erfasstAm).toBe('2026-11-16T11:00:00.000Z');
  });
  it('Mitgliedschaft: Bereiche nur bei VER, Prüfertypen nur bei Prüfern; Benutzername = anzeigename', () => {
    for (const m of stand.mitgliedschaften) {
      const b = stand.benutzer.find((x) => x.id === m.benutzerId)!;
      const z = vonMitgliedschaft(m, b);
      expect(zuMitgliedschaft(z, m.bereichIds)).toEqual(m);
      expect(zuBenutzer(z, b.email)).toEqual(b);
      expect(zuBenutzer(z)).toEqual({ ...b, email: '' }); // Befund I2-5: ohne Admin-RPC keine E-Mail
    }
    const z = vonMitgliedschaft({ ...stand.mitgliedschaften[0], rolle: 'sifa', prueferTypen: [] }, stand.benutzer[0]);
    expect(zuMitgliedschaft({ ...z, pruefer_typen: ['zbp'] }, ['b1']).bereichIds).toEqual([]);
    expect(zuMitgliedschaft({ ...z, pruefer_typen: ['zbp'] }, ['b1']).prueferTypen).toEqual([]);
  });
  it('Katalog und Ereignis', () => {
    const k = stand.katalog[0];
    const zeile = {
      id: k.id, schluessel: k.schluessel, version: k.version, geraetegruppe: k.geraetegruppe, geraetegruppe_label: k.geraetegruppeLabel,
      pruefart: k.pruefart, einsatzort: k.einsatzort, intervall_monate: k.intervallMonate, stufe: k.stufe, fundstelle: k.fundstelle,
      quelle_url: k.quelleUrl, pruefer_typen: k.prueferTypen, hinweis: k.hinweis, freigabestatus: k.freigabestatus,
      freigegeben_von: k.freigegebenVon, freigegeben_am: k.freigegebenAm,
    };
    expect(zuKatalog(zeile)).toEqual(k);
    expect(zuEreignis({ id: 'e', organisation_id: 'o', geraet_id: null, typ: 'mitglied_gespeichert', akteur_id: null, akteur_name: 'System', zeitpunkt: '2026-11-19 10:00:00.123+01', daten: { a: 1 } }))
      .toEqual({ id: 'e', organisationId: 'o', geraetId: null, typ: 'mitglied_gespeichert', akteurId: '', akteurName: 'System', zeitpunkt: '2026-11-19T09:00:00.123Z', daten: { a: 1 } });
  });
  it('isoZeit lehnt Unsinn ab', () => {
    expect(() => isoZeit('kein datum')).toThrow();
  });
});

describe('pgFehlerText', () => {
  it("'23505' → „bereits vorhanden“", () => expect(pgFehlerText('23505')).toContain('bereits vorhanden'));
  it("'42501' → Berechtigung", () => expect(pgFehlerText('42501')).toBe('Keine Berechtigung für diese Aktion.'));
  it("'23514' mit Trigger-Meldung → Meldung durchgereicht", () => {
    expect(pgFehlerText('23514', 'GBU-Frist überschreitet die Herstellerfrist')).toBe('GBU-Frist überschreitet die Herstellerfrist.');
  });
  it("'23514' mit technischer Meldung → allgemeiner Text", () => {
    expect(pgFehlerText('23514', 'new row for relation "x" violates check constraint "y"')).toBe('Die Eingabe verletzt eine fachliche Regel.');
  });
  it('unbekannt → allgemeiner Datenbankfehler', () => expect(pgFehlerText(undefined)).toContain('Datenbankfehler'));
});

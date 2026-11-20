// Vertrag Inkrement 1 + 2 + I3M – siehe docs/backlog.md §3.2, §5.2 und §7.2
import { z } from 'zod';
import {
  ANLASS_ARTEN,
  DEMO_ROLLEN,
  EINLADBARE_ROLLEN,
  EINSATZORTE,
  ERSTERFASSUNG_HERKUNFT,
  ETIKETTEN_MAX,
  GERAETE_KATEGORIEN,
  MANGEL_SCHWEREN,
  PRUEF_ERGEBNISSE,
  PRUEFER_TYPEN,
  WAEHLBARER_BETRIEBSSTATUS,
} from './types';

export const PDF_MAX_BYTES = 10 * 1024 * 1024;

const leerZuNull = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v);
const optText = (max: number) => z.preprocess(leerZuNull, z.string().trim().max(max).nullable());
const isoDate = z.iso.date();
const pflichtId = z.string().min(1);
const optId = z.preprocess(leerZuNull, z.string().min(1).nullable());
const checkbox = z.preprocess((v) => v === 'on', z.boolean());
const email = z.preprocess(
  (v) => (typeof v === 'string' ? v.trim().toLowerCase() : v),
  z.email({ error: 'Bitte eine gültige E-Mail-Adresse angeben.' }),
);
export const PASSWORT_MIN = 10;

/** Relativer Rücksprung; Prüfung auf Sicherheit zusätzlich mit sichererRuecksprung (I3M). */
const ruecksprung = z.preprocess((v) => (v === undefined ? null : v), optText(300)); // fehlendes Feld = null

// I3M: + next (F-20)
export const demoRolleSchema = z.object({ rolle: z.enum(DEMO_ROLLEN), next: ruecksprung });

export const pruefartEingabeSchema = z
  .object({
    katalogSchluessel: z.string().min(1).nullable(),
    bezeichnung: z.string().trim().min(2).max(120),
    herstellerfristMonate: z.number().int().min(1).max(120).nullable(),
    herstellerfristQuelle: z.string().trim().max(200).nullable(),
    letztePruefung: isoDate.nullable(),
    letztePruefungHerkunft: z.enum(ERSTERFASSUNG_HERKUNFT),
  })
  .refine((p) => (p.letztePruefung === null) === (p.letztePruefungHerkunft === 'unbekannt'), {
    message: 'Ohne Datum ist die Herkunft „unbekannt“, mit Datum Prüfbericht oder Plakette.',
    path: ['letztePruefungHerkunft'],
  });
export type PruefartEingabe = z.infer<typeof pruefartEingabeSchema>;

export const geraetAnlegenSchema = z.object({
  bezeichnung: z.string().trim().min(2).max(120),
  inventarnummer: optText(60),
  bereichId: z.string().min(1),
  geraetegruppe: z.string().min(1), // 'sonstiges' erlaubt
  kategorie: z.enum(GERAETE_KATEGORIEN),
  hersteller: optText(120),
  typ: optText(120),
  seriennummer: optText(120),
  baujahr: z.preprocess(leerZuNull, z.coerce.number().int().min(1950).max(2100).nullable()),
  einsatzort: z.preprocess(leerZuNull, z.enum(EINSATZORTE).nullable()),
  pruefartenJson: z
    .string()
    .transform((s, ctx) => {
      try {
        return JSON.parse(s) as unknown;
      } catch {
        ctx.addIssue({ code: 'custom', message: 'Prüfarten unlesbar' });
        return z.NEVER;
      }
    })
    .pipe(z.array(pruefartEingabeSchema).min(1, 'Mindestens eine Prüfart').max(10)),
});
export type GeraetAnlegenEingabe = z.infer<typeof geraetAnlegenSchema>;

export const fristFreigebenSchema = z.discriminatedUnion('modus', [
  z.object({
    modus: z.literal('vorschlag'),
    geraetPruefartId: z.string().min(1),
    nachweisId: optId, // F-13: Bezug auf Nachweis, muss zur selben Prüfart gehören
  }),
  z.object({
    modus: z.literal('gbu'),
    geraetPruefartId: z.string().min(1),
    monate: z.coerce.number().int().min(1).max(120),
    fundstelle: z.string().trim().min(3).max(200),
    begruendung: z.string().trim().min(10).max(1000),
    nachweisId: optId, // F-13
  }),
]);
export type FristFreigebenEingabe = z.infer<typeof fristFreigebenSchema>;

export const nachweisErfassenSchema = z.object({
  geraetPruefartId: z.string().min(1),
  pruefdatum: isoDate, // zusätzlich in der Action: ≤ heute
  ergebnis: z.enum(PRUEF_ERGEBNISSE),
  pruefumfang: z.string().trim().min(3).max(500),
  prueferName: z.string().trim().min(2).max(120),
  unterschriftImPdf: z.literal('on', { error: 'Bitte bestätigen, dass das PDF die Unterschrift enthält.' }).transform(() => true),
  pdf: z.file().min(1, 'PDF fehlt').max(PDF_MAX_BYTES, 'PDF größer als 10 MB').mime('application/pdf'),
  fristEmpfehlungMonate: z.preprocess(leerZuNull, z.coerce.number().int().min(1).max(120).nullable()), // F-13
});
export type NachweisErfassenEingabe = z.infer<typeof nachweisErfassenSchema>;

// ---------- Inkrement 2 (§5.2) ----------

// Auth
// I3M: + next (F-20)
export const anmeldenSchema = z.object({ email, passwort: z.string().min(1, 'Passwort fehlt'), next: ruecksprung });
export const passwortVergessenSchema = z.object({ email });
export const passwortSetzenSchema = z
  .object({
    passwort: z.string().min(PASSWORT_MIN, `Mindestens ${PASSWORT_MIN} Zeichen`).max(72),
    passwortWiederholung: z.string(),
  })
  .refine((d) => d.passwort === d.passwortWiederholung, {
    message: 'Passwörter stimmen nicht überein.',
    path: ['passwortWiederholung'],
  });
export const organisationWaehlenSchema = z.object({ organisationId: pflichtId });
/** Review I2 (Befund 7): Einladungs-/Reset-Link; verifyOtp erst nach Klick auf der Bestätigungsseite. */
export const OTP_TYPEN = ['invite', 'recovery'] as const;
export const otpBestaetigenSchema = z.object({
  token_hash: z.string().trim().min(1).max(2000),
  type: z.enum(OTP_TYPEN),
  next: z.unknown(), // wird per sichererRuecksprung (src/server/pfade.ts) bereinigt
});

// Verwaltung
export const bereichSpeichernSchema = z.object({
  bereichId: optId, // null = neu
  name: z.string().trim().min(2).max(80),
  einsatzort: z.enum(EINSATZORTE),
});
export type BereichSpeichernEingabe = z.infer<typeof bereichSpeichernSchema>;

export const mitgliedEinladenSchema = z
  .object({
    email,
    name: z.string().trim().min(2).max(120),
    rolle: z.enum(EINLADBARE_ROLLEN),
    bereichIds: z.array(pflichtId).max(50), // formData.getAll
    prueferTypen: z.array(z.enum(PRUEFER_TYPEN)).max(PRUEFER_TYPEN.length), // formData.getAll
  })
  .refine((d) => d.rolle !== 'verantwortlicher' || d.bereichIds.length > 0, {
    message: 'Verantwortliche brauchen mindestens einen Bereich.',
    path: ['bereichIds'],
  });
export type MitgliedEinladenEingabe = z.infer<typeof mitgliedEinladenSchema>;

export const mitgliedAendernSchema = z
  .object({
    mitgliedschaftId: pflichtId,
    name: z.string().trim().min(2).max(120),
    rolle: z.enum(EINLADBARE_ROLLEN),
    bereichIds: z.array(pflichtId).max(50),
    prueferTypen: z.array(z.enum(PRUEFER_TYPEN)).max(PRUEFER_TYPEN.length),
    aktiv: checkbox,
  })
  .refine((d) => d.rolle !== 'verantwortlicher' || d.bereichIds.length > 0, {
    message: 'Verantwortliche brauchen mindestens einen Bereich.',
    path: ['bereichIds'],
  });
export type MitgliedAendernEingabe = z.infer<typeof mitgliedAendernSchema>;
// Dienst normalisiert: bereichIds nur bei 'verantwortlicher', prueferTypen nur bei 'pruefer', sonst [].

// Geräte und Prüfarten
export const prueferZuweisenSchema = z.object({ geraetPruefartId: pflichtId, prueferId: optId }); // null = Zuweisung entfernen
export type PrueferZuweisenEingabe = z.infer<typeof prueferZuweisenSchema>;

export const gbuDokumentSetzenSchema = z
  .object({
    geraetPruefartId: pflichtId,
    titel: optText(200), // null = Verweis entfernen
    url: z.preprocess(leerZuNull, z.url({ protocol: /^https$/, error: 'Nur https-Links.' }).max(500).nullable()),
  })
  .refine((d) => d.titel !== null || d.url === null, { message: 'Link nur mit Titel.', path: ['titel'] });
export type GbuDokumentSetzenEingabe = z.infer<typeof gbuDokumentSetzenSchema>;

export const betriebsstatusSetzenSchema = z.object({
  geraetId: pflichtId,
  betriebsstatus: z.enum(WAEHLBARER_BETRIEBSSTATUS),
  begruendung: optText(500),
});
export type BetriebsstatusSetzenEingabe = z.infer<typeof betriebsstatusSetzenSchema>;

export const geraetVerschiebenSchema = z.object({ geraetId: pflichtId, bereichId: pflichtId, begruendung: optText(500) });
export type GeraetVerschiebenEingabe = z.infer<typeof geraetVerschiebenSchema>;

// Anlass
export const anlassErfassenSchema = z.object({
  geraetId: pflichtId,
  geraetPruefartIds: z.array(pflichtId).min(1, 'Mindestens eine Prüfart wählen.').max(10), // formData.getAll
  art: z.enum(ANLASS_ARTEN),
  datum: isoDate, // zusätzlich im Dienst: ≤ heute
  beschreibung: z.string().trim().min(5).max(1000),
});
export type AnlassErfassenEingabe = z.infer<typeof anlassErfassenSchema>;

export const anlassAufhebenSchema = z.object({ anlassId: pflichtId, grund: z.string().trim().min(10).max(500) });
export type AnlassAufhebenEingabe = z.infer<typeof anlassAufhebenSchema>;

// Mängel
export const mangelErfassenSchema = z.object({
  geraetId: pflichtId,
  geraetPruefartId: optId,
  nachweisId: optId,
  beschreibung: z.string().trim().min(5).max(1000),
  schwere: z.enum(MANGEL_SCHWEREN),
  termin: isoDate, // zusätzlich im Dienst: ≥ heute
  verantwortlichId: optId, // Prüfer: immer null
  zurueck: optText(300), // relativer Pfad für Redirect, sonst Default
});
export type MangelErfassenEingabe = z.infer<typeof mangelErfassenSchema>;

export const mangelKenntnisSchema = z.object({ mangelId: pflichtId, verantwortlichId: pflichtId, termin: isoDate });
export type MangelKenntnisEingabe = z.infer<typeof mangelKenntnisSchema>;

export const mangelBehebenSchema = z.object({
  mangelId: pflichtId,
  behobenAm: isoDate, // ≤ heute und ≥ Erfassungsdatum
  behobenDurch: z.string().trim().min(2).max(120),
  behebung: z.string().trim().min(5).max(1000),
});
export type MangelBehebenEingabe = z.infer<typeof mangelBehebenSchema>;

// ---------- Inkrement I3M (§7.2) ----------

// Mitarbeiter
export const geraetAktionSchema = z.object({ geraetId: pflichtId }); // uebernehmen, zurueckgeben, uebernahmeBeenden
export type GeraetAktionEingabe = z.infer<typeof geraetAktionSchema>;
export const mangelMeldenSchema = z.object({
  geraetId: pflichtId,
  schwere: z.enum(MANGEL_SCHWEREN),
  beschreibung: z.string().trim().min(5, 'Mindestens 5 Zeichen').max(1000),
});
export type MangelMeldenEingabe = z.infer<typeof mangelMeldenSchema>;
export const geraeteSucheSchema = z.object({ q: z.string().trim().min(2, 'Mindestens 2 Zeichen').max(80) });

// Verwaltung
export const geraetZuordnenSchema = z.object({ geraetId: pflichtId, benutzerId: optId }); // null = Zuordnung lösen
export type GeraetZuordnenEingabe = z.infer<typeof geraetZuordnenSchema>;
export const etikettErneuernSchema = z.object({
  geraetId: pflichtId,
  bestaetigung: z.literal('on', { error: 'Bitte bestätigen, dass der alte Aufkleber ungültig wird.' }),
});
export type EtikettErneuernEingabe = z.infer<typeof etikettErneuernSchema>;
export const mitarbeiterEinladenSchema = z.object({ email, name: z.string().trim().min(2).max(120) });
export type MitarbeiterEinladenEingabe = z.infer<typeof mitarbeiterEinladenSchema>;

// Etiketten (searchParams, nicht FormData)
export const etikettenFilterSchema = z.object({
  geraetIds: z.array(pflichtId).max(ETIKETTEN_MAX).default([]),
  bereichId: optId,
  kategorie: z.preprocess(leerZuNull, z.enum(GERAETE_KATEGORIEN).nullable()),
});

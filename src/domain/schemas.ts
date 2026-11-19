// Vertrag Inkrement 1 – siehe docs/backlog.md §3.2
import { z } from 'zod';
import {
  DEMO_ROLLEN,
  EINSATZORTE,
  ERSTERFASSUNG_HERKUNFT,
  GERAETE_KATEGORIEN,
  PRUEF_ERGEBNISSE,
} from './types';

export const PDF_MAX_BYTES = 10 * 1024 * 1024;

const leerZuNull = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v);
const optText = (max: number) => z.preprocess(leerZuNull, z.string().trim().max(max).nullable());
const isoDate = z.iso.date();

export const demoRolleSchema = z.object({
  rolle: z.enum(DEMO_ROLLEN),
});

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
  }),
  z.object({
    modus: z.literal('gbu'),
    geraetPruefartId: z.string().min(1),
    monate: z.coerce.number().int().min(1).max(120),
    fundstelle: z.string().trim().min(3).max(200),
    begruendung: z.string().trim().min(10).max(1000),
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
});
export type NachweisErfassenEingabe = z.infer<typeof nachweisErfassenSchema>;

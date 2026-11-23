// Erinnerungslauf (F-36). „heute“ und „jetzt“ kommen als Parameter (Europe/Berlin, injizierbar).
// Ablauf je Organisation: Daten lesen → Plan (rein) → je Empfänger Versand + Posten reservieren → rendern → senden → Status.
// Ein Fehler bei einer Organisation oder einem Empfänger bricht den Lauf nicht ab.
import { randomUUID } from 'node:crypto';
import { istWerktag } from '@/domain/datum';
import { planeErinnerungen, type DigestPlan } from '@/domain/erinnerungen';
import {
  VERSAND_MAX_VERSUCHE,
  type ErinnerungPosten,
  type Id,
  type IsoDate,
  type LaufAusloeser,
  type MailFehlerCode,
  type MailVersand,
  type VersandStatus,
} from '@/domain/types';
import { abmeldeSeitenUrl, abmeldeToken, oneClickUrl } from '../mail/abmelden';
import { siteUrl } from '../mail/index';
import type { MailAdapter, MailSendeErgebnis } from '../mail/types';
import { renderMail } from '../mail/vorlagen';
import type { ErinnerungsSystemRepository } from '../repo/types';
import { planEingabeAus } from './laufdaten';

export interface LaufOptionen {
  heute: IsoDate; // Europe/Berlin, injizierbar
  jetzt: Date;
  ausloeser: LaufAusloeser;
  erzwingen?: boolean; // ignoriert „bereits gelaufen“ und kein_werktag; Idempotenz bleibt
  organisationIds?: Id[]; // Tests
  warte?: (ms: number) => Promise<void>; // Default setTimeout; Tests sofort
}

export type LaufErgebnisStatus = 'fertig' | 'bereits_gelaufen' | 'laeuft_bereits' | 'kein_werktag' | 'nicht_konfiguriert' | 'fehler';

export interface LaufErgebnis {
  status: LaufErgebnisStatus;
  laufId: Id | null;
  organisationen: number;
  mails: number; // erfolgreich (inkl. vorschau)
  fehler: number; // Versände mit Status fehler + Organisationen mit Lesefehler
}

/** Wartezeit vor dem 2. bzw. 3. Versuch (F-36: 1 s, dann 4 s). */
export const WARTEZEITEN_MS = [1_000, 4_000] as const;

const standardWarte = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const ergebnis = (status: LaufErgebnisStatus, laufId: Id | null = null, organisationen = 0, mails = 0, fehler = 0): LaufErgebnis => ({
  status,
  laufId,
  organisationen,
  mails,
  fehler,
});

/** Senden mit bis zu VERSAND_MAX_VERSUCHE Versuchen; nur vorübergehende Fehler werden wiederholt. */
async function sendeMitWiederholung(
  senden: () => Promise<MailSendeErgebnis>,
  warte: (ms: number) => Promise<void>,
): Promise<{ ergebnis: MailSendeErgebnis; versuche: number }> {
  let versuche = 0;
  for (;;) {
    versuche += 1;
    let e: MailSendeErgebnis;
    try {
      e = await senden();
    } catch {
      e = { ok: false, fehlerCode: 'netzwerk', wiederholbar: true };
    }
    if (e.ok || !e.wiederholbar || versuche >= VERSAND_MAX_VERSUCHE) return { ergebnis: e, versuche };
    await warte(WARTEZEITEN_MS[versuche - 1] ?? WARTEZEITEN_MS[WARTEZEITEN_MS.length - 1]);
  }
}

function versandAus(digest: DigestPlan, organisationId: Id, laufId: Id, heute: IsoDate, jetzt: string): { versand: MailVersand; posten: ErinnerungPosten[] } {
  const id = randomUUID();
  return {
    versand: {
      id,
      organisationId,
      laufId,
      laufDatum: heute,
      art: digest.art,
      empfaengerBenutzerId: digest.empfaenger.benutzerId,
      status: 'vorbereitet',
      versuche: 0,
      anbieterId: null,
      fehlerCode: null,
      postenAnzahl: digest.posten.length,
      erstelltAm: jetzt,
      versendetAm: null,
      statusAm: jetzt,
    },
    posten: digest.posten.map((p) => ({
      id: randomUUID(),
      organisationId,
      versandId: id,
      schluessel: p.schluessel,
      art: p.art,
      stufe: p.stufe,
      geraetId: p.geraetId,
      geraetPruefartId: p.geraetPruefartId,
      bereichId: p.bereichId,
      bezugDatum: p.bezugDatum,
      rolle: p.rolle,
      empfaengerBenutzerId: digest.empfaenger.benutzerId,
      erstelltAm: jetzt,
    })),
  };
}

export async function fuehreErinnerungslaufAus(
  repo: ErinnerungsSystemRepository,
  adapter: MailAdapter | null,
  opt: LaufOptionen,
): Promise<LaufErgebnis> {
  if (adapter === null) return ergebnis('nicht_konfiguriert');
  if (!istWerktag(opt.heute) && !opt.erzwingen) return ergebnis('kein_werktag');
  const warte = opt.warte ?? standardWarte;
  const jetzt = opt.jetzt.toISOString();

  const start = await repo.starteLauf({ laufDatum: opt.heute, ausloeser: opt.ausloeser, erzwingen: opt.erzwingen ?? false, jetzt });
  if (start.ergebnis === 'bereits_gelaufen') return ergebnis('bereits_gelaufen');
  if (start.ergebnis === 'laeuft') return ergebnis('laeuft_bereits');
  const laufId = start.lauf.id;

  let organisationen = 0;
  let mails = 0;
  let fehler = 0;
  try {
    const orgIds = opt.organisationIds ?? (await repo.listeOrganisationIds());
    for (const organisationId of orgIds) {
      organisationen += 1;
      try {
        const daten = await repo.holeLaufDaten(organisationId, opt.heute);
        const digests = planeErinnerungen(planEingabeAus(daten, opt.heute));
        for (const digest of digests) {
          const { versand, posten } = versandAus(digest, organisationId, laufId, opt.heute, jetzt);
          if (!(await repo.reserviereVersand({ versand, posten }))) continue; // schon versandt heute (F-33/F-36)

          let status: VersandStatus;
          let versuche = 0;
          let anbieterId: string | null = null;
          let fehlerCode: MailFehlerCode | null = null;
          try {
            const token =
              digest.abbestellbar && (digest.art === 'pruefer_woche' || digest.art === 'ma_hinweis')
                ? abmeldeToken({ organisationId, benutzerId: digest.empfaenger.benutzerId, art: digest.art })
                : null;
            const inhalt = renderMail(digest, {
              organisationName: daten.organisation.name,
              siteUrl: siteUrl(),
              laufDatum: opt.heute,
              abmeldung: token ? { seitenUrl: abmeldeSeitenUrl(token), oneClickUrl: oneClickUrl(token) } : null,
            });
            const gesendet = await sendeMitWiederholung(
              () =>
                adapter.senden(
                  { ...inhalt, an: digest.empfaenger.email, idempotenzSchluessel: versand.id },
                  { organisationName: daten.organisation.name, art: digest.art, laufDatum: opt.heute },
                ),
              warte,
            );
            versuche = gesendet.versuche;
            if (gesendet.ergebnis.ok) {
              status = adapter.modus === 'vorschau' ? 'vorschau' : 'versendet';
              anbieterId = gesendet.ergebnis.anbieterId;
            } else {
              status = 'fehler';
              fehlerCode = gesendet.ergebnis.fehlerCode;
            }
          } catch {
            // Rendern/Token fehlgeschlagen (z. B. Secret fehlt): nicht senden, Posten kommen am nächsten Werktag erneut.
            status = 'fehler';
            fehlerCode = 'konfiguration';
            console.warn('[erinnerungen] Mail konnte nicht erstellt werden → konfiguration');
          }
          await repo.setzeVersandStatus({ versandId: versand.id, status, versuche, anbieterId, fehlerCode, jetzt });
          if (status === 'fehler') fehler += 1;
          else mails += 1;
        }
      } catch {
        fehler += 1;
        console.warn('[erinnerungen] Organisation übersprungen (Fehler beim Lesen oder Schreiben)');
      }
    }
    await repo.beendeLauf({ laufId, status: 'fertig', jetzt });
  } catch {
    await repo.beendeLauf({ laufId, status: 'fehler', jetzt }).catch(() => undefined);
    return ergebnis('fehler', laufId, organisationen, mails, fehler);
  }
  try {
    await repo.pseudonymisiereMaHinweise(opt.jetzt);
  } catch {
    console.warn('[erinnerungen] Pseudonymisierung fehlgeschlagen');
  }
  return ergebnis('fertig', laufId, organisationen, mails, fehler);
}

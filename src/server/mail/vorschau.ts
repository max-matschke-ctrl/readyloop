// Vorschau-Adapter (F-37): Mails nur im Speicher des Server-Prozesses, nie versendet, nie in der DB.
import { randomUUID } from 'node:crypto';
import type { VorschauMail } from '@/domain/types';
import type { GerenderteMail, MailAdapter, MailMeta, MailSendeErgebnis } from './types';

export const VORSCHAU_MAX = 200;

const SPEICHER = globalThis as typeof globalThis & { __readyloopVorschauMails?: VorschauMail[] };

function speicher(): VorschauMail[] {
  SPEICHER.__readyloopVorschauMails ??= [];
  return SPEICHER.__readyloopVorschauMails;
}

export function vorschauAdapter(): MailAdapter {
  return {
    modus: 'vorschau',
    async senden(mail: GerenderteMail, meta: MailMeta): Promise<MailSendeErgebnis> {
      const id = randomUUID();
      const liste = speicher();
      liste.push({
        id,
        erstelltAm: new Date().toISOString(),
        laufDatum: meta.laufDatum,
        organisationName: meta.organisationName,
        art: meta.art,
        an: mail.an,
        betreff: mail.betreff,
        text: mail.text,
        html: mail.html,
        listUnsubscribe: mail.kopfzeilen['List-Unsubscribe'] ?? null,
      });
      if (liste.length > VORSCHAU_MAX) liste.splice(0, liste.length - VORSCHAU_MAX);
      return { ok: true, anbieterId: `vorschau-${id}` };
    },
  };
}

/** Neueste zuerst; optional nur einer Organisation. */
export function listeVorschauMails(organisationName?: string): VorschauMail[] {
  return speicher()
    .filter((m) => organisationName === undefined || m.organisationName === organisationName)
    .slice()
    .reverse()
    .map((m) => ({ ...m }));
}

/** Nur Tests. */
export function leereVorschau(): void {
  speicher().length = 0;
}

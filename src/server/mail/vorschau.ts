// Vorschau-Adapter (F-37): Mails nur im Speicher des Server-Prozesses, nie versendet. Der Inhalt steht nie in der DB;
// im Supabase-Modus schreibt der Vorschau-Lauf auch keine Versanddatensätze (Trockenlauf, F-33).
import { randomUUID } from 'node:crypto';
import type { Id, VorschauMail } from '@/domain/types';
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
        organisationId: meta.organisationId,
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

/** Neueste zuerst; optional nur einer Organisation (nach ID – Namen sind nicht eindeutig). */
export function listeVorschauMails(organisationId?: Id): VorschauMail[] {
  return speicher()
    .filter((m) => organisationId === undefined || m.organisationId === organisationId)
    .slice()
    .reverse()
    .map((m) => ({ ...m }));
}

/** Nur Tests. */
export function leereVorschau(): void {
  speicher().length = 0;
}

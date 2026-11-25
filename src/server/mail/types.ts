// Vertrag §9.5 – Mail-Adapter (F-37). Mails entstehen nur serverseitig und gehen nur über MailAdapter.
import type { Id, IsoDate, MailArt, MailFehlerCode } from '@/domain/types';

export interface GerenderteMail {
  an: string;
  betreff: string;
  text: string;
  html: string;
  kopfzeilen: Record<string, string>; // z. B. List-Unsubscribe, List-Unsubscribe-Post, X-Readyloop-Art
  idempotenzSchluessel: string; // = MailVersand.id
}

export type MailSendeErgebnis =
  | { ok: true; anbieterId: string }
  | { ok: false; fehlerCode: MailFehlerCode; wiederholbar: boolean };

export interface MailMeta {
  organisationId: Id;
  organisationName: string;
  art: MailArt;
  laufDatum: IsoDate;
}

export interface MailAdapter {
  readonly modus: 'resend' | 'vorschau';
  senden(mail: GerenderteMail, meta: MailMeta): Promise<MailSendeErgebnis>;
}

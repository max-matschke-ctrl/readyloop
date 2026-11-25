// Resend-Adapter (F-37) über die HTTPS-API mit fetch – keine zusätzliche Abhängigkeit.
// Logs enthalten nur HTTP-Status und Fehlercode, nie Adresse, Betreff oder Inhalt.
import type { MailFehlerCode } from '@/domain/types';
import type { GerenderteMail, MailAdapter, MailSendeErgebnis } from './types';

export const RESEND_URL = 'https://api.resend.com/emails';
const TIMEOUT_MS = 10_000;

function fehler(fehlerCode: MailFehlerCode, wiederholbar: boolean, status: number | null): MailSendeErgebnis {
  console.warn(`[mail] Resend: ${status ?? 'ohne Antwort'} → ${fehlerCode}`);
  return { ok: false, fehlerCode, wiederholbar };
}

/** 422 mit Adressbezug (Empfänger/Absender ungültig) → ungueltige_adresse; sonst abgelehnt. */
async function hatAdressbezug(antwort: Response): Promise<boolean> {
  try {
    const daten = (await antwort.json()) as { name?: unknown; message?: unknown };
    const text = `${typeof daten.name === 'string' ? daten.name : ''} ${typeof daten.message === 'string' ? daten.message : ''}`;
    return /\bto\b|e-?mail|address|recipient/i.test(text);
  } catch {
    return false;
  }
}

export function resendAdapter(opt: {
  apiKey: string;
  absender: string;
  antwortAn?: string | null;
  fetchFn?: typeof fetch;
  timeoutMs?: number;
}): MailAdapter {
  const fetchFn = opt.fetchFn ?? fetch;
  const timeoutMs = opt.timeoutMs ?? TIMEOUT_MS;
  return {
    modus: 'resend',
    async senden(mail: GerenderteMail): Promise<MailSendeErgebnis> {
      const body: Record<string, unknown> = {
        from: opt.absender,
        to: [mail.an],
        subject: mail.betreff,
        html: mail.html,
        text: mail.text,
        headers: mail.kopfzeilen,
      };
      if (opt.antwortAn) body.reply_to = opt.antwortAn;
      let antwort: Response;
      try {
        antwort = await fetchFn(RESEND_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${opt.apiKey}`,
            'Content-Type': 'application/json',
            'Idempotency-Key': mail.idempotenzSchluessel,
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(timeoutMs),
        });
      } catch {
        return fehler('netzwerk', true, null);
      }
      const { status } = antwort;
      if (status >= 200 && status < 300) {
        try {
          const daten = (await antwort.json()) as { id?: unknown };
          if (typeof daten.id === 'string' && daten.id !== '') return { ok: true, anbieterId: daten.id };
        } catch {
          // fällt durch
        }
        return fehler('anbieter_fehler', true, status);
      }
      if (status === 429) return fehler('rate_limit', true, status);
      if (status >= 500) return fehler('anbieter_fehler', true, status);
      if (status === 401 || status === 403) return fehler('konfiguration', false, status);
      if (status === 422 && (await hatAdressbezug(antwort))) return fehler('ungueltige_adresse', false, status);
      return fehler('abgelehnt', false, status);
    },
  };
}

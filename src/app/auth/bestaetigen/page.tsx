// Review I2 (Befund 7): Bestätigungsseite für Einladungs- und Reset-Links.
// Der Token wird erst per POST (Klick) über die Server Action bestaetigeOtp eingelöst, damit
// Mail-Scanner und Link-Vorschauen ihn beim GET nicht verbrauchen. Prüfung und Bereinigung von next: Server.
import type { Metadata } from 'next';
import Link from 'next/link';
import { bestaetigeOtp } from '@/server/actions';

export const metadata: Metadata = { title: 'Link bestätigen', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

type SuchParams = Promise<Record<string, string | string[] | undefined>>;
type OtpTyp = 'invite' | 'recovery';

const TEXTE: Record<OtpTyp, { titel: string; erklaerung: string; button: string }> = {
  invite: {
    titel: 'Einladung annehmen',
    erklaerung:
      'Sie wurden zu Readyloop eingeladen. Bestätigen Sie die Einladung; anschließend legen Sie Ihr Passwort fest.',
    button: 'Einladung annehmen',
  },
  recovery: {
    titel: 'Passwort zurücksetzen',
    erklaerung: 'Sie haben ein neues Passwort angefordert. Bestätigen Sie den Link; anschließend legen Sie ein neues Passwort fest.',
    button: 'Weiter zum neuen Passwort',
  },
};

function einzeln(wert: string | string[] | undefined): string | undefined {
  return typeof wert === 'string' && wert.length > 0 ? wert : undefined;
}

export default async function BestaetigenSeite({ searchParams }: { searchParams: SuchParams }) {
  const sp = await searchParams;
  const tokenHash = einzeln(sp.token_hash);
  const typRoh = einzeln(sp.type);
  const typ: OtpTyp | undefined = typRoh === 'invite' || typRoh === 'recovery' ? typRoh : undefined;
  const next = einzeln(sp.next) ?? '';
  const text = typ ? TEXTE[typ] : undefined;

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <p className="font-display text-2xl font-bold">Readyloop</p>
      <div className="karte mt-6 space-y-4 p-5">
        {tokenHash && text && typ ? (
          <>
            <h1 className="text-lg font-semibold">{text.titel}</h1>
            <p className="text-sm text-steel">{text.erklaerung}</p>
            <form action={bestaetigeOtp}>
              <input type="hidden" name="token_hash" value={tokenHash} />
              <input type="hidden" name="type" value={typ} />
              <input type="hidden" name="next" value={next} />
              <button type="submit" className="btn btn-primaer w-full">
                {text.button}
              </button>
            </form>
            <p className="text-xs text-steel">Der Link ist nur einmal verwendbar und läuft nach kurzer Zeit ab.</p>
          </>
        ) : (
          <>
            <h1 className="text-lg font-semibold">Link unvollständig</h1>
            <p role="alert" className="rounded border border-brick/50 bg-brick/10 px-3 py-2 text-sm">
              <span aria-hidden="true" className="mr-1 font-bold">
                ✕
              </span>
              Der Link ist unvollständig oder ungültig. Bitte fordern Sie einen neuen Link an.
            </p>
            <p className="text-sm">
              <Link href="/login" className="link">
                ← Zur Anmeldung
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}

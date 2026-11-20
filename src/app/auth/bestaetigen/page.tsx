// Review I2 (Befund 7): Bestätigungsseite für Einladungs- und Reset-Links.
// Der Token wird erst per POST (Klick) über die Server Action bestaetigeOtp eingelöst, damit
// Mail-Scanner und Link-Vorschauen ihn beim GET nicht verbrauchen. Prüfung und Bereinigung von next: Server.
import type { Metadata } from 'next';
import Link from 'next/link';
import { AuthRahmen } from '@/components/AuthRahmen';
import { Meldung } from '@/components/Meldung';
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

  if (tokenHash && text && typ) {
    return (
      <AuthRahmen titel={text.titel} text={text.erklaerung}>
        <form action={bestaetigeOtp}>
          <input type="hidden" name="token_hash" value={tokenHash} />
          <input type="hidden" name="type" value={typ} />
          <input type="hidden" name="next" value={next} />
          <button type="submit" className="btn btn-primaer w-full">
            {text.button}
          </button>
        </form>
        <p className="text-xs text-steel">Der Link ist nur einmal verwendbar und läuft nach kurzer Zeit ab.</p>
      </AuthRahmen>
    );
  }

  return (
    <AuthRahmen titel="Link unvollständig">
      <Meldung art="fehler" text="Bitte fordern Sie einen neuen Link an.">
        Der Link ist unvollständig oder ungültig.
      </Meldung>
      <Link href="/login" className="btn btn-sekundaer">
        Zur Anmeldung
      </Link>
    </AuthRahmen>
  );
}

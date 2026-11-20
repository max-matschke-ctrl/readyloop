import type { Metadata } from 'next';
import { AppHeader } from '@/components/AppHeader';
import { GeraeteSucheForm } from '@/components/GeraeteSucheForm';
import { Leerzustand } from '@/components/Leerzustand';
import { MeinGeraetKarte } from '@/components/MeinGeraetKarte';
import { Seitenkopf } from '@/components/Seitenkopf';
import type { GeraetKurzansicht } from '@/domain/types';
import { erfordereSitzung, sucheGeraete } from '@/server/data';

export const metadata: Metadata = { title: 'Gerät suchen' };
export const dynamic = 'force-dynamic';

type SuchParams = Promise<Record<string, string | string[] | undefined>>;

const MAX_TREFFER = 50;

/** Rücksprung für „Mangel melden“: nur einfache Suchbegriffe, die der Server als sicheren Pfad akzeptiert. */
function rueckFuer(q: string): string {
  return /^[a-z0-9-]{2,40}$/i.test(q) ? `/meine-geraete/suchen?q=${q}` : '/meine-geraete/suchen';
}

/** Gerät suchen (US-28, §8.14): am Büro-PC der Weg statt Kamera; Treffer zeigen nie Namen anderer Halter. */
export default async function GeraetSuchenSeite({ searchParams }: { searchParams: SuchParams }) {
  const sitzung = await erfordereSitzung('geraet.suchen');
  const sp = await searchParams;
  const q = (typeof sp.q === 'string' ? sp.q : '').trim().slice(0, 80);
  const zuKurz = q.length > 0 && q.length < 2;
  const treffer: GeraetKurzansicht[] = q.length >= 2 ? await sucheGeraete(q) : [];

  let ergebnis = '';
  if (zuKurz) ergebnis = 'Bitte mindestens 2 Zeichen eingeben.';
  else if (q.length >= 2 && treffer.length >= MAX_TREFFER) ergebnis = `Die ersten ${MAX_TREFFER} Geräte. Suchbegriff genauer eingeben.`;
  else if (q.length >= 2 && treffer.length > 0) {
    ergebnis = `${treffer.length === 1 ? '1 Gerät' : `${treffer.length} Geräte`} für „${q}“`;
  }

  return (
    <>
      <AppHeader sitzung={sitzung} aktiv="suchen" />
      <main className="mx-auto max-w-[40rem] space-y-6 px-4 py-6 md:px-6 lg:max-w-[64rem]">
        <Seitenkopf
          pfad={[{ label: 'Meine Geräte', href: '/meine-geraete' }, { label: 'Gerät suchen' }]}
          titel="Gerät suchen"
          kontext={`Alle Geräte von ${sitzung.organisation.name}.`}
        />
        <div className="max-w-[40rem]">
          <GeraeteSucheForm q={q} />
        </div>
        <p aria-live="polite" className="text-sm text-ink">
          {ergebnis}
        </p>
        {q.length >= 2 && treffer.length === 0 && (
          <Leerzustand
            art="filter"
            titel={`Kein Gerät gefunden für „${q}“.`}
            text={<p className="text-base text-ink">Prüfen Sie die Schreibweise oder suchen Sie nach der Inventarnummer auf dem Aufkleber.</p>}
          />
        )}
        {treffer.length > 0 && (
          <ul className="space-y-3" aria-label="Suchergebnis">
            {treffer.map((g) => (
              <MeinGeraetKarte key={g.geraetId} geraet={g} variante="treffer" zurueck={rueckFuer(q)} />
            ))}
          </ul>
        )}
      </main>
    </>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { AppHeader } from '@/components/AppHeader';
import { ErinnerungenNav } from '@/components/ErinnerungenNav';
import { FilterChips, type FilterChip } from '@/components/FilterChips';
import { Leerzustand } from '@/components/Leerzustand';
import { MailModusMeldung } from '@/components/MailModusMeldung';
import { Meldung } from '@/components/Meldung';
import { ProtokollFilterLeiste } from '@/components/ProtokollFilterLeiste';
import { ProtokollTabelle } from '@/components/ProtokollTabelle';
import { Seitenkopf } from '@/components/Seitenkopf';
import { plusTage, uhrzeit } from '@/components/erinnerung-format';
import { datum } from '@/components/format';
import { can } from '@/domain/rechte';
import { protokollFilterSchema } from '@/domain/schemas';
import { MAIL_ART_LABEL, VERSAND_STATUS_LABEL, type ProtokollFilter, type ProtokollSeite } from '@/domain/types';
import { erfordereSitzung, heute, listeBereiche, listeMailProtokoll } from '@/server/data';

export const metadata: Metadata = { title: 'Versandprotokoll' };

type SuchParams = Promise<Record<string, string | string[] | undefined>>;
type Roh = Record<string, string>;

const BASIS = '/erinnerungen/protokoll';
const FELDER = ['von', 'bis', 'status', 'art', 'bereich', 'seite'] as const;

/** Ungültige oder leere Werte fallen einzeln auf den Default zurück, ohne Fehlerseite (§8.22). */
function leseFilter(sp: Record<string, string | string[] | undefined>): { filter: ProtokollFilter; roh: Roh } {
  const roh: Roh = {};
  for (const f of FELDER) {
    const v = Array.isArray(sp[f]) ? sp[f][0] : sp[f];
    if (typeof v !== 'string' || v.trim() === '') continue;
    if (protokollFilterSchema.shape[f].safeParse(v.trim()).success) roh[f] = v.trim();
  }
  const p = protokollFilterSchema.parse(roh);
  return { filter: { von: p.von, bis: p.bis, status: p.status, art: p.art, bereichId: p.bereich, seite: p.seite }, roh };
}

function href(roh: Roh, ohne: string[] = [], seite?: number): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(roh)) if (!ohne.includes(k) && k !== 'seite') sp.set(k, v);
  if (seite && seite > 1) sp.set('seite', String(seite));
  const s = sp.toString();
  return s ? `${BASIS}?${s}` : BASIS;
}

function LetzterLauf({ lauf }: { lauf: ProtokollSeite['letzterLauf'] }) {
  if (!lauf) return <p className="text-sm">Noch kein Erinnerungslauf.</p>;
  if (lauf.status === 'fehler') {
    return (
      <Meldung art="fehler" text="Nicht versendete Erinnerungen folgen am nächsten Werktag.">
        Der letzte Erinnerungslauf am {datum(lauf.laufDatum)} ist mit Fehler beendet.
      </Meldung>
    );
  }
  if (lauf.status === 'laeuft') {
    return <Meldung art="hinweis">Erinnerungslauf läuft seit {datum(lauf.laufDatum)}.</Meldung>;
  }
  return (
    <p className="text-sm">
      Letzter Erinnerungslauf: <span className="font-mono">{datum(lauf.laufDatum)}</span>
      {lauf.beendetAm && <>, fertig um {uhrzeit(lauf.beendetAm)} Uhr</>}
    </p>
  );
}

/** Versandprotokoll (§8.22, F-41, US-41). ADM und SIF; VER, PRF, MA → 404 (erfordereSitzung). */
export default async function ProtokollSeiteKomponente({ searchParams }: { searchParams: SuchParams }) {
  const sitzung = await erfordereSitzung('erinnerung.protokoll');
  const { filter, roh } = leseFilter(await searchParams);
  const [seite, bereiche] = await Promise.all([listeMailProtokoll(filter), listeBereiche()]);
  const modus = seite.mailModus;
  const f = seite.filter;

  const heuteWert = heute();
  const chips: FilterChip[] = [];
  if (f.von !== plusTage(heuteWert, -30) || f.bis !== heuteWert) {
    chips.push({ name: 'Zeitraum', wert: `${datum(f.von)} – ${datum(f.bis)}`, entfernenHref: href(roh, ['von', 'bis']) });
  }
  if (f.status) {
    chips.push({
      name: 'Status',
      wert: f.status === 'probleme' ? 'Probleme' : VERSAND_STATUS_LABEL[f.status],
      entfernenHref: href(roh, ['status']),
    });
  }
  if (f.art) chips.push({ name: 'Art', wert: MAIL_ART_LABEL[f.art], entfernenHref: href(roh, ['art']) });
  if (f.bereichId) {
    chips.push({
      name: 'Bereich',
      wert: bereiche.find((b) => b.id === f.bereichId)?.name ?? 'unbekannt',
      entfernenHref: href(roh, ['bereich']),
    });
  }

  const seiten = Math.max(1, Math.ceil(seite.gesamt / seite.proSeite));

  return (
    <>
      <AppHeader sitzung={sitzung} aktiv="erinnerungen" />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-6 xl:px-8">
        <div className="space-y-4">
          <Seitenkopf pfad={[]} titel="Versandprotokoll" />
          <ErinnerungenNav
            aktiv="protokoll"
            zeigeEinstellungen={can(sitzung.rolle, 'erinnerung.einstellen')}
            zeigeVorschau={can(sitzung.rolle, 'mail.vorschau') && modus === 'vorschau'}
          />
        </div>
        <div className="space-y-3">
          <LetzterLauf lauf={seite.letzterLauf} />
          <MailModusMeldung modus={modus} mitVorschau />
        </div>

        <section aria-labelledby="protokoll-titel" className="space-y-3">
          <h2 id="protokoll-titel" className="sr-only">
            Mails
          </h2>
          <ProtokollFilterLeiste filter={f} bereiche={bereiche} />
          <FilterChips chips={chips} zuruecksetzenHref={BASIS} />
          <p aria-live="polite" className="text-sm text-steel">
            {seite.gesamt === 1 ? '1 Mail' : `${seite.gesamt} Mails`} vom {datum(f.von)} bis {datum(f.bis)}
          </p>

          {seite.eintraege.length === 0 ? (
            f.status === 'probleme' ? (
              <Leerzustand
                art="erledigt"
                titel="Keine Zustellprobleme."
                text="Alle Mails im Zeitraum wurden versendet oder zugestellt."
              />
            ) : (
              <Leerzustand
                art="leer"
                titel="Keine Mails in diesem Zeitraum."
                text="Erinnerungen gehen werktags morgens raus. Ändern Sie den Zeitraum oder die Filter."
                aktion={
                  <Link href={BASIS} className="btn btn-sekundaer">
                    Filter zurücksetzen
                  </Link>
                }
              />
            )
          ) : (
            <ProtokollTabelle eintraege={seite.eintraege} />
          )}

          {seiten > 1 && (
            <nav aria-label="Seiten" className="flex flex-wrap items-center gap-3 text-sm">
              {seite.seite > 1 && (
                <Link href={href(roh, [], seite.seite - 1)} className="btn btn-sekundaer">
                  Vorherige Seite
                </Link>
              )}
              <span aria-current="page">
                Seite {seite.seite} von {seiten}
              </span>
              {seite.seite < seiten && (
                <Link href={href(roh, [], seite.seite + 1)} className="btn btn-sekundaer">
                  Nächste Seite
                </Link>
              )}
            </nav>
          )}
        </section>
      </main>
    </>
  );
}

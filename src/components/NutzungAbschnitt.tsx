import Link from 'next/link';
import { KATEGORIE_LABEL, type Geraet, type GeraetNutzung, type PersonOption } from '@/domain/types';
import { EtikettErneuernForm } from './EtikettErneuernForm';
import { UebernahmeBeendenForm } from './UebernahmeBeendenForm';
import { UebernahmeVerlauf } from './UebernahmeVerlauf';
import { Unteraufklapper } from './Unteraufklapper';
import { ZuordnungForm } from './ZuordnungForm';
import { zeitpunkt } from './format';

interface Props {
  geraet: Geraet;
  nutzung: GeraetNutzung;
  /** Nur bei personenbezogen und darfZuordnen geladen. */
  mitarbeiterOptionen: PersonOption[];
  darfEinladen: boolean;
  titelKlasse: string;
}

function Zeile({ titel, children }: { titel: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[minmax(0,8rem)_1fr] gap-x-3 py-1.5">
      <dt className="text-sm text-steel">{titel}</dt>
      <dd className="min-w-0 [overflow-wrap:anywhere]">{children}</dd>
    </div>
  );
}

/**
 * Geräteakte: Nutzung und Aufkleber (§8.16, F-22, F-23, F-25, F-27). Für Prüfer nicht vorhanden (nutzung null).
 * Sichtbarkeit kommt vom Server: verlauf nur für Admin, etikett nur mit etikett.verwalten, Formulare nur mit darfZuordnen.
 */
export function NutzungAbschnitt({ geraet, nutzung, mitarbeiterOptionen, darfEinladen, titelKlasse }: Props) {
  const { kategorie } = geraet;
  const kurzUrl = nutzung.etikett?.url.replace(/^https?:\/\//i, '');

  return (
    <section id="nutzung" aria-labelledby="nutzung-titel" className="scroll-mt-16 space-y-3">
      <h2 id="nutzung-titel" className={titelKlasse}>
        Nutzung und Aufkleber
      </h2>
      <div className="karte space-y-4 p-4">
        <dl>
          <Zeile titel="Kategorie">{KATEGORIE_LABEL[kategorie]}</Zeile>
          {kategorie === 'personenbezogen' && (
            <Zeile titel="Zugeordnet an">{nutzung.zugeordnet ? nutzung.zugeordnet.name : 'Niemandem zugeordnet'}</Zeile>
          )}
          {kategorie === 'wechselnd' && (
            <Zeile titel="Genutzt von">
              {nutzung.uebernahme ? (
                <>
                  {nutzung.uebernahme.benutzerName}
                  <span className="block text-sm">
                    seit <span className="font-mono tabular-nums">{zeitpunkt(nutzung.uebernahme.seit)} Uhr</span>
                  </span>
                </>
              ) : (
                'Frei'
              )}
            </Zeile>
          )}
        </dl>

        {kategorie === 'ortsgebunden' && (
          <p className="text-sm text-steel">Ortsgebundene Geräte werden nicht übernommen oder zugeordnet.</p>
        )}

        {kategorie === 'personenbezogen' &&
          nutzung.darfZuordnen &&
          (mitarbeiterOptionen.length > 0 || nutzung.zugeordnet ? (
            <Unteraufklapper
              titel="Zuordnung ändern"
              zusammenfassung={nutzung.zugeordnet ? `Zugeordnet an: ${nutzung.zugeordnet.name}` : 'Niemandem zugeordnet'}
            >
              <ZuordnungForm geraetId={geraet.id} aktuell={nutzung.zugeordnet} optionen={mitarbeiterOptionen} />
            </Unteraufklapper>
          ) : (
            <p className="text-sm text-ink">
              Noch keine Mitarbeiter eingeladen.{' '}
              {darfEinladen && (
                <Link href="/mitarbeiter" className="link">
                  Mitarbeiter einladen
                </Link>
              )}
            </p>
          ))}

        {kategorie === 'wechselnd' && nutzung.darfZuordnen && (
          <UebernahmeBeendenForm geraetId={geraet.id} offen={nutzung.uebernahme !== null} />
        )}

        {nutzung.verlauf.length > 0 && <UebernahmeVerlauf verlauf={nutzung.verlauf} />}

        {nutzung.etikett && (
          <div className="space-y-3 border-t border-steel-200 pt-4">
            <h3 className="font-sans text-[1.0625rem] font-semibold leading-6 tracking-normal text-ink">Aufkleber</h3>
            <p className="font-mono text-sm text-ink [overflow-wrap:anywhere]">
              <span className="sr-only">Adresse des Aufklebers: </span>
              {kurzUrl}
            </p>
            <Link href={`/etiketten?geraet=${geraet.id}`} className="btn btn-sekundaer">
              Etikett drucken
            </Link>
            <Unteraufklapper titel="Aufkleber erneuern">
              <EtikettErneuernForm geraetId={geraet.id} />
            </Unteraufklapper>
          </div>
        )}
      </div>
    </section>
  );
}

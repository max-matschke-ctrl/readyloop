import type { Etikett as EtikettDaten } from '@/domain/types';
import { Pruefplakette } from './Pruefplakette';
import { QrCode } from './QrCode';
import { datum } from './format';

/**
 * Plakette auf dem Etikett. 'statusfarbe' = Ersatzweg ohne Freigabe §9.7 (heutige Plakette, print-color-adjust: exact).
 * FE-15a ergänzt 'druck' (einfarbig, nur Termin, §5.5), sobald Max §9.7 freigibt.
 */
export type EtikettPlakette = 'statusfarbe';

interface Props {
  etikett: EtikettDaten;
  plakette?: EtikettPlakette;
}

/** Monat/Jahr der nächsten Prüfung als Text („03/2027“), die Plakette zeigt dasselbe. */
function monatJahr(faelligAm: string | null): string | null {
  const [j, m] = faelligAm?.split('-') ?? [];
  return j && m ? `${m}/${j}` : null;
}

/** Kurz-URL zweizeilig: Host mit „/g/“ und darunter der Token (abtippbar, falls der QR beschädigt ist). */
function teileUrl(kurzUrl: string): [string, string] {
  const i = kurzUrl.lastIndexOf('/g/');
  return i >= 0 ? [kurzUrl.slice(0, i + 3), kurzUrl.slice(i + 3)] : [kurzUrl, ''];
}

/**
 * QR-Etikett 70 × 37 mm (§6.21): Sicherheitsrand 4/5 mm, links QR 21 mm inkl. Ruhezone und „Aktueller Status:
 * QR scannen“, rechts Plakette 13 mm mit „Nächste Prüfung“, Monat/Jahr, „Stand“, darunter Bezeichnung,
 * Inventarnummer, Betrieb und Kurz-URL. Maße und Schriftgrößen in mm/pt, schwarz auf weiß.
 */
export function Etikett({ etikett: e, plakette = 'statusfarbe' }: Props) {
  const termin = monatJahr(e.faelligAm);
  const [host, token] = teileUrl(e.kurzUrl);
  return (
    <div className="etikett" data-plakette={plakette}>
      <div className="flex h-full gap-[2mm] text-black">
        <div className="flex w-[21mm] shrink-0 flex-col gap-[0.8mm]">
          <QrCode matrix={e.qr} groesseMm={21} label={`QR-Code für ${e.bezeichnung}`} />
          <p className="font-sans text-[6.5pt] font-semibold leading-[1.15]">
            Aktueller Status:
            <br />
            QR scannen
          </p>
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-[13mm] shrink-0 items-center gap-[1.5mm]">
            <div className="etikett-plakette size-[13mm] shrink-0 [&_svg]:size-full">
              <Pruefplakette status={e.status} faelligAm={e.faelligAm} groesse={40} />
            </div>
            <div className="min-w-0 leading-[1.15]">
              <p className="font-sans text-[6pt]">Nächste Prüfung</p>
              {e.status === 'gbu' ? (
                <p className="font-sans text-[6.5pt] font-semibold">Frist über GBU festlegen</p>
              ) : e.status === 'unbekannt' || !termin ? (
                <p className="font-sans text-[6.5pt] font-semibold">Prüfdatum unbekannt</p>
              ) : (
                <p className="font-display text-[11pt] font-semibold tabular-nums leading-none">{termin}</p>
              )}
              <p className="font-sans text-[6pt]">Stand {datum(e.stand)}</p>
            </div>
          </div>
          <p className="mt-[0.6mm] truncate font-sans text-[8pt] font-semibold leading-[1.2]">{e.bezeichnung}</p>
          {e.inventarnummer && <p className="font-mono text-[8pt] font-medium leading-[1.2]">{e.inventarnummer}</p>}
          <p className="truncate font-sans text-[6pt] leading-[1.25]">{e.organisationName}</p>
          <p className="font-mono text-[6pt] leading-[1.2] [overflow-wrap:anywhere]">
            {host}
            <br />
            {token}
          </p>
        </div>
      </div>
    </div>
  );
}

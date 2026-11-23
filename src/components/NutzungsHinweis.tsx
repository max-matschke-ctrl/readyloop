import {
  BETRIEBSSTATUS_LABEL,
  VOR_NUTZUNG_GRUND_LABEL,
  type Betriebsstatus,
  type FristStatus,
  type IsoDate,
  type Nutzung,
  type VorNutzungGrund,
} from '@/domain/types';
import { StatusAmpel } from './StatusAmpel';
import { datum } from './format';

interface Props {
  nutzung: Nutzung;
  gesamtStatus: FristStatus;
  grund: VorNutzungGrund | null;
  betriebsstatus: Betriebsstatus;
  /** Nächste Fälligkeit: „Nächste Prüfung bis …“ (verwendbar) bzw. „Überfällig seit …“. */
  naechsteFaelligkeit: IsoDate | null;
  /** gross: QR-Seite, Mangel melden. kompakt: Kopf der Gerätekarte (§6.17). */
  groesse: 'gross' | 'kompakt';
  className?: string;
}

/** Grund bei „Nicht verwenden“ (§6.17), erste zutreffende Regel. */
function grundText(p: Pick<Props, 'gesamtStatus' | 'grund' | 'betriebsstatus' | 'naechsteFaelligkeit'>): string {
  if (p.betriebsstatus !== 'in_betrieb') return BETRIEBSSTATUS_LABEL[p.betriebsstatus];
  if (p.gesamtStatus === 'ueberfaellig') {
    return p.naechsteFaelligkeit ? `Überfällig seit ${datum(p.naechsteFaelligkeit)}` : 'Überfällig';
  }
  if (p.gesamtStatus === 'vor_nutzung_pruefen' && p.grund) return VOR_NUTZUNG_GRUND_LABEL[p.grund];
  return 'Vor Nutzung prüfen';
}

/** Trenner, der nur für Screenreader und textContent existiert: ergibt die Vertragstexte (§6.17 Wortlaut). */
function Trenner() {
  return <span className="sr-only"> – </span>;
}

function Symbol({ zeichen, kreis, kompakt }: { zeichen: string; kreis: string; kompakt: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-display font-bold leading-none ${kreis} ${
        kompakt ? 'size-7 text-base' : 'size-8 text-lg'
      }`}
    >
      {zeichen}
    </span>
  );
}

/**
 * Nutzungsband (§6.17, §8.12): beantwortet „Darf ich das Gerät benutzen?“ vor allen anderen Inhalten.
 * nicht_verwenden: einzige volle brick-Fläche (E-4); unklar: ochre-50; verwendbar: moss-50.
 * Kompakt und verwendbar: keine Fläche, sondern Statusmarke „✓ Verwendbar“.
 * Semantik: <section aria-label="Nutzung">, Titel als <p>, kein role="status" (nur Meldungen nach Aktionen).
 */
export function NutzungsHinweis({ nutzung, gesamtStatus, grund, betriebsstatus, naechsteFaelligkeit, groesse, className = '' }: Props) {
  const kompakt = groesse === 'kompakt';

  if (kompakt && nutzung === 'verwendbar') {
    return (
      <section aria-label="Nutzung" className={className}>
        <StatusAmpel status="ok" text="Verwendbar" className="py-1 text-sm!" />
        {gesamtStatus === 'bald_faellig' && <span className="ml-2 text-sm text-ink">Prüfung bald fällig.</span>}
      </section>
    );
  }

  const rahmen = kompakt ? 'px-4 py-3' : 'min-h-24 px-5 py-4';
  const titel = kompakt ? 'text-nutzung-kompakt' : 'text-nutzung';
  const folge = kompakt ? 'text-sm' : 'text-base';

  if (nutzung === 'nicht_verwenden') {
    return (
      <section aria-label="Nutzung" className={`band-nicht-verwenden flex items-start gap-3 ${rahmen} ${className}`}>
        <Symbol zeichen="✕" kreis="bg-white text-brick" kompakt={kompakt} />
        <div className="min-w-0">
          <p className={titel}>
            Nicht verwenden
            <Trenner />
          </p>
          <p className={`${folge} font-semibold`}>{grundText({ gesamtStatus, grund, betriebsstatus, naechsteFaelligkeit })}</p>
          <p className={folge}>Gerät nicht benutzen. Verantwortlichen informieren.</p>
        </div>
      </section>
    );
  }

  if (nutzung === 'unklar') {
    return (
      <section aria-label="Nutzung" className={`band-unklar flex items-start gap-3 ${rahmen} ${className}`}>
        <Symbol zeichen="?" kreis="bg-ochre text-ink" kompakt={kompakt} />
        <div className="min-w-0">
          <p className={titel}>
            Prüfstatus unklar
            <Trenner />
          </p>
          {/* textContent „vor Nutzung …“ wie NUTZUNG_LABEL.unklar; sichtbar als Satzanfang groß. */}
          <p className={`${folge} first-letter:uppercase`}>vor Nutzung Verantwortlichen fragen.</p>
        </div>
      </section>
    );
  }

  return (
    <section aria-label="Nutzung" className={`band-verwendbar flex items-start gap-3 ${rahmen} ${className}`}>
      <Symbol zeichen="✓" kreis="bg-moss text-white" kompakt={kompakt} />
      <div className="min-w-0">
        <p className={titel}>Verwendbar</p>
        {naechsteFaelligkeit && (
          <p className={folge}>
            Nächste Prüfung bis <span className="font-mono tabular-nums">{datum(naechsteFaelligkeit)}</span>.
          </p>
        )}
        {gesamtStatus === 'bald_faellig' && <p className={`${folge} font-semibold`}>Prüfung bald fällig.</p>}
      </div>
    </section>
  );
}

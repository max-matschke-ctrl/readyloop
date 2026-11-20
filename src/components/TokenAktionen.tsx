import Link from 'next/link';
import type { TokenSeite } from '@/domain/types';
import { MaAktionen } from './MaAktionen';
import { Meldung } from './Meldung';

/**
 * Aktionen der QR-Seite (§8.12): ohne Sitzung zwei Sekundärbuttons zum Login mit Rücksprung,
 * für Mitarbeiter derselben Organisation die Aktionen der Gerätekarte (§6.19), mit Akte-Recht ein Link
 * „Geräteakte öffnen“, bei fremder Organisation ein Hinweis. Rechte prüft der Server (holeTokenSeite, Actions).
 */
export function TokenAktionen({ seite }: { seite: TokenSeite }) {
  const rueck = `/g/${seite.token}`;

  if (!seite.angemeldet) {
    const login = `/login?next=${encodeURIComponent(rueck)}`;
    return (
      <div className="aktionen-halle">
        {seite.ansicht.kategorie === 'wechselnd' && (
          <Link href={login} className="btn btn-sekundaer btn-halle">
            Anmelden und übernehmen
          </Link>
        )}
        <Link href={login} className="btn btn-sekundaer btn-halle">
          Anmelden und Mangel melden
        </Link>
      </div>
    );
  }

  if (seite.andereOrganisation) {
    return (
      <Meldung art="hinweis" className="text-base!">
        Dieses Gerät gehört zu einem anderen Betrieb.
        <span className="font-normal"> Sie sehen die öffentliche Ansicht.</span>
      </Meldung>
    );
  }

  if (seite.kurz) return <MaAktionen key={seite.kurz.geraetId} kurz={seite.kurz} zurueck={rueck} />;

  if (seite.akteUrl) {
    return (
      <div className="aktionen-halle">
        <Link href={seite.akteUrl} className="btn btn-sekundaer btn-halle">
          Geräteakte öffnen
        </Link>
      </div>
    );
  }
  return null;
}

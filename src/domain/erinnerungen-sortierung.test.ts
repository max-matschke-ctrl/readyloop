// Direkte Tests für vergleichePosten (Reihenfolge der Sammelmail, F-38) und kappePosten (MAIL_MAX_POSTEN, F-33).
import { describe, expect, it } from 'vitest';
import { kappePosten, vergleichePosten, type PostenPlan } from '@/domain/erinnerungen';
import { DRINGLICHKEITEN, MAIL_MAX_POSTEN } from '@/domain/types';

const posten = (p: Partial<PostenPlan> & Pick<PostenPlan, 'schluessel'>): PostenPlan => ({
  art: 'frist',
  stufe: 'v30',
  rolle: 'zustaendig',
  dringlichkeit: 'vorlauf',
  geraetId: 'g',
  geraetPruefartId: 'pa',
  bereichId: 'b',
  bereichName: 'Lager',
  geraetBezeichnung: 'Leiter',
  inventarnummer: null,
  pruefartBezeichnung: 'Sichtprüfung',
  bezugDatum: '2026-12-31',
  faelligAm: '2026-12-31',
  restTage: 30,
  status: 'ok',
  frist: null,
  hinweise: [],
  katalogEntwurf: false,
  pfad: '/geraete/g',
  ...p,
});
const sortiert = (liste: PostenPlan[]) => [...liste].sort(vergleichePosten).map((p) => p.schluessel);

describe('vergleichePosten', () => {
  it('zuerst nach Dringlichkeit in der Reihenfolge DRINGLICHKEITEN – vor Datum und Namen', () => {
    const liste = [...DRINGLICHKEITEN].reverse().map((d, i) =>
      posten({ schluessel: d, dringlichkeit: d, faelligAm: `2026-12-0${i + 1}`, bereichName: String.fromCharCode(65 + i) }),
    );
    expect(sortiert(liste)).toEqual([...DRINGLICHKEITEN]);
  });

  it('gleiche Dringlichkeit: fällig am aufsteigend, ohne Datum zuletzt', () => {
    const liste = [
      posten({ schluessel: 'ohne', faelligAm: null }),
      posten({ schluessel: 'spaet', faelligAm: '2027-01-15' }),
      posten({ schluessel: 'frueh', faelligAm: '2026-12-02' }),
    ];
    expect(sortiert(liste)).toEqual(['frueh', 'spaet', 'ohne']);
  });

  it('gleiches Datum: Bereich, dann Gerät, dann Prüfart (deutsche Sortierung), zuletzt Schlüssel', () => {
    const liste = [
      posten({ schluessel: 'z', bereichName: 'Werkstatt' }),
      posten({ schluessel: 'y', bereichName: 'Äußeres Lager' }),
      posten({ schluessel: 'x', bereichName: 'Lager', geraetBezeichnung: 'Hubwagen' }),
      posten({ schluessel: 'w', bereichName: 'Lager', geraetBezeichnung: 'Leiter', pruefartBezeichnung: 'Elektroprüfung' }),
      posten({ schluessel: 'v2', bereichName: 'Lager', geraetBezeichnung: 'Leiter', pruefartBezeichnung: null }),
      posten({ schluessel: 'v1', bereichName: 'Lager', geraetBezeichnung: 'Leiter', pruefartBezeichnung: null }),
    ];
    // „Ä“ nach deutscher Sortierung bei „A“ (vor „L“), null-Prüfart wie leer (zuerst), Gleichstand → Schlüssel
    expect(sortiert(liste)).toEqual(['y', 'x', 'v1', 'v2', 'w', 'z']);
  });

  it('total und antisymmetrisch: Ergebnis unabhängig von der Eingangsreihenfolge; 0 nur bei gleichem Schlüssel', () => {
    const liste = [
      posten({ schluessel: 'a', dringlichkeit: 'ueberfaellig', faelligAm: '2026-11-01' }),
      posten({ schluessel: 'b', dringlichkeit: 'ueberfaellig', faelligAm: '2026-11-01', geraetBezeichnung: 'Abkantpresse' }),
      posten({ schluessel: 'c', dringlichkeit: 'ohne_termin', faelligAm: null }),
      posten({ schluessel: 'd', dringlichkeit: 'nicht_verwenden', faelligAm: null }),
    ];
    const erwartet = sortiert(liste);
    expect(sortiert([...liste].reverse())).toEqual(erwartet);
    for (const a of liste) {
      for (const b of liste) {
        expect(Math.sign(vergleichePosten(a, b)) + Math.sign(vergleichePosten(b, a))).toBe(0);
        if (a !== b) expect(vergleichePosten(a, b)).not.toBe(0);
      }
      expect(vergleichePosten(a, a)).toBe(0);
    }
  });
});

describe('kappePosten', () => {
  const liste = (n: number) => Array.from({ length: n }, (_, i) => i);

  it(`Standardgrenze MAIL_MAX_POSTEN = ${MAIL_MAX_POSTEN}`, () => {
    expect(MAIL_MAX_POSTEN).toBe(50);
  });

  it('bis zur Grenze alles einzeln, nichts in Summe', () => {
    for (const n of [0, 1, MAIL_MAX_POSTEN - 1, MAIL_MAX_POSTEN]) {
      const { einzeln, inSumme } = kappePosten(liste(n));
      expect(einzeln).toEqual(liste(n));
      expect(inSumme).toEqual([]);
    }
  });

  it('über der Grenze: die ersten 50 einzeln (Reihenfolge bleibt), ab Platz 51 in Summe; zusammen vollständig', () => {
    const { einzeln, inSumme } = kappePosten(liste(MAIL_MAX_POSTEN + 7));
    expect(einzeln).toEqual(liste(MAIL_MAX_POSTEN));
    expect(inSumme).toEqual([50, 51, 52, 53, 54, 55, 56]);
    expect([...einzeln, ...inSumme]).toEqual(liste(MAIL_MAX_POSTEN + 7));
  });

  it('eigene Grenze; Eingabe bleibt unverändert', () => {
    const eingabe = Object.freeze(['a', 'b', 'c']);
    expect(kappePosten(eingabe, 2)).toEqual({ einzeln: ['a', 'b'], inSumme: ['c'] });
    expect(kappePosten(eingabe, 0)).toEqual({ einzeln: [], inSumme: ['a', 'b', 'c'] });
    expect(eingabe).toEqual(['a', 'b', 'c']);
  });
});

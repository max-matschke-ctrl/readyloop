// BE-22: Domäne Erinnerungen (F-30 bis F-35) und Datumsergänzungen. heute = Di 2026-12-01.
import { describe, expect, it } from 'vitest';
import { addTage, isoKalenderwoche, isoWocheMontag, istWerktag, wochentag } from '@/domain/datum';
import {
  dringlichkeitAus,
  faelligeStufe,
  istStandard,
  planeErinnerungen,
  postenSchluessel,
  standardEinstellung,
  stufeAusCode,
  stufeCode,
  stufeLabel,
  stufeRang,
  zustandsKennung,
  type BisherigerPosten,
  type PlanEingabe,
  type PlanMaGeraet,
  type PlanMitglied,
  type PlanPruefart,
} from '@/domain/erinnerungen';
import type { ErinnerungEinstellung, FristStatus, StatusErgebnis } from '@/domain/types';

const HEUTE = '2026-12-01';
const STD = standardEinstellung('org', 'lager');
const code = (r: number, e: Pick<ErinnerungEinstellung, 'staffelTage' | 'eskalationTage'> = STD) => {
  const s = faelligeStufe(r, e);
  return s ? stufeCode(s) : null;
};

describe('datum: Wochentage und ISO-Wochen', () => {
  it('wochentag/istWerktag', () => {
    expect(wochentag('2026-11-30')).toBe(1);
    expect(wochentag('2026-11-29')).toBe(7);
    expect(istWerktag('2026-11-28')).toBe(false);
    expect(istWerktag('2026-11-29')).toBe(false);
    expect(istWerktag('2026-11-30')).toBe(true);
    expect(istWerktag('2026-12-04')).toBe(true);
  });
  it('isoWocheMontag', () => {
    expect(isoWocheMontag('2026-12-03')).toBe('2026-11-30');
    expect(isoWocheMontag('2027-01-01')).toBe('2026-12-28');
    expect(isoWocheMontag('2026-11-30')).toBe('2026-11-30');
    expect(isoWocheMontag('2026-12-06')).toBe('2026-11-30');
  });
  it('isoKalenderwoche', () => {
    expect(isoKalenderwoche('2026-11-30')).toBe(49);
    expect(isoKalenderwoche('2027-01-01')).toBe(53);
    expect(isoKalenderwoche('2026-01-01')).toBe(1);
    expect(isoKalenderwoche('2027-01-04')).toBe(1);
  });
});

describe('faelligeStufe (F-31, F-32)', () => {
  it.each([
    [91, null],
    [90, 'v90'],
    [61, 'v90'],
    [60, 'v60'],
    [30, 'v30'],
    [1, 'v30'],
    [0, 'e_verantwortlicher'],
    [-6, 'e_verantwortlicher'],
    [-7, 'e_sifa'],
    [-13, 'e_sifa'],
    [-14, 'e_admin'],
    [-200, 'e_admin'],
  ])('Standard: r = %i → %s', (r, erwartet) => {
    expect(code(r)).toBe(erwartet);
  });
  it('eVER = 3: r = 0 → null, r = −3 → e_verantwortlicher', () => {
    const e = { staffelTage: [90, 60, 30], eskalationTage: { verantwortlicher: 3, sifa: 7, admin: 14 } };
    expect(code(0, e)).toBeNull();
    expect(code(-2, e)).toBeNull();
    expect(code(-3, e)).toBe('e_verantwortlicher');
  });
  it('Staffel [14]: r = 20 → null, r = 14 → v14', () => {
    const e = { staffelTage: [14], eskalationTage: STD.eskalationTage };
    expect(code(20, e)).toBeNull();
    expect(code(14, e)).toBe('v14');
  });
});

describe('Stufen-Codes', () => {
  it('stufeRang: v90 < v60 < v30 < e_verantwortlicher < e_sifa < e_admin', () => {
    const reihe = ['v90', 'v60', 'v30', 'e_verantwortlicher', 'e_sifa', 'e_admin'].map(stufeRang);
    for (let i = 1; i < reihe.length; i++) expect(reihe[i]).toBeGreaterThan(reihe[i - 1]);
    expect(stufeRang('woche')).toBe(0);
    expect(stufeRang('nicht_verwenden')).toBe(0);
  });
  it('stufeCode/stufeAusCode Hin- und Rückweg', () => {
    for (const c of ['v90', 'v1', 'v365', 'e_verantwortlicher', 'e_sifa', 'e_admin']) {
      const s = stufeAusCode(c);
      expect(s).not.toBeNull();
      expect(stufeCode(s!)).toBe(c);
    }
    expect(stufeAusCode('x')).toBeNull();
    expect(stufeAusCode('v0')).toBeNull();
    expect(stufeAusCode('v366')).toBeNull();
    expect(stufeAusCode('e_chef')).toBeNull();
  });
  it('stufeLabel', () => {
    expect(stufeLabel('v90')).toBe('Vorlauf 90 Tage');
    expect(stufeLabel('e_verantwortlicher')).toBe('Fällig – an Verantwortliche');
    expect(stufeLabel('e_sifa')).toBe('Eskaliert an Sifa');
    expect(stufeLabel('e_admin')).toBe('Eskaliert an Admin/Geschäftsführung');
    expect(stufeLabel('woche')).toBe('Wochenübersicht');
    expect(stufeLabel('nicht_verwenden')).toBe('Hinweis „Nicht verwenden“');
  });
  it('standardEinstellung/istStandard', () => {
    expect(STD.standard).toBe(true);
    expect(istStandard(STD)).toBe(true);
    expect(istStandard({ ...STD, staffelTage: [60, 30] })).toBe(false);
    expect(istStandard({ ...STD, sifaInKopie: false })).toBe(false);
    expect(istStandard({ ...STD, adminEmpfaengerIds: ['a1'] })).toBe(false);
    expect(istStandard({ ...STD, eskalationTage: { verantwortlicher: 0, sifa: 7, admin: 15 } })).toBe(false);
  });
});

describe('dringlichkeitAus (F-38)', () => {
  const s = (status: FristStatus, restTage: number | null) => ({ status, restTage });
  it.each([
    [s('vor_nutzung_pruefen', 50), 'nicht_verwenden'],
    [s('ueberfaellig', -1), 'ueberfaellig'],
    [s('bald_faellig', 0), 'heute_faellig'],
    [s('bald_faellig', 1), 'bald_faellig'],
    [s('bald_faellig', 30), 'bald_faellig'],
    [s('ok', 31), 'vorlauf'],
    [s('gbu', null), 'ohne_termin'],
    [s('unbekannt', null), 'ohne_termin'],
  ] as const)('%o → %s', (eingabe, erwartet) => {
    expect(dringlichkeitAus(eingabe)).toBe(erwartet);
  });
});

describe('zustandsKennung (F-35)', () => {
  const basis = {
    nutzung: 'nicht_verwenden' as const,
    betriebsstatus: 'in_betrieb' as const,
    letztesBetriebsstatusEreignisId: null,
    gesamtStatus: 'ueberfaellig' as FristStatus,
    gesamtStatusGrund: null,
    fruehestesUeberschrittenesFaelligAm: '2026-11-15',
    aeltesterGefaehrlicherMangelId: null,
    aeltesterOffenerAnlassId: null,
    letzterNichtBestandenNachweisId: null,
  };
  it('außer Betrieb mit Ereignis-ID', () => {
    expect(zustandsKennung({ ...basis, betriebsstatus: 'ausser_betrieb', letztesBetriebsstatusEreignisId: 'ev1' })).toBe('ausser_betrieb:ev1');
    expect(zustandsKennung({ ...basis, betriebsstatus: 'ausser_betrieb' })).toBe('ausser_betrieb:ohne');
  });
  it('überfällig → frühestes faelligAm, auch mit gefährlichem Mangel', () => {
    expect(zustandsKennung(basis)).toBe('ueberfaellig:2026-11-15');
    expect(zustandsKennung({ ...basis, aeltesterGefaehrlicherMangelId: 'm1' })).toBe('ueberfaellig:2026-11-15');
  });
  it('vor_nutzung_pruefen nach Grund', () => {
    const v = { ...basis, gesamtStatus: 'vor_nutzung_pruefen' as const, fruehestesUeberschrittenesFaelligAm: null };
    expect(zustandsKennung({ ...v, gesamtStatusGrund: 'gefaehrlicher_mangel', aeltesterGefaehrlicherMangelId: 'm1' })).toBe('mangel:m1');
    expect(zustandsKennung({ ...v, gesamtStatusGrund: 'anlass', aeltesterOffenerAnlassId: 'a1' })).toBe('anlass:a1');
    expect(zustandsKennung({ ...v, gesamtStatusGrund: 'nicht_bestanden', letzterNichtBestandenNachweisId: 'n1' })).toBe('nicht_bestanden:n1');
  });
  it('Nutzung ≠ nicht_verwenden → null', () => {
    expect(zustandsKennung({ ...basis, nutzung: 'unklar' })).toBeNull();
    expect(zustandsKennung({ ...basis, nutzung: 'verwendbar' })).toBeNull();
  });
});

describe('postenSchluessel (F-33)', () => {
  it('drei Formen', () => {
    expect(postenSchluessel({ art: 'frist', geraetPruefartId: 'pa', stufe: 'v60', faelligAm: '2027-01-30', empfaengerId: 'u' })).toBe(
      'frist:pa:v60:2027-01-30:u',
    );
    expect(postenSchluessel({ art: 'pruefer_woche', geraetPruefartId: 'pa', montag: '2026-11-30', empfaengerId: 'u' })).toBe(
      'pruefer:pa:woche:2026-11-30:u',
    );
    expect(postenSchluessel({ art: 'ma_hinweis', geraetId: 'g', zustandsKennung: 'ueberfaellig:2026-11-15', empfaengerId: 'u' })).toBe(
      'ma:g:ueberfaellig:2026-11-15:u',
    );
  });
});

// ---------------------------------------------------------------- planeErinnerungen

const m = (benutzerId: string, rolle: PlanMitglied['rolle'], bereichIds: string[] = []): PlanMitglied => ({
  benutzerId,
  name: `Person ${benutzerId}`,
  email: `${benutzerId}@example.org`,
  rolle,
  bereichIds,
});
const VER_L = m('ver-lager', 'verantwortlicher', ['lager']);
const VER_P = m('ver-prod', 'verantwortlicher', ['prod']);
const SIF = m('sif', 'sifa');
const A1 = m('adm-1', 'admin');
const A2 = m('adm-2', 'admin');
const PRF = m('prf', 'pruefer');
const JONAS = m('ma-jonas', 'mitarbeiter');
const AYLIN = m('ma-aylin', 'mitarbeiter');
const ALLE = [VER_L, VER_P, SIF, A1, A2, PRF, JONAS, AYLIN];

function statusAus(r: number | null, status?: FristStatus): StatusErgebnis {
  if (r === null) return { status: status ?? 'gbu', faelligAm: null, restTage: null };
  return {
    status: status ?? (r < 0 ? 'ueberfaellig' : r <= 30 ? 'bald_faellig' : 'ok'),
    faelligAm: addTage(HEUTE, r),
    restTage: r,
  };
}

function pa(id: string, r: number | null, extra: Partial<PlanPruefart> = {}): PlanPruefart {
  return {
    geraetPruefartId: id,
    geraetId: `g-${id}`,
    bereichId: 'lager',
    geraetBezeichnung: `Gerät ${id}`,
    inventarnummer: `INV-${id}`,
    pruefartBezeichnung: `Prüfart ${id}`,
    betriebsstatus: 'in_betrieb',
    status: statusAus(r, extra.status?.status),
    frist: r === null ? null : { monate: 12, quelle: 'katalog', stufe: 'B', fundstelle: 'DGUV 208-043' },
    zugewiesenerPrueferId: null,
    katalogEntwurf: false,
    ...extra,
  };
}

function eingabe(over: Partial<PlanEingabe> = {}): PlanEingabe {
  return {
    heute: HEUTE,
    organisationId: 'org',
    bereiche: [
      { id: 'lager', name: 'Lager' },
      { id: 'prod', name: 'Produktion' },
    ],
    einstellungen: [],
    mitglieder: ALLE,
    pruefarten: [],
    maGeraete: [],
    abmeldungen: [],
    bisherige: [],
    ...over,
  };
}

const bisher = (empf: string, stufe: string, p: PlanPruefart): BisherigerPosten => ({
  art: 'frist',
  stufe,
  geraetId: p.geraetId,
  geraetPruefartId: p.geraetPruefartId,
  bezugDatum: p.status.faelligAm,
  empfaengerBenutzerId: empf,
  schluessel: postenSchluessel({ art: 'frist', geraetPruefartId: p.geraetPruefartId, stufe, faelligAm: p.status.faelligAm!, empfaengerId: empf }),
});

/** Übersicht Empfänger → [rolle, stufe] je Posten. */
const sicht = (digests: ReturnType<typeof planeErinnerungen>) =>
  Object.fromEntries(digests.map((d) => [d.empfaenger.benutzerId, d.posten.map((p) => `${p.rolle}:${p.stufe}`)]));

describe('planeErinnerungen: Vorlauf und Eskalation', () => {
  const lager60 = pa('pa1', 60);

  it('r = 60 → VER Lager v60 zuständig, SIF v60 Kopie; Schlüssel exakt', () => {
    const d = planeErinnerungen(eingabe({ pruefarten: [lager60] }));
    expect(sicht(d)).toEqual({ 'ver-lager': ['zustaendig:v60'], sif: ['kopie:v60'] });
    const ver = d.find((x) => x.empfaenger.benutzerId === 'ver-lager')!;
    expect(ver.art).toBe('frist_digest');
    expect(ver.abbestellbar).toBe(false);
    expect(ver.posten[0].schluessel).toBe('frist:pa1:v60:2027-01-30:ver-lager');
    expect(ver.posten[0].pfad).toBe('/geraete/g-pa1');
    expect(ver.posten[0].dringlichkeit).toBe('vorlauf');
  });

  it('bisherige v60 für VER und SIF → keine Digests; v90 bisher → v60', () => {
    expect(planeErinnerungen(eingabe({ pruefarten: [lager60], bisherige: [bisher('ver-lager', 'v60', lager60), bisher('sif', 'v60', lager60)] }))).toEqual([]);
    const d = planeErinnerungen(eingabe({ pruefarten: [lager60], bisherige: [bisher('ver-lager', 'v90', lager60), bisher('sif', 'v90', lager60)] }));
    expect(sicht(d)).toEqual({ 'ver-lager': ['zustaendig:v60'], sif: ['kopie:v60'] });
  });

  it('bisherige v30 (Staffeländerung) bei r = 45 → nichts', () => {
    const p = pa('pa1', 45);
    expect(planeErinnerungen(eingabe({ pruefarten: [p], bisherige: [bisher('ver-lager', 'v30', p), bisher('sif', 'v30', p)] }))).toEqual([]);
  });

  it('neue Fälligkeit startet die Staffel neu', () => {
    const p = pa('pa1', 60);
    const alteFaelligkeit = { ...bisher('ver-lager', 'e_admin', p), bezugDatum: '2025-12-01' };
    expect(sicht(planeErinnerungen(eingabe({ pruefarten: [p], bisherige: [alteFaelligkeit] })))['ver-lager']).toEqual(['zustaendig:v60']);
  });

  it('r = −7 mit bisheriger e_verantwortlicher → SIF zuständig e_sifa, VER Kopie', () => {
    const p = pa('pa1', -7);
    const d = planeErinnerungen(eingabe({ pruefarten: [p], bisherige: [bisher('ver-lager', 'e_verantwortlicher', p), bisher('sif', 'e_verantwortlicher', p)] }));
    expect(sicht(d)).toEqual({ sif: ['zustaendig:e_sifa'], 'ver-lager': ['kopie:e_sifa'] });
    expect(d.find((x) => x.empfaenger.benutzerId === 'sif')!.posten[0].hinweise).toEqual(['Eskaliert an Sifa']);
  });

  it('r = −14 → ADM A1 und A2 zuständig, SIF und VER Kopie; mit Auswahl nur A2', () => {
    const p = pa('pa1', -14);
    expect(sicht(planeErinnerungen(eingabe({ pruefarten: [p] })))).toEqual({
      'adm-1': ['zustaendig:e_admin'],
      'adm-2': ['zustaendig:e_admin'],
      sif: ['kopie:e_admin'],
      'ver-lager': ['kopie:e_admin'],
    });
    const e = { ...standardEinstellung('org', 'lager'), adminEmpfaengerIds: ['adm-2'], standard: false };
    expect(sicht(planeErinnerungen(eingabe({ pruefarten: [p], einstellungen: [e] })))).toEqual({
      'adm-2': ['zustaendig:e_admin'],
      sif: ['kopie:e_admin'],
      'ver-lager': ['kopie:e_admin'],
    });
  });

  it('sifaInKopie = false: v60 nur VER; e_sifa weiterhin an SIF', () => {
    const e = { ...standardEinstellung('org', 'lager'), sifaInKopie: false, standard: false };
    expect(sicht(planeErinnerungen(eingabe({ pruefarten: [lager60], einstellungen: [e] })))).toEqual({ 'ver-lager': ['zustaendig:v60'] });
    expect(sicht(planeErinnerungen(eingabe({ pruefarten: [pa('pa1', -8)], einstellungen: [e] })))).toEqual({
      sif: ['zustaendig:e_sifa'],
      'ver-lager': ['kopie:e_sifa'],
    });
  });

  it('Produktion ohne aktiven VER, r = 0 → SIF zuständig mit Hinweis; ohne SIF → ADM', () => {
    const p = pa('pp', 0, { bereichId: 'prod' });
    const ohneVer = ALLE.filter((x) => x !== VER_P);
    const d = planeErinnerungen(eingabe({ pruefarten: [p], mitglieder: ohneVer }));
    expect(sicht(d)).toEqual({ sif: ['zustaendig:e_verantwortlicher'] });
    expect(d[0].posten[0].hinweise).toContain('Bereich ohne Verantwortlichen');
    expect(d[0].posten[0].dringlichkeit).toBe('heute_faellig');
    const d2 = planeErinnerungen(eingabe({ pruefarten: [p], mitglieder: ohneVer.filter((x) => x !== SIF) }));
    expect(sicht(d2)).toEqual({ 'adm-1': ['zustaendig:e_verantwortlicher'], 'adm-2': ['zustaendig:e_verantwortlicher'] });
    expect(d2[0].posten[0].hinweise).toContain('Bereich ohne Verantwortlichen');
  });

  it('deaktivierter VER erhält nichts; SIF-Auswahl nur mit Inaktiven → alle aktiven SIF', () => {
    const p = pa('pa1', 60);
    const ohneVer = ALLE.filter((x) => x !== VER_L);
    expect(Object.keys(sicht(planeErinnerungen(eingabe({ pruefarten: [p], mitglieder: ohneVer }))))).not.toContain('ver-lager');
    const e = { ...standardEinstellung('org', 'lager'), sifaEmpfaengerIds: ['sif-alt'], standard: false };
    expect(sicht(planeErinnerungen(eingabe({ pruefarten: [p], einstellungen: [e] })))).toEqual({
      'ver-lager': ['zustaendig:v60'],
      sif: ['kopie:v60'],
    });
  });

  it('außer Betrieb, gbu, unbekannt → kein Frist-Posten', () => {
    const d = planeErinnerungen(
      eingabe({
        pruefarten: [pa('a', -20, { betriebsstatus: 'ausser_betrieb' }), pa('b', null), pa('c', null, { status: statusAus(null, 'unbekannt') })],
      }),
    );
    expect(d).toEqual([]);
  });

  it('VER mit Posten aus zwei Bereichen → ein Digest, sortiert nach Dringlichkeit, faelligAm, Bereich, Gerät', () => {
    const ver2 = m('ver-beide', 'verantwortlicher', ['lager', 'prod']);
    const ps = [
      pa('p-vor', 70, { bereichId: 'prod', geraetBezeichnung: 'Zange' }),
      pa('l-bald', 10, { geraetBezeichnung: 'Bohrer' }),
      pa('p-ueber', -3, { bereichId: 'prod', geraetBezeichnung: 'Säge' }),
      pa('l-ueber', -3, { geraetBezeichnung: 'Leiter' }),
      pa('l-heute', 0, { geraetBezeichnung: 'Amboss' }),
      pa('l-vnp', 20, { status: { ...statusAus(20), status: 'vor_nutzung_pruefen', grund: 'anlass' } }),
    ];
    const d = planeErinnerungen(eingabe({ pruefarten: ps, mitglieder: [ver2, SIF] }));
    const v = d.filter((x) => x.empfaenger.benutzerId === 'ver-beide');
    expect(v).toHaveLength(1);
    expect(v[0].posten.map((p) => p.geraetPruefartId)).toEqual(['l-vnp', 'l-ueber', 'p-ueber', 'l-heute', 'l-bald', 'p-vor']);
  });

  it('SIF zugleich zuständig und Kopie → ein Posten als zuständig', () => {
    // Bereich ohne VER, SIF zuständig, sifaInKopie an → nicht doppelt
    const p = pa('pp', 60, { bereichId: 'prod' });
    const d = planeErinnerungen(eingabe({ pruefarten: [p], mitglieder: [SIF, A1] }));
    expect(sicht(d)).toEqual({ sif: ['zustaendig:v60'] });
  });
});

describe('planeErinnerungen: Prüfer-Wochenübersicht (F-34)', () => {
  const zugewiesen = [
    pa('w1', -5, { zugewiesenerPrueferId: 'prf' }),
    pa('w2', 20, { zugewiesenerPrueferId: 'prf' }),
    pa('w3', 200, { zugewiesenerPrueferId: 'prf' }), // ok → nicht
    pa('w4', null, { zugewiesenerPrueferId: 'prf' }), // gbu → fällig-Gruppe
    pa('w5', 10, { zugewiesenerPrueferId: 'anderer' }),
  ];
  const nurPrf = (heute: string, extra: Partial<PlanEingabe> = {}) =>
    planeErinnerungen(eingabe({ heute, pruefarten: zugewiesen, mitglieder: [PRF], ...extra }));

  it('Montag → pruefer_woche mit allen zugewiesenen außer ok', () => {
    const d = nurPrf('2026-11-30');
    expect(d).toHaveLength(1);
    expect(d[0].art).toBe('pruefer_woche');
    expect(d[0].abbestellbar).toBe(true);
    expect(d[0].posten.map((p) => p.geraetPruefartId).sort()).toEqual(['w1', 'w2', 'w4']);
    expect(d[0].posten.find((p) => p.geraetPruefartId === 'w1')!.schluessel).toBe('pruefer:w1:woche:2026-11-30:prf');
    expect(d[0].posten.every((p) => p.pfad === '/pruefer' && p.stufe === 'woche')).toBe(true);
    expect(d[0].posten.find((p) => p.geraetPruefartId === 'w4')!.frist).toBeNull();
  });

  it('Dienstag mit Versand dieser Woche → keiner; ohne → Nachholung', () => {
    const b: BisherigerPosten = {
      art: 'pruefer_woche',
      stufe: 'woche',
      geraetId: 'g-w1',
      geraetPruefartId: 'w1',
      bezugDatum: '2026-11-30',
      empfaengerBenutzerId: 'prf',
      schluessel: 'pruefer:w1:woche:2026-11-30:prf',
    };
    expect(nurPrf('2026-12-01', { bisherige: [b] })).toEqual([]);
    expect(nurPrf('2026-12-01')).toHaveLength(1);
    expect(nurPrf('2026-12-07', { bisherige: [b] })).toHaveLength(1); // neue Woche
  });

  it('abgemeldet → keiner; keine fälligen → keiner', () => {
    expect(nurPrf('2026-11-30', { abmeldungen: [{ benutzerId: 'prf', art: 'pruefer_woche' }] })).toEqual([]);
    expect(planeErinnerungen(eingabe({ heute: '2026-11-30', pruefarten: [zugewiesen[2]], mitglieder: [PRF] }))).toEqual([]);
  });
});

describe('planeErinnerungen: Hinweis an Mitarbeiter (F-35)', () => {
  const geraet = (extra: Partial<PlanMaGeraet> = {}): PlanMaGeraet => ({
    geraetId: 'g-l008',
    bereichId: 'lager',
    bezeichnung: 'Akku-Bohrschrauber',
    inventarnummer: 'L-008',
    kategorie: 'personenbezogen',
    zugeordnetAn: 'ma-jonas',
    uebernommenVon: null,
    nutzung: 'nicht_verwenden',
    grundText: 'Überfällig',
    zustandsKennung: 'ueberfaellig:2026-11-15',
    ...extra,
  });
  const nurMa = (extra: Partial<PlanEingabe>) => planeErinnerungen(eingabe({ mitglieder: [JONAS, AYLIN], ...extra }));

  it('Jonas hält überfälliges Gerät → ma_hinweis mit genau einem Posten', () => {
    const d = nurMa({ maGeraete: [geraet()] });
    expect(d).toHaveLength(1);
    expect(d[0].empfaenger.benutzerId).toBe('ma-jonas');
    expect(d[0].art).toBe('ma_hinweis');
    expect(d[0].abbestellbar).toBe(true);
    expect(d[0].posten).toHaveLength(1);
    expect(d[0].posten[0].schluessel).toBe('ma:g-l008:ueberfaellig:2026-11-15:ma-jonas');
    expect(d[0].posten[0].frist).toBeNull();
    expect(d[0].posten[0].pfad).toBe('/meine-geraete');
  });

  it('bereits gesendeter Schlüssel → keiner; unklar → keiner; ohne Halter → keiner; abgemeldet → keiner', () => {
    const b: BisherigerPosten = {
      art: 'ma_hinweis',
      stufe: 'nicht_verwenden',
      geraetId: 'g-l008',
      geraetPruefartId: null,
      bezugDatum: null,
      empfaengerBenutzerId: 'ma-jonas',
      schluessel: 'ma:g-l008:ueberfaellig:2026-11-15:ma-jonas',
    };
    expect(nurMa({ maGeraete: [geraet()], bisherige: [b] })).toEqual([]);
    expect(nurMa({ maGeraete: [geraet({ nutzung: 'unklar', zustandsKennung: null })] })).toEqual([]);
    expect(nurMa({ maGeraete: [geraet({ zugeordnetAn: null })] })).toEqual([]);
    expect(nurMa({ maGeraete: [geraet()], abmeldungen: [{ benutzerId: 'ma-jonas', art: 'ma_hinweis' }] })).toEqual([]);
    // neuer Zustand → neuer Hinweis
    expect(nurMa({ maGeraete: [geraet({ zustandsKennung: 'mangel:m9' })], bisherige: [b] })).toHaveLength(1);
  });

  it('Aylin erhält nie Geräte von Jonas; übernommen → „Bitte zurückgeben“', () => {
    const d = nurMa({ maGeraete: [geraet(), geraet({ geraetId: 'g-w', kategorie: 'wechselnd', zugeordnetAn: null, uebernommenVon: 'ma-aylin' })] });
    const aylin = d.find((x) => x.empfaenger.benutzerId === 'ma-aylin')!;
    expect(aylin.posten.map((p) => p.geraetId)).toEqual(['g-w']);
    expect(aylin.posten[0].hinweise).toEqual(['Überfällig', 'Bitte zurückgeben']);
    expect(d.find((x) => x.empfaenger.benutzerId === 'ma-jonas')!.posten.map((p) => p.geraetId)).toEqual(['g-l008']);
  });

  it('Halter ohne aktive MA-Mitgliedschaft → keiner', () => {
    expect(planeErinnerungen(eingabe({ mitglieder: [AYLIN], maGeraete: [geraet()] }))).toEqual([]);
  });
});

describe('planeErinnerungen: Determinismus', () => {
  const voll = eingabe({
    heute: '2026-11-30',
    pruefarten: [
      pa('a', 60),
      pa('b', -7),
      pa('c', -14, { bereichId: 'prod' }),
      pa('d', 0, { zugewiesenerPrueferId: 'prf' }),
      pa('e', 25, { bereichId: 'prod', zugewiesenerPrueferId: 'prf' }),
    ],
    maGeraete: [
      {
        geraetId: 'g-x',
        bereichId: 'lager',
        bezeichnung: 'X',
        inventarnummer: null,
        kategorie: 'personenbezogen',
        zugeordnetAn: 'ma-jonas',
        uebernommenVon: null,
        nutzung: 'nicht_verwenden',
        grundText: 'Überfällig',
        zustandsKennung: 'ueberfaellig:2026-11-01',
      },
    ],
  });

  it('je Empfänger höchstens ein Digest, nach benutzerId sortiert', () => {
    const d = planeErinnerungen(voll);
    const ids = d.map((x) => x.empfaenger.benutzerId);
    expect(new Set(ids).size).toBe(ids.length);
    expect([...ids].sort()).toEqual(ids);
  });

  it('gleiche Eingabe → gleiche Ausgabe, auch bei vertauschter Reihenfolge', () => {
    const a = planeErinnerungen(voll);
    expect(planeErinnerungen(structuredClone(voll))).toEqual(a);
    const vertauscht = {
      ...voll,
      mitglieder: [...voll.mitglieder].reverse(),
      pruefarten: [...voll.pruefarten].reverse(),
      bereiche: [...voll.bereiche].reverse(),
    };
    expect(planeErinnerungen(vertauscht)).toEqual(a);
  });
});

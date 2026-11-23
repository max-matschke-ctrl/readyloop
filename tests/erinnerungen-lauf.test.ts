// BE-25: Erinnerungslauf mit Demo-System-Repository – „heute“ injiziert, Wartezeiten sofort (F-30 bis F-36, F-41).
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { addTage } from '@/domain/datum';
import type { MailFehlerCode } from '@/domain/types';
import { fuehreErinnerungslaufAus, WARTEZEITEN_MS, type LaufOptionen } from '@/server/erinnerungen/lauf';
import { planEingabeAus } from '@/server/erinnerungen/laufdaten';
import type { GerenderteMail, MailAdapter, MailMeta, MailSendeErgebnis } from '@/server/mail/types';
import { leereVorschau, listeVorschauMails, vorschauAdapter } from '@/server/mail/vorschau';
import { DEMO_BENUTZER_IDS, DEMO_ORG2_ID, DEMO_ORG_ID, erzeugeDemoStand, type DemoStand } from '@/server/repo/demo/daten';
import { DemoSystemRepository } from '@/server/repo/demo/system-repository';
import type { ErinnerungsSystemRepository } from '@/server/repo/types';

const MONTAG = '2026-11-30';
const DIENSTAG = '2026-12-01';
const SAMSTAG = '2026-12-05';
const B = DEMO_BENUTZER_IDS;
const DEMO_NAMEN = ['Katrin Vogel', 'Dr. Jens Hartmann', 'Jens Hartmann', 'Marco Lindner', 'Sabine Krüger', 'Tobias Berger', 'Jonas Richter', 'Aylin Demir'];

let stand: DemoStand;
let repo: DemoSystemRepository;

beforeEach(() => {
  stand = erzeugeDemoStand(MONTAG);
  repo = new DemoSystemRepository(stand);
  leereVorschau();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

const opt = (heute: string, extra: Partial<LaufOptionen> = {}): LaufOptionen => ({
  heute,
  jetzt: new Date(`${heute}T05:00:00Z`),
  ausloeser: 'vercel_cron',
  warte: async () => {},
  ...extra,
});

/** Adapter mit Skript: je Empfänger-Adresse eine Folge von Ergebnissen; sonst ok. */
function skriptAdapter(skript: Record<string, (MailSendeErgebnis | MailFehlerCode)[]> = {}) {
  const gesendet: { mail: GerenderteMail; meta: MailMeta }[] = [];
  const adapter: MailAdapter = {
    modus: 'resend',
    async senden(mail, meta) {
      gesendet.push({ mail, meta });
      const folge = skriptAdapter.zaehler.get(mail.an) ?? 0;
      skriptAdapter.zaehler.set(mail.an, folge + 1);
      const s = skript[mail.an]?.[folge];
      if (s === undefined) return { ok: true, anbieterId: `re-${gesendet.length}` };
      if (typeof s === 'string') {
        const wiederholbar = s === 'netzwerk' || s === 'rate_limit' || s === 'anbieter_fehler';
        return { ok: false, fehlerCode: s, wiederholbar };
      }
      return s;
    },
  };
  return { adapter, gesendet };
}
skriptAdapter.zaehler = new Map<string, number>();
beforeEach(() => skriptAdapter.zaehler.clear());

const email = (id: string) => stand.benutzer.find((b) => b.id === id)!.email;
const versandVon = (id: string, datum?: string) =>
  stand.mailVersand.filter((v) => v.empfaengerBenutzerId === id && (datum === undefined || v.laufDatum === datum));

describe('planEingabeAus (Demo-Daten)', () => {
  it('nur aktive Mitglieder mit E-Mail; L-008 bei Jonas „nicht verwenden“ mit Zustandskennung', async () => {
    const eingabe = planEingabeAus(await repo.holeLaufDaten(DEMO_ORG_ID, MONTAG), MONTAG);
    expect(eingabe.mitglieder.map((m) => m.benutzerId).sort()).toEqual(
      [B.katrin, B.jens, B.marco, B.tobias, B.sabine, B.jonas, B.aylin].sort(),
    );
    const l008 = eingabe.maGeraete.find((g) => g.inventarnummer === 'L-008')!;
    expect(l008).toMatchObject({ uebernommenVon: B.jonas, nutzung: 'nicht_verwenden' });
    expect(l008.zustandsKennung).toMatch(/^(ueberfaellig|mangel|anlass|nicht_bestanden|ausser_betrieb):/);
    expect(eingabe.pruefarten.every((p) => p.frist === null || (p.frist.stufe && p.frist.quelle))).toBe(true);
  });
});

describe('fuehreErinnerungslaufAus', () => {
  it('erster Lauf am Werktag: fertig, je Empfänger höchstens ein Versand, Jonas erhält ma_hinweis mit L-008', async () => {
    const { adapter, gesendet } = skriptAdapter();
    const e = await fuehreErinnerungslaufAus(repo, adapter, opt(MONTAG));
    expect(e).toMatchObject({ status: 'fertig', fehler: 0 });
    expect(e.mails).toBeGreaterThan(0);
    expect(e.mails).toBe(gesendet.length);
    const heute = stand.mailVersand.filter((v) => v.laufDatum === MONTAG);
    const schluessel = heute.map((v) => `${v.organisationId}|${v.empfaengerBenutzerId}`);
    expect(new Set(schluessel).size).toBe(schluessel.length);
    expect(heute.every((v) => v.status === 'versendet' && v.versuche === 1 && v.anbieterId)).toBe(true);
    const jonas = gesendet.find((g) => g.mail.an === email(B.jonas))!;
    expect(jonas.meta.art).toBe('ma_hinweis');
    expect(jonas.mail.text).toContain('L-008');
    expect(jonas.mail.kopfzeilen['List-Unsubscribe']).toMatch(/^<http.*\/api\/mail\/abmelden\?t=/);
    expect(jonas.mail.idempotenzSchluessel).toBe(versandVon(B.jonas, MONTAG)[0].id);
    // Prüfer erhält montags die Wochenübersicht; Sifa erhält Kopien
    expect(gesendet.some((g) => g.mail.an === email(B.tobias) && g.meta.art === 'pruefer_woche')).toBe(true);
    expect(stand.erinnerungLaeufe.at(-1)).toMatchObject({ laufDatum: MONTAG, status: 'fertig', ausloeser: 'vercel_cron' });
  });

  it('zweiter Lauf am selben Tag → bereits_gelaufen; mit erzwingen → keine neue Mail (Idempotenz)', async () => {
    const { adapter, gesendet } = skriptAdapter();
    await fuehreErinnerungslaufAus(repo, adapter, opt(MONTAG));
    const anzahl = gesendet.length;
    expect((await fuehreErinnerungslaufAus(repo, adapter, opt(MONTAG, { ausloeser: 'pg_cron' }))).status).toBe('bereits_gelaufen');
    const erzwungen = await fuehreErinnerungslaufAus(repo, adapter, opt(MONTAG, { ausloeser: 'manuell', erzwingen: true }));
    expect(erzwungen).toMatchObject({ status: 'fertig', mails: 0 });
    expect(gesendet.length).toBe(anzahl);
  });

  it('Folgetag: nur neue Stufen; Prüfer keine zweite Wochenübersicht; MA kein zweiter Hinweis', async () => {
    const { adapter } = skriptAdapter();
    await fuehreErinnerungslaufAus(repo, adapter, opt(MONTAG));
    const zweit = skriptAdapter();
    await fuehreErinnerungslaufAus(repo, zweit.adapter, opt(DIENSTAG));
    expect(zweit.gesendet.some((g) => g.meta.art === 'pruefer_woche')).toBe(false);
    expect(zweit.gesendet.some((g) => g.meta.art === 'ma_hinweis')).toBe(false);
    for (const g of zweit.gesendet) {
      // jede Mail am Folgetag enthält nur Posten, die am Montag nicht (in dieser Stufe) gesendet wurden
      const v = stand.mailVersand.find((x) => x.id === g.mail.idempotenzSchluessel)!;
      const neue = stand.erinnerungPosten.filter((p) => p.versandId === v.id).map((p) => p.schluessel);
      const alte = stand.erinnerungPosten.filter((p) => p.empfaengerBenutzerId === v.empfaengerBenutzerId && p.versandId !== v.id).map((p) => p.schluessel);
      expect(neue.filter((s) => alte.includes(s))).toEqual([]);
    }
  });

  it('Samstag → kein_werktag ohne Schreibzugriff; mit erzwingen läuft er', async () => {
    const vorher = structuredClone(stand.mailVersand);
    const { adapter } = skriptAdapter();
    expect(await fuehreErinnerungslaufAus(repo, adapter, opt(SAMSTAG))).toMatchObject({ status: 'kein_werktag', laufId: null });
    expect(stand.mailVersand).toEqual(vorher);
    expect((await fuehreErinnerungslaufAus(repo, adapter, opt(SAMSTAG, { erzwingen: true }))).status).toBe('fertig');
  });

  it('Adapter null → nicht_konfiguriert, Protokoll und Läufe unverändert', async () => {
    const vorher = structuredClone({ v: stand.mailVersand, l: stand.erinnerungLaeufe });
    expect(await fuehreErinnerungslaufAus(repo, null, opt(MONTAG))).toEqual({ status: 'nicht_konfiguriert', laufId: null, organisationen: 0, mails: 0, fehler: 0 });
    expect({ v: stand.mailVersand, l: stand.erinnerungLaeufe }).toEqual(vorher);
  });

  it('laufender Lauf (< 15 Min.) → laeuft_bereits; hängender Lauf (> 15 Min.) wird übernommen', async () => {
    stand.erinnerungLaeufe.push({ id: 'haengt', laufDatum: MONTAG, ausloeser: 'pg_cron', status: 'laeuft', gestartetAm: '2026-11-30T04:50:00Z', beendetAm: null });
    const { adapter } = skriptAdapter();
    expect((await fuehreErinnerungslaufAus(repo, adapter, opt(MONTAG))).status).toBe('laeuft_bereits');
    const spaeter = await fuehreErinnerungslaufAus(repo, adapter, { ...opt(MONTAG), jetzt: new Date('2026-11-30T05:10:00Z') });
    expect(spaeter.status).toBe('fertig');
    expect(stand.erinnerungLaeufe.find((l) => l.id === 'haengt')!.status).toBe('fehler');
  });

  it('zweimal rate_limit, dann ok → versendet mit 3 Versuchen und Wartezeiten 1 s / 4 s', async () => {
    const warte = vi.fn(async () => {});
    const { adapter } = skriptAdapter({ [email(B.marco)]: ['rate_limit', 'rate_limit'] });
    await fuehreErinnerungslaufAus(repo, adapter, opt(MONTAG, { warte }));
    expect(versandVon(B.marco, MONTAG)[0]).toMatchObject({ status: 'versendet', versuche: 3, fehlerCode: null });
    expect(warte.mock.calls).toEqual([[WARTEZEITEN_MS[0]], [WARTEZEITEN_MS[1]]]);
  });

  it('dreimal anbieter_fehler → fehler; Folgetag: dieselben Posten in neuer Sammelmail', async () => {
    const { adapter } = skriptAdapter({ [email(B.marco)]: ['anbieter_fehler', 'anbieter_fehler', 'anbieter_fehler'] });
    const e = await fuehreErinnerungslaufAus(repo, adapter, opt(MONTAG));
    expect(e.fehler).toBe(1);
    const montag = versandVon(B.marco, MONTAG)[0];
    expect(montag).toMatchObject({ status: 'fehler', versuche: 3, fehlerCode: 'anbieter_fehler' });
    const montagsPosten = stand.erinnerungPosten.filter((p) => p.versandId === montag.id).map((p) => p.schluessel).sort();
    const zweit = skriptAdapter();
    await fuehreErinnerungslaufAus(repo, zweit.adapter, opt(DIENSTAG));
    const dienstag = versandVon(B.marco, DIENSTAG)[0];
    expect(dienstag.status).toBe('versendet');
    const dienstagsPosten = stand.erinnerungPosten.filter((p) => p.versandId === dienstag.id).map((p) => p.schluessel);
    // Gleiche Prüfarten/Fälligkeiten erneut (Stufe kann am Folgetag gleich oder dringlicher sein)
    const kern = (s: string) => s.split(':').filter((_, i) => i !== 2).join(':');
    for (const s of montagsPosten) expect(dienstagsPosten.map(kern)).toContain(kern(s));
  });

  it('ungueltige_adresse → ein Versuch, fehler, nicht wiederholt', async () => {
    const { adapter, gesendet } = skriptAdapter({ [email(B.jens)]: ['ungueltige_adresse'] });
    await fuehreErinnerungslaufAus(repo, adapter, opt(MONTAG));
    expect(versandVon(B.jens, MONTAG)[0]).toMatchObject({ status: 'fehler', versuche: 1, fehlerCode: 'ungueltige_adresse' });
    expect(gesendet.filter((g) => g.mail.an === email(B.jens))).toHaveLength(1);
  });

  it('zwei Organisationen; eine wirft beim Lesen → andere wird versendet, fehler ≥ 1, Status fertig', async () => {
    const kaputt: ErinnerungsSystemRepository = Object.create(repo);
    kaputt.holeLaufDaten = async (org, heute) => {
      if (org === DEMO_ORG_ID) throw new Error('Lesefehler');
      return repo.holeLaufDaten(org, heute);
    };
    const { adapter, gesendet } = skriptAdapter();
    const e = await fuehreErinnerungslaufAus(kaputt, adapter, opt(MONTAG));
    expect(e.status).toBe('fertig');
    expect(e.organisationen).toBe(2);
    expect(e.fehler).toBeGreaterThanOrEqual(1);
    expect(gesendet.length).toBeGreaterThan(0);
    expect(gesendet.every((g) => g.meta.organisationName === 'Muster Metallbau GmbH')).toBe(true);
    expect(stand.mailVersand.filter((v) => v.laufDatum === MONTAG).every((v) => v.organisationId === DEMO_ORG2_ID)).toBe(true);
  });

  it('Mandantentrennung: Prüfer mit zwei Betrieben erhält je Betrieb eine eigene Mail', async () => {
    const { adapter, gesendet } = skriptAdapter();
    await fuehreErinnerungslaufAus(repo, adapter, opt(MONTAG));
    const berger = gesendet.filter((g) => g.mail.an === email(B.tobias));
    expect(new Set(berger.map((g) => g.meta.organisationName)).size).toBe(berger.length);
    for (const g of berger) expect(g.mail.betreff).toContain(g.meta.organisationName);
  });

  it('Vorschau-Modus: Status vorschau, gerenderte Mails ohne Demo-Personennamen', async () => {
    const e = await fuehreErinnerungslaufAus(repo, vorschauAdapter(), opt(MONTAG, { ausloeser: 'manuell' }));
    expect(e.status).toBe('fertig');
    expect(stand.mailVersand.filter((v) => v.laufDatum === MONTAG).every((v) => v.status === 'vorschau')).toBe(true);
    const mails = listeVorschauMails();
    expect(mails.length).toBe(e.mails);
    for (const m of mails) {
      for (const name of DEMO_NAMEN) {
        expect(m.betreff, name).not.toContain(name);
        expect(m.text, name).not.toContain(name);
        expect(m.html, name).not.toContain(name);
      }
      expect(m.html).not.toContain('<script');
    }
    const fristMail = mails.find((m) => m.art === 'frist_digest')!;
    expect(fristMail.text).toMatch(/Stufe [A-D]/);
  });

  it('Abmeldung Prüfer → im nächsten Montagslauf keine Wochenübersicht', async () => {
    stand.mailAbmeldungen.push({ organisationId: DEMO_ORG_ID, benutzerId: B.tobias, art: 'pruefer_woche', abgemeldet: true, geaendertAm: '2026-11-29T10:00:00Z' });
    const { adapter, gesendet } = skriptAdapter();
    await fuehreErinnerungslaufAus(repo, adapter, opt(MONTAG));
    expect(gesendet.some((g) => g.mail.an === email(B.tobias) && g.meta.organisationName === 'Elbtal Fördertechnik GmbH')).toBe(false);
  });

  it('MA-Hinweis-Posten älter als 90 Tage → nach dem Lauf ohne Empfänger', async () => {
    const alt = stand.mailVersand.find((v) => v.art === 'ma_hinweis')!;
    alt.erstelltAm = `${addTage(MONTAG, -91)}T06:00:00.000Z`;
    for (const p of stand.erinnerungPosten.filter((x) => x.versandId === alt.id)) p.erstelltAm = alt.erstelltAm;
    const { adapter } = skriptAdapter();
    await fuehreErinnerungslaufAus(repo, adapter, opt(MONTAG));
    expect(alt.empfaengerBenutzerId).toBeNull();
    expect(stand.erinnerungPosten.filter((p) => p.versandId === alt.id).every((p) => p.empfaengerBenutzerId === null)).toBe(true);
    const frisch = stand.mailVersand.filter((v) => v.art === 'ma_hinweis' && v.laufDatum === MONTAG);
    expect(frisch.every((v) => v.empfaengerBenutzerId !== null)).toBe(true);
  });
});

describe('DemoSystemRepository: Webhook und Statusübergänge', () => {
  it('Bounce per Anbieter-ID; unbekannte ID → false; zugestellt nach Bounce → false', async () => {
    const { adapter } = skriptAdapter();
    await fuehreErinnerungslaufAus(repo, adapter, opt(MONTAG));
    const v = versandVon(B.marco, MONTAG)[0];
    const jetzt = '2026-11-30T06:00:00Z';
    expect(await repo.setzeStatusPerAnbieterId({ anbieterId: v.anbieterId!, status: 'bounce', jetzt })).toBe(true);
    expect(v.status).toBe('bounce');
    expect(await repo.setzeStatusPerAnbieterId({ anbieterId: v.anbieterId!, status: 'zugestellt', jetzt })).toBe(false);
    expect(await repo.setzeStatusPerAnbieterId({ anbieterId: 'unbekannt', status: 'bounce', jetzt })).toBe(false);
    await expect(repo.setzeVersandStatus({ versandId: v.id, status: 'vorbereitet', versuche: 1, anbieterId: null, fehlerCode: null, jetzt })).rejects.toThrow();
  });
  it('Reservierung: zweite für denselben Empfänger und Tag → false', async () => {
    const start = await repo.starteLauf({ laufDatum: MONTAG, ausloeser: 'manuell', erzwingen: true, jetzt: '2026-11-30T05:00:00Z' });
    if (start.ergebnis !== 'gestartet') throw new Error('Lauf nicht gestartet');
    const g = stand.geraete.find((x) => x.organisationId === DEMO_ORG_ID)!;
    const versand = (id: string) => ({
      id, organisationId: DEMO_ORG_ID, laufId: start.lauf.id, laufDatum: MONTAG, art: 'frist_digest' as const, empfaengerBenutzerId: B.marco,
      status: 'vorbereitet' as const, versuche: 0, anbieterId: null, fehlerCode: null, postenAnzahl: 1, erstelltAm: '', versendetAm: null, statusAm: '',
    });
    const posten = (versandId: string) => [{
      id: `${versandId}-p`, organisationId: DEMO_ORG_ID, versandId, schluessel: 'k', art: 'frist' as const, stufe: 'v30', geraetId: g.id,
      geraetPruefartId: 'x', bereichId: g.bereichId, bezugDatum: MONTAG, rolle: 'zustaendig' as const, empfaengerBenutzerId: B.marco, erstelltAm: '',
    }];
    expect(await repo.reserviereVersand({ versand: versand('a'), posten: posten('a') })).toBe(true);
    expect(await repo.reserviereVersand({ versand: versand('b'), posten: posten('b') })).toBe(false);
    expect(stand.mailVersand.filter((v) => v.id === 'b')).toEqual([]);
  });
});

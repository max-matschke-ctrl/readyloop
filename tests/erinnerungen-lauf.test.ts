// BE-25: Erinnerungslauf mit Demo-System-Repository – „heute“ injiziert, Wartezeiten sofort (F-30 bis F-36, F-41).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { addTage } from '@/domain/datum';
import { MAIL_MAX_POSTEN, VERSAND_ERFOLGREICH, VERSAND_ERFOLGREICH_DEMO, type MailFehlerCode } from '@/domain/types';
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

  it('F-33 Kappung: Posten ab Platz 51 werden „in Summe genannt“ gebucht und kommen am Folgetag nicht erneut', async () => {
    // Vorlauf-Posten von Marco am Montag suchen und die Prüfart 60-mal klonen (gleiche Fälligkeit, gleiche Stufe am Dienstag)
    const probeStand = erzeugeDemoStand(MONTAG);
    await fuehreErinnerungslaufAus(new DemoSystemRepository(probeStand), skriptAdapter().adapter, opt(MONTAG));
    const montagsVersand = probeStand.mailVersand.find((v) => v.empfaengerBenutzerId === B.marco && v.laufDatum === MONTAG)!;
    const vorlage = probeStand.erinnerungPosten.find((p) => p.versandId === montagsVersand.id && p.art === 'frist' && p.stufe.startsWith('v'))!;
    expect(vorlage).toBeDefined();
    const g = stand.geraete.find((x) => x.id === vorlage.geraetId)!;
    const pa = stand.pruefarten.find((x) => x.id === vorlage.geraetPruefartId)!;
    for (let i = 1; i <= 60; i++) {
      const gid = `${g.id.slice(0, -4)}${String(9000 + i)}`;
      const paid = `${pa.id.slice(0, -4)}${String(9000 + i)}`;
      stand.geraete.push({ ...structuredClone(g), id: gid, inventarnummer: g.inventarnummer ? `${g.inventarnummer}-K${i}` : null });
      stand.pruefarten.push({ ...structuredClone(pa), id: paid, geraetId: gid });
      for (const n of stand.nachweise.filter((x) => x.geraetPruefartId === pa.id)) {
        stand.nachweise.push({ ...structuredClone(n), id: `${n.id.slice(0, -4)}${String(9000 + i)}`, geraetId: gid, geraetPruefartId: paid });
      }
    }

    const { adapter, gesendet } = skriptAdapter();
    await fuehreErinnerungslaufAus(repo, adapter, opt(MONTAG));
    const montag = versandVon(B.marco, MONTAG)[0];
    const posten = stand.erinnerungPosten.filter((p) => p.versandId === montag.id);
    expect(posten.length).toBeGreaterThan(MAIL_MAX_POSTEN);
    expect(montag.postenAnzahl).toBe(posten.length);
    const inSumme = posten.filter((p) => p.inSumme);
    expect(inSumme).toHaveLength(posten.length - MAIL_MAX_POSTEN);
    expect(posten.slice(0, MAIL_MAX_POSTEN).every((p) => !p.inSumme)).toBe(true); // Reihenfolge des Digests
    const mail = gesendet.find((x) => x.mail.an === email(B.marco))!.mail;
    expect(mail.text).toContain(`… und ${inSumme.length} weitere`);
    expect((mail.html.match(/<td width="56"/g) ?? []).length).toBe(MAIL_MAX_POSTEN);

    const zweit = skriptAdapter();
    await fuehreErinnerungslaufAus(repo, zweit.adapter, opt(DIENSTAG));
    const dienstagsSchluessel = new Set(
      versandVon(B.marco, DIENSTAG).flatMap((v) => stand.erinnerungPosten.filter((p) => p.versandId === v.id).map((p) => p.schluessel)),
    );
    for (const p of inSumme) expect(dienstagsSchluessel.has(p.schluessel), p.schluessel).toBe(false);
    expect(versandVon(B.marco, DIENSTAG)).toEqual([]); // keine Doppelmail: alle Montags-Posten bleiben in ihrer Stufe
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
      geraetPruefartId: 'x', bereichId: g.bereichId, bezugDatum: MONTAG, rolle: 'zustaendig' as const, empfaengerBenutzerId: B.marco, inSumme: false, erstelltAm: '',
    }];
    expect(await repo.reserviereVersand({ versand: versand('a'), posten: posten('a') })).toBe(true);
    expect(await repo.reserviereVersand({ versand: versand('b'), posten: posten('b') })).toBe(false);
    expect(stand.mailVersand.filter((v) => v.id === 'b')).toEqual([]);
  });
});

// Review I3 (Backend): Zeitbudget mit Fortsetzung, abgebrochene Versände, Trockenlauf, manueller Lauf, Site-URL.
describe('Zeitbudget und Fortsetzung (F-36)', () => {
  /** Uhr, die je Sendung um 10 ms vorrückt. */
  function taktAdapter() {
    let t = 0;
    const basis = skriptAdapter();
    const adapter: MailAdapter = {
      modus: 'resend',
      async senden(mail, meta) {
        t += 10;
        return basis.adapter.senden(mail, meta);
      },
    };
    return { adapter, gesendet: basis.gesendet, uhr: () => t };
  }

  it('Budget erschöpft → teilweise, kein „vorbereitet“; 05:20-Auslöser setzt fort, ohne Doppelmail, Ergebnis wie ein voller Lauf', async () => {
    const voll = erzeugeDemoStand(MONTAG);
    await fuehreErinnerungslaufAus(new DemoSystemRepository(voll), skriptAdapter().adapter, opt(MONTAG));
    const erwartet = voll.mailVersand.filter((v) => v.laufDatum === MONTAG).map((v) => `${v.organisationId}|${v.empfaengerBenutzerId}`).sort();
    expect(erwartet.length).toBeGreaterThan(3);

    const takt = taktAdapter();
    const erst = await fuehreErinnerungslaufAus(repo, takt.adapter, opt(MONTAG, { uhr: takt.uhr, budgetMs: 25 }));
    expect(erst.status).toBe('teilweise');
    expect(erst.mails).toBe(3);
    expect(stand.erinnerungLaeufe.at(-1)).toMatchObject({ status: 'teilweise', ausloeser: 'vercel_cron' });
    expect(stand.mailVersand.some((v) => v.status === 'vorbereitet')).toBe(false);

    const fort = skriptAdapter();
    const zweit = await fuehreErinnerungslaufAus(repo, fort.adapter, { ...opt(MONTAG, { ausloeser: 'pg_cron' }), jetzt: new Date('2026-11-30T05:20:00Z') });
    expect(zweit.status).toBe('fertig');
    const heutige = stand.mailVersand.filter((v) => v.laufDatum === MONTAG).map((v) => `${v.organisationId}|${v.empfaengerBenutzerId}`).sort();
    expect(heutige).toEqual(erwartet);
    expect(new Set(heutige).size).toBe(heutige.length);
    const erstEmpfaenger = new Set(takt.gesendet.map((g) => `${g.meta.organisationId}|${g.mail.an}`));
    expect(fort.gesendet.filter((g) => erstEmpfaenger.has(`${g.meta.organisationId}|${g.mail.an}`))).toEqual([]);
    // danach ist der Tag erledigt
    expect((await fuehreErinnerungslaufAus(repo, fort.adapter, opt(MONTAG))).status).toBe('bereits_gelaufen');
  });

  it('Budget 0 → teilweise ohne Organisation und ohne Versand', async () => {
    const e = await fuehreErinnerungslaufAus(repo, skriptAdapter().adapter, opt(MONTAG, { budgetMs: 0 }));
    expect(e).toMatchObject({ status: 'teilweise', organisationen: 0, mails: 0 });
    expect(stand.mailVersand.filter((v) => v.laufDatum === MONTAG)).toEqual([]);
  });

  it('Reihenfolge: Betriebe ohne heutigen Versand zuerst', async () => {
    expect(await repo.listeOrganisationIds(MONTAG)).toEqual([DEMO_ORG_ID, DEMO_ORG2_ID].sort());
    await fuehreErinnerungslaufAus(repo, skriptAdapter().adapter, opt(MONTAG, { organisationIds: [[DEMO_ORG_ID, DEMO_ORG2_ID].sort()[0]] }));
    const [erste, zweite] = [DEMO_ORG_ID, DEMO_ORG2_ID].sort();
    expect(await repo.listeOrganisationIds(MONTAG)).toEqual([zweite, erste]);
    expect(await repo.listeOrganisationIds(DIENSTAG)).toEqual([erste, zweite]);
  });

  it('hängender Lauf mit „vorbereitet“-Versand → beim nächsten Start fehler (abgebrochen); Posten am nächsten Werktag erneut', async () => {
    stand.erinnerungLaeufe.push({ id: 'haengt', laufDatum: MONTAG, ausloeser: 'pg_cron', status: 'laeuft', gestartetAm: '2026-11-30T05:00:00Z', beendetAm: null });
    const sammel = skriptAdapter();
    // Plan für Marco ermitteln und als „vorbereitet“ des hängenden Laufs anlegen (Funktion nach der Reservierung beendet)
    const probe = erzeugeDemoStand(MONTAG);
    await fuehreErinnerungslaufAus(new DemoSystemRepository(probe), sammel.adapter, opt(MONTAG));
    const v = probe.mailVersand.find((x) => x.empfaengerBenutzerId === B.marco && x.laufDatum === MONTAG)!;
    stand.mailVersand.push({ ...structuredClone(v), laufId: 'haengt', status: 'vorbereitet', versuche: 0, anbieterId: null, versendetAm: null });
    stand.erinnerungPosten.push(...structuredClone(probe.erinnerungPosten.filter((p) => p.versandId === v.id)));

    const { adapter, gesendet } = skriptAdapter();
    const e = await fuehreErinnerungslaufAus(repo, adapter, { ...opt(MONTAG), jetzt: new Date('2026-11-30T05:20:00Z') });
    expect(e.status).toBe('fertig');
    expect(stand.erinnerungLaeufe.find((l) => l.id === 'haengt')!.status).toBe('fehler');
    expect(stand.mailVersand.find((x) => x.id === v.id)).toMatchObject({ status: 'fehler', fehlerCode: 'abgebrochen' });
    expect(gesendet.some((g) => g.mail.an === email(B.marco))).toBe(false); // eine Mail je Tag (F-33)
    const dienstag = skriptAdapter();
    await fuehreErinnerungslaufAus(repo, dienstag.adapter, opt(DIENSTAG));
    expect(versandVon(B.marco, DIENSTAG)).toHaveLength(1);
    expect(versandVon(B.marco, DIENSTAG)[0].status).toBe('versendet');
  });

  it('laufender (nicht hängender) Lauf: seine „vorbereitet“-Versände bleiben unberührt', async () => {
    const start = await repo.starteLauf({ laufDatum: MONTAG, ausloeser: 'pg_cron', erzwingen: false, jetzt: '2026-11-30T05:00:00Z' });
    if (start.ergebnis !== 'gestartet') throw new Error('Lauf nicht gestartet');
    stand.mailVersand.push({
      id: 'v-laeuft', organisationId: DEMO_ORG_ID, laufId: start.lauf.id, laufDatum: MONTAG, art: 'frist_digest', empfaengerBenutzerId: B.marco,
      status: 'vorbereitet', versuche: 0, anbieterId: null, fehlerCode: null, postenAnzahl: 1, erstelltAm: '', versendetAm: null, statusAm: '',
    });
    expect((await repo.starteLauf({ laufDatum: MONTAG, ausloeser: 'vercel_cron', erzwingen: false, jetzt: '2026-11-30T05:01:00Z' })).ergebnis).toBe('laeuft');
    expect(stand.mailVersand.find((v) => v.id === 'v-laeuft')!.status).toBe('vorbereitet');
  });
});

describe('Manueller Lauf und Trockenlauf (F-33, F-37)', () => {
  it('manueller Lauf einer Organisation blockiert den Tageslauf nicht', async () => {
    const m = await fuehreErinnerungslaufAus(repo, vorschauAdapter(), opt(MONTAG, { ausloeser: 'manuell', erzwingen: true, organisationIds: [DEMO_ORG_ID] }));
    expect(m.status).toBe('fertig');
    expect(stand.mailVersand.filter((v) => v.laufDatum === MONTAG).every((v) => v.organisationId === DEMO_ORG_ID)).toBe(true);
    const cron = await fuehreErinnerungslaufAus(repo, skriptAdapter().adapter, opt(MONTAG));
    expect(cron.status).toBe('fertig');
    expect(stand.mailVersand.some((v) => v.laufDatum === MONTAG && v.organisationId === DEMO_ORG2_ID)).toBe(true);
  });

  it('Trockenlauf: kein Lauf, kein Versand, keine Posten, kein Status – nur gerenderte Mails der gewählten Organisation; wiederholbar', async () => {
    const vorher = structuredClone({ l: stand.erinnerungLaeufe, v: stand.mailVersand, p: stand.erinnerungPosten });
    const o = opt(MONTAG, { ausloeser: 'manuell', erzwingen: true, organisationIds: [DEMO_ORG_ID], trockenlauf: true });
    const e = await fuehreErinnerungslaufAus(repo, vorschauAdapter(), o);
    expect(e).toMatchObject({ status: 'fertig', laufId: null, organisationen: 1 });
    expect(e.mails).toBeGreaterThan(0);
    expect({ l: stand.erinnerungLaeufe, v: stand.mailVersand, p: stand.erinnerungPosten }).toEqual(vorher);
    const mails = listeVorschauMails(DEMO_ORG_ID);
    expect(mails).toHaveLength(e.mails);
    expect(listeVorschauMails(DEMO_ORG2_ID)).toEqual([]);
    // nichts gebucht → zweiter Trockenlauf zeigt dieselben Mails erneut; ein echter Lauf danach sendet normal
    expect((await fuehreErinnerungslaufAus(repo, vorschauAdapter(), o)).mails).toBe(e.mails);
    const echt = await fuehreErinnerungslaufAus(repo, skriptAdapter().adapter, opt(MONTAG));
    expect(echt.mails).toBeGreaterThanOrEqual(e.mails);
  });

  it('Trockenlauf setzt keine Sperre und läuft auch neben einem laufenden Lauf, ohne ihn zu verändern', async () => {
    stand.erinnerungLaeufe.push({ id: 'aktiv', laufDatum: MONTAG, ausloeser: 'pg_cron', status: 'laeuft', gestartetAm: '2026-11-30T04:59:00Z', beendetAm: null });
    const e = await fuehreErinnerungslaufAus(repo, vorschauAdapter(), opt(MONTAG, { erzwingen: true, organisationIds: [DEMO_ORG_ID], trockenlauf: true }));
    expect(e.status).toBe('fertig');
    expect(stand.erinnerungLaeufe.find((l) => l.id === 'aktiv')!.status).toBe('laeuft');
  });

  it('vorschau zählt nur im Demo-Modus als erinnert', () => {
    expect(VERSAND_ERFOLGREICH).not.toContain('vorschau');
    expect(VERSAND_ERFOLGREICH_DEMO).toContain('vorschau');
  });
});

describe('Site-URL für Mail-Links (F-38)', () => {
  afterEach(() => vi.unstubAllEnvs());
  it('Produktion (Supabase) ohne NEXT_PUBLIC_SITE_URL → nicht_konfiguriert, nichts geschrieben', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://x.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon');
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
    const vorher = structuredClone({ l: stand.erinnerungLaeufe, v: stand.mailVersand });
    const { adapter, gesendet } = skriptAdapter();
    expect((await fuehreErinnerungslaufAus(repo, adapter, opt(MONTAG))).status).toBe('nicht_konfiguriert');
    expect(gesendet).toEqual([]);
    expect({ l: stand.erinnerungLaeufe, v: stand.mailVersand }).toEqual(vorher);
  });
  it('mit NEXT_PUBLIC_SITE_URL: Links auf die konfigurierte Adresse, nie localhost', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://app.readyloop.de/');
    const { adapter, gesendet } = skriptAdapter();
    await fuehreErinnerungslaufAus(repo, adapter, opt(MONTAG));
    expect(gesendet.length).toBeGreaterThan(0);
    for (const g of gesendet) {
      expect(g.mail.text).toContain('https://app.readyloop.de/');
      expect(g.mail.text + g.mail.html).not.toContain('localhost');
    }
  });
});

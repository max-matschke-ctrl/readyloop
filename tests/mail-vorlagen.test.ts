// BE-24: Mail-Vorlagen (F-38, docs/design/mail-vorlagen.md). Digests entstehen aus planeErinnerungen (Fixtures wie BE-22).
import { describe, expect, it } from 'vitest';
import { addTage } from '@/domain/datum';
import {
  planeErinnerungen,
  standardEinstellung,
  type DigestPlan,
  type PlanEingabe,
  type PlanMaGeraet,
  type PlanMitglied,
  type PlanPruefart,
  type PostenPlan,
} from '@/domain/erinnerungen';
import { PFLICHTMAIL_BEGRUENDUNG, type FristStatus, type StatusErgebnis } from '@/domain/types';
import { escapeHtml, fristText, renderMail, type MailKontext } from '@/server/mail/vorlagen';

const HEUTE = '2026-11-30'; // Montag, KW 49
const SITE = 'https://app.readyloop.example';
const BETRIEB = 'Elbtal Fördertechnik GmbH';

const PERSONEN = ['Katrin Vogel', 'Dr. Jens Hartmann', 'Marco Lindner', 'Sabine Krüger', 'Tobias Berger', 'Jonas Richter', 'Aylin Demir'];
const m = (benutzerId: string, name: string, rolle: PlanMitglied['rolle'], bereichIds: string[] = []): PlanMitglied => ({
  benutzerId,
  name,
  email: `${benutzerId}@example.org`,
  rolle,
  bereichIds,
});
const ADM = m('u-adm', 'Katrin Vogel', 'admin');
const SIF = m('u-sif', 'Dr. Jens Hartmann', 'sifa');
const VER = m('u-ver', 'Marco Lindner', 'verantwortlicher', ['lager']);
const VER_P = m('u-ver-p', 'Sabine Krüger', 'verantwortlicher', ['prod']);
const PRF = m('u-prf', 'Tobias Berger', 'pruefer');
const JONAS = m('u-jonas', 'Jonas Richter', 'mitarbeiter');
const AYLIN = m('u-aylin', 'Aylin Demir', 'mitarbeiter');

function status(r: number | null, s?: FristStatus): StatusErgebnis {
  if (r === null) return { status: s ?? 'gbu', faelligAm: null, restTage: null };
  return { status: s ?? (r < 0 ? 'ueberfaellig' : r <= 30 ? 'bald_faellig' : 'ok'), faelligAm: addTage(HEUTE, r), restTage: r };
}

function pa(id: string, r: number | null, extra: Partial<PlanPruefart> = {}): PlanPruefart {
  return {
    geraetPruefartId: id,
    geraetId: `g-${id}`,
    bereichId: 'lager',
    geraetBezeichnung: `Gerät ${id}`,
    inventarnummer: `L-${id}`,
    pruefartBezeichnung: 'Wiederkehrende Prüfung',
    betriebsstatus: 'in_betrieb',
    status: status(r, extra.status?.status),
    frist: r === null ? null : { monate: 12, quelle: 'katalog', stufe: 'B', fundstelle: 'DGUV Information 208-043' },
    zugewiesenerPrueferId: 'u-prf',
    katalogEntwurf: false,
    ...extra,
  };
}

const MA_GERAET: PlanMaGeraet = {
  geraetId: 'g-l008',
  bereichId: 'lager',
  bezeichnung: 'Stehleiter 6 Stufen',
  inventarnummer: 'L-008',
  kategorie: 'wechselnd',
  zugeordnetAn: null,
  uebernommenVon: 'u-jonas',
  nutzung: 'nicht_verwenden',
  grundText: 'Überfällig',
  zustandsKennung: 'ueberfaellig:2026-10-26',
};

function eingabe(extra: Partial<PlanEingabe> = {}): PlanEingabe {
  return {
    heute: HEUTE,
    organisationId: 'org',
    bereiche: [
      { id: 'lager', name: 'Lager' },
      { id: 'prod', name: 'Produktion' },
    ],
    einstellungen: [],
    mitglieder: [ADM, SIF, VER, VER_P, PRF, JONAS, AYLIN],
    pruefarten: [
      pa('001', -35, { geraetBezeichnung: 'Gabelstapler Linde H25' }),
      pa('002', 25, { geraetBezeichnung: 'Elektro-Hubwagen', katalogEntwurf: true }),
      pa('003', 0, { geraetBezeichnung: 'Regal Halle 2', inventarnummer: null }),
      pa('004', 60, { geraetBezeichnung: 'Kettenzug', bereichId: 'prod' }),
      pa('005', null, { geraetBezeichnung: 'Druckluftbehälter' }), // gbu: nur Prüfer-Übersicht
      pa('006', 12, { geraetBezeichnung: 'Hebebühne', status: { ...status(12), status: 'vor_nutzung_pruefen', grund: 'anlass' } }),
    ],
    maGeraete: [MA_GERAET],
    abmeldungen: [],
    bisherige: [],
    ...extra,
  };
}

const PLAN = planeErinnerungen(eingabe());
const digest = (id: string) => PLAN.find((d) => d.empfaenger.benutzerId === id)!;
const kontext = (d: DigestPlan): MailKontext => ({
  organisationName: BETRIEB,
  siteUrl: SITE,
  laufDatum: HEUTE,
  abmeldung: d.abbestellbar ? { seitenUrl: `${SITE}/abmelden?t=tok.sig`, oneClickUrl: `${SITE}/api/mail/abmelden?t=tok.sig` } : null,
});
const render = (d: DigestPlan, k: Partial<MailKontext> = {}) => renderMail(d, { ...kontext(d), ...k });

describe('Fixture', () => {
  it('liefert je Art einen Digest', () => {
    expect(digest('u-ver').art).toBe('frist_digest');
    expect(digest('u-sif').art).toBe('frist_digest');
    expect(digest('u-adm').art).toBe('frist_digest');
    expect(digest('u-prf').art).toBe('pruefer_woche');
    expect(digest('u-jonas').art).toBe('ma_hinweis');
  });
});

describe('fristText und escapeHtml', () => {
  it('Frist-Zeile mit Quelle, Stufe, Fundstelle; ohne Frist „Frist über GBU festlegen“', () => {
    expect(fristText({ monate: 12, quelle: 'gbu', stufe: 'C', fundstelle: 'GBU Lager 2025' })).toBe(
      '12 Monate · Gefährdungsbeurteilung · Stufe C · GBU Lager 2025',
    );
    expect(fristText({ monate: 6, quelle: 'katalog', stufe: 'B', fundstelle: 'DGUV 208-043' })).toBe(
      '6 Monate · Prüfkatalog · Stufe B · DGUV 208-043',
    );
    expect(fristText(null)).toBe('Frist über GBU festlegen');
  });
  it('escapeHtml für & < > " \'', () => {
    expect(escapeHtml(`<a href="x">&'`)).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&#39;');
  });
});

describe('frist_digest (VER Lager)', () => {
  const mail = render(digest('u-ver'));

  it('Betreff mit Betrieb und Zählung', () => {
    expect(mail.betreff).toBe(`Readyloop · ${BETRIEB}: 1 nicht verwenden, 1 überfällig, 1 heute fällig, 1 demnächst`);
  });
  it('Gruppenreihenfolge im Text nach DRINGLICHKEITEN', () => {
    const pos = ['✕ Nicht verwenden (1)', '✕ Überfällig (1)', '! Heute fällig (1)', '! In den nächsten 30 Tagen fällig (1)'].map((g) =>
      mail.text.indexOf(g),
    );
    expect(pos.every((p) => p >= 0)).toBe(true);
    expect([...pos].sort((a, b) => a - b)).toEqual(pos);
  });
  it('Frist-Zeile mit „Stufe B“ und Fundstelle in Text und HTML', () => {
    expect(mail.text).toContain('12 Monate · Prüfkatalog · Stufe B · DGUV Information 208-043');
    expect(mail.html).toContain('Frist: 12 Monate · Prüfkatalog · Stufe B · DGUV Information 208-043');
  });
  it('Pflichtmail: keine List-Unsubscribe-Kopfzeile, Fußzeile mit Begründung', () => {
    expect(mail.kopfzeilen).toEqual({ 'X-Readyloop-Art': 'frist_digest' });
    expect(mail.html).toContain(escapeHtml(PFLICHTMAIL_BEGRUENDUNG));
    expect(mail.text.replace(/\s+/g, ' ')).toContain(PFLICHTMAIL_BEGRUENDUNG);
    expect(mail.html).not.toContain('abbestellen');
  });
  it('Entwurfshinweis, weil ein Posten katalogEntwurf hat', () => {
    expect(mail.html).toContain('Prüfkatalog im Entwurf');
    expect(mail.html).toContain('für 1 Prüfart dieser Mail');
    expect(mail.html).toContain('Prüfkatalog: Entwurf');
  });
  it('Plakette je Posten und Statuszeile mit Symbol und Label', () => {
    const zeilen = mail.html.match(/<td width="56"/g) ?? [];
    expect(zeilen).toHaveLength(4);
    expect((mail.html.match(/border-radius:50%/g) ?? []).length).toBe(4);
    expect(mail.html).toContain('✕ Überfällig – nicht verwenden');
    expect(mail.html).toContain('! Vor Nutzung prüfen – nicht verwenden');
  });
  it('Plakette überfällig zeigt Monat/Jahr mit brick-Rand', () => {
    expect(mail.html).toMatch(/border:2px solid #a6452f;border-radius:50%;background:#f9ece8;[^"]*">10<br>2026<\/div>/);
  });
  it('Fälligkeitstexte', () => {
    expect(mail.text).toContain('fällig am 26.10.2026, seit 35 Tagen überfällig');
    expect(mail.text).toContain('fällig heute, 30.11.2026');
    expect(mail.text).toContain('fällig am 25.12.2026, in 25 Tagen');
  });
  it('Link je Posten auf die Geräteakte, Hauptbutton auf die Geräteliste', () => {
    expect(mail.html).toContain(`href="${SITE}/geraete/g-001"`);
    expect(mail.html).toContain(`href="${SITE}/geraete"`);
    expect(mail.text).toContain(`Öffnen:   ${SITE}/geraete/g-001`);
  });
});

describe('Eskalation im Betreff (D-I3a §6.1)', () => {
  const plan = planeErinnerungen(eingabe({ pruefarten: [pa('x', -8)], maGeraete: [] }));
  it('SIF zuständig e_sifa → „Eskalation – “; VER in Kopie → ohne', () => {
    const sif = plan.find((d) => d.empfaenger.benutzerId === 'u-sif')!;
    const ver = plan.find((d) => d.empfaenger.benutzerId === 'u-ver')!;
    expect(sif.posten[0]).toMatchObject({ stufe: 'e_sifa', rolle: 'zustaendig' });
    expect(ver.posten[0]).toMatchObject({ stufe: 'e_sifa', rolle: 'kopie' });
    expect(render(sif).betreff).toBe(`Readyloop · ${BETRIEB}: Eskalation – 1 überfällig`);
    expect(render(ver).betreff).toBe(`Readyloop · ${BETRIEB}: 1 überfällig`);
    expect(render(ver).text).toContain('Rolle:    Zur Kenntnis · Eskaliert an Sifa');
  });
  it('nur Vorlauf → „{n} Prüfungen demnächst fällig“', () => {
    const p = planeErinnerungen(eingabe({ pruefarten: [pa('a', 60), pa('b', 85), pa('c', 20)], maGeraete: [] }));
    expect(render(p.find((d) => d.empfaenger.benutzerId === 'u-ver')!).betreff).toBe(`Readyloop · ${BETRIEB}: 3 Prüfungen demnächst fällig`);
    const eins = planeErinnerungen(eingabe({ pruefarten: [pa('a', 60)], maGeraete: [] }));
    expect(render(eins.find((d) => d.empfaenger.benutzerId === 'u-ver')!).betreff).toBe(`Readyloop · ${BETRIEB}: 1 Prüfung demnächst fällig`);
  });
  it('Betrieb mit 80 Zeichen → Betreff enthält die vollständige Zählung, ≤ 150 Zeichen', () => {
    const lang = 'B'.repeat(80);
    const b = render(digest('u-ver'), { organisationName: lang }).betreff;
    expect(b).toContain('1 nicht verwenden, 1 überfällig, 1 heute fällig, 1 demnächst');
    expect(b).toContain(`${'B'.repeat(59)}…`);
    expect(b.length).toBeLessThanOrEqual(150);
  });
});

describe('pruefer_woche', () => {
  const mail = render(digest('u-prf'));
  it('Betreff mit KW, abbestellbar mit beiden Kopfzeilen', () => {
    expect(mail.betreff).toBe(`Readyloop · ${BETRIEB}: 5 Prüfungen fällig (KW 49)`); // alles außer ok (004 mit r = 60)
    expect(mail.kopfzeilen).toEqual({
      'X-Readyloop-Art': 'pruefer_woche',
      'List-Unsubscribe': `<${SITE}/api/mail/abmelden?t=tok.sig>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    });
  });
  it('Posten ohne Frist → „Frist über GBU festlegen“, Plakette GBU gestrichelt', () => {
    expect(mail.text).toContain('Frist:    Frist über GBU festlegen');
    expect(mail.html).toContain('Frist über GBU festlegen');
    expect(mail.html).toMatch(/border:2px dashed #7c8797;[^"]*">GBU<\/div>/);
  });
  it('kein Postenlink, Fuß mit Abmeldeseite (nicht One-Click)', () => {
    expect(mail.html).not.toContain('Geräteakte öffnen');
    expect(mail.html).toContain(`href="${SITE}/abmelden?t=tok.sig"`);
    expect(mail.text).toContain(`Diese Mails abbestellen:\n${SITE}/abmelden?t=tok.sig`);
    expect(mail.text).not.toContain('/api/mail/abmelden');
    expect(mail.text).toContain('Wochenübersicht für Prüfer · KW 49');
  });
});

describe('ma_hinweis', () => {
  const mail = render(digest('u-jonas'));
  it('Betreff, Kopfzeilen, kein Frist-Inhalt, keine Plakette', () => {
    expect(mail.betreff).toBe('Readyloop · Nicht verwenden: Stehleiter 6 Stufen');
    expect(mail.kopfzeilen['List-Unsubscribe']).toBe(`<${SITE}/api/mail/abmelden?t=tok.sig>`);
    expect(mail.kopfzeilen['List-Unsubscribe-Post']).toBe('List-Unsubscribe=One-Click');
    expect(mail.html).not.toContain('Frist:');
    expect(mail.text).not.toContain('Frist');
    expect(mail.html).not.toContain('border-radius:50%');
    expect(mail.html).toContain('Grund: <b>Überfällig</b>');
    expect(mail.text).toContain('✕ NICHT VERWENDEN');
    expect(mail.text.replace(/\s+/g, ' ')).toContain('Gerät nicht verwenden, den Verantwortlichen informieren und zurückgeben.');
  });
  it('mehrere Geräte → Sammelbetreff', () => {
    const p = planeErinnerungen(eingabe({ pruefarten: [], maGeraete: [MA_GERAET, { ...MA_GERAET, geraetId: 'g-2', zustandsKennung: 'mangel:m1' }] }));
    expect(render(p[0]).betreff).toBe('Readyloop · 2 Ihrer Geräte nicht verwenden');
  });
});

describe('Datenschutz und Sicherheit', () => {
  it('kein Personenname in Betreff, Text oder HTML (alle Arten)', () => {
    for (const d of PLAN) {
      const mail = render(d);
      for (const name of [...PERSONEN, d.empfaenger.name]) {
        for (const teil of [mail.betreff, mail.text, mail.html, JSON.stringify(mail.kopfzeilen)]) {
          expect(teil, `${d.art}: ${name}`).not.toContain(name);
        }
      }
      expect(mail.text).toContain('Guten Tag,');
    }
  });
  it('Bezeichnung <script>alert(1)</script> erscheint escaped; Betreff mit CR/LF einzeilig', () => {
    const boese = '<script>alert(1)</script>\r\nBcc: x@y.de';
    const p = planeErinnerungen(eingabe({ pruefarten: [], maGeraete: [{ ...MA_GERAET, bezeichnung: boese }] }));
    const mail = render(p[0]);
    expect(mail.html).not.toContain('<script>');
    expect(mail.html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(mail.betreff).not.toMatch(/[\r\n]/);
    expect(mail.betreff).toBe('Readyloop · Nicht verwenden: <script>alert(1)</script> Bcc: x@y.de');
    const v = planeErinnerungen(eingabe({ pruefarten: [pa('a', -1, { geraetBezeichnung: boese, pruefartBezeichnung: `"'&` })], maGeraete: [] }));
    const vm = render(v.find((d) => d.empfaenger.benutzerId === 'u-ver')!);
    expect(vm.html).not.toContain('<script>');
    expect(vm.html).toContain('&quot;&#39;&amp;');
  });
  it('HTML ohne <img, <script, <link, <svg, http://, Zeilenumbrüche und ohne #c8902e', () => {
    for (const d of PLAN) {
      const { html } = render(d);
      for (const verboten of ['<img', '<script', '<link', '<svg', 'http://', '\n', '#c8902e']) expect(html, `${d.art} ${verboten}`).not.toContain(verboten);
    }
  });
  it('Vorschauzeile ≤ 110 Zeichen und vor der ersten Tabelle', () => {
    for (const d of PLAN) {
      const { html } = render(d);
      const m = html.match(/<div style="display:none;[^"]*">([^&<]*)/)!;
      expect(m[1].length).toBeLessThanOrEqual(110);
      expect(html.indexOf('display:none')).toBeLessThan(html.indexOf('<table'));
    }
  });
  it('Textteil: keine Zeile über 72 Zeichen außer mit URL', () => {
    const lang = eingabe({
      pruefarten: Array.from({ length: 5 }, (_, i) =>
        pa(`l${i}`, -i - 1, {
          geraetBezeichnung: 'Sehr lange Gerätebezeichnung mit vielen Wörtern und noch mehr Text dahinter',
          pruefartBezeichnung: 'Wiederkehrende Prüfung nach Betriebssicherheitsverordnung mit Zusatz',
          frist: { monate: 12, quelle: 'katalog', stufe: 'A', fundstelle: 'DGUV Vorschrift 68 § 37 Abs. 1 in Verbindung mit TRBS 1201 Teil 2' },
          inventarnummer: 'INVENTARNUMMEROHNELEERZEICHENDIESEHRLANGISTUNDNICHTAUFHOERTZUWACHSENXYZ',
        }),
      ),
    });
    for (const d of planeErinnerungen(lang)) {
      for (const zeile of render(d, { organisationName: 'Elbtal Fördertechnik und Lagerlogistik Gesellschaft mit beschränkter Haftung' }).text.split('\n')) {
        if (!zeile.includes('://')) expect(zeile.length, zeile).toBeLessThanOrEqual(72);
      }
    }
  });
});

describe('Kappung und Größe', () => {
  const posten = (n: number, lang = false): PostenPlan[] =>
    Array.from({ length: n }, (_, i) => ({
      schluessel: `frist:p${i}:v30:2026-12-20:u-ver`,
      art: 'frist',
      stufe: 'v30',
      rolle: 'zustaendig',
      dringlichkeit: 'bald_faellig',
      geraetId: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
      geraetPruefartId: `p${i}`,
      bereichId: 'lager',
      bereichName: lang ? 'B'.repeat(20) : 'Lager',
      geraetBezeichnung: lang ? `G${String(i).padStart(3, '0')}${'x'.repeat(36)}` : `Gerät ${i}`,
      inventarnummer: `L-${i}`,
      pruefartBezeichnung: lang ? 'P'.repeat(40) : 'Prüfung',
      bezugDatum: '2026-12-20',
      faelligAm: '2026-12-20',
      restTage: 20,
      status: 'bald_faellig',
      frist: { monate: 12, quelle: 'katalog', stufe: 'B', fundstelle: lang ? 'F'.repeat(60) : 'DGUV' },
      hinweise: lang ? ['Bereich ohne Verantwortlichen'] : [],
      katalogEntwurf: false,
      pfad: `/geraete/00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
    }));
  const d = (n: number, lang = false): DigestPlan => ({ art: 'frist_digest', empfaenger: VER, posten: posten(n, lang), abbestellbar: false });

  it('130 Posten → 100 in der Mail + Satz „… und 30 weitere in Readyloop“; Zusammenfassung mit voller Zahl', () => {
    const mail = render(d(130));
    expect((mail.html.match(/<td width="56"/g) ?? []).length).toBe(100);
    expect(mail.html).toContain('… und 30 weitere in Readyloop.');
    expect(mail.text).toContain('… und 30 weitere in Readyloop.');
    expect(mail.html).toContain('<b style="font-size:20px;line-height:24px">130</b>');
    expect(mail.html).toContain('In den nächsten 30 Tagen fällig (100)');
    expect(mail.betreff).toBe(`Readyloop · ${BETRIEB}: 130 Prüfungen demnächst fällig`);
  });
  it('ohne Kappung kein Satz; ohne Entwurf kein Entwurfshinweis', () => {
    const mail = render(d(3));
    expect(mail.html).not.toContain('weitere in Readyloop');
    expect(mail.html).not.toContain('Prüfkatalog im Entwurf');
    expect(mail.text).not.toContain('Prüfkatalog im Entwurf');
  });
  it('Entwurfshinweis zählt Prüfarten (Plural)', () => {
    const p = posten(3).map((x) => ({ ...x, katalogEntwurf: true }));
    expect(render({ ...d(0), posten: p }).html).toContain('für 3 Prüfarten dieser Mail');
  });
  // OFFEN (an designer gemeldet): Das Gerüst aus D-I3a §5.8 ergibt mit der Fixture aus §10.4 rund 980 Byte je Posten,
  // bei 100 Posten ≈ 103 000 Byte – über dem Budget M-5 (95 000) und über der Gmail-Kürzung (≈ 102 KB).
  // Laut D-I3a §10.4 wird nicht still gekürzt. it.fails kippt auf rot, sobald das Budget erreicht ist → dann auf it umstellen.
  it.fails('100 Posten mit langen Werten → HTML < 95 000 Byte (M-5) – offen, Rückmeldung designer', () => {
    const { html } = render(d(100, true));
    expect(Buffer.byteLength(html, 'utf8')).toBeLessThan(95_000);
  });
  it('Größe wächst linear: 10 Posten mit langen Werten < 16 000 Byte', () => {
    expect(Buffer.byteLength(render(d(10, true)).html, 'utf8')).toBeLessThan(16_000);
  });
  it('ohne Posten → Fehler (ohne Posten keine Mail)', () => {
    expect(() => render(d(0))).toThrow();
  });
});

describe('Snapshots je Art', () => {
  for (const id of ['u-ver', 'u-prf', 'u-jonas'] as const) {
    it(`${id}: Text und HTML`, () => {
      const mail = render(digest(id));
      expect(mail.betreff).toMatchSnapshot('betreff');
      expect(mail.text).toMatchSnapshot('text');
      expect(mail.html).toMatchSnapshot('html');
    });
  }
  it('Standardeinstellung bleibt Grundlage der Fixture', () => {
    expect(standardEinstellung('org', 'lager').staffelTage).toEqual([90, 60, 30]);
  });
});

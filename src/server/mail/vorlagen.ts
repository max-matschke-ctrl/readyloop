// Mail-Vorlagen (BE-24) nach F-38 und docs/design/mail-vorlagen.md (D-I3a). Rein: gleiche Eingabe → gleiche Mail.
// HTML als String-Vorlage (kein React Email), nur Inline-Styles, keine externen Ressourcen, keine Zeilenumbrüche.
// Keine Personennamen: digest.empfaenger.name wird hier bewusst nie gelesen (F-38).
import { formatDatum, isoKalenderwoche } from '@/domain/datum';
import type { DigestPlan, PostenPlan } from '@/domain/erinnerungen';
import {
  DRINGLICHKEIT_LABEL,
  DRINGLICHKEITEN,
  FRIST_QUELLE_LABEL,
  MAIL_MAX_POSTEN,
  PFLICHTMAIL_BEGRUENDUNG,
  POSTEN_ROLLE_LABEL,
  ROLLE_LABEL,
  STATUS_LABEL,
  type Dringlichkeit,
  type FristStatus,
  type IsoDate,
  type MailArt,
  type OeffentlicheFrist,
} from '@/domain/types';
import type { GerenderteMail } from './types';

export interface MailKontext {
  organisationName: string;
  siteUrl: string;
  laufDatum: IsoDate;
  abmeldung: { seitenUrl: string; oneClickUrl: string } | null; // null bei Pflichtmail
}

// ---------------------------------------------------------------- Konstanten (D-I3a §2, §5)

const SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const FARBE = {
  paper: '#f5f3ee',
  white: '#ffffff',
  ink: '#1e2328',
  steel: '#44546a',
  steel800: '#2c3646',
  steel200: '#c5ccd5',
  steel400: '#7c8797',
  steel50: '#f1f3f6',
  moss: '#5b7f3a',
  moss50: '#eef3e8',
  ochre600: '#b07d22',
  ochre50: '#fbf3e2',
  brick: '#a6452f',
  brick50: '#f9ece8',
} as const;

/** Kopie von STATUS_SYMBOL (src/components/status.ts) – bewusst nicht aus src/components importiert. */
const STATUS_SYMBOL: Record<FristStatus, string> = {
  ok: '✓',
  bald_faellig: '!',
  ueberfaellig: '✕',
  vor_nutzung_pruefen: '!',
  unbekannt: '?',
  gbu: '§',
};

const GRUPPE: Record<Dringlichkeit, { symbol: string; linie: string }> = {
  nicht_verwenden: { symbol: '✕', linie: FARBE.brick },
  ueberfaellig: { symbol: '✕', linie: FARBE.brick },
  heute_faellig: { symbol: '!', linie: FARBE.ochre600 },
  bald_faellig: { symbol: '!', linie: FARBE.ochre600 },
  vorlauf: { symbol: '✓', linie: FARBE.moss },
  ohne_termin: { symbol: '?', linie: FARBE.steel400 },
};

const BUTTON: Record<MailArt, { text: string; pfad: string }> = {
  frist_digest: { text: 'Geräteliste öffnen', pfad: '/geraete' },
  pruefer_woche: { text: 'Prüfaufgaben öffnen', pfad: '/pruefer' },
  ma_hinweis: { text: 'Meine Geräte öffnen', pfad: '/meine-geraete' },
};

const ROLLENERKLAERUNG =
  '„Sie sind zuständig“: Sie veranlassen die Prüfung. „Zur Kenntnis“: Sie werden informiert, zuständig sind andere.';
const MA_BAND_UNTERZEILE = 'Gerät nicht benutzen. Verantwortlichen informieren.';
const MA_STAND = 'Den aktuellen Stand zeigen „Meine Geräte“ und der QR-Code am Gerät.';
const HINWEIS_ZURUECKGEBEN = 'Bitte zurückgeben';
const BETREFF_MAX = 150;
const BETRIEB_MAX = 60;
const VORSCHAU_MAX = 110;
const TEXT_BREITE = 72;
const ABSTAND = (px: number) => `<tr><td height="${px}" style="font-size:0;line-height:0">&nbsp;</td></tr>`;

// ---------------------------------------------------------------- kleine Helfer

export function escapeHtml(wert: string): string {
  return wert.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const e = escapeHtml;
const einzeilig = (s: string) => s.replace(/[\r\n\u2028\u2029]+/g, " ").replace(/\s{2,}/g, " ").trim();
const kuerze = (s: string, max: number) => (s.length <= max ? s : `${s.slice(0, max - 1).trimEnd()}…`);
const tage = (n: number) => (n === 1 ? '1 Tag' : `${n} Tagen`);
const pruefungen = (n: number) => (n === 1 ? '1 Prüfung' : `${n} Prüfungen`);

/** F-38: „{monate} Monate · {Quelle} · Stufe {A–D} · {Fundstelle}“; ohne freigegebene Frist „Frist über GBU festlegen“. */
export function fristText(frist: OeffentlicheFrist | null): string {
  if (frist === null) return 'Frist über GBU festlegen';
  const monate = frist.monate === 1 ? '1 Monat' : `${frist.monate} Monate`;
  return `${monate} · ${FRIST_QUELLE_LABEL[frist.quelle]} · Stufe ${frist.stufe} · ${frist.fundstelle}`;
}

function fristZeile(p: PostenPlan): string {
  const basis = p.frist === null ? fristText(null) : `Frist: ${fristText(p.frist)}`;
  return p.katalogEntwurf ? `${basis} · Prüfkatalog: Entwurf` : basis;
}

function statusZeile(status: FristStatus): string {
  return `${STATUS_SYMBOL[status]} ${STATUS_LABEL[status]}`;
}

function faelligText(p: PostenPlan): string {
  if (p.faelligAm === null || p.restTage === null) return 'kein Fälligkeitsdatum';
  const datum = formatDatum(p.faelligAm);
  if (p.restTage > 0) return `fällig am ${datum}, in ${tage(p.restTage)}`;
  if (p.restTage === 0) return `fällig heute, ${datum}`;
  return `fällig am ${datum}, seit ${tage(-p.restTage)} überfällig`;
}

function kurz(p: PostenPlan): string {
  switch (p.dringlichkeit) {
    case 'nicht_verwenden':
      return 'nicht verwenden';
    case 'ueberfaellig':
      return `seit ${tage(-(p.restTage ?? 0))} überfällig`;
    case 'heute_faellig':
      return 'heute fällig';
    case 'bald_faellig':
    case 'vorlauf':
      return `fällig in ${tage(p.restTage ?? 0)}`;
    case 'ohne_termin':
      return 'ohne Termin';
  }
}

function zaehle(posten: PostenPlan[]): Map<Dringlichkeit, number> {
  const z = new Map<Dringlichkeit, number>();
  for (const p of posten) z.set(p.dringlichkeit, (z.get(p.dringlichkeit) ?? 0) + 1);
  return z;
}

function gruppiere(posten: PostenPlan[]): { d: Dringlichkeit; posten: PostenPlan[] }[] {
  return DRINGLICHKEITEN.map((d) => ({ d, posten: posten.filter((p) => p.dringlichkeit === d) })).filter((g) => g.posten.length > 0);
}

/** Nutzungsgrund der MA-Mail: erster Hinweis außer „Bitte zurückgeben“. */
function maGrund(p: PostenPlan): string {
  return p.hinweise.find((h) => h !== HINWEIS_ZURUECKGEBEN) ?? 'Nicht verwenden';
}

function maHandlung(p: PostenPlan): string {
  return p.hinweise.includes(HINWEIS_ZURUECKGEBEN)
    ? 'Gerät nicht verwenden, den Verantwortlichen informieren und zurückgeben.'
    : 'Gerät nicht verwenden und den Verantwortlichen informieren.';
}

// ---------------------------------------------------------------- Betreff, Vorschauzeile, Texte (§6)

function betreffFuer(digest: DigestPlan, betrieb: string, kw: number): string {
  const b = kuerze(einzeilig(betrieb), BETRIEB_MAX);
  const n = digest.posten.length;
  let betreff: string;
  switch (digest.art) {
    case 'frist_digest': {
      const z = zaehle(digest.posten);
      const demnaechst = (z.get('bald_faellig') ?? 0) + (z.get('vorlauf') ?? 0);
      const teile = [
        z.get('nicht_verwenden') ? `${z.get('nicht_verwenden')} nicht verwenden` : null,
        z.get('ueberfaellig') ? `${z.get('ueberfaellig')} überfällig` : null,
        z.get('heute_faellig') ? `${z.get('heute_faellig')} heute fällig` : null,
        demnaechst ? `${demnaechst} demnächst` : null,
      ].filter((t): t is string => t !== null);
      const eskalation = digest.posten.some((p) => p.rolle === 'zustaendig' && (p.stufe === 'e_sifa' || p.stufe === 'e_admin'));
      const zaehlung =
        teile.length === 1 && demnaechst > 0
          ? `${pruefungen(demnaechst)} demnächst fällig`
          : teile.length > 0
            ? teile.join(', ')
            : `${pruefungen(n)} mit Handlungsbedarf`;
      betreff = `Readyloop · ${b}: ${eskalation ? 'Eskalation – ' : ''}${zaehlung}`;
      break;
    }
    case 'pruefer_woche':
      betreff = `Readyloop · ${b}: ${pruefungen(n)} fällig (KW ${kw})`;
      break;
    case 'ma_hinweis':
      betreff =
        n === 1 ? `Readyloop · Nicht verwenden: ${einzeilig(digest.posten[0].geraetBezeichnung)}` : `Readyloop · ${n} Ihrer Geräte nicht verwenden`;
      break;
  }
  return kuerze(einzeilig(betreff), BETREFF_MAX);
}

function vorschauzeile(digest: DigestPlan, betrieb: string, kw: number): string {
  const n = digest.posten.length;
  const erster = digest.posten[0];
  let text: string;
  switch (digest.art) {
    case 'frist_digest':
      text = `Zuerst: ${erster.geraetBezeichnung} – ${kurz(erster)}. ${pruefungen(n)} in dieser Mail.`;
      break;
    case 'pruefer_woche':
      text = `Zuerst: ${erster.geraetBezeichnung} – ${kurz(erster)}. ${pruefungen(n)} bei ${betrieb} in KW ${kw}.`;
      break;
    case 'ma_hinweis':
      text =
        n === 1
          ? `${maGrund(erster)}. Gerät nicht benutzen und den Verantwortlichen informieren.`
          : `${n} Geräte, die Sie haben, dürfen nicht benutzt werden.`;
      break;
  }
  return kuerze(einzeilig(text), VORSCHAU_MAX);
}

function einleitung(digest: DigestPlan, betrieb: string): string {
  const n = digest.posten.length;
  switch (digest.art) {
    case 'frist_digest':
      return `diese Prüfungen bei ${betrieb} brauchen Aufmerksamkeit. Die dringlichsten stehen oben.`;
    case 'pruefer_woche':
      return `diese Prüfungen sind Ihnen bei ${betrieb} zugewiesen und fällig oder noch ohne Termin.`;
    case 'ma_hinweis':
      return n === 1
        ? 'ein Gerät, das Sie haben, darf ab sofort nicht benutzt werden.'
        : `${n} Geräte, die Sie haben, dürfen ab sofort nicht benutzt werden.`;
  }
}

function kopfzeile(art: MailArt, laufDatum: IsoDate, kw: number): string {
  switch (art) {
    case 'frist_digest':
      return `Fristen-Erinnerung vom ${formatDatum(laufDatum)}`;
    case 'pruefer_woche':
      return `Wochenübersicht für Prüfer · KW ${kw}`;
    case 'ma_hinweis':
      return `Hinweis „Nicht verwenden“ vom ${formatDatum(laufDatum)}`;
  }
}

function entwurfsText(n: number): string {
  return `Der Readyloop-Prüfkatalog ist für ${n} ${n === 1 ? 'Prüfart' : 'Prüfarten'} dieser Mail noch nicht fachlich freigegeben (Entwurf). Maßgeblich sind die in Readyloop freigegebenen Fristen mit der angegebenen Quelle und Ihre Gefährdungsbeurteilung.`;
}

// ---------------------------------------------------------------- HTML-Bausteine (§4, §5, §7)

function plakette(p: PostenPlan): string {
  const status = p.status ?? 'unbekannt';
  const datum = (f: string, r: string) =>
    p.faelligAm === null
      ? null
      : `<div style="width:40px;height:35px;padding-top:5px;border:2px solid ${r};border-radius:50%;background:${f};text-align:center;font-size:13px;line-height:15px;font-weight:700;color:${FARBE.ink}">${p.faelligAm.slice(5, 7)}<br>${p.faelligAm.slice(0, 4)}</div>`;
  const zeichen = (linienart: string, r: string, f: string, groesse: string, farbe: string, z: string) =>
    `<div style="width:40px;height:40px;border:2px ${linienart} ${r};border-radius:50%;background:${f};text-align:center;font-size:${groesse};line-height:40px;font-weight:700;color:${farbe}">${z}</div>`;
  const unbekannt = () => zeichen('solid', FARBE.steel, FARBE.steel50, '20px', FARBE.ink, '?');
  switch (status) {
    case 'ok':
      return datum(FARBE.moss50, FARBE.moss) ?? unbekannt();
    case 'bald_faellig':
      return datum(FARBE.ochre50, FARBE.ochre600) ?? unbekannt();
    case 'ueberfaellig':
      return datum(FARBE.brick50, FARBE.brick) ?? unbekannt();
    case 'vor_nutzung_pruefen':
      return zeichen('solid', FARBE.brick, FARBE.brick50, '20px', FARBE.brick, '!');
    case 'unbekannt':
      return unbekannt();
    case 'gbu':
      return zeichen('dashed', FARBE.steel400, FARBE.white, '13px', FARBE.ink, 'GBU');
  }
}

function button(text: string, url: string): string {
  const s = FARBE.steel;
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="${s}" style="background:${s};border-radius:4px"><a href="${e(url)}" style="display:inline-block;border-top:12px solid ${s};border-bottom:12px solid ${s};border-left:20px solid ${s};border-right:20px solid ${s};border-radius:4px;background:${s};color:#ffffff;font-size:16px;line-height:20px;font-weight:700;text-decoration:none">${e(text)}</a></td></tr></table>`;
}

function zusammenfassungHtml(posten: PostenPlan[]): string {
  const z = zaehle(posten);
  const zeilen = DRINGLICHKEITEN.filter((d) => z.get(d))
    .map(
      (d) =>
        `<tr><td style="border-left:4px solid ${GRUPPE[d].linie};padding:2px 0 2px 12px;font-size:16px;line-height:24px"><b style="font-size:20px;line-height:24px">${z.get(d)}</b>&nbsp; ${GRUPPE[d].symbol} ${e(DRINGLICHKEIT_LABEL[d])}</td></tr>${ABSTAND(6)}`,
    )
    .join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${zeilen}${ABSTAND(10)}</table>`;
}

function postenHtml(p: PostenPlan, art: MailArt, siteUrl: string): string {
  const rahmen = `border-top:1px solid ${FARBE.steel200}`;
  const inv = p.inventarnummer ? `<span class="m">${e(p.inventarnummer)}</span> · ` : '';
  const status = p.status ?? 'unbekannt';
  const kopf =
    `<tr><td width="56" valign="top" style="padding:12px 12px 12px 0;${rahmen}">${plakette(p)}</td>` +
    `<td valign="top" style="padding:12px 0;${rahmen}"><b style="font-size:16px;line-height:24px">${e(p.geraetBezeichnung)}</b><br>` +
    `${inv}${e(p.bereichName)} · ${e(p.pruefartBezeichnung ?? '')}<br>` +
    `<b>${e(statusZeile(status))}</b> · ${e(faelligText(p))}<br>` +
    `<span style="color:${FARBE.steel}">${e(fristZeile(p))}</span>`;
  const hinweise = p.hinweise.map((h) => ` · ${e(h)}`).join('');
  if (art === 'pruefer_woche') {
    return `${kopf}${p.hinweise.length > 0 ? `<br>${p.hinweise.map(e).join(' · ')}` : ''}</td></tr>`;
  }
  const rolle = p.rolle === 'zustaendig' ? `<b>${e(POSTEN_ROLLE_LABEL.zustaendig)}</b>` : e(POSTEN_ROLLE_LABEL[p.rolle]);
  return `${kopf}<br>${rolle}${hinweise}<br><a href="${e(siteUrl + p.pfad)}" style="color:${FARBE.steel800}">Geräteakte öffnen</a></td></tr>`;
}

function gruppenHtml(gezeigt: PostenPlan[], art: MailArt, siteUrl: string): string {
  return gruppiere(gezeigt)
    .map(
      (g) =>
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td colspan="2" height="28" style="font-size:0;line-height:0">&nbsp;</td></tr>` +
        `<tr><td colspan="2" style="border-left:4px solid ${GRUPPE[g.d].linie};padding:2px 0 2px 12px"><h2 style="margin:0;font-size:18px;line-height:24px;font-weight:700;color:${FARBE.ink}">${GRUPPE[g.d].symbol} ${e(DRINGLICHKEIT_LABEL[g.d])} (${g.posten.length})</h2></td></tr>` +
        `<tr><td colspan="2" height="8" style="font-size:0;line-height:0">&nbsp;</td></tr>` +
        g.posten.map((p) => postenHtml(p, art, siteUrl)).join('') +
        `</table>`,
    )
    .join('');
}

function maBandHtml(n: number): string {
  const titel = n === 1 ? 'Nicht verwenden' : `${n} Geräte nicht verwenden`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="${FARBE.brick}" style="background:${FARBE.brick};border-radius:6px;padding:16px 20px;color:#ffffff"><p style="margin:0;font-size:22px;line-height:28px;font-weight:700;color:#ffffff">✕ ${e(titel)}</p><p style="margin:4px 0 0;font-size:16px;line-height:24px;color:#ffffff">${e(MA_BAND_UNTERZEILE)}</p></td></tr>${ABSTAND(16)}</table>`;
}

function maGeraeteHtml(gezeigt: PostenPlan[]): string {
  const zeilen = gezeigt
    .map(
      (p) =>
        `<tr><td style="padding:12px 0;border-top:1px solid ${FARBE.steel200};font-size:16px;line-height:24px"><b>${e(p.geraetBezeichnung)}</b><br>` +
        `${p.inventarnummer ? `<span class="m">${e(p.inventarnummer)}</span><br>` : ''}Grund: <b>${e(maGrund(p))}</b><br>${e(maHandlung(p))}</td></tr>`,
    )
    .join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${ABSTAND(20)}${zeilen}</table><p style="margin:16px 0 0;font-size:14px;line-height:20px;color:${FARBE.steel}">${e(MA_STAND)}</p>`;
}

// ---------------------------------------------------------------- Textteil (§8)

/** Umbruch an Wortgrenzen auf `breite`; URLs werden nie umgebrochen, andere überlange Wörter hart geteilt. */
function umbrechen(text: string, erstEinzug = '', folgeEinzug = erstEinzug, breite = TEXT_BREITE): string[] {
  const max = Math.max(breite - Math.max(erstEinzug.length, folgeEinzug.length), 1);
  const teile = text
    .split(/\s+/)
    .filter(Boolean)
    .flatMap((w) => (w.includes('://') || w.length <= max ? [w] : (w.match(new RegExp(`.{1,${max}}`, 'gu')) ?? [w])));
  const zeilen: string[] = [];
  let zeile = erstEinzug;
  let leer = true;
  for (const teil of teile) {
    if (leer) {
      zeile += teil;
      leer = false;
    } else if (zeile.length + 1 + teil.length <= breite) {
      zeile += ` ${teil}`;
    } else {
      zeilen.push(zeile);
      zeile = folgeEinzug + teil;
    }
  }
  zeilen.push(zeile);
  return zeilen;
}

const feld = (label: string, wert: string) => umbrechen(wert, `  ${`${label}:`.padEnd(10)}`, ' '.repeat(12));

function postenText(p: PostenPlan, art: MailArt, siteUrl: string): string[] {
  const status = p.status ?? 'unbekannt';
  const marke =
    (status === 'ok' || status === 'bald_faellig' || status === 'ueberfaellig') && p.faelligAm
      ? `[${p.faelligAm.slice(5, 7)}/${p.faelligAm.slice(0, 4)}]`
      : status === 'vor_nutzung_pruefen'
        ? '[!]'
        : status === 'gbu'
          ? '[GBU]'
          : '[?]';
  const kopf = [marke, p.geraetBezeichnung].join(' ') + (p.inventarnummer ? ` · ${p.inventarnummer}` : '') + ` · ${p.bereichName}`;
  const frist = p.frist === null ? fristText(null) : fristText(p.frist);
  const zeilen = [
    ...umbrechen(kopf, '', '  '),
    ...feld('Prüfung', p.pruefartBezeichnung ?? ''),
    ...feld('Status', statusZeile(status)),
    ...umbrechen(faelligText(p), ' '.repeat(12)),
    ...feld('Frist', p.katalogEntwurf ? `${frist} · Prüfkatalog: Entwurf` : frist),
  ];
  if (art === 'pruefer_woche') {
    if (p.hinweise.length > 0) zeilen.push(...feld('Hinweis', p.hinweise.join(' · ')));
    return zeilen;
  }
  zeilen.push(...feld('Rolle', [POSTEN_ROLLE_LABEL[p.rolle], ...p.hinweise].join(' · ')));
  zeilen.push(`  ${'Öffnen:'.padEnd(10)}${siteUrl}${p.pfad}`);
  return zeilen;
}

function maPostenText(p: PostenPlan): string[] {
  return [
    ...umbrechen(p.geraetBezeichnung, '', '  '),
    ...(p.inventarnummer ? [`  ${p.inventarnummer}`] : []),
    ...umbrechen(`Grund: ${maGrund(p)}`, '  '),
    ...umbrechen(maHandlung(p), '  '),
  ];
}

// ---------------------------------------------------------------- renderMail

export function renderMail(digest: DigestPlan, kontext: MailKontext): Pick<GerenderteMail, 'betreff' | 'text' | 'html' | 'kopfzeilen'> {
  if (digest.posten.length === 0) throw new Error('Mail ohne Posten wird nicht erzeugt');
  const { art } = digest;
  const betrieb = einzeilig(kontext.organisationName);
  const site = kontext.siteUrl.replace(/\/+$/, '');
  const kw = isoKalenderwoche(kontext.laufDatum);
  const betreff = betreffFuer(digest, betrieb, kw);
  const gezeigt = digest.posten.slice(0, MAIL_MAX_POSTEN);
  const weitere = digest.posten.length - gezeigt.length;
  const knopf = BUTTON[art];
  const knopfUrl = `${site}${knopf.pfad}`;
  const benachrichtigungenUrl = `${site}/einstellungen/benachrichtigungen`;
  const abmeldung = digest.abbestellbar ? kontext.abmeldung : null;
  const entwurf = new Set(digest.posten.filter((p) => p.katalogEntwurf).map((p) => p.geraetPruefartId ?? p.geraetId));
  const grund = `Sie erhalten diese Mail als ${ROLLE_LABEL[digest.empfaenger.rolle]} bei ${betrieb}.`;
  const schluss = `Readyloop – Prüffristen für Arbeitsmittel. Automatisch erstellt am ${formatDatum(kontext.laufDatum)}. Den aktuellen Stand zeigt Readyloop.`;

  // ---- HTML
  const absatz = (t: string, unten: number) => `<p style="margin:0 0 ${unten}px;font-size:16px;line-height:24px">${e(t)}</p>`;
  const linkFuss = (url: string, t: string) => `<a href="${e(url)}" style="color:${FARBE.steel}">${e(t)}</a>`;
  const pflichtOderAbmelden = digest.abbestellbar
    ? [abmeldung ? linkFuss(abmeldung.seitenUrl, 'Diese Mails abbestellen') : null, linkFuss(benachrichtigungenUrl, 'Benachrichtigungen in Readyloop')]
        .filter(Boolean)
        .join(' · ')
    : `${e(PFLICHTMAIL_BEGRUENDUNG)} ${linkFuss(benachrichtigungenUrl, 'Ihre Benachrichtigungen')}`;
  const inhalt = [
    absatz('Guten Tag,', 12),
    absatz(einleitung(digest, betrieb), 16),
    art === 'ma_hinweis' ? maBandHtml(digest.posten.length) : zusammenfassungHtml(digest.posten),
    button(knopf.text, knopfUrl),
    art === 'frist_digest' ? `<p style="margin:16px 0 0;font-size:14px;line-height:20px;color:${FARBE.steel}">${e(ROLLENERKLAERUNG)}</p>` : '',
    art === 'ma_hinweis' ? maGeraeteHtml(gezeigt) : gruppenHtml(gezeigt, art, site),
    weitere > 0
      ? `<p style="margin:20px 0 0;font-size:16px;line-height:24px"><b>… und ${weitere} weitere in Readyloop.</b> <a href="${e(knopfUrl)}" style="color:${FARBE.steel800}">Alle anzeigen</a></p>`
      : '',
    entwurf.size > 0
      ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${ABSTAND(24)}<tr><td bgcolor="${FARBE.steel50}" style="background:${FARBE.steel50};border-left:4px solid ${FARBE.steel};padding:12px 16px;font-size:14px;line-height:20px"><b>i&nbsp; Prüfkatalog im Entwurf</b><br>${e(entwurfsText(entwurf.size))}</td></tr></table>`
      : '',
  ].join('');
  const fuss =
    `<p style="margin:0 0 8px">${e(grund)}</p><p style="margin:0 0 8px">${pflichtOderAbmelden}</p>` + `<p style="margin:0">${e(schluss)}</p>`;
  const html = [
    '<!DOCTYPE html><html lang="de" xmlns:o="urn:schemas-microsoft-com:office:office"><head><meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="x-apple-disable-message-reformatting">',
    '<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light">',
    `<title>${e(betreff)}</title><style>.m{font-family:Menlo,Consolas,'Courier New',monospace}</style>`,
    "<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><style>table,td,div,p,a,span,b,h1,h2{font-family:'Segoe UI',Arial,sans-serif !important}.m{font-family:Consolas,'Courier New',monospace !important}</style><![endif]-->",
    `</head><body style="margin:0;padding:0;background:${FARBE.paper};color:${FARBE.ink};-webkit-text-size-adjust:100%">`,
    `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${FARBE.paper}">${e(vorschauzeile(digest, betrieb, kw))}${'&#847;&zwnj;&nbsp;'.repeat(20)}</div>`,
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${FARBE.paper}" style="background:${FARBE.paper}"><tr><td align="center" style="padding:16px 8px">`,
    '<!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->',
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;font-family:${SANS};font-size:14px;line-height:20px;color:${FARBE.ink};text-align:left">`,
    `<tr><td bgcolor="${FARBE.steel}" style="background:${FARBE.steel};padding:14px 24px;border-radius:6px 6px 0 0;color:#ffffff">`,
    `<div style="font-size:18px;line-height:24px;font-weight:700;color:#ffffff">Readyloop</div>`,
    `<div style="font-size:14px;line-height:20px;color:#ffffff">${e(betrieb)}</div>`,
    `<h1 style="margin:0;font-size:14px;line-height:20px;font-weight:400;color:#ffffff">${e(kopfzeile(art, kontext.laufDatum, kw))}</h1></td></tr>`,
    `<tr><td bgcolor="#ffffff" style="background:#ffffff;padding:24px;border:1px solid ${FARBE.steel200};border-top:0;border-radius:0 0 6px 6px">${inhalt}</td></tr>`,
    `<tr><td style="padding:16px 24px 24px;font-size:13px;line-height:18px;color:${FARBE.steel}">${fuss}</td></tr>`,
    '</table><!--[if mso]></td></tr></table><![endif]--></td></tr></table></body></html>',
  ].join('');

  // ---- Text
  const t: string[] = [...umbrechen(`Readyloop · ${betrieb}`), kopfzeile(art, kontext.laufDatum, kw), '', 'Guten Tag,', '', ...umbrechen(einleitung(digest, betrieb)), ''];
  if (art === 'ma_hinweis') {
    const n = digest.posten.length;
    t.push(n === 1 ? '✕ NICHT VERWENDEN' : `✕ ${n} GERÄTE NICHT VERWENDEN`, MA_BAND_UNTERZEILE, '');
  } else {
    const z = zaehle(digest.posten);
    for (const d of DRINGLICHKEITEN) if (z.get(d)) t.push(`  ${z.get(d)}  ${GRUPPE[d].symbol} ${DRINGLICHKEIT_LABEL[d]}`);
    t.push('');
  }
  t.push(`${knopf.text}:`, knopfUrl);
  if (art === 'frist_digest') t.push('', ...umbrechen(ROLLENERKLAERUNG));
  if (art === 'ma_hinweis') {
    for (const p of gezeigt) t.push('', ...maPostenText(p));
    t.push('', ...umbrechen(MA_STAND));
  } else {
    for (const g of gruppiere(gezeigt)) {
      const titel = `${GRUPPE[g.d].symbol} ${DRINGLICHKEIT_LABEL[g.d]} (${g.posten.length})`;
      t.push('', '', titel, '='.repeat(titel.length));
      for (const p of g.posten) t.push('', ...postenText(p, art, site));
    }
  }
  if (weitere > 0) t.push('', `… und ${weitere} weitere in Readyloop.`, 'Alle anzeigen:', knopfUrl);
  if (entwurf.size > 0) t.push('', 'i  Prüfkatalog im Entwurf', ...umbrechen(entwurfsText(entwurf.size)));
  t.push('', '-'.repeat(TEXT_BREITE), ...umbrechen(grund));
  if (digest.abbestellbar) {
    if (abmeldung) t.push('Diese Mails abbestellen:', abmeldung.seitenUrl);
    t.push('Benachrichtigungen in Readyloop:', benachrichtigungenUrl);
  } else {
    t.push(...umbrechen(PFLICHTMAIL_BEGRUENDUNG), 'Ihre Benachrichtigungen:', benachrichtigungenUrl);
  }
  t.push('', ...umbrechen(schluss));
  const text = t.map((z) => z.trimEnd()).join('\n') + '\n';

  // ---- Kopfzeilen (RFC 8058); kein Personenbezug
  const kopfzeilen: Record<string, string> = { 'X-Readyloop-Art': art };
  if (abmeldung) {
    kopfzeilen['List-Unsubscribe'] = `<${abmeldung.oneClickUrl}>`;
    kopfzeilen['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click';
  }
  return { betreff, text, html, kopfzeilen };
}

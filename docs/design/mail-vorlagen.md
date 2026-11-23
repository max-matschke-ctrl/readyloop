# Readyloop – Mail-Vorlagen (D-I3a, Stand 23.11.2026)

Für backend-dev, Paket **BE-24** (`src/server/mail/vorlagen.ts`). Diese Datei legt Aufbau, Texte, Farben und Abstände der drei Mailarten fest. Sie gilt zusammen mit F-38 (`docs/requirements.md`) und dem Vertrag `docs/backlog.md` §9. Wo diese Datei und der Backlog-Text von BE-24 voneinander abweichen, steht das in §11 mit Begründung; diese Abweichungen gelten.
Grundlage Gestaltung: `corporate-design.md`, `designsystem.md` (§2 Farben, §5 Plakette, §6.17 Nutzungsband, §12 E-Mails).

---

## 1. Entscheidungen

| # | Entscheidung | Grund |
|---|---|---|
| M-1 | **Prüfplakette als Text-Plakette:** runde HTML-Fläche (`div` mit `border-radius:50%`), Rand und Fläche in Statusfarbe, in der Mitte Monat und Jahr als Text (`03` / `2027`). **Kein SVG, kein Bild.** | SVG als Bild hat zwar laut caniemail rund 98 % Unterstützung, aber Gmail rastert es am Desktop zu PNG und zeigt es in den Gmail-Apps für Google-Konten gar nicht ([caniemail image-svg](https://caniemail.com/features/image-svg)). Inline-`<svg>` liegt bei rund 40 %, zuletzt 2020 getestet ([caniemail html-svg](https://www.caniemail.com/features/html-svg/)). Bilder werden außerdem oft blockiert. Text bleibt immer lesbar. F-38 und BE-24 verlangen ohnehin HTML ohne `<img>`. |
| M-2 | Klassisches Outlook (Word-Engine) bekommt **keine VML**. Dort wird die Plakette eckig, der Button bleibt rechteckig und voll klickbar (Rahmen-Technik). | Classic Outlook kann kein `border-radius` und braucht dafür VML ([Noble Desktop](https://www.nobledesktop.com/learn/html-email/bulletproof-buttons-in-outlook)). Das neue Outlook rendert wie ein Browser, Classic Outlook bleibt aber bis mindestens 2027 bei vielen Firmenkunden ([Really Good Emails](https://reallygoodemails.com/school/blog/classic-vs-new-outlook-rendering-changes)). VML in jeder Postenzeile würde die Mail aufblähen (siehe M-5). Eine eckige Plakette mit Monat/Jahr und Statustext daneben ist weiterhin eindeutig. |
| M-3 | **Einspaltig, max. 600 px, ohne Media Queries.** Posten = zweispaltige Tabellenzeile (Plakette 56 px, Text). | Auf dem Handy sind 56 px + Text auch ohne Umbruch lesbar. Keine Media Queries heißt: nichts kann kaputtgehen, wenn ein Client `<style>` entfernt. |
| M-4 | **Systemschriften**, kein Webfont. Stapel Sans `-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif`; für Classic Outlook ein MSO-Block mit `'Segoe UI',Arial`. Mono nur für die Inventarnummer, als Klasse `m` (Verbesserung, kein Muss). | Im Classic Outlook führt eine unbekannte erste Schrift im Stapel zu Times New Roman ([Really Good Emails](https://reallygoodemails.com/school/blog/classic-vs-new-outlook-rendering-changes)). |
| M-5 | **Größenbudget:** HTML ≤ 95 000 Byte (UTF-8) bei 100 Posten mit langen Werten, Ziel ≤ 85 000. Keine Einrückung und keine Zeilenumbrüche im erzeugten HTML. Symbole als UTF-8-Zeichen, nicht als Entities. | Gmail kürzt Mails ab etwa 102 KB HTML und blendet den Rest hinter „[Nachricht gekürzt]“ aus, auch die Abmeldezeile ([Email on Acid](https://www.emailonacid.com/blog/article/email-development/gmail-email-clipping/)). Deshalb stehen Zusammenfassung und Hauptbutton **oben**. |
| M-6 | **Je Posten ein Textlink** („Geräteakte öffnen“), **ein** Hauptbutton je Mail. In der Prüfer-Mail gar kein Postenlink (alle Posten führen auf `/pruefer`). | Leitsatz 5 (eine Hauptaktion). 100 Buttons würden das Budget M-5 sprengen. Der Backlog nennt „Link-Button“ je Posten, siehe §11. |
| M-7 | **Kein eigenes Dunkel-Design.** `color-scheme: light`. Farben sind so gewählt, dass automatische Invertierung lesbar bleibt (kein reines Weiß auf Schwarz, Status immer als Text und Symbol, keine transparenten Grafiken). | Apple Mail und Gmail-Desktop ändern nichts, Outlook.com und Gmail-Android invertieren teilweise, Gmail-iOS und Outlook für Windows vollständig ([Litmus](https://www.litmus.com/blog/the-ultimate-guide-to-dark-mode-for-email-marketers)). Eigene `prefers-color-scheme`-Regeln greifen nur bei einem Teil der Clients und verdoppeln den Testaufwand. |
| M-8 | **Digest-Aufbau:** Zählung im Betreff, Zusammenfassung oben, Gruppen nach Dringlichkeit, leere Gruppen entfallen, ohne Posten keine Mail, „alle anzeigen“ in die App. | Übliches Digest-Muster ([Knock Alert Digest](https://knock.app/template-library/workflows/alert-digest)): Zählungen in den Betreff, jeder Posten mit Direktlink, kein Digest ohne Inhalt, Versand zu Beginn des Arbeitstags. Passt zu F-36 (werktags morgens). |
| M-9 | **Vorschauzeile** als versteckter Block direkt nach `<body>`, höchstens 110 Zeichen, danach 20 Füllzeichen. | Clients zeigen je nach Platz bis etwa 140 Zeichen, oft weniger ([Customer.io](https://docs.customer.io/messaging/channels/email/headers/custom-preheader-text/)). Das Wichtigste steht vorn. |

---

## 2. Farben und Maße (Inline-Werte)

Nur diese Werte verwenden. Sie stammen aus `designsystem.md` §2.2.

| Name | Hex | Einsatz in der Mail |
|---|---|---|
| paper | `#f5f3ee` | Hintergrund außen |
| white | `#ffffff` | Inhaltsfläche, Text im Kopf und im Nutzungsband |
| ink | `#1e2328` | Text |
| steel | `#44546a` | Kopf, Button, Sekundärtext (Frist-Zeile, Fuß), Linie „Hinweis“ |
| steel-800 | `#2c3646` | Linkfarbe im Inhalt |
| steel-200 | `#c5ccd5` | Postentrenner, Rahmen der Inhaltsfläche |
| steel-400 | `#7c8797` | Linie „Ohne Termin“, gestrichelter Rand der Plakette GBU |
| steel-50 | `#f1f3f6` | Fläche Hinweis, Plakette „unbekannt“ |
| moss | `#5b7f3a` / moss-50 `#eef3e8` | Rand/Fläche Plakette „In Ordnung“, Linie „Vorlauf“ |
| ochre-600 | `#b07d22` / ochre-50 `#fbf3e2` | Rand/Fläche Plakette „bald fällig“, Linie „Heute fällig“, „In den nächsten 30 Tagen fällig“ |
| brick | `#a6452f` / brick-50 `#f9ece8` | Rand/Fläche Plakette „überfällig“, „vor Nutzung prüfen“, Linie „Nicht verwenden“, „Überfällig“; volle Fläche nur im Nutzungsband der MA-Mail |

Kontraste: ink auf white 15,8; steel auf white 7,7, auf paper 7,0; white auf steel 7,7; white auf brick 6,0; brick auf brick-50 ≈ 5,3; steel-800 auf white ≈ 11. **ochre (#c8902e) kommt in der Mail nicht vor** (2,8 auf Weiß).

Maße: Außenrand 16 px oben/unten, 8 px seitlich · Inhaltsfläche Innenabstand 24 px · Kopf 14 px / 24 px · Postenzeile 12 px oben/unten · Abstand vor Gruppe 28 px · Radius Fläche 6 px, Button 4 px · Schrift Fließtext 16/24, Posten 14/20, Gerätename 16/24 fett, Gruppentitel 18/24 fett, Fuß 13/18. **Nichts unter 13 px.**

---

## 3. Platzhalter und Regeln für BE-24

- `{{wert}}` = Text aus Daten, **immer** mit `escapeHtml` (`& < > " '`). `{{{fragment}}}` = bereits erzeugtes HTML-Fragment aus dieser Datei.
- Datum immer `TT.MM.JJJJ`. Tage: „1 Tag“, sonst „{n} Tagen“.
- HTML ohne Zeilenumbrüche und Einrückung zusammensetzen (die Gerüste unten sind nur zur Lesbarkeit umbrochen).
- Kein `<img`, `<script`, `<link`, `<svg`, kein `http://`, keine externen Ressourcen, keine Tracking-Parameter.
- Keine Personennamen (F-38). Erlaubt: Betriebsname, Gerätename, Bereichsname, Rollenbezeichnung (`ROLLE_LABEL`).
- `SANS` = `-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif`

---

## 4. Gerüst (alle drei Arten)

```html
<!DOCTYPE html>
<html lang="de" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>{{betreff}}</title>
<style>.m{font-family:Menlo,Consolas,'Courier New',monospace}</style>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><style>table,td,div,p,a,span,b,h1,h2{font-family:'Segoe UI',Arial,sans-serif !important}.m{font-family:Consolas,'Courier New',monospace !important}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background:#f5f3ee;color:#1e2328;-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#f5f3ee">{{vorschauzeile}}<!-- 20 × -->&#847;&zwnj;&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#f5f3ee" style="background:#f5f3ee">
<tr><td align="center" style="padding:16px 8px">
<!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;font-family:SANS;font-size:14px;line-height:20px;color:#1e2328;text-align:left">

<!-- KOPF -->
<tr><td bgcolor="#44546a" style="background:#44546a;padding:14px 24px;border-radius:6px 6px 0 0;color:#ffffff">
<div style="font-size:18px;line-height:24px;font-weight:700;color:#ffffff">Readyloop</div>
<div style="font-size:14px;line-height:20px;color:#ffffff">{{betrieb}}</div>
<h1 style="margin:0;font-size:14px;line-height:20px;font-weight:400;color:#ffffff">{{kopfzeile}}</h1>
</td></tr>

<!-- INHALT -->
<tr><td bgcolor="#ffffff" style="background:#ffffff;padding:24px;border:1px solid #c5ccd5;border-top:0;border-radius:0 0 6px 6px">
<p style="margin:0 0 12px;font-size:16px;line-height:24px">Guten Tag,</p>
<p style="margin:0 0 16px;font-size:16px;line-height:24px">{{einleitung}}</p>
{{{zusammenfassung}}}   <!-- frist_digest, pruefer_woche; MA: Nutzungsband §7 -->
{{{button}}}
{{{rollenerklaerung}}}  <!-- nur frist_digest -->
{{{gruppen}}}
{{{kappung}}}           <!-- nur bei > MAIL_MAX_POSTEN -->
{{{entwurfshinweis}}}   <!-- nur bei katalogEntwurf -->
</td></tr>

<!-- FUSS -->
<tr><td style="padding:16px 24px 24px;font-size:13px;line-height:18px;color:#44546a">{{{fuss}}}</td></tr>

</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr></table>
</body></html>
```

Hinweise:
- Die `<style>`-Zeile im Kopf ist nur Verbesserung (Mono für die Inventarnummer). Fehlt sie, erscheint die Nummer in der Grundschrift. Alles andere ist inline.
- `{{kopfzeile}}`: `frist_digest` „Fristen-Erinnerung vom {TT.MM.JJJJ}“ · `pruefer_woche` „Wochenübersicht für Prüfer · KW {ww}“ · `ma_hinweis` „Hinweis „Nicht verwenden“ vom {TT.MM.JJJJ}“. Datum = `laufDatum`.

---

## 5. Bausteine

### 5.1 Zusammenfassung (`frist_digest`, `pruefer_woche`)
Eine Zeile je **nicht leerer** Gruppe in der Reihenfolge `DRINGLICHKEITEN`, danach Abstand 16 px.

```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<!-- je Gruppe: -->
<tr><td style="border-left:4px solid {{linie}};padding:2px 0 2px 12px;font-size:16px;line-height:24px"><b style="font-size:20px;line-height:24px">{{anzahl}}</b>&nbsp; {{symbol}} {{gruppenlabel}}</td></tr>
<tr><td height="6" style="font-size:0;line-height:0">&nbsp;</td></tr>
<!-- Ende je Gruppe -->
<tr><td height="10" style="font-size:0;line-height:0">&nbsp;</td></tr>
</table>
```

### 5.2 Gruppenwerte (`DRINGLICHKEITEN`)

| Dringlichkeit | `gruppenlabel` (`DRINGLICHKEIT_LABEL`) | `symbol` | `linie` |
|---|---|---|---|
| `nicht_verwenden` | Nicht verwenden | ✕ | `#a6452f` |
| `ueberfaellig` | Überfällig | ✕ | `#a6452f` |
| `heute_faellig` | Heute fällig | ! | `#b07d22` |
| `bald_faellig` | In den nächsten 30 Tagen fällig | ! | `#b07d22` |
| `vorlauf` | Vorlauf | ✓ | `#5b7f3a` |
| `ohne_termin` | Ohne Termin | ? | `#7c8797` |

### 5.3 Hauptbutton
Rahmen-Technik: voll klickbar auch im Classic Outlook, ohne VML.

```html
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="#44546a" style="background:#44546a;border-radius:4px"><a href="{{url}}" style="display:inline-block;border-top:12px solid #44546a;border-bottom:12px solid #44546a;border-left:20px solid #44546a;border-right:20px solid #44546a;border-radius:4px;background:#44546a;color:#ffffff;font-size:16px;line-height:20px;font-weight:700;text-decoration:none">{{buttontext}}</a></td></tr></table>
```

| Art | `buttontext` | `url` |
|---|---|---|
| `frist_digest` | Geräteliste öffnen | `{siteUrl}/geraete` |
| `pruefer_woche` | Prüfaufgaben öffnen | `{siteUrl}/pruefer` |
| `ma_hinweis` | Meine Geräte öffnen | `{siteUrl}/meine-geraete` |

### 5.4 Rollenerklärung (nur `frist_digest`, direkt unter dem Button)
```html
<p style="margin:16px 0 0;font-size:14px;line-height:20px;color:#44546a">„Sie sind zuständig“: Sie veranlassen die Prüfung. „Zur Kenntnis“: Sie werden informiert, zuständig sind andere.</p>
```

### 5.5 Gruppe
```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td colspan="2" height="28" style="font-size:0;line-height:0">&nbsp;</td></tr>
<tr><td colspan="2" style="border-left:4px solid {{linie}};padding:2px 0 2px 12px"><h2 style="margin:0;font-size:18px;line-height:24px;font-weight:700;color:#1e2328">{{symbol}} {{gruppenlabel}} ({{anzahl}})</h2></td></tr>
<tr><td colspan="2" height="8" style="font-size:0;line-height:0">&nbsp;</td></tr>
{{{posten}}}
</table>
```
`anzahl` = Posten dieser Gruppe **in der Mail** (nach Kappung).

### 5.6 Text-Plakette (das Erkennungszeichen)
Steht links in jeder Postenzeile (`frist_digest`, `pruefer_woche`). Wie in der App: rund, Statusfarbe, Monat und Jahr der Fälligkeit; die Bedeutung steht zusätzlich als Text daneben.

Variante **Datum** (Status `ok`, `bald_faellig`, `ueberfaellig`):
```html
<div style="width:40px;height:35px;padding-top:5px;border:2px solid {{rand}};border-radius:50%;background:{{flaeche}};text-align:center;font-size:13px;line-height:15px;font-weight:700;color:#1e2328">{{MM}}<br>{{JJJJ}}</div>
```
Variante **Zeichen** (`vor_nutzung_pruefen`, `unbekannt`, `gbu`):
```html
<div style="width:40px;height:40px;border:2px {{linienart}} {{rand}};border-radius:50%;background:{{flaeche}};text-align:center;font-size:{{groesse}};line-height:40px;font-weight:700;color:{{farbe}}">{{zeichen}}</div>
```

| Status | Variante | `rand` | `linienart` | `flaeche` | Mitte | `groesse` / `farbe` |
|---|---|---|---|---|---|---|
| `ok` | Datum | `#5b7f3a` | solid | `#eef3e8` | MM / JJJJ von `faelligAm` | 13px / `#1e2328` |
| `bald_faellig` | Datum | `#b07d22` | solid | `#fbf3e2` | MM / JJJJ | 13px / `#1e2328` |
| `ueberfaellig` | Datum | `#a6452f` | solid | `#f9ece8` | MM / JJJJ | 13px / `#1e2328` |
| `vor_nutzung_pruefen` | Zeichen | `#a6452f` | solid | `#f9ece8` | `!` | 20px / `#a6452f` |
| `unbekannt` | Zeichen | `#44546a` | solid | `#f1f3f6` | `?` | 20px / `#1e2328` |
| `gbu` | Zeichen | `#7c8797` | dashed | `#ffffff` | `GBU` | 13px / `#1e2328` |

- Ist `faelligAm` bei einem Datums-Status `null` (sollte nicht vorkommen), gilt Variante Zeichen wie `unbekannt`.
- Classic Outlook zeigt die Plakette eckig (M-2). Das ist gewollt und braucht keinen Workaround.
- **Don't:** Plakette nie ohne die Statuszeile daneben. Keine Plakette in der MA-Mail (dort keine Fristwerte, F-35).

### 5.7 Statuszeile und Fälligkeit (je Posten)

`{{statuszeile}}` = `{Symbol} {STATUS_LABEL[status]}`. Das Symbol-Mapping bitte als kleine Kopie in `vorlagen.ts` führen (gleich wie `STATUS_SYMBOL` in `src/components/status.ts`), nicht aus `src/components` importieren:

| Status | Symbol |
|---|---|
| `ok` | ✓ |
| `bald_faellig` | ! |
| `ueberfaellig` | ✕ |
| `vor_nutzung_pruefen` | ! |
| `unbekannt` | ? |
| `gbu` | § |

`{{faelligtext}}`:
- `restTage > 0`: „fällig am {TT.MM.JJJJ}, in {n} Tag(en)“
- `restTage = 0`: „fällig heute, {TT.MM.JJJJ}“
- `restTage < 0`: „fällig am {TT.MM.JJJJ}, seit {n} Tag(en) überfällig“
- `faelligAm = null`: „kein Fälligkeitsdatum“

`{{fristzeile}}`:
- `frist ≠ null`: „Frist: “ + `fristText(frist)` → „Frist: 12 Monate · Gefährdungsbeurteilung · Stufe C · GBU Lager 2025“
- `frist = null`: „Frist über GBU festlegen“ (ohne „Frist: “ davor)
- `katalogEntwurf = true`: Zusatz „ · Prüfkatalog: Entwurf“

### 5.8 Posten `frist_digest`
```html
<tr><td width="56" valign="top" style="padding:12px 12px 12px 0;border-top:1px solid #c5ccd5">{{{plakette}}}</td><td valign="top" style="padding:12px 0;border-top:1px solid #c5ccd5"><b style="font-size:16px;line-height:24px">{{geraet}}</b><br><span class="m">{{inventarnummer}}</span> · {{bereich}} · {{pruefart}}<br><b>{{statuszeile}}</b> · {{faelligtext}}<br><span style="color:#44546a">{{fristzeile}}</span><br>{{rolle}}{{hinweise}}<br><a href="{{siteUrl}}{{pfad}}" style="color:#2c3646">Geräteakte öffnen</a></td></tr>
```
- `inventarnummer = null` → Span und das folgende „ · “ entfallen.
- `rolle` = `POSTEN_ROLLE_LABEL[rolle]` („Sie sind zuständig“ / „Zur Kenntnis“). Bei `zustaendig` fett: `<b>Sie sind zuständig</b>`.
- `hinweise` = jeder Eintrag aus `posten.hinweise` mit „ · “ davor (z. B. „ · Eskaliert an Sifa“, „ · Bereich ohne Verantwortlichen“).

### 5.9 Posten `pruefer_woche`
Wie 5.8, aber **ohne** Rollen-/Hinweiszeile und **ohne** Link (Button führt auf `/pruefer`):
```html
<tr><td width="56" valign="top" style="padding:12px 12px 12px 0;border-top:1px solid #c5ccd5">{{{plakette}}}</td><td valign="top" style="padding:12px 0;border-top:1px solid #c5ccd5"><b style="font-size:16px;line-height:24px">{{geraet}}</b><br><span class="m">{{inventarnummer}}</span> · {{bereich}} · {{pruefart}}<br><b>{{statuszeile}}</b> · {{faelligtext}}<br><span style="color:#44546a">{{fristzeile}}</span></td></tr>
```
Hat ein Posten `hinweise`, kommt vor `</td>` eine Zeile `<br>{{hinweise, mit „ · “ verbunden}}` dazu.

### 5.10 Kappung (> `MAIL_MAX_POSTEN`)
Nach der letzten Gruppe:
```html
<p style="margin:20px 0 0;font-size:16px;line-height:24px"><b>… und {{n}} weitere in Readyloop.</b> <a href="{{buttonUrl}}" style="color:#2c3646">Alle anzeigen</a></p>
```
Gekappt wird hinten (nach Sortierung), also zuerst die am wenigsten dringlichen. Die Zusammenfassung oben zeigt die **vollen** Zahlen je Gruppe (vor Kappung), die Gruppenköpfe die Zahl in der Mail.

### 5.11 Entwurfshinweis (F-38)
Über dem Fuß, wenn mindestens ein Posten `katalogEntwurf` hat. `n` = Anzahl verschiedener Prüfarten mit Entwurf in der Mail.
```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td height="24" style="font-size:0;line-height:0">&nbsp;</td></tr><tr><td bgcolor="#f1f3f6" style="background:#f1f3f6;border-left:4px solid #44546a;padding:12px 16px;font-size:14px;line-height:20px"><b>i&nbsp; Prüfkatalog im Entwurf</b><br>{{entwurfstext}}</td></tr></table>
```
`entwurfstext` = „Der Readyloop-Prüfkatalog ist für {n} Prüfart dieser Mail noch nicht fachlich freigegeben (Entwurf). Maßgeblich sind die in Readyloop freigegebenen Fristen mit der angegebenen Quelle und Ihre Gefährdungsbeurteilung.“ Bei n > 1 „Prüfarten“ statt „Prüfart“.

### 5.12 Fuß
```html
<p style="margin:0 0 8px">{{grund}}</p>
<p style="margin:0 0 8px">{{{pflicht_oder_abmelden}}}</p>
<p style="margin:0">Readyloop – Prüffristen für Arbeitsmittel. Automatisch erstellt am {{TT.MM.JJJJ}}. Den aktuellen Stand zeigt Readyloop.</p>
```
- `grund`: „Sie erhalten diese Mail als {ROLLE_LABEL[rolle]} bei {Betrieb}.“
- **Pflichtmail** (`frist_digest`): `{PFLICHTMAIL_BEGRUENDUNG} <a href="{siteUrl}/einstellungen/benachrichtigungen" style="color:#44546a">Ihre Benachrichtigungen</a>`
- **Abbestellbar** (`pruefer_woche`, `ma_hinweis`): `<a href="{abmeldung.seitenUrl}" style="color:#44546a">Diese Mails abbestellen</a> · <a href="{siteUrl}/einstellungen/benachrichtigungen" style="color:#44546a">Benachrichtigungen in Readyloop</a>`
- Linkfarbe im Fuß steel (`#44546a`, 7,0 auf paper), unterstrichen (Standard).

---

## 6. Texte je Mailart

### 6.1 Betreff
Präfix immer „Readyloop · {Betrieb}: “ (außer `ma_hinweis`, siehe unten). `{Betrieb}` wird vor dem Zusammensetzen auf 60 Zeichen gekürzt („…“), damit die Zählung nie abgeschnitten wird. Danach CR/LF entfernen, Gesamtlänge ≤ 150 (Vertrag).

**`frist_digest`:** Teile in dieser Reihenfolge, Nullteile entfallen, mit „, “ verbunden:
1. „{a} nicht verwenden“ (Gruppe `nicht_verwenden`)
2. „{b} überfällig“
3. „{c} heute fällig“
4. „{d} demnächst“ (`bald_faellig` + `vorlauf`)

Nur Teil 4 vorhanden: „{d} Prüfung demnächst fällig“ bzw. „{d} Prüfungen demnächst fällig“.
**Eskalation:** Hat die Mail mindestens einen Posten mit Rolle `zustaendig` und Stufe `e_sifa` oder `e_admin`, steht nach dem Doppelpunkt „Eskalation – “.
Zahlen = volle Anzahl (vor Kappung).

Beispiele:
- „Readyloop · Elbtal Fördertechnik GmbH: 2 überfällig, 1 heute fällig, 4 demnächst“
- „Readyloop · Elbtal Fördertechnik GmbH: Eskalation – 1 überfällig“
- „Readyloop · Elbtal Fördertechnik GmbH: 3 Prüfungen demnächst fällig“

**`pruefer_woche`:** „Readyloop · {Betrieb}: {n} Prüfung(en) fällig (KW {ww})“ – „1 Prüfung“, sonst „{n} Prüfungen“; KW ohne führende Null.
**`ma_hinweis`:** ein Gerät „Readyloop · Nicht verwenden: {Bezeichnung}“; mehrere „Readyloop · {n} Ihrer Geräte nicht verwenden“ (Vertrag).

### 6.2 Vorschauzeile (≤ 110 Zeichen, danach hart kürzen mit „…“)
`kurz(p)` für den ersten Posten nach Sortierung: `nicht_verwenden` → „nicht verwenden“; `ueberfaellig` → „seit {n} Tag(en) überfällig“; `heute_faellig` → „heute fällig“; `bald_faellig`/`vorlauf` → „fällig in {n} Tag(en)“; `ohne_termin` → „ohne Termin“.

| Art | Vorschauzeile |
|---|---|
| `frist_digest` | „Zuerst: {Gerät} – {kurz}. {N} Prüfung(en) in dieser Mail.“ |
| `pruefer_woche` | „Zuerst: {Gerät} – {kurz}. {N} Prüfung(en) bei {Betrieb} in KW {ww}.“ |
| `ma_hinweis` 1 Gerät | „{Grund}. Gerät nicht benutzen und den Verantwortlichen informieren.“ |
| `ma_hinweis` mehrere | „{n} Geräte, die Sie haben, dürfen nicht benutzt werden.“ |

`N` = volle Anzahl vor Kappung.

### 6.3 Einleitung (`{{einleitung}}`)
| Art | Text |
|---|---|
| `frist_digest` | „diese Prüfungen bei {Betrieb} brauchen Aufmerksamkeit. Die dringlichsten stehen oben.“ |
| `pruefer_woche` | „diese Prüfungen sind Ihnen bei {Betrieb} zugewiesen und fällig oder noch ohne Termin.“ |
| `ma_hinweis` 1 Gerät | „ein Gerät, das Sie haben, darf ab sofort nicht benutzt werden.“ |
| `ma_hinweis` mehrere | „{n} Geräte, die Sie haben, dürfen ab sofort nicht benutzt werden.“ |

---

## 7. `ma_hinweis`: Nutzungsband und Gerät

Statt Zusammenfassung steht oben das **Nutzungsband** wie in der App (§6.17): volle brick-Fläche, weißer Text, das einzige volle Statusfeld. Danach der Button, dann die Geräte. **Keine Plakette, keine Fristwerte, keine Mängelbeschreibung, keine Namen** (F-35).

```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="#a6452f" style="background:#a6452f;border-radius:6px;padding:16px 20px;color:#ffffff"><p style="margin:0;font-size:22px;line-height:28px;font-weight:700;color:#ffffff">✕ {{bandtitel}}</p><p style="margin:4px 0 0;font-size:16px;line-height:24px;color:#ffffff">Gerät nicht benutzen. Verantwortlichen informieren.</p></td></tr><tr><td height="16" style="font-size:0;line-height:0">&nbsp;</td></tr></table>
```
`bandtitel`: 1 Gerät „Nicht verwenden“; mehrere „{n} Geräte nicht verwenden“.

Danach Button (5.3), dann je Gerät:
```html
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td height="20" style="font-size:0;line-height:0">&nbsp;</td></tr>
<!-- je Gerät: -->
<tr><td style="padding:12px 0;border-top:1px solid #c5ccd5;font-size:16px;line-height:24px"><b>{{geraet}}</b><br><span class="m">{{inventarnummer}}</span><br>Grund: <b>{{grund}}</b><br>{{handlung}}</td></tr>
</table>
<p style="margin:16px 0 0;font-size:14px;line-height:20px;color:#44546a">Den aktuellen Stand zeigen „Meine Geräte“ und der QR-Code am Gerät.</p>
```
- `inventarnummer = null` → `<span>` und `<br>` entfallen.
- `grund` = Nutzungsgrund aus `posten.hinweise` (z. B. „Überfällig“, „Gefährlicher Mangel offen“, „Außer Betrieb“).
- `handlung` = „Gerät nicht verwenden und den Verantwortlichen informieren.“; enthält `hinweise` „Bitte zurückgeben“: „Gerät nicht verwenden, den Verantwortlichen informieren und zurückgeben.“ (F-35 sinngemäß).
- Schrift in der MA-Mail durchgehend 16 px (Halle-Regel §6.18: Laien, Handy).

---

## 8. Textteil (`text`)

Regeln:
1. UTF-8, Zeilen höchstens **72 Zeichen**, Umbruch an Wortgrenzen. Folgezeilen eines Postenfelds werden auf die Wertspalte eingerückt (12 Leerzeichen).
2. URLs nie umbrechen, immer auf eigener Zeile oder hinter „Öffnen:“ (dürfen länger als 72 sein).
3. Gruppenüberschrift: Zeile mit `{symbol} {label} ({anzahl})`, darunter `=` in gleicher Länge. Leerzeile vor und nach.
4. Text-Plakette als eckige Klammer vor dem Gerätenamen: `[03/2027]`, `[!]`, `[?]`, `[GBU]`.
5. Gleiche Reihenfolge und gleiche Texte wie im HTML. Kein Inhalt nur im HTML (außer Gestaltung).
6. Zwischen Posten eine Leerzeile. Vor dem Fuß eine Linie aus 72 `-`.

### 8.1 Beispiel `frist_digest` (Demo, VER Lager, Lauf 30.11.2026)
```
Readyloop · Elbtal Fördertechnik GmbH
Fristen-Erinnerung vom 30.11.2026

Guten Tag,

diese Prüfungen bei Elbtal Fördertechnik GmbH brauchen Aufmerksamkeit.
Die dringlichsten stehen oben.

  2  ✕ Überfällig
  2  ! In den nächsten 30 Tagen fällig

Geräteliste öffnen:
https://app.readyloop.de/geraete

„Sie sind zuständig“: Sie veranlassen die Prüfung. „Zur Kenntnis“: Sie
werden informiert, zuständig sind andere.


✕ Überfällig (2)
================

[10/2026] Gabelstapler Linde H25 · L-001 · Lager
  Prüfung:  Wiederkehrende Prüfung
  Status:   ✕ Überfällig – nicht verwenden
            fällig am 26.10.2026, seit 35 Tagen überfällig
  Frist:    12 Monate · Gefährdungsbeurteilung · Stufe C · GBU Lager
            2025
  Rolle:    Zur Kenntnis · Eskaliert an Admin/Geschäftsführung
  Öffnen:   https://app.readyloop.de/geraete/…

[11/2026] Stehleiter 6 Stufen · L-008 · Lager
  …


! In den nächsten 30 Tagen fällig (2)
=====================================

[12/2026] Elektro-Hubwagen · L-002 · Lager
  Prüfung:  Wiederkehrende Prüfung
  Status:   ! Bald fällig
            fällig am 25.12.2026, in 25 Tagen
  Frist:    12 Monate · Gefährdungsbeurteilung · Stufe C · GBU Lager
            2025
  Rolle:    Sie sind zuständig
  Öffnen:   https://app.readyloop.de/geraete/…

…

------------------------------------------------------------------------
Sie erhalten diese Mail als Verantwortlicher bei Elbtal Fördertechnik
GmbH.
Diese Erinnerung gehört zur Fristenüberwachung Ihres Betriebs (§ 3 Abs.
6, § 14 BetrSichV) und kann nicht abbestellt werden. Empfänger und
Zeitpunkte legt der Admin je Bereich fest.
Ihre Benachrichtigungen:
https://app.readyloop.de/einstellungen/benachrichtigungen

Readyloop – Prüffristen für Arbeitsmittel. Automatisch erstellt am
30.11.2026. Den aktuellen Stand zeigt Readyloop.
```
„…“ im Beispiel = gekürzt für die Doku; die echte Mail enthält die volle URL und alle Posten.

### 8.2 Abweichungen `pruefer_woche`
- Kopfzeile „Wochenübersicht für Prüfer · KW 49“.
- Postenfelder: Prüfung, Status, Frist (kein „Rolle“, kein „Öffnen“). Ohne Frist: `  Frist:    Frist über GBU festlegen`.
- Nach der Zusammenfassung `Prüfaufgaben öffnen:` und die URL.
- Fuß: „Sie erhalten diese Mail als Prüfer bei {Betrieb}.“, dann `Diese Mails abbestellen:` + Abmelde-Seiten-URL (nicht die One-Click-URL), dann `Benachrichtigungen in Readyloop:` + URL.

### 8.3 Beispiel `ma_hinweis`
```
Readyloop · Elbtal Fördertechnik GmbH
Hinweis „Nicht verwenden“ vom 30.11.2026

Guten Tag,

ein Gerät, das Sie haben, darf ab sofort nicht benutzt werden.

✕ NICHT VERWENDEN
Gerät nicht benutzen. Verantwortlichen informieren.

Meine Geräte öffnen:
https://app.readyloop.de/meine-geraete

Stehleiter 6 Stufen
  L-008
  Grund: Überfällig
  Gerät nicht verwenden, den Verantwortlichen informieren und
  zurückgeben.

Den aktuellen Stand zeigen „Meine Geräte“ und der QR-Code am Gerät.

------------------------------------------------------------------------
Sie erhalten diese Mail als Mitarbeiter bei Elbtal Fördertechnik GmbH.
Diese Mails abbestellen:
https://app.readyloop.de/abmelden?t=…
Benachrichtigungen in Readyloop:
https://app.readyloop.de/einstellungen/benachrichtigungen

Readyloop – Prüffristen für Arbeitsmittel. Automatisch erstellt am
30.11.2026. Den aktuellen Stand zeigt Readyloop.
```
„NICHT VERWENDEN“ in Versalien ist im Textteil die **einzige** Ausnahme von der Satzschreibung: Es ersetzt die brick-Fläche, die es im Text nicht gibt.

---

## 9. Kopfzeilen und Absender
- Wie Vertrag BE-24: abbestellbar → `List-Unsubscribe: <{oneClickUrl}>` und `List-Unsubscribe-Post: List-Unsubscribe=One-Click`; Pflicht → keine; immer `X-Readyloop-Art`.
- Absendername „Readyloop“ (`MAIL_ABSENDER`, z. B. `Readyloop <erinnerung@…>`). Der Betrieb steht im Betreff, nicht im Absender (sonst wirkt die Mail wie vom Betrieb selbst).

---

## 10. Abnahme für BE-24 (zusätzlich zu den Backlog-Kriterien)
1. Snapshot je Art enthält: Kopf in `#44546a`, Zusammenfassung (bzw. Nutzungsband), Button, Gruppen in Reihenfolge `DRINGLICHKEITEN`, Fuß.
2. Jede Postenzeile enthält eine Text-Plakette (`border-radius:50%`) **und** eine Statuszeile mit Symbol und `STATUS_LABEL`. Die MA-Mail enthält keine Plakette und kein „Frist:“.
3. Plakette `ueberfaellig` mit `faelligAm = 2025-10-26` zeigt `10<br>2025`, Rand `#a6452f`; `gbu` zeigt `GBU` mit `dashed`.
4. **Größe:** Fixture mit 100 Posten (Bezeichnung 40 Zeichen, Prüfart 40, Fundstelle 60, Bereich 20, je ein Hinweis) → `Buffer.byteLength(html, 'utf8') < 95_000`. Schlägt das fehl: nicht still kürzen, sondern an den designer melden.
5. Das HTML enthält keine Zeilenumbrüche (`\n`) und kein `#c8902e`.
6. Betreff mit Eskalation: VER-Mail mit Posten `e_sifa` als `kopie` → **kein** „Eskalation – “; SIF-Mail mit `e_sifa` als `zustaendig` → mit.
7. Betrieb mit 80 Zeichen → Betreff enthält die vollständige Zählung.
8. Textteil: keine Zeile über 72 Zeichen außer Zeilen, die eine URL enthalten.
9. Die Vorschauzeile ist ≤ 110 Zeichen und steht im HTML vor der ersten Tabelle.

Manuelle Prüfung in Gate G-6 (echter Versand an Testkonten): Classic Outlook (Windows), neues Outlook, Outlook.com, Gmail Web/Android/iOS, Apple Mail iOS, GMX, WEB.DE, Thunderbird; jeweils hell und dunkel. Kriterium: Status, Datum, Frist mit Quelle und Stufe sind überall lesbar; Button klickbar; Fuß sichtbar.

---

## 11. Abweichungen und Ergänzungen zum Backlog (bitte im Backlog nachziehen)
| Punkt | Backlog | D-I3a | Grund |
|---|---|---|---|
| Link je Posten | „Link-Button“ | Textlink „Geräteakte öffnen“, Prüfer-Mail ohne Postenlink | M-5, M-6 |
| Betreff `frist_digest` | „{n} überfällig, {m} heute fällig, {k} demnächst“ | zusätzlich „{a} nicht verwenden“ vorn und Präfix „Eskalation – “ | Die Geschäftsführung soll Eskalationen schon im Posteingang erkennen; „Nicht verwenden“ ist dringlicher als „überfällig“ |
| Entwurfshinweis | „Prüfart(en)“ | „Prüfart“ / „Prüfarten“ nach Anzahl | Lesbarkeit; Inhalt sonst wörtlich |
| Betriebsname im Betreff | Kürzung auf 150 gesamt | Betrieb zuerst auf 60 Zeichen kürzen | Zählung bleibt sichtbar |
| Dunkler Modus | „lesbar“ | ohne eigene Dunkel-Regeln, `color-scheme: light` | M-7 |

---

## Anhang A: Einladung und Passwort-Reset (nicht im I3-Plan)

Einladungs- und Reset-Mails verschickt heute Supabase Auth mit seinen Standardvorlagen (englisch). Sie gehören nicht zu BE-24 (Q-56). **Empfehlung:** als kleines eigenes Paket nach I3 (requirements-engineer entscheidet), Vorlagen über `supabase/templates/*.html` und `config.toml` bzw. im Supabase-Dashboard (Gate G-5).

Gleiches Gerüst (§4) **ohne** Zusammenfassung, Gruppen und Plakette. Supabase-Variablen: `{{ .ConfirmationURL }}`, `{{ .SiteURL }}`. Supabase sendet nur HTML, deshalb steht der Link zusätzlich als Text unter dem Button.

| | Einladung | Passwort zurücksetzen |
|---|---|---|
| Betreff | „Readyloop: Einladung zu Ihrem Konto“ | „Readyloop: Passwort zurücksetzen“ |
| Kopfzeile | „Einladung“ | „Passwort zurücksetzen“ |
| Einleitung | „Sie wurden zu Readyloop eingeladen, der Software für Prüffristen von Arbeitsmitteln. Legen Sie jetzt Ihr Passwort fest.“ | „für Ihr Readyloop-Konto wurde ein neues Passwort angefordert.“ |
| Button | „Passwort festlegen“ | „Neues Passwort festlegen“ |
| Danach (14/20 steel) | „Der Link ist einmal gültig. Funktioniert der Button nicht, kopieren Sie diese Adresse in den Browser:“ + URL in `class="m"` | gleich, zusätzlich: „Sie haben nichts angefordert? Dann ignorieren Sie diese Mail. Ihr Passwort bleibt unverändert.“ |
| Fuß | „Readyloop – Prüffristen für Arbeitsmittel.“ | gleich |

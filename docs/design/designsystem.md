# Readyloop – Designsystem (Stand 23.11.2026, ergänzt um I3M Mitarbeiter und I3 E-Mail-Erinnerungen)

Erweitert `corporate-design.md` und ersetzt es nicht. Grundwerte (Farben, Schriften, Plakette) bleiben, hier kommen Abstufungen, Skalen und Regeln dazu. Änderungen an Grundwerten stehen nur in §9 „Vorschlag an Max“. Entscheidungen zu Rückfragen aus der Umsetzung stehen in §10.
Recherche dazu: `recherche-business-apps.md`, für I3M §11, für I3 §13. Mail-Vorlagen im Detail: `mail-vorlagen.md`. Umsetzung: `umsetzung.md`.

---

## 1. Designrichtung in einem Absatz

**„Prüfprotokoll“:** Readyloop sieht aus wie ein sauber geführtes Prüfbuch und nicht wie ein Startup-Dashboard. Ruhige Flächen in Papier und Weiß, Steel als Grundton, Statusfarben nur dort, wo ein Status steht. Daten sind in Tabellen und Definitionslisten gesetzt und haben feste Spalten für Datum, Inventarnummer und Fundstelle. Der Mut steckt an **einer** Stelle: in der **Prüfplakette**. Sie ist Markenzeichen, Statusanzeige, Zähler, Leerzustand und Ladebild in einem, und alles um sie herum bleibt zurückhaltend.

Leitsätze:
1. **Die Plakette sagt es zuerst, der Text sagt es genau.** Jeder Status erscheint als Plakette oder Symbol und zusätzlich als Text.
2. **Struktur spürbar, nicht sichtbar.** Trennlinien und Flächen nur dort, wo sie Gruppen trennen. Keine Kartenreihen aus gleichen Kästen.
3. **Quelle immer sichtbar.** Frist, Stufe und Fundstelle werden nie in Aufklappern versteckt.
4. **Lesbar für erfahrene Augen.** Fließtext 16 px, nichts Wichtiges unter 13 px, Kontrast mindestens AA.
5. **Eine Hauptaktion je Bereich.** Wörtlich benannt: „Nachweis speichern“, nicht „Absenden“.

Ergänzung für Mitarbeiter-Seiten und die QR-Seite (I3M):

6. **Erst die Antwort, dann die Begründung.** Mitarbeiter fragen „Darf ich das Gerät benutzen?“. Die Antwort (Nutzungsband, §6.17) steht vor allem anderen, die Prüfdaten folgen darunter.
7. **Halle vor Schreibtisch.** Jede Mitarbeiter-Ansicht muss mit Handschuhen, einer Hand und schlechtem Licht funktionieren (§6.18). Der Büro-PC bekommt dieselben Inhalte, nur breiter gesetzt.
8. **Aufkleber und Bildschirm zeigen dieselbe Plakette.** Das Etikett trägt die Plakette als festes Datum, die QR-Seite zeigt sie als aktuellen Status (§5.5).

Ergänzung für E-Mails (I3):

9. **Die Mail ist Wegweiser, die App ist die Akte.** Eine Mail zeigt so viel, dass man weiß, was zu tun ist (Gerät, Status, Frist mit Quelle und Stufe), und führt dann in die App. Jede Mail nennt ihren Stand, denn ab dem Versand kann sie veralten (§12).

---

## 2. Farben

### 2.1 Grundwerte (unverändert aus dem CD)
`steel #44546a` · `steel-hell #dfe3e9` · `moss #5b7f3a` · `ochre #c8902e` · `ochre-dunkel #7a5310` · `brick #a6452f` · `paper #f5f3ee` · `ink #1e2328`

### 2.2 Abstufungen (neu, Erweiterung)
Die Namen sind Tailwind-4-Tokens in `@theme`. Bestehende Tokens behalten ihren Namen, `steel-hell` bleibt als Alias von `steel-100`.

| Token | Hex | Einsatz |
|---|---|---|
| `steel-50` | #f1f3f6 | Tabellenkopf, Hover-Zeile, Hinweis-Fläche |
| `steel-100` (= steel-hell) | #dfe3e9 | Trennlinien zwischen Gruppen, Stufe-Marke |
| `steel-200` | #c5ccd5 | Zeilentrenner, Verlaufslinie |
| `steel-400` | #7c8797 | **Rahmen von Eingabefeldern**, Ring der leeren Plakette |
| `steel` (600) | #44546a | Kopfleiste, Primärbutton, Sekundärtext |
| `steel-800` | #2c3646 | Hover Primärbutton |
| `ink` | #1e2328 | Text |
| `moss-50` | #eef3e8 | Fläche „in Ordnung“, Erfolgsmeldung |
| `moss` | #5b7f3a | Status ok |
| `moss-800` | #3e5a26 | Text auf moss-50, falls farbig nötig |
| `ochre-50` | #fbf3e2 | Fläche „bald fällig“, Warnung, Demo-Banner |
| `ochre` | #c8902e | **nur Füllung** (Plakettensegment, Symbolkreis mit ink-Text) |
| `ochre-600` | #b07d22 | **Rahmen und Linien** im Ochre-Status (Statusmarke, Plakettenring) |
| `ochre-dunkel` | #7a5310 | Text und Symbol auf ochre-50 |
| `brick-50` | #f9ece8 | Fläche überfällig/Mangel/Fehler |
| `brick` | #a6452f | Status überfällig, Fehlerrahmen, **volle Fläche nur im Nutzungsband „Nicht verwenden“ (§6.17)** |
| `brick-800` | #7d3322 | Text auf brick-50, Hover gefährlicher Button |
| `paper` | #f5f3ee | Seitenhintergrund |
| `white` | #ffffff | Flächen (Tabellen, Formulare, Plakettenmitte) |

### 2.3 Kontrast (eigene Berechnung nach WCAG-2.x-Formel, ±0,1; frontend-dev prüft mit Werkzeug nach)

| Paar | Verhältnis | Zulässig für |
|---|---|---|
| ink auf paper | 14,3 | Text |
| ink auf white | 15,8 | Text |
| steel auf white / paper | 7,7 / 7,0 | Text, Sekundärtext |
| white auf steel | 7,7 | Kopfleiste, Primärbutton |
| brick auf white / paper | 6,0 / 5,4 | Text, Fehlertext |
| **white auf brick** | **6,0** | Text im Nutzungsband „Nicht verwenden“ (§6.17) und im gefährlichen Button |
| ochre-dunkel auf white | 6,8 | Text |
| ink auf ochre | 5,6 | Text im Ochre-Symbolkreis |
| moss auf white | 4,6 | Text (knapp), Grafik |
| moss auf paper | 4,2 | **nur** Grafik oder Text ≥ 18,7 px fett |
| ochre-600 auf white | 3,6 | Rahmen, Grafik, **kein Text** |
| steel-400 auf white | 3,6 | Rahmen von Eingabefeldern (WCAG 1.4.11) |
| **ochre auf white** | **2,8** | **nicht** als Rahmen, Linie oder Text |
| steel/40 auf white (heute `.feld`) | ≈1,9 | **fällt durch**, wird durch steel-400 ersetzt |

### 2.4 Regeln
- Statusfarben (moss, ochre, brick) nur für Status, Meldungen derselben Bedeutung und Mängel. Nie für Navigation, Deko oder Diagramme ohne Statusbezug.
- Text auf Statusflächen ist **ink** (oder die -800/-dunkel-Stufe), nie die Statusfarbe selbst in Normalgröße.
- **Einzige Ausnahme:** Das Nutzungsband „Nicht verwenden“ (§6.17) ist eine volle brick-Fläche mit weißem Text. Nirgends sonst gibt es eine volle Statusfläche. Dadurch bleibt diese Aussage einmalig und im Hallenlicht sofort erkennbar. Das gilt auch für die Mail an Mitarbeiter (§12).
- Tönungen als feste Tokens (-50), nicht über `color-mix` in Komponenten verstreut. `color-mix` ist nur in der Plakette erlaubt.
- Kein Hex außerhalb `globals.css` und `Pruefplakette.tsx`. Für den Druck ist das Schlüsselwort `black` erlaubt (QR-Code, Druckplakette, §5.5). **I3:** Mails können keine CSS-Variablen nutzen, deshalb stehen die Hex-Werte aus §2.2 dort inline, nur in `src/server/mail/vorlagen.ts` (§12).

---

## 3. Typografie

### 3.1 Schriften (Q-10 gelöst, siehe `skills-empfehlung.md` §3)
| Rolle | Schrift | Paket |
|---|---|---|
| Display: Seitentitel, Kennzahlen, **Plakette**, Wortmarke | Space Grotesk (variabel, 300–700) | `@fontsource-variable/space-grotesk` |
| Text: Fließtext, Formulare, Tabellen | IBM Plex Sans 400/500/600 | `@fontsource/ibm-plex-sans` |
| Daten: Inventarnummer, Seriennummer, Fundstelle, Datum | IBM Plex Mono 400/500 | `@fontsource/ibm-plex-mono` |

Mono steht nur für **Werte**, nie für Beschriftungen, Labels oder Überschriften.
Die Plakette nutzt laut CD **Space Grotesk** und nicht Mono wie heute. Wird in P1 korrigiert.
**Mails** nutzen keine dieser Schriften, sondern Systemschriften (§12).

### 3.2 Skala (Grundgröße 16 px, Verhältnis ≈1,25)
| Stufe | Größe / Zeilenhöhe | Schrift, Gewicht | Einsatz |
|---|---|---|---|
| `anzeige` | 36/40 | Space Grotesk 600, −0,02em | nur Login |
| `h1` | 28/34 | Space Grotesk 600, −0,015em | Seitentitel |
| `nutzung` (I3M) | 24/30 | Space Grotesk 600, −0,01em | Titel im Nutzungsband (§6.17), groß |
| `h2` | 20/28 | Space Grotesk 600, −0,01em | Abschnitte, Titel im Nutzungsband kompakt |
| `h3` | 17/24 | Plex Sans 600 | Karten-, Gruppentitel |
| `kennzahl` | 28/32 | Space Grotesk 600, `tabular-nums` | Zählerleiste |
| `text` | 16/24 | Plex Sans 400 | Fließtext, Formulare |
| `klein` | 14/20 | Plex Sans 400/500 | Tabellen, Labels, Sekundärtext |
| `fein` | 13/18 | Plex Sans 400 | Hilfetexte, Metadaten. **Untergrenze** |

Umsetzung in Tailwind 4: `--text-xs` auf 0,8125 rem / 1,125 rem anheben (13 px), damit vorhandenes `text-xs` die Untergrenze automatisch einhält.
- Zahlen in Tabellen und Zählern: `font-variant-numeric: tabular-nums`.
- Zeilenlänge Fließtext ≤ 72 Zeichen (`max-w-prose`).
- **Keine Versalien-Labels** (heute: `uppercase tracking-wide` in PruefartKarte → entfernen). Satzschreibung überall.
- Keine einzelnen hervorgehobenen Wörter in Überschriften.
- Ausnahme Untergrenze: Glyphen im Symbolkreis (✓ ! ✕ ? §, 11 px, `aria-hidden`) sind Symbole, kein Text. Der Status steht daneben in ≥ 13 px.
- **Mitarbeiter-Seiten und QR-Seite:** Inhalt mindestens `text` (16 px), Beschriftungen mindestens `klein` (14 px). `fein` nur für „Stand“-Zeile und Fußnoten.
- **Druck (Etikett, §6.21):** eigene Skala in pt, Untergrenze 6 pt, siehe dort.

---

## 4. Raum, Form, Tiefe, Bewegung

### 4.1 Abstände (4-px-Raster, Tailwind-Standard)
Erlaubte Schritte: 1 (4), 2 (8), 3 (12), 4 (16), 6 (24), 8 (32), 12 (48).
- Seitenrand: 16 px mobil, 24 px ab `md`, 32 px ab `xl`.
- Abstand zwischen Abschnitten: 32 px. Innerhalb eines Abschnitts: 12 px.
- Innenabstand Fläche: 16 px. Tabellenzelle: 12 px horizontal.
- Zwischen zwei Touch-Zielen mindestens 8 px (Mitarbeiter-Seiten 12 px).

### 4.2 Radius (Hierarchie statt Einheitsradius)
| Token | Wert | Für |
|---|---|---|
| `--radius-feld` | 4 px | Eingabefelder, Buttons, Filter-Chips, Stufe-Marke |
| `--radius-flaeche` | 6 px | Tabellencontainer, Formularflächen, Meldungen, Nutzungsband |
| rund | 9999 px | **nur** Plakette, Statusmarke, Symbolkreis |

Rund ist dem Status vorbehalten: Alles Runde in Readyloop ist ein Status.

### 4.3 Tiefe
- Flächen haben **Rahmen statt Schatten** (`steel-200`, 1 px).
- `--shadow-pop`: `0 1px 2px rgb(30 35 40 / .08), 0 8px 24px -4px rgb(30 35 40 / .16)`, nur für Menüs, Dialoge und die mobile Speicherleiste.
- Sticky-Tabellenkopf: Linie `steel-200` unten, kein Schatten.

### 4.4 Bewegung
- `--dauer-kurz` 120 ms (Hover, Drücken), `--dauer-mittel` 200 ms (Aufklappen), Kurve `cubic-bezier(.2,0,0,1)`.
- **Ein einziger Bewegungsmoment:** Auf `/login` füllt sich die große Plakette einmal Segment für Segment bis zum aktuellen Monat (40 ms je Segment, gesamt < 600 ms).
- Sonst keine Einblendanimationen, keine Hover-Hebeeffekte bei Karten.
- `prefers-reduced-motion: reduce` → alle Übergänge 0 ms, Plakette sofort im Endzustand.

---

## 5. Die Prüfplakette als roter Faden

### 5.1 Anatomie (bleibt)
Ring mit 12 Monatssegmenten (1 oben, im Uhrzeigersinn), Fälligkeitsmonat gefüllt, Jahr (zweistellig) in der Mitte, Statusfarbe.

### 5.2 Präzisierungen
- Mittentext in **Space Grotesk 600** (CD), nicht Mono.
- Ring und Segmentrahmen in Ochre-Status: **ochre-600**, Füllung des aktiven Segments: ochre. Das sichert den Grafikkontrast von 3:1.
- Inaktive Segmente: Statusfarbe 14 % auf Weiß (wie heute).
- GBU: gestrichelter Ring, Mitte „GBU“. Unbekannt: Mitte „?“. Vor Nutzung prüfen: Mitte „!“ in brick (wie heute).
- **Frist nicht freigegeben** (Status `gbu`, aber freigebbarer Katalog- oder Herstellervorschlag vorhanden, §10 E-1): gestrichelter Ring wie GBU, Mitte „§“, Label „Keine freigegebene Frist: Vorschlag liegt zur Freigabe vor“.

### 5.3 Varianten und Größen
| Variante | Größe | Wo | Inhalt |
|---|---|---|---|
| **Glyph** | 20–24 | Wortmarke, Favicon (`app/icon.svg`), Ladeanzeige im Button | Ring ohne Text, ein Segment gefüllt (steel bzw. weiß in der Kopfleiste) |
| **Zeile** | 40 | Geräteliste, Prüfartkarte, Mängelliste (Gerätespalte), Prüfungen in `PruefartKurzliste` | Status + Monat/Jahr |
| **Karte mobil** | 56 | Prüferaufgaben, **Meine Geräte, Suchtreffer, Mangel melden (Kopf)** | wie Zeile |
| **Akte** | 96 | Kopf der Geräteakte, **Kopf der QR-Seite** | wie Zeile, darunter Fälligkeitsdatum als Text |
| **Leer** | 64 / 96 | Leerzustände, **ungültiger Aufkleber** (Mitte „!“), **ungültiger Abmeldelink** (I3) | Ring `steel-400` gestrichelt, keine Füllung, Mitte „–“ |
| **Live** | 160 | Login | Steel-Ring, Segmente bis zum aktuellen Monat in moss gefüllt, Mitte aktuelles Jahr; einmalige Füllanimation |
| **Jahresring** (§9.3, §10 E-3) | 112 | Kopf `/geraete` | 12 Segmente = die 12 Kalendermonate ab dem aktuellen Monat (heute bis Ende des 11. Folgemonats), jedes Segment genau ein Monat. Füllstärke in Steel-Stufen nach Anzahl Fälligkeiten (0 / 1–2 / 3–5 / ≥6), aktueller Monat mit Rahmen ink 1,5 markiert (Fensteranfang), Mitte = Summe, Text daneben mit Zeitraum („fällig Nov. 2026 – Okt. 2027“); gleichwertige Liste mit denselben 12 Monaten für Screenreader |
| **Bestätigung** | 24 | Erfolgsmeldung nach „Nachweis speichern“ | Plakette mit neuem Monat/Jahr in moss |
| **Druck** (I3M, §5.5, §9.7) | 13 mm | QR-Etikett | einfarbig schwarz auf weiß: Ring und Segmentrahmen schwarz, Fälligkeitsmonat schwarz gefüllt, übrige Segmente weiß, Jahr in der Mitte; GBU gestrichelt mit „GBU“, unbekannt „?“ |
| **Text-Plakette** (I3, §12, §10 E-7) | 44 px | Postenzeile in Mails | runde HTML-Fläche ohne Segmente: Rand 2 px und Fläche in Statusfarbe (-50), Mitte Monat und vierstelliges Jahr als Text („03“ / „2027“); „!“, „?“, „GBU“ wie oben. Kein SVG, kein Bild. Im Classic Outlook eckig |

### 5.4 Do / Don't
- **Do:** Immer `role="img"` und eine sprechende `aria-label` (wie heute). Daneben steht der Status als Text.
- **Do:** Die Plakette steht immer links vom Objekt, das sie beschreibt. Das gilt auch in der Mail.
- **Don't:** Segmente nie als Prozent- oder Fortschrittsanzeige zweckentfremden. Ein Segment ist immer **ein** Monat, auch im Jahresring (keine zwei Monate in einem Segment).
- **Don't:** Keine Plakette als reines Schmuckbild ohne Datenbezug. Ausnahmen: Glyph in der Wortmarke und Live-Plakette auf dem Login.
- **Don't:** Plaketten nicht in Statusfarbe hinterlegen oder mit Schatten versehen. Das gilt auch innerhalb des Nutzungsbands: Die Plakette steht nie **auf** der brick-Fläche, sondern daneben auf Weiß.
- **Don't (I3):** Keine Plakette auf den Einstellungsseiten der Erinnerungen und im Versandprotokoll. Dort gibt es keinen Fälligkeitsmonat, den sie zeigen könnte (Ausnahme: Leerzustände).

### 5.5 Plakette auf Papier: das Etikett als Brücke (I3M)
Das Etikett ist die physische Hälfte der Plakette. Es hängt 12 Monate oder länger am Gerät. Eine dort gedruckte Statusfarbe wäre nach kurzer Zeit falsch: Ein grün gedrucktes Etikett an einem inzwischen überfälligen Gerät wäre gefährlicher als gar keine Farbe.
- Auf Papier trägt die Plakette deshalb **nur den Termin** (Monat und Jahr), einfarbig, wie eine echte Prüfplakette mit gestanztem Monat. Den **Status** liefert die QR-Seite.
- Auf dem Etikett steht neben der Plakette „Nächste Prüfung“ mit Monat/Jahr als Text und darunter „Aktueller Status: QR scannen“.
- Auf der QR-Seite steht dieselbe Plakette in Größe 96 und in Statusfarbe, mit der Unterzeile „Aktueller Stand“. Wer Etikett und Bildschirm nebeneinander sieht, erkennt dasselbe Zeichen mit demselben Monat wieder, ergänzt um die aktuelle Farbe.
- Einfarbig heißt: Druck auf Schwarzweiß-Laserdruckern bleibt eindeutig, und nichts hängt von `print-color-adjust` ab.
- Diese Variante ändert die Bedeutung der Plakette auf Papier (Termin statt Status). Deshalb steht sie in §9.7 zur Freigabe. Ersatzweg ohne Freigabe: siehe §9.7.

---

## 6. Komponenten

### 6.1 Kopfleiste (App-Shell)
- Höhe 56 px, Fläche **steel**, Text weiß. Links Glyph und Wortmarke „Readyloop“ (Space Grotesk 600, 18 px).
- Hauptnavigation als Textlinks: inaktiv weiß 80 %, aktiv weiß mit 3 px Unterstrich in Weiß und `aria-current="page"`.
- Rechts: Betriebsname und Menü-Button mit Namen (`<details>`-Menü oder Disclosure). Im Menü stehen Rolle, „Betrieb wechseln“ (nur bei mehreren) und „Abmelden“.
- < 640 px: Navigation als zweite Zeile, horizontal scrollbar. Name nur im Menü.
- Fokusring in der Kopfleiste weiß.
- Demo-Banner darüber: ochre-50, Linie ochre-600 unten, Text ink.
- **Don't:** keine Seitenleiste (3–4 Ziele), keine Icons ohne Text in der Navigation.
- **Öffentliche Kopfleiste (I3M, QR-Seite ohne Sitzung):** gleiche Fläche und Höhe, nur Glyph und Wortmarke, rechts der Textlink „Anmelden“ (`/login?next=/g/{token}`). Kein Betriebsname, kein Menü. Die Wortmarke ist hier kein Link.
- **Mitarbeiter:** Navigation „Meine Geräte“, „Gerät suchen“. Mobil liegen beide Punkte in der zweiten Zeile, je mindestens 48 px hoch.
- **Erinnerungen (I3, §10 E-8):** **ein** Hauptpunkt „Erinnerungen“ für ADM und SIF, rechts nach „Etiketten“ und vor „Verwaltung“. Ziel: ADM → `/admin/erinnerungen`, SIF → `/erinnerungen/protokoll`. Aktiv (`aria-current`) auf allen drei Unterseiten. Die Unterseiten erreicht man über Untertabs (§6.26).
- **Menü (I3):** für alle Rollen ein Eintrag „Benachrichtigungen“ → `/einstellungen/benachrichtigungen`, Icon `Bell` 16 px mit Text, über „Abmelden“, 48 px hoch.
- **Öffentliche Kopfleiste auf `/abmelden` (I3):** nur Glyph und Wortmarke, **ohne** „Anmelden“-Link (die Seite braucht keine Anmeldung, ein Login-Link würde vom einzigen Zweck ablenken).

### 6.2 Seitenkopf
Pfad (Breadcrumb, `klein`, steel) → h1 → optional eine Zeile Kontext → Hauptaktion rechtsbündig (mobil darunter, volle Breite).
Der Pfad ersetzt die heutigen „← Geräteliste“-Links.

### 6.3 Buttons
| Art | Aussehen | Einsatz |
|---|---|---|
| Primär | steel, Text weiß, Hover steel-800 | genau eine je Bereich |
| Sekundär | weiß, Rahmen steel-400, Hover steel-50 | weitere Aktionen |
| Still | Linkstil steel, unterstrichen | „Abbrechen“, „Filter zurücksetzen“ |
| Gefährlich | brick, Text weiß, Hover brick-800 | nur im Bestätigungsschritt (Mitglied deaktivieren, Anlass aufheben, **Aufkleber erneuern**) |

Höhe 40 px Desktop, 48 px in Prüferansichten (Hauptaktion dort 56 px).
**Mitarbeiter-Seiten und QR-Seite:** Hauptaktion 56 px, alle anderen Buttons 48 px, auf jeder Bildschirmbreite (auch am Büro-PC, Leitsatz 7). Mobil volle Breite und untereinander, ab `sm` nebeneinander in natürlicher Breite (mindestens 12 rem).
**I3:** Auf `/einstellungen/benachrichtigungen` und `/abmelden` sind alle Buttons 48 px hoch (Mitarbeiter und Prüfer nutzen die Seiten am Handy, oft aus der Mail heraus).
Bei laufender Aktion: Text bleibt, davor eine kleine drehende Glyph-Plakette, `aria-busy`.
Beschriftung als Verb plus Objekt. Keine Pfeile im Text, keine Versalien.

### 6.4 Statusmarke (`StatusAmpel`)
- Runde Pille, Fläche Status-50, Rahmen Statusfarbe (Ochre → ochre-600), Symbolkreis und Text in ink.
- GBU: gestrichelter Rahmen. Vor Nutzung prüfen: Rahmen 2 px, Text halbfett.
- **Nicht klickbar**, kein Hover. Adjektiv bzw. Zustand, kein Verb.
- In Listenzeilen stehen Plakette und Statusmarke nebeneinander: Die Plakette trägt das Datum, die Marke den Text.
- In der Prüfartkarte bei „Frist nicht freigegeben“ (§10 E-1): Form wie GBU, Text „Frist nicht freigegeben“ statt „Frist über GBU festlegen“.
- **Don't:** In der Prüfartkarte keine Marke „In Ordnung“. Dort genügen Plakette und „Fällig am“ (weniger Indikatoren, siehe Recherche §3).

### 6.5 Stufe-Marke (`StufeBadge`)
Quadrat 20 px, Radius 4, steel-50, Rahmen steel-400, Buchstabe in Space Grotesk 600 (statt Mono).
In der Akte immer mit Text („Stufe B · Richtwert DGUV“), in Tabellen allein mit `title`/`abbr`.
**Pflicht:** Neben jeder Frist stehen Stufe und Quelle. Das gilt auch für einen noch nicht freigegebenen Vorschlag.
Auf Mitarbeiter-Seiten und der QR-Seite **immer mit Text**, nie allein.
Im Versandprotokoll steht die Stufe der **Erinnerung** (`stufeLabel`, z. B. „Eskaliert an Sifa“), nicht die Stufe A–D der Frist. Deshalb dort keine Stufe-Marke, sondern Text.

### 6.6 Weitere Marken
- Betriebsstatus: neutrale Marke (steel-50, Rahmen steel-200). Nur „außer Betrieb“ bekommt brick-50, Rahmen brick und Symbol ✕. „Ausgemustert“ bleibt neutral (§10 E-2). Einen Status „gesperrt“ gibt es im Datenmodell nicht.
- Mangelstatus: offen = brick-50 mit ⚠, in Bearbeitung = ochre-50 mit !, behoben = moss-50 mit ✓. Alle teilen die Form der Statusmarke.
- Rolle (Verwaltung): Text in `klein`, keine Marke.
- **Offene Mängel (Mitarbeiter, I3M):** keine Marke, sondern eine Textzeile mit ⚠ im Symbolkreis brick-50: „1 offener Mangel gemeldet“ bzw. „3 offene Mängel gemeldet“. Ohne Beschreibung, ohne Melder. Bei 0 entfällt die Zeile.
- **Übernahme (Mitarbeiter, I3M):** keine Marke, sondern eine Textzeile in `klein` ink: „Von Ihnen übernommen seit 18.11.2026, 07:12 Uhr“, „Ihnen zugeordnet“, „Wird von einer anderen Person genutzt“, „Frei“. Nie mit Namen anderer Personen.
- **Versandstatus (I3):** eigene Marke, §6.23.
- **„Standard“ / „Angepasst“ (I3, Erinnerungseinstellungen):** keine Marke, Text in `klein` (kein Status im Sinne von §4.2).

### 6.7 Tabellen
- Container: weiß, Rahmen steel-200, Radius 6, `overflow-x-auto`.
- Kopf: steel-50, `klein` 500, ink. **Sticky** (`top: 0` im Scrollcontainer bzw. unter der Kopfleiste). Höhe wie Zeile.
- Zeile: Mindesthöhe 48 px (Plakette 40), Trenner steel-200, Hover steel-50.
- Ganze Zeile klickbar über einen gestreckten Link in der Namenszelle. Fokus zeigt einen Ring um die ganze Zeile.
- Erste Spalte Plakette, zweite Erkennung (Bezeichnung fett, darunter Inventarnummer in Mono), Zahlen rechtsbündig mit `tabular-nums`, Datum in Mono.
- < 640 px: Die Tabelle wird zur Liste. Je Gerät eine Zeile mit Plakette links, rechts Name, Status und Fälligkeit untereinander. Kein horizontales Scrollen auf dem Handy.
- **Don't:** keine Zebrastreifen (die Plakettenspalte gliedert schon), keine 10 gleich breiten Spalten, keine Aktionen-Spalte mit „…“-Menüs im MVP.

### 6.8 Zählerleiste (`StatusZaehler`)
- **Eine** zusammenhängende Fläche (weiß, Rahmen steel-200, Radius 6), innen durch senkrechte Linien in Felder geteilt, keine Einzelkarten.
- Je Feld: Kennzahl (Space Grotesk 28, tabellarisch), darunter Symbolkreis und Kurzlabel. Oben 3 px Linie in Statusfarbe (GBU gestrichelt, ochre-600 statt ochre).
- Reihenfolge nach Dringlichkeit: Überfällig, Vor Nutzung prüfen, Bald fällig, Datum unbekannt, Frist über GBU, In Ordnung, dann rechts abgesetzt „Alle“.
- Felder mit 0: Zahl in steel, Linie steel-200. Die Aufmerksamkeit gehört den Feldern mit Inhalt.
- Aktiver Filter: Fläche steel-50, 2 px Rahmen steel innen, `aria-current="true"`.
- Mobil: 2 Spalten, „Alle“ volle Breite unten.

### 6.9 Filterleiste
- Eine Zeile: Suche (mit sichtbarem Label, Button „Suchen“) und Bereich (Select).
- Das Status-Select entfällt, die Zählerleiste ist der Statusfilter.
- Aktive Filter als **Chips** unter der Leiste: „Bereich: Werkstatt ✕“, „Suche: Leiter ✕“. Rechteckig (Radius 4), weiß, Rahmen steel-400. Der ✕-Teil ist ein Link mit `aria-label="Filter Bereich entfernen"`. Chips sind eckig, damit sie nicht mit runden Statusmarken verwechselt werden.
- Ergebniszeile: „12 von 148 Geräten“ (`klein`, steel, `aria-live`).
- **Versandprotokoll (I3):** hier gibt es kein Zählerfeld; Status, Art und Bereich sind Selects in der Filterleiste (§8.22).

### 6.10 Formulare
- Einspaltig, max. 40 rem breit. Label über dem Feld (`klein` 500), darunter Hilfetext (`fein`, steel), dann das Feld.
- Feld: Höhe 40 (Prüfer: 48), Rahmen **steel-400**, Radius 4, weiß. Fokus mit Rahmen steel und Ring 2 px steel, Abstand 2.
- Fehler: Rahmen brick 2 px, darunter Text brick mit „✕“ davor, `aria-describedby` (wie heute).
- Ab 2 Feldfehlern: **Fehlerübersicht** oben im Formular (brick-50, Titel „Bitte korrigieren“, Liste mit Links zu den Feldern). Fokus springt dorthin.
- Optionale Felder mit dem Zusatz „(optional)“ im Label, keine Sternchen.
- Gruppen mit `fieldset`/`legend` (h3-Stil).
- Datum: natives `type="date"`. Zahl der Monate: `inputmode="numeric"` mit Einheit „Monate“ rechts im Feld.
- Datei (Nachweis-PDF): Ablagefläche 96 px hoch, gestrichelt steel-400, Text „PDF auswählen“. Nach der Wahl: Dateiname (Mono), Größe, „Andere Datei wählen“.
- Aktionen unten links: Primär, daneben „Abbrechen“ als stiller Link. Mobil: Primär volle Breite in einer festen Leiste unten (weiß, `--shadow-pop`).
- Inline-Formulare in der Akte (Frist freigeben, Prüfer zuweisen, Betriebsstatus): in einer Disclosure „Frist festlegen“ bzw. „Prüfer zuweisen“. Geschlossen zeigt sie den aktuellen Wert.
- **Mitarbeiter-Formulare:** Felder 48 px hoch, Label in `text` 500 (16 px) statt `klein`, Hilfetext in `klein`. Mehrzeiliges Textfeld mindestens 4 Zeilen.
- **Tage-Felder (I3):** `type="number"`, `inputmode="numeric"`, `min`/`max` aus dem Vertrag (Staffel 1–365, Eskalation 0–90), Breite 9 rem, Einheit rechts im Feld („Tage vorher“ bzw. „Tage nach Fälligkeit“). Feldfehler einer Gruppe (z. B. `staffel`) stehen unter der `legend`.

### 6.11 Meldungen
| Art | Fläche / Linie | Symbol | Rolle |
|---|---|---|---|
| Erfolg | moss-50 / moss links 4 px | ✓ (bei Nachweis: Bestätigungs-Plakette) | `status` |
| Warnung | ochre-50 / ochre-600 | ! | `status` |
| Fehler | brick-50 / brick | ✕ | `alert` |
| Hinweis | steel-50 / steel | i | `note` |
Aufbau: Symbol, fetter Satz (was passiert ist), optional ein zweiter Satz (was jetzt zu tun ist) und ein Link.
**Keine schwebenden Toasts** im MVP: Meldungen stehen an der Stelle der Aktion bzw. oben auf der Zielseite und bleiben stehen.
Fehlertexte entschuldigen sich nicht und nennen die Ursache: „PDF ist größer als 10 MB. Bitte kleinere Datei wählen.“

Feste Texte I3 (D-I3):
| Situation | Art | Text |
|---|---|---|
| `mailModus() === 'aus'` | Warnung | „Mailversand ist nicht eingerichtet.“ + „Readyloop versendet derzeit keine Erinnerungen.“ |
| `mailModus() === 'vorschau'` (Protokoll, Mail-Vorschau) | Hinweis | „Nur Vorschau – nichts wird versendet.“ + „Mails liegen nur im Speicher des Servers und gehen beim Neustart verloren.“ |
| Bereich ohne aktiven VER (`warnungen`) | Warnung | Text aus `warnungen` wörtlich, z. B. „Kein aktiver Verantwortlicher – Erinnerungen gehen an die Sifa.“ |
| Pflichtmail | Hinweis in der Karte (§8.20) | `PFLICHTMAIL_BEGRUENDUNG` wörtlich |
| Abmeldung per Link erfolgreich | Erfolg | „Sie erhalten die {Art} von {Betrieb} nicht mehr.“ bzw. „Sie erhalten die {Art} von {Betrieb} wieder.“ |

### 6.12 Leerzustände
Aufbau: Leer-Plakette (64), Titel (h3), ein Satz, eine Aktion. Linksbündig in der Fläche, die sonst die Tabelle einnimmt.
| Art | Beispiel `/geraete` |
|---|---|
| Noch keine Daten | „Noch keine Geräte erfasst.“ · „Legen Sie das erste Arbeitsmittel an. Fristen schlägt Readyloop aus dem Prüfkatalog vor.“ · [Gerät anlegen] (nur mit Recht, sonst Satz „Geräte legt der Verantwortliche des Bereichs an.“) |
| Filter ohne Treffer | „Keine Geräte für diese Filter.“ · aktive Chips anzeigen · [Filter zurücksetzen] |
| Alles erledigt (Prüfer, Mängel) | Plakette in moss mit ✓ statt Leer-Plakette: „Keine offenen Prüfungen.“ · „Neue Aufgaben erscheinen hier, sobald ein Betrieb Sie zuweist.“ |
| Kein Zugriff / Fehler | Leer-Plakette mit „!“ · Ursache und Weg: „Ihr Konto ist keinem Betrieb zugeordnet. Bitten Sie den Admin um eine Einladung.“ |

I3-Leerzustände stehen bei den Seitenmustern §8.18–§8.23.

### 6.13 Definitionslisten (Stammdaten)
Zweispaltig `dt` (`klein`, steel) und `dd` (`text`). Leerwert „–“ mit `aria-label="keine Angabe"`. Werte wie Inventarnummer, Seriennummer und Baujahr in Mono.

### 6.14 Verlauf
Senkrechte Linie steel-200, je Eintrag ein 8-px-Punkt (Statusfarbe, wenn das Ereignis einen Status hat, sonst steel-400). Links das Datum (Mono, `klein`), rechts Ereignis und Person. Neueste oben. Ab 10 Einträgen „Ältere anzeigen“.
I3: Das Ereignis `erinnerung_einstellung_gespeichert` hat keinen Geräte- und keinen Statusbezug. Es erscheint nicht im Geräteverlauf, nur als „Angepasst am … von …“ auf den Erinnerungsseiten.

### 6.15 Icons
Status- und Meldungssymbole (✓ ! ✕ ? § ⚠ i) bleiben als eigene Glyphen im Symbolkreis. Für UI-Icons (Suche, Menü, Datei, Herunterladen) wird `lucide-react` empfohlen (Vorschlag §9.5), 16 px, Strich 1,75, immer mit Text.
Mitarbeiter-Seiten: UI-Icons 20 px. Drucker-Icon (`Printer`) nur am Button „Drucken“, Such-Icon (`Search`) nur im Suchbutton, jeweils mit Text.
I3: `Bell` im Menü („Benachrichtigungen“), `Lock` in der Pflichtzeile der Benachrichtigungskarte, `Mail` nur im Button „Erinnerungslauf jetzt ausführen“; jeweils mit Text. Keine Icons in Mails.

### 6.16 Dialoge
Natives `<dialog>`, Radius 6, `--shadow-pop`, Breite max. 28 rem. Nur für Bestätigungen gefährlicher Aktionen. Titel als Frage („Mitglied deaktivieren?“), Buttons „Deaktivieren“ (gefährlich) und „Abbrechen“.
Ausnahme „Aufkleber erneuern“: siehe §10 E-5 (Disclosure mit Bestätigungs-Checkbox statt Dialog).
I3: Keine Dialoge. „Auf Standard zurücksetzen“ und „Abbestellen“ sind umkehrbar und brauchen keine Rückfrage.

### 6.17 Nutzungsband (`NutzungsHinweis`, I3M)
Beantwortet die Frage „Darf ich das Gerät benutzen?“. Steht auf jeder Mitarbeiter-Ansicht und auf der QR-Seite **vor** allen anderen Inhalten zum Gerät (Leitsatz 6, F-21).

| Nutzung | Fläche | Symbol | Titel (sichtbar) | Zweite Zeile | Dritte Zeile „Was tun“ |
|---|---|---|---|---|---|
| `nicht_verwenden` | **brick voll**, Text weiß, Radius 6 | ✕ im weißen Kreis (Kreis weiß, Glyph brick), 32 px | „Nicht verwenden“ | Grund, z. B. „Überfällig“, „Gefährlicher Mangel offen“, „Außer Betrieb“ | „Gerät nicht benutzen. Verantwortlichen informieren.“ |
| `unklar` | ochre-50, Rahmen 2 px ochre-600, Text ink | ? im Kreis ochre, Glyph ink, 32 px | „Prüfstatus unklar“ | „Vor Nutzung Verantwortlichen fragen.“ | – |
| `verwendbar` | moss-50, Rahmen 1 px moss, Text ink | ✓ im Kreis moss, Glyph weiß, 32 px | „Verwendbar“ | „Nächste Prüfung bis {TT.MM.JJJJ}.“ Bei `bald_faellig` zusätzlich „Prüfung bald fällig.“ | – |

Regeln:
- **Wortlaut für Tests:** Der Textinhalt des Bands enthält den Vertragstext. `nicht_verwenden`: „Nicht verwenden“ und der Grund werden mit einem nur für Screenreader sichtbaren „ – “ verbunden, sodass `textContent` „Nicht verwenden – Überfällig“ ergibt. `unklar`: Titel und zweite Zeile ergeben zusammen `NUTZUNG_LABEL.unklar` („Prüfstatus unklar – vor Nutzung Verantwortlichen fragen“), ebenfalls über „ – “ in `sr-only`. Die Satzanfänge im sichtbaren Text werden dafür nicht verändert, nur die Trennung ist visuell.
- **Grund** bei `nicht_verwenden`, erste zutreffende Regel: Betriebsstatus ≠ `in_betrieb` → „Außer Betrieb“; Gesamtstatus `ueberfaellig` → „Überfällig“ (bei bekanntem Datum: „Überfällig seit {TT.MM.JJJJ}“ als zusätzliche Zeile in `text`); `vor_nutzung_pruefen` → `VOR_NUTZUNG_GRUND_LABEL[grund]`.
- **Zwei Größen:**
  - *Groß* (QR-Seite, Mangel melden): volle Breite, Innenabstand 16/20 px, Titel `nutzung` (24/30), Folgezeilen `text` 16 px. Mindesthöhe 96 px.
  - *Kompakt* (Karten in Meine Geräte und Suche): volle Kartenbreite am oberen Rand der Karte, Innenabstand 12/16 px, Titel `h2` (20/28), Folgezeilen `klein` 14 px. Bei `verwendbar` entfällt die Fläche in der kompakten Größe; stattdessen steht eine Statusmarke „✓ Verwendbar“ (Form §6.4, moss) in der Karte. So fallen die Geräte, die Aufmerksamkeit brauchen, in einer Liste sofort auf.
- Semantik: `<section aria-labelledby>` mit dem Titel als Überschrift (h2 auf der QR-Seite vor dem h1? Nein: siehe §8.12, das Band ist ein `<p>`-Block mit `role="status"` nur nach einer Aktion; im Normalfall ein normaler Absatzblock direkt unter dem h1-Bereich im DOM, aber visuell zuerst). Verbindliche Lösung in §8.12.
- **Do:** Symbol, Titel und Grund immer gemeinsam. Bei schlechtem Licht trägt die Form (Kreis mit ✕) die Aussage, nicht die Farbe.
- **Don't:** Keine Plakette auf der brick-Fläche (§5.4). Keine Buttons in der brick-Fläche; Aktionen stehen darunter. Kein Ausblenden, Wegklicken oder Einklappen des Bands.
- **Don't:** Die Wörter „gesperrt“ oder „blockiert“ nicht verwenden. Readyloop sperrt das Gerät nicht technisch (MVP-Ausschluss); „Nicht verwenden“ ist eine Anweisung an den Menschen.
- **I3:** Die Mail an Mitarbeiter (`ma_hinweis`) übernimmt das Band als HTML-Tabelle (`mail-vorlagen.md` §7).

### 6.18 Halle-Modus: Regeln für Mitarbeiter-Seiten und die QR-Seite (I3M)
Gilt für `/g/[token]`, `/meine-geraete`, `/meine-geraete/suchen`, `/mangel-melden/[geraetId]`, auf jeder Bildschirmbreite.

Bedienung:
- Touch-Ziele mindestens 48 × 48 px, Hauptaktion 56 px hoch, Abstand zwischen Zielen mindestens 12 px. Gilt auch für Links in Fließtext, die eine Aktion auslösen (dann als Button gestalten).
- Keine Wischgesten, kein langes Drücken, keine Aktion nur über Hover, keine Tooltips mit Pflichtinformation.
- Die Hauptaktion steht immer an derselben Stelle: direkt unter der Geräte-Kennung (QR-Seite) bzw. unten in der Karte (Listen). Nie über dem Nutzungsband.
- Eine Übernahme oder Rückgabe ist **ein** Tipp ohne Rückfrage. Sie lässt sich mit dem jeweils anderen Button umkehren. Eine Rückfrage kostet mit Handschuhen mehr, als sie schützt.
- Nach jeder Aktion bleibt man auf derselben Seite. Die Meldung erscheint am Ort der Aktion (§6.11) und bekommt den Fokus.

Lesbarkeit bei schlechtem Licht:
- Inhaltstext ink, nicht steel. Steel nur für Beschriftungen (`dt`), Pfad und „Stand“.
- Datum und Inventarnummer in Mono 16 px, `tabular-nums`.
- Keine Information nur über Farbe oder dünne Linien. Nutzungsband, Statusmarke und Symbolkreis tragen Text und Form.
- Keine Bilder oder Hintergrundflächen hinter Text.

Sprache (Mitarbeiter sind keine Compliance-Profis):
- Kurze Hauptsätze, höchstens 12 Wörter je Hinweis, Anweisungen im Imperativ: „Gerät nicht benutzen.“ Statt Passiv oder „Bitte beachten Sie“.
- Wortwahl: „Prüfung“ statt „Prüfart“, „Gerät“ statt „Arbeitsmittel“, „Verantwortlicher“ statt „VER“, „Aufkleber“ für das Etikett am Gerät.
- Fachbegriffe, die der Vertrag fest vorgibt (z. B. „Frist über GBU festlegen“), bleiben wörtlich stehen. Darunter steht eine Zeile Klartext: „Noch keine Prüffrist festgelegt.“
- Stufe immer mit `STUFE_LABEL` (§6.5), Quelle mit `FRIST_QUELLE_LABEL`.
- Daten als „15.03.2027“, nicht „03/2027“ (die Plakette zeigt Monat/Jahr, der Text das genaue Datum).
- Keine Namen anderer Mitarbeiter (F-27). Einziger Personenname: der Prüfer im letzten Nachweis, mit dem Wort „Prüfer:“ davor.

Büro-PC:
- Gleiche Inhalte und Aktionen (P-09). Ab `lg` werden Karten zu Zeilenkarten (§6.19), die Seite wird breiter (§7). Größen der Ziele bleiben.
- Alles mit Tastatur erreichbar, Tab-Reihenfolge = Lesereihenfolge (Band, Gerät, Aktionen, Prüfungen).

### 6.19 Gerätekarte Mitarbeiter (`MeinGeraetKarte`, I3M)
Eine Komponente für Meine Geräte und Suchtreffer (Prop `variante: 'meine' | 'treffer'`).

```
┌──────────────────────────────────────────────┐
│ ✕  Nicht verwenden                    (Band) │  ← kompakt, nur wenn nicht „verwendbar“
│    Überfällig seit 15.03.2026                 │
│    Gerät nicht benutzen. Verantwortl. inform. │
├──────────────────────────────────────────────┤
│ ◔56  Stehleiter 6 Stufen            (h3)     │
│      L-008                          (Mono)   │
│      Von Ihnen übernommen seit 18.11., 07:12 │
│      Nächste Prüfung: 15.03.2026             │
│      ⚠ 1 offener Mangel gemeldet             │
│ ▸ Prüfungen (1)                  (Disclosure)│
│ [      Zurückgeben      ] 56                 │
│ [     Mangel melden     ] 48                 │
└──────────────────────────────────────────────┘
```
- Fläche weiß, Rahmen steel-200, Radius 6. Das kompakte Band füllt die Kartenoberkante (oben Radius 6, unten 0).
- Treffer zeigen zusätzlich den Bereich („Lager“) neben der Inventarnummer und statt der Übernahmezeile den Zustand nach §6.6.
- Disclosure „Prüfungen (n)“: zu bei `verwendbar`, offen bei `unklar` und `nicht_verwenden`. Geschlossen zeigt sie keine Frist (also auch keine Frist ohne Stufe und Quelle); geöffnet die `PruefartKurzliste` (§6.20).
- **Aktionen je Zustand** (genau eine Hauptaktion):

| Zustand | Hauptaktion (56) | Weitere (48) | Hinweis über den Buttons |
|---|---|---|---|
| übernommen von mir | „Zurückgeben“ | „Mangel melden“ | – |
| frei, übernehmbar, `verwendbar` | „Gerät übernehmen“ | „Mangel melden“ | – |
| frei, übernehmbar, `unklar` | „Gerät übernehmen“ | „Mangel melden“ | Warnung: „Prüfstatus unklar. Vor der Nutzung Verantwortlichen fragen.“ |
| von anderen, übernehmbar | „Gerät übernehmen“ | „Mangel melden“ | Hinweis: „Wird von einer anderen Person genutzt. Wenn Sie übernehmen, endet deren Übernahme.“ |
| `uebernahmeHinweis` gesetzt | – (kein Button) | „Mangel melden“ als Hauptaktion (56) | `UEBERNAHME_HINWEIS_LABEL` als Hinweis (bei `nicht_verwenden` als Fehler-Meldungsstil, sonst Hinweis) |
| zugeordnet | – | „Mangel melden“ als Hauptaktion (56) | – |

- **Zeilenkarte ab `lg`:** dieselbe Komponente, CSS-Grid `56px 1fr 16rem` mit Plakette, Kennung/Zeilen und rechts den Aktionen untereinander. Das kompakte Band bleibt über der ganzen Zeile. Die Disclosure liegt unter der Zeile über die volle Breite.
- Karten stehen in einer Liste (`<ul>`), Abstand 12 px. Keine Mehrspalten-Kachelraster.

### 6.20 Prüfungen kurz (`PruefartKurzliste`, I3M)
Je Prüfung ein Block, getrennt durch eine Linie steel-200. Keine Tabelle (am Handy nicht lesbar, am PC zu dicht für Laien).

```
◔40  Ortsveränderliche elektrische Betriebsmittel (h3)
     ✕ Überfällig                                 (Statusmarke)
     Fällig am        15.03.2026
     Prüffrist        6 Monate · Prüfkatalog · [B] Stufe B: Richtwert DGUV/TRBS/ASR …
     Grundlage        DGUV V3 § 5, DA Tab. 1B      (Mono)
     Letzte Prüfung   15.09.2025 (Nachweis in Readyloop)
     Letzter Nachweis 15.09.2025 · Ohne Mängel · Prüfer: Tobias Berger
```
- `dl` zweispaltig ab `sm` (`dt` 9 rem, `klein` steel; `dd` `text` ink), mobil `dt` über `dd`.
- Ohne Frist: Statt „Fällig am“, „Prüffrist“, „Grundlage“ eine Zeile „Frist über GBU festlegen“ (fett) und darunter „Noch keine Prüffrist festgelegt.“
- Unbekanntes Datum: „Letzte Prüfung: unbekannt“. Kein Nachweis: „Letzter Nachweis: noch keiner in Readyloop“.
- Statusmarke auch bei „In Ordnung“ (anders als §6.4 in der Akte), weil Mitarbeiter die positive Bestätigung brauchen.
- „Grundlage“ ist das Laienwort für Fundstelle. Der Wert bleibt die Fundstelle wörtlich.

### 6.21 QR-Etikett (`Etikett`, I3M)
Format 70 × 37 mm, Bogen A4 3 × 8 (F-25, Q-39). Alle Maße in mm bzw. pt, nur in `druck.css` und `Etikett.tsx`.

```
 ← 70 mm →
┌──────────────────────────────────────────────┐ ↑
│  ┌────────┐  ◔13mm  Nächste Prüfung          │
│  │▓▓ QR ▓▓│         03/2027      (11pt SG600)│
│  │ 21×21  │         Stand 20.11.2026  (6pt)  │ 37 mm
│  │  mm    │  Gabelstapler Linde H25 (8pt 600)│
│  └────────┘  L-001                (8pt Mono) │
│  Aktueller   Elbtal Fördertechnik GmbH (6pt) │
│  Status:     app.readyloop.de/g/      (6pt M)│
│  QR scannen  AbCdEfGhIjKlMnOpQrStUv   (6pt M)│
└──────────────────────────────────────────────┘ ↓
```
- **Sicherheitsrand:** innen 4 mm oben/unten, 5 mm links/rechts. Nutzfläche 60 × 29 mm. Grund: Bürodrucker drucken die äußersten 3–5 mm eines Blatts nicht zuverlässig, und die Bögen haben kaum Seitenrand (3 × 70 = 210 mm).
- **Links (21 mm breit):** QR-Code 21 × 21 mm **einschließlich** Ruhezone von 4 Modulen. Bei der Token-URL (Version 3–4, 29–33 Module + 8 Ruhezone) ergibt das 0,5–0,6 mm je Modul, deutlich über dem Minimum von 0,25 mm. Darunter in 2 Zeilen „Aktueller Status:“ / „QR scannen“, 6,5 pt Plex Sans 600, linksbündig.
- **Rechts (37 mm breit, 2 mm Abstand zum QR):**
  1. Kopfzeile 13 mm hoch: Plakette Variante Druck (13 mm), daneben „Nächste Prüfung“ (6 pt), Monat/Jahr (11 pt Space Grotesk 600, `tabular-nums`), „Stand {TT.MM.JJJJ}“ (6 pt). Bei `gbu`: „Frist über GBU festlegen“ (6,5 pt, 2 Zeilen) statt Monat/Jahr. Bei `unbekannt`: „Prüfdatum unbekannt“.
  2. Bezeichnung: 8 pt Plex Sans 600, **eine** Zeile, Überlauf mit „…“.
  3. Inventarnummer: 8 pt Plex Mono 500. Fehlt sie, entfällt die Zeile.
  4. Betrieb: 6 pt Plex Sans, eine Zeile, „…“.
  5. Kurz-URL: 6 pt Plex Mono, **zwei Zeilen**: Host mit „/g/“ und darunter der Token. So bleibt der Token abtippbar, falls der QR beschädigt ist.
- Alles schwarz auf weiß (`black`). Keine Flächen, keine Statusfarbe, kein Logo außer der Plakette.
- Bildschirmvorschau: jedes Etikett mit gestricheltem Schnittrand steel-200 (nur `@media screen`).
- **Don't:** QR nie unter 18 mm (inklusive Ruhezone) verkleinern, um Text Platz zu machen. Lieber Bezeichnung kürzen.
- **Don't:** Keine Statusmarke „In Ordnung“ und keine farbige Plakette auf dem Etikett (§5.5).

### 6.22 Gerätesuche (`GeraeteSucheForm`, I3M)
- Ein Feld, `type="search"`, `enterkeyhint="search"`, `autocomplete="off"`, Höhe 48 px, Label sichtbar: „Gerät, Inventarnummer oder Hersteller“. Button „Suchen“ (Primär, 48 px, Such-Icon mit Text) rechts daneben ab `sm`, mobil darunter in voller Breite.
- `autofocus` nur, wenn noch kein Suchbegriff in der URL steht.
- GET-Formular (`?q=`), funktioniert ohne JavaScript.
- Ergebniszeile `klein` ink mit `aria-live="polite"`: „3 Geräte für „leiter““. Bei 50 Treffern: „Die ersten 50 Geräte. Suchbegriff genauer eingeben.“
- Unter 2 Zeichen: Hinweis „Bitte mindestens 2 Zeichen eingeben.“ (keine Fehlermeldung, kein Rahmen in brick).
- Unter dem Feld ein Hinweis in `klein` steel: „Am Handy schneller: QR-Code am Gerät mit der Kamera scannen.“

### 6.23 Versandstatus-Marke (`VersandStatusBadge`, I3)
Form wie die Statusmarke §6.4 (runde Pille, Symbolkreis, Text ink, nicht klickbar). Text = `VERSAND_STATUS_LABEL[status]` wörtlich. Die Farben folgen der Bedeutung (§2.4: Meldungen derselben Bedeutung), nicht der Fristlogik.

| Status | Fläche / Rahmen | Symbol | Bedeutung für den Leser |
|---|---|---|---|
| `vorbereitet` | steel-50 / steel-200 | i | läuft gerade |
| `versendet` | steel-50 / steel-400 | ✓ | an den Versanddienst übergeben, Zustellung noch nicht bestätigt |
| `zugestellt` | moss-50 / moss | ✓ | angekommen |
| `fehler` | ochre-50 / ochre-600 | ! | wird am nächsten Werktag erneut versucht |
| `bounce` | brick-50 / brick | ✕ | Adresse prüfen, sonst kommt nichts an |
| `beschwerde` | brick-50 / brick | ⚠ | Empfänger hat die Mail als Spam markiert |
| `vorschau` | white / steel-400 gestrichelt | i | nur in der Vorschau |

- Bei `fehler` steht darunter in `klein` steel der Text aus `MAIL_FEHLER_LABEL[fehlerCode]`; bei `versuche > 1` zusätzlich „{n} Versuche“.
- **Don't:** keine Marke „Zugestellt“ ohne Text, kein Tooltip als einzige Erklärung.

### 6.24 Vorlauf-Staffel und Eskalationskette (`ErinnerungEinstellungForm`, `EskalationsKette`, I3)

**Staffel** (`fieldset`, legend „Vorlauf vor der Fälligkeit“):
- Hilfetext: „Mails an die Verantwortlichen des Bereichs, bevor eine Prüfung fällig wird. Leere Felder werden ignoriert.“
- Drei Tage-Felder (§6.10) mit `name="staffel"`, ab `sm` nebeneinander, mobil untereinander: „Erste Erinnerung“, „Zweite Erinnerung (optional)“, „Dritte Erinnerung (optional)“, Einheit „Tage vorher“.
- Der Server sortiert absteigend; die Felder zeigen gespeicherte Werte in dieser Reihenfolge. Fehler zu `staffel` unter der legend.

**Eskalationskette** (`fieldset`, legend „Eskalation ab Fälligkeit“):
```
0 = am Fälligkeitstag. Jede Stufe frühestens am Tag der vorherigen.

1. Verantwortliche     →   2. Sifa              →   3. Admin/Geschäftsführung
   des Bereichs
   ab Tag [  0 ]           ab Tag [  7 ]            ab Tag [ 14 ]
   nach Fälligkeit         nach Fälligkeit          nach Fälligkeit
   Sifa in Kopie,          Verantwortliche          Sifa und Verantwortliche
   wenn eingestellt        in Kopie                 in Kopie
```
- Semantik: `<ol>` mit drei `<li>`. Titel je Schritt aus `ESKALATIONS_EBENE_LABEL` (h3-Stil), Nummer als Text („1.“), **kein** Kreis (rund = Status, §4.2).
- Ab `md` drei Spalten im Grid, dazwischen ein „→“ in steel-400 (`aria-hidden`, 24 px Spalte). Darunter: senkrecht, verbunden durch eine Linie steel-200 links (wie Verlauf §6.14).
- Felder `eskalationVerantwortlicher`, `eskalationSifa`, `eskalationAdmin` (min 0, max 90), Label sichtbar „ab Tag“ + Einheit „nach Fälligkeit“; für Screenreader vollständig: „Verantwortliche des Bereichs: ab Tag … nach Fälligkeit“.
- Die Kopie-Zeile in `klein` steel beschreibt die Regel aus F-32. Sie ändert sich nicht mit den Eingaben (kein JavaScript nötig).
- **Don't:** keine Schieberegler, kein Ziehen, keine im Browser berechneten Beispieldaten.

### 6.25 Empfängerwahl (I3)
- **Verantwortliche des Bereichs:** nur lesend als Liste der Namen (`klein`), darunter „Verantwortliche des Bereichs erhalten Erinnerungen immer.“ Keine Checkboxen. Fehlt ein aktiver VER: Warnung aus `warnungen`.
- **Sifa in Kopie:** eine Checkbox `sifaInKopie`, Label „Sifa beim Vorlauf und bei der ersten Eskalationsstufe in Kopie“, Hilfe „Ab der Stufe Sifa erhält die Sifa die Erinnerung immer.“
- **Sifa** und **Admin/Geschäftsführung** je eine Radiogruppe (`sifaAuswahl` / `adminAuswahl`): „Alle aktiven ({n})“ und „Auswahl“. Unter „Auswahl“ eingerückt (24 px) die Checkboxen `sifaEmpfaenger` / `adminEmpfaenger`, Zeilenhöhe 40 px, Namen alphabetisch.
- Die Checkboxliste ist ohne JavaScript immer sichtbar. Mit `:has()` wird sie ausgeblendet, solange „Alle aktiven“ gewählt ist. Die Auswahl bleibt dabei erhalten.
- Keine Optionen: statt der Radiogruppe der Satz „Keine aktive Sifa im Betrieb.“ bzw. „Kein aktiver Admin im Betrieb.“, Feld `sifaAuswahl` als `hidden` mit `alle`.
- Feldfehler (`sifaEmpfaenger`, `adminEmpfaenger`) unter der jeweiligen Radiogruppe.

### 6.26 Untertabs Erinnerungen (`ErinnerungenNav`, I3)
- Gleiche Optik wie `VerwaltungNav` (§8.10): Unterstrich-Tabs steel auf paper, unter dem h1.
- Tabs: „Einstellungen je Bereich“ (`/admin/erinnerungen`, nur ADM) · „Versandprotokoll“ (`/erinnerungen/protokoll`, ADM und SIF) · „Mail-Vorschau“ (`/admin/mails`, nur ADM und nur im Modus `vorschau`).
- Props: `aktiv: 'einstellungen' | 'protokoll' | 'vorschau'`, `zeigeEinstellungen: boolean`, `zeigeVorschau: boolean`. Die Seite ermittelt beides serverseitig (`can(...)`, `mailModus()`).
- Ist nur ein Tab sichtbar (SIF), entfällt die Tab-Zeile ganz.

---

## 7. Layout-Raster

| Seitentyp | Breite | Raster |
|---|---|---|
| Listen (`/geraete`, `/maengel`, Verwaltung) | max. 72 rem | einspaltig |
| Geräteakte, Mangelakte | max. 80 rem | ab `xl`: Inhalt `1fr` und rechte Spalte 20 rem |
| Formulare, Prüfer, Login | max. 40 rem | einspaltig |
| **QR-Seite `/g/[token]`, Mangel melden** (I3M) | max. 40 rem | einspaltig, auf jeder Breite |
| **Meine Geräte, Gerät suchen** (I3M) | max. 40 rem bis `lg`, ab `lg` max. 64 rem | Karten einspaltig; ab `lg` Zeilenkarten (§6.19) |
| **Etiketten** (I3M) | Bedienteil max. 72 rem; Vorschau 210 mm je Bogen | Vorschau mit eigenem `overflow-x-auto`, nicht die Seite |
| **Erinnerungen Übersicht, Versandprotokoll** (I3) | max. 72 rem | einspaltig |
| **Erinnerungen je Bereich** (I3) | max. 48 rem | einspaltig; Eskalationskette ab `md` dreispaltig |
| **Benachrichtigungen, Abmelden** (I3) | max. 40 rem | einspaltig |
| **Mail-Vorschau** (I3) | max. 80 rem | ab `xl`: Liste 22 rem und Vorschau `1fr`; darunter untereinander |

Alles linksbündig. Zentriert sind nur Login und `/auth/bestaetigen`.

---

## 8. Seitenmuster

### 8.1 `/login`
```
┌──────────────────────────────────────────────┐
│                                              │
│      ◔ (Live-Plakette 160, füllt sich)       │
│        Readyloop                (anzeige)    │
│        Prüffristen für Arbeitsmittel.        │
│        Nachweise griffbereit.                │
│      ┌──────────────────────────────┐        │
│      │ E-Mail  [__________________] │        │
│      │ Passwort[__________________] │        │
│      │ [Anmelden]   Passwort vergessen│       │
│      └──────────────────────────────┘        │
└──────────────────────────────────────────────┘
```
Ab `lg` zweispaltig: links Plakette und Claim auf steel-Fläche (Text weiß), rechts das Formular auf paper. Die Demo-Rollenwahl steht als Liste von Sekundärbuttons im Formularbereich.
I3M: Kommt der Aufruf mit `next=/g/…`, steht über dem Formular ein Hinweis (§6.11 Hinweis): „Nach der Anmeldung geht es zurück zum Gerät.“

### 8.2 `/auth/bestaetigen`, `/passwort-vergessen`, `/passwort-neu`, `/kein-zugang`
Wie Login, einspaltig, kleine Glyph-Plakette statt Live-Plakette. Je Seite ein Satz, ein Formular bzw. eine Aktion. `/kein-zugang` als Leerzustand „Kein Zugriff“ (§6.12).

### 8.3 `/organisation`
Liste der Betriebe als große klickbare Zeilen (56 px): Betriebsname (h3), Rolle (`klein`), rechts die Zahl der überfälligen Prüfungen mit Symbol, wenn das Backend sie liefert. Sonst ohne Zahl.

### 8.4 `/geraete`
```
[Kopfleiste]
Geräte (h1)                                   [Gerät anlegen]
┌Zählerleiste──────────────────────────────────────┬──────┐  ◔ Jahresring (opt.)
│ 3 ✕Überfällig │ 1 !Vor Nutzung │ 7 !Bald │ … │ 148 Alle │  23 fällig Nov. 2026 – Okt. 2027
└──────────────────────────────────────────────────┴──────┘
[Suche ____________][Suchen]  Bereich [Alle ▾]
Chips: Bereich: Werkstatt ✕
12 von 148 Geräten
┌──┬───────────────────────┬──────────┬──────────────┬─────────┬──────┐
│◔ │ Bohrmaschine Hilti …  │ Werkstatt│ ✕ Überfällig │ 03.2026 │ ⚠ 1  │
│  │ INV-00213             │          │              │         │      │
```

### 8.5 `/geraete/[id]` (Geräteakte)
```
Geräte / Bohrmaschine Hilti TE 30
┌────────────────────────────────────────────────────────────────────────┐
│ ◔96  Bohrmaschine Hilti TE 30 (h1)     [✕ Überfällig] [In Betrieb]     │
│      Nächste Prüfung 03/2026 · INV-00213 · Werkstatt                   │
└────────────────────────────────────────────────────────────────────────┘
Abschnittsleiste (sticky, Anker): Prüfarten 2 · Mängel 1 · Nachweise 4 · Verlauf
┌ Inhalt ─────────────────────────────────────┐ ┌ rechte Spalte (xl) ──┐
│ Prüfarten                                   │ │ Stammdaten (dl)      │
│ ┌ ◔40 Ortsveränderliche el. Betriebsmittel ┐│ │ Betrieb und Standort │
│ │ ! Anlass offen – vor Nutzung prüfen      ││ │  (Disclosures)       │
│ │ Fällig am │ Frist │ Stufe │ Quelle       ││ │ Nutzung und Aufkleber│
│ │ 15.03.2026│ 12 Mo │ [B]   │ DGUV V3 …    ││ │  (I3M, §8.16)        │
│ │ ▸ Frist festlegen   ▸ Prüfer zuweisen    ││ │ Anlassprüfungen      │
│ │ [Nachweis erfassen] [Mangel erfassen]    ││ └──────────────────────┘
│ └──────────────────────────────────────────┘│
│ Mängel · Nachweise · Verlauf                │
└─────────────────────────────────────────────┘
```
Regeln für die Prüfartkarte:
1. Kopf: Plakette 40, Name (h3), Katalogschlüssel (`fein`), Statusmarke nur, wenn nicht „in Ordnung“.
2. Warnstreifen (Anlass, Weiterbetrieb unzulässig, Mängel nicht erfasst, Fristhinweis) direkt unter dem Kopf, nach Schwere sortiert.
3. **Fristzeile** immer sichtbar. Drei Fälle:
   - Frist freigegeben: vierspaltige Leiste Fällig am (mit Resttagen), Frist, Stufe (mit Text), Quelle mit Fundstelle.
   - Keine Frist, Vorschlag der Regel-Engine ist GBU (kein freigegebener Eintrag, nur Entwurf, kein Intervall): „Frist über GBU festlegen“ mit Grund, volle Breite.
   - Keine Frist, aber freigegebener Katalog- oder Herstellervorschlag: „Frist nicht freigegeben – ohne Freigabe gibt es keinen Fälligkeitstermin.“ darunter „Vorschlag: X Monate laut …“ mit Stufe (mit Text) und Quelle. Kein Fälligkeitsdatum, keine Resttage (§10 E-1).
4. Weitere Angaben (letzte Prüfung mit Herkunft, Herstellerfrist, Prüfer und Qualifikation, GBU-Verweis, Freigabe durch und am) in einer zweispaltigen `dl` darunter.
5. Regel-Engine-Vorschlag und Formulare in Disclosures. Geschlossen zeigt die Disclosure eine Zeile Zusammenfassung („Vorschlag: 12 Monate laut Prüfkatalog, Stufe B“). Ohne freigegebene Frist ist „Frist festlegen“ für Berechtigte offen.
6. Fuß: Aktionen.

### 8.6 `/geraete/neu`
Formular 40 rem, Gruppen: „Gerät“ (Bezeichnung, Kategorie, Bereich), „Kennung“ (Inventarnummer, Seriennummer, Hersteller, Typ, Baujahr, alle „(optional)“ wenn optional), „Prüfarten“. Unter dem Formular ein Hinweis-Kasten: „Fristen werden nach dem Anlegen aus dem Prüfkatalog vorgeschlagen und müssen freigegeben werden.“

### 8.7 `/pruefer` (mobil zuerst)
```
Prüfaufgaben (h1)
bei Muster GmbH
Fällig oder ohne Termin (3)
┌─────────────────────────────────────┐
│ ◔56  Bohrmaschine Hilti TE 30       │
│      INV-00213  Werkstatt           │
│      Ortsveränderl. el. Betriebsm.  │
│      ✕ Überfällig  fällig 15.03.2026│
│ [      Nachweis erfassen       ] 56 │
└─────────────────────────────────────┘
Später (5)  ▸ (Disclosure, zu)
```
Karten untereinander, Abstand 12, kein Wischen. Die ganze Karte ist kein Link, nur der Gerätename und der Button. Gruppe „Später“ ist standardmäßig zugeklappt.

### 8.8 `/nachweise/neu/[id]`
Oben eine Zusammenfassung (Plakette 56, Gerät, Prüfart, fällig am, Frist mit Stufe und Quelle). Darunter das Formular: Prüfdatum, Ergebnis (Radio-Kacheln 56 px mit Symbol: ✓ Bestanden / ! Mit Mängeln / ✕ Nicht bestanden), optional Fristempfehlung des Prüfers, PDF-Ablagefläche. Mobil: feste Speicherleiste unten.
Nach dem Speichern: Erfolgsmeldung mit Bestätigungs-Plakette. Neues Datum nur, wenn der Server es liefert, **nie im Browser berechnen**.

### 8.9 `/maengel`, `/maengel/neu`, `/maengel/[id]`
- Liste wie `/geraete`, aber Erkennungsspalte = Mangel (Beschreibung, gekürzt), zweite Spalte Gerät mit Plakette 40, Spalten Status, Gemeldet am und Frist bis.
- Zählerleiste mit den Mangelstatus statt Fristen.
- Mangelakte: Kopf mit Mangelstatus-Marke, Geräteverweis mit Plakette, Verlauf. Aktionen (Kenntnis nehmen, beheben) als Disclosures mit je einer Primäraktion.
- I3M: Von Mitarbeitern gemeldete Mängel zeigen in der Mangelakte „Gemeldet von {Name}“ wie jeder andere Erfasser. Keine eigene Marke, keine Spalte, kein Filter nach Melder (F-26).

### 8.10 `/admin/bereiche`, `/admin/mitglieder`, `/admin/mitglieder/neu`, `/admin/mitglieder/[id]`
- Untertabs „Mitglieder“ und „Bereiche“ (`VerwaltungNav`) als Unterstrich-Tabs unter dem h1, gleiche Optik wie die Hauptnavigation, nur in steel auf paper.
- Tabellen nach §6.7 ohne Plakettenspalte, mit Status „aktiv/deaktiviert“ als neutrale Marke.
- Deaktivieren nur über einen Bestätigungsdialog (§6.16).

### 8.11 `not-found`
Leerzustand „Seite nicht gefunden.“ mit Link „Zur Geräteliste“ bzw. „Zu den Prüfaufgaben“ je nach Rolle (falls ohne Sitzung: „Zur Anmeldung“). Mitarbeiter: „Zu meinen Geräten“.

### 8.12 `/g/[token]` – öffentliche QR-Seite (I3M, FE-12)
Zweck: Wer den Aufkleber scannt, weiß in 3 Sekunden, ob das Gerät benutzt werden darf, und kann es dem Gerät vor sich eindeutig zuordnen.

```
[Kopfleiste: Glyph Readyloop                    Anmelden]   ← ohne Sitzung (§6.1)
┌──────────────────────────────────────────────┐
│ ✕  Nicht verwenden                  (nutzung)│  Nutzungsband groß (§6.17)
│    Überfällig seit 15.03.2026                │
│    Gerät nicht benutzen. Verantwortl. inform.│
└──────────────────────────────────────────────┘
◔96   Gabelstapler Linde H25              (h1)
      L-001                               (Mono 16)
      Linde · H25                         (text)
      Elbtal Fördertechnik GmbH           (klein)
Aktueller Stand  (fein, unter der Plakette)

[ Aktionen, siehe Tabelle ]                        56 / 48

Prüfungen (h2)
PruefartKurzliste (§6.20), immer ausgeklappt

────────────────────────────────────
Stand: 20.11.2026, 14:32 Uhr (fein, steel)
Diese Seite zeigt den Prüfstatus zum Zeitpunkt des Aufrufs.
```
- **DOM-Reihenfolge = visuelle Reihenfolge:** `main` beginnt mit dem Nutzungsband (`<section aria-label="Nutzung">`, Titel als `<p>` mit `nutzung`-Stil), dann `<header>` mit h1 (Bezeichnung). Screenreader hören zuerst die Antwort. Der Seitentitel (`<title>`) lautet „{Bezeichnung} – {Nutzung kurz}“, z. B. „Gabelstapler Linde H25 – Nicht verwenden“.
- **Kennung** so, dass man das Gerät vor sich wiedererkennt: Bezeichnung, Inventarnummer (auch auf dem Typschild bzw. Aufkleber), Hersteller und Typ. Kein Bereich (F-24).
- **Aktionen** (`TokenAktionen`), direkt unter der Kennung, Halle-Modus (§6.18):

| Fall | Hauptaktion | Weitere | Hinweis |
|---|---|---|---|
| ohne Sitzung, `wechselnd` | – | „Anmelden und übernehmen“ (Sekundär 48), „Anmelden und Mangel melden“ (Sekundär 48) | – |
| ohne Sitzung, sonst | – | „Anmelden und Mangel melden“ (Sekundär 48) | – |
| MA, Kurzansicht vorhanden | wie Karte §6.19 (Übernehmen / Zurückgeben / Mangel melden) | wie §6.19 | wie §6.19 |
| andere Rolle mit `akteUrl` | „Geräteakte öffnen“ (Sekundär 48, Link) | – | – |
| `andereOrganisation` | – | – | Hinweis (i): „Dieses Gerät gehört zu einem anderen Betrieb. Sie sehen die öffentliche Ansicht.“ |

  Ohne Sitzung sind beide Anmelde-Aktionen Sekundär: Die Seite dient zuerst Kontrolleuren und Prüfern, die nur lesen.
  **I3 (US-43, FE-17):** „Anmelden und übernehmen“ erscheint nur, wenn das Gerät übernehmbar ist (`uebernahmeHinweis(...) === null`). Bei „Nicht verwenden“ bleibt nur „Anmelden und Mangel melden“. Kein Zusatztext, das Nutzungsband erklärt es.
- Nach „Gerät übernehmen“ / „Zurückgeben“: Erfolgsmeldung (§6.11) **zwischen Kennung und Aktionen**, `role="status"`, Fokus auf die Meldung; die Aktionen wechseln (Zurückgeben ↔ Übernehmen).
- Prüfungen immer ausgeklappt (Leitsatz 3), weil Kontrolleure hier den Nachweis vor Ort suchen (R-03).
- **Nicht** auf der Seite: Halter, Zuordnung, Melder, Mängelbeschreibungen, PDF-Links, Bereich, Verlauf (F-24). Offene Mängel erscheinen nur als Grund im Nutzungsband („Gefährlicher Mangel offen“).
- Mit Sitzung: normale Kopfleiste (§6.1).

**Ungültiger Aufkleber** (`/g/[token]/not-found.tsx`, HTTP 404): öffentliche Kopfleiste, Leerzustand mit Leer-Plakette 96 und Mitte „!“:
- Titel: „Dieser Aufkleber ist nicht gültig.“
- Satz: „Der Aufkleber wurde ersetzt oder ist nicht mehr lesbar. Benutzen Sie das Gerät erst, wenn der Verantwortliche den Prüfstatus bestätigt hat.“
- Aktion (Sekundär): „Gerät suchen“ → `/meine-geraete/suchen` (führt ohne Sitzung zum Login).
- Keine Unterscheidung zwischen falsch, unbekannt und ersetzt.

### 8.13 `/meine-geraete` (I3M, FE-13)
```
[Kopfleiste: Meine Geräte · Gerät suchen]
Meine Geräte (h1)                                   [Gerät suchen] (Sekundär 48)
bei Elbtal Fördertechnik GmbH

┌ Fehler-Meldung (nur wenn ≥1 nicht verwenden) ─────────────┐
│ ✕ 1 Gerät nicht verwenden. → Stehleiter 6 Stufen (Anker)   │
└────────────────────────────────────────────────────────────┘
Von mir übernommen (2) (h2)
  MeinGeraetKarte L-008 (Nicht verwenden)
  MeinGeraetKarte L-002 (Verwendbar, bald fällig)
Mir zugeordnet (1) (h2)
  MeinGeraetKarte P-008
```
- Abschnittsreihenfolge: „Von mir übernommen“ vor „Mir zugeordnet“, weil übernommene Geräte gerade in der Hand sind und zurückgegeben werden müssen. Innerhalb eines Abschnitts die Sortierung vom Server (Nutzung, dann Fälligkeit).
- Abschnitt ohne Geräte entfällt. Beide leer: Leerzustand (Leer-Plakette 64): „Ihnen sind keine Geräte zugeordnet.“ · „Geräte, die Sie übernehmen oder die Ihnen zugeordnet werden, erscheinen hier.“ · [Gerät suchen] (Primär 56). Darunter Hinweis „Am Handy: QR-Code am Gerät mit der Kamera scannen.“
- Die Sammelmeldung oben nennt bis zu 3 Gerätenamen als Ankerlinks zu den Karten; ab 4: „4 Geräte nicht verwenden.“ ohne Namen.
- Erfolgsmeldungen nach Zurückgeben stehen oben auf der Seite (die Karte verschwindet): „Gerät zurückgegeben: Elektro-Hubwagen.“

### 8.14 `/meine-geraete/suchen` (I3M, FE-13)
```
Meine Geräte / Gerät suchen (Pfad)
Gerät suchen (h1)
Alle Geräte von Elbtal Fördertechnik GmbH.
Gerät, Inventarnummer oder Hersteller
[ hubwagen______________________ ] [Suchen]
Am Handy schneller: QR-Code am Gerät mit der Kamera scannen.
1 Gerät für „hubwagen“ (aria-live)
  MeinGeraetKarte variante="treffer"
```
- Leerer Treffer: Leerzustand „filter“: „Kein Gerät gefunden für „xyz“.“ · „Prüfen Sie die Schreibweise oder suchen Sie nach der Inventarnummer auf dem Aufkleber.“ Keine Aktion.
- Treffer zeigen nie Namen anderer Halter (§6.6).

### 8.15 `/mangel-melden/[geraetId]` (I3M, FE-13)
```
Meine Geräte / Mangel melden (Pfad; bei zurueck=/g/…: Gerät / Mangel melden)
Mangel melden (h1)
◔56  Stehleiter 6 Stufen · L-008       ← Gerätezusammenfassung, Band kompakt darüber
┌ Warnung ! ───────────────────────────────────────────────┐
│ Bei Gefahr: Gerät nicht verwenden und den Verantwortlichen│
│ sofort ansprechen.                                        │
└───────────────────────────────────────────────────────────┘
Wie schwer ist der Mangel? (legend, h3)
 ( ) ⚠ Gefährlich   Gerät darf nicht mehr benutzt werden.   ← Radio-Kachel 64
 ( ) !  Erheblich   Muss bald repariert werden.
 ( ) i  Gering      Kleinigkeit, Gerät funktioniert.
   ↳ nur bei „Gefährlich“ gewählt (CSS :has): Hinweis „Nach dem Melden steht das Gerät
     für alle auf „Nicht verwenden“.“
Was ist kaputt? (Label 16/500)
Zum Beispiel: Holm eingerissen, Kabel beschädigt. (Hilfe)
[ Textfeld, 4 Zeilen ]
[        Mangel melden        ] 56      Abbrechen (still)
```
- Radio-Kacheln: 64 px hoch (zweizeilig), Rahmen steel-400, gewählt: Rahmen 2 px steel + steel-50 + gefüllter Radiokreis. Symbol im Kreis in der Statusfarbe der Bedeutung (gefährlich brick-50/⚠, erheblich ochre-50/!, gering steel-50/i). Keine Vorauswahl: Die Schwere wird bewusst gewählt. Pfeiltasten wechseln die Auswahl (native Radios).
- Labels der Schwere aus `MANGEL_SCHWERE_LABEL`, die Erklärsätze sind UI-Text (FE).
- Kein Terminfeld, kein Prüfart-Feld (F-26). Kein Hinweis auf den automatischen Termin (für Mitarbeiter ohne Belang).
- Mobil: Hauptaktion in der festen Leiste unten (§6.10).
- **Nach dem Speichern** ersetzt eine Erfolgsmeldung das Formular, Fokus darauf: „Mangel gemeldet. Er steht beim Verantwortlichen in der Mängelliste.“ Bei „Gefährlich“ zweiter Satz: „Das Gerät steht jetzt auf „Nicht verwenden“.“ Darunter Primär 56 „Zurück zum Gerät“ (bei `zurueck=/g/…`) bzw. „Zurück zu meinen Geräten“. Das Nutzungsband über der Meldung zeigt den neuen Stand.

### 8.16 Geräteakte: Abschnitt „Nutzung und Aufkleber“ (I3M, FE-14)
Steht in der rechten Spalte (ab `xl`) nach „Betrieb und Standort“, einspaltig darunter nach den Stammdaten. Fehlt für Prüfer (`nutzung === null`). Überschrift h2 „Nutzung und Aufkleber“.

```
Nutzung und Aufkleber (h2)
  Kategorie         Wechselnder Einsatzort
  Genutzt von       Jonas Richter
                    seit 18.11.2026, 07:12 Uhr (Mono)
  [Übernahme beenden] (Sekundär)            ← nur darfZuordnen + offene Übernahme

  Übernahmen der letzten 90 Tage (h3)      ← nur ADM, nur wenn Einträge
  ┌Person────────┬Von────────┬Bis────────┬Ende──────────────────┐
  │ Aylin Demir  │ 01.11.2026 │ 01.11.2026 │ Zurückgegeben         │
  └──────────────┴────────────┴────────────┴───────────────────────┘
  Ältere Einträge werden automatisch ohne Namen gespeichert. (fein)

  Aufkleber (h3)                            ← nur etikett.verwalten
  app.readyloop.de/g/AbC…UvW (Mono, klein)
  [Etikett drucken] (Sekundär, Link /etiketten?geraet=…)
  ▸ Aufkleber erneuern (Disclosure)
     ! Der alte Aufkleber wird sofort ungültig. Drucken Sie danach ein
       neues Etikett und kleben Sie es über den alten.
     [ ] Ich habe verstanden, dass der alte Aufkleber ungültig wird.
     [Aufkleber erneuern] (Gefährlich)
```
- **Personenbezogen:** „Zugeordnet an: {Name}“ bzw. „Niemandem zugeordnet“. Disclosure „Zuordnung ändern“ (geschlossen zeigt den aktuellen Wert) mit Select „Mitarbeiter“ (erste Option „– keine Zuordnung –“), Primär „Zuordnung speichern“. Ohne Optionen: Satz „Noch keine Mitarbeiter eingeladen.“ und, bei Recht, Link „Mitarbeiter einladen“.
- **Wechselnd:** „Genutzt von {Name}, seit …“ bzw. „Frei“. „Übernahme beenden“ ohne Rückfrage (umkehrbar durch erneute Übernahme), Meldung „Übernahme beendet“.
- **Ortsgebunden:** Zeile „Ortsgebundene Geräte werden nicht übernommen oder zugeordnet.“ (`klein`, steel), dann nur der Teil Aufkleber.
- Tabelle Übernahmen nach §6.7 ohne Plakette, Daten in Mono, keine Sortierung, kein Filter, keine Zählung (F-27). Ende-Art aus `UEBERNAHME_ENDE_LABEL`.
- SIF sieht nur den aktuellen Halter, keine Formulare.
- Der Aktenkopf bleibt unverändert; der Halter steht nicht im Kopf (Datensparsamkeit, keine Hervorhebung von Personen).

### 8.17 `/etiketten` (I3M, FE-15)
```
Etiketten drucken (h1)
Aufkleber mit QR-Code und Prüfplakette für Geräte Ihrer Bereiche.
┌ Auswahl ───────────────────────────────────────────────────────┐
│ Bereich [Alle ▾]  Kategorie [Wechselnder Einsatzort ▾]          │
│ [Etiketten anzeigen] (Sekundär)                                 │
└─────────────────────────────────────────────────────────────────┘
4 Etiketten · 1 Bogen A4 (24 je Bogen)            [Drucken] (Primär, Icon Printer)
ⓘ So drucken Sie richtig (Hinweis, §6.11)
  1. Bogen A4 mit 3 × 8 Etiketten à 70 × 37 mm einlegen.
  2. Im Druckdialog: Skalierung 100 % („Tatsächliche Größe“), Ränder „Keine“,
     Kopf- und Fußzeilen aus.
  3. Zuerst auf Normalpapier drucken und gegen den Bogen ans Licht halten.
Vorschau
┌ Bogen 1 (210 × 297 mm, maßstäblich) ─────────────┐
│ [Etikett][Etikett][Etikett]                       │
│ …                                                 │
└───────────────────────────────────────────────────┘
```
- Mit `?geraet=` (aus der Akte): Auswahl ausgeblendet, Pfad „Geräte / {Bezeichnung} / Etikett drucken“, Satz „Etikett für ein Gerät. Restliche Felder des Bogens bleiben leer.“
- **Startfeld (Soll, nur FE):** Select „Erstes freies Feld auf dem Bogen“ (1–24, Default 1), damit angebrochene Bögen nutzbar sind. Leere Felder vorne bleiben leer. Parameter `start` in der URL.
- Bedienteil, Kopfleiste, Demo-Banner, Hinweise: `@media print` ausgeblendet. Gedruckt werden nur die Bögen.
- Leerzustand „filter“: „Keine Geräte für diese Auswahl.“ · „Es werden nur Geräte Ihrer Bereiche gedruckt.“ · [Auswahl zurücksetzen].
- Bei mehr als 120 Geräten (`ETIKETTEN_MAX`): Warnung „Höchstens 120 Etiketten je Druck. Bitte nach Bereich auswählen.“

**Druck-CSS (verbindlich, `src/app/etiketten/druck.css`):**
```css
@page { size: A4 portrait; margin: 0; }
@media print {
  html, body { margin: 0; background: white; }
  .bogen {
    width: 210mm; height: 296mm;          /* 297 − 1 mm Reserve gegen Leerseiten */
    padding-top: 0.5mm;                   /* (297 − 8 × 37) / 2 */
    display: grid;
    grid-template-columns: repeat(3, 70mm);
    grid-template-rows: repeat(8, 37mm);
    break-after: page; overflow: hidden;
  }
  .bogen:last-child { break-after: auto; }
  .etikett { width: 70mm; height: 37mm; padding: 4mm 5mm; box-sizing: border-box;
             overflow: hidden; break-inside: avoid; color: black; }
}
```
- Bögen bildet die Seite selbst (je 24 Etiketten ein `.bogen`), statt sich auf automatische Seitenumbrüche zu verlassen.
- Am Bildschirm hat `.bogen` dieselben mm-Maße, weißen Grund und Rahmen steel-200; der Vorschaucontainer scrollt horizontal, die Seite nicht.

### 8.18 `/admin/erinnerungen` – Übersicht je Bereich (I3, FE-18)
```
Erinnerungen (h1)
[Einstellungen je Bereich | Versandprotokoll | Mail-Vorschau]        (§6.26)
Fristen-Erinnerungen gehen werktags morgens an die Verantwortlichen der Bereiche.
Je Bereich legen Sie Vorlauf, Eskalation und Empfänger fest.          (text, max-w-prose)
! Mailversand ist nicht eingerichtet. …                              (nur Modus „aus“)
┌Bereich─────┬Vorlauf─────────────┬Eskalation (Tage nach Fälligkeit)───────┬Sifa in Kopie┬Stand───────────────────────┐
│ Lager      │ 90 · 60 · 30 Tage  │ Verantwortliche 0 · Sifa 7 · Admin 14   │ ja          │ Standard                    │
│ Produktion │ 60 · 30 · 14 Tage  │ Verantwortliche 0 · Sifa 3 · Admin 10   │ nein        │ Angepasst am 18.11.2026     │
│            │                    │                                         │             │ von {Name}                  │
│ ! Kein aktiver Verantwortlicher – Erinnerungen gehen an die Sifa.  (Warnzeile, volle Breite, ochre-50)        │
└────────────┴────────────────────┴─────────────────────────────────────────┴─────────────┴─────────────────────────────┘
i Prüfungen ohne freigegebene Frist oder ohne bekanntes Prüfdatum lösen keine Fristerinnerung aus.
  Sie stehen weiter in der Geräteliste und in der Wochenübersicht der Prüfer.          (Hinweis)
```
- Tabelle nach §6.7 ohne Plakettenspalte. Der Bereichsname ist der gestreckte Zeilenlink (`aria-label` „Erinnerungen für {Bereich} bearbeiten“), Ziel `/admin/erinnerungen/{bereichId}`.
- Zahlen in `tabular-nums`, „Standard“ / „Angepasst am {Datum} von {Name}“ in `klein` steel (Datum Mono).
- Warnungen aus `warnungen` je Bereich als eigene Zeile direkt unter der Bereichszeile (`<td colspan>`), Stil Warnung §6.11.
- < 640 px: Liste je Bereich (h3 Bereich als Link, darunter drei `dl`-Zeilen Vorlauf, Eskalation, Sifa in Kopie, dann Stand, dann Warnungen).
- Der Hinweis unten ist Pflicht (F-30: nichts wird geschätzt). Er verhindert die falsche Annahme, alles werde erinnert.
- Leerzustand (keine Bereiche): Leer-Plakette 64 · „Noch keine Bereiche angelegt.“ · „Erinnerungen werden je Bereich eingestellt.“ · [Bereiche verwalten] → `/admin/bereiche`.

### 8.19 `/admin/erinnerungen/[bereichId]` – Einstellungen (I3, FE-18)
```
Erinnerungen / Lager (Pfad)
Erinnerungen für Lager (h1)
Standard  bzw.  Angepasst am 18.11.2026 von {Name}            (klein, steel)
[Warnungen]   [Erfolg: Erinnerungen gespeichert]
┌ Vorlauf vor der Fälligkeit ───────────────────── (fieldset, §6.24) ┐
│ [ 90 ] Tage vorher  [ 60 ] Tage vorher  [ 30 ] Tage vorher        │
└────────────────────────────────────────────────────────────────────┘
┌ Eskalation ab Fälligkeit ─────────────────────── (fieldset, §6.24) ┐
│ 1. Verantwortliche → 2. Sifa → 3. Admin/Geschäftsführung           │
└────────────────────────────────────────────────────────────────────┘
┌ Empfänger ────────────────────────────────────── (fieldset, §6.25) ┐
│ Verantwortliche des Bereichs: {Namen} · erhalten Erinnerungen immer│
│ [x] Sifa beim Vorlauf und bei der ersten Eskalationsstufe in Kopie │
│ Sifa:  (•) Alle aktiven (2)  ( ) Auswahl  [ ] … [ ] …              │
│ Admin/Geschäftsführung: (•) Alle aktiven (1)  ( ) Auswahl          │
└────────────────────────────────────────────────────────────────────┘
[Erinnerungen speichern]   Abbrechen
Änderungen gelten ab dem nächsten Erinnerungslauf (werktags morgens).   (fein)
──────────────────────────────────────────────
Auf Standard zurücksetzen (h2)                              ← nur wenn !standard
Vorlauf 90/60/30 Tage, Eskalation 0/7/14 Tage, Sifa in Kopie, alle aktiven Sifa und Admins.
[Auf Standard zurücksetzen] (Sekundär)
```
- Zwei getrennte Formulare: Speichern (`erinnerungEinstellungSpeichern`) und Zurücksetzen (`erinnerungEinstellungZuruecksetzen`). Das zweite steht **unter** dem ersten, getrennt durch eine Linie steel-200 und eigene h2, damit es nicht als Abbrechen missverstanden wird. Keine Rückfrage (§6.16).
- Fehlerübersicht ab 2 Feldfehlern (§6.10). Feldnamen exakt wie im Vertrag.
- Erfolg: Meldung oben, Fokus darauf, Stand-Zeile aktualisiert („Angepasst am …“ bzw. „Standard“).
- „Abbrechen“ führt zur Übersicht.

### 8.20 `/einstellungen/benachrichtigungen` (I3, FE-19)
```
Benachrichtigungen (h1)
bei Elbtal Fördertechnik GmbH
E-Mail-Adresse   name@firma.de (Mono)
                 Adresse ändern: über den Admin.          (klein, steel)
! Mailversand ist nicht eingerichtet. …                   (nur Modus „aus“)
┌ Karte ─────────────────────────────────────────────────────┐
│ Fristen-Erinnerung (h2)                                     │
│ Vorlauf vor Fälligkeiten und Eskalation überfälliger …      │
│ 🔒 Pflicht – kann nicht abbestellt werden    (Lock 16, 500) │
│ Diese Erinnerung gehört zur Fristenüberwachung …  (klein)   │
└─────────────────────────────────────────────────────────────┘
   oder (abbestellbar):
┌ Karte ─────────────────────────────────────────────────────┐
│ Wochenübersicht für Prüfer (h2)                             │
│ Montags eine Übersicht der Ihnen zugewiesenen …             │
│ ✓ Sie erhalten diese Mails.  |  Sie erhalten diese Mails nicht. │
│ [Abbestellen] (Sekundär 48)  |  [Wieder erhalten] (Primär 48)   │
└─────────────────────────────────────────────────────────────┘
Regeln in Ihren Bereichen (h2)                 ← nur wenn bereichsRegeln nicht leer
Tabelle: Bereich | Vorlauf | Eskalation | Sifa in Kopie | Standard/angepasst
Ändern kann der Admin unter „Erinnerungen“.     (klein, steel)
```
- Genau eine Karte (eine Mailart je Rolle, Vertrag). Fläche weiß, Rahmen steel-200, Radius 6, Innenabstand 16.
- Status der abbestellbaren Mail als Textzeile (`text` 500) mit Symbol, **keine** runde Marke und **kein** Schalter (§10 E-9). Der Button ist ein Formular (`benachrichtigungSetzen`), funktioniert ohne JavaScript.
- Nach dem Speichern: Erfolgsmeldung in der Karte über dem Button mit dem Text aus der Action („Abbestellt“ / „Wieder bestellt“), Fokus darauf.
- Bereichsregeln wie die Übersicht §8.18 (gleiche Zellformate), aber nur lesend, ohne Links und ohne Warnungen.
- MA und PRF sehen die Seite am Handy: Buttons 48 px (§6.3), Seite 40 rem.

### 8.21 `/abmelden?t=` – öffentlich (I3, FE-19)
Muster wie die QR-Seite: öffentliche Kopfleiste nur mit Glyph und Wortmarke (§6.1), 40 rem, linksbündig, ein Satz, ein Button.
```
[Kopfleiste: Glyph Readyloop]
Wochenübersicht für Prüfer abbestellen (h1)
Sie erhalten derzeit die Wochenübersicht für Prüfer von Elbtal Fördertechnik GmbH.
[Abbestellen] (Primär 48)
Andere Mails, etwa Hinweise zu Ihren Geräten, sind davon nicht betroffen.  (klein, steel)
```
| Zustand | h1 | Text | Aktion |
|---|---|---|---|
| angemeldet (`abgemeldet = false`) | „{artLabel} abbestellen“ | „Sie erhalten derzeit die {artLabel} von {Betrieb}.“ | Primär „Abbestellen“ (`aktion=abmelden`) |
| abgemeldet | „{artLabel}“ | „Sie haben die {artLabel} von {Betrieb} abbestellt.“ | Primär „Wieder erhalten“ (`aktion=anmelden`) |
| nach Abbestellen | unverändert | Erfolg (§6.11, Fokus): „Sie erhalten die {artLabel} von {Betrieb} nicht mehr.“ + „Das gilt ab dem nächsten Versand.“ | Sekundär „Wieder erhalten“ |
| nach Wieder erhalten | unverändert | Erfolg: „Sie erhalten die {artLabel} von {Betrieb} wieder.“ | Sekundär „Abbestellen“ |
| ungültig (`null`, HTTP 404) | – | Leerzustand mit Leer-Plakette 64 und „!“: „Dieser Link ist nicht gültig.“ · „Der Link ist unvollständig oder veraltet. Nach der Anmeldung ändern Sie Ihre Mails unter „Benachrichtigungen“.“ | Sekundär „Anmelden“ → `/login?next=/einstellungen/benachrichtigungen` |
| Action-Fehler | unverändert | Fehler: Text der Action wörtlich | – |

- Der Seitenaufruf (GET) ändert nichts (F-40). Kein Auto-Submit, kein JavaScript nötig.
- Keine E-Mail-Adresse, kein Name auf der Seite (Token enthält beides nicht).
- `<title>`: „{artLabel} abbestellen – Readyloop“.

### 8.22 `/erinnerungen/protokoll` – Versandprotokoll (I3, FE-20)
```
Versandprotokoll (h1)
[Einstellungen je Bereich | Versandprotokoll | Mail-Vorschau]         (nur ADM)
Letzter Erinnerungslauf: 30.11.2026, fertig um 06:01 Uhr             (klein)
i Nur Vorschau – nichts wird versendet.                               (nur Modus „vorschau“)
┌ Filter (GET) ────────────────────────────────────────────────────────────┐
│ Von [23.10.2026] Bis [22.11.2026] Status [Alle ▾] Art [Alle ▾] Bereich [Alle ▾] [Filter anwenden] │
└──────────────────────────────────────────────────────────────────────────┘
Chips: Status: Probleme ✕   Bereich: Lager ✕          Filter zurücksetzen
37 Mails vom 23.10.2026 bis 22.11.2026 (aria-live)
┌Datum──────┬Art────────────────────┬Empfänger─────────────┬Status──────────────────────────┬Posten┐
│30.11.2026 │ Fristen-Erinnerung     │ {Name}               │ (✓ Zugestellt)                 │    2 │
│           │                        │ Verantwortlicher     │                                │      │
│ ▸ Posten anzeigen (2)                                                              (Zeile 2) │
│23.11.2026 │ Wochenübersicht Prüfer │ {Name} · Prüfer      │ (✕ Nicht zustellbar – E-Mail-Adresse prüfen) │ 4 │
│ ▸ Posten anzeigen (4)                                                                        │
│20.11.2026 │ Hinweis „Nicht verw.“  │ Mitarbeiter/in       │ (✓ Versendet)                  │    – │
│           │                        │ Name nur bei Zustellproblemen (fein)                    │      │
└───────────┴────────────────────────┴──────────────────────┴────────────────────────────────┴──────┘
Seite 1 von 1
```
- **Letzter Lauf:** `fertig` → „Letzter Erinnerungslauf: {Datum}, fertig um {HH:MM} Uhr“ (Text). `fehler` → Fehler-Meldung „Der letzte Erinnerungslauf am {Datum} ist mit Fehler beendet.“ + „Nicht versendete Erinnerungen folgen am nächsten Werktag.“ `laeuft` → Hinweis „Erinnerungslauf läuft seit …“. `null` → „Noch kein Erinnerungslauf.“ Modus `aus` → Warnung §6.11.
- **Filter:** GET-Formular, alle Werte in der URL. Status-Select: „Alle“, „Probleme (Fehler, nicht zustellbar, Spam)“, dann jeder Status mit `VERSAND_STATUS_LABEL`. Art-Select: „Alle“ + `MAIL_ART_LABEL`. Bereich aus `listeBereiche()`. Datumsfelder nativ. Button Sekundär „Filter anwenden“. Chips nur für Abweichungen vom Default (§6.9). **Kein** Filter, keine Sortierung, keine Suche nach Person.
- **Tabelle** ab `lg` nach §6.7 (ohne Plakettenspalte, ohne gestreckten Link). Je Mail ein `<tbody>` mit zwei Zeilen: Datenzeile und, wenn `posten.length > 0`, eine Zeile über alle Spalten mit `<details>`: `summary` „Posten anzeigen ({n})“ (`klein` 500, 40 px hoch, Linkstil steel). Kein Trenner zwischen den beiden Zeilen, Trenner steel-200 nach jedem `<tbody>`.
- **Posten** (aufgeklappt): kleine Tabelle Gerät (Bezeichnung, darunter Inventarnummer Mono) · Bereich · Prüfung · Erinnerung (`stufeLabel`) · Fällig am (Mono) · Rolle (`POSTEN_ROLLE_LABEL`). Eingerückt 16 px, Fläche steel-50.
- **Empfänger:** Name (500) und darunter Rolle (`klein`, steel). `ma_hinweis` ohne Name: „Mitarbeiter/in“ und darunter `fein` „Name nur bei Zustellproblemen sichtbar“; Posten-Spalte „–“, keine Details. `empfaenger = null` bei anderen Arten: „–“ mit `aria-label` „nicht mehr zuzuordnen“.
- **Status:** `VersandStatusBadge` (§6.23), darunter Fehlertext und Versuche.
- **Datum:** `laufDatum` in Mono, darunter `fein` steel „Stand {HH:MM} Uhr“ aus `statusAm`.
- < `lg`: je Mail eine Karte (Datum und Art in der ersten Zeile, Empfänger, Marke, dann `<details>`).
- **Paginierung** nur bei > 1 Seite: „Seite {n} von {m}“, Sekundär-Links „Vorherige Seite“ / „Nächste Seite“ (40 px), Filter bleiben erhalten.
- **Leerzustände:** Filter „Probleme“ ohne Treffer → „Alles erledigt“-Art (moss-Plakette mit ✓): „Keine Zustellprobleme.“ · „Alle Mails im Zeitraum wurden versendet oder zugestellt.“ Sonst: Leer-Plakette 64 · „Keine Mails in diesem Zeitraum.“ · „Erinnerungen gehen werktags morgens raus. Ändern Sie den Zeitraum oder die Filter.“ · [Filter zurücksetzen].

### 8.23 `/admin/mails` – Mail-Vorschau (I3, FE-21)
```
Mail-Vorschau (h1)
[Einstellungen je Bereich | Versandprotokoll | Mail-Vorschau]
i Nur Vorschau – nichts wird versendet. Mails liegen nur im Speicher des Servers …
┌ Erinnerungslauf ──────────────────────────────────────────────┐
│ Datum des Laufs [30.11.2026]                  (nur Demo-Modus) │
│ [✉ Erinnerungslauf jetzt ausführen] (Primär)                   │
│ Erzeugt die Mails dieses Tages. Bereits erinnerte Prüfungen    │
│ werden übersprungen.                               (fein)      │
└────────────────────────────────────────────────────────────────┘
┌ Liste (22 rem) ─────────────┐ ┌ Vorschau ──────────────────────────────────┐
│▌Readyloop · Elbtal …: 2 üb… │ │ An        lager@… (Mono)                   │
│ lager@… · Fristen-Erinn.    │ │ Betreff   Readyloop · Elbtal …: 2 überfäll… │
│ 06:01 Uhr                   │ │ Art       Fristen-Erinnerung               │
│ Readyloop · Elbtal …: 4 Pr… │ │ List-Unsubscribe  keine (Pflichtmail)      │
│ pruefer@… · Wochenübersicht │ │ [HTML | Text]                               │
│ …                           │ │ ┌ iframe 600 px, paper ─────────────────┐  │
└─────────────────────────────┘ │ │                                        │  │
                                │ └────────────────────────────────────────┘  │
                                └─────────────────────────────────────────────┘
```
- Hinweis-Meldung oben ist immer sichtbar (der Modus ist Voraussetzung der Seite).
- Formular: Feld `heute` (Datum) nur bei `datumWaehlbar`, Default `heute`. Erfolg/Fehler am Formular mit dem Text der Action wörtlich.
- **Liste:** je Mail eine Zeile (mindestens 56 px) als Link `?mail={id}`: Betreff (`klein` 500, höchstens 2 Zeilen, Rest „…“), darunter An (Mono, `fein`) · Art, darunter Uhrzeit aus `erstelltAm`. Ausgewählt: steel-50, 3 px Linie steel links, `aria-current="true"`. Ohne Auswahl ist die neueste Mail gewählt.
- **Kopfzeilen** als `dl` (§6.13): An, Betreff, Art, List-Unsubscribe (Text, kein Link; `null` → „keine (Pflichtmail)“).
- **Umschalter HTML/Text:** zwei Unterstrich-Tabs als Links (`&ansicht=text`), ohne JavaScript.
- **HTML:** `<iframe sandbox="" srcDoc=…>` mit `title` „Vorschau: {Betreff}“, Breite 100 % bis max. 640 px, Höhe 75vh, Rahmen steel-200, Radius 6. Die Mail bringt ihren paper-Hintergrund selbst mit.
- **Text:** `<pre>` in Plex Mono 13/18, weiß, Rahmen steel-200, `overflow-x-auto`, Breite 76ch, damit die 72-Zeichen-Zeilen der Mail ohne Umbruch erscheinen.
- < `xl`: Liste über der Vorschau; die Vorschau zeigt die gewählte Mail.
- Leerzustand Liste: Leer-Plakette 64 · „Noch keine Mails in der Vorschau.“ · „Führen Sie einen Erinnerungslauf aus. Die Mails erscheinen dann hier.“ (keine eigene Aktion, das Formular steht darüber).

---

## 9. Vorschlag an Max (braucht deine Freigabe)

1. **Wortmarke:** Glyph-Plakette (ein Segment gefüllt) und „Readyloop“ in Space Grotesk 600, −1 % Laufweite. Kein eigenes Logo-Signet, die Plakette ist das Signet. Schließt den offenen Punkt „Logo/Wortmarke fehlt“.
2. **Kein dunkles Theme im MVP.** Gründe: ältere Büro-Nutzer, gedruckte Nachweise, Prüfer bei Tageslicht, doppelte Kontrastprüfung aller Statustöne. Wieder ansehen, wenn die Mitarbeiter-PWA im Schichtbetrieb läuft.
3. **Jahresring auf `/geraete`:** neue Plakettenvariante, Segmente = Kalendermonate, Füllung nach Anzahl Fälligkeiten (Steel-Stufen, keine Statusfarben). Das ist der einzige neue Einsatz der Plakette mit anderer Bedeutung der Füllung (Anzahl statt Fälligkeitsmonat). Paket P3b läuft nur nach deinem OK.
4. **Ochre-Abstufung ochre-600 (#b07d22)** für Linien und Rahmen. Der Grundwert ochre erreicht auf Weiß nur 2,8:1 und reicht damit nicht für Linien (WCAG 1.4.11). ochre bleibt als Fläche. Das erweitert den Grundwert, ersetzt ihn nicht, nur zur Kenntnis.
5. **Icon-Paket `lucide-react`** für UI-Icons (Suche, Menü, Datei). Bisher gibt es nur Unicode-Zeichen. Statussymbole bleiben eigene Glyphen.
6. **Grundschrift 16 px, Untergrenze 13 px** (heute 14 und 12 px). Kostet etwas Dichte, passt aber zur Zielgruppe.

Alle sechs Punkte am 20.11.2026 von Max freigegeben (siehe `umsetzung.md`).

7. **(neu, I3M, offen) Plakette auf dem Etikett einfarbig, nur mit Termin (§5.5).** Das CD beschreibt die Plakette mit Statusfarbe. Auf dem gedruckten Etikett schlage ich eine schwarze Variante ohne Statusfarbe vor: Ring, gefüllter Fälligkeitsmonat, Jahr. Gründe: (a) Das Etikett hängt ein Jahr oder länger; eine gedruckte Farbe „in Ordnung“ würde an einem später überfälligen Gerät eine falsche Sicherheit geben. (b) Echte Prüfplaketten zeigen den Termin, nicht den Zustand, und genau daran knüpft die Marke an. (c) Schwarzweiß-Laserdrucker sind im Mittelstand Standard. Den Zustand liefert die QR-Seite in Farbe.
   **Ersatzweg ohne Freigabe:** FE-15 druckt die heutige Plakette in Statusfarbe mit `print-color-adjust: exact`, und unter der Plakette steht zusätzlich „Stand {Datum}“. Paket FE-15a entfällt dann.

8. **(neu, I3, nur zur Kenntnis) Text-Plakette in Mails ohne Monatssegmente (§5.3, §10 E-7).** In Mails kann die Plakette nicht als Grafik erscheinen (SVG und Bilder werden in verbreiteten Clients nicht oder nicht zuverlässig angezeigt). Sie erscheint dort als runde Fläche in Statusfarbe mit Monat und Jahr als Text, ohne die 12 Segmente. Form, Farbe, Position und Inhalt (Monat, Jahr) bleiben; nur die Segmente fehlen. Das erweitert die Plakette um eine Ausgabeform und ändert sie nicht. Einwand bitte bis zur Abnahme von BE-24.

---

## 10. Entscheidungen

Rückfragen aus der Umsetzung, entschieden vom Design-Lead. Code-Folgen stehen als Paket P4c in `umsetzung.md`.

### E-1 Fristzeile ohne Frist bei freigegebenem Katalog- oder Herstellervorschlag (20.11.2026)
**Frage (frontend-dev):** „Frist nicht freigegeben“ mit Vorschlag, Stufe und Quelle statt „Frist über GBU festlegen“?
**Entscheidung: Ja, so bleibt es.** Die Regel „Ohne Eintrag: Frist über GBU festlegen“ gilt, wenn es keinen freigegebenen Eintrag gibt. Hier gibt es einen, es fehlt nur die Freigabe im Betrieb. „GBU festlegen“ würde den Nutzer auf einen falschen und aufwendigeren Weg schicken. Der Vorschlag zeigt Stufe und Quelle (§6.5 Pflicht) und **kein** Fälligkeitsdatum, denn ohne Freigabe gibt es keine Frist.
**Befund bei der Prüfung:** Der Status bleibt dabei `gbu`. Plakette („GBU“) und Statusmarke („Frist über GBU festlegen“) im Kopf derselben Karte widersprechen der Fristzeile. Außerdem ist die Disclosure „Frist festlegen“ in diesem Fall zu, obwohl die Freigabe die einzige nötige Handlung ist.
**Folge:**
- In der Prüfartkarte zeigen Plakette und Statusmarke in diesem Fall „Frist nicht freigegeben“ (Plakette gestrichelt, Mitte „§“, §5.2; Marke in GBU-Form, Text „Frist nicht freigegeben“, §6.4). P4c.
- Die Disclosure „Frist festlegen“ ist für Berechtigte offen, solange keine Frist freigegeben ist (§8.5 Regel 5). P4c.
- **Offen für requirements-engineer:** Auf Listenebene (Zählerleiste „Frist über GBU“, Geräteliste, Prüferaufgaben) zählen solche Prüfarten weiter als „Frist über GBU festlegen“. Ob die Domäne den Fall unterscheiden soll (z. B. eigener Status oder angepasstes Label „Frist fehlt“), ist eine fachliche Frage und keine des Designs. Bis dahin bleibt die Liste unverändert.

### E-2 Betriebsstatus „ausgemustert“ (20.11.2026)
**Frage:** „Ausgemustert“ neutral, brick nur für „außer Betrieb“?
**Entscheidung: Ja.** Brick bedeutet „nicht benutzen, Handlung nötig“. Ein außer Betrieb genommenes Gerät steht noch im Betrieb und darf nicht benutzt werden, deshalb gilt brick-50 mit ✕ und Text. Ein ausgemustertes Gerät ist endgültig aus dem Bestand und verlangt keine Handlung, deshalb wird es neutral (steel-50, Rahmen steel-200) mit Text „Ausgemustert“ angezeigt. §6.6 nannte zusätzlich „gesperrt“. Diesen Status gibt es im Datenmodell nicht, der Hinweis ist gestrichen. Die Umsetzung in `BetriebsstatusBadge.tsx` ist korrekt, es ist keine Änderung nötig.

### E-3 Aktueller Monat zweimal im Jahresring (20.11.2026)
**Frage:** Aktueller Monat im Ring zusammengezählt, im Screenreader-Überblick getrennt?
**Entscheidung: Nein.** Ursache ist meine Vorgabe in P3b („heute bis heute + 12 Monate“), die 13 Kalendermonate anschneidet. Ein Segment, das zwei Monate in verschiedenen Jahren zusammenfasst, bricht die Regel „ein Segment ist immer ein Monat“ (§5.4). Außerdem zeigen Ring und Screenreader-Liste dann verschiedene Daten.
**Neu:** Das Fenster umfasst genau 12 Kalendermonate, vom heutigen Tag bis zum Ende des 11. Folgemonats (am 20.11.2026: 20.11.2026 bis 31.10.2027). Ring und Liste zeigen dieselben 12 Einträge. Weil der Ring über den Jahreswechsel umläuft, wird der aktuelle Monat als Fensteranfang mit Rahmen ink 1,5 markiert. Der sichtbare Text nennt den Zeitraum („fällig Nov. 2026 – Okt. 2027“). Überfällige Termine bleiben außerhalb, sie stehen in der Zählerleiste. P4c.

### E-4 Volle brick-Fläche für „Nicht verwenden“ (20.11.2026, I3M)
**Frage (aus der Gestaltung):** Reicht für Mitarbeiter die bekannte Statusmarke (brick-50, ink-Text)?
**Entscheidung: Nein, eigenes Nutzungsband mit voller brick-Fläche und weißem Text (§6.17).** In der Halle bei schlechtem Licht und für Laien muss „Nicht verwenden“ das stärkste Signal der ganzen App sein. Weiß auf brick erreicht 6,0:1, bei 24 px fett deutlich über AA. Die Ausnahme gilt nur für diesen einen Zustand, damit sie ihre Wirkung behält (§2.4). Symbol ✕ und Text tragen die Aussage auch ohne Farbe.

### E-5 „Aufkleber erneuern“ ohne Dialog (20.11.2026, I3M)
**Frage:** Backlog FE-14 nennt einen Bestätigungsdialog (§6.16), das Schema verlangt zusätzlich die Checkbox `bestaetigung`.
**Entscheidung: Disclosure mit Warnung, Pflicht-Checkbox und gefährlichem Button, kein `<dialog>`.** Die Checkbox ist die Bestätigung. Ein Dialog davor wäre eine doppelte Rückfrage, und die Disclosure funktioniert ohne JavaScript. Der Button heißt „Aufkleber erneuern“ (gefährlich), die Warnung steht vor der Checkbox.

### E-6 Keine Rückfrage bei Übernehmen und Zurückgeben (20.11.2026, I3M)
**Entscheidung:** Ein Tipp genügt (§6.18). Beide Aktionen sind umkehrbar, und Rückfragen kosten mit Handschuhen Zeit und führen zu Fehltipps. Der Fall „wird von anderer Person genutzt“ steht **vor** dem Button als Hinweis, nicht danach in einem Dialog. Die Regel „Übernahme nie durch den Scan allein“ (F-23) bleibt gewahrt, weil der Tipp ausdrücklich ist.

### E-7 Prüfplakette in Mails als Text-Plakette, nicht als SVG (23.11.2026, I3)
**Frage (Auftrag D-I3a):** SVG, Inline-SVG oder Text?
**Entscheidung: Text-Plakette** (runde HTML-Fläche, Monat und Jahr als Text, §5.3). SVG als Bild wird von Gmail am Desktop gerastert und in den Gmail-Apps für Google-Konten nicht angezeigt; Inline-SVG ist nur bei etwa 40 % der Clients belegt und seit 2020 nicht neu getestet; Bilder werden außerdem häufig geblockt. Im Classic Outlook wird die Fläche eckig; das wird hingenommen, weil Text und Statuszeile die Aussage tragen und VML je Posten das Größenbudget sprengen würde. Details und Quellen: `mail-vorlagen.md` M-1, M-2, M-5.

### E-8 Ein Navigationspunkt „Erinnerungen“ statt drei (23.11.2026, I3)
**Frage:** Backlog FE-18 sieht „Erinnerungen“, „Versandprotokoll“ und „Mail-Vorschau“ als eigene Hauptpunkte vor.
**Entscheidung: ein Hauptpunkt, Unterseiten als Tabs (§6.1, §6.26).** Der Admin hätte sonst sieben Hauptpunkte (Geräte, Mängel, Etiketten, drei Erinnerungsseiten, Verwaltung). Am Handy liegt die Navigation in einer scrollbaren Zeile, dort wären die hinteren Punkte unsichtbar. Alle drei Seiten gehören zu einer Aufgabe. Die Sifa landet direkt im Protokoll, sie hat nur diesen einen Tab. `AppHeader` braucht dadurch keinen `mailModus()`.

### E-9 Abbestellen als Button, nicht als Schalter (23.11.2026, I3)
**Entscheidung:** Ein Schalter (Toggle) suggeriert sofortige Wirkung ohne Absenden und braucht JavaScript. Ein Formular-Button mit Zustandszeile darüber funktioniert ohne JavaScript, ist mit 48 px am Handy treffsicher und hat eine eindeutige Beschriftung („Abbestellen“ / „Wieder erhalten“). Pflichtmails bekommen gar kein Bedienelement, nur die Begründung mit Schloss-Symbol.

### E-10 Postenliste im Protokoll als zweite Tabellenzeile (23.11.2026, I3)
**Entscheidung:** Ein `<details>` in der letzten Spalte würde die Postenliste in eine schmale Zelle zwingen. Deshalb hat jede Mail ein eigenes `<tbody>` mit einer zweiten Zeile über alle Spalten, die nur die Disclosure trägt. Das bleibt semantisch eine Tabelle, funktioniert ohne JavaScript, und die Posten bekommen die volle Breite.

---

## 11. Recherche I3M (Kurzfassung, 20.11.2026)

| Muster | Quelle | Übernommen | Nicht übernommen |
|---|---|---|---|
| Bestätigungsseite nach dem Scan zeigt Gerät, Halter und Status auf einen Blick, große Buttons „Check out/Check in“, Hauptbutton immer an derselben Stelle, Ziel „unter 15 Sekunden mit Handschuhen und schlechtem Licht“, manueller Suchweg bei beschädigtem Etikett | https://appmaster.io/blog/equipment-checkout-mobile-scanning-design | Nutzung und Kennung zuerst, feste Position der Hauptaktion, 56-px-Buttons, Suche als Ersatzweg, Token als Text auf dem Etikett | Eigene Kamera-Scanfunktion in der App (P-09: Kamera-App des Handys), Ton/Vibration, Halter mit Namen (F-27) |
| Scan mit der Kamera-App öffnet die Geräteseite, ohne Anmeldung zuerst Login, danach ausdrücklicher Klick auf „Check Out/Check In“ | https://help.fleetio.com/en_US/check-outin-tools-with-qr-codes | Login-Rücksprung, Übernahme nur per Klick | Benachrichtigungen/„Watcher“ bei Übernahme (keine Leistungs- oder Verhaltensdaten, R-45) |
| Bogenetiketten per CSS-Grid mit Spalten = Etikettbreite, Abstände aus Teilung minus Größe, Bildschirm-Layout nur in `@media screen` | https://snovasys.assetmanagement.knack-poc.timechamp.io/css/labels.css | Grid in mm, getrennte Bildschirm-/Druckregeln, je Bogen ein Container | PDF-Erzeugung in JS (F-25: kein serverseitiges PDF in I3M, Browserdruck) |
| `@page { size: A4 }` = 210 × 297 mm; Baseline seit Dezember 2024, Druckdialog kann Papiergröße übersteuern | https://developer.mozilla.org/docs/Web/CSS/@page/size, https://bugzilla.mozilla.org/show_bug.cgi?id=851937 | `@page` mit `size` und `margin: 0`, Drucktipps im Bedienteil (100 %, Ränder keine), Testdruck auf Normalpapier | – |
| QR: Modul mindestens 0,25 mm, Ruhezone 4 Module, Verhältnis Scanabstand zu Größe etwa 10 : 1, hoher Kontrast schwarz auf weiß | https://scanova.io/blog/minimum-qr-code-size/ | QR 21 mm inkl. Ruhezone (≈ 0,5 mm Modul, Scan aus etwa 20 cm), nur schwarz auf weiß | Farbige oder gestaltete QR-Codes, Logo im QR |
| Etikettenformat 70 × 37 mm, 24 je A4-Bogen (z. B. Avery Zweckform 3474, Herma 4464) | https://www.inkolor.ch/en/products/inkolor-etiketten-70-37mm | Raster 3 × 8, Sicherheitsrand innen | Herstellerspezifische Vorlagen |

---

## 12. E-Mails (I3, Kurzfassung)

Verbindliche Einzelheiten mit Gerüst, Bausteinen, Texten und Inline-Werten: **`mail-vorlagen.md`**. Hier nur die Regeln, die für alle Mails von Readyloop gelten, auch für spätere Mailarten.

1. **Aufbau:** Kopf (steel, Wortmarke als Text, Betrieb, Art und Datum) → Anrede „Guten Tag,“ ohne Namen → ein Satz Einleitung → Zusammenfassung (Anzahl je Dringlichkeit, farbige Linie links und Text) → **ein** Hauptbutton → Gruppen nach Dringlichkeit → Fuß mit Grund des Empfangs, Pflicht oder Abmeldelink und Stand.
2. **Technik:** Tabellenlayout, nur Inline-Styles (Ausnahmen: MSO-Block und Mono-Klasse im Kopf), max. 600 px, einspaltig, keine Media Queries, keine Bilder, kein SVG, keine Webfonts, keine externen Ressourcen, HTML minifiziert, ≤ 95 KB bei 100 Posten.
3. **Schrift:** Systemschriften (`-apple-system, Segoe UI, Roboto, Helvetica, Arial`), Fließtext 16/24, Posten 14/20, Untergrenze 13 px.
4. **Plakette:** Text-Plakette 44 px links in jeder Postenzeile (§5.3). Nicht in der MA-Mail.
5. **Status:** immer Symbol und Text (`STATUS_LABEL`), Farbe nur zusätzlich. Gruppen: Linie links in Statusfarbe (ochre-600, nie ochre).
6. **Frist:** nie ohne Quelle und Stufe; ohne freigegebene Frist „Frist über GBU festlegen“.
7. **Keine Personennamen**, auch nicht in Betreff oder Vorschauzeile.
8. **MA-Mail:** Nutzungsband als volle brick-Fläche wie §6.17, Schrift 16 px, keine Fristwerte.
9. **Dunkler Modus:** keine eigenen Regeln; `color-scheme: light`; die Farben bleiben bei Invertierung lesbar, weil Text und Symbol die Aussage tragen.
10. **Textteil:** gleicher Inhalt, 72 Zeichen je Zeile, Text-Plakette als `[03/2027]`.
11. **Betreff:** „Readyloop · {Betrieb}: {Zählung}“, Zählung nach Dringlichkeit; „Eskalation – “ vorn, wenn die Mail eine Eskalation an den Empfänger enthält.
12. **Hex-Werte:** nur die Werte aus §2.2, nur in `src/server/mail/vorlagen.ts` (§2.4).

---

## 13. Recherche I3 (Kurzfassung, 23.11.2026)

| Thema | Quelle | Befund | Folge für Readyloop |
|---|---|---|---|
| SVG als Bild in Mails | https://caniemail.com/features/image-svg | ≈ 98 % Unterstützung laut Tabelle, aber Gmail Desktop rastert zu PNG, Gmail-Apps zeigen SVG nur für Nicht-Google-Konten; Stand 16.09.2026 | Kein SVG; Text-Plakette (E-7) |
| Inline-`<svg>` in Mails | https://www.caniemail.com/features/html-svg/ | ≈ 40 %, zuletzt 2020 getestet, Seite widersprüchlich | Kein Inline-SVG |
| Gmail kürzt große Mails | https://www.emailonacid.com/blog/article/email-development/gmail-email-clipping/ | Ab etwa 102 KB HTML „[Nachricht gekürzt]“, Abmeldelink kann verschwinden; Empfehlung < 80 KB, minifizieren | Budget ≤ 95 KB bei 100 Posten, Zusammenfassung und Button oben, Textlink statt Button je Posten |
| Dunkler Modus in Mail-Clients | https://www.litmus.com/blog/the-ultimate-guide-to-dark-mode-for-email-marketers | Drei Verhalten: keine Änderung (Apple Mail, Gmail Desktop), teilweise (Outlook.com, Gmail Android), vollständig (Gmail iOS, Outlook Windows) | Keine eigenen Dunkel-Regeln; Status über Text und Symbol |
| Classic vs. neues Outlook | https://reallygoodemails.com/school/blog/classic-vs-new-outlook-rendering-changes | Classic (Word) ohne `border-radius`, Div-Breiten, Webfont-Fallback; zweigleisig bis mindestens 2027 | Tabellen, MSO-Schriftblock, Ghost-Table, keine VML |
| Buttons im Classic Outlook | https://www.nobledesktop.com/learn/html-email/bulletproof-buttons-in-outlook | Rahmen-Technik voll klickbar, VML nur für Rundungen | Rahmen-Technik, ohne VML |
| Vorschauzeile | https://docs.customer.io/messaging/channels/email/headers/custom-preheader-text/ | Clients zeigen bis etwa 140 Zeichen, oft weniger; Füllzeichen verhindern, dass Fließtext nachrutscht | ≤ 110 Zeichen, Wichtigstes vorn, Füllzeichen |
| Digest-Muster | https://knock.app/template-library/workflows/alert-digest | Zählung in den Betreff, Direktlink je Posten, kein Digest ohne Inhalt, Versand zu Beginn des Arbeitstags | Übernommen (F-36 morgens, F-38) |

**Nicht übernommen:** Tracking-Pixel und Klick-Tracking (F-37 aus), Bilder- oder Logo-Header, farbige Vollflächen für Status (außer MA-Band), Kartenraster mit mehreren Spalten, Emojis als Statussymbole.

# Readyloop – Designsystem (Stand 20.11.2026)

Erweitert `corporate-design.md` und ersetzt es nicht. Grundwerte (Farben, Schriften, Plakette) bleiben, hier kommen Abstufungen, Skalen und Regeln dazu. Änderungen an Grundwerten stehen nur in §9 „Vorschlag an Max“. Entscheidungen zu Rückfragen aus der Umsetzung stehen in §10.
Recherche dazu: `recherche-business-apps.md`. Umsetzung: `umsetzung.md`.

---

## 1. Designrichtung in einem Absatz

**„Prüfprotokoll“:** Readyloop sieht aus wie ein sauber geführtes Prüfbuch und nicht wie ein Startup-Dashboard. Ruhige Flächen in Papier und Weiß, Steel als Grundton, Statusfarben nur dort, wo ein Status steht. Daten sind in Tabellen und Definitionslisten gesetzt und haben feste Spalten für Datum, Inventarnummer und Fundstelle. Der Mut steckt an **einer** Stelle: in der **Prüfplakette**. Sie ist Markenzeichen, Statusanzeige, Zähler, Leerzustand und Ladebild in einem, und alles um sie herum bleibt zurückhaltend.

Leitsätze:
1. **Die Plakette sagt es zuerst, der Text sagt es genau.** Jeder Status erscheint als Plakette oder Symbol und zusätzlich als Text.
2. **Struktur spürbar, nicht sichtbar.** Trennlinien und Flächen nur dort, wo sie Gruppen trennen. Keine Kartenreihen aus gleichen Kästen.
3. **Quelle immer sichtbar.** Frist, Stufe und Fundstelle werden nie in Aufklappern versteckt.
4. **Lesbar für erfahrene Augen.** Fließtext 16 px, nichts Wichtiges unter 13 px, Kontrast mindestens AA.
5. **Eine Hauptaktion je Bereich.** Wörtlich benannt: „Nachweis speichern“, nicht „Absenden“.

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
| `brick` | #a6452f | Status überfällig, Fehlerrahmen |
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
- Tönungen als feste Tokens (-50), nicht über `color-mix` in Komponenten verstreut. `color-mix` ist nur in der Plakette erlaubt.
- Kein Hex außerhalb `globals.css` und `Pruefplakette.tsx`.

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

### 3.2 Skala (Grundgröße 16 px, Verhältnis ≈1,25)
| Stufe | Größe / Zeilenhöhe | Schrift, Gewicht | Einsatz |
|---|---|---|---|
| `anzeige` | 36/40 | Space Grotesk 600, −0,02em | nur Login |
| `h1` | 28/34 | Space Grotesk 600, −0,015em | Seitentitel |
| `h2` | 20/28 | Space Grotesk 600, −0,01em | Abschnitte |
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

---

## 4. Raum, Form, Tiefe, Bewegung

### 4.1 Abstände (4-px-Raster, Tailwind-Standard)
Erlaubte Schritte: 1 (4), 2 (8), 3 (12), 4 (16), 6 (24), 8 (32), 12 (48).
- Seitenrand: 16 px mobil, 24 px ab `md`, 32 px ab `xl`.
- Abstand zwischen Abschnitten: 32 px. Innerhalb eines Abschnitts: 12 px.
- Innenabstand Fläche: 16 px. Tabellenzelle: 12 px horizontal.

### 4.2 Radius (Hierarchie statt Einheitsradius)
| Token | Wert | Für |
|---|---|---|
| `--radius-feld` | 4 px | Eingabefelder, Buttons, Filter-Chips, Stufe-Marke |
| `--radius-flaeche` | 6 px | Tabellencontainer, Formularflächen, Meldungen |
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
| **Zeile** | 40 | Geräteliste, Prüfartkarte, Mängelliste (Gerätespalte) | Status + Monat/Jahr |
| **Karte mobil** | 56 | Prüferaufgaben | wie Zeile |
| **Akte** | 96 | Kopf der Geräteakte | wie Zeile, darunter Fälligkeitsdatum als Text |
| **Leer** | 64 / 96 | Leerzustände | Ring `steel-400` gestrichelt, keine Füllung, Mitte „–“ |
| **Live** | 160 | Login | Steel-Ring, Segmente bis zum aktuellen Monat in moss gefüllt, Mitte aktuelles Jahr; einmalige Füllanimation |
| **Jahresring** (§9.3, §10 E-3) | 112 | Kopf `/geraete` | 12 Segmente = die 12 Kalendermonate ab dem aktuellen Monat (heute bis Ende des 11. Folgemonats), jedes Segment genau ein Monat. Füllstärke in Steel-Stufen nach Anzahl Fälligkeiten (0 / 1–2 / 3–5 / ≥6), aktueller Monat mit Rahmen ink 1,5 markiert (Fensteranfang), Mitte = Summe, Text daneben mit Zeitraum („fällig Nov. 2026 – Okt. 2027“); gleichwertige Liste mit denselben 12 Monaten für Screenreader |
| **Bestätigung** | 24 | Erfolgsmeldung nach „Nachweis speichern“ | Plakette mit neuem Monat/Jahr in moss |

### 5.4 Do / Don't
- **Do:** Immer `role="img"` und eine sprechende `aria-label` (wie heute). Daneben steht der Status als Text.
- **Do:** Die Plakette steht immer links vom Objekt, das sie beschreibt.
- **Don't:** Segmente nie als Prozent- oder Fortschrittsanzeige zweckentfremden. Ein Segment ist immer **ein** Monat, auch im Jahresring (keine zwei Monate in einem Segment).
- **Don't:** Keine Plakette als reines Schmuckbild ohne Datenbezug. Ausnahmen: Glyph in der Wortmarke und Live-Plakette auf dem Login.
- **Don't:** Plaketten nicht in Statusfarbe hinterlegen oder mit Schatten versehen.

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

### 6.2 Seitenkopf
Pfad (Breadcrumb, `klein`, steel) → h1 → optional eine Zeile Kontext → Hauptaktion rechtsbündig (mobil darunter, volle Breite).
Der Pfad ersetzt die heutigen „← Geräteliste“-Links.

### 6.3 Buttons
| Art | Aussehen | Einsatz |
|---|---|---|
| Primär | steel, Text weiß, Hover steel-800 | genau eine je Bereich |
| Sekundär | weiß, Rahmen steel-400, Hover steel-50 | weitere Aktionen |
| Still | Linkstil steel, unterstrichen | „Abbrechen“, „Filter zurücksetzen“ |
| Gefährlich | brick, Text weiß, Hover brick-800 | nur im Bestätigungsschritt (Mitglied deaktivieren, Anlass aufheben) |

Höhe 40 px Desktop, 48 px in Prüferansichten (Hauptaktion dort 56 px).
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

### 6.6 Weitere Marken
- Betriebsstatus: neutrale Marke (steel-50, Rahmen steel-200). Nur „außer Betrieb“ bekommt brick-50, Rahmen brick und Symbol ✕. „Ausgemustert“ bleibt neutral (§10 E-2). Einen Status „gesperrt“ gibt es im Datenmodell nicht.
- Mangelstatus: offen = brick-50 mit ⚠, in Bearbeitung = ochre-50 mit !, behoben = moss-50 mit ✓. Alle teilen die Form der Statusmarke.
- Rolle (Verwaltung): Text in `klein`, keine Marke.

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

### 6.12 Leerzustände
Aufbau: Leer-Plakette (64), Titel (h3), ein Satz, eine Aktion. Linksbündig in der Fläche, die sonst die Tabelle einnimmt.
| Art | Beispiel `/geraete` |
|---|---|
| Noch keine Daten | „Noch keine Geräte erfasst.“ · „Legen Sie das erste Arbeitsmittel an. Fristen schlägt Readyloop aus dem Prüfkatalog vor.“ · [Gerät anlegen] (nur mit Recht, sonst Satz „Geräte legt der Verantwortliche des Bereichs an.“) |
| Filter ohne Treffer | „Keine Geräte für diese Filter.“ · aktive Chips anzeigen · [Filter zurücksetzen] |
| Alles erledigt (Prüfer, Mängel) | Plakette in moss mit ✓ statt Leer-Plakette: „Keine offenen Prüfungen.“ · „Neue Aufgaben erscheinen hier, sobald ein Betrieb Sie zuweist.“ |
| Kein Zugriff / Fehler | Leer-Plakette mit „!“ · Ursache und Weg: „Ihr Konto ist keinem Betrieb zugeordnet. Bitten Sie den Admin um eine Einladung.“ |

### 6.13 Definitionslisten (Stammdaten)
Zweispaltig `dt` (`klein`, steel) und `dd` (`text`). Leerwert „–“ mit `aria-label="keine Angabe"`. Werte wie Inventarnummer, Seriennummer und Baujahr in Mono.

### 6.14 Verlauf
Senkrechte Linie steel-200, je Eintrag ein 8-px-Punkt (Statusfarbe, wenn das Ereignis einen Status hat, sonst steel-400). Links das Datum (Mono, `klein`), rechts Ereignis und Person. Neueste oben. Ab 10 Einträgen „Ältere anzeigen“.

### 6.15 Icons
Status- und Meldungssymbole (✓ ! ✕ ? § ⚠ i) bleiben als eigene Glyphen im Symbolkreis. Für UI-Icons (Suche, Menü, Datei, Herunterladen) wird `lucide-react` empfohlen (Vorschlag §9.5), 16 px, Strich 1,75, immer mit Text.

### 6.16 Dialoge
Natives `<dialog>`, Radius 6, `--shadow-pop`, Breite max. 28 rem. Nur für Bestätigungen gefährlicher Aktionen. Titel als Frage („Mitglied deaktivieren?“), Buttons „Deaktivieren“ (gefährlich) und „Abbrechen“.

---

## 7. Layout-Raster

| Seitentyp | Breite | Raster |
|---|---|---|
| Listen (`/geraete`, `/maengel`, Verwaltung) | max. 72 rem | einspaltig |
| Geräteakte, Mangelakte | max. 80 rem | ab `xl`: Inhalt `1fr` und rechte Spalte 20 rem |
| Formulare, Prüfer, Login | max. 40 rem | einspaltig |

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
│ │ Fällig am │ Frist │ Stufe │ Quelle       ││ │ Anlassprüfungen      │
│ │ 15.03.2026│ 12 Mo │ [B]   │ DGUV V3 …    ││ └──────────────────────┘
│ │ ▸ Frist festlegen   ▸ Prüfer zuweisen    ││
│ │ [Nachweis erfassen] [Mangel erfassen]    ││
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

### 8.10 `/admin/bereiche`, `/admin/mitglieder`, `/admin/mitglieder/neu`, `/admin/mitglieder/[id]`
- Untertabs „Mitglieder“ und „Bereiche“ (`VerwaltungNav`) als Unterstrich-Tabs unter dem h1, gleiche Optik wie die Hauptnavigation, nur in steel auf paper.
- Tabellen nach §6.7 ohne Plakettenspalte, mit Status „aktiv/deaktiviert“ als neutrale Marke.
- Deaktivieren nur über einen Bestätigungsdialog (§6.16).

### 8.11 `not-found`
Leerzustand „Seite nicht gefunden.“ mit Link „Zur Geräteliste“ bzw. „Zu den Prüfaufgaben“ je nach Rolle (falls ohne Sitzung: „Zur Anmeldung“).

---

## 9. Vorschlag an Max (braucht deine Freigabe)

1. **Wortmarke:** Glyph-Plakette (ein Segment gefüllt) und „Readyloop“ in Space Grotesk 600, −1 % Laufweite. Kein eigenes Logo-Signet, die Plakette ist das Signet. Schließt den offenen Punkt „Logo/Wortmarke fehlt“.
2. **Kein dunkles Theme im MVP.** Gründe: ältere Büro-Nutzer, gedruckte Nachweise, Prüfer bei Tageslicht, doppelte Kontrastprüfung aller Statustöne. Wieder ansehen, wenn die Mitarbeiter-PWA im Schichtbetrieb läuft.
3. **Jahresring auf `/geraete`:** neue Plakettenvariante, Segmente = Kalendermonate, Füllung nach Anzahl Fälligkeiten (Steel-Stufen, keine Statusfarben). Das ist der einzige neue Einsatz der Plakette mit anderer Bedeutung der Füllung (Anzahl statt Fälligkeitsmonat). Paket P3b läuft nur nach deinem OK.
4. **Ochre-Abstufung ochre-600 (#b07d22)** für Linien und Rahmen. Der Grundwert ochre erreicht auf Weiß nur 2,8:1 und reicht damit nicht für Linien (WCAG 1.4.11). ochre bleibt als Fläche. Das erweitert den Grundwert, ersetzt ihn nicht, nur zur Kenntnis.
5. **Icon-Paket `lucide-react`** für UI-Icons (Suche, Menü, Datei). Bisher gibt es nur Unicode-Zeichen. Statussymbole bleiben eigene Glyphen.
6. **Grundschrift 16 px, Untergrenze 13 px** (heute 14 und 12 px). Kostet etwas Dichte, passt aber zur Zielgruppe.

Alle sechs Punkte am 20.11.2026 von Max freigegeben (siehe `umsetzung.md`).

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

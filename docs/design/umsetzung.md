# Umsetzung des Designsystems – Pakete für frontend-dev (Stand 23.11.2026, ergänzt um I3M und I3)

Grundlage: `designsystem.md` (Paragrafen in Klammern), `skills-empfehlung.md`.
Jedes Paket ist für **einen** Lauf geschnitten. Reihenfolge: P1 → P2 → P3a → (P3b) → P4a → P4b → P4c → P5a → P5b → P5c → P6 → P7a/P7b/P7c.
P7a, P7b und P7c haben keine gemeinsamen Dateien und dürfen parallel laufen. Alle anderen Pakete laufen nacheinander.
Pakete für I3M (Mitarbeiter) stehen im Abschnitt „I3M“, Pakete für I3 (E-Mail-Erinnerungen) im Abschnitt „I3“ am Ende.

## 0. Gilt für jedes Paket (Definition of Done)
1. Skill `frontend-design` geladen. Vor dem Bau die genannten Abschnitte im Designsystem lesen und in 3–5 Zeilen planen, nach dem Bau gegen §1 (Leitsätze) prüfen.
2. `npm run typecheck`, `lint`, `test` und `build` grün (test-runner).
3. **Keine** Änderungen an `src/domain/`, `src/server/`, `src/middleware.ts`. Rechteprüfungen (`can(...)`) bleiben unverändert. Was Backend braucht, steht unter „BE-Bedarf“ und geht an backend-dev.
4. Kein Hex-Wert außerhalb `globals.css`, `Pruefplakette.tsx` und `plakette-geometrie.ts`. Keine Ad-hoc-Tönungen (`bg-brick/10` usw.), sondern Tokens (-50).
5. Jeder Status mit Symbol und Text. Jede angezeigte Frist mit Stufe und Quelle.
6. Tastatur: Alles erreichbar, Fokus sichtbar (2 px steel, in der Kopfleiste weiß).
7. Bei 320 px Breite kein seitenweites horizontales Scrollen.
8. Kein Text unter 13 px, keine Versalien-Labels, Buttons als Verb plus Objekt.
9. `prefers-reduced-motion` respektiert.
10. Commit-Nachricht nennt das Paket und die umgesetzten Designsystem-Abschnitte.

---

## P1 Tokens und Schriften
**Dateien:** `package.json` (+ Lockfile), `src/app/layout.tsx`, `src/app/globals.css`, `src/components/Pruefplakette.tsx`, neu `src/components/plakette-geometrie.ts`, `src/components/status.ts`, `src/components/StatusAmpel.tsx`, `src/components/StufeBadge.tsx`
**Inhalt:**
- Fontsource-Pakete installieren und importieren (skills-empfehlung §3), Font-Stacks anpassen.
- Alle Tokens aus §2.2 in `@theme`. `steel-hell` bleibt. `--text-xs` auf 13 px. Radius-, Schatten- und Bewegungs-Tokens aus §4.
- `.feld`-Rahmen auf `steel-400`, Fehler `brick` 2 px. Buttonklassen nach §6.3, inklusive `.btn-gefaehrlich`.
- Globale Regel für `prefers-reduced-motion`.
- `status.ts`: neue Abbildung `STATUS_RAND` (bald fällig → ochre-600, sonst wie `STATUS_FARBE`) und `STATUS_FLAECHE` (-50-Tokens).
- Geometrie (`punkt`, `segment`, Konstanten) aus `Pruefplakette.tsx` in `plakette-geometrie.ts` auslagern.
- Plakette: Mittentext in `font-display` 600, Ring und Rahmen über `STATUS_RAND`.
- `StatusAmpel` und `StufeBadge` nach §6.4/§6.5.

**Abnahme:**
- In den DevTools sind „Space Grotesk Variable“, „IBM Plex Sans“ und „IBM Plex Mono“ als geladene Schriften sichtbar. Der Netzwerk-Tab zeigt keine Anfrage an fremde Domains.
- `npm run build` läuft ohne Netz (nach `npm ci`). `.next/static/media` enthält woff2-Dateien.
- Eingabefelder haben sichtbar dunklere Rahmen (steel-400).
- Plakette „bald fällig“ zeigt einen Ring in ochre-600. Plakette „GBU“ ist gestrichelt (unverändert).
- Die bestehenden Tests sind grün, die Optik aller Seiten ist sonst unverändert.

## P2 Shell und Navigation
**Dateien:** `src/components/AppHeader.tsx`, neu `src/components/PlaketteGlyph.tsx` (exportiert `PlaketteGlyph` und `PlaketteLeer`), neu `src/components/Seitenkopf.tsx`, `src/components/DemoBanner.tsx`, `src/components/VerwaltungNav.tsx`, neu `src/app/icon.svg`, `src/app/favicon.ico` (entfernen), `src/app/layout.tsx` (`themeColor` bleibt steel)
**Inhalt:** Kopfleiste nach §6.1 mit Wortmarke (Glyph + „Readyloop“), Menü als `<details>` (Rolle, Betrieb wechseln, Abmelden über das bestehende Formular `abmelden`). `Seitenkopf` mit Props `pfad`, `titel`, `kontext?`, `aktion?` (§6.2). `PlaketteLeer` nach §5.3 (gestrichelter Ring, steel-400, Mitte „–“ oder übergebenes Zeichen). Favicon als SVG-Glyph. Demo-Banner und Unter-Tabs der Verwaltung nach §6.1/§8.10.
**Abnahme:**
- Kopfleiste 56 px in steel. Der aktive Punkt hat Unterstrich und `aria-current="page"`.
- Das Menü öffnet und schließt per Tastatur (Enter/Leertaste). „Abmelden“ funktioniert auch ohne JavaScript.
- „Betrieb wechseln“ erscheint nur bei mehr als einem Betrieb.
- Unter 640 px liegt die Navigation in der zweiten Zeile, nichts wird abgeschnitten.
- Der Browser-Tab zeigt die Glyph-Plakette.
- Die Navigation zeigt je Rolle dieselben Punkte wie vorher (Demo-Rollen durchklicken).

## P3a Geräteliste `/geraete`
**Dateien:** `src/app/geraete/page.tsx`, `src/components/StatusZaehler.tsx`, `src/components/GeraeteFilter.tsx`, `src/components/GeraeteTabelle.tsx`, neu `src/components/Leerzustand.tsx`, neu `src/components/FilterChips.tsx`
**Skill zusätzlich:** dataviz (nur für die Zählerleiste)
**Inhalt:** Seitenkopf. Zählerleiste als eine Fläche nach §6.8. Filterleiste ohne Status-Select, der Status bleibt als verstecktes Feld erhalten (§6.9). Chips für aktive Filter. Tabelle nach §6.7 mit Sticky-Kopf und gestrecktem Zeilenlink, unter 640 px als Liste. `Leerzustand` mit Props `art` (`leer` | `filter` | `erledigt` | `fehler`), `titel`, `text`, `aktion?`, für alle Pakete wiederverwendbar.
**Abnahme:**
- Die Zähler stehen in der Reihenfolge nach §6.8. Felder mit 0 sind gedämpft, der aktive Filter ist markiert.
- Eine Suche behält Status und Bereich. Jeder Chip entfernt genau einen Parameter.
- Die Ergebniszeile lautet „X von Y Geräten“.
- Bei 1280 px ist die Tabelle unverändert vollständig (alle bisherigen Spalten). Bei 360 px gibt es eine Liste ohne horizontales Scrollen.
- Ein Klick irgendwo in der Zeile öffnet die Akte. Tab springt pro Zeile genau einmal.
- Leerzustände „noch keine Geräte“ (mit bzw. ohne Anlegerecht) und „Filter ohne Treffer“ nach §6.12.

## P3b Jahresring (nur nach OK von Max, Designsystem §9.3)
**Dateien:** neu `src/components/Jahresring.tsx`, `src/app/geraete/page.tsx`
**Skill zusätzlich:** dataviz
**Inhalt:** Plakettenvariante nach §5.3. Zählung je Kalendermonat aus `naechsteFaelligkeit` der ungefilterten Liste, ~~nur Termine ab heute bis heute + 12 Monate~~ (korrigiert durch §10 E-3, siehe P4c: 12 Kalendermonate ab dem aktuellen Monat). `heute()` aus `@/server/data` verwenden, kein `new Date()` im Client. Füllung in vier Steel-Stufen, Mitte die Summe. Daneben ein versteckter, für Screenreader lesbarer Monatsüberblick (`<dl>` oder Tabelle).
**Abnahme:**
- Die Summe in der Mitte entspricht der Zahl der Fälligkeiten in den nächsten 12 Monaten in den Demodaten.
- Es kommen keine Statusfarben vor. Das Element hat `role="img"` mit Zusammenfassung und dazu den lesbaren Überblick.
- Unter 640 px steht der Ring unter der Zählerleiste, bei 112 px Breite.

## P4a Geräteakte: Rahmen
**Dateien:** `src/app/geraete/[id]/page.tsx`, `src/components/VerlaufListe.tsx`, `src/components/NachweisListe.tsx`, `src/components/AnlassListe.tsx`, `src/components/BetriebsstatusBadge.tsx`
**Inhalt:** Seitenkopf mit Pfad. Aktenkopf mit Plakette 96 (§8.5). Abschnittsleiste mit Ankern und Zählern (sticky unter der Kopfleiste). Zweispaltig ab `xl` (Stammdaten-`dl`, Betrieb und Standort, Anlässe rechts). Verlauf nach §6.14, Nachweisliste als Tabelle (Datum, Ergebnis mit Symbol, Prüfer, PDF-Link). Betriebsstatus-Marke nach §6.6.
**Abnahme:**
- Unter 1280 px ist die Akte einspaltig, ab 1280 px zweispaltig, die Reihenfolge im DOM bleibt logisch (Prüfarten vor Stammdaten).
- Die Anker springen zu den Abschnitten, die Kopfleiste verdeckt die Überschriften nicht (`scroll-margin-top`).
- Leere Abschnitte nutzen `Leerzustand` (z. B. „Noch keine Nachweise.“).
- Pro Rolle sind dieselben Abschnitte sichtbar wie vorher.

## P4b Geräteakte: Prüfartkarte
**Dateien:** `src/components/PruefartKarte.tsx`
**Inhalt:** Aufbau nach §8.5 Regeln 1–6: Kopf, Warnstreifen nach Schwere sortiert, **Fristzeile** (Fällig am, Frist, Stufe mit Text, Quelle mit Fundstelle) immer sichtbar, darunter die `dl` mit weiteren Angaben, danach Disclosures „Frist festlegen“ (Vorschlag der Regel-Engine, `FristFreigabeForm`, `GbuVerweisForm`) und „Prüfer zuweisen“, unten der Fuß mit Aktionen. `uppercase tracking-wide` entfernen. Statusmarke bei „in Ordnung“ weglassen. Warnstreifen über Tokens (brick-50, ochre-50).
**Abnahme:**
- Für jeden Fall der Demodaten (Katalog A/B, Hersteller C, GBU ohne Eintrag, Entwurf, Anlass offen, Weiterbetrieb unzulässig, Fristhinweis) sind Stufe und Quelle ohne Aufklappen sichtbar, bei GBU der Satz „Frist über GBU festlegen“.
- Die Disclosure „Frist festlegen“ ist offen, wenn heute schon `gbuOffen` greift (gleiche Bedingung wie bisher). Der Anker `#gbu-form-…` funktioniert weiter.
- Kein Text unter 13 px, keine Versalien.
- Alle Formulare funktionieren wie vorher. Die Optik der Formulare selbst folgt in P5c.

## P4c Nachbesserung Prüfartkarte und Jahresring (Designsystem §10 E-1, E-3)
**Dateien:** `src/components/PruefartKarte.tsx`, `src/components/Pruefplakette.tsx`, `src/components/StatusAmpel.tsx`, `src/components/Jahresring.tsx` (+ zugehörige Tests, falls vorhanden)
**Nicht ändern:** `BetriebsstatusBadge.tsx` (E-2: Umsetzung korrekt), `src/domain/` (Status bleibt `gbu`).
**Inhalt:**
1. **Frist nicht freigegeben (E-1).** Fall: `!frist && vorschlag.art !== 'gbu'` (Status ist dann `gbu`).
   - `Pruefplakette`: optionale Prop `ohneFreigabe?: boolean`. Nur wirksam bei `status === 'gbu'`: Mitte „§“ (Schriftgröße wie „?“), `aria-label`/`title` „Keine freigegebene Frist: Vorschlag liegt zur Freigabe vor“. Ring gestrichelt wie GBU (§5.2).
   - `StatusAmpel`: optionale Prop `text?: string`, die den Anzeigetext und `title` ersetzt. Symbol und Form bleiben (§, gestrichelt).
   - `PruefartKarte`: in diesem Fall `ohneFreigabe` an die Plakette und `text="Frist nicht freigegeben"` an die Statusmarke übergeben. Die Fristzeile bleibt wie umgesetzt.
   - `PruefartKarte`: die Disclosure „Frist festlegen“ ist offen bei `darfFreigeben && (gbuOffen || !frist)`. `gbuOffen` selbst und die Übergabe an `FristFreigabeForm` bleiben **unverändert**.
2. **Jahresring-Fenster (E-3).**
   - Fenster = 12 Kalendermonate: aktueller Monat bis einschließlich des 11. Folgemonats. Gezählt werden Termine `>= heute` und `<=` letzter Tag dieses Monats. `monate` hat genau 12 Einträge, die Doppelzählung über `jeSegment` entfällt (ein Eintrag je Segment).
   - Segment des aktuellen Monats nach den übrigen zeichnen, mit `stroke` ink und `strokeWidth` 1,5 (Markierung Fensteranfang).
   - Sichtbarer Text statt „fällig in den nächsten 12 Monaten“: „fällig {Mon. JJJJ} – {Mon. JJJJ}“ (z. B. „fällig Nov. 2026 – Okt. 2027“). `aria-label` entsprechend: „{n} Fälligkeiten von November 2026 bis Oktober 2027, die meisten im …“.
   - Legende um einen Eintrag „Rahmen dunkel: aktueller Monat“ ergänzen (Rahmen-Muster wie im Ring, 13 px Text).
   - Screenreader-`<dl>` zeigt dieselben 12 Monate wie der Ring.
**Abnahme:**
- Demodaten mit freigegebenem Katalogeintrag, aber ohne freigegebene Frist: Plakette zeigt „§“, Statusmarke „Frist nicht freigegeben“, Fristzeile „Frist nicht freigegeben …“ mit Vorschlag, Stufe und Quelle, kein Fälligkeitsdatum. Mit Freigaberecht ist „Frist festlegen“ offen und der Button für den Vorschlag ist ohne Klick sichtbar.
- Fall „GBU ohne Eintrag“ bzw. „nur Entwurf“: unverändert („GBU“ in der Plakette, „Frist über GBU festlegen“).
- Geräteliste, Zählerleiste und Prüferaufgaben sind unverändert (nur die Karte ändert sich).
- Jahresring: Ein Termin am selben Kalendertag im nächsten Jahr (z. B. 20.11.2027 bei heute 20.11.2026) wird **nicht** mitgezählt, ein Termin am 31.10.2027 schon. Kein Segment fasst zwei Monate zusammen. Summe in der Mitte = Summe der 12 Listeneinträge.
- Unit-Test für die Fenstergrenzen (Monatsanfang, Monatsende, Jahreswechsel, 29.02.), ohne `new Date()` im Client.
- Kontrast: Rahmen ink auf allen vier Füllstufen sichtbar (auf steel-Füllung mit weißem Spalt oder doppeltem Strich prüfen, falls die Linie verschwindet).

## P5a Formulare: Bausteine und `/geraete/neu`
**Dateien:** `src/components/formular.tsx`, `src/components/GeraetAnlegenForm.tsx`, `src/app/geraete/neu/page.tsx`
**Inhalt:** In `formular.tsx` ergänzen: `FeldGruppe` (Label, „(optional)“, Hilfetext, Fehler, verknüpft per `aria-describedby`), `Fehleruebersicht` (ab 2 Feldfehlern, Fokus beim Erscheinen, Links zu den Feld-IDs), `Aktionsleiste` (unten links, mobil fest am unteren Rand). `ActionMeldung` nach §6.11 umbauen. Die bestehende Logik von `useFormularAction` bleibt unverändert. `/geraete/neu` nach §8.6 mit Gruppen (`fieldset`).
**Abnahme:**
- Mit zwei leeren Pflichtfeldern absenden: Die Fehlerübersicht erscheint mit Fokus, Links springen ins Feld, Eingaben bleiben erhalten.
- Optionale Felder sind mit „(optional)“ markiert, es gibt keine Sternchen.
- Bei 360 px ist der Speichern-Button immer sichtbar (feste Leiste) und verdeckt kein Feld (Abstand unten).

## P5b Formular Nachweis `/nachweise/neu/[pruefartId]`
**Dateien:** `src/app/nachweise/neu/[pruefartId]/page.tsx`, `src/components/NachweisForm.tsx`
**Inhalt:** Zusammenfassung oben (Plakette 56, Gerät, Prüfart, fällig am, Frist mit Stufe und Quelle). Ergebnis als Radio-Kacheln (56 px, Symbol und Text). PDF-Ablagefläche nach §6.10. Erfolgsmeldung mit Bestätigungs-Plakette, nur mit Datum vom Server. **Kein Fälligkeitsdatum im Browser berechnen.**
**Abnahme:**
- Die Radio-Kacheln sind mit Pfeiltasten bedienbar, die Auswahl ist ohne Farbe erkennbar (Rahmen 2 px und Symbol).
- Nach der Dateiwahl werden Dateiname und Größe angezeigt. Nach einem Fehler bleibt die Datei erhalten (bestehendes Verhalten).
- Funktioniert bei 360 px mit Daumen: alle Ziele mindestens 48 px.
**BE-Bedarf (optional):** Wenn die Action nach dem Speichern das neue Fälligkeitsdatum zurückgibt, zeigt die Bestätigung es auf der Plakette. Sonst nur ✓.

## P5c Inline-Formulare der Akte
**Dateien:** `src/components/FristFreigabeForm.tsx`, `GbuVerweisForm.tsx`, `PrueferZuweisungForm.tsx`, `PrueferDeaktiviertHinweis.tsx`, `BetriebsstatusForm.tsx`, `GeraetVerschiebenForm.tsx`, `AnlassForm.tsx`
**Inhalt:** Auf `FeldGruppe`/`Aktionsleiste` (nicht fest, inline) umstellen. Hinweis zur Obergrenze („Nicht länger als …“) als Hinweis-Meldung. Monatsfeld mit Einheit. Rückfrage bei „außer Betrieb nehmen“ per Bestätigungsdialog nur, wenn bisher schon eine Rückfrage existiert, sonst unverändert.
**Abnahme:**
- Jedes Formular ist einzeln absendbar, Feldfehler stehen am Feld. Das Verhalten ist identisch zu vorher (Demo: Frist freigeben, abweichende Frist mit Begründung, Prüfer zuweisen, verschieben, Anlass erfassen).
- Es gibt keine Ad-hoc-Tönungen mehr in diesen Dateien.

## P6 Prüfer mobil `/pruefer`
**Dateien:** `src/app/pruefer/page.tsx`, `src/components/PrueferAufgabenListe.tsx`
**Inhalt:** Nach §8.7: Karten mit Plakette 56, Hauptaktion 56 px in voller Breite, die Gruppe „Später“ als zugeklappte Disclosure mit Anzahl, Leerzustand „alles erledigt“ (moss-Plakette mit ✓). Seitenbreite 40 rem.
**Abnahme:**
- Bei 360 px: keine Ziele unter 48 px, keine Wischgesten, Text mindestens 14 px.
- „Weiterbetrieb nicht zulässig“ steht als Warnstreifen in der Karte (Symbol und Text).
- Mit Prüferrolle in der Demo ist die Kette von der Aufgabe zum Nachweis und zurück zur Liste in 3 Schritten durchführbar.

## P7a Anmeldung und Auth-Seiten
**Dateien:** `src/app/login/page.tsx`, `src/components/LoginForm.tsx`, neu `src/components/PlaketteLive.tsx`, `src/app/auth/bestaetigen/page.tsx`, `src/app/passwort-vergessen/page.tsx`, `src/components/PasswortVergessenForm.tsx`, `src/app/passwort-neu/page.tsx`, `src/components/PasswortNeuForm.tsx`, `src/app/kein-zugang/page.tsx`, `src/app/not-found.tsx`
**Inhalt:** Login nach §8.1 mit Live-Plakette (aktueller Monat und Jahr serverseitig ermittelt und als Prop übergeben) und der einmaligen Füllanimation (§4.4). Die anderen Seiten nach §8.2/§8.11.
**Abnahme:**
- Die Animation läuft einmal unter 600 ms, bei reduzierter Bewegung gar nicht.
- Ab 1024 px zweispaltig, darunter einspaltig. Das Formular ist ohne Scrollen bei 360×640 erreichbar.
- Demo-Rollenwahl, Supabase-Login und der Zustand „nicht konfiguriert“ sehen konsistent aus.

## P7b Mängel
**Dateien:** `src/app/maengel/page.tsx`, `src/app/maengel/[id]/page.tsx`, `src/app/maengel/neu/page.tsx`, `src/components/MaengelFilter.tsx`, `src/components/MaengelTabelle.tsx`, `src/components/MangelStatusBadge.tsx`, `src/components/MangelForm.tsx`, `src/components/MangelKenntnisForm.tsx`, `src/components/MangelBehebenForm.tsx`
**Inhalt:** Nach §8.9 und §6.6, mit Bausteinen aus P3a/P5a (`Leerzustand`, `FilterChips`, `FeldGruppe`, `Fehleruebersicht`).
**Abnahme:**
- Die Mangelstatus-Marken haben Symbol und Text. Die Mängeltabelle in der Geräteakte sieht danach ebenfalls korrekt aus (Spalte Gerät ausgeblendet).
- Die Zählerleiste der Mängel nutzt denselben Baustein-Stil wie `/geraete`.

## P7c Verwaltung und Organisation
**Dateien:** `src/app/admin/bereiche/page.tsx`, `src/app/admin/mitglieder/page.tsx`, `src/app/admin/mitglieder/neu/page.tsx`, `src/app/admin/mitglieder/[id]/page.tsx`, `src/components/BereichForm.tsx`, `src/components/BereicheTabelle.tsx`, `src/components/MitgliedForm.tsx`, `src/components/MitgliederTabelle.tsx`, `src/app/organisation/page.tsx`, `src/components/OrganisationWahl.tsx`
**Inhalt:** Nach §8.10 und §8.3. Den Bestätigungsdialog (§6.16) nur für bereits vorhandene Deaktivieren-Aktionen einsetzen.
**Abnahme:**
- Die Verwaltungs-Tabs zeigen den aktiven Zustand. Die Tabellen folgen §6.7 (ohne Plakettenspalte).
- Die Betriebswahl hat Zeilen mit 56 px, ist per Tastatur bedienbar und funktioniert mit einem und mit mehreren Betrieben.
**BE-Bedarf (optional):** die Zahl der überfälligen Prüfungen je Betrieb für `/organisation`.

---

## Offene Abhängigkeiten
- **Max:** Freigabe der Vorschläge §9.1–§9.6 im Designsystem. P3b und `lucide-react` warten darauf, alle anderen Pakete nicht.
- **requirements-engineer:** Q-10 in `docs/requirements.md` als gelöst eintragen (skills-empfehlung §3). Die Pakete P1–P7 und P4c in `docs/backlog.md` übernehmen.
- **requirements-engineer (neu, §10 E-1):** Fachlich klären, ob Prüfarten mit freigegebenem Katalog- oder Herstellervorschlag, aber ohne freigegebene Frist auf Listenebene (Zählerleiste, Geräteliste, Prüferaufgaben) weiter als „Frist über GBU festlegen“ gelten oder einen eigenen Status bzw. ein eigenes Label bekommen. Bis dahin bleibt die Liste unverändert.
- **backend-dev:** optional neues Fälligkeitsdatum als Rückgabe von „Nachweis speichern“ (P5b) und Zahl der Überfälligen je Betrieb (P7c).

## Freigaben Max (20.11.2026)
Alle Vorschläge aus designsystem.md §9.1–§9.6 freigegeben: Wortmarke Plakette + „Readyloop“, kein Dark Theme im MVP, Jahresring auf `/geraete` (P3b), ochre-600 für Linien, `lucide-react` als Icon-Set, Grundschrift 16 px / Untergrenze 13 px.

---

## I3M – Mitarbeiter, QR-Seite, Etiketten (Stand 20.11.2026)

Gestaltet die Backlog-Pakete FE-12 bis FE-15 (`docs/backlog.md` §6/§7). Die Paketnamen und Komponentennamen aus dem Backlog bleiben, hier kommen Gestaltung, zusätzliche Dateien und Abnahmekriterien dazu. Bei Widersprüchen gilt für **Aussehen und Verhalten** dieses Dokument, für **Daten, Rechte und Texte aus dem Vertrag** der Backlog.

Neue Designsystem-Abschnitte: Leitsätze 6–8 (§1), §2.4 Ausnahme, §5.3 Variante Druck, §5.5, §6.17–§6.22, §7, §8.12–§8.17, §9.7, §10 E-4 bis E-6.
Hinweis zu §6.17 (Semantik): Verbindlich ist die Lösung in §8.12. Das Band ist eine `<section aria-label="Nutzung">` mit dem Titel als `<p>`, steht im DOM vor dem `<header>` mit h1 und bekommt **kein** `role="status"`; `role="status"` haben nur Meldungen nach einer Aktion.

### Reihenfolge und Parallelität
```
FE-11 (Backlog, vorher) ── FE-12 ──┬── FE-13
                                   ├── FE-14            (parallel zu FE-13, keine gemeinsamen Dateien)
                                   └── FE-15a ── FE-15  (FE-15a nur nach OK von Max zu §9.7; parallel zu FE-13/FE-14)
```
- FE-12 legt die gemeinsamen Bausteine an (`NutzungsHinweis`, `PruefartKurzliste`, `MaAktionen`, Halle-Klassen in `globals.css`). Danach ändert kein anderes I3M-Paket `globals.css`.
- Ohne Freigabe zu §9.7 entfällt FE-15a, und FE-15 nutzt den Ersatzweg (§9.7).

### I3M-0 Gilt zusätzlich für jedes I3M-Paket
1. Alle Punkte aus §0.
2. Halle-Modus §6.18 auf allen Mitarbeiter-Seiten und der QR-Seite: In den DevTools (Elementauswahl) ist kein Touch-Ziel kleiner als 48 × 48 px, die Hauptaktion 56 px hoch, Abstand zwischen Zielen mindestens 12 px.
3. Prüfung bei 320 px, 360 px und 1280 px: kein seitenweites horizontales Scrollen, gleiche Inhalte und Aktionen.
4. Graustufen-Test: DevTools → Rendering → „Emulate vision deficiencies: Achromatopsia“. „Nicht verwenden“, „Prüfstatus unklar“ und „Verwendbar“ sind allein über Symbol und Text unterscheidbar.
5. Kein Personenname außer dem Prüfernamen auf QR-Seite, Meine Geräte und Suche (im HTML-Quelltext nach den Demo-Namen suchen: Katrin Vogel, Dr. Jens Hartmann, Marco Lindner, Sabine Krüger, Aylin Demir; Jonas Richter nur in Kopfleiste/Menü der eigenen Sitzung).
6. Texte aus dem Vertrag (`NUTZUNG_LABEL`, `UEBERNAHME_HINWEIS_LABEL`, Meldungen der Actions) werden wörtlich verwendet. Zusätzliche UI-Sätze genau wie im Designsystem.
7. Jede Aktion funktioniert ohne JavaScript (Formular mit Server Action), mit JavaScript ohne Neuladen der Seite.

---

### FE-12 Öffentliche QR-Seite `/g/[token]` und gemeinsame Mitarbeiter-Bausteine
**Designsystem:** §1 (6–8), §2.4, §5.5 (Plakette 96 „Aktueller Stand“), §6.1 (öffentliche Kopfleiste), §6.3, §6.17, §6.18, §6.19 (nur Aktionstabelle), §6.20, §8.12, §8.1 (Hinweis bei `next`)
**Dateien:**
- `src/app/g/[token]/page.tsx`, `src/app/g/[token]/not-found.tsx`
- neu `src/components/OeffentlicheKopfleiste.tsx` (Glyph, Wortmarke, Link „Anmelden“ mit `next`; ändert `AppHeader.tsx` nicht)
- neu `src/components/OeffentlicheGeraeteansicht.tsx` (Kennung: Plakette 96 mit Unterzeile „Aktueller Stand“, h1, Inventarnummer, Hersteller · Typ, Betrieb; Fuß mit „Stand“)
- neu `src/components/NutzungsHinweis.tsx` (Props laut Backlog + `groesse: 'gross' | 'kompakt'`, `naechsteFaelligkeit: IsoDate | null` für die Zeile „Nächste Prüfung bis …“)
- neu `src/components/PruefartKurzliste.tsx` (§6.20)
- neu `src/components/MaAktionen.tsx` (Props `{ kurz: GeraetKurzansicht; zurueck: string }`; setzt die Aktionstabelle §6.19 um, inklusive Hinweise vor den Buttons und Erfolgsmeldung am Ort; wird in FE-13 von `MeinGeraetKarte` wiederverwendet)
- neu `src/components/TokenAktionen.tsx` (Fälle §8.12; für MA delegiert an `MaAktionen`)
- `src/app/globals.css`: Klassen `.btn-haupt` (56 px) und `.btn-halle` (48 px), Stil `nutzung` (24/30), Stil des Nutzungsbands (brick voll, Symbolkreis weiß)
- `src/app/login/page.tsx`: Hinweis „Nach der Anmeldung geht es zurück zum Gerät.“, wenn `next` mit `/g/` beginnt (§8.1)

**Inhalt:**
- Aufbau genau nach §8.12: Nutzungsband groß zuerst (DOM und Bild), dann Kennung, Aktionen, „Prüfungen“ (immer offen), Fuß mit „Stand: TT.MM.JJJJ, HH:MM Uhr“ in Europe/Berlin.
- `<title>` „{Bezeichnung} – {Nicht verwenden | Prüfstatus unklar | Verwendbar}“.
- Text im Nutzungsband mit `sr-only`-Trenner „ – “, sodass `textContent` die Vertragstexte enthält (§6.17).
- Grund-Zeile nach §6.17 (Außer Betrieb / Überfällig seit … / `VOR_NUTZUNG_GRUND_LABEL`).
- Ohne Frist in der Kurzliste: „Frist über GBU festlegen“ und „Noch keine Prüffrist festgelegt.“
- `not-found.tsx` nach §8.12 (Leer-Plakette 96 mit „!“, öffentliche Kopfleiste, Aktion „Gerät suchen“).

**Abnahme:**
- US-18 vollständig in der Demo. L-001 ohne Login: erstes sichtbares Element unter der Kopfleiste (und erstes Element in `main`) ist das brick-Band mit ✕, „Nicht verwenden“ und „Überfällig seit …“; `document.querySelector('main').textContent` enthält „Nicht verwenden – Überfällig“.
- Ein Gerät mit `unbekannt`/`gbu` zeigt das ochre-50-Band; `textContent` enthält „Prüfstatus unklar – vor Nutzung Verantwortlichen fragen“. Ein Gerät `ok` zeigt das moss-50-Band „Verwendbar“ mit „Nächste Prüfung bis TT.MM.JJJJ.“
- Je Prüfung sichtbar ohne Aufklappen: Statusmarke, Fällig am, Prüffrist mit Monaten, Quelle und Stufe **mit Text**, Grundlage (Fundstelle), letzte Prüfung mit Herkunft, letzter Nachweis mit Ergebnis und „Prüfer: …“.
- Ohne Sitzung: öffentliche Kopfleiste ohne Menü; bei `wechselnd` zwei Sekundärbuttons „Anmelden und übernehmen“, „Anmelden und Mangel melden“ (je 48 px), sonst nur letzterer. Beide führen auf `/login?next=/g/{token}` und dort steht der Rücksprung-Hinweis.
- Als MA (Demo Jonas) auf L-002: Button „Zurückgeben“ (56 px) bzw. nach Rückgabe „Gerät übernehmen“; nach dem Tipp steht die Meldung zwischen Kennung und Aktionen und hat den Fokus. Ohne JavaScript funktioniert beides (Seite lädt neu, Meldung sichtbar).
- Als MA auf L-001: kein Übernehmen-Button, Fehler-Hinweis mit `UEBERNAHME_HINWEIS_LABEL.nicht_verwenden`, „Mangel melden“ als Hauptaktion 56 px.
- Als VER Lager auf L-003: Sekundärbutton „Geräteakte öffnen“. Auf P-001: keiner, kein Hinweis auf fremde Bereiche.
- Ungültiger Token (`abc`, unbekannt, erneuert): identische Seite „Dieser Aufkleber ist nicht gültig.“, HTTP 404.
- Kein Bereichsname, kein PDF-Link, kein Halter auf der Seite.
- I3M-0 Punkte 2–5.

### FE-13 Meine Geräte, Gerät suchen, Mangel melden
**Designsystem:** §6.6 (Mangel-, Übernahmezeile), §6.10 (Mitarbeiter-Formulare), §6.17 kompakt, §6.18, §6.19, §6.22, §7, §8.13, §8.14, §8.15
**Dateien:**
- `src/app/meine-geraete/page.tsx`, `src/app/meine-geraete/suchen/page.tsx`, `src/app/mangel-melden/[geraetId]/page.tsx`
- neu `src/components/MeinGeraetKarte.tsx` (Prop `variante: 'meine' | 'treffer'`; nutzt `NutzungsHinweis` kompakt, `PruefartKurzliste`, `MaAktionen` aus FE-12 unverändert)
- neu `src/components/GeraeteSucheForm.tsx`
- neu `src/components/MangelMeldenForm.tsx`
- `src/app/not-found.tsx`: für Rolle MA Link „Zu meinen Geräten“ (§8.11)

**Inhalt:**
- `/meine-geraete` nach §8.13: Abschnitte „Von mir übernommen (n)“ vor „Mir zugeordnet (n)“, Sammelmeldung oben bei „Nicht verwenden“ mit Ankerlinks, Leerzustand mit Primär „Gerät suchen“ und QR-Hinweis.
- Karte nach §6.19: kompaktes Band nur bei `nicht_verwenden`/`unklar`, sonst Statusmarke „✓ Verwendbar“; Disclosure „Prüfungen (n)“ zu bei `verwendbar`, sonst offen; Aktionen über `MaAktionen`. Ab `lg` Zeilenkarte (Grid `56px 1fr 16rem`).
- `/meine-geraete/suchen` nach §8.14 und §6.22 (GET-Formular, Ergebniszeile `aria-live`, Hinweis unter 2 Zeichen, Leerzustand, Hinweis bei 50 Treffern).
- `/mangel-melden/[geraetId]` nach §8.15: Gerätezusammenfassung mit kompaktem Band, Warnung, Radio-Kacheln 64 px ohne Vorauswahl mit Erklärsätzen, Zusatzhinweis bei „Gefährlich“ per CSS `:has(:checked)`, Textfeld 4 Zeilen, Hauptaktion 56 px (mobil feste Leiste), Erfolg ersetzt das Formular, Rücklink über `zurueck` (nur relativ, sonst `/meine-geraete`).

**Abnahme:**
- US-17 in der Demo: Jonas sieht „Von mir übernommen“ mit L-008 zuerst (brick-Band „Nicht verwenden“, Grund, „Zurückgeben“ als Hauptaktion) und L-002, darunter „Mir zugeordnet“ mit P-008 (Statusmarke „✓ Verwendbar“, Disclosure zu). Oben die Sammelmeldung „1 Gerät nicht verwenden.“ mit Ankerlink zu L-008.
- Geschlossene Disclosure zeigt keine Frist. Geöffnet steht jede Frist mit Stufe (Text) und Quelle.
- US-28 per Suche am PC (1280 px, nur Tastatur): `/meine-geraete/suchen` → „hubwagen“ → Enter → Tab bis „Gerät übernehmen“ → Enter → Meldung mit Fokus. Bei P-003 steht vor dem Button der Hinweis „Wird von einer anderen Person genutzt. …“, kein Name.
- Eingabe „a“: Hinweis „Bitte mindestens 2 Zeichen eingeben.“, keine Treffer, kein Fehlerrahmen.
- US-30: „Mangel melden“ ohne Schwere absenden → Feldfehler an der Gruppe; mit 3 Zeichen → Feldfehler `beschreibung`. Bei Wahl „Gefährlich“ erscheint der Zusatzhinweis ohne JavaScript. Nach dem Speichern ersetzt die Erfolgsmeldung das Formular, Fokus darauf; bei „Gefährlich“ zeigt das Band darüber jetzt „Nicht verwenden – Gefährlicher Mangel offen“ (V-001).
- Ab 1024 px Zeilenkarten, darunter Karten; bei 1280 px liegen Plakette, Kennung und Aktionen in einer Zeile.
- US-33: alle Schritte bei 360 px mit Zielen ≥ 48 px; „Abmelden“ im Menü auf jeder Seite.
- I3M-0 Punkte 2–5.

### FE-14 Geräteakte: Abschnitt „Nutzung und Aufkleber“
**Designsystem:** §6.7, §6.10 (Disclosure), §6.13, §8.5 (Position), §8.16, §10 E-5
**Dateien:**
- `src/app/geraete/[id]/page.tsx` (nur Abschnitt einbinden: rechte Spalte nach „Betrieb und Standort“, einspaltig nach den Stammdaten)
- neu `src/components/NutzungAbschnitt.tsx`, `ZuordnungForm.tsx`, `UebernahmeBeendenForm.tsx`, `EtikettErneuernForm.tsx`, `UebernahmeVerlauf.tsx`

**Inhalt:**
- Aufbau nach §8.16 für personenbezogen, wechselnd und ortsgebunden. Datum/Uhrzeit in Mono.
- `ZuordnungForm` in Disclosure „Zuordnung ändern“ (geschlossen mit aktuellem Wert), Select mit „– keine Zuordnung –“, Primär „Zuordnung speichern“; ohne Optionen Satz und ggf. Link „Mitarbeiter einladen“.
- `UebernahmeBeendenForm`: Sekundärbutton „Übernahme beenden“, ohne Rückfrage.
- `UebernahmeVerlauf`: Tabelle §6.7 (Person, Von, Bis, Ende), h3 „Übernahmen der letzten 90 Tage“, Satz „Ältere Einträge werden automatisch ohne Namen gespeichert.“ Ohne Sortier- und Filterfunktion.
- Aufkleber: Kurz-URL in Mono, Sekundär-Link „Etikett drucken“ → `/etiketten?geraet={id}`, Disclosure „Aufkleber erneuern“ mit Warnung, Pflicht-Checkbox `bestaetigung`, gefährlichem Button „Aufkleber erneuern“ (E-5, kein `<dialog>`).

**Abnahme:**
- ADM auf L-006: Tabelle mit einem Eintrag (Aylin Demir, Ende „Zurückgegeben“). VER und SIF auf L-006: keine Tabelle, „Frei“.
- VER Lager auf L-002: „Genutzt von Jonas Richter, seit …“ und „Übernahme beenden“ → Meldung „Übernahme beendet“, danach „Frei“.
- ADM auf P-008: Disclosure zeigt geschlossen „Zugeordnet an: …“ bzw. „Niemandem zugeordnet“; Zuordnung an Aylin speichern und lösen funktioniert (US-29).
- SIF: sieht Halter, aber keine Formulare und keinen Teil „Aufkleber“. PRF: Abschnitt fehlt ganz.
- „Aufkleber erneuern“ ohne Checkbox → Feldfehler an der Checkbox mit dem Schema-Text; mit Checkbox → Meldung „Aufkleber erneuert. …“, neue Kurz-URL sichtbar (US-31).
- Der Aktenkopf ist unverändert (kein Halter im Kopf).

### FE-15a Prüfplakette Variante Druck (nur nach OK von Max zu §9.7)
**Designsystem:** §5.3 (Druck), §5.5, §9.7
**Dateien:** `src/components/Pruefplakette.tsx` (+ Test, falls vorhanden). Kein anderes Paket ändert diese Datei gleichzeitig.
**Inhalt:**
- Neue optionale Prop `druck?: boolean`. Bei `true`: alle Farben `black` bzw. `white`, aktives Segment schwarz gefüllt, inaktive Segmente weiß, Strichstärke der Segmentrahmen 1,5 (viewBox-Einheiten, entspricht bei 13 mm etwa 0,3 mm), GBU weiter gestrichelt, Mitte wie bisher (Jahr, „GBU“, „?“, „§“; „!“ in Schwarz statt brick).
- `width`/`height` bei `druck` auf `100%`, damit das Etikett die Größe in mm setzt (`groesse` wird ignoriert).
- Kein `color-mix` in der Druckvariante.
- `aria-label` unverändert sinngemäß, aber ohne Statuswort: „Nächste Prüfung 03/2027“.

**Abnahme:**
- In einem 13-mm-Container gerendert und als PDF gedruckt: Ring, gefüllter Monat und Jahr bei 100 % Zoom klar erkennbar, keine Graustufen-Flächen.
- Ohne `druck` ist die Plakette in allen bisherigen Varianten pixelgleich (bestehende Tests grün, Sichtprüfung `/geraete`).

### FE-15 Etiketten drucken `/etiketten`
**Designsystem:** §5.5, §6.15 (Printer-Icon), §6.21, §7, §8.17
**Dateien:** `src/app/etiketten/page.tsx`, `src/app/etiketten/druck.css`, neu `src/components/Etikett.tsx`, `QrCode.tsx`, `EtikettenAuswahl.tsx`, neu `src/components/EtikettenBogen.tsx` (teilt die Etiketten in Bögen à 24, berücksichtigt `start`)
**Inhalt:**
- Seite nach §8.17: Bedienteil (Auswahl, Anzahl mit Bögen, Primär „Drucken“ mit Printer-Icon, Hinweis „So drucken Sie richtig“), Vorschau maßstäblich in einem eigenen horizontal scrollenden Container.
- Einzelgerät (`?geraet=`): Auswahl ausgeblendet, Pfad und Satz nach §8.17.
- Soll: Select „Erstes freies Feld auf dem Bogen“ (1–24, URL-Parameter `start`), leere Felder vorne.
- `Etikett` nach §6.21: Sicherheitsrand 4/5 mm, QR 21 × 21 mm inklusive Ruhezone, darunter „Aktueller Status:“ / „QR scannen“; rechts Plakette Druck 13 mm mit „Nächste Prüfung“, Monat/Jahr, „Stand …“; Bezeichnung einzeilig mit „…“, Inventarnummer Mono, Betrieb, Kurz-URL zweizeilig (Host+„/g/“, Token). Schriftgrößen in pt wie §6.21.
- `QrCode`: SVG `viewBox` = Modulzahl + 8 (Ruhezone 4 je Seite), weißer Hintergrund, Module `black`, `shape-rendering="crispEdges"`, `role="img"`, `aria-label` „QR-Code für {Bezeichnung}“.
- `druck.css` exakt nach §8.17 (A4, Rand 0, Bogen 210 × 296 mm, oben 0,5 mm, Grid 3 × 70 mm / 8 × 37 mm, `break-after: page`). Am Bildschirm Schnittrand gestrichelt steel-200. Kopfleiste, Demo-Banner und Bedienteil `@media print { display: none }`.
- Ohne Freigabe §9.7 (Ersatzweg): normale `Pruefplakette` in Statusfarbe mit `print-color-adjust: exact` in einem 13-mm-Container, Zeile „Stand …“ bleibt.

**Abnahme:**
- US-31: VER Lager, Bereich Lager, Kategorie „Wechselnder Einsatzort“ → 4 Etiketten (L-001, L-002, L-006, L-008), Anzahlzeile „4 Etiketten · 1 Bogen A4 (24 je Bogen)“.
- Druckvorschau in Chrome und Firefox (Skalierung 100 %, Ränder „Keine“): genau eine A4-Seite je 24 Etiketten, keine leere Folgeseite, kein Etikett über einen Seitenumbruch geteilt. 30 Etiketten (z. B. ADM, Kategorie leer bzw. alle) → 2 Seiten.
- Ausdruck auf Normalpapier gegen einen 70 × 37-Bogen gehalten: Etikettenränder liegen innerhalb ±1 mm. Kein Inhalt näher als 4 mm am oberen/unteren und 5 mm am seitlichen Etikettrand.
- Gedruckter QR lässt sich mit der Kamera-App eines Handys aus etwa 20 cm öffnen und führt auf `/g/{token}` genau dieses Geräts.
- Lange Bezeichnung (> 30 Zeichen) wird mit „…“ gekürzt, der QR bleibt 21 mm.
- Etikett ohne Inventarnummer: Zeile entfällt, kein leerer Abstand. Status `gbu`: „Frist über GBU festlegen“ statt Monat/Jahr.
- `/etiketten?geraet={P-001}` als VER Lager: Leerzustand „Keine Geräte für diese Auswahl.“
- MA, PRF, SIF: `/etiketten` → 404 (unverändert aus BE).
- Am Bildschirm bei 360 px: Bedienteil ohne horizontales Scrollen der Seite, nur die Vorschau scrollt.

### Offene Abhängigkeiten I3M
- **Max:** Freigabe §9.7 (einfarbige Plakette auf dem Etikett). Ohne Freigabe entfällt FE-15a, FE-15 nutzt den Ersatzweg.
- **backend-dev:** keine neuen Anforderungen. Genutzt werden nur Felder aus dem Vertrag §7. Für „Überfällig seit …“ im Nutzungsband reicht `naechsteFaelligkeit`; die Uhrzeit für „Stand“ kommt aus `ansicht.stand`.
- **requirements-engineer:** Backlog FE-14 nennt einen Bestätigungsdialog für „Aufkleber erneuern“; gestaltet ist eine Disclosure mit Pflicht-Checkbox (§10 E-5). Bitte im Backlog nachziehen. FE-15a als neues Paket aufnehmen (abhängig von §9.7).

---

## I3 – E-Mail-Erinnerungen (Stand 23.11.2026)

Gestaltet das Paket D-I3 aus `docs/backlog.md` §8 („Designer zuerst“). Paketnamen, Dateien und Vertrag aus dem Backlog bleiben; hier kommen Gestaltung, zusätzliche Dateien und Abnahmekriterien dazu. Bei Widersprüchen gilt für **Aussehen und Verhalten** dieses Dokument bzw. `mail-vorlagen.md`, für **Daten, Rechte und Texte aus dem Vertrag** der Backlog.

Neue Designsystem-Abschnitte: Leitsatz 9 (§1), §2.4 (Hex in Mails), §5.3 Text-Plakette, §6.1 (Navigation, Menü, `/abmelden`), §6.11 (feste Texte I3), §6.23–§6.26, §7, §8.18–§8.23, §9.8, §10 E-7 bis E-10, §12, §13.

### Reihenfolge und Parallelität
```
D-I3a (erledigt: mail-vorlagen.md) ──► BE-24 (backend-dev)
FE-17 (Bugfix, sofort, ohne Design)
BE-21 ── FE-18a ── FE-18b ──┬── FE-19
                            └── FE-20 ── FE-21
```
- FE-19 und FE-20 haben keine gemeinsamen Dateien und dürfen parallel laufen.
- `ErinnerungenNav.tsx` schreibt nur FE-18a; FE-20 und FE-21 importieren es. `VersandStatusBadge.tsx` schreibt nur FE-20; FE-21 importiert es.
- `AppHeader.tsx` ändert nur FE-18a (Backlog: erst starten, wenn dort keine Designsystem-Arbeit offen ist).
- **Kein I3-Paket ändert `src/app/globals.css`** (Backlog §8 Dateibesitz). Es reichen die vorhandenen Tokens und Klassen; `.btn-halle` (48 px) aus FE-12 für die 48-px-Buttons.
- FE-Seiten kompilieren gegen die Stubs aus BE-21 und zeigen Daten ab BE-26.

### I3-0 Gilt zusätzlich für jedes I3-Paket
1. Alle Punkte aus §0.
2. Texte aus dem Vertrag (`MAIL_ART_LABEL`, `MAIL_ART_BESCHREIBUNG`, `PFLICHTMAIL_BEGRUENDUNG`, `VERSAND_STATUS_LABEL`, `MAIL_FEHLER_LABEL`, `ESKALATIONS_EBENE_LABEL`, `warnungen`, Meldungen der Actions) wörtlich. Zusätzliche UI-Sätze genau wie im Designsystem.
3. Alle Formulare funktionieren ohne JavaScript (Server Action bzw. GET). Feldnamen exakt wie im Vertrag §9.8.
4. Keine Spalte, Sortierung, Suche, Filter oder Zählung nach Person (R-45, F-41).
5. Prüfung bei 360 px und 1280 px ohne seitenweites horizontales Scrollen; Tastatur vollständig.
6. Keine Plakette außer in Leerzuständen und der Glyph in den Kopfleisten (§5.4 I3).

---

### D-I3a Mail-Vorlagen (designer, erledigt) → Übergabe an BE-24
**Liefergegenstand:** `docs/design/mail-vorlagen.md` (Entscheidungen M-1 bis M-9, Inline-Werte, Gerüst, Bausteine, Texte, Textteil, Abnahme §10, Abweichungen §11, Anhang Einladung/Reset).
**Abnahme durch den designer nach BE-24:**
- Snapshot-HTML je Mailart in einem Browser bei 600 px und 360 px angesehen: Kopf, Zusammenfassung, Button, Gruppen, Text-Plakette, Fuß wie spezifiziert.
- Spätestens in FE-21 die drei Mailarten in `/admin/mails` geprüft (HTML und Text).
- Ergebnis als kurze Notiz an backend-dev; Abweichungen nur als neue Entscheidung in `designsystem.md` §10.

### FE-17 Bugfix QR-Seite (ohne Design)
Unverändert nach Backlog. Gestaltung: §8.12 Hinweis I3 (kein Zusatztext).

### FE-18a Navigation, Untertabs und Übersicht `/admin/erinnerungen`
**Designsystem:** §6.1 (Erinnerungen, Menü), §6.7, §6.11 (feste Texte), §6.26, §8.18, §10 E-8
**Dateien:**
- `src/components/AppHeader.tsx`: `NavSchluessel` um `'erinnerungen'` ergänzen; Hauptpunkt „Erinnerungen“ für `erinnerung.protokoll` (ADM und SIF), Ziel ADM (`erinnerung.einstellen`) `/admin/erinnerungen`, sonst `/erinnerungen/protokoll`, Position nach „Etiketten“, vor „Verwaltung“; Menüeintrag „Benachrichtigungen“ (Icon `Bell`, für alle Rollen mit `benachrichtigung.eigene`) über „Abmelden“, 48 px.
- neu `src/components/ErinnerungenNav.tsx` (§6.26; Props `aktiv`, `zeigeEinstellungen`, `zeigeVorschau`; eine Tab-Zeile nur bei ≥ 2 Tabs)
- `src/app/admin/erinnerungen/page.tsx`
- neu `src/components/ErinnerungUebersicht.tsx` (Tabelle ab `sm`, Liste darunter; Warnzeilen; Hinweis unten; Leerzustand)

**Abnahme:**
- Demo je Rolle: ADM sieht „Erinnerungen“ → `/admin/erinnerungen` mit Tabs „Einstellungen je Bereich“, „Versandprotokoll“, „Mail-Vorschau“ (letzter nur im Modus `vorschau`). SIF sieht „Erinnerungen“ → `/erinnerungen/protokoll` (Seite folgt in FE-20). VER, PRF, MA sehen den Punkt nicht. Alle Rollen sehen im Menü „Benachrichtigungen“.
- `aria-current="page"` am Hauptpunkt auf allen drei Unterseiten (Seiten übergeben `aktiv="erinnerungen"`).
- Bei 360 px liegt „Erinnerungen“ in der scrollbaren zweiten Zeile; ADM hat höchstens 5 Hauptpunkte.
- US-39 Teil Übersicht: Lager „Standard“, Produktion „60 · 30 · 14 Tage“, „Verantwortliche 0 · Sifa 3 · Admin 10“, „Sifa in Kopie: nein“, „Angepasst am … von …“ (Demo-Daten BE-25). Ein Bereich ohne aktiven VER zeigt die Warnzeile wörtlich aus `warnungen`.
- Der Hinweis „Prüfungen ohne freigegebene Frist …“ steht unter der Tabelle. Im Modus `aus` steht oben die Warnung „Mailversand ist nicht eingerichtet.“
- Klick auf den Bereichsnamen (oder irgendwo in der Zeile) öffnet `/admin/erinnerungen/{bereichId}`; Tab springt je Zeile einmal.

### FE-18b Einstellungen je Bereich `/admin/erinnerungen/[bereichId]`
**Designsystem:** §6.10 (Tage-Felder, Fehlerübersicht), §6.24, §6.25, §8.19
**Dateien:**
- `src/app/admin/erinnerungen/[bereichId]/page.tsx`
- neu `src/components/ErinnerungEinstellungForm.tsx` (beide Formulare: Speichern und Zurücksetzen)
- neu `src/components/EskalationsKette.tsx`
- neu `src/components/EmpfaengerWahl.tsx` (Radiogruppe + Checkboxliste, für Sifa und Admin wiederverwendet)

**Abnahme:**
- US-39 vollständig in der Demo: Produktion öffnen → Werte vorbelegt (Staffel in absteigender Reihenfolge, Eskalation, Checkbox, Radio „Auswahl“ mit dem Demo-Admin angehakt) → Werte ändern → „Erinnerungen speichern“ → Erfolgsmeldung mit Fokus, Stand-Zeile „Angepasst am {heute} …“.
- Feldfehler: Staffel `30, 30` → „Jeder Wert nur einmal.“ unter der legend „Vorlauf vor der Fälligkeit“; Sifa 2 bei Verantwortliche 3 → Fehler am Feld Sifa; „Auswahl“ ohne Häkchen → Fehler unter der Radiogruppe. Bei 2 Fehlern erscheint die Fehlerübersicht mit Fokus.
- Ohne JavaScript: Speichern und Zurücksetzen funktionieren, die Checkboxlisten sind sichtbar. Mit `:has()`-Unterstützung ist die Liste bei „Alle aktiven“ ausgeblendet und erscheint bei „Auswahl“.
- Eskalationskette ab 768 px dreispaltig mit „→“ dazwischen (für Screenreader ausgeblendet), darunter senkrecht mit Linie. Jedes Feld hat ein vollständiges zugängliches Label („Sifa: ab Tag … nach Fälligkeit“).
- „Auf Standard zurücksetzen“ erscheint nur bei angepasster Einstellung, steht unter einer Linie mit eigener h2 und ist Sekundär; nach dem Klick Meldung „Auf Standard zurückgesetzt“ und Stand „Standard“.
- Unbekannte `bereichId` → 404. VER/SIF/PRF/MA → 404.

### FE-19 Benachrichtigungen und Abmeldeseite
**Designsystem:** §6.1 (öffentliche Kopfleiste `/abmelden`), §6.3 (48 px), §6.11, §8.20, §8.21, §10 E-9
**Dateien:**
- `src/app/einstellungen/benachrichtigungen/page.tsx`, `src/app/abmelden/page.tsx`
- neu `src/app/abmelden/not-found.tsx` (ungültiger Link, §8.21; öffentliche Kopfleiste ohne „Anmelden“)
- neu `src/components/BenachrichtigungKarte.tsx`, `AbmeldenForm.tsx`, `BereichsRegelnListe.tsx`
- `src/components/OeffentlicheKopfleiste.tsx`: optionale Prop, die den Link „Anmelden“ ausblendet (z. B. `anmeldenHref?: string | null`, `null` = kein Link). QR-Seite unverändert.

**Abnahme:**
- `/einstellungen/benachrichtigungen` je Demo-Rolle: VER/SIF/ADM sehen „Fristen-Erinnerung“ mit Schloss und `PFLICHTMAIL_BEGRUENDUNG`, ohne Button; PRF sieht „Wochenübersicht für Prüfer“, MA „Hinweis „Nicht verwenden““ jeweils mit Zustandszeile und Button. Abbestellen → Meldung „Abbestellt“ in der Karte, Fokus, Button wird „Wieder erhalten“ (Primär); zurück → „Wieder bestellt“.
- E-Mail-Adresse in Mono mit „Adresse ändern: über den Admin.“; Regeln der Bereiche nur bei VER (eigene Bereiche), SIF, ADM; PRF und MA ohne diesen Abschnitt.
- US-40: Abmeldelink aus der Mail-Vorschau öffnen (ohne Sitzung, privates Fenster) → Seite nach §8.21 mit „{artLabel} abbestellen“, Betrieb im Satz; **das Öffnen allein ändert nichts** (Einstellungsseite zeigt weiter „Sie erhalten diese Mails.“). „Abbestellen“ → Erfolg „Sie erhalten die {artLabel} von {Betrieb} nicht mehr.“ mit Fokus und Sekundär „Wieder erhalten“.
- Manipulierter Token → 404-Seite „Dieser Link ist nicht gültig.“ mit Leer-Plakette „!“ und „Anmelden“ → `/login?next=/einstellungen/benachrichtigungen`.
- `/abmelden` enthält keinen Namen und keine E-Mail-Adresse (HTML-Quelltext prüfen), Kopfleiste ohne „Anmelden“, `noindex`.
- Alle Buttons auf beiden Seiten 48 px; ohne JavaScript nutzbar.

### FE-20 Versandprotokoll `/erinnerungen/protokoll`
**Designsystem:** §6.7, §6.9, §6.12, §6.23, §8.22, §10 E-10
**Dateien:** `src/app/erinnerungen/protokoll/page.tsx`, neu `src/components/ProtokollFilterLeiste.tsx`, `ProtokollTabelle.tsx`, `VersandStatusBadge.tsx`
**Abnahme:**
- US-41 in der Demo (Seed BE-25): Zeile `frist_digest` an VER Lager „✓ Zugestellt“ mit „Posten anzeigen (2)“; Zeile `pruefer_woche` an den Prüfer „✕ Nicht zustellbar – E-Mail-Adresse prüfen“ **mit** Namen; Zeile `ma_hinweis` „Mitarbeiter/in“ ohne Namen, ohne Posten, Spalte Posten „–“.
- `VersandStatusBadge` für alle sieben Status mit Symbol und Text nach §6.23 (Test oder Demo-Seite in der Entwicklung); `fehler` zeigt darunter den Text aus `MAIL_FEHLER_LABEL` und „{n} Versuche“ bei mehr als einem Versuch.
- Filter „Probleme“ → nur die Bounce-Zeile; Chip „Status: Probleme ✕“ entfernt genau diesen Parameter. Ungültige URL-Werte → Defaults ohne Fehlerseite.
- Ab 1024 px Tabelle mit `<tbody>` je Mail und Disclosure-Zeile über alle Spalten; Posten als Untertabelle mit Gerät/Inventarnummer, Bereich, Prüfung, Erinnerung (`stufeLabel`), Fällig am, Rolle. Darunter Karten. Disclosure ohne JavaScript bedienbar.
- „Letzter Erinnerungslauf …“ für `fertig`, `fehler`, `laeuft` und `null` nach §8.22.
- Leerzustände: „Keine Zustellprobleme.“ (moss-Plakette mit ✓) bzw. „Keine Mails in diesem Zeitraum.“ mit „Filter zurücksetzen“.
- Paginierung erscheint nur bei > 50 Mails und behält die Filter.
- VER, PRF, MA → 404. Für SIF keine Tab-Zeile (§6.26).

### FE-21 Mail-Vorschau `/admin/mails`
**Designsystem:** §6.11 (Hinweis Vorschau), §6.13, §6.26, §7, §8.23
**Dateien:** `src/app/admin/mails/page.tsx`, neu `src/components/MailVorschauListe.tsx`, `MailVorschauRahmen.tsx`, `ErinnerungslaufForm.tsx` (importiert `ErinnerungenNav`, `VersandStatusBadge` nur falls benötigt)
**Abnahme:**
- US-42 (Vorschau-Teil): Lauf mit Datum Mo 30.11.2026 → Erfolgsmeldung mit dem Text der Action; Liste zeigt Mails für VER, SIF, ADM (falls eskaliert), Prüfer und Jonas, neueste oben; erneuter Lauf → „Keine neuen Mails (bereits erinnert).“
- Auswahl per `?mail=` setzt `aria-current` in der Liste; Kopfzeilen-`dl` zeigt An, Betreff, Art, List-Unsubscribe als Text bzw. „keine (Pflichtmail)“.
- HTML im `<iframe sandbox="">` (ohne `allow-scripts`, ohne `allow-same-origin`) mit `title`; Text in `<pre>` bei 76ch ohne Zeilenumbruch der 72-Zeichen-Zeilen. Umschalter HTML/Text funktioniert ohne JavaScript.
- Hinweis „Nur Vorschau – nichts wird versendet.“ steht immer oben; Datumsfeld nur im Demo-Modus.
- Ab 1280 px Liste (22 rem) links und Vorschau rechts, darunter untereinander; bei 360 px kein seitenweites horizontales Scrollen (die Iframe-Fläche scrollt selbst).
- Leerzustand „Noch keine Mails in der Vorschau.“
- Gemeinsam mit dem designer: Abnahme D-I3a an den echten Vorschau-Mails (siehe oben).

### Offene Abhängigkeiten I3
- **backend-dev:** BE-24 nach `mail-vorlagen.md`, inklusive Abnahme §10 dort. Fragen zur Gestaltung an den designer, nicht still abweichen.
- **requirements-engineer:** im Backlog nachziehen: (1) `mail-vorlagen.md` §11 (Textlink statt Link-Button je Posten, Betreff mit „nicht verwenden“ und „Eskalation – “, „Prüfart/Prüfarten“, Betriebsname kürzen); (2) FE-18 mit einem Navigationspunkt und `ErinnerungenNav` statt drei Hauptpunkten (§10 E-8), Aufteilung FE-18a/FE-18b, neue Datei `EmpfaengerWahl.tsx`; (3) FE-19 zusätzlich `src/app/abmelden/not-found.tsx` und die Prop an `OeffentlicheKopfleiste.tsx`; (4) Anhang A in `mail-vorlagen.md` (deutsche Vorlagen für Einladung und Passwort-Reset in Supabase Auth) als eigenes kleines Paket nach I3 entscheiden.
- **Max:** §9.8 zur Kenntnis (Text-Plakette in Mails ohne Monatssegmente). §9.7 (Etikett) bleibt offen.
- **Gate G-6:** manuelle Mail-Client-Prüfung nach `mail-vorlagen.md` §10 (Classic und neues Outlook, Outlook.com, Gmail Web/Android/iOS, Apple Mail iOS, GMX, WEB.DE, Thunderbird; hell und dunkel).

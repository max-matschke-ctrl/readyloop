# Umsetzung des Designsystems – Pakete für frontend-dev (Stand 20.11.2026)

Grundlage: `designsystem.md` (Paragrafen in Klammern), `skills-empfehlung.md`.
Jedes Paket ist für **einen** Lauf geschnitten. Reihenfolge: P1 → P2 → P3a → (P3b) → P4a → P4b → P4c → P5a → P5b → P5c → P6 → P7a/P7b/P7c.
P7a, P7b und P7c haben keine gemeinsamen Dateien und dürfen parallel laufen. Alle anderen Pakete laufen nacheinander.

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

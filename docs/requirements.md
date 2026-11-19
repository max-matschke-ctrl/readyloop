# Anforderungen Readyloop – Pilot Mittelstand

Stand 19.11.2026 (Planung Inkrement 2) · Quellen: `docs/context/projektstand.md`, `docs/research/recherche-anforderungen.md` · Backlog: `docs/backlog.md`

## 1. Rahmen

- Pilot: ein Mittelständler (20–500 Beschäftigte), ein Rechtsträger, ein Standort, mehrere Bereiche (z. B. Lager, Produktion, Verwaltung).
- Kern: Fristen je **Gerät × Prüfart**, nie je Gerät. Ein Gerät hat 1..n Prüfarten.
- Frist wirkt erst nach Freigabe durch Verantwortlichen oder Sifa. Vorschläge kommen nur aus freigegebenen Katalogeinträgen oder aus der Herstellerangabe. Sonst: „Frist über GBU festlegen“.
- Katalogeinträge im Repo haben Status `entwurf`, bis ein Sicherheitsingenieur sie freigibt (Name, Datum, Version). Die Regel-Engine ignoriert Entwürfe für Vorschläge; die UI zeigt sie nur als Orientierung, klar als Entwurf gekennzeichnet.
- Unbekannte Prüfdaten werden nicht geschätzt. Jedes Prüfdatum trägt seine Herkunft.
- MVP-Ausschlüsse aus dem Projektstand bleiben: Sperren, Prüfdienstleister-Vorschlag/Terminbuchung, mehrere Standorte (Funktion), UHF/Bluetooth, SAP, Steuerberater-Export, Push, KI für Nachweise.

## 2. Priorisierung (alle Anforderungen der Recherche)

Regel: Must = Gewicht 5, rechtlich zwingend oder Kern des Pilots. Gewichte unverändert übernommen; Abweichungen von „Gewicht → MoSCoW“ in Spalte Begründung. Inkrement (I1–I7) siehe `docs/backlog.md`.

| ID | Anforderung (kurz) | Gew. | MoSCoW | Inkr. | Begründung / Abweichung |
|---|---|---|---|---|---|
| R-01 | Nachweis mit Pflichtfeldern § 14 Abs. 7 | 5 | Must | I1 | |
| R-02 | Nachweise nicht löschbar, Nachfrist einstellbar | 5 | Must | I1 / I4 | I1: keine Löschfunktion, keine Delete-Policy. Nachfrist-Einstellung I4 |
| R-03 | Nachweis am Einsatzort per QR/NFC ohne Login | 5 | Must | I5 | |
| R-04 | Frist mit Fundstelle, Stufe, Freigabe, Katalogversion | 5 | Must | I1 | |
| R-05 | Mehrere Prüfarten je Gerät | 5 | Must | I1 | |
| R-06 | Frist nach Prüfergebnis neu festlegen | 4 | Must | I2 | rechtlich zwingend (§ 14 Abs. 2 BetrSichV). I1 erlaubt Neufestlegung jederzeit über „Frist freigeben“. I2: Bezug auf Nachweis, Prüfer-Empfehlung, Richtung (F-13) |
| R-07 | Anlassbezogene Prüfungen | 4 | Must | I2 | rechtlich zwingend (§ 14 Abs. 1, 3 BetrSichV). F-10 |
| R-08 | Frist ab tatsächlichem Prüfdatum; außer Betrieb → vor Nutzung prüfen | 4 | Must | I1 / I2 | Kern der Regel-Engine (I1). „Außer Betrieb“-Logik I2 (F-11) |
| R-09 | „Überfällig, nicht verwenden“ deutlich anzeigen | 4 | Must | I1 / I2 / I5 | Kern des Pilots. I1 Büro-Ampel, I2 Status „vor Nutzung prüfen“, I5 Mitarbeiter-App und QR |
| R-10 | Prüferqualifikation + Warnung bei Typ-Konflikt | 4 | Should | I2 | Pflicht ist die Befähigung, nicht ihre Hinterlegung in Software. I2: Typen je Prüfer-Mitgliedschaft, nur Warnung (F-15); Gültigkeit/Nachweisdokument später |
| R-11 | Verweis auf GBU je Frist | 3 | Should | I1 (Teil) / I2 | I1: GBU-Frist verlangt Fundstelle. I2: Titel + https-Link je Prüfart, kein Upload (F-18, Q-21) |
| R-12 | Mängel als eigene Objekte | 5 | Must | I2 | F-14 |
| R-13 | Überwachungsbedürftige Anlagen als eigene Klasse | 3 | Should | I7 | |
| R-14 | Kontrollen (arbeitstäglich/wöchentlich) | 3 | Could | I7 | |
| R-15 | Elektro-Messwerte, Fehlerquote | 3 | Could | I7 | |
| R-16 | Fälligkeitsübersicht, Vorlauf 90/60/30 | 5 | Must | I1 / I3 | I1: Übersicht mit festem Vorlauf 30 Tage. Staffel 90/60/30 I3 |
| R-17 | Eskalationskette per E-Mail | 5 | Must | I3 | |
| R-18 | Geräteakte | 5 | Must | I1 / I2 / I4 | I1 Stammdaten, Herstellerfrist, Historie. I2 Mängel, Anlässe, Betriebsstatus. Betriebsanleitung-Upload von I2 nach I4 verschoben (nicht im I2-Umfang; Upload-Strecke entsteht dort mit dem Import) |
| R-19 | „Prüfdatum unbekannt“, Datum mit Herkunft | 4 | Must | I1 | Projektstand: nicht verhandelbar |
| R-20 | QR/NFC-Etiketten, Prüfplakette drucken | 4 | Must | I5 | MVP-Entscheidung (NFC + QR für wechselnde Geräte) |
| R-21 | Offline-Erfassung | 4 | Should | I5 | |
| R-22 | Organisationsstruktur, Geräte verschiebbar | 5 | Must | I1 / I2 | Abweichung: Ebene Gebäude/Kostenstelle entfällt im Pilot (ein Standort; Bereich reicht). Standort-Tabelle ab I1. Verschieben mit Historie I2 |
| R-23 | Bereichsbezogene Rollen und Rechte | 5 | Must | I1 | |
| R-24 | Unveränderlicher Audit-Trail | 5 | Must | I1 / I2 | I1: Ereignisse geraet_angelegt, frist_freigegeben, nachweis_erfasst; I2: alle Typen aus F-19 |
| R-25 | Export BG/Behörde | 5 | Must | I4 | |
| R-26 | ISO-Audit-Berichte | 4 | Should | I7 | |
| R-27 | Excel/CSV-Import | 5 | Must | I4 | |
| R-28 | Externe Prüfdienstleister: Konto über mehrere Betriebe, Aufträge, Sammelupload | 5 | Must | I1 / I2 / I6 | I1: Prüfer-Ansicht, Mitgliedschaft je Betrieb im Datenmodell. I2: Einladen, Zuweisen, Betriebswechsel (F-8, F-15, F-17). Aufträge/Sammelupload I6 |
| R-29 | Import aus Prüfgeräte-Software | 4 | Should | I6 | |
| R-30 | Mehrere Standorte | 4 | Won't (Pilot) | – | MVP-Ausschluss. Datenmodell enthält Standort ab I1 |
| R-31 | BG-Zuständigkeit je Rechtsträger | 3 | Must (Teil) | I1 | Abweichung nach oben: Projektstand verlangt BG je Betrieb (UVV gelten je BG). Mehrere Rechtsträger: Won't |
| R-32 | SSO | 3 | Won't (Pilot) | – | Projektstand: „später SSO“ |
| R-33 | REST-API, CSV-Export | 3 | Could | I7 | |
| R-34 | SAP/ERP-Schnittstelle | 2 | Won't | – | MVP-Ausschluss |
| R-35 | Bedienerqualifikation | 2 | Won't | – | |
| R-36 | Unterweisung, Vorsorge | 1 | Won't | – | Gesundheitsdaten, anderes Produktfeld |
| R-37 | Prüfkosten | 2 | Won't | – | |
| R-38 | Mitarbeiter-App (PWA) | 4 | Must | I5 | MVP-Entscheidung: drei Zugänge |
| R-39 | Preise, Self-Service-Test | 3 | Could | – | Vertrieb, nicht Pilot |
| R-40 | Vorbefüllter Katalog, fachlich freigegeben | 5 | Must | I1 + Gate | I1: 17 Einträge als Entwurf. Freigabe = Pilot-Gate |
| R-41 | Mehrsprachige Mitarbeiter-App | 2 | Could | I7 | |
| R-42 | AVV, TOM, Unterauftragsverarbeiter | 5 | Must | Gate | organisatorisch, vor erstem echten Datensatz |
| R-43 | EU-Hosting, KI ohne Personennamen | 4 | Must | I1 / I6 | CLAUDE.md: nicht verhandelbar. I1: Supabase-Region EU. KI-Adapter I6 |
| R-44 | Betriebsrats-Paket | 4 | Must | Gate (vor I5-Pilotnutzung) | Projektstand: Betriebsrat vor Pilot |
| R-45 | Keine Leistungsauswertung je Mitarbeiter, Löschkonzept | 4 | Should | ab I1 (Designregel) / I5 | Designregel gilt ab I1: keine Auswertung je Person |

Ergänzende Anforderungen aus Projektstand und Vorgaben dieser Runde:

| ID | Anforderung | MoSCoW | Inkr. |
|---|---|---|---|
| P-01 | Deterministische Regel-Engine: Frist aus Katalogeintrag × Einsatzort × letzte Prüfung | Must | I1 |
| P-02 | Kürzere Herstellerfrist hat Vorrang vor Katalogfrist | Must | I1 |
| P-03 | Frist erst nach Freigabe wirksam (Verantwortlicher, Sifa) | Must | I1 |
| P-04 | Status-Ampel ok / bald fällig / überfällig / unbekannt / „Frist über GBU festlegen“ + Prüfplaketten-Badge | Must | I1 |
| P-05 | Demo-Modus ohne Datenbank (In-Memory, Rollenwahl per Cookie), `npm run build` ohne Umgebungsvariablen | Must | I1 |
| P-06 | Frontend greift nur über `src/server/data.ts` und `src/server/actions.ts` auf Daten zu (reine Domänenfunktionen aus `src/domain` sind erlaubt) | Must | I1 |
| P-07 | Supabase-Betrieb: Repository gegen Supabase mit gleicher Schnittstelle wie Demo, Login E-Mail/Passwort, RLS als zweite Verteidigungslinie | Must | I2 |
| P-08 | Demo-Schutz: Demo in Produktion nur mit `READYLOOP_DEMO=1` (Q-9) | Must | I2 |

## 3. Fachregeln Regel-Engine (verbindlich für I1)

Datumswerte sind Kalendertage `YYYY-MM-DD`; „heute“ = aktuelles Datum in Europe/Berlin.

**F-1 Einsatzort.** Wirksamer Einsatzort = Override am Gerät, sonst Einsatzort des Bereichs.

**F-2 Katalogwahl.** Kandidaten: Einträge mit gleichem `schluessel` (Prüfart) und Status `freigegeben`; je (`schluessel`, `einsatzort`) nur die höchste Version. Eintrag mit exakt passendem Einsatzort schlägt Eintrag mit `einsatzort = null`. Bleiben mehrere, gilt der mit dem kürzesten Intervall.

**F-3 Vorschlag.**
1. Herstellerfrist vorhanden und (kein freigegebener Eintrag oder Eintrag ohne Intervall oder Herstellerfrist < Katalogintervall) → Vorschlag `hersteller`, Stufe C, verdrängter Eintrag wird referenziert.
2. Sonst freigegebener Eintrag mit Intervall → Vorschlag `katalog` mit Stufe, Fundstelle, Quelle-URL des Eintrags. Gleich lange Herstellerfrist ändert nichts.
3. Sonst → `gbu` mit Grund `ohne_intervall` (freigegebener Eintrag ohne Zahl), `nur_entwurf` (nur Entwurf vorhanden; Entwurf wird zur Orientierung mitgegeben) oder `kein_eintrag`.

**F-4 Freigabe.** Modus `vorschlag`: nur bei Vorschlag `katalog` oder `hersteller`; übernimmt Monate, Quelle, Stufe, Fundstelle, Katalog-ID und -Version als Snapshot. Modus `gbu`: Monate (ganzzahlig 1–120), Fundstelle (GBU-Verweis, ≥ 3 Zeichen) und Begründung (≥ 10 Zeichen) Pflicht; Quelle `gbu`, Stufe C. Abgelehnt wird eine GBU-Frist, die (a) eine freigegebene Stufe-A-Höchstfrist oder (b) eine hinterlegte Herstellerfrist überschreitet. Jede Freigabe speichert Freigebenden und Zeitpunkt und erzeugt ein Ereignis. Neufestlegung ist jederzeit möglich; die alte Frist bleibt im Verlauf.

**F-5 Status je Prüfart.**
- keine freigegebene Frist → `gbu` („Frist über GBU festlegen“)
- Frist, aber kein letztes Prüfdatum → `unbekannt` („Prüfdatum unbekannt → Prüfung veranlassen“)
- `faelligAm` = letzte Prüfung + Frist in Monaten (Monatsende-Klemme: 31.01. + 1 Monat = 28./29.02.)
- heute > `faelligAm` → `ueberfaellig`; 0 ≤ Resttage ≤ 30 → `bald_faellig`; sonst `ok`

**F-6 Gesamtstatus Gerät.** Schlechtester Status der Prüfarten in der Reihenfolge `ueberfaellig` > `unbekannt` > `gbu` > `bald_faellig` > `ok`. Gerät ohne Prüfart → `gbu`. Nächste Fälligkeit des Geräts = frühestes `faelligAm`.

**F-7 Nachweis.** Prüfdatum ≤ heute. Ergebnis `ohne_maengel` oder `maengel_weiterbetrieb` setzt die letzte Prüfung der Prüfart auf das Prüfdatum, wenn es neuer ist (Herkunft `nachweis`). Ergebnis `nicht_bestanden` ändert die letzte Prüfung nicht; die Prüfart zeigt den Hinweis „Weiterbetrieb nicht zulässig“ bis zu einem bestandenen Nachweis. (Ab I2 ergänzt durch F-12.)

## 3a. Fachregeln Inkrement 2

F-9 ersetzt die Reihenfolge in F-5 und die Rangfolge in F-6. Alle übrigen Regeln aus §3 gelten weiter.

**F-8 Betriebsmodus und Sitzung (Q-9).**
- `supabase`: `NEXT_PUBLIC_SUPABASE_URL` und `NEXT_PUBLIC_SUPABASE_ANON_KEY` gesetzt. `demo`: beide fehlen und (`NODE_ENV` ≠ `production` oder `READYLOOP_DEMO=1`). Sonst `unkonfiguriert` (auch, wenn nur eine der beiden Variablen gesetzt ist): keine Sitzung, Login zeigt „Readyloop ist nicht konfiguriert“. `npm run build` bleibt ohne Variablen grün.
- Supabase-Sitzung = angemeldeter Auth-Benutzer + aktive Mitgliedschaft. Organisation aus Cookie `rl_org`, wenn dort eine aktive Mitgliedschaft besteht, sonst die alphabetisch erste. Ohne aktive Mitgliedschaft → „Kein Zugang“. Das Demo-Cookie wird im Modus `supabase` ignoriert.
- Login mit E-Mail und Passwort; Fehlermeldung unterscheidet nicht zwischen unbekannter E-Mail und falschem Passwort. „Passwort vergessen“ antwortet immer gleich (keine Kontoaufzählung). Passwort mindestens 10 Zeichen.
- Der Service-Role-Schlüssel wird nur serverseitig und nur für Einladungen verwendet; Fachdaten laufen immer über den Benutzer-Client, damit RLS greift.

**F-9 Status je Prüfart und Gesamtstatus.** Die erste zutreffende Regel gilt:
1. Offener Anlass (F-10) → `vor_nutzung_pruefen`, Grund `anlass`.
2. Letzter Nachweis `nicht_bestanden` (F-12) → `vor_nutzung_pruefen`, Grund `nicht_bestanden`.
3. Keine freigegebene Frist → `gbu`.
4. Kein letztes Prüfdatum → `unbekannt`.
5. Heute > `faelligAm`: Gerät `ausser_betrieb` → `vor_nutzung_pruefen`, Grund `ausser_betrieb`; sonst `ueberfaellig`.
6. 0 ≤ Resttage ≤ 30 → `bald_faellig`; sonst `ok`.

`faelligAm` und Resttage werden berechnet, sobald Frist und Datum vorliegen, auch bei `vor_nutzung_pruefen`. Gesamtstatus: schlechtester in der Rangfolge `ueberfaellig` > `vor_nutzung_pruefen` > `unbekannt` > `gbu` > `bald_faellig` > `ok`. Ein offener Mangel der Schwere `gefaehrlich` am Gerät hebt den Gesamtstatus auf mindestens `vor_nutzung_pruefen` (Grund `gefaehrlicher_mangel`). In der Prüfer-Ansicht zählt `vor_nutzung_pruefen` zur Gruppe „fällig“. Text: „Vor Nutzung prüfen – nicht verwenden“, nie nur über Farbe.

**F-10 Anlassprüfung (R-07).** Arten: vor (Wieder-)Inbetriebnahme, prüfpflichtige Änderung/Instandsetzung, Unfall oder Schadensfall, längere Nichtbenutzung, Naturereignis, sonstiges außergewöhnliches Ereignis (§ 14 Abs. 1 und 3 BetrSichV). Ein Vorgang erfasst den Anlass für 1..n Prüfarten eines Geräts (je Prüfart ein Datensatz); Datum ≤ heute, Beschreibung Pflicht (≥ 5 Zeichen). Ein Anlass ist offen, bis (a) zur selben Prüfart ein Nachweis mit Ergebnis `ohne_maengel` oder `maengel_weiterbetrieb` vorliegt, dessen Prüfdatum nach dem Anlassdatum liegt oder – bei gleichem Datum – der nach dem Anlass erfasst wurde (Erfassungszeitpunkt Nachweis > Erfassungszeitpunkt Anlass; ein am Anlasstag zuvor erfasster Nachweis erledigt den Anlass nicht), oder (b) er mit Begründung (≥ 10 Zeichen) aufgehoben wird (Q-25); aufheben lässt sich nur ein offener Anlass, ein durch Nachweis erledigter nicht (Server und DB lehnen ab). Anlässe sind sonst unveränderlich. Der erledigende Nachweis schreibt die letzte Prüfung nach F-7 fort (Q-14).

**F-11 Außer Betrieb (R-08).** Betriebsstatus `in_betrieb` ↔ `ausser_betrieb`, Begründung optional, Ereignis. Außer Betrieb hemmt die Frist nicht; eine abgelaufene Frist zeigt `vor_nutzung_pruefen` statt `ueberfaellig` (und wird in I3 nicht eskaliert). Zurück auf `in_betrieb` mit abgelaufener Frist ergibt sofort `ueberfaellig`; die Oberfläche warnt vorher. `ausgemustert` ist in I2 nicht setzbar (I4, Q-20).

**F-12 Nicht bestanden (Q-6).** `nicht_bestanden` lässt die letzte Prüfung unverändert; die Frist startet erst mit einem bestandenen Nachweis (Nachprüfung) neu. Bis dahin `vor_nutzung_pruefen`. Nach einem Nachweis mit Ergebnis ≠ `ohne_maengel` wird die erfassende Person zur Mängelerfassung geführt (wenn sie `mangel.erfassen` darf); die Prüfart zeigt „Mängel aus Nachweis vom … noch nicht erfasst“, bis mindestens ein Mangel mit diesem Nachweis verknüpft ist. Erzwungen wird die Erfassung nicht.

**F-13 Frist nach Prüfergebnis (R-06).** Der Prüfer kann im Nachweis eine Frist empfehlen (1–120 Monate); die Empfehlung wirkt nie selbst. SIF oder VER legen die Frist nach F-4 neu fest und können dabei einen Nachweis derselben Prüfart referenzieren (`nachweisId`). Verkürzen und Verlängern laufen über Modus `gbu` (Begründung ≥ 10 Zeichen und Fundstelle/Grundlage ≥ 3 Zeichen Pflicht); Grenzen aus F-4 bleiben: nie über eine freigegebene Stufe-A-Höchstfrist, nie über die Herstellerfrist. Das Ereignis `frist_freigegeben` enthält `nachweisId` und `richtung` (`erstmalig`, `kuerzer`, `laenger`, `gleich`). Hinweis `empfehlung_abweichend`, wenn der letzte Nachweis eine Empfehlung ≠ aktuelle Frist enthält und danach keine Freigabe erfolgte (Freigabezeitpunkt < Erfassungszeitpunkt des Nachweises).

**F-14 Mängel (R-12).**
- Mangel gehört zu einem Gerät; Prüfart optional (Pflicht für Prüfer, die nur an zugewiesenen Prüfarten erfassen); optional aus einem Nachweis desselben Geräts (dann Prüfart des Nachweises).
- Pflicht: Beschreibung (≥ 5 Zeichen), Schwere (`gefaehrlich` – Weiterbetrieb nicht zulässig, `erheblich`, `gering`), Termin (≥ heute; Vorschlag heute / +30 / +90 Tage nach Schwere, Q-16). Verantwortlicher (Mitglied mit Rolle admin, sifa oder verantwortlicher) bei Erfassung durch SIF/VER; Prüfer setzen keinen Verantwortlichen.
- Status `offen` → `in_bearbeitung` (Kenntnisnahme: Verantwortlicher und Termin festlegen; Name und Zeitpunkt werden gestempelt) → `behoben` (Behebungsdatum ≤ heute und ≥ Erfassungsdatum, „behoben durch“ als Name oder Firma, Maßnahme; Erfasser der Behebung gestempelt). `offen` → `behoben` direkt ist erlaubt. Kein Rückweg, kein Löschen; Beschreibung, Schwere, Bezug sind nach Erfassung unveränderlich. Neuer Befund = neuer Mangel.
- Termin überschritten (nicht behoben, Termin < heute) wird markiert. Keine Auswertung je Person (R-45).

**F-15 Prüfer-Zuweisung und Qualifikation (R-10, R-28, Q-7).** Zuweisung je Prüfart an ein aktives Mitglied mit Rolle `pruefer` derselben Organisation oder Entfernen der Zuweisung; ADM für alle Bereiche, VER für eigene Bereiche. Prüfer-Mitgliedschaften tragen Qualifikationstypen (`PRUEFER_TYPEN`). Fordert der passende Katalogeintrag (freigegeben oder Entwurf) Typen und hat der Prüfer keinen davon, erscheint eine Warnung mit geforderten und hinterlegten Typen – bei der Zuweisung und auf der Prüfart. Ohne Katalogeintrag keine Warnung. Die Warnung blockiert nicht (Q-22).

**F-16 Gerät verschieben (R-22).** ADM in jeden Bereich der Organisation; VER nur von einem eigenen in einen eigenen Bereich. Frist-Snapshot, Nachweise, Mängel, Anlässe und Prüfer-Zuweisungen bleiben. Ergibt der wirksame Einsatzort danach (oder nach Änderung des Bereichs-Einsatzorts) einen freigegebenen Vorschlag (`katalog`/`hersteller`) mit weniger Monaten als die aktuelle Frist, zeigt die Prüfart den Hinweis „Kürzere Frist für neuen Einsatzort vorgeschlagen – Frist prüfen“ (`kuerzerer_vorschlag`). Ereignis mit Quell- und Zielbereich.

**F-17 Verwaltung (Bereiche, Mitglieder).**
- Bereiche: ADM legt an und ändert Name und Einsatzort; kein Löschen.
- Einladen: E-Mail, Name, Rolle (`admin`, `sifa`, `verantwortlicher`, `pruefer`; `mitarbeiter` ab I5). VER braucht ≥ 1 Bereich; Bereiche nur bei VER, Qualifikationstypen nur bei Prüfern gespeichert. Unbekannte E-Mail → Einladungs-Mail mit Link zum Passwort-Setzen; bekannte E-Mail (z. B. Prüfer anderer Betriebe) → nur Mitgliedschaft, keine Mail (Q-23). Je Organisation und Benutzer höchstens eine Mitgliedschaft.
- Ändern: Name, Rolle, Bereiche, Qualifikationstypen, aktiv. Deaktivieren statt Löschen; deaktivierte Mitglieder haben keinen Zugriff, bleiben in Verlauf und Nachweisen sichtbar und sind nicht mehr zuweisbar. Der letzte aktive Admin kann weder deaktiviert noch herabgestuft werden; die eigene Mitgliedschaft kann man nicht deaktivieren und nicht in der Rolle ändern.
- Prüfer mit mehreren Betrieben wechseln die Organisation ohne Neuanmeldung (F-8).

**F-18 GBU-Verweis (R-11).** Je Prüfart optional ein Verweis: Titel (≤ 200 Zeichen, Pflicht wenn gesetzt) und optional ein https-Link. Kein Upload in I2. Setzen, Ändern, Entfernen durch SIF und VER (Bereich) mit Recht `frist.freigeben`; Ereignis mit alt/neu. Anzeige in der Geräteakte, ab I4 im Export.

**F-19 Ereignisse I2 (R-24).** Supabase: ausschließlich per Trigger; Demo: durch die Dienste; gleiche `daten`-Struktur.

| Typ | geraetId | daten |
|---|---|---|
| `frist_freigegeben` (erweitert) | ✓ | wie I1 + `nachweisId`, `richtung` |
| `pruefer_zugewiesen` | ✓ | `pruefartId`, `pruefart`, `alt`, `neu`, `neuName` |
| `gbu_dokument_gesetzt` | ✓ | `pruefartId`, `pruefart`, `alt`, `neu` (GbuDokument oder null) |
| `geraet_verschoben` | ✓ | `vonBereichId`, `vonBereich`, `nachBereichId`, `nachBereich`, `begruendung` |
| `betriebsstatus_geaendert` | ✓ | `alt`, `neu`, `begruendung` |
| `anlass_erfasst` | ✓ | `anlassId`, `pruefartId`, `pruefart`, `art`, `datum` |
| `anlass_aufgehoben` | ✓ | `anlassId`, `pruefartId`, `grund` |
| `mangel_erfasst` | ✓ | `mangelId`, `pruefartId`, `nachweisId`, `schwere`, `termin` |
| `mangel_kenntnis` | ✓ | `mangelId`, `verantwortlichId`, `verantwortlichName`, `terminAlt`, `terminNeu` |
| `mangel_behoben` | ✓ | `mangelId`, `behobenAm`, `behobenDurch` |
| `bereich_gespeichert` | null | `bereichId`, `name`, `einsatzortAlt`, `einsatzort` |
| `mitglied_gespeichert` | null | `mitgliedschaftId`, `name`, `rolle`, `bereichIds`, `aktiv`, `eingeladen` |

## 4. User Stories (Must und Should)

Rollen: ADM Admin · SIF Sifa · VER Verantwortlicher · PRF Prüfer · MA Mitarbeiter.

**US-01 Fälligkeitsübersicht (R-16, R-09, P-04, R-23)** – Als VER will ich alle Geräte meiner Bereiche mit Ampel sehen, damit ich keine Frist verpasse.
- G: VER für Lager. W: Geräteliste öffnen. T: nur Geräte aus Lager; je Gerät Gesamtstatus (F-6), nächste Fälligkeit, Prüfplakette.
- G: Liste. W: Filter Bereich = Produktion und Status = überfällig. T: nur passende Geräte; Filter steht in der URL.
- G: SIF oder ADM. W: Liste öffnen. T: alle Bereiche sichtbar.

**US-02 Geräteakte (R-18, R-05, R-04, R-24)** – Als VER will ich je Gerät alle Prüfarten mit Frist, Quelle, Stufe und Verlauf sehen, damit ich bei der BG Auskunft geben kann.
- G: Gerät mit zwei Prüfarten. W: Detail öffnen. T: je Prüfart Status, fällig am, Frist in Monaten, Quelle (Katalog/Hersteller/GBU), Stufe A–D mit Erläuterung, Fundstelle, Freigabe (Name, Datum) oder „nicht freigegeben“.
- G: Prüfart mit Katalogentwurf. W: Detail öffnen. T: Entwurf ist als „Entwurf – nicht fachlich freigegeben“ gekennzeichnet und erzeugt keinen Status außer `gbu`.
- G: Gerät. W: Detail öffnen. T: Verlauf zeigt Ereignisse und Nachweise absteigend nach Zeit.

**US-03 Gerät anlegen (R-18, R-19, R-05, R-22)** – Als VER will ich ein Gerät mit Prüfarten anlegen, damit seine Fristen überwacht werden.
- G: VER Lager. W: Gerät in Bereich Lager mit Gruppe „Regal“ anlegen. T: Prüfarten der Gruppe aus dem Katalog vorbelegt, abwählbar; freie Prüfart ergänzbar.
- G: Formular. W: letzte Prüfung leer. T: Herkunft wird `unbekannt`; ein Datum ohne Herkunft `pruefbericht` oder `plakette` wird abgelehnt.
- G: VER Lager. W: Bereich Produktion wählen. T: Bereich nicht auswählbar; serverseitig abgelehnt.
- G: Speichern erfolgreich. T: Ereignis `geraet_angelegt`; Weiterleitung zur Geräteakte.

**US-04 Frist freigeben (R-04, P-01–P-03, R-11)** – Als SIF oder VER will ich einen Fristvorschlag freigeben oder eine GBU-Frist festlegen, damit die Frist nachvollziehbar wirkt.
- G: Vorschlag `katalog` 12 Monate Stufe B. W: „Vorschlag freigeben“. T: Frist 12 Monate, Snapshot von Fundstelle, Stufe, Katalogversion; Freigebender und Zeitpunkt gespeichert; Ereignis `frist_freigegeben`.
- G: Vorschlag `gbu`. W: GBU-Frist 12 Monate mit Fundstelle und Begründung. T: Quelle GBU, Stufe C.
- G: Herstellerfrist 6 Monate. W: GBU-Frist 12 Monate. T: abgelehnt mit Hinweis auf Herstellerfrist.
- G: ADM oder PRF. T: keine Freigabe-Aktion sichtbar; Server lehnt ab.

**US-05 Nachweis erfassen (R-01, R-02, R-28, F-7)** – Als PRF will ich meine zugewiesenen fälligen Prüfungen sehen und einen Nachweis hochladen, damit der Betrieb den Nachweis hat.
- G: PRF mit drei zugewiesenen Prüfarten. W: Prüfer-Ansicht. T: nur diese drei; Gruppe „fällig oder ohne Termin“ (überfällig, unbekannt, gbu, bald fällig) vor „später“.
- G: Formular. W: Datum, Ergebnis, Prüfumfang, Prüfername, PDF (≤ 10 MB, application/pdf) und Bestätigung „PDF enthält Unterschrift“. T: Nachweis gespeichert mit SHA-256 des PDF; Status nach F-7 neu; Ereignis `nachweis_erfasst`.
- G: Prüfart nicht zugewiesen. W: Formular-URL direkt aufrufen. T: 404.
- G: Nachweis vorhanden. T: es gibt keine Lösch- oder Bearbeitungsfunktion.
- VER darf für seine Bereiche ebenfalls Nachweise erfassen (Altbestand, Eigenprüfung).

**US-06 Prüfdatum unbekannt (R-19)** – Als SIF will ich Geräte ohne bekanntes Prüfdatum erkennen, damit ich die Prüfung veranlasse.
- G: Frist freigegeben, letzte Prüfung unbekannt. T: Status „Prüfdatum unbekannt → Prüfung veranlassen“; kein berechnetes Fälligkeitsdatum.

**US-07 Rechte (R-23, R-24)** – Als ADM will ich, dass jede Rolle nur ihre Daten sieht.
- G: jede Tabelle mit Betriebsbezug. T: RLS aktiv; Zugriff nur für Mitglieder der Organisation, zusätzlich Bereichs- bzw. Zuweisungsfilter laut Rechte-Matrix (§ 6).
- G: Ereignis- und Nachweistabelle. T: kein UPDATE/DELETE für Clients.

**US-08 Demo (P-05, P-06)** – Als Max will ich die App ohne Datenbank vorführen.
- G: keine Supabase-Umgebungsvariablen. W: `npm run build`, `npm run dev`. T: Build grün; Login zeigt Rollenwahl (Admin, Sifa, Verantwortlicher, Prüfer); Banner „Demo – keine echten Daten“ auf jeder Seite.
- G: Demo. W: Rolle wählen. T: Cookie gesetzt; ADM/SIF/VER → Geräteliste, PRF → Prüfer-Ansicht; ca. 20 Geräte mit allen fünf Status.

**US-09 Mehrere Prüfarten (R-05)** – Als SIF will ich je Prüfart eine eigene Frist, damit Kettenprüfung (12 Monate) und Rissprüfung (36 Monate) getrennt laufen.
- G: Gerät mit zwei Prüfarten. W: Nachweis zu Prüfart 1. T: nur Prüfart 1 ändert Status.

**US-10 Mängel (R-12, F-14, I2)** – Als VER will ich Mängel aus Prüfungen mit Schwere, Termin und Behebung verfolgen, damit kein Befund liegen bleibt.
- G: PRF erfasst Nachweis mit Ergebnis `maengel_weiterbetrieb`. W: Speichern. T: Weiterleitung zum Mängelformular mit Gerät, Prüfart und Nachweis vorbelegt; ohne Verantwortlichen-Feld.
- G: Mängelformular als VER. W: Schwere „erheblich“ wählen. T: Termin auf heute + 30 Tage vorbelegt; Termin in der Vergangenheit wird abgelehnt.
- G: Mangel offen. W: VER nimmt Kenntnis mit Verantwortlichem und Termin. T: Status „in Bearbeitung“, Name und Zeitpunkt der Kenntnisnahme gespeichert; Ereignis `mangel_kenntnis`.
- G: Mangel in Bearbeitung. W: Behebung mit Datum, „behoben durch“ und Maßnahme. T: Status „behoben“; erneutes Beheben oder Zurücksetzen nicht möglich; Ereignis `mangel_behoben`.
- G: zwei offene Mängel im Lager, einer in Produktion. W: VER Lager öffnet `/maengel`. T: nur die zwei Lager-Mängel; Termin überschrittene rot markiert; keine Auswertung je Person.
- G: offener gefährlicher Mangel. W: Geräteliste. T: Gesamtstatus „Vor Nutzung prüfen – nicht verwenden“; Spalte Mängel zeigt Anzahl.
- G: Nachweis `nicht_bestanden` ohne verknüpften Mangel. T: Prüfart zeigt „Mängel aus Nachweis vom … noch nicht erfasst“.

**US-11 Frist nach Ergebnis (R-06, F-13, I2)** – Als SIF will ich nach einer Prüfung die Frist verkürzen oder verlängern, damit die Frist zum tatsächlichen Zustand passt.
- G: Nachweis mit Empfehlung 6 Monate, Frist 12 Monate. W: Geräteakte öffnen. T: Hinweis „Prüfer empfiehlt 6 Monate“ mit Button, der das GBU-Formular mit 6 Monaten und Nachweisbezug vorbelegt.
- G: Frist 12. W: GBU-Frist 6 mit Begründung und Fundstelle. T: Frist 6, Ereignis mit `richtung = kuerzer` und `nachweisId`; Hinweis verschwindet.
- G: freigegebener Stufe-A-Eintrag 12 Monate. W: Verlängerung auf 18. T: abgelehnt; Frist unverändert.
- G: Nachweis einer anderen Prüfart. W: als `nachweisId` übergeben. T: abgelehnt.
- G: PRF. T: kann nur empfehlen, keine Frist festlegen.

**US-12 Anlassprüfung (R-07, F-10, I2)** – Als VER will ich einen Anlass erfassen, damit das Gerät vor der nächsten Nutzung geprüft wird.
- G: Gerät mit zwei Prüfarten, Status ok. W: Anlass „Unfall oder Schadensfall“ für Prüfart 1 mit Beschreibung. T: Prüfart 1 „Vor Nutzung prüfen“ (Grund Anlassprüfung), Prüfart 2 unverändert; Ereignis `anlass_erfasst`.
- G: offener Anlass vom 10.11. W: Nachweis `ohne_maengel` mit Prüfdatum 10.11. T: Anlass erledigt, Status nach F-9.
- G: offener Anlass. W: Nachweis `nicht_bestanden`. T: weiter „Vor Nutzung prüfen“.
- G: versehentlich erfasster Anlass. W: Aufheben mit Begründung ≥ 10 Zeichen. T: Anlass nicht mehr offen, Begründung und Name im Verlauf.
- G: ADM oder PRF. T: keine Anlass-Aktion; Server lehnt ab.

**US-13 Außer Betrieb (R-08, F-11, I2)** – Als VER will ich ein Gerät außer Betrieb setzen, damit eine abgelaufene Frist nicht als Versäumnis zählt.
- G: Gerät außer Betrieb, Frist seit 10 Tagen abgelaufen. T: Status „Vor Nutzung prüfen“ (Grund außer Betrieb) statt „überfällig“.
- G: dieses Gerät. W: zurück „in Betrieb“. T: Warnung vor dem Speichern; danach „Überfällig – nicht verwenden“; Ereignis `betriebsstatus_geaendert`.
- G: Formular. W: „ausgemustert“ per Request. T: abgelehnt.

**US-14 Erinnerung und Eskalation (R-16, R-17, I3)** – Als VER will ich E-Mails 90/60/30 Tage vorher; bei Überfälligkeit Eskalation an SIF, danach Geschäftsführung.
- G: Regel je Bereich. W: Fälligkeit erreicht. T: genau eine Mail je Stufe und Prüfart; Versand protokolliert.

**US-15 Export (R-25, I4)** – Als SIF will ich zum Stichtag den Prüfstatus aller Geräte, offene Mängel und Nachweise als Excel/PDF/ZIP.
- T: Export enthält je Prüfart Frist, Quelle, Stufe, Fundstelle, letzte Prüfung mit Herkunft.

**US-16 Excel-Import (R-27, I4)** – Als VER will ich meine Excel-Liste importieren.
- T: Spaltenzuordnung, Vorschau, Dublettenprüfung (Inventarnummer), Fehlerliste; nichts wird ohne Bestätigung gespeichert; Prüfdaten ohne Herkunft → `unbekannt`.

**US-17 Mitarbeiter-App (R-38, R-09, R-21, R-45, I5)** – Als MA will ich meine Geräte sehen, übernehmen und Mängel melden.
- T: überfällige Geräte deutlich „nicht verwenden“; offline lesbar; keine Auswertung je Person.

**US-18 Nachweis am Einsatzort (R-03, R-20, I5)** – Als Kontrolleur vor Ort will ich per QR/NFC ohne Login den letzten Prüfstatus sehen.
- T: Seite zeigt Gerät, letzte Prüfung, Ergebnis, nächste Fälligkeit, Status; keine Personennamen außer Prüfername; Token nicht erratbar (≥ 128 Bit).

**US-19 Prüfdienstleister (R-28, R-29, I2/I6)** – Als PRF will ich über mehrere Betriebe ein Konto, Aufträge mit Geräteliste und Sammelupload.
- T: Betriebswechsel ohne Neuanmeldung; Zuordnung Sammelupload über Inventarnummer mit Bestätigung.

**US-20 KI-Import (R-43, I6)** – Als VER will ich Excel/PDF/Typenschild-Foto per KI vorerfassen.
- T: Aufruf nur serverseitig über Adapter; Personennamen vor Übermittlung entfernt; jeder Datensatz vom Menschen bestätigt; KI erzeugt keine Fristen.

**US-21 Prüferqualifikation (R-10, F-15, Should, I2)** – Als VER will ich gewarnt werden, wenn ich einen Prüfer ohne passende Qualifikation zuweise.
- G: Prüfer mit Typen Elektrofachkraft, Sachkundiger; Prüfart Kran (Katalog: zbp). W: Zuweisung wählen. T: Warnung „gefordert: Zur Prüfung befähigte Person; hinterlegt: Elektrofachkraft, Sachkundiger“; Speichern bleibt möglich; Warnung danach auf der Prüfart.
- G: freie Prüfart ohne Katalogeintrag. T: keine Warnung.

**US-22 GBU-Verweis (R-11, F-18, Should, I2)** – Als SIF will ich je Prüfart auf die Gefährdungsbeurteilung verweisen, damit die Grundlage der Frist auffindbar ist.
- G: Prüfart. W: Titel „GBU Lager 2025, Abschn. 3“ und Link `https://…`. T: in der Geräteakte sichtbar, Link öffnet in neuem Tab; Ereignis `gbu_dokument_gesetzt`.
- W: Link mit `http://`. T: abgelehnt. W: Titel leeren. T: Verweis entfernt, Ereignis mit `neu = null`.
- Abweichung: je Prüfart statt je Gerätegruppe (Fristen gelten je Prüfart); kein Upload in I2 (Q-21).

**US-23 Anmeldung (P-07, F-8, I2)** – Als Mitglied will ich mich mit E-Mail und Passwort anmelden.
- G: Modus supabase, aktives Mitglied. W: richtige Daten. T: Weiterleitung nach Rolle. W: falsches Passwort oder unbekannte E-Mail. T: dieselbe Meldung „E-Mail oder Passwort ist falsch.“
- G: Passwort vergessen. W: E-Mail absenden. T: immer „Wenn ein Konto existiert, ist eine E-Mail unterwegs.“; Link führt zu „Neues Passwort“ (min. 10 Zeichen, Wiederholung gleich).
- G: Benutzer ohne aktive Mitgliedschaft. W: Anmeldung. T: Seite „Kein Zugang“.
- G: `NODE_ENV=production`, keine Supabase-Variablen, kein `READYLOOP_DEMO`. W: `/login`. T: „Readyloop ist nicht konfiguriert“, keine Rollenwahl.
- W: Abmelden. T: Sitzung beendet, Cookies gelöscht, `/login`.

**US-24 Verwaltung (F-17, R-23, I2)** – Als ADM will ich Bereiche pflegen und Mitglieder einladen, damit der Betrieb ohne Plattform-Support startet.
- G: ADM. W: Bereich „Versand“ mit Einsatzort Lager/Logistik anlegen. T: Bereich auswählbar beim Gerät-Anlegen; Ereignis `bereich_gespeichert`.
- W: VER einladen ohne Bereich. T: Fehler am Feld Bereiche. W: mit Bereich Lager. T: Einladungs-Mail; nach Passwort-Setzen sieht der VER nur Lager.
- G: Prüfer existiert in anderem Betrieb. W: einladen. T: keine Mail, Meldung „hat bereits ein Konto; Zugang angelegt“; Prüfer wechselt im Header zwischen beiden Betrieben.
- G: einziger aktiver Admin. W: sich selbst auf Sifa ändern oder deaktivieren. T: abgelehnt.
- G: Mitglied deaktiviert. T: kein Zugriff mehr; Name bleibt in Verlauf und Nachweisen.
- G: SIF, VER, PRF. T: keine Verwaltungs-Navigation; `/admin/*` → 404.

**US-25 Prüfer zuweisen (R-28, F-15, I2)** – Als VER will ich Prüfarten meiner Bereiche einem Prüfer zuweisen, damit er sie in seiner Ansicht sieht.
- G: VER Lager, Prüfart an L-003. W: Prüfer wählen. T: Prüfart in dessen Prüfer-Ansicht; Ereignis `pruefer_zugewiesen` mit altem und neuem Prüfer.
- W: Zuweisung entfernen. T: Prüfart verschwindet aus der Prüfer-Ansicht; Nachweise bleiben.
- G: VER Lager. W: Prüfart in Produktion per Request zuweisen. T: abgelehnt. W: Sifa-Benutzer als Prüfer. T: abgelehnt.

**US-26 Gerät verschieben (R-22, F-16, I2)** – Als ADM will ich ein Gerät in einen anderen Bereich verschieben, ohne seine Historie zu verlieren.
- G: Feuerlöscher im Lager. W: nach Produktion verschieben. T: Bereich Produktion, Frist und Nachweise unverändert; Ereignis „Lager → Produktion“; Lager-VER sieht das Gerät nicht mehr.
- G: VER nur Lager. W: nach Produktion. T: abgelehnt.
- G: neuer Einsatzort ergibt kürzeren freigegebenen Vorschlag. T: Hinweis „Kürzere Frist für neuen Einsatzort vorgeschlagen – Frist prüfen“.

**Pilot-Gates (kein Code):** G-1 Katalogeinträge der Pilotgeräte vom Sicherheitsingenieur freigegeben (R-40). G-2 AVV, TOM, Unterauftragsverarbeiter-Liste unterschrieben (R-42). G-3 Supabase-Projekt in EU-Region (R-43). G-4 Betriebsrat informiert, Betriebsvereinbarung oder schriftlicher Verzicht vor Einsatz der Mitarbeiter-App (R-44). G-5 Migrationen I1+I2 gegen echte Supabase eingespielt, pgTAP-RLS-Tests (`supabase test db`) grün, E-Mail-Vorlagen (Einladung, Passwort) und SMTP-Absender mit EU-Anbieter eingerichtet – vor dem ersten echten Datensatz.

## 5. Datenmodell

Entitäten (I1 fett; übrige ab I2+):

| Entität | Kernfelder | Beziehung |
|---|---|---|
| **organisation** | name, bg | 1:n standort, bereich, mitgliedschaft, geraet |
| **standort** | name | n:1 organisation; Pilot genau einer |
| **bereich** | name, einsatzort | n:1 standort |
| **mitgliedschaft** | benutzer_id (auth.users), anzeigename, rolle; I2: email, aktiv, pruefer_typen[] | n:1 organisation; Prüfer hat je Betrieb eine Mitgliedschaft; unique (organisation, benutzer) |
| **bereich_verantwortung** | mitgliedschaft_id, bereich_id | n:m Verantwortlicher ↔ Bereich |
| **katalog_eintrag** | schluessel, version, geraetegruppe, pruefart, einsatzort?, intervall_monate?, stufe, fundstelle, quelle_url, pruefer_typen, freigabestatus, freigegeben_von/am | global, ohne Betriebsbezug; unique (schluessel, einsatzort, version) |
| **geraet** | bereich_id, bezeichnung, inventarnummer, geraetegruppe, kategorie, hersteller, typ, seriennummer, baujahr, einsatzort?, betriebsstatus | n:1 bereich |
| **geraet_pruefart** | geraet_id, katalog_schluessel?, bezeichnung, herstellerfrist_monate?, herstellerfrist_quelle?, frist_* (Snapshot), letzte_pruefung?, letzte_pruefung_herkunft, zugewiesener_pruefer_id?; I2: gbu_dokument_titel?, gbu_dokument_url? | n:1 geraet |
| **nachweis** | geraet_pruefart_id, pruefdatum, ergebnis, pruefumfang, pruefer_name, pruefer_benutzer_id?, unterschrift_im_pdf, pdf_pfad, pdf_sha256, erfasst_von/am; I2: pdf_dateiname, frist_empfehlung_monate? | n:1 geraet_pruefart; nur INSERT |
| **ereignis** | typ, geraet_id?, akteur_id, akteur_name, zeitpunkt, daten (jsonb) | n:1 organisation; nur INSERT per Trigger |
| anlass (I2) | geraet_id, geraet_pruefart_id, art, datum, beschreibung, erfasst_von/_name/_am, aufgehoben_von/_name/_am?, aufhebungsgrund? | n:1 geraet_pruefart; INSERT + einmaliges Aufheben; „offen“ wird berechnet (F-10) |
| mangel (I2) | geraet_id, geraet_pruefart_id?, nachweis_id?, beschreibung, schwere, termin, status, verantwortlich_id?, erfasst_von/_name/_am, kenntnis_von/_name/_am?, behoben_am?, behoben_durch?, behebung?, behebung_erfasst_von/_name/_am? | n:1 geraet, n:1 geraet_pruefart?, n:1 nachweis?; nur Statusübergänge F-14 |
| erinnerung (I3) | geraet_pruefart_id, stufe, versendet_am, empfaenger | |
| geraet_token (I5) | geraet_id, token, aktiv | QR/NFC |
| pruefer_qualifikation (später) | mitgliedschaft_id, typ, nachweis, gueltig_bis | I2 vereinfacht: `mitgliedschaft.pruefer_typen` (Q-22) |

Ereignisse I1: `geraet_angelegt`, `frist_freigegeben` (alte und neue Frist in `daten`), `nachweis_erfasst`. I2: siehe F-19. Später: `export_erstellt` (I4).

RPCs (Supabase, `security invoker`, damit RLS greift und mehrere Schreibvorgänge eine Transaktion sind): `geraet_anlegen`, `frist_setzen`, `geraet_verschieben`, `betriebsstatus_setzen`, `mitglied_speichern`. Begründungen und Nachweisbezug gelangen über `set_config('readyloop.kontext', …, true)` in die Ereignis-Trigger.

Speicherung PDF: Supabase Storage, privater Bucket `nachweise`, Pfad `{organisation_id}/{geraet_id}/{geraet_pruefart_id}/{nachweis_id}.pdf` (Prüfart im Pfad, damit Storage-Rechte pro Prüfart greifen).

## 6. Rechte-Matrix

Rollenebene = `can(rolle, aktion)`. Geltungsbereich zusätzlich: ADM/SIF ganze Organisation · VER eigene Bereiche · PRF nur Prüfarten mit `zugewiesener_pruefer_id` = eigene Benutzer-ID · MA eigene Geräte (I5). Nur aktive Mitgliedschaften zählen (I2). Stand I2; Code: `src/domain/rechte.ts`, Vertrag `docs/backlog.md` §5.3.

| Aktion | ADM | SIF | VER | PRF | MA |
|---|---|---|---|---|---|
| geraet.lesen | ✓ | ✓ | ✓ Bereich | ✓ zugewiesen | – (I5: eigene) |
| geraet.anlegen | ✓ | – | ✓ Bereich | – | – |
| geraet.bearbeiten (I2: verschieben, Betriebsstatus) | ✓ | – | ✓ Bereich (verschieben: Quelle und Ziel eigene Bereiche) | – | – |
| frist.freigeben (inkl. GBU-Verweis I2) | – | ✓ | ✓ Bereich | – | – |
| nachweis.lesen | ✓ | ✓ | ✓ Bereich | ✓ zugewiesen | – |
| nachweis.erfassen (inkl. Frist-Empfehlung I2) | – | – | ✓ Bereich | ✓ zugewiesen | – |
| pruefaufgaben.lesen | – | – | – | ✓ | – |
| pruefer.zuweisen (I2) | ✓ | – | ✓ Bereich | – | – |
| anlass.erfassen (I2, inkl. aufheben) | – | ✓ | ✓ Bereich | – | – |
| mangel.lesen (I2) | ✓ | ✓ | ✓ Bereich | ✓ zugewiesene Prüfart | – |
| mangel.erfassen (I2; MA ab I5) | – | ✓ | ✓ Bereich | ✓ zugewiesene Prüfart, ohne Verantwortlichen | – (I5) |
| mangel.bearbeiten (I2: Kenntnis, Behebung) | ✓ | ✓ | ✓ Bereich | – | – |
| verlauf.lesen | ✓ | ✓ | ✓ Bereich | – | – |
| katalog.lesen | ✓ | ✓ | ✓ | ✓ | ✓ |
| katalog.freigeben | – | – | – | – | – |
| bereich.verwalten (I2) | ✓ | – | – | – | – |
| mitglied.verwalten (I2, inkl. Prüfer einladen) | ✓ | – | – | – | – |
| organisation.wechseln (implizit) | eigene Mitgliedschaften | ← | ← | ← | ← |
| export (I4) | ✓ | ✓ | ✓ Bereich | – | – |
| nachweis.loeschen, mangel.loeschen, anlass.loeschen | – | – | – | – | – |

`katalog.freigeben` hat keine Rolle im Betrieb; Katalogfreigabe läuft plattformseitig (Migration/Service-Role) mit Name, Datum, Version des Sicherheitsingenieurs.

RLS-Ausnahme I2: `bereich_verantwortung` erhält als einzige Tabelle eine DELETE-Policy (nur ADM), damit Bereichszuordnungen geändert werden können; jede Änderung erzeugt `mitglied_gespeichert` mit der neuen Bereichsmenge (Q-19). Nachweis, Ereignis, Mangel, Anlass bleiben ohne DELETE.

## 7. Offene Fragen (mit Default)

| # | Frage | Default bis zur Klärung |
|---|---|---|
| Q-1 | Reicht für § 14 Abs. 7 (Unterschrift/elektronische Signatur) ein PDF mit Unterschrift plus Login-Bestätigung? | Ja: PDF-Upload Pflicht + Bestätigung „PDF enthält Unterschrift“. Qualifizierte E-Signatur nicht im MVP. Jurist klären |
| Q-2 | Darf die Sifa Geräte anlegen und Nachweise erfassen? | Nein (Projektstand). Matrix in `rechte.ts`, Änderung ist eine Zeile |
| Q-3 | Reihenfolge Gesamtstatus `unbekannt` vor `gbu`? | Ja wie F-6; im Pilot mit Sifa prüfen |
| Q-4 | Vorlauf „bald fällig“ | 30 Tage fest in I1; 90/60/30 je Bereich ab I3 |
| Q-5 | Wer gibt den Katalog frei, bis wann? | Kein Pilotstart, bevor die Einträge der Pilotgeräte freigegeben sind (G-1). Bis dahin GBU-Fristen |
| Q-6 | Ergebnis `nicht_bestanden`: Frist neu starten? | Nein. Letzte Prüfung bleibt, Status „vor Nutzung prüfen“ bis bestandene Nachprüfung, Führung zur Mängelerfassung (F-12). Mit Sifa im Pilot prüfen |
| Q-7 | Prüfer-Zuweisung je Prüfart oder je Gerät? | Je Prüfart (Elektro- und Kranprüfer unterscheiden sich) |
| Q-8 | Ebene Gebäude/Halle im Pilot nötig? | Nein; Bereich reicht. Im Interview prüfen |
| Q-9 | Demo-Modus in Produktion verhindern? | Entschieden (F-8): Demo nur ohne Supabase-Variablen und in Produktion zusätzlich nur mit `READYLOOP_DEMO=1`; teilweise Konfiguration = „unkonfiguriert“ |
| Q-10 | Webfonts (Space Grotesk, IBM Plex) beim Build ohne Netz? | CSS-Font-Stack ohne Laden bleibt. `next/font/local` entfällt in I2, weil keine Fontdateien im Repo liegen; erst wieder, wenn Dateien (mit Lizenz) eingecheckt werden |
| Q-11 | Intervalle in Tagen/Wochen (Kontrollen)? | I1 nur Monate; Kontrollen (R-14) bekommen eigenes Modell |
| Q-12 | Nachfrist nach Ausmusterung (R-02) | Standard: unbegrenzt aufbewahren; Kunde stellt ab I4 ein. Jurist klären |
| Q-13 | Elektro-Verlängerung bei Fehlerquote < 2 % (bis 12/24 Monate) | Nur per GBU-Frist mit Begründung; keine Automatik |
| Q-14 | Schreibt eine bestandene Anlassprüfung die letzte Prüfung fort (Frist startet neu)? | Ja, wie jeder bestandene Nachweis (F-7); der Prüfumfang im Nachweis dokumentiert, was geprüft wurde. Mit Sicherheitsingenieur klären, ob Anlassprüfungen mit reduziertem Umfang die wiederkehrende Prüfung ersetzen dürfen |
| Q-15 | Wer darf Mängel bearbeiten (Kenntnis, Behebung)? | ADM, SIF, VER (Bereich). Prüfer nur erfassen |
| Q-16 | Termin-Vorschlag je Schwere | gefährlich: heute, erheblich: +30 Tage, gering: +90 Tage; nur Vorbelegung, frei änderbar (≥ heute) |
| Q-17 | Macht ein offener gefährlicher Mangel das ganze Gerät „vor Nutzung prüfen“? | Ja (F-9), auch wenn der Mangel an einer Prüfart hängt; Technische Sperre bleibt MVP-Ausschluss |
| Q-18 | Dürfen VER Prüfer einladen? | Nein, nur ADM (`mitglied.verwalten`); VER weisen vorhandene Prüfer zu |
| Q-19 | DELETE auf `bereich_verantwortung` trotz „keine DELETE-Policy“? | Ja, einzige Ausnahme, nur ADM, protokolliert über `mitglied_gespeichert`. Alternative (Historisierung mit gültig_bis) erst bei Bedarf |
| Q-20 | Ausmustern in I2? | Nein; `ausgemustert` kommt mit der Aufbewahrungs-Nachfrist in I4 |
| Q-21 | GBU-Dokument je Prüfart oder je Gerätegruppe (US-22 alt)? Upload? | Je Prüfart, nur Titel + https-Link, kein Upload. Upload ggf. mit Betriebsanleitung in I4 |
| Q-22 | Prüferqualifikation mit Gültigkeit und Nachweisdokument? | I2 nur Typen an der Prüfer-Mitgliedschaft, Warnung ohne Block. Gültigkeit/Dokument nach Pilotfeedback |
| Q-23 | Einladung eines Benutzers, der schon ein Konto hat (Prüfer mehrerer Betriebe) | Mitgliedschaft anlegen, keine Mail; UI-Hinweis. Benachrichtigungs-Mail ab I3 (Resend) |
| Q-24 | Lassen sich pgTAP-Tests im Agentenlauf ausführen? | Nein (keine lokale Supabase/Docker). Tests werden geschrieben; Ausführung ist Gate G-5 vor Pilotstart |
| Q-25 | Darf ein Anlass zurückgenommen werden? | Ja, „aufheben“ mit Begründung ≥ 10 Zeichen durch SIF/VER; bleibt im Verlauf sichtbar |
| Q-26 | Darf nach einer Prüfung über den Stufe-B-Richtwert hinaus verlängert werden? | Ja, wie F-4: GBU-Frist mit Begründung und Fundstelle; Stufe A und Herstellerfrist bleiben harte Grenzen |
| Q-27 | SMTP für Einladungs- und Passwort-Mails | Supabase-Auth-Mails über eigenen SMTP eines EU-Anbieters (Teil von G-5); Supabase-Standard-SMTP nur für Tests |

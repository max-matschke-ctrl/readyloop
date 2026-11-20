# Anforderungen Readyloop – Pilot Mittelstand

Stand 20.11.2026 (Planung Inkrement I3M – Mitarbeiter, vor I3) · Quellen: `docs/context/projektstand.md`, `docs/research/recherche-anforderungen.md` · Backlog: `docs/backlog.md`

## 1. Rahmen

- Pilot: ein Mittelständler (20–500 Beschäftigte), ein Rechtsträger, ein Standort, mehrere Bereiche (z. B. Lager, Produktion, Verwaltung).
- Kern: Fristen je **Gerät × Prüfart**, nie je Gerät. Ein Gerät hat 1..n Prüfarten.
- Frist wirkt erst nach Freigabe durch Verantwortlichen oder Sifa. Vorschläge kommen nur aus freigegebenen Katalogeinträgen oder aus der Herstellerangabe. Sonst: „Frist über GBU festlegen“.
- Katalogeinträge im Repo haben Status `entwurf`, bis ein Sicherheitsingenieur sie freigibt (Name, Datum, Version). Die Regel-Engine ignoriert Entwürfe für Vorschläge; die UI zeigt sie nur als Orientierung, klar als Entwurf gekennzeichnet.
- Unbekannte Prüfdaten werden nicht geschätzt. Jedes Prüfdatum trägt seine Herkunft.
- MVP-Ausschlüsse aus dem Projektstand bleiben: Sperren, Prüfdienstleister-Vorschlag/Terminbuchung, mehrere Standorte (Funktion), UHF/Bluetooth, SAP, Steuerberater-Export, Push, KI für Nachweise.

## 2. Priorisierung (alle Anforderungen der Recherche)

Regel: Must = Gewicht 5, rechtlich zwingend oder Kern des Pilots. Gewichte unverändert übernommen; Abweichungen von „Gewicht → MoSCoW“ in Spalte Begründung. Inkrement (I1, I2, I3M, I3–I7) siehe `docs/backlog.md`. I3M (Mitarbeiter) läuft auf Wunsch von Max vor I3.

| ID | Anforderung (kurz) | Gew. | MoSCoW | Inkr. | Begründung / Abweichung |
|---|---|---|---|---|---|
| R-01 | Nachweis mit Pflichtfeldern § 14 Abs. 7 | 5 | Must | I1 | |
| R-02 | Nachweise nicht löschbar, Nachfrist einstellbar | 5 | Must | I1 / I4 | I1: keine Löschfunktion, keine Delete-Policy. Nachfrist-Einstellung I4 |
| R-03 | Nachweis am Einsatzort per QR/NFC ohne Login | 5 | Must | I3M / I5 | I3M: QR-Seite ohne Login (F-24); bei schlechtem Netz trägt die gedruckte Prüfplakette auf dem Etikett den Termin (TRBS 1201 lässt Plakette zu). NFC und Offline I5 |
| R-04 | Frist mit Fundstelle, Stufe, Freigabe, Katalogversion | 5 | Must | I1 | |
| R-05 | Mehrere Prüfarten je Gerät | 5 | Must | I1 | |
| R-06 | Frist nach Prüfergebnis neu festlegen | 4 | Must | I2 | rechtlich zwingend (§ 14 Abs. 2 BetrSichV). I1 erlaubt Neufestlegung jederzeit über „Frist freigeben“. I2: Bezug auf Nachweis, Prüfer-Empfehlung, Richtung (F-13) |
| R-07 | Anlassbezogene Prüfungen | 4 | Must | I2 | rechtlich zwingend (§ 14 Abs. 1, 3 BetrSichV). F-10 |
| R-08 | Frist ab tatsächlichem Prüfdatum; außer Betrieb → vor Nutzung prüfen | 4 | Must | I1 / I2 | Kern der Regel-Engine (I1). „Außer Betrieb“-Logik I2 (F-11) |
| R-09 | „Überfällig, nicht verwenden“ deutlich anzeigen | 4 | Must | I1 / I2 / I3M | Kern des Pilots. I1 Büro-Ampel, I2 Status „vor Nutzung prüfen“, I3M Nutzbarkeit für Mitarbeiter und QR-Seite (F-21) |
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
| R-20 | QR/NFC-Etiketten, Prüfplakette drucken | 4 | Must | I3M / I5 | MVP-Entscheidung (NFC + QR für wechselnde Geräte). I3M: QR-Etikett mit Prüfplakette als Druckseite (F-25). NFC I5 |
| R-21 | Offline-Erfassung | 4 | Should | I5 | Nicht in I3M (Vorgabe Max) |
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
| R-38 | Mitarbeiter-App (PWA) | 4 | Must | I3M / I5 | MVP-Entscheidung: drei Zugänge. Abweichung in der Form (Vorgabe Max 20.11.): I3M liefert eine responsive Web-App, gleichwertig am Handy und am Büro-PC (P-09); „Scan“ = Kamera-App des Handys öffnet die QR-URL, am PC Suche. PWA-Manifest, Offline, NFC I5 |
| R-39 | Preise, Self-Service-Test | 3 | Could | – | Vertrieb, nicht Pilot |
| R-40 | Vorbefüllter Katalog, fachlich freigegeben | 5 | Must | I1 + Gate | I1: 17 Einträge als Entwurf. Freigabe = Pilot-Gate |
| R-41 | Mehrsprachige Mitarbeiter-App | 2 | Could | I7 | |
| R-42 | AVV, TOM, Unterauftragsverarbeiter | 5 | Must | Gate | organisatorisch, vor erstem echten Datensatz |
| R-43 | EU-Hosting, KI ohne Personennamen | 4 | Must | I1 / I6 | CLAUDE.md: nicht verhandelbar. I1: Supabase-Region EU. KI-Adapter I6 |
| R-44 | Betriebsrats-Paket | 4 | Must | Gate G-4 (vor Pilotnutzung I3M) | Projektstand: Betriebsrat vor Pilot. Datenkatalog Mitarbeiter in §6a als Baustein |
| R-45 | Keine Leistungsauswertung je Mitarbeiter, Löschkonzept | 4 | Should | ab I1 (Designregel) / I3M | Designregel gilt ab I1: keine Auswertung je Person. I3M: Sichtbarkeit, 90-Tage-Pseudonymisierung der Übernahmen, Lösen bei Austritt (F-27) |

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
| P-09 | Mitarbeiter-Funktionen gleichwertig am Handy und am Büro-PC: responsive Web-App, gleicher Login, keine Funktion setzt App-Installation, Kamera-Zugriff, Service Worker oder Push voraus (Vorgabe Max 20.11.2026, F-29) | Must | I3M |

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
- Einladen: E-Mail, Name, Rolle (`admin`, `sifa`, `verantwortlicher`, `pruefer`; `mitarbeiter` ab I3M, F-20). VER braucht ≥ 1 Bereich; Bereiche nur bei VER, Qualifikationstypen nur bei Prüfern gespeichert. Unbekannte E-Mail → Einladungs-Mail mit Link zum Passwort-Setzen; bekannte E-Mail (z. B. Prüfer anderer Betriebe) → nur Mitgliedschaft, keine Mail (Q-23). Je Organisation und Benutzer höchstens eine Mitgliedschaft.
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

## 3b. Fachregeln Inkrement I3M – Mitarbeiter

Umfang: Rolle Mitarbeiter (MA), „Meine Geräte“, Übernahme/Rückgabe, Zuordnung personenbezogener Geräte, Mangel melden, öffentliche QR-Seite, QR-Etiketten mit Prüfplakette, Datensparsamkeit. Nicht in I3M: NFC, Offline, Push, Mehrsprachigkeit, PWA-Manifest, Foto zum Mangel. Alle Regeln aus §3 und §3a gelten weiter.

**F-20 Rolle Mitarbeiter und Zugang.**
- MA = Mitgliedschaft mit Rolle `mitarbeiter`, ohne Bereiche und ohne Prüfertypen. Anmeldung wie alle Rollen mit E-Mail und Passwort (F-8). Startseite `/meine-geraete`.
- Einladen: ADM über die Verwaltung (alle Rollen), VER über `/mitarbeiter` (nur Rolle `mitarbeiter`, Q-35). Ablauf wie F-17 (unbekannte E-Mail → Einladungs-Mail, bekannte → nur Mitgliedschaft). Deaktivieren und Rollenwechsel nur ADM.
- E-Mail ist Pflicht (Q-33). Beschäftigte ohne E-Mail-Adresse bekommen im MVP keinen Zugang; sie sehen den Prüfstatus über die öffentliche QR-Seite (F-24) und melden Mängel beim Verantwortlichen. Das Einladungsformular weist darauf hin, eine dienstliche Adresse zu verwenden (Q-34).
- Login mit Rücksprung: `/login?next=<Pfad>`. Nach erfolgreicher Anmeldung (Supabase und Demo-Rollenwahl) Weiterleitung auf `next`, nur relative Pfade (`sichererRuecksprung`), sonst `/`.
- Demo: Rollenwahl enthält „Mitarbeiter“ (Jonas Richter, fiktiv).
- Deaktivieren eines MA oder Rollenwechsel weg von `mitarbeiter` löst in derselben Transaktion alle Zuordnungen (F-22) und beendet offene Übernahmen mit Ende-Art `austritt` (F-23). Das ist das Löschkonzept bei Austritt (R-45); gemeldete Mängel bleiben (Sicherheitsdokumentation).

**F-21 Nutzbarkeit (R-09).** Grundlage ist der Gesamtstatus nach F-9 über **alle** Prüfarten und **alle** offenen Mängel des Geräts, unabhängig vom Geltungsbereich des Betrachters. Die erste zutreffende Regel gilt:
1. Betriebsstatus ≠ `in_betrieb` → `nicht_verwenden` (Grund „Außer Betrieb“).
2. Gesamtstatus `ueberfaellig` oder `vor_nutzung_pruefen` → `nicht_verwenden` (Grund = Status-Label bzw. `VOR_NUTZUNG_GRUND_LABEL`).
3. Gesamtstatus `unbekannt` oder `gbu` → `unklar`: „Prüfstatus unklar – vor Nutzung Verantwortlichen fragen“.
4. `bald_faellig` oder `ok` → `verwendbar`.

„Nicht verwenden“ steht als erste Information auf jeder MA-Ansicht und auf der QR-Seite, mit Symbol, Text und Grund, nie nur als Farbe. Keine technische Sperre (MVP-Ausschluss).

**F-22 Zuordnung personenbezogener Geräte.**
- Nur Geräte der Kategorie `personenbezogen`. Höchstens eine Person je Gerät (Q-43); Ziel ist ein aktives Mitglied mit Rolle `mitarbeiter` derselben Organisation (Q-42). Zuordnung lösen ist jederzeit möglich.
- Recht `geraet.zuordnen`: ADM ganze Organisation, VER eigene Bereiche.
- Ereignis `zuordnung_geaendert` mit `daten = { zugeordnet: boolean }`, ohne Name oder ID der Person (F-27). Akteur ist ADM/VER.
- Verschieben (F-16) und Außer-Betrieb (F-11) lassen die Zuordnung bestehen.

**F-23 Übernahme und Rückgabe (wechselnde Geräte).**
- Übernehmen darf nur die Rolle MA (Q-36), nur Geräte der Kategorie `wechselnd`, nur mit Betriebsstatus `in_betrieb` und nur, wenn die Nutzbarkeit nicht `nicht_verwenden` ist (Q-29). Bei `unklar` ist die Übernahme möglich, die Oberfläche zeigt den Hinweis vorher (Q-30).
- Übernahme nur durch ausdrücklichen Klick „Gerät übernehmen“, nie durch den Scan allein. Wege: QR-Seite (F-24) oder Suche am Computer/Handy (`/meine-geraete/suchen`).
- Je Gerät höchstens eine offene Übernahme. Übernimmt ein anderer MA, endet die bestehende Übernahme in derselben Transaktion mit Ende-Art `uebergabe`; der neue Halter sieht vorher nur „Wird von einer anderen Person genutzt“, ohne Namen. Der vorherige Halter wird nicht benachrichtigt (Q-44).
- Eine Übernahme endet durch (a) Rückgabe durch den MA (`rueckgabe`), (b) Übernahme durch einen anderen MA (`uebergabe`), (c) „Übernahme beenden“ durch ADM oder VER im Bereich (`beendet_verwaltung`, Recht `geraet.zuordnen`), (d) Deaktivierung oder Rollenwechsel des MA (`austritt`, F-20). **Keine zeitliche Beendigung im MVP** (Q-28). Außer Betrieb, Verschieben, Mangel oder Überfälligkeit beenden die Übernahme nicht; die Oberfläche zeigt dann „Nicht verwenden“ und bietet „Zurückgeben“ an.
- Zurückgeben kann der MA nur eigene offene Übernahmen, immer (auch bei „Nicht verwenden“). Ein zweites „Übernehmen“ durch denselben MA → Fehler „Sie haben dieses Gerät bereits übernommen.“
- Eine Übernahme ist ein eigener Datensatz (`uebernahme`: von, bis, Ende-Art) und **kein** Eintrag in `ereignis` (F-27).

**F-24 Geräte-Token und öffentliche QR-Seite (R-03, US-18).**
- Jedes Gerät hat genau einen aktiven Token: 16 Byte aus einem kryptografisch sicheren Zufallsgenerator, base64url ohne Auffüllung, 22 Zeichen (128 Bit). Der Token entsteht beim Anlegen des Geräts; für den Bestand legt die Migration Tokens an. „Aufkleber erneuern“ (`etikett.verwalten`) deaktiviert den alten Token sofort und legt einen neuen an; Ereignis `etikett_erneuert`.
- URL `{NEXT_PUBLIC_SITE_URL}/g/{token}`. Falsches Format, unbekannter oder deaktivierter Token ergeben dieselbe Seite „Dieser Aufkleber ist nicht gültig.“ mit HTTP 404, ohne Unterscheidung.
- Inhalt ohne Login: Betrieb (Name), Bezeichnung, Inventarnummer, Hersteller, Typ; Nutzbarkeit (F-21) mit Grund; Gesamtstatus; nächste Fälligkeit; je Prüfart: Bezeichnung, Status, fällig am, Frist (Monate, Quelle, Stufe, Fundstelle) oder „Frist über GBU festlegen“, letzte Prüfung mit Herkunft, letzter Nachweis (Prüfdatum, Ergebnis, Prüfername); Zeitpunkt „Stand“.
- Nicht enthalten: Personennamen außer dem Prüfernamen aus dem Nachweis (Pflichtinhalt § 14 Abs. 7 BetrSichV); kein Halter, keine Zuordnung, kein Freigebender, kein Melder; keine Mängelbeschreibungen (nur der Grund „Gefährlicher Mangel offen“); kein Nachweis-PDF (Q-38); keine Bereichsnamen, keine internen IDs; kein Verlauf.
- Antwort mit `Cache-Control: no-store`, `Referrer-Policy: same-origin`, `robots: noindex, nofollow`. `same-origin` statt `no-referrer`, weil Chrome bei `no-referrer` für Formular-POST ohne JavaScript `Origin: null` sendet und Next.js die Server Action dann ablehnt; die Token-URL geht weiterhin an keine fremde Origin (externe Links und Ressourcen erhalten keinen Referrer).
- Aktionen: ohne Anmeldung „Anmelden und übernehmen“ (nur `wechselnd`) bzw. „Anmelden und Mangel melden“ → `/login?next=/g/{token}`. Mit MA-Sitzung derselben Organisation direkt „Gerät übernehmen“, „Zurückgeben“, „Mangel melden“ nach F-23/F-26. Mit anderer Rolle und Recht `geraet.lesen` im Geltungsbereich: Link „Geräteakte öffnen“. Gehört das Gerät nicht zur aktuellen Organisation der Sitzung: nur die öffentliche Ansicht.

**F-25 QR-Etiketten (R-20, ohne NFC).**
- Recht `etikett.verwalten`: ADM ganze Organisation, VER eigene Bereiche. Druckseite `/etiketten`: Auswahl nach Bereich und Kategorie (Default `wechselnd`) oder ein einzelnes Gerät aus der Geräteakte; höchstens 120 Etiketten je Druck; Geräte außerhalb des Geltungsbereichs werden ignoriert.
- Je Etikett: QR-Code der Token-URL (Fehlerkorrektur M, serverseitig mit npm-Paket `qrcode` erzeugt, kein externer Dienst), Kurz-URL als Text, Bezeichnung, Inventarnummer, Betrieb, Prüfplakette mit der nächsten Fälligkeit (Stand Druckdatum; `gbu` → „GBU“, `unbekannt` → „?“) und Text „Aktueller Status: QR scannen“.
- Format Default A4, 3 × 8 Etiketten à 70 × 37 mm (Q-39). Ausgabe als Druckseite; „Als PDF speichern“ über den Browser. Kein serverseitiges PDF in I3M.
- Drucken erzeugt kein Ereignis; Erneuern schon (F-24).

**F-26 Mangel melden durch Mitarbeiter (R-12, R-38).**
- MA melden Mängel an jedem Gerät der eigenen Organisation (über „Meine Geräte“, Suche oder QR-Seite). Felder: Schwere (`MANGEL_SCHWEREN`) und Beschreibung (≥ 5 Zeichen). Foto folgt später.
- Gespeichert wird ein Mangel nach F-14: Status `offen`, ohne Prüfart, ohne Nachweis, ohne Verantwortlichen; Termin automatisch nach Q-16 (gefährlich heute, erheblich +30, gering +90). Ereignis `mangel_erfasst`. Ein gefährlicher Mangel macht das Gerät sofort `vor_nutzung_pruefen` (F-9) und damit „Nicht verwenden“.
- MA erfassen Mängel nur über „Mangel melden“; die Action `mangelErfassen` lehnt die Rolle `mitarbeiter` ab.
- Der Name des Melders ist für ADM, SIF und VER (Bereich) am Mangel sichtbar (Rückfragen, Q-37). Kein Filter, keine Spalte und keine Zählung nach Melder (R-45). MA sehen keine Mängelliste, nur die Anzahl offener Mängel je Gerät.
- Bestätigung: „Mangel gemeldet. Er steht beim Verantwortlichen in der Mängelliste.“ (E-Mail erst mit I3.)

**F-27 Datensparsamkeit bei Zuordnung und Übernahme (R-45; Betriebsrats-Gate G-4 bleibt).**
- Aktueller Halter (offene Übernahme) und Zuordnung mit Namen: ADM, SIF, VER (Bereich). PRF: nichts. Andere MA: nur „Wird von einer anderen Person genutzt“. Öffentlich: nichts.
- Abgeschlossene Übernahmen mit Namen sieht nur ADM (`uebernahmen.lesen`), nur in der Geräteakte je Gerät, nur bis 90 Tage nach Ende (`UEBERNAHME_AUFBEWAHRUNG_TAGE`). Zweck: Aufklärung von Unfällen und Schäden („wer hatte das Gerät zuletzt“). Keine Ansicht je Person, keine Suche oder Filter nach Person, keine Zählung, kein Export.
- Begründung ADM statt VER: Der VER ist meist direkter Vorgesetzter; eine Rückschau „wer hatte was wann“ beim Vorgesetzten ist die naheliegendste Form der Verhaltenskontrolle (§ 87 Abs. 1 Nr. 6 BetrVG). Der ADM verwaltet das Firmenkonto, braucht die Daten nur im Einzelfall und je Gerät.
- Nach 90 Tagen entfernt ein täglicher Job Person und Namen aus abgeschlossenen Übernahmen (Pseudonymisierung); Gerät, Zeitraum und Ende-Art bleiben.
- Übernahmen und die Person einer Zuordnung stehen nicht in `ereignis`, weil Ereignisse unveränderlich und unbefristet sind und so keine Löschfrist zuließen.
- MA sehen nur eigene offene Übernahmen und eigene Zuordnungen.
- Änderungen an dieser Regel (Frist, Rollen) nur nach Abstimmung mit dem Betriebsrat (G-4).

**F-28 Ereignisse I3M (R-24).**

| Typ | geraetId | daten |
|---|---|---|
| `zuordnung_geaendert` | ✓ | `zugeordnet` (boolean) – ohne Personenbezug |
| `etikett_erneuert` | ✓ | `{}` |
| `mangel_erfasst` (auch durch MA) | ✓ | wie F-19 |
| `mitglied_gespeichert` (auch Einladung durch VER) | null | wie F-19 |

Übernahme, Übergabe und Rückgabe erzeugen bewusst kein Ereignis (F-27).

**F-29 Zugang am Handy und am Computer (P-09).**
- Alle MA-Seiten und die QR-Seite sind responsive Web-Seiten, vollständig nutzbar von 320 px bis 1920 px, mit Touch sowie mit Maus und Tastatur. Login, Rechte und Funktionen sind auf beiden Gerätearten gleich.
- Keine Funktion setzt App-Installation, Kamera-Berechtigung, Service Worker oder Push voraus. QR-Scan über die Kamera-App des Handys; am Computer über die Suche.
- Touch-Ziele auf MA-Seiten ≥ 48 px. Unterstützt: aktuelle Versionen von Chrome, Edge, Firefox, Safari (iOS) und Chrome (Android).
- Gemeinsam genutzte Büro-PCs (Q-40): „Abmelden“ im Menü auf jeder Seite; Login-Seite zeigt den Hinweis „An gemeinsam genutzten Computern nach der Arbeit abmelden.“; kein „Angemeldet bleiben“.

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
- G: keine Supabase-Umgebungsvariablen. W: `npm run build`, `npm run dev`. T: Build grün; Login zeigt Rollenwahl (Admin, Sifa, Verantwortlicher, Prüfer, ab I3M Mitarbeiter); Banner „Demo – keine echten Daten“ auf jeder Seite.
- G: Demo. W: Rolle wählen. T: Cookie gesetzt; ADM/SIF/VER → Geräteliste, PRF → Prüfer-Ansicht, MA → Meine Geräte; ca. 20 Geräte mit allen fünf Status.

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

**US-17 Meine Geräte (R-38, R-09, R-45, F-21, F-29, I3M)** – Als MA will ich am Handy und am Büro-PC sehen, welche Geräte ich habe und ob ich sie verwenden darf, damit ich kein ungeprüftes Gerät benutze.
- G: Demo-MA Jonas Richter mit zugeordnetem Auffanggurt P-008 (ok), übernommener Stehleiter L-008 (überfällig) und übernommenem Elektro-Hubwagen L-002 (bald fällig). W: `/meine-geraete` öffnen. T: Abschnitt „Mir zugeordnet“ mit P-008, Abschnitt „Von mir übernommen“ mit L-008 und L-002 („seit …“); L-008 steht zuerst mit „Nicht verwenden – Überfällig“; je Gerät Prüfplakette, Bezeichnung, Inventarnummer, nächste Fälligkeit; je Prüfart Status, fällig am, Frist mit Quelle und Stufe.
- G: übernommenes Gerät wird außer Betrieb gesetzt (Frist gültig). W: Seite neu laden. T: „Nicht verwenden – Außer Betrieb“; Button „Zurückgeben“ bleibt.
- G: Gerät mit Gesamtstatus `unbekannt`. T: „Prüfstatus unklar – vor Nutzung Verantwortlichen fragen“.
- G: MA. W: `/geraete`, `/geraete/{id}`, `/maengel`, `/etiketten`, `/admin/mitglieder` aufrufen. T: jeweils 404.
- G: MA. T: keine Namen anderer Halter, keine abgeschlossenen Übernahmen, keine Zahlen je Person sichtbar.
- G: dieselbe Sitzung am Büro-PC (1280 px) und am Handy (360 px). T: gleiche Inhalte und Aktionen; kein seitenweites horizontales Scrollen; alles per Tastatur bedienbar.
- G: Mitarbeiter ohne Geräte. T: Leerzustand „Ihnen sind keine Geräte zugeordnet.“ mit Aktion „Gerät suchen“.

**US-18 Nachweis am Einsatzort (R-03, R-09, R-20, F-24, I3M)** – Als Kontrolleur, Mitarbeiter oder Prüfer vor Ort will ich per QR ohne Login den letzten Prüfstatus sehen, damit der Nachweis am Einsatzort vorliegt.
- G: Aufkleber an L-001 (überfällig), nicht angemeldet. W: QR mit der Kamera-App scannen. T: Seite ohne Login mit „Nicht verwenden – Überfällig“, Betrieb, Gerät, Inventarnummer; je Prüfart fällig am, Frist mit Quelle, Stufe und Fundstelle, letzte Prüfung mit Herkunft, letzter Nachweis mit Prüfdatum, Ergebnis und Prüfername; „Stand“ mit Uhrzeit.
- G: dieselbe Seite. T: kein weiterer Personenname (kein Halter, kein Freigebender, kein Melder), keine Mängelbeschreibung, kein PDF-Link, kein Bereichsname.
- G: Token mit falschem Format, unbekannter Token, durch „Aufkleber erneuern“ deaktivierter Token. W: URL aufrufen. T: in allen drei Fällen dieselbe Seite „Dieser Aufkleber ist nicht gültig.“, HTTP 404.
- G: neues Gerät. T: Token hat 22 Zeichen base64url aus 16 Zufallsbytes; Antwort trägt `Cache-Control: no-store`, `Referrer-Policy: no-referrer`, `noindex`.
- G: nicht angemeldet, Gerät `wechselnd`. W: „Anmelden und übernehmen“. T: `/login?next=/g/{token}`; nach Anmeldung als MA zurück auf der QR-Seite mit Button „Gerät übernehmen“ (noch nicht übernommen).
- G: VER Lager angemeldet. W: QR von L-003 scannen. T: zusätzlich Link „Geräteakte öffnen“. W: QR von P-001 scannen. T: nur die öffentliche Ansicht.

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

**US-27 Mitarbeiter einladen (F-20, R-23, I3M)** – Als VER will ich Mitarbeiter einladen, damit sie ihre Geräte selbst sehen und Mängel melden.
- G: VER Lager. W: `/mitarbeiter`, E-Mail und Name eingeben, „Mitarbeiter einladen“. T: Einladungs-Mail; Mitgliedschaft mit Rolle `mitarbeiter` ohne Bereiche; Ereignis `mitglied_gespeichert`; Meldung „Einladung an … versendet.“
- G: VER. W: per Request Rolle `verantwortlicher` mitschicken. T: Rolle wird ignoriert bzw. abgelehnt; angelegt wird nur `mitarbeiter`.
- W: E-Mail leer oder ungültig. T: Fehler am Feld `email`. T: Formular zeigt Hinweis „Bitte dienstliche E-Mail-Adresse verwenden.“
- G: VER. T: keine Funktion zum Deaktivieren oder Rollenändern; `/admin/mitglieder` → 404.
- G: ADM deaktiviert Jonas Richter (Zuordnung P-008, Übernahmen L-002, L-008). W: Speichern. T: P-008 ohne Zuordnung; beide Übernahmen beendet mit `austritt`; Jonas hat keinen Zugang mehr; seine gemeldeten Mängel bleiben.
- G: ADM. W: `/admin/mitglieder/neu` mit Rolle Mitarbeiter. T: möglich wie jede andere Rolle.

**US-28 Gerät übernehmen und zurückgeben (F-23, R-38, I3M)** – Als MA will ich ein wechselndes Gerät übernehmen und zurückgeben, damit klar ist, dass ich es gerade nutze.
- G: MA Jonas, L-002 frei. W: QR-Seite von L-002, „Gerät übernehmen“. T: Meldung „Gerät übernommen“; L-002 unter „Von mir übernommen“; VER Lager sieht in der Akte „Übernommen von Jonas Richter seit …“.
- G: Büro-PC. W: `/meine-geraete/suchen?q=hubwagen`, „Gerät übernehmen“. T: dasselbe Ergebnis wie per QR.
- G: P-003 von Aylin Demir übernommen. W: Jonas öffnet P-003. T: Hinweis „Wird von einer anderen Person genutzt“ ohne Namen. W: „Gerät übernehmen“. T: Jonas ist Halter; Aylins Übernahme endet mit `uebergabe`; P-003 fehlt in Aylins Liste.
- G: L-001 überfällig. T: kein Button „Gerät übernehmen“, Hinweis „Prüfung überfällig oder vor Nutzung zu prüfen – nicht verwenden. Bitte Verantwortlichen informieren.“; direkter Request → Fehler.
- G: L-003 ortsgebunden. T: kein Übernehmen; direkter Request → Fehler „Nur Geräte mit wechselndem Einsatzort werden übernommen.“
- G: eigene Übernahme. W: „Zurückgeben“. T: Gerät verschwindet aus „Meine Geräte“; VER sieht keinen Halter mehr. W: fremdes Gerät per Request zurückgeben. T: Fehler.
- G: VER Lager, L-002 von Jonas übernommen. W: „Übernahme beenden“. T: Übernahme endet mit `beendet_verwaltung`. G: VER Lager, P-003. T: keine Aktion; Request → Fehler.
- G: MA scannt einen QR-Code. T: der Scan allein übernimmt nichts.
- G: VER, SIF, ADM, PRF. T: kein „Gerät übernehmen“; Request → keine Berechtigung.

**US-29 Personenbezogene Geräte zuordnen (F-22, I3M)** – Als VER will ich personenbezogene Geräte (z. B. PSA gegen Absturz) einem Mitarbeiter zuordnen, damit er sie in „Meine Geräte“ mit Prüfstatus sieht.
- G: ADM, P-008 personenbezogen. W: in der Akte Mitarbeiter Aylin Demir wählen, „Zuordnung speichern“. T: P-008 erscheint in Aylins „Mir zugeordnet“; Ereignis `zuordnung_geaendert` mit `{ zugeordnet: true }` ohne Namen.
- W: „Zuordnung lösen“. T: P-008 fehlt in Aylins Liste; Ereignis `{ zugeordnet: false }`.
- G: L-001 `wechselnd`. W: Zuordnung per Request. T: Fehler „Nur personenbezogene Geräte werden zugeordnet.“
- G: Ziel ist VER oder ein deaktivierter MA. T: Fehler.
- G: VER Lager. W: P-008 (Produktion) zuordnen. T: keine Aktion sichtbar; Request → Fehler.

**US-30 Mangel melden (F-26, R-12, I3M)** – Als MA will ich einen Mangel an einem Gerät melden, damit der Verantwortliche ihn behebt.
- G: MA, L-008. W: „Mangel melden“, Schwere „Erheblich“, Beschreibung „Holm eingerissen“. T: Mangel `offen`, Termin heute + 30, ohne Prüfart und Verantwortlichen; Meldung „Mangel gemeldet. Er steht beim Verantwortlichen in der Mängelliste.“; VER Lager sieht ihn in `/maengel` mit „erfasst von Jonas Richter“.
- G: V-001 ok. W: Mangel „Gefährlich“ melden. T: sofort „Nicht verwenden – Gefährlicher Mangel offen“ in „Meine Geräte“, in der Suche und auf der QR-Seite.
- W: Beschreibung mit 3 Zeichen. T: Fehler am Feld `beschreibung`.
- G: MA. T: in der Kurzansicht nur „1 offener Mangel“, keine Beschreibung; `/maengel` → 404.
- G: MA. W: `mangelErfassen` direkt aufrufen. T: Fehler (nur `mangelMelden`).
- G: VER öffnet `/maengel`. T: kein Filter und keine Zählung nach Melder.

**US-31 QR-Etiketten drucken (F-25, R-20, I3M)** – Als VER will ich QR-Etiketten mit Prüfplakette drucken, damit jedes wechselnde Gerät seinen Nachweis vor Ort trägt.
- G: VER Lager. W: `/etiketten`, Bereich Lager, Kategorie „Wechselnder Einsatzort“, „Etiketten anzeigen“. T: Druckseite mit 4 Etiketten (L-001, L-002, L-006, L-008), je QR, Kurz-URL, Bezeichnung, Inventarnummer, Betrieb, Prüfplakette; Druckvorschau zeigt A4 mit 3 × 8 Feldern à 70 × 37 mm.
- G: gedrucktes Etikett. W: QR scannen. T: öffnet `/g/{token}` genau dieses Geräts.
- G: VER Lager. W: `/etiketten?geraet={P-001}`. T: P-001 nicht enthalten (Leerzustand).
- G: Akte L-002. W: „Aufkleber erneuern“, Bestätigung „Der alte Aufkleber wird ungültig“. T: alter QR → „Dieser Aufkleber ist nicht gültig.“; neues Etikett druckbar; Ereignis `etikett_erneuert`.
- G: MA, PRF, SIF. W: `/etiketten`. T: 404.

**US-32 Übernahmen datensparsam (F-27, R-45, I3M)** – Als Betriebsrat will ich, dass die App keine Rückschau „wer hatte was wann“ für Vorgesetzte bietet, damit sie nicht zur Verhaltenskontrolle dient.
- G: L-006 vor 20 Tagen von Aylin übernommen und zurückgegeben. W: ADM öffnet die Akte. T: Abschnitt „Übernahmen der letzten 90 Tage“ mit Name, von, bis, Ende-Art.
- G: VER Lager oder SIF. W: Akte L-006. T: nur aktueller Halter (hier keiner); keine abgeschlossenen Übernahmen. Supabase: RLS liefert keine Zeilen.
- G: Übernahme vor 120 Tagen beendet. T: Datensatz ohne Person und ohne Namen; nirgends mit Namen sichtbar.
- G: beliebige Rolle. T: es gibt keine Ansicht „Übernahmen je Person“, keine Zählung, keinen Export von Übernahmen.
- G: PRF öffnet ein zugewiesenes Gerät. T: keine Angaben zu Halter oder Zuordnung.

**US-33 Zugang am Handy und am Computer (P-09, F-29, I3M)** – Als MA will ich die App am Handy und am Büro-PC gleich nutzen, damit ich nicht auf ein Diensthandy angewiesen bin.
- G: Büro-PC, 1280 px, nur Tastatur. W: Anmelden, Gerät suchen, übernehmen, Mangel melden, zurückgeben, abmelden. T: alle Schritte möglich, Fokus sichtbar.
- G: Handy, 360 px. T: dieselben Schritte; Aktionen ≥ 48 px hoch.
- T: keine Funktion verlangt Installation, Kamera-Berechtigung, Service Worker oder Push.
- G: gemeinsam genutzter PC. W: Menü „Abmelden“. T: Sitzung beendet, zurück auf `/login` mit Hinweis „An gemeinsam genutzten Computern nach der Arbeit abmelden.“

**Pilot-Gates (kein Code):** G-1 Katalogeinträge der Pilotgeräte vom Sicherheitsingenieur freigegeben (R-40). G-2 AVV, TOM, Unterauftragsverarbeiter-Liste unterschrieben (R-42). G-3 Supabase-Projekt in EU-Region (R-43). G-4 Betriebsrat informiert, Betriebsvereinbarung oder schriftlicher Verzicht, bevor im Pilot der erste Mitarbeiter eingeladen wird (R-44; Grundlage: F-27 und Datenkatalog §6a). Ohne Betriebsrat: schriftliche Bestätigung der Geschäftsführung, dass keiner besteht. G-5 Migrationen I1+I2+I3M gegen echte Supabase eingespielt (I3M inkl. `pg_cron`-Job für F-27), pgTAP-RLS-Tests (`supabase test db`) grün, E-Mail-Vorlagen (Einladung, Passwort) und SMTP-Absender mit EU-Anbieter eingerichtet – vor dem ersten echten Datensatz.

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
| **geraet** | bereich_id, bezeichnung, inventarnummer, geraetegruppe, kategorie, hersteller, typ, seriennummer, baujahr, einsatzort?, betriebsstatus; I3M: zugeordnet_an? (Benutzer-ID eines MA, nur bei kategorie `personenbezogen`, F-22) | n:1 bereich |
| **geraet_pruefart** | geraet_id, katalog_schluessel?, bezeichnung, herstellerfrist_monate?, herstellerfrist_quelle?, frist_* (Snapshot), letzte_pruefung?, letzte_pruefung_herkunft, zugewiesener_pruefer_id?; I2: gbu_dokument_titel?, gbu_dokument_url? | n:1 geraet |
| **nachweis** | geraet_pruefart_id, pruefdatum, ergebnis, pruefumfang, pruefer_name, pruefer_benutzer_id?, unterschrift_im_pdf, pdf_pfad, pdf_sha256, erfasst_von/am; I2: pdf_dateiname, frist_empfehlung_monate? | n:1 geraet_pruefart; nur INSERT |
| **ereignis** | typ, geraet_id?, akteur_id, akteur_name, zeitpunkt, daten (jsonb) | n:1 organisation; nur INSERT per Trigger |
| anlass (I2) | geraet_id, geraet_pruefart_id, art, datum, beschreibung, erfasst_von/_name/_am, aufgehoben_von/_name/_am?, aufhebungsgrund? | n:1 geraet_pruefart; INSERT + einmaliges Aufheben; „offen“ wird berechnet (F-10) |
| mangel (I2) | geraet_id, geraet_pruefart_id?, nachweis_id?, beschreibung, schwere, termin, status, verantwortlich_id?, erfasst_von/_name/_am, kenntnis_von/_name/_am?, behoben_am?, behoben_durch?, behebung?, behebung_erfasst_von/_name/_am? | n:1 geraet, n:1 geraet_pruefart?, n:1 nachweis?; nur Statusübergänge F-14 |
| erinnerung (I3) | geraet_pruefart_id, stufe, versendet_am, empfaenger | |
| geraet_token (I3M) | geraet_id, token (22 Zeichen base64url, unique), aktiv, erstellt_am, deaktiviert_am? | n:1 geraet; genau ein aktiver Token je Gerät (partieller Unique-Index); entsteht per Trigger beim Anlegen; NFC nutzt ab I5 denselben Token |
| uebernahme (I3M) | geraet_id, benutzer_id?, benutzer_name?, von, bis?, ende_art?, beendet_von?, pseudonymisiert_am? | n:1 geraet; höchstens eine offene je Gerät (partieller Unique-Index `bis is null`); INSERT, einmaliges Beenden, Pseudonymisierung nach 90 Tagen (F-23, F-27); kein DELETE |
| pruefer_qualifikation (später) | mitgliedschaft_id, typ, nachweis, gueltig_bis | I2 vereinfacht: `mitgliedschaft.pruefer_typen` (Q-22) |

Ereignisse I1: `geraet_angelegt`, `frist_freigegeben` (alte und neue Frist in `daten`), `nachweis_erfasst`. I2: siehe F-19. I3M: siehe F-28 (Übernahmen bewusst ohne Ereignis). Später: `export_erstellt` (I4).

RPCs (Supabase, `security invoker`, damit RLS greift und mehrere Schreibvorgänge eine Transaktion sind): `geraet_anlegen`, `frist_setzen`, `geraet_verschieben`, `betriebsstatus_setzen`, `mitglied_speichern`; I3M: `etikett_erneuern`. Begründungen und Nachweisbezug gelangen über `set_config('readyloop.kontext', …, true)` in die Ereignis-Trigger.

RPCs I3M mit `security definer` (bewusste Ausnahme, weil MA und anonyme Aufrufer keine SELECT-Rechte auf Fachtabellen haben; jede Funktion prüft Mitgliedschaft und Regeln selbst und liefert nur Felder der öffentlichen Ansicht): `geraet_oeffentlich(p_token)` (einzige Funktion mit `grant execute … to anon`), `ma_kurzansichten(p_org, p_art, p_suche, p_ids)`, `uebernahme_starten(p_geraet)`, `uebernahme_beenden(p_geraet)`. Job `app.uebernahmen_pseudonymisieren()` täglich per `pg_cron` (F-27).

Speicherung PDF: Supabase Storage, privater Bucket `nachweise`, Pfad `{organisation_id}/{geraet_id}/{geraet_pruefart_id}/{nachweis_id}.pdf` (Prüfart im Pfad, damit Storage-Rechte pro Prüfart greifen).

## 6. Rechte-Matrix

Rollenebene = `can(rolle, aktion)`. Geltungsbereich zusätzlich: ADM/SIF ganze Organisation · VER eigene Bereiche · PRF nur Prüfarten mit `zugewiesener_pruefer_id` = eigene Benutzer-ID · MA: keine Geräteakte; „Meine Geräte“ (zugeordnet oder offene eigene Übernahme) und Kurzansicht aller Geräte der Organisation mit den Feldern der öffentlichen Ansicht (I3M). `imGeltungsbereich` bleibt für MA `false`. Nur aktive Mitgliedschaften zählen (I2). Stand I3M; Code: `src/domain/rechte.ts`, Vertrag `docs/backlog.md` §5.3 und §7.3.

| Aktion | ADM | SIF | VER | PRF | MA |
|---|---|---|---|---|---|
| geraet.lesen (Geräteakte, Liste) | ✓ | ✓ | ✓ Bereich | ✓ zugewiesen | – |
| geraet.anlegen | ✓ | – | ✓ Bereich | – | – |
| geraet.bearbeiten (I2: verschieben, Betriebsstatus) | ✓ | – | ✓ Bereich (verschieben: Quelle und Ziel eigene Bereiche) | – | – |
| frist.freigeben (inkl. GBU-Verweis I2) | – | ✓ | ✓ Bereich | – | – |
| nachweis.lesen | ✓ | ✓ | ✓ Bereich | ✓ zugewiesen | – |
| nachweis.erfassen (inkl. Frist-Empfehlung I2) | – | – | ✓ Bereich | ✓ zugewiesen | – |
| pruefaufgaben.lesen | – | – | – | ✓ | – |
| pruefer.zuweisen (I2) | ✓ | – | ✓ Bereich | – | – |
| anlass.erfassen (I2, inkl. aufheben) | – | ✓ | ✓ Bereich | – | – |
| mangel.lesen (I2) | ✓ | ✓ | ✓ Bereich | ✓ zugewiesene Prüfart | – |
| mangel.erfassen (I2; MA ab I3M als „Mangel melden“) | – | ✓ | ✓ Bereich | ✓ zugewiesene Prüfart, ohne Verantwortlichen | ✓ jedes Gerät der Organisation, ohne Prüfart, ohne Verantwortlichen, Termin automatisch (F-26); nur Action `mangelMelden` |
| mangel.bearbeiten (I2: Kenntnis, Behebung) | ✓ | ✓ | ✓ Bereich | – | – |
| verlauf.lesen | ✓ | ✓ | ✓ Bereich | – | – |
| katalog.lesen | ✓ | ✓ | ✓ | ✓ | ✓ |
| katalog.freigeben | – | – | – | – | – |
| bereich.verwalten (I2) | ✓ | – | – | – | – |
| mitglied.verwalten (I2, inkl. Prüfer einladen) | ✓ | – | – | – | – |
| organisation.wechseln (implizit) | eigene Mitgliedschaften | ← | ← | ← | ← |
| export (I4) | ✓ | ✓ | ✓ Bereich | – | – |
| meine_geraete.lesen (I3M) | – | – | – | – | ✓ eigene (zugeordnet, offene eigene Übernahme) |
| geraet.suchen (I3M, Kurzansicht) | – | – | – | – | ✓ ganze Organisation, nur Felder der öffentlichen Ansicht + Anzahl offener Mängel |
| geraet.uebernehmen (I3M, inkl. zurückgeben) | – | – | – | – | ✓ nur `wechselnd`, `in_betrieb`, nicht „nicht verwenden“; zurückgeben nur eigene |
| geraet.zuordnen (I3M: personenbezogen zuordnen/lösen, fremde Übernahme beenden) | ✓ | – | ✓ Bereich | – | – |
| Halter und Zuordnung mit Namen sehen (I3M, Teil von geraet.lesen) | ✓ | ✓ | ✓ Bereich | – | nur eigene; sonst „andere Person“ |
| uebernahmen.lesen (I3M: abgeschlossene Übernahmen, 90 Tage, je Gerät) | ✓ | – | – | – | – |
| etikett.verwalten (I3M: drucken, erneuern) | ✓ | – | ✓ Bereich | – | – |
| mitarbeiter.einladen (I3M) | ✓ | – | ✓ nur Rolle `mitarbeiter` | – | – |
| Öffentliche QR-Seite `/g/{token}` (I3M) | jeder, auch ohne Login | ← | ← | ← | ← |
| nachweis.loeschen, mangel.loeschen, anlass.loeschen, uebernahme.loeschen | – | – | – | – | – |

`katalog.freigeben` hat keine Rolle im Betrieb; Katalogfreigabe läuft plattformseitig (Migration/Service-Role) mit Name, Datum, Version des Sicherheitsingenieurs.

RLS-Ausnahme I2: `bereich_verantwortung` erhält als einzige Tabelle eine DELETE-Policy (nur ADM), damit Bereichszuordnungen geändert werden können; jede Änderung erzeugt `mitglied_gespeichert` mit der neuen Bereichsmenge (Q-19). Nachweis, Ereignis, Mangel, Anlass bleiben ohne DELETE.

RLS I3M (Kurzfassung, Details Backlog BE-19):
- MA haben **keine** SELECT-Policy auf `geraet`, `geraet_pruefart`, `nachweis`, `anlass`, `mangel`, `ereignis`, `geraet_token`. Sie lesen nur über `ma_kurzansichten` (security definer, nur öffentliche Felder).
- `uebernahme` SELECT: eigene Zeilen; ADM alle der Organisation; SIF und VER (Bereich) nur offene Zeilen (`bis is null`); PRF keine. Schreiben nur über `uebernahme_starten`/`uebernahme_beenden`, Trigger (Austritt) und den Pseudonymisierungs-Job.
- `mangel` INSERT zusätzlich für MA: `geraet_pruefart_id`, `nachweis_id`, `verantwortlich_id` null, `erfasst_von = auth.uid()`, Termin = heute + Tage nach Schwere.
- `geraet.zugeordnet_an` UPDATE: ADM oder VER (Bereich), Ziel aktives MA-Mitglied derselben Organisation, nur `personenbezogen`.
- `geraet_token` SELECT/INSERT/UPDATE: ADM, VER (Bereich); UPDATE nur `aktiv → false`.
- `mitgliedschaft` INSERT zusätzlich für VER, nur Rolle `mitarbeiter`, ohne Bereichszuordnung.
- `anon`: nur `execute` auf `geraet_oeffentlich`; alle übrigen Funktionen ausdrücklich `revoke execute … from anon, public`.

## 6a. Datenkatalog Mitarbeiter (Baustein Betriebsrats-Paket R-44, G-4)

| Datum | Zweck | Wer sieht es | Speicherdauer |
|---|---|---|---|
| Name, E-Mail, Rolle, aktiv | Anmeldung, Einladung | ADM; VER (Liste `/mitarbeiter`) | bis Deaktivierung; danach Name in Ereignissen/Mängeln wie andere Rollen |
| Zuordnung personenbezogenes Gerät (aktuell) | MA sieht Prüfstatus seiner PSA/Werkzeuge | ADM, SIF, VER (Bereich), MA selbst | bis Lösen oder Austritt; keine Historie mit Person |
| Offene Übernahme (Halter, seit) | Gerät auffinden, Prüfung veranlassen | ADM, SIF, VER (Bereich), MA selbst | bis Ende der Übernahme |
| Abgeschlossene Übernahme (Person, von, bis, Ende-Art) | Unfall- und Schadensaufklärung | nur ADM, je Gerät | 90 Tage nach Ende, dann ohne Person |
| Gemeldeter Mangel (Name des Melders, Zeitpunkt, Beschreibung) | Rückfragen, Sicherheitsdokumentation (R-12) | ADM, SIF, VER (Bereich) | wie Mängel (unbefristet, R-02/Q-12) |
| Login-Zeitpunkte | Betrieb der Anmeldung | nur Plattform (Supabase-Auth-Protokoll), nicht in der App | nach Supabase-Standard; in AVV/TOM benennen (G-2) |

Nicht erhoben: Standort, Gerätedaten des Handys, Nutzungsdauer, Scans ohne Aktion, Zahl der Meldungen oder Übernahmen je Person.

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
| Q-28 | Wann endet eine Übernahme? (offen im Projektstand) | Durch Rückgabe, Übergabe an anderen MA, Beenden durch ADM/VER oder Austritt (F-23). Keine zeitliche Automatik im MVP, weil Schichtlängen je Betrieb verschieden sind und ein Auto-Ende den tatsächlichen Halter verschleiert. Im Pilot beobachten, ob vergessene Rückgaben stören; dann Option „Ende nach Schichtende“ |
| Q-29 | Übernahme eines Geräts mit „Nicht verwenden“? | Nicht möglich (Hinweis + „Mangel melden“). Die App soll die Nutzung eines überfälligen Geräts weder ermöglichen noch dem MA als Datensatz anhängen. Keine technische Sperre am Gerät (MVP-Ausschluss) |
| Q-30 | Übernahme bei Prüfstatus `unklar` (unbekannt, gbu)? | Möglich mit Hinweis vor dem Klick. Sonst wären in der Ersterfassungsphase viele Geräte nicht übernehmbar. Mit Sifa im Pilot prüfen |
| Q-31 | Wer sieht „wer hatte was wann“? | Nur ADM, je Gerät, 90 Tage (F-27). VER und SIF nur den aktuellen Halter. Betriebsrat entscheidet endgültig (G-4) |
| Q-32 | Speicherdauer abgeschlossener Übernahmen | 90 Tage, fest in I3M; konfigurierbar erst nach Pilot und Betriebsvereinbarung. Jurist/Datenschutzbeauftragter des Pilotkunden bestätigt |
| Q-33 | Mitarbeiter ohne E-Mail-Adresse | Kein Login im MVP; QR-Seite ohne Login; Mängel mündlich an VER. Später (nach Betriebsrat) Option Personalnummer + Einmal-PIN, kein Sammel-Login (sonst keine Zuordnung möglich) |
| Q-34 | Private E-Mail-Adressen für MA? | Dienstliche Adresse empfohlen (Hinweis im Formular). Private nur mit Einwilligung des MA; die App prüft das nicht. Im AVV-Gespräch klären |
| Q-35 | Darf der VER Mitarbeiter einladen und deaktivieren? | Einladen ja (nur Rolle MA), deaktivieren und Rolle ändern nur ADM. Grund: MA haben keinen Bereich; ein VER würde sonst Zugänge anderer Bereiche beenden |
| Q-36 | Dürfen VER/SIF/ADM selbst Geräte übernehmen (z. B. Meister)? | Nein im MVP; je Organisation hat ein Benutzer genau eine Rolle. Nach Pilot prüfen |
| Q-37 | Name des Melders bei MA-Mängeln sichtbar? | Ja für ADM, SIF, VER (Rückfragen), ohne Auswertung je Person. Option „anonym melden“ nur, wenn der Betriebsrat es verlangt |
| Q-38 | Nachweis-PDF auf der öffentlichen Seite? | Nein. PDFs können Unterschriften und weitere Namen enthalten; die Seite zeigt die Pflichtangaben als Text. Bei Bedarf zeigt der VER das PDF aus der Akte |
| Q-39 | Etikettenformat | A4, 3 × 8 à 70 × 37 mm (gängige Bogenetiketten), Browser-Druck. Etikettendrucker und wetterfeste Etiketten nach Pilotfeedback |
| Q-40 | Gemeinsam genutzte Büro-PCs | Kein „Angemeldet bleiben“, „Abmelden“ im Menü, Hinweis auf der Login-Seite. Sitzungs-Timeout in Supabase einstellen, soweit der Tarif es erlaubt (G-5) |
| Q-41 | Mangel melden ohne Login über die QR-Seite? | Nein in I3M (Missbrauch, keine Rückfrage möglich). Nach Pilot prüfen, besonders für Beschäftigte ohne E-Mail |
| Q-42 | Zuordnung an andere Rollen als MA? | Nein; nur MA haben „Meine Geräte“ |
| Q-43 | Mehrere Personen je personenbezogenem Gerät (Pool-PSA)? | Nein, höchstens eine. Pool-Geräte werden als `wechselnd` angelegt und übernommen |
| Q-44 | Benachrichtigung des vorherigen Halters bei Übergabe? | Keine (Push ausgeschlossen, E-Mail dafür nicht nötig). Er sieht das Gerät nicht mehr in „Meine Geräte“ |
| Q-45 | Kategorie eines Geräts nachträglich ändern (z. B. personenbezogen → wechselnd)? | Nicht in I3M; kommt mit der Stammdatenbearbeitung (I4). Bis dahin neu anlegen |
| Q-46 | Ende von Zuordnung und Übernahme beim Ausmustern (I4)? | Ausmustern löst Zuordnung und beendet Übernahme (`beendet_verwaltung`); Regel wird in I4 umgesetzt |

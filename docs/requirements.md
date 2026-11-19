# Anforderungen Readyloop – Pilot Mittelstand

Stand 19.11.2026 · Quellen: `docs/context/projektstand.md`, `docs/research/recherche-anforderungen.md` · Backlog: `docs/backlog.md`

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
| R-06 | Frist nach Prüfergebnis neu festlegen | 4 | Must | I2 | rechtlich zwingend (§ 14 Abs. 2 BetrSichV). I1 erlaubt Neufestlegung jederzeit über „Frist freigeben“ |
| R-07 | Anlassbezogene Prüfungen | 4 | Must | I2 | rechtlich zwingend (§ 14 Abs. 1, 3 BetrSichV) |
| R-08 | Frist ab tatsächlichem Prüfdatum; außer Betrieb → vor Nutzung prüfen | 4 | Must | I1 / I2 | Kern der Regel-Engine (I1). „Außer Betrieb“-Logik I2 |
| R-09 | „Überfällig, nicht verwenden“ deutlich anzeigen | 4 | Must | I1 / I5 | Kern des Pilots. I1 Büro-Ampel, I5 Mitarbeiter-App und QR |
| R-10 | Prüferqualifikation + Warnung bei Typ-Konflikt | 4 | Should | I2 | Pflicht ist die Befähigung, nicht ihre Hinterlegung in Software. I1 zeigt Prüfertyp aus dem Katalog |
| R-11 | Verweis auf GBU je Frist | 3 | Should | I1 (Teil) / I2 | I1: GBU-Frist verlangt Fundstelle (GBU-Verweis). Dokument-Upload I2 |
| R-12 | Mängel als eigene Objekte | 5 | Must | I2 | |
| R-13 | Überwachungsbedürftige Anlagen als eigene Klasse | 3 | Should | I7 | |
| R-14 | Kontrollen (arbeitstäglich/wöchentlich) | 3 | Could | I7 | |
| R-15 | Elektro-Messwerte, Fehlerquote | 3 | Could | I7 | |
| R-16 | Fälligkeitsübersicht, Vorlauf 90/60/30 | 5 | Must | I1 / I3 | I1: Übersicht mit festem Vorlauf 30 Tage. Staffel 90/60/30 I3 |
| R-17 | Eskalationskette per E-Mail | 5 | Must | I3 | |
| R-18 | Geräteakte | 5 | Must | I1 / I2 | I1 Stammdaten, Herstellerfrist, Historie. Betriebsanleitung-Upload I2 |
| R-19 | „Prüfdatum unbekannt“, Datum mit Herkunft | 4 | Must | I1 | Projektstand: nicht verhandelbar |
| R-20 | QR/NFC-Etiketten, Prüfplakette drucken | 4 | Must | I5 | MVP-Entscheidung (NFC + QR für wechselnde Geräte) |
| R-21 | Offline-Erfassung | 4 | Should | I5 | |
| R-22 | Organisationsstruktur, Geräte verschiebbar | 5 | Must | I1 / I2 | Abweichung: Ebene Gebäude/Kostenstelle entfällt im Pilot (ein Standort; Bereich reicht). Standort-Tabelle ab I1. Verschieben mit Historie I2 |
| R-23 | Bereichsbezogene Rollen und Rechte | 5 | Must | I1 | |
| R-24 | Unveränderlicher Audit-Trail | 5 | Must | I1 | I1: Ereignisse geraet_angelegt, frist_freigegeben, nachweis_erfasst; weitere ab I2 |
| R-25 | Export BG/Behörde | 5 | Must | I4 | |
| R-26 | ISO-Audit-Berichte | 4 | Should | I7 | |
| R-27 | Excel/CSV-Import | 5 | Must | I4 | |
| R-28 | Externe Prüfdienstleister: Konto über mehrere Betriebe, Aufträge, Sammelupload | 5 | Must | I1 / I2 / I6 | I1: Prüfer-Ansicht, Mitgliedschaft je Betrieb im Datenmodell. Einladen/Zuweisen I2, Sammelupload I6 |
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
| P-06 | Frontend greift nur über `src/server/data.ts` und `src/server/actions.ts` auf Daten zu | Must | I1 |

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

**F-7 Nachweis.** Prüfdatum ≤ heute. Ergebnis `ohne_maengel` oder `maengel_weiterbetrieb` setzt die letzte Prüfung der Prüfart auf das Prüfdatum, wenn es neuer ist (Herkunft `nachweis`). Ergebnis `nicht_bestanden` ändert die letzte Prüfung nicht; die Prüfart zeigt den Hinweis „Weiterbetrieb nicht zulässig“ bis zu einem bestandenen Nachweis.

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

**US-10 Mängel (R-12, I2)** – Als VER will ich Mängel aus Prüfungen mit Schwere, Termin und Behebung verfolgen.
- G: Nachweis mit Ergebnis `maengel_weiterbetrieb`. W: Mangel anlegen. T: Mangel mit Verantwortlichem, Termin, Status offen; Behebung und Kenntnisnahme mit Name/Datum; offene Mängel im Gerät und in der Übersicht.

**US-11 Frist nach Ergebnis (R-06, I2)** – Als SIF will ich nach einer Prüfung die Frist verkürzen (Begründung) oder verlängern (Begründung + Grundlage).
- T: Verlängerung über Stufe-A-Höchstfrist unmöglich; jede Änderung als Ereignis.

**US-12 Anlassprüfung (R-07, I2)** – Als VER will ich einen Anlass (Inbetriebnahme, Änderung, Unfall, längere Nichtbenutzung) erfassen.
- T: Prüfart erhält Status „vor Nutzung prüfen“ bis Nachweis; Anlass im Verlauf.

**US-13 Außer Betrieb (R-08, I2)** – G: Gerät außer Betrieb und Frist abgelaufen. T: Status „vor Nutzung prüfen“ statt überfällig-Eskalation.

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

**US-21 Prüferqualifikation (R-10, Should, I2)** – T: Warnung, wenn Prüfertyp nicht in `prueferTypen` des Katalogeintrags.

**US-22 GBU-Dokument (R-11, Should, I2)** – T: je Gerätegruppe Dokument oder Link hinterlegbar; in Geräteakte und Export sichtbar.

**Pilot-Gates (kein Code):** G-1 Katalogeinträge der Pilotgeräte vom Sicherheitsingenieur freigegeben (R-40). G-2 AVV, TOM, Unterauftragsverarbeiter-Liste unterschrieben (R-42). G-3 Supabase-Projekt in EU-Region (R-43). G-4 Betriebsrat informiert, Betriebsvereinbarung oder schriftlicher Verzicht vor Einsatz der Mitarbeiter-App (R-44).

## 5. Datenmodell

Entitäten (I1 fett; übrige ab I2+):

| Entität | Kernfelder | Beziehung |
|---|---|---|
| **organisation** | name, bg | 1:n standort, bereich, mitgliedschaft, geraet |
| **standort** | name | n:1 organisation; Pilot genau einer |
| **bereich** | name, einsatzort | n:1 standort |
| **mitgliedschaft** | benutzer_id (auth.users), rolle | n:1 organisation; Prüfer hat je Betrieb eine Mitgliedschaft |
| **bereich_verantwortung** | mitgliedschaft_id, bereich_id | n:m Verantwortlicher ↔ Bereich |
| **katalog_eintrag** | schluessel, version, geraetegruppe, pruefart, einsatzort?, intervall_monate?, stufe, fundstelle, quelle_url, pruefer_typen, freigabestatus, freigegeben_von/am | global, ohne Betriebsbezug; unique (schluessel, einsatzort, version) |
| **geraet** | bereich_id, bezeichnung, inventarnummer, geraetegruppe, kategorie, hersteller, typ, seriennummer, baujahr, einsatzort?, betriebsstatus | n:1 bereich |
| **geraet_pruefart** | geraet_id, katalog_schluessel?, bezeichnung, herstellerfrist_monate?, herstellerfrist_quelle?, frist_* (Snapshot), letzte_pruefung?, letzte_pruefung_herkunft, zugewiesener_pruefer_id? | n:1 geraet |
| **nachweis** | geraet_pruefart_id, pruefdatum, ergebnis, pruefumfang, pruefer_name, pruefer_benutzer_id?, unterschrift_im_pdf, pdf_pfad, pdf_sha256, erfasst_von/am | n:1 geraet_pruefart; nur INSERT |
| **ereignis** | typ, geraet_id?, akteur_id, akteur_name, zeitpunkt, daten (jsonb) | n:1 organisation; nur INSERT per Trigger |
| mangel (I2) | nachweis_id?, schwere, verantwortlich, termin, status, kenntnis_von/am, behoben_von/am | n:1 geraet_pruefart |
| erinnerung (I3) | geraet_pruefart_id, stufe, versendet_am, empfaenger | |
| geraet_token (I5) | geraet_id, token, aktiv | QR/NFC |
| pruefer_qualifikation (I2) | mitgliedschaft_id, typ, nachweis, gueltig_bis | |

Ereignisse I1: `geraet_angelegt`, `frist_freigegeben` (alte und neue Frist in `daten`), `nachweis_erfasst`. Ab I2: `pruefer_zugewiesen`, `geraet_verschoben`, `betriebsstatus_geaendert`, `mangel_*`, `anlass_erfasst`, `export_erstellt`.

Speicherung PDF: Supabase Storage, privater Bucket `nachweise`, Pfad `{organisation_id}/{geraet_id}/{nachweis_id}.pdf`.

## 6. Rechte-Matrix

Rollenebene = `can(rolle, aktion)`. Geltungsbereich zusätzlich: ADM/SIF ganze Organisation · VER eigene Bereiche · PRF nur Prüfarten mit `zugewiesener_pruefer_id` = eigene Benutzer-ID · MA eigene Geräte (I5).

| Aktion | ADM | SIF | VER | PRF | MA |
|---|---|---|---|---|---|
| geraet.lesen | ✓ | ✓ | ✓ Bereich | ✓ zugewiesen | – (I5: eigene) |
| geraet.anlegen | ✓ | – | ✓ Bereich | – | – |
| frist.freigeben | – | ✓ | ✓ Bereich | – | – |
| nachweis.lesen | ✓ | ✓ | ✓ Bereich | ✓ zugewiesen | – |
| nachweis.erfassen | – | – | ✓ Bereich | ✓ zugewiesen | – |
| pruefaufgaben.lesen | – | – | – | ✓ | – |
| verlauf.lesen | ✓ | ✓ | ✓ Bereich | – | – |
| katalog.lesen | ✓ | ✓ | ✓ | ✓ | ✓ |
| katalog.freigeben | – | – | – | – | – |
| bereich.verwalten (I2) | ✓ | – | – | – | – |
| mitglied.verwalten (I2) | ✓ | – | – | – | – |
| pruefer.zuweisen (I2) | ✓ | – | ✓ Bereich | – | – |
| mangel.melden (I2/I5) | – | ✓ | ✓ | ✓ | ✓ |
| export (I4) | ✓ | ✓ | ✓ Bereich | – | – |
| nachweis.loeschen | – | – | – | – | – |

`katalog.freigeben` hat keine Rolle im Betrieb; Katalogfreigabe läuft plattformseitig (Migration/Service-Role) mit Name, Datum, Version des Sicherheitsingenieurs.

## 7. Offene Fragen (mit Default)

| # | Frage | Default bis zur Klärung |
|---|---|---|
| Q-1 | Reicht für § 14 Abs. 7 (Unterschrift/elektronische Signatur) ein PDF mit Unterschrift plus Login-Bestätigung? | Ja: PDF-Upload Pflicht + Bestätigung „PDF enthält Unterschrift“. Qualifizierte E-Signatur nicht im MVP. Jurist klären |
| Q-2 | Darf die Sifa Geräte anlegen und Nachweise erfassen? | Nein (Projektstand). Matrix in `rechte.ts`, Änderung ist eine Zeile |
| Q-3 | Reihenfolge Gesamtstatus `unbekannt` vor `gbu`? | Ja wie F-6; im Pilot mit Sifa prüfen |
| Q-4 | Vorlauf „bald fällig“ | 30 Tage fest in I1; 90/60/30 je Bereich ab I3 |
| Q-5 | Wer gibt den Katalog frei, bis wann? | Kein Pilotstart, bevor die Einträge der Pilotgeräte freigegeben sind (G-1). Bis dahin GBU-Fristen |
| Q-6 | Ergebnis `nicht_bestanden`: Frist neu starten? | Nein (F-7). Mit R-06/R-12 in I2 überarbeiten |
| Q-7 | Prüfer-Zuweisung je Prüfart oder je Gerät? | Je Prüfart (Elektro- und Kranprüfer unterscheiden sich) |
| Q-8 | Ebene Gebäude/Halle im Pilot nötig? | Nein; Bereich reicht. Im Interview prüfen |
| Q-9 | Demo-Modus in Produktion verhindern? | I1: Demo nur ohne Supabase-Variablen, Banner Pflicht. I2: zusätzlich `READYLOOP_DEMO=1` verlangt, wenn `NODE_ENV=production` |
| Q-10 | Webfonts (Space Grotesk, IBM Plex) beim Build ohne Netz? | I1: CSS-Font-Stack ohne Laden (Fallback system-ui); `next/font/local` in I2 mit eingecheckten Dateien |
| Q-11 | Intervalle in Tagen/Wochen (Kontrollen)? | I1 nur Monate; Kontrollen (R-14) bekommen eigenes Modell |
| Q-12 | Nachfrist nach Ausmusterung (R-02) | Standard: unbegrenzt aufbewahren; Kunde stellt ab I4 ein. Jurist klären |
| Q-13 | Elektro-Verlängerung bei Fehlerquote < 2 % (bis 12/24 Monate) | Nur per GBU-Frist mit Begründung; keine Automatik |

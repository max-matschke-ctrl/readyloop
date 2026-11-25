# Recherche: Was brauchen Mitarbeiter und QR-Betrachter wirklich?

Stand 25.11.2026 · Auftrag: Hypothese von Max prüfen („nur Mängel? verwendbar? aktuell geprüft?“) · Bezug: `docs/requirements.md` F-21, F-24, F-26, US-17, US-18 · Recherche-Agent

Quellenlage: Normtexte über gesetze-im-internet.de (BetrSichV-Volltext, ArbSchG § 16) und den BGN-Spiegel der DGUV-Vorschriften. TRBS 1201 (Fassung 2019) war im Volltext nicht abrufbar, nur die aufgehobene Fassung 2012. Wettbewerber nur über Herstellerseiten (Sekundärquelle). Usability-Aussagen stützen sich auf ASR A1.3 und WCAG 1.4.1; der Rest ist als Einschätzung gekennzeichnet.

## 1. Kurzfazit

Die Hypothese stimmt im Kern. Drei Ergänzungen und eine Korrektur sind nötig.

1. **Bestätigt:** Beschäftigte brauchen eine Antwort auf „Darf ich das benutzen?“ mit Grund. Die Pflicht dahinter liegt beim Arbeitgeber: Prüfpflichtige Arbeitsmittel dürfen nur verwendet werden, wenn die Prüfungen durchgeführt und dokumentiert sind (§ 4 Abs. 4 BetrSichV). Mangelhafte Arbeitsmittel darf er nicht verwenden lassen (§ 5 Abs. 2 BetrSichV).
2. **Präzisierung zu „aktuell geprüft“:** Statt Ja/Nein besser „geprüft bis {Datum}“, also den nächsten Prüftermin. Das ist die Logik der Prüfplakette. DGUV I 203-071 begründet die Kennzeichnung mit dem nächsten Prüftermin damit, dass auch der Benutzer bei der Überwachung der Fristen mitwirken kann.
3. **Ergänzung „Mängel“:** Für Beschäftigte zählt weniger die Information als die Handlung. Mängel melden ist ihre gesetzliche Pflicht (§ 16 ArbSchG, § 16 DGUV V1). Deshalb ist „Mangel melden“ Pflichtbestandteil der Ansicht. Die Mängelbeschreibung ist dagegen nicht nötig. Die Anzahl offener Mängel genügt, damit niemand denselben Mangel doppelt meldet.
4. **Ergänzung Sichtkontrolle:** Grün in der App ersetzt nicht die Kontrolle vor jeder Verwendung (§ 4 Abs. 5 S. 3 BetrSichV). Ein kurzer Satz dazu gehört auf jede „Verwendbar“-Ansicht.
5. **Korrektur bei „Prüfdatum unbekannt“:** F-21 stuft das heute als `unklar` ein, und eine Übernahme ist möglich. Nach § 4 Abs. 4 BetrSichV fehlt dann aber der dokumentierte Nachweis. Empfehlung: Für Beschäftigte wie „Nicht verwenden, bis der Verantwortliche freigibt“ behandeln. Das muss die Sifa entscheiden (Abschnitt 6).

Entbehrlich sind für Beschäftigte: Prüffrist in Monaten, Quelle, Stufe A–D, Fundstelle, GBU-Verweis und Herkunft des Prüfdatums. Diese Angaben dokumentieren die Pflichten des Arbeitgebers nach § 3 Abs. 6 BetrSichV. Sie helfen niemandem an der Maschine bei der Entscheidung. Den Prüfernamen verlangt das Gesetz in der Aufzeichnung (§ 14 Abs. 7 S. 2). Für den Nachweis am Einsatzort ist er nach dem Wortlaut nicht eindeutig gefordert (Abschnitt 2.3). Empfehlung: aus der Hauptansicht nehmen und höchstens in einem aufklappbaren Bereich „Prüfnachweis“ zeigen.

**Konflikt mit CLAUDE.md** („Jede Frist zeigt Quelle und Stufe“): Die Empfehlung zeigt in den MA- und QR-Ansichten nur noch ein Fälligkeitsdatum, keinen Fristwert. Die Regel bleibt eingehalten, wenn man sie so liest: Ein **Fristwert** (n Monate) erscheint nie ohne Quelle und Stufe, ein reines Fälligkeitsdatum schon. Diese Auslegung muss Max ausdrücklich bestätigen, bevor der requirements-engineer F-24 ändert.

## 2. Rechtliche Grundlage

### 2.1 Pflichten des Arbeitgebers mit Wirkung auf die Mitarbeiteransicht

| Fundstelle | Inhalt (verkürzt) | Folge für die Ansicht | Sicherheit |
|---|---|---|---|
| § 4 Abs. 4 BetrSichV | Prüfpflichtige Arbeitsmittel dürfen nur verwendet werden, wenn die Prüfungen durchgeführt und dokumentiert sind; der Arbeitgeber stellt das sicher | Kernaussage „verwendbar / nicht verwenden“. Ohne dokumentierte Prüfung: nicht verwenden | bestätigt (Spiegel lxgesetze.de + gesetze-im-internet.de) |
| § 4 Abs. 5 S. 3–4 BetrSichV | Vor jeder Verwendung Kontrolle auf offensichtliche Mängel, auch bei Geräten mit wiederkehrender Prüfung | Hinweis „Vor Benutzung auf sichtbare Schäden prüfen“, sonst entsteht falsche Sicherheit durch Grün | bestätigt |
| § 5 Abs. 2 BetrSichV | Arbeitsmittel mit Mängeln, die die sichere Verwendung beeinträchtigen, nicht zur Verfügung stellen und nicht verwenden lassen | Gefährlicher Mangel → „Nicht verwenden“ (wie F-9/F-21) | bestätigt (über gesetze-im-internet.de, Zusammenfassung) |
| § 12 Abs. 1 BetrSichV | Unterweisung vor Aufnahme der Tätigkeit, danach mindestens jährlich; Informationen in verständlicher Form und Sprache | Begründet Formulierungen in einfacher Sprache. Unterweisung selbst nicht Produktumfang (R-36) | bestätigt |
| § 12 Abs. 2 BetrSichV | Schriftliche Betriebsanweisung in verständlicher Form und Sprache an geeigneter Stelle; eine Gebrauchsanleitung kann genügen | Optional später: Link zur Betriebsanweisung auf der QR-Seite. Keine Pflicht, sie über die App bereitzustellen | bestätigt |
| § 14 Abs. 7 S. 1–3 BetrSichV | Aufzeichnung: Art, Umfang, Ergebnis, Name und Unterschrift des Prüfers; Aufbewahrung mindestens bis zur nächsten Prüfung | Gilt für die Aufzeichnung (Geräteakte, Export), nicht für die Anzeige an Beschäftigte | bestätigt |
| § 14 Abs. 7 S. 4 BetrSichV | Bei Verwendung an unterschiedlichen Betriebsorten ist am Einsatzort ein Nachweis über die Durchführung der letzten Prüfung vorzuhalten | QR-Seite muss für wechselnde Geräte die **letzte Prüfung** (Datum, Prüfart, Ergebnis) zeigen. Der Wortlaut nennt den Prüfernamen nicht ausdrücklich | bestätigt (Wortlaut); Umfang „Nachweis“ unsicher |

### 2.2 Pflichten und Rechte der Beschäftigten

| Fundstelle | Inhalt (verkürzt) | Folge für die Ansicht | Sicherheit |
|---|---|---|---|
| § 16 Abs. 1 ArbSchG | Unmittelbare erhebliche Gefahren und jeden festgestellten Defekt an Schutzsystemen unverzüglich dem Arbeitgeber oder Vorgesetzten melden | „Mangel melden“ immer erreichbar, auch ohne Login als Hinweis „beim Verantwortlichen melden“ | bestätigt |
| § 16 Abs. 2 ArbSchG | Gefahren und Mängel zusätzlich Sifa, Betriebsarzt oder Sicherheitsbeauftragtem mitteilen | Kein Pflichtfeld in der App. Bestätigungstext darf nicht suggerieren, die Meldung ersetze das Gespräch bei unmittelbarer Gefahr | bestätigt |
| § 15 Abs. 1 DGUV V1 | Für eigene und fremde Sicherheit sorgen, Weisungen befolgen; erkennbar gegen Sicherheit gerichtete Weisungen nicht befolgen | „Nicht verwenden“ ist als Anweisung zu formulieren, nicht als Empfehlung | bestätigt (BGN-Spiegel) |
| § 16 DGUV V1 | Defekte melden; sonstige Mängel selbst beseitigen, wenn das zur Aufgabe gehört und die Befähigung vorliegt, sonst dem Vorgesetzten melden | wie § 16 ArbSchG | bestätigt (BGN-Spiegel) |
| § 17 DGUV V1 | Arbeitsmittel bestimmungsgemäß benutzen; Bestimmung ergibt sich u. a. aus Herstellerangaben und Betriebsanweisungen | Stützt optionalen Link zur Betriebsanweisung | bestätigt (BGN-Spiegel) |
| §§ 12, 15, 17 ArbSchG | Unterweisung; Pflicht, für Sicherheit zu sorgen und Arbeitsmittel bestimmungsgemäß zu verwenden; Vorschlags- und Beschwerderecht | Keine zusätzliche Anzeigepflicht erkennbar | Volltext in dieser Sitzung nicht abgerufen, Inhalt aus Kenntnis: **unsicher** |

### 2.3 Muss ein Beschäftigter Prüfdatum oder Prüfer sehen?

- **Prüfdatum / nächster Termin:** Eine ausdrückliche Pflicht, Beschäftigten den nächsten Termin anzuzeigen, habe ich nicht gefunden. Eine Prüfplakette ist nicht generell vorgeschrieben (DGUV I 203-071 Abschn. 8; KomNet 15142: „sinnvoll, aber nicht zwingend“). Die Begründung für die Plakette ist aber genau die Mitwirkung des Benutzers. Weil Readyloop die Plakette als Erkennungszeichen nutzt, gehört der nächste Termin in die Hauptansicht.
- **Letzte Prüfung:** Bei wechselnden Einsatzorten ist ein Nachweis über die Durchführung der letzten Prüfung am Einsatzort Pflicht (§ 14 Abs. 7 S. 4). Für ortsgebundene Geräte gilt das nicht. Datum, Prüfart und Ergebnis der letzten Prüfung gehören deshalb auf die QR-Seite. Für Beschäftigte reicht ein aufklappbarer Bereich.
- **Prüfername:** Ist Pflichtinhalt der Aufzeichnung (S. 2), aber S. 4 verlangt nur einen „Nachweis über die Durchführung“. Laut DGUV I 203-071 lässt TRBS 1201 dafür auch eine Prüfplakette „mit den relevanten Angaben“ zu (Sekundärzitat; TRBS-Volltext 2019 nicht geprüft). Plaketten tragen in der Praxis meist keinen Namen. **Einschätzung: unsicher.** Der Name ist für Beschäftigte entbehrlich. Für Kontrolleure ist er im aufklappbaren Nachweis vertretbar. Er ist das einzige personenbezogene Datum auf einer öffentlich erreichbaren URL; Datensparsamkeit spricht für Einklappen oder für den Namen der Prüffirma. Frage an Sifa und Datenschutz (Abschnitt 6).
- **Physische Plakette:** Die große Zahl in der Mitte steht für das Jahr, die Zahl am Rand oben für den Monat der **nächsten** Prüfung (heimwerker.de, Sekundärquelle). DGUV I 203-071 fordert die Kennzeichnung „mit dem nächsten Prüftermin“. Prüfer und Prüfdatum stehen auf der Standardplakette nicht.

## 3. Praxis: Was zeigen andere?

| Beispiel | Was der Nutzer sieht | Quelle | Sicherheit |
|---|---|---|---|
| Prüfplakette (Elektro, Leitern, Regale) | Nur Monat und Jahr der nächsten Prüfung | DGUV I 203-071 Abschn. 8; heimwerker.de | bestätigt / Sekundärquelle |
| Timly Direct-Access-Label (ohne Login) | Gerätename, Kaufdatum, Zustand, Zuordnung, letzter Standort, Kontaktpersonen mit Kontaktdaten; Ticket für Schaden direkt aus dem Label. Nächste Prüfung wird nicht erwähnt. Sensible Daten nicht abrufbar, keine Änderungen möglich | timly.com/en/direct-access-labels | Sekundärquelle (Hersteller) |
| Hilti ON!Track | Beim Scannen sehen Arbeiter Notizen, z. B. wie lange ein Werkzeug bis zum Expositionsgrenzwert genutzt werden darf. Prüf- und Kalibrieralarme gehen an Verantwortliche, nicht an Arbeiter (laut Seite) | hilti.group … /on-track/compliance.html | Sekundärquelle (Hersteller) |
| Certado, ToolSense | Keine öffentliche Beschreibung der Mitarbeiter- oder QR-Ansicht gefunden | – | nicht ermittelt |
| Gerüstanhänger (Scafftag u. ä.) | Statuskarte am Gerät mit eingeschobenem Prüfnachweis; Zweck laut Hersteller: Beschäftigte über unsichere Geräte informieren. Konkrete Felder im Dokument nicht beschrieben | safetydirect.ie (Scafftag-Broschüre) | Sekundärquelle, Felder nicht ermittelt |

Muster: Die gesichteten Ansichten für Beschäftigte zeigen **Zustand, Kontakt und Schaden melden**. Fristgrundlagen zeigt keine. Readyloops heutige QR-Seite ist deutlich detaillierter als alles, was ich bei Wettbewerbern gefunden habe.

## 4. Usability für Nicht-Experten

- **Nie nur Farbe.** ASR A1.3: Ein Sicherheitszeichen besteht aus Form, Farbe und Symbol; bei eingeschränkter Wahrnehmung (z. B. mit PSA) ergänzende Kennzeichnung. WCAG 1.4.1: Farbe darf nicht das einzige visuelle Mittel sein, um Information zu vermitteln. Readyloop erfüllt das schon mit F-9/F-21 („nie nur über Farbe“). Hinweis: Die abgerufene ASR-A1.3-Fassung ist von 2007 und aufgehoben; die Zuordnung Rot = Verbot, Gelb = Warnung, Grün = Rettung/Sicherheitseinrichtung ist aber erfahrungsgemäß unverändert (vor Übernahme ins Designsystem gegen die aktuelle Fassung prüfen).
- **Farbbedeutung:** Rot steht für Verbot, passt also zu „Nicht verwenden“. Gelb steht für Warnung, passt zu „Verantwortlichen fragen“. Grün ist im Arbeitsschutz eigentlich Rettung bzw. Sicherheitseinrichtung, wird als „in Ordnung“ aber allgemein verstanden (Einschätzung).
- **Ein Blick, ein Satz (Einschätzung):** In der Halle wird das Handy kurz gezückt, oft mit Handschuhen, schlechtem Licht oder Lärm. Daraus folgt: oben ein Zustand in maximal drei Wörtern mit Symbol, darunter ein Satz Grund und ein Satz Handlung, darunter höchstens eine Hauptaktion. Alles Weitere eingeklappt. Keine Abkürzungen (keine „Stufe B“, „GBU“, „zbP“).
- **Kein Alarm ohne Handlung:** „Bald fällig“ ist für Beschäftigte keine Handlung. Gelb oder ein Warnton dafür stumpft ab. Empfehlung: in der MA-Ansicht als „Verwendbar“ zeigen, Datum normal darunter.

## 5. Empfehlung

### 5.1 Pflichtinformationen (Hauptansicht, ohne Aufklappen)

| # | Information | Begründung / Fundstelle | Gewicht |
|---|---|---|---|
| MA-01 | **Zustand** in einem von drei Werten: „Verwendbar“, „Nicht verwenden“, „Erst Verantwortlichen fragen“ – mit Symbol und Text | § 4 Abs. 4, § 5 Abs. 2 BetrSichV; F-21 | 5 |
| MA-02 | **Grund** in einem kurzen Satz (nur bei Nicht verwenden / Fragen) | Verständlichkeit, § 12 Abs. 1 BetrSichV „verständliche Form“ | 5 |
| MA-03 | **Handlung** in einem Satz („Nicht benutzen. Verantwortlichen informieren.“) | § 16 ArbSchG, § 16 DGUV V1 | 5 |
| MA-04 | **Bezeichnung und Inventarnummer** | Abgleich, ob der Aufkleber zum Gerät gehört (vertauschte oder kopierte Aufkleber) | 5 |
| MA-05 | **„Geprüft bis {TT.MM.JJJJ}“** = frühester nächster Prüftermin aller Prüfarten; bei Überfälligkeit „Prüfung überfällig seit {Datum}“ | DGUV I 203-071 Abschn. 8 (Mitwirkung des Benutzers); entspricht der Plakette | 4 |
| MA-06 | **Mangel melden** als sichtbare Aktion (MA angemeldet) bzw. „Anmelden und Mangel melden“ / „Mangel dem Verantwortlichen melden“ (anonym) | § 16 ArbSchG, § 16 DGUV V1 | 5 |
| MA-07 | **Anzahl offener Mängel** („1 Mangel bereits gemeldet“), ohne Beschreibung | Verhindert Doppelmeldungen; F-26 | 3 |
| MA-08 | **Hinweis Sichtkontrolle** bei „Verwendbar“: „Vor Benutzung auf sichtbare Schäden prüfen.“ | § 4 Abs. 5 S. 3–4 BetrSichV | 4 |
| MA-09 | **Stand** (Uhrzeit des Abrufs), klein | Ansicht ist eine Momentaufnahme; Screenshots werden weitergegeben | 3 |
| MA-10 | Betrieb (Name) nur auf der QR-Seite | Kontrolleur und Fremdfirmen müssen das Gerät einem Betrieb zuordnen können | 3 |

### 5.2 Aufklappbar „Prüfnachweis“ (QR-Seite immer; MA-Ansicht optional)

| # | Information | Begründung | Gewicht |
|---|---|---|---|
| MA-11 | Je Prüfart: Bezeichnung (Klartext, z. B. „Elektroprüfung“), Zustand, geprüft bis | Mehrere Prüfarten je Gerät (R-05); der Grund im Hauptbereich nennt die maßgebliche | 4 |
| MA-12 | Letzte Prüfung je Prüfart: Datum und Ergebnis („ohne Mängel“, „mit Mängeln, Weiterbetrieb zulässig“, „nicht bestanden“) | § 14 Abs. 7 S. 4 BetrSichV (wechselnde Einsatzorte) | 5 für `wechselnd`, 3 sonst |
| MA-13 | Prüfer (Name oder Prüffirma) | § 14 Abs. 7 S. 2 betrifft die Aufzeichnung; ob der Nachweis am Einsatzort ihn braucht, ist unsicher | 2 (unsicher) |
| MA-14 | Hersteller, Typ | Zuordnung durch Kontrolleur oder Prüfer | 2 |
| MA-15 | Link „Betriebsanweisung“ (später, wenn Dokumente in I4 kommen) | § 12 Abs. 2 BetrSichV, § 17 DGUV V1; nur Möglichkeit, keine Pflicht über die App | 2 |

### 5.3 Entfällt in MA-Ansicht und QR-Seite

| Information | Begründung | Wo sie bleibt |
|---|---|---|
| Prüffrist in Monaten | Arbeitgeberentscheidung nach § 3 Abs. 6 BetrSichV, keine Handlungsinformation für Beschäftigte | Geräteakte, Export, Mails an VER/SIF |
| Quelle (Katalog/Hersteller/GBU), Stufe A–D, Fundstelle | dito; Fachbegriffe ohne Nutzen am Gerät | Geräteakte, Export |
| GBU-Verweis | interne Unterlage des Arbeitgebers | Geräteakte |
| Herkunft des Prüfdatums (Prüfbericht/Plakette) | interne Datenqualität | Geräteakte |
| Status „bald fällig“ als Warnung | keine Handlung für Beschäftigte (Abschnitt 4) | Büroansicht, Mails |
| Text „Frist über GBU festlegen“ | Arbeitsauftrag an VER/SIF, für Beschäftigte unverständlich | Büroansicht, Mails |
| Prüfername in der Hauptansicht | nicht für die Entscheidung nötig; Datensparsamkeit (Art. 5 Abs. 1 lit. c DSGVO) | aufklappbar (MA-13) oder nur Geräteakte |

### 5.4 Zustände und Formulierungen

Aufbau: **Zustand** (groß, Symbol) · Grund · Handlung. Datumsformat TT.MM.JJJJ.

| Fachstatus (F-9/F-21) | Zustand | Grund | Handlung |
|---|---|---|---|
| `ok` | Verwendbar | Geprüft bis {Datum} | Vor Benutzung auf sichtbare Schäden prüfen. |
| `bald_faellig` | Verwendbar | Geprüft bis {Datum} | wie `ok` (kein Warnhinweis) |
| `ok` + offener Mangel nicht gefährlich | Verwendbar | Geprüft bis {Datum} · {n} Mangel gemeldet, Weiterbetrieb zulässig | Vor Benutzung auf sichtbare Schäden prüfen. |
| `ueberfaellig` | Nicht verwenden | Prüfung überfällig seit {Datum} | Gerät nicht benutzen. Verantwortlichen informieren. |
| `vor_nutzung_pruefen` / `anlass` | Nicht verwenden | Muss nach {Anlass in Klartext, z. B. „einem Schaden“, „einer Reparatur“, „längerer Nichtbenutzung“} geprüft werden | Erst nach der Prüfung benutzen. |
| `vor_nutzung_pruefen` / `nicht_bestanden` | Nicht verwenden | Letzte Prüfung nicht bestanden | Gerät nicht benutzen. Verantwortlichen informieren. |
| `vor_nutzung_pruefen` / `gefaehrlicher_mangel` | Nicht verwenden | Gefährlicher Mangel gemeldet | Gerät nicht benutzen. Der Verantwortliche ist informiert. |
| `ausser_betrieb` (Frist läuft noch oder abgelaufen) | Nicht verwenden | Außer Betrieb | Gerät nicht benutzen. |
| `unbekannt` | Erst Verantwortlichen fragen | Kein Prüfnachweis hinterlegt | Nur nach Freigabe durch den Verantwortlichen benutzen. |
| `gbu` (keine freigegebene Frist) | Erst Verantwortlichen fragen | Prüftermin noch nicht festgelegt | Vor Benutzung Verantwortlichen fragen. |
| ungültiger Token | Aufkleber ungültig | Dieser Aufkleber gehört zu keinem aktiven Gerät. | Gerät nicht benutzen, bis der Verantwortliche es geklärt hat. |

Hinweise zu den Sonderfällen:
- **Vor Nutzung prüfen (Anlass):** Der Anlass (Unfall, Reparatur, Nichtbenutzung) erklärt Beschäftigten, warum ein eben noch grünes Gerät gesperrt ist. Die Beschreibung des Anlasses bleibt intern.
- **Außer Betrieb:** Die Fristlage ist für Beschäftigte gleichgültig; ein Zustand genügt. Bei übernommenen Geräten zusätzlich „Bitte zurückgeben.“ (wie F-35).
- **Prüfdatum unbekannt:** Die heutige Formulierung „Prüfstatus unklar“ ist zu weich, wenn § 4 Abs. 4 BetrSichV einen dokumentierten Nachweis voraussetzt. „Kein Prüfnachweis hinterlegt“ beschreibt die Lage ehrlich, ohne zu behaupten, das Gerät sei ungeprüft (der Papiernachweis kann existieren).
- **Frist über GBU festlegen:** Für Beschäftigte heißt das nur: Der Betrieb hat noch keinen Termin festgelegt. Den Arbeitsauftrag „GBU“ sehen sie nicht.

### 5.5 QR-Seite anonym vs. angemeldeter Mitarbeiter

| Element | Anonym (Fremdfirma, Kontrolleur, Passant) | MA angemeldet, eigener Betrieb |
|---|---|---|
| MA-01 bis MA-05, MA-08, MA-09 | ja | ja |
| Betrieb (MA-10) | ja | nein (bekannt) |
| Prüfnachweis aufklappbar (MA-11/12) | ja, standardmäßig **eingeklappt**; bei `wechselnd` sichtbar beschriftet „Nachweis der letzten Prüfung“ | ja, eingeklappt |
| Prüfer (MA-13) | höchstens Prüffirma oder eingeklappt; Entscheidung offen | eingeklappt |
| Anzahl offener Mängel (MA-07) | nein (Außenwirkung, nicht nötig) | ja |
| Mangel melden | Hinweis „Mangel? Bitte dem Verantwortlichen vor Ort melden.“ + „Anmelden und Mangel melden“ | Knopf „Mangel melden“ |
| Übernehmen / Zurückgeben | „Anmelden und übernehmen“ nach F-24/US-43 | Knöpfe nach F-23 |
| Frist, Quelle, Stufe, Fundstelle, Herkunft | nein | nein |
| „Meine Geräte“ (Liste) | – | je Gerät nur Zustand, Bezeichnung, Inventarnummer, geprüft bis; Sortierung „Nicht verwenden“ zuerst |

Begründung für die eingeklappte Anzeige auch bei anonym: Die meisten anonymen Aufrufer sind Beschäftigte ohne Konto (F-20: ohne E-Mail kein Zugang). Kontrolleure finden den Nachweis mit einem Tipp.

### 5.6 Folgen für bestehende Anforderungen (zur Prüfung durch den requirements-engineer)

- **F-24 „Inhalt ohne Login“:** Frist (Monate, Quelle, Stufe, Fundstelle), letzte Prüfung mit Herkunft und Prüfername aus der Hauptansicht streichen. Nachweis je Prüfart als Aufklappbereich (MA-11/12/13).
- **US-17:** „je Prüfart Status, fällig am, Frist mit Quelle und Stufe“ ersetzen durch Zustand, Grund, Handlung, geprüft bis.
- **F-21 Regel 3:** `unbekannt` mit eigenem Text (Abschnitt 5.4) und Q-30 (Übernahme bei `unklar` möglich) neu bewerten. Vorschlag: Bei `unbekannt` keine Übernahme.
- **CLAUDE.md-Regel „Jede Frist zeigt Quelle und Stufe“:** Auslegung für reine Fälligkeitsdaten bestätigen lassen (siehe Kurzfazit).
- **F-25 Etikett:** bleibt; „Geprüft bis“-Sprache auf Plakette und App gleich halten. Achtung: Die Plakette zeigt Monat/Jahr, die App ein Tagesdatum. Mitte des Monats kann die App schon „überfällig“ zeigen, während die Plakette noch gültig wirkt. Der Satz „Aktueller Status: QR scannen“ auf dem Etikett fängt das ab. Gilt die Plakette in der Praxis bis Monatsende, muss die Sifa das festlegen.

## 6. Offene Fragen

| # | Frage | An wen |
|---|---|---|
| O-1 | Darf ein Gerät mit „Prüfdatum unbekannt“ bis zur Klärung verwendet werden, oder gilt § 4 Abs. 4 BetrSichV als „nicht verwenden“? | Sicherheitsingenieur |
| O-2 | Gehört der Prüfername zum „Nachweis über die Durchführung der letzten Prüfung“ am Einsatzort (§ 14 Abs. 7 S. 4)? Genügt die Prüffirma? | Sicherheitsingenieur, Datenschutz |
| O-3 | Bestätigt Max die Auslegung „Fälligkeitsdatum ohne Fristwert braucht keine Quelle/Stufe“? | Max |
| O-4 | Wie verstehen Beschäftigte im Pilotbetrieb die drei Zustände? Fünf kurze Tests an der Maschine (ein Blick, ein Satz: „Was tun Sie jetzt?“) | Pilot, Interview |
| O-5 | TRBS 1201 (2019) im Volltext auf Aussagen zu Prüfplakette und Nachweis am Einsatzort prüfen | Recherche, nächste Runde |

## 7. Quellen

Primärquellen
- BetrSichV, Volltext (§§ 4, 5, 10, 12, 14): https://www.gesetze-im-internet.de/betrsichv_2015/BJNR004910015.html
- BetrSichV § 4 (Spiegel): https://lxgesetze.de/betrsichv/4
- ArbSchG § 16: https://www.gesetze-im-internet.de/arbschg/__16.html
- DGUV V1 § 16 (BGN-Spiegel): https://vorschriften.bgn-branchenwissen.de/daten/dguv/1/16.htm
- DGUV R 100-001 Kap. 3, Pflichten der Versicherten (§§ 15–17 DGUV V1, BGN-Spiegel): https://vorschriften.bgn-branchenwissen.de/daten/dguv/100_001/3.htm
- DGUV I 203-071 Abschn. 8, Dokumentation und Kennzeichnung (BGN-Spiegel): https://vorschriften.bgn-branchenwissen.de/daten/dguv/203_071/8.htm
- TRBS 1201, Fassung 2012, aufgehoben (nur zur Einordnung): https://umwelt-online.de/recht/t_regeln/trbs/1201.htm
- TRBS 1201, Fassung 2019, nur Auszug abrufbar: https://umwelt-online.de/recht/t_regeln/trbs/1201_19.htm
- ASR A1.3, Fassung 2007, aufgehoben (Farbbedeutungen): https://umwelt-online.de/recht/arbeitss/arbst.vo/arbst.rl/a1_3a.htm
- WCAG 2.x SC 1.4.1 Use of Color: https://www.w3.org/WAI/WCAG21/Understanding/use-of-color

Sekundärquellen
- KomNet NRW, Dialog 15142 (Plakette nicht zwingend), Stand 2016: https://www.komnet.nrw.de/_sitetools/dialog/15142
- Prüfplaketten lesen (Monat/Jahr der nächsten Prüfung): https://www.heimwerker.de/pruefplaketten-lesen/
- Timly Direct-Access-Labels: https://timly.com/en/direct-access-labels
- Hilti ON!Track Compliance: https://www.hilti.group/content/hilti/CP/XX/en/services/tool-services/on-track/compliance.html
- Scafftag-Broschüre: https://www.safetydirect.ie/productpdf/download/file/id/23598/name/Scafftag_Scaffold_Safety_Management_System.pdf/

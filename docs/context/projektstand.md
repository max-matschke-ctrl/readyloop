# Projektstand Readyloop (Arbeitsname, früher „Sifa-App“, auch „Dueline“)

Stand 19.11.2026. Verdichtet aus Projektnotizen und den Projekt-Docs
`claude/mvp-umfang-und-rollen.md`, `claude/strategie-zielgruppe-pruefkatalog-ersterfassung.md`,
`claude/datenstrategie-kfz-werkstaetten.md`.

## Produkt
B2B-SaaS, damit Betriebe keine Prüffrist für Arbeitsmittel verpassen und Nachweise jederzeit vorzeigen können.
Vision: Foto eines Arbeitsmittels → geltende Vorschriften → welche Prüfungen wie oft, Richtwerte, Pflicht vs. freiwillig.
Erste Version: Fristen nicht verpassen + Nachweis zeigen.

## ZIELGRUPPE – NEU (19.11.2026)
Nicht mehr nur Handwerk/Kfz-Werkstätten. Ziel sind kleine bis mittelgroße Mittelständler
(grob 20–500 Beschäftigte, Produktion, Logistik, Bau, Dienstleistung mit Technik), weil dort die
Zahlungsbereitschaft höher ist. Folgen: breiterer Gerätebestand, mehrere BGs, oft angestellte oder
externe Sifa, mehrere Bereiche/Verantwortliche, Excel- oder Papierlisten, teils ERP. Mehrere Standorte
werden wahrscheinlicher.

## MVP-Entscheidungen (29.10.2026)
- Echter Pilot: ein Betrieb, ein Standort, echte Geräte.
- Drei Zugänge: Web-App Büro, Mitarbeiter-App (PWA), Prüfer-Zugang (eigenes Konto über mehrere Betriebe).
- Erfassung: manuell, KI-Import Excel/PDF, Typenschild-Foto; Mensch bestätigt jeden Import.
- Gerätekategorien: personenbezogen, ortsgebunden, wechselnd. Wechselnde Geräte: Aufkleber NFC + QR.
- Regelwerk zentral gepflegt (Max), Frist hängt von Geräteart und Einsatzort ab.
- Frist = Vorschlag mit Quelle, Freigabe durch Verantwortlichen oder Sifa.
- Fälligkeit: E-Mail an Verantwortlichen (Sifa in Kopie).
- Nachweis: Prüfer lädt PDF hoch, trägt Datum + Ergebnis von Hand ein (keine KI).
- Verlauf je Gerät; Export Excel/PDF für BG-Besichtigung.
- KI: Claude-API serverseitig hinter austauschbarem Adapter, Namen vorher entfernt.
- Login E-Mail + Passwort, später SSO.
- Nicht im MVP: Sperren, Prüfdienstleister-Vorschlag/Terminbuchung, mehrere Standorte, UHF/Bluetooth, SAP, Steuerberater-Export, Push, KI für Nachweise.

## Rollen
Mitarbeiter (eigene + übernommene Geräte, übernehmen, Mangel melden) · Verantwortlicher (je Bereich,
Geräte anlegen/importieren, Fristen freigeben, Prüfer einladen/zuweisen, Nachweise, Mängel, Export) ·
Sifa (angestellt oder extern über mehrere Betriebe; alles sehen, Fristen freigeben) · Prüfer (extern,
nur fällige/zugewiesene Geräte, Nachweis + Datum + Ergebnis) · Admin (Firmenkonto, Rollen, Bereiche).

## Fachliche Grundsätze (nicht verhandelbar)
- § 3 Abs. 6 BetrSichV: Arbeitgeber legt Art, Umfang, Fristen über die Gefährdungsbeurteilung fest. Kein Katalog ist allgemeinverbindlich.
- Jede Frist hat Fundstelle, Verbindlichkeitsstufe und Freigabestatus.
  Stufe A gesetzliche/UVV-Höchstfrist (fest) · B Richtwert DGUV (Abweichung nur mit Begründung) ·
  C GBU/Herstellerangabe (kürzere Herstellerfrist hat Vorrang) · D Empfehlung · ohne Eintrag: „Frist über GBU festlegen“.
- Deterministische Regel-Engine über freigegebene Katalogeinträge. Kein LLM formuliert Vorschriften frei. Ohne Eintrag keine geratene Frist.
- Katalogeinträge brauchen fachliche Freigabe (Sicherheitsingenieur) mit Name, Datum, Version.
- UVVs gelten je zuständiger BG → BG-Zuständigkeit je Betrieb hinterlegen.
- AVV nach Art. 28 DSGVO vor echten Kundendaten. Betriebsrat vor Pilot (Mitarbeiter-App = mögliche Leistungs-/Verhaltenskontrolle, § 87 Abs. 1 Nr. 6 BetrVG).
- Unbekannte Prüfdaten nicht schätzen: Status „Prüfdatum unbekannt → Prüfung veranlassen“; jedes Datum speichert seine Herkunft.

## Tech-Stack
Next.js App Router, TypeScript, Supabase (Postgres + RLS + Storage + Auth), Zod, Resend (Mail),
Anthropic API nur serverseitig, später Stripe. Design: Space Grotesk / IBM Plex; Farben Steel/Moss/Ochre/Brick;
Prüfplaketten-Badge als Erkennungszeichen.

## Wettbewerb (bekannt)
Timly, HOPPE Wartungsplaner, ToolSense, RB-Prüfservice UG, PinDo (Eberle), ORSY online (Würth/towio).

## Regelwerk-Referenzen
BetrSichV (inkl. Anhang 2/3), TRBS 1201, 1203, DGUV V1, V3, V52, V68, V70, DGUV R 100-500, ASR A1.7, A2.2, A2.3, A3.4/7,
ArbSchG, ArbStättV, ASiG, DIN/VDE, DIN EN 15635 (Regale), DIN 14406-4 (Feuerlöscher).

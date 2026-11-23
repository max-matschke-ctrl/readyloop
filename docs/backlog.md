# Backlog Readyloop

Stand 23.11.2026 (I3M erledigt inkl. Review-Fixes, Commits 989f2ef, 5e4e748; offen FE-15a und Gates G-4/G-5) · Anforderungen: `docs/requirements.md` (IDs R-xx, P-xx, F-x, US-xx, Q-x)

## 1. Inkremente

| Inkr. | Inhalt | Anforderungen | Ergebnis |
|---|---|---|---|
| **I1** | Datenmodell + RLS, Domäne (Regel-Engine, Status, Rechte), Katalog-Entwurf, Büro-Web-App, Prüfer-Ansicht minimal, Demo-Modus | R-01, R-02 (Teil), R-04, R-05, R-08 (Teil), R-09 (Teil), R-16 (Teil), R-18 (Teil), R-19, R-22 (Teil), R-23, R-24 (Teil), R-28 (Teil), R-31 (Teil), R-40 (Entwurf), P-01–P-06 | lauffähige Demo ohne Datenbank, `npm run build` grün · **erledigt (auf main)** |
| **I2** | Supabase-Betrieb: Supabase-Repository, Login E-Mail/Passwort, Verwaltung Bereiche/Mitglieder, Prüfer einladen/zuweisen, Mängel, Frist nach Ergebnis, Anlassprüfung, außer Betrieb, Gerät verschieben, Prüferqualifikation (Warnung), GBU-Verweis je Prüfart, Demo-Schutz (Q-9), pgTAP-Tests für RLS | R-06, R-07, R-08, R-10, R-11, R-12, R-22, R-24, R-28 | Pilotfähiges Büro mit echter DB · Pakete §4, Vertrag §5 |
| **I3M** | **Mitarbeiter (nächstes Inkrement, vor I3):** Rolle MA in Demo und Login, Einladung durch ADM/VER, „Meine Geräte“, Übernahme/Rückgabe per QR-Link und Suche, Zuordnung personenbezogener Geräte, Mangel melden, öffentliche QR-Seite `/g/[token]`, QR-Etiketten mit Prüfplakette, Datensparsamkeit (90 Tage), responsive am Handy und am Büro-PC | R-03 (QR), R-09, R-12 (Meldung), R-20 (QR), R-38 (responsive), R-45, P-09; F-20–F-29; US-17, US-18, US-27–US-33 | Pakete §6, Vertrag §7. **Erledigt (Branch `mitarbeiter`, inkl. Review-Fixes `20261129000000_review_i3m.sql`)** außer FE-15a (wartet auf Freigabe Max zu Designsystem §9.7). Pilotnutzung erst nach Gate G-4; Supabase-Betrieb erst nach G-5 |
| I3 | E-Mail-Erinnerungen (Resend) 90/60/30, Eskalation VER → SIF → GF, Versandprotokoll; nutzt den `pg_cron`-Weg aus I3M | R-16, R-17 | nach I3M |
| I4 | Export (Excel, PDF, ZIP zum Stichtag), Excel/CSV-Import mit Vorschau, Aufbewahrungs-Nachfrist, Ausmustern (löst Zuordnung/Übernahme, Q-46), Kategorie ändern (Q-45) | R-25, R-27, R-02 | |
| I5 | NFC (gleicher Token wie QR), PWA-Manifest, Offline-Lesen, Foto zum Mangel | R-03 (NFC), R-20 (NFC), R-21, R-38 (PWA) | |
| I6 | KI-Import (Excel/PDF/Typenschild) hinter Adapter, Sammelupload Prüfdienstleister, Import Prüfgeräte-Dateien | R-28, R-29, R-43 | |
| I7 | Should/Could-Rest: überwachungsbedürftige Anlagen, ISO-Berichte, Kontrollen, Elektro-Messwerte, API, Mehrsprachigkeit | R-13, R-14, R-15, R-26, R-33, R-41 | |

Pilot-Gates G-1 bis G-5 siehe `docs/requirements.md` §4.

## 2. Inkrement 1 – Pakete (erledigt, auf main)

Alle Pakete BE-1 bis BE-6, FE-1 bis FE-5 und QA-1 abgeschlossen. Abschnitt bleibt als Referenz; der Vertrag §3 gilt weiter, soweit §5 ihn nicht ändert.

### Dateibesitz (keine gemeinsamen Dateien → parallel möglich)

| Besitzer | Dateien |
|---|---|
| backend-dev | `src/domain/**`, `src/server/**`, `src/app/api/**`, `supabase/**`, `tests/**`, `vitest.config.ts` |
| frontend-dev | `src/app/**` außer `src/app/api/**`, `src/components/**` |
| niemand ohne Absprache | `package.json`, `tsconfig.json`, `next.config.*`, `eslint.config.*` (keine neuen Abhängigkeiten in I1) |

### Reihenfolge

```
BE-1 ──┬── BE-2 ──┐
       ├── BE-3 ──┼── BE-5 ── BE-6 ──┐
       ├── BE-4   │                  ├── QA-1
       └── FE-1 ── FE-2, FE-3, FE-4, FE-5 (untereinander parallel) ──┘
```

FE-2 bis FE-5 kompilieren nach BE-1 (Stubs) und laufen mit Daten nach BE-6.

| Paket | Besitzer | Inhalt | Hängt ab von |
|---|---|---|---|
| BE-1 | backend-dev | Vertrag: `types.ts`, `schemas.ts`, `rechte.ts`; Stubs `data.ts`, `actions.ts`; `vitest.config.ts` | – |
| BE-2 | backend-dev | Regel-Engine, Datum, Status + Tests | BE-1 |
| BE-3 | backend-dev | Prüfkatalog-Entwurf (17 Einträge) + `supabase/seed.sql` + Tests | BE-1 |
| BE-4 | backend-dev | Migration Datenmodell + RLS + Storage + Trigger + statischer Test | BE-1 |
| BE-5 | backend-dev | Demo-Daten, Repository-Interface, In-Memory-Repository, Dienste + Tests | BE-2, BE-3 |
| BE-6 | backend-dev | `data.ts`, `actions.ts`, Demo-Sitzung per Cookie, PDF-Route | BE-5 |
| FE-1 | frontend-dev | Layout, Design-Tokens, Statuskomponenten, Prüfplakette, Demo-Banner, Login, Startseiten-Weiterleitung | BE-1 |
| FE-2 | frontend-dev | Geräteliste mit Filter | FE-1 |
| FE-3 | frontend-dev | Gerätedetail + Frist freigeben | FE-1 |
| FE-4 | frontend-dev | Gerät anlegen | FE-1 |
| FE-5 | frontend-dev | Prüfer-Ansicht + Nachweis erfassen | FE-1 |
| QA-1 | test-runner | typecheck, lint, test, build ohne Umgebungsvariablen; Demo-Durchlauf | alle |

---

### BE-1 Vertrag

Dateien: `src/domain/types.ts` (wörtlich aus §3.1), `src/domain/schemas.ts` (§3.2), `src/domain/rechte.ts` (§3.3), `src/server/data.ts` und `src/server/actions.ts` mit den Signaturen aus §3.5/§3.6 und Rümpfen `throw new Error('nicht implementiert (BE-6)')`, `vitest.config.ts` mit Alias `@` → `src`.

Abnahme:
- `npm run typecheck` grün.
- `tests/rechte.test.ts` prüft die Matrix aus `requirements.md` §6 vollständig (jede Aktion × jede Rolle).
- `imGeltungsbereich`: ADM/SIF true; VER nur bei eigener `bereichId`; PRF nur wenn eigene Benutzer-ID in `zugewiesenePrueferIds`; MA false.

### BE-2 Regel-Engine

Dateien: `src/domain/datum.ts`, `src/domain/fristen.ts`, `src/domain/status.ts`, Tests daneben (`*.test.ts`). Keine Abhängigkeit zu Next, Supabase oder `Date.now()` außer in `heuteBerlin`.

Abnahme (je Fall ein Test):
- `addMonate('2026-01-31', 1)` = `'2026-02-28'`; `addMonate('2028-01-31', 1)` = `'2028-02-29'`; `addMonate('2026-03-15', 48)` = `'2030-03-15'`.
- F-2: exakter Einsatzort schlägt `null`; Entwurf und `zurueckgezogen` ignoriert; höchste Version gewinnt; bei Gleichstand kürzestes Intervall.
- F-3: Hersteller 6 < Katalog 12 → `hersteller` mit `verdraengt`; Hersteller 12 = Katalog 12 → `katalog`; Hersteller ohne Eintrag → `hersteller`; nur Entwurf → `gbu`/`nur_entwurf` mit `orientierung`; Intervall `null` → `ohne_intervall`; `katalogSchluessel` null → `kein_eintrag`; ortsveränderlich + Baustelle → 3 Monate, + Lager → 6 Monate.
- F-4: `vorschlag` bei `gbu`-Vorschlag → Fehler; GBU über freigegebener Stufe-A-Frist → Fehler; GBU über Herstellerfrist → Fehler; GBU 24 bei Stufe-B-Richtwert 12 → ok, Stufe C; Snapshot enthält Katalog-ID und -Version.
- F-5: ohne Frist → `gbu`; Frist ohne Datum → `unbekannt`; Resttage 31 → `ok`, 30 → `bald_faellig`, 0 → `bald_faellig`, −1 → `ueberfaellig`.
- F-6: Reihenfolge `ueberfaellig` > `unbekannt` > `gbu` > `bald_faellig` > `ok`; leere Liste → `gbu`.

### BE-3 Prüfkatalog-Entwurf

Dateien: `src/server/katalog/pruefkatalog.entwurf.ts` (einzige Quelle, `KatalogEintrag[]`), `src/server/katalog/sql.ts` (`katalogAlsSql(): string`), `supabase/seed.sql`, `tests/katalog.test.ts`.

Alle Einträge: `version: 1`, `freigabestatus: 'entwurf'`, `freigegebenVon: null`, `freigegebenAm: null`, feste UUIDs. Werte aus `docs/research/recherche-anforderungen.md` §1:

| # | schluessel | geraetegruppe (Label) | pruefart | einsatzort | Monate | Stufe | fundstelle | quelleUrl | prueferTypen |
|---|---|---|---|---|---|---|---|---|---|
| 1 | elektro_ortsfest.wiederholung | elektro_ortsfest (Ortsfeste elektrische Anlagen und Betriebsmittel) | Wiederholungsprüfung | null | 48 | B | DGUV V3 § 5, DA Tab. 1A | https://vorschriften.bgn-branchenwissen.de/daten/dguv/3/5.htm | efk |
| 2 | elektro_ortsveraenderlich.wiederholung | elektro_ortsveraenderlich (Ortsveränderliche elektrische Betriebsmittel, Leitungen) | Wiederholungsprüfung | null | 6 | B | DGUV V3 § 5, DA Tab. 1B | wie 1 | efk, eup |
| 3 | elektro_ortsveraenderlich.wiederholung | wie 2 | Wiederholungsprüfung | baustelle | 3 | B | DGUV V3 § 5, DA Tab. 1B | wie 1 | efk, eup |
| 4 | kran_kraftbetrieben.wiederkehrend | kran_kraftbetrieben (Kraftbetriebene Krane) | Wiederkehrende Prüfung | null | 12 | A | BetrSichV Anh. 3 Abschn. 1 Nr. 3 Tab. 1; DGUV V52 § 26 Abs. 1 | https://lxgesetze.de/betrsichv/AN-3 | zbp |
| 5 | hebezeug_handbetrieben.wiederkehrend | hebezeug_handbetrieben (Hand-/teilkraftbetriebene Krane, Hebezeuge) | Wiederkehrende Prüfung | null | 12 | A | BetrSichV Anh. 3 Abschn. 1 Tab. 2 | https://lxgesetze.de/betrsichv/AN-3 | zbp |
| 6 | flurfoerderzeug.wiederkehrend | flurfoerderzeug (Flurförderzeuge, Stapler, Hubwagen) | Wiederkehrende Prüfung | null | 12 | A | DGUV V68 § 37; TRBS 1201 Anh. 4 Nr. 7 | https://vorschriften.bgn-branchenwissen.de/daten/dguv/68/37.htm | zbp, sachkundiger |
| 7 | fahrzeug.uvv | fahrzeug (Fahrzeuge) | UVV-Prüfung | null | 12 | A | DGUV V70 § 57 | https://vorschriften.bgn-branchenwissen.de/daten/dguv/70/57.htm | sachkundiger |
| 8 | fahrzeug_hebebuehne.wiederkehrend | fahrzeug_hebebuehne (Fahrzeug-Hebebühnen) | Wiederkehrende Prüfung | null | 12 | B | DGUV R 100-500 Kap. 2.10; TRBS 1201 Anh. 4 Nr. 8 | https://vorschriften.bgn-branchenwissen.de/daten/dguv/100_500/2_10_2.htm | zbp, sachkundiger |
| 9 | hubarbeitsbuehne.wiederkehrend | hubarbeitsbuehne (Hubarbeitsbühnen, Teleskoplader) | Wiederkehrende Prüfung | null | 12 | B | TRBS 1201 Anh. 4 Nr. 9 | https://vorschriften.bgn-branchenwissen.de/daten/tr/trbs1201/anh4.htm | zbp |
| 10 | lastaufnahmemittel.wiederkehrend | lastaufnahmemittel (Lastaufnahme- und Anschlagmittel) | Wiederkehrende Prüfung | null | 12 | B | TRBS 1201 Anh. 4 Nr. 1; DGUV R 109-017 | https://vorschriften.bgn-branchenwissen.de/daten/tr/trbs1201/anh4.htm | zbp |
| 11 | lastaufnahmemittel.risspruefung | wie 10 | Rissprüfung (Rundstahlketten, vulkanisierte Hebebänder) | null | 36 | B | TRBS 1201 Anh. 4 Nr. 1; DGUV R 109-017 | https://www.haufe.de/id/beitrag/lastaufnahmemittel-HI1728046.html | zbp |
| 12 | regal.experteninspektion | regal (Regale) | Experteninspektion | null | 12 | B | § 14 Abs. 2 BetrSichV; TRBS 1201 Anh. 4 Nr. 14; DIN EN 15635 | https://vorschriften.bgn-branchenwissen.de/daten/tr/trbs1201/anh4.htm | zbp |
| 13 | tor_kraftbetaetigt.wiederkehrend | tor_kraftbetaetigt (Kraftbetätigte Türen und Tore) | Wiederkehrende Prüfung | null | 12 | B | ASR A1.7 Abschn. 10 | https://vorschriften.bgn-branchenwissen.de/daten/tr/asr_a1_7/10.htm | sachkundiger |
| 14 | feuerloescher.wartung | feuerloescher (Feuerlöscher) | Instandhaltung/Prüfung | null | 24 | B | ASR A2.2 Nr. 7.4.2; DIN 14406-4 | https://vorschriften.bgn-branchenwissen.de/daten/tr/asr_a2_2/7.htm | sachkundiger_din14406 |
| 15 | psa_absturz.wiederkehrend | psa_absturz (PSA gegen Absturz) | Wiederkehrende Prüfung | null | 12 | B | DGUV R 112-198 | https://dguv.de/fb-psa/sachgebiete/sachgebiet-psa-gegen-absturz/faq-zum-sachgebiet/index.jsp | sachkundiger |
| 16 | leiter.wiederkehrend | leiter (Leitern und Tritte) | Wiederkehrende Prüfung | null | 12 | D | DGUV I 208-016 Abschn. 6; § 14 BetrSichV | https://vorschriften.bgn-branchenwissen.de/daten/dguv/208_016/6.htm | zbp |
| 17 | sicherheitsbeleuchtung.wiederkehrend | sicherheitsbeleuchtung (Sicherheitsbeleuchtung) | Wiederkehrende Prüfung | null | null | C | ASR A3.4/7; DIN EN 50172 | https://cdn.vbg.de/media/d0c98190242d49a384a1fe7c27afad8b/dld:attachment/fi_pruefempf_table_puv.pdf | sachkundiger |

`hinweis` je Eintrag: Sicherheitsangabe aus der Recherche-Spalte „Sicherheit“ plus Besonderheiten (Nr. 2: „Verlängerung bis 12 Monate (Werkstatt, Fertigung, Baustelle) bzw. 24 Monate (Büro) bei Fehlerquote < 2 % nur per GBU-Frist“; Nr. 4: „Höchstfrist; Arbeitgeber darf nur kürzer festlegen“; Nr. 11: „nur Rundstahlketten und vulkanisierte Hebebänder“; Nr. 14: „Druckprüfung nach BetrSichV gesondert“; Nr. 17: „Frist nicht verifiziert – Frist über GBU festlegen“).

Abnahme `tests/katalog.test.ts`: 17 Einträge; alle `entwurf` ohne Freigabedaten; `fundstelle` nicht leer; `quelleUrl` beginnt mit `https://`; Stufe gültig; (schluessel, einsatzort, version) eindeutig; `katalogAlsSql()` stimmt mit `supabase/seed.sql` überein (`UPDATE_SEED=1 npm test` schreibt die Datei neu).

### BE-4 Migration + RLS

Datei: `supabase/migrations/20261119000000_init.sql`, Test `tests/migration.test.ts`. Tabellen und Felder nach `requirements.md` §5 (snake_case, `organisation_id` auf jeder Tabelle mit Betriebsbezug, auch `geraet_pruefart`, `nachweis`, `ereignis`). Enums als `check`-Constraints mit den Werten aus `types.ts`.

Inhalt:
- Hilfsfunktionen im Schema `app`, `security definer`, `stable`, `search_path` gesetzt: `app.ist_mitglied(org uuid)`, `app.hat_rolle(org uuid, rollen text[])`, `app.verantwortet_bereich(bereich uuid)`, `app.ist_zugewiesen(pruefart uuid)`, `app.sieht_geraet(geraet uuid)`.
- RLS auf allen Tabellen. Policies gemäß Rechte-Matrix: SELECT nach Geltungsbereich; INSERT `geraet`/`geraet_pruefart` für admin + verantwortlicher (Bereich); UPDATE `geraet_pruefart` (Frist-Spalten) für sifa + verantwortlicher (Bereich); INSERT `nachweis` für verantwortlicher (Bereich) + pruefer (zugewiesen). Keine DELETE-Policy auf irgendeiner Tabelle. Kein UPDATE auf `nachweis`, `ereignis`.
- `katalog_eintrag`: RLS an, SELECT für `authenticated`, keine Schreib-Policies (nur Service-Role).
- Trigger (security definer): Frist-Änderung setzt `frist_freigegeben_von = auth.uid()`, `frist_freigegeben_am = now()` und schreibt `ereignis`; INSERT `geraet` → `geraet_angelegt`; INSERT `nachweis` → `nachweis_erfasst` und aktualisiert `letzte_pruefung` nach F-7.
- Check: Frist-Spalten entweder alle leer oder `frist_monate`, `frist_quelle`, `frist_stufe`, `frist_fundstelle` gesetzt; `frist_quelle = 'gbu'` verlangt `frist_begruendung`.
- Check: `letzte_pruefung is null` ⇔ `letzte_pruefung_herkunft = 'unbekannt'`.
- Storage: privater Bucket `nachweise`; Policies auf `storage.objects`: Lesen über die Nachweis-Zeile (`pdf_pfad`, Sicht pro Prüfart), Hochladen nur in den Prüfart-Ordner, den der Nutzer erfassen darf.

Abnahme `tests/migration.test.ts` (liest SQL als Text): jede `create table public.*` hat `enable row level security`; keine `for delete`-Policy; keine `for update`-Policy auf `nachweis`/`ereignis`; alle Rollen- und Statuswerte aus `types.ts` kommen in den Checks vor. Lauf gegen echte DB folgt in I2.

### BE-5 Demo-Daten und Dienste

Dateien: `src/server/repo/types.ts` (`Repository`-Interface, intern), `src/server/repo/demo/daten.ts`, `src/server/repo/demo/repository.ts`, `src/server/dienste.ts` (Funktionen mit explizitem `sitzung`, `repo`, `heute` – testbar ohne Cookies), Tests.

In-Memory-Store als Singleton auf `globalThis` (überlebt Hot Reload, nicht Neustart). Datumswerte relativ zu `heute` erzeugen, damit die Statusverteilung stabil bleibt. Feste UUIDs.

Demo-Organisation: „Elbtal Fördertechnik GmbH“ (fiktiv), 180 Beschäftigte, BG Holz und Metall, Standort „Hauptwerk“.

| Bereich | Einsatzort | Verantwortlicher |
|---|---|---|
| Lager | lager_logistik | Marco Lindner (Demo-Rolle Verantwortlicher) |
| Produktion | werkstatt_fertigung | Sabine Krüger (kein Demo-Login) |
| Verwaltung | buero | Katrin Vogel (Admin, zugleich ohne Bereich) |

Demo-Benutzer: Admin Katrin Vogel · Sifa Dr. Jens Hartmann (extern) · Verantwortlicher Marco Lindner (Lager) · Prüfer Tobias Berger (Prüfdienst Berger).

Geräte (Offsets = Tage vor heute für letzte Prüfung; „GBU 12“ = freigegebene GBU-Frist 12 Monate, Stufe C, Fundstelle „GBU {Bereich} 2025“, Begründung „angelehnt an Katalogentwurf …“; „Herst. 6“ = Vorschlag `hersteller` freigegeben):

| Inv.-Nr. | Gerät | Bereich | Kat. | Prüfart(en) · Frist · letzte Prüfung | Ziel-Status | Prüfer zugewiesen |
|---|---|---|---|---|---|---|
| L-001 | Gabelstapler Linde H25 | Lager | wechselnd | flurfoerderzeug · GBU 12 · −400 | überfällig | ja |
| L-002 | Elektro-Hubwagen | Lager | wechselnd | flurfoerderzeug · GBU 12 · −340 | bald fällig | ja |
| L-003 | Palettenregal Reihe A | Lager | ortsgebunden | regal · GBU 12 · −100 | ok | |
| L-004 | Palettenregal Reihe B | Lager | ortsgebunden | regal · GBU 12 · unbekannt | unbekannt | |
| L-005 | Sektionaltor Rampe 1 | Lager | ortsgebunden | tor (Herstellerfrist 6) · Herst. 6 · −170 | bald fällig | |
| L-006 | Anschlagkette 2-Strang | Lager | wechselnd | lastaufnahmemittel.wiederkehrend · GBU 12 · −60; lastaufnahmemittel.risspruefung · keine Frist · unbekannt | gbu | ja (beide) |
| L-007 | Feuerlöscher Lager FL-01 | Lager | ortsgebunden | feuerloescher · GBU 24 · −500 | ok | |
| L-008 | Stehleiter 6 Stufen | Lager | wechselnd | leiter · GBU 12 · −380 | überfällig | |
| P-001 | Brückenkran 5 t Halle 2 | Produktion | ortsgebunden | kran_kraftbetrieben · GBU 12 · −200 | ok | ja |
| P-002 | Säulenschwenkkran 500 kg | Produktion | ortsgebunden | kran_kraftbetrieben · GBU 12 · −355 | bald fällig | ja |
| P-003 | Akku-Bohrschrauber Ladegerät | Produktion | wechselnd | elektro_ortsveraenderlich · GBU 6 · −120 | ok | |
| P-004 | Winkelschleifer 125 mm | Produktion | wechselnd | elektro_ortsveraenderlich · GBU 6 · −200 | überfällig | |
| P-005 | Kabeltrommel 25 m | Produktion | wechselnd | elektro_ortsveraenderlich · GBU 6 · unbekannt | unbekannt | |
| P-006 | Scherenhubarbeitsbühne | Produktion | ortsgebunden | hubarbeitsbuehne · keine Frist · unbekannt | gbu | |
| P-007 | Schutzgasschweißgerät | Produktion | wechselnd | „Wiederholungsprüfung Schweißgerät“ ohne Katalog · keine Frist · unbekannt; elektro_ortsveraenderlich · GBU 6 · −30 | gbu | |
| P-008 | Auffanggurt-Set 1 | Produktion | personenbezogen | psa_absturz · GBU 12 · −90 | ok | |
| P-009 | Elektrische Anlage Halle 2 | Produktion | ortsgebunden | elektro_ortsfest · GBU 48 · −1000 | ok | |
| V-001 | Kaffeevollautomat Teeküche | Verwaltung | ortsgebunden | elektro_ortsveraenderlich · GBU 6 · −60 | ok | |
| V-002 | Sicherheitsbeleuchtung Treppenhaus | Verwaltung | ortsgebunden | sicherheitsbeleuchtung · GBU 12 · −200 | ok | |
| V-003 | Firmenwagen VW Caddy | Verwaltung | wechselnd | fahrzeug · GBU 12 · −370 | überfällig | |

Letzte Prüfungen mit Offset haben einen Nachweis (Ergebnis `ohne_maengel`, Prüfername, Platzhalter-PDF), außer L-003 und P-009 (Herkunft `pruefbericht`, kein Nachweis). L-008: zusätzlicher älterer Nachweis mit `maengel_weiterbetrieb`. Ereignisse für Anlage, Freigabe und Nachweise erzeugen.

Abnahme (Tests gegen `dienste.ts` mit Demo-Repository):
- 20 Geräte, 3 Bereiche, jeder der fünf Status mindestens zweimal als Gesamtstatus; Ziel-Status der Tabelle erreicht.
- VER sieht nur 8 Lager-Geräte; SIF und ADM 20; PRF bekommt nur zugewiesene Prüfarten (6), Gerätedetail nicht zugewiesener Geräte → `null`.
- `geraetAnlegen` als VER in Produktion → Fehler; als VER in Lager → Gerät + Ereignis.
- `fristFreigeben` als ADM → Fehler; als SIF mit GBU über Herstellerfrist (L-005) → Fehler.
- `nachweisErfassen` als PRF für L-001 → Status `ok`, Ereignis vorhanden; mit `nicht_bestanden` → Status unverändert, `weiterbetriebUnzulaessig = true`; Prüfdatum in der Zukunft → Fehler.

### BE-6 Datenzugriffsschicht und Actions

Dateien: `src/server/data.ts`, `src/server/actions.ts`, `src/server/sitzung.ts`, `src/app/api/nachweise/[id]/route.ts`.

- `istDemoModus()` = `NEXT_PUBLIC_SUPABASE_URL` oder `NEXT_PUBLIC_SUPABASE_ANON_KEY` fehlt. Sind beide gesetzt, wirft der Repository-Zugriff `Error('Supabase-Adapter folgt in I2')`.
- Demo-Sitzung: Cookie `rl_demo_rolle` (httpOnly, sameSite lax, path `/`), Wert aus `DEMO_ROLLEN`; wird nur im Demo-Modus gelesen.
- Kein Import von `server-only` (nicht installiert); `data.ts` nur aus Server Components, Actions und Route Handlern importieren.
- PDF-Route: GET liefert `application/pdf` mit `Content-Disposition: inline`; 404 ohne Sitzung oder außerhalb des Geltungsbereichs.

Abnahme: `npm run build` ohne Umgebungsvariablen grün; Actions validieren mit den Schemas aus §3.2 und geben `feldfehler` mit den Formularfeldnamen zurück; nach Erfolg Redirect laut §3.6.

### FE-1 Grundlayout und Komponenten

Dateien: `src/app/layout.tsx`, `src/app/globals.css`, `src/app/page.tsx`, `src/app/login/page.tsx`, `src/components/{AppHeader,DemoBanner,StatusAmpel,Pruefplakette,StufeBadge,LoginForm}.tsx`.

- Tokens (Tailwind 4 `@theme`): steel `#44546A`, moss `#5B7F3A`, ochre `#C8902E`, brick `#A6452F`, paper `#F5F3EE`, ink `#1E2328`. Schrift: `"Space Grotesk"` (Überschriften), `"IBM Plex Sans"` (Text), `"IBM Plex Mono"` (Daten), jeweils mit Fallback `system-ui`/`monospace`, ohne Webfont-Laden (Q-10). Create-next-app-Boilerplate entfernen.
- Status-Farben: ok moss · bald_faellig ochre · ueberfaellig brick · unbekannt steel · gbu steel gestrichelt. Status nie nur über Farbe: Label aus `STATUS_LABEL` + Symbol.
- `Pruefplakette` (SVG, Größen 40/64 px): Ring mit 12 Monatssegmenten (1 oben, im Uhrzeigersinn), Fälligkeitsmonat gefüllt; Mitte zweistelliges Jahr von `faelligAm`; `unbekannt` → „?“, `gbu` → „GBU“; Farbe nach Status; `aria-label` z. B. „Nächste Prüfung 03/2027, bald fällig“. Props: `{ status: FristStatus; faelligAm: IsoDate | null; groesse?: 40 | 64 }`.
- `StufeBadge`: Buchstabe A–D, Tooltip/`title` aus `STUFE_LABEL`.
- `AppHeader`: Organisation, Benutzer, Rolle, Navigation nach Rolle (Geräte für ADM/SIF/VER; Prüfaufgaben für PRF), Abmelden (`abmelden`).
- `DemoBanner`: auf jeder Seite, wenn `sitzung.demo` oder `istDemoModus()`.
- `/login`: Demo → Rollenwahl (vier Buttons/Radio) mit `setzeDemoRolle` über `useActionState`.
- `/`: ohne Sitzung → `/login`; PRF → `/pruefer`; sonst → `/geraete`.

### FE-2 Geräteliste

Dateien: `src/app/geraete/page.tsx`, `src/components/{GeraeteFilter,GeraeteTabelle,StatusZaehler}.tsx`.

- Filter `bereich`, `status`, `q` als URL-Parameter (`searchParams` ist in Next 15 ein Promise); Bereichsauswahl aus `listeBereiche()`.
- Zähler je Status oben, klickbar als Filter.
- Zeile: Prüfplakette, Bezeichnung (Link zum Detail), Inventarnummer, Bereich, Gesamtstatus, nächste Fälligkeit (TT.MM.JJJJ), Anzahl Prüfarten.
- Button „Gerät anlegen“ nur bei `can(rolle, 'geraet.anlegen')`.
- Leerzustand mit Text.

### FE-3 Gerätedetail und Frist freigeben

Dateien: `src/app/geraete/[id]/page.tsx`, `src/components/{PruefartKarte,FristFreigabeForm,VerlaufListe,NachweisListe}.tsx`.

- Kopf: Stammdaten, Bereich, wirksamer Einsatzort, Gesamtstatus, Prüfplakette 64 px. `notFound()` bei `null`.
- Je Prüfart eine Karte: Status, fällig am, Resttage; Frist in Monaten; Quelle (`FRIST_QUELLE_LABEL`), `StufeBadge`, Fundstelle, Begründung bei GBU, „freigegeben von … am …“ oder „nicht freigegeben“; Herstellerfrist; zugewiesener Prüfer; Hinweis „Weiterbetrieb nicht zulässig“ bei `weiterbetriebUnzulaessig`.
- Vorschlag: `katalog`/`hersteller` → Text + Button „Vorschlag freigeben“ (Modus `vorschlag`). `gbu` → Hinweis „Frist über GBU festlegen“; bei `orientierung` mit Status `entwurf` Kasten „Katalogentwurf – nicht fachlich freigegeben: 12 Monate, Stufe B, Fundstelle“.
- Formular „Frist über GBU festlegen“ bzw. „Abweichende Frist festlegen“ (Monate, Fundstelle GBU, Begründung) immer verfügbar bei `can(rolle, 'frist.freigeben')`. Feldfehler am Feld anzeigen.
- Link „Nachweis erfassen“ je Prüfart bei `can(rolle, 'nachweis.erfassen')` → `/nachweise/neu/{pruefartId}`.
- Nachweisliste (Datum, Prüfart, Ergebnis, Prüfer, PDF-Link `pdfUrl`) und Verlauf (Zeitpunkt, Akteur, Ereignistext) bei `can(rolle, 'verlauf.lesen')`.

### FE-4 Gerät anlegen

Dateien: `src/app/geraete/neu/page.tsx`, `src/components/GeraetAnlegenForm.tsx`.

- Felder laut `geraetAnlegenSchema`. Bereichsauswahl nur aus `listeBereiche()`. Einsatzort: „wie Bereich“ (leer) oder Override.
- Gerätegruppe aus `listeGeraetegruppen()` plus „Sonstiges (ohne Katalogeintrag)“; Prüfarten der Gruppe vorausgewählt, abwählbar; freie Prüfart hinzufügbar. Je Prüfart: Herstellerfrist (Monate, Quelle), letzte Prüfung (Datum) + Herkunft (Prüfbericht, Plakette, unbekannt). Datum leer ⇒ Herkunft „unbekannt“ automatisch.
- Prüfarten als JSON im versteckten Feld `pruefartenJson`. Entwurfs-Einträge mit Kennzeichnung „Entwurf“.
- Seite nur bei `can(rolle, 'geraet.anlegen')`, sonst `notFound()`.

### FE-5 Prüfer-Ansicht und Nachweis erfassen

Dateien: `src/app/pruefer/page.tsx`, `src/app/nachweise/neu/[pruefartId]/page.tsx`, `src/components/{PrueferAufgabenListe,NachweisForm}.tsx`.

- `/pruefer`: `listePrueferAufgaben()`, zwei Gruppen („Fällig oder ohne Termin“, „Später“), je Eintrag Gerät, Inventarnummer, Bereich, Prüfart, Status, fällig am, Button „Nachweis erfassen“. Mobil benutzbar (eine Spalte).
- `/nachweise/neu/[pruefartId]`: `holeNachweisKontext()`; `notFound()` bei `null`. Formular mit `encType` multipart über Action: Prüfdatum (Default heute), Ergebnis, Prüfumfang (Default Prüfart-Bezeichnung), Prüfername (Default Sitzungsname), PDF, Checkbox „PDF enthält Unterschrift des Prüfers“. Hinweis: Nachweise können nicht gelöscht werden.

### QA-1

`npm run typecheck`, `npm run lint`, `npm test`, `npm run build` ohne `.env`. Demo-Durchlauf: je Rolle einloggen; VER legt Gerät im Lager an; SIF legt GBU-Frist für P-006 fest → Status wechselt auf `unbekannt`; PRF erfasst Nachweis für L-001 → `ok`; ADM sieht keine Freigabe-Aktion.

---

## 3. TypeScript-Vertrag Inkrement 1

Verbindlich für BE und FE. Änderungen nur nach Eintrag hier.

### 3.1 `src/domain/types.ts`

```ts
// Vertrag Inkrement 1 – siehe docs/backlog.md §3.1

export type Id = string; // UUID
export type IsoDate = string; // 'YYYY-MM-DD'
export type IsoDateTime = string; // ISO 8601 UTC, z. B. '2026-11-19T08:30:00.000Z'

// ---------- Aufzählungen ----------

export const ROLLEN = ['admin', 'sifa', 'verantwortlicher', 'pruefer', 'mitarbeiter'] as const;
export type Rolle = (typeof ROLLEN)[number];

export const DEMO_ROLLEN = ['admin', 'sifa', 'verantwortlicher', 'pruefer'] as const;
export type DemoRolle = (typeof DEMO_ROLLEN)[number];

export const ROLLE_LABEL: Record<Rolle, string> = {
  admin: 'Admin',
  sifa: 'Sifa',
  verantwortlicher: 'Verantwortlicher',
  pruefer: 'Prüfer',
  mitarbeiter: 'Mitarbeiter',
};

export const STUFEN = ['A', 'B', 'C', 'D'] as const;
export type Stufe = (typeof STUFEN)[number];

export const STUFE_LABEL: Record<Stufe, string> = {
  A: 'Höchstfrist aus Gesetz/UVV',
  B: 'Richtwert DGUV/TRBS/ASR, Abweichung nur mit Begründung',
  C: 'Gefährdungsbeurteilung oder Herstellerangabe',
  D: 'Empfehlung',
};

export const EINSATZORTE = ['buero', 'werkstatt_fertigung', 'lager_logistik', 'baustelle', 'aussenbereich'] as const;
export type Einsatzort = (typeof EINSATZORTE)[number];

export const EINSATZORT_LABEL: Record<Einsatzort, string> = {
  buero: 'Büro',
  werkstatt_fertigung: 'Werkstatt/Fertigung',
  lager_logistik: 'Lager/Logistik',
  baustelle: 'Baustelle',
  aussenbereich: 'Außenbereich',
};

export const GERAETE_KATEGORIEN = ['personenbezogen', 'ortsgebunden', 'wechselnd'] as const;
export type GeraeteKategorie = (typeof GERAETE_KATEGORIEN)[number];

export const KATEGORIE_LABEL: Record<GeraeteKategorie, string> = {
  personenbezogen: 'Personenbezogen',
  ortsgebunden: 'Ortsgebunden',
  wechselnd: 'Wechselnder Einsatzort',
};

export const BETRIEBSSTATUS = ['in_betrieb', 'ausser_betrieb', 'ausgemustert'] as const;
export type Betriebsstatus = (typeof BETRIEBSSTATUS)[number];

export const KATALOG_FREIGABESTATUS = ['entwurf', 'freigegeben', 'zurueckgezogen'] as const;
export type KatalogFreigabestatus = (typeof KATALOG_FREIGABESTATUS)[number];

export const PRUEFER_TYPEN = ['zbp', 'sachkundiger', 'efk', 'eup', 'ps', 'zues', 'sachkundiger_din14406', 'benutzer'] as const;
export type PrueferTyp = (typeof PRUEFER_TYPEN)[number];

export const PRUEFER_TYP_LABEL: Record<PrueferTyp, string> = {
  zbp: 'Zur Prüfung befähigte Person',
  sachkundiger: 'Sachkundiger',
  efk: 'Elektrofachkraft',
  eup: 'Elektrotechnisch unterwiesene Person',
  ps: 'Prüfsachverständiger',
  zues: 'Zugelassene Überwachungsstelle',
  sachkundiger_din14406: 'Sachkundiger nach DIN 14406-4',
  benutzer: 'Benutzer',
};

export const DATUMSHERKUNFT = ['nachweis', 'pruefbericht', 'plakette', 'unbekannt'] as const;
export type Datumsherkunft = (typeof DATUMSHERKUNFT)[number];

/** Herkunftswerte, die bei der Ersterfassung wählbar sind ('nachweis' entsteht nur durch erfassten Nachweis). */
export const ERSTERFASSUNG_HERKUNFT = ['pruefbericht', 'plakette', 'unbekannt'] as const;
export type ErsterfassungHerkunft = (typeof ERSTERFASSUNG_HERKUNFT)[number];

export const DATUMSHERKUNFT_LABEL: Record<Datumsherkunft, string> = {
  nachweis: 'Nachweis in Readyloop',
  pruefbericht: 'Prüfbericht (Altbestand)',
  plakette: 'Prüfplakette am Gerät',
  unbekannt: 'unbekannt',
};

export const FRIST_QUELLEN = ['katalog', 'hersteller', 'gbu'] as const;
export type FristQuelle = (typeof FRIST_QUELLEN)[number];

export const FRIST_QUELLE_LABEL: Record<FristQuelle, string> = {
  katalog: 'Prüfkatalog',
  hersteller: 'Herstellerangabe',
  gbu: 'Gefährdungsbeurteilung',
};

export const PRUEF_ERGEBNISSE = ['ohne_maengel', 'maengel_weiterbetrieb', 'nicht_bestanden'] as const;
export type PruefErgebnis = (typeof PRUEF_ERGEBNISSE)[number];

export const PRUEF_ERGEBNIS_LABEL: Record<PruefErgebnis, string> = {
  ohne_maengel: 'Ohne Mängel',
  maengel_weiterbetrieb: 'Mängel, Weiterbetrieb zulässig',
  nicht_bestanden: 'Nicht bestanden, Weiterbetrieb nicht zulässig',
};

/** Reihenfolge = Schwere absteigend (F-6). */
export const FRIST_STATUS = ['ueberfaellig', 'unbekannt', 'gbu', 'bald_faellig', 'ok'] as const;
export type FristStatus = (typeof FRIST_STATUS)[number];

export const STATUS_LABEL: Record<FristStatus, string> = {
  ueberfaellig: 'Überfällig – nicht verwenden',
  unbekannt: 'Prüfdatum unbekannt – Prüfung veranlassen',
  gbu: 'Frist über GBU festlegen',
  bald_faellig: 'Bald fällig',
  ok: 'In Ordnung',
};

export const EREIGNIS_TYPEN = ['geraet_angelegt', 'frist_freigegeben', 'nachweis_erfasst'] as const;
export type EreignisTyp = (typeof EREIGNIS_TYPEN)[number];

export const AKTIONEN = [
  'geraet.lesen',
  'geraet.anlegen',
  'frist.freigeben',
  'nachweis.lesen',
  'nachweis.erfassen',
  'pruefaufgaben.lesen',
  'verlauf.lesen',
  'katalog.lesen',
  'katalog.freigeben',
] as const;
export type Aktion = (typeof AKTIONEN)[number];

// ---------- Stammdaten ----------

export interface Organisation {
  id: Id;
  name: string;
  bg: string | null; // zuständige Berufsgenossenschaft
}

export interface Standort {
  id: Id;
  organisationId: Id;
  name: string;
}

export interface Bereich {
  id: Id;
  organisationId: Id;
  standortId: Id;
  name: string;
  einsatzort: Einsatzort;
}

export interface Benutzer {
  id: Id;
  name: string;
  email: string;
}

export interface Mitgliedschaft {
  id: Id;
  organisationId: Id;
  benutzerId: Id;
  rolle: Rolle;
  bereichIds: Id[]; // nur für 'verantwortlicher' befüllt
}

export interface Sitzung {
  benutzer: Benutzer;
  organisation: Organisation;
  mitgliedschaftId: Id;
  rolle: Rolle;
  bereichIds: Id[];
  demo: boolean;
}

// ---------- Katalog ----------

export interface KatalogEintrag {
  id: Id;
  schluessel: string; // Prüfart-Schlüssel, z. B. 'regal.experteninspektion'
  version: number;
  geraetegruppe: string; // z. B. 'regal'
  geraetegruppeLabel: string;
  pruefart: string; // Anzeigename der Prüfart
  einsatzort: Einsatzort | null; // null = gilt für alle Einsatzorte
  intervallMonate: number | null; // null = keine Zahl → Frist über GBU
  stufe: Stufe;
  fundstelle: string;
  quelleUrl: string;
  prueferTypen: PrueferTyp[];
  hinweis: string | null;
  freigabestatus: KatalogFreigabestatus;
  freigegebenVon: string | null;
  freigegebenAm: IsoDate | null;
}

// ---------- Geräte und Prüfarten ----------

export interface Geraet {
  id: Id;
  organisationId: Id;
  bereichId: Id;
  bezeichnung: string;
  inventarnummer: string | null;
  geraetegruppe: string; // Katalog-geraetegruppe oder 'sonstiges'
  kategorie: GeraeteKategorie;
  hersteller: string | null;
  typ: string | null;
  seriennummer: string | null;
  baujahr: number | null;
  einsatzort: Einsatzort | null; // Override; null = Einsatzort des Bereichs
  betriebsstatus: Betriebsstatus;
  angelegtAm: IsoDateTime;
}

/** Snapshot einer freigegebenen Frist (R-04). */
export interface FestgelegteFrist {
  monate: number;
  quelle: FristQuelle;
  stufe: Stufe;
  fundstelle: string;
  quelleUrl: string | null;
  katalogEintragId: Id | null; // bei gbu: Orientierungseintrag, falls vorhanden
  katalogVersion: number | null;
  begruendung: string | null; // Pflicht bei quelle 'gbu'
  freigegebenVon: Id; // Benutzer-ID
  freigegebenVonName: string;
  freigegebenAm: IsoDateTime;
}

export type FristEntwurf = Omit<FestgelegteFrist, 'freigegebenVon' | 'freigegebenVonName' | 'freigegebenAm'>;

export interface GeraetPruefart {
  id: Id;
  organisationId: Id;
  geraetId: Id;
  katalogSchluessel: string | null; // null = freie Prüfart ohne Katalogeintrag
  bezeichnung: string;
  herstellerfristMonate: number | null;
  herstellerfristQuelle: string | null; // z. B. 'Betriebsanleitung Kap. 9'
  frist: FestgelegteFrist | null; // null = nicht freigegeben
  letztePruefung: IsoDate | null;
  letztePruefungHerkunft: Datumsherkunft; // 'unbekannt' ⇔ letztePruefung === null
  zugewiesenerPrueferId: Id | null; // Benutzer-ID
}

export interface Nachweis {
  id: Id;
  organisationId: Id;
  geraetId: Id;
  geraetPruefartId: Id;
  pruefdatum: IsoDate;
  ergebnis: PruefErgebnis;
  pruefumfang: string;
  prueferName: string;
  prueferBenutzerId: Id | null;
  unterschriftImPdf: boolean;
  pdfDateiname: string;
  pdfSha256: string;
  erfasstVon: Id;
  erfasstAm: IsoDateTime;
}

export interface Ereignis {
  id: Id;
  organisationId: Id;
  geraetId: Id | null;
  typ: EreignisTyp;
  akteurId: Id;
  akteurName: string;
  zeitpunkt: IsoDateTime;
  daten: Record<string, unknown>; // z. B. { pruefartId, alt: FestgelegteFrist | null, neu: FestgelegteFrist }
}

// ---------- Regel-Engine ----------

export type FristVorschlag =
  | { art: 'katalog'; monate: number; stufe: Stufe; fundstelle: string; quelleUrl: string; eintrag: KatalogEintrag }
  | { art: 'hersteller'; monate: number; stufe: 'C'; fundstelle: string; verdraengt: KatalogEintrag | null }
  | {
      art: 'gbu';
      grund: 'kein_eintrag' | 'nur_entwurf' | 'ohne_intervall';
      orientierung: KatalogEintrag | null; // Entwurf oder freigegebener Eintrag ohne Intervall
    };

export type FristFestlegungEingabe =
  | { modus: 'vorschlag' }
  | { modus: 'gbu'; monate: number; fundstelle: string; begruendung: string };

export type FristFestlegungErgebnis = { ok: true; frist: FristEntwurf } | { ok: false; fehler: string };

export interface StatusErgebnis {
  status: FristStatus;
  faelligAm: IsoDate | null;
  restTage: number | null; // faelligAm − heute; negativ = überfällig
}

// ---------- Lesemodelle für die UI ----------

export interface PruefartAnsicht {
  pruefart: GeraetPruefart;
  vorschlag: FristVorschlag;
  status: StatusErgebnis;
  katalogEintrag: KatalogEintrag | null; // passender Eintrag (freigegeben oder Entwurf) für Prüfertyp/Hinweis
  weiterbetriebUnzulaessig: boolean; // letzter Nachweis 'nicht_bestanden' (F-7)
  zugewiesenerPrueferName: string | null;
}

export interface GeraetListenEintrag {
  geraet: Geraet;
  bereichName: string;
  gesamtStatus: FristStatus;
  naechsteFaelligkeit: IsoDate | null;
  pruefarten: { id: Id; bezeichnung: string; status: FristStatus; faelligAm: IsoDate | null }[];
}

export interface NachweisAnsicht extends Nachweis {
  pruefartBezeichnung: string;
  pdfUrl: string; // '/api/nachweise/{id}'
}

export interface GeraetDetail {
  geraet: Geraet;
  bereich: Bereich;
  einsatzort: Einsatzort; // wirksam (F-1)
  gesamtStatus: FristStatus;
  naechsteFaelligkeit: IsoDate | null;
  pruefarten: PruefartAnsicht[];
  nachweise: NachweisAnsicht[]; // absteigend nach pruefdatum
  verlauf: Ereignis[]; // absteigend nach zeitpunkt; leer ohne 'verlauf.lesen'
}

export interface PrueferAufgabe {
  pruefartAnsicht: PruefartAnsicht;
  geraet: Pick<Geraet, 'id' | 'bezeichnung' | 'inventarnummer' | 'hersteller' | 'typ' | 'seriennummer'>;
  bereichName: string;
  gruppe: 'faellig' | 'spaeter'; // faellig = ueberfaellig | unbekannt | gbu | bald_faellig
}

export interface GeraetegruppeOption {
  schluessel: string; // geraetegruppe
  label: string;
  pruefarten: {
    schluessel: string;
    bezeichnung: string;
    stufe: Stufe;
    intervallMonate: number | null;
    freigabestatus: KatalogFreigabestatus;
  }[]; // je Prüfart-Schlüssel ein Eintrag (einsatzort null bevorzugt)
}

export interface GeraeteFilter {
  bereichId?: Id;
  status?: FristStatus;
  suche?: string; // Bezeichnung, Inventarnummer, Hersteller, Seriennummer; case-insensitiv
}

// ---------- Server Actions ----------

export interface ActionState {
  status: 'idle' | 'ok' | 'fehler';
  meldung?: string;
  feldfehler?: Partial<Record<string, string[]>>; // Schlüssel = Formularfeldname
  id?: Id;
}

export const INITIAL_ACTION_STATE: ActionState = { status: 'idle' };
```

### 3.2 `src/domain/schemas.ts` (Zod 4)

Feldnamen und Regeln verbindlich; Formulare senden `FormData`, Actions parsen `Object.fromEntries(formData)`.

```ts
import { z } from 'zod';
import {
  DEMO_ROLLEN,
  EINSATZORTE,
  ERSTERFASSUNG_HERKUNFT,
  GERAETE_KATEGORIEN,
  PRUEF_ERGEBNISSE,
} from './types';

export const PDF_MAX_BYTES = 10 * 1024 * 1024;

const leerZuNull = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v);
const optText = (max: number) => z.preprocess(leerZuNull, z.string().trim().max(max).nullable());
const isoDate = z.iso.date();

export const demoRolleSchema = z.object({
  rolle: z.enum(DEMO_ROLLEN),
});

export const pruefartEingabeSchema = z
  .object({
    katalogSchluessel: z.string().min(1).nullable(),
    bezeichnung: z.string().trim().min(2).max(120),
    herstellerfristMonate: z.number().int().min(1).max(120).nullable(),
    herstellerfristQuelle: z.string().trim().max(200).nullable(),
    letztePruefung: isoDate.nullable(),
    letztePruefungHerkunft: z.enum(ERSTERFASSUNG_HERKUNFT),
  })
  .refine((p) => (p.letztePruefung === null) === (p.letztePruefungHerkunft === 'unbekannt'), {
    message: 'Ohne Datum ist die Herkunft „unbekannt“, mit Datum Prüfbericht oder Plakette.',
    path: ['letztePruefungHerkunft'],
  });
export type PruefartEingabe = z.infer<typeof pruefartEingabeSchema>;

export const geraetAnlegenSchema = z.object({
  bezeichnung: z.string().trim().min(2).max(120),
  inventarnummer: optText(60),
  bereichId: z.string().min(1),
  geraetegruppe: z.string().min(1), // 'sonstiges' erlaubt
  kategorie: z.enum(GERAETE_KATEGORIEN),
  hersteller: optText(120),
  typ: optText(120),
  seriennummer: optText(120),
  baujahr: z.preprocess(leerZuNull, z.coerce.number().int().min(1950).max(2100).nullable()),
  einsatzort: z.preprocess(leerZuNull, z.enum(EINSATZORTE).nullable()),
  pruefartenJson: z
    .string()
    .transform((s, ctx) => {
      try {
        return JSON.parse(s) as unknown;
      } catch {
        ctx.addIssue({ code: 'custom', message: 'Prüfarten unlesbar' });
        return z.NEVER;
      }
    })
    .pipe(z.array(pruefartEingabeSchema).min(1, 'Mindestens eine Prüfart').max(10)),
});
export type GeraetAnlegenEingabe = z.infer<typeof geraetAnlegenSchema>;

export const fristFreigebenSchema = z.discriminatedUnion('modus', [
  z.object({
    modus: z.literal('vorschlag'),
    geraetPruefartId: z.string().min(1),
  }),
  z.object({
    modus: z.literal('gbu'),
    geraetPruefartId: z.string().min(1),
    monate: z.coerce.number().int().min(1).max(120),
    fundstelle: z.string().trim().min(3).max(200),
    begruendung: z.string().trim().min(10).max(1000),
  }),
]);
export type FristFreigebenEingabe = z.infer<typeof fristFreigebenSchema>;

export const nachweisErfassenSchema = z.object({
  geraetPruefartId: z.string().min(1),
  pruefdatum: isoDate, // zusätzlich in der Action: ≤ heute
  ergebnis: z.enum(PRUEF_ERGEBNISSE),
  pruefumfang: z.string().trim().min(3).max(500),
  prueferName: z.string().trim().min(2).max(120),
  unterschriftImPdf: z.literal('on', { error: 'Bitte bestätigen, dass das PDF die Unterschrift enthält.' }).transform(() => true),
  pdf: z.file().min(1, 'PDF fehlt').max(PDF_MAX_BYTES, 'PDF größer als 10 MB').mime('application/pdf'),
});
export type NachweisErfassenEingabe = z.infer<typeof nachweisErfassenSchema>;
```

Formularfelder je Action:

| Action | Felder |
|---|---|
| `setzeDemoRolle` | `rolle` |
| `geraetAnlegen` | `bezeichnung`, `inventarnummer`, `bereichId`, `geraetegruppe`, `kategorie`, `hersteller`, `typ`, `seriennummer`, `baujahr`, `einsatzort` (leer = wie Bereich), `pruefartenJson` (JSON von `PruefartEingabe[]`) |
| `fristFreigeben` | `geraetPruefartId`, `modus` (`vorschlag`/`gbu`), bei `gbu`: `monate`, `fundstelle`, `begruendung` |
| `nachweisErfassen` | `geraetPruefartId`, `pruefdatum`, `ergebnis`, `pruefumfang`, `prueferName`, `unterschriftImPdf` (Checkbox, Wert `on`), `pdf` (File) |

### 3.3 `src/domain/rechte.ts`

Signaturen ohne Rumpf = zu implementieren (gilt auch für §3.4–3.6).

```ts
import type { Aktion, Id, Rolle, Sitzung } from './types';

export const RECHTE: Record<Aktion, readonly Rolle[]> = {
  'geraet.lesen': ['admin', 'sifa', 'verantwortlicher', 'pruefer'],
  'geraet.anlegen': ['admin', 'verantwortlicher'],
  'frist.freigeben': ['sifa', 'verantwortlicher'],
  'nachweis.lesen': ['admin', 'sifa', 'verantwortlicher', 'pruefer'],
  'nachweis.erfassen': ['verantwortlicher', 'pruefer'],
  'pruefaufgaben.lesen': ['pruefer'],
  'verlauf.lesen': ['admin', 'sifa', 'verantwortlicher'],
  'katalog.lesen': ['admin', 'sifa', 'verantwortlicher', 'pruefer', 'mitarbeiter'],
  'katalog.freigeben': [],
};

export function can(rolle: Rolle, aktion: Aktion): boolean;

/** Geltungsbereich: admin/sifa alles; verantwortlicher eigene Bereiche; pruefer nur zugewiesen; mitarbeiter nichts (I1). */
export function imGeltungsbereich(
  sitzung: Pick<Sitzung, 'rolle' | 'bereichIds' | 'benutzer'>,
  ziel: { bereichId: Id; zugewiesenePrueferIds: readonly Id[] },
): boolean;
```

Hinweis ADM bei `geraet.anlegen`: ganze Organisation (Ersterfassung). VER: nur eigene Bereiche.

### 3.4 Domänenfunktionen (BE-2)

```ts
// src/domain/datum.ts
export function istIsoDate(wert: string): boolean;
export function addMonate(datum: IsoDate, monate: number): IsoDate; // Monatsende-Klemme
export function tageZwischen(von: IsoDate, bis: IsoDate): number; // bis − von in Kalendertagen
export function heuteBerlin(jetzt?: Date): IsoDate;
export function formatDatum(datum: IsoDate): string; // 'TT.MM.JJJJ'

// src/domain/fristen.ts
export function wirksamerEinsatzort(
  geraet: Pick<Geraet, 'einsatzort'>,
  bereich: Pick<Bereich, 'einsatzort'>,
): Einsatzort;

export function waehleKatalogEintrag(
  katalog: readonly KatalogEintrag[],
  schluessel: string,
  einsatzort: Einsatzort,
  status: 'freigegeben' | 'entwurf',
): KatalogEintrag | null;

export function ermittleFristVorschlag(eingabe: {
  pruefart: Pick<GeraetPruefart, 'katalogSchluessel' | 'herstellerfristMonate' | 'herstellerfristQuelle'>;
  einsatzort: Einsatzort;
  katalog: readonly KatalogEintrag[];
}): FristVorschlag;

export function legeFristFest(
  eingabe: FristFestlegungEingabe,
  kontext: {
    vorschlag: FristVorschlag;
    pruefart: Pick<GeraetPruefart, 'katalogSchluessel' | 'herstellerfristMonate'>;
    einsatzort: Einsatzort;
    katalog: readonly KatalogEintrag[];
  },
): FristFestlegungErgebnis;

// src/domain/status.ts
export const VORLAUF_TAGE = 30;
export function berechneStatus(
  pruefart: Pick<GeraetPruefart, 'frist' | 'letztePruefung'>,
  heute: IsoDate,
  vorlaufTage?: number,
): StatusErgebnis;
export function gesamtStatus(status: readonly FristStatus[]): FristStatus;
export function naechsteFaelligkeit(ergebnisse: readonly StatusErgebnis[]): IsoDate | null;
export function prueferGruppe(status: FristStatus): 'faellig' | 'spaeter';
```

### 3.5 `src/server/data.ts`

```ts
import type {
  Aktion, Bereich, GeraetDetail, GeraeteFilter, GeraetegruppeOption,
  GeraetListenEintrag, Id, IsoDate, PrueferAufgabe, Sitzung,
} from '@/domain/types';

/** true, wenn NEXT_PUBLIC_SUPABASE_URL oder NEXT_PUBLIC_SUPABASE_ANON_KEY fehlt. */
export function istDemoModus(): boolean;

/** Heutiges Datum in Europe/Berlin. */
export function heute(): IsoDate;

export async function holeSitzung(): Promise<Sitzung | null>;

/** Ohne Sitzung: redirect('/login'). Mit aktion und ohne Recht (can): notFound(). */
export async function erfordereSitzung(aktion?: Aktion): Promise<Sitzung>;

/** Bereiche im Geltungsbereich der Sitzung, alphabetisch. */
export async function listeBereiche(): Promise<Bereich[]>;

/** Sortierung: Gesamtstatus nach Schwere, dann naechsteFaelligkeit aufsteigend (null zuletzt), dann Bezeichnung. */
export async function listeGeraete(filter?: GeraeteFilter): Promise<GeraetListenEintrag[]>;

/** null, wenn nicht vorhanden oder außerhalb des Geltungsbereichs. Prüfer sehen nur zugewiesene Prüfarten. */
export async function holeGeraetDetail(geraetId: Id): Promise<GeraetDetail | null>;

/** Aus dem Katalog (freigegeben und Entwurf), alphabetisch nach Label. */
export async function listeGeraetegruppen(): Promise<GeraetegruppeOption[]>;

/** Nur Rolle pruefer: zugewiesene Prüfarten; 'faellig' vor 'spaeter', innerhalb nach faelligAm (null zuerst). */
export async function listePrueferAufgaben(): Promise<PrueferAufgabe[]>;

/** Kontext für das Nachweisformular; null ohne Recht nachweis.erfassen auf diese Prüfart. */
export async function holeNachweisKontext(geraetPruefartId: Id): Promise<PrueferAufgabe | null>;

/** Nur für src/app/api/nachweise/[id]/route.ts. null außerhalb des Geltungsbereichs. */
export async function holeNachweisPdf(nachweisId: Id): Promise<{ dateiname: string; inhalt: Uint8Array } | null>;
```

### 3.6 `src/server/actions.ts`

```ts
'use server';

import type { ActionState } from '@/domain/types';

/** Nur Demo-Modus. Setzt Cookie rl_demo_rolle; Erfolg: redirect('/pruefer') für pruefer, sonst redirect('/geraete'). */
export async function setzeDemoRolle(prev: ActionState, formData: FormData): Promise<ActionState>;

/** Löscht Sitzung bzw. Demo-Cookie; redirect('/login'). */
export async function abmelden(): Promise<void>;

/** Recht geraet.anlegen + Bereich im Geltungsbereich. Erfolg: redirect(`/geraete/${id}`). */
export async function geraetAnlegen(prev: ActionState, formData: FormData): Promise<ActionState>;

/** Recht frist.freigeben + Geltungsbereich; Regeln F-4. Erfolg: revalidatePath(`/geraete/${geraetId}`),
 *  Rückgabe { status: 'ok', meldung: 'Frist freigegeben', id: geraetPruefartId }. */
export async function fristFreigeben(prev: ActionState, formData: FormData): Promise<ActionState>;

/** Recht nachweis.erfassen + Geltungsbereich; Regeln F-7; Prüfdatum ≤ heute.
 *  Erfolg: pruefer → redirect('/pruefer'), sonst redirect(`/geraete/${geraetId}`). */
export async function nachweisErfassen(prev: ActionState, formData: FormData): Promise<ActionState>;
```

### 3.7 Routen

| Route | Besitzer | Zugriff |
|---|---|---|
| `/login` | FE | öffentlich |
| `/` | FE | Weiterleitung nach Rolle |
| `/geraete` | FE | `geraet.lesen` außer PRF (PRF → `/pruefer`) |
| `/geraete/neu` | FE | `geraet.anlegen` |
| `/geraete/[id]` | FE | `geraet.lesen` + Geltungsbereich |
| `/pruefer` | FE | `pruefaufgaben.lesen` |
| `/nachweise/neu/[pruefartId]` | FE | `nachweis.erfassen` + Geltungsbereich |
| `GET /api/nachweise/[id]` | BE | `nachweis.lesen` + Geltungsbereich |

## 4. Inkrement 2 – Pakete

Fachregeln F-8 bis F-19, Rechte-Matrix und User Stories US-10 bis US-13, US-21 bis US-26: `docs/requirements.md`. Vertrag: §5 unten.

Nicht in I2: E-Mail-Erinnerungen (I3), Export/Import (I4), PWA/QR (I5), KI (I6), Betriebsanleitung-Upload (R-18 Rest → I4), Ausmustern (→ I4 mit Nachfrist), Webfonts (entfällt, Q-10), neue Abhängigkeiten (`@supabase/ssr` und `@supabase/supabase-js` sind installiert).

### Dateibesitz

| Besitzer | Dateien |
|---|---|
| backend-dev | `src/domain/**`, `src/server/**`, `src/app/api/**`, `src/middleware.ts`, `supabase/**`, `tests/**`, `.env.example` |
| frontend-dev | `src/app/**` außer `src/app/api/**`, `src/components/**` |
| niemand ohne Absprache | `package.json`, `tsconfig.json`, `next.config.*`, `eslint.config.*` |

Innerhalb eines Besitzers laufen die Pakete nacheinander (gemeinsame Dateien, z. B. `dienste.ts`, `geraete/[id]/page.tsx`). BE und FE laufen parallel.

### Reihenfolge

```
BE-7 ──┬── BE-8 ── BE-10 ── BE-11 ── BE-12 ── BE-13 ── BE-14 ──┐
       └── BE-9 ─────────────────────────────┘ (vor BE-13)     ├── QA-2
BE-7 ── FE-6 ── FE-7 ── FE-8 ── FE-9 ── FE-10 ─────────────────┘
```

- Nach BE-7 ist `npm run typecheck` erst wieder grün, wenn FE-6 fertig ist (neuer Status `vor_nutzung_pruefen` macht `Record<FristStatus, …>` im FE unvollständig). FE-6 deshalb sofort nach BE-7.
- FE-7 bis FE-10 kompilieren gegen die Stubs aus BE-7; Daten im Demo-Modus ab BE-11, mit Supabase ab BE-14.

| Paket | Besitzer | Inhalt | Hängt ab von |
|---|---|---|---|
| BE-7 | backend-dev | Vertrag I2: `types.ts`, `schemas.ts`, `rechte.ts` (+ Tests), Stubs in `data.ts`/`actions.ts`, `Repository`-Interface erweitert, Demo-Repository mit Stub-Methoden, `status.ts` an neuen Status angepasst | – |
| BE-8 | backend-dev | Domäne: Status im Kontext (F-9), Anlass offen (F-10), Mängel-Übergänge (F-14), Qualifikation (F-15), Fristrichtung (F-13) + Tests | BE-7 |
| BE-9 | backend-dev | Migration I2, RLS, Trigger, RPCs, pgTAP-Tests, statischer Migrationstest | BE-7 |
| BE-10 | backend-dev | Demo-Daten I2, Demo-Repository I2, Dienste I2 (Geräte, Anlass, Mängel, Verwaltung) + Tests | BE-8 |
| BE-11 | backend-dev | `data.ts`/`actions.ts` für alle I2-Funktionen im Demo-Modus; Betriebsmodus (F-8, Q-9) | BE-10 |
| BE-12 | backend-dev | Supabase-Clients, Auth (Login, Logout, Passwort vergessen/setzen), Sitzung aus Supabase, Organisationswahl, Middleware, Route `/api/auth/confirm` | BE-11 |
| BE-13 | backend-dev | Supabase-Repository Teil 1: alle Lesemethoden + I1-Schreibmethoden, PDF-Storage, Mapping + Tests | BE-12, BE-9 |
| BE-14 | backend-dev | Supabase-Repository Teil 2: I2-Schreibmethoden, Einladung per Service-Role | BE-13 |
| FE-6 | frontend-dev | Neuer Status, Betriebsstatus-Badge, Ereignis-Texte, Mängelzähler in der Liste | BE-7 |
| FE-7 | frontend-dev | Login (Demo/Supabase/unkonfiguriert), Passwort vergessen/neu, Organisationswahl, Kein Zugang, Header-Navigation | FE-6 |
| FE-8 | frontend-dev | Verwaltung: Bereiche, Mitglieder einladen/ändern | FE-7 |
| FE-9 | frontend-dev | Gerätedetail: Prüfer zuweisen, GBU-Verweis, Frist nach Ergebnis, Betriebsstatus, Verschieben, Anlass; Nachweisformular Frist-Empfehlung | FE-6 |
| FE-10 | frontend-dev | Mängel: Übersicht, Erfassen, Kenntnisnahme, Behebung; Mängel in der Geräteakte | FE-9 |
| QA-2 | test-runner | typecheck, lint, test, build (ohne Env und mit Dummy-Env); Demo-Durchlauf; Supabase-Durchlauf soweit lokal möglich | alle |

---

### BE-7 Vertrag I2

Dateien: `src/domain/types.ts`, `src/domain/schemas.ts`, `src/domain/rechte.ts` (wörtlich §5.1–5.3), `src/domain/status.ts` (nur `FRIST_STATUS`-Anpassung, `prueferGruppe`), `src/server/repo/types.ts` (§5.6), `src/server/repo/demo/repository.ts` (neue Methoden als `throw new Error('nicht implementiert (BE-10)')`), `src/server/data.ts` und `src/server/actions.ts` (neue Signaturen §5.4/§5.5, Rümpfe `throw new Error('nicht implementiert (BE-11)')` bzw. `(BE-12)` für Auth), `tests/rechte.test.ts`.

Abnahme:
- `npm run typecheck` grün für `src/domain`, `src/server`, `tests` (FE-Fehler nur wegen `vor_nutzung_pruefen` erlaubt, behebt FE-6).
- `tests/rechte.test.ts` prüft die vollständige Matrix aus `requirements.md` §6 (jede Aktion × jede Rolle) und `darfVerschieben`.
- Bestehende Tests bleiben grün; Demo-Daten liefern weiter `pruefer_typen: []`, `aktiv: true`, `gbuDokument: null`, `fristEmpfehlungMonate: null`.

### BE-8 Domäne I2

Dateien: `src/domain/status.ts`, `src/domain/anlass.ts`, `src/domain/maengel.ts`, `src/domain/qualifikation.ts`, `src/domain/fristen.ts` (nur `fristRichtung`), Tests daneben. Signaturen §5.7.

Abnahme (je Fall ein Test):
- F-9: offener Anlass + Status ok → `vor_nutzung_pruefen`/`anlass`, `faelligAm` bleibt berechnet; letzter Nachweis `nicht_bestanden` → `vor_nutzung_pruefen`/`nicht_bestanden`; Anlass ohne Frist → `vor_nutzung_pruefen` (nicht `gbu`); außer Betrieb + Resttage −1 → `vor_nutzung_pruefen`/`ausser_betrieb`; außer Betrieb + Resttage 10 → `bald_faellig`; außer Betrieb + unbekannt → `unbekannt`; ohne Kontext identisch zu `berechneStatus`.
- Gesamtstatus: `['vor_nutzung_pruefen','ueberfaellig']` → `ueberfaellig`; `['ok']` + gefährlicher Mangel → `vor_nutzung_pruefen`; `[]` + gefährlicher Mangel → `vor_nutzung_pruefen`.
- F-10: Anlass 2026-11-10; Nachweis `ohne_maengel` am 2026-11-10 → erledigt; am 2026-11-09 → offen; `nicht_bestanden` am 2026-11-12 → offen; aufgehoben → nicht offen; Nachweis anderer Prüfart → offen.
- F-14: `offen→in_bearbeitung` ok; `offen→behoben` ok; `behoben→*` Fehler; `in_bearbeitung→offen` Fehler; `terminVorschlag` gefährlich = heute, erheblich = +30, gering = +90.
- F-15: Prüfer `['efk']`, gefordert `['zbp']` → Warnung mit beiden Labels; gefordert leer oder kein Eintrag → `null`; Prüfer ohne Typen bei gefordertem Typ → Warnung „keine Qualifikation hinterlegt“.
- F-13: `fristRichtung(null, 12)` = `erstmalig`; 12→6 `kuerzer`; 12→24 `laenger`; 12→12 `gleich`.

### BE-9 Migration I2

Dateien: `supabase/migrations/20261126000000_inkrement2.sql`, `supabase/tests/rls_inkrement2.test.sql` (pgTAP), `tests/migration.test.ts` (erweitert). I1-Migration bleibt unverändert.

Inhalt:
- `mitgliedschaft`: `email text not null default ''`, `aktiv boolean not null default true`, `pruefer_typen text[] not null default '{}'` (Werte aus `PRUEFER_TYPEN`). Hilfsfunktionen `app.ist_mitglied`, `app.hat_rolle`, `app.verantwortet_bereich`, `app.ist_zugewiesen` per `create or replace` um `and m.aktiv` ergänzen.
- `geraet_pruefart`: `gbu_dokument_titel text`, `gbu_dokument_url text check (gbu_dokument_url is null or gbu_dokument_url like 'https://%')`, Check: URL nur mit Titel. Spalten-Grants UPDATE zusätzlich auf `zugewiesener_pruefer_id`, `gbu_dokument_titel`, `gbu_dokument_url`. Neue UPDATE-Policy für admin (ganze Organisation). BEFORE-UPDATE-Trigger `app.pruefart_spaltenrechte`: Frist- und GBU-Spalten nur sifa oder VER (Bereich); `zugewiesener_pruefer_id` nur admin oder VER (Bereich) und nur aktives Mitglied mit Rolle `pruefer` derselben Organisation oder null.
- `geraet`: Spalten-Grants UPDATE nur `bereich_id`, `betriebsstatus`. Policy UPDATE: USING admin oder VER(alter Bereich); WITH CHECK admin oder VER(neuer Bereich). Trigger: `betriebsstatus = 'ausgemustert'` in I2 abgelehnt; Ereignisse `geraet_verschoben`, `betriebsstatus_geaendert`.
- `nachweis`: `pdf_dateiname text not null default 'nachweis.pdf'`, `frist_empfehlung_monate integer check (between 1 and 120)`.
- Neue Tabellen `anlass`, `mangel` (Felder §5.1, snake_case, `organisation_id`, zusammengesetzte FKs wie I1), RLS, keine DELETE-Policy, Indizes. `anlass`: INSERT sifa/VER(Bereich), Datum ≤ heute; UPDATE nur Spalten `aufgehoben_*` (Trigger stempelt `aufgehoben_von = auth.uid()`, `aufgehoben_am = now()`, einmalig). `mangel`: INSERT sifa/VER(Bereich)/Prüfer (nur mit zugewiesener Prüfart, ohne Verantwortlichen); UPDATE nur Status-/Kenntnis-/Behebungs-Spalten; Trigger erzwingt Übergänge F-14 und stempelt `kenntnis_*`, `behebung_erfasst_*`. SELECT: admin/sifa, VER(Bereich), Prüfer(zugewiesene Prüfart).
- `bereich`: INSERT/UPDATE admin. `mitgliedschaft`: INSERT/UPDATE admin; Trigger „letzter aktiver Admin“ (nicht deaktivieren, nicht herabstufen). `bereich_verantwortung`: INSERT und **DELETE** für admin (einzige DELETE-Policy, Q-19).
- `ereignis.typ`-Check um alle Typen aus §5.1 erweitern. Trigger für alle neuen Ereignisse (Daten laut `requirements.md` F-19). Zusatzdaten (Begründung, `nachweisId`) liest der Trigger aus `current_setting('readyloop.kontext', true)::jsonb`, gesetzt per `set_config(…, true)` in den RPCs.
- RPCs `security invoker` (RLS greift, eine Transaktion): `public.geraet_anlegen(p_geraet jsonb, p_pruefarten jsonb)`, `public.frist_setzen(p_pruefart uuid, p_frist jsonb, p_nachweis uuid)`, `public.geraet_verschieben(p_geraet uuid, p_bereich uuid, p_begruendung text)`, `public.betriebsstatus_setzen(p_geraet uuid, p_status text, p_begruendung text)`, `public.mitglied_speichern(p_mitgliedschaft jsonb, p_bereich_ids uuid[])` (ersetzt Bereichsmenge atomar). `grant execute … to authenticated`.

Abnahme:
- `tests/migration.test.ts`: jede neue Tabelle mit `enable row level security`; einzige `for delete`-Policy ist `bereich_verantwortung`; keine UPDATE-Policy auf `nachweis`/`ereignis`; alle Werte aus `ANLASS_ARTEN`, `MANGEL_SCHWEREN`, `MANGEL_STATUS`, `EREIGNIS_TYPEN` kommen in Checks vor; jede RPC ist `security invoker`.
- pgTAP (`supabase test db`, läuft nur mit lokaler Supabase; im Agentenlauf nicht ausführbar → Pilot-Gate G-5): VER Lager sieht keine Produktion-Mängel; Prüfer sieht nur Mängel zugewiesener Prüfarten; admin kann keine Frist setzen; VER kann Gerät nicht in fremden Bereich verschieben; deaktiviertes Mitglied sieht nichts; letzter Admin nicht deaktivierbar; `mangel` `behoben → offen` scheitert.

### BE-10 Demo und Dienste I2

Dateien: `src/server/repo/demo/daten.ts`, `src/server/repo/demo/repository.ts`, `src/server/dienste.ts` (Lesemodelle, Zuweisung, GBU-Verweis, Betriebsstatus, Verschieben, Anlass, Frist mit Nachweis-Bezug), `src/server/dienste-maengel.ts`, `src/server/dienste-verwaltung.ts`, Tests `tests/dienste-i2.test.ts`.

Demo-Daten (Ergänzung zu §2 BE-5):

| Gerät | Änderung | Neuer Ziel-Status |
|---|---|---|
| P-001 Brückenkran | offener Anlass `unfall_schadensfall` vor 3 Tagen („Anfahrschaden am Katzfahrwerk“) | vor_nutzung_pruefen |
| P-004 Winkelschleifer | zusätzlicher Nachweis −10 Tage `nicht_bestanden`; Mangel gefährlich, offen, „Schutzhaube gebrochen“, Verantwortliche Sabine Krüger, Termin heute | vor_nutzung_pruefen |
| V-003 Firmenwagen | `ausser_betrieb` (Ereignis vorhanden) | vor_nutzung_pruefen |
| L-006 Anschlagkette | Mangel erheblich, in Bearbeitung, Termin +20, Verantwortlicher Marco Lindner | gbu (unverändert) |
| L-008 Stehleiter | Mangel gering aus älterem Nachweis, behoben | ueberfaellig (unverändert) |
| L-003 Regal Reihe A | Mangel gering, offen, Termin −5 (Termin überschritten); GBU-Verweis „GBU Lager 2025, Abschn. 3 Regale“ | ok (unverändert) |
| L-001 Gabelstapler | Nachweis-Empfehlung 6 Monate beim letzten Nachweis | ueberfaellig (unverändert) |

- Prüfer Tobias Berger: `prueferTypen ['efk', 'sachkundiger']` → Qualifikationswarnung bei P-001/P-002 (Kran: zbp).
- Zweite Organisation „Muster Metallbau GmbH“ (fiktiv), Standort „Werk“, Bereich „Werkstatt“ (`werkstatt_fertigung`), 2 Geräte (Säulenbohrmaschine, Hallenkran 2 t) mit Prüfarten, beide Tobias Berger zugewiesen; Berger hat dort eine Prüfer-Mitgliedschaft. Andere Demo-Rollen sind nur Mitglied der ersten Organisation.
- Statusverteilung erste Organisation danach: ueberfaellig 2 (L-001, L-008), vor_nutzung_pruefen 3, unbekannt 2, gbu 3, bald_faellig 3, ok ≥ 2.
- `ladeBenutzerEin` im Demo: unbekannte E-Mail → neuer Benutzer mit `randomUUID()`, `neu: true`; bekannte → vorhandene ID, `neu: false`. Kein Versand.

Abnahme (Tests gegen Dienste mit Demo-Repository):
- Statusverteilung wie oben; Liste der ersten Organisation unverändert 20 Geräte.
- `prueferZuweisen` als VER Lager für Produktion-Prüfart → Fehler; als ADM → ok + Ereignis `pruefer_zugewiesen`; Zuweisung an Sifa-Benutzer → Fehler; an deaktivierten Prüfer → Fehler.
- `geraetVerschieben` VER Lager → Produktion: Fehler; ADM L-007 → Produktion: Bereich geändert, Frist unverändert, Ereignis mit beiden Bereichsnamen; Lager-VER sieht L-007 danach nicht mehr.
- `betriebsstatusSetzen` V-003 → `in_betrieb` → Status `ueberfaellig`; `ausgemustert` → Validierungsfehler.
- `anlassErfassen` für L-003 → `vor_nutzung_pruefen`; danach `nachweisErfassen` `ohne_maengel` heute → `ok`, Anlass erledigt; `anlassAufheben` mit Grund < 10 Zeichen → Fehler.
- `mangelErfassen` als PRF ohne Prüfart → Fehler; als PRF für zugewiesene Prüfart → ok, `verantwortlichId = null`; aus Nachweis eines anderen Geräts → Fehler; Termin gestern → Fehler.
- `mangelKenntnisNehmen` → `in_bearbeitung`, Kenntnis gestempelt; `mangelBeheben` mit `behobenAm` in der Zukunft → Fehler; zweites Beheben → Fehler.
- `mitgliedEinladen` bekannte E-Mail in derselben Organisation → Fehler am Feld `email`; VER ohne Bereich → Fehler am Feld `bereichIds`; `mitgliedAendern` letzter Admin auf `sifa` → Fehler; eigene Mitgliedschaft deaktivieren → Fehler.
- `fristFreigeben` mit `nachweisId` → Ereignis enthält `nachweisId` und `richtung`; `nachweisId` einer anderen Prüfart → Fehler.
- Prüfer Berger: `holeSitzung` mit Organisation 2 → nur 2 Aufgaben; mit Organisation 1 → 6 wie in I1.

### BE-11 Datenzugriff und Actions I2

Dateien: `src/server/data.ts`, `src/server/actions.ts`, `src/server/sitzung.ts`.

- `betriebsmodus()` nach F-8; `istDemoModus()` = `betriebsmodus() === 'demo'`. `holeRepository()` wird `async` (Supabase braucht `await cookies()`).
- Demo-Sitzung: Organisation aus Cookie `rl_org`, sonst alphabetisch erste aktive Mitgliedschaft; `Sitzung.organisationen` befüllt.
- Alle neuen Funktionen aus §5.4/§5.5 für den Demo-Modus; Mehrfachfelder (`bereichIds`, `prueferTypen`, `geraetPruefartIds`) über `formData.getAll`.
- `zurueck`-Feld bei `mangelErfassen`: nur relative Pfade (`/^\/[a-z0-9\/\-?=&]*$/i`, kein `//`), sonst Default.

Abnahme: `npm run build` ohne Env grün; mit `NODE_ENV=production` ohne Env und ohne `READYLOOP_DEMO` liefert `betriebsmodus()` `'unkonfiguriert'` (Unit-Test über Env-Stubs); jede neue Action prüft Recht und gibt `feldfehler` mit Formularfeldnamen zurück.

### BE-12 Supabase-Auth und Sitzung

Dateien: `src/server/supabase/server.ts` (`erzeugeServerClient()` mit `@supabase/ssr`, Cookie-Set in Server Components per try/catch), `src/server/supabase/admin.ts` (Service-Role-Client, nur `ladeBenutzerEin`), `src/middleware.ts` (Session-Refresh nur im Modus `supabase`; Matcher ohne `_next/static`, `_next/image`, `favicon.ico`), `src/app/api/auth/confirm/route.ts`, `src/server/sitzung.ts`, `src/server/actions.ts` (Auth-Actions), `.env.example`.

- Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (nur Server, nur Einladung), `NEXT_PUBLIC_SITE_URL` (Links in Mails), `READYLOOP_DEMO`.
- `/api/auth/confirm?token_hash&type&next`: `verifyOtp` für `invite` und `recovery`, dann Redirect auf `next` (nur relative Pfade, Default `/passwort-neu`); Fehler → `/login?fehler=link`.
- E-Mail-Vorlagen (Invite, Reset) in `supabase/config.toml` auf `{{ .SiteURL }}/api/auth/confirm?token_hash={{ .TokenHash }}&type=invite|recovery&next=/passwort-neu`.
- `leseSitzung()` im Modus `supabase`: `auth.getUser()`, aktive Mitgliedschaften, Organisation nach `rl_org`; Benutzername = `mitgliedschaft.anzeigename`.
- `abmelden`: `signOut`, Cookies `rl_org` und `rl_demo_rolle` löschen.

Abnahme: Build mit Dummy-Env (`NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co`, Anon-Key `x`) grün; Service-Role-Key kommt in keiner Datei unter `src/app/**` und keinem `NEXT_PUBLIC_*` vor (Test per Grep in `tests/`); `passwortVergessen` liefert für bekannte und unbekannte E-Mail dieselbe Antwort.

### BE-13 Supabase-Repository Teil 1

Dateien: `src/server/repo/supabase/repository.ts`, `src/server/repo/supabase/mapping.ts`, `tests/supabase-mapping.test.ts`.

- Fabrik `supabaseRepository(client, organisationId)`; alle Lesemethoden mit Spaltenauswahl, Mapping snake_case ↔ Vertrag in `mapping.ts` (reine Funktionen).
- `legeGeraetAn` über RPC `geraet_anlegen` (Prüfarten ohne Frist; eine Transaktion). `setzeFrist` über RPC `frist_setzen`.
- `erfasseNachweis`: **erst** PDF nach `nachweise/{org}/{geraet}/{pruefart}/{nachweisId}.pdf` hochladen (`contentType: application/pdf`, `upsert: false`), **dann** Nachweis-Zeile mit derselben ID einfügen; schlägt das Einfügen fehl, bleibt die Datei verwaist (kein Löschrecht) und wird geloggt. Parameter `ereignis` und `letztePruefung` ignorieren (Trigger).
- `holeNachweisPdf`: Download über den Benutzer-Client (Storage-RLS).
- Fehler aus Postgres (`23514`, `42501`, `23505`) auf `DienstErgebnis`-Fehler mit deutscher Meldung abbilden (`mapping.ts: pgFehlerText`).

Abnahme: Mapping-Tests je Entität hin und zurück (inkl. `FestgelegteFrist`-Snapshot, `GbuDokument`, `Mangel`, `Anlass`); `pgFehlerText('23505')` → „bereits vorhanden“; typecheck grün.

### BE-14 Supabase-Repository Teil 2

Dateien: `src/server/repo/supabase/repository.ts`, `src/server/supabase/admin.ts`, Tests.

- `speichereBereich` (insert/update), `speichereMitgliedschaft` über RPC `mitglied_speichern`, `setzePruefer`/`setzeGbuDokument` (UPDATE Prüfart), `verschiebeGeraet`/`setzeBetriebsstatus` über RPCs, `erfasseAnlaesse` (ein INSERT mit n Zeilen), `hebeAnlassAuf`, `erfasseMangel`, `aktualisiereMangel`.
- `ladeBenutzerEin`: Service-Role `auth.admin.inviteUserByEmail(email, { redirectTo: SITE_URL + '/api/auth/confirm?next=/passwort-neu', data: { name } })`; existiert die E-Mail bereits → vorhandene ID, `neu: false`, keine Mail.

Abnahme: typecheck/test grün; manuelle Prüfung gegen lokale Supabase als Teil von QA-2 bzw. Gate G-5.

### FE-6 Status und Listen

Dateien: `src/components/{StatusAmpel,Pruefplakette,StatusZaehler,GeraeteFilter,GeraeteTabelle,VerlaufListe,BetriebsstatusBadge}.tsx`.

- `vor_nutzung_pruefen`: Farbe brick, Symbol „!“ (nicht nur Farbe), Label aus `STATUS_LABEL`, bei vorhandenem `grund` Zusatz aus `VOR_NUTZUNG_GRUND_LABEL`. Prüfplakette: wie überfällig; ohne `faelligAm` Mitte „!“.
- Zähler und Filter iterieren `FRIST_STATUS` (neuer Status automatisch dabei).
- Geräteliste: Spalte „Mängel“ mit `offeneMaengel` (nur > 0 anzeigen), `BetriebsstatusBadge` bei `ausser_betrieb`.
- `VerlaufListe`: Text aus `EREIGNIS_LABEL`, bei bekannten Daten Zusatz (z. B. „Lager → Produktion“, „12 → 6 Monate (kürzer)“).

### FE-7 Anmeldung und Navigation

Dateien: `src/app/page.tsx`, `src/app/login/page.tsx`, `src/app/passwort-vergessen/page.tsx`, `src/app/passwort-neu/page.tsx`, `src/app/organisation/page.tsx`, `src/app/kein-zugang/page.tsx`, `src/components/{LoginForm,PasswortVergessenForm,PasswortNeuForm,OrganisationWahl,AppHeader}.tsx`.

- `/`: nach `holeAnmeldestatus()`: `unkonfiguriert`/`abgemeldet` → `/login`; `ohne_mitgliedschaft` → `/kein-zugang`; sonst PRF → `/pruefer`, andere → `/geraete`.
- `/login`: Modus `demo` → Rollenwahl wie I1; `supabase` → E-Mail, Passwort, Link „Passwort vergessen“, Meldung bei `?fehler=link`; `unkonfiguriert` → Hinweis „Readyloop ist nicht konfiguriert“ ohne Formular.
- `/passwort-neu`: Passwort + Wiederholung (min. 10 Zeichen); ohne Auth-Sitzung → Hinweis + Link `/passwort-vergessen`.
- `/organisation`: Liste aus `listeMeineOrganisationen()` mit Rolle, aktuelle markiert, Auswahl per `waehleOrganisation`.
- Header: Organisationsname; Wechsel-Link nur bei `sitzung.organisationen.length > 1`; Navigation: Geräte (ADM/SIF/VER), Prüfaufgaben (PRF), Mängel (`mangel.lesen`), Verwaltung (`bereich.verwalten`).

### FE-8 Verwaltung

Dateien: `src/app/admin/bereiche/page.tsx`, `src/app/admin/mitglieder/page.tsx`, `src/app/admin/mitglieder/neu/page.tsx`, `src/app/admin/mitglieder/[id]/page.tsx`, `src/components/{BereichForm,BereicheTabelle,MitgliedForm,MitgliederTabelle}.tsx`.

- Seiten nur mit `bereich.verwalten` bzw. `mitglied.verwalten` (`erfordereSitzung(aktion)`).
- Bereiche: Tabelle (Name, Einsatzort, Geräte, Verantwortliche) mit Inline-Bearbeiten; Formular neu. Hinweis bei Einsatzort-Änderung: „Fristvorschläge der Geräte können sich ändern“.
- Mitglieder: Tabelle (Name, E-Mail, Rolle, Bereiche, Qualifikation, aktiv); Einladen: E-Mail, Name, Rolle (`EINLADBARE_ROLLEN`), Bereiche (Checkboxen, nur bei VER), Prüfertypen (Checkboxen, nur bei PRF). Erfolgsmeldung aus `meldung`. Ändern: zusätzlich „aktiv“; bei `istEigeneMitgliedschaft` Rolle und aktiv gesperrt.

### FE-9 Gerätedetail I2

Dateien: `src/app/geraete/[id]/page.tsx`, `src/app/nachweise/neu/[pruefartId]/page.tsx`, `src/components/{PruefartKarte,FristFreigabeForm,NachweisForm,PrueferZuweisungForm,GbuVerweisForm,BetriebsstatusForm,GeraetVerschiebenForm,AnlassForm,AnlassListe}.tsx`.

- Kopf: `BetriebsstatusBadge`; bei `geraet.bearbeiten`: Betriebsstatus umschalten (Begründung optional; beim Zurücksetzen auf „in Betrieb“ Warnung, wenn eine Prüfart `grund = 'ausser_betrieb'` hat) und Verschieben (Ziele aus `listeBereiche()` ohne aktuellen Bereich).
- Anlass (bei `anlass.erfassen`): Art, Datum (Default heute), Beschreibung, Prüfarten als Checkboxen; Liste offener und erledigter Anlässe mit „Aufheben“ (Begründung).
- Prüfart-Karte: Prüfer-Auswahl aus `listePrueferOptionen()` (bei `pruefer.zuweisen`) mit Warnung über `qualifikationsWarnung(...)` aus `@/domain/qualifikation` vor dem Speichern und `ansicht.qualifikationsWarnung` danach; GBU-Verweis anzeigen/setzen (bei `frist.freigeben`); `fristHinweis` als Kasten mit Button „Frist nach Prüfung festlegen“, der `FristFreigabeForm` mit `nachweisId` = `ansicht.letzterNachweis.id` und Monate = Empfehlung vorbelegt; `offeneMaengel`-Zähler.
- Nachweisformular: optionales Feld „Empfohlene Frist (Monate)“ mit Hinweis „Empfehlung, wirkt erst nach Freigabe“.

### FE-10 Mängel

Dateien: `src/app/maengel/page.tsx`, `src/app/maengel/neu/page.tsx`, `src/app/maengel/[id]/page.tsx`, `src/app/geraete/[id]/page.tsx` (Abschnitt Mängel einbinden), `src/components/{MaengelTabelle,MaengelFilter,MangelForm,MangelKenntnisForm,MangelBehebenForm,MangelStatusBadge}.tsx`.

- `/maengel`: Filter Status (Default offen), Bereich, Schwere als URL-Parameter; Spalten Gerät (Link), Bereich, Prüfart, Beschreibung, Schwere, Verantwortlich, Termin (rot bei `terminUeberschritten`), Status. Keine Auswertung je Person (R-45).
- `/maengel/neu?geraet=&pruefart=&nachweis=&zurueck=`: `holeMangelFormular()`; `notFound()` bei `null`; Termin vorbelegt mit `terminVorschlag(schwere, heute)` beim Wechsel der Schwere; Verantwortlich-Auswahl nur, wenn `verantwortliche` nicht leer.
- `/maengel/[id]`: Details, Verlauf (Erfassung, Kenntnis, Behebung je mit Name und Datum); Kenntnisnahme-Formular (Verantwortlich, Termin) bei `offen`; Behebungs-Formular bei `offen`/`in_bearbeitung`; beides nur bei `mangel.bearbeiten`.
- Geräteakte: Abschnitt „Mängel“ (offene zuerst), Button „Mangel erfassen“ bei `mangel.erfassen`; Hinweis „Mängel aus Nachweis vom … noch nicht erfasst“ bei `maengelErfassenFuerNachweisId`.

### QA-2

`npm run typecheck`, `npm run lint`, `npm test`, `npm run build` (a) ohne Env, (b) mit Dummy-Supabase-Env. Demo-Durchlauf: ADM lädt Prüferin ein und weist ihr L-003 zu (Warnung prüfen); ADM verschiebt L-007 nach Produktion; VER erfasst Anlass für L-005 → „vor Nutzung prüfen“; PRF (Berger) wechselt Organisation, erfasst Nachweis `maengel_weiterbetrieb` mit Empfehlung 6 für L-001 → Mängelformular → Mangel; VER nimmt Kenntnis und behebt; SIF legt Frist nach Ergebnis fest (Ereignis mit Richtung `kuerzer`); V-003 zurück in Betrieb → überfällig. Supabase-Durchlauf und `supabase test db` nur, wenn lokale Supabase verfügbar; sonst als offen melden (Gate G-5).

---

## 5. TypeScript-Vertrag Inkrement 2

Verbindlich für BE und FE. Ergänzt/ändert §3. Nicht aufgeführte Teile von §3 gelten unverändert. „GEÄNDERT“ ersetzt die I1-Definition vollständig.

### 5.1 `src/domain/types.ts`

```ts
// Vertrag Inkrement 2 – siehe docs/backlog.md §5.1 (ergänzt §3.1)

// ---------- Status ----------

// GEÄNDERT: neuer Status; Reihenfolge = Schwere absteigend (F-9)
export const FRIST_STATUS = ['ueberfaellig', 'vor_nutzung_pruefen', 'unbekannt', 'gbu', 'bald_faellig', 'ok'] as const;
export type FristStatus = (typeof FRIST_STATUS)[number];

// GEÄNDERT
export const STATUS_LABEL: Record<FristStatus, string> = {
  ueberfaellig: 'Überfällig – nicht verwenden',
  vor_nutzung_pruefen: 'Vor Nutzung prüfen – nicht verwenden',
  unbekannt: 'Prüfdatum unbekannt – Prüfung veranlassen',
  gbu: 'Frist über GBU festlegen',
  bald_faellig: 'Bald fällig',
  ok: 'In Ordnung',
};

export const VOR_NUTZUNG_GRUENDE = ['anlass', 'nicht_bestanden', 'ausser_betrieb', 'gefaehrlicher_mangel'] as const;
export type VorNutzungGrund = (typeof VOR_NUTZUNG_GRUENDE)[number];

export const VOR_NUTZUNG_GRUND_LABEL: Record<VorNutzungGrund, string> = {
  anlass: 'Anlassprüfung offen',
  nicht_bestanden: 'Letzte Prüfung nicht bestanden',
  ausser_betrieb: 'Außer Betrieb, Frist abgelaufen',
  gefaehrlicher_mangel: 'Gefährlicher Mangel offen',
};

// GEÄNDERT: grund ergänzt
export interface StatusErgebnis {
  status: FristStatus;
  faelligAm: IsoDate | null;
  restTage: number | null; // faelligAm − heute; negativ = überfällig
  grund?: VorNutzungGrund; // nur bei status 'vor_nutzung_pruefen'
}

// ---------- Betrieb, Rollen ----------

export const BETRIEBSSTATUS_LABEL: Record<Betriebsstatus, string> = {
  in_betrieb: 'In Betrieb',
  ausser_betrieb: 'Außer Betrieb',
  ausgemustert: 'Ausgemustert',
};

/** In I2 setzbar; 'ausgemustert' folgt in I4. */
export const WAEHLBARER_BETRIEBSSTATUS = ['in_betrieb', 'ausser_betrieb'] as const;
export type WaehlbarerBetriebsstatus = (typeof WAEHLBARER_BETRIEBSSTATUS)[number];

/** 'mitarbeiter' ab I5. */
export const EINLADBARE_ROLLEN = ['admin', 'sifa', 'verantwortlicher', 'pruefer'] as const;
export type EinladbareRolle = (typeof EINLADBARE_ROLLEN)[number];

export type Betriebsmodus = 'demo' | 'supabase' | 'unkonfiguriert';
export type Anmeldestatus = 'unkonfiguriert' | 'abgemeldet' | 'ohne_mitgliedschaft' | 'angemeldet';

// ---------- Anlass (F-10) ----------

export const ANLASS_ARTEN = [
  'inbetriebnahme',
  'aenderung_instandsetzung',
  'unfall_schadensfall',
  'laengere_nichtbenutzung',
  'naturereignis',
  'sonstiges',
] as const;
export type AnlassArt = (typeof ANLASS_ARTEN)[number];

export const ANLASS_ART_LABEL: Record<AnlassArt, string> = {
  inbetriebnahme: 'Vor (Wieder-)Inbetriebnahme',
  aenderung_instandsetzung: 'Prüfpflichtige Änderung/Instandsetzung',
  unfall_schadensfall: 'Unfall oder Schadensfall',
  laengere_nichtbenutzung: 'Längere Nichtbenutzung',
  naturereignis: 'Naturereignis',
  sonstiges: 'Sonstiges außergewöhnliches Ereignis',
};

// ---------- Mängel (F-14) ----------

/** Reihenfolge = Schwere absteigend. */
export const MANGEL_SCHWEREN = ['gefaehrlich', 'erheblich', 'gering'] as const;
export type MangelSchwere = (typeof MANGEL_SCHWEREN)[number];

export const MANGEL_SCHWERE_LABEL: Record<MangelSchwere, string> = {
  gefaehrlich: 'Gefährlich – Weiterbetrieb nicht zulässig',
  erheblich: 'Erheblich – zeitnah beheben',
  gering: 'Gering – bis Termin beheben',
};

/** Vorschlag Termin = heute + Tage (Q-16). */
export const MANGEL_TERMIN_TAGE: Record<MangelSchwere, number> = { gefaehrlich: 0, erheblich: 30, gering: 90 };

export const MANGEL_STATUS = ['offen', 'in_bearbeitung', 'behoben'] as const;
export type MangelStatus = (typeof MANGEL_STATUS)[number];

export const MANGEL_STATUS_LABEL: Record<MangelStatus, string> = {
  offen: 'Offen',
  in_bearbeitung: 'In Bearbeitung',
  behoben: 'Behoben',
};

// ---------- Ereignisse und Aktionen ----------

// GEÄNDERT
export const EREIGNIS_TYPEN = [
  'geraet_angelegt',
  'frist_freigegeben',
  'nachweis_erfasst',
  'pruefer_zugewiesen',
  'gbu_dokument_gesetzt',
  'geraet_verschoben',
  'betriebsstatus_geaendert',
  'anlass_erfasst',
  'anlass_aufgehoben',
  'mangel_erfasst',
  'mangel_kenntnis',
  'mangel_behoben',
  'bereich_gespeichert',
  'mitglied_gespeichert',
] as const;
export type EreignisTyp = (typeof EREIGNIS_TYPEN)[number];

export const EREIGNIS_LABEL: Record<EreignisTyp, string> = {
  geraet_angelegt: 'Gerät angelegt',
  frist_freigegeben: 'Frist freigegeben',
  nachweis_erfasst: 'Nachweis erfasst',
  pruefer_zugewiesen: 'Prüfer zugewiesen',
  gbu_dokument_gesetzt: 'GBU-Verweis gesetzt',
  geraet_verschoben: 'Gerät verschoben',
  betriebsstatus_geaendert: 'Betriebsstatus geändert',
  anlass_erfasst: 'Anlass erfasst',
  anlass_aufgehoben: 'Anlass aufgehoben',
  mangel_erfasst: 'Mangel erfasst',
  mangel_kenntnis: 'Mangel zur Kenntnis genommen',
  mangel_behoben: 'Mangel behoben',
  bereich_gespeichert: 'Bereich gespeichert',
  mitglied_gespeichert: 'Mitglied gespeichert',
};

// GEÄNDERT
export const AKTIONEN = [
  'geraet.lesen',
  'geraet.anlegen',
  'geraet.bearbeiten', // verschieben, Betriebsstatus
  'frist.freigeben', // inkl. GBU-Verweis
  'nachweis.lesen',
  'nachweis.erfassen',
  'pruefaufgaben.lesen',
  'pruefer.zuweisen',
  'anlass.erfassen', // inkl. aufheben
  'mangel.lesen',
  'mangel.erfassen',
  'mangel.bearbeiten', // Kenntnisnahme, Behebung
  'verlauf.lesen',
  'katalog.lesen',
  'katalog.freigeben',
  'bereich.verwalten',
  'mitglied.verwalten',
] as const;
export type Aktion = (typeof AKTIONEN)[number];

// ---------- Stammdaten ----------

// GEÄNDERT
export interface Mitgliedschaft {
  id: Id;
  organisationId: Id;
  benutzerId: Id;
  rolle: Rolle;
  bereichIds: Id[]; // nur für 'verantwortlicher' befüllt
  prueferTypen: PrueferTyp[]; // nur für 'pruefer' befüllt (R-10)
  aktiv: boolean;
}

export interface OrganisationOption {
  id: Id;
  name: string;
  rolle: Rolle;
}

// GEÄNDERT
export interface Sitzung {
  benutzer: Benutzer;
  organisation: Organisation;
  mitgliedschaftId: Id;
  rolle: Rolle;
  bereichIds: Id[];
  organisationen: OrganisationOption[]; // alle aktiven Mitgliedschaften, alphabetisch
  demo: boolean;
}

// ---------- Prüfarten, Nachweise ----------

/** R-11: Verweis auf die Gefährdungsbeurteilung, kein Upload in I2. */
export interface GbuDokument {
  titel: string; // z. B. 'GBU Lager 2025, Abschn. 3'
  url: string | null; // nur https://
}

// GEÄNDERT: gbuDokument ergänzt
export interface GeraetPruefart {
  id: Id;
  organisationId: Id;
  geraetId: Id;
  katalogSchluessel: string | null;
  bezeichnung: string;
  herstellerfristMonate: number | null;
  herstellerfristQuelle: string | null;
  frist: FestgelegteFrist | null;
  letztePruefung: IsoDate | null;
  letztePruefungHerkunft: Datumsherkunft;
  zugewiesenerPrueferId: Id | null;
  gbuDokument: GbuDokument | null;
}

// GEÄNDERT: fristEmpfehlungMonate ergänzt
export interface Nachweis {
  id: Id;
  organisationId: Id;
  geraetId: Id;
  geraetPruefartId: Id;
  pruefdatum: IsoDate;
  ergebnis: PruefErgebnis;
  pruefumfang: string;
  prueferName: string;
  prueferBenutzerId: Id | null;
  unterschriftImPdf: boolean;
  pdfDateiname: string;
  pdfSha256: string;
  fristEmpfehlungMonate: number | null; // Empfehlung des Prüfers, wirkt nie selbst (F-13)
  erfasstVon: Id;
  erfasstAm: IsoDateTime;
}

export interface Anlass {
  id: Id;
  organisationId: Id;
  geraetId: Id;
  geraetPruefartId: Id;
  art: AnlassArt;
  datum: IsoDate;
  beschreibung: string;
  erfasstVon: Id;
  erfasstVonName: string;
  erfasstAm: IsoDateTime;
  aufgehobenVon: Id | null;
  aufgehobenVonName: string | null;
  aufgehobenAm: IsoDateTime | null;
  aufhebungsgrund: string | null;
}

export interface AnlassAnsicht extends Anlass {
  pruefartBezeichnung: string;
  offen: boolean; // F-10
  erledigtDurchNachweisId: Id | null;
}

export interface Mangel {
  id: Id;
  organisationId: Id;
  geraetId: Id;
  geraetPruefartId: Id | null; // null = freier Mangel am Gerät
  nachweisId: Id | null;
  beschreibung: string;
  schwere: MangelSchwere;
  termin: IsoDate;
  status: MangelStatus;
  verantwortlichId: Id | null; // Benutzer-ID; null bis Kenntnisnahme, wenn vom Prüfer erfasst
  erfasstVon: Id;
  erfasstVonName: string;
  erfasstAm: IsoDateTime;
  kenntnisVon: Id | null;
  kenntnisVonName: string | null;
  kenntnisAm: IsoDateTime | null;
  behobenAm: IsoDate | null; // Datum der Behebung
  behobenDurch: string | null; // Person oder Firma, die behoben hat
  behebung: string | null; // Maßnahme
  behebungErfasstVon: Id | null;
  behebungErfasstVonName: string | null;
  behebungErfasstAm: IsoDateTime | null;
}

export interface MangelAnsicht extends Mangel {
  geraetBezeichnung: string;
  inventarnummer: string | null;
  bereichId: Id;
  bereichName: string;
  pruefartBezeichnung: string | null;
  verantwortlichName: string | null;
  terminUeberschritten: boolean; // status ≠ behoben und termin < heute
}

export interface MangelFilter {
  status?: 'offen' | 'behoben' | 'alle'; // Default 'offen' = offen + in_bearbeitung
  bereichId?: Id;
  schwere?: MangelSchwere;
}

export interface PersonOption {
  benutzerId: Id;
  name: string;
  rolle: Rolle;
}

export interface PrueferOption {
  benutzerId: Id;
  name: string;
  prueferTypen: PrueferTyp[];
}

export interface MangelFormularKontext {
  geraet: Pick<Geraet, 'id' | 'bezeichnung' | 'inventarnummer'>;
  bereichName: string;
  pruefarten: { id: Id; bezeichnung: string }[]; // im Geltungsbereich; Prüfer: nur zugewiesene
  nachweis: Pick<Nachweis, 'id' | 'geraetPruefartId' | 'pruefdatum' | 'ergebnis'> | null;
  vorbelegtePruefartId: Id | null;
  verantwortliche: PersonOption[]; // leer für Prüfer → Feld ausblenden
  heute: IsoDate;
}

// ---------- Verwaltung ----------

export interface BereichAnsicht {
  bereich: Bereich;
  geraeteAnzahl: number;
  verantwortliche: PersonOption[];
}

export interface MitgliedAnsicht {
  mitgliedschaftId: Id;
  benutzer: Benutzer;
  rolle: Rolle;
  bereichIds: Id[];
  bereichNamen: string[];
  prueferTypen: PrueferTyp[];
  aktiv: boolean;
  istEigeneMitgliedschaft: boolean;
}

// ---------- Lesemodelle ----------

// GEÄNDERT: I2-Felder ergänzt
export interface PruefartAnsicht {
  pruefart: GeraetPruefart;
  vorschlag: FristVorschlag;
  status: StatusErgebnis; // nach F-9 (Kontext: Betriebsstatus, Anlass, nicht bestanden)
  katalogEintrag: KatalogEintrag | null;
  weiterbetriebUnzulaessig: boolean; // letzter Nachweis 'nicht_bestanden'
  zugewiesenerPrueferName: string | null;
  qualifikationsWarnung: string | null; // F-15
  offeneAnlaesse: AnlassAnsicht[];
  offeneMaengel: number; // offen + in_bearbeitung an dieser Prüfart
  letzterNachweis: Pick<Nachweis, 'id' | 'pruefdatum' | 'ergebnis' | 'fristEmpfehlungMonate' | 'erfasstAm'> | null;
  fristHinweis: 'empfehlung_abweichend' | 'kuerzerer_vorschlag' | null; // F-13, F-16
  maengelErfassenFuerNachweisId: Id | null; // F-12: letzter Nachweis ≠ ohne_maengel ohne verknüpften Mangel
}

// GEÄNDERT: offeneMaengel ergänzt
export interface GeraetListenEintrag {
  geraet: Geraet;
  bereichName: string;
  gesamtStatus: FristStatus;
  naechsteFaelligkeit: IsoDate | null;
  offeneMaengel: number;
  pruefarten: { id: Id; bezeichnung: string; status: FristStatus; faelligAm: IsoDate | null }[];
}

// GEÄNDERT: maengel, anlaesse, gesamtStatusGrund ergänzt
export interface GeraetDetail {
  geraet: Geraet;
  bereich: Bereich;
  einsatzort: Einsatzort;
  gesamtStatus: FristStatus;
  gesamtStatusGrund: VorNutzungGrund | null; // gesetzt bei gesamtStatus 'vor_nutzung_pruefen'
  naechsteFaelligkeit: IsoDate | null;
  pruefarten: PruefartAnsicht[];
  nachweise: NachweisAnsicht[];
  maengel: MangelAnsicht[]; // offene zuerst, dann nach termin; leer ohne 'mangel.lesen'
  anlaesse: AnlassAnsicht[]; // absteigend nach datum
  verlauf: Ereignis[];
}
```

### 5.2 `src/domain/schemas.ts` (Ergänzungen, Zod 4)

```ts
import {
  ANLASS_ARTEN, EINLADBARE_ROLLEN, EINSATZORTE, MANGEL_SCHWEREN, PRUEFER_TYPEN, WAEHLBARER_BETRIEBSSTATUS,
} from './types';

const pflichtId = z.string().min(1);
const optId = z.preprocess(leerZuNull, z.string().min(1).nullable());
const checkbox = z.preprocess((v) => v === 'on', z.boolean());
const email = z.preprocess(
  (v) => (typeof v === 'string' ? v.trim().toLowerCase() : v),
  z.email({ error: 'Bitte eine gültige E-Mail-Adresse angeben.' }),
);
export const PASSWORT_MIN = 10;

// Auth
export const anmeldenSchema = z.object({ email, passwort: z.string().min(1, 'Passwort fehlt') });
export const passwortVergessenSchema = z.object({ email });
export const passwortSetzenSchema = z
  .object({ passwort: z.string().min(PASSWORT_MIN, `Mindestens ${PASSWORT_MIN} Zeichen`).max(72), passwortWiederholung: z.string() })
  .refine((d) => d.passwort === d.passwortWiederholung, { message: 'Passwörter stimmen nicht überein.', path: ['passwortWiederholung'] });
export const organisationWaehlenSchema = z.object({ organisationId: pflichtId });

// Verwaltung
export const bereichSpeichernSchema = z.object({
  bereichId: optId, // null = neu
  name: z.string().trim().min(2).max(80),
  einsatzort: z.enum(EINSATZORTE),
});
export const mitgliedEinladenSchema = z
  .object({
    email,
    name: z.string().trim().min(2).max(120),
    rolle: z.enum(EINLADBARE_ROLLEN),
    bereichIds: z.array(pflichtId).max(50), // formData.getAll
    prueferTypen: z.array(z.enum(PRUEFER_TYPEN)).max(PRUEFER_TYPEN.length), // formData.getAll
  })
  .refine((d) => d.rolle !== 'verantwortlicher' || d.bereichIds.length > 0, {
    message: 'Verantwortliche brauchen mindestens einen Bereich.',
    path: ['bereichIds'],
  });
export const mitgliedAendernSchema = z
  .object({
    mitgliedschaftId: pflichtId,
    name: z.string().trim().min(2).max(120),
    rolle: z.enum(EINLADBARE_ROLLEN),
    bereichIds: z.array(pflichtId).max(50),
    prueferTypen: z.array(z.enum(PRUEFER_TYPEN)).max(PRUEFER_TYPEN.length),
    aktiv: checkbox,
  })
  .refine((d) => d.rolle !== 'verantwortlicher' || d.bereichIds.length > 0, {
    message: 'Verantwortliche brauchen mindestens einen Bereich.',
    path: ['bereichIds'],
  });
// Dienst normalisiert: bereichIds nur bei 'verantwortlicher', prueferTypen nur bei 'pruefer', sonst [].

// Geräte und Prüfarten
export const prueferZuweisenSchema = z.object({ geraetPruefartId: pflichtId, prueferId: optId }); // null = Zuweisung entfernen
export const gbuDokumentSetzenSchema = z
  .object({
    geraetPruefartId: pflichtId,
    titel: optText(200), // null = Verweis entfernen
    url: z.preprocess(leerZuNull, z.url({ protocol: /^https$/, error: 'Nur https-Links.' }).max(500).nullable()),
  })
  .refine((d) => d.titel !== null || d.url === null, { message: 'Link nur mit Titel.', path: ['titel'] });
export const betriebsstatusSetzenSchema = z.object({
  geraetId: pflichtId,
  betriebsstatus: z.enum(WAEHLBARER_BETRIEBSSTATUS),
  begruendung: optText(500),
});
export const geraetVerschiebenSchema = z.object({ geraetId: pflichtId, bereichId: pflichtId, begruendung: optText(500) });

// Anlass
export const anlassErfassenSchema = z.object({
  geraetId: pflichtId,
  geraetPruefartIds: z.array(pflichtId).min(1, 'Mindestens eine Prüfart wählen.').max(10), // formData.getAll
  art: z.enum(ANLASS_ARTEN),
  datum: isoDate, // zusätzlich im Dienst: ≤ heute
  beschreibung: z.string().trim().min(5).max(1000),
});
export const anlassAufhebenSchema = z.object({ anlassId: pflichtId, grund: z.string().trim().min(10).max(500) });

// Mängel
export const mangelErfassenSchema = z.object({
  geraetId: pflichtId,
  geraetPruefartId: optId,
  nachweisId: optId,
  beschreibung: z.string().trim().min(5).max(1000),
  schwere: z.enum(MANGEL_SCHWEREN),
  termin: isoDate, // zusätzlich im Dienst: ≥ heute
  verantwortlichId: optId, // Prüfer: immer null
  zurueck: optText(300), // relativer Pfad für Redirect, sonst Default
});
export const mangelKenntnisSchema = z.object({ mangelId: pflichtId, verantwortlichId: pflichtId, termin: isoDate });
export const mangelBehebenSchema = z.object({
  mangelId: pflichtId,
  behobenAm: isoDate, // ≤ heute und ≥ Erfassungsdatum
  behobenDurch: z.string().trim().min(2).max(120),
  behebung: z.string().trim().min(5).max(1000),
});

// GEÄNDERT: fristFreigebenSchema – beide Varianten zusätzlich
//   nachweisId: optId, // F-13: Bezug auf Nachweis, muss zur selben Prüfart gehören
// GEÄNDERT: nachweisErfassenSchema – zusätzlich
//   fristEmpfehlungMonate: z.preprocess(leerZuNull, z.coerce.number().int().min(1).max(120).nullable()),
```

Formularfelder je neuer/geänderter Action (Mehrfachfelder = mehrere Inputs gleichen Namens):

| Action | Felder |
|---|---|
| `anmelden` | `email`, `passwort` |
| `passwortVergessen` | `email` |
| `passwortSetzen` | `passwort`, `passwortWiederholung` |
| `waehleOrganisation` | `organisationId` |
| `bereichSpeichern` | `bereichId` (leer = neu), `name`, `einsatzort` |
| `mitgliedEinladen` | `email`, `name`, `rolle`, `bereichIds`*, `prueferTypen`* |
| `mitgliedAendern` | `mitgliedschaftId`, `name`, `rolle`, `bereichIds`*, `prueferTypen`*, `aktiv` (Checkbox) |
| `prueferZuweisen` | `geraetPruefartId`, `prueferId` (leer = entfernen) |
| `gbuDokumentSetzen` | `geraetPruefartId`, `titel` (leer = entfernen), `url` |
| `betriebsstatusSetzen` | `geraetId`, `betriebsstatus`, `begruendung` |
| `geraetVerschieben` | `geraetId`, `bereichId`, `begruendung` |
| `anlassErfassen` | `geraetId`, `geraetPruefartIds`*, `art`, `datum`, `beschreibung` |
| `anlassAufheben` | `anlassId`, `grund` |
| `mangelErfassen` | `geraetId`, `geraetPruefartId`, `nachweisId`, `beschreibung`, `schwere`, `termin`, `verantwortlichId`, `zurueck` |
| `mangelKenntnisNehmen` | `mangelId`, `verantwortlichId`, `termin` |
| `mangelBeheben` | `mangelId`, `behobenAm`, `behobenDurch`, `behebung` |
| `fristFreigeben` | wie I1 + `nachweisId` |
| `nachweisErfassen` | wie I1 + `fristEmpfehlungMonate` |

### 5.3 `src/domain/rechte.ts`

```ts
// GEÄNDERT
export const RECHTE: Record<Aktion, readonly Rolle[]> = {
  'geraet.lesen': ['admin', 'sifa', 'verantwortlicher', 'pruefer'],
  'geraet.anlegen': ['admin', 'verantwortlicher'],
  'geraet.bearbeiten': ['admin', 'verantwortlicher'],
  'frist.freigeben': ['sifa', 'verantwortlicher'],
  'nachweis.lesen': ['admin', 'sifa', 'verantwortlicher', 'pruefer'],
  'nachweis.erfassen': ['verantwortlicher', 'pruefer'],
  'pruefaufgaben.lesen': ['pruefer'],
  'pruefer.zuweisen': ['admin', 'verantwortlicher'],
  'anlass.erfassen': ['sifa', 'verantwortlicher'],
  'mangel.lesen': ['admin', 'sifa', 'verantwortlicher', 'pruefer'],
  'mangel.erfassen': ['sifa', 'verantwortlicher', 'pruefer'],
  'mangel.bearbeiten': ['admin', 'sifa', 'verantwortlicher'],
  'verlauf.lesen': ['admin', 'sifa', 'verantwortlicher'],
  'katalog.lesen': ['admin', 'sifa', 'verantwortlicher', 'pruefer', 'mitarbeiter'],
  'katalog.freigeben': [],
  'bereich.verwalten': ['admin'],
  'mitglied.verwalten': ['admin'],
};

export function can(rolle: Rolle, aktion: Aktion): boolean; // unverändert
export function imGeltungsbereich(/* unverändert */): boolean;

/** F-16: admin immer (Ziel in eigener Organisation); verantwortlicher nur, wenn Quelle und Ziel eigene Bereiche sind; sonst false. */
export function darfVerschieben(
  sitzung: Pick<Sitzung, 'rolle' | 'bereichIds'>,
  vonBereichId: Id,
  nachBereichId: Id,
): boolean;
```

### 5.4 `src/server/data.ts` (Ergänzungen)

```ts
import type {
  Anmeldestatus, BereichAnsicht, Betriebsmodus, Id, MangelAnsicht, MangelFilter, MangelFormularKontext,
  MitgliedAnsicht, OrganisationOption, PersonOption, PrueferOption,
} from '@/domain/types';

/** F-8: 'supabase' bei URL + Anon-Key; 'demo' wenn beide fehlen und (NODE_ENV ≠ 'production' oder READYLOOP_DEMO === '1'); sonst 'unkonfiguriert'. */
export function betriebsmodus(): Betriebsmodus;

/** GEÄNDERT: betriebsmodus() === 'demo'. */
export function istDemoModus(): boolean;

/** Für '/' und Login: 'unkonfiguriert' | 'abgemeldet' | 'ohne_mitgliedschaft' (Supabase-Login ohne aktive Mitgliedschaft) | 'angemeldet'. */
export async function holeAnmeldestatus(): Promise<Anmeldestatus>;

/** true, wenn ein Supabase-Auth-Benutzer angemeldet ist (auch ohne Mitgliedschaft) – für /passwort-neu. Demo: false. */
export async function hatAuthSitzung(): Promise<boolean>;

/** Aktive Mitgliedschaften des angemeldeten Benutzers, alphabetisch (= sitzung.organisationen). */
export async function listeMeineOrganisationen(): Promise<OrganisationOption[]>;

// --- Mängel ---

/** mangel.lesen + Geltungsbereich (Prüfer: Mängel zugewiesener Prüfarten). Sortierung: Schwere, termin aufsteigend, erfasstAm. */
export async function listeMaengel(filter?: MangelFilter): Promise<MangelAnsicht[]>;

/** null ohne Recht oder außerhalb des Geltungsbereichs. */
export async function holeMangel(mangelId: Id): Promise<MangelAnsicht | null>;

/** mangel.erfassen + Gerät im Geltungsbereich; nachweisId muss zum Gerät gehören (setzt vorbelegtePruefartId). Sonst null. */
export async function holeMangelFormular(
  geraetId: Id,
  vorbelegung?: { geraetPruefartId?: Id; nachweisId?: Id },
): Promise<MangelFormularKontext | null>;

/** mangel.bearbeiten: aktive Mitglieder mit Rolle admin, sifa, verantwortlicher; alphabetisch. */
export async function listeMangelVerantwortliche(): Promise<PersonOption[]>;

// --- Prüfer ---

/** pruefer.zuweisen: aktive Mitglieder mit Rolle pruefer, alphabetisch. Sonst []. */
export async function listePrueferOptionen(): Promise<PrueferOption[]>;

// --- Verwaltung ---

/** bereich.verwalten, sonst notFound(). Alphabetisch. */
export async function listeBereicheVerwaltung(): Promise<BereichAnsicht[]>;

/** mitglied.verwalten, sonst notFound(). Aktive zuerst, dann alphabetisch. */
export async function listeMitglieder(): Promise<MitgliedAnsicht[]>;

/** mitglied.verwalten; null, wenn nicht in der Organisation. */
export async function holeMitglied(mitgliedschaftId: Id): Promise<MitgliedAnsicht | null>;

// Unverändert in der Signatur, inhaltlich erweitert: holeSitzung (organisationen), listeBereiche,
// listeGeraete (offeneMaengel, Status F-9), holeGeraetDetail (maengel, anlaesse, PruefartAnsicht I2),
// listeGeraetegruppen, listePrueferAufgaben (nur aktuelle Organisation), holeNachweisKontext, holeNachweisPdf.
```

### 5.5 `src/server/actions.ts` (Ergänzungen und Änderungen)

Alle Actions: `(prev: ActionState, formData: FormData) => Promise<ActionState>`, Sitzung + Recht + Geltungsbereich serverseitig, Validierung mit §5.2, `feldfehler` mit Formularfeldnamen.

```ts
'use server';
import type { ActionState } from '@/domain/types';

// --- Auth (BE-12) ---

/** Nur Modus supabase. signInWithPassword; Fehler immer 'E-Mail oder Passwort ist falsch.' (keine Unterscheidung).
 *  Erfolg: redirect('/'). */
export async function anmelden(prev: ActionState, formData: FormData): Promise<ActionState>;

/** Nur Modus supabase. resetPasswordForEmail mit redirectTo SITE_URL + '/api/auth/confirm?next=/passwort-neu'.
 *  Antwort immer { status: 'ok', meldung: 'Wenn ein Konto existiert, ist eine E-Mail unterwegs.' }. */
export async function passwortVergessen(prev: ActionState, formData: FormData): Promise<ActionState>;

/** Verlangt Auth-Sitzung (aus Einladungs- oder Reset-Link). updateUser({ password }). Erfolg: redirect('/'). */
export async function passwortSetzen(prev: ActionState, formData: FormData): Promise<ActionState>;

/** Nur eigene aktive Mitgliedschaft; setzt Cookie rl_org (httpOnly, sameSite lax, path '/'). Erfolg: redirect('/'). */
export async function waehleOrganisation(prev: ActionState, formData: FormData): Promise<ActionState>;

/** GEÄNDERT: Supabase signOut (Modus supabase), Cookies rl_org und rl_demo_rolle löschen; redirect('/login'). */
export async function abmelden(): Promise<void>;

// --- Verwaltung ---

/** bereich.verwalten. Neu oder ändern (Name, Einsatzort). Erfolg: revalidatePath('/admin/bereiche'),
 *  { status: 'ok', meldung: 'Bereich gespeichert', id: bereichId }. */
export async function bereichSpeichern(prev: ActionState, formData: FormData): Promise<ActionState>;

/** mitglied.verwalten. F-17. Erfolg: revalidatePath('/admin/mitglieder'),
 *  { status: 'ok', id: mitgliedschaftId, meldung: 'Einladung an … versendet.' | '… hat bereits ein Konto; Zugang angelegt.' }.
 *  Doppelte Mitgliedschaft → feldfehler.email. */
export async function mitgliedEinladen(prev: ActionState, formData: FormData): Promise<ActionState>;

/** mitglied.verwalten. F-17 (letzter Admin, eigene Mitgliedschaft). Erfolg: { status: 'ok', meldung: 'Gespeichert', id }. */
export async function mitgliedAendern(prev: ActionState, formData: FormData): Promise<ActionState>;

// --- Geräte und Prüfarten ---

/** pruefer.zuweisen + Geltungsbereich; F-15. Erfolg: revalidatePath(`/geraete/${geraetId}`), '/pruefer';
 *  { status: 'ok', meldung: 'Prüfer zugewiesen' | 'Zuweisung entfernt', id: geraetPruefartId }. Warnung blockiert nicht. */
export async function prueferZuweisen(prev: ActionState, formData: FormData): Promise<ActionState>;

/** frist.freigeben + Geltungsbereich; F-18. Erfolg: { status: 'ok', meldung: 'GBU-Verweis gespeichert', id: geraetPruefartId }. */
export async function gbuDokumentSetzen(prev: ActionState, formData: FormData): Promise<ActionState>;

/** geraet.bearbeiten + Geltungsbereich; F-11. Erfolg: { status: 'ok', meldung: 'Betriebsstatus geändert', id: geraetId }. */
export async function betriebsstatusSetzen(prev: ActionState, formData: FormData): Promise<ActionState>;

/** geraet.bearbeiten + darfVerschieben; F-16. Erfolg: revalidatePath('/geraete'), redirect(`/geraete/${geraetId}`).
 *  (Redirect, weil VER das Gerät nach dem Verschieben evtl. nicht mehr sieht → dann redirect('/geraete').) */
export async function geraetVerschieben(prev: ActionState, formData: FormData): Promise<ActionState>;

/** anlass.erfassen + Geltungsbereich; F-10; datum ≤ heute; alle Prüfarten gehören zum Gerät.
 *  Erfolg: { status: 'ok', meldung: 'Anlass erfasst', id: geraetId }. */
export async function anlassErfassen(prev: ActionState, formData: FormData): Promise<ActionState>;

/** anlass.erfassen + Geltungsbereich; nur offene, nicht aufgehobene Anlässe. Erfolg: { status: 'ok', meldung: 'Anlass aufgehoben', id: anlassId }. */
export async function anlassAufheben(prev: ActionState, formData: FormData): Promise<ActionState>;

/** GEÄNDERT: zusätzlich nachweisId (F-13). Rückgabe wie I1. */
export async function fristFreigeben(prev: ActionState, formData: FormData): Promise<ActionState>;

/** GEÄNDERT: zusätzlich fristEmpfehlungMonate. Erfolg: Ergebnis ≠ 'ohne_maengel' und can(rolle, 'mangel.erfassen') →
 *  redirect(`/maengel/neu?geraet=${geraetId}&pruefart=${pruefartId}&nachweis=${nachweisId}&zurueck=${encodeURIComponent(ziel)}`)
 *  mit ziel = '/pruefer' (pruefer) bzw. `/geraete/${geraetId}`; sonst wie I1. */
export async function nachweisErfassen(prev: ActionState, formData: FormData): Promise<ActionState>;

// --- Mängel ---

/** mangel.erfassen + Geltungsbereich; F-14. Erfolg: revalidatePath('/maengel', `/geraete/${geraetId}`),
 *  redirect(zurueck ?? (pruefer ? '/pruefer' : `/maengel/${mangelId}`)). */
export async function mangelErfassen(prev: ActionState, formData: FormData): Promise<ActionState>;

/** mangel.bearbeiten + Geltungsbereich; nur Status 'offen'; verantwortlichId aus listeMangelVerantwortliche.
 *  Erfolg: { status: 'ok', meldung: 'Zur Kenntnis genommen', id: mangelId }. */
export async function mangelKenntnisNehmen(prev: ActionState, formData: FormData): Promise<ActionState>;

/** mangel.bearbeiten + Geltungsbereich; Status 'offen' oder 'in_bearbeitung'. Erfolg: { status: 'ok', meldung: 'Mangel behoben', id: mangelId }. */
export async function mangelBeheben(prev: ActionState, formData: FormData): Promise<ActionState>;
```

### 5.6 `src/server/repo/types.ts` (intern, BE)

```ts
// Ergänzungen zum Repository-Interface. Supabase: Ereignisse entstehen per Trigger; der Parameter `ereignis`
// wird dort ignoriert und dient der Demo. Gleiche Ereignisdaten in beiden Implementierungen (F-19).
export interface Repository {
  // … I1-Methoden unverändert, außer:
  setzeFrist(daten: { pruefartId: Id; frist: FestgelegteFrist; nachweisId: Id | null; ereignis: Ereignis }): Promise<void>;

  // Lesen I2
  listeAnlaesse(organisationId: Id): Promise<Anlass[]>;
  holeAnlass(id: Id): Promise<Anlass | null>;
  listeMaengel(organisationId: Id): Promise<Mangel[]>;
  holeMangel(id: Id): Promise<Mangel | null>;

  // Schreiben I2 (je Aufruf atomar)
  speichereBereich(daten: { bereich: Bereich; neu: boolean; ereignis: Ereignis }): Promise<void>;
  ladeBenutzerEin(daten: { email: string; name: string }): Promise<{ benutzerId: Id; neu: boolean }>;
  speichereMitgliedschaft(daten: { mitgliedschaft: Mitgliedschaft; benutzer: Benutzer; neu: boolean; ereignis: Ereignis }): Promise<void>;
  setzePruefer(daten: { pruefartId: Id; prueferId: Id | null; ereignis: Ereignis }): Promise<void>;
  setzeGbuDokument(daten: { pruefartId: Id; gbuDokument: GbuDokument | null; ereignis: Ereignis }): Promise<void>;
  verschiebeGeraet(daten: { geraetId: Id; bereichId: Id; begruendung: string | null; ereignis: Ereignis }): Promise<void>;
  setzeBetriebsstatus(daten: { geraetId: Id; betriebsstatus: WaehlbarerBetriebsstatus; begruendung: string | null; ereignis: Ereignis }): Promise<void>;
  erfasseAnlaesse(daten: { anlaesse: Anlass[]; ereignisse: Ereignis[] }): Promise<void>;
  hebeAnlassAuf(daten: { anlass: Anlass; ereignis: Ereignis }): Promise<void>; // anlass mit gesetzten aufgehoben*-Feldern
  erfasseMangel(daten: { mangel: Mangel; ereignis: Ereignis }): Promise<void>;
  aktualisiereMangel(daten: { mangel: Mangel; ereignis: Ereignis }): Promise<void>; // nur Übergänge nach F-14
}

// src/server/sitzung.ts – GEÄNDERT
export function betriebsmodus(): Betriebsmodus;
export async function holeRepository(): Promise<Repository>; // war synchron
export const ORG_COOKIE = 'rl_org';
```

### 5.7 Domänenfunktionen I2 (BE-8)

```ts
// src/domain/status.ts
export interface StatusKontext {
  betriebsstatus: Betriebsstatus;
  anlassOffen: boolean;
  nichtBestanden: boolean; // letzter Nachweis der Prüfart 'nicht_bestanden'
}
/** F-9. Ohne Kontext-Abweichung identisch zu berechneStatus. */
export function berechneStatusImKontext(
  pruefart: Pick<GeraetPruefart, 'frist' | 'letztePruefung'>,
  heute: IsoDate,
  kontext: StatusKontext,
  vorlaufTage?: number,
): StatusErgebnis;
/** GEÄNDERT: optional gefährlicher offener Mangel → mindestens 'vor_nutzung_pruefen'. */
export function gesamtStatus(status: readonly FristStatus[], gefaehrlicherMangelOffen?: boolean): FristStatus;
/** GEÄNDERT: 'ok' → 'spaeter', alles andere (inkl. vor_nutzung_pruefen) → 'faellig'. */
export function prueferGruppe(status: FristStatus): 'faellig' | 'spaeter';

// src/domain/anlass.ts
/** F-10: nicht aufgehoben und kein bestandener Nachweis derselben Prüfart mit pruefdatum ≥ anlass.datum. */
export function anlassErledigtDurch(
  anlass: Pick<Anlass, 'geraetPruefartId' | 'datum' | 'aufgehobenAm'>,
  nachweise: readonly Pick<Nachweis, 'id' | 'geraetPruefartId' | 'pruefdatum' | 'ergebnis'>[],
): { offen: boolean; nachweisId: Id | null };

// src/domain/maengel.ts
export function mangelUebergangErlaubt(von: MangelStatus, nach: MangelStatus): boolean;
export function terminVorschlag(schwere: MangelSchwere, heute: IsoDate): IsoDate;
export function istMangelOffen(m: Pick<Mangel, 'status'>): boolean; // offen | in_bearbeitung

// src/domain/qualifikation.ts
/** F-15. null = passt oder keine Anforderung. Sonst Warntext mit Labels aus PRUEFER_TYP_LABEL. */
export function qualifikationsWarnung(
  prueferTypen: readonly PrueferTyp[],
  gefordert: readonly PrueferTyp[] | null,
): string | null;

// src/domain/fristen.ts
export function fristRichtung(altMonate: number | null, neuMonate: number): 'erstmalig' | 'kuerzer' | 'laenger' | 'gleich';
```

### 5.8 Routen I2

| Route | Besitzer | Zugriff |
|---|---|---|
| `/login` | FE | öffentlich (Modus-abhängig) |
| `/passwort-vergessen` | FE | öffentlich, nur Modus supabase |
| `/passwort-neu` | FE | Auth-Sitzung (`hatAuthSitzung()`) |
| `/organisation` | FE | angemeldet |
| `/kein-zugang` | FE | Auth-Sitzung ohne aktive Mitgliedschaft |
| `/maengel` | FE | `mangel.lesen` |
| `/maengel/neu` | FE | `mangel.erfassen` + `holeMangelFormular` ≠ null |
| `/maengel/[id]` | FE | `mangel.lesen` + Geltungsbereich |
| `/admin/bereiche` | FE | `bereich.verwalten` |
| `/admin/mitglieder`, `/admin/mitglieder/neu`, `/admin/mitglieder/[id]` | FE | `mitglied.verwalten` |
| `GET /api/auth/confirm` | BE | öffentlich (Token im Link) |
| `src/middleware.ts` | BE | alle Seiten, nur Session-Refresh |

## 6. Inkrement I3M – Mitarbeiter – Pakete

Fachregeln F-20 bis F-29, Rechte-Matrix (MA), Datenkatalog §6a, User Stories US-17, US-18, US-27 bis US-33, offene Fragen Q-28 bis Q-46: `docs/requirements.md`. Vertrag: §7 unten.

Nicht in I3M: NFC, Offline, Service Worker, PWA-Manifest, Push, Mehrsprachigkeit, Foto zum Mangel, serverseitiges PDF, E-Mail-Benachrichtigungen (I3).

**Status (23.11.2026):** Alle Pakete BE-15 bis BE-20, D-I3M, FE-11 bis FE-16 und QA-3 sind erledigt, einschließlich der Review-Fixes (Commits 989f2ef, 5e4e748; Migration `supabase/migrations/20261129000000_review_i3m.sql`) und Design-Entscheidung E-5. Offen sind nur:
- **FE-15a** (einfarbige Prüfplakette auf dem Etikett): wartet auf die Freigabe von Max zu Designsystem §9.7. Bis dahin druckt FE-15 über den Ersatzweg (`PLAKETTE = 'statusfarbe'` in `src/app/etiketten/page.tsx`).
- **Gate G-4** (Betriebsrat) vor der ersten Mitarbeiter-Einladung im Pilot und **Gate G-5** (Migrationen inkl. `pg_cron`, `supabase test db` mit `rls_inkrement3m.test.sql` und `cron_pseudonymisierung.test.sql`) vor dem ersten echten Datensatz.

### Dateibesitz

| Besitzer | Dateien |
|---|---|
| backend-dev | `src/domain/**`, `src/server/**`, `src/app/api/**`, `src/middleware.ts`, `supabase/**`, `tests/**`, `.env.example`; **ausnahmsweise** `package.json` und Lockfile nur in BE-15 (neue Abhängigkeiten `qrcode`, `@types/qrcode` – von Max freigegeben) |
| frontend-dev | `src/app/**` außer `src/app/api/**`, `src/components/**` |
| designer | `docs/design/**` |
| niemand ohne Absprache | `tsconfig.json`, `next.config.*`, `eslint.config.*`, `src/app/globals.css` (Druckstile über eigene Datei `src/app/etiketten/druck.css`) |

Die FE-Pakete haben untereinander **keine gemeinsamen Dateien** (Tabelle unten); geteilte Komponenten werden nur vom erstellenden Paket geschrieben und von späteren nur importiert. Innerhalb von backend-dev laufen die Pakete nacheinander (gemeinsame Dateien `dienste*.ts`, `repo/**`). `src/app/geraete/[id]/page.tsx` (FE-14) und `src/components/AppHeader.tsx`, `src/app/login/page.tsx` (FE-11) gehören auch zu Designsystem-Paketen in `docs/design/umsetzung.md`: FE-11 und FE-14 erst starten, wenn die dort laufenden Pakete für diese Dateien abgeschlossen sind.

### Designer zuerst

| FE-Paket | Designer vorher? | Was der designer liefert (`docs/design/designsystem.md` §8.12 ff., Paket in `umsetzung.md`) |
|---|---|---|
| FE-11 Login, Startseite, Navigation | nein | bestehende Muster §6.1, §8.1 genügen |
| **FE-12 Öffentliche QR-Seite** | **ja** | Seitenmuster `/g/[token]` Handy zuerst; Darstellung „Nicht verwenden“ (Banner, Größe, Position vor allem anderen); Kurzliste Prüfarten mit Frist/Quelle/Stufe; Aktionsleiste (angemeldet/abgemeldet); Leerzustand „Aufkleber nicht gültig“ |
| **FE-13 Meine Geräte, Suche, Mangel melden** | **ja** | Kartenmuster „Mein Gerät“ (Handy) und Tabellen-/Listenmuster ab `lg` (Büro-PC); Abschnitte „Mir zugeordnet“/„Von mir übernommen“; Suchseite; Formular „Mangel melden“ (Schwere als Radio-Kacheln wie §8.8) |
| **FE-14 Geräteakte: Nutzung, Zuordnung, Aufkleber** | **ja (klein)** | Platz und Aufbau des Abschnitts „Nutzung“ in §8.5 (rechte Spalte), Disclosures „Zuordnung“, „Übernahme beenden“, „Aufkleber erneuern“ (Disclosure mit Pflicht-Checkbox statt Dialog, §10 E-5), ADM-Liste „Übernahmen der letzten 90 Tage“ |
| **FE-15 Etiketten drucken** | **ja** | Etikett 70 × 37 mm: Lage von QR (min. 20 mm Kantenlänge), Prüfplakette, Texten; Druckregeln (`@page`, Ränder, Schwarzweiß-Tauglichkeit der Plakette); Bildschirmansicht der Druckseite mit Filter |
| FE-16 Mitarbeiter einladen (VER) | nein | Muster §8.10 (Tabelle, Formular) genügen |

### Reihenfolge

```
BE-15 ──┬── BE-16 ── BE-17 ── BE-18 ──┬── BE-20 ──┐
        └── BE-19 ────────────────────┘           │
BE-15 ── FE-11 ── FE-16                           ├── QA-3
designer D-I3M ──┬── FE-12 ── FE-13               │
                 ├── FE-14, FE-15 (nach FE-12) ───┘
                 └── FE-15a (nur nach OK Max §9.7) ── Umstellung FE-15 auf Druckvariante
```

- Nach BE-15 kompiliert alles gegen Stubs (`npm run typecheck` grün, auch FE: nur additive Typänderungen; `DEMO_ROLLEN` wächst um `mitarbeiter`, `ROLLE_LABEL` enthält es schon).
- FE-12 bis FE-16 laufen mit Demo-Daten ab BE-18, mit Supabase ab BE-20.
- FE-13 importiert `NutzungsHinweis` und `PruefartKurzliste` aus FE-12, deshalb FE-12 zuerst. FE-14 und FE-15 haben keine Dateiabhängigkeit zu FE-12/FE-13 und laufen danach nur, weil frontend-dev nacheinander arbeitet.
- BE-19 (Migration) kann parallel zu BE-16 bis BE-18 laufen (eigene Dateien unter `supabase/**` und `tests/migration.test.ts`).

Status: alle Pakete dieser Tabelle **erledigt**, außer FE-15a (**wartet auf Max**, §9.7).

| Paket | Besitzer | Inhalt | Hängt ab von |
|---|---|---|---|
| BE-15 | backend-dev | Vertrag I3M: `types.ts`, `schemas.ts`, `rechte.ts`, `nutzung.ts` (fertig, klein), Typ-Erweiterung `status.ts`, Repository-Interface, Stubs Demo/Supabase-Repository, Stubs `data.ts`/`actions.ts`, `Geraet.zugeordnetAn` in Demo-Daten und Mapping, `qrcode` installieren; Tests Rechte + Nutzung | – |
| BE-16 | backend-dev | Demo-Daten I3M (MA, Zuordnung, Übernahmen, Tokens), Demo-Repository I3M, `token.ts`, `qr.ts` + Tests | BE-15 |
| BE-17 | backend-dev | Dienste I3M (`dienste-mitarbeiter.ts`, `dienste-etiketten.ts`, Ergänzungen `dienste.ts`, `dienste-verwaltung.ts`, `dienste-maengel.ts`) + Tests | BE-16 |
| BE-18 | backend-dev | `data.ts`, `actions.ts`, `auth.ts` (Login mit `next`), Demo-Sitzung MA, Kopfzeilen `/g/*` in `src/middleware.ts` | BE-17 |
| BE-19 | backend-dev | Migration I3M: Tabellen, RLS, Trigger, RPCs, `pg_cron`, pgTAP, statischer Migrationstest | BE-15 |
| BE-20 | backend-dev | Supabase-Repository I3M (neue Methoden, RPC-Aufrufe, Mapping) + Tests | BE-18, BE-19 |
| D-I3M | designer | Muster für FE-12 bis FE-15 (Tabelle oben) | – |
| FE-11 | frontend-dev | Demo-Rollenwahl mit MA, Login mit `next` und Hinweis gemeinsamer PC, Startseite MA, Navigation MA/VER | BE-15 |
| FE-12 | frontend-dev | Öffentliche QR-Seite `/g/[token]` | BE-15, D-I3M |
| FE-13 | frontend-dev | `/meine-geraete`, `/meine-geraete/suchen`, `/mangel-melden/[geraetId]` | FE-12 |
| FE-14 | frontend-dev | Geräteakte: Abschnitt Nutzung (Zuordnung, Halter, Übernahme beenden, ADM-Verlauf, Etikett-Link, Aufkleber erneuern) | FE-12, D-I3M |
| FE-15 | frontend-dev | `/etiketten` Druckseite mit QR und Prüfplakette | FE-12, D-I3M |
| FE-15a | frontend-dev | Prüfplakette Variante Druck (einfarbig) in `Pruefplakette.tsx`; danach `/etiketten` auf `'druck'` umstellen | FE-15, **Freigabe Max §9.7** |
| FE-16 | frontend-dev | `/mitarbeiter` (VER lädt MA ein), Hinweis E-Mail im ADM-Formular | FE-11 |
| QA-3 | test-runner | typecheck, lint, test, build (ohne Env, Dummy-Env); Demo-Durchlauf I3M; Prüfung 360 px und 1280 px | alle |

---

### BE-15 Vertrag I3M

Dateien: `package.json` + Lockfile (`qrcode`, `@types/qrcode`), `src/domain/types.ts`, `src/domain/schemas.ts`, `src/domain/rechte.ts` (wörtlich §7.1–7.3), `src/domain/nutzung.ts` (§7.4, vollständig), `src/domain/status.ts` (nur Parametertyp §7.4), `src/server/repo/types.ts` (§7.7), `src/server/repo/demo/repository.ts` (neue Methoden `throw new Error('nicht implementiert (BE-16)')`), `src/server/repo/supabase/repository.ts` (neue Methoden `throw new Error('nicht implementiert (BE-20)')`), `src/server/repo/supabase/mapping.ts` (Spalte `zugeordnet_an`), `src/server/repo/demo/daten.ts` (nur `zugeordnetAn: null` an allen Geräten), `src/server/data.ts`, `src/server/actions.ts` (neue Signaturen §7.5/§7.6, Rümpfe `throw new Error('nicht implementiert (BE-18)')`), `tests/rechte.test.ts`, `tests/nutzung.test.ts`.

Abnahme:
- `npm run typecheck` grün im ganzen Projekt (inkl. FE); bestehende Tests grün.
- `tests/rechte.test.ts`: vollständige Matrix aus `requirements.md` §6 (jede Aktion × jede Rolle, inkl. neuer Aktionen); `darfEinladen` (ADM alle `EINLADBARE_ROLLEN`, VER nur `mitarbeiter`, sonst false); `istMeinGeraet` (zugeordnet → true; offene eigene Übernahme → true; fremde → false); `imGeltungsbereich` für MA weiter `false`.
- `tests/nutzung.test.ts`: `nutzungAus` für alle 6 Status × 3 Betriebsstatus; `uebernahmeHinweis` Reihenfolge `nicht_wechselnd` > `ausser_betrieb` > `nicht_verwenden`, `unklar` → `null`; `istTokenFormat` (22 Zeichen ok, 21/23 Zeichen, `+`, `/`, `=` → false); `imUebernahmeVerlauf` (offen → false; bis vor 89 Tagen → true; vor 91 Tagen → false; `benutzerId` null → false).

### BE-16 Demo-Daten, Demo-Repository, Token, QR

Dateien: `src/server/repo/demo/daten.ts`, `src/server/repo/demo/repository.ts`, `src/server/token.ts`, `src/server/qr.ts`, `tests/demo-i3m.test.ts`, `tests/qr.test.ts`.

Demo-Daten (Ergänzung zu BE-5/BE-10; Statusverteilung und Geräteanzahl bleiben unverändert):

| Was | Inhalt |
|---|---|
| Benutzer | Jonas Richter (fiktiv, MA, Demo-Rolle „Mitarbeiter“), Aylin Demir (fiktiv, MA, kein Demo-Login); beide aktive Mitgliedschaft Rolle `mitarbeiter` in „Elbtal Fördertechnik GmbH“, fiktive E-Mail wie die übrigen Demo-Benutzer |
| Zuordnung | P-008 Auffanggurt-Set 1 → Jonas |
| Offene Übernahmen | L-002 Elektro-Hubwagen → Jonas seit −3 Tagen; L-008 Stehleiter → Jonas seit −40 Tagen; P-003 Akku-Bohrschrauber → Aylin seit −1 Tag |
| Abgeschlossene Übernahmen | L-006 Anschlagkette: Aylin von −20 bis −18 Tage, `rueckgabe`; P-004 Winkelschleifer: von −130 bis −120 Tage, `rueckgabe`, Person bereits entfernt (`benutzerId`/`benutzerName`/`beendetVon` null) |
| Tokens | je Gerät ein aktiver Token, 22 Zeichen: `demo` + Inventarnummer ohne Bindestrich, mit `x` aufgefüllt (z. B. L-001 → `demoL001xxxxxxxxxxxxxx`); Geräte der Organisation „Muster Metallbau GmbH“: `demoM001xxxxxxxxxxxxxx`, `demoM002xxxxxxxxxxxxxx`; zusätzlich für L-001 ein deaktivierter Token `demoL001altxxxxxxxxxxx`. Nur Demo; echte Tokens kommen aus `neuerToken()` |

- Demo-Repository implementiert alle I3M-Methoden aus §7.7. `listeOffeneUebernahmen` liefert nur offene Zeilen, `listeUebernahmeVerlauf` abgeschlossene Zeilen eines Geräts mit Person, Ende ≤ 90 Tage, ohne `beendetVon`; die Rollenprüfung nach F-27 machen in der Demo die Dienste (Supabase zusätzlich RLS bzw. RPC). `holeTokenRohdaten(token, fuer)` liefert `eigeneOrganisation` nur, wenn `fuer.organisationId` die Geräte-Organisation ist und dort eine aktive Mitgliedschaft besteht. `listeKurzRohdaten` filtert `suche` case-insensitiv über Bezeichnung, Inventarnummer, Seriennummer, Hersteller, höchstens 50 Treffer, sortiert nach Bezeichnung. `holeTokenRohdaten` nur für aktive Tokens.
- `token.ts`: `neuerToken()` = `randomBytes(16).toString('base64url')`; `tokenUrl(token)` = `${NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/g/${token}` ohne doppelten Schrägstrich; `kurzUrl(url)` ohne Schema.
- `qr.ts`: `qrMatrix(text)` über `QRCode.create(text, { errorCorrectionLevel: 'M' })` → `{ groesse, module }`.

Abnahme: `neuerToken()` erfüllt `istTokenFormat` und liefert in 1.000 Aufrufen keine Dublette; `qrMatrix('https://example.org/g/' + 'a'.repeat(22)).groesse` ≥ 25 und `module.length === groesse²`; Demo: Jonas hat 1 Zuordnung und 2 offene Übernahmen; je Gerät genau ein aktiver Token; bestehende Tests (Statusverteilung, 20 Geräte) grün.

### BE-17 Dienste I3M

Dateien: `src/server/dienste-mitarbeiter.ts` (neu), `src/server/dienste-etiketten.ts` (neu), `src/server/dienste.ts` (`holeGeraetDetail` → `nutzung`, `geraetAnlegen` → Token, `sitzungFuerDemoRolle` → MA), `src/server/dienste-verwaltung.ts` (`mitarbeiterEinladen`, Austritt bei Deaktivierung/Rollenwechsel → `loeseNutzungen`), `src/server/dienste-maengel.ts` (`mangelMelden`; `mangelErfassen` und `holeMangelFormular` lehnen Rolle `mitarbeiter` ab), `src/server/dienste-basis.ts` (Kurzansicht aus Rohdaten), `tests/dienste-i3m.test.ts`.

Regeln:
- Kurzansichten und öffentliche Ansicht berechnen den Gesamtstatus aus **allen** Prüfarten und **allen** offenen Mängeln des Geräts (F-21), mit `berechneStatusImKontext`, `anlassErledigtDurch`, `gesamtStatus`, `nutzungAus`. Prüfarten in der Ansicht nach Status-Schwere (`FRIST_STATUS`), dann Bezeichnung.
- `OeffentlichePruefart.letzterNachweis` = neuester Nachweis (Prüfdatum, dann Erfassung) mit Prüfername; `frist` nur bei freigegebener Frist.
- `geraetUebernehmen`: Rolle MA; Gerät der Organisation; F-23 über `uebernahmeHinweis`; offene fremde Übernahme → `vorherige` mit `bis = jetzt`, `endeArt = 'uebergabe'`, `beendetVon = sitzung.benutzer.id`; eigene offene → Fehler „Sie haben dieses Gerät bereits übernommen.“; `benutzerName = sitzung.benutzer.name`.
- `geraetZurueckgeben`: nur eigene offene Übernahme → `rueckgabe`. `uebernahmeBeenden`: `geraet.zuordnen` + Geltungsbereich → `beendet_verwaltung`.
- `geraetZuordnen`: F-22; Ereignis `zuordnung_geaendert` mit `{ zugeordnet }`.
- `etikettErneuern`: alter Token `aktiv = false`, `deaktiviertAm = jetzt`; neuer aus `neuerToken()`; Ereignis `etikett_erneuert`.
- `holeEtiketten`: `etikett.verwalten`; Filter nach §7.1 `EtikettenFilter` (ohne `kategorie` = alle Kategorien; den Default `wechselnd` setzt die Seite); nur Geräte im Geltungsbereich; Sortierung Bereich, Inventarnummer, Bezeichnung; Rückgabe `EtikettenErgebnis` mit höchstens `ETIKETTEN_MAX` Etiketten, `gesamt` vor der Kappung und `gekappt`.
- `holeGeraetDetail().nutzung`: PRF → `null`; `uebernahme` aus `listeOffeneUebernahmen`; `verlauf` nur bei `uebernahmen.lesen` über `listeUebernahmeVerlauf` (ein Gerät, ≤ 90 Tage, ohne `beendetVon`); `etikett` nur bei `etikett.verwalten` + Geltungsbereich.
- `mitarbeiterEinladen`: wie `mitgliedEinladen` mit fester Rolle `mitarbeiter`, ohne Bereiche; ADM und VER.

Abnahme (Tests gegen Dienste mit Demo-Repository, je Fall ein Test):
- `listeMeineGeraete` Jonas → 3 Geräte, L-008 zuerst mit `nutzung = 'nicht_verwenden'`; Aylin → 1 (P-003).
- `geraetUebernehmen`: L-001 → Fehler (nicht verwenden); L-003 → Fehler (nicht wechselnd); P-003 durch Jonas → ok, Aylins Übernahme `uebergabe`, Aylin hat 0 Geräte; L-002 durch Jonas erneut → Fehler; als VER → Fehler.
- `geraetZurueckgeben` P-003 durch Aylin nach Übergabe → Fehler; L-002 durch Jonas → ok.
- `uebernahmeBeenden` VER Lager L-002 → ok `beendet_verwaltung`; VER Lager P-003 → Fehler.
- `geraetZuordnen` ADM P-008 → Aylin: ok, Ereignisdaten exakt `{ zugeordnet: true }`; L-001 → Fehler; Ziel VER-Benutzer → Fehler; VER Lager P-008 → Fehler.
- `mangelMelden` Jonas, V-001, gefährlich → Kurzansicht V-001 `vor_nutzung_pruefen`/`nicht_verwenden`; Mangel `termin = heute`, `geraetPruefartId = null`, `verantwortlichId = null`; `mangelErfassen` als MA → Fehler.
- `holeTokenSeite('demoL001xxxxxxxxxxxxxx')` ohne Sitzung → `nutzung = 'nicht_verwenden'`, `kurz = null`, `akteUrl = null`; `JSON.stringify(ergebnis)` enthält keinen der Namen Katrin Vogel, Dr. Jens Hartmann, Marco Lindner, Sabine Krüger, Jonas Richter, Aylin Demir (Prüfername Tobias Berger erlaubt); deaktivierter Token, unbekannter Token und `'abc'` → `null` (letzterer ohne Repository-Aufruf).
- `holeTokenSeite` als Jonas für L-002 → `kurz.uebernahme = 'von_mir'`; als VER Lager für L-003 → `akteUrl = '/geraete/{id}'`, für P-001 → `null`.
- `holeGeraetDetail(L-006)` als ADM → `nutzung.verlauf` 1 Eintrag (−20); als VER und SIF → `[]`; `holeGeraetDetail(L-002)` als VER → `uebernahme.benutzerName = 'Jonas Richter'`; als PRF (zugewiesen) → `nutzung = null`.
- `holeEtiketten({ bereichId: Lager, kategorie: 'wechselnd' })` als VER Lager → 4 Etiketten (L-001, L-002, L-006, L-008), `url` endet auf den aktiven Token; `{ geraetIds: [P-001] }` → `[]`.
- `etikettErneuern(L-002)` → alter Token liefert `null` in `holeTokenSeite`, neuer funktioniert; Ereignis `etikett_erneuert`.
- `mitarbeiterEinladen` als VER → Mitgliedschaft `mitarbeiter`, `bereichIds = []`; `mitgliedAendern` ADM deaktiviert Jonas → P-008 `zugeordnetAn = null`, L-002 und L-008 `austritt`.
- `sucheGeraete('leiter')` als Jonas → L-008 mit `uebernahme = 'von_mir'`; als Aylin → `von_anderen`; `sucheGeraete('a')` → `[]`.

### BE-18 Datenzugriff, Actions, Login mit Rücksprung

Dateien: `src/server/data.ts`, `src/server/actions.ts`, `src/server/auth.ts`, `src/server/sitzung.ts` (Demo-Rolle `mitarbeiter`), `src/middleware.ts` (Kopfzeilen für `/g/*`), `tests/actions-i3m.test.ts`.

- Alle Funktionen aus §7.5/§7.6 für den Demo-Modus.
- `holeTokenSeite` ruft **nicht** `erfordereSitzung` (kein Redirect), sondern `leseSitzung()`; bei falschem Format sofort `null`.
- `anmelden` und `setzeDemoRolle` lesen `next` und leiten über `sichererRuecksprung(next, standard)` weiter; Standard `setzeDemoRolle`: PRF `/pruefer`, MA `/meine-geraete`, sonst `/geraete`.
- `src/middleware.ts` (Kopfzeilen aus `src/server/kopfzeilen.ts`, `QR_KOPFZEILEN`): für Pfade `/g` und `/g/*` `Cache-Control: no-store`, `Referrer-Policy: same-origin`, `X-Robots-Tag: noindex, nofollow`; keine Weiterleitung auf `/login` für `/g/*` (Session-Refresh im Modus supabase bleibt).
  - **`same-origin` statt `no-referrer` (Review-Fix):** Bei `no-referrer` sendet Chrome beim Formular-POST ohne JavaScript `Origin: null`; Next.js lehnt die Server Action dann ab (500), und „Gerät übernehmen“/„Zurückgeben“ ohne JS (I3M-0 Punkt 7) scheitern. `same-origin` gibt den Referrer nur an die eigene Origin; fremde Seiten, externe Links und Ressourcen erhalten die Token-URL weiterhin nicht.
- `holeTokenSeite` übergibt `fuer = { benutzerId, organisationId }` der Sitzung (ohne Sitzung `null`) an `holeTokenRohdaten`; `kurz` und `akteUrl` nur, wenn `eigeneOrganisation` gesetzt ist. Die Geräte-ID geht nie an anonyme oder fremde Aufrufer.
- `revalidatePath` nach Übernahme/Rückgabe/Mangel: `/meine-geraete`, `/meine-geraete/suchen`, `/g/[token]` (Typ `page`), `/geraete/${id}`, `/geraete`.

Abnahme: `npm run build` ohne Env grün; `/g/[token]` ist dynamisch; `sichererRuecksprung` lehnt `//evil.example`, `https://…` und `javascript:` ab (Test); jede neue Action prüft Recht und liefert `feldfehler` mit Formularfeldnamen.

### BE-19 Migration I3M

Dateien: `supabase/migrations/20261128000000_inkrement3m.sql` (20261127… war durch `review_i2` belegt), Review-Fixes in `supabase/migrations/20261129000000_review_i3m.sql` (ersetzt Teile der I3M-Migration, diese bleibt unverändert), `supabase/tests/rls_inkrement3m.test.sql` und `supabase/tests/cron_pseudonymisierung.test.sql` (pgTAP), `tests/migration.test.ts` (erweitert). Frühere Migrationen unverändert.

**Stand nach Review-Fixes (verbindlich, ersetzt die betroffenen Punkte unten):**
- `app.geraet_status_json(p_geraet)` (security definer, kein `execute` für `anon`/`public`): Status-JSON **ohne interne IDs** – Gerät (Bezeichnung, Inventarnummer, Hersteller, Typ, Kategorie, Betriebsstatus), Prüfarten mit laufender Nummer `nr` (Reihenfolge Bezeichnung, ID), Frist (Monate, Quelle, Stufe, Fundstelle), letzte Prüfung + Herkunft; Nachweise nur der neueste je Prüfart (`pruefart_nr`, Datum, Ergebnis, Erfassungszeit, Prüfername); Anlässe nur offene (`pruefart_nr`, Datum, Erfassungszeit, Aufhebungszeit); offene Mängel nur Schwere.
- `public.geraet_oeffentlich(p_token text, p_organisation uuid default null) returns jsonb` (alte Signatur `(text)` per `drop function` ersetzt): Status-JSON + `organisation_name`; `geraet_id` und `gleiche_organisation` nur bei `auth.uid() is not null`, `p_organisation` = Geräte-Organisation und `app.ist_mitglied`. `grant execute` an `anon, authenticated`.
- `public.ma_kurzansichten`: Status-JSON + `geraet_id` auf oberster Ebene, `bereich_name`, `zugeordnet_mir`, `offene_uebernahme`.
- `uebernahme` SELECT-Policy: nur `bis is null` – MA eigene offene, admin/sifa offene der Organisation, VER offene im Bereich, Prüfer nichts.
- `public.uebernahmen_verlauf(p_geraet uuid)` (security definer, `grant execute … to authenticated`, `revoke … from public, anon`): nur admin, ein Gerät, `bis` in den letzten 90 Tagen, Person vorhanden, nicht pseudonymisiert; Spalten `id, organisation_id, geraet_id, benutzer_id, benutzer_name, von, bis, ende_art` (ohne `beendet_von`), `order by bis desc`.
- `pg_cron`: Job `readyloop_uebernahmen_pseudonymisieren`, Zeitplan `15 1,2 * * *` UTC, ausgeführt nur in der Stunde 03 Europe/Berlin (= 03:15 Ortszeit, sommer- und winterzeitfest). Fehlt `pg_cron` im Supabase-Kontext (Rolle `supabase_admin` vorhanden): `raise warning` „READYLOOP F-27: pg_cron fehlt …“ mit Anleitung; außerhalb von Supabase `notice`.

Inhalt:
- `geraet.zugeordnet_an uuid references auth.users`, Check `zugeordnet_an is null or kategorie = 'personenbezogen'`; Spalten-Grant UPDATE `zugeordnet_an`; BEFORE-UPDATE-Trigger: nur admin oder VER (Bereich), Ziel aktives Mitglied Rolle `mitarbeiter` derselben Organisation; AFTER-Trigger Ereignis `zuordnung_geaendert` mit `{ zugeordnet }` ohne Person.
- `geraet_token`: Spalten nach `requirements.md` §5, `token text not null unique check (token ~ '^[A-Za-z0-9_-]{22}$')`, partieller Unique-Index `(geraet_id) where aktiv`. Token-Erzeugung `app.neuer_token()` = 16 Byte `gen_random_bytes`, base64url ohne `=`. AFTER-INSERT-Trigger auf `geraet` legt Token an (security definer). Bestand: `insert … select` für alle Geräte ohne aktiven Token. RLS: SELECT/INSERT/UPDATE admin, VER (Bereich); UPDATE nur `aktiv true → false` (Trigger setzt `deaktiviert_am`).
- `uebernahme`: Spalten nach §5, `ende_art` Check mit `UEBERNAHME_ENDE_ARTEN`, Check `(bis is null) = (ende_art is null)`, partieller Unique-Index `(geraet_id) where bis is null`. RLS: SELECT nach `requirements.md` §6 „RLS I3M“ (nur offene Zeilen); keine INSERT/UPDATE/DELETE-Policies. Abgeschlossene nur über `uebernahmen_verlauf`.
- RPCs `security definer`, `search_path` gesetzt, `revoke execute … from public, anon`, `grant execute … to authenticated` (Ausnahme `geraet_oeffentlich`: zusätzlich `anon`):
  - `public.geraet_oeffentlich(p_token text, p_organisation uuid default null) returns jsonb` – `null` bei falschem Format, unbekanntem oder inaktivem Token; liefert nur die Felder von `TokenRohdaten` (§7.7) ohne interne IDs (Details oben „Stand nach Review-Fixes“), `uebernommen` nicht.
  - `public.ma_kurzansichten(p_org uuid, p_art text, p_suche text, p_ids uuid[]) returns jsonb` – Aufrufer aktives MA-Mitglied von `p_org`, sonst `42501`; `p_art` `meine` | `suche` (≥ 2 Zeichen, max. 50) | `ids`; Felder wie `KurzRohdaten`; `offeneUebernahme.vonMir`, `seit` nur bei eigener.
  - `public.uebernahme_starten(p_geraet uuid)` – Aufrufer aktives MA-Mitglied der Organisation des Geräts; `kategorie = 'wechselnd'`, `betriebsstatus = 'in_betrieb'`; keine eigene offene; fremde offene → `uebergabe`; Name aus `mitgliedschaft.anzeigename`. Umgesetzt prüft die DB zusätzlich „nicht verwenden“ (überfällig, offener Anlass, gefährlicher Mangel → Fehler `23514`), damit ein direkter RPC-Aufruf mit MA-JWT die Regel nicht umgeht; der Dienst prüft dieselbe Regel vorher für die Fehlermeldung.
  - `public.uebernahme_beenden(p_geraet uuid)` – eigene offene → `rueckgabe`; sonst admin oder VER (Bereich) → `beendet_verwaltung`; sonst `42501`.
- RPC `public.etikett_erneuern(p_geraet uuid) returns text` `security invoker`: alten Token deaktivieren, neuen anlegen, eine Transaktion; Trigger-Ereignis `etikett_erneuert`.
- `mangel`: INSERT-Policy zusätzlich für MA (Bedingungen `requirements.md` §6 „RLS I3M“); BEFORE-INSERT-Trigger prüft `termin = current_date + Tage nach Schwere` (Zeitzone Europe/Berlin) für MA.
- `mitgliedschaft`: INSERT-Policy für VER nur `rolle = 'mitarbeiter'`; `mitglied_speichern` lässt VER nur dieses zu. AFTER-UPDATE-Trigger: `aktiv` wird false oder `rolle` wechselt weg von `mitarbeiter` → `geraet.zugeordnet_an = null` für diese Person und offene Übernahmen `bis = now()`, `ende_art = 'austritt'`.
- `app.uebernahmen_pseudonymisieren()` (security definer): `benutzer_id`, `benutzer_name`, `beendet_von` → null, `pseudonymisiert_am = now()` für `bis < now() - interval '90 days'`. Zeitplan per `pg_cron` täglich 03:15 Europe/Berlin, nur wenn die Erweiterung verfügbar ist (`do $$ … pg_available_extensions …$$`).
- `ereignis.typ`-Check um `zuordnung_geaendert`, `etikett_erneuert` erweitern.

Abnahme:
- `tests/migration.test.ts`: `geraet_token` und `uebernahme` mit `enable row level security`; weiterhin einzige `for delete`-Policy auf `bereich_verantwortung`; keine INSERT/UPDATE-Policy auf `uebernahme`; `grant execute` an `anon` kommt genau einmal vor (für `geraet_oeffentlich`); jede neue Funktion hat `revoke execute … from public, anon` außer `geraet_oeffentlich`; alle Werte aus `UEBERNAHME_ENDE_ARTEN` und den neuen `EREIGNIS_TYPEN` stehen in Checks; Token-Check-Muster entspricht `TOKEN_MUSTER`.
- `grant execute` an `anon` genau einmal (für `geraet_oeffentlich(text, uuid)`); `uebernahmen_verlauf` und `app.geraet_status_json` mit `revoke execute … from public, anon`.
- Abgedeckt teils durch pgTAP `rls_inkrement3m.test.sql` (19 Fälle, Ausführung = Gate G-5), vollständig durch das SQL-Szenario `tests/sql/rls-szenario-i3m.sql` (läuft in `tests/migration.test.ts` mit `RL_TEST_PG`): anon liest `geraet` nicht, `geraet_oeffentlich` liefert für aktiven Token JSON ohne Schlüssel `zugeordnet_an`, `benutzer_name`, `erfasst_von_name` und ohne `geraet_id`/UUIDs (anon und fremde Organisation), mit `geraet_id` nur für Mitglied mit passendem `p_organisation`; MA sieht keine Zeile in `geraet`, `mangel`, `nachweis`; MA sieht nur eigene offene Übernahmen; MA übernimmt ortsgebundenes Gerät → Fehler; zweite offene Übernahme desselben Geräts → Unique-Fehler; direkter SELECT liefert für niemanden abgeschlossene Übernahmen (auch ADM nicht); `uebernahmen_verlauf` liefert für ADM die Übernahme der letzten 90 Tage ohne `beendet_von`, für VER/SIF nichts; `cron_pseudonymisierung.test.sql`: `pg_cron` installiert, genau ein aktiver Job mit Zeitplan `15 1,2 * * *`; VER lädt `verantwortlicher` ein → Fehler; MA-Mangel mit `verantwortlich_id` → Fehler; Deaktivieren eines MA beendet seine Übernahmen.

### BE-20 Supabase-Repository I3M

Dateien: `src/server/repo/supabase/repository.ts`, `src/server/repo/supabase/mapping.ts`, `tests/supabase-mapping.test.ts` (erweitert).

- Neue Methoden aus §7.7 über RPCs bzw. Tabellenzugriffe; `legeGeraetAn` ignoriert `token` (Trigger), `loeseNutzungen` ist ein No-op (Trigger).
- `holeTokenRohdaten(token, fuer)` funktioniert ohne Sitzung (`holeRepository(null)`), Aufruf `rpc('geraet_oeffentlich', { p_token, p_organisation: fuer?.organisationId ?? null })`; `geraet_id` aus der Antwort → `eigeneOrganisation: { geraetId }`, sonst `null`.
- `listeOffeneUebernahmen(org, geraetId?)`: Tabelle `uebernahme` mit Filter `bis is null` (RLS liefert ohnehin nur offene). `listeUebernahmeVerlauf(geraetId)`: `rpc('uebernahmen_verlauf', { p_geraet })`, Mapping `zuUebernahmeVerlauf` mit `beendetVon: null`; Nicht-Admin → `[]`.
- `erfasseMangel` für MA ohne `.select()` nach dem Insert (MA hat keine SELECT-Policy auf `mangel`).
- Mapping `GeraetToken`, `Uebernahme`, `UebernahmeVerlaufEintrag`, `StatusRohdaten` (über `nr`/`pruefart_nr`), `KurzRohdaten`, `TokenRohdaten` hin und zurück.

Abnahme: Mapping-Tests je neuer Entität; typecheck/test grün; manuelle Prüfung gegen Supabase in QA-3 bzw. G-5.

### FE-11 Login, Startseite, Navigation (MA)

Dateien: `src/app/page.tsx`, `src/app/login/page.tsx`, `src/components/LoginForm.tsx`, `src/components/AppHeader.tsx`.

- Demo-Rollenwahl iteriert `DEMO_ROLLEN` (fünf Rollen). Login (beide Modi) übernimmt `searchParams.next` als verstecktes Feld `next`. Unter dem Formular Hinweis „An gemeinsam genutzten Computern nach der Arbeit abmelden.“
- `/`: MA → `/meine-geraete` (Rest wie FE-7).
- Navigation: MA „Meine Geräte“ (`/meine-geraete`), „Gerät suchen“ (`/meine-geraete/suchen`); „Etiketten“ bei `etikett.verwalten`; „Mitarbeiter“ bei `mitarbeiter.einladen` und nicht `mitglied.verwalten`.

Abnahme: Demo: Mitarbeiter wählen → `/meine-geraete`; `/login?next=/g/demoL002xxxxxxxxxxxxxx` → nach Rollenwahl Mitarbeiter auf der QR-Seite; `next=https://evil.example` → `/meine-geraete`; Navigation je Rolle wie oben; 360 px ohne horizontales Scrollen.

### FE-12 Öffentliche QR-Seite (Design zuerst)

Dateien: `src/app/g/[token]/page.tsx`, `src/app/g/[token]/not-found.tsx`, `src/components/{OeffentlicheGeraeteansicht,NutzungsHinweis,PruefartKurzliste,TokenAktionen}.tsx`.

- Daten: `holeTokenSeite(token)`; `null` → `notFound()` mit Text „Dieser Aufkleber ist nicht gültig.“ `generateMetadata`: `robots: { index: false, follow: false }`.
- Seite funktioniert ohne Sitzung; kein Header-Menü ohne Sitzung (nur Wortmarke), mit Sitzung normaler Header.
- `NutzungsHinweis` (Props `{ nutzung: Nutzung; gesamtStatus: FristStatus; grund: VorNutzungGrund | null; betriebsstatus: Betriebsstatus }`) steht vor allem anderen; Text aus `NUTZUNG_LABEL` plus Grund.
- `PruefartKurzliste` (Props `{ pruefarten: OeffentlichePruefart[] }`): je Prüfart Status, fällig am, Frist mit `StufeBadge` (mit Text), Quelle (`FRIST_QUELLE_LABEL`), Fundstelle; ohne Frist „Frist über GBU festlegen“; letzte Prüfung mit `DATUMSHERKUNFT_LABEL`; letzter Nachweis mit Ergebnis und Prüfername.
- `TokenAktionen` (Props `{ seite: TokenSeite }`): ohne Anmeldung Links „Anmelden und übernehmen“ (nur `kategorie === 'wechselnd'`) und „Anmelden und Mangel melden“ → `/login?next=/g/{token}`; mit `seite.kurz`: „Gerät übernehmen“ (`geraetUebernehmen`, nur wenn `uebernahme ∈ {frei, von_anderen}` und `uebernahmeHinweis === null`; bei `von_anderen` Hinweis „Wird von einer anderen Person genutzt“, bei `nutzung === 'unklar'` Hinweis vorher), „Zurückgeben“ (`geraetZurueckgeben`, bei `von_mir`), Link „Mangel melden“ → `/mangel-melden/{geraetId}?zurueck=/g/{token}`; sonst `UEBERNAHME_HINWEIS_LABEL`. Mit `akteUrl`: Link „Geräteakte öffnen“.

Abnahme: US-18 vollständig (Demo-Tokens aus BE-16); keine Personennamen außer Prüfername im HTML; 320 px und 1280 px ohne horizontales Scrollen; Übernehmen ohne JavaScript funktionsfähig (Formular-Action).

### FE-13 Meine Geräte, Suche, Mangel melden (Design zuerst)

Dateien: `src/app/meine-geraete/page.tsx`, `src/app/meine-geraete/suchen/page.tsx`, `src/app/mangel-melden/[geraetId]/page.tsx`, `src/components/{MeinGeraetKarte,GeraeteSucheForm,MangelMeldenForm}.tsx`. Importiert `NutzungsHinweis`, `PruefartKurzliste` (FE-12, unverändert).

- `/meine-geraete`: `erfordereSitzung('meine_geraete.lesen')`, `listeMeineGeraete()`; Abschnitte „Mir zugeordnet“, „Von mir übernommen“ (mit „seit“); je Gerät Plakette, `NutzungsHinweis`, nächste Fälligkeit, `PruefartKurzliste` (zugeklappt bei `verwendbar`), Aktionen „Zurückgeben“ (übernommen), „Mangel melden“; Leerzustand nach US-17.
- `/meine-geraete/suchen?q=`: `geraet.suchen`; Formular mit Label und Button „Suchen“; `sucheGeraete(q)`; Ergebnis je Gerät Plakette, Bezeichnung, Inventarnummer, Bereich, Nutzbarkeit, offene Mängel als Zahl, Aktion „Gerät übernehmen“/„Zurückgeben“/Hinweis wie FE-12, „Mangel melden“. Unter 2 Zeichen Hinweis statt Ergebnis.
- `/mangel-melden/[geraetId]?zurueck=`: `holeMangelMeldung(geraetId)`, `null` → `notFound()`; Formular Schwere (Radio-Kacheln mit `MANGEL_SCHWERE_LABEL`), Beschreibung; Hinweis „Bei Gefahr: Gerät nicht verwenden und den Verantwortlichen sofort ansprechen.“; Erfolg: Meldung aus `meldung` + Link zurück (`zurueck`, nur relativ, sonst `/meine-geraete`).

Abnahme: US-17, US-28 (Suche), US-30, US-33 im Demo-Modus; Touch-Ziele ≥ 48 px; ab `lg` Listen-/Tabellenmuster nach Design.

### FE-14 Geräteakte: Nutzung (Design zuerst, klein)

Dateien: `src/app/geraete/[id]/page.tsx` (nur Abschnitt einbinden), `src/components/{NutzungAbschnitt,ZuordnungForm,UebernahmeBeendenForm,EtikettErneuernForm,UebernahmeVerlauf}.tsx`.

- `NutzungAbschnitt` (Props `{ geraet: Geraet; nutzung: GeraetNutzung }`), nur wenn `detail.nutzung !== null`: personenbezogen → „Zugeordnet an …“ oder „Nicht zugeordnet“, `ZuordnungForm` (Auswahl aus `listeMitarbeiterOptionen()`, leer = lösen) bei `darfZuordnen`; wechselnd → „Übernommen von … seit …“ oder „Nicht übernommen“, `UebernahmeBeendenForm` bei `darfZuordnen` und offener Übernahme; `UebernahmeVerlauf` bei `verlauf.length > 0` mit Überschrift „Übernahmen der letzten 90 Tage“ und Satz „Ältere Einträge werden automatisch ohne Namen gespeichert.“; bei `etikett`: Link „Etikett drucken“ → `/etiketten?geraet={id}`, `EtikettErneuernForm` in einer Disclosure „Aufkleber erneuern“.
- **E-5 (Design-Entscheidung, ersetzt den früheren Bestätigungsdialog §6.16):** kein `<dialog>`. `EtikettErneuernForm` zeigt die Warnung „Der alte Aufkleber wird sofort ungültig.“ (Zusatz: neues Etikett drucken und überkleben), eine Pflicht-Checkbox `bestaetigung` („Ich habe verstanden, dass der alte Aufkleber ungültig wird.“) und den gefährlichen Button „Aufkleber erneuern“. Das Formular ist `noValidate`; die fehlende Bestätigung meldet der Server mit dem Schema-Text „Bitte bestätigen, dass der alte Aufkleber ungültig wird.“ am Feld. Grund: funktioniert ohne JavaScript (I3M-0 Punkt 7) und am Handy ohne modales Overlay.

Abnahme: US-29, US-31 (Erneuern: ohne Checkbox Feldfehler, mit Checkbox Meldung „Aufkleber erneuert. …“ und neue Kurz-URL), US-32 im Demo-Modus je Rolle (ADM, SIF, VER, PRF). Status: erledigt.

### FE-15 Etiketten drucken (Design zuerst)

Dateien: `src/app/etiketten/page.tsx`, `src/app/etiketten/druck.css`, `src/components/{Etikett,QrCode,EtikettenAuswahl}.tsx`. Prüfplakette über die bestehende Komponente `Pruefplakette` (nur importieren; braucht der designer eine Druckvariante, ist das ein eigenes Design-Paket für `Pruefplakette.tsx`).

- `erfordereSitzung('etikett.verwalten')`; `searchParams`: `geraet` (mehrfach, hat Vorrang), `bereich`, `kategorie`, `start` (1–24, erstes freies Feld). Kategorie: Parameter fehlt → `wechselnd`; Parameter leer oder `alle` → kein Kategoriefilter (alle Kategorien). `holeEtiketten(filter)` liefert `EtikettenErgebnis`; bei `gekappt` Warnhinweis „Es passen {gesamt} Geräte, gedruckt werden nur die ersten 120. Bitte nach Bereich oder Kategorie auswählen.“
- Plakette: bis FE-15a Ersatzweg (`PLAKETTE = 'statusfarbe'`, normale `Pruefplakette` in Statusfarbe mit `print-color-adjust: exact`); nach FE-15a auf `'druck'` umstellen.
- `EtikettenAuswahl`: Bereich (aus `listeBereiche()`), Kategorie, Button „Etiketten anzeigen“, Button „Drucken“ (`window.print()`), Anzahl.
- `QrCode` (Props `{ matrix: QrMatrix; groesseMm: number; label: string }`): SVG aus der Matrix, Ruhezone 4 Module, Farbe `currentColor`, `role="img"`, `aria-label`.
- `Etikett` (Props `{ etikett: Etikett }`): 70 × 37 mm nach Design, QR, Kurz-URL in Mono, Bezeichnung, Inventarnummer, Betrieb, Plakette, „Stand {Datum}“, „Aktueller Status: QR scannen“.
- `druck.css`: `@page { size: A4; margin: … }`, Raster 3 × 8, Bedienelemente `print:hidden`.

Abnahme: US-31; Druckvorschau Chrome und Firefox zeigt 24 Etiketten je Seite ohne Umbruch innerhalb eines Etiketts; gedruckter QR (Testausdruck) lässt sich mit einer Handy-Kamera-App öffnen; `/etiketten` ohne Parameter nur `wechselnd`, `?kategorie=alle` alle Kategorien; Kappungshinweis ab 121 Geräten. Status: erledigt (Ersatzweg Plakette).

### FE-15a Prüfplakette Variante Druck (wartet auf Max)

Besitzer frontend-dev. **Start nur nach Freigabe von Max zu Designsystem §9.7** (einfarbige Plakette auf dem Etikett). Ohne Freigabe entfällt das Paket; FE-15 bleibt beim Ersatzweg. Hängt ab von FE-15. Gestaltung und Abnahme im Detail: `docs/design/umsetzung.md` Abschnitt „FE-15a“.

Dateien: `src/components/Pruefplakette.tsx` (+ Test, falls vorhanden); danach eine Zeile in `src/app/etiketten/page.tsx` (`PLAKETTE = 'druck'`). Kein anderes Paket ändert `Pruefplakette.tsx` gleichzeitig.

- Neue optionale Prop `druck?: boolean`: nur `black`/`white`, aktives Segment schwarz gefüllt, inaktive weiß, Segmentrahmen 1,5 viewBox-Einheiten, GBU weiter gestrichelt, Mitte wie bisher („!“ schwarz statt brick); kein `color-mix`.
- `width`/`height` bei `druck` = `100%` (Etikett setzt 13 mm; `groesse` wird ignoriert).
- `aria-label` ohne Statuswort, z. B. „Nächste Prüfung 03/2027“.

Abnahme: In einem 13-mm-Container als PDF gedruckt sind Ring, gefüllter Monat und Jahr bei 100 % klar erkennbar, keine Graustufenflächen; ohne `druck` ist die Plakette in allen bisherigen Varianten unverändert (bestehende Tests grün, Sichtprüfung `/geraete`); Etiketten zeigen danach die Druckvariante.

### FE-16 Mitarbeiter einladen (VER)

Dateien: `src/app/mitarbeiter/page.tsx`, `src/components/{MitarbeiterEinladenForm,MitarbeiterTabelle}.tsx`, `src/components/MitgliedForm.tsx` (nur Hinweis bei Rolle `mitarbeiter`).

- `/mitarbeiter`: `erfordereSitzung('mitarbeiter.einladen')`; `listeMitarbeiter()` als Tabelle (Name, E-Mail, aktiv) ohne Aktionen; Formular E-Mail, Name, Button „Mitarbeiter einladen“ (`mitarbeiterEinladen`); Hinweis „Bitte dienstliche E-Mail-Adresse verwenden. Ohne E-Mail ist keine Anmeldung möglich; der Prüfstatus bleibt über den QR-Code am Gerät sichtbar.“; Satz „Deaktivieren übernimmt der Admin.“ für VER.
- `MitgliedForm`: bei Rolle `mitarbeiter` derselbe E-Mail-Hinweis.

Abnahme: US-27 im Demo-Modus (VER und ADM).

### QA-3

`npm run typecheck`, `npm run lint`, `npm test`, `npm run build` (a) ohne Env, (b) mit Dummy-Supabase-Env. Demo-Durchlauf: VER lädt Mitarbeiterin ein; VER druckt Etiketten Lager/wechselnd; QR-Seite L-001 ohne Login („Nicht verwenden“, kein Name außer Prüfer); „Anmelden und übernehmen“ für L-002 → Rollenwahl Mitarbeiter → zurück → übernehmen; MA übernimmt P-003 (Übergabe von Aylin); MA meldet gefährlichen Mangel an V-001 → „Nicht verwenden“ überall; MA gibt L-002 zurück; ADM ordnet P-008 Aylin zu; ADM sieht Übernahme-Verlauf L-006, VER nicht; VER erneuert Aufkleber L-002 → alter Link ungültig; ADM deaktiviert Jonas → Zuordnung und Übernahmen beendet. Jede MA-Seite bei 360 px und 1280 px, MA-Ablauf am Desktop nur mit Tastatur. Supabase-Durchlauf und `supabase test db` nur mit lokaler Supabase, sonst als offen melden (G-5).

---

## 7. TypeScript-Vertrag Inkrement I3M

Verbindlich für BE und FE. Ergänzt/ändert §3 und §5. „GEÄNDERT“ ersetzt die bisherige Definition vollständig; nicht aufgeführte Teile gelten unverändert.

### 7.1 `src/domain/types.ts`

```ts
// Vertrag Inkrement I3M – siehe docs/backlog.md §7.1 (ergänzt §3.1, §5.1)

// ---------- Rollen ----------

// GEÄNDERT: Mitarbeiter in der Demo-Rollenwahl (F-20)
export const DEMO_ROLLEN = ['admin', 'sifa', 'verantwortlicher', 'pruefer', 'mitarbeiter'] as const;
export type DemoRolle = (typeof DEMO_ROLLEN)[number];

// GEÄNDERT: 'mitarbeiter' einladbar (F-20). Verantwortliche dürfen nur 'mitarbeiter' einladen (darfEinladen).
export const EINLADBARE_ROLLEN = ['admin', 'sifa', 'verantwortlicher', 'pruefer', 'mitarbeiter'] as const;
export type EinladbareRolle = (typeof EINLADBARE_ROLLEN)[number];

// ---------- Ereignisse und Aktionen ----------

// GEÄNDERT: + zuordnung_geaendert, etikett_erneuert (F-28). Übernahmen erzeugen bewusst KEIN Ereignis (F-27).
export const EREIGNIS_TYPEN = [
  'geraet_angelegt',
  'frist_freigegeben',
  'nachweis_erfasst',
  'pruefer_zugewiesen',
  'gbu_dokument_gesetzt',
  'geraet_verschoben',
  'betriebsstatus_geaendert',
  'anlass_erfasst',
  'anlass_aufgehoben',
  'mangel_erfasst',
  'mangel_kenntnis',
  'mangel_behoben',
  'bereich_gespeichert',
  'mitglied_gespeichert',
  'zuordnung_geaendert',
  'etikett_erneuert',
] as const;
export type EreignisTyp = (typeof EREIGNIS_TYPEN)[number];

// GEÄNDERT
export const EREIGNIS_LABEL: Record<EreignisTyp, string> = {
  geraet_angelegt: 'Gerät angelegt',
  frist_freigegeben: 'Frist freigegeben',
  nachweis_erfasst: 'Nachweis erfasst',
  pruefer_zugewiesen: 'Prüfer zugewiesen',
  gbu_dokument_gesetzt: 'GBU-Verweis gesetzt',
  geraet_verschoben: 'Gerät verschoben',
  betriebsstatus_geaendert: 'Betriebsstatus geändert',
  anlass_erfasst: 'Anlass erfasst',
  anlass_aufgehoben: 'Anlass aufgehoben',
  mangel_erfasst: 'Mangel erfasst',
  mangel_kenntnis: 'Mangel zur Kenntnis genommen',
  mangel_behoben: 'Mangel behoben',
  bereich_gespeichert: 'Bereich gespeichert',
  mitglied_gespeichert: 'Mitglied gespeichert',
  zuordnung_geaendert: 'Zuordnung geändert',
  etikett_erneuert: 'Aufkleber erneuert',
};

// GEÄNDERT
export const AKTIONEN = [
  'geraet.lesen',
  'geraet.anlegen',
  'geraet.bearbeiten', // verschieben, Betriebsstatus
  'frist.freigeben', // inkl. GBU-Verweis
  'nachweis.lesen',
  'nachweis.erfassen',
  'pruefaufgaben.lesen',
  'pruefer.zuweisen',
  'anlass.erfassen', // inkl. aufheben
  'mangel.lesen',
  'mangel.erfassen', // MA: nur über mangelMelden (F-26)
  'mangel.bearbeiten', // Kenntnisnahme, Behebung
  'verlauf.lesen',
  'katalog.lesen',
  'katalog.freigeben',
  'bereich.verwalten',
  'mitglied.verwalten',
  'meine_geraete.lesen', // I3M
  'geraet.suchen', // I3M: Kurzansicht für MA
  'geraet.uebernehmen', // I3M: inkl. zurückgeben
  'geraet.zuordnen', // I3M: personenbezogen zuordnen/lösen, fremde Übernahme beenden
  'uebernahmen.lesen', // I3M: abgeschlossene Übernahmen, 90 Tage
  'etikett.verwalten', // I3M: drucken, erneuern
  'mitarbeiter.einladen', // I3M
] as const;
export type Aktion = (typeof AKTIONEN)[number];

// ---------- Geräte ----------

// GEÄNDERT: zugeordnetAn ergänzt
export interface Geraet {
  id: Id;
  organisationId: Id;
  bereichId: Id;
  bezeichnung: string;
  inventarnummer: string | null;
  geraetegruppe: string;
  kategorie: GeraeteKategorie;
  hersteller: string | null;
  typ: string | null;
  seriennummer: string | null;
  baujahr: number | null;
  einsatzort: Einsatzort | null;
  betriebsstatus: Betriebsstatus;
  angelegtAm: IsoDateTime;
  zugeordnetAn: Id | null; // Benutzer-ID eines Mitarbeiters; nur kategorie 'personenbezogen' (F-22)
}

// ---------- Nutzbarkeit (F-21) ----------

export const NUTZUNG = ['nicht_verwenden', 'unklar', 'verwendbar'] as const;
export type Nutzung = (typeof NUTZUNG)[number];

export const NUTZUNG_LABEL: Record<Nutzung, string> = {
  nicht_verwenden: 'Nicht verwenden',
  unklar: 'Prüfstatus unklar – vor Nutzung Verantwortlichen fragen',
  verwendbar: 'Verwendbar',
};

// ---------- Übernahme (F-23, F-27) ----------

export const UEBERNAHME_ENDE_ARTEN = ['rueckgabe', 'uebergabe', 'beendet_verwaltung', 'austritt'] as const;
export type UebernahmeEndeArt = (typeof UEBERNAHME_ENDE_ARTEN)[number];

export const UEBERNAHME_ENDE_LABEL: Record<UebernahmeEndeArt, string> = {
  rueckgabe: 'Zurückgegeben',
  uebergabe: 'Von anderer Person übernommen',
  beendet_verwaltung: 'Durch Verantwortlichen beendet',
  austritt: 'Zugang beendet',
};

/** Gründe, warum „Gerät übernehmen“ nicht angeboten wird; Prüfreihenfolge wie im Array. */
export const UEBERNAHME_HINWEISE = ['nicht_wechselnd', 'ausser_betrieb', 'nicht_verwenden'] as const;
export type UebernahmeHinweis = (typeof UEBERNAHME_HINWEISE)[number];

export const UEBERNAHME_HINWEIS_LABEL: Record<UebernahmeHinweis, string> = {
  nicht_wechselnd: 'Nur Geräte mit wechselndem Einsatzort werden übernommen.',
  ausser_betrieb: 'Gerät ist außer Betrieb – nicht verwenden.',
  nicht_verwenden: 'Prüfung überfällig oder vor Nutzung zu prüfen – nicht verwenden. Bitte Verantwortlichen informieren.',
};

export const UEBERNAHME_ZUSTAENDE = ['frei', 'von_mir', 'von_anderen'] as const;
export type UebernahmeZustand = (typeof UEBERNAHME_ZUSTAENDE)[number];

/** F-27: abgeschlossene Übernahmen mit Person nur so lange (ADM), danach pseudonymisiert. */
export const UEBERNAHME_AUFBEWAHRUNG_TAGE = 90;

export interface Uebernahme {
  id: Id;
  organisationId: Id;
  geraetId: Id;
  benutzerId: Id | null; // null nach Pseudonymisierung
  benutzerName: string | null; // null nach Pseudonymisierung
  von: IsoDateTime;
  bis: IsoDateTime | null; // null = offen
  endeArt: UebernahmeEndeArt | null; // null ⇔ bis === null
  beendetVon: Id | null; // Benutzer-ID der beendenden Person; null bei offen oder nach Pseudonymisierung
}

// ---------- Token und Etikett (F-24, F-25) ----------

export interface GeraetToken {
  id: Id;
  organisationId: Id;
  geraetId: Id;
  token: string; // 22 Zeichen base64url (16 Zufallsbytes)
  aktiv: boolean;
  erstelltAm: IsoDateTime;
  deaktiviertAm: IsoDateTime | null;
}

/** QR-Code als Modulraster, zeilenweise, groesse × groesse Einträge, true = dunkel; ohne Ruhezone. */
export interface QrMatrix {
  groesse: number;
  module: boolean[];
}

export const ETIKETTEN_MAX = 120;

export interface EtikettenFilter {
  geraetIds?: Id[]; // hat Vorrang vor bereichId/kategorie
  bereichId?: Id;
  kategorie?: GeraeteKategorie; // fehlt = alle Kategorien; den Default 'wechselnd' (ohne URL-Parameter) setzt die Seite /etiketten
}

/** GEÄNDERT (Review I3M): Rückgabe von holeEtiketten, vorher Etikett[]. */
export interface EtikettenErgebnis {
  etiketten: Etikett[]; // höchstens ETIKETTEN_MAX, sortiert nach Bereich, Inventarnummer, Bezeichnung
  gesamt: number; // Anzahl aller passenden Geräte vor der Kappung
  gekappt: boolean; // gesamt > ETIKETTEN_MAX → UI-Hinweis „nur die ersten 120“
}

export interface Etikett {
  geraetId: Id;
  bezeichnung: string;
  inventarnummer: string | null;
  organisationName: string;
  url: string; // absolute Token-URL
  kurzUrl: string; // ohne Schema, z. B. 'app.readyloop.de/g/AbC…'
  qr: QrMatrix;
  status: FristStatus; // Gesamtstatus (F-9) zum Druckzeitpunkt, für die Plakette
  faelligAm: IsoDate | null; // nächste Fälligkeit zum Druckzeitpunkt
  stand: IsoDate; // Druckdatum
}

// ---------- Öffentliche Ansicht und Kurzansicht (F-21, F-24) ----------

export interface OeffentlicheFrist {
  monate: number;
  quelle: FristQuelle;
  stufe: Stufe;
  fundstelle: string;
}

export interface OeffentlichePruefart {
  bezeichnung: string;
  status: StatusErgebnis; // F-9
  frist: OeffentlicheFrist | null; // null = keine freigegebene Frist → „Frist über GBU festlegen“
  letztePruefung: IsoDate | null;
  letztePruefungHerkunft: Datumsherkunft;
  letzterNachweis: { pruefdatum: IsoDate; ergebnis: PruefErgebnis; prueferName: string } | null;
}

/** Gemeinsamer Kern der öffentlichen Ansicht und der Kurzansicht; enthält keine Personennamen außer Prüfernamen. */
export interface GeraetStatusKern {
  bezeichnung: string;
  inventarnummer: string | null;
  hersteller: string | null;
  typ: string | null;
  kategorie: GeraeteKategorie;
  betriebsstatus: Betriebsstatus;
  gesamtStatus: FristStatus; // über alle Prüfarten und alle offenen Mängel (F-21)
  gesamtStatusGrund: VorNutzungGrund | null;
  naechsteFaelligkeit: IsoDate | null;
  nutzung: Nutzung;
  pruefarten: OeffentlichePruefart[]; // nach Status-Schwere (FRIST_STATUS), dann Bezeichnung
}

export interface OeffentlicheGeraeteansicht extends GeraetStatusKern {
  organisationName: string;
  stand: IsoDateTime; // Zeitpunkt der Berechnung
}

export interface GeraetKurzansicht extends GeraetStatusKern {
  geraetId: Id;
  bereichName: string;
  offeneMaengel: number; // Anzahl offen + in_bearbeitung, ohne Details
  zugeordnetMir: boolean;
  uebernahme: UebernahmeZustand | null; // null = nicht kategorie 'wechselnd'
  /** null = Übernahme möglich. FE zeigt „Gerät übernehmen“ nur bei uebernahme ∈ {frei, von_anderen} und uebernahmeHinweis === null. */
  uebernahmeHinweis: UebernahmeHinweis | null;
}

export interface MeinGeraet extends GeraetKurzansicht {
  bezug: 'zugeordnet' | 'uebernommen';
  uebernommenSeit: IsoDateTime | null; // nur bei bezug 'uebernommen'
}

export interface TokenSeite {
  token: string;
  ansicht: OeffentlicheGeraeteansicht;
  angemeldet: boolean;
  andereOrganisation: boolean; // angemeldet, Gerät gehört nicht zur aktuellen Organisation → nur öffentliche Ansicht
  kurz: GeraetKurzansicht | null; // nur Rolle mitarbeiter derselben Organisation (Aktionen)
  akteUrl: string | null; // '/geraete/{id}' bei geraet.lesen + Geltungsbereich
}

// ---------- Geräteakte (F-22, F-27) ----------

export interface GeraetNutzung {
  zugeordnet: PersonOption | null; // nur kategorie 'personenbezogen'
  uebernahme: { benutzerName: string; seit: IsoDateTime } | null; // offene Übernahme
  verlauf: Uebernahme[]; // nur uebernahmen.lesen: abgeschlossen, Person vorhanden, ≤ 90 Tage nach Ende, neueste zuerst; sonst []
  darfZuordnen: boolean; // geraet.zuordnen + Geltungsbereich
  etikett: { token: string; url: string } | null; // nur etikett.verwalten + Geltungsbereich
}

// GEÄNDERT: nutzung ergänzt
export interface GeraetDetail {
  geraet: Geraet;
  bereich: Bereich;
  einsatzort: Einsatzort;
  gesamtStatus: FristStatus;
  gesamtStatusGrund: VorNutzungGrund | null;
  naechsteFaelligkeit: IsoDate | null;
  pruefarten: PruefartAnsicht[];
  nachweise: NachweisAnsicht[];
  maengel: MangelAnsicht[];
  anlaesse: AnlassAnsicht[];
  verlauf: Ereignis[];
  nutzung: GeraetNutzung | null; // null für Rolle pruefer (F-27)
}
```

### 7.2 `src/domain/schemas.ts` (Ergänzungen, Zod 4)

```ts
import { DEMO_ROLLEN, ETIKETTEN_MAX, GERAETE_KATEGORIEN, MANGEL_SCHWEREN } from './types';
// pflichtId, optId, optText, leerZuNull, email wie §3.2/§5.2

/** Relativer Rücksprung; Prüfung auf Sicherheit zusätzlich mit sichererRuecksprung. */
const ruecksprung = optText(300);

// GEÄNDERT: + next
export const demoRolleSchema = z.object({ rolle: z.enum(DEMO_ROLLEN), next: ruecksprung });
// GEÄNDERT: + next
export const anmeldenSchema = z.object({ email, passwort: z.string().min(1, 'Passwort fehlt'), next: ruecksprung });

// Mitarbeiter
export const geraetAktionSchema = z.object({ geraetId: pflichtId }); // uebernehmen, zurueckgeben, uebernahmeBeenden
export const mangelMeldenSchema = z.object({
  geraetId: pflichtId,
  schwere: z.enum(MANGEL_SCHWEREN),
  beschreibung: z.string().trim().min(5, 'Mindestens 5 Zeichen').max(1000),
});
export const geraeteSucheSchema = z.object({ q: z.string().trim().min(2, 'Mindestens 2 Zeichen').max(80) });

// Verwaltung
export const geraetZuordnenSchema = z.object({ geraetId: pflichtId, benutzerId: optId }); // null = Zuordnung lösen
export const etikettErneuernSchema = z.object({
  geraetId: pflichtId,
  bestaetigung: z.literal('on', { error: 'Bitte bestätigen, dass der alte Aufkleber ungültig wird.' }),
});
export const mitarbeiterEinladenSchema = z.object({ email, name: z.string().trim().min(2).max(120) });

// Etiketten (searchParams, nicht FormData)
export const etikettenFilterSchema = z.object({
  geraetIds: z.array(pflichtId).max(ETIKETTEN_MAX).default([]),
  bereichId: optId,
  kategorie: z.preprocess(leerZuNull, z.enum(GERAETE_KATEGORIEN).nullable()),
});
```

Formularfelder je neuer/geänderter Action:

| Action | Felder |
|---|---|
| `setzeDemoRolle` | `rolle`, `next` |
| `anmelden` | `email`, `passwort`, `next` |
| `geraetUebernehmen` | `geraetId` |
| `geraetZurueckgeben` | `geraetId` |
| `mangelMelden` | `geraetId`, `schwere`, `beschreibung` |
| `geraetZuordnen` | `geraetId`, `benutzerId` (leer = lösen) |
| `uebernahmeBeenden` | `geraetId` |
| `etikettErneuern` | `geraetId`, `bestaetigung` (Checkbox, Wert `on`) |
| `mitarbeiterEinladen` | `email`, `name` |

### 7.3 `src/domain/rechte.ts`

```ts
// GEÄNDERT
export const RECHTE: Record<Aktion, readonly Rolle[]> = {
  'geraet.lesen': ['admin', 'sifa', 'verantwortlicher', 'pruefer'],
  'geraet.anlegen': ['admin', 'verantwortlicher'],
  'geraet.bearbeiten': ['admin', 'verantwortlicher'],
  'frist.freigeben': ['sifa', 'verantwortlicher'],
  'nachweis.lesen': ['admin', 'sifa', 'verantwortlicher', 'pruefer'],
  'nachweis.erfassen': ['verantwortlicher', 'pruefer'],
  'pruefaufgaben.lesen': ['pruefer'],
  'pruefer.zuweisen': ['admin', 'verantwortlicher'],
  'anlass.erfassen': ['sifa', 'verantwortlicher'],
  'mangel.lesen': ['admin', 'sifa', 'verantwortlicher', 'pruefer'],
  'mangel.erfassen': ['sifa', 'verantwortlicher', 'pruefer', 'mitarbeiter'],
  'mangel.bearbeiten': ['admin', 'sifa', 'verantwortlicher'],
  'verlauf.lesen': ['admin', 'sifa', 'verantwortlicher'],
  'katalog.lesen': ['admin', 'sifa', 'verantwortlicher', 'pruefer', 'mitarbeiter'],
  'katalog.freigeben': [],
  'bereich.verwalten': ['admin'],
  'mitglied.verwalten': ['admin'],
  'meine_geraete.lesen': ['mitarbeiter'],
  'geraet.suchen': ['mitarbeiter'],
  'geraet.uebernehmen': ['mitarbeiter'],
  'geraet.zuordnen': ['admin', 'verantwortlicher'],
  'uebernahmen.lesen': ['admin'],
  'etikett.verwalten': ['admin', 'verantwortlicher'],
  'mitarbeiter.einladen': ['admin', 'verantwortlicher'],
};

export function can(rolle: Rolle, aktion: Aktion): boolean; // unverändert
/** Unverändert; für mitarbeiter weiter false (keine Geräteakte). */
export function imGeltungsbereich(/* unverändert */): boolean;
export function darfVerschieben(/* unverändert */): boolean;

/** F-20: admin darf jede EINLADBARE_ROLLE einladen; verantwortlicher nur 'mitarbeiter'; sonst false. */
export function darfEinladen(rolle: Rolle, zielRolle: Rolle): boolean;

/** F-22/F-23: Gerät gehört zu „Meine Geräte“ (zugeordnet oder offene eigene Übernahme). */
export function istMeinGeraet(
  benutzerId: Id,
  geraet: Pick<Geraet, 'zugeordnetAn'>,
  offeneUebernahme: Pick<Uebernahme, 'benutzerId'> | null,
): boolean;
```

### 7.4 Domänenfunktionen I3M

```ts
// src/domain/nutzung.ts (neu)
/** F-21. Reihenfolge: Betriebsstatus ≠ in_betrieb → nicht_verwenden; ueberfaellig/vor_nutzung_pruefen → nicht_verwenden;
 *  unbekannt/gbu → unklar; bald_faellig/ok → verwendbar. */
export function nutzungAus(gesamtStatus: FristStatus, betriebsstatus: Betriebsstatus): Nutzung;

/** F-23. null = Übernahme möglich. Reihenfolge wie UEBERNAHME_HINWEISE. 'unklar' blockiert nicht. */
export function uebernahmeHinweis(
  geraet: Pick<Geraet, 'kategorie' | 'betriebsstatus'>,
  nutzung: Nutzung,
): UebernahmeHinweis | null;

export const TOKEN_MUSTER = /^[A-Za-z0-9_-]{22}$/;
export function istTokenFormat(wert: string): boolean;

/** F-27: abgeschlossen, Person vorhanden und bis ≥ jetzt − tage. */
export function imUebernahmeVerlauf(
  u: Pick<Uebernahme, 'bis' | 'benutzerId'>,
  jetzt: Date,
  tage?: number, // Default UEBERNAHME_AUFBEWAHRUNG_TAGE
): boolean;

// src/domain/status.ts – GEÄNDERT nur der Parametertyp (strukturell kompatibel zu Pick<GeraetPruefart, 'frist' | 'letztePruefung'>)
export function berechneStatus(
  pruefart: { frist: Pick<FestgelegteFrist, 'monate'> | null; letztePruefung: IsoDate | null },
  heute: IsoDate,
  vorlaufTage?: number,
): StatusErgebnis;
export function berechneStatusImKontext(
  pruefart: { frist: Pick<FestgelegteFrist, 'monate'> | null; letztePruefung: IsoDate | null },
  heute: IsoDate,
  kontext: StatusKontext,
  vorlaufTage?: number,
): StatusErgebnis;
```

### 7.5 `src/server/data.ts` (Ergänzungen und Änderungen)

```ts
import type {
  EtikettenErgebnis, EtikettenFilter, GeraetKurzansicht, Id, MeinGeraet, MitgliedAnsicht, PersonOption, TokenSeite,
} from '@/domain/types';

/** F-24. Ohne Sitzung aufrufbar, nie Redirect. null bei falschem Format (ohne Datenzugriff), unbekanntem oder
 *  deaktiviertem Token. kurz nur für Rolle mitarbeiter derselben Organisation; akteUrl bei geraet.lesen + Geltungsbereich. */
export async function holeTokenSeite(token: string): Promise<TokenSeite | null>;

/** meine_geraete.lesen (sonst notFound()). Sortierung: nutzung (nicht_verwenden, unklar, verwendbar),
 *  dann naechsteFaelligkeit aufsteigend (null zuerst), dann Bezeichnung. */
export async function listeMeineGeraete(): Promise<MeinGeraet[]>;

/** geraet.suchen (sonst notFound()). suche < 2 Zeichen → []. Höchstens 50 Treffer, nach Bezeichnung. */
export async function sucheGeraete(suche: string): Promise<GeraetKurzansicht[]>;

/** Kontext für /mangel-melden/[geraetId]: nur Rolle mitarbeiter, Gerät der eigenen Organisation; sonst null. */
export async function holeMangelMeldung(geraetId: Id): Promise<GeraetKurzansicht | null>;

/** geraet.zuordnen: aktive Mitglieder mit Rolle mitarbeiter, alphabetisch. Sonst []. */
export async function listeMitarbeiterOptionen(): Promise<PersonOption[]>;

/** mitarbeiter.einladen (sonst notFound()): Mitglieder mit Rolle mitarbeiter, aktive zuerst, dann alphabetisch. */
export async function listeMitarbeiter(): Promise<MitgliedAnsicht[]>;

/** GEÄNDERT (Review I3M). etikett.verwalten (sonst notFound()). F-25: nur Geräte im Geltungsbereich;
 *  ohne kategorie alle Kategorien (Default 'wechselnd' setzt die Seite, wenn der URL-Parameter fehlt).
 *  Sortierung Bereich, Inventarnummer, Bezeichnung. Höchstens ETIKETTEN_MAX; gesamt/gekappt zeigen die Kappung. */
export async function holeEtiketten(filter: EtikettenFilter): Promise<EtikettenErgebnis>;

// GEÄNDERT (Signatur gleich): holeGeraetDetail liefert nutzung (F-22, F-27).
```

### 7.6 `src/server/actions.ts` (Ergänzungen und Änderungen)

Alle Actions: `(prev: ActionState, formData: FormData) => Promise<ActionState>`, Sitzung + Recht + Geltungsbereich serverseitig, Validierung mit §7.2, `feldfehler` mit Formularfeldnamen.

```ts
'use server';
import type { ActionState } from '@/domain/types';

// --- Anmeldung (GEÄNDERT) ---

/** Zusätzlich next (F-20). Erfolg: redirect(sichererRuecksprung(next, standard)) mit standard
 *  pruefer → '/pruefer', mitarbeiter → '/meine-geraete', sonst '/geraete'. */
export async function setzeDemoRolle(prev: ActionState, formData: FormData): Promise<ActionState>;

/** Zusätzlich next (F-20). Erfolg: redirect(sichererRuecksprung(next, '/')). Fehlertext unverändert. */
export async function anmelden(prev: ActionState, formData: FormData): Promise<ActionState>;

// --- Mitarbeiter ---

/** geraet.uebernehmen; F-23. Erfolg: { status: 'ok', id: geraetId, meldung: 'Gerät übernommen.' |
 *  'Gerät übernommen. Die vorherige Übernahme wurde beendet.' }. */
export async function geraetUebernehmen(prev: ActionState, formData: FormData): Promise<ActionState>;

/** geraet.uebernehmen; nur eigene offene Übernahme. Erfolg: { status: 'ok', id: geraetId, meldung: 'Gerät zurückgegeben.' }. */
export async function geraetZurueckgeben(prev: ActionState, formData: FormData): Promise<ActionState>;

/** mangel.erfassen + Rolle mitarbeiter; F-26. Erfolg: { status: 'ok', id: mangelId,
 *  meldung: 'Mangel gemeldet. Er steht beim Verantwortlichen in der Mängelliste.' }. */
export async function mangelMelden(prev: ActionState, formData: FormData): Promise<ActionState>;

// --- Verwaltung ---

/** geraet.zuordnen + Geltungsbereich; F-22. Erfolg: { status: 'ok', id: geraetId, meldung: 'Zuordnung gespeichert' | 'Zuordnung gelöst' }. */
export async function geraetZuordnen(prev: ActionState, formData: FormData): Promise<ActionState>;

/** geraet.zuordnen + Geltungsbereich; F-23 (c). Erfolg: { status: 'ok', id: geraetId, meldung: 'Übernahme beendet' }. */
export async function uebernahmeBeenden(prev: ActionState, formData: FormData): Promise<ActionState>;

/** etikett.verwalten + Geltungsbereich; F-24. Erfolg: { status: 'ok', id: geraetId,
 *  meldung: 'Aufkleber erneuert. Der alte Aufkleber ist ungültig; bitte neues Etikett drucken.' }. */
export async function etikettErneuern(prev: ActionState, formData: FormData): Promise<ActionState>;

/** mitarbeiter.einladen; F-20 (Rolle fest 'mitarbeiter', keine Bereiche). Erfolg: revalidatePath('/mitarbeiter', '/admin/mitglieder'),
 *  { status: 'ok', id: mitgliedschaftId, meldung: 'Einladung an … versendet.' | '… hat bereits ein Konto; Zugang angelegt.' }.
 *  Doppelte Mitgliedschaft → feldfehler.email. */
export async function mitarbeiterEinladen(prev: ActionState, formData: FormData): Promise<ActionState>;

// GEÄNDERT (Signatur gleich): mangelErfassen lehnt Rolle mitarbeiter ab (KEIN_RECHT).
// GEÄNDERT (Signatur gleich): mitgliedAendern löst bei Deaktivierung/Rollenwechsel eines MA Zuordnungen und Übernahmen (F-20).
```

### 7.7 `src/server/repo/types.ts` und Server-Hilfen (intern, BE)

Stand nach Review-Fixes (Commits 989f2ef, 5e4e748); entspricht dem Code.

```ts
import type {
  Anlass, Ereignis, Geraet, GeraetPruefart, GeraetToken, Id, IsoDateTime, MangelSchwere, Nachweis, OeffentlicheFrist,
  QrMatrix, Uebernahme,
} from '@/domain/types';

export type KurzAuswahl =
  | { art: 'meine' }
  | { art: 'suche'; suche: string } // ≥ 2 Zeichen, höchstens 50 Treffer
  | { art: 'ids'; geraetIds: Id[] };

/** Höchstzahl Treffer der Suche (F-26/US-28). */
export const SUCHE_MAX = 50;

/**
 * GEÄNDERT (Review I3M, F-24): Öffentliche Statusdaten wie app.geraet_status_json – keine Personennamen außer
 * Prüfernamen und KEINE internen IDs. Prüfarten tragen eine laufende Nummer je Gerät (nr, ab 1);
 * Nachweise und Anlässe verweisen über pruefartNr darauf.
 */
export interface StatusRohdaten {
  geraet: Pick<Geraet, 'bezeichnung' | 'inventarnummer' | 'hersteller' | 'typ' | 'kategorie' | 'betriebsstatus'>;
  pruefarten: (Pick<GeraetPruefart, 'bezeichnung' | 'letztePruefung' | 'letztePruefungHerkunft'> & { nr: number; frist: OeffentlicheFrist | null })[];
  nachweise: (Pick<Nachweis, 'pruefdatum' | 'ergebnis' | 'erfasstAm'> & { pruefartNr: number; prueferName: string | null })[]; // nur neuester je Prüfart
  anlaesse: (Pick<Anlass, 'datum' | 'erfasstAm' | 'aufgehobenAm'> & { pruefartNr: number })[]; // nur offene
  offeneMaengel: { schwere: MangelSchwere }[];
}

/** GEÄNDERT: Kurzansicht für Mitarbeiter derselben Organisation (RPC ma_kurzansichten): Statusdaten + Geräte-ID + eigener Bezug. */
export interface KurzRohdaten extends StatusRohdaten {
  geraetId: Id;
  bereichName: string;
  zugeordnetMir: boolean;
  offeneUebernahme: { vonMir: boolean; seit: IsoDateTime | null } | null; // seit nur bei vonMir
}

/** GEÄNDERT: Öffentliche Ansicht (RPC geraet_oeffentlich). */
export interface TokenRohdaten extends StatusRohdaten {
  organisationName: string;
  /** Nur wenn die aktuelle Organisation des Aufrufers die Geräte-Organisation ist und er dort aktives Mitglied ist;
   *  sonst null (anon, fremde Organisation). */
  eigeneOrganisation: { geraetId: Id } | null;
}

/** NEU: abgeschlossene Übernahme im Verlauf (F-27), ohne beendetVon. */
export type UebernahmeVerlaufEintrag = Omit<Uebernahme, 'beendetVon'> & { beendetVon: null };

export interface Repository {
  // … I1/I2-Methoden unverändert, außer:
  /** GEÄNDERT: + token. Supabase: Token per Trigger, Parameter ignoriert. */
  legeGeraetAn(daten: { geraet: Geraet; pruefarten: GeraetPruefart[]; ereignis: Ereignis; token: GeraetToken }): Promise<void>;

  // Lesen I3M
  /** RLS: ADM, VER (Bereich). */
  listeTokens(organisationId: Id): Promise<GeraetToken[]>;
  /** GEÄNDERT (ersetzt listeUebernahmen): nur OFFENE Übernahmen. RLS: MA eigene; ADM/SIF alle der Organisation;
   *  VER Bereich; PRF keine. */
  listeOffeneUebernahmen(organisationId: Id, geraetId?: Id): Promise<Uebernahme[]>;
  /** NEU (F-27/US-32): abgeschlossene Übernahmen genau eines Geräts, nur admin, Ende innerhalb der letzten 90 Tage,
   *  Person vorhanden, neueste zuerst, ohne beendetVon. Supabase: RPC uebernahmen_verlauf (Nicht-Admin → []).
   *  Demo: ohne Rollenprüfung, der Dienst prüft uebernahmen.lesen. */
  listeUebernahmeVerlauf(geraetId: Id, jetzt: Date): Promise<UebernahmeVerlaufEintrag[]>;
  /** Nur für Rolle mitarbeiter. Supabase: RPC ma_kurzansichten. */
  listeKurzRohdaten(organisationId: Id, auswahl: KurzAuswahl, fuerBenutzerId: Id): Promise<KurzRohdaten[]>;
  /** GEÄNDERT: + fuer. Ohne Sitzung aufrufbar (fuer = null). Nur aktive Tokens. Supabase: RPC geraet_oeffentlich(p_token,
   *  p_organisation); der Benutzer ergibt sich dort aus dem JWT. eigeneOrganisation nur, wenn fuer.organisationId die
   *  Geräte-Organisation ist und der Benutzer dort aktives Mitglied ist; die Geräte-ID geht nie an anonyme oder fremde Aufrufer. */
  holeTokenRohdaten(token: string, fuer: { benutzerId: Id; organisationId: Id } | null): Promise<TokenRohdaten | null>;

  // Schreiben I3M (je Aufruf atomar)
  /** vorherige: fremde offene Übernahme mit gesetztem bis/endeArt 'uebergabe'. Supabase: RPC uebernahme_starten. */
  starteUebernahme(daten: { uebernahme: Uebernahme; vorherige: Uebernahme | null }): Promise<void>;
  /** uebernahme mit gesetztem bis/endeArt/beendetVon. Supabase: RPC uebernahme_beenden. */
  beendeUebernahme(daten: { uebernahme: Uebernahme }): Promise<void>;
  setzeZuordnung(daten: { geraetId: Id; benutzerId: Id | null; ereignis: Ereignis }): Promise<void>;
  /** Supabase: RPC etikett_erneuern (erzeugt den Token selbst; neu.token wird durch den Rückgabewert ersetzt). */
  erneuereToken(daten: { geraetId: Id; neu: GeraetToken; ereignis: Ereignis }): Promise<string>;
  /** F-20 Austritt. Demo: Zuordnungen lösen, offene Übernahmen 'austritt'. Supabase: No-op (Trigger). */
  loeseNutzungen(daten: { organisationId: Id; benutzerId: Id; jetzt: IsoDateTime }): Promise<void>;
}

// src/server/token.ts (neu)
export function neuerToken(): string; // randomBytes(16).toString('base64url') → 22 Zeichen
export function tokenUrl(token: string): string; // `${NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/g/${token}`
export function kurzUrl(url: string): string; // ohne 'https://' bzw. 'http://'

// src/server/qr.ts (neu)
export function qrMatrix(text: string): QrMatrix; // npm 'qrcode': QRCode.create(text, { errorCorrectionLevel: 'M' })

// src/server/pfade.ts – unverändert, wird für next und zurueck verwendet
export function sichererRuecksprung(wert: unknown, standard: string): string;
```

### 7.8 Routen I3M

| Route | Besitzer | Zugriff |
|---|---|---|
| `/g/[token]` | FE (FE-12) | öffentlich, ohne Login; Kopfzeilen nach F-24 (Middleware, BE-18) |
| `/meine-geraete` | FE (FE-13) | `meine_geraete.lesen` |
| `/meine-geraete/suchen` | FE (FE-13) | `geraet.suchen` |
| `/mangel-melden/[geraetId]` | FE (FE-13) | Rolle `mitarbeiter` + `holeMangelMeldung` ≠ null |
| `/etiketten` | FE (FE-15) | `etikett.verwalten` |
| `/mitarbeiter` | FE (FE-16) | `mitarbeiter.einladen` |
| `/login?next=` | FE (FE-11) | öffentlich; `next` nur relativ |
| `/` | FE (FE-11) | MA → `/meine-geraete` |

## 8. Spätere Inkremente (Pakete grob)

**I3 Erinnerungen** – BE: Fälligkeitsjob (`pg_cron` wie in I3M, oder Vercel Cron), Staffel 90/60/30 je Bereich, Eskalationsregeln, Resend-Adapter, Versandprotokoll, idempotent je (Prüfart, Stufe, Fälligkeit). FE: Einstellungen je Bereich, Protokollansicht.

**I4 Export und Excel-Import** – BE: Stichtagsexport Excel/PDF/ZIP mit Frist, Quelle, Stufe, Fundstelle, Herkunft; Import-Parser mit Spaltenzuordnung, Dublettenprüfung, Validierung; Aufbewahrungs-Nachfrist; Ausmustern löst Zuordnung und beendet Übernahme (Q-46). FE: Export-Dialog, Import-Assistent mit Vorschau und Bestätigung.

**I5 NFC, PWA, Offline** – BE: NFC-Tags mit derselben Token-URL wie QR. FE: PWA-Manifest, Service Worker (Offline-Lesen „Meine Geräte“ und zuletzt geöffnete QR-Seiten), Foto zum Mangel.

**I6 KI-Import und Prüfdienstleister** – BE: KI-Adapter-Interface + Claude-Implementierung serverseitig, Namensentfernung vor Aufruf, Ergebnis nur als Vorschlag; Sammelupload; Import Prüfgeräte-CSV/XML über Inventarnummer. FE: Upload, Prüf- und Bestätigungsmaske.

**I7 Should/Could-Rest** – nach Pilotfeedback priorisieren.

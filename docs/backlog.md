# Backlog Readyloop

Stand 19.11.2026 · Anforderungen: `docs/requirements.md` (IDs R-xx, P-xx, F-x, US-xx, Q-x)

## 1. Inkremente

| Inkr. | Inhalt | Anforderungen | Ergebnis |
|---|---|---|---|
| **I1** | Datenmodell + RLS, Domäne (Regel-Engine, Status, Rechte), Katalog-Entwurf, Büro-Web-App, Prüfer-Ansicht minimal, Demo-Modus | R-01, R-02 (Teil), R-04, R-05, R-08 (Teil), R-09 (Teil), R-16 (Teil), R-18 (Teil), R-19, R-22 (Teil), R-23, R-24 (Teil), R-28 (Teil), R-31 (Teil), R-40 (Entwurf), P-01–P-06 | lauffähige Demo ohne Datenbank, `npm run build` grün |
| I2 | Supabase-Betrieb: Supabase-Repository, Login E-Mail/Passwort, Verwaltung Bereiche/Mitglieder, Prüfer einladen/zuweisen, Mängel, Frist nach Ergebnis, Anlassprüfung, außer Betrieb, Gerät verschieben, Prüferqualifikation, GBU-Dokument, pgTAP-Tests für RLS | R-06, R-07, R-08, R-10, R-11, R-12, R-18, R-22, R-24, R-28 | Pilotfähiges Büro mit echter DB |
| I3 | E-Mail-Erinnerungen (Resend) 90/60/30, Eskalation VER → SIF → GF, Versandprotokoll | R-16, R-17 | |
| I4 | Export (Excel, PDF, ZIP zum Stichtag), Excel/CSV-Import mit Vorschau, Aufbewahrungs-Nachfrist | R-25, R-27, R-02 | |
| I5 | Mitarbeiter-PWA, QR/NFC-Token, öffentliche Statusseite, Etiketten/Prüfplakette drucken, Offline-Lesen | R-03, R-09, R-20, R-21, R-38, R-45 | Gate G-4 vorher |
| I6 | KI-Import (Excel/PDF/Typenschild) hinter Adapter, Sammelupload Prüfdienstleister, Import Prüfgeräte-Dateien | R-28, R-29, R-43 | |
| I7 | Should/Could-Rest: überwachungsbedürftige Anlagen, ISO-Berichte, Kontrollen, Elektro-Messwerte, API, Mehrsprachigkeit | R-13, R-14, R-15, R-26, R-33, R-41 | |

Pilot-Gates G-1 bis G-4 siehe `docs/requirements.md` §4.

## 2. Inkrement 1 – Pakete

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

## 4. Spätere Inkremente (Pakete grob)

**I2 Supabase-Betrieb** – BE: Supabase-Repository hinter `Repository`-Interface; Login E-Mail/Passwort (`@supabase/ssr`); Organisationswahl für Prüfer mit mehreren Mitgliedschaften; pgTAP-Tests der RLS gegen lokale Supabase; Mängel-Tabelle + Dienste; Fristneufestlegung nach Ergebnis (R-06); Anlass (R-07); Betriebsstatus + „vor Nutzung prüfen“ (R-08); Gerät verschieben mit Ereignis; Prüferqualifikation (R-10); GBU-Dokument (R-11); Demo-Schutz in Produktion (Q-9). FE: Login-Formular, Admin-Seiten Bereiche/Mitglieder, Prüfer einladen/zuweisen, Mängelliste und -formular, Anlass erfassen, Webfonts lokal (Q-10).

**I3 Erinnerungen** – BE: Fälligkeitsjob (Supabase Cron oder Vercel Cron), Staffel 90/60/30 je Bereich, Eskalationsregeln, Resend-Adapter, Versandprotokoll, idempotent je (Prüfart, Stufe, Fälligkeit). FE: Einstellungen je Bereich, Protokollansicht.

**I4 Export und Excel-Import** – BE: Stichtagsexport Excel/PDF/ZIP mit Frist, Quelle, Stufe, Fundstelle, Herkunft; Import-Parser mit Spaltenzuordnung, Dublettenprüfung, Validierung; Aufbewahrungs-Nachfrist. FE: Export-Dialog, Import-Assistent mit Vorschau und Bestätigung.

**I5 Mitarbeiter-PWA, QR/NFC** – BE: Geräte-Token, öffentliche Statusseite ohne Login (nur Gerät, Status, letzte Prüfung, Prüfername), Übernahme, Mängelmeldung, Etikett-PDF. FE: PWA-Manifest, Service Worker (Offline-Lesen), Scan, „nicht verwenden“-Ansicht, Etikettendruck. Vorher Gate G-4.

**I6 KI-Import und Prüfdienstleister** – BE: KI-Adapter-Interface + Claude-Implementierung serverseitig, Namensentfernung vor Aufruf, Ergebnis nur als Vorschlag; Sammelupload; Import Prüfgeräte-CSV/XML über Inventarnummer. FE: Upload, Prüf- und Bestätigungsmaske.

**I7 Should/Could-Rest** – nach Pilotfeedback priorisieren.

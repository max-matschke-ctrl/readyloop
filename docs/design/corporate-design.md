# Readyloop – Corporate Design (Stand 20.11.2026)

Verbindliche Grundlage für designer und frontend-dev. Änderungen an diesen Grundwerten nur mit Freigabe von Max.

## Marke
- Produktname: Readyloop. Früherer Arbeitsname „Dueline“ wird nicht mehr verwendet.
- Zielgruppe: Geschäftsführung, Sifa, Leitung Instandhaltung im Mittelstand (20–500 Beschäftigte). Käufer sind erfahren und eher älter.
- Haltung: sachlich, präzise, belastbar. Ein Werkzeug für Verantwortung und Nachweise, kein verspieltes Startup-Produkt.
- Sprache in der UI: Deutsch, kurze Sätze, Fachbegriffe ohne Erklärung (BetrSichV, GBU, befähigte Person).

## Erkennungszeichen
**Prüfplakette.** Rundes Badge, angelehnt an echte Prüfplaketten an Geräten: Ring mit 12 Monatssegmenten, Jahr in der Mitte, Statusfarbe. Sie ist das zentrale Markenelement und darf nicht verwässert werden. Umsetzung heute: `src/components/Pruefplakette.tsx` (SVG).

## Farben (aktuell in `src/app/globals.css`)
| Token | Hex | Bedeutung |
|---|---|---|
| steel | #44546a | Grundton, Navigation, Primäraktionen |
| steel-hell | #dfe3e9 | Flächen, Trennlinien |
| moss | #5b7f3a | ok / gültig / bestanden |
| ochre | #c8902e | bald fällig, Warnung |
| ochre-dunkel | #7a5310 | Text auf Ochre-Flächen |
| brick | #a6452f | überfällig, Mangel, nicht verwenden |
| paper | #f5f3ee | Hintergrund |
| ink | #1e2328 | Text |

Regeln: Statusfarben nur für Status, nie dekorativ. Status immer zusätzlich als Text und Symbol. Kontrast WCAG AA.

## Typografie
- Space Grotesk: Überschriften, Kennzahlen, Plakette.
- IBM Plex Sans: Fließtext, Formulare, Tabellen.
- IBM Plex Mono: Inventarnummern, Fundstellen, Daten.
- Offen: Schriften werden noch nicht geladen (nur CSS-Stapel, Q-10).

## Offene Punkte für den Design-Agenten
- Dunkles Theme ja/nein
- Logo/Wortmarke fehlt
- Spacing-, Radius- und Schatten-Skala fehlen
- Komponenten-Richtlinien (Tabellen, Formulare, Leere Zustände, Toasts) fehlen

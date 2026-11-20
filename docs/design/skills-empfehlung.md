# Skill- und Paketempfehlung für frontend-dev (Stand 20.11.2026)

## 1. Skills

| Skill | Wo | Laden bei | Wofür |
|---|---|---|---|
| **frontend-design** | `.claude/skills/frontend-design/SKILL.md` | **jedem** UI-Paket (P1–P7) | Haltung und Selbstkritik. Arbeitsweise: planen, gegen den Brief prüfen, bauen, kritisch ansehen. |
| **dataviz** | Anthropic-Skill (in Claude-Sitzungen verfügbar) | P3a (Zählerleiste), P3b (Jahresring) | Regeln für Kennzahlen-Kacheln, Legenden, Farbabstufungen und zugängliche Alternativen zu Grafiken. Die Palette des Skills **nicht** übernehmen, unsere Tokens gelten. |
| webapp-testing | Anthropic-Skill-Repo (Playwright), nur falls installiert | nach jedem Paket, optional | Screenshots in 360/768/1280 px, Prüfung von Tastaturfokus und Layout. Braucht Playwright und einen Browser. Wenn nicht verfügbar, prüft test-runner wie bisher. |
| skill-creator | Anthropic-Skill | nach P2, optional | Projekt-Skill `readyloop-ui` aus §2–§6 von `designsystem.md` bauen, damit frontend-dev Tokens und Regeln kompakt lädt statt das ganze Dokument. |

Nicht laden: `theme-factory`, `canvas-design`, `algorithmic-art`, `web-artifacts-builder` und `brand-guidelines`. Sie bringen fremde Paletten oder Markenwerte mit und erzeugen Artefakte statt App-Code.

### 1.1 Wie `frontend-design` und das Designsystem zusammenspielen
Der Skill sagt selbst: Wo der Brief eine Richtung festlegt, gilt der Brief. Unser Brief besteht aus `corporate-design.md` und `designsystem.md`. Konkret:

| Hinweis im Skill | Bei Readyloop |
|---|---|
| Mut an **einer** Stelle, Rest ruhig | Die Stelle ist die Plakette (§5). Keine zweite Effektquelle. |
| Keine Versalien-Labels und keine Überzeilen über jeder Überschrift | Gilt. `uppercase tracking-wide` in `PruefartKarte` entfällt (P4b). |
| Mono für kleine Datenlabels gilt als Standard-Look | **Ausnahme laut CD:** Plex Mono für *Werte* (Inventarnummer, Datum, Fundstelle). Nie für Labels. |
| Metazeilen mit Mittelpunkten („A · B · C“) | Sparsam. Wo es Stammdaten sind, `dl` oder getrennte Zeilen nutzen. In einer Tabellenzeile unter dem Namen ist höchstens ein Mittelpunkt erlaubt. |
| „→“ hinter Link-Texten | Nicht verwenden. Zurück-Links werden durch den Pfad (Breadcrumb) ersetzt. |
| SaaS-Kartenreihe | Vermeiden: Zählerleiste als eine Fläche, Prüfartkarten nur, weil jede eine echte Akte ist. |
| Warme Creme-Fläche als Standard-Look | `paper` ist CD-Grundwert und bleibt. Kein Serif- oder Terrakotta-Paar dazu, daher kein Problem. |
| Eine orchestrierte Bewegung statt vieler | Nur die Live-Plakette auf `/login` (§4.4). |
| Qualitätsboden: responsiv, Fokus, reduzierte Bewegung, Kontrast | Gilt als Abnahmekriterium jedes Pakets (`umsetzung.md` §0). |
| Texte: Verb plus Objekt, Fehler ohne Entschuldigung, leere Seite als Einladung | Gilt, siehe §6.3, §6.11 und §6.12 im Designsystem. |

## 2. npm-Pakete

| Paket | Status | Zweck |
|---|---|---|
| `@fontsource-variable/space-grotesk` | **einbauen (P1)** | Display-Schrift, variable Achse wght 300–700, OFL-1.1 |
| `@fontsource/ibm-plex-sans` | **einbauen (P1)** | Textschrift, nur 400/500/600 importieren, OFL-1.1 |
| `@fontsource/ibm-plex-mono` | **einbauen (P1)** | Daten, nur 400/500 importieren, OFL-1.1 |
| `lucide-react` | optional, nach OK Max (Designsystem §9.5) | UI-Icons, nur benannte Einzelimporte |
| shadcn/ui, Radix, Headless UI, framer-motion, Chart-Bibliotheken | **nicht** | Nativ reicht: `<details>`, `<dialog>`, CSS-Übergänge, eigenes SVG für Plakette und Jahresring. Jede Bibliothek würde einen fremden Look mitbringen. |

Quellen: Fontsource-Paketseiten auf [socket.dev](https://socket.dev/npm/package/@fontsource-variable/space-grotesk) (Space Grotesk Variable: Familie „Space Grotesk Variable“, Achse wght, OFL-1.1), [IBM Plex Sans](https://socket.dev/npm/package/@fontsource/ibm-plex-sans) (Gewichte 100–700, Importe `@fontsource/ibm-plex-sans/400.css`, OFL-1.1) und [IBM Plex Mono](https://socket.dev/npm/package/@fontsource/ibm-plex-mono) (Gewichte 100–700, `…/400.css`, OFL-1.1).
Ein Paket `@fontsource-variable/ibm-plex-sans` ließ sich nicht sicher bestätigen. Die Familie hat zwar variable Achsen wght/wdth ([Fontsource About](https://fontsource.org/fonts/ibm-plex-sans/about)), wir bleiben aber bei den statischen Gewichten.

## 3. Q-10: Schriften ohne Netz beim Build – gelöst

**Antwort: Ja, die Fontsource-Pakete lösen Q-10.**
- Die Schriftdateien (woff2) und das `@font-face`-CSS liegen nach `npm ci` in `node_modules`. Netz braucht nur die Installation, wie bei jeder anderen Abhängigkeit. Der Build selbst braucht kein Netz.
- `import '@fontsource/…/400.css'` in `src/app/layout.tsx` ist ein globaler CSS-Import im Root-Layout. Next bündelt das CSS und kopiert die woff2-Dateien in die statischen Assets. Die Schriften kommen damit von der eigenen Domain, ohne Anfrage an Google (auch datenschutzrechtlich sauber, keine IP-Übertragung an Dritte).
- `next/font/google` wäre **keine** Lösung, weil es CSS und Schriftdateien **beim Build herunterlädt** ([Next.js Font-Referenz](https://nextjs.org/docs/pages/api-reference/components/font)).
- `next/font/local` ginge ebenfalls, `src` ist aber relativ zur aufrufenden Datei ([Next.js Fonts](https://nextjs.org/docs/15/app/getting-started/fonts)). Pfade in `node_modules/…/files/*.woff2` hängen an Dateinamen innerhalb der Pakete und brechen bei Updates leicht. Deshalb Variante „CSS-Import“. `next/font/local` nur dann, wenn messbar Layout-Verschiebung stört.
- Lizenz: alle OFL-1.1. Die Lizenzdatei liegt im Paket, Weitergabe als Webfont ist erlaubt.
- Browser laden über `unicode-range` nur die benötigten Teilmengen (latin, latin-ext). Kyrillisch und andere Teilmengen werden nicht übertragen.

Einbau (für frontend-dev in P1):
```ts
// src/app/layout.tsx – vor './globals.css'
import '@fontsource-variable/space-grotesk';
import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/ibm-plex-sans/600.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
```
```css
/* globals.css @theme */
--font-display: "Space Grotesk Variable", "Space Grotesk", system-ui, sans-serif;
--font-sans: "IBM Plex Sans", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
--font-mono: "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
```

**Folgeaufgabe für requirements-engineer:** Q-10 in `docs/requirements.md` auf „gelöst über Fontsource-Pakete (CSS-Import), kein `next/font/google`“ setzen. designer darf diese Datei nicht ändern.

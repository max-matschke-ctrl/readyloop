# Readyloop – Arbeitsweise mit dem Agententeam

Readyloop: B2B-Software, damit Mittelständler keine Prüffrist für Arbeitsmittel verpassen und Nachweise vorzeigen können.
Fachlicher Kontext: `docs/context/projektstand.md`. Anforderungen: `docs/requirements.md`. Backlog: `docs/backlog.md`.

## Team (`.claude/agents/`)
| Agent | Aufgabe | Tools |
|---|---|---|
| researcher | Recht, Prüfpflichten, Wettbewerb → `docs/research/` | Read, Grep, Glob, WebSearch, WebFetch, Write |
| requirements-engineer | Anforderungen, Rechte-Matrix, Backlog → `docs/` | Read, Grep, Glob, Write, Edit |
| backend-dev | Schema, RLS, Domäne, Server, API | Read, Write, Edit, Bash, Grep, Glob |
| designer | Designsystem, UI-Recherche, Skill-Empfehlung → `docs/design/` | Read, Grep, Glob, WebSearch, WebFetch, Write |
| frontend-dev | Seiten, Komponenten, Styles nach Designsystem (Skill: frontend-design) | Read, Write, Edit, Bash, Grep, Glob |
| test-runner | Typecheck, Lint, Tests, Build (nur lesend) | Read, Grep, Glob, Bash |
| code-reviewer | Review (nur lesend) | Read, Grep, Glob, Bash |

## Ablauf je Runde
1. researcher, wenn fachliche Fragen offen sind.
2. requirements-engineer aktualisiert `docs/requirements.md` und `docs/backlog.md`.
3. designer legt bei UI-Arbeit Designsystem und Pakete in `docs/design/` fest.
4. backend-dev und frontend-dev arbeiten Pakete ab; parallel nur, wenn die Pakete keine gemeinsamen Dateien haben.
5. test-runner → Fehler zurück an den zuständigen Entwickler.
6. code-reviewer → blockierende Befunde zurück an den Entwickler.
7. Commit erst, wenn test-runner grün und keine blockierenden Befunde offen sind.

## Nicht verhandelbar
- Fristen nur aus freigegebenen Katalogeinträgen. Ohne Eintrag: „Frist über GBU festlegen“. Nie raten.
- Jede Frist zeigt Quelle und Stufe (A–D).
- RLS auf allen Tabellen mit Betriebsbezug.
- KI nur serverseitig hinter Adapter, ohne Personennamen.
- Katalogeinträge im Repo sind Entwürfe, bis ein Sicherheitsingenieur sie freigibt.

- UI folgt `docs/design/corporate-design.md`; die Prüfplakette ist das Erkennungszeichen.

## Befehle
`npm run dev` · `npm run typecheck` · `npm run lint` · `npm test` · `npm run build`

# Readyloop – Arbeitsweise mit dem Agententeam

Readyloop: B2B-Software, damit Mittelständler keine Prüffrist für Arbeitsmittel verpassen und Nachweise vorzeigen können.
Fachlicher Kontext: `docs/context/projektstand.md`. Anforderungen: `docs/requirements.md`. Backlog: `docs/backlog.md`.

## Team (`.claude/agents/`)
| Agent | Aufgabe | Tools |
|---|---|---|
| researcher | Recht, Prüfpflichten, Wettbewerb → `docs/research/` | Read, Grep, Glob, WebSearch, WebFetch, Write |
| requirements-engineer | Anforderungen, Rechte-Matrix, Backlog → `docs/` | Read, Grep, Glob, Write, Edit |
| backend-dev | Schema, RLS, Domäne, Server, API | Read, Write, Edit, Bash, Grep, Glob |
| frontend-dev | Seiten, Komponenten, Styles | Read, Write, Edit, Bash, Grep, Glob |
| test-runner | Typecheck, Lint, Tests, Build (nur lesend) | Read, Grep, Glob, Bash |
| code-reviewer | Review (nur lesend) | Read, Grep, Glob, Bash |

## Ablauf je Runde
1. researcher, wenn fachliche Fragen offen sind.
2. requirements-engineer aktualisiert `docs/requirements.md` und `docs/backlog.md`.
3. backend-dev und frontend-dev arbeiten Pakete ab; parallel nur, wenn die Pakete keine gemeinsamen Dateien haben.
4. test-runner → Fehler zurück an den zuständigen Entwickler.
5. code-reviewer → blockierende Befunde zurück an den Entwickler.
6. Commit erst, wenn test-runner grün und keine blockierenden Befunde offen sind.

## Nicht verhandelbar
- Fristen nur aus freigegebenen Katalogeinträgen. Ohne Eintrag: „Frist über GBU festlegen“. Nie raten.
- Jede Frist zeigt Quelle und Stufe (A–D).
- RLS auf allen Tabellen mit Betriebsbezug.
- KI nur serverseitig hinter Adapter, ohne Personennamen.
- Katalogeinträge im Repo sind Entwürfe, bis ein Sicherheitsingenieur sie freigibt.

## Befehle
`npm run dev` · `npm run typecheck` · `npm run lint` · `npm test` · `npm run build`

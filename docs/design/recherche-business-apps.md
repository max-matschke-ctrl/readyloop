# Recherche: Gestaltung moderner Business-Apps (Stand 20.11.2026)

Zweck: Grundlage für `designsystem.md`. Für jedes Muster steht dabei, ob es zu Readyloop passt. Readyloop ist eine Compliance-Software, die erfahrene, eher ältere Nutzer selten, aber unter Verantwortung bedienen. Ein Teil der Nutzung findet mobil in der Werkhalle statt (Prüfer).

Hinweis: Hier sind nur Prinzipien beschrieben. Keine Marke, kein Logo und kein Screen wird nachgebaut.

## 1. Navigation

| Quelle | Befund | Passt zu Readyloop? |
|---|---|---|
| Atlassian, neue Navigation 2025 ([Ankündigung](https://community.atlassian.com/forums/Announcement-articles/Atlassian-s-new-navigation-is-here/ba-p/2958732)) | Die obere Leiste ist auf Suche und „Erstellen“ reduziert, Hilfsfunktionen sind gebündelt. Die linke Seitenleiste bleibt sichtbar und lässt sich einklappen, weil Produkte mit vielen Bereichen so viele Ziele haben. | Zum Teil. Readyloop hat nur 3–4 Hauptziele (Geräte, Mängel, Prüfaufgaben, Verwaltung). Eine Seitenleiste wäre leerer Rahmen. Wir übernehmen die **reduzierte obere Leiste** mit gebündeltem Nutzer- und Betriebsmenü. |
| Linear, Design-Refresh ([Blog](https://linear.app/now/behind-the-latest-design-refresh)) | Die Navigation tritt zurück, damit der Inhalt Vorrang hat: „Don't compete for attention you haven't earned.“ Rahmen und Trennlinien sind reduziert, nach dem Prinzip „Structure should be felt not seen“. Hohe Dichte bleibt, Icons werden kleiner und seltener. | Ja. Die Haltung „Struktur spürbar, nicht sichtbar“ passt zu „sachlich, präzise“. Das Grau-in-Grau von Linear übernehmen wir nicht, wir haben eigene Statusfarben. |

## 2. Tabellen mit vielen Daten

| Quelle | Befund | Passt? |
|---|---|---|
| IBM Carbon, Data table ([Style](https://carbondesignsystem.com/components/data-table/style)) | Feste Zeilenhöhen: 24/32/40/48/64 px. Der Spaltenkopf hat immer dieselbe Höhe wie die Zeilen. Spaltenköpfe 14 px halbfett auf leicht abgesetzter Fläche. | Ja. Carbon ist das Systemumfeld von IBM Plex. Wir legen **eine** Dichte fest: 48 px, weil die Plakette mit 40 px hineinpassen muss. Keine Umschaltung. |
| saasui.design, Table patterns ([Artikel](https://www.saasui.design/blog/saas-data-table-ui-patterns)) | Erkennungsspalte zuerst, Zahlen rechtsbündig. Nebenfelder gehören in Details, nicht in 20 gleich breite Spalten: „A table with 20 equal columns is a spreadsheet“. Spaltenköpfe und Filter bleiben beim Scrollen stehen. Zuletzt genutzte Ansicht merken. Leere Tabelle als Einstieg mit einer klaren Aktion. Skelettzeilen statt Spinner. | Ja: Spaltenhierarchie, Sticky-Kopf, Leerzustand. Gespeicherte Ansichten und Massenaktionen erst später, im MVP fehlt der Anwendungsfall. |

## 3. Status

| Quelle | Befund | Passt? |
|---|---|---|
| GOV.UK Design System, Tag ([Komponente](https://design-system.service.gov.uk/components/tag/)) | So wenige Status wie möglich. Farbe nie als einziges Mittel. Tags sind nie Links oder Buttons und tragen Adjektive statt Verben. Helle Fläche, dunkle Schrift, damit sie nicht wie Buttons wirken. Satzschreibung statt Versalien. | Ja, vollständig. Bestätigt die CD-Regel „Status nie nur über Farbe“. Folge: Statusmarken bleiben **nicht klickbar**, Filter-Chips sehen deutlich anders aus. |
| Nielsen Norman Group, Indicators ([Artikel](https://nngroup.com/articles/indicators-validations-notifications)) | Indikatoren stehen nah am beschriebenen Element, erscheinen nur bei Bedarf und arbeiten passiv. Zu viele Indikatoren erzeugen Lärm. Alternativen zu Farbe: Symbol, Typografie, Größe. | Ja. Daraus folgt: keine Statusmarke für „in Ordnung“ in jeder Zeile der Prüfartkarte, wenn die Plakette es schon zeigt. Hinweise wie Mängel und Anlass nur, wenn vorhanden. |

## 4. Leere Zustände

| Quelle | Befund | Passt? |
|---|---|---|
| IBM Carbon, Empty states ([Pattern](https://carbondesignsystem.com/patterns/empty-states-pattern/)) | Drei Arten: keine Daten (Erstnutzung), Ergebnis einer Nutzeraktion (z. B. Filter ohne Treffer) und Fehler (Rechte, Konfiguration). Bausteine: optionales Bild, kurzer Titel, Text mit nächstem Schritt, eine Hauptaktion. Keine Sackgassen. Dekorative Bilder mit leerem `alt`. | Ja. Unser „Bild“ ist immer die **leere Plakette** (gestrichelter Ring) und keine Illustration. Die drei Arten bekommen feste Texte (siehe Designsystem §6.9). |

## 5. Formulare

| Quelle | Befund | Passt? |
|---|---|---|
| GOV.UK, Question pages ([Pattern](https://design-system.service.gov.uk/patterns/question-pages)) und „One thing per page“ ([Blog](https://designnotes.blog.gov.uk/2015/07/03/one-thing-per-page/)) | Wenige Fragen je Seite, Beschriftung über dem Feld, Fehlerübersicht oben mit Links zu den Feldern, optionale Felder als „(optional)“ markiert statt Pflichtfelder mit Sternchen. | Zum Teil. „Eine Frage je Seite“ wäre für erfahrene Büronutzer zu langsam. Wir übernehmen **Fehlerübersicht, Beschriftung über dem Feld und „(optional)“**, Formulare bleiben einseitig und einspaltig. |

## 6. Mobil für den Außendienst

| Quelle | Befund | Passt? |
|---|---|---|
| App Fabric, Field workforce UX ([Blog](https://app-fabric.pages.dev/blog/2024-03-field-workforce-ux)) | Tippflächen mindestens 48×48, mit dicken Handschuhen eher 56×56. Tippen statt Wischen, keine kleinen Schalter oder kompakten Dropdowns. Hoher Kontrast für Sonnenlicht. Status nie nur über Farbe. Offline: Eingaben lokal halten und anzeigen, dass sie in der Warteschlange sind. | Ja für den Prüferzugang: 48 px Mindesthöhe, Hauptaktion 56 px, keine Wischgesten. Offline ist nicht im MVP. Der Upload-Zustand muss aber klar sichtbar sein (Datei gewählt, wird hochgeladen, gespeichert). |

## 7. Kennzahlen und Dashboards
Gängiges Muster: eine Reihe gleicher Karten mit großer Zahl, kleinem Label und farbigem Rand. Das ist die „SaaS-Kartenreihe“, die der Skill `frontend-design` ausdrücklich als Standard-Look nennt. Readyloop braucht kein Dashboard, sondern eine **Arbeitsliste mit Zählern als Filter**. Entscheidung: Die Zähler sitzen als eine zusammenhängende Leiste über der Liste. Dazu kommt optional der Jahresring als einziges grafisches Element (Plakette, siehe Designsystem §5.3).

## 8. Was wir bewusst nicht übernehmen
- **Dunkles Theme als Standard oder Umschalter:** Die Nutzer arbeiten im Büro, drucken Nachweise und sind eher älter. Prüfer stehen in heller Halle oder draußen, ein helles Schema mit hohem Kontrast ist dort besser. Ein Dark Mode verdoppelt die Kontrastprüfung jedes Statustons. Entscheidung: **kein dunkles Theme im MVP** (Vorschlag an Max in `designsystem.md`).
- **Befehlspalette (Cmd+K), Tastaturkürzel als Hauptweg:** Das passt zu Power-Usern in Tools für den Alltag. Readyloop wird wöchentlich bis monatlich genutzt. Höchstens später als Ergänzung.
- **Gradienten, Glas-Effekte, Illustrationen und animierte Einstiege:** Sie widersprechen „sachlich, belastbar“.
- **Gespeicherte Ansichten, Massenbearbeitung, Spaltenkonfiguration:** Im MVP gibt es dafür keinen Bedarf, sie kommen später, wenn Bestände über ~300 Geräte gehen.

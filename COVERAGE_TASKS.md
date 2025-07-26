# Test Coverage Aufgabenliste

## Übersicht

Die Coverage-Reports zeigen, dass viele zentrale Bereiche noch keine oder kaum Testabdeckung haben. Ziel: Schrittweise die wichtigsten Lücken schließen, beginnend mit Business-Logik, API-Routen und kritischen UI-Komponenten.

## Aufgaben

### 1. API-Routen / Backend-Logik

- [ ] Tests für alle Routen in `/app/api/recipes/`, `/app/api/products/`, `/app/api/ingredients/` schreiben
- [ ] Tests für `/lib/api/recipes-lookup.ts`, `/lib/api/products-lookup.ts` ergänzen
- [ ] Tests für `/lib/db/users.ts` und `/lib/db/products.ts` ergänzen

### 2. Seiten & Layouts

- [ ] Tests für Seiten in `/app/` (z.B. `page.tsx`, `layout.tsx`, `providers.tsx`)
- [ ] Tests für User-Flows in `/app/(user)/` und `/app/account/`

### 3. UI-Komponenten

- [ ] Tests für alle Komponenten in `/components/` mit 0% Coverage
- [ ] Tests für komplexe Komponenten wie Formulare, Tabellen, Scanner

### 4. Validierungen & Utils

- [ ] Tests für alle Zod-Validierungen in `/lib/validations/`
- [ ] Tests für Utility-Funktionen in `/lib/utils/`, `/utils/`

### 5. Sonstige

- [ ] Tests für Middleware (`middleware.ts`)
- [ ] Tests für Konfigurationsdateien, falls sinnvoll

## Startpunkt

**Empfohlenes Vorgehen:**

1. Beginne mit den API-Routen (`/app/api/recipes/`, `/app/api/products/`, ...), da diese meist Kernlogik enthalten und von anderen Komponenten genutzt werden.
2. Danach Seiten und Layouts, die für die User-Flows relevant sind.
3. Anschließend UI-Komponenten mit 0% Coverage.

---

> Fortschritt regelmäßig im Coverage-Report prüfen und Aufgaben abhaken!

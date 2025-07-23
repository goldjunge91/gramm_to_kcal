# Copilot Instructions for gramm_to_kcal

## 🏗️ Architektur & Struktur

- **Framework:** Next.js 15 (App Router)
- **Datenbank:** PostgreSQL mit Drizzle ORM
- **Auth:** better-auth (JWT, DrizzleAdapter)
- **UI:** Radix UI, Tailwind CSS, shadcn/ui
- **State:** TanStack React Query, URL-basierte State
- **Tests:** Vitest (Unit, **tests**), Playwright (E2E, **e2e**)
- **Package Manager:** pnpm **(ausschließlich!)**

### Wichtige Verzeichnisse

- `/app/` – Next.js Seiten & API-Routen
- `/components/` – UI-Komponenten (NICHT `/components/ui/` editieren)
- `/lib/` – Utilities, DB, Auth, API-Logik
- `/hooks/` – Custom React Hooks
- `/__tests__/` – Unit Tests
- `/__e2e__/` – End-to-End Tests

## 🚦 Workflows & Commands

- **Entwicklung:** `pnpm dev` (nur auf User-Wunsch!)
- **Build:** `pnpm build` (nur auf User-Wunsch!)
- **Tests:** `pnpm test` (Vitest), `pnpm test:e2e:auth` (Playwright)
- **Linting:** `pnpm lint`, `pnpm lint:fix`
- **Typecheck:** `pnpm typecheck`
- **DB:** `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:studio`
- **Nur pnpm verwenden! Niemals npm/yarn!**

## 🧩 Projekt-Konventionen

- **Bestehende Dateien bevorzugt editieren.** Neue Dateien nur nach User-Freigabe.
- **Testpflicht:** Jede `.ts/.tsx/.js/.jsx` Datei braucht einen Test (TDD Guard: `ts-tdd-guard.sh`).
- **Import-Reihenfolge:**
    1. `react`
    2. `next`
    3. Externe Libs
    4. Lokale Imports (`@/`)
    5. Relative Imports (`./`)
- **Arrow Functions & explizite Rückgabetypen** verwenden.
- **Props immer destrukturieren.**
- **Keine `any`-Typen.**
- **JSDoc:** 1-Zeiler pro Komponente/Hook.
- **Top-of-file Kommentar für Configs.**
- **API-Logik:** `/lib/api/**`, konsumiert via React Query.
- **Query Keys:** `['domain', id?]`
- **URL-basierter State:** Filter, Pagination, Suche über URL abbilden.

## 🔒 Sicherheit & Validierung

- **Zod** für alle Server-Input-Validierungen.
- **Cookies:** HttpOnly + Secure, CSRF-Schutz wo nötig.
- **Sensitive Routen:** Immer über Middleware/Session absichern.

## ⚠️ Wichtige Regeln

- **Nie** Enhanced/Backup/2-Dateinamen verwenden.
- **Nie** .sql-Migrationsdateien manuell, nur DrizzleKit.
- **Nie** Klartext an Server senden.
- **DrizzleAdapter-Mapping in `auth.ts` aktualisieren bei Schema-Änderungen.**
- **Surgical Edits:** Minimal-invasive Änderungen, keine großen Refactorings ohne User-Absprache.

## 🔍 Beispiele

- **Barcode-Scanner:** `/components/barcode-scanner/`, `/app/calories-scan/`
- **Kalorien-Umrechnung:** `/app/calories/`, `/lib/calculations.ts`
- **Unit Converter:** `/app/unit-converter/`, `/lib/api/utils/`

---

> Bei Unsicherheiten oder fehlenden Infos: Rückfrage beim User!

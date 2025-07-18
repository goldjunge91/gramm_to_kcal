# Projektplan: CalorieTracker

## 1. Projektvision und -beschreibung

### 1.1 Projektvision
CalorieTracker ist eine moderne, intuitive Webanwendung, die Nutzern hilft, ihre Ernährung bewusster und einfacher zu gestalten. Durch intelligente Werkzeuge zum Vergleichen von Lebensmitteln und zum flexiblen Anpassen von Rezepten wird der alltägliche Aufwand beim Kalorientracking und Kochen minimiert.

### 1.2 Projektbeschreibung: Überblick & Ziele
CalorieTracker ist eine responsive Webapplikation mit Mobile‑First-Fokus zum einfachen Kalorienvergleich und dynamischen Rezeptmanagement. Mit Next.js 15 (App Router) und shadcn/ui auf Basis von Tailwind CSS entsteht ein performantes, modernes und voll anpassbares UI‑System. Das Ziel ist es, eine schnelle, unkomplizierte und genaue Möglichkeit zu bieten, die eigene Ernährung besser zu verstehen und zu planen.

## 2. Funktionale Anforderungen: Features, Epics & User Stories
### Epic 1: Intelligenter Nährwertvergleich
Dieses Epic umfasst alle Funktionen, die es dem Nutzer ermöglichen, Lebensmittel auf Basis ihrer Nährwerte schnell und einfach zu vergleichen, um bessere Ernährungsentscheidungen zu treffen.
**Features:**
- Eingabe mehrerer Produkte mit Gewicht (g) und Kalorien (kcal)
- Automatische Berechnung und Anzeige von kcal pro Gramm oder kcal pro 100g
- Darstellung der Ergebnisse in einer übersichtlichen Tabelle oder auf Karten zur einfachen Sortierung und zum Vergleich

**Feature-Beschreibung:**
Eingabe mehrerer Produkte mit Gewicht (g) und Kalorien (kcal).
Automatische Berechnung und Anzeige von kcal pro Gramm oder kcal pro 100g.
Darstellung der Ergebnisse in einer übersichtlichen Tabelle oder auf Karten zur einfachen Sortierung und zum Vergleich.

**User Stories:**
- **Als ernährungsbewusster Einkäufer** 
möchte ich schnell die Kalorien von zwei oder mehr Produkten auf eine einheitliche Basis umrechnen, um eine fundierte Entscheidung treffen zu können, welches Produkt besser in meinen Ernährungsplan passt.

- **Als jemand, der auf seine Kalorien achtet**, der auf seine Kalorien achtet, möchte ich auf einen Blick sehen, welches von mehreren Produkten die geringste Kaloriendichte hat, damit ich meine Einkaufszeit optimieren kann.

### Epic 2: Flexibles Rezeptmanagement
Dieses Epic bündelt alle Funktionen rund um die dynamische Anpassung von Kochrezepten, sei es durch die Skalierung von Portionen oder die Anpassung einzelner Zutatenmengen.

**Features:**
- Rezept-Portionsrechner: Ein Nutzer gibt die Zutaten eines Rezepts und die ursprüngliche Portionszahl ein. Nach Eingabe einer neuen Wunsch-Portionszahl werden alle Zutatenmengen automatisch skaliert.
- Dynamischer Zutaten-Anpasser: Ein Nutzer kann die Menge einer einzelnen Zutat in einem Rezept ändern. Alle anderen Zutaten werden daraufhin proportional angepasst, um das Verhältnis des Rezepts beizubehalten.

**Feature-Beschreibung:**

Rezept-Portionsrechner: Ein Nutzer gibt die Zutaten eines Rezepts und die ursprüngliche Portionszahl ein. Nach Eingabe einer neuen Wunsch-Portionszahl werden alle Zutatenmengen automatisch skaliert.

Dynamischer Zutaten-Anpasser: Ein Nutzer kann die Menge einer einzelnen Zutat in einem Rezept ändern. Alle anderen Zutaten werden daraufhin proportional angepasst, um das Verhältnis des Rezepts beizubehalten.

**User Stories:**

- **Als Hobbykoch** möchte ich die Zutatenliste eines Rezepts für 4 Personen einfach auf 2 Personen umrechnen können, ohne jede Zutat einzeln im Kopf umrechnen zu müssen.

- **Als jemand, der für Gäste kocht**, möchte ich ein Rezept für eine größere Gruppe skalieren können, um sicherzustellen, dass die Verhältnisse der Zutaten korrekt bleiben und das Gericht gelingt.

- **Als pragmatischer Koch** möchte ich die Menge einer Zutat anpassen und alle anderen Zutaten automatisch proportional neu berechnen lassen, um Reste zu vermeiden und Zutaten vollständig aufzubrauchen.

- **Als kreativer Koch** möchte ich mit der Menge einer Hauptzutat experimentieren können, während die App dafür sorgt, dass das Gleichgewicht des Rezepts erhalten bleibt.

### Epic 3: Nahtloses Nutzungserlebnis
Dieses Epic fasst alle übergeordneten Anforderungen zusammen, die eine hohe Qualität und eine exzellente User Experience auf der gesamten Plattform sicherstellen.

**Features:**
- Mobile‑First, responsiv auf allen Geräten
- Light/Dark‑Mode via `next-themes`
- Sofortige, verzögerungsfreie Feedback‑Berechnungen
- **Accessibility**: WCAG-konforme Komponenten, Keyboard-Navigation, Screen-Reader-Support

**User Stories:**

- **Als Nutzer** möchte ich die Anwendung auf meinem Smartphone genauso gut bedienen können wie auf meinem Desktop, damit ich sie jederzeit und überall nutzen kann.

- **Als Nutzer** möchte ich ein helles und ein dunkles Design (Light/Dark Mode) wählen können, um die Ansicht an meine Vorlieben und die Umgebungshelligkeit anzupassen.

- **Als Nutzer** erwarte ich, dass alle Berechnungen sofort und ohne Verzögerung stattfinden, um ein flüssiges und interaktives Erlebnis zu haben.

## 3. Technische Spezifikation

| Bereich               | Details                                                                                                    |
| --------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Stack**             | Next.js 15 App Router, shadcn/ui (Tailwind, Radix), next‑themes, React, React Hook Form                    |
| **Containerstruktur** | `app/`, `calories/`, `recipe/`, `components/ui/`                                                           |
| **Datenmodelle**      | `Product`, `Ingredient`, `Recipe` (inklusive `id`, `name`, `quantity`, `kcal`, `unit`, `originalPortions`) |
| **Berechnungen**      | `kcal/g`, Portionsskalierung, Zutatenanpassung über Faktoren                                               |

### 3.1 Technischer Stack

- **Framework:** Next.js 15 (App Router)  
- **UI Library:** shadcn/ui (Button, Input, Card, Table, Dropdown, …)  
- **Styling:** Tailwind CSS (mobile-first, dark mode)  
- **Theming:** next-themes für Light/Dark Mode  
- **State Management:** React (useState, Context API bei Bedarf)  
- **Hosting:** Vercel oder Netlify  

### 3.2 Datenstruktur

```typescript
interface Product {
  id: string;
  name: string;
  quantity: number;   // in grams
  kcal: number;
}

interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: "g" | "ml" | "TL" | "EL" | string;
}

interface Recipe {
  id: string;
  name: string;
  originalPortions: number;
  ingredients: Ingredient[];
}
```
### 3.3 Architektur & Ordnerstruktur
```
 ├── app/                     # App Router structure
 │   ├── layout.tsx        # Globales Layout + ThemeProvider
 │   ├── page.tsx
 │   ├── api/
 │   ├─ calories/                 # Kalorienvergleich
 │   │    ├─ page.tsx
 │   │    └─ components/          # ProductForm, ComparisonTable
 │   ├─ recipe/                   # Rezept-Manager
 │   │    ├─ page.tsx
 │   │    └─ components/          # IngredientList, PortionControls, AdjustmentForm
 ├─ components/
 │    └─ ui/                  # shadcn/ui-Komponenten (Button.tsx, ...)
 ├── tests/                   # Unit and integration tests
 ├── lib/                     # Client helpers, API wrappers, etc.
 ├── hooks/                   # Custom React hooks
 ├── db/                      # if needed
```
## 4. Erweiterte UI‑Feedbacks
* **Toasts/Notifications** (shadcn/ui `sonner`) bei Fehlern oder erfolgreichen Skalierungen, docs dazu im docs/sonner ordner
* **Dialogs/Modals** (shadcn/ui `dialog`) für komplexe Aktionen
* **Theme‑Toggle**: Live Umschaltung zwischen Light/Dark

---

## 5. Zukünftige Erweiterungen

* Gesamt-Nährwertberechnung: Aggregation von kcal, Fett, Zucker etc. nach Skalierung
* Benachrichtigungen: Einsatz von Toasts & Notifications (z.B. shadcn/sonner) für Nutzerfeedback
* Dialoge: Nutzung von Modals & Dialogen für komplexere Eingaben oder Bestätigungen
* Suche & Filter: Implementierung einer Suchfunktion für gespeicherte Rezepte oder Produkte
* Nährwert-Statistiken: Visualisierung von Nährwertdaten mit Recharts oder Chart.js
* Persistenz: Speicherung von Rezepten und Favoriten via localStorage oder einem Backend (z.B. Supabase)
* Theming & Dark Mode mit next-themes einbauen
* Pages & Komponenten entwickeln
* Kalorienvergleich mit Tabellen/Sortierung
* Rezepttools mit Skalierungs- & Anpassungsfunktionen
* UI-Feedback: Toasts & Modals bei Aktionen
* Accessibility-Tests: Kontrast, Tab-Navigation, ARIA‑Labels
* Performance: Tree-shaking, lazy loading, Code-Splitting

---

## 🧪 Testing Practices

* **Testing Library:** `@testing-library/react`
* **Mocking:** `msw`, `vi.mock()`
* **Test command:** `pnpm test`
* Tests organisiert in `/tests` oder co-located mit Komponenten

```

---
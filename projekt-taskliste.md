Meilenstein 0: Projekt-Setup & Fundament
Ziel: Eine solide Basis für die Anwendung schaffen, inklusive aller Abhängigkeiten, der Ordnerstruktur und des grundlegenden Layouts.
[ ] Task 0.1: Ordnerstruktur erstellen
[ ] Task 0.1.1: Erstelle das Verzeichnis app/calories/.
[ ] Task 0.1.2: Erstelle das Verzeichnis app/calories/components/.
[ ] Task 0.1.3: Erstelle das Verzeichnis app/recipe/.
[ ] Task 0.1.4: Erstelle das Verzeichnis app/recipe/components/.
[ ] Task 0.1.5: Erstelle das Verzeichnis lib/.
[ ] Task 0.1.6: Erstelle das Verzeichnis hooks/.
[ ] Task 0.1.7: Erstelle das Verzeichnis tests/.
[ ] Task 0.2: Typdefinitionen anlegen
[ ] Task 0.2.1: Erstelle die Datei lib/types.ts.
[ ] Task 0.2.2: Füge das Product Interface mit einem einzeiligen JSDoc-Kommentar in lib/types.ts hinzu.
[ ] Task 0.2.3: Füge das Ingredient Interface mit einem einzeiligen JSDoc-Kommentar in lib/types.ts hinzu.
[ ] Task 0.2.4: Füge das Recipe Interface mit einem einzeiligen JSDoc-Kommentar in lib/types.ts hinzu.
[ ] Task 0.3: Theme-Provider konfigurieren
[ ] Task 0.3.1: Bearbeite die Datei app/layout.tsx.
[ ] Task 0.3.2: Importiere ThemeProvider aus next-themes.
[ ] Task 0.3.3: Wrappe das children-Prop im <body>-Tag mit dem ThemeProvider.
[ ] Task 0.3.4: Konfiguriere die ThemeProvider-Props: attribute="class", defaultTheme="system", enableSystem, disableTransitionOnChange.
[ ] Task 0.4: Theme-Toggle-Komponente erstellen & integrieren
[ ] Task 0.4.1: Komponenten-Datei erstellen
[ ] Task 0.4.1.1: Erstelle die Datei components/ThemeToggle.tsx.
[ ] Task 0.4.2: Komponenten-Struktur aufbauen
[ ] Task 0.4.2.1: Importiere React und useTheme von next-themes.
[ ] Task 0.4.2.2: Importiere Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger von shadcn/ui.
[ ] Task 0.4.2.3: Importiere die Icons Moon und Sun aus lucide-react.
[ ] Task 0.4.2.4: Definiere die React-Komponente ThemeToggle als Arrow Function.
[ ] Task 0.4.3: Komponenten-Logik implementieren
[ ] Task 0.4.3.1: Rufe das useTheme-Hook auf, um die setTheme-Funktion zu erhalten.
[ ] Task 0.4.3.2: Erstelle die JSX-Struktur mit DropdownMenu und einem DropdownMenuTrigger, der einen Button enthält.
[ ] Task 0.4.3.3: Der Button im Trigger soll das Sun-Icon für das Light-Theme und das Moon-Icon für das Dark-Theme anzeigen.
[ ] Task 0.4.3.4: Die DropdownMenuContent soll drei DropdownMenuItem-Elemente enthalten: "Light", "Dark" und "System".
[ ] Task 0.4.3.5: Jedes DropdownMenuItem soll bei onClick die setTheme-Funktion mit dem entsprechenden Wert ('light', 'dark', 'system') aufrufen.
[ ] Task 0.4.4: Komponente ins Layout integrieren
[ ] Task 0.4.4.1: Bearbeite app/layout.tsx.
[ ] Task 0.4.4.2: Importiere die ThemeToggle-Komponente.
[ ] Task 0.4.4.3: Platziere die <ThemeToggle />-Komponente an einer sichtbaren Stelle im Layout (z.B. in einem Header-Bereich).

Meilenstein 1: Epic 1 - Intelligenter Nährwertvergleich
Ziel: Die vollständige Funktionalität für den Vergleich von Produkt-Nährwerten implementieren.
[ ] Task 1.1: Seite für Kalorienvergleich erstellen
[ ] Task 1.1.1: Seiten-Datei anlegen
[ ] Task 1.1.1.1: Erstelle die Datei app/calories/page.tsx.
[ ] Task 1.1.2: Seiten-Komponente aufbauen
[ ] Task 1.1.2.1: Definiere die Page-Komponente CaloriesPage als "use client".
[ ] Task 1.1.2.2: Importiere useState von React und den Product-Typ aus lib/types.ts.
[ ] Task 1.1.2.3: Initialisiere den State für die Produktliste: const [products, setProducts] = useState<Product[]>([]);.
[ ] Task 1.1.2.4: Füge eine grundlegende JSX-Struktur mit einem Titel (z.B. <h1>Kalorienvergleich</h1>) hinzu.
[ ] Task 1.2: Hilfsfunktion für Berechnungen erstellen
[ ] Task 1.2.1: Utility-Datei anlegen/bearbeiten
[ ] Task 1.2.1.1: Öffne oder erstelle die Datei lib/utils.ts.
[ ] Task 1.2.2: Funktion implementieren
[ ] Task 1.2.2.1: Definiere die Arrow-Funktion calculateKcalPer100g mit JSDoc und expliziten Typen.
[ ] Task 1.2.2.2: Die Funktion muss ein Argument product vom Typ Product annehmen und eine number zurückgeben.
[ ] Task 1.2.2.3: Implementiere die Berechnungslogik: (product.kcal / product.quantity) * 100.
[ ] Task 1.2.2.4: Füge eine Bedingung hinzu, um eine Division durch Null zu verhindern (z.B. if (!product.quantity || product.quantity === 0) return 0;).
[ ] Task 1.3: Produkt-Formular Komponente erstellen
[ ] Task 1.3.1: Komponenten-Datei erstellen
[ ] Task 1.3.1.1: Erstelle die Datei app/calories/components/ProductForm.tsx.
[ ] Task 1.3.2: Komponenten-Struktur aufbauen
[ ] Task 1.3.2.1: Definiere die Komponente ProductForm als "use client".
[ ] Task 1.3.2.2: Definiere die Props-Typen: interface ProductFormProps { onAddProduct: (product: Omit<Product, 'id'>) => void; }.
[ ] Task 1.3.2.3: Importiere Input, Button, Label von shadcn/ui.
[ ] Task 1.3.2.4: Baue das Formular mit JSX auf: divs, Labels und Inputs für "Name", "Menge (g)" und "Kalorien (kcal)".
[ ] Task 1.3.2.5: Füge einen Button vom Typ submit mit dem Text "Hinzufügen" hinzu.
[ ] Task 1.3.3: Formular-Logik implementieren
[ ] Task 1.3.3.1: Verwende useState für jedes Formularfeld (name, quantity, kcal).
[ ] Task 1.3.3.2: Erstelle eine handleSubmit-Funktion, die das FormEvent entgegennimmt und event.preventDefault() aufruft.
[ ] Task 1.3.3.3: In handleSubmit: Validiere die Eingaben (z.B. quantity und kcal müssen positive Zahlen sein).
[ ] Task 1.3.3.4: In handleSubmit: Rufe die onAddProduct-Prop mit den State-Werten auf.
[ ] Task 1.3.3.5: In handleSubmit: Setze die Formularfelder nach dem Absenden zurück.
[ ] Task 1.3.3.6: Verknüpfe die handleSubmit-Funktion mit dem onSubmit-Event des <form>-Tags.
[ ] Task 1.4: Vergleichstabelle Komponente erstellen
[ ] Task 1.4.1: Komponenten-Datei erstellen
[ ] Task 1.4.1.1: Erstelle die Datei app/calories/components/ComparisonTable.tsx.
[ ] Task 1.4.2: Komponenten-Struktur aufbauen
[ ] Task 1.4.2.1: Definiere die Komponente ComparisonTable.
[ ] Task 1.4.2.2: Definiere die Props: products: Product[].
[ ] Task 1.4.2.3: Importiere die Table-Komponenten von shadcn/ui.
[ ] Task 1.4.2.4: Importiere die calculateKcalPer100g-Funktion aus lib/utils.ts.
[ ] Task 1.4.2.5: Baue die Tabellenstruktur mit Table, TableHeader, TableRow, TableHead und TableBody auf.[ ] Task 1.4.3: Tabellen-Logik implementieren
[ ] Task 1.4.3.1: Füge eine Bedingung hinzu: Wenn products.length === 0, zeige eine TableCell an, die sich über alle Spalten erstreckt und eine Leermeldung enthält.
[ ] Task 1.4.3.2: Andernfalls, mappe über das products-Array innerhalb von TableBody.
[ ] Task 1.4.3.3: Für jedes Produkt, rendere eine TableRow mit einer einzigartigen key (z.B. product.id).
[ ] Task 1.4.3.4: Fülle die TableCells mit product.name, product.quantity, product.kcal und dem gerundeten Ergebnis von calculateKcalPer100g(product).
[ ] Task 1.5: Komponenten auf der Hauptseite integrieren
[ ] Task 1.5.1: Seiten-Datei bearbeiten
[ ] Task 1.5.1.1: Öffne app/calories/page.tsx.
[ ] Task 1.5.2: Komponenten importieren
[ ] Task 1.5.2.1: Importiere ProductForm aus ./components/ProductForm.
[ ] Task 1.5.2.2: Importiere ComparisonTable aus ./components/ComparisonTable.
[ ] Task 1.5.3: Integrationslogik schreiben
[ ] Task 1.5.3.1: Definiere die handleAddProduct-Funktion, die ein productData-Objekt (Omit<Product, 'id'>) annimmt.
[ ] Task 1.5.3.2: Innerhalb der Funktion: Erzeuge eine neue ID mit crypto.randomUUID().
[ ] Task 1.5.3.3: Innerhalb der Funktion: Erstelle ein neues Produktobjekt { id: ..., ...productData }.
[ ] Task 1.5.3.4: Innerhalb der Funktion: Aktualisiere den products-State mit setProducts(prevProducts => [...prevProducts, newProduct]).
[ ] Task 1.5.4: Komponenten im JSX rendern
[ ] Task 1.5.4.1: Platziere <ProductForm onAddProduct={handleAddProduct} /> im JSX der Seite.
[ ] Task 1.5.4.2: Platziere <ComparisonTable products={products} /> unterhalb des Formulars.

Meilenstein 2: Epic 2 - Flexibles Rezeptmanagement
Ziel: Die Tools zur Skalierung und Anpassung von Rezepten implementieren.
[ ] Task 2.1: Seite für Rezeptmanagement erstellen
[ ] Task 2.1.1: Seiten-Datei anlegen
[ ] Task 2.1.1.1: Erstelle die Datei app/recipe/page.tsx.
[ ] Task 2.1.2: Seiten-Komponente aufbauen
[ ] Task 2.1.2.1: Definiere die Page-Komponente RecipePage als "use client".
[ ] Task 2.1.2.2: Importiere useState, useEffect von React sowie die Typen Ingredient und Recipe.
[ ] Task 2.1.2.3: Initialisiere die notwendigen States:
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [originalPortions, setOriginalPortions] = useState<number>(4);
    const [desiredPortions, setDesiredPortions] = useState<number>(4);
[ ] Task 2.1.2.4: Füge eine grundlegende JSX-Struktur mit einem Titel hinzu (z.B. <h1>Rezept-Manager</h1>).
[ ] Task 2.2: Formular zum Hinzufügen von Zutaten erstellen
[ ] Task 2.2.1: Formular-Struktur in RecipePage integrieren
[ ] Task 2.2.1.1: Baue innerhalb von app/recipe/page.tsx ein <form>-Element auf.
[ ] Task 2.2.1.2: Füge Input-Felder und Label für "Zutat", "Menge" und "Einheit" (z.B. g, ml, Stk.) hinzu.
[ ] Task 2.2.1.3: Füge einen Button mit dem Text "Zutat hinzufügen" hinzu.
[ ] Task 2.2.2: Formular-Logik implementieren
[ ] Task 2.2.2.1: Erstelle eine handleAddIngredient-Funktion.
[ ] Task 2.2.2.2: Die Funktion soll eine neue Zutat mit einer einzigartigen ID (crypto.randomUUID()) erstellen und zum ingredients-State hinzufügen.
[ ] Task 2.2.2.3: Verknüpfe die Funktion mit dem onSubmit-Event des Formulars.
[ ] Task 2.3: Zutatenliste-Komponente erstellen
[ ] Task 2.3.1: Komponenten-Datei anlegen
[ ] Task 2.3.1.1: Erstelle die Datei app/recipe/components/IngredientList.tsx.
[ ] Task 2.3.2: Komponenten-Struktur aufbauen
[ ] Task 2.3.2.1: Definiere die Komponente IngredientList mit den Props ingredients: Ingredient[] und onDelete: (id: string) => void.
[ ] Task 2.3.2.2: Verwende eine Table von shadcn/ui, um die Zutaten anzuzeigen.
[ ] Task 2.3.2.3: Die Spalten sollen sein: "Zutat", "Menge", "Einheit" und "Aktion".
[ ] Task 2.3.3: Komponenten-Logik implementieren
[ ] Task 2.3.3.1: Mappe über das ingredients-Array, um für jede Zutat eine TableRow zu rendern.
[ ] Task 2.3.3.2: Füge in jede Zeile einen "Löschen"-Button ein, der die onDelete-Funktion mit der ID der Zutat aufruft.
[ ] Task 2.3.4: Komponente in RecipePage integrieren
[ ] Task 2.3.4.1: Importiere und rendere <IngredientList /> in app/recipe/page.tsx.
[ ] Task 2.3.4.2: Erstelle eine handleDeleteIngredient-Funktion, die eine Zutat aus dem State filtert, und übergib sie als onDelete-Prop.
[ ] Task 2.4: Portionsrechner-Komponente erstellen
[ ] Task 2.4.1: Komponenten-Datei anlegen
[ ] Task 2.4.1.1: Erstelle die Datei app/recipe/components/PortionControls.tsx.
[ ] Task 2.4.2: Komponenten-Struktur und Logik
[ ] Task 2.4.2.1: Definiere die Komponente PortionControls mit Props für originalPortions, desiredPortions und deren onChange-Handler.
[ ] Task 2.4.2.2: Implementiere zwei Input-Felder (Typ number) mit Label: "Urspr. Portionen" und "Gew. Portionen".
[ ] Task 2.4.2.3: Verknüpfe die value und onChange-Events der Inputs mit den entsprechenden Props.
[ ] Task 2.4.3: Komponente in RecipePage integrieren
[ ] Task 2.4.3.1: Importiere und rendere <PortionControls /> in app/recipe/page.tsx.
[ ] Task 2.4.3.2: Übergib die State-Werte originalPortions und desiredPortions sowie die set-Funktionen an die Komponente.
[ ] Task 2.5: Skalierungslogik implementieren
[ ] Task 2.5.1: Hilfsfunktion für Skalierung erstellen
[ ] Task 2.5.1.1: Erstelle in lib/utils.ts eine reine Funktion scaleRecipe(ingredients, originalPortions, desiredPortions).
[ ] Task 2.5.1.2: Die Funktion soll eine neue, skalierte Zutatenliste zurückgeben und Randfälle (Division durch Null) behandeln.
[ ] Task 2.5.2: Logik in RecipePage anwenden
[ ] Task 2.5.2.1: Anstatt die Zutaten direkt zu ändern, zeige eine abgeleitete, skalierte Version an.
[ ] Task 2.5.2.2: Berechne die skalierte Liste immer dann neu, wenn sich ingredients, originalPortions oder desiredPortions ändern.
[ ] Task 2.5.2.3: Übergib die scaledIngredients-Liste an die IngredientList-Komponente.
[ ] Task 2.6: UI-Feedback mit Toasts integrieren
[ ] Task 2.6.1: sonner installieren und einrichten
[ ] Task 2.6.1.1: Führe den shadcn/ui CLI-Befehl aus, um sonner zum Projekt hinzuzufügen.
[ ] Task 2.6.1.2: Füge den <Toaster /> in app/layout.tsx ein.
[ ] Task 2.6.2: Toasts bei Aktionen anzeigen
[ ] Task 2.6.2.1: Importiere toast aus sonner in app/recipe/page.tsx.
[ ] Task 2.6.2.2: Rufe toast("Zutat hinzugefügt") auf, nachdem eine Zutat erfolgreich zum State hinzugefügt wurde.
[ ] Task 2.6.2.3: Rufe toast("Rezept neu berechnet") auf, wenn die Portionen geändert werden.

Meilenstein 3: Epic 3 - Feinschliff & Qualitätssicherung
Ziel: Die Anwendung robust, zugänglich und performant machen.
[ ] Task 3.1: Dynamischer Zutaten-Anpasser implementieren
[ ] Task 3.1.1: IngredientList erweitern
[ ] Task 3.1.1.1: Ersetze die reine Textanzeige der Menge in IngredientList.tsx durch ein Input-Feld.
[ ] Task 3.1.1.2: Füge eine neue Prop onQuantityChange: (id: string, newQuantity: number) => void hinzu.
[ ] Task 3.1.1.3: Verknüpfe das onChange-Event des neuen Inputs mit dieser Prop.
[ ] Task 3.1.2: Anpassungslogik in RecipePage erstellen
[ ] Task 3.1.2.1: Erstelle eine handleQuantityChange-Funktion in app/recipe/page.tsx.
[ ] Task 3.1.2.2: Diese Funktion berechnet den neuen Skalierungsfaktor basierend auf der Änderung einer einzelnen Zutat.
[ ] Task 3.1.2.3: Sie passt die desiredPortions proportional an, um die Änderung widerzuspiegeln.
[ ] Task 3.2: Accessibility-Prüfung
[ ] Task 3.2.1: Labels und ARIA-Attribute prüfen
[ ] Task 3.2.1.1: Stelle sicher, dass alle Input-Felder ein zugeordnetes Label haben.
[ ] Task 3.2.1.2: Füge aria-label zu allen Buttons hinzu, die nur ein Icon enthalten (z.B. der "Löschen"-Button in der Zutatenliste).
[ ] Task 3.2.2: Tastaturnavigation testen
[ ] Task 3.2.2.1: Navigiere durch die calories-Seite nur mit der Tastatur.
[ ] Task 3.2.2.2: Navigiere durch die recipe-Seite nur mit der Tastatur. Stelle sicher, dass alle interaktiven Elemente erreichbar und bedienbar sind.
[ ] Task 3.3: Responsiveness-Optimierung
[ ] Task 3.3.1: Tabellen anpassen
[ ] Task 3.3.1.1: Überprüfe die ComparisonTable und IngredientList auf kleinen Bildschirmen (sm Breakpoint).
[ ] Task 3.3.1.2: Implementiere bei Bedarf ein alternatives Layout für mobile Geräte (z.B. Karten statt Tabellenzeilen oder eine horizontal scrollbare Tabelle).
[ ] Task 3.3.2: Formulare anpassen
[ ] Task 3.3.2.1: Stelle sicher, dass Formulare auf mobilen Geräten nicht die Bildschirmbreite überschreiten und alle Felder gut bedienbar sind.
[ ] Task 3.4: Unit-Tests für Berechnungslogik schreiben
[ ] Task 3.4.1: Test-Datei anlegen
[ ] Task 3.4.1.1: Erstelle die Datei tests/lib/utils.test.ts.
[ ] Task 3.4.2: Tests für calculateKcalPer100g schreiben
[ ] Task 3.4.2.1: Teste einen Standardfall (z.B. 200g, 500kcal -> 250).
[ ] Task 3.4.2.2: Teste einen Grenzfall (Menge = 0, sollte 0 zurückgeben).
[ ] Task 3.4.3: Tests für scaleRecipe schreiben
[ ] Task 3.4.3.1: Teste das Hochskalieren (z.B. von 2 auf 4 Portionen).
[ ] Task 3.4.3.2: Teste das Herunterskalieren (z.B. von 4 auf 2 Portionen).
[ ] Task 3.4.3.3: Teste den Grenzfall, bei dem originalPortions 0 ist (sollte keine Änderung bewirken).
[ ] Task 3.5: Dokumentation vervollständigen
[ ] Task 3.5.1: JSDoc-Kommentare hinzufügen
[ ] Task 3.5.1.1: Füge allen neu erstellten React-Komponenten (IngredientList, PortionControls) einen einzeiligen JSDoc-Kommentar hinzu.
[ ] Task 3.5.1.2: Füge allen neuen Hilfsfunktionen (scaleRecipe) einen JSDoc-Kommentar hinzu.
[ ] Task 3.5.2: project_status.md aktualisieren
[ ] Task 3.5.2.1: Erstelle die Datei project_status.md, falls nicht vorhanden.
[ ] Task 3.5.2.2: Füge eine kurze Beschreibung der fertiggestellten Features für "Rezeptmanagement" hinzu.
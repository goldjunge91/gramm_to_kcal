"use client";

import { useState, type JSX } from "react";
import { toast } from "sonner";

import type { ParsedRecipe, RecipeStep } from "@/lib/types/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { parseRecipeText } from "@/lib/parsing/recipeParser";

import { RecipeCard } from "./components/RecipeCard";
import { RecipePreview } from "./components/RecipePreview";
import { RecipeTextInput } from "./components/RecipeTextInput";
import { UnifiedStepEditor } from "./components/UnifiedStepEditor";

/** Anleitungsgenerator page for converting recipe text to A4 formatted cards */
export default function AnleitungsgeneratorPage(): JSX.Element {
  const [inputText, setInputText] = useState<string>("");
  const [parsedRecipe, setParsedRecipe] = useState<ParsedRecipe | null>(null);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [showStepEditor, setShowStepEditor] = useState<boolean>(false);
  const [showPreviewPanel, setShowPreviewPanel] = useState<boolean>(false);
  const [previewMode, setPreviewMode] = useState<"compact" | "full">("compact");

  const handleParseRecipe = (): void => {
    if (!inputText.trim()) {
      toast.error("Bitte geben Sie einen Rezepttext ein");
      return;
    }

    try {
      const parsed = parseRecipeText(inputText);
      setParsedRecipe(parsed);
      setShowPreview(true);
      toast.success("Rezept erfolgreich geparst!");
    } catch (error) {
      toast.error("Fehler beim Parsen des Rezepts");
      console.error("Parse error:", error);
    }
  };

  const handleReset = (): void => {
    setInputText("");
    setParsedRecipe(null);
    setShowPreview(false);
    setShowStepEditor(false);
    setShowPreviewPanel(false);
    toast.info("Formular zurückgesetzt");
  };

  const handleStepsChange = (steps: RecipeStep[]): void => {
    if (parsedRecipe) {
      setParsedRecipe({ ...parsedRecipe, steps });
    }
  };

  const handlePrint = (): void => {
    window.print();
    toast.info("Druckvorschau geöffnet");
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2 print-hidden">
        <h1 className="text-3xl font-bold">Anleitungsgenerator</h1>
        <p className="text-muted-foreground">
          Konvertieren Sie Rezepttext in druckfertige A4-Rezeptkarten
        </p>
      </div>

      {!showPreview ? (
        <>
          {/* Recipe Text Input */}
          <RecipeTextInput
            value={inputText}
            onChange={setInputText}
            onParse={handleParseRecipe}
          />

          {/* Example Section */}
          <Card className="print-hidden">
            <CardHeader>
              <CardTitle>Beispielformat</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                <p className="mb-2">
                  Ihr Rezepttext sollte folgendes Format haben:
                </p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Titel mit optionalen Emojis</li>
                  <li>
                    Kalorien, Zeit und Schwierigkeit (z.B. "359 kcal ・ 5
                    Minuten ・ Leicht")
                  </li>
                  <li>Beschreibungstext</li>
                  <li>"Zutaten für X Portion:" gefolgt von Zutatenliste</li>
                  <li>
                    "Anleitung für X Portion:" gefolgt von nummerierten
                    Schritten
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          {/* Recipe Preview and Actions */}
          <div className="space-y-4 print-hidden">
            <div className="flex gap-2 justify-center flex-wrap">
              <Button onClick={handlePrint} variant="default">
                🖨️ Drucken
              </Button>
              <Button
                onClick={() => setShowPreviewPanel(!showPreviewPanel)}
                variant={showPreviewPanel ? "default" : "outline"}
              >
                👁️ Live-Vorschau
              </Button>
              <Button
                onClick={() => setShowStepEditor(!showStepEditor)}
                variant={showStepEditor ? "default" : "outline"}
              >
                ✍️ Schritte bearbeiten
              </Button>
              <Button onClick={() => setShowPreview(false)} variant="outline">
                ✏️ Text bearbeiten
              </Button>
              <Button onClick={handleReset} variant="outline">
                🔄 Neu beginnen
              </Button>
            </div>

            {/* Preview Mode Toggle */}
            {showPreviewPanel && (
              <div className="flex gap-2 justify-center">
                <Button
                  onClick={() => setPreviewMode("compact")}
                  variant={previewMode === "compact" ? "default" : "outline"}
                  size="sm"
                >
                  📱 Kompakt
                </Button>
                <Button
                  onClick={() => setPreviewMode("full")}
                  variant={previewMode === "full" ? "default" : "outline"}
                  size="sm"
                >
                  📄 A4-Format
                </Button>
              </div>
            )}
          </div>

          {/* Unified Step Editor */}
          {showStepEditor && parsedRecipe?.steps && (
            <UnifiedStepEditor
              steps={parsedRecipe.steps}
              onStepsChange={handleStepsChange}
            />
          )}

          {/* Live Preview Panel */}
          {showPreviewPanel && parsedRecipe && (
            <RecipePreview
              recipe={parsedRecipe}
              showFullCard={previewMode === "full"}
            />
          )}

          {/* Recipe Card Display - Final Output */}
          {parsedRecipe && !showPreviewPanel && !showStepEditor && (
            <RecipeCard recipe={parsedRecipe} />
          )}
        </>
      )}
    </div>
  );
}

"use client";

import { useState, type JSX } from "react";

// import { useState } from "react";
import type { ImageSettings, RecipeStep } from "@/lib/types/types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ImageEditor } from "./ImageEditor";
import { RichTextEditor } from "./RichTextEditor";
import { StepImageUpload } from "./StepImageUpload";

interface AdvancedStepManagerProps {
  steps: RecipeStep[];
  onStepsChange: (steps: RecipeStep[]) => void;
}

/** Advanced step manager with rich text editing and image controls */
export const AdvancedStepManager = ({
  steps,
  onStepsChange,
}: AdvancedStepManagerProps): JSX.Element => {
  const [selectedStepId, setSelectedStepId] = useState<string>(
    steps[0]?.id || "",
  );

  const selectedStep = steps.find((step) => step.id === selectedStepId);

  const handleTextChange = (formattedText: string): void => {
    if (!selectedStep) return;

    const updatedSteps = steps.map((step) =>
      step.id === selectedStepId ? { ...step, formattedText } : step,
    );
    onStepsChange(updatedSteps);
  };

  const handleImageChange = (
    stepId: string,
    image: string | undefined,
  ): void => {
    const updatedSteps = steps.map((step) =>
      step.id === stepId
        ? {
            ...step,
            image,
            imageSettings: image
              ? step.imageSettings || getDefaultImageSettings()
              : undefined,
          }
        : step,
    );
    onStepsChange(updatedSteps);
  };

  const handleImageSettingsChange = (imageSettings: ImageSettings): void => {
    if (!selectedStep) return;

    const updatedSteps = steps.map((step) =>
      step.id === selectedStepId ? { ...step, imageSettings } : step,
    );
    onStepsChange(updatedSteps);
  };

  const getDefaultImageSettings = (): ImageSettings => ({
    width: 200,
    height: 150,
    position: "center",
    quality: 80,
  });

  const duplicateStep = (stepId: string): void => {
    const stepToDuplicate = steps.find((step) => step.id === stepId);
    if (!stepToDuplicate) return;

    const newStep: RecipeStep = {
      ...stepToDuplicate,
      id: `step-${steps.length + 1}-copy`,
      order: steps.length + 1,
    };

    onStepsChange([...steps, newStep]);
  };

  const deleteStep = (stepId: string): void => {
    if (steps.length <= 1) return; // Don't delete the last step

    const updatedSteps = steps
      .filter((step) => step.id !== stepId)
      .map((step, index) => ({ ...step, order: index + 1 }));

    onStepsChange(updatedSteps);

    // Select next available step
    if (selectedStepId === stepId) {
      setSelectedStepId(updatedSteps[0]?.id || "");
    }
  };

  const moveStep = (stepId: string, direction: "up" | "down"): void => {
    const currentIndex = steps.findIndex((step) => step.id === stepId);
    if (currentIndex === -1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= steps.length) return;

    const newSteps = [...steps];
    [newSteps[currentIndex], newSteps[newIndex]] = [
      newSteps[newIndex],
      newSteps[currentIndex],
    ];

    // Update order numbers
    const updatedSteps = newSteps.map((step, index) => ({
      ...step,
      order: index + 1,
    }));

    onStepsChange(updatedSteps);
  };

  if (steps.length === 0) {
    return (
      <Card className="print-hidden">
        <CardContent className="py-8">
          <p className="text-muted-foreground text-center">
            Keine Schritte gefunden. Bitte parsen Sie zuerst ein Rezept.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="print-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🎨 Erweiterte Schritt-Bearbeitung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Step Selection */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Schritt auswählen:</div>
          <div className="flex flex-wrap gap-2">
            {steps.map((step) => (
              <div key={step.id} className="flex items-center gap-1">
                <Button
                  variant={selectedStepId === step.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedStepId(step.id)}
                >
                  Schritt {step.order}
                </Button>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveStep(step.id, "up")}
                    disabled={step.order === 1}
                    className="w-6 h-6 p-0"
                    title="Nach oben"
                  >
                    ↑
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveStep(step.id, "down")}
                    disabled={step.order === steps.length}
                    className="w-6 h-6 p-0"
                    title="Nach unten"
                  >
                    ↓
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => duplicateStep(step.id)}
                    className="w-6 h-6 p-0"
                    title="Kopieren"
                  >
                    📋
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteStep(step.id)}
                    disabled={steps.length <= 1}
                    className="w-6 h-6 p-0 text-destructive hover:text-destructive"
                    title="Löschen"
                  >
                    🗑️
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedStep && (
          <Tabs defaultValue="text" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="text">✏️ Text bearbeiten</TabsTrigger>
              <TabsTrigger value="image">📷 Bild verwalten</TabsTrigger>
              <TabsTrigger value="preview">👁️ Vorschau</TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="space-y-4">
              <RichTextEditor
                value={selectedStep.formattedText || selectedStep.instruction}
                onChange={handleTextChange}
                placeholder="Schritt-Anleitung formatieren..."
              />
            </TabsContent>

            <TabsContent value="image" className="space-y-4">
              <StepImageUpload
                stepId={selectedStep.id}
                currentImage={selectedStep.image}
                onImageChange={handleImageChange}
              />

              {selectedStep.image && (
                <ImageEditor
                  image={selectedStep.image}
                  settings={
                    selectedStep.imageSettings || getDefaultImageSettings()
                  }
                  onSettingsChange={handleImageSettingsChange}
                />
              )}
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Badge variant="outline">
                      Schritt {selectedStep.order}
                    </Badge>
                    Vorschau
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{
                        __html:
                          selectedStep.formattedText ||
                          selectedStep.instruction,
                      }}
                    />
                    {selectedStep.image && (
                      <div
                        className="flex"
                        style={{
                          justifyContent:
                            selectedStep.imageSettings?.position === "left"
                              ? "flex-start"
                              : selectedStep.imageSettings?.position === "right"
                                ? "flex-end"
                                : "center",
                        }}
                      >
                        <img
                          src={selectedStep.image}
                          alt={`Schritt ${selectedStep.order}`}
                          style={{
                            width: `${selectedStep.imageSettings?.width || 200}px`,
                            height: `${selectedStep.imageSettings?.height || 150}px`,
                            objectFit: "cover",
                            filter: `contrast(${selectedStep.imageSettings?.quality || 80}%)`,
                          }}
                          className="rounded border"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

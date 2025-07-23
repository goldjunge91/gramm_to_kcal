"use client";

import type { JSX } from "react";

import type { ImageSettings, RecipeStep } from "@/lib/types/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { ImageEditor } from "./ImageEditor";
import { RichTextEditor } from "./RichTextEditor";
import { StepImageUpload } from "./StepImageUpload";

interface UnifiedStepEditorProps {
    steps: RecipeStep[];
    onStepsChange: (steps: RecipeStep[]) => void;
}

function getDefaultImageSettings(): ImageSettings {
    return {
        width: 200,
        height: 150,
        position: "center",
        quality: 80,
    };
}

/** A unified editor for managing all aspects of recipe steps. */
export function UnifiedStepEditor({
    steps,
    onStepsChange,
}: UnifiedStepEditorProps): JSX.Element {
    const handleStepChange = (
        stepId: string,
        newContent: Partial<RecipeStep>,
    ): void => {
        const updatedSteps = steps.map(step =>
            step.id === stepId ? { ...step, ...newContent } : step,
        );
        onStepsChange(updatedSteps);
    };

    const handleImageChange = (
        stepId: string,
        image: string | undefined,
    ): void => {
        handleStepChange(stepId, {
            image,
            imageSettings: image ? getDefaultImageSettings() : undefined,
        });
    };

    const handleTextChange = (stepId: string, formattedText: string): void => {
        handleStepChange(stepId, { formattedText });
    };

    const handleImageSettingsChange = (
        stepId: string,
        imageSettings: ImageSettings,
    ): void => {
        handleStepChange(stepId, { imageSettings });
    };

    const duplicateStep = (stepId: string): void => {
        const stepToDuplicate = steps.find(step => step.id === stepId);
        if (!stepToDuplicate)
            return;

        const newStep: RecipeStep = {
            ...stepToDuplicate,
            id: `step-${Date.now()}`, // More robust ID
            order: steps.length + 1,
        };

        const updatedSteps = [...steps, newStep].map((s, i) => ({
            ...s,
            order: i + 1,
        }));
        onStepsChange(updatedSteps);
    };

    const deleteStep = (stepId: string): void => {
        if (steps.length <= 1)
            return;
        const updatedSteps = steps
            .filter(step => step.id !== stepId)
            .map((s, i) => ({ ...s, order: i + 1 }));
        onStepsChange(updatedSteps);
    };

    const moveStep = (stepId: string, direction: "up" | "down"): void => {
        const index = steps.findIndex(step => step.id === stepId);
        if (index === -1)
            return;

        const newIndex = direction === "up" ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= steps.length)
            return;

        const newSteps = [...steps];
        [newSteps[index], newSteps[newIndex]] = [
            newSteps[newIndex],
            newSteps[index],
        ];

        const updatedSteps = newSteps.map((s, i) => ({ ...s, order: i + 1 }));
        onStepsChange(updatedSteps);
    };

    if (steps.length === 0) {
        return (
            <Card className="print-hidden">
                <CardContent className="py-8 text-center text-muted-foreground">
                    Keine Schritte gefunden. Bitte parsen Sie zuerst ein Rezept.
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="print-hidden">
            <CardHeader>
                <CardTitle>Schritte bearbeiten</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {steps.map((step, index) => (
                    <div key={step.id}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">
                                Schritt
                                {step.order}
                            </h3>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => moveStep(step.id, "up")}
                                    disabled={index === 0}
                                    title="Nach oben"
                                >
                                    ↑
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => moveStep(step.id, "down")}
                                    disabled={index === steps.length - 1}
                                    title="Nach unten"
                                >
                                    ↓
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => duplicateStep(step.id)}
                                    title="Kopieren"
                                >
                                    📋
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteStep(step.id)}
                                    disabled={steps.length <= 1}
                                    className="text-destructive hover:text-destructive"
                                    title="Löschen"
                                >
                                    🗑️
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h4 className="font-medium">Anleitungstext</h4>
                                <RichTextEditor
                                    value={
                                        step.formattedText || step.instruction
                                    }
                                    onChange={content =>
                                        handleTextChange(step.id, content)}
                                    placeholder="Schritt-Anleitung formatieren..."
                                />
                            </div>
                            <div className="space-y-4">
                                <h4 className="font-medium">Bild</h4>
                                <StepImageUpload
                                    stepId={step.id}
                                    currentImage={step.image}
                                    onImageChange={(id, img) =>
                                        handleImageChange(id, img)}
                                />
                                {step.image && step.imageSettings && (
                                    <ImageEditor
                                        image={step.image}
                                        settings={step.imageSettings}
                                        onSettingsChange={settings =>
                                            handleImageSettingsChange(
                                                step.id,
                                                settings,
                                            )}
                                    />
                                )}
                            </div>
                        </div>
                        {index < steps.length - 1 && (
                            <Separator className="mt-6" />
                        )}
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}

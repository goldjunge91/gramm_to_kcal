import type { JSX } from "react";
import type { RecipeStep } from "@/lib/types/types";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { StepImageUpload } from "./StepImageUpload";

interface StepManagerProps {
  steps: RecipeStep[];
  onStepsChange: (steps: RecipeStep[]) => void;
}

/** Component for managing recipe steps with images */
export const StepManager = ({ steps, onStepsChange }: StepManagerProps): JSX.Element => {
  const handleImageChange = (stepId: string, image: string | undefined): void => {
    const updatedSteps = steps.map(step =>
      step.id === stepId ? { ...step, image } : step
    );
    onStepsChange(updatedSteps);
  };

  return (
    <Card className="print-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📸 Schritt-Bilder hinzufügen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {steps.map((step) => (
            <div key={step.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <Badge variant="outline" className="flex-shrink-0 mt-1">
                  Schritt {step.order}
                </Badge>
                <p className="text-sm leading-relaxed flex-1">
                  {step.instruction}
                </p>
              </div>
              
              <StepImageUpload
                stepId={step.id}
                currentImage={step.image}
                onImageChange={handleImageChange}
              />
            </div>
          ))}
        </div>
        
        {steps.length === 0 && (
          <p className="text-muted-foreground text-center py-4">
            Keine Schritte gefunden. Bitte parsen Sie zuerst ein Rezept.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
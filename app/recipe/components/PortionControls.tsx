import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JSX } from "react";

interface PortionControlsProps {
  originalPortions: number;
  desiredPortions: number;
  onOriginalPortionsChange: (value: number) => void;
  onDesiredPortionsChange: (value: number) => void;
  onScaleFactorChange: (scaleFactor: number) => void;
}

/** Component for controlling recipe portion scaling */
export const PortionControls = ({
  originalPortions,
  desiredPortions,
  onOriginalPortionsChange,
  onDesiredPortionsChange,
  onScaleFactorChange,
}: PortionControlsProps): JSX.Element => {
  const scaleFactor = originalPortions > 0 ? desiredPortions / originalPortions : 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portionsrechner</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="original-portions">Ursprüngliche Portionen</Label>
            <Input
              id="original-portions"
              type="number"
              value={originalPortions}
              onChange={(e) => onOriginalPortionsChange(parseFloat(e.target.value) || 1)}
              min="1"
              step="1"
              placeholder="z.B. 4"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="desired-portions">Gewünschte Portionen</Label>
            <Input
              id="desired-portions"
              type="number"
              value={desiredPortions}
              onChange={(e) => onDesiredPortionsChange(parseFloat(e.target.value) || 1)}
              min="1"
              step="1"
              placeholder="z.B. 6"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="scale-factor">Skalierungsfaktor</Label>
            <Input
              id="scale-factor"
              type="number"
              value={scaleFactor.toFixed(2)}
              onChange={(e) => {
                const newScaleFactor = parseFloat(e.target.value) || 1;
                onScaleFactorChange(newScaleFactor);
              }}
              min="0.1"
              step="0.1"
              placeholder="z.B. 1.5"
            />
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">
            Aktueller Skalierungsfaktor: <strong>{scaleFactor.toFixed(2)}x</strong>
            {scaleFactor > 1 ? " (hochskaliert)" : scaleFactor < 1 ? " (herunterskaliert)" : " (original)"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
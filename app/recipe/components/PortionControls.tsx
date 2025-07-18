import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { JSX } from "react";

interface PortionControlsProps {
  originalPortions: number;
  desiredPortions: number;
  onOriginalPortionsChange: (value: number) => void;
  onDesiredPortionsChange: (value: number) => void;
}

/** Component for controlling recipe portion scaling */
export const PortionControls = ({
  originalPortions,
  desiredPortions,
  onOriginalPortionsChange,
  onDesiredPortionsChange,
}: PortionControlsProps): JSX.Element => {
  const scaleFactor = originalPortions > 0 ? desiredPortions / originalPortions : 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portionsrechner</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>
        
        {scaleFactor !== 1 && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Skalierungsfaktor:</strong> {scaleFactor.toFixed(2)}x
              {scaleFactor > 1 ? " (hochskaliert)" : " (herunterskaliert)"}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
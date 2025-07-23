import type { JSX } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDeferredInput } from "@/hooks/useDeferredInput";

interface PortionControlsProps {
    originalPortions: number;
    desiredPortions: number;
    onOriginalPortionsChange: (value: number) => void;
    onDesiredPortionsChange: (value: number) => void;
    onScaleFactorChange: (scaleFactor: number) => void;
}

// Deferred Original Portions Input Component
function DeferredOriginalPortionsInput({
    value,
    onChange,
}: {
    value: number;
    onChange: (value: number) => void;
}) {
    const { displayValue, isDirty, handleChange, handleBlur, handleKeyDown }
        = useDeferredInput({
            initialValue: value,
            onCommit: onChange,
            validator: val => !Number.isNaN(val) && val >= 1,
            formatter: val => Number.parseFloat(val) || 1,
        });

    return (
        <Input
            id="original-portions"
            type="number"
            inputMode="numeric"
            value={displayValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            min="1"
            step="1"
            placeholder="z.B. 1"
            className={`text-center ${isDirty ? "ring-2 ring-blue-200 dark:ring-blue-800" : ""}`}
        />
    );
}

// Deferred Desired Portions Input Component
function DeferredDesiredPortionsInput({
    value,
    onChange,
}: {
    value: number;
    onChange: (value: number) => void;
}) {
    const { displayValue, isDirty, handleChange, handleBlur, handleKeyDown }
        = useDeferredInput({
            initialValue: value,
            onCommit: onChange,
            validator: val => !Number.isNaN(val) && val >= 1,
            formatter: val => Number.parseFloat(val) || 1,
        });

    return (
        <Input
            id="desired-portions"
            type="number"
            inputMode="numeric"
            value={displayValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            min="1"
            step="1"
            placeholder="z.B. 2"
            className={`text-center ${isDirty ? "ring-2 ring-blue-200 dark:ring-blue-800" : ""}`}
        />
    );
}

// Deferred Scale Factor Input Component
function DeferredScaleFactorInput({
    value,
    onChange,
}: {
    value: number;
    onChange: (value: number) => void;
}) {
    const { displayValue, isDirty, handleChange, handleBlur, handleKeyDown }
        = useDeferredInput({
            initialValue: value,
            onCommit: onChange,
            validator: val => !Number.isNaN(val) && val >= 0.1,
            formatter: val => Number.parseFloat(val) || 1,
        });

    return (
        <Input
            id="scale-factor"
            type="number"
            inputMode="decimal"
            value={displayValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            min="0.1"
            step="0.1"
            placeholder="z.B. 1.5"
            className={`text-center ${isDirty ? "ring-2 ring-blue-200 dark:ring-blue-800" : ""}`}
        />
    );
}

/** Component for controlling recipe portion scaling */
export function PortionControls({
    originalPortions,
    desiredPortions,
    onOriginalPortionsChange,
    onDesiredPortionsChange,
    onScaleFactorChange,
}: PortionControlsProps): JSX.Element {
    const scaleFactor
        = originalPortions > 0 ? desiredPortions / originalPortions : 1;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Portionsrechner</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="original-portions">
                            Ursprüngliche Portionen
                        </Label>
                        <DeferredOriginalPortionsInput
                            value={originalPortions}
                            onChange={onOriginalPortionsChange}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="desired-portions">
                            Gewünschte Portionen
                        </Label>
                        <DeferredDesiredPortionsInput
                            value={desiredPortions}
                            onChange={onDesiredPortionsChange}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="scale-factor">Skalierungsfaktor</Label>
                        <DeferredScaleFactorInput
                            value={scaleFactor}
                            onChange={onScaleFactorChange}
                        />
                    </div>
                </div>

                <div className="mt-4 text-center">
                    <p className="text-sm text-muted-foreground">
                        Aktueller Skalierungsfaktor:
                        {" "}
                        <strong>
                            {scaleFactor.toFixed(2)}
                            x
                        </strong>
                        {scaleFactor > 1
                            ? " (hochskaliert)"
                            : scaleFactor < 1
                                ? " (herunterskaliert)"
                                : " (original)"}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

import type { JSX } from "react";

import type { ImageSettings } from "@/types/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface ImageEditorProps {
    image?: string;
    settings: ImageSettings;
    onSettingsChange: (settings: ImageSettings) => void;
}

/** Image editor component for adjusting size, position and quality */
export function ImageEditor({
    image,
    settings,
    onSettingsChange,
}: ImageEditorProps): JSX.Element {
    const handleWidthChange = (values: number[]): void => {
        onSettingsChange({ ...settings, width: values[0] });
    };

    const handleHeightChange = (values: number[]): void => {
        onSettingsChange({ ...settings, height: values[0] });
    };

    const handleQualityChange = (values: number[]): void => {
        onSettingsChange({ ...settings, quality: values[0] });
    };

    const handlePositionChange = (
        position: "left" | "center" | "right",
    ): void => {
        onSettingsChange({ ...settings, position });
    };

    const resetToDefaults = (): void => {
        onSettingsChange({
            width: 200,
            height: 150,
            position: "center",
            quality: 80,
        });
    };

    if (!image) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        🖼️ Bildeinstellungen
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-center py-8">
                        Kein Bild vorhanden. Laden Sie zuerst ein Bild hoch.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    🖼️ Bildeinstellungen
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Image Preview */}
                <div className="space-y-2">
                    <Label>Vorschau</Label>
                    <div className="border rounded-lg p-4 bg-muted/30">
                        <div
                            className="flex"
                            style={{
                                justifyContent:
                                    settings.position === "left"
                                        ? "flex-start"
                                        : settings.position === "right"
                                            ? "flex-end"
                                            : "center",
                            }}
                        >
                            <img
                                src={image}
                                alt="Schritt-Bild"
                                style={{
                                    width: `${settings.width}px`,
                                    height: `${settings.height}px`,
                                    objectFit: "cover",
                                    filter: `contrast(${settings.quality}%)`,
                                }}
                                className="rounded border"
                            />
                        </div>
                    </div>
                </div>

                {/* Width Control */}
                <div className="space-y-2">
                    <Label>
                        Breite:
                        {settings.width}
                        px
                    </Label>
                    <Slider
                        value={[settings.width]}
                        onValueChange={handleWidthChange}
                        max={400}
                        min={100}
                        step={10}
                        className="w-full"
                    />
                </div>

                {/* Height Control */}
                <div className="space-y-2">
                    <Label>
                        Höhe:
                        {settings.height}
                        px
                    </Label>
                    <Slider
                        value={[settings.height]}
                        onValueChange={handleHeightChange}
                        max={300}
                        min={80}
                        step={10}
                        className="w-full"
                    />
                </div>

                {/* Position Control */}
                <div className="space-y-2">
                    <Label>Position</Label>
                    <div className="flex gap-2">
                        {[
                            { value: "left" as const, label: "⬅️ Links" },
                            { value: "center" as const, label: "⬆️ Mitte" },
                            { value: "right" as const, label: "➡️ Rechts" },
                        ].map(({ value, label }) => (
                            <Button
                                key={value}
                                type="button"
                                variant={
                                    settings.position === value
                                        ? "default"
                                        : "outline"
                                }
                                size="sm"
                                onClick={() => handlePositionChange(value)}
                                className="flex-1"
                            >
                                {label}
                            </Button>
                        ))}
                    </div>
                </div>

                {/* Quality Control */}
                <div className="space-y-2">
                    <Label>
                        Bildqualität:
                        {settings.quality}
                        %
                    </Label>
                    <Slider
                        value={[settings.quality]}
                        onValueChange={handleQualityChange}
                        max={100}
                        min={20}
                        step={5}
                        className="w-full"
                    />
                </div>

                {/* Reset Button */}
                <Button
                    type="button"
                    variant="outline"
                    onClick={resetToDefaults}
                    className="w-full"
                >
                    🔄 Standardwerte zurücksetzen
                </Button>
            </CardContent>
        </Card>
    );
}

/* eslint-disable no-alert */
import type { JSX } from "react";

import { useRef } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface StepImageUploadProps {
    stepId: string;
    currentImage?: string;
    onImageChange: (stepId: string, image: string | undefined) => void;
}

/** Component for uploading images to recipe steps */
export function StepImageUpload({
    stepId,
    currentImage,
    onImageChange,
}: StepImageUploadProps): JSX.Element {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (
        event: React.ChangeEvent<HTMLInputElement>,
    ): void => {
        const file = event.target.files?.[0];
        if (!file)
            return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            alert("Bitte wählen Sie eine Bilddatei aus.");
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert("Bild ist zu groß. Maximal 5MB erlaubt.");
            return;
        }

        const reader = new FileReader();
        reader.addEventListener("load", (e) => {
            const result = e.target?.result as string;
            onImageChange(stepId, result);
        });
        reader.readAsDataURL(file);
    };

    const handleRemoveImage = (): void => {
        onImageChange(stepId, undefined);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleButtonClick = (): void => {
        fileInputRef.current?.click();
    };

    return (
        <div className="space-y-2">
            <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
            />

            {currentImage ? (
                <div className="space-y-2">
                    <div className="relative">
                        <img
                            src={currentImage}
                            alt={`Schritt ${stepId}`}
                            className="w-full h-32 object-cover rounded-md border"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleButtonClick}
                            className="flex-1"
                        >
                            📷 Bild ändern
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleRemoveImage}
                            className="text-destructive hover:text-destructive"
                        >
                            🗑️ Entfernen
                        </Button>
                    </div>
                </div>
            ) : (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleButtonClick}
                    className="w-full"
                >
                    📷 Bild hinzufügen
                </Button>
            )}
        </div>
    );
}

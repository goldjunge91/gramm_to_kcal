"use client";

import type { JSX } from "react";

import { useCallback, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

/** Rich text editor component with formatting toolbar */
export function RichTextEditor({
    value,
    onChange,
    placeholder = "Schritt-Anleitung eingeben...",
}: RichTextEditorProps): JSX.Element {
    const editorRef = useRef<HTMLDivElement>(null);

    const executeCommand = useCallback(
        (command: string, value?: string): void => {
            document.execCommand(command, false, value);
            if (editorRef.current) {
                onChange(editorRef.current.innerHTML);
            }
        },
        [onChange],
    );

    const handleInput = useCallback((): void => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    }, [onChange]);

    const handleKeyDown = useCallback(
        (event: React.KeyboardEvent): void => {
            // Handle keyboard shortcuts
            if (event.ctrlKey || event.metaKey) {
                switch (event.key) {
                    case "b":
                        event.preventDefault();
                        executeCommand("bold");
                        break;
                    case "i":
                        event.preventDefault();
                        executeCommand("italic");
                        break;
                    case "u":
                        event.preventDefault();
                        executeCommand("underline");
                        break;
                    case "z":
                        event.preventDefault();
                        executeCommand("undo");
                        break;
                    case "y":
                        event.preventDefault();
                        executeCommand("redo");
                        break;
                }
            }
        },
        [executeCommand],
    );

    const formatButtons = [
        { command: "bold", icon: "𝐁", title: "Fett (Strg+B)" },
        { command: "italic", icon: "𝐼", title: "Kursiv (Strg+I)" },
        { command: "underline", icon: "𝐔", title: "Unterstrichen (Strg+U)" },
        { command: "insertUnorderedList", icon: "•", title: "Aufzählung" },
        {
            command: "insertOrderedList",
            icon: "1.",
            title: "Nummerierte Liste",
        },
        { command: "undo", icon: "↶", title: "Rückgängig (Strg+Z)" },
        { command: "redo", icon: "↷", title: "Wiederholen (Strg+Y)" },
    ];

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                    ✏️ Text formatieren
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {/* Formatting Toolbar */}
                <div className="flex flex-wrap gap-1 p-2 bg-muted rounded-md">
                    {formatButtons.map(({ command, icon, title }) => (
                        <Button
                            key={command}
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => executeCommand(command)}
                            title={title}
                            className="w-8 h-8 p-0 text-sm font-bold hover:bg-background"
                        >
                            {icon}
                        </Button>
                    ))}
                </div>

                {/* Rich Text Editor */}
                <div
                    ref={editorRef}
                    contentEditable
                    onInput={handleInput}
                    onKeyDown={handleKeyDown}
                    dangerouslySetInnerHTML={{ __html: value }}
                    className="min-h-[120px] p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                    style={{
                        lineHeight: "1.6",
                        fontSize: "14px",
                    }}
                    data-placeholder={placeholder}
                />

                {/* Helper Text */}
                <div className="text-xs text-muted-foreground">
                    💡 Tipp: Verwenden Sie die Toolbar oder Tastenkürzel (Strg+B, Strg+I,
                    etc.) zum Formatieren
                </div>
            </CardContent>
        </Card>
    );
}

import type { JSX } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface RecipeTextInputProps {
  value: string
  onChange: (value: string) => void
  onParse: () => void
}

/** Component for inputting recipe text to be parsed */
export function RecipeTextInput({
  value,
  onChange,
  onParse,
}: RecipeTextInputProps): JSX.Element {
  const handlePaste = (
    event: React.ClipboardEvent<HTMLTextAreaElement>,
  ): void => {
    // Allow default paste behavior, the onChange will handle the state update
    setTimeout(() => {
      const target = event.target as HTMLTextAreaElement
      onChange(target.value)
    }, 0)
  }

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ): void => {
    // Allow Ctrl+Enter to trigger parsing
    if (event.ctrlKey && event.key === 'Enter') {
      event.preventDefault()
      onParse()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rezepttext eingeben</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="recipe-text">
            Fügen Sie hier Ihren Rezepttext ein
          </Label>
          <Textarea
            id="recipe-text"
            value={value}
            onChange={e => onChange(e.target.value)}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            placeholder="🤤😋🐷Pudding-Oats mit Blaubeeren mhm🤤😋🤤
359 kcal ・ 5 Minuten ・ Leicht

Pudding zum Frühstück klingt für dich nicht gesund? Wir zeigen dir, dass es auch anders geht...

Zutaten für 1 Portion:
・Haferflocken (50 g)
・Wasser (300 ml)
・Puddingpulver, Vanille (20 g)

Anleitung für 1 Portion:
1. Haferflocken, Wasser, Puddingpulver aufkochen.
2. Abkühlen lassen und Sojajoghurt unterheben."
            className="min-h-[300px] font-mono text-sm"
            required
          />
        </div>

        <div className="flex gap-2 justify-between items-center">
          <div className="text-sm text-muted-foreground">
            💡 Tipp: Strg + Enter zum schnellen Parsen
          </div>
          <Button
            onClick={onParse}
            disabled={!value.trim()}
            className="min-w-[120px]"
          >
            📋 Rezept parsen
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

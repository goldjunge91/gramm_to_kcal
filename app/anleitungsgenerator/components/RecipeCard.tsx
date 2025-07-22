import type { JSX } from 'react'

import type { ParsedRecipe } from '@/lib/types/types'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface RecipeCardProps {
  recipe: ParsedRecipe
}

/** A4-formatted recipe card component optimized for printing */
export function RecipeCard({ recipe }: RecipeCardProps): JSX.Element {
  return (
    <div className="recipe-card-a4 mx-auto bg-white text-black p-8 shadow-lg">
      {/* Header Section */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold mb-3">{recipe.title}</h1>

        {/* Metadata badges */}
        <div className="flex justify-center gap-3 mb-4 badge-print">
          {recipe.calories && (
            <Badge variant="secondary">
              🔥
              {recipe.calories}
              {' '}
              kcal
            </Badge>
          )}
          {recipe.time && (
            <Badge variant="secondary">
              ⏱️
              {recipe.time}
            </Badge>
          )}
          {recipe.difficulty && (
            <Badge variant="secondary">
              📊
              {recipe.difficulty}
            </Badge>
          )}
          <Badge variant="secondary">
            👥
            {' '}
            {recipe.portions}
            {' '}
            Portion
            {recipe.portions !== 1 ? 'en' : ''}
          </Badge>
        </div>

        {/* Description */}
        {recipe.description && (
          <p className="text-muted-foreground text-sm leading-relaxed max-w-2xl mx-auto description-print">
            {recipe.description}
          </p>
        )}
      </div>

      {/* Vertical layout - ingredients first, then instructions */}
      <div className="space-y-6 main-content-print">
        {/* Ingredients Section */}
        <Card className="card-print">
          <CardHeader className="pb-3 card-header-print">
            <CardTitle className="text-xl flex items-center gap-2 card-title-print">
              🥘 Zutaten
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 ingredients-list-print">
              {recipe.ingredients.map(ingredient => (
                <li
                  key={ingredient.id}
                  className="flex justify-between items-center py-1 border-b border-gray-100 last:border-b-0 ingredient-item-print"
                >
                  <span className="font-medium">{ingredient.name}</span>
                  <span className="text-muted-foreground">
                    {ingredient.quantity}
                    {' '}
                    {ingredient.unit}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Instructions Section */}
        <Card className="card-print">
          <CardHeader className="pb-3 card-header-print">
            <CardTitle className="text-xl flex items-center gap-2 card-title-print">
              👨‍🍳 Anleitung
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 instructions-list-print">
              {recipe.steps
                ? recipe.steps.map(step => (
                    <li key={step.id} className="instruction-item-print">
                      <div className="flex gap-3 mb-2">
                        <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold step-number-print">
                          {step.order}
                        </span>
                        <div className="text-sm leading-relaxed flex-1">
                          {step.formattedText
                            ? (
                                <div
                                  className="rich-text"
                                  dangerouslySetInnerHTML={{
                                    __html: step.formattedText,
                                  }}
                                />
                              )
                            : (
                                <span>{step.instruction}</span>
                              )}
                        </div>
                      </div>
                      {step.image && (
                        <div
                          className="ml-9"
                          style={{
                            display: 'flex',
                            justifyContent:
                              step.imageSettings?.position === 'left'
                                ? 'flex-start'
                                : step.imageSettings?.position === 'right'
                                  ? 'flex-end'
                                  : 'center',
                          }}
                        >
                          <img
                            src={step.image}
                            alt={`Schritt ${step.order}`}
                            style={{
                              width: `${step.imageSettings?.width || 200}px`,
                              height: `${step.imageSettings?.height || 150}px`,
                              objectFit: 'cover',
                              filter: `contrast(${step.imageSettings?.quality || 80}%)`,
                            }}
                            className="rounded-md border mt-2"
                          />
                        </div>
                      )}
                    </li>
                  ))
                : recipe.instructions.map((instruction, index) => (
                    <li
                      key={index}
                      className="flex gap-3 instruction-item-print"
                    >
                      <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold step-number-print">
                        {index + 1}
                      </span>
                      <span className="text-sm leading-relaxed">
                        {instruction}
                      </span>
                    </li>
                  ))}
            </ol>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-gray-200 text-center footer-print">
        <p className="text-xs text-muted-foreground">
          Erstellt mit dem Anleitungsgenerator •
          {' '}
          {new Date().toLocaleDateString('de-DE')}
        </p>
      </div>
    </div>
  )
}

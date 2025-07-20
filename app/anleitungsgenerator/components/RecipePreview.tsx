import type { JSX } from "react";

import type { ParsedRecipe } from "@/lib/types/types";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RecipePreviewProps {
  recipe: ParsedRecipe;
  showFullCard?: boolean;
}

/** Live preview component for recipe editing */
export const RecipePreview = ({
  recipe,
  showFullCard = false,
}: RecipePreviewProps): JSX.Element => {
  const containerClass = showFullCard
    ? "recipe-card-a4 mx-auto bg-white text-black p-8 shadow-lg scale-75 origin-top"
    : "bg-white text-black p-4 border rounded-lg shadow-sm";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          👁️ Live-Vorschau
          {showFullCard && (
            <Badge variant="outline" className="text-xs">
              A4-Format (75%)
            </Badge>
          )}
          <Badge variant="secondary" className="text-xs ml-auto">
            Aktualisiert
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent
        className={
          showFullCard ? "recipe-preview-full" : "recipe-preview-compact"
        }
      >
        <div className={containerClass}>
          {/* Header Section */}
          <div className={`text-center ${showFullCard ? "mb-6" : "mb-4"}`}>
            <h1
              className={`font-bold ${showFullCard ? "text-3xl mb-3" : "text-xl mb-2"}`}
            >
              {recipe.title}
            </h1>

            {/* Metadata badges */}
            <div
              className={`flex justify-center gap-2 ${showFullCard ? "mb-4 badge-print" : "mb-3"}`}
            >
              {recipe.calories && (
                <Badge
                  variant="secondary"
                  className={showFullCard ? "" : "text-xs"}
                >
                  🔥 {recipe.calories} kcal
                </Badge>
              )}
              {recipe.time && (
                <Badge
                  variant="secondary"
                  className={showFullCard ? "" : "text-xs"}
                >
                  ⏱️ {recipe.time}
                </Badge>
              )}
              {recipe.difficulty && (
                <Badge
                  variant="secondary"
                  className={showFullCard ? "" : "text-xs"}
                >
                  📊 {recipe.difficulty}
                </Badge>
              )}
              <Badge
                variant="secondary"
                className={showFullCard ? "" : "text-xs"}
              >
                👥 {recipe.portions} Portion{recipe.portions !== 1 ? "en" : ""}
              </Badge>
            </div>

            {/* Description */}
            {recipe.description && (
              <p
                className={`text-muted-foreground leading-relaxed max-w-2xl mx-auto ${
                  showFullCard ? "text-sm description-print" : "text-xs"
                }`}
              >
                {recipe.description}
              </p>
            )}
          </div>

          {/* Content Area */}
          <div
            className={`space-y-4 ${showFullCard ? "main-content-print" : ""}`}
          >
            {/* Ingredients Section */}
            <div
              className={`border rounded ${showFullCard ? "card-print" : "border-gray-200"}`}
            >
              <div
                className={`${showFullCard ? "pb-3 card-header-print" : "p-3 pb-2"} border-b`}
              >
                <h3
                  className={`font-semibold flex items-center gap-2 ${
                    showFullCard ? "text-xl card-title-print" : "text-sm"
                  }`}
                >
                  🥘 Zutaten
                </h3>
              </div>
              <div className={showFullCard ? "" : "p-3"}>
                <ul
                  className={`space-y-1 ${showFullCard ? "ingredients-list-print" : ""}`}
                >
                  {recipe.ingredients
                    .slice(0, showFullCard ? undefined : 5)
                    .map((ingredient) => (
                      <li
                        key={ingredient.id}
                        className={`flex justify-between items-center py-1 border-b border-gray-100 last:border-b-0 ${
                          showFullCard ? "ingredient-item-print" : "text-xs"
                        }`}
                      >
                        <span className="font-medium">{ingredient.name}</span>
                        <span className="text-muted-foreground">
                          {ingredient.quantity} {ingredient.unit}
                        </span>
                      </li>
                    ))}
                  {!showFullCard && recipe.ingredients.length > 5 && (
                    <li className="text-xs text-muted-foreground text-center py-1">
                      ... und {recipe.ingredients.length - 5} weitere
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {/* Instructions Section */}
            <div
              className={`border rounded ${showFullCard ? "card-print" : "border-gray-200"}`}
            >
              <div
                className={`${showFullCard ? "pb-3 card-header-print" : "p-3 pb-2"} border-b`}
              >
                <h3
                  className={`font-semibold flex items-center gap-2 ${
                    showFullCard ? "text-xl card-title-print" : "text-sm"
                  }`}
                >
                  👨‍🍳 Anleitung
                </h3>
              </div>
              <div className={showFullCard ? "" : "p-3"}>
                <ol
                  className={`space-y-2 ${showFullCard ? "instructions-list-print" : ""}`}
                >
                  {(recipe.steps
                    ? recipe.steps
                    : recipe.instructions.map((instruction, index) => ({
                        id: `step-${index}`,
                        instruction,
                        order: index + 1,
                        formattedText: undefined,
                        image: undefined,
                        imageSettings: undefined,
                      }))
                  )
                    .slice(0, showFullCard ? undefined : 3)
                    .map((step) => (
                      <li
                        key={step.id}
                        className={String(
                          showFullCard ? "instruction-item-print" : "",
                        )}
                      >
                        <div
                          className={`flex gap-2 ${showFullCard ? "mb-2" : ""}`}
                        >
                          <span
                            className={`flex-shrink-0 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold ${
                              showFullCard
                                ? "w-6 h-6 text-sm step-number-print"
                                : "w-4 h-4 text-xs"
                            }`}
                          >
                            {step.order}
                          </span>
                          <div
                            className={`leading-relaxed flex-1 ${showFullCard ? "text-sm" : "text-xs"}`}
                          >
                            {step.formattedText ? (
                              <div
                                className="rich-text"
                                dangerouslySetInnerHTML={{
                                  __html: step.formattedText,
                                }}
                              />
                            ) : (
                              <span>
                                {"instruction" in step
                                  ? step.instruction
                                  : step.instruction}
                              </span>
                            )}
                          </div>
                        </div>
                        {step.image && (
                          <div
                            className={showFullCard ? "ml-9" : "ml-6 mt-2"}
                            style={{
                              display: "flex",
                              justifyContent:
                                step.imageSettings?.position === "left"
                                  ? "flex-start"
                                  : step.imageSettings?.position === "right"
                                    ? "flex-end"
                                    : "center",
                            }}
                          >
                            <img
                              src={step.image}
                              alt={`Schritt ${step.order}`}
                              style={{
                                width: showFullCard
                                  ? `${step.imageSettings?.width || 200}px`
                                  : "80px",
                                height: showFullCard
                                  ? `${step.imageSettings?.height || 150}px`
                                  : "60px",
                                objectFit: "cover",
                                filter: `contrast(${step.imageSettings?.quality || 80}%)`,
                              }}
                              className="rounded border"
                            />
                          </div>
                        )}
                      </li>
                    ))}
                  {!showFullCard &&
                    (recipe.steps
                      ? recipe.steps.length > 3
                      : recipe.instructions.length > 3) && (
                      <li className="text-xs text-muted-foreground text-center py-1">
                        ... und{" "}
                        {(recipe.steps
                          ? recipe.steps.length
                          : recipe.instructions.length) - 3}{" "}
                        weitere Schritte
                      </li>
                    )}
                </ol>
              </div>
            </div>
          </div>

          {/* Footer - only in full card mode */}
          {showFullCard && (
            <div className="mt-8 pt-4 border-t border-gray-200 text-center footer-print">
              <p className="text-xs text-muted-foreground">
                Erstellt mit dem Anleitungsgenerator •{" "}
                {new Date().toLocaleDateString("de-DE")}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

"use client";

import type { Recipe } from "@/types/types";

function RecipeListItem({ recipe }: { recipe: Recipe }) {
    return (
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium">{recipe.name}</h3>
            <button className="inline-flex justify-center py-1 px-3 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">
                View
            </button>
        </div>
    );
}

export default RecipeListItem;

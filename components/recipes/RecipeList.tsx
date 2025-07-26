"use client";

import { useState } from "react";

import AddRecipeForm from "./AddRecipeForm";
import RecipeListItem from "./RecipeListItem";

const dummyRecipes = [
    { id: 1, name: "Spaghetti Carbonara" },
    { id: 2, name: "Chicken Tikka Masala" },
    { id: 3, name: "Classic Beef Burgers" },
];

function RecipeList() {
    const [showAddForm, setShowAddForm] = useState(false);

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">My Recipes</h2>
                <button
                    onClick={() => setShowAddForm(true)}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Add Recipe
                </button>
            </div>
            {showAddForm && <AddRecipeForm />}
            <div>
                {dummyRecipes.map(recipe => (
                    <RecipeListItem key={recipe.id} recipe={recipe} />
                ))}
            </div>
        </div>
    );
}

export default RecipeList;

function AddRecipeForm() {
    return (
        <div>
            <h2 className="text-xl font-bold mb-4">Add New Recipe</h2>
            <form>
                <div className="mb-4">
                    <label htmlFor="recipeName" className="block text-sm font-medium text-gray-700">Recipe Name</label>
                    <input type="text" id="recipeName" name="recipeName" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                <div className="mb-4">
                    <label htmlFor="ingredients" className="block text-sm font-medium text-gray-700">Ingredients</label>
                    <textarea id="ingredients" name="ingredients" rows={4} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
                </div>
                <div className="mb-4">
                    <label htmlFor="instructions" className="block text-sm font-medium text-gray-700">Instructions</label>
                    <textarea id="instructions" name="instructions" rows={6} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
                </div>
                <button type="submit" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Save Recipe</button>
            </form>
        </div>
    );
}

export default AddRecipeForm;

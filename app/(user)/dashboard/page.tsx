import RecipeList from "@/components/recipes/RecipeList";

export default function DashboardPage() {
    return (
        <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <RecipeList />
        </div>
    );
}

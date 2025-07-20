import { Calculator, ChefHat, Combine } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <div className="container mx-auto p-6">
      <div className="text-center space-y-4 mb-8">
        <h1 className="text-4xl font-bold">Willkommen bei CalorieTracker</h1>
        <p className="text-lg text-muted-foreground">
          Vergleiche Lebensmittel und verwalte deine Rezepte intelligent
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <Card className="text-center">
          <CardHeader>
            <Calculator className="w-12 h-12 mx-auto mb-2 text-primary" />
            <CardTitle>Kalorienvergleich</CardTitle>
            <CardDescription>
              Vergleiche Produkte basierend auf ihren Kalorien pro Gramm
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/calories">Jetzt vergleichen</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader>
            <ChefHat className="w-12 h-12 mx-auto mb-2 text-primary" />
            <CardTitle>Rezept-Manager</CardTitle>
            <CardDescription>
              Skaliere Rezepte und passe Zutatenmengen dynamisch an
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/recipe">Rezepte verwalten</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="text-center">
          <CardHeader>
            <Combine className="w-12 h-12 mx-auto mb-2 text-primary" />
            <CardTitle>Einheiten-Umrechner</CardTitle>
            <CardDescription>
              Konvertiere Milliliter in Gramm für über 50 Substanzen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/unit-converter">Einheiten umrechnen</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

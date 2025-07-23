import { expect, test } from "@playwright/test";
import path from "node:path";
// Definiere den Barcode-Bildpfad relativ zum Projekt-Root
const barcodeBasePath = path.join(
    process.cwd(),
    "__e2e__",
    "fixtures",
    "barcodes",
);

test("BarcodeScanner erkennt Barcode aus real-product-barcode.png", async ({
    page,
}) => {
    const barcodeImagePath = path.join(barcodeBasePath, "4311501043271.png");

    await page.context().grantPermissions(["camera"]);
    // await page.context().grantPermissions(["camera"]);
    await page.goto("http://localhost:3000/calories-scan");
    // Öffne den Scanner
    await page.getByRole("button", { name: /scannen/i }).click();

    // Wechsle auf "Bild hochladen"
    await page.getByRole("button", { name: /bild hochladen/i }).click();

    const fileInput = await page.$('input[type="file"]');
    await page.pause();
    if (!fileInput) throw new Error("Dateiupload-Feld nicht gefunden!");
    await fileInput.setInputFiles(barcodeImagePath);
    await page.pause();

    // Warten auf Scan-Ergebnis
    await expect(page.getByText(/4311501043271/)).toBeVisible();
    await page.pause();
});

test("BarcodeScanner zeigt Fehler bei ungültigem Barcode", async ({ page }) => {
    const invalidBarcodeImagePath = path.join(
        barcodeBasePath,
        "invalid-barcode.png",
    );

    await page.context().grantPermissions(["camera"]);
    await page.goto("http://localhost:3000/calories-scan");
    await page.getByRole("button", { name: /scannen/i }).click();
    await page.getByRole("button", { name: /bild hochladen/i }).click();

    const fileInput = await page.$('input[type="file"]');
    if (!fileInput) throw new Error("Dateiupload-Feld nicht gefunden!");
    await fileInput.setInputFiles(invalidBarcodeImagePath);

    await expect(
        page.getByText(/Barcode konnte nicht erkannt werden/i),
    ).toBeVisible();
});

test("BarcodeScanner erkennt Barcode aus Barcode-Scanner-API", async ({
    page,
}) => {
    const barcodeImagePath = path.join(barcodeBasePath, "4311501043271.png");

    await page.context().grantPermissions(["camera"]);
    await page.goto("http://localhost:3000/dev-scanner");
    // Öffne den Scanner
    await page.getByRole("button", { name: /scannen/i }).click();

    // Wechsle auf "Bild hochladen"
    await page.getByRole("button", { name: /bild hochladen/i }).click();

    const fileInput = await page.$('input[type="file"]');
    if (!fileInput) throw new Error("Dateiupload-Feld nicht gefunden!");
    await fileInput.setInputFiles(barcodeImagePath);

    // Warten auf Scan-Ergebnis
    await expect(page.getByText(/4311501043271/)).toBeVisible();
});

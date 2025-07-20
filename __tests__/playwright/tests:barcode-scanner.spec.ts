import { expect, test } from "@playwright/test";
import path from "node:path";

test("BarcodeScanner erkennt Barcode aus real-product-barcode.png", async ({
  page,
}) => {
  await page.context().grantPermissions(["camera"]);
  // await page.context().grantPermissions(["camera"]);
  await page.goto("http://localhost:3000/calories-scan");
  // Öffne den Scanner
  await page.getByRole("button", { name: /scannen/i }).click();

  // Wechsle auf "Bild hochladen"
  await page.getByRole("button", { name: /bild hochladen/i }).click();

  // Lade das Testbild hoch
  const filePath = path.resolve(
    __dirname,
    "../fixtures/barcodes/real-product-barcode.png",
  );
  await page.pause();
  const fileInput = await page.$('input[type="file"]');
  if (!fileInput) throw new Error("Dateiupload-Feld nicht gefunden!");
  await page.pause();
  await fileInput.setInputFiles(filePath);
  await page.pause();

  // Warten auf Scan-Ergebnis
  await expect(page.getByText(/4311501043271/)).toBeVisible();
  await page.pause();
});

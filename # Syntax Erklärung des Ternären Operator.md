# Syntax Erklärung des Ternären Operators in TypeScript

Der ternäre Operator ist eine kompakte Möglichkeit, eine Bedingung zu prüfen und basierend auf dem Ergebnis einen Wert zuzuweisen. Er hat die folgende Syntax:

```typescript
const nextConfig: NextConfig = env.FORCE_BUILD
  ? {
      ...baseConfig,
      typescript: {
        // This is set to true to ensure that TypeScript errors are ignored during build.
        ignoreBuildErrors: true,
      },
      eslint: {
        // This is set to true to ensure that ESLint errors are ignored during build.
        ignoreDuringBuilds: true,
      },
    }
  : baseConfig;
```

**Erklärung Schritt für Schritt:**

1. **Bedingung:**  
   `env.FORCE_BUILD`  
   Das ist die Bedingung, die geprüft wird. Sie sollte ein boolean (true/false) sein.

2. **? (Fragezeichen):**  
   Wenn die Bedingung **wahr** ist (`true`), wird der Wert **nach dem Fragezeichen** genommen.

3. **: (Doppelpunkt):**  
   Wenn die Bedingung **falsch** ist (`false`), wird der Wert **nach dem Doppelpunkt** genommen.

**In deinem Beispiel:**

- Wenn `env.FORCE_BUILD` **true** ist, wird ein neues Objekt erstellt:
  - Es übernimmt alle Eigenschaften von `baseConfig` (`...baseConfig`).
  - Zusätzlich werden die Einstellungen für TypeScript und ESLint ergänzt, sodass Fehler beim Build ignoriert werden.

- Wenn `env.FORCE_BUILD` **false** ist, wird einfach `baseConfig` verwendet.

**Vergleich mit if/else:**

```typescript
let nextConfig: NextConfig;
if (env.FORCE_BUILD) {
  nextConfig = {
    ...baseConfig,
    typescript: { ignoreBuildErrors: true },
    eslint: { ignoreDuringBuilds: true },
  };
} else {
  nextConfig = baseConfig;
}
```

**Tipp:**  
Der ternäre Operator ist praktisch für kurze, einfache Bedingungen. Bei komplexeren Logiken ist ein normales `if/else` oft besser lesbar.

**Gotcha:**  
Achte darauf, dass `env.FORCE_BUILD` wirklich ein boolean ist. Wenn es z.B. ein String wie `"true"` ist, kann es zu unerwartetem Verhalten kommen.

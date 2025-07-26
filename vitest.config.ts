import react from "@vitejs/plugin-react";
import path from "node:path";
import { VitestReporter } from "tdd-guard";
import { defineConfig } from "vitest/config";

export default defineConfig({
    plugins: [react()],
    test: {
        reporters: ["default", "json", "junit", new VitestReporter()],
        testTimeout: 10000,
        environment: "jsdom",
        setupFiles: ["./__tests__/setup.ts"],
        globals: true,
        include: [
            "__tests__/**/*.test.ts",
            "__tests__/**/*.test.tsx",
            "__tests__/**/*.spec.ts",
            "lib/**/*.test.ts",
            "lib/**/*.spec.ts",
            "components/**/*.test.tsx",
            "lib/**/*.test.tsx",
            "hooks/**/*.test.tsx",
            "utils/**/*.test.tsx",
        ],
        exclude: ["__e2e__/**"],
        deps: {
            external: ["server-only"],
        },
        coverage: {
            enabled: true,
            provider: "v8",
            reportsDirectory: "./test-results/coverage",
            reporter: ["text", "json", "html", "lcov"],
            exclude: ["__tests__/**", "__e2e__/**", "test-results/**"],
        },
        outputFile: {
            json: "./test-results/vitest-results.json",
            junit: "./test-results/vitest-junit.xml",
        },
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "."),
            "server-only": path.resolve(__dirname, "./__tests__/empty-mock.ts"),
        },
    },
});

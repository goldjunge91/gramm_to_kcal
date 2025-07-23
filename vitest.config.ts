import react from "@vitejs/plugin-react";
import path from "node:path";
import { VitestReporter } from "tdd-guard";
import { defineConfig } from "vitest/config";

export default defineConfig({
    plugins: [react()],
    test: {
        reporters: ["default", new VitestReporter()],
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
        ],
        exclude: ["__e2e__/**"],
        deps: {
            external: ["server-only"],
        },
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "."),
        },
    },
});

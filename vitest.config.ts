import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
    plugins: [react()],
    test: {
        testTimeout: 1000,
        environment: "jsdom",
        setupFiles: ["./__tests__/setup.ts"],
        globals: true,
        include: [
            "__tests__/**/*.test.ts",
            "__tests__/**/*.spec.ts",
            "lib/**/*.test.ts",
            "lib/**/*.spec.ts",
        ],
        exclude: ["__e2e__/**"],
    },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "."),
        },
    },
});

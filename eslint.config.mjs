import antfu from "@antfu/eslint-config";

export default antfu(
    {
        type: "app",
        react: true,
        typescript: true,
        unocss: false, // auto detection
        formatters: true,
        stylistic: {
            indent: 4,
            semi: true,
            quotes: "double",
        },
        ignores: [
            // "**/tests/*",
            // "**/__tests__/setup.ts",
            // "**/__mocks__/*",
            // "**/__e2e__/*",
            "**/.next/*",
            "scripts/**",
            "**/db/migrations/*",
            "**/ui/*",
            "**/ci.yml",
            "**/.github/workflows/*",
            "**/docs/*",
            ".github/",
            "*.yml",
            "*.yaml",
            "**/*.md",
            ".docs/**",
        ],
    },
    {
        rules: {
            "react-dom/no-dangerously-set-innerhtml": "warn",
            "react-web-api/no-leaked-timeout": "warn",
            "ts/no-use-before-define": "warn",
            "react-dom/no-missing-button-type": "off",
            "react-refresh/only-export-components": "off",
            "ts/ban-ts-comment": "off",
            "react-hooks/exhaustive-deps": "warn",
            "react-hooks/rules-of-hooks": "warn",
            "react-hooks-extra/no-direct-set-state-in-use-effect": "off",
            "react/no-array-index-key": "off",
            "style/multiline-ternary": "off",
            "react/no-danger": "off",
            // alte regeln
            "no-console": ["off"],
            "antfu/no-top-level-await": ["off"],
            "node/prefer-global/process": ["off"],
            "node/no-process-env": "off",
            "import/no-default-export": "off",
            "perfectionist/sort-imports": [
                "warn",
                {
                    tsconfigRootDir: ".",
                },
            ],
            "unicorn/filename-case": [
                "off",
                {
                    case: "kebabCase",
                    ignore: ["README.md"],
                },
            ],
            "node/prefer-global/buffer": "off",
            "no-control-regex": "off",
            "prettier/prettier": "off",
        },
    },
    {
        files: ["**/*.md"],
        rules: {
            "unicorn/filename-case": "off",
            "react-dom/no-dangerously-set-innerhtml": "off",
            "react-web-api/no-leaked-timeout": "off",
            "ts/no-use-before-define": "off",
            "react-dom/no-missing-button-type": "off",
            "react-refresh/only-export-components": "off",
            "ts/ban-ts-comment": "off",
            "react-hooks/exhaustive-deps": "off",
            "react-hooks/rules-of-hooks": "off",
            "react-hooks-extra/no-direct-set-state-in-use-effect": "off",
            "react/no-array-index-key": "off",
            "style/multiline-ternary": "off",
            "react/no-danger": "off",
            // alte regeln
            "no-console": ["off"],
            "antfu/no-top-level-await": ["off"],
            "node/prefer-global/process": ["off"],
            "node/no-process-env": "off",
            "import/no-default-export": "off",
        },
    },
    {
        files: ["scripts/**"],
        rules: {
            "unused-imports/no-unused-vars": "off",
            "no-console": ["off"],
            "antfu/no-top-level-await": ["off"],
        },
    },
    {
        files: ["**/types.ts"],
        rules: {
            "unicorn/filename-case": "off",
        },

    },
);

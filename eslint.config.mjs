import { sxzz } from "@sxzz/eslint-config";

export default sxzz(
  {
    type: "app",
    typescript: true,
    formatters: true,
    stylistic: {
      indent: 4,
      semi: true,
      quotes: "double",
    },
    ignores: [
      "**/migrations/*",
      "**/fixtures",
      "**/__tests__/*",
      "**/__mocks__/*",
      "**/ui/*",
      "**/lib/db/migrations/*",
      "./src/__tests__/",
      "./src/__mocks__/",
      "**/scripts/*",
      "**/supabase/*"
      
    ],
  },
  {
    rules: {
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
    files: ["src/types/**"],
    rules: {
      "unicorn/filename-case": "off",
    },
  },
);

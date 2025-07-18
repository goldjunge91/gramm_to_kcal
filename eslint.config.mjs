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
      "**/db/migrations/*",
      "**/ui/*",
      "**/supabase/*",
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
      "no-control-regex": "error",
      "prettier/prettier": "error",
    },
  },
  {
    files: ["**/types.ts"],
    rules: {
      "unicorn/filename-case": "error",
    },
  },
);

import { sxzz } from "@sxzz/eslint-config";

export default sxzz(
  {
    type: "app",
    typescript: true,
    unocss: false, // auto detection
    // formatters: true,
    // stylistic: {
    //   indent: 4,
    //   semi: true,
    //   quotes: "double",
    // },
    ignores: [
      "**/migrations/*",
      "**/fixtures",
      "**/tests/*",
      "**/__tests__/*",
      "**/__mocks__/*",
      "scripts/**",
      "**/db/migrations/*",
      "**/ui/*",
      "**/ci.yml",
      "**/.github/workflows/*",
      "**/docs/*",
      ".github/",
      "*.yml",
      "*.yaml",
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
      "no-control-regex": "off",
      "prettier/prettier": "off",
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

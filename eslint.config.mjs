import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "dist/**",
      "dist-electron/**",
      "out/**",
      "build/**",
      "release/**",
      "next-env.d.ts",
    ],
  },
  {
    files: [
      "**/*.test.ts",
      "**/*.test.tsx",
      "__tests__/**/*.ts",
      "__tests__/**/*.tsx",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];

export default eslintConfig;

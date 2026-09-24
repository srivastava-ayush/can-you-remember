import { defineConfig } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["app/layout.tsx"],
    rules: { "@next/next/no-page-custom-font": "off" },
  },
  {
    ignores: [".next/**", "out/**", "next-env.d.ts"],
  },
]);

export default eslintConfig;
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    ".firebase/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "dashboard/**",
    "functions/**",
    "blockchain/**",
    "scripts/**",
    "tests/**",
    ".agent/**"
  ]),
]);

export default eslintConfig;

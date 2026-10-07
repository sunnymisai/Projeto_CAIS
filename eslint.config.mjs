/* ============================================================================
   ESLINT.CONFIG.MJS
   O que é: as regras do `npm run lint` (as recomendadas do Next para Core Web Vitals e TypeScript) e as pastas que o lint ignora.
   Onde é usado: pelo ESLint, ao rodar `npm run lint` (e pelo editor, se tiver a extensão do ESLint).
   Depende de: eslint e eslint-config-next (devDependencies do package.json).
   Contexto: CLAUDE.md, "Verificação antes de dizer que terminou" (lint sem erro).
   ============================================================================ */
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Perfis temporários do Chrome dos testes de navegador (arquivos do próprio Chrome, não do projeto).
    "testes/navegador/.perfis/**",
  ]),
]);

export default eslintConfig;

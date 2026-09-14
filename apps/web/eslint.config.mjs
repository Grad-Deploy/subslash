import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Next.js 16에서 `next lint`가 없어져 ESLint를 직접 돌린다. 규칙은 예전 루트 .eslintrc.json과
// 같다 — Next.js 권장 설정(core-web-vitals + typescript)에 아래 규칙을 더한다.
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "prefer-const": "error",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      // Next.js 16의 권장 설정에 새로 들어온 React 규칙. 걸리는 곳(20곳)은 대부분 브라우저
      // 저장소를 읽은 뒤에 그리려고 effect 안에서 setMounted(true)를 부르는 기존 패턴이다.
      // 업그레이드와 섞어 고치면 동작이 바뀔 수 있어, 따로 고칠 때까지 경고로 둔다.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "dist/**",
    "next-env.d.ts",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
  ]),
]);

export default eslintConfig;

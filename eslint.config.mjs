import tseslint from "typescript-eslint";
import policy from "./tools/policy-rules.mjs";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import dependencyPolicy from "./tools/dependency-policy.cjs";

const root = new URL("./", import.meta.url);
const { architecture } = JSON.parse(
  readFileSync(new URL("template.json", root), "utf8"),
);
const platformBoundary = dependencyPolicy
  .activeLayers({ root: fileURLToPath(root), architecture })
  .includes("infra");

const platformSelectors = [
  "MemberExpression[object.name='process'][property.name='platform']",
  "MemberExpression[object.name='process'][property.value='platform']",
  "VariableDeclarator[init.name='process'] > ObjectPattern > Property[key.name='platform']",
].map((selector) => ({
  selector,
  message: "Platform/version differences require a reviewed runtime boundary.",
}));

export default [
  { ignores: ["node_modules/**", "dist/**", "test-results/**"] },
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: "latest",
      sourceType: "module",
    },
    plugins: { policy },
    linterOptions: {
      noInlineConfig: true,
      reportUnusedDisableDirectives: "error",
    },
    rules: {
      "no-empty": ["error", { allowEmptyCatch: false }],
      "policy/no-silent-catch": "error",
      "policy/no-empty-fallback": "error",
      "no-restricted-syntax": ["error", ...platformSelectors],
      "no-restricted-imports": [
        "error",
        {
          paths: ["node:os", "os", "node:process", "process"].map((name) => ({
            name,
            message: "Runtime platform imports require a reviewed boundary.",
          })),
        },
      ],
      // Warning for editor feedback; `lint --max-warnings 0` makes it a gate.
      "max-lines": [
        "warn",
        { max: 300, skipBlankLines: false, skipComments: false },
      ],
    },
  },
  ...(platformBoundary
    ? [
        {
          files: ["src/infra/platform-boundary.ts"],
          rules: {
            "no-restricted-syntax": "off",
            "no-restricted-imports": "off",
          },
        },
      ]
    : []),
];

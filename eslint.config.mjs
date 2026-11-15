import tseslint from "typescript-eslint";
import policy from "./tools/policy-rules.mjs";

const platformSelectors = [
  "MemberExpression[object.name='process'][property.name='platform']",
  "MemberExpression[object.name='process'][property.value='platform']",
  "VariableDeclarator[init.name='process'] > ObjectPattern > Property[key.name='platform']",
].map((selector) => ({
  selector,
  message: "Platform discovery belongs in src/infra/platform-boundary.ts.",
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
            message:
              "Runtime platform imports belong in the platform boundary.",
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
  {
    files: ["src/infra/platform-boundary.ts"],
    rules: { "no-restricted-syntax": "off", "no-restricted-imports": "off" },
  },
];

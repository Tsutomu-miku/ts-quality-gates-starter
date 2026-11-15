import { readFile, readdir } from "node:fs/promises";
import { resolve, relative, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { ESLint } from "eslint";

// Read-only: run from the template toolchain; never install into the audit target.
const target = process.argv[2];
if (!target)
  throw new Error("Usage: node tools/audit-project.mjs <project-directory>");
const root = resolve(target);
const toolRoot = fileURLToPath(new URL("../", import.meta.url));
const eslint = new ESLint({ cwd: toolRoot });
const excluded = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  "coverage",
  "test-results",
]);
async function filesIn(path) {
  const files = [];
  for (const item of await readdir(path, { withFileTypes: true })) {
    if (excluded.has(item.name) || item.name.startsWith(".env")) continue;
    const full = join(path, item.name);
    if (item.isDirectory()) files.push(...(await filesIn(full)));
    else if (item.isFile()) files.push(full);
  }
  return files;
}
const files = await filesIn(root);
const paths = files.map((file) => relative(root, file).replaceAll("\\", "/"));
const codeFiles = files.filter((file) => /\.[cm]?[jt]sx?$/.test(file));
const longFiles = [];
const policyFindings = [];
const importCandidates = [];
const layer = (path) =>
  path.match(
    /^src\/(domain|session|adapters|infra|transport|entrypoints)\//,
  )?.[1];
const allowed = {
  domain: ["domain"],
  session: ["domain", "session"],
  infra: ["domain", "infra"],
  adapters: ["domain", "session", "infra", "adapters"],
  transport: ["domain", "session", "transport"],
};
for (const file of codeFiles) {
  const path = relative(root, file).replaceAll("\\", "/");
  const code = await readFile(file, "utf8");
  const lines = code.split(/\r\n|\r|\n/).length - (code.endsWith("\n") ? 1 : 0);
  if (lines > 300) longFiles.push({ path, lines });
  const lintPath = path.startsWith("src/")
    ? path.replace(/\.[cm]?jsx?$/, ".ts")
    : "src/audit.ts";
  const [lint] = await eslint.lintText(code, { filePath: lintPath });
  for (const message of lint.messages) {
    if (message.ruleId === "max-lines") continue;
    policyFindings.push({
      path,
      rule: message.ruleId || "parse-error",
      line: message.line,
    });
  }
  const ast = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true);
  function visit(node) {
    let specifier;
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
      specifier = node.moduleSpecifier;
    } else if (
      ts.isCallExpression(node) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) &&
          node.expression.text === "require"))
    ) {
      specifier = node.arguments[0];
    }
    if (specifier && ts.isStringLiteral(specifier)) {
      const imported = specifier.text;
      const resolved = imported.startsWith(".")
        ? relative(root, resolve(dirname(file), imported)).replaceAll("\\", "/")
        : imported;
      const from = layer(path);
      const to = layer(resolved);
      if (from && allowed[from] && (!to || !allowed[from].includes(to))) {
        importCandidates.push({
          path,
          imported,
          from,
          to: to || "external-or-unmapped",
        });
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
}
const has = (pattern) => paths.filter((path) => pattern.test(path));
console.log(
  JSON.stringify(
    {
      mode: "read-only audit; candidates require owner/alias review",
      inventory: {
        agents: has(/(^|\/)AGENTS\.md$/),
        eslint: has(/(^|\/)(eslint\.config\.|\.eslintrc)/),
        dependencies: has(/(^|\/)\.?dependency-cruiser\./),
        tsconfig: has(/(^|\/)tsconfig[^/]*\.json$/),
        hooks: has(/^\.githooks\//),
        ci: has(/^\.github\/workflows\//),
      },
      scannedFiles: codeFiles.length,
      longFiles,
      policyFindings,
      importCandidates,
      limits: [
        "Only literal imports and canonical layer names are classified; aliases and custom owners require mapping.",
        "Syntax gates do not prove lifecycle ownership, all swallowed errors, or compatibility semantics.",
        "No target files, dependency installs, Git configuration, or hooks were changed.",
      ],
    },
    null,
    2,
  ),
);

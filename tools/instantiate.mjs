import { mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { parseArgs } from "node:util";
import { format } from "prettier";
import { profiles, templateOnlyPaths } from "./project-profiles.mjs";
import { projectContract, projectReadme } from "./project-contract.mjs";

const root = new URL("../", import.meta.url);
if (fileURLToPath(root).replace(/\/$/, "") !== process.cwd()) {
  throw new Error("Run instantiate from the fresh template root");
}
const { values } = parseArgs({
  options: { name: { type: "string" }, type: { type: "string" } },
});
const name = values.name;
const profile = values.type;
if (!name || !/^[a-z][a-z0-9-]{0,79}$/.test(name)) {
  throw new Error("Use --name with a lowercase unscoped package name");
}
if (!Object.hasOwn(profiles, profile)) {
  throw new Error(`Use --type ${Object.keys(profiles).join("|")}`);
}
const readJSON = async (path) =>
  JSON.parse(await readFile(new URL(path, root)));
const write = async (path, text) => {
  const file = new URL(path, root);
  await mkdir(dirname(fileURLToPath(file)), { recursive: true });
  await writeFile(file, await format(text, { filepath: fileURLToPath(file) }));
};
const writeJSON = (path, value) => write(path, JSON.stringify(value));
const metadata = await readJSON("template.json");
if (metadata.profile !== "template") {
  throw new Error(
    "Instantiate only a fresh template, never an existing project",
  );
}
const { architecture, files } = profiles[profile];
const pkg = await readJSON("package.json");
pkg.name = name;
pkg.version = "0.1.0";
pkg.description = `${name}: ${profile} project`;
delete pkg.author;
for (const script of ["instantiate", "verify:template", "test:profiles"])
  delete pkg.scripts[script];
pkg.scripts.check = pkg.scripts.check.replace("npm run test:profiles && ", "");
if (profile === "ts-library") {
  pkg.exports = {
    ".": { types: "./dist/index.d.ts", import: "./dist/index.js" },
  };
  pkg.files = ["dist"];
}
if (profile === "node-cli") pkg.bin = { [name]: "dist/entrypoints/cli.js" };

const tsconfig = await readJSON("tsconfig.json");
if (architecture === "layered") tsconfig.compilerOptions.types = ["node"];
if (profile === "web") {
  Object.assign(tsconfig.compilerOptions, {
    module: "ESNext",
    moduleResolution: "Bundler",
    jsx: "preserve",
    lib: ["ES2023", "DOM", "DOM.Iterable"],
    types: [],
  });
}
await rm(new URL("src", root), { recursive: true });
for (const [path, text] of Object.entries(files))
  await write(path, text.replaceAll("{{PROJECT_NAME}}", name));
await writeJSON("tsconfig.json", tsconfig);
await write("AGENTS.md", projectContract(name, architecture));
await write("README.md", projectReadme(name, profile, architecture));
await write(
  "dependency-cruiser.cjs",
  `const { createDependencyConfig } = require("./tools/dependency-policy.cjs");\nmodule.exports = createDependencyConfig({ root: __dirname, architecture: "${architecture}" });\n`,
);
const lock = await readJSON("package-lock.json");
lock.name = name;
lock.version = pkg.version;
lock.packages[""].name = name;
lock.packages[""].version = pkg.version;
if (pkg.bin) lock.packages[""].bin = pkg.bin;
await writeJSON("package.json", pkg);
await writeJSON("package-lock.json", lock);
await writeJSON("template.json", {
  ...metadata,
  profile,
  architecture,
  projectName: name,
});
// Remove only known template-owned development artifacts in this fresh copy.
for (const path of templateOnlyPaths) {
  await rm(new URL(path, root), { recursive: true, force: true });
}
console.log(
  `Instantiated ${name} (${profile}, ${architecture}); template ${metadata.version}.`,
);
console.log("Run npm ci, npm run hooks:install, then npm run check.");

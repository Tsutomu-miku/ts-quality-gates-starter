import { readFile, writeFile, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { format } from "prettier";

const root = new URL("../", import.meta.url);
if (fileURLToPath(root).replace(/\/$/, "") !== process.cwd()) {
  throw new Error("Run instantiate from the copied template root");
}
const { values } = parseArgs({
  options: { name: { type: "string" }, type: { type: "string" } },
});
const profiles = ["ts-library", "mcp-service", "web", "node-cli"];
const name = values.name;
const profile = values.type;
if (!name || !/^[a-z][a-z0-9-]{0,79}$/.test(name)) {
  throw new Error("Use --name with a lowercase unscoped package name");
}
if (!profiles.includes(profile)) {
  throw new Error(`Use --type ${profiles.join("|")}`);
}
const readJSON = async (path) =>
  JSON.parse(await readFile(new URL(path, root)));
const writeJSON = async (path, value) =>
  writeFile(
    new URL(path, root),
    await format(JSON.stringify(value), {
      filepath: fileURLToPath(new URL(path, root)),
    }),
  );
const metadata = await readJSON("template.json");
if (metadata.profile !== "canonical") {
  throw new Error("Already instantiated; do not run over an existing project");
}

const pkg = await readJSON("package.json");
pkg.name = name;
pkg.version = "0.1.0";
pkg.description = `${name}: ${profile} project`;
delete pkg.author;
if (["ts-library", "web"].includes(profile)) {
  for (const layer of ["adapters", "infra", "transport", "entrypoints"]) {
    await rm(new URL(`src/${layer}`, root), { recursive: true });
  }
}
if (profile === "ts-library") {
  pkg.exports = {
    ".": { types: "./dist/index.d.ts", import: "./dist/index.js" },
  };
  pkg.files = ["dist"];
}
if (profile === "web") {
  const tsconfig = await readJSON("tsconfig.json");
  Object.assign(tsconfig.compilerOptions, {
    module: "ESNext",
    moduleResolution: "Bundler",
    lib: ["ES2023", "DOM", "DOM.Iterable"],
    types: [],
  });
  await writeJSON("tsconfig.json", tsconfig);
}
if (profile === "node-cli") {
  pkg.bin = { [name]: "dist/entrypoints/cli.js" };
  await writeFile(
    new URL("src/entrypoints/cli.ts", root),
    '#!/usr/bin/env node\nimport { writeNote } from "./main.js";\n\n' +
      "const [file, text] = process.argv.slice(2);\n" +
      'if (!file || !text) throw new Error("Usage: <command> <file> <text>");\n' +
      "await writeNote(file, text);\n",
  );
}
// MCP keeps a transport boundary but deliberately installs no SDK or server.
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
  projectName: name,
});
const agents = new URL("AGENTS.md", root);
await writeFile(
  agents,
  (await readFile(agents, "utf8")).replaceAll("{{PROJECT_NAME}}", name),
);
console.log(`Instantiated ${name} (${profile}); template ${metadata.version}.`);
console.log("Run npm ci, npm run hooks:install, then npm run check.");

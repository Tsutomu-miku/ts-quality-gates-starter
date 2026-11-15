import { cp, mkdtemp, readdir, symlink, rm } from "node:fs/promises";
import { basename, join, relative } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

export const templateRoot = fileURLToPath(new URL("../", import.meta.url));
const excluded = new Set([
  ".git",
  "node_modules",
  "dist",
  "test-results",
  ".DS_Store",
]);
export async function copyTemplate(target) {
  await cp(templateRoot, target, {
    recursive: true,
    filter: (path) =>
      !excluded.has(basename(path)) &&
      !relative(templateRoot, path).startsWith("docs/evidence"),
  });
}

export async function withProfile(profile, inspect) {
  const root = await mkdtemp(join(tmpdir(), `profile-${profile}-`));
  try {
    await copyTemplate(root);
    // Share only the installed toolchain for fast output-contract regression tests.
    // Full verification separately runs real public npm ci for every profile.
    await symlink(
      join(templateRoot, "node_modules"),
      join(root, "node_modules"),
      "dir",
    );
    const result = spawnSync(
      process.execPath,
      ["tools/instantiate.mjs", "--name", "sample-project", "--type", profile],
      { cwd: root, encoding: "utf8" },
    );
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(result.stdout + result.stderr);
    return await inspect(root);
  } finally {
    await rm(root, { recursive: true });
  }
}

export async function projectFiles(root, prefix = "") {
  const files = [];
  for (const entry of await readdir(join(root, prefix), {
    withFileTypes: true,
  })) {
    if (excluded.has(entry.name)) continue;
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...(await projectFiles(root, path)));
    else if (entry.isFile()) files.push(path);
  }
  return files.sort();
}

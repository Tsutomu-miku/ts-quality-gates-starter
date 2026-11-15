import { mkdtemp, mkdir, writeFile, copyFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const cli = fileURLToPath(
  new URL(
    "../node_modules/dependency-cruiser/bin/dependency-cruiser.mjs",
    import.meta.url,
  ),
);
const configuration = new URL("../dependency-cruiser.cjs", import.meta.url);
export async function checkDependencies(files) {
  const directory = await mkdtemp(join(tmpdir(), "policy-fixture-"));
  try {
    await copyFile(configuration, join(directory, "dependency-cruiser.cjs"));
    await writeFile(
      join(directory, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: {
          target: "ES2023",
          module: "NodeNext",
          moduleResolution: "NodeNext",
          strict: true,
        },
      }),
    );
    for (const [path, content] of Object.entries(files)) {
      await mkdir(join(directory, path, ".."), { recursive: true });
      await writeFile(join(directory, path), content);
    }
    return spawnSync(
      process.execPath,
      [
        cli,
        "--config",
        "dependency-cruiser.cjs",
        "src",
        "--output-type",
        "err",
      ],
      { cwd: directory, encoding: "utf8" },
    );
  } finally {
    await rm(directory, { recursive: true });
  }
}

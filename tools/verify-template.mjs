import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir, homedir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { parseArgs } from "node:util";
import {
  copyTemplate,
  projectFiles,
  templateRoot,
} from "./profile-fixture.mjs";

const { values } = parseArgs({
  options: { evidence: { type: "string" }, scratch: { type: "string" } },
});
const evidence = resolve(
  values.evidence || "test-results/template-verification",
);
await mkdir(evidence, { recursive: true });
const sandbox = await mkdtemp(
  join(values.scratch || tmpdir(), "ts-quality-verification-"),
);
const clean = (text) =>
  text
    .replaceAll(sandbox, "<sandbox>")
    .replaceAll(templateRoot, "<template>/")
    .replaceAll(homedir(), "<home>");
const results = [];
async function run(project, id, executable, args, expected = 0, marker) {
  const result = spawnSync(executable, args, {
    cwd: project,
    encoding: "utf8",
    env: { ...process.env, npm_config_registry: "https://registry.npmjs.org/" },
  });
  if (result.error) throw result.error;
  const output = clean(result.stdout + result.stderr);
  const record = {
    id,
    command: [
      executable === process.execPath ? "node" : executable,
      ...args.map(clean),
    ],
    expected,
    exit: result.status,
  };
  results.push(record);
  await writeFile(join(evidence, `${id}.txt`), output.trimEnd() + "\n");
  console.log(`${id}: exit ${result.status} (expected ${expected})`);
  assert.equal(result.status, expected, output);
  if (marker) assert.ok(output.includes(marker), output);
}

const artifacts = {};
try {
  for (const profile of ["ts-library", "web", "node-cli", "mcp-service"]) {
    const project = join(sandbox, profile);
    await copyTemplate(project);
    const cache = join(sandbox, `${profile}-npm-cache`);
    await run(project, `${profile}-bootstrap-ci`, "npm", [
      "ci",
      "--registry=https://registry.npmjs.org",
      "--cache",
      cache,
    ]);
    await run(project, `${profile}-instantiate`, process.execPath, [
      "tools/instantiate.mjs",
      "--name",
      "quality-probe",
      "--type",
      profile,
    ]);
    // Run the final package/lock through npm ci too, in its own clean directory.
    await run(project, `${profile}-npm-ci`, "npm", [
      "ci",
      "--registry=https://registry.npmjs.org",
      "--cache",
      cache,
    ]);
    const paths = await projectFiles(project);
    const metadata = JSON.parse(
      await readFile(join(project, "template.json"), "utf8"),
    );
    for (const path of paths)
      assert.doesNotMatch(
        await readFile(join(project, path), "utf8"),
        /\bnote\b|saveNote|NoteWriter|file-note/i,
        path,
      );
    artifacts[profile] = { architecture: metadata.architecture, files: paths };
    await run(project, `${profile}-initial-green`, "npm", ["run", "check"]);
    await run(project, `${profile}-git-init`, "git", [
      "init",
      "--initial-branch=main",
    ]);
    await run(project, `${profile}-install-hooks`, "npm", [
      "run",
      "hooks:install",
    ]);
    if (profile === "ts-library") {
      await run(
        project,
        "hook-path",
        "git",
        ["config", "--get", "core.hooksPath"],
        0,
        ".githooks",
      );
      await run(project, "hook-green", process.execPath, [
        ".githooks/pre-push",
      ]);
    }
    const boundary =
      metadata.architecture === "flat"
        ? {
            id: "source-test-boundary",
            marker: "production-not-tests",
            files: {
              "test/negative-fixture.d.ts":
                "export declare const fixture: number;\n",
              "src/negative-probe.ts":
                'import type { fixture } from "../test/negative-fixture.d.ts";\nexport type Misplaced = typeof fixture;\n',
            },
          }
        : {
            id: "domain-io",
            marker: "domain-is-pure",
            files: {
              "src/domain/negative-probe.ts":
                'import { readFile } from "node:fs/promises";\nexport { readFile };\n',
            },
          };
    const negatives = [
      {
        id: "empty-catch",
        marker: "policy/no-silent-catch",
        files: {
          "src/negative-probe.ts":
            'export function probe() {\n  try {\n    throw new Error("probe");\n  } catch {}\n}\n',
        },
      },
      {
        id: "over-300-lines",
        marker: "max-lines",
        files: { "src/negative-probe.ts": "// physical line\n".repeat(301) },
      },
      boundary,
    ];
    for (const probe of negatives) {
      for (const [path, text] of Object.entries(probe.files))
        await writeFile(join(project, path), text);
      try {
        await run(
          project,
          `${profile}-${probe.id}`,
          "npm",
          ["run", "check"],
          1,
          probe.marker,
        );
        if (profile === "ts-library" && probe.id === "empty-catch") {
          await run(
            project,
            "hook-rejects",
            process.execPath,
            [".githooks/pre-push"],
            1,
            probe.marker,
          );
        }
      } finally {
        for (const path of Object.keys(probe.files))
          await rm(join(project, path));
      }
    }
    await rm(join(project, "dist"), { recursive: true });
    await run(project, `${profile}-restored-green`, "npm", ["run", "check"]);
  }
  const metadata = JSON.parse(
    await readFile(join(templateRoot, "template.json"), "utf8"),
  );
  await writeFile(
    join(evidence, "summary.json"),
    JSON.stringify(
      {
        templateVersion: metadata.version,
        node: process.version,
        registry: "https://registry.npmjs.org/",
        freshCachePerProfile: true,
        artifacts,
        results,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(`Evidence saved to ${clean(evidence)}`);
} finally {
  await rm(sandbox, { recursive: true });
}

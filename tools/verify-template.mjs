import assert from "node:assert/strict";
import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile,
} from "node:fs/promises";
import { createHash } from "node:crypto";
import { tmpdir, homedir } from "node:os";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { parseArgs } from "node:util";

const source = fileURLToPath(new URL("../", import.meta.url));
const { values } = parseArgs({ options: { evidence: { type: "string" } } });
const evidence = resolve(
  values.evidence || "test-results/template-verification",
);
await mkdir(evidence, { recursive: true });
const sandbox = await mkdtemp(join(tmpdir(), "ts-quality-verification-"));
const project = join(sandbox, "project");
const ignored = new Set([
  ".git",
  "node_modules",
  "dist",
  "test-results",
  ".DS_Store",
]);
const sanitize = (text) =>
  text
    .replaceAll(sandbox, "<sandbox>")
    .replaceAll(source, "<template>/")
    .replaceAll(homedir(), "<home>");
const results = [];
function run(id, executable, args, expected = 0, marker) {
  const result = spawnSync(executable, args, {
    cwd: project,
    encoding: "utf8",
    env: { ...process.env, npm_config_registry: "https://registry.npmjs.org/" },
  });
  if (result.error) throw result.error;
  const output = sanitize(result.stdout + result.stderr);
  const record = {
    id,
    command: [
      executable === process.execPath ? "node" : executable,
      ...args.map(sanitize),
    ],
    expected,
    exit: result.status,
  };
  results.push(record);
  console.log(`${id}: exit ${result.status} (expected ${expected})`);
  return { record, output, marker };
}
async function save(result) {
  await writeFile(
    join(evidence, `${result.record.id}.txt`),
    result.output.trimEnd() + "\n",
  );
  assert.equal(result.record.exit, result.record.expected, result.output);
  if (result.marker)
    assert.ok(result.output.includes(result.marker), result.output);
}
try {
  await cp(source, project, {
    recursive: true,
    filter: (path) => !ignored.has(basename(path)),
  });
  await save(
    run("bootstrap-npm-ci", "npm", [
      "ci",
      "--registry=https://registry.npmjs.org",
      "--cache",
      join(sandbox, "bootstrap-cache"),
    ]),
  );
  await save(
    run("instantiate", process.execPath, [
      "tools/instantiate.mjs",
      "--name",
      "quality-probe",
      "--type",
      "node-cli",
    ]),
  );
  // A new empty cache proves installation used the public registry, not local packages.
  await save(
    run("npm-ci", "npm", [
      "ci",
      "--registry=https://registry.npmjs.org",
      "--cache",
      join(sandbox, "npm-cache"),
    ]),
  );
  await save(run("initial-green", "npm", ["run", "check"]));
  await save(run("git-init", "git", ["init", "--initial-branch=main"]));
  await save(run("install-hooks", "npm", ["run", "hooks:install"]));
  await save(
    run(
      "hook-path",
      "git",
      ["config", "--get", "core.hooksPath"],
      0,
      ".githooks",
    ),
  );
  await save(run("hook-green", process.execPath, [".githooks/pre-push"]));
  const auditTarget = join(sandbox, "audit-target");
  await mkdir(join(auditTarget, "src/domain"), { recursive: true });
  const auditFile = join(auditTarget, "src/domain/probe.ts");
  await writeFile(
    auditFile,
    'import { readFile } from "node:fs/promises";\ntry { readFile("x"); } catch {}\nprocess.platform;\n' +
      "// physical line\n".repeat(301),
  );
  const hash = async () =>
    createHash("sha256")
      .update(await readFile(auditFile))
      .digest("hex");
  const beforeHash = await hash();
  const beforePaths = await readdir(auditTarget, { recursive: true });
  const audited = run("harden-readonly-audit", process.execPath, [
    "tools/audit-project.mjs",
    auditTarget,
  ]);
  await save(audited);
  const report = JSON.parse(audited.output);
  assert.equal(report.longFiles.length, 1);
  assert.ok(
    report.policyFindings.some(
      (item) => item.rule === "policy/no-silent-catch",
    ),
  );
  assert.ok(
    report.policyFindings.some((item) => item.rule === "no-restricted-syntax"),
  );
  assert.equal(report.importCandidates[0].from, "domain");
  assert.equal(await hash(), beforeHash);
  assert.deepEqual(
    await readdir(auditTarget, { recursive: true }),
    beforePaths,
  );
  const negatives = [
    {
      id: "empty-catch",
      path: "src/negative-probe.ts",
      code: 'export function probe() {\n  try {\n    throw new Error("probe");\n  } catch {}\n}\n',
      marker: "policy/no-silent-catch",
    },
    {
      id: "over-300-lines",
      path: "src/negative-probe.ts",
      code: "// physical line\n".repeat(301),
      marker: "max-lines",
    },
    {
      id: "domain-io",
      path: "src/domain/negative-probe.ts",
      code: 'import { readFile } from "node:fs/promises";\nexport { readFile };\n',
      marker: "domain-is-pure",
    },
  ];
  for (const probe of negatives) {
    const file = join(project, probe.path);
    await writeFile(file, probe.code);
    try {
      await save(run(probe.id, "npm", ["run", "check"], 1, probe.marker));
      if (probe.id === "empty-catch") {
        await save(
          run(
            "hook-rejects",
            process.execPath,
            [".githooks/pre-push"],
            1,
            probe.marker,
          ),
        );
      }
    } finally {
      await rm(file);
    }
  }
  await save(run("restored-green", "npm", ["run", "check"]));
  // Exercise every supported trim profile against the same installed toolchain.
  for (const profile of ["ts-library", "mcp-service", "web"]) {
    await rm(join(project, "src"), { recursive: true });
    await rm(join(project, "dist"), { recursive: true });
    for (const path of [
      "src",
      "AGENTS.md",
      "template.json",
      "tsconfig.json",
      "package.json",
      "package-lock.json",
    ]) {
      await cp(join(source, path), join(project, path), { recursive: true });
    }
    await save(
      run(`instantiate-${profile}`, process.execPath, [
        "tools/instantiate.mjs",
        "--name",
        "quality-probe",
        "--type",
        profile,
      ]),
    );
    await save(run(`check-${profile}`, "npm", ["run", "check"]));
  }
  const metadata = JSON.parse(
    await readFile(join(source, "template.json"), "utf8"),
  );
  const summary = {
    templateVersion: metadata.version,
    node: process.version,
    registry: "https://registry.npmjs.org/",
    freshCache: true,
    results,
  };
  await writeFile(
    join(evidence, "summary.json"),
    JSON.stringify(summary, null, 2) + "\n",
  );
  console.log(`Evidence saved to ${sanitize(evidence)}`);
} finally {
  await rm(sandbox, { recursive: true });
}

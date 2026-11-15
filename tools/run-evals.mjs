import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { ESLint } from "eslint";
import probes from "../quality/eval-probes.mjs";
import { checkDependencies } from "./dependency-fixture.mjs";

const eslint = new ESLint();
const lint = async (code) =>
  (await eslint.lintText(code, { filePath: "src/evaluation.ts" }))[0];
const results = [];
for (const probe of probes) {
  const bad = await lint(probe.bad);
  const good = await lint(probe.good);
  const hits = [...new Set(bad.messages.map((m) => m.ruleId))];
  assert.deepEqual(hits.sort(), [...probe.rules].sort(), probe.id);
  assert.equal(good.errorCount + good.warningCount, 0, probe.id);
  if (probe.badDependencies) {
    const rejected = await checkDependencies(probe.badDependencies);
    assert.equal(rejected.status, 1, rejected.stdout + rejected.stderr);
    assert.ok(
      (rejected.stdout + rejected.stderr).includes(probe.dependencyRule),
    );
    const accepted = await checkDependencies(probe.goodDependencies);
    assert.equal(accepted.status, 0, accepted.stdout + accepted.stderr);
    hits.push(probe.dependencyRule);
  }
  results.push({
    id: probe.id,
    hits,
    legalCodeAccepted: true,
    review: probe.review,
  });
  console.log(
    `${probe.id}: ${hits.join(", ") || "semantic review required"}; legal probe accepted`,
  );
}
await mkdir("test-results", { recursive: true });
await writeFile(
  "test-results/quality-evals.json",
  JSON.stringify(
    {
      kind: "deterministic paired probes, not model-generated implementations",
      cases: results.length,
      machineDetected: results.filter((r) => r.hits.length).length,
      semanticOnly: results.filter((r) => !r.hits.length).length,
      results,
    },
    null,
    2,
  ) + "\n",
);

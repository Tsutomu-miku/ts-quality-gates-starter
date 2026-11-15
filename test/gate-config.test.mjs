import { test } from "node:test";
import assert from "node:assert/strict";
import { ESLint } from "eslint";
import { spawnSync } from "node:child_process";

const eslint = new ESLint();
const lint = async (code, filePath = "src/evaluation.ts") =>
  (await eslint.lintText(code, { filePath }))[0];

test("platform reads and runtime imports are confined to one boundary", async () => {
  for (const code of [
    "process.platform",
    "process['platform']",
    "const { platform } = process",
    "import { platform } from 'node:os'; platform()",
    "import runtime from 'node:process'; runtime.platform",
  ]) {
    assert.ok((await lint(code)).errorCount > 0);
    assert.equal(
      (await lint(code, "src/infra/platform-boundary.ts")).errorCount,
      0,
    );
  }
});

test("300 physical lines pass, 301 warn, and the real lint CLI rejects warnings", async () => {
  assert.equal((await lint("// line\n".repeat(300))).warningCount, 0);
  const oversized = "// line\n".repeat(301);
  const result = await lint(oversized);
  assert.equal(result.errorCount, 0);
  assert.equal(result.warningCount, 1);
  assert.equal(result.messages[0].ruleId, "max-lines");
  const cli = spawnSync(
    process.execPath,
    [
      "node_modules/eslint/bin/eslint.js",
      "--stdin",
      "--stdin-filename",
      "src/evaluation.ts",
      "--max-warnings",
      "0",
    ],
    { input: oversized, encoding: "utf8" },
  );
  assert.equal(cli.status, 1, cli.stdout + cli.stderr);
  assert.match(cli.stdout + cli.stderr, /max-lines/);
});

test("empty and comment-only catches fail; inline disables do not bypass policy", async () => {
  for (const code of [
    "try { task() } catch {}",
    "try { task() } catch { /* ignored */ }",
    "/* eslint-disable */\ntry { task() } catch {}",
    "task().catch(() => {})",
  ])
    assert.ok((await lint(code)).errorCount > 0);
});

test("known optional absence with rethrow is legal; arbitrary empty result fails", async () => {
  const bad = await lint(
    "async function read() { try { return await load() } catch { return {} } }",
  );
  assert.ok(bad.errorCount > 0);
  const good = await lint(
    "async function read() { try { return await load() } catch(e) { if((e as NodeJS.ErrnoException).code === 'ENOENT') return undefined; throw e } }",
  );
  assert.equal(good.errorCount + good.warningCount, 0);
});

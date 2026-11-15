import { test } from "node:test";
import assert from "node:assert/strict";
import { checkDependencies as check } from "../tools/dependency-fixture.mjs";

async function rejected(files, rule) {
  const result = await check(files);
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.ok((result.stdout + result.stderr).includes(rule), rule);
}

test("session consumes domain and its own port", async () => {
  const result = await check({
    "src/domain/note.ts": "export const note = 'text';",
    "src/session/save.ts":
      "import { note } from '../domain/note.js'; export { note };",
  });
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

test("domain cannot import built-in I/O", async () => {
  await rejected(
    {
      "src/domain/note.ts":
        "import { readFile } from 'node:fs/promises'; export { readFile };",
    },
    "domain-is-pure",
  );
});

test("session cannot import adapter values or types", async () => {
  for (const specifier of ["import", "import type"]) {
    await rejected(
      {
        "src/adapters/io.ts": "export class IO {}",
        "src/session/save.ts": `${specifier} { IO } from '../adapters/io.js'; export type Writer = IO;`,
      },
      "session-no-concrete-io",
    );
  }
});

test("session cannot own concrete filesystem I/O", async () => {
  await rejected(
    {
      "src/session/save.ts":
        "import { writeFile } from 'node:fs/promises'; export { writeFile };",
    },
    "session-no-concrete-io",
  );
});

test("production cannot consume fixtures", async () => {
  await rejected(
    {
      "test/fixture.ts": "export const fixture = 1;",
      "src/entrypoints/main.ts":
        "import { fixture } from '../../test/fixture.js'; export { fixture };",
    },
    "production-not-tests",
  );
});

test("cycles and unresolved imports fail", async () => {
  await rejected(
    {
      "src/a.ts": "import { b } from './b.js'; export const a = () => b;",
      "src/b.ts": "import { a } from './a.js'; export const b = () => a;",
    },
    "no-cycles",
  );
  await rejected({ "src/a.ts": "import './missing.js';" }, "no-unresolved");
});

test("transport and infra cannot perform adapter composition", async () => {
  await rejected(
    {
      "src/adapters/io.ts": "export const io = 1;",
      "src/transport/request.ts":
        "import { io } from '../adapters/io.js'; export { io };",
    },
    "transport-does-not-wire-adapters",
  );
  await rejected(
    {
      "src/session/save.ts": "export const save = 1;",
      "src/infra/io.ts":
        "import { save } from '../session/save.js'; export { save };",
    },
    "infra-does-not-orchestrate",
  );
});

test("entrypoint composes adapters without inward dependencies", async () => {
  const files = {
    "src/adapters/io.ts": "export const io = 1;",
    "src/entrypoints/main.ts":
      "import { io } from '../adapters/io.js'; export { io };",
  };
  const result = await check(files);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  await rejected(
    {
      ...files,
      "src/adapters/inward.ts":
        "import { io } from '../entrypoints/main.js'; export { io };",
    },
    "only-entrypoints-compose",
  );
});

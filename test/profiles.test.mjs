import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { withProfile, projectFiles } from "../tools/profile-fixture.mjs";

const snapshot = JSON.parse(
  await readFile(new URL("./snapshots/profiles.json", import.meta.url), "utf8"),
);
function rules(root) {
  const result = spawnSync(
    process.execPath,
    [
      "-e",
      "console.log(JSON.stringify(require('./dependency-cruiser.cjs').forbidden.map(rule => rule.name)))",
    ],
    { cwd: root, encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

for (const [profile, expected] of Object.entries(snapshot.profiles)) {
  test(`${profile}: exact generated project snapshot, no teaching business or speculative layers`, async () => {
    await withProfile(profile, async (root) => {
      const paths = await projectFiles(root);
      assert.deepEqual(
        paths,
        [...snapshot.commonFiles, ...expected.extraFiles].sort(),
      );
      for (const path of paths) {
        const text = await readFile(join(root, path), "utf8");
        assert.doesNotMatch(
          text,
          /\bnote\b|saveNote|NoteWriter|file-note/i,
          path,
        );
      }
      for (const path of paths.filter((path) => path.startsWith("src/"))) {
        assert.equal(
          await readFile(join(root, path), "utf8"),
          path.endsWith("/cli.ts")
            ? "#!/usr/bin/env node\nexport {};\n"
            : "export {};\n",
        );
      }
      const agents = await readFile(join(root, "AGENTS.md"), "utf8");
      if (expected.architecture === "flat") {
        assert.doesNotMatch(
          agents,
          /\bdomain\b|\bsession\b|\btransport\b|\bentrypoints?\b|platform-boundary|## Lifecycle/i,
        );
      } else {
        assert.match(agents, /## Lifecycle ownership/);
        assert.match(agents, /platform-boundary/);
      }
      const metadata = JSON.parse(
        await readFile(join(root, "template.json"), "utf8"),
      );
      assert.equal(metadata.profile, profile);
      assert.equal(metadata.architecture, expected.architecture);
      assert.deepEqual(
        rules(root).sort(),
        [
          ...snapshot.baseRules,
          ...(expected.architecture === "layered" ? snapshot.layerRules : []),
        ].sort(),
      );
      const pkg = JSON.parse(
        await readFile(join(root, "package.json"), "utf8"),
      );
      assert.equal(pkg.scripts["test:profiles"], undefined);
      assert.equal(pkg.scripts.instantiate, undefined);
      assert.equal(pkg.private, true);
      if (profile === "web") {
        assert.match(
          await readFile(join(root, "index.html"), "utf8"),
          /<title>sample-project<\/title>/,
        );
      }
    });
  });
}

test("a real domain directory opts a flat library into only that layer's constraints", async () => {
  await withProfile("ts-library", async (root) => {
    await mkdir(join(root, "src/domain"));
    await writeFile(join(root, "src/domain/index.ts"), "export {};\n");
    assert.deepEqual(
      rules(root).sort(),
      [...snapshot.baseRules, "domain-is-pure"].sort(),
    );
  });
});

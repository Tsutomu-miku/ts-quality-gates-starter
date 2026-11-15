const emptyModule = "export {};\n";
const layered = Object.fromEntries(
  ["domain", "session", "infra", "adapters", "transport"].map((layer) => [
    `src/${layer}/index.ts`,
    emptyModule,
  ]),
);

export const profiles = {
  "ts-library": {
    architecture: "flat",
    files: { "src/index.ts": emptyModule },
  },
  web: {
    architecture: "flat",
    files: {
      "src/index.ts": emptyModule,
      "index.html": `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{PROJECT_NAME}}</title>
  </head>
  <body>
    <main id="app"><h1>{{PROJECT_NAME}}</h1></main>
    <script type="module" src="./dist/index.js"></script>
  </body>
</html>
`,
    },
  },
  "node-cli": {
    architecture: "layered",
    files: {
      "src/index.ts": emptyModule,
      ...layered,
      "src/entrypoints/cli.ts": "#!/usr/bin/env node\nexport {};\n",
    },
  },
  "mcp-service": {
    architecture: "layered",
    files: {
      "src/index.ts": emptyModule,
      ...layered,
      "src/entrypoints/main.ts": emptyModule,
    },
  },
};

// These belong to template development, not to a generated application.
export const templateOnlyPaths = [
  "docs",
  "examples",
  "skills",
  "dist",
  "test-results",
  "test/profiles.test.mjs",
  "test/snapshots",
  "tools/instantiate.mjs",
  "tools/project-profiles.mjs",
  "tools/project-contract.mjs",
  "tools/profile-fixture.mjs",
  "tools/verify-template.mjs",
  "tools/audit-project.mjs",
];

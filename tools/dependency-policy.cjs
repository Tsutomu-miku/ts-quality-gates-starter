const { readdirSync } = require("node:fs");
const { join } = require("node:path");

const layerNames = [
  "domain",
  "session",
  "infra",
  "adapters",
  "transport",
  "entrypoints",
];

function activeLayers({ root, architecture }) {
  if (architecture === "layered") return layerNames;
  if (architecture !== "flat")
    throw new Error(`Unknown architecture: ${architecture}`);
  // A flat project has no speculative layers. Real directories opt into their
  // matching constraints when the application grows; no file moves are needed.
  return readdirSync(join(root, "src"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && layerNames.includes(entry.name))
    .map((entry) => entry.name);
}

const rule = (name, from, to) => ({ name, severity: "error", from, to });
const baseRules = () => [
  rule("no-cycles", { path: "^src/" }, { circular: true }),
  rule("no-unresolved", { path: "^src/" }, { couldNotResolve: true }),
  rule(
    "production-not-tests",
    { path: "^src/" },
    { path: "^(test|examples|fixtures)/" },
  ),
  rule(
    "no-dev-dependency-in-production",
    { path: "^src/" },
    {
      dependencyTypes: ["npm-dev"],
      dependencyTypesNot: ["type-only"],
    },
  ),
];
const layerRules = {
  domain: rule(
    "domain-is-pure",
    { path: "^src/domain/" },
    { pathNot: "^src/domain/" },
  ),
  session: rule(
    "session-no-concrete-io",
    { path: "^src/session/" },
    { pathNot: "^src/(domain|session)/" },
  ),
  infra: rule(
    "infra-does-not-orchestrate",
    { path: "^src/infra/" },
    { path: "^src/(session|adapters|transport|entrypoints)/" },
  ),
  transport: rule(
    "transport-does-not-wire-adapters",
    { path: "^src/transport/" },
    { path: "^src/(adapters|infra)/" },
  ),
  adapters: rule(
    "adapters-do-not-call-transport",
    { path: "^src/adapters/" },
    { path: "^src/transport/" },
  ),
};

function createDependencyConfig(selection) {
  const layers = activeLayers(selection);
  const forbidden = [
    ...baseRules(),
    ...layers
      .filter((layer) => layerRules[layer])
      .map((layer) => layerRules[layer]),
  ];
  const inward = layers.filter((layer) => layer !== "entrypoints");
  if (inward.length && layers.includes("entrypoints")) {
    forbidden.push(
      rule(
        "only-entrypoints-compose",
        {
          path: `^src/(${inward.join("|")})/`,
        },
        { path: "^src/(entrypoints/|index\\.ts$)" },
      ),
    );
  }
  return {
    forbidden,
    options: {
      doNotFollow: { path: "node_modules" },
      tsPreCompilationDeps: true,
      tsConfig: { fileName: "tsconfig.json" },
      enhancedResolveOptions: {
        extensions: [".js", ".ts", ".tsx", ".json"],
        exportsFields: ["exports"],
        conditionNames: ["import", "node", "default"],
      },
    },
  };
}

module.exports = { activeLayers, createDependencyConfig };

// Layer names are a preset: adapt paths to real owners in an existing project.
module.exports = {
  forbidden: [
    {
      name: "no-cycles",
      severity: "error",
      from: { path: "^src/" },
      to: { circular: true },
    },
    {
      name: "no-unresolved",
      severity: "error",
      from: { path: "^src/" },
      to: { couldNotResolve: true },
    },
    {
      name: "production-not-tests",
      severity: "error",
      from: { path: "^src/" },
      to: { path: "^(test|examples|fixtures)/" },
    },
    {
      name: "domain-is-pure",
      severity: "error",
      from: { path: "^src/domain/" },
      to: { pathNot: "^src/domain/" },
    },
    {
      name: "session-no-concrete-io",
      severity: "error",
      from: { path: "^src/session/" },
      // Session dependencies are explicit: domain and session-owned ports only.
      to: { pathNot: "^src/(domain|session)/" },
    },
    {
      name: "infra-does-not-orchestrate",
      severity: "error",
      from: { path: "^src/infra/" },
      to: { path: "^src/(session|adapters|transport|entrypoints)/" },
    },
    {
      name: "transport-does-not-wire-adapters",
      severity: "error",
      from: { path: "^src/transport/" },
      to: { path: "^src/(adapters|infra)/" },
    },
    {
      name: "adapters-do-not-call-transport",
      severity: "error",
      from: { path: "^src/adapters/" },
      to: { path: "^src/transport/" },
    },
    {
      name: "only-entrypoints-compose",
      severity: "error",
      from: { path: "^src/(domain|session|adapters|infra|transport)/" },
      to: { path: "^src/(entrypoints/|index\\.ts$)" },
    },
    {
      name: "no-dev-dependency-in-production",
      severity: "error",
      from: { path: "^src/" },
      to: { dependencyTypes: ["npm-dev"], dependencyTypesNot: ["type-only"] },
    },
  ],
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

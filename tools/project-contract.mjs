export function projectContract(name, architecture) {
  const common = `# ${name} repository contract

## Responsibility and size

One module owns one business responsibility and its invariants. Production TS/TSX
files have at most **300 physical lines**, including comments and blanks. Split
by state ownership, side effects and reasons to change; never compress statements
or add forwarding helpers to satisfy a counter.

- Good: a parser owns input validation; its consumer owns the operation's rules.
- Bad: one file mixes argument parsing, validation, persistence and unrelated jobs.

ESLint warns at 301 lines; lint uses --max-warnings 0, so every warning fails.
No inline disables or inherited size exemptions.

## Observable failure

Prefer throwing to fabricated success. Follow the producer → transform → storage
→ consumer chain and fix the first broken contract. Empty/comment-only catches,
empty Promise handlers, arbitrary empty fallbacks and invented defaults for
required internal values are forbidden. Logging then returning success is also
forbidden. Clean up in finally; map errors at the outer interaction boundary.

Good: an optional file's documented ENOENT returns undefined and all other errors
are rethrown. Bad: catch every read/parse failure and return an empty object.
Keep untrusted-input validation, authorization and documented absence handling.
Missing required internal fields must be fixed at their producer, not hidden by
more optional chaining and defaults downstream.

## One supported implementation

Do not add speculative platform/version dispatch, old/new field aliases, or
try-another-API-after-failure paths. Good: one implementation follows the current
contract. Bad: catch the failure and silently retry a legacy protocol.
Real published compatibility contracts require explicit boundary review and tests.
Do not branch on operating system/version inside business rules.

## Dependency boundaries

No cycles, unresolved imports, production imports of tests/examples/fixtures, or
runtime dev dependencies. Type-only development types perform no runtime I/O and
are allowed. Good: production consumes its own source module. Bad: production
imports a test fixture as its implementation. Keep dependencies flowing through
owned public capabilities, not private implementation paths.
`;
  const layered = `
## Selected architecture

This profile selects layered ownership. Keep unused modules empty until a real
capability needs them; never copy teaching examples into production.

| Layer | Owns / may depend on |
| --- | --- |
| domain | Pure rules; imports only domain code, no Node/SDK/network/disk I/O |
| session | Use cases and consumer-owned ports; domain/session code only |
| infra | Low-level runtime boundaries; no orchestration or concrete adapter |
| adapters | I/O implementations of the consumer's capability contract |
| transport | External input validation and injected capabilities |
| entrypoints | Composition and application startup |

Good: a use case consumes its own port, and composition creates the adapter.
Bad: domain imports filesystem I/O, or session imports a concrete adapter's types
or values. No low-level module imports composition or the package barrel inward.

Platform discovery is allowed only in src/infra/platform-boundary.ts. Create that
file only for a real runtime difference; never widen the exception to silence lint.

## Lifecycle ownership

One resource/lifecycle has one owner. The owner starts, cancels and closes it;
callers use public operations. Keep one authoritative queue, timer, map or snapshot.
Good: acquire once and close in finally. Bad: two interaction handlers start
timers and manually synchronize duplicate mutable maps for the same resource.
`;
  return (
    common +
    (architecture === "layered" ? layered : "") +
    `
## Checks and review

Use supported Node and npm (package.json), public npm access and the lockfile.
Run npm ci, npm run hooks:install once per Git checkout, then npm run check.
The pre-push hook and CI run build, typecheck, lint, dependency checks, three policy
suites, paired evals and formatting. Never bypass a failing gate.

Static gates detect explicit syntax/import patterns, not all semantic mistakes.
Review real contracts, error propagation, responsibility and resource ownership.
Preserve legitimate boundary validation, avoid unrelated refactors, and keep
credentials and private data out of commits.
`
  );
}

export function projectReadme(name, profile, architecture) {
  return `# ${name}

${profile} scaffold generated from ts-quality-gates-starter (see template.json).
The source is intentionally empty. Add only the capabilities this project needs.

Use supported Node/npm from package.json and public npm access. In this Git checkout:

\`\`\`console
npm ci --registry=https://registry.npmjs.org
npm run hooks:install
npm run check
\`\`\`

Read AGENTS.md for the contract. ${architecture === "flat" ? "Dependency gates start with four basic source/tooling boundaries; matching architectural rules activate only if their real directories are added." : "This profile explicitly selects layered ownership; composition belongs at the outer edge."}
${profile === "web" ? "Build with npm run build, then serve this directory over HTTP to load index.html and dist/index.js. No UI framework or bundler is installed." : ""}
${profile === "mcp-service" ? "No SDK, protocol implementation or running MCP server is installed." : ""}
${profile === "node-cli" ? "The executable entry is empty; implement your command before distributing it." : ""}

Quality gates do not replace application tests or security review. The pinned dev
toolchain's minimatch advisory remains documented in the source template's README
and verification evidence; npm audit is separate from npm run check.
`;
}

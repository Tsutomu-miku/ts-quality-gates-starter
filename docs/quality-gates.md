# Gate contract

The rules live in root `AGENTS.md`, `eslint.config.mjs`, `dependency-cruiser.cjs`
and `tools/policy-rules.mjs`. The bootstrap skill only selects, trims and explains
them. Keep modifications to rules and their paired probes together.

## Machine enforcement

- Production TS/TSX: empty catches (including comments), empty Promise handlers,
  and unconditional empty catch results (`undefined`, `null`, `{}`, `[]`, bare
  return) fail. An explicit throw in the handler permits known-error handling.
- A documented optional-file `ENOENT` branch returning `undefined`, followed by
  `throw error` for everything else, passes. Nested callback throws do not count.
- The policy is deliberately syntactic: a throw on an unrelated branch may pass;
  a log-and-success path, variable handler, custom thenable or invented nonempty
  default may escape it. Verify actual control flow and contract in review.
- Direct `process.platform`, computed literal access, destructuring and runtime
  imports from `os`/`process` fail outside `src/infra/platform-boundary.ts`. Alias
  chains and dynamic access need review. The boundary exemption does not disable
  catch or size rules. Add the file only when a real runtime difference exists.
- Every physical TS/TSX source line counts toward 300. Lint warns and exits 1
  because its warning budget is zero. There are no legacy-size exemptions.
- Dependency-cruiser rejects cycles, unresolved imports, domain → anything
  outside domain, session → anything outside domain/session, production →
  tests/examples/fixtures, inward composition imports and runtime dev tools.

## Layer presets

Domain is always pure. Session owns its consumed port types; adapters implement
those types. Entry points create concrete implementations. Transport validates
external inputs and receives capabilities. Infra supplies low-level runtime
operations. See the canonical `note` flow under `src/`.

Library/Web profiles trim Node I/O examples; unused layer rules remain dormant
and still protect a future layer added at those paths. MCP/CLI keep Node layers.
To rename or flatten layers, edit the paths in `dependency-cruiser.cjs` and the
corresponding fixtures together. Test the real alias/tsconfig layout too. Do not
delete a failing rule because a layer has a different name.

## Review enforcement

Single responsibility, absence semantics, one lifecycle/one owner, fabricated
success and unnecessary compatibility paths require independent review. The
paired deterministic evals include a semantic-only ownership example explicitly;
they are not model evaluations or a proof of production correctness.

This template abstracts generic MIT tooling from
[`cdp-browser-mcp@da1f984`](https://github.com/Tsutomu-miku/cdp-browser-mcp/commit/da1f984fd04f3c2e615f53eb7104973442bc96f3).
The provenance is limited to the generic rules, fixture pattern, hook and test
approach. Browser protocol policy, runtime, matrices and legacy debt are absent.

ESLint's [`max-lines`](https://eslint.org/docs/latest/rules/max-lines) counts
physical lines according to its configured options; its
[`--max-warnings`](https://eslint.org/docs/latest/use/command-line-interface#--max-warnings)
controls whether warnings fail the command. Both behaviors are tested here.

# {{PROJECT_NAME}} repository contract

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

## Checks and review

Use supported Node and npm (package.json), public npm access and the lockfile.
Run npm ci, npm run hooks:install once per Git checkout, then npm run check.
The pre-push hook and CI run build, typecheck, lint, dependency checks, three policy
suites, paired evals and formatting. Never bypass a failing gate.

Static gates detect explicit syntax/import patterns, not all semantic mistakes.
Review real contracts, error propagation, responsibility and resource ownership.
Preserve legitimate boundary validation, avoid unrelated refactors, and keep
credentials and private data out of commits.

## Template maintenance

Profile definitions own generated application shape; update their output snapshots with deliberate contract changes. Keep the canonical tutorial in examples, never in generated applications. Preserve universal policy gates across every profile.

# Gate contract

Rules live in generated AGENTS, `eslint.config.mjs`, `tools/policy-rules.mjs` and
`tools/dependency-policy.cjs`. The dependency root configuration explicitly selects
flat or layered architecture during initialization. The bootstrap skill does not
copy the rule text into its instructions.

## Universal gates

Every profile keeps strict TS, build, empty/comment-only catch rejection, empty
Promise-handler rejection, unconditional empty catch-result rejection, and the
300-physical-line warning with zero warning budget. A known ENOENT branch returning
undefined and rethrowing everything else passes. No platform/version alternate
implementation is permitted just because the project is flat.

Platform reads/imports are rejected in business source. Only a selected layered
runtime (or a real infra directory) admits the reviewed exact discovery file;
flat AGENTS does not prescribe creating that boundary. Its exception never
turns off catch or size rules.

## Dependency tiers

Four base rules always apply: `no-cycles`, `no-unresolved`,
`production-not-tests`, `no-dev-dependency-in-production`. These enforce source
boundaries without inventing application layers. Type-only dev dependencies are
allowed; production/test fixture imports, including type-only imports, are not.

A layered selection activates the six architectural constraints. For a flat
selection, `activeLayers` reads real source directories and selects only matching
outgoing rules. No recognized directories means **exactly the four base rules**.
Domain remains pure, session consumes domain and its own ports, infra cannot
orchestrate, adapters do not call transport, transport does not compose I/O,
and inward composition imports are forbidden when that boundary exists.
Custom aliases/names still require explicit mapping and regression fixtures.

The canonical example is outside production under examples and is excluded from
all generated applications. Read [profiles](profiles.md) before adding layers.

## Limits and review

Syntax gates do not prove all error control flow. A throw on an unrelated branch,
a variable catch callback, log-and-success or fabricated nonempty result may
escape detection. Aliased/dynamic platform reads and hidden imports need review.
Cohesion, legitimate absence, one lifecycle/owner and the necessity of compatibility
paths require real contract/behavior evidence. Paired evals are deterministic
probes, not model success rates or application acceptance tests.

Generic tooling derives from the public MIT
[pilot](https://github.com/Tsutomu-miku/cdp-browser-mcp/commit/da1f984fd04f3c2e615f53eb7104973442bc96f3).
Browser protocols, runtime, legacy exceptions and browser matrices are not included.

# Verification evidence

The v1.1 candidate is validated independently for **each** profile:

```console
npm run verify:template -- --evidence docs/evidence/v1.1
```

The verifier creates four separate clean temporary directories and empty public
npm caches. Each installs the template toolchain, instantiates its profile, runs
`npm ci --registry=https://registry.npmjs.org` on the final package/lock, and runs
the complete `npm run check`. All profiles keep the same hard failure/size gates.

Every profile then receives three independent bad inputs. Empty catch must fail
with `policy/no-silent-catch`; 301 physical lines must fail with `max-lines`.
The third input matches its actual project shape:

| Profile     | Import negative                                         | Required dependency violation |
| ----------- | ------------------------------------------------------- | ----------------------------- |
| ts-library  | Production source imports a declaration fixture in test | production-not-tests          |
| web         | Production source imports a declaration fixture in test | production-not-tests          |
| node-cli    | Domain imports node:fs/promises                         | domain-is-pure                |
| mcp-service | Domain imports node:fs/promises                         | domain-is-pure                |

Every bad input runs the **whole check**, and the verifier asserts the intended
rule appears in its output. A compiler or unrelated setup failure is not accepted
as gate evidence. The declaration-fixture import is type-only and legal TS, so
it reaches dependency checking. The flat profiles never gain artificial layers.
After deleting each probe, a clean rebuild and full check must recover. The
library profile also exercises installed hook configuration and positive/negative
hook execution. Each profile's hook installation is checked.

[summary.json](evidence/v1.1/summary.json) records command exits, actual Node,
registry, per-profile cache isolation, and exact generated-file inventories.
Sibling text logs retain the command output with temporary/home paths redacted.
These are local deterministic tests, not independent review or application tests.
The template's own check additionally includes **four complete generated-output
snapshots**, exact empty source assertions, effective rule counts and a test that
a real domain directory activates only its matching rule on an initially flat
library. The three policy suites still test legal optional absence and forbidden
empty failures, runtime dev dependencies, cycles, unresolved imports and layering.

## Audit assessment

The public npm audit reports **7 moderate development-dependency findings**, all
from minimatch via typescript-eslint. A compatible lock update changed no installed
dependency version and left the same result. The pinned parser requires
`minimatch ^10.2.2`, currently 10.2.6; the
[upstream advisory](https://github.com/advisories/GHSA-g3hv-75wg-m249) fixes it from
11.0.1. That major version is outside the parser's declared contract. We retained
the requested direct gate versions and did not force a major override or claim
that compatibility was proved. Such an override would need its own upstream/API
and parser-project-glob validation. [Assessment](evidence/v1.1/audit-assessment.json)
and [raw public audit](evidence/v1.1/npm-audit.json) preserve the evidence.
`npm run check` does not include a security audit and is not security clearance.

## Scope

GitHub CI is separate exact-head evidence. No merge, new tag or npm publication
is performed for this review candidate. The stable v1.0.0 release and its older
[evidence](https://github.com/Tsutomu-miku/ts-quality-gates-starter/blob/v1.0.0/docs/verification.md)
remain unchanged; they do not validate v1.1's output contract.

A real MCP server/SDK, CLI commands, Web UI/bundler/browser behavior, Windows hook
execution and mutating adoption into arbitrary existing applications remain
unverified. The generated sources are intentionally empty. No placeholder suite
is represented as application acceptance.

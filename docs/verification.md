# Verification evidence

The reproducible command is:

```console
npm run verify:template -- --evidence docs/evidence
```

The verifier installs a fresh local copy with public npm and an empty cache,
executes the entire check contract and hook, then injects empty catch, 301 lines,
and domain importing `node:fs/promises` separately. Every negative runs the whole
`npm run check`; its log must name the intended rule. The verifier deletes each
probe and requires the final full check to pass. It also instantiates and checks
TS library, MCP service and Web, in addition to Node CLI.

Recorded results and command exit codes are in [summary.json](evidence/summary.json).
Individual text logs sit beside it. Temporary paths are redacted and the temporary
installation is removed. The logs describe a local deterministic run, not an
independent review or a production application test. See the summary's actual
Node version and install command.

The verifier also checks the installed hook path and audits a deliberately bad
existing-project fixture. It verifies long-file, empty-catch, platform and import
findings, then compares the fixture's file inventory and content hash to prove
the audit made no target changes.

The recorded public npm install reports **7 moderate development-dependency
advisories**, all tracing to `minimatch` through the pinned typescript-eslint
toolchain ([advisory](https://github.com/advisories/GHSA-g3hv-75wg-m249)). The three
requested gate versions are retained; no audit fix or breaking override was
applied. `check` is a code-quality contract and does not include a security audit.

CI status is separate evidence in GitHub Actions. Browser behavior, a real MCP
transport, a Web bundler/UI, npm publishing, and arbitrary existing-project
adoptions are outside the template self-check. Hook installation and execution
are exercised in a fresh Git checkout; it does not claim Windows shell support.

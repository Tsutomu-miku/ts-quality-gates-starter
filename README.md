# ts-quality-gates-starter

A public MIT TypeScript template with small canonical modules and executable
quality gates. It supplies rules and examples, not a product runtime.

- Node **22.13+ on 22.x, 24.x, or 26+** and npm; Git for hooks.
- Public npm access (`https://registry.npmjs.org`); no Chrome, browser profile,
  internal service, SDK, credentials, npm publishing or global install required.
- Pinned gates: ESLint **10.15.0**, typescript-eslint **8.72.2** and
  dependency-cruiser **18.7.2**. The committed lockfile uses the public registry.

## Instantiate

Use GitHub's **Use this template**, or create your own remote explicitly:

```console
gh repo create YOUR_ACCOUNT/my-project --template Tsutomu-miku/ts-quality-gates-starter --private --clone
cd my-project
npm ci --registry=https://registry.npmjs.org
node tools/instantiate.mjs --name my-project --type ts-library
npm run hooks:install
npm run check
```

For a local-only, pinned copy (no remote creation):

```console
git clone --depth 1 --branch v1.0.0 https://github.com/Tsutomu-miku/ts-quality-gates-starter.git my-project
cd my-project
# Remove only this fresh clone's .git directory, then git init for your project.
npm ci --registry=https://registry.npmjs.org
node tools/instantiate.mjs --name my-project --type node-cli
npm run hooks:install
npm run check
```

Alternatively, `npx degit Tsutomu-miku/ts-quality-gates-starter#v1.0.0 my-project`
copies without history. `npx` here executes degit; this template is not an npm
package and provides no published `npx ts-quality-gates-starter` command. Initialize
Git in the copied directory before installing hooks. Inspect third-party commands
according to your own environment's requirements.

`instantiate` runs once in a fresh copy after `npm ci` (it uses the pinned formatter
to produce files that immediately satisfy the format gate). It validates a lowercase unscoped name,
updates package/lock metadata and `template.json`, substitutes `{{PROJECT_NAME}}`
in `AGENTS.md`, and removes only the template's unused example layers. It never
runs against a populated existing application. Pick a profile:

| Profile       | Kept / adjusted                                                                |
| ------------- | ------------------------------------------------------------------------------ |
| `ts-library`  | Pure domain + injected session; ESM/types exports; no I/O examples             |
| `mcp-service` | Node layers + transport validation + composition; add your chosen SDK          |
| `web`         | Domain + session; Bundler resolution + DOM types; add your chosen UI           |
| `node-cli`    | Node layers + a minimal executable; `node dist/entrypoints/cli.js a.txt hello` |

The MCP profile has **no running MCP server**; the Web profile has **no UI or
bundler**. Choose those separately, retaining the gates and the runtime boundary.
All profiles keep `private: true`; publishing is an independent decision.

## Contract and checks

[AGENTS.md](AGENTS.md) is the project rule template. Adapt its owners/examples to
the instantiated project. [Quality gates](docs/quality-gates.md) explains detection
limits, legitimate absence handling and how to map/trim dependency layers.

`npm run check` runs build → typecheck → lint → depcruise → test:quality → evals →
format:check. The three test suites exercise rules, dependency directions and
the actual gate configuration. `max-lines` warns at 301 physical lines, and
`--max-warnings 0` makes that warning fail. The pre-push hook runs this same check;
GitHub Actions runs it independently. Browser jobs are disabled by default.

`npm run verify:template` makes a clean temporary copy, instantiates it, installs
from public npm with a fresh cache, runs check and the hook, and injects each of
three bad probes separately. It asserts each fails for its intended rule, removes
the probes, verifies recovery, then checks all four trim profiles. Logs go to
`test-results/template-verification`. [Recorded evidence](docs/verification.md)
describes the delivered validation and its limits.

## Existing projects and upgrades

Use the [read-only audit and staged adoption guide](docs/harden.md). Start by
mapping current owners and quality tooling; do not overwrite configurations or
mass-split files to match directory names. Baseline existing failures and inject
gates by agreed stages before changing application behavior.

`template.json` records version **1.0.0** and the selected profile. Pin a release
tag/commit for repeatability. Upgrade by comparing the old and new template's
rules/tools/tests, reconciling local policy deliberately, and rerunning positive
and negative probes. Never recopy over a live project.

The optional [project-bootstrap skill](skills/project-bootstrap/SKILL.md) starts or
audits projects using this versioned template; rules stay in this repository.
Generic gates derive from the public MIT pilot noted in [NOTICE](NOTICE).
See [LICENSE](LICENSE).

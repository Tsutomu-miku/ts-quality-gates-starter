# ts-quality-gates-starter

A public MIT TypeScript template with executable quality gates and profile-shaped
application output. **v1.1.0 is released and is the latest stable version.**
The previous release is `v1.0.0`; its tag remains unchanged.

Use Node 22.13+ on 22.x, 24.x, or 26+, npm, Git, and public GitHub/npm access.
No Chrome, credentials, internal services or global packages are needed.
The validated gate versions remain ESLint **10.15.0**, typescript-eslint **8.72.2**
and dependency-cruiser **18.7.2**. The lockfile uses public npm only.

## Instantiate a fresh project

GitHub **Use this template** or `gh repo create --template` copies the selected
published template revision. To use the latest stable release, clone its tag
explicitly:

```console
git clone --depth 1 --branch v1.1.0 https://github.com/Tsutomu-miku/ts-quality-gates-starter.git my-project
cd my-project
npm ci --registry=https://registry.npmjs.org
node tools/instantiate.mjs --name my-project --type ts-library
# For this fresh clone only, replace the template .git history with your project's
# Git repository (or copy the generated files, including dotfiles, into an empty repo).
npm ci --registry=https://registry.npmjs.org
npm run hooks:install
npm run check
```

`npx degit Tsutomu-miku/ts-quality-gates-starter#v1.1.0 my-project`
is another copy option. It executes third-party degit; this template is not an npm
package and is not npm-published. Initialize Git before installing hooks.
Pin the release tag/commit and record that source in the project.

The one-time initializer requires the installed pinned formatter. It validates
name/type, replaces the template-owned source with the selected empty skeleton,
generates AGENTS/README/dependency configuration and package metadata, and removes
tutorials, template-maintenance scripts/tests, docs and skills from the application.
It never runs on an already instantiated application. MIT/NOTICE attribution stays.

| Profile       | Generated application files (under src unless stated)                                                                    | Dependency preset      |
| ------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------- |
| `ts-library`  | `index.ts` containing only `export {};`                                                                                  | Four base rules        |
| `web`         | `index.ts` empty export + root `index.html` loading built `dist/index.js`                                                | Four base rules        |
| `node-cli`    | `index.ts`; empty `domain/session/infra/adapters/transport/index.ts`; `entrypoints/cli.ts` with shebang and empty export | Base + selected layers |
| `mcp-service` | `index.ts`; empty `domain/session/infra/adapters/transport/index.ts`; empty `entrypoints/main.ts`                        | Base + selected layers |

All outputs include strict TypeScript, policy tools/tests, evals, hook and CI;
all stay `private: true`. The Web profile uses DOM types and Bundler resolution;
serve the built project over HTTP. It installs no UI framework or bundler. CLI
and MCP are **empty scaffolds**, not working commands or protocol servers.
[Full output manifests and rationale](docs/profiles.md) describe the contract.
The canonical teaching flow lives only in [examples/canonical](examples/canonical).
No teaching business code is copied into any generated project.

## Quality contract

Fail fast, reject swallowed errors and arbitrary empty fallback results, forbid
speculative platform/version alternatives, keep single responsibility and the
300-physical-line gate. These apply to **every** profile. Lint warns at 301 lines
and fails with `--max-warnings 0`. Legitimate optional-file ENOENT with rethrow for
other errors stays valid. [AGENTS.md](AGENTS.md) documents universal policy;
layered profiles receive their additional ownership sections during generation.

Dependency rules have two tiers: four base source/tooling boundaries always run;
architectural rules run only for an explicitly layered profile or the matching
real source directories. A fresh flat project has exactly four effective rules,
not dormant session/transport rules. [Gate details](docs/quality-gates.md).

`npm run check` runs build, typecheck, lint, depcruise, three policy suites, evals
and format. In the template repository it additionally runs four profile output
snapshots and an opt-in growth regression. Generated projects omit this template
maintenance suite and the initializer. Pre-push and GitHub CI run the same check.
Browser matrices remain disabled until a project adds a real browser suite.

[Verification](docs/verification.md) records **per-profile public npm ci + full
check**, independent empty-catch/301-line/import negatives, and clean recovery.
Run `npm run verify:template` to repeat it. Existing projects use the
[read-only staged adoption guide](docs/harden.md), never the initializer.

## Audit and version scope

`npm audit` still reports **7 moderate dev-dependency findings** through minimatch.
A compatible `npm update --package-lock-only` changed no dependency versions and
left the same findings. typescript-eslint 8.72.2's parser toolchain requires
`minimatch ^10.2.2` (locked 10.2.6); the
[advisory](https://github.com/advisories/GHSA-g3hv-75wg-m249) is patched from 11.0.1,
outside that range. A forced major override or different validated gate version
would need a separate compatibility decision; neither was applied. Check success
is not a clean security audit. [Audit evidence](docs/evidence/v1.1/audit-assessment.json).

The repository's project-bootstrap skill is pinned to stable v1.1.0. Synchronize
installed copies to this version when adopting the release. Version management
uses Git tags; the template is not npm-published. Upgrade an existing project by
reviewing rule/tool/test
changes and rerunning positive and negative probes, never by copying over its code.
See [LICENSE](LICENSE) and [NOTICE](NOTICE).

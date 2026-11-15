# Profile output contract

Project shape is owned by `tools/project-profiles.mjs`; the initializer materializes
that definition instead of retaining parts of a teaching application. The snapshots
in `test/snapshots/profiles.json` enumerate **every generated file**, including
shared quality tooling. `test/profiles.test.mjs` checks each exact manifest,
empty source contents, no teaching business identifiers, effective dependency
rules, relevant AGENTS sections and removal of template-only scripts/assets.

| Profile     | Source / page files                                                      | AGENTS additions                                           | Effective dependency rules |
| ----------- | ------------------------------------------------------------------------ | ---------------------------------------------------------- | -------------------------- |
| ts-library  | `src/index.ts` (empty export)                                            | None                                                       | 4 base                     |
| web         | `src/index.ts` (empty export), `index.html`                              | None                                                       | 4 base                     |
| node-cli    | `src/index.ts`, five layer `index.ts` modules, `src/entrypoints/cli.ts`  | Layer direction, platform discovery and resource ownership | 4 base + 6 architectural   |
| mcp-service | `src/index.ts`, five layer `index.ts` modules, `src/entrypoints/main.ts` | Layer direction, platform discovery and resource ownership | 4 base + 6 architectural   |

The five layer modules are `src/domain/index.ts`, `src/session/index.ts`,
`src/infra/index.ts`, `src/adapters/index.ts`, `src/transport/index.ts`.
Every one contains only `export {};`. CLI adds a shebang to its empty export.
No example logic or SDK is installed. Real functionality must establish its own
owner and contract before filling those modules.

Flat projects do not receive lifecycle, session, transport, composition or named
platform-boundary sections. Universal failure, compatibility, cohesion and machine
rules remain intact. Adding a real recognized layer directory opts only that
layer into its outgoing constraints; review and update the project's AGENTS with
that architecture decision. No source relocation or blanket six-layer migration
is implied. Composition constraints activate when an entrypoints directory and
at least one inner layer coexist.

The generated application includes only the shared quality files in the snapshot
plus its listed source/page files. Tutorial examples, documentation evidence,
bootstrap skills, generator/verifier/auditor code and output-snapshot maintenance
are removed. Consumer applications keep the three policy suites and their paired
evals; these test gates without introducing folders into production source.

The import negative for a flat application is `src → test/*.d.ts`, demonstrating
production/test separation without artificial domain folders. Layered profiles
use `domain → node:fs/promises`. Every negative must reach the intended dependency
rule after build/typecheck/lint, fail, and recover after removal.

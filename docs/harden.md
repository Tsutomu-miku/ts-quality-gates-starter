# Read-only audit, then staged adoption

Do not run `instantiate` on an existing application. Use a separate pinned
template checkout as the toolchain (`npm ci` there, not in the target), then:

```console
node tools/audit-project.mjs /absolute/path/to/existing-project
```

The audit reads files only. It inventories AGENTS, lint/dependency/TypeScript
configuration, hooks and CI; lists long files, catch/platform syntax findings,
and literal cross-layer import candidates. It excludes dependency/build/Git
trees and environment files. It reports paths/rule locations, not source text.
Custom aliases, other directory names and dynamic imports require manual owner
mapping. Audit is not a substitute for the target's real dependency graph.

Before writing, present the gaps, current checks, owner mapping, likely impact,
proposed file changes and verification steps. Default gate: stop after this
read-only report until the user authorizes concrete adoption stages, unless the
current task already explicitly authorizes those same concrete changes.

| Stage | Scope and verification                                                                                                                       |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 0     | Read only: baseline current scripts/config, long files, cross-layer imports, catch and platform branches; review false positives             |
| 1     | Merge instructions and non-conflicting scripts/tools/tests; preserve current lint/tsconfig/package manager and lockfile, run existing checks |
| 2     | Map layers, add new-code gates, record existing debt explicitly with per-file non-growth caps and an owner; no blanket suppressions          |
| 3     | Fix agreed causes by semantic owner in small changes; promote each gate to blocking after baseline and positive/negative verification        |

Existing debt is an adoption concern, not an exemption shipped in this fresh
template. Do not mass-rewrite directories, replace the lockfile/package manager,
delete working boundary validation or activate stricter compiler settings over
an unreviewed error set. Do not overwrite existing hooks: integrate with their
current owner (for example Husky) and prove existing hooks still run.

Include exact proposed changes and the rollback path before adoption. Approval
to audit does not authorize the write stages. Finish adopted stages with the
target's regression checks and negative probes for every newly blocking gate.

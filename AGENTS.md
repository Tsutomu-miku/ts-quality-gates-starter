# {{PROJECT_NAME}} repository contract

Read this contract before changing code. Adapt the named owners and examples to
the project; preserve the executable gates when trimming unused layers.

## Responsibility and size

One module owns one business responsibility and its invariants. Production TS/TSX
files have at most **300 physical lines**, including comments and blank lines.
Split by state ownership, side effects and reasons to change. Do not compress
statements or create forwarding helpers to satisfy the counter.

- Good: `domain/note.ts` owns note validity; `adapters/file-note-writer.ts` owns
  disk writes. Replace these examples with {{PROJECT_NAME}}'s real owners.
- Bad: `service.ts` mixes request parsing, validation, timers and disk writes;
  `helpers1.ts` and `helpers2.ts` share a mutable context bag.

ESLint reports size as a warning; `npm run lint` uses `--max-warnings 0`, so any
warning fails the gate. There is no inherited size debt or inline disable.

## Observable failure

Prefer throwing to fabricated success. Follow the actual producer → transform →
storage → consumer chain and repair the first broken contract. Empty catches,
comment-only catches, empty Promise handlers, arbitrary empty fallbacks, and
invented defaults for required internal values are forbidden. Logging then
returning success is also forbidden. Cleanup belongs in `finally`; protocol
error mapping belongs at an entry point.

```ts
// Bad: conceals invalid content, permissions and every other failure.
try {
  return await read(file);
} catch {
  return {};
}
// Good: this optional-file contract permits only documented absence.
try {
  return await read(file);
} catch (error) {
  if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
  throw error;
}
```

Keep validation of untrusted input, authorization, schemas and documented absence
at their owning boundaries. A required internal field missing at its producer
must be fixed there; do not spread optional chaining and defaults downstream.

## One supported implementation

Do not add old/new field aliases, speculative platform/version dispatch, or
"try another API after failure" paths. A real published compatibility contract
must be explicitly scoped, reviewed and tested at its boundary before adding it.
Platform discovery is allowed only in `src/infra/platform-boundary.ts`. Add that
file only when a real runtime difference exists; never enlarge the allowlist
just to silence lint. No platform branches belong in domain or session code.

- Good: the platform boundary selects an executable path; all callers use one
  implementation of the operation.
- Bad: `saveNote` tests `process.platform` and retries another storage protocol.

## Lifecycle ownership

One lifecycle/resource has one owner. The owner starts, cancels and closes it;
callers use its public operations. Keep one authoritative map, queue, timer or
snapshot per resource. Inject capabilities at composition rather than spawning
another owner at each entry point.

```ts
// Good: one owner controls resource lifetime, including failure cleanup.
const session = await openSession();
try {
  await session.run(input);
} finally {
  await session.close();
}
// Bad: CLI and request handlers each start a timer and synchronize two maps.
```

Replace this example with {{PROJECT_NAME}}'s lifecycle owner when one exists.
The canonical note example is a single operation and needs no lifecycle class.

## Dependency direction

| Layer         | Owns / may depend on                                               |
| ------------- | ------------------------------------------------------------------ |
| `domain`      | Pure rules; imports only domain code, no Node/SDK/network/disk I/O |
| `session`     | Use cases and their ports; domain and session code only            |
| `infra`       | Low-level runtime boundaries; no orchestration or concrete adapter |
| `adapters`    | I/O implementations; implement the consumer's port                 |
| `transport`   | External input validation; calls injected use cases/capabilities   |
| `entrypoints` | Composition; creates adapters and owns application startup         |

- Good: `saveNote(input, writer)` consumes a session-owned `NoteWriter` contract;
  the entry point constructs `FileNoteWriter`.
- Bad: domain imports `node:fs`, session imports a concrete adapter (including
  its types), or a low-level module imports the package's composition barrel.

No cycles, unresolved imports, production imports of tests/examples/fixtures,
runtime dev dependencies or inward imports of entry points. Type-only dev tools
such as `@types/node` are permitted; they perform no runtime I/O.
Trim unused layers using the documented profiles. Existing projects may keep
their own names: map rules to real owners instead of moving files mechanically.

## Checks and review

Use supported Node (see `package.json`) and npm, with public registry access.
Run `npm ci`, `npm run hooks:install` once per checkout, then `npm run check`.
The pre-push hook and CI run build, typecheck, lint, dependency checks, the three
policy suites, paired evals and formatting. Never bypass a failing gate to push.

The gates detect explicit syntax/import patterns. They do not prove cohesion,
all error paths, lifecycle ownership, dynamic dispatch or the necessity of a
fallback. Review those against real contracts and behavior. Preserve legitimate
boundary validation. Make changes at their semantic owner; avoid unrelated
refactors and duplicate policy copies. Keep credentials and private data out.

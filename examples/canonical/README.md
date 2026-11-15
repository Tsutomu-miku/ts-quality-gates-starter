# Canonical layered teaching flow

This source-only example demonstrates consumer-owned ports, pure rules, boundary
validation and outer composition. It is retained for reading, not copied into an
instantiated project. No profile is a prebuilt business application.

Read `src/domain/note.ts` → `src/session/save-note.ts` →
`src/adapters/file-note-writer.ts` → `src/transport/note-request.ts` →
`src/entrypoints/main.ts`. `src/infra/optional-text.ts` shows documented absence
with other failures rethrown. Adapt the ownership decisions to a real contract;
do not carry the example's business vocabulary into a new application.

// Deterministic paired probes, not coding-agent success rates.
export default [
  {
    id: "empty-catch",
    bad: "task().catch(() => {})",
    good: "task().catch(error => { throw error })",
    rules: ["policy/no-silent-catch"],
    review: "Review logging-then-success and callback-based error paths too.",
  },
  {
    id: "optional-file",
    bad: "async function read() { try { return await load() } catch { return {} } }",
    good: "async function read() { try { return await load() } catch(e) { if(e.code === 'ENOENT') return undefined; throw e } }",
    rules: ["policy/no-empty-fallback"],
    review: "The boundary contract must actually define ENOENT as absence.",
  },
  {
    id: "physical-size",
    bad: "// physical line\n".repeat(301),
    good: "export const format = (text: string) => text.trim();",
    rules: ["max-lines"],
    review: "Splitting must preserve responsibility and state ownership.",
  },
  {
    id: "platform-boundary",
    bad: "const platform = process.platform;",
    good: "const target = runtime.target;",
    rules: ["no-restricted-syntax"],
    review: "Aliases/dynamic platform dispatch need semantic review.",
  },
  {
    id: "domain-direction",
    bad: "export const note = 'I/O must stay outside domain';",
    good: "export const format = (text: string) => text.trim();",
    rules: [],
    badDependencies: {
      "src/domain/note.ts":
        "import { readFile } from 'node:fs/promises'; export { readFile };",
    },
    goodDependencies: {
      "src/domain/note.ts":
        "export const format = (text: string) => text.trim();",
    },
    dependencyRule: "domain-is-pure",
    review: "Map dependency rules to real semantic owners after trimming.",
  },
  {
    id: "single-owner",
    bad: "const firstQueue = []; const secondQueue = [];",
    good: "const queue = owner.queue;",
    rules: [],
    review:
      "Syntax cannot determine whether two queues represent one lifecycle.",
  },
];

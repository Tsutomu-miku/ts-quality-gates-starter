import { RuleTester } from "eslint";
import { describe, it } from "node:test";
import policy from "../tools/policy-rules.mjs";

RuleTester.describe = describe;
RuleTester.it = it;
const tester = new RuleTester({
  languageOptions: { ecmaVersion: "latest", sourceType: "module" },
});
tester.run("no-silent-catch", policy.rules["no-silent-catch"], {
  valid: [
    "try { task() } catch (e) { throw e }",
    "function readOptional() { try { task() } catch (e) { if (e.code !== 'ENOENT') throw e; return undefined } }",
    "task().catch(e => { report(e); process.exitCode = 1 })",
  ],
  invalid: [
    { code: "try { task() } catch {}", errors: [{ messageId: "silent" }] },
    {
      code: "try { task() } catch { /* intentionally ignored */ }",
      errors: [{ messageId: "silent" }],
    },
    { code: "task().catch(() => {})", errors: [{ messageId: "silent" }] },
    {
      code: "task()['catch'](function () { /* ignored */ })",
      errors: [{ messageId: "silent" }],
    },
  ],
});
tester.run("no-empty-fallback", policy.rules["no-empty-fallback"], {
  valid: [
    "function readOptional() { try { return read() } catch(e) { if(e.code !== 'ENOENT') throw e; return undefined } }",
    "function readOptional() { try { return read() } catch(e) { if(e.code === 'ENOENT') return undefined; throw e } }",
    "read().catch(e => { if(e.code !== 'ENOENT') throw e; return undefined })",
    "read().catch(e => ({ error: String(e) }))",
  ],
  invalid: [
    {
      code: "function read() { try { task() } catch { return {} } }",
      errors: [{ messageId: "fallback" }],
    },
    {
      code: "function read() { try { task() } catch { return [] } }",
      errors: [{ messageId: "fallback" }],
    },
    {
      code: "function read() { try { task() } catch { return } }",
      errors: [{ messageId: "fallback" }],
    },
    {
      code: "task().catch(() => undefined)",
      errors: [{ messageId: "fallback" }],
    },
    { code: "task().catch(() => null)", errors: [{ messageId: "fallback" }] },
    { code: "task().catch(() => ({}))", errors: [{ messageId: "fallback" }] },
    {
      code: "function read() { try { task() } catch { const later = () => { throw Error() }; return {} } }",
      errors: [{ messageId: "fallback" }],
    },
  ],
});

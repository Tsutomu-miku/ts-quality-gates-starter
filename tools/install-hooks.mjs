import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();
const worktree =
  resolve(git("rev-parse", "--git-dir")) !==
  resolve(git("rev-parse", "--git-common-dir"));
if (worktree) git("config", "extensions.worktreeConfig", "true");
git(
  "config",
  worktree ? "--worktree" : "--local",
  "core.hooksPath",
  ".githooks",
);
console.log("Installed pre-push check for this checkout.");

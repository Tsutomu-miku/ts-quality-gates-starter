import { readFile } from "node:fs/promises";

// Contract: a missing optional file means unconfigured. Other failures propagate.
export async function readOptionalText(
  file: string,
): Promise<string | undefined> {
  try {
    return await readFile(file, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}

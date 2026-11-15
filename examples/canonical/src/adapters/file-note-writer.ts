import { writeFile } from "node:fs/promises";
import type { NoteWriter } from "../session/save-note.js";

export class FileNoteWriter implements NoteWriter {
  constructor(private readonly file: string) {}

  async write(text: string): Promise<void> {
    await writeFile(this.file, text, "utf8");
  }
}

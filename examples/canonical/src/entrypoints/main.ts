import { FileNoteWriter } from "../adapters/file-note-writer.js";
import { handleNote } from "../transport/note-request.js";

// Composition owns the adapter instance. Importing the package performs no I/O.
export async function writeNote(file: string, input: unknown): Promise<void> {
  await handleNote(input, new FileNoteWriter(file));
}

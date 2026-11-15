import { formatNote } from "../domain/note.js";

// The consumer owns the capability contract; no concrete adapter leaks inward.
export interface NoteWriter {
  write(text: string): Promise<void>;
}

export async function saveNote(
  input: string,
  writer: NoteWriter,
): Promise<void> {
  await writer.write(formatNote(input));
}

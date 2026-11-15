import { saveNote, type NoteWriter } from "../session/save-note.js";

// Validate unknown external input once at the transport boundary.
export async function handleNote(
  input: unknown,
  writer: NoteWriter,
): Promise<void> {
  if (typeof input !== "string") throw new TypeError("Expected note text");
  await saveNote(input, writer);
}

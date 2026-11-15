export function formatNote(input: string): string {
  const text = input.trim();
  if (text.length === 0) throw new Error("A note must contain text");
  return text + "\n";
}

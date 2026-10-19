/**
 * Access codes are compared after normalising things that commonly sneak in when a value is pasted
 * into a hosting dashboard or typed on an iPhone: surrounding whitespace/newlines, wrapping quotes,
 * zero-width characters, and typographic quotes/dashes produced by iOS "smart punctuation".
 */
export function normalizeKey(raw: string | null | undefined): string {
  let s = (raw ?? "").normalize("NFKC").replace(/[\u200B-\u200D\u2060\uFEFF]/g, "").trim();
  s = s.replace(/[\u2018\u2019\u201A\u2032]/g, "'").replace(/[\u201C\u201D\u201E\u2033]/g, '"').replace(/[\u2013\u2014\u2212]/g, "-");
  if (s.length >= 2 && ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'")))) s = s.slice(1, -1).trim();
  return s;
}

/** Non-secret hint about why a code does not match — never reveals the configured code or its length. */
export function mismatchHint(provided: string, expected: string): "empty" | "case" | "length" | "chars" | null {
  if (!expected || provided === expected) return null;
  if (!provided) return "empty";
  if (provided.toLowerCase() === expected.toLowerCase()) return "case";
  if (provided.length !== expected.length) return "length";
  return "chars";
}

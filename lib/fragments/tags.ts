/**
 * Normalizes a user-entered tag to the lowercase kebab-case form stored in
 * Fragment JSON. Returns an empty string when nothing usable remains.
 */
export function normalizeTag(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-");
}

export function normalizeTags(values: readonly string[]) {
  return Array.from(new Set(values.map(normalizeTag).filter(Boolean)));
}

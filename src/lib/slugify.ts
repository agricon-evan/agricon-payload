// Shared heading slugifier — used by both the server (SSR TOC) and the
// client (DOM id assignment) so anchor ids always match.
export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'section'
}

export function buildHeadingIds<T extends { heading: string }>(
  sections: T[],
): (T & { id: string })[] {
  const seen = new Map<string, number>()
  return sections.map((s) => {
    const base = slugifyHeading(s.heading)
    const n = seen.get(base) || 0
    seen.set(base, n + 1)
    const id = n > 0 ? `${base}-${n + 1}` : base
    return { ...s, id }
  })
}

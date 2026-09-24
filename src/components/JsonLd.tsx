/**
 * Renders a JSON-LD block.
 *
 * `<` is escaped so a CMS value containing `</script>` cannot break out of the
 * tag — the JSON stays valid because `\u003c` is an equivalent escape.
 * Server component: no client bundle cost.
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}

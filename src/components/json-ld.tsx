/**
 * Renders a JSON-LD structured-data block. Server component — safe to embed
 * the serialized schema directly into the document head/body.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

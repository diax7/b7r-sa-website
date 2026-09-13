import { graph, serialize, type JsonLdNode } from '@/modules/core/seo/json-ld';

/** The one `<script type="application/ld+json">` a page emits (BRD 7.4). */
export function JsonLd({ nodes }: { nodes: JsonLdNode[] }) {
  return (
    <script
      type="application/ld+json"
      // Serialised by `serialize`, which escapes `<`; the data is our own content.
      dangerouslySetInnerHTML={{ __html: serialize(graph(nodes)) }}
    />
  );
}

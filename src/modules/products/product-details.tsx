import type { SiteCopy } from '@/content/copy';
import type { Product } from '@/content/schema';

type ProductsCopy = SiteCopy['productsPage'];

/** Definition list of the six BRD 4.8 spec rows. */
export function SpecList({ product, copy }: { product: Product; copy: ProductsCopy }) {
  const { specLabels, weightUnit, listSeparator: sep } = copy;
  const rows: Array<[string, string]> = [
    [specLabels.material, product.material],
    [specLabels.weight, `${product.weightGrams} ${weightUnit}`],
    [specLabels.sizes, product.sizes.map((s) => s.label).join(sep)],
    [specLabels.colors, product.colors.map((c) => c.name).join(sep)],
    [specLabels.printArea, product.printArea.label],
    [specLabels.printMethod, product.printMethodLabel],
  ];
  return (
    <dl className="divide-y divide-border rounded-base border border-border bg-surface">
      {rows.map(([label, value]) => (
        <div key={label} className="grid gap-1 px-5 py-4 sm:grid-cols-[160px_1fr] sm:gap-4">
          <dt className="text-small font-medium text-text-muted">{label}</dt>
          <dd className="text-body text-text">
            <bdi>{value}</bdi>
          </dd>
        </div>
      ))}
    </dl>
  );
}

const COLUMN_ORDER = ['length', 'chest', 'sleeve'] as const;

/**
 * Size chart in centimetres (BRD 6.6, Appendix A). Columns come from the measurement keys the
 * product actually carries (adult: length/chest/sleeve; baby: chest/length), digits LTR.
 * Returns null when no size has measurements (the tote bag: «مقاس واحد» lives in the specs).
 */
export function SizeChart({
  product,
  caption,
  copy,
}: {
  product: Product;
  caption: string;
  copy: ProductsCopy;
}) {
  const keys = COLUMN_ORDER.filter((k) =>
    product.sizes.some((s) => s.measurements?.[k] !== undefined),
  );
  if (keys.length === 0) return null;
  const headers = copy.sizeChartHeaders;
  return (
    <div className="overflow-x-auto rounded-base border border-border bg-surface">
      <table className="w-full min-w-[420px] text-start text-body">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-ground text-small text-text-muted">
          <tr>
            <th scope="col" className="px-5 py-3 text-start font-medium">
              {headers.size}
            </th>
            {keys.map((k) => (
              <th key={k} scope="col" className="px-5 py-3 text-start font-medium">
                {headers[k]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {product.sizes.map((size) => (
            <tr key={size.label}>
              <th scope="row" className="px-5 py-3 text-start font-medium text-text">
                <bdi dir="ltr">{size.label}</bdi>
              </th>
              {keys.map((k) => (
                <td key={k} className="tabular px-5 py-3 text-text">
                  <bdi dir="ltr">{size.measurements?.[k] ?? '-'}</bdi>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

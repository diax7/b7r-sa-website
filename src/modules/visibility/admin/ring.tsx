/**
 * The score as a ring (ADR-049): the Visibility pink on the surface track, the number in
 * the middle. Identity, not meaning: the colour never changes with the number. SVG, so it
 * scales to the card and the page; the value is also in text for a screen reader.
 */
export function Ring({
  percent,
  size = 96,
  label,
}: {
  percent: number;
  size?: number;
  label: string;
}) {
  const stroke = Math.max(6, Math.round(size / 12));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`${label}: ${clamped}%`}
      className="shrink-0"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        className="text-surface-2"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${(c * clamped) / 100} ${c}`}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="text-pink"
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="central"
        textAnchor="middle"
        fill="currentColor"
        className="text-text tabular-nums"
        style={{ fontSize: size / 4, fontWeight: 600 }}
      >
        {clamped}%
      </text>
    </svg>
  );
}

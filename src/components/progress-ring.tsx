export function ProgressRing({
  percent,
  className,
}: {
  percent: number;
  className?: string;
}) {
  const p = Math.min(100, Math.max(0, percent));
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <svg
      width="72"
      height="72"
      viewBox="0 0 72 72"
      className={className}
      aria-hidden
    >
      <circle
        cx="36"
        cy="36"
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="8"
        className="opacity-20"
      />
      <circle
        cx="36"
        cy="36"
        r={r}
        fill="none"
        stroke="currentColor"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={`${(p / 100) * c} ${c}`}
        transform="rotate(-90 36 36)"
      />
    </svg>
  );
}

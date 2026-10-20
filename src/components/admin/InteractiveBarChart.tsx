import { useState } from 'react';

export interface BarDatum {
  label: string;
  value: number;
  /** Tailwind bg-* class, e.g. "bg-info-600". Color is secondary — every bar is
   * always directly labeled with its category name, so identity never depends on
   * color alone (see dataviz skill: CVD-unsafe pairs are legal with this
   * "secondary encoding" exception). */
  color: string;
}

interface InteractiveBarChartProps {
  title: string;
  data: BarDatum[];
}

/**
 * Horizontal bar chart per dataviz skill spec: <=24px thick bars, 4px rounded
 * data-end / square baseline, hairline track, per-bar hover+focus tooltip that
 * only ever repeats what's already visible (count + share of total) — nothing is
 * gated behind hover.
 */
export function InteractiveBarChart({ title, data }: InteractiveBarChartProps) {
  const [active, setActive] = useState<string | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="rounded-lg border border-hairline bg-white p-5 shadow-card">
      <h2 className="font-display text-[0.75rem] font-bold uppercase tracking-[0.1em] text-ink-900">{title}</h2>
      {data.length === 0 ? (
        <p className="mt-3 text-[0.8125rem] text-muted">No data yet.</p>
      ) : (
        <ul className="mt-4 space-y-3.5">
          {data.map((d) => {
            const share = total > 0 ? Math.round((d.value / total) * 100) : 0;
            const widthPct = (d.value / max) * 100;
            const isActive = active === d.label;
            return (
              <li key={d.label} className="relative">
                <div className="mb-1 flex items-center justify-between text-[0.8125rem]">
                  <span className="text-ink-900">{d.label}</span>
                  <span className="tabular-nums text-ink-900">
                    <span className="font-semibold">{d.value}</span>{' '}
                    <span className="text-muted">({share}%)</span>
                  </span>
                </div>
                <div
                  tabIndex={0}
                  role="img"
                  aria-label={`${d.label}: ${d.value}, ${share}% of ${total}`}
                  onMouseEnter={() => setActive(d.label)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(d.label)}
                  onBlur={() => setActive(null)}
                  className="h-5 cursor-default rounded-sm bg-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600">
                  <div
                    className={`h-full rounded-r-md transition-[filter] duration-150 ${d.color} ${isActive ? 'brightness-110' : ''}`}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
                {isActive ? (
                  <div className="absolute left-0 top-full z-10 mt-1 whitespace-nowrap rounded-md bg-ink-900 px-2.5 py-1.5 text-[0.75rem] text-white shadow-lift">
                    <span className="font-semibold">{d.value}</span> · {share}% of {total}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

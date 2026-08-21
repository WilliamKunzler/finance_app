"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/format";
import { ChartTooltip, type TooltipState } from "@/components/ChartTooltip";

type MonthPoint = { label: string; income: number; expense: number };

export function MonthlyTrendChart({ data }: { data: MonthPoint[] }) {
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const max = Math.max(1, ...data.flatMap((d) => [d.income, d.expense]));

  function handleEnter(
    e: React.MouseEvent<HTMLDivElement>,
    title: string,
    value: number
  ) {
    const container = e.currentTarget.closest(
      "[data-chart-root]"
    ) as HTMLElement | null;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const barRect = e.currentTarget.getBoundingClientRect();
    setTooltip({
      x: barRect.left - containerRect.left + barRect.width / 2,
      y: barRect.top - containerRect.top,
      title,
      value: formatCurrency(value),
    });
  }

  return (
    <div className="relative" data-chart-root>
      <div className="flex h-40 items-end gap-2 sm:gap-4">
        {data.map((d) => (
          <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-32 w-full items-end justify-center gap-1">
              <div
                className="w-3 rounded-t bg-good transition-opacity hover:opacity-75 sm:w-4"
                style={{
                  height: `${Math.max((d.income / max) * 100, d.income > 0 ? 2 : 0)}%`,
                }}
                onMouseEnter={(e) => handleEnter(e, `Entradas · ${d.label}`, d.income)}
                onMouseLeave={() => setTooltip(null)}
              />
              <div
                className="w-3 rounded-t bg-critical transition-opacity hover:opacity-75 sm:w-4"
                style={{
                  height: `${Math.max((d.expense / max) * 100, d.expense > 0 ? 2 : 0)}%`,
                }}
                onMouseEnter={(e) => handleEnter(e, `Saídas · ${d.label}`, d.expense)}
                onMouseLeave={() => setTooltip(null)}
              />
            </div>
            <span className="text-xs text-ink-muted">{d.label}</span>
          </div>
        ))}
      </div>

      {tooltip && <ChartTooltip {...tooltip} />}

      <div className="mt-4 flex gap-4 text-xs text-ink-secondary">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-good" />
          Entradas
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-critical" />
          Saídas
        </span>
      </div>
    </div>
  );
}

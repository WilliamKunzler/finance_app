"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/format";
import { ChartTooltip, type TooltipState } from "@/components/ChartTooltip";

const SIZE = 168;
const STROKE = 24;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP = 3;

type Slice = { id: string; label: string; value: number; color: string };

export function DonutChart({
  slices,
  centerLabel,
  centerValue,
}: {
  slices: Slice[];
  centerLabel?: string;
  centerValue?: string;
}) {
  const [tooltip, setTooltip] = useState<TooltipState>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const total = slices.reduce((sum, s) => sum + s.value, 0);

  const { segments } = slices.filter((s) => s.value > 0).reduce<{
    offset: number;
    segments: (Slice & { length: number; dashoffset: number })[];
  }>(
    (acc, s) => {
      const fraction = total > 0 ? s.value / total : 0;
      const length = Math.max(fraction * CIRCUMFERENCE - GAP, 0);
      return {
        offset: acc.offset + fraction * CIRCUMFERENCE,
        segments: [...acc.segments, { ...s, length, dashoffset: -acc.offset }],
      };
    },
    { offset: 0, segments: [] }
  );

  function handleMove(e: React.MouseEvent<SVGCircleElement>, seg: Slice) {
    const container = e.currentTarget.closest(
      "[data-chart-root]"
    ) as HTMLElement | null;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    setHovered(seg.id);
    setTooltip({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      title: seg.label,
      value: `${formatCurrency(seg.value)} · ${((seg.value / total) * 100).toFixed(0)}%`,
    });
  }

  function handleLeave() {
    setHovered(null);
    setTooltip(null);
  }

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row">
      <div
        className="relative shrink-0"
        style={{ width: SIZE, height: SIZE }}
        data-chart-root
      >
        <svg
          width={SIZE}
          height={SIZE}
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="-rotate-90"
        >
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="var(--color-border)"
            strokeWidth={STROKE}
          />
          {segments.map((seg) => (
            <circle
              key={seg.id}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke={seg.color}
              strokeWidth={STROKE}
              strokeDasharray={`${seg.length} ${CIRCUMFERENCE - seg.length}`}
              strokeDashoffset={seg.dashoffset}
              strokeLinecap="butt"
              opacity={hovered && hovered !== seg.id ? 0.35 : 1}
              className="cursor-pointer transition-opacity"
              onMouseMove={(e) => handleMove(e, seg)}
              onMouseLeave={handleLeave}
            />
          ))}
        </svg>
        {(centerLabel || centerValue) && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            {centerValue && (
              <span className="text-lg font-semibold text-ink">{centerValue}</span>
            )}
            {centerLabel && (
              <span className="text-xs text-ink-muted">{centerLabel}</span>
            )}
          </div>
        )}
        {tooltip && <ChartTooltip {...tooltip} />}
      </div>

      <ul className="flex w-full flex-1 min-w-0 flex-col gap-2 sm:max-h-56 sm:overflow-y-auto">
        {slices.map((s) => {
          const pct = total > 0 ? (s.value / total) * 100 : 0;
          return (
            <li
              key={s.id}
              onMouseEnter={() => setHovered(s.id)}
              onMouseLeave={() => setHovered(null)}
              className={`flex items-center justify-between gap-2 rounded-md px-1.5 py-1 text-sm transition-colors ${
                hovered === s.id ? "bg-bg" : ""
              }`}
            >
              <span className="flex items-center gap-2 truncate text-ink-secondary">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                <span className="truncate">{s.label}</span>
              </span>
              <span className="shrink-0 tabular-nums text-ink">
                {pct.toFixed(0)}%
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

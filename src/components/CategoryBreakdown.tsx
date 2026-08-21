"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";

type Item = { id: string; description: string; amount: number; date: string };
type Row = { id: string; name: string; color: string; total: number; items: Item[] };

export function CategoryBreakdown({ rows }: { rows: Row[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (rows.length === 0) {
    return (
      <p className="text-sm text-ink-muted">
        Nenhum gasto registrado neste período.
      </p>
    );
  }

  const max = Math.max(...rows.map((r) => r.total));

  return (
    <div className="flex flex-col">
      {rows.map((row) => {
        const widthPct = max > 0 ? (row.total / max) * 100 : 0;
        const isOpen = expanded === row.id;
        return (
          <div key={row.id} className="border-b border-border last:border-b-0">
            <button
              type="button"
              onClick={() => setExpanded(isOpen ? null : row.id)}
              className="grid w-full grid-cols-[1fr_auto] items-center gap-2 py-2.5 text-left sm:grid-cols-[8rem_1fr_auto_auto]"
            >
              <span className="truncate text-sm text-ink-secondary">{row.name}</span>
              <div className="hidden h-3 rounded-full bg-bg border-b border-border sm:block">
                <div
                  className="h-3 rounded-full"
                  style={{ width: `${widthPct}%`, backgroundColor: row.color }}
                />
              </div>
              <span className="min-w-24 text-right text-sm tabular-nums text-ink">
                {formatCurrency(row.total)}
              </span>
              <ChevronDown
                size={16}
                className={`text-ink-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isOpen && (
              <ul className="mb-3 flex flex-col gap-1.5 rounded-lg bg-bg p-3">
                {row.items
                  .slice()
                  .sort((a, b) => b.amount - a.amount)
                  .map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="text-ink-secondary">
                      {formatDate(new Date(item.date))} · {item.description}
                    </span>
                    <span className="shrink-0 tabular-nums text-ink">
                      {formatCurrency(item.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

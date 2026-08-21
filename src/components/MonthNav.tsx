import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { monthLabel } from "@/lib/format";

function shiftMonth(year: number, month: number, delta: number) {
  const date = new Date(year, month - 1 + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

export function MonthNav({
  year,
  month,
  basePath,
}: {
  year: number;
  month: number;
  basePath: string;
}) {
  const prev = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-surface p-1">
      <Link
        href={`${basePath}?month=${prev.year}-${String(prev.month).padStart(2, "0")}`}
        className="rounded-md p-1.5 text-ink-secondary transition-colors hover:bg-bg"
        aria-label="Mês anterior"
      >
        <ChevronLeft size={16} />
      </Link>
      <span className="min-w-36 text-center text-sm font-medium text-ink">
        {monthLabel(year, month)}
      </span>
      <Link
        href={`${basePath}?month=${next.year}-${String(next.month).padStart(2, "0")}`}
        className="rounded-md p-1.5 text-ink-secondary transition-colors hover:bg-bg"
        aria-label="Próximo mês"
      >
        <ChevronRight size={16} />
      </Link>
    </div>
  );
}

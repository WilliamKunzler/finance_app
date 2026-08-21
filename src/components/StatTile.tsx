import type { LucideIcon } from "lucide-react";
import { formatCurrency } from "@/lib/format";

const accentStyles: Record<
  "good" | "critical" | "neutral",
  { border: string; iconBg: string; iconColor: string }
> = {
  good: { border: "var(--color-good)", iconBg: "var(--color-good-soft)", iconColor: "var(--color-good)" },
  critical: { border: "var(--color-critical)", iconBg: "var(--color-critical-soft)", iconColor: "var(--color-critical)" },
  neutral: { border: "var(--color-info)", iconBg: "var(--color-info-soft)", iconColor: "var(--color-info)" },
};

export function StatTile({
  label,
  value,
  icon: Icon,
  accent = "neutral",
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  accent?: "good" | "critical" | "neutral";
}) {
  const styles = accentStyles[accent];
  return (
    <div
      className="rounded-2xl border border-border bg-surface p-4 shadow-sm border-l-4"
      style={{ borderLeftColor: styles.border }}
    >
      <div className="flex items-center justify-between">
        <div className="text-sm text-ink-secondary">{label}</div>
        <span
          className="flex h-8 w-8 items-center justify-center rounded-full"
          style={{ backgroundColor: styles.iconBg, color: styles.iconColor }}
        >
          <Icon size={16} />
        </span>
      </div>
      <div className="mt-2 text-2xl font-semibold text-ink">
        {formatCurrency(value)}
      </div>
    </div>
  );
}

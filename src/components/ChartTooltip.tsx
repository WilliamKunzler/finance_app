export type TooltipState = {
  x: number;
  y: number;
  title: string;
  value: string;
} | null;

export function ChartTooltip({ x, y, title, value }: NonNullable<TooltipState>) {
  return (
    <div
      className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg bg-[#1c1c1c] px-2.5 py-1.5 text-xs text-white shadow-lg transition-opacity"
      style={{ left: x, top: y - 10 }}
    >
      <div className="font-medium">{title}</div>
      <div className="tabular-nums text-white/75">{value}</div>
    </div>
  );
}

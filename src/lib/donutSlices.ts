export type DonutSlice = { id: string; label: string; value: number; color: string };

/**
 * Caps a slice list to `max` entries so pie/donut legends stay compact and
 * readable — the smallest slices beyond the cap are folded into "Outros"
 * rather than left to grow the legend (and the card around it) without bound.
 */
export function capDonutSlices(items: DonutSlice[], max = 6): DonutSlice[] {
  const sorted = [...items].sort((a, b) => b.value - a.value);
  if (sorted.length <= max) return sorted;

  const head = sorted.slice(0, max - 1);
  const restTotal = sorted.slice(max - 1).reduce((sum, s) => sum + s.value, 0);

  return [...head, { id: "__other__", label: "Outros", value: restTotal, color: "#8B9280" }];
}

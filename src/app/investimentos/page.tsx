import { PiggyBank, HandCoins } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { StatTile } from "@/components/StatTile";
import { DonutChart } from "@/components/DonutChart";
import { CategoryBreakdown } from "@/components/CategoryBreakdown";
import { formatCurrency, formatDate } from "@/lib/format";
import { capDonutSlices } from "@/lib/donutSlices";

export const dynamic = "force-dynamic";

export default async function InvestimentosPage() {
  const [transactions, withdrawals] = await Promise.all([
    prisma.transaction.findMany({
      where: { type: "INVESTMENT" },
      include: { category: true },
      orderBy: { date: "desc" },
    }),
    prisma.transaction.findMany({
      where: { type: "EXPENSE", paymentType: "INVESTMENT_WITHDRAWAL" },
      include: { category: true },
      orderBy: { date: "desc" },
    }),
  ]);

  const grossTotal = transactions.reduce((sum, t) => sum + t.amount, 0);
  const totalWithdrawn = withdrawals.reduce((sum, w) => sum + w.amount, 0);
  const total = grossTotal - totalWithdrawn;

  const categoryGroups = new Map<
    string,
    {
      name: string;
      color: string;
      total: number;
      items: { id: string; description: string; amount: number; date: string }[];
    }
  >();

  for (const t of transactions) {
    const existing = categoryGroups.get(t.categoryId) ?? {
      name: t.category.name,
      color: t.category.color,
      total: 0,
      items: [],
    };
    existing.total += t.amount;
    existing.items.push({
      id: t.id,
      description: t.description,
      amount: t.amount,
      date: t.date.toISOString(),
    });
    categoryGroups.set(t.categoryId, existing);
  }

  // Withdrawals aren't tied to a specific investment category, so their
  // effect is spread across categories proportionally to how much each one
  // contributed — with a single category (the common case) this is exact.
  const rows = Array.from(categoryGroups.entries())
    .map(([id, data]) => ({
      id,
      ...data,
      total:
        grossTotal > 0
          ? data.total - (data.total / grossTotal) * totalWithdrawn
          : data.total,
    }))
    .sort((a, b) => b.total - a.total);

  const donutSlices = capDonutSlices(
    rows.map((row) => ({
      id: row.id,
      label: row.name,
      value: row.total,
      color: row.color,
    }))
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Investimentos</h1>
        <p className="text-sm text-ink-secondary">
          Quanto você tem investido em cada categoria, somando todos os aportes já
          registrados.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:max-w-xl">
        <StatTile
          label="Total investido"
          value={total}
          icon={PiggyBank}
          accent="neutral"
        />
        {totalWithdrawn > 0 && (
          <StatTile
            label="Total retirado"
            value={totalWithdrawn}
            icon={HandCoins}
            accent="critical"
          />
        )}
      </div>

      <div className="min-w-0 rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-medium text-ink-secondary">
          Alocação por categoria
        </h2>
        {donutSlices.length > 0 ? (
          <DonutChart
            slices={donutSlices}
            centerValue={formatCurrency(total)}
            centerLabel="total investido"
          />
        ) : (
          <p className="text-sm text-ink-muted">
            Nenhum investimento registrado ainda.
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-2 text-sm font-medium text-ink-secondary">
          Detalhamento por categoria
        </h2>
        <p className="mb-2 text-xs text-ink-muted">
          Clique em uma categoria para ver cada aporte que compõe o total.
        </p>
        <CategoryBreakdown rows={rows} />
      </div>

      {withdrawals.length > 0 && (
        <div className="min-w-0 rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-medium text-ink-secondary">
            Histórico de retiradas
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-ink-muted">
                <tr>
                  <th className="py-2 pr-4 font-medium">Data</th>
                  <th className="py-2 pr-4 font-medium">Descrição</th>
                  <th className="py-2 pr-4 font-medium">Categoria</th>
                  <th className="py-2 text-right font-medium">Valor</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((w) => (
                  <tr key={w.id} className="border-t border-border">
                    <td className="py-2 pr-4 whitespace-nowrap text-ink-secondary">
                      {formatDate(new Date(w.date))}
                    </td>
                    <td className="py-2 pr-4 text-ink">{w.description}</td>
                    <td className="py-2 pr-4">
                      <span className="inline-flex items-center gap-1.5 text-ink-secondary">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: w.category.color }}
                        />
                        {w.category.name}
                      </span>
                    </td>
                    <td className="py-2 text-right font-medium text-critical whitespace-nowrap">
                      - {formatCurrency(w.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

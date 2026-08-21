import { TrendingUp, TrendingDown, PiggyBank, Wallet } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { StatTile } from "@/components/StatTile";
import { CategoryBreakdown } from "@/components/CategoryBreakdown";
import { DonutChart } from "@/components/DonutChart";
import { MonthlyTrendChart } from "@/components/MonthlyTrendChart";
import { MonthNav } from "@/components/MonthNav";
import { formatCurrency, shortMonthLabel } from "@/lib/format";
import { syncFixedBillTransactions } from "@/lib/fixedBillSync";
import { capDonutSlices } from "@/lib/donutSlices";

const CARD_PALETTE = ["#00725E", "#3B7EA1", "#B45FC9", "#D1A62E", "#3D9AA6", "#D14343"];

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: monthParam } = await searchParams;
  const now = new Date();
  const [year, month] = monthParam
    ? monthParam.split("-").map(Number)
    : [now.getFullYear(), now.getMonth() + 1];

  await syncFixedBillTransactions(year, month);

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  const dateFilter = { date: { gte: start, lt: end } };

  const trendStart = new Date(year, month - 6, 1);

  const [totalsByType, expenseTransactions, trendTransactions] = await Promise.all([
    prisma.transaction.groupBy({
      by: ["type"],
      where: dateFilter,
      _sum: { amount: true },
    }),
    prisma.transaction.findMany({
      where: { ...dateFilter, type: "EXPENSE" },
      include: { category: true, card: true },
      orderBy: { date: "desc" },
    }),
    prisma.transaction.findMany({
      where: {
        date: { gte: trendStart, lt: end },
        type: { in: ["INCOME", "EXPENSE"] },
      },
      select: { type: true, amount: true, date: true, paymentType: true },
    }),
  ]);

  const income = totalsByType.find((t) => t.type === "INCOME")?._sum.amount ?? 0;
  const investment =
    totalsByType.find((t) => t.type === "INVESTMENT")?._sum.amount ?? 0;

  // Expenses paid straight out of an investment already reduced that
  // investment's balance, so they must not also reduce the month's regular
  // cash balance — otherwise the same money would be subtracted twice.
  const regularExpenses = expenseTransactions.filter(
    (t) => t.paymentType !== "INVESTMENT_WITHDRAWAL"
  );
  const expense = regularExpenses.reduce((sum, t) => sum + t.amount, 0);
  const balance = income - expense - investment;

  const categoryGroups = new Map<
    string,
    { name: string; color: string; total: number; items: { id: string; description: string; amount: number; date: string }[] }
  >();

  const cardGroups = new Map<
    string,
    { name: string; total: number; items: { id: string; description: string; amount: number; date: string }[] }
  >();

  for (const t of regularExpenses) {
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

    if (t.card) {
      const existingCard = cardGroups.get(t.cardId as string) ?? {
        name: t.card.name,
        total: 0,
        items: [],
      };
      existingCard.total += t.amount;
      existingCard.items.push({
        id: t.id,
        description: t.description,
        amount: t.amount,
        date: t.date.toISOString(),
      });
      cardGroups.set(t.cardId as string, existingCard);
    }
  }

  const expenseRows = Array.from(categoryGroups.entries())
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.total - a.total);

  const cardRows = Array.from(cardGroups.entries())
    .map(([id, data], index) => ({
      id,
      ...data,
      color: CARD_PALETTE[index % CARD_PALETTE.length],
    }))
    .sort((a, b) => b.total - a.total);

  const donutSlices = capDonutSlices(
    expenseRows.map((row) => ({
      id: row.id,
      label: row.name,
      value: row.total,
      color: row.color,
    }))
  );

  const monthBuckets: { year: number; month: number }[] = Array.from(
    { length: 6 },
    (_, i) => {
      const d = new Date(year, month - 6 + i, 1);
      return { year: d.getFullYear(), month: d.getMonth() + 1 };
    }
  );

  const trendData = monthBuckets.map(({ year: y, month: m }) => {
    const bucketIncome = trendTransactions
      .filter((t) => t.type === "INCOME" && t.date.getFullYear() === y && t.date.getMonth() + 1 === m)
      .reduce((sum, t) => sum + t.amount, 0);
    const bucketExpense = trendTransactions
      .filter(
        (t) =>
          t.type === "EXPENSE" &&
          t.paymentType !== "INVESTMENT_WITHDRAWAL" &&
          t.date.getFullYear() === y &&
          t.date.getMonth() + 1 === m
      )
      .reduce((sum, t) => sum + t.amount, 0);
    return { label: shortMonthLabel(y, m), income: bucketIncome, expense: bucketExpense };
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-ink">Dashboard</h1>
        <MonthNav year={year} month={month} basePath="/" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile label="Entradas" value={income} icon={TrendingUp} accent="good" />
        <StatTile label="Saídas" value={expense} icon={TrendingDown} accent="critical" />
        <StatTile
          label="Investimentos"
          value={investment}
          icon={PiggyBank}
          accent="neutral"
        />
        <StatTile
          label="Saldo do mês"
          value={balance}
          icon={Wallet}
          accent={balance >= 0 ? "good" : "critical"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-medium text-ink-secondary">
            Evolução dos últimos 6 meses
          </h2>
          <MonthlyTrendChart data={trendData} />
        </div>

        <div className="min-w-0 rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-medium text-ink-secondary">
            Distribuição dos gastos
          </h2>
          {donutSlices.length > 0 ? (
            <DonutChart
              slices={donutSlices}
              centerValue={formatCurrency(expense)}
              centerLabel="gasto no mês"
            />
          ) : (
            <p className="text-sm text-ink-muted">
              Nenhum gasto registrado neste período.
            </p>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-2 text-sm font-medium text-ink-secondary">
          Gastos por categoria
        </h2>
        <p className="mb-2 text-xs text-ink-muted">
          Clique em uma categoria para ver os lançamentos que a compõem.
        </p>
        <CategoryBreakdown rows={expenseRows} />
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-2 text-sm font-medium text-ink-secondary">
          Gastos por cartão
        </h2>
        <p className="mb-2 text-xs text-ink-muted">
          Quanto foi gasto em cada cartão neste mês. Clique para ver os lançamentos.
        </p>
        <CategoryBreakdown rows={cardRows} />
      </div>
    </div>
  );
}

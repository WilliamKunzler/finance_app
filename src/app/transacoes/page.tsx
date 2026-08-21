import { prisma } from "@/lib/prisma";
import { TransactionsPanel } from "@/components/TransactionsPanel";
import { MonthNav } from "@/components/MonthNav";
import { syncFixedBillTransactions } from "@/lib/fixedBillSync";

export const dynamic = "force-dynamic";

export default async function TransacoesPage({
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

  const [transactions, categories, cards, people] = await Promise.all([
    prisma.transaction.findMany({
      where: { date: { gte: start, lt: end } },
      include: { category: true, card: true, person: true },
      orderBy: { date: "desc" },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.card.findMany({ orderBy: { name: "asc" } }),
    prisma.person.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-ink">Transações</h1>
        <MonthNav year={year} month={month} basePath="/transacoes" />
      </div>

      <TransactionsPanel
        rows={transactions.map((t) => ({
          ...t,
          date: t.date.toISOString(),
        }))}
        categories={categories}
        cards={cards}
        people={people}
      />
    </div>
  );
}

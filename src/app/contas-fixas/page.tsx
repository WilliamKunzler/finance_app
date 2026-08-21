import { prisma } from "@/lib/prisma";
import { FixedBillForm } from "@/components/FixedBillForm";
import { FixedBillList } from "@/components/FixedBillList";
import { syncFixedBillTransactions, amountForMonth } from "@/lib/fixedBillSync";

export const dynamic = "force-dynamic";

export default async function ContasFixasPage() {
  await syncFixedBillTransactions();

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const [bills, categories, people] = await Promise.all([
    prisma.fixedBill.findMany({
      where: { active: true },
      include: {
        category: true,
        card: true,
        person: true,
        revisions: { orderBy: [{ effectiveYear: "asc" }, { effectiveMonth: "asc" }] },
      },
      orderBy: { dueDay: "asc" },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.person.findMany({ orderBy: { name: "asc" } }),
  ]);

  const rows = bills.map((bill) => {
    const currentKey = currentYear * 12 + currentMonth;
    const futureRevisions = bill.revisions
      .filter((r) => r.effectiveYear * 12 + r.effectiveMonth > currentKey)
      .sort((a, b) => a.effectiveYear * 12 + a.effectiveMonth - (b.effectiveYear * 12 + b.effectiveMonth));

    return {
      id: bill.id,
      description: bill.description,
      dueDay: bill.dueDay,
      type: bill.type,
      paymentType: bill.paymentType,
      category: { name: bill.category.name, color: bill.category.color },
      card: bill.card ? { name: bill.card.name } : null,
      person: bill.person
        ? { name: bill.person.name, color: bill.person.color, photo: bill.person.photo }
        : null,
      currentAmount: amountForMonth(bill.revisions, currentYear, currentMonth),
      nextChange: futureRevisions[0]
        ? {
            id: futureRevisions[0].id,
            amount: futureRevisions[0].amount,
            year: futureRevisions[0].effectiveYear,
            month: futureRevisions[0].effectiveMonth,
          }
        : null,
      activeSince: {
        year: bill.revisions[0].effectiveYear,
        month: bill.revisions[0].effectiveMonth,
      },
      endDate:
        bill.endYear != null && bill.endMonth != null
          ? { year: bill.endYear, month: bill.endMonth }
          : null,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Contas fixas</h1>
        <p className="text-sm text-ink-secondary">
          Cadastre contas recorrentes — elas se repetem automaticamente todo mês.
          Se o valor mudar, defina a partir de quando a mudança vale.
        </p>
      </div>

      <FixedBillForm categories={categories} people={people} />

      <FixedBillList bills={rows} />
    </div>
  );
}

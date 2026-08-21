import { prisma } from "@/lib/prisma";
import { ParcelamentosList } from "@/components/ParcelamentosList";

export const dynamic = "force-dynamic";

export default async function ParcelamentosPage() {
  const rows = await prisma.transaction.findMany({
    where: { installmentGroupId: { not: null } },
    include: { category: true, card: true, person: true },
    orderBy: { date: "asc" },
  });

  const now = new Date();
  const monthIndex = (d: Date) => d.getFullYear() * 12 + d.getMonth();
  const nowMonthIndex = monthIndex(now);
  // Parcelamentos only cares about which month absorbed each installment, never
  // the exact day — so every date shown/compared here is normalized to day 1.
  const toMonthFirstISO = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), 1).toISOString();

  const groups = new Map<
    string,
    {
      id: string;
      description: string;
      type: (typeof rows)[number]["type"];
      category: { name: string; color: string };
      card: { name: string } | null;
      person: { name: string; color: string; photo: string | null } | null;
      installmentTotal: number;
      totalAmount: number;
      elapsed: number;
      nextDate: string | null;
      nextAmount: number | null;
      firstDate: string;
      lastDate: string;
      items: { id: string; number: number; amount: number; date: string }[];
    }
  >();

  for (const t of rows) {
    const groupId = t.installmentGroupId as string;
    const existing = groups.get(groupId) ?? {
      id: groupId,
      description: t.description,
      type: t.type,
      category: { name: t.category.name, color: t.category.color },
      card: t.card ? { name: t.card.name } : null,
      person: t.person
        ? { name: t.person.name, color: t.person.color, photo: t.person.photo }
        : null,
      installmentTotal: t.installmentTotal ?? 0,
      totalAmount: 0,
      elapsed: 0,
      nextDate: null as string | null,
      nextAmount: null as number | null,
      firstDate: toMonthFirstISO(t.date),
      lastDate: toMonthFirstISO(t.date),
      items: [],
    };

    const tMonthIdx = monthIndex(t.date);
    existing.totalAmount += t.amount;
    if (tMonthIdx <= nowMonthIndex) existing.elapsed += 1;
    if (
      tMonthIdx > nowMonthIndex &&
      (existing.nextDate === null || tMonthIdx < monthIndex(new Date(existing.nextDate)))
    ) {
      existing.nextDate = toMonthFirstISO(t.date);
      existing.nextAmount = t.amount;
    }
    if (toMonthFirstISO(t.date) < existing.firstDate) existing.firstDate = toMonthFirstISO(t.date);
    if (toMonthFirstISO(t.date) > existing.lastDate) existing.lastDate = toMonthFirstISO(t.date);
    existing.items.push({
      id: t.id,
      number: t.installmentNumber ?? 0,
      amount: t.amount,
      date: toMonthFirstISO(t.date),
    });

    groups.set(groupId, existing);
  }

  const plans = Array.from(groups.values()).map((g) => ({
    ...g,
    remaining: Math.max(g.installmentTotal - g.elapsed, 0),
    items: g.items.sort((a, b) => a.number - b.number),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Parcelamentos</h1>
        <p className="text-sm text-ink-secondary">
          Todas as compras parceladas, com quantas parcelas já passaram e quantas
          faltam.
        </p>
      </div>

      <ParcelamentosList plans={plans} />
    </div>
  );
}

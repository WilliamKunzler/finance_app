import { prisma } from "@/lib/prisma";

type Revision = { amount: number; effectiveYear: number; effectiveMonth: number };

function clampDay(year: number, month: number, day: number) {
  const daysInMonth = new Date(year, month, 0).getDate();
  return Math.min(day, daysInMonth);
}

export function amountForMonth(revisions: Revision[], year: number, month: number) {
  const target = year * 12 + month;
  let applicable: Revision | null = null;
  for (const rev of revisions) {
    const revKey = rev.effectiveYear * 12 + rev.effectiveMonth;
    if (revKey <= target) {
      if (!applicable || revKey >= applicable.effectiveYear * 12 + applicable.effectiveMonth) {
        applicable = rev;
      }
    }
  }
  return applicable?.amount ?? revisions[0]?.amount ?? 0;
}

const MAX_MONTHS_AHEAD = 36;

/**
 * Ensures every active fixed bill has a generated transaction for each month
 * from its first revision up through the target month (defaults to, and never
 * less than, the current calendar month — so navigating forward in the UI to
 * a future month makes recurring bills show up there too). Idempotent and
 * safe to call on every page load.
 */
export async function syncFixedBillTransactions(
  targetYear?: number,
  targetMonth?: number
) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const requestedKey =
    targetYear != null && targetMonth != null
      ? targetYear * 12 + targetMonth
      : currentYear * 12 + currentMonth;
  const cappedKey = Math.min(
    requestedKey,
    currentYear * 12 + currentMonth + MAX_MONTHS_AHEAD
  );
  const throughKey = Math.max(cappedKey, currentYear * 12 + currentMonth);

  const bills = await prisma.fixedBill.findMany({
    where: { active: true },
    include: {
      revisions: { orderBy: [{ effectiveYear: "asc" }, { effectiveMonth: "asc" }] },
    },
  });

  for (const bill of bills) {
    if (bill.revisions.length === 0) continue;
    const first = bill.revisions[0];
    const endKey =
      bill.endYear != null && bill.endMonth != null
        ? bill.endYear * 12 + bill.endMonth
        : null;
    const billThroughKey = endKey != null ? Math.min(throughKey, endKey) : throughKey;

    const existing = await prisma.transaction.findMany({
      where: { fixedBillId: bill.id },
      select: { date: true },
    });
    const existingKeys = new Set(
      existing.map((t) => `${t.date.getFullYear()}-${t.date.getMonth() + 1}`)
    );

    let y = first.effectiveYear;
    let m = first.effectiveMonth;
    const toCreate: { date: Date; amount: number }[] = [];

    while (y * 12 + m <= billThroughKey) {
      const key = `${y}-${m}`;
      if (!existingKeys.has(key)) {
        toCreate.push({
          date: new Date(y, m - 1, clampDay(y, m, bill.dueDay)),
          amount: amountForMonth(bill.revisions, y, m),
        });
      }
      m += 1;
      if (m > 12) {
        m = 1;
        y += 1;
      }
    }

    if (toCreate.length > 0) {
      await prisma.transaction.createMany({
        data: toCreate.map(({ date, amount }) => ({
          description: bill.description,
          amount,
          date,
          type: bill.type,
          categoryId: bill.categoryId,
          paymentType: bill.paymentType,
          cardId: bill.cardId,
          personId: bill.personId,
          fixedBillId: bill.id,
        })),
      });
    }
  }
}

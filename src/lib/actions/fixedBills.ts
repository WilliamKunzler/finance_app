"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { amountForMonth } from "@/lib/fixedBillSync";
import type { TransactionType, PaymentType } from "@/generated/prisma/enums";

export type FixedBillInput = {
  description: string;
  amount: number;
  dueDay: number;
  type: TransactionType;
  categoryId: string;
  paymentType: PaymentType;
  cardId?: string | null;
  personId?: string | null;
};

function revalidateAll() {
  revalidatePath("/contas-fixas");
  revalidatePath("/");
  revalidatePath("/transacoes");
}

export async function createFixedBill(input: FixedBillInput) {
  const now = new Date();
  await prisma.fixedBill.create({
    data: {
      description: input.description,
      dueDay: input.dueDay,
      type: input.type,
      categoryId: input.categoryId,
      paymentType: input.paymentType,
      cardId: input.cardId || null,
      personId: input.personId || null,
      revisions: {
        create: {
          amount: input.amount,
          effectiveYear: now.getFullYear(),
          effectiveMonth: now.getMonth() + 1,
        },
      },
    },
  });
  revalidateAll();
}

export async function deleteFixedBill(id: string) {
  // Drop transactions that were only ever projections of this rule (dated
  // after today) — real, already-elapsed occurrences stay as history.
  await prisma.transaction.deleteMany({
    where: { fixedBillId: id, date: { gt: new Date() } },
  });
  await prisma.fixedBill.delete({ where: { id } });
  revalidateAll();
}

export async function deleteFixedBillRevision(revisionId: string) {
  const revision = await prisma.fixedBillRevision.findUnique({
    where: { id: revisionId },
  });
  if (!revision) return;

  // Only a revision that hasn't taken effect yet can be undone — once its
  // month arrives it becomes real history and must stay intact.
  const now = new Date();
  const currentKey = now.getFullYear() * 12 + (now.getMonth() + 1);
  const revisionKey = revision.effectiveYear * 12 + revision.effectiveMonth;
  if (revisionKey <= currentKey) return;

  await prisma.fixedBillRevision.delete({ where: { id: revisionId } });

  const remaining = await prisma.fixedBillRevision.findMany({
    where: { fixedBillId: revision.fixedBillId },
    orderBy: [{ effectiveYear: "asc" }, { effectiveMonth: "asc" }],
  });

  // Re-price any already-generated occurrences that had picked up this
  // revision's amount, falling back to whatever revision now applies.
  const start = new Date(revision.effectiveYear, revision.effectiveMonth - 1, 1);
  const affected = await prisma.transaction.findMany({
    where: { fixedBillId: revision.fixedBillId, date: { gte: start } },
    select: { id: true, date: true },
  });
  await prisma.$transaction(
    affected.map((t) =>
      prisma.transaction.update({
        where: { id: t.id },
        data: {
          amount: amountForMonth(remaining, t.date.getFullYear(), t.date.getMonth() + 1),
        },
      })
    )
  );

  revalidateAll();
}

export async function setFixedBillEndDate(input: {
  fixedBillId: string;
  endYear: number | null;
  endMonth: number | null;
}) {
  await prisma.fixedBill.update({
    where: { id: input.fixedBillId },
    data: { endYear: input.endYear, endMonth: input.endMonth },
  });

  // Drop any already-projected future occurrences that now fall past the
  // new end date — history up to today is never touched.
  if (input.endYear != null && input.endMonth != null) {
    const cutoff = new Date(input.endYear, input.endMonth, 1);
    await prisma.transaction.deleteMany({
      where: {
        fixedBillId: input.fixedBillId,
        AND: [{ date: { gt: new Date() } }, { date: { gte: cutoff } }],
      },
    });
  }

  revalidateAll();
}

export async function reviseFixedBillAmount(input: {
  fixedBillId: string;
  amount: number;
  effectiveYear: number;
  effectiveMonth: number;
}) {
  await prisma.fixedBillRevision.create({
    data: {
      fixedBillId: input.fixedBillId,
      amount: input.amount,
      effectiveYear: input.effectiveYear,
      effectiveMonth: input.effectiveMonth,
    },
  });

  // Apply the new amount to every already-generated occurrence from the
  // effective month onward (the month picker never allows a past month, so
  // this can never touch history that already elapsed).
  const start = new Date(input.effectiveYear, input.effectiveMonth - 1, 1);
  await prisma.transaction.updateMany({
    where: { fixedBillId: input.fixedBillId, date: { gte: start } },
    data: { amount: input.amount },
  });

  revalidateAll();
}

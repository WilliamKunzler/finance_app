"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { TransactionType, PaymentType } from "@/generated/prisma/enums";

export type TransactionInput = {
  description: string;
  amount: number;
  date: string; // yyyy-mm-dd
  type: TransactionType;
  categoryId: string;
  paymentType: PaymentType;
  cardId?: string | null;
  personId?: string | null;
  installments: number;
};

function parseLocalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function addMonthsClamped(date: Date, months: number) {
  const day = date.getDate();
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const daysInTarget = new Date(
    target.getFullYear(),
    target.getMonth() + 1,
    0
  ).getDate();
  target.setDate(Math.min(day, daysInTarget));
  return target;
}

export async function createTransaction(input: TransactionInput) {
  const usesCard =
    input.paymentType === "CREDIT_CARD" || input.paymentType === "DEBIT_CARD";
  const installments =
    input.paymentType === "CREDIT_CARD"
      ? Math.max(1, Math.floor(input.installments || 1))
      : 1;
  const purchaseDate = parseLocalDate(input.date);
  // Credit card purchases only land on next month's invoice, regardless of
  // installments — the first charge is never on the month of purchase.
  const baseDate =
    input.paymentType === "CREDIT_CARD"
      ? addMonthsClamped(purchaseDate, 1)
      : purchaseDate;
  const cardId = usesCard ? input.cardId || null : null;
  const personId = input.personId || null;

  if (installments === 1) {
    await prisma.transaction.create({
      data: {
        description: input.description,
        amount: input.amount,
        date: baseDate,
        type: input.type,
        categoryId: input.categoryId,
        paymentType: input.paymentType,
        cardId,
        personId,
      },
    });
  } else {
    const groupId = randomUUID();
    const rawShare = Math.round((input.amount / installments) * 100) / 100;
    const rows = Array.from({ length: installments }, (_, i) => {
      const isLast = i === installments - 1;
      const shareSoFar = rawShare * (installments - 1);
      const amount = isLast
        ? Math.round((input.amount - shareSoFar) * 100) / 100
        : rawShare;
      const date = addMonthsClamped(baseDate, i);
      return {
        description: input.description,
        amount,
        date,
        type: input.type,
        categoryId: input.categoryId,
        paymentType: input.paymentType,
        cardId,
        personId,
        installmentGroupId: groupId,
        installmentNumber: i + 1,
        installmentTotal: installments,
      };
    });
    await prisma.transaction.createMany({ data: rows });
  }

  revalidatePath("/");
  revalidatePath("/transacoes");
}

export type TransactionUpdateInput = {
  description: string;
  amount: number;
  date: string;
  type: TransactionType;
  categoryId: string;
  paymentType: PaymentType;
  cardId?: string | null;
  personId?: string | null;
};

export async function updateTransaction(id: string, input: TransactionUpdateInput) {
  const usesCard =
    input.paymentType === "CREDIT_CARD" || input.paymentType === "DEBIT_CARD";

  await prisma.transaction.update({
    where: { id },
    data: {
      description: input.description,
      amount: input.amount,
      date: parseLocalDate(input.date),
      type: input.type,
      categoryId: input.categoryId,
      paymentType: input.paymentType,
      cardId: usesCard ? input.cardId || null : null,
      personId: input.personId || null,
    },
  });

  revalidatePath("/");
  revalidatePath("/transacoes");
}

export async function deleteTransaction(id: string, wholeGroup: boolean) {
  if (wholeGroup) {
    const tx = await prisma.transaction.findUnique({ where: { id } });
    if (tx?.installmentGroupId) {
      await prisma.transaction.deleteMany({
        where: { installmentGroupId: tx.installmentGroupId },
      });
    } else {
      await prisma.transaction.delete({ where: { id } });
    }
  } else {
    await prisma.transaction.delete({ where: { id } });
  }

  revalidatePath("/");
  revalidatePath("/transacoes");
}

"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { CardType } from "@/generated/prisma/enums";

export async function createCard(input: {
  name: string;
  type: CardType;
  closingDay?: number | null;
  dueDay?: number | null;
  personId?: string | null;
}) {
  await prisma.card.create({
    data: {
      name: input.name,
      type: input.type,
      closingDay: input.type === "CREDIT" ? input.closingDay : null,
      dueDay: input.type === "CREDIT" ? input.dueDay : null,
      personId: input.personId || null,
    },
  });
  revalidatePath("/cartoes");
  revalidatePath("/transacoes");
}

export async function deleteCard(id: string) {
  await prisma.card.delete({ where: { id } });
  revalidatePath("/cartoes");
  revalidatePath("/transacoes");
}

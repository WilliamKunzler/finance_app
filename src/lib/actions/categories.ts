"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { TransactionType } from "@/generated/prisma/enums";

export async function createCategory(input: {
  name: string;
  type: TransactionType;
  color: string;
}) {
  await prisma.category.create({ data: input });
  revalidatePath("/categorias");
}

export async function deleteCategory(id: string) {
  await prisma.category.delete({ where: { id } });
  revalidatePath("/categorias");
}

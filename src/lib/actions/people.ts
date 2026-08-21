"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createPerson(input: {
  name: string;
  color: string;
  photo?: string | null;
}) {
  await prisma.person.create({
    data: { name: input.name, color: input.color, photo: input.photo || null },
  });
  revalidatePath("/pessoas");
  revalidatePath("/cartoes");
  revalidatePath("/transacoes");
  revalidatePath("/contas-fixas");
}

export async function deletePerson(id: string) {
  const cardCount = await prisma.card.count({ where: { personId: id } });
  if (cardCount > 0) {
    throw new Error(
      `Não é possível excluir: há ${cardCount} cartão${cardCount > 1 ? "ões" : ""} vinculado${cardCount > 1 ? "s" : ""} a essa pessoa. Exclua ou reatribua os cartões primeiro.`
    );
  }
  await prisma.person.delete({ where: { id } });
  revalidatePath("/pessoas");
  revalidatePath("/cartoes");
  revalidatePath("/transacoes");
}

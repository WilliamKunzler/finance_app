import { prisma } from "@/lib/prisma";
import { CardForm } from "@/components/CardForm";
import { CardList } from "@/components/CardList";

export const dynamic = "force-dynamic";

export default async function CartoesPage() {
  const [cards, people] = await Promise.all([
    prisma.card.findMany({
      orderBy: { name: "asc" },
      include: { person: true },
    }),
    prisma.person.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Cartões</h1>
        <p className="text-sm text-ink-secondary">
          Cadastre cartões de crédito e débito e atribua a uma pessoa.
        </p>
      </div>
      <CardForm people={people} />
      <CardList cards={cards} />
    </div>
  );
}

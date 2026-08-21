import { prisma } from "@/lib/prisma";
import { PersonForm } from "@/components/PersonForm";
import { PersonList } from "@/components/PersonList";

export const dynamic = "force-dynamic";

export default async function PessoasPage() {
  const people = await prisma.person.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Pessoas</h1>
        <p className="text-sm text-ink-secondary">
          Cadastre quem participa das suas finanças para atribuir cartões e
          lançamentos.
        </p>
      </div>
      <PersonForm />
      <PersonList people={people} />
    </div>
  );
}

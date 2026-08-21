import { prisma } from "@/lib/prisma";
import { CategoriesPanel } from "@/components/CategoriesPanel";

export const dynamic = "force-dynamic";

export default async function CategoriasPage() {
  const categories = await prisma.category.findMany({
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Categorias</h1>
        <p className="text-sm text-ink-secondary">
          Organize suas entradas, saídas e investimentos por categoria.
        </p>
      </div>
      <CategoriesPanel categories={categories} />
    </div>
  );
}

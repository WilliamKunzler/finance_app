"use client";

import { useMemo, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteCategory } from "@/lib/actions/categories";
import { useConfirm } from "@/components/ConfirmProvider";
import type { TransactionType } from "@/generated/prisma/enums";

const typeLabels: Record<TransactionType, string> = {
  INCOME: "Entrada",
  EXPENSE: "Saída",
  INVESTMENT: "Investimento",
};

type Category = { id: string; name: string; type: TransactionType; color: string };

export function CategoryList({
  categories,
  filter,
}: {
  categories: Category[];
  filter: TransactionType;
}) {
  const [isPending, startTransition] = useTransition();
  const confirm = useConfirm();

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === filter),
    [categories, filter]
  );

  async function handleDelete(id: string, name: string) {
    const result = await confirm({
      title: "Excluir categoria",
      description: `Excluir "${name}"? Isso falhará se houver lançamentos vinculados.`,
      confirmLabel: "Excluir",
      danger: true,
    });
    if (result !== "confirm") return;
    startTransition(() => deleteCategory(id));
  }

  return (
    <div className="flex flex-col gap-3">
      {filteredCategories.length === 0 ? (
        <p className="text-sm text-ink-muted">Nenhuma categoria neste tipo.</p>
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-surface shadow-sm">
          {filteredCategories.map((c) => (
            <li key={c.id} className="flex items-center justify-between px-4 py-2.5">
              <span className="flex items-center gap-2 text-sm text-ink">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: c.color }}
                />
                {c.name}
                <span className="text-xs text-ink-muted">{typeLabels[c.type]}</span>
              </span>
              <button
                disabled={isPending}
                onClick={() => handleDelete(c.id, c.name)}
                className="text-ink-muted transition-colors hover:text-critical disabled:opacity-50"
                aria-label="Excluir categoria"
              >
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

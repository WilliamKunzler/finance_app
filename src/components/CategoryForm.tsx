"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { createCategory } from "@/lib/actions/categories";
import { Select } from "@/components/Select";
import type { TransactionType } from "@/generated/prisma/enums";

const typeLabels: Record<TransactionType, string> = {
  INCOME: "Entrada",
  EXPENSE: "Saída",
  INVESTMENT: "Investimento",
};

export function CategoryForm({
  type,
  onTypeChange,
}: {
  type: TransactionType;
  onTypeChange: (type: TransactionType) => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState("#00725E");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;
    startTransition(async () => {
      await createCategory({ name, type, color });
      setName("");
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm"
    >
      <label className="flex flex-col gap-1 text-sm text-ink-secondary">
        Nome
        <input
          className="h-10 rounded-lg border border-border bg-transparent px-3 text-ink outline-none focus:border-accent"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Pets"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-ink-secondary min-w-40">
        Tipo
        <Select
          value={type}
          onChange={(e) => onTypeChange(e.target.value as TransactionType)}
        >
          {(Object.keys(typeLabels) as TransactionType[]).map((t) => (
            <option key={t} value={t}>
              {typeLabels[t]}
            </option>
          ))}
        </Select>
      </label>
      <label className="flex flex-col gap-1 text-sm text-ink-secondary">
        Cor
        <input
          type="color"
          className="h-10 w-14 rounded-lg overflow-hidden cursor-pointer"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
      </label>
      <button
        type="submit"
        disabled={isPending}
        className="btn-brand flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-medium text-white transition-colors disabled:opacity-50"
      >
        <Plus size={16} />
        Adicionar
      </button>
    </form>
  );
}

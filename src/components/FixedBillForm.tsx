"use client";

import { useMemo, useState, useTransition } from "react";
import { TrendingUp, TrendingDown, PiggyBank, Plus } from "lucide-react";
import { createFixedBill } from "@/lib/actions/fixedBills";
import { CurrencyInput } from "@/components/CurrencyInput";
import { Select } from "@/components/Select";
import type { TransactionType } from "@/generated/prisma/enums";

type Category = { id: string; name: string; type: TransactionType };
type Person = { id: string; name: string; color: string };

const typeConfig: Record<TransactionType, { label: string; icon: typeof TrendingUp }> = {
  INCOME: { label: "Entrada", icon: TrendingUp },
  EXPENSE: { label: "Saída", icon: TrendingDown },
  INVESTMENT: { label: "Investimento", icon: PiggyBank },
};

const DEFAULT_DUE_DAY = 1;

export function FixedBillForm({
  categories,
  people,
}: {
  categories: Category[];
  people: Person[];
}) {
  const [type, setType] = useState<TransactionType>("EXPENSE");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState(0);
  const [categoryId, setCategoryId] = useState("");
  const [personId, setPersonId] = useState("");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type]
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description || !amount || !categoryId) {
      setMessage("Preencha descrição, valor e categoria.");
      return;
    }
    const finalPaymentType = type === "INCOME" ? "PIX" : "OTHER";
    startTransition(async () => {
      await createFixedBill({
        description,
        amount,
        dueDay: DEFAULT_DUE_DAY,
        type,
        categoryId,
        paymentType: finalPaymentType,
        cardId: null,
        personId: personId || null,
      });
      setDescription("");
      setAmount(0);
      setCategoryId("");
      setMessage("Conta fixa cadastrada.");
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 rounded-2xl border border-border bg-surface p-5 shadow-sm"
    >
      <div className="flex flex-wrap gap-2">
        {(Object.keys(typeConfig) as TransactionType[]).map((t) => {
          const Icon = typeConfig[t].icon;
          const active = type === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => {
                setType(t);
                setCategoryId("");
              }}
              className={`flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors ${
                active
                  ? "btn-brand text-white border-transparent"
                  : "border-border text-ink-secondary hover:border-ink-muted"
              }`}
            >
              <Icon size={16} />
              {typeConfig[t].label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="flex flex-col gap-1 text-sm text-ink-secondary">
          Descrição
          <input
            className="h-10 rounded-lg border border-border bg-transparent px-3 text-ink outline-none focus:border-accent"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Aluguel"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-ink-secondary">
          Valor previsto
          <CurrencyInput
            value={amount}
            onChange={setAmount}
            className="rounded-lg border border-border bg-transparent text-ink outline-none focus:border-accent"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-ink-secondary">
          Categoria
          <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Selecione</option>
            {filteredCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </label>

        <label className="flex flex-col gap-1 text-sm text-ink-secondary">
          Pessoa (opcional)
          <Select value={personId} onChange={(e) => setPersonId(e.target.value)}>
            <option value="">Ninguém</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="btn-brand flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-medium text-white transition-colors disabled:opacity-50"
        >
          <Plus size={16} />
          Cadastrar conta fixa
        </button>
        {message && <span className="text-sm text-ink-muted">{message}</span>}
      </div>
    </form>
  );
}

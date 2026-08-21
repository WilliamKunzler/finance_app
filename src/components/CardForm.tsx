"use client";

import { useState, useTransition } from "react";
import { CreditCard, Wallet, Plus } from "lucide-react";
import { createCard } from "@/lib/actions/cards";
import { Select } from "@/components/Select";
import type { CardType } from "@/generated/prisma/enums";

type Person = { id: string; name: string; color: string };

export function CardForm({ people }: { people: Person[] }) {
  const [name, setName] = useState("");
  const [type, setType] = useState<CardType>("CREDIT");
  const [closingDay, setClosingDay] = useState("1");
  const [dueDay, setDueDay] = useState("10");
  const [personId, setPersonId] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;
    startTransition(async () => {
      await createCard({
        name,
        type,
        closingDay: type === "CREDIT" ? Number(closingDay) : null,
        dueDay: type === "CREDIT" ? Number(dueDay) : null,
        personId: personId || null,
      });
      setName("");
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4 shadow-sm"
    >
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setType("CREDIT")}
          className={`flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors ${
            type === "CREDIT"
              ? "border-accent bg-accent-soft text-accent-hover"
              : "border-border text-ink-secondary"
          }`}
        >
          <CreditCard size={16} />
          Crédito
        </button>
        <button
          type="button"
          onClick={() => setType("DEBIT")}
          className={`flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors ${
            type === "DEBIT"
              ? "border-info bg-info-soft text-info"
              : "border-border text-ink-secondary"
          }`}
        >
          <Wallet size={16} />
          Débito
        </button>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm text-ink-secondary">
          Nome
          <input
            className="h-10 rounded-lg border border-border bg-transparent px-3 text-ink outline-none focus:border-accent"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Nubank"
          />
        </label>

        {type === "CREDIT" && (
          <>
            <label className="flex flex-col gap-1 text-sm text-ink-secondary">
              Fecha dia
              <input
                type="number"
                min={1}
                max={31}
                className="w-24 h-10 rounded-lg border border-border bg-transparent px-3 text-ink outline-none focus:border-accent"
                value={closingDay}
                onChange={(e) => setClosingDay(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm text-ink-secondary">
              Vence dia
              <input
                type="number"
                min={1}
                max={31}
                className="w-24 h-10 rounded-lg border border-border bg-transparent px-3 text-ink outline-none focus:border-accent"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
              />
            </label>
          </>
        )}

        <label className="flex flex-col gap-1 text-sm text-ink-secondary min-w-40">
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

        <button
          type="submit"
          disabled={isPending}
          className="btn-brand flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-medium text-white transition-colors disabled:opacity-50"
        >
          <Plus size={16} />
          Adicionar cartão
        </button>
      </div>
    </form>
  );
}

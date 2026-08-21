"use client";

import { useRef, useState } from "react";
import { TransactionForm } from "@/components/TransactionForm";
import { TransactionList, type TransactionRow } from "@/components/TransactionList";
import type { TransactionType, CardType } from "@/generated/prisma/enums";

type Category = { id: string; name: string; type: TransactionType };
type Card = { id: string; name: string; type: CardType };
type Person = { id: string; name: string; color: string };

export function TransactionsPanel({
  rows,
  categories,
  cards,
  people,
}: {
  rows: TransactionRow[];
  categories: Category[];
  cards: Card[];
  people: Person[];
}) {
  const [editingRow, setEditingRow] = useState<TransactionRow | null>(null);
  const formTopRef = useRef<HTMLDivElement>(null);

  function handleEdit(row: TransactionRow) {
    setEditingRow(row);
    formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="flex flex-col gap-6">
      <div ref={formTopRef}>
        <TransactionForm
          categories={categories}
          cards={cards}
          people={people}
          editing={editingRow}
          onDoneEditing={() => setEditingRow(null)}
        />
      </div>

      <TransactionList
        rows={rows}
        editingId={editingRow?.id ?? null}
        onEdit={handleEdit}
      />
    </div>
  );
}

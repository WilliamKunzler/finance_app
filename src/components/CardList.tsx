"use client";

import { useTransition } from "react";
import { CreditCard, Wallet, Trash2 } from "lucide-react";
import { deleteCard } from "@/lib/actions/cards";
import { Avatar } from "@/components/Avatar";
import { useConfirm } from "@/components/ConfirmProvider";
import type { CardType } from "@/generated/prisma/enums";

type Card = {
  id: string;
  name: string;
  type: CardType;
  closingDay: number | null;
  dueDay: number | null;
  person: { name: string; color: string; photo: string | null } | null;
};

const gradients: Record<CardType, string> = {
  CREDIT: "linear-gradient(135deg, #002220 0%, #000000 100%)",
  DEBIT: "linear-gradient(135deg, #48AAA3 0%, #00725E 100%)",
};

const iconColors: Record<CardType, string> = {
  CREDIT: "#48AAA3",
  DEBIT: "#FFFFFF",
};

export function CardList({ cards }: { cards: Card[] }) {
  const [isPending, startTransition] = useTransition();
  const confirm = useConfirm();

  async function handleDelete(id: string, name: string) {
    const result = await confirm({
      title: "Excluir cartão",
      description: `Excluir "${name}"? Os lançamentos já feitos com esse cartão serão mantidos, apenas deixam de mostrar o cartão.`,
      confirmLabel: "Excluir",
      danger: true,
    });
    if (result !== "confirm") return;
    startTransition(() => deleteCard(id));
  }

  if (cards.length === 0) {
    return (
      <p className="text-sm text-ink-muted">Nenhum cartão cadastrado ainda.</p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((c) => (
        <div
          key={c.id}
          className="relative flex flex-col justify-between rounded-2xl p-4 text-white shadow-sm min-h-36"
          style={{ background: gradients[c.type] }}
        >
          <button
            disabled={isPending}
            onClick={() => handleDelete(c.id, c.name)}
            className="absolute right-3 top-3 text-white/70 transition-colors hover:text-white disabled:opacity-50"
            aria-label="Excluir cartão"
          >
            <Trash2 size={16} />
          </button>

          <div
            className="flex items-center gap-2 text-sm font-medium text-white/90"
            style={{ color: iconColors[c.type] }}
          >
            {c.type === "CREDIT" ? (
              <CreditCard size={18} />
            ) : (
              <Wallet size={18} />
            )}
            <span className="text-white/90">
              {c.type === "CREDIT" ? "Crédito" : "Débito"}
            </span>
          </div>

          <div className="mt-4 text-lg font-semibold">{c.name}</div>

          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-white/80">
              {c.type === "CREDIT"
                ? `Fecha dia ${c.closingDay} · Vence dia ${c.dueDay}`
                : "Débito imediato"}
            </span>
            {c.person && (
              <span className="flex items-center gap-1.5 rounded-full bg-white/15 pl-1 pr-2.5 py-1">
                <Avatar
                  name={c.person.name}
                  color={c.person.color}
                  photo={c.person.photo}
                  size={20}
                />
                <span className="text-xs font-medium text-white">
                  {c.person.name}
                </span>
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

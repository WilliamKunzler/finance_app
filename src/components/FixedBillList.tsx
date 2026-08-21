"use client";

import { useState, useTransition } from "react";
import {
  CreditCard,
  Wallet,
  QrCode,
  Banknote,
  MoreHorizontal,
  HandCoins,
  Trash2,
  Pencil,
  Repeat,
  X,
} from "lucide-react";
import {
  reviseFixedBillAmount,
  setFixedBillEndDate,
  deleteFixedBill,
  deleteFixedBillRevision,
} from "@/lib/actions/fixedBills";
import { CurrencyInput } from "@/components/CurrencyInput";
import { MonthPicker } from "@/components/MonthPicker";
import { Avatar } from "@/components/Avatar";
import { useConfirm } from "@/components/ConfirmProvider";
import { formatCurrency, monthLabel } from "@/lib/format";
import type { PaymentType, TransactionType } from "@/generated/prisma/enums";

type BillRow = {
  id: string;
  description: string;
  dueDay: number;
  type: TransactionType;
  paymentType: PaymentType;
  category: { name: string; color: string };
  card: { name: string } | null;
  person: { name: string; color: string; photo: string | null } | null;
  currentAmount: number;
  nextChange: { id: string; amount: number; year: number; month: number } | null;
  activeSince: { year: number; month: number };
  endDate: { year: number; month: number } | null;
};

const paymentIcon: Record<PaymentType, typeof CreditCard> = {
  CREDIT_CARD: CreditCard,
  DEBIT_CARD: Wallet,
  PIX: QrCode,
  CASH: Banknote,
  OTHER: MoreHorizontal,
  INVESTMENT_WITHDRAWAL: HandCoins,
};

const typeSign: Record<TransactionType, string> = {
  INCOME: "+",
  EXPENSE: "-",
  INVESTMENT: "-",
};

function nextMonthValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function monthValue(date: { year: number; month: number } | null) {
  return date ? `${date.year}-${String(date.month).padStart(2, "0")}` : "";
}

function BillRowItem({ bill }: { bill: BillRow }) {
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState(bill.currentAmount);
  const [effectiveMonth, setEffectiveMonth] = useState(nextMonthValue());
  const [endMonth, setEndMonth] = useState(monthValue(bill.endDate));
  const [isPending, startTransition] = useTransition();
  const confirm = useConfirm();
  const PaymentIcon = paymentIcon[bill.paymentType];

  function handleSave() {
    const [y, m] = effectiveMonth.split("-").map(Number);
    const [endY, endM] = endMonth ? endMonth.split("-").map(Number) : [null, null];
    startTransition(async () => {
      if (amount !== bill.currentAmount) {
        await reviseFixedBillAmount({
          fixedBillId: bill.id,
          amount,
          effectiveYear: y,
          effectiveMonth: m,
        });
      }
      if (endMonth !== monthValue(bill.endDate)) {
        await setFixedBillEndDate({
          fixedBillId: bill.id,
          endYear: endY,
          endMonth: endM,
        });
      }
      setEditing(false);
    });
  }

  async function handleDelete() {
    const result = await confirm({
      title: "Excluir conta fixa",
      description: `Excluir "${bill.description}"? Lançamentos já gerados não serão apagados.`,
      confirmLabel: "Excluir",
      danger: true,
    });
    if (result !== "confirm") return;
    startTransition(() => deleteFixedBill(bill.id));
  }

  async function handleCancelChange() {
    if (!bill.nextChange) return;
    const result = await confirm({
      title: "Cancelar mudança de valor",
      description: `Cancelar a mudança para ${formatCurrency(bill.nextChange.amount)} agendada para ${monthLabel(bill.nextChange.year, bill.nextChange.month)}?`,
      confirmLabel: "Cancelar mudança",
      danger: true,
    });
    if (result !== "confirm") return;
    startTransition(() => deleteFixedBillRevision(bill.nextChange!.id));
  }

  return (
    <div className="border-t border-border px-4 py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: `${bill.category.color}22`, color: bill.category.color }}
          >
            <PaymentIcon size={16} />
          </span>
          <div>
            <div className="font-medium text-ink">{bill.description}</div>
            <div className="flex flex-wrap items-center gap-x-2 text-xs text-ink-muted">
              <span>{bill.category.name}</span>
              <span>·</span>
              <span>Desde {monthLabel(bill.activeSince.year, bill.activeSince.month)}</span>
              {bill.endDate && (
                <>
                  <span>·</span>
                  <span>Até {monthLabel(bill.endDate.year, bill.endDate.month)}</span>
                </>
              )}
              {bill.card && (
                <>
                  <span>·</span>
                  <span>{bill.card.name}</span>
                </>
              )}
              {bill.person && (
                <>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1">
                    <Avatar name={bill.person.name} color={bill.person.color} photo={bill.person.photo} size={14} />
                    {bill.person.name}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-ink">
            {typeSign[bill.type]} {formatCurrency(bill.currentAmount)}
          </span>
          <button
            disabled={isPending}
            onClick={() => setEditing((v) => !v)}
            className="flex h-10 items-center gap-1 rounded-lg border border-border px-3 text-xs text-ink-secondary transition-colors hover:border-ink-muted disabled:opacity-50"
          >
            <Pencil size={13} />
            Alterar valor
          </button>
          <button
            disabled={isPending}
            onClick={handleDelete}
            className="text-ink-muted transition-colors hover:text-critical disabled:opacity-50"
            aria-label="Excluir conta fixa"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {bill.nextChange && !editing && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-muted">
          <Repeat size={12} />
          Muda para {formatCurrency(bill.nextChange.amount)} a partir de{" "}
          {monthLabel(bill.nextChange.year, bill.nextChange.month)}
          <button
            type="button"
            disabled={isPending}
            onClick={handleCancelChange}
            className="ml-1 text-ink-muted transition-colors hover:text-critical disabled:opacity-50"
            aria-label="Cancelar mudança de valor"
          >
            <X size={12} />
          </button>
        </p>
      )}

      {editing && (
        <div className="mt-3 flex flex-wrap items-end gap-3 rounded-lg bg-bg p-3">
          <label className="flex flex-col gap-1 text-xs text-ink-secondary">
            Novo valor
            <div className="w-36">
              <CurrencyInput value={amount} onChange={setAmount} className="rounded-lg border border-border bg-surface text-ink outline-none focus:border-accent" />
            </div>
          </label>
          <label className="flex flex-col gap-1 text-xs text-ink-secondary">
            A partir de
            <div className="w-40">
              <MonthPicker value={effectiveMonth} onChange={setEffectiveMonth} min={nextMonthValue()} />
            </div>
          </label>
          <label className="flex flex-col gap-1 text-xs text-ink-secondary">
            Até quando (opcional)
            <div className="flex items-center gap-1.5">
              <div className="w-40">
                <MonthPicker value={endMonth} onChange={setEndMonth} placeholder="Sem data final" />
              </div>
              {endMonth && (
                <button
                  type="button"
                  onClick={() => setEndMonth("")}
                  className="h-10 shrink-0 rounded-lg border border-border px-2 text-xs text-ink-secondary transition-colors hover:border-ink-muted"
                >
                  Sem data final
                </button>
              )}
            </div>
          </label>
          <button
            disabled={isPending || !amount}
            onClick={handleSave}
            className="btn-brand h-10 rounded-lg px-4 text-xs font-medium text-white transition-colors disabled:opacity-50"
          >
            Salvar
          </button>
          <button
            disabled={isPending}
            onClick={() => setEditing(false)}
            className="h-10 rounded-lg border border-border px-4 text-xs text-ink-secondary transition-colors hover:border-ink-muted"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}

export function FixedBillList({ bills }: { bills: BillRow[] }) {
  if (bills.length === 0) {
    return (
      <p className="text-sm text-ink-muted">Nenhuma conta fixa cadastrada ainda.</p>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface shadow-sm">
      {bills.map((bill) => (
        <BillRowItem key={bill.id} bill={bill} />
      ))}
    </div>
  );
}

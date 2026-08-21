"use client";

import { useMemo, useState, useTransition } from "react";
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
} from "lucide-react";
import { deleteTransaction } from "@/lib/actions/transactions";
import { formatCurrency, formatDate } from "@/lib/format";
import { Avatar } from "@/components/Avatar";
import { Select } from "@/components/Select";
import { useConfirm } from "@/components/ConfirmProvider";
import type { TransactionType, PaymentType } from "@/generated/prisma/enums";

export type TransactionRow = {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: TransactionType;
  paymentType: PaymentType;
  categoryId: string;
  cardId: string | null;
  personId: string | null;
  category: { name: string; color: string };
  card: { name: string } | null;
  person: { name: string; color: string; photo: string | null } | null;
  installmentGroupId: string | null;
  installmentNumber: number | null;
  installmentTotal: number | null;
  fixedBillId: string | null;
};

const typeColor: Record<TransactionType, string> = {
  INCOME: "text-good",
  EXPENSE: "text-critical",
  INVESTMENT: "text-info",
};

const typeSign: Record<TransactionType, string> = {
  INCOME: "+",
  EXPENSE: "-",
  INVESTMENT: "-",
};

type FilterValue = TransactionType | "ALL" | "INVESTMENT_WITHDRAWAL";

const typeFilters: { value: FilterValue; label: string }[] = [
  { value: "ALL", label: "Todos" },
  { value: "INCOME", label: "Entradas" },
  { value: "EXPENSE", label: "Saídas" },
  { value: "INVESTMENT", label: "Investimentos" },
  { value: "INVESTMENT_WITHDRAWAL", label: "Retiradas de investimento" },
];

const paymentConfig: Record<PaymentType, { label: string; icon: typeof CreditCard }> = {
  CREDIT_CARD: { label: "Crédito", icon: CreditCard },
  DEBIT_CARD: { label: "Débito", icon: Wallet },
  PIX: { label: "Pix", icon: QrCode },
  CASH: { label: "Dinheiro", icon: Banknote },
  OTHER: { label: "Outro", icon: MoreHorizontal },
  INVESTMENT_WITHDRAWAL: { label: "Retirado do investimento", icon: HandCoins },
};

export function TransactionList({
  rows,
  editingId,
  onEdit,
}: {
  rows: TransactionRow[];
  editingId?: string | null;
  onEdit: (row: TransactionRow) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState<FilterValue>("ALL");
  const confirm = useConfirm();

  const filteredRows = useMemo(() => {
    if (filter === "ALL") return rows;
    if (filter === "INVESTMENT_WITHDRAWAL") {
      return rows.filter((r) => r.paymentType === "INVESTMENT_WITHDRAWAL");
    }
    return rows.filter((r) => r.type === filter);
  }, [rows, filter]);

  async function handleDelete(row: TransactionRow) {
    if (row.installmentGroupId) {
      const result = await confirm({
        title: "Excluir parcela",
        description: `"${row.description}" faz parte de uma compra parcelada (${row.installmentNumber}/${row.installmentTotal}). O que deseja excluir?`,
        confirmLabel: "Só esta parcela",
        extraLabel: "Todas as parcelas",
        danger: true,
      });
      if (result === "cancel") return;
      startTransition(() => deleteTransaction(row.id, result === "extra"));
      return;
    }

    const result = await confirm({
      title: "Excluir lançamento",
      description: `Tem certeza que deseja excluir "${row.description}"?`,
      confirmLabel: "Excluir",
      danger: true,
    });
    if (result !== "confirm") return;
    startTransition(() => deleteTransaction(row.id, false));
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="w-56">
        <Select value={filter} onChange={(e) => setFilter(e.target.value as FilterValue)}>
          {typeFilters.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </Select>
      </div>

      {filteredRows.length === 0 ? (
        <p className="text-sm text-ink-muted">Nenhum lançamento neste período.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-surface shadow-sm">
          <table className="w-full text-sm">
            <thead className="text-left text-ink-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">Descrição</th>
                <th className="px-4 py-3 font-medium">Categoria</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Pagamento</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Pessoa</th>
                <th className="px-4 py-3 font-medium text-right">Valor</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => {
                const payment = paymentConfig[row.paymentType];
                const PaymentIcon = payment.icon;
                const isEditing = editingId === row.id;
                return (
                  <tr
                    key={row.id}
                    className={`border-t border-border transition-colors ${
                      isEditing ? "bg-accent-soft" : ""
                    }`}
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-ink-secondary">
                      {formatDate(new Date(row.date))}
                    </td>
                    <td className="px-4 py-3 text-ink">
                      {row.description}
                      {row.installmentTotal ? (
                        <span className="ml-2 text-xs text-ink-muted">
                          {row.installmentNumber}/{row.installmentTotal}
                        </span>
                      ) : null}
                      {row.fixedBillId ? (
                        <Repeat
                          size={12}
                          className="ml-2 inline text-ink-muted"
                          aria-label="Conta fixa"
                        />
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 text-ink-secondary">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: row.category.color }}
                        />
                        {row.category.name}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-secondary hidden sm:table-cell">
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                        <PaymentIcon size={14} className="text-ink-muted shrink-0" />
                        {row.card?.name ?? payment.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {row.person ? (
                        <span className="inline-flex items-center gap-1.5 text-ink-secondary whitespace-nowrap">
                          <Avatar
                            name={row.person.name}
                            color={row.person.color}
                            photo={row.person.photo}
                            size={20}
                          />
                          {row.person.name}
                        </span>
                      ) : (
                        <span className="text-ink-muted">-</span>
                      )}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-medium whitespace-nowrap ${typeColor[row.type]}`}
                    >
                      {typeSign[row.type]} {formatCurrency(row.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => onEdit(row)}
                          className="text-ink-muted transition-colors hover:text-accent"
                          aria-label="Editar lançamento"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          disabled={isPending}
                          onClick={() => handleDelete(row)}
                          className="text-ink-muted transition-colors hover:text-critical disabled:opacity-50"
                          aria-label="Excluir lançamento"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

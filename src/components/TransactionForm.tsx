"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  CreditCard,
  Wallet,
  QrCode,
  Banknote,
  MoreHorizontal,
  HandCoins,
  X,
} from "lucide-react";
import { createTransaction, updateTransaction } from "@/lib/actions/transactions";
import { CurrencyInput } from "@/components/CurrencyInput";
import { DatePicker } from "@/components/DatePicker";
import { Select } from "@/components/Select";
import type { TransactionType, PaymentType, CardType } from "@/generated/prisma/enums";

type Category = { id: string; name: string; type: TransactionType };
type Card = { id: string; name: string; type: CardType };
type Person = { id: string; name: string; color: string };

export type EditableTransaction = {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: TransactionType;
  paymentType: PaymentType;
  categoryId: string;
  cardId: string | null;
  personId: string | null;
};

const typeConfig: Record<
  TransactionType,
  { label: string; icon: typeof TrendingUp }
> = {
  INCOME: { label: "Entrada", icon: TrendingUp },
  EXPENSE: { label: "Saída", icon: TrendingDown },
  INVESTMENT: { label: "Investimento", icon: PiggyBank },
};

const paymentConfig: Record<
  PaymentType,
  { label: string; icon: typeof CreditCard }
> = {
  CREDIT_CARD: { label: "Crédito", icon: CreditCard },
  DEBIT_CARD: { label: "Débito", icon: Wallet },
  PIX: { label: "Pix", icon: QrCode },
  CASH: { label: "Dinheiro", icon: Banknote },
  OTHER: { label: "Outro", icon: MoreHorizontal },
  INVESTMENT_WITHDRAWAL: { label: "Retirar do investimento", icon: HandCoins },
};

function todayISO() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 10);
}

export function TransactionForm({
  categories,
  cards,
  people,
  editing,
  onDoneEditing,
}: {
  categories: Category[];
  cards: Card[];
  people: Person[];
  editing?: EditableTransaction | null;
  onDoneEditing?: () => void;
}) {
  const [type, setType] = useState<TransactionType>("EXPENSE");
  const [paymentType, setPaymentType] = useState<PaymentType>("PIX");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState(todayISO());
  const [categoryId, setCategoryId] = useState("");
  const [cardId, setCardId] = useState("");
  const [personId, setPersonId] = useState("");
  const [installments, setInstallments] = useState("1");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const descriptionRef = useRef<HTMLInputElement>(null);
  const [lastEditingId, setLastEditingId] = useState<string | null>(null);

  const editingId = editing?.id ?? null;
  if (editingId !== lastEditingId) {
    setLastEditingId(editingId);
    if (editing) {
      setType(editing.type);
      setPaymentType(editing.paymentType);
      setDescription(editing.description);
      setAmount(editing.amount);
      setDate(editing.date.slice(0, 10));
      setCategoryId(editing.categoryId);
      setCardId(editing.cardId ?? "");
      setPersonId(editing.personId ?? "");
      setInstallments("1");
      setMessage(null);
    } else {
      setType("EXPENSE");
      setPaymentType("PIX");
      setDescription("");
      setAmount(0);
      setDate(todayISO());
      setCategoryId("");
      setCardId("");
      setPersonId("");
      setInstallments("1");
    }
  }

  useEffect(() => {
    if (!editingId) return;
    const raf = requestAnimationFrame(() => descriptionRef.current?.focus());
    return () => cancelAnimationFrame(raf);
  }, [editingId]);

  const filteredCategories = useMemo(
    () => categories.filter((c) => c.type === type),
    [categories, type]
  );

  const visiblePaymentTypes = useMemo(
    () =>
      (Object.keys(paymentConfig) as PaymentType[]).filter(
        (p) => p !== "INVESTMENT_WITHDRAWAL" || type === "EXPENSE"
      ),
    [type]
  );

  const cardTypeNeeded: CardType | null =
    paymentType === "CREDIT_CARD" ? "CREDIT" : paymentType === "DEBIT_CARD" ? "DEBIT" : null;

  const filteredCards = useMemo(
    () => cards.filter((c) => c.type === cardTypeNeeded),
    [cards, cardTypeNeeded]
  );

  function resetForm() {
    setType("EXPENSE");
    setPaymentType("PIX");
    setDescription("");
    setAmount(0);
    setDate(todayISO());
    setCategoryId("");
    setCardId("");
    setPersonId("");
    setInstallments("1");
  }

  function handleCancelEdit() {
    resetForm();
    setMessage(null);
    onDoneEditing?.();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description || !amount || !categoryId || !date) {
      setMessage("Preencha descrição, valor, data e categoria.");
      return;
    }
    if (type === "EXPENSE" && cardTypeNeeded && !cardId) {
      setMessage("Selecione o cartão.");
      return;
    }
    const finalPaymentType =
      type === "INVESTMENT" ? "OTHER" : type === "INCOME" ? "PIX" : paymentType;
    const finalCardId = type === "EXPENSE" && cardTypeNeeded ? cardId : null;
    startTransition(async () => {
      if (editing) {
        await updateTransaction(editing.id, {
          description,
          amount,
          date,
          type,
          categoryId,
          paymentType: finalPaymentType,
          cardId: finalCardId,
          personId: personId || null,
        });
        resetForm();
        onDoneEditing?.();
      } else {
        await createTransaction({
          description,
          amount,
          date,
          type,
          categoryId,
          paymentType: finalPaymentType,
          cardId: finalCardId,
          personId: personId || null,
          installments: Number(installments) || 1,
        });
        setMessage("Lançamento salvo.");
        resetForm();
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex flex-col gap-5 rounded-2xl border bg-surface p-5 shadow-sm transition-colors ${
        editing ? "border-accent" : "border-border"
      }`}
    >
      {editing && (
        <div className="flex items-center justify-between rounded-lg bg-accent-soft px-3 py-2 text-sm text-accent-hover">
          <span>Editando lançamento &ldquo;{editing.description}&rdquo;</span>
          <button
            type="button"
            onClick={handleCancelEdit}
            className="text-accent-hover transition-opacity hover:opacity-70"
            aria-label="Cancelar edição"
          >
            <X size={16} />
          </button>
        </div>
      )}

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
                if (t !== "EXPENSE") {
                  setPaymentType(t === "INVESTMENT" ? "OTHER" : "PIX");
                  setCardId("");
                }
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
            ref={descriptionRef}
            className="h-10 rounded-lg border border-border bg-transparent px-3 text-ink outline-none focus:border-accent"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Supermercado"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-ink-secondary">
          Valor {!editing && Number(installments) > 1 ? "(total da compra)" : ""}
          <CurrencyInput
            value={amount}
            onChange={setAmount}
            className="rounded-lg border border-border bg-transparent text-ink outline-none focus:border-accent"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-ink-secondary">
          {!editing && paymentType === "CREDIT_CARD"
            ? `Data da compra (cai na fatura do mês seguinte${Number(installments) > 1 ? ", 1ª parcela" : ""})`
            : "Data"}
          <DatePicker value={date} onChange={setDate} />
        </label>

        <label className="flex flex-col gap-1 text-sm text-ink-secondary">
          Categoria
          <Select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
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

        {!editing && paymentType === "CREDIT_CARD" && (
          <label className="flex flex-col gap-1 text-sm text-ink-secondary">
            Parcelas
            <input
              type="number"
              min={1}
              max={60}
              className="h-10 rounded-lg border border-border bg-transparent px-3 text-ink outline-none focus:border-accent"
              value={installments}
              onChange={(e) => setInstallments(e.target.value)}
            />
          </label>
        )}
      </div>

      {type === "EXPENSE" && (
        <div className="flex flex-col gap-2">
          <span className="text-sm text-ink-secondary">Forma de pagamento</span>
          <div className="flex flex-wrap gap-2">
            {visiblePaymentTypes.map((p) => {
              const Icon = paymentConfig[p].icon;
              const active = paymentType === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setPaymentType(p);
                    setCardId("");
                    if (p !== "CREDIT_CARD") setInstallments("1");
                  }}
                  className={`flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors ${
                    active
                      ? "border-accent bg-accent-soft text-accent-hover"
                      : "border-border text-ink-secondary hover:border-ink-muted"
                  }`}
                >
                  <Icon size={16} />
                  {paymentConfig[p].label}
                </button>
              );
            })}
          </div>

          {cardTypeNeeded && (
            <div className="mt-1 max-w-xs">
              <Select value={cardId} onChange={(e) => setCardId(e.target.value)}>
                <option value="">Selecione o cartão</option>
                {filteredCards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="btn-brand h-10 rounded-lg px-4 text-sm font-medium text-white transition-colors disabled:opacity-50"
        >
          {isPending
            ? "Salvando..."
            : editing
              ? "Salvar alterações"
              : "Salvar lançamento"}
        </button>
        {editing && (
          <button
            type="button"
            onClick={handleCancelEdit}
            className="h-10 rounded-lg border border-border px-4 text-sm font-medium text-ink-secondary transition-colors hover:border-ink-muted"
          >
            Cancelar
          </button>
        )}
        {message && (
          <span className="text-sm text-ink-muted">{message}</span>
        )}
      </div>
    </form>
  );
}

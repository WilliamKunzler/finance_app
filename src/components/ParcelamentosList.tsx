"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown, CheckCircle2, ChevronDown } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { Select } from "@/components/Select";
import { formatCurrency, formatDate } from "@/lib/format";
import type { TransactionType } from "@/generated/prisma/enums";

const INSTALLMENT_COLOR = "#D97706";

const statusOptions: { value: "ALL" | "DONE" | "PENDING"; label: string }[] = [
  { value: "ALL", label: "Todos" },
  { value: "DONE", label: "Concluído" },
  { value: "PENDING", label: "Não concluído" },
];

type Plan = {
  id: string;
  description: string;
  type: TransactionType;
  category: { name: string; color: string };
  card: { name: string } | null;
  person: { name: string; color: string; photo: string | null } | null;
  installmentTotal: number;
  totalAmount: number;
  elapsed: number;
  remaining: number;
  nextDate: string | null;
  nextAmount: number | null;
  items: { id: string; number: number; amount: number; date: string }[];
};

export function ParcelamentosList({ plans }: { plans: Plan[] }) {
  const [ascending, setAscending] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [status, setStatus] = useState<"ALL" | "DONE" | "PENDING">("ALL");

  const sorted = useMemo(() => {
    const filtered = plans.filter((p) => {
      if (status === "DONE") return p.remaining === 0;
      if (status === "PENDING") return p.remaining > 0;
      return true;
    });
    filtered.sort((a, b) =>
      ascending ? a.remaining - b.remaining : b.remaining - a.remaining
    );
    return filtered;
  }, [plans, ascending, status]);

  if (plans.length === 0) {
    return (
      <p className="text-sm text-ink-muted">Nenhum parcelamento cadastrado ainda.</p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setAscending((v) => !v)}
          className="flex h-10 w-fit items-center gap-2 rounded-lg border border-border px-4 text-sm font-medium text-ink-secondary transition-colors hover:border-ink-muted"
        >
          <ArrowUpDown size={15} />
          {ascending ? "Mais perto de acabar primeiro" : "Mais no início primeiro"}
        </button>
        <div className="w-44">
          <Select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-ink-muted">Nenhum parcelamento encontrado para este filtro.</p>
      ) : (
      <div className="rounded-2xl border border-border bg-surface shadow-sm">
        {sorted.map((plan) => {
          const isOpen = expanded === plan.id;
          const progressPct = (plan.elapsed / plan.installmentTotal) * 100;
          const done = plan.remaining === 0;
          return (
            <div key={plan.id} className="border-t border-border px-4 py-3 first:border-t-0">
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : plan.id)}
                className="flex w-full flex-col gap-3 text-left sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-9 w-9 shrink-0 rounded-full"
                    style={{ backgroundColor: `${plan.category.color}22` }}
                  >
                    <span
                      className="flex h-full w-full items-center justify-center text-xs font-semibold"
                      style={{ color: plan.category.color }}
                    >
                      {plan.installmentTotal}x
                    </span>
                  </span>
                  <div>
                    <div className="font-medium text-ink">{plan.description}</div>
                    <div className="flex flex-wrap items-center gap-x-2 text-xs text-ink-muted">
                      <span>{plan.category.name}</span>
                      {plan.card && (
                        <>
                          <span>·</span>
                          <span>{plan.card.name}</span>
                        </>
                      )}
                      {plan.person && (
                        <>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1">
                            <Avatar
                              name={plan.person.name}
                              color={plan.person.color}
                              photo={plan.person.photo}
                              size={14}
                            />
                            {plan.person.name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:w-72">
                  <div className="flex-1">
                    <div className="mb-1 flex items-center justify-between text-xs text-ink-muted">
                      {done ? (
                        <span className="flex items-center gap-1 font-medium text-good">
                          <CheckCircle2 size={13} />
                          Concluído
                        </span>
                      ) : (
                        <span>
                          Faltam {plan.remaining} de {plan.installmentTotal}
                        </span>
                      )}
                      <span className="tabular-nums text-ink">
                        {formatCurrency(plan.totalAmount)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-bg">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          width: `${progressPct}%`,
                          backgroundColor: done ? "var(--color-good)" : plan.category.color,
                        }}
                      />
                    </div>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`shrink-0 text-ink-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </div>
              </button>

              {isOpen && (
                <ul className="mt-3 flex flex-col gap-1.5 rounded-lg bg-bg p-3">
                  {plan.items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="text-ink-secondary">
                        <span className="font-semibold" style={{ color: INSTALLMENT_COLOR }}>
                          {item.number}/{plan.installmentTotal}
                        </span>{" "}
                        · {formatDate(new Date(item.date))}
                      </span>
                      <span className="shrink-0 tabular-nums text-ink">
                        {formatCurrency(item.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}

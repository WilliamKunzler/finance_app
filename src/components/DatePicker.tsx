"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { formatDate } from "@/lib/format";

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function toValue(year: number, month: number, day: number) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function parseValue(value: string) {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  return { year: y, month: m, day: d };
}

export function DatePicker({
  value,
  onChange,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  const parsed = parseValue(value);
  const today = new Date();
  const [open, setOpen] = useState(false);
  const [lastOpen, setLastOpen] = useState(false);
  const [viewYear, setViewYear] = useState(parsed?.year ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(parsed?.month ?? today.getMonth() + 1);
  const ref = useRef<HTMLDivElement>(null);

  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) {
      const p = parseValue(value);
      setViewYear(p?.year ?? today.getFullYear());
      setViewMonth(p?.month ?? today.getMonth() + 1);
    }
  }

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  function shiftMonth(delta: number) {
    const d = new Date(viewYear, viewMonth - 1 + delta, 1);
    setViewYear(d.getFullYear());
    setViewMonth(d.getMonth() + 1);
  }

  const firstWeekday = new Date(viewYear, viewMonth - 1, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const isSelected = (day: number) =>
    parsed?.year === viewYear && parsed?.month === viewMonth && parsed?.day === day;
  const isToday = (day: number) =>
    today.getFullYear() === viewYear &&
    today.getMonth() + 1 === viewMonth &&
    today.getDate() === day;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-border bg-transparent px-3 text-left text-sm text-ink outline-none transition-colors hover:border-ink-muted focus:border-accent ${className}`}
      >
        <span className={value ? "" : "text-ink-muted"}>
          {parsed ? formatDate(new Date(parsed.year, parsed.month - 1, parsed.day)) : "Selecione a data"}
        </span>
        <CalendarDays size={15} className="shrink-0 text-ink-muted" />
      </button>

      {open && (
        <div className="absolute z-20 mt-1.5 w-64 rounded-lg border border-border bg-surface p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="rounded-md p-1 text-ink-secondary transition-colors hover:bg-bg"
              aria-label="Mês anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-medium text-ink">
              {new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" })
                .format(new Date(viewYear, viewMonth - 1, 1))
                .replace(/^./, (c) => c.toUpperCase())}
            </span>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="rounded-md p-1 text-ink-secondary transition-colors hover:bg-bg"
              aria-label="Próximo mês"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs text-ink-muted">
            {WEEKDAYS.map((w, i) => (
              <span key={i} className="py-1">
                {w}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => (
              <button
                key={i}
                type="button"
                disabled={day === null}
                onClick={() => {
                  if (day === null) return;
                  onChange(toValue(viewYear, viewMonth, day));
                  setOpen(false);
                }}
                className={`flex h-8 w-8 items-center justify-center rounded-md text-sm transition-colors ${
                  day === null
                    ? "cursor-default"
                    : isSelected(day)
                      ? "btn-brand text-white"
                      : isToday(day)
                        ? "border border-accent text-ink"
                        : "text-ink hover:bg-bg"
                }`}
              >
                {day ?? ""}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

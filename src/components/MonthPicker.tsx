"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { monthLabel, shortMonthLabel } from "@/lib/format";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function parseValue(value: string) {
  if (!value) return null;
  const [y, m] = value.split("-").map(Number);
  return { year: y, month: m };
}

export function MonthPicker({
  value,
  onChange,
  min,
  placeholder = "Selecione o mês",
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  placeholder?: string;
  className?: string;
}) {
  const parsed = parseValue(value);
  const minParsed = parseValue(min ?? "");
  const today = new Date();
  const [open, setOpen] = useState(false);
  const [lastOpen, setLastOpen] = useState(false);
  const [viewYear, setViewYear] = useState(parsed?.year ?? today.getFullYear());
  const ref = useRef<HTMLDivElement>(null);

  if (open !== lastOpen) {
    setLastOpen(open);
    if (open) setViewYear(parsed?.year ?? today.getFullYear());
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

  function isDisabled(month: number) {
    if (!minParsed) return false;
    return viewYear * 12 + month < minParsed.year * 12 + minParsed.month;
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 text-left text-sm text-ink outline-none transition-colors hover:border-ink-muted focus:border-accent ${className}`}
      >
        <span className={parsed ? "" : "text-ink-muted"}>
          {parsed ? monthLabel(parsed.year, parsed.month) : placeholder}
        </span>
        <CalendarDays size={15} className="shrink-0 text-ink-muted" />
      </button>

      {open && (
        <div className="absolute z-20 mt-1.5 w-56 rounded-lg border border-border bg-surface p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewYear((y) => y - 1)}
              className="rounded-md p-1 text-ink-secondary transition-colors hover:bg-bg"
              aria-label="Ano anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-medium text-ink">{viewYear}</span>
            <button
              type="button"
              onClick={() => setViewYear((y) => y + 1)}
              className="rounded-md p-1 text-ink-secondary transition-colors hover:bg-bg"
              aria-label="Próximo ano"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => {
              const selected = parsed?.year === viewYear && parsed?.month === month;
              const disabled = isDisabled(month);
              return (
                <button
                  key={month}
                  type="button"
                  disabled={disabled}
                  onClick={() => {
                    onChange(`${viewYear}-${pad(month)}`);
                    setOpen(false);
                  }}
                  className={`rounded-md py-1.5 text-sm transition-colors ${
                    disabled
                      ? "cursor-not-allowed text-ink-muted opacity-40"
                      : selected
                        ? "btn-brand text-white"
                        : "text-ink hover:bg-bg"
                  }`}
                >
                  {shortMonthLabel(viewYear, month)}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

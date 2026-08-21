"use client";

import { Children, isValidElement, useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

type Option = { value: string; label: string };
type SelectChangeEvent = { target: { value: string } };

export function Select({
  value,
  onChange,
  children,
  className = "",
}: {
  value: string;
  onChange: (e: SelectChangeEvent) => void;
  children: React.ReactNode;
  className?: string;
}) {
  const options: Option[] = Children.toArray(children).flatMap((child) => {
    if (!isValidElement<{ value?: string; children?: React.ReactNode }>(child)) {
      return [];
    }
    return [
      {
        value: String(child.props.value ?? ""),
        label: String(child.props.children ?? ""),
      },
    ];
  });

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
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

  const selected = options.find((o) => o.value === value);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 text-left text-sm text-ink outline-none transition-colors hover:border-ink-muted focus:border-accent ${className}`}
      >
        <span className={selected?.label ? "truncate" : "truncate text-ink-muted"}>
          {selected?.label || ""}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-ink-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute z-20 mt-1.5 max-h-60 w-full min-w-max overflow-auto rounded-lg border border-border bg-surface p-1 shadow-lg">
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange({ target: { value: opt.value } });
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left text-sm transition-colors ${
                  active
                    ? "bg-accent-soft text-accent-hover"
                    : "text-ink hover:bg-bg"
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {active && <Check size={14} className="shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

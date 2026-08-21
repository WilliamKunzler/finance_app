"use client";

function formatFromCents(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function CurrencyInput({
  value,
  onChange,
  className = "",
  placeholder = "0,00",
}: {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  placeholder?: string;
}) {
  const cents = Math.round(value * 100);
  const display = cents === 0 ? "" : formatFromCents(cents);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "");
    const newCents = digits ? parseInt(digits, 10) : 0;
    onChange(newCents / 100);
  }

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted">
        R$
      </span>
      <input
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        placeholder={placeholder}
        className={`h-10 w-full pl-9 pr-3 ${className}`}
      />
    </div>
  );
}

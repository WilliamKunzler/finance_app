export function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

export function monthLabel(year: number, month: number) {
  const date = new Date(year, month - 1, 1);
  const label = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function shortMonthLabel(year: number, month: number) {
  const date = new Date(year, month - 1, 1);
  const label = new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(date);
  const clean = label.replace(".", "");
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

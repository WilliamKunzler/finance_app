"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    // The theme lives on the DOM (set by the anti-flash script before hydration)
    // and can only be read client-side, so this initial sync must run in an effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    localStorage.setItem("theme", next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Mudar para modo claro" : "Mudar para modo escuro"}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-ink-secondary transition-colors hover:border-ink-muted hover:text-ink"
    >
      {theme === null ? null : theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}

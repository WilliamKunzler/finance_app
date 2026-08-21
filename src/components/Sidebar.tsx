"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Tags,
  CreditCard,
  Users,
  Repeat,
  PiggyBank,
  Layers,
  Menu,
  X,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transacoes", label: "Transações", icon: ArrowLeftRight },
  { href: "/parcelamentos", label: "Parcelamentos", icon: Layers },
  { href: "/contas-fixas", label: "Contas fixas", icon: Repeat },
  { href: "/investimentos", label: "Investimentos", icon: PiggyBank },
  { href: "/categorias", label: "Categorias", icon: Tags },
  { href: "/cartoes", label: "Cartões", icon: CreditCard },
  { href: "/pessoas", label: "Pessoas", icon: Users },
];

function Brand() {
  return (
    <div className="flex items-center gap-2">
      <Logo size={32} />
      <span className="text-gradient text-base font-semibold">Minhas Finanças</span>
    </div>
  );
}

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      {links.map((link) => {
        const active =
          link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={onNavigate}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "btn-brand text-white shadow-sm"
                : "text-ink-secondary hover:bg-surface hover:text-ink"
            }`}
          >
            <Icon size={17} />
            {link.label}
          </Link>
        );
      })}
    </>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-sidebar p-4 md:hidden">
        <Brand />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setOpen(true)}
            className="text-ink-secondary"
            aria-label="Abrir menu"
          >
            <Menu size={22} />
          </button>
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <nav className="hidden w-60 shrink-0 flex-col gap-1 border-r border-border bg-sidebar p-4 md:sticky md:top-0 md:flex md:h-screen md:overflow-y-auto">
        <div className="px-2 pb-6">
          <Brand />
        </div>
        <NavLinks pathname={pathname} />
        <div className="mt-auto flex items-center justify-between border-t border-border px-1 pt-4">
          <span className="text-xs text-ink-muted">Tema</span>
          <ThemeToggle />
        </div>
      </nav>

      <nav
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col gap-1 border-r border-border bg-sidebar p-4 transition-transform duration-200 md:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-2 pb-6">
          <Brand />
          <button
            onClick={() => setOpen(false)}
            className="text-ink-secondary"
            aria-label="Fechar menu"
          >
            <X size={20} />
          </button>
        </div>
        <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
        <div className="mt-auto flex items-center justify-between border-t border-border px-1 pt-4">
          <span className="text-xs text-ink-muted">Tema</span>
          <ThemeToggle />
        </div>
      </nav>
    </>
  );
}

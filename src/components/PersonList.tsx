"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deletePerson } from "@/lib/actions/people";
import { Avatar } from "@/components/Avatar";
import { useConfirm, useAlert } from "@/components/ConfirmProvider";

type Person = { id: string; name: string; color: string; photo: string | null };

export function PersonList({ people }: { people: Person[] }) {
  const [isPending, startTransition] = useTransition();
  const confirm = useConfirm();
  const alert = useAlert();

  async function handleDelete(id: string, name: string) {
    const result = await confirm({
      title: "Excluir pessoa",
      description: `Excluir "${name}"? Isso falhará se houver lançamentos vinculados.`,
      confirmLabel: "Excluir",
      danger: true,
    });
    if (result !== "confirm") return;
    startTransition(async () => {
      try {
        await deletePerson(id);
      } catch (err) {
        await alert({
          title: "Não é possível excluir",
          description: err instanceof Error ? err.message : "Erro desconhecido.",
        });
      }
    });
  }

  if (people.length === 0) {
    return (
      <p className="text-sm text-ink-muted">Nenhuma pessoa cadastrada ainda.</p>
    );
  }

  return (
    <ul className="divide-y divide-border rounded-2xl border border-border bg-surface shadow-sm">
      {people.map((p) => (
        <li key={p.id} className="flex items-center justify-between px-4 py-3">
          <span className="flex items-center gap-3 text-sm text-ink">
            <Avatar name={p.name} color={p.color} photo={p.photo} />
            {p.name}
          </span>
          <button
            disabled={isPending}
            onClick={() => handleDelete(p.id, p.name)}
            className="text-ink-muted transition-colors hover:text-critical disabled:opacity-50"
            aria-label="Excluir pessoa"
          >
            <Trash2 size={16} />
          </button>
        </li>
      ))}
    </ul>
  );
}

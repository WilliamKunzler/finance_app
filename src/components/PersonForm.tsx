"use client";

import { useRef, useState, useTransition } from "react";
import { UserPlus, Camera } from "lucide-react";
import { createPerson } from "@/lib/actions/people";
import { resizeImageToDataUrl } from "@/lib/image";

const colorOptions = [
  "#00725E",
  "#48AAA3",
  "#002220",
  "#B45FC9",
  "#D1A62E",
  "#3B7EA1",
];

export function PersonForm() {
  const [name, setName] = useState("");
  const [color, setColor] = useState(colorOptions[0]);
  const [photo, setPhoto] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await resizeImageToDataUrl(file);
    setPhoto(dataUrl);
    e.target.value = "";
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;
    startTransition(async () => {
      await createPerson({ name, color, photo });
      setName("");
      setPhoto(null);
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-wrap items-end gap-4 rounded-2xl border border-border bg-surface p-4 shadow-sm"
    >
      <div className="flex flex-col items-center gap-1 text-sm text-ink-secondary">
        Foto
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="relative h-16 w-16 overflow-hidden rounded-full border border-border transition-opacity hover:opacity-80"
          style={{ backgroundColor: photo ? undefined : color }}
          aria-label="Escolher foto"
        >
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="Prévia" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-white">
              <Camera size={20} />
            </span>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      <label className="flex flex-col gap-1 text-sm text-ink-secondary">
        Nome
        <input
          className="h-10 rounded-lg border border-border bg-transparent px-3 text-ink outline-none focus:border-accent"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Maria"
        />
      </label>

      <div className="flex flex-col gap-1 text-sm text-ink-secondary">
        Cor
        <div className="flex items-center gap-2 py-1">
          {colorOptions.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="h-7 w-7 rounded-full ring-offset-2 transition-shadow"
              style={{
                backgroundColor: c,
                boxShadow: color === c ? `0 0 0 2px ${c}` : undefined,
              }}
              aria-label={c}
            />
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="btn-brand flex h-10 items-center gap-2 rounded-lg px-4 text-sm font-medium text-white transition-colors disabled:opacity-50"
      >
        <UserPlus size={16} />
        Adicionar pessoa
      </button>
    </form>
  );
}

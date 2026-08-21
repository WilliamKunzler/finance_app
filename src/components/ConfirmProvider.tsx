"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { AlertTriangle, Info } from "lucide-react";

type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  extraLabel?: string;
  danger?: boolean;
  alertOnly?: boolean;
};

type ConfirmResult = "confirm" | "cancel" | "extra";

type ConfirmFn = (options: ConfirmOptions) => Promise<ConfirmResult>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx;
}

export function useAlert() {
  const confirm = useConfirm();
  return useCallback(
    (options: { title: string; description?: string; okLabel?: string }) =>
      confirm({
        title: options.title,
        description: options.description,
        confirmLabel: options.okLabel ?? "Entendi",
        alertOnly: true,
      }),
    [confirm]
  );
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolver = useRef<(result: ConfirmResult) => void>(null);

  const confirm = useCallback<ConfirmFn>((opts) => {
    setOptions(opts);
    return new Promise<ConfirmResult>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  function respond(result: ConfirmResult) {
    resolver.current?.(result);
    setOptions(null);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {options && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-4"
          onClick={() => respond(options.alertOnly ? "confirm" : "cancel")}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-lg"
          >
            <div className="flex items-start gap-3">
              {options.danger && (
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-critical-soft text-critical">
                  <AlertTriangle size={18} />
                </span>
              )}
              {options.alertOnly && !options.danger && (
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-info-soft text-info">
                  <Info size={18} />
                </span>
              )}
              <div>
                <h2 className="text-base font-semibold text-ink">{options.title}</h2>
                {options.description && (
                  <p className="mt-1 text-sm text-ink-secondary">
                    {options.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              {!options.alertOnly && (
                <button
                  type="button"
                  onClick={() => respond("cancel")}
                  className="h-10 rounded-lg border border-border px-4 text-sm font-medium text-ink-secondary transition-colors hover:border-ink-muted"
                >
                  {options.cancelLabel ?? "Cancelar"}
                </button>
              )}
              {options.extraLabel && (
                <button
                  type="button"
                  onClick={() => respond("extra")}
                  className="h-10 rounded-lg border border-critical/40 px-4 text-sm font-medium text-critical transition-colors hover:bg-critical-soft"
                >
                  {options.extraLabel}
                </button>
              )}
              <button
                type="button"
                onClick={() => respond("confirm")}
                className={`h-10 rounded-lg px-4 text-sm font-medium text-white transition-colors ${
                  options.danger
                    ? "bg-critical hover:bg-critical/90"
                    : "btn-brand"
                }`}
              >
                {options.confirmLabel ?? "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

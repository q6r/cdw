import clsx from "clsx";
import { Icon } from "../Icon";

export interface Step {
  label: string;
  state: "done" | "current" | "todo";
}

/** Etapas da compra, sempre visíveis no checkout para a pessoa saber onde está. */
export function CheckoutSteps({ steps, className }: { steps: Step[]; className?: string }) {
  const current = steps.findIndex((s) => s.state === "current");
  return (
    <nav aria-label="Etapas da compra" className={className}>
      <ol className="grid" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
        {steps.map((s, i) => (
          <li
            key={s.label}
            aria-current={s.state === "current" ? "step" : undefined}
            className="relative flex flex-col items-center gap-1.5 text-center"
          >
            {i > 0 && (
              <span
                aria-hidden="true"
                className={clsx(
                  "absolute right-[calc(50%+18px)] top-[13px] h-[2px] w-[calc(100%-36px)] rounded-full",
                  s.state === "todo" ? "bg-silver" : "bg-liquid",
                )}
              />
            )}
            <span
              className={clsx(
                "relative grid h-7 w-7 place-items-center rounded-full text-xs font-bold transition-colors",
                s.state === "done" && "bg-liquid-deep text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.35)]",
                s.state === "current" && "bg-porcelain text-liquid-deep ring-2 ring-liquid shadow-[0_0_0_4px_rgb(22_143_229/0.14)]",
                s.state === "todo" && "bg-frost-2 text-dim",
              )}
            >
              {s.state === "done" ? <Icon name="check" size={14} strokeWidth={3} /> : i + 1}
            </span>
            <span
              className={clsx(
                "text-[12.5px] font-semibold leading-tight",
                s.state === "current" ? "text-liquid-ink" : s.state === "done" ? "text-ink-2" : "text-dim",
              )}
            >
              {s.label}
              <span className="sr-only">
                {s.state === "done" ? " (concluída)" : s.state === "current" ? ` (etapa ${current + 1} de ${steps.length})` : ""}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Etapas de um plano: conta → Discord → Pix → ativação. */
export function planSteps(stage: "account" | "discord" | "pay" | "active"): Step[] {
  const order = ["account", "discord", "pay", "active"] as const;
  const at = order.indexOf(stage);
  const labels = ["Conta", "Discord", "Pix", "Ativação"];
  return labels.map((label, i) => ({ label, state: i < at ? "done" : i === at ? (stage === "active" ? "done" : "current") : "todo" }));
}

/** Etapas de uma divulgação: conta → texto → Pix → fila da staff. */
export function promoSteps(stage: "account" | "text" | "pay" | "queued"): Step[] {
  const order = ["account", "text", "pay", "queued"] as const;
  const at = order.indexOf(stage);
  const labels = ["Conta", "Texto", "Pix", "Fila da staff"];
  return labels.map((label, i) => ({ label, state: i < at ? "done" : i === at ? (stage === "queued" ? "done" : "current") : "todo" }));
}

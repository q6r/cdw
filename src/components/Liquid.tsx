import clsx from "clsx";
import type { ReactNode } from "react";

/**
 * A assinatura visual: o líquido azul da logo. Só aparece onde algo enche ou
 * esvazia de verdade (dias de VIP, prazo do Pix, posição no ranking) e na
 * palavra de destaque da abertura.
 */

export function LiquidWord({ children, className }: { children: string; className?: string }) {
  return <span className={clsx("liquid-word", className)}>{children}</span>;
}

/** Barra horizontal. `value` de 0 a 1. */
export function LiquidBar({
  value,
  tone = "liquid",
  className,
  label,
}: {
  value: number;
  tone?: "liquid" | "warn";
  className?: string;
  label?: string;
}) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div
      className={clsx("relative h-2 overflow-hidden rounded-full bg-frost-2 shadow-[inset_0_1px_2px_rgb(24_38_50/0.1)]", className)}
      role={label ? "progressbar" : undefined}
      aria-label={label}
      aria-valuemin={label ? 0 : undefined}
      aria-valuemax={label ? 100 : undefined}
      aria-valuenow={label ? Math.round(pct) : undefined}
    >
      <div
        className={clsx(
          "absolute inset-y-0 left-0 rounded-full transition-[width] duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)]",
          tone === "warn"
            ? "bg-[linear-gradient(180deg,#f0a347,#c26a0d)]"
            : "bg-[linear-gradient(180deg,#5ab3f2_0%,#168fe5_45%,#0f62ad_100%)]",
        )}
        style={{ width: `${Math.max(pct, pct > 0 ? 3 : 0)}%` }}
      >
        <span className="absolute inset-x-1 top-px h-px rounded-full bg-white/50" />
      </div>
    </div>
  );
}

/**
 * Recipiente vertical cheio até `value` (0 a 1), com a superfície ondulando.
 * O número fica ao lado, nunca por cima do líquido, para não perder contraste.
 */
export function LiquidGauge({
  value,
  className,
  tone = "liquid",
  children,
}: {
  value: number;
  className?: string;
  tone?: "liquid" | "warn";
  children?: ReactNode;
}) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className={clsx("flex items-center gap-5", className)}>
      <div
        className="relative h-28 w-16 shrink-0 overflow-hidden rounded-[22px] border border-silver-strong bg-gradient-to-b from-white to-frost shadow-[inset_0_2px_6px_rgb(24_38_50/0.08),0_1px_0_#fff]"
        aria-hidden="true"
      >
        <div
          className={clsx("liquid-fill", tone === "warn" && "!bg-[linear-gradient(180deg,#f3ad5a,#c26a0d)] before:hidden")}
          style={{ height: `${Math.max(pct, pct > 0 ? 6 : 0)}%` }}
        />
        <span className="pointer-events-none absolute inset-y-2 left-2 w-1.5 rounded-full bg-white/60" />
      </div>
      {children && <div className="min-w-0">{children}</div>}
    </div>
  );
}

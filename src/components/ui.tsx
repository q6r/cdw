import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import clsx from "clsx";
import { Icon, Spinner, type IconName } from "./Icon";
import { useModalBehavior } from "../lib/hooks";

/* Avatar do Discord, com iniciais quando não há imagem válida. */
export function Avatar({
  src,
  name,
  size = 32,
  square = false,
  className,
}: {
  src?: string | null;
  name?: string | null;
  size?: number;
  square?: boolean;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const ok = src && /^https:\/\/(cdn\.discordapp\.com|media\.discordapp\.net)\//.test(src) ? src : null;
  const initials = (name ?? "?").slice(0, 2).toUpperCase();
  const shape = square ? "rounded-[28%]" : "rounded-full";
  if (ok && !failed) {
    return (
      <img
        src={ok}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        draggable={false}
        onError={() => setFailed(true)}
        className={clsx("shrink-0 bg-frost object-cover ring-1 ring-silver", shape, className)}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={clsx(
        "grid shrink-0 place-items-center bg-frost-2 font-display font-bold text-ink-2 ring-1 ring-silver",
        shape,
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.36) }}
    >
      {initials}
    </span>
  );
}

const STATUS: Record<string, { label: string; tone: "ok" | "wait" | "bad" | "off" | "info" }> = {
  pending: { label: "Aguardando", tone: "wait" },
  paid: { label: "Pago", tone: "ok" },
  failed: { label: "Falhou", tone: "bad" },
  cancelled: { label: "Cancelado", tone: "off" },
  expired: { label: "Expirado", tone: "off" },
  refunded: { label: "Reembolsado", tone: "info" },
  active: { label: "Ativo", tone: "ok" },
  grace: { label: "Em carência", tone: "wait" },
  revoked: { label: "Removido", tone: "bad" },
  awaiting_payment: { label: "Aguardando Pix", tone: "off" },
  queued: { label: "Na fila", tone: "wait" },
  running: { label: "No ar", tone: "ok" },
  done: { label: "Finalizada", tone: "info" },
  rejected: { label: "Recusada", tone: "bad" },
};

const TONE = {
  ok: "bg-success-soft text-success ring-success/25",
  wait: "bg-warn-soft text-warn ring-warn/25",
  bad: "bg-danger-soft text-danger ring-danger/25",
  off: "bg-frost text-muted ring-silver-strong",
  info: "bg-liquid-soft text-liquid-ink ring-liquid/25",
};
const DOT = { ok: "bg-success", wait: "bg-warn", bad: "bg-danger", off: "bg-chrome", info: "bg-liquid" };

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS[status] ?? { label: status, tone: "off" as const };
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
        TONE[s.tone],
      )}
    >
      <span className={clsx("h-1.5 w-1.5 rounded-full", DOT[s.tone])} aria-hidden="true" />
      {s.label}
    </span>
  );
}

/** Botão que pede um segundo clique para confirmar ações destrutivas. */
export function ConfirmButton({
  onConfirm,
  children,
  confirmLabel = "Confirmar?",
  className = "btn btn-ghost btn-sm",
  disabled,
  title,
}: {
  onConfirm: () => Promise<unknown> | unknown;
  children: ReactNode;
  confirmLabel?: string;
  className?: string;
  disabled?: boolean;
  title?: string;
}) {
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return (
    <button
      type="button"
      title={title}
      disabled={disabled || busy}
      aria-live="polite"
      className={clsx(className, armed && "!border-danger/50 !bg-danger-soft !text-danger")}
      onClick={async () => {
        if (!armed) {
          setArmed(true);
          timer.current = window.setTimeout(() => setArmed(false), 3000);
          return;
        }
        window.clearTimeout(timer.current);
        setArmed(false);
        setBusy(true);
        try {
          await onConfirm();
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? <Spinner size={14} /> : armed ? confirmLabel : children}
    </button>
  );
}

export function EmptyState({ icon, title, children }: { icon: IconName; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl border border-silver bg-frost text-liquid-deep shadow-[inset_0_1px_0_#fff]">
        <Icon name={icon} size={24} />
      </div>
      <p className="mt-5 font-display text-base font-bold">{title}</p>
      {children && <div className="mt-2 max-w-sm text-sm text-muted">{children}</div>}
    </div>
  );
}

type AlertTone = "error" | "warn" | "info" | "success";
const ALERT: Record<AlertTone, { cls: string; icon: IconName }> = {
  error: { cls: "border-danger/25 bg-danger-soft text-danger", icon: "alert" },
  warn: { cls: "border-warn/25 bg-warn-soft text-warn", icon: "clock" },
  info: { cls: "border-liquid/25 bg-liquid-mist text-liquid-ink", icon: "info" },
  success: { cls: "border-success/25 bg-success-soft text-success", icon: "check" },
};

export function Alert({
  tone = "error",
  children,
  className,
  icon,
}: {
  tone?: AlertTone;
  children: ReactNode;
  className?: string;
  icon?: IconName;
}) {
  const a = ALERT[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={clsx("flex items-start gap-3 rounded-[10px] border px-4 py-3 text-sm", a.cls, className)}
    >
      <Icon name={icon ?? a.icon} size={18} className="mt-px" />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

/** Mensagem curta de erro ou dica embaixo de um campo. */
export function FieldHint({ error, children, id }: { error?: string | null; children?: ReactNode; id?: string }) {
  if (error) {
    return (
      <span id={id} role="alert" className="mt-2 flex items-start gap-1.5 text-[13px] font-medium text-danger">
        <Icon name="alert" size={15} className="mt-px" />
        {error}
      </span>
    );
  }
  return children ? (
    <span id={id} className="mt-2 block text-[13px] text-dim">
      {children}
    </span>
  ) : null;
}

/** Título de seção pública. */
export function SectionHeading({
  title,
  children,
  align = "left",
  id,
  eyebrow,
}: {
  title: ReactNode;
  children?: ReactNode;
  align?: "left" | "center";
  id?: string;
  eyebrow?: string;
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
      <h2
        id={id}
        className="font-display text-[clamp(1.75rem,3.6vw,2.6rem)] font-extrabold leading-[1.08] tracking-[-0.03em]"
      >
        {title}
      </h2>
      {children && (
        <p className={clsx("mt-4 max-w-xl text-[17px] leading-relaxed text-muted", align === "center" && "mx-auto")}>
          {children}
        </p>
      )}
    </div>
  );
}

/** Cabeçalho das páginas do painel. */
export function PageHeader({
  eyebrow,
  title,
  children,
  actions,
}: {
  eyebrow?: string;
  title: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-5 sm:mb-10">
      <div className="max-w-2xl">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="font-display text-[clamp(1.7rem,3.4vw,2.35rem)] font-extrabold leading-[1.08] tracking-[-0.03em]">
          {title}
        </h1>
        {children && <p className="mt-2.5 text-[15px] leading-relaxed text-muted">{children}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function CardHeader({ title, children, right }: { title: ReactNode; children?: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h2 className="font-display text-[17px] font-bold tracking-tight">{title}</h2>
        {children && <p className="mt-1 text-sm text-muted">{children}</p>}
      </div>
      {right}
    </div>
  );
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Mantém o foco dentro do diálogo e devolve ao elemento de origem ao fechar. */
export function useFocusTrap(open: boolean, ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const frame = requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;
      const first = el.querySelector<HTMLElement>("[data-autofocus]") ?? el.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? el).focus();
    });
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !ref.current) return;
      const items = [...ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((n) => n.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, [open, ref]);
}

export function Modal({
  open,
  onClose,
  label,
  children,
  size = "md",
  className,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useModalBehavior(open, onClose);
  useFocusTrap(open, ref);
  const width = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-3xl" }[size];
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6">
          <motion.div
            className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            tabIndex={-1}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
            className={clsx(
              "card relative max-h-[92svh] w-full overflow-y-auto rounded-b-none p-5 shadow-pop outline-none sm:rounded-b-[14px] sm:p-8",
              width,
              className,
            )}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar"
              className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-[10px] text-muted transition hover:bg-frost hover:text-ink"
            >
              <Icon name="x" size={18} />
            </button>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** Painel lateral (menu do celular). */
export function Sheet({
  open,
  onClose,
  label,
  side = "left",
  children,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  side?: "left" | "right";
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useModalBehavior(open, onClose);
  useFocusTrap(open, ref);
  const from = side === "left" ? "-100%" : "100%";
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70]">
          <motion.div
            className="absolute inset-0 bg-ink/35 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            tabIndex={-1}
            initial={{ x: from }}
            animate={{ x: 0 }}
            exit={{ x: from }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            className={clsx(
              "absolute inset-y-0 flex w-[86%] max-w-[22rem] flex-col bg-porcelain shadow-float outline-none",
              side === "left" ? "left-0 border-r border-silver" : "right-0 border-l border-silver",
            )}
            style={{ paddingTop: "env(safe-area-inset-top)", paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={clsx("skeleton", className)} aria-hidden="true" />;
}

/** Carregamento de página inteira, com o ícone da marca pulsando. */
export function PageLoader({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={clsx("grid place-items-center", compact ? "min-h-[50vh]" : "min-h-[100svh]")}
      role="status"
      aria-label="Carregando"
    >
      <img
        src="/brand/cdw-icon-128.webp"
        alt=""
        width={56}
        height={56}
        className="h-14 w-14 animate-pulse rounded-[28%] shadow-card"
      />
    </div>
  );
}

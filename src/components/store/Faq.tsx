import { useEffect, useId, useState } from "react";
import { useLocation } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import clsx from "clsx";
import { Icon } from "../Icon";

/**
 * Perguntas em acordeão. Cada item tem âncora própria (`#${prefix}-${i}`),
 * usada pela busca para abrir direto a resposta.
 */
export function Faq({ items, prefix }: { items: [string, string][]; prefix: string }) {
  const { hash } = useLocation();
  const [open, setOpen] = useState<number | null>(0);
  const uid = useId();

  useEffect(() => {
    const m = hash.match(new RegExp(`^#${prefix}-(\\d+)$`));
    if (m) setOpen(Number(m[1]));
  }, [hash, prefix]);

  return (
    <div className="divide-y divide-silver overflow-hidden rounded-[16px] border border-silver bg-porcelain shadow-card">
      {items.map(([q, a], i) => {
        const isOpen = open === i;
        const panel = `${uid}-p${i}`;
        return (
          <div key={q} id={`${prefix}-${i}`} className="scroll-mt-28">
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={panel}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-6 px-5 py-5 text-left transition-colors hover:bg-liquid-mist sm:px-6"
              >
                <span className={clsx("text-[17px] font-semibold", isOpen ? "text-ink" : "text-ink-2")}>{q}</span>
                <span
                  className={clsx(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-full border transition-colors",
                    isOpen ? "border-liquid/40 bg-liquid-soft text-liquid-deep" : "border-silver-strong text-dim",
                  )}
                >
                  <Icon name="plus" size={16} className={clsx("transition-transform duration-300", isOpen && "rotate-45")} />
                </span>
              </button>
            </h3>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={panel}
                  role="region"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <p className="max-w-2xl px-5 pb-6 leading-relaxed text-muted sm:px-6">{a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

/** Passos numerados: aqui a ordem importa, então o número fica. */
export function Steps({ items }: { items: { title: string; text: string }[] }) {
  return (
    <ol className="grid gap-4 md:grid-cols-3 md:gap-5">
      {items.map((s, i) => (
        <li key={s.title} className="card relative overflow-hidden p-6 sm:p-7">
          <span
            className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-b from-[#3aa2ee] to-[#0f6fc0] font-display text-base font-extrabold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.4),0_6px_14px_-6px_rgb(15_111_192/0.6)]"
            aria-hidden="true"
          >
            {i + 1}
          </span>
          <h3 className="mt-5 font-display text-lg font-bold tracking-tight">
            <span className="sr-only">Passo {i + 1}: </span>
            {s.title}
          </h3>
          <p className="mt-2 leading-relaxed text-muted">{s.text}</p>
        </li>
      ))}
    </ol>
  );
}

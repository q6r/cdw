import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import clsx from "clsx";
import { Icon } from "../Icon";
import { PlanIcon } from "../PlanIcon";
import { useFocusTrap } from "../ui";
import { useAuth } from "../../lib/auth";
import { useModalBehavior, usePlans, usePromos } from "../../lib/hooks";
import { buildIndex, search, type SearchEntry } from "../../lib/search";
import { CATEGORIES, categoryHref } from "../../lib/catalog";

const QUICK: { label: string; href: string }[] = [
  { label: "Todos os planos", href: "/planos" },
  ...CATEGORIES.map((c) => ({ label: c.label, href: categoryHref(c.key) })),
  { label: "Divulgação", href: "/divulgacoes" },
  { label: "Ranking", href: "/ranking" },
];

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const plans = usePlans();
  const promos = usePromos();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const listId = useId();
  useModalBehavior(open, onClose);
  useFocusTrap(open, dialog);

  const index = useMemo(() => buildIndex(plans, promos, user), [plans, promos, user]);
  const results = useMemo(() => search(index, query), [index, query]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActive(0);
  }, [open]);

  useEffect(() => setActive(0), [query]);

  const go = (e: SearchEntry | { href: string }) => {
    onClose();
    navigate(e.href);
  };

  const groups = useMemo(() => {
    const map = new Map<string, { e: SearchEntry; i: number }[]>();
    results.forEach((e, i) => map.set(e.group, [...(map.get(e.group) ?? []), { e, i }]));
    return [...map.entries()];
  }, [results]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-start justify-center px-3 pt-[max(1rem,8vh)]">
          <motion.div
            className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            ref={dialog}
            role="dialog"
            aria-modal="true"
            aria-label="Buscar na loja"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            className="card relative flex max-h-[min(36rem,84svh)] w-full max-w-xl flex-col overflow-hidden shadow-pop"
          >
            <div className="flex items-center gap-3 border-b border-silver px-4">
              <Icon name="search" size={19} className="text-dim" />
              <input
                ref={input}
                data-autofocus
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar planos, divulgação, dúvidas…"
                className="h-14 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-dim"
                role="combobox"
                aria-expanded={results.length > 0}
                aria-controls={listId}
                aria-activedescendant={results[active] ? `${listId}-${results[active].id}` : undefined}
                aria-autocomplete="list"
                autoComplete="off"
                spellCheck={false}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setActive((a) => (results.length ? (a + 1) % results.length : 0));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setActive((a) => (results.length ? (a - 1 + results.length) % results.length : 0));
                  } else if (e.key === "Enter" && results[active]) {
                    e.preventDefault();
                    go(results[active]);
                  }
                }}
              />
              <button
                type="button"
                onClick={onClose}
                className="rounded-[6px] border border-silver px-1.5 py-0.5 text-[11px] font-semibold text-dim hover:text-ink"
              >
                Esc
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-2" id={listId} role="listbox" aria-label="Resultados">
              {!query.trim() ? (
                <div className="p-3">
                  <p className="eyebrow mb-3">Atalhos</p>
                  <div className="flex flex-wrap gap-2">
                    {QUICK.map((q) => (
                      <button key={q.href} type="button" className="chip hover:border-liquid/40 hover:text-liquid-ink" onClick={() => go(q)}>
                        {q.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : results.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <p className="font-semibold">Nada encontrado para “{query.trim()}”</p>
                  <p className="mt-1 text-sm text-muted">Tente o nome de um plano, como Royal ou Classic, ou uma palavra como “call”.</p>
                </div>
              ) : (
                groups.map(([group, items]) => (
                  <div key={group} className="pb-1">
                    <p className="eyebrow px-3 pb-1.5 pt-3">{group}</p>
                    {items.map(({ e, i }) => (
                      <button
                        key={e.id}
                        id={`${listId}-${e.id}`}
                        type="button"
                        role="option"
                        aria-selected={i === active}
                        onMouseMove={() => setActive(i)}
                        onClick={() => go(e)}
                        className={clsx(
                          "flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-left transition-colors",
                          i === active ? "bg-liquid-soft" : "hover:bg-frost",
                        )}
                      >
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] border border-silver bg-porcelain text-liquid-deep">
                          {e.planIcon ? <PlanIcon name={e.planIcon} size={24} animated={false} /> : <Icon name={e.icon ?? "arrow-right"} size={18} />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={clsx("block truncate text-[15px] font-semibold", i === active && "text-liquid-ink")}>
                            {e.title}
                          </span>
                          {e.subtitle && <span className="block truncate text-[13px] text-muted">{e.subtitle}</span>}
                        </span>
                        <Icon name="arrow-right" size={16} className={clsx("text-dim", i !== active && "opacity-0")} />
                      </button>
                    ))}
                  </div>
                ))
              )}
            </div>
            <div className="hidden items-center gap-4 border-t border-silver bg-frost px-4 py-2.5 text-xs text-dim sm:flex">
              <span>
                <kbd className="font-sans font-semibold">↑ ↓</kbd> navegar
              </span>
              <span>
                <kbd className="font-sans font-semibold">Enter</kbd> abrir
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

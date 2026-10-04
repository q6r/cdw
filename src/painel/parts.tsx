import { useEffect, useId, useRef, useState, type ClipboardEvent, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import clsx from "clsx";
import { Icon, Spinner } from "../components/Icon";
import { Avatar, ConfirmButton } from "../components/ui";
import { api, errorMessage } from "../lib/api";
import { useDebounced } from "../lib/hooks";
import { useToast } from "../lib/toast";
import type { Member } from "../lib/types";

/** Busca de membros do servidor (combobox com setas, Enter e Esc). */
export function MemberSearch({
  endpoint,
  onPick,
  placeholder = "Nome, apelido ou ID do Discord",
  disabled = false,
  exclude = [],
  extra,
  autoFocus = false,
}: {
  endpoint: string;
  onPick: (m: Member) => Promise<unknown> | unknown;
  placeholder?: string;
  disabled?: boolean;
  exclude?: string[];
  extra?: (m: Member) => ReactNode;
  autoFocus?: boolean;
}) {
  const [q, setQ] = useState("");
  const term = useDebounced(q.trim(), 250);
  const [results, setResults] = useState<Member[]>([]);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [err, setErr] = useState("");
  const [active, setActive] = useState(0);
  const [picking, setPicking] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();
  const visible = results.filter((m) => !exclude.includes(m.id));

  useEffect(() => {
    if (disabled || term.length < 2) {
      setResults([]);
      setState("idle");
      return;
    }
    let alive = true;
    setState("loading");
    api
      .get<{ members: Member[] }>(`${endpoint}?q=${encodeURIComponent(term)}`)
      .then((r) => {
        if (!alive) return;
        setResults(r.members);
        setActive(0);
        setState("idle");
      })
      .catch((e) => {
        if (!alive) return;
        setErr(errorMessage(e));
        setState("error");
      });
    return () => {
      alive = false;
    };
  }, [term, endpoint, disabled]);

  const pick = async (m: Member) => {
    setPicking(true);
    try {
      await onPick(m);
      setQ("");
      setResults([]);
      input.current?.focus();
    } finally {
      setPicking(false);
    }
  };

  const open = term.length >= 2 && state !== "loading" && !disabled;

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") return setQ("");
    if (!visible.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % visible.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + visible.length) % visible.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      void pick(visible[Math.min(active, visible.length - 1)]);
    }
  };

  return (
    <div>
      <div className="relative">
        <Icon name="search" size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-dim" />
        <input
          ref={input}
          type="search"
          className="field pl-10 pr-10"
          value={q}
          disabled={disabled || picking}
          autoFocus={autoFocus}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder}
          role="combobox"
          aria-expanded={open && visible.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && visible[active] ? `${listId}-${visible[active].id}` : undefined}
          onKeyDown={onKey}
        />
        {(state === "loading" || picking) && <Spinner size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-dim" />}
      </div>
      {open && (
        <div id={listId} role="listbox" className="mt-2 max-h-64 overflow-y-auto rounded-[12px] border border-silver bg-porcelain p-1 shadow-pop">
          {state === "error" ? (
            <p className="px-3 py-3 text-sm text-danger">{err}</p>
          ) : visible.length === 0 ? (
            <p className="px-3 py-3 text-sm text-muted">{results.length ? "Essa pessoa já está na lista." : "Ninguém no servidor com esse nome ou ID."}</p>
          ) : (
            visible.map((m, i) => (
              <button
                key={m.id}
                id={`${listId}-${m.id}`}
                type="button"
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={() => void pick(m)}
                className={clsx("flex w-full items-center gap-3 rounded-[9px] px-2.5 py-2 text-left", i === active && "bg-liquid-mist")}
              >
                <Avatar src={m.avatar} name={m.displayName ?? m.username} size={32} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold">{m.displayName ?? m.username}</span>
                  <span className="block truncate text-xs text-muted">
                    @{m.username} · {m.id}
                  </span>
                </span>
                {extra?.(m)}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/** Lista de membros com busca para adicionar e confirmação para remover (tag, Primeiras Damas). */
export function MemberList({
  members,
  limit,
  onAdd,
  onRemove,
  empty,
  removeLabel = "Remover",
}: {
  members: Member[];
  limit: number;
  onAdd: (id: string) => Promise<unknown>;
  onRemove: (id: string) => Promise<unknown>;
  empty: string;
  removeLabel?: string;
}) {
  const toast = useToast();
  const full = limit > 0 && members.length >= limit;
  const add = async (id: string) => {
    try {
      await onAdd(id);
    } catch (e) {
      toast(errorMessage(e), "error");
    }
  };
  return (
    <div>
      <MemberSearch
        endpoint="/vip/members/search"
        disabled={full}
        placeholder={full ? "Limite do plano atingido" : "Busque pelo nome ou cole o ID do Discord"}
        exclude={members.map((m) => m.id)}
        onPick={(m) => add(m.id)}
        extra={() => (
          <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-liquid-ink">
            <Icon name="plus" size={14} /> Adicionar
          </span>
        )}
      />
      <div className="mt-2 flex items-center justify-between text-[13px] text-dim">
        <span>Escolha a pessoa na lista para adicionar.</span>
        <span className="tabular shrink-0 font-semibold">
          {limit > 0 ? `${members.length}/${limit}` : `${members.length} ${members.length === 1 ? "pessoa" : "pessoas"}`}
        </span>
      </div>
      <div className="mt-4 space-y-2">
        <AnimatePresence initial={false}>
          {members.map((m) => (
            <motion.div
              key={m.id}
              layout
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 16, transition: { duration: 0.18 } }}
              className="flex items-center gap-3 rounded-[12px] border border-silver bg-porcelain px-3 py-2.5"
            >
              <Avatar src={m.avatar} name={m.displayName ?? m.username ?? m.id} size={34} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{m.displayName ?? m.username ?? "Membro desconhecido"}</div>
                <div className="truncate font-mono text-[11px] text-dim">
                  {m.username ? `@${m.username} · ` : ""}
                  {m.id}
                  {m.inGuild === false && " · fora do servidor"}
                </div>
              </div>
              <ConfirmButton
                onConfirm={() => onRemove(m.id).catch((e) => toast(errorMessage(e), "error"))}
                className="btn btn-secondary btn-sm"
              >
                {removeLabel}
              </ConfirmButton>
            </motion.div>
          ))}
        </AnimatePresence>
        {members.length === 0 && (
          <p className="rounded-[12px] border border-dashed border-silver-strong px-4 py-6 text-center text-sm text-muted">{empty}</p>
        )}
      </div>
    </div>
  );
}

/** Código de 6 dígitos, com colar e navegação por setas. */
export function OtpInput({ value, onChange, onComplete }: { value: string; onChange: (v: string) => void; onComplete?: (v: string) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? "");

  const setAt = (i: number, d: string) => {
    const next = (value.slice(0, i) + d + value.slice(i + 1)).replace(/\D/g, "").slice(0, 6);
    onChange(next);
    if (next.length === 6) onComplete?.(next);
  };
  const onKey = (i: number) => (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus();
      onChange(value.slice(0, i - 1));
    }
    if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < 5) refs.current[i + 1]?.focus();
  };
  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const d = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!d) return;
    e.preventDefault();
    onChange(d);
    refs.current[Math.min(d.length, 5)]?.focus();
    if (d.length === 6) onComplete?.(d);
  };

  return (
    <div className="flex gap-2 sm:gap-3" role="group" aria-label="Código de 6 dígitos">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={d}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          aria-label={`Dígito ${i + 1}`}
          onKeyDown={onKey(i)}
          onPaste={onPaste}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "").slice(-1);
            if (v) {
              setAt(i, v);
              refs.current[i + 1]?.focus();
            }
          }}
          className="field h-14 w-full !px-0 text-center font-display text-xl font-bold"
        />
      ))}
    </div>
  );
}

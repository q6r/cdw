import { useEffect, useLayoutEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import { Icon, type IconName } from "../components/Icon";
import { Avatar, Skeleton } from "../components/ui";
import { brl, compact } from "../lib/format";

export interface AdminUser {
  id?: string;
  username: string;
  email: string;
  avatar: string | null;
  discordId?: string | null;
}

export interface Paged<T> {
  items: T[];
  page: number;
  pages: number;
  total: number;
}

export function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative w-full sm:w-80">
      <Icon name="search" size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-dim" />
      <input
        type="search"
        className="field pl-10"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        maxLength={100}
      />
    </div>
  );
}

export function FilterTabs<T extends string>({
  options,
  value,
  onChange,
  label = "Filtro",
}: {
  options: [T, string][];
  value: T;
  onChange: (v: T) => void;
  label?: string;
}) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label={label}>
      {options.map(([v, text]) => (
        <button
          key={v || "todos"}
          type="button"
          aria-pressed={value === v}
          onClick={() => onChange(v)}
          className={clsx(
            "min-h-[36px] rounded-full border px-3.5 text-[13px] font-semibold transition-colors",
            value === v ? "border-liquid-deep bg-liquid-deep text-white" : "border-silver bg-porcelain text-ink-2 hover:border-silver-strong hover:text-ink",
          )}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

export function Pager({ page, pages, total, onPage }: { page: number; pages: number; total: number; onPage: (p: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-silver bg-frost px-5 py-3 text-sm text-muted">
      <span className="tabular">{total} resultados</span>
      <div className="flex items-center gap-2">
        <button type="button" className="btn btn-secondary btn-sm !px-2.5" disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Página anterior">
          <Icon name="chevron-left" size={16} />
        </button>
        <span className="tabular">
          {page} / {Math.max(1, pages)}
        </span>
        <button type="button" className="btn btn-secondary btn-sm !px-2.5" disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Próxima página">
          <Icon name="chevron-right" size={16} />
        </button>
      </div>
    </div>
  );
}

export function UserCell({ user }: { user: AdminUser | null | undefined }) {
  if (!user) return <span className="text-dim">—</span>;
  return (
    <span className="flex min-w-0 items-center gap-3">
      <Avatar src={user.avatar} name={user.username} size={30} />
      <span className="min-w-0">
        <span className="block truncate font-semibold">{user.username}</span>
        <span className="block truncate text-xs text-dim">{user.email}</span>
      </span>
    </span>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2 p-5" aria-busy="true" aria-label="Carregando">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-12" />
      ))}
    </div>
  );
}

export function StatTile({ label, value, icon, accent = false }: { label: string; value: string; icon: IconName; accent?: boolean }) {
  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-muted">{label}</span>
        <span className={clsx("grid h-8 w-8 place-items-center rounded-[10px]", accent ? "bg-liquid-soft text-liquid-deep" : "bg-frost text-dim")}>
          <Icon name={icon} size={17} />
        </span>
      </div>
      <div className="tabular mt-4 truncate font-display text-[clamp(1.35rem,2.6vw,1.9rem)] font-extrabold tracking-tight">{value}</div>
    </div>
  );
}

/** Interruptor acessível (botão com aria-pressed). */
export function Toggle({ on, onChange, label, hint }: { on: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      aria-pressed={on}
      className={clsx(
        "flex min-h-[48px] items-center gap-3 rounded-[10px] border px-3 py-2 text-left transition-colors",
        on ? "border-liquid/40 bg-liquid-mist" : "border-silver-strong bg-porcelain hover:bg-frost",
      )}
    >
      <span className={clsx("relative h-5 w-9 shrink-0 rounded-full transition-colors", on ? "bg-liquid-deep" : "bg-silver-strong")}>
        <span className={clsx("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all", on ? "left-[18px]" : "left-0.5")} />
      </span>
      <span>
        <span className="block text-[13px] font-semibold">{label}</span>
        {hint && <span className="block text-xs text-dim">{hint}</span>}
      </span>
    </button>
  );
}

export function FormField({ label, hint, children, htmlFor }: { label: string; hint?: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div>
      <label className="label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-dim">{hint}</span>}
    </div>
  );
}

/** "1.234,56" → centavos. */
export const parseBrl = (v: string) => Math.round(Number(v.replace(/\./g, "").replace(",", ".")) * 100);
export const centsToInput = (c: number) => (c / 100).toFixed(2).replace(".", ",");

/** Barra horizontal de participação (um valor, uma cor). */
export function ShareBar({ value }: { value: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-liquid-soft">
      <div className="h-full rounded-full bg-liquid transition-[width] duration-700" style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} />
    </div>
  );
}

export interface SelectOption {
  value: string;
  label: string;
  color?: string;
}

/** Seletor com busca (cargos e categorias do Discord podem ser muitos). */
export function SearchSelect({
  value,
  onChange,
  options,
  placeholder = "Escolha",
  emptyLabel,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  placeholder?: string;
  emptyLabel?: string;
  ariaLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState<{ left: number; width: number; top?: number; bottom?: number; maxH: number } | null>(null);
  const button = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const all = useMemo(() => (emptyLabel ? [{ value: "", label: emptyLabel }, ...options] : options), [options, emptyLabel]);
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? all.filter((o) => o.label.toLowerCase().includes(t)) : all;
  }, [all, q]);
  const current = all.find((o) => o.value === value);

  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const r = button.current?.getBoundingClientRect();
      if (!r) return;
      const below = window.innerHeight - r.bottom - 12;
      const above = r.top - 12;
      setPos(
        below >= 220 || below >= above
          ? { left: r.left, width: r.width, top: r.bottom + 6, maxH: Math.min(320, below) }
          : { left: r.left, width: r.width, bottom: window.innerHeight - r.top + 6, maxH: Math.min(320, above) },
      );
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setQ("");
    setActive(Math.max(0, all.findIndex((o) => o.value === value)));
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!button.current?.contains(t) && !list.current?.contains(t)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  useEffect(() => {
    list.current?.querySelector(`[data-i="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
    button.current?.focus();
  };
  const onKey = (e: KeyboardEvent) => {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(filtered.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[active]) pick(filtered[active].value);
    }
  };

  return (
    <>
      <button
        ref={button}
        type="button"
        className={clsx("field flex items-center justify-between gap-2 text-left", !current && "text-dim")}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onKey}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        <span className="flex min-w-0 items-center gap-2">
          {current?.color && <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: current.color }} />}
          <span className="truncate">{current ? current.label : placeholder}</span>
        </span>
        <Icon name="chevron-down" size={16} className={clsx("text-dim transition-transform", open && "rotate-180")} />
      </button>
      {open &&
        pos &&
        createPortal(
          <div
            ref={list}
            role="listbox"
            aria-label={ariaLabel}
            onKeyDown={onKey}
            className="fixed z-[120] flex flex-col overflow-hidden rounded-[12px] border border-silver bg-porcelain shadow-pop"
            style={{ left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom, maxHeight: pos.maxH }}
          >
            {all.length > 8 && (
              <div className="border-b border-silver p-2">
                <input
                  autoFocus
                  className="w-full rounded-[8px] bg-frost px-3 py-2 text-sm outline-none placeholder:text-dim"
                  placeholder="Buscar"
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setActive(0);
                  }}
                />
              </div>
            )}
            <div className="overflow-y-auto p-1">
              {filtered.length === 0 && <p className="px-3 py-3 text-sm text-muted">Nada encontrado.</p>}
              {filtered.map((o, i) => (
                <button
                  key={o.value || "__vazio"}
                  type="button"
                  role="option"
                  data-i={i}
                  aria-selected={o.value === value}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(o.value)}
                  className={clsx("flex w-full items-center gap-2.5 rounded-[8px] px-3 py-2 text-left text-sm", i === active && "bg-liquid-mist")}
                >
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: o.color ?? "transparent" }} />
                  <span className={clsx("min-w-0 flex-1 truncate", o.value === "" && "text-muted")}>{o.label}</span>
                  {o.value === value && <Icon name="check" size={15} className="text-liquid-deep" />}
                </button>
              ))}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

/* ─────────── Gráfico de colunas (uma série: receita) ─────────── */

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, w };
}

/** Arredonda o topo do eixo para um valor limpo (1, 2, 2,5 ou 5 × 10ⁿ reais). */
function niceCeil(cents: number) {
  const reais = cents / 100;
  const mag = 10 ** Math.floor(Math.log10(Math.max(reais, 1)));
  const step = [1, 2, 2.5, 5, 10].find((f) => f * mag >= reais) ?? 10;
  return step * mag * 100;
}

export interface ColumnPoint {
  key: string;
  label: string;
  fullLabel: string;
  value: number;
  count: number;
}

/**
 * Colunas de receita: azul único, ponta arredondada de 4 px e base reta,
 * no máximo 24 px de largura, grade de linha fina e tooltip por coluna.
 * A tabela equivalente fica disponível para leitores de tela.
 */
export function ColumnChart({ points, caption, height = 220 }: { points: ColumnPoint[]; caption: string; height?: number }) {
  const { ref, w } = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const pad = { top: 14, bottom: 26, left: 64, right: 6 };
  const innerW = Math.max(0, w - pad.left - pad.right);
  const innerH = height - pad.top - pad.bottom;
  const peak = Math.max(0, ...points.map((p) => p.value));
  const max = niceCeil(Math.max(1, peak));
  const slot = points.length ? innerW / points.length : 0;
  const barW = Math.max(2, Math.min(24, slot - 2));
  const every = Math.max(1, Math.ceil(points.length / Math.max(2, Math.floor(innerW / 64))));
  const y = (v: number) => pad.top + innerH - (v / max) * innerH;
  const tick = (v: number) => `R$ ${compact(v / 100)}`;
  const hp = hover !== null ? points[hover] : null;
  const hx = hover !== null ? pad.left + (hover + 0.5) * slot : 0;

  return (
    <figure>
      <div ref={ref} className="relative" onPointerLeave={() => setHover(null)}>
        {w > 0 && (
          <svg width={w} height={height} role="img" aria-label={`${caption}. Maior valor: ${brl(peak)}.`}>
            {[0.5, 1].map((f) => (
              <g key={f}>
                <line x1={pad.left} x2={w - pad.right} y1={y(max * f)} y2={y(max * f)} stroke="#e4ebf0" strokeWidth={1} />
                <text x={pad.left - 10} y={y(max * f) + 4} textAnchor="end" fontSize="11" fill="#5f7082">
                  {tick(max * f)}
                </text>
              </g>
            ))}
            <line x1={pad.left} x2={w - pad.right} y1={pad.top + innerH} y2={pad.top + innerH} stroke="#c2cfd8" strokeWidth={1} />
            <text x={pad.left - 10} y={pad.top + innerH + 4} textAnchor="end" fontSize="11" fill="#5f7082">
              0
            </text>
            {points.map((p, i) => {
              const h = p.value ? Math.max(2, (p.value / max) * innerH) : 0;
              const x = pad.left + i * slot + (slot - barW) / 2;
              const top = pad.top + innerH - h;
              const r = Math.min(4, barW / 2, h);
              const last = i === points.length - 1;
              return (
                <g key={p.key}>
                  {h > 0 && (
                    <path
                      d={`M${x} ${pad.top + innerH}V${top + r}a${r} ${r} 0 0 1 ${r} ${-r}h${barW - 2 * r}a${r} ${r} 0 0 1 ${r} ${r}V${pad.top + innerH}z`}
                      fill="#168fe5"
                      opacity={hover === null || hover === i ? 1 : 0.4}
                      style={{ transition: "opacity .2s" }}
                    />
                  )}
                  {(i % every === 0 || last) && (last || points.length - 1 - i >= every / 2) && (
                    <text
                      x={last && points.length > 1 ? w - pad.right : pad.left + i * slot + slot / 2}
                      y={height - 6}
                      textAnchor={last && points.length > 1 ? "end" : "middle"}
                      fontSize="11"
                      fill="#5f7082"
                    >
                      {p.label}
                    </text>
                  )}
                  <rect
                    x={pad.left + i * slot}
                    y={0}
                    width={slot}
                    height={pad.top + innerH}
                    fill="transparent"
                    onPointerEnter={() => setHover(i)}
                    onPointerDown={() => setHover(i)}
                  />
                </g>
              );
            })}
          </svg>
        )}
        {hp && (
          <div
            className="pointer-events-none absolute z-10 rounded-[10px] border border-silver bg-porcelain px-3 py-2 text-xs shadow-pop"
            style={{ top: pad.top, left: hx < w / 2 ? hx + slot / 2 + 8 : hx - slot / 2 - 8, transform: hx < w / 2 ? undefined : "translateX(-100%)" }}
          >
            <div className="whitespace-nowrap text-dim">{hp.fullLabel}</div>
            <div className="tabular mt-0.5 whitespace-nowrap font-semibold text-ink">{brl(hp.value)}</div>
            <div className="whitespace-nowrap text-muted">
              {hp.count} {hp.count === 1 ? "pedido" : "pedidos"}
            </div>
          </div>
        )}
      </div>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer font-semibold text-liquid-ink">Ver como tabela</summary>
        <div className="mt-2 max-h-60 overflow-y-auto rounded-[10px] border border-silver">
          <table className="table-x">
            <caption className="sr-only">{caption}</caption>
            <thead>
              <tr>
                <th scope="col">Período</th>
                <th scope="col">Recebido</th>
                <th scope="col">Pedidos</th>
              </tr>
            </thead>
            <tbody>
              {points.map((p) => (
                <tr key={p.key}>
                  <td>{p.fullLabel}</td>
                  <td className="tabular">{brl(p.value)}</td>
                  <td className="tabular">{p.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}

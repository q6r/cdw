import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import clsx from "clsx";
import { Icon, type IconName } from "../Icon";
import { PlanIcon } from "../PlanIcon";
import { Avatar, Skeleton } from "../ui";
import { LiquidBar } from "../Liquid";
import { useAuth } from "../../lib/auth";
import { useApi, usePlans } from "../../lib/hooks";
import { daysLeft, fractionLeft, isForever, planLabel } from "../../lib/format";
import type { Vip } from "../../lib/types";

const ITEMS: { to: string; label: string; icon: IconName; admin?: boolean }[] = [
  { to: "/painel", label: "Meu painel", icon: "home" },
  { to: "/painel/tag", label: "Minha tag", icon: "tag" },
  { to: "/painel/call", label: "Minha call", icon: "voice" },
  { to: "/painel/pagamentos", label: "Minhas compras", icon: "receipt" },
  { to: "/painel/divulgacoes", label: "Minhas divulgações", icon: "message" },
  { to: "/painel/perfil", label: "Meu perfil", icon: "user" },
  { to: "/admin", label: "Painel admin", icon: "shield", admin: true },
];

export function ProfileMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const plans = usePlans();
  const { data, loading } = useApi<{ vip: Vip | null }>(open && user?.discord ? "/vip/me" : null);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => root.current && !root.current.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        root.current?.querySelector<HTMLButtonElement>("button")?.focus();
      }
    };
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    requestAnimationFrame(() => menu.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus());
    return () => {
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) return null;

  const vip = data?.vip;
  const plan = vip && plans?.find((p) => p.key === vip.planKey);
  const grace = vip?.status === "grace";

  const onArrows = (e: ReactKeyboardEvent) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();
    const items = [...(menu.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
    const i = items.indexOf(document.activeElement as HTMLElement);
    const next = e.key === "ArrowDown" ? (i + 1) % items.length : (i - 1 + items.length) % items.length;
    items[next]?.focus();
  };

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Menu da conta de ${user.username}`}
        className={clsx(
          "flex min-h-[44px] items-center gap-2.5 rounded-[12px] border py-1 pl-1 pr-2.5 transition-colors",
          open ? "border-liquid/40 bg-liquid-mist" : "border-silver bg-porcelain hover:border-silver-strong",
        )}
      >
        <Avatar src={user.discord?.avatar} name={user.username} size={32} square />
        <span className="hidden max-w-[9rem] truncate text-sm font-semibold sm:block">{user.username}</span>
        <Icon name="chevron-down" size={16} className={clsx("text-dim transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={menu}
            role="menu"
            aria-label="Menu da conta"
            onKeyDown={onArrows}
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 460, damping: 34 }}
            style={{ transformOrigin: "top right" }}
            className="absolute right-0 top-[calc(100%+0.5rem)] z-[70] w-[min(20rem,calc(100vw-1.5rem))] overflow-hidden rounded-[14px] border border-silver bg-porcelain shadow-pop"
          >
            <div className="flex items-center gap-3 border-b border-silver p-4">
              <Avatar src={user.discord?.avatar} name={user.username} size={44} square />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate font-semibold">{user.username}</span>
                  {user.role === "admin" && (
                    <span className="rounded-[5px] bg-liquid-soft px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-liquid-ink">
                      admin
                    </span>
                  )}
                </div>
                <div className="truncate text-[13px] text-dim">
                  {user.discord?.username ? `@${user.discord.username}` : user.email}
                </div>
              </div>
            </div>

            <div className="border-b border-silver p-2">
              {!user.discord ? (
                <Link
                  to="/painel"
                  role="menuitem"
                  className="flex items-center justify-between rounded-[10px] px-3 py-2.5 text-sm hover:bg-frost focus:bg-frost focus:outline-none"
                >
                  <span className="text-ink-2">Vincular Discord</span>
                  <Icon name="discord" size={17} className="text-discord" />
                </Link>
              ) : loading && !data ? (
                <Skeleton className="h-14" />
              ) : vip?.active && plan ? (
                <Link
                  to="/painel"
                  role="menuitem"
                  className="block rounded-[10px] px-3 py-2.5 hover:bg-frost focus:bg-frost focus:outline-none"
                >
                  <div className="flex items-center gap-2.5">
                    <PlanIcon name={plan.icon} size={26} />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold">{planLabel(plan)}</div>
                      <div className={clsx("text-xs", grace ? "font-semibold text-warn" : "text-dim")}>
                        {isForever(vip.expiresAt)
                          ? "Sem vencimento"
                          : grace
                            ? "Em carência, renove já"
                            : `${daysLeft(vip.expiresAt)} dias restantes`}
                      </div>
                    </div>
                  </div>
                  {!isForever(vip.expiresAt) && (
                    <LiquidBar
                      className="mt-2.5"
                      value={fractionLeft(vip.expiresAt, plan.durationDays)}
                      tone={grace ? "warn" : "liquid"}
                    />
                  )}
                </Link>
              ) : (
                <Link
                  to="/planos"
                  role="menuitem"
                  className="flex items-center justify-between rounded-[10px] px-3 py-2.5 text-sm hover:bg-frost focus:bg-frost focus:outline-none"
                >
                  <span className="text-muted">Você ainda não tem VIP</span>
                  <span className="font-semibold text-liquid-ink">Ver planos</span>
                </Link>
              )}
            </div>

            <div className="p-1.5">
              {ITEMS.filter((i) => !i.admin || user.role === "admin").map((item) => {
                const current = pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    role="menuitem"
                    aria-current={current ? "page" : undefined}
                    className={clsx(
                      "flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm transition-colors focus:bg-frost focus:outline-none",
                      current ? "bg-liquid-soft font-semibold text-liquid-ink" : "text-ink-2 hover:bg-frost hover:text-ink",
                    )}
                  >
                    <Icon name={item.icon} size={18} className={current ? "text-liquid-deep" : "text-dim"} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
            <div className="border-t border-silver p-1.5">
              <button
                type="button"
                role="menuitem"
                onClick={async () => {
                  setOpen(false);
                  await logout();
                  navigate("/", { replace: true });
                }}
                className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm text-ink-2 transition-colors hover:bg-danger-soft hover:text-danger focus:bg-danger-soft focus:text-danger focus:outline-none"
              >
                <Icon name="logout" size={18} />
                Sair
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import clsx from "clsx";
import { Icon, type IconName } from "../Icon";
import { PlanIcon } from "../PlanIcon";
import { BrandMark } from "../Brand";
import { Sheet } from "../ui";
import { ProfileMenu } from "./ProfileMenu";
import { SearchDialog } from "./SearchDialog";
import { useAuth } from "../../lib/auth";
import { api } from "../../lib/api";
import { usePlans } from "../../lib/hooks";
import { CATEGORIES, categoryHref, categorySummary, planHref, sortPlans } from "../../lib/catalog";
import { brl } from "../../lib/format";
import type { PaymentRow } from "../../lib/types";

/** Abre a busca com Ctrl/⌘ K ou "/" (fora de campos de texto). */
export function useSearchShortcut(open: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement | null)?.closest("input, textarea, select, [contenteditable]");
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        open();
      } else if (e.key === "/" && !typing) {
        e.preventDefault();
        open();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
}

/** Pix aberto da pessoa logada, para avisar no ícone de compras. */
function usePendingPayments(enabled: boolean) {
  const [pending, setPending] = useState(0);
  const { pathname } = useLocation();
  useEffect(() => {
    if (!enabled) return setPending(0);
    let alive = true;
    api
      .get<{ payments: PaymentRow[] }>("/payments/mine")
      .then((r) => alive && setPending(r.payments.filter((p) => p.status === "pending").length))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [enabled, pathname]);
  return pending;
}

export function SiteHeader() {
  const { user, loading } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { pathname } = useLocation();
  const pending = usePendingPayments(!!user);
  const openSearch = useRef(() => setSearchOpen(true)).current;
  useSearchShortcut(openSearch);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <>
      <a href="#conteudo" className="sr-only-focusable fixed left-3 top-3 z-[100] btn btn-secondary btn-sm">
        Pular para o conteúdo
      </a>
      <header
        className={clsx(
          "sticky top-0 z-50 transition-[background-color,box-shadow,border-color] duration-300",
          scrolled
            ? "border-b border-silver bg-ice/85 shadow-[0_8px_24px_-20px_rgb(24_38_50/0.35)] backdrop-blur-xl"
            : "border-b border-transparent bg-ice/0",
        )}
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="container-x flex h-16 items-center gap-3 lg:h-[72px]">
          <Link to="/" aria-label="CDW, página inicial" className="mr-2 rounded-[12px]">
            <BrandMark />
          </Link>

          <nav aria-label="Principal" className="hidden items-center gap-1 lg:flex">
            <PlansMenu />
            <TopLink to="/divulgacoes">Divulgação</TopLink>
            <TopLink to="/ranking">Ranking</TopLink>
            <TopLink to="/#faq" hash>
              Dúvidas
            </TopLink>
          </nav>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={openSearch}
              aria-label="Buscar na loja"
              aria-keyshortcuts="Control+K"
              className="hidden h-11 w-52 items-center gap-2.5 rounded-[12px] border border-silver bg-porcelain px-3.5 text-left text-sm text-dim shadow-hairline transition-colors hover:border-silver-strong xl:flex"
            >
              <Icon name="search" size={17} />
              <span className="flex-1">Buscar…</span>
              <kbd className="rounded-[6px] border border-silver bg-frost px-1.5 py-0.5 font-sans text-[11px] font-semibold text-dim">
                Ctrl K
              </kbd>
            </button>
            <button
              type="button"
              onClick={openSearch}
              aria-label="Buscar na loja"
              className="grid h-11 w-11 place-items-center rounded-[12px] text-ink-2 transition-colors hover:bg-frost hover:text-ink xl:hidden"
            >
              <Icon name="search" size={20} />
            </button>

            {user && (
              <Link
                to="/painel/pagamentos"
                aria-label={pending ? `Minhas compras: ${pending} Pix aguardando pagamento` : "Minhas compras"}
                title="Minhas compras"
                className="relative grid h-11 w-11 place-items-center rounded-[12px] text-ink-2 transition-colors hover:bg-frost hover:text-ink"
              >
                <Icon name="receipt" size={20} />
                {pending > 0 && (
                  <span className="absolute right-1.5 top-1.5 grid min-w-[18px] place-items-center rounded-full bg-liquid-deep px-1 text-[10px] font-bold leading-[18px] text-white ring-2 ring-ice">
                    {pending}
                  </span>
                )}
              </Link>
            )}

            {loading ? (
              <span className="skeleton hidden h-11 w-40 rounded-[12px] sm:block" />
            ) : user ? (
              <div className="hidden lg:block">
                <ProfileMenu />
              </div>
            ) : (
              <>
                <Link to="/entrar" className="btn btn-ghost btn-sm hidden sm:inline-flex">
                  Entrar
                </Link>
                <Link to="/criar-conta" className="btn btn-primary btn-sm hidden sm:inline-flex">
                  Criar conta
                </Link>
              </>
            )}

            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menu"
              aria-expanded={menuOpen}
              className="grid h-11 w-11 place-items-center rounded-[12px] text-ink-2 transition-colors hover:bg-frost hover:text-ink lg:hidden"
            >
              <Icon name="menu" size={21} />
            </button>
          </div>
        </div>
      </header>

      <MobileNav open={menuOpen} onClose={() => setMenuOpen(false)} onSearch={openSearch} />
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

function TopLink({ to, children, hash = false }: { to: string; children: string; hash?: boolean }) {
  const location = useLocation();
  const active = hash ? location.pathname === "/" && location.hash === to.slice(1) : location.pathname.startsWith(to);
  return (
    <Link
      to={to}
      aria-current={active ? "page" : undefined}
      className={clsx(
        "relative rounded-[10px] px-3.5 py-2.5 text-[15px] font-medium transition-colors",
        active ? "text-liquid-ink" : "text-ink-2 hover:bg-frost hover:text-ink",
      )}
    >
      {children}
      {active && <span className="absolute inset-x-3.5 -bottom-[3px] h-[3px] rounded-full bg-liquid" aria-hidden="true" />}
    </Link>
  );
}

/** Menu "Planos": categorias com preço inicial e todos os planos. */
function PlansMenu() {
  const plans = usePlans();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | undefined>(undefined);
  const { pathname, search } = useLocation();
  const [params] = useSearchParams();
  const active = pathname.startsWith("/planos");

  useEffect(() => setOpen(false), [pathname, search]);
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
    return () => {
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Aberto pelo hover fecha ao sair com o mouse; aberto pelo clique fica até
  // clicar fora ou apertar Esc. Clicar depois do hover "fixa" o menu aberto.
  const openedBy = useRef<"hover" | "click" | null>(null);
  const enter = () => {
    window.clearTimeout(closeTimer.current);
    if (!open) openedBy.current = "hover";
    setOpen(true);
  };
  const leave = () => {
    if (openedBy.current !== "hover") return;
    closeTimer.current = window.setTimeout(() => setOpen(false), 160);
  };
  const toggle = () => {
    window.clearTimeout(closeTimer.current);
    if (open && openedBy.current === "hover") {
      openedBy.current = "click";
      return;
    }
    openedBy.current = open ? null : "click";
    setOpen(!open);
  };

  const sorted = plans ? sortPlans(plans) : null;

  return (
    <div
      ref={root}
      className="relative"
      onPointerEnter={(e) => e.pointerType === "mouse" && enter()}
      onPointerLeave={(e) => e.pointerType === "mouse" && leave()}
      onBlur={(e) => !root.current?.contains(e.relatedTarget as Node) && setOpen(false)}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls="menu-planos"
        onClick={toggle}
        className={clsx(
          "relative flex items-center gap-1 rounded-[10px] px-3.5 py-2.5 text-[15px] font-medium transition-colors",
          active || open ? "text-liquid-ink" : "text-ink-2 hover:bg-frost hover:text-ink",
          open && "bg-liquid-mist",
        )}
      >
        Planos
        <Icon name="chevron-down" size={16} className={clsx("transition-transform", open && "rotate-180")} />
        {active && <span className="absolute inset-x-3.5 -bottom-[3px] h-[3px] rounded-full bg-liquid" aria-hidden="true" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id="menu-planos"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="absolute left-0 top-[calc(100%+0.6rem)] z-[60] grid w-[44rem] grid-cols-[1fr_1.15fr] gap-2 rounded-[18px] border border-silver bg-porcelain p-2 shadow-pop"
          >
            <div className="grid gap-2">
              {CATEGORIES.map((c) => {
                const s = plans ? categorySummary(plans, c.kind) : null;
                const current = active && params.get("categoria") === c.key;
                return (
                  <Link
                    key={c.key}
                    to={categoryHref(c.key)}
                    aria-current={current ? "page" : undefined}
                    className="group flex gap-3.5 rounded-[14px] border border-silver bg-gradient-to-b from-white to-frost p-3.5 transition-colors hover:border-liquid/40"
                  >
                    <span className="relative h-16 w-20 shrink-0 overflow-hidden rounded-[10px] bg-frost-2 ring-1 ring-silver">
                      {s && <img src={`/intros/cards/${s.top.key}.webp`} alt="" className="h-full w-full object-cover" loading="lazy" />}
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5 font-display text-[15px] font-bold group-hover:text-liquid-ink">
                        {c.label}
                        <Icon name="arrow-right" size={15} className="text-dim transition-transform group-hover:translate-x-0.5" />
                      </span>
                      <span className="mt-0.5 block text-[13px] leading-snug text-muted">{c.blurb}</span>
                      {s && (
                        <span className="mt-1.5 block text-[13px] font-semibold text-ink-2">
                          {s.count} {s.count === 1 ? "plano" : "planos"} · a partir de {brl(s.minPrice)}
                        </span>
                      )}
                    </span>
                  </Link>
                );
              })}
              <Link
                to="/divulgacoes"
                className="group flex items-center gap-3 rounded-[14px] px-3.5 py-3 text-sm font-semibold text-ink-2 transition-colors hover:bg-frost hover:text-ink"
              >
                <Icon name="megaphone" size={18} className="text-liquid-deep" />
                Divulgação para a CDW inteira
                <Icon name="arrow-right" size={15} className="ml-auto text-dim" />
              </Link>
            </div>
            <div className="rounded-[14px] p-2">
              <p className="eyebrow px-2 pb-2 pt-1">Todos os planos</p>
              <ul className="grid gap-0.5">
                {(sorted ?? []).map((p) => (
                  <li key={p.key}>
                    <Link
                      to={planHref(p.key)}
                      className="flex items-center gap-2.5 rounded-[10px] px-2 py-1.5 text-sm transition-colors hover:bg-frost"
                    >
                      <PlanIcon name={p.icon} size={22} animated={false} />
                      <span className="flex-1 truncate font-medium">{p.name}</span>
                      <span className="tabular text-[13px] text-muted">{p.soldOut ? "Esgotado" : brl(p.priceCents)}</span>
                    </Link>
                  </li>
                ))}
                {!sorted && Array.from({ length: 6 }, (_, i) => <li key={i} className="skeleton mx-2 my-1 h-7" />)}
              </ul>
              <Link to="/planos" className="link mt-2 inline-flex items-center gap-1 px-2 text-sm">
                Ver catálogo completo <Icon name="arrow-right" size={14} />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Ativo quando caminho e query batem exatamente; âncoras nunca ficam ativas. */
function useIsCurrent() {
  const { pathname, search } = useLocation();
  return (to: string, end = false) => {
    if (to.includes("#")) return false;
    const [path, query = ""] = to.split("?");
    if (query) return pathname === path && search === `?${query}`;
    return end ? pathname === path && !search : pathname === path || pathname.startsWith(`${path}/`);
  };
}

function MobileNav({ open, onClose, onSearch }: { open: boolean; onClose: () => void; onSearch: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isCurrent = useIsCurrent();

  const item = (to: string, label: string, icon: IconName, end = false) => {
    const current = isCurrent(to, end);
    return (
      <Link
        key={to}
        to={to}
        onClick={onClose}
        aria-current={current ? "page" : undefined}
        className={clsx(
          "flex min-h-[46px] items-center gap-3 rounded-[12px] px-3 text-[15px] font-medium transition-colors",
          current ? "bg-liquid-soft text-liquid-ink" : "text-ink-2 hover:bg-frost hover:text-ink",
        )}
      >
        <Icon name={icon} size={19} className={current ? "text-liquid-deep" : "text-dim"} />
        {label}
      </Link>
    );
  };

  return (
    <Sheet open={open} onClose={onClose} label="Menu" side="right">
      <div className="flex h-16 items-center justify-between border-b border-silver px-4">
        <Link to="/" onClick={onClose} aria-label="CDW, página inicial">
          <BrandMark size={32} />
        </Link>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar menu"
          className="grid h-11 w-11 place-items-center rounded-[12px] text-muted hover:bg-frost hover:text-ink"
        >
          <Icon name="x" size={19} />
        </button>
      </div>
      <nav aria-label="Menu" className="flex-1 overflow-y-auto px-3 py-3">
        <button
          type="button"
          onClick={() => {
            onClose();
            onSearch();
          }}
          className="mb-3 flex min-h-[46px] w-full items-center gap-3 rounded-[12px] border border-silver bg-frost px-3 text-left text-[15px] text-dim"
        >
          <Icon name="search" size={19} />
          Buscar planos, dúvidas…
        </button>
        <p className="eyebrow px-3 pb-1.5 pt-2">Loja</p>
        {item("/planos", "Todos os planos", "grid", true)}
        {item(categoryHref("dono"), "Cargos de dono", "crown")}
        {item(categoryHref("vip"), "VIPs", "spark")}
        {item("/divulgacoes", "Divulgação", "megaphone")}
        <p className="eyebrow px-3 pb-1.5 pt-5">Comunidade e ajuda</p>
        {item("/ranking", "Ranking", "trophy")}
        {item("/#como-funciona", "Como funciona", "sliders")}
        {item("/#personalize", "Teste sua tag", "palette")}
        {item("/#faq", "Dúvidas", "help")}
        {user && (
          <>
            <p className="eyebrow px-3 pb-1.5 pt-5">Sua conta</p>
            {item("/painel", "Meu painel", "home", true)}
            {item("/painel/tag", "Minha tag", "tag")}
            {item("/painel/call", "Minha call", "voice")}
            {item("/painel/pagamentos", "Minhas compras", "receipt")}
            {item("/painel/divulgacoes", "Minhas divulgações", "message")}
            {item("/painel/perfil", "Meu perfil", "user")}
            {user.role === "admin" && item("/admin", "Painel admin", "shield")}
          </>
        )}
      </nav>
      <div className="grid gap-2 border-t border-silver p-4">
        {user ? (
          <button
            type="button"
            className="btn btn-secondary w-full"
            onClick={async () => {
              onClose();
              await logout();
              navigate("/", { replace: true });
            }}
          >
            <Icon name="logout" size={18} />
            Sair da conta
          </button>
        ) : (
          <>
            <Link to="/criar-conta" onClick={onClose} className="btn btn-primary w-full">
              Criar conta
            </Link>
            <Link to="/entrar" onClick={onClose} className="btn btn-secondary w-full">
              Entrar
            </Link>
          </>
        )}
      </div>
    </Sheet>
  );
}

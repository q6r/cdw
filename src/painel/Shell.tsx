import { createContext, Suspense, useContext, useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { motion } from "motion/react";
import clsx from "clsx";
import { Icon, type IconName } from "../components/Icon";
import { BrandMark } from "../components/Brand";
import { PageLoader, Sheet } from "../components/ui";
import { ProfileMenu } from "../components/site/ProfileMenu";
import { SearchDialog } from "../components/site/SearchDialog";
import { useSearchShortcut } from "../components/site/SiteHeader";
import { ErrorBoundary } from "../app/routing";
import { useAuth } from "../lib/auth";
import { useApi } from "../lib/hooks";
import type { Vip } from "../lib/types";

type NavGroup = { group: string; items: { to: string; label: string; icon: IconName; end?: boolean; also?: string }[] };

const USER_NAV: NavGroup[] = [
  {
    group: "Seu VIP",
    items: [
      { to: "/painel", label: "Início", icon: "home", end: true },
      { to: "/painel/tag", label: "Minha tag", icon: "tag" },
      { to: "/painel/call", label: "Minha call", icon: "voice" },
    ],
  },
  {
    group: "Loja",
    items: [
      { to: "/painel/planos", label: "Planos", icon: "grid", also: "/painel/comprar/" },
      { to: "/painel/pagamentos", label: "Minhas compras", icon: "receipt" },
      { to: "/painel/divulgacoes", label: "Divulgações", icon: "message", also: "/painel/divulgacao/" },
      { to: "/painel/recebidas", label: "Tags recebidas", icon: "users" },
    ],
  },
  { group: "Comunidade", items: [{ to: "/painel/ranking", label: "Ranking", icon: "trophy" }] },
  { group: "Conta", items: [{ to: "/painel/perfil", label: "Meu perfil", icon: "user" }] },
];

const ADMIN_NAV: NavGroup[] = [
  {
    group: "Administração",
    items: [
      { to: "/admin", label: "Visão geral", icon: "chart", end: true },
      { to: "/admin/pedidos", label: "Pedidos", icon: "receipt" },
      { to: "/admin/receita", label: "Receita", icon: "wallet" },
      { to: "/admin/divulgacoes", label: "Divulgações", icon: "message" },
      { to: "/admin/usuarios", label: "Usuários", icon: "users" },
      { to: "/admin/vips", label: "VIPs", icon: "crown" },
      { to: "/admin/planos", label: "Planos", icon: "grid" },
    ],
  },
];

interface VipContextValue {
  vip: Vip | null;
  loading: boolean;
  setVip: (vip: Vip | null) => void;
  reload: () => Promise<void>;
}

const VipContext = createContext<VipContextValue | null>(null);

export function useVip() {
  const ctx = useContext(VipContext);
  if (!ctx) throw new Error("useVip fora do painel");
  return ctx;
}

export default function Shell({ area }: { area: "user" | "admin" }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const vipReq = useApi<{ vip: Vip | null }>(area === "user" ? "/vip/me" : null);
  const nav = area === "admin" ? ADMIN_NAV : USER_NAV;
  const openSearch = useRef(() => setSearchOpen(true)).current;
  useSearchShortcut(openSearch);

  useEffect(() => setMenuOpen(false), [pathname]);

  const vipValue: VipContextValue = {
    vip: vipReq.data?.vip ?? null,
    loading: vipReq.loading,
    setVip: (vip) => vipReq.setData({ vip }),
    reload: vipReq.reload,
  };

  const signOut = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-3 px-5">
        <Link to="/" aria-label="CDW, página inicial" className="rounded-[12px]">
          <BrandMark />
        </Link>
        {area === "admin" && (
          <span className="rounded-[6px] bg-liquid-soft px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.1em] text-liquid-ink">admin</span>
        )}
      </div>
      <nav aria-label={area === "admin" ? "Administração" : "Painel"} className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {nav.map((g) => (
          <div key={g.group}>
            <p className="eyebrow mb-2 px-3">{g.group}</p>
            <ul className="space-y-0.5">
              {g.items.map((item) => (
                <li key={item.to}>
                  <NavLink to={item.to} end={item.end} className="block rounded-[10px]">
                    {({ isActive: exact }) => {
                      const isActive = exact || (!!item.also && pathname.startsWith(item.also));
                      return (
                      <span
                        className={clsx(
                          "relative flex min-h-[42px] items-center gap-3 rounded-[10px] px-3 text-[15px] font-medium transition-colors",
                          isActive ? "text-liquid-ink" : "text-ink-2 hover:bg-frost hover:text-ink",
                        )}
                      >
                        {isActive && (
                          <motion.span
                            layoutId={`nav-${area}`}
                            className="absolute inset-0 rounded-[10px] bg-liquid-soft ring-1 ring-liquid/20"
                            transition={{ type: "spring", stiffness: 420, damping: 36 }}
                          >
                            <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-liquid" />
                          </motion.span>
                        )}
                        <Icon name={item.icon} size={19} className={clsx("relative", isActive ? "text-liquid-deep" : "text-dim")} />
                        <span className="relative">{item.label}</span>
                      </span>
                      );
                    }}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {user?.role === "admin" && (
          <Link
            to={area === "admin" ? "/painel" : "/admin"}
            className="flex min-h-[42px] items-center justify-between rounded-[10px] border border-dashed border-silver-strong px-3 text-sm font-medium text-ink-2 transition-colors hover:border-liquid/50 hover:text-liquid-ink"
          >
            <span className="flex items-center gap-3">
              <Icon name={area === "admin" ? "user" : "shield"} size={18} className="text-dim" />
              {area === "admin" ? "Meu painel" : "Painel admin"}
            </span>
            <Icon name="arrow-right" size={15} />
          </Link>
        )}
      </nav>
      <div className="border-t border-silver p-3">
        <Link
          to="/"
          className="flex min-h-[42px] items-center gap-3 rounded-[10px] px-3 text-sm font-medium text-ink-2 transition-colors hover:bg-frost hover:text-ink"
        >
          <Icon name="arrow-left" size={18} className="text-dim" />
          Voltar à loja
        </Link>
        <button
          type="button"
          onClick={signOut}
          className="flex min-h-[42px] w-full items-center gap-3 rounded-[10px] px-3 text-sm font-medium text-ink-2 transition-colors hover:bg-danger-soft hover:text-danger"
        >
          <Icon name="logout" size={18} />
          Sair
        </button>
      </div>
    </div>
  );

  return (
    <VipContext.Provider value={vipValue}>
      <a href="#conteudo" className="sr-only-focusable fixed left-3 top-3 z-[100] btn btn-secondary btn-sm">
        Pular para o conteúdo
      </a>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-silver bg-porcelain lg:block">{sidebar}</aside>

      <header
        className="fixed inset-x-0 top-0 z-40 flex h-16 items-center justify-between border-b border-silver bg-ice/90 px-3 backdrop-blur-xl sm:px-4 lg:hidden"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <Link to="/" aria-label="CDW, página inicial" className="rounded-[12px]">
          <BrandMark size={32} />
        </Link>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Buscar"
            className="grid h-11 w-11 place-items-center rounded-[12px] text-ink-2 hover:bg-frost"
          >
            <Icon name="search" size={20} />
          </button>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menu do painel"
            aria-expanded={menuOpen}
            className="grid h-11 w-11 place-items-center rounded-[12px] text-ink-2 hover:bg-frost"
          >
            <Icon name="menu" size={21} />
          </button>
        </div>
      </header>

      <Sheet open={menuOpen} onClose={() => setMenuOpen(false)} label="Menu do painel" side="left">
        {sidebar}
      </Sheet>
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />

      <div className="min-h-[100svh] pt-16 lg:pl-64 lg:pt-0">
        <div className="sticky top-0 z-30 hidden h-16 items-center justify-between border-b border-silver bg-ice/85 px-8 backdrop-blur-xl lg:flex">
          <span className="eyebrow">{area === "admin" ? "Administração" : "Painel do membro"}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              className="btn btn-ghost btn-sm"
              aria-keyshortcuts="Control+K"
            >
              <Icon name="search" size={16} /> Buscar
            </button>
            <Link to="/planos" className="btn btn-ghost btn-sm">
              <Icon name="grid" size={16} /> Loja
            </Link>
            <ProfileMenu />
          </div>
        </div>
        <main id="conteudo" tabIndex={-1} className="mx-auto w-full max-w-6xl px-4 py-7 outline-none sm:px-8 lg:py-10">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <ErrorBoundary compact key={pathname}>
              <Suspense fallback={<PageLoader compact />}>
                <Outlet />
              </Suspense>
            </ErrorBoundary>
          </motion.div>
        </main>
      </div>
    </VipContext.Provider>
  );
}

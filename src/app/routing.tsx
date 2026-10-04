import { Component, Suspense, useEffect, type ReactNode } from "react";
import { Navigate, Outlet, useLocation, useNavigationType } from "react-router";
import { useAuth } from "../lib/auth";
import { PageLoader } from "../components/ui";
import { SiteHeader } from "../components/site/SiteHeader";
import { SiteFooter } from "../components/site/SiteFooter";
import { PlanIcon } from "../components/PlanIcon";

/** Rolagem: topo em navegação nova; âncora (#id) quando houver, esperando o conteúdo carregar. */
export function ScrollManager() {
  const { pathname, hash } = useLocation();
  const type = useNavigationType();

  useEffect(() => {
    if (hash) {
      const id = decodeURIComponent(hash.slice(1));
      let tries = 0;
      let timer: number | undefined;
      const attempt = () => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ block: "start" });
          return;
        }
        if (tries++ < 30) timer = window.setTimeout(attempt, 80);
      };
      attempt();
      return () => window.clearTimeout(timer);
    }
    if (type !== "POP") window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
  }, [pathname, hash, type]);

  return null;
}

export function PublicLayout() {
  return (
    <div className="flex min-h-[100svh] flex-col">
      <SiteHeader />
      <main id="conteudo" className="relative flex-1 outline-none" tabIndex={-1}>
        <Suspense fallback={<PageLoader compact />}>
          <Outlet />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}

export function RequireAuth({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const { user, loading } = useAuth();
  const { pathname, search } = useLocation();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to={`/entrar?next=${encodeURIComponent(pathname + search)}`} replace />;
  if (admin && user.role !== "admin") return <Navigate to="/painel" replace />;
  return children;
}

/** Telas de login e cadastro: quem já está logado vai para o painel (ou para o `next`). */
export function GuestOnly({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { search } = useLocation();
  if (loading) return <PageLoader />;
  if (user) {
    const next = new URLSearchParams(search).get("next");
    const safe = next && next.startsWith("/") && !next.startsWith("//") ? next : null;
    return <Navigate to={safe ?? (user.role === "admin" ? "/admin" : "/painel")} replace />;
  }
  return children;
}

const RELOAD_KEY = "cdw-chunk-reload";
const isChunkError = (e: Error) =>
  /dynamically imported module|Importing a module script failed|error loading dynamically imported/i.test(e.message);

/** Se a interface quebrar, mostra uma saída; se for versão nova publicada, recarrega uma vez. */
export class ErrorBoundary extends Component<{ children: ReactNode; compact?: boolean }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    console.error("[CDW] erro na interface", error, info.componentStack);
    if (isChunkError(error)) {
      try {
        if (!sessionStorage.getItem(RELOAD_KEY)) {
          sessionStorage.setItem(RELOAD_KEY, "1");
          window.location.reload();
        }
      } catch {
        /* sem sessionStorage: segue para a tela de erro */
      }
    }
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className={`grid place-items-center px-6 text-center ${this.props.compact ? "min-h-[60vh]" : "min-h-[100svh]"}`}>
        <div className="max-w-md">
          <PlanIcon name="ghost" size={72} className="mx-auto" />
          <h1 className="mt-6 font-display text-2xl font-extrabold tracking-tight">Algo travou por aqui</h1>
          <p className="mt-3 text-muted">Recarregue a página. Se continuar, avise a staff no servidor.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
              Recarregar
            </button>
            <a className="btn btn-secondary" href="/">
              Voltar ao início
            </a>
          </div>
        </div>
      </div>
    );
  }
}

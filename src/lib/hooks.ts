import { useCallback, useEffect, useRef, useState, type DependencyList, type RefObject } from "react";
import { api, errorMessage } from "./api";
import type { Plan, Promo, Stats } from "./types";

/** GET com estado de carregamento e erro. `path` nulo não busca nada. */
export function useApi<T>(path: string | null, deps: DependencyList = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!path);
  const seq = useRef(0);

  const reload = useCallback(async () => {
    if (!path) return;
    const id = ++seq.current;
    setLoading(true);
    try {
      const res = await api.get<T>(path);
      if (id === seq.current) {
        setData(res);
        setError(null);
      }
    } catch (e) {
      if (id === seq.current) setError(errorMessage(e));
    } finally {
      if (id === seq.current) setLoading(false);
    }
  }, [path, ...deps]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, setData, error, loading, reload };
}

let plansPromise: Promise<{ plans: Plan[] }> | null = null;

/** Catálogo de planos, buscado uma vez por sessão. `null` enquanto carrega. */
export function usePlans() {
  const [plans, setPlans] = useState<Plan[] | null>(null);
  useEffect(() => {
    let alive = true;
    plansPromise ??= api.get<{ plans: Plan[] }>("/plans");
    plansPromise
      .then((r) => alive && setPlans(r.plans))
      .catch(() => {
        plansPromise = null;
        if (alive) setPlans([]);
      });
    return () => {
      alive = false;
    };
  }, []);
  return plans;
}

let promosPromise: Promise<{ promos: Promo[] }> | null = null;

export function usePromos() {
  const [promos, setPromos] = useState<Promo[] | null>(null);
  useEffect(() => {
    let alive = true;
    promosPromise ??= api.get<{ promos: Promo[] }>("/promos");
    promosPromise
      .then((r) => alive && setPromos(r.promos))
      .catch(() => {
        promosPromise = null;
        if (alive) setPromos([]);
      });
    return () => {
      alive = false;
    };
  }, []);
  return promos;
}

/** Números ao vivo do servidor, atualizados a cada `interval` ms. */
export function useStats(interval = 30_000) {
  const [stats, setStats] = useState<Stats | null>(null);
  useEffect(() => {
    let alive = true;
    const load = () =>
      api
        .get<Stats>("/stats")
        .then((s) => alive && setStats(s))
        .catch(() => {});
    void load();
    const id = setInterval(load, interval);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [interval]);
  return stats;
}

export function useCopy() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 1800);
      return true;
    } catch {
      return false;
    }
  }, []);
  return { copied, copy };
}

/** Relógio que só anda quando `active` (para contagens regressivas). */
export function useNow(active: boolean, every = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), every);
    return () => clearInterval(id);
  }, [active, every]);
  return now;
}

export function useDebounced<T>(value: T, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() =>
    typeof window === "undefined" ? false : window.matchMedia(query).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setMatches(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, [query]);
  return matches;
}

export const useReducedMotion = () => useMediaQuery("(prefers-reduced-motion: reduce)");

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Economia de dados ligada no navegador (Chrome/Android). */
export const saveData = () =>
  typeof navigator !== "undefined" &&
  !!(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;

export function useInView<T extends Element>(ref: RefObject<T | null>, options?: IntersectionObserverInit) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), options);
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return inView;
}

/** Trava a rolagem da página e fecha com Esc enquanto `open`. */
export function useModalBehavior(open: boolean, onClose: () => void) {
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close.current();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);
}

import { useMemo } from "react";
import { Link, useSearchParams } from "react-router";
import clsx from "clsx";
import { Icon } from "../components/Icon";
import { PlanCard, PlanCardSkeleton } from "../components/store/PlanCard";
import { Breadcrumbs } from "../components/store/Breadcrumbs";
import { useAuth } from "../lib/auth";
import { useApi, usePlans } from "../lib/hooks";
import { CATEGORIES, SORTS, categoryByKey, categorySummary, sortPlans, type SortKey } from "../lib/catalog";
import { brl } from "../lib/format";
import type { Vip } from "../lib/types";

export default function Catalog() {
  const plans = usePlans();
  const { user } = useAuth();
  const { data: vipData } = useApi<{ vip: Vip | null }>(user?.discord ? "/vip/me" : null);
  const [params, setParams] = useSearchParams();
  const category = categoryByKey(params.get("categoria"));
  const sort = (SORTS.find(([k]) => k === params.get("ordem"))?.[0] ?? "destaque") as SortKey;

  const groups = useMemo(() => {
    if (!plans) return null;
    return CATEGORIES.filter((c) => !category || c.key === category.key)
      .map((c) => ({ ...c, plans: sortPlans(plans.filter((p) => p.kind === c.kind), sort) }))
      .filter((g) => g.plans.length > 0);
  }, [plans, category, sort]);

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: key === "ordem" });
  };

  const total = groups?.reduce((n, g) => n + g.plans.length, 0) ?? 0;
  const title = category ? category.label : "Todos os planos";

  return (
    <div className="container-x pb-20 pt-6 sm:pt-10">
      <Breadcrumbs items={[{ label: "Início", to: "/" }, { label: "Planos", to: category ? "/planos" : undefined }, ...(category ? [{ label: category.label }] : [])]} />

      <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <h1 className="font-display text-[clamp(2rem,4.4vw,3rem)] font-extrabold leading-[1.05] tracking-[-0.035em]">{title}</h1>
          <p className="mt-3 text-[17px] leading-relaxed text-muted">
            {category
              ? `${category.blurb}. Renovar ou trocar de plano soma a duração ao tempo que você ainda tem.`
              : "Renovar ou trocar de plano soma a duração do plano ao tempo que você ainda tem."}
          </p>
        </div>
      </div>

      <div className="sticky top-16 z-30 -mx-4 mt-8 border-b border-silver bg-ice/90 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:top-[72px] lg:-mx-8 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Categorias">
            <CategoryChip active={!category} onClick={() => setParam("categoria", null)} label="Todos" count={plans?.length} />
            {CATEGORIES.map((c) => {
              const s = plans ? categorySummary(plans, c.kind) : null;
              return (
                <CategoryChip
                  key={c.key}
                  active={category?.key === c.key}
                  onClick={() => setParam("categoria", c.key)}
                  label={c.label}
                  count={s?.count ?? (plans ? 0 : undefined)}
                />
              );
            })}
            <Link
              to="/divulgacoes"
              className="inline-flex min-h-[40px] shrink-0 items-center gap-2 rounded-full border border-silver bg-porcelain px-4 text-sm font-semibold text-ink-2 transition-colors hover:border-silver-strong hover:text-ink"
            >
              Divulgação <Icon name="arrow-up-right" size={15} className="text-dim" />
            </Link>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-muted">
            <Icon name="sort" size={17} className="text-dim" />
            <span className="sr-only sm:not-sr-only">Ordenar</span>
            <select
              value={sort}
              onChange={(e) => setParam("ordem", e.target.value === "destaque" ? null : e.target.value)}
              className="field min-h-[40px] w-auto py-1.5 pr-8 text-sm font-semibold text-ink"
            >
              {SORTS.map(([k, label]) => (
                <option key={k} value={k}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <p className="mt-6 text-sm text-dim" aria-live="polite">
        {groups ? `${total} ${total === 1 ? "plano" : "planos"}` : "Carregando planos…"}
      </p>

      {groups === null ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <PlanCardSkeleton key={i} />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="card mt-4 px-6 py-12 text-center">
          <p className="font-display text-lg font-bold">Nenhum plano à venda agora</p>
          <p className="mt-2 text-muted">Atualize a página em instantes. Se continuar assim, chame a staff no servidor.</p>
        </div>
      ) : (
        <div className="mt-4 space-y-12">
          {groups.map((g) => {
            const s = categorySummary(g.plans, g.kind);
            return (
              <section key={g.key} aria-labelledby={`cat-${g.key}`}>
                {!category && (
                  <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2 border-b border-silver pb-3">
                    <h2 id={`cat-${g.key}`} className="font-display text-xl font-extrabold tracking-tight">
                      {g.label}
                    </h2>
                    <span className="text-sm text-dim">
                      {s?.days ? `${s.days} dias · ` : ""}a partir de {s ? brl(s.minPrice) : "—"}
                    </span>
                  </div>
                )}
                {category && (
                  <h2 id={`cat-${g.key}`} className="sr-only">
                    {g.label}
                  </h2>
                )}
                <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
                  {g.plans.map((p) => (
                    <PlanCard key={p.key} plan={p} vip={vipData?.vip} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <div className="mt-14 grid gap-4 rounded-[18px] border border-silver bg-porcelain p-5 shadow-card sm:grid-cols-3 sm:p-6">
        {[
          { icon: "bolt" as const, title: "Ativa na hora", text: "Assim que o Pix é confirmado, o bot aplica o cargo, a tag e a call." },
          { icon: "refresh" as const, title: "Renove ou troque quando quiser", text: "Os dias do plano novo entram somados ao tempo que você ainda tem." },
          { icon: "shield" as const, title: "Pagamento seguro", text: "O Pix é gerado e confirmado pelo provedor de pagamentos." },
        ].map((f) => (
          <div key={f.title} className="flex gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[12px] bg-liquid-soft text-liquid-deep">
              <Icon name={f.icon} size={19} />
            </span>
            <div>
              <p className="font-semibold">{f.title}</p>
              <p className="mt-0.5 text-sm text-muted">{f.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoryChip({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count?: number }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={clsx(
        "inline-flex min-h-[40px] shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors",
        active
          ? "border-liquid-deep bg-liquid-deep text-white shadow-[0_6px_14px_-8px_rgb(15_111_192/0.8)]"
          : "border-silver bg-porcelain text-ink-2 hover:border-silver-strong hover:text-ink",
      )}
    >
      {label}
      {count != null && (
        <span className={clsx("tabular rounded-full px-1.5 text-xs", active ? "bg-white/20 text-white" : "bg-frost text-dim")}>{count}</span>
      )}
    </button>
  );
}

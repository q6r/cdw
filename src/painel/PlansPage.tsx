import { PageHeader } from "../components/ui";
import { PlanCard, PlanCardSkeleton } from "../components/store/PlanCard";
import { useVip } from "./Shell";
import { usePlans } from "../lib/hooks";
import { CATEGORIES, categorySummary, sortPlans } from "../lib/catalog";
import { brl } from "../lib/format";

export default function PlansPage() {
  const plans = usePlans();
  const { vip } = useVip();

  return (
    <>
      <PageHeader eyebrow="Loja" title="Planos">
        Renovar ou trocar de plano soma a duração do plano ao tempo que você ainda tem.
      </PageHeader>
      {!plans ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <PlanCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="space-y-12">
          {CATEGORIES.map((c) => {
            const list = sortPlans(plans.filter((p) => p.kind === c.kind));
            if (!list.length) return null;
            const s = categorySummary(plans, c.kind);
            return (
              <section key={c.key} aria-labelledby={`p-${c.key}`}>
                <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2 border-b border-silver pb-3">
                  <h2 id={`p-${c.key}`} className="font-display text-xl font-extrabold tracking-tight">
                    {c.label}
                  </h2>
                  <span className="text-sm text-dim">
                    {s?.days ? `${s.days} dias · ` : ""}
                    {c.blurb.toLowerCase()} · a partir de {s ? brl(s.minPrice) : "—"}
                  </span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3">
                  {list.map((p) => (
                    <PlanCard key={p.key} plan={p} vip={vip} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}

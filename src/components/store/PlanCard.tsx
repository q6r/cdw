import { useState } from "react";
import { Link, useNavigate } from "react-router";
import clsx from "clsx";
import { Icon } from "../Icon";
import { PlanIcon } from "../PlanIcon";
import { PlanArt } from "./PlanArt";
import { useAuth } from "../../lib/auth";
import { brl, kindLabel } from "../../lib/format";
import { buyPath, isMyPlan, planActionLabel, planHref } from "../../lib/catalog";
import { useMediaQuery } from "../../lib/hooks";
import type { Plan, Vip } from "../../lib/types";

/** Selo de vagas para planos com limite de donos. */
export function SpotsBadge({ plan }: { plan: Plan }) {
  if (!(plan.maxHolders > 0) || plan.soldOut || plan.spotsLeft == null) return null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-porcelain/95 px-2.5 py-1 text-xs font-bold text-liquid-ink shadow-hairline ring-1 ring-liquid/25">
      <span className="h-1.5 w-1.5 rounded-full bg-liquid" aria-hidden="true" />
      {plan.spotsLeft === 1 ? "Última vaga" : `${plan.spotsLeft} vagas`}
    </span>
  );
}

export function PlanCard({
  plan,
  vip,
  headingLevel = "h3",
  perks = 3,
}: {
  plan: Plan;
  vip?: Vip | null;
  headingLevel?: "h2" | "h3";
  perks?: number;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hover, setHover] = useState(false);
  const canHover = useMediaQuery("(hover: hover) and (pointer: fine)");
  const mine = isMyPlan(plan, vip);
  const blocked = plan.soldOut && !mine;
  const action = planActionLabel(plan, vip);
  const Heading = headingLevel;

  const buy = () => {
    const path = buyPath(plan.key, !!user);
    navigate(path, user ? { state: { from: "catalog" } } : undefined);
  };

  return (
    <article
      className={clsx(
        "group relative flex flex-col rounded-[16px] border bg-porcelain p-2.5 shadow-card transition-[transform,box-shadow,border-color] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
        mine ? "border-liquid/50" : "border-silver",
        !blocked && "hover:-translate-y-1 hover:border-silver-strong hover:shadow-lift",
      )}
      onPointerEnter={() => canHover && setHover(true)}
      onPointerLeave={() => setHover(false)}
      onFocusCapture={() => canHover && setHover(true)}
      onBlurCapture={() => setHover(false)}
    >
      <div className="relative">
        <PlanArt
          plan={plan}
          play={canHover ? "hover" : "none"}
          hovering={hover}
          className="rounded-[11px] ring-1 ring-inset ring-black/[0.04]"
          sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 92vw"
        />
        <div className="pointer-events-none absolute left-2.5 top-2.5 flex flex-wrap gap-1.5">
          {mine && (
            <span className="inline-flex items-center gap-1 rounded-full bg-liquid-deep px-2.5 py-1 text-xs font-bold text-white shadow-hairline">
              <Icon name="check" size={13} strokeWidth={2.6} /> Seu plano
            </span>
          )}
          <SpotsBadge plan={plan} />
        </div>
        {plan.soldOut && (
          <div className="absolute inset-0 grid place-items-center rounded-[11px] bg-ink/45 backdrop-blur-[1px]">
            <span className="rounded-full bg-porcelain px-4 py-1.5 font-display text-sm font-extrabold uppercase tracking-wide text-ink">
              Esgotado
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col px-2 pb-1.5 pt-4">
        <div className="flex items-center gap-2 text-[13px] font-semibold text-dim">
          <PlanIcon name={plan.icon} size={20} hoverOnly />
          <span>
            {kindLabel(plan.kind)} · {plan.durationDays} dias
          </span>
        </div>
        <Heading className="mt-2 font-display text-[22px] font-extrabold leading-tight tracking-[-0.025em]">
          <Link
            to={planHref(plan.key)}
            className="rounded-[6px] outline-offset-4 after:absolute after:inset-0 after:rounded-[16px] after:content-[''] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-liquid"
          >
            {plan.name}
          </Link>
        </Heading>
        <p className="mt-1 text-[15px] text-muted">{plan.tagline}</p>

        {perks > 0 && (
          <ul className="mt-4 space-y-2 text-[14px] leading-snug text-ink-2">
            {plan.perks.slice(0, perks).map((perk) => (
              <li key={perk} className="flex gap-2">
                <Icon name="check" size={16} strokeWidth={2.2} className="mt-px text-liquid-deep" />
                <span className="line-clamp-2">{perk}</span>
              </li>
            ))}
            {plan.perks.length > perks && (
              <li className="pl-6 text-[13px] font-medium text-dim">
                + {plan.perks.length - perks} {plan.perks.length - perks === 1 ? "benefício" : "benefícios"}
              </li>
            )}
          </ul>
        )}

        <div className="min-h-5 flex-1" aria-hidden="true" />
        <div className="flex items-end justify-between gap-3 border-t border-silver pt-4">
          <div>
            <div className="tabular font-display text-[24px] font-extrabold leading-none tracking-[-0.02em]">
              {brl(plan.priceCents)}
            </div>
            <div className="mt-1 text-xs font-medium text-dim">por {plan.durationDays} dias · no Pix</div>
          </div>
          <button
            type="button"
            onClick={buy}
            disabled={blocked}
            className={clsx("btn btn-sm relative z-10", mine ? "btn-primary" : blocked ? "btn-secondary" : "btn-primary")}
            aria-label={blocked ? `${plan.name} esgotado` : `${action}: ${plan.name}`}
          >
            {action}
            {!blocked && <Icon name="arrow-right" size={15} />}
          </button>
        </div>
      </div>
    </article>
  );
}

export function PlanCardSkeleton() {
  return (
    <div className="rounded-[16px] border border-silver bg-porcelain p-2.5 shadow-card" aria-hidden="true">
      <div className="skeleton aspect-[5/4] rounded-[11px]" />
      <div className="space-y-3 px-2 pb-2 pt-4">
        <div className="skeleton h-4 w-32" />
        <div className="skeleton h-6 w-40" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-5/6" />
        <div className="skeleton mt-4 h-10 w-full" />
      </div>
    </div>
  );
}

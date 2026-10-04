import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router";
import clsx from "clsx";
import { Icon, PixLogo } from "../components/Icon";
import { PlanIcon } from "../components/PlanIcon";
import { PlanArt } from "../components/store/PlanArt";
import { SpotsBadge } from "../components/store/PlanCard";
import { Breadcrumbs } from "../components/store/Breadcrumbs";
import { Faq, Steps } from "../components/store/Faq";
import { SectionHeading, Skeleton } from "../components/ui";
import { useAuth } from "../lib/auth";
import { useApi, usePlans } from "../lib/hooks";
import { buyPath, categoryHref, categoryOf, categoryByKey, isMyPlan, planActionLabel, planHref, sortPlans } from "../lib/catalog";
import { brl, daysLeft, kindLabel } from "../lib/format";
import { HOME_FAQ, HOW_IT_WORKS } from "../content/copy";
import type { Plan, Vip } from "../lib/types";

const PLAN_FAQ = [HOME_FAQ[0], HOME_FAQ[1], HOME_FAQ[5], HOME_FAQ[3]];

export default function PlanPage() {
  const { planKey } = useParams();
  const plans = usePlans();
  const plan = plans?.find((p) => p.key === planKey);

  if (!plans) return <PlanSkeleton />;
  if (!plan) {
    return (
      <div className="container-x py-20 text-center">
        <PlanIcon name="ghost" size={72} className="mx-auto" />
        <h1 className="mt-6 font-display text-3xl font-extrabold tracking-tight">Plano não encontrado</h1>
        <p className="mt-2 text-muted">Ele pode ter saído do catálogo. Veja os planos à venda agora.</p>
        <Link to="/planos" className="btn btn-primary mt-8">
          Ver planos <Icon name="arrow-right" size={17} />
        </Link>
      </div>
    );
  }
  return <PlanDetail plan={plan} plans={plans} />;
}

function PlanDetail({ plan, plans }: { plan: Plan; plans: Plan[] }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data } = useApi<{ vip: Vip | null }>(user?.discord ? "/vip/me" : null);
  const vip = data?.vip;
  const category = categoryByKey(categoryOf(plan))!;
  const siblings = useMemo(() => sortPlans(plans.filter((p) => p.kind === plan.kind)), [plans, plan.kind]);
  const mine = isMyPlan(plan, vip);
  const blocked = plan.soldOut && !mine;
  const action = planActionLabel(plan, vip);
  const label = action === "Assinar" ? `Assinar ${plan.name}` : action;

  const buy = () => navigate(buyPath(plan.key, !!user), user ? { state: { from: "plan" } } : undefined);

  return (
    <>
      <div className="container-x pb-12 pt-6 sm:pt-10">
        <Breadcrumbs
          items={[
            { label: "Início", to: "/" },
            { label: "Planos", to: "/planos" },
            { label: category.label, to: categoryHref(category.key) },
            { label: plan.name },
          ]}
        />

        <div className="mt-6 grid items-start gap-8 lg:mt-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12">
          {/* Arte e outras opções da categoria */}
          <div className="space-y-5 lg:sticky lg:top-28">
            <div className="relative rounded-[22px] border border-silver bg-porcelain p-2 shadow-lift">
              <PlanArt plan={plan} play="auto" priority className="rounded-[16px]" sizes="(min-width: 1024px) 600px, 94vw" />
              <div className="pointer-events-none absolute left-4 top-4 flex gap-1.5">
                <SpotsBadge plan={plan} />
              </div>
              {plan.soldOut && (
                <div className="absolute inset-2 grid place-items-center rounded-[16px] bg-ink/45">
                  <span className="rounded-full bg-porcelain px-5 py-2 font-display font-extrabold uppercase tracking-wide">Esgotado</span>
                </div>
              )}
            </div>

            <div>
              <p className="eyebrow mb-2.5" id="opcoes-t">
                {category.label}: escolha a opção
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3" role="list" aria-labelledby="opcoes-t">
                {siblings.map((p) => {
                  const current = p.key === plan.key;
                  return (
                    <Link
                      key={p.key}
                      role="listitem"
                      to={planHref(p.key)}
                      replace
                      aria-current={current ? "page" : undefined}
                      className={clsx(
                        "flex items-center gap-2.5 rounded-[12px] border px-3 py-2.5 transition-colors",
                        current
                          ? "border-liquid bg-liquid-soft shadow-[0_0_0_3px_rgb(22_143_229/0.12)]"
                          : "border-silver bg-porcelain hover:border-silver-strong",
                      )}
                    >
                      <PlanIcon name={p.icon} size={26} animated={current} />
                      <span className="min-w-0">
                        <span className={clsx("block truncate text-sm font-semibold", current && "text-liquid-ink")}>{p.name}</span>
                        <span className="tabular block text-xs text-muted">{p.soldOut ? "Esgotado" : brl(p.priceCents)}</span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Informações e compra */}
          <div>
            <div className="flex items-center gap-2.5 text-sm font-semibold text-dim">
              <PlanIcon name={plan.icon} size={26} />
              {kindLabel(plan.kind)} · {plan.durationDays} dias
            </div>
            <h1 className="mt-3 font-display text-[clamp(2.4rem,5vw,3.4rem)] font-extrabold leading-[1] tracking-[-0.04em]">{plan.name}</h1>
            <p className="mt-3 text-lg text-muted">{plan.tagline}</p>

            <div className="card mt-7 p-5 sm:p-6">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <div className="tabular font-display text-[2.4rem] font-extrabold leading-none tracking-[-0.03em]">{brl(plan.priceCents)}</div>
                  <div className="mt-1.5 text-sm text-muted">por {plan.durationDays} dias · pagamento único no Pix</div>
                </div>
                {mine && vip && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-liquid-soft px-3 py-1.5 text-sm font-semibold text-liquid-ink">
                    <Icon name="check" size={15} strokeWidth={2.4} /> Seu plano · {daysLeft(vip.expiresAt)} dias restantes
                  </span>
                )}
              </div>

              <button type="button" className="btn btn-primary btn-lg mt-6 w-full" onClick={buy} disabled={blocked}>
                {blocked ? "Esgotado" : label}
                {!blocked && <Icon name="arrow-right" size={18} />}
              </button>
              {!user && !blocked && (
                <p className="mt-3 text-center text-sm text-muted">
                  Você cria a conta em menos de um minuto e volta direto para o pagamento.{" "}
                  <Link to={`/entrar?next=${encodeURIComponent(`/painel/comprar/${plan.key}`)}`} className="link">
                    Já tenho conta
                  </Link>
                </p>
              )}
              {vip?.active && !mine && !blocked && (
                <p className="mt-3 text-center text-sm text-muted">Os {plan.durationDays} dias entram somados ao tempo que você ainda tem.</p>
              )}

              <ul className="mt-6 grid gap-3 border-t border-silver pt-5 text-sm text-ink-2">
                <li className="flex items-start gap-3">
                  <Icon name="bolt" size={18} className="mt-px text-liquid-deep" />
                  <span>
                    <strong className="font-semibold text-ink">Ativa na hora.</strong> Assim que o Pix é confirmado, o bot te dá o cargo, cria sua
                    tag e sua call.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Icon name="discord" size={18} className="mt-px text-discord" />
                  <span>
                    <strong className="font-semibold text-ink">Discord vinculado.</strong> O bot precisa saber em quem aplicar o VIP; você confirma
                    com um código na DM.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <PixLogo size={18} className="mt-px" />
                  <span>
                    <strong className="font-semibold text-ink">Pagamento seguro.</strong> O site nunca vê nem guarda seus dados bancários.
                  </span>
                </li>
              </ul>
            </div>

            <section aria-labelledby="perks-t" className="mt-8">
              <h2 id="perks-t" className="font-display text-xl font-extrabold tracking-tight">
                O que vem no {plan.name}
              </h2>
              <ul className="mt-4 divide-y divide-silver overflow-hidden rounded-[16px] border border-silver bg-porcelain">
                {plan.perks.map((perk) => (
                  <li key={perk} className="flex gap-3 px-4 py-3.5 text-[15px] leading-snug sm:px-5">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-liquid-soft text-liquid-deep">
                      <Icon name="check" size={13} strokeWidth={2.6} />
                    </span>
                    {perk}
                  </li>
                ))}
              </ul>
              <Link to="/#personalize" className="link mt-4 inline-flex items-center gap-1.5 text-[15px]">
                <Icon name="palette" size={17} /> Teste como sua tag fica no servidor
              </Link>
            </section>
          </div>
        </div>
      </div>

      <section className="border-t border-silver bg-porcelain/60 py-16 sm:py-20" aria-labelledby="como-t">
        <div className="container-x">
          <SectionHeading id="como-t" title="Como funciona">
            Do cadastro ao cargo no servidor em três passos.
          </SectionHeading>
          <div className="mt-10">
            <Steps items={HOW_IT_WORKS} />
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20" aria-labelledby="duvidas-t">
        <div className="container-x grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionHeading id="duvidas-t" title="Dúvidas sobre o plano">
            Não achou? Chama a staff no servidor.
          </SectionHeading>
          <Faq items={PLAN_FAQ} prefix="plano-faq" />
        </div>
      </section>

      {/* Barra de compra fixa no celular */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-silver bg-porcelain/95 px-4 py-3 shadow-[0_-12px_30px_-20px_rgb(24_38_50/0.45)] backdrop-blur lg:hidden"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-semibold text-dim">
              {plan.name} · {plan.durationDays} dias
            </div>
            <div className="tabular font-display text-xl font-extrabold leading-tight">{brl(plan.priceCents)}</div>
          </div>
          <button type="button" className="btn btn-primary" onClick={buy} disabled={blocked}>
            {blocked ? "Esgotado" : action}
            {!blocked && <Icon name="arrow-right" size={16} />}
          </button>
        </div>
      </div>
      <div className="h-20 lg:hidden" aria-hidden="true" />
    </>
  );
}

function PlanSkeleton() {
  return (
    <div className="container-x pb-16 pt-10" aria-busy="true" aria-label="Carregando plano">
      <Skeleton className="h-4 w-60" />
      <div className="mt-8 grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <Skeleton className="aspect-[5/4] rounded-[22px]" />
        <div className="space-y-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-5 w-72" />
          <Skeleton className="mt-6 h-56 rounded-[14px]" />
        </div>
      </div>
    </div>
  );
}

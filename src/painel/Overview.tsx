import { Link } from "react-router";
import { Icon } from "../components/Icon";
import { PlanIcon } from "../components/PlanIcon";
import { Alert, PageHeader, StatusBadge } from "../components/ui";
import { LiquidGauge } from "../components/Liquid";
import { PlanArt } from "../components/store/PlanArt";
import { TagPill } from "../components/tag/TagParts";
import { DiscordLinkCard } from "./DiscordLinkCard";
import { useVip } from "./Shell";
import { useAuth } from "../lib/auth";
import { usePlans } from "../lib/hooks";
import { date, daysLeft, fractionLeft, isForever, planLabel } from "../lib/format";
import { sortPlans } from "../lib/catalog";
import type { Plan, Vip } from "../lib/types";

export default function Overview() {
  const { user } = useAuth();
  const { vip, loading } = useVip();
  const plans = usePlans();
  const plan = vip && plans?.find((p) => p.key === vip.planKey);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  return (
    <>
      <PageHeader
        eyebrow={new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" })}
        title={`${greeting}, ${user?.username}.`}
      >
        {vip?.active ? "Seu VIP está ativo. Personalize à vontade." : "Aqui você compra, renova e configura seu VIP."}
      </PageHeader>
      <div className="space-y-6">
        {!user?.discord && <DiscordLinkCard />}
        {loading || !plans ? (
          <div className="skeleton h-72 rounded-[14px]" />
        ) : vip && plan ? (
          vip.active ? (
            <ActiveVip vip={vip} plan={plan} />
          ) : (
            <EndedVip vip={vip} plan={plan} />
          )
        ) : (
          <NoVip plans={plans} />
        )}
      </div>
    </>
  );
}

function ActiveVip({ vip, plan }: { vip: Vip; plan: Plan }) {
  const left = daysLeft(vip.expiresAt);
  const forever = isForever(vip.expiresAt);
  const grace = !forever && (vip.status === "grace" || left === 0);

  return (
    <>
      {grace && (
        <Alert tone="warn" className="flex-wrap items-center">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold">Seu VIP venceu. Você está na carência.</p>
              <p className="text-ink-2">
                Renove até <strong>{date(vip.graceUntil)}</strong> ou o VIP, o cargo e a call serão removidos.
              </p>
            </div>
            <Link to={`/painel/comprar/${plan.key}`} className="btn btn-primary btn-sm">
              Renovar agora
            </Link>
          </div>
        </Alert>
      )}

      <section className="card overflow-hidden p-5 sm:p-7" aria-labelledby="vip-t">
        <div className="grid items-center gap-7 md:grid-cols-[240px_1fr]">
          <div className="mx-auto w-full max-w-[280px] rounded-[16px] border border-silver bg-porcelain p-1.5 shadow-card">
            <PlanArt plan={plan} play="auto" className="rounded-[11px]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={grace ? "grace" : "active"} />
              <span className="text-sm text-dim">VIP desde {date(vip.startedAt)}</span>
            </div>
            <h2 id="vip-t" className="mt-3 flex items-center gap-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              <PlanIcon name={plan.icon} size={40} />
              {planLabel(plan)}
            </h2>

            {forever ? (
              <div className="mt-6">
                <p className="text-lg font-semibold">Sem vencimento</p>
                <p className="text-sm text-muted">Seu VIP vale enquanto você tiver o cargo no servidor.</p>
              </div>
            ) : (
              <LiquidGauge className="mt-6" value={fractionLeft(vip.expiresAt, plan.durationDays)} tone={grace ? "warn" : "liquid"}>
                <p className="tabular font-display text-4xl font-extrabold leading-none">
                  {left} <span className="text-lg font-bold text-muted">{left === 1 ? "dia" : "dias"}</span>
                </p>
                <p className="mt-2 text-sm text-muted">
                  Vence em <span className="font-semibold text-ink">{date(vip.expiresAt)}</span>
                </p>
                {left <= 5 && !grace && <p className="mt-1 text-sm font-semibold text-warn">Renove para não perder sua tag e sua call.</p>}
              </LiquidGauge>
            )}

            <div className="mt-7 flex flex-wrap gap-2">
              <Link to={`/painel/comprar/${plan.key}`} className="btn btn-primary">
                <Icon name="refresh" size={17} /> Renovar +{plan.durationDays} dias
              </Link>
              <Link to="/painel/planos" className="btn btn-secondary">
                Trocar de plano
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 md:gap-6">
        <Link to="/painel/tag" className="card group block p-6 transition-[box-shadow,border-color] hover:border-silver-strong hover:shadow-lift">
          <div className="flex items-center justify-between">
            <span className="eyebrow">Sua tag</span>
            <Icon name="arrow-up-right" size={18} className="text-dim transition-colors group-hover:text-liquid-deep" />
          </div>
          <TagPill className="mt-5" name={vip.tag.name} color={vip.tag.color} icon={vip.tag.icon} />
          <p className="mt-4 text-sm text-muted">
            {vip.tag.members.length}
            {vip.limits.tagMembers > 0 ? ` de ${vip.limits.tagMembers}` : ""} {vip.tag.members.length === 1 ? "pessoa" : "pessoas"} com sua tag
          </p>
        </Link>
        <Link to="/painel/call" className="card group block p-6 transition-[box-shadow,border-color] hover:border-silver-strong hover:shadow-lift">
          <div className="flex items-center justify-between">
            <span className="eyebrow">Sua call</span>
            <Icon name="arrow-up-right" size={18} className="text-dim transition-colors group-hover:text-liquid-deep" />
          </div>
          <div className="mt-5 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-[12px] bg-liquid-soft text-liquid-deep">
              <Icon name="voice" size={19} />
            </span>
            <span className="truncate text-[15px] font-semibold">{vip.voice.name}</span>
          </div>
          <p className="mt-4 text-sm text-muted">
            {vip.tag.members.length} com sua tag · limite {vip.voice.limit === 0 ? "livre" : `${vip.voice.limit} pessoas`}
          </p>
        </Link>
      </div>
    </>
  );
}

function EndedVip({ vip, plan }: { vip: Vip; plan: Plan }) {
  return (
    <section className="card p-5 sm:p-7">
      <div className="grid items-center gap-7 md:grid-cols-[220px_1fr]">
        <div className="mx-auto w-full max-w-[240px] rounded-[16px] border border-silver bg-porcelain p-1.5 opacity-70 grayscale">
          <PlanArt plan={plan} className="rounded-[11px]" />
        </div>
        <div>
          <StatusBadge status={vip.status} />
          <h2 className="mt-3 font-display text-2xl font-extrabold tracking-tight">Seu VIP {plan.name} foi encerrado</h2>
          <p className="mt-2 max-w-lg text-muted">
            O cargo e a call estão sendo removidos do servidor. Quando quiser, é só escolher um VIP de novo.
          </p>
          <Link to="/painel/planos" className="btn btn-primary mt-6">
            Ver VIPs <Icon name="arrow-right" size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

function NoVip({ plans }: { plans: Plan[] }) {
  const featured = sortPlans(plans).slice(0, 3);
  return (
    <section className="card overflow-hidden p-6 sm:p-9">
      <div className="grid items-center gap-8 md:grid-cols-[1fr_auto]">
        <div>
          <p className="eyebrow">Você ainda não tem VIP</p>
          <h2 className="mt-3 font-display text-3xl font-extrabold leading-[1.05] tracking-tight sm:text-4xl">Escolha seu VIP.</h2>
          <p className="mt-3 max-w-md text-muted">Tag com sua cor e ícone, call privada e cargo em destaque. Ativação na hora pelo Pix.</p>
          <Link to="/painel/planos" className="btn btn-primary btn-lg mt-7">
            Ver planos <Icon name="arrow-right" size={17} />
          </Link>
        </div>
        <div className="relative mx-auto h-44 w-72" aria-hidden="true">
          {featured.map((p, i) => (
            <img
              key={p.key}
              src={`/intros/cards/${p.key}.webp`}
              alt=""
              className="absolute top-4 w-40 rounded-[14px] shadow-lift ring-4 ring-white"
              style={{ left: `${i * 56}px`, zIndex: i === 1 ? 3 : 2 - i, transform: `rotate(${(i - 1) * 7}deg) translateY(${i === 1 ? -10 : 0}px)` }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router";
import clsx from "clsx";
import { Icon, PixLogo } from "../components/Icon";
import { PlanIcon } from "../components/PlanIcon";
import { BrandMedia } from "../components/Brand";
import { CallCrowd } from "../components/home/CallCrowd";
import { LiquidWord } from "../components/Liquid";
import { SectionHeading } from "../components/ui";
import { PlanCard, PlanCardSkeleton } from "../components/store/PlanCard";
import { Faq, Steps } from "../components/store/Faq";
import { ColorPicker } from "../components/tag/ColorPicker";
import { DiscordTagPreview, EmojiPicker } from "../components/tag/TagParts";
import { useAuth } from "../lib/auth";
import { usePlans, usePromos, useStats } from "../lib/hooks";
import { CATEGORIES, categoryHref, categorySummary, planHref, sortPlans, type CategoryKey } from "../lib/catalog";
import { brl, int } from "../lib/format";
import { HOME_FAQ, HOW_IT_WORKS, SUPPORT_LINE } from "../content/copy";
import type { Plan, Stats, TagIcon } from "../lib/types";

export default function Home() {
  const plans = usePlans();
  const stats = useStats();
  return (
    <>
      <Hero plans={plans} stats={stats} />
      <Categories plans={plans} />
      <PlansSection plans={plans} />
      <section id="como-funciona" aria-labelledby="como-funciona-t" className="scroll-mt-20 py-20 sm:py-24">
        <div className="container-x">
          <SectionHeading id="como-funciona-t" title="Como funciona">
            Do cadastro ao cargo no servidor em três passos.
          </SectionHeading>
          <div className="mt-10 sm:mt-12">
            <Steps items={HOW_IT_WORKS} />
          </div>
        </div>
      </section>
      <TagDemo />
      <section id="faq" aria-labelledby="faq-t" className="scroll-mt-20 py-20 sm:py-24">
        <div className="container-x grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
          <SectionHeading id="faq-t" title="Perguntas frequentes">
            {SUPPORT_LINE}
          </SectionHeading>
          <Faq items={HOME_FAQ} prefix="faq" />
        </div>
      </section>
      <FinalCta />
    </>
  );
}

/* ───────────────────────── Abertura ───────────────────────── */

function LiveLine({ stats }: { stats: Stats | null }) {
  if (stats === null) return <div className="skeleton hero-live h-5 w-72 max-w-full" aria-hidden="true" />;
  if (!stats.guild) return null;
  const g = stats.guild;
  return (
    <p className="hero-live flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-muted sm:text-[15px]">
      <span className="live-dot" aria-hidden="true" />
      <span>
        <strong className="tabular font-semibold text-ink">{int(g.online)}</strong> online agora
      </span>
      <span aria-hidden="true" className="text-silver-strong">
        ·
      </span>
      <span>
        <strong className="tabular font-semibold text-ink">{int(g.members)}</strong> membros
      </span>
      <span aria-hidden="true" className="text-silver-strong">
        ·
      </span>
      <span>
        <strong className="tabular font-semibold text-ink">{int(g.inVoice)}</strong> em call
      </span>
    </p>
  );
}

/**
 * Abertura em tela cheia (altura visível menos o header). Os espaços e o
 * medalhão encolhem em telas baixas para título, texto e botões caberem
 * sem rolar; as categorias começam logo abaixo da dobra.
 */
function Hero({ plans, stats }: { plans: Plan[] | null; stats: Stats | null }) {
  const top = plans ? sortPlans(plans.filter((p) => p.kind === "owner"))[0] : undefined;
  const vip = plans ? categorySummary(plans, "vip") : null;

  return (
    <section className="hero-screen relative flex flex-col overflow-hidden" aria-labelledby="hero-t">
      <div aria-hidden="true" className="bg-ice-glow pointer-events-none absolute inset-0" />
      <div className="hero-grid container-x relative grid flex-1 content-center items-center">
        <div className="hero-text">
          <LiveLine stats={stats} />
          <h1 id="hero-t" className="hero-title font-display font-extrabold leading-[0.98] tracking-[-0.045em]">
            Seja <LiquidWord>VIP</LiquidWord>
            <br />
            na CDW.
          </h1>
          <p className="hero-sub max-w-[34rem] text-base leading-relaxed text-muted sm:text-lg">
            Tag com a sua cor e o seu ícone, call privada e cargo em destaque no servidor. Você paga no Pix e o VIP ativa
            sozinho.
          </p>
          <div className="hero-ctas grid gap-3 min-[360px]:grid-cols-2 sm:flex sm:flex-wrap">
            <a href="#planos" className="btn btn-primary btn-lg whitespace-normal px-4 text-center text-[15px] leading-tight sm:px-6 sm:text-base">
              Ver os VIPs
              <Icon name="arrow-right" size={18} />
            </a>
            <a href="#personalize" className="btn btn-secondary btn-lg whitespace-normal px-4 text-center text-[15px] leading-tight sm:px-6 sm:text-base">
              Testar minha tag
            </a>
          </div>
          <ul className="hero-trust flex flex-wrap gap-x-4 gap-y-2 text-[13.5px] font-medium text-ink-2 sm:gap-x-6 sm:text-[15px]">
            <li className="flex items-center gap-1.5 sm:gap-2">
              <PixLogo size={17} /> Pague com Pix
            </li>
            <li className="flex items-center gap-1.5 sm:gap-2">
              <Icon name="bolt" size={17} className="text-liquid-deep" /> Ativa na hora
            </li>
            <li className="flex items-center gap-1.5 sm:gap-2">
              <Icon name="shield" size={17} className="text-liquid-deep" /> Pagamento seguro
            </li>
          </ul>
        </div>

        <div className="hero-media">
          <div className="hero-medallion relative mx-auto w-full">
            <div
              aria-hidden="true"
              className="absolute -inset-8 rounded-[56px] bg-[radial-gradient(closest-side,rgb(22_143_229/0.22),transparent)] blur-2xl"
            />
            <div className="relative z-10 motion-safe:animate-[float-y_8s_ease-in-out_infinite]">
              <div className="rounded-[30px] bg-gradient-to-b from-white to-[#e6edf2] p-1.5 shadow-float ring-1 ring-silver sm:rounded-[34px] sm:p-2.5">
                <BrandMedia priority className="rounded-[24px] ring-1 ring-black/5 sm:rounded-[28px]" />
              </div>
            </div>
            <div aria-hidden="true" className="absolute -bottom-6 left-1/2 h-8 w-3/4 -translate-x-1/2 rounded-[50%] bg-ink/15 blur-xl" />

            {top && (
              <Link
                to={planHref(top.key)}
                className="hero-tag group absolute -left-3 bottom-8 z-30 hidden items-center gap-3 rounded-[16px] border border-silver bg-porcelain/95 py-2.5 pl-2.5 pr-4 shadow-lift backdrop-blur transition-transform hover:-translate-y-0.5 sm:flex lg:-left-10"
              >
                <span className="grid h-11 w-11 place-items-center rounded-[12px] bg-frost ring-1 ring-silver">
                  <PlanIcon name={top.icon} size={30} />
                </span>
                <span className="leading-tight">
                  <span className="block text-[13px] font-semibold text-dim">
                    {top.maxHolders > 0 && top.spotsLeft != null && !top.soldOut
                      ? `${top.name} · ${top.spotsLeft === 1 ? "última vaga" : `${top.spotsLeft} vagas`}`
                      : `Cargo ${top.name}`}
                  </span>
                  <span className="tabular block font-display text-lg font-extrabold group-hover:text-liquid-ink">
                    {top.soldOut ? "Esgotado" : brl(top.priceCents)}
                  </span>
                </span>
              </Link>
            )}
            {vip && (
              <Link
                to={categoryHref("vip")}
                className="hero-tag group absolute -right-2 top-6 z-30 hidden items-center gap-3 rounded-[16px] border border-silver bg-porcelain/95 py-2.5 pl-2.5 pr-4 shadow-lift backdrop-blur transition-transform hover:-translate-y-0.5 sm:flex lg:-right-8"
              >
                <span className="grid h-11 w-11 place-items-center rounded-[12px] bg-frost ring-1 ring-silver">
                  <PlanIcon name={vip.top.icon} size={30} />
                </span>
                <span className="leading-tight">
                  <span className="block text-[13px] font-semibold text-dim">VIPs a partir de</span>
                  <span className="tabular block font-display text-lg font-extrabold group-hover:text-liquid-ink">
                    {brl(vip.minPrice)}
                  </span>
                </span>
              </Link>
            )}
            <CallCrowd />
          </div>
        </div>
      </div>
      <a
        href="#categorias"
        aria-label="Ver as categorias da loja"
        className="hero-scroll absolute bottom-6 left-1/2 hidden h-11 w-11 -translate-x-1/2 place-items-center rounded-full border border-silver bg-porcelain/80 text-ink-2 shadow-hairline backdrop-blur transition-colors hover:border-liquid/40 hover:text-liquid-ink md:grid"
      >
        <Icon name="chevron-down" size={20} className="motion-safe:animate-[float-y_2.6s_ease-in-out_infinite]" />
      </a>
    </section>
  );
}

/* ───────────────────────── Categorias ───────────────────────── */

function Categories({ plans }: { plans: Plan[] | null }) {
  const promos = usePromos();
  const promoMin = promos?.length ? Math.min(...promos.map((p) => p.priceCents)) : null;

  return (
    <section id="categorias" aria-labelledby="cat-t" className="relative scroll-mt-20 pb-6 pt-12 sm:pt-16">
      <div className="container-x">
        <h2 id="cat-t" className="sr-only">
          Categorias da loja
        </h2>
        <ul className="grid gap-3 sm:grid-cols-3 sm:gap-4">
          {CATEGORIES.map((c) => {
            const s = plans ? categorySummary(plans, c.kind) : null;
            const thumbs = plans ? sortPlans(plans.filter((p) => p.kind === c.kind)).slice(0, 3) : [];
            return (
              <li key={c.key}>
                <CategoryTile
                  to={categoryHref(c.key)}
                  title={c.label}
                  text={c.blurb}
                  meta={
                    s
                      ? `${s.count} ${s.count === 1 ? "plano" : "planos"}${s.days ? ` de ${s.days} dias` : ""} · a partir de ${brl(s.minPrice)}`
                      : null
                  }
                  art={
                    <span className="relative block h-14 w-[5.5rem]">
                      {thumbs.map((p, i) => (
                        <img
                          key={p.key}
                          src={`/intros/cards/${p.key}.webp`}
                          alt=""
                          loading="lazy"
                          className="absolute top-0 h-14 w-[4.4rem] rounded-[10px] object-cover shadow-[0_2px_6px_rgb(24_38_50/0.18)] ring-2 ring-white"
                          style={{ left: i * 9, zIndex: 3 - i, transform: `rotate(${(i - 1) * 4}deg)` }}
                        />
                      ))}
                    </span>
                  }
                />
              </li>
            );
          })}
          <li>
            <CategoryTile
              to="/divulgacoes"
              title="Divulgação"
              text="Anúncio para a CDW inteira e mensagem no privado de quem chega"
              meta={promos ? (promoMin != null ? `${promos.length} pacotes · a partir de ${brl(promoMin)}` : "Sem pacotes agora") : null}
              art={
                <span className="grid h-14 w-14 place-items-center rounded-[14px] bg-gradient-to-b from-[#3aa2ee] to-[#0f6fc0] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.4),0_8px_16px_-8px_rgb(15_111_192/0.7)]">
                  <Icon name="megaphone" size={26} />
                </span>
              }
            />
          </li>
        </ul>
      </div>
    </section>
  );
}

function CategoryTile({
  to,
  title,
  text,
  meta,
  art,
}: {
  to: string;
  title: string;
  text: string;
  meta: string | null;
  art: ReactNode;
}) {
  return (
    <Link
      to={to}
      className="group flex h-full items-center gap-4 rounded-[16px] border border-silver bg-porcelain p-4 shadow-card transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-0.5 hover:border-liquid/40 hover:shadow-lift sm:flex-col sm:items-start sm:p-5"
    >
      <span className="shrink-0">{art}</span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 font-display text-lg font-extrabold tracking-tight group-hover:text-liquid-ink">
          {title}
          <Icon name="arrow-right" size={17} className="text-dim transition-transform group-hover:translate-x-0.5 group-hover:text-liquid-ink" />
        </span>
        <span className="mt-1 block text-sm leading-snug text-muted">{text}</span>
        {meta ? (
          <span className="mt-2 block text-[13px] font-semibold text-ink-2">{meta}</span>
        ) : (
          <span className="skeleton mt-2 block h-4 w-40" aria-hidden="true" />
        )}
      </span>
    </Link>
  );
}

/* ───────────────────────── Planos ───────────────────────── */

function PlansSection({ plans }: { plans: Plan[] | null }) {
  const [filter, setFilter] = useState<"todos" | CategoryKey>("todos");
  const owner = plans ? categorySummary(plans, "owner") : null;
  const vip = plans ? categorySummary(plans, "vip") : null;

  const groups = useMemo(() => {
    if (!plans) return null;
    return CATEGORIES.filter((c) => filter === "todos" || c.key === filter)
      .map((c) => ({ ...c, plans: sortPlans(plans.filter((p) => p.kind === c.kind)) }))
      .filter((g) => g.plans.length > 0);
  }, [plans, filter]);

  const filters: ["todos" | CategoryKey, string, number | null][] = [
    ["todos", "Todos", plans?.length ?? null],
    ["dono", "Cargos de dono", owner?.count ?? (plans ? 0 : null)],
    ["vip", "VIPs", vip?.count ?? (plans ? 0 : null)],
  ];

  const durationText =
    owner?.days && vip?.days
      ? `Cargos de dono valem ${owner.days} dias, VIPs valem ${vip.days}. Todos com tag e call próprias.`
      : "Todos os planos vêm com tag e call próprias.";

  return (
    <section id="planos" aria-labelledby="planos-t" className="scroll-mt-20 pb-8 pt-16 sm:pt-20">
      <div className="container-x">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading id="planos-t" title="Escolha seu VIP">
            {durationText}
          </SectionHeading>
          <Link to="/planos" className="link inline-flex items-center gap-1.5 text-[15px]">
            Catálogo completo <Icon name="arrow-right" size={16} />
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Filtrar planos">
          {filters.map(([key, label, count]) => (
            <button
              key={key}
              type="button"
              aria-pressed={filter === key}
              onClick={() => setFilter(key)}
              className={clsx(
                "inline-flex min-h-[40px] items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors",
                filter === key
                  ? "border-liquid-deep bg-liquid-deep text-white shadow-[0_6px_14px_-8px_rgb(15_111_192/0.8)]"
                  : "border-silver bg-porcelain text-ink-2 hover:border-silver-strong hover:text-ink",
              )}
            >
              {label}
              {count != null && (
                <span
                  className={clsx(
                    "tabular rounded-full px-1.5 text-xs",
                    filter === key ? "bg-white/20 text-white" : "bg-frost text-dim",
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {groups === null ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => (
              <PlanCardSkeleton key={i} />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <div className="card mt-8 px-6 py-12 text-center">
            <p className="font-display text-lg font-bold">Nenhum plano à venda agora</p>
            <p className="mt-2 text-muted">Atualize a página em instantes. Se continuar assim, chame a staff no servidor.</p>
            <button type="button" className="btn btn-secondary mt-6" onClick={() => window.location.reload()}>
              <Icon name="refresh" size={17} /> Atualizar
            </button>
          </div>
        ) : (
          <div className="mt-8 space-y-12">
            {groups.map((g) => (
              <div key={g.key}>
                {filter === "todos" && (
                  <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2 border-b border-silver pb-3">
                    <h3 className="font-display text-xl font-extrabold tracking-tight">{g.label}</h3>
                    <span className="text-sm text-dim">{g.blurb}</span>
                  </div>
                )}
                <div className="grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
                  {g.plans.map((p) => (
                    <PlanCard key={p.key} plan={p} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ───────────────────────── Teste sua tag ───────────────────────── */

function TagDemo() {
  const { user } = useAuth();
  const [name, setName] = useState("Realeza");
  const [color, setColor] = useState("#168fe5");
  const [icon, setIcon] = useState<TagIcon | null>(null);

  return (
    <section id="personalize" aria-labelledby="personalize-t" className="scroll-mt-20 border-y border-silver bg-porcelain/60 py-20 sm:py-24">
      <div className="container-x">
        <SectionHeading id="personalize-t" title="Teste sua tag antes de comprar">
          Mexa à vontade: é exatamente assim que ela aparece no servidor.
        </SectionHeading>
        <div className="mt-10 grid items-start gap-6 sm:mt-12 lg:grid-cols-[1fr_1.05fr]">
          <div className="card space-y-8 p-5 sm:p-7">
            <div>
              <label className="label" htmlFor="demo-name">
                Nome da tag
              </label>
              <div className="relative">
                <input
                  id="demo-name"
                  className="field pr-16"
                  value={name}
                  maxLength={32}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Realeza"
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-mono text-xs text-dim">
                  {name.length}/32
                </span>
              </div>
            </div>
            <div>
              <span className="label" id="demo-color">
                Cor
              </span>
              <ColorPicker value={color} onChange={setColor} />
            </div>
            <div>
              <span className="label">Ícone</span>
              <EmojiPicker value={icon} onChange={setIcon} />
            </div>
          </div>
          <div className="space-y-4 lg:sticky lg:top-28">
            <DiscordTagPreview
              name={name}
              color={color}
              icon={icon}
              username={user?.discord?.username ?? user?.username ?? "você"}
              avatar={user?.discord?.avatar}
            />
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-[14px] border border-silver bg-porcelain px-5 py-4">
              <p className="text-[15px] text-ink-2">Gostou? Todos os VIPs incluem tag personalizada.</p>
              <a href="#planos" className="btn btn-primary btn-sm">
                Escolher VIP <Icon name="arrow-right" size={15} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── Chamada final ───────────────────────── */

function FinalCta() {
  return (
    <section className="pb-20 sm:pb-24">
      <div className="container-x">
        <div className="relative overflow-hidden rounded-[22px] border border-silver bg-gradient-to-br from-white via-[#f3f7fa] to-[#e4eef6] px-6 py-10 shadow-card sm:px-10 sm:py-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(closest-side,rgb(22_143_229/0.2),transparent)]"
          />
          <div className="relative flex flex-wrap items-end justify-between gap-8">
            <div className="max-w-xl">
              <h2 className="font-display text-[clamp(1.75rem,3.6vw,2.6rem)] font-extrabold leading-[1.08] tracking-[-0.03em]">
                Pronto para ter seu VIP?
              </h2>
              <p className="mt-3 text-[17px] leading-relaxed text-muted">
                Escolha o plano, pague no Pix e configure sua tag e sua call em seguida.
              </p>
            </div>
            <Link to="/planos" className="btn btn-primary btn-lg max-sm:w-full">
              Escolher meu VIP
              <Icon name="arrow-right" size={18} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

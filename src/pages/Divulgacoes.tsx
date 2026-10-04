import { useNavigate } from "react-router";
import clsx from "clsx";
import { Icon, PixLogo } from "../components/Icon";
import { SectionHeading, Skeleton } from "../components/ui";
import { Faq, Steps } from "../components/store/Faq";
import { DiscordMessagePreview } from "../components/promo/DiscordMessagePreview";
import { useAuth } from "../lib/auth";
import { usePromos, useStats } from "../lib/hooks";
import { brl, int } from "../lib/format";
import { promoDuration } from "../lib/promo";
import { PROMO_EXAMPLE, PROMO_FAQ, PROMO_STEPS, SUPPORT_LINE } from "../content/copy";
import type { Promo } from "../lib/types";

export default function Divulgacoes() {
  const promos = usePromos();
  const stats = useStats();
  const { user } = useAuth();
  const navigate = useNavigate();

  const choose = (p: Promo) => {
    const target = `/painel/divulgacao/${p.key}`;
    navigate(user ? target : `/criar-conta?next=${encodeURIComponent(target)}`);
  };

  const members = stats?.guild?.members;

  return (
    <>
      <section className="relative overflow-hidden" aria-labelledby="dv-t">
        <div aria-hidden="true" className="bg-ice-glow pointer-events-none absolute inset-0" />
        <div className="container-x relative grid items-end gap-10 pb-16 pt-8 sm:pt-12 lg:grid-cols-[1.3fr_0.7fr] lg:gap-16 lg:pb-20">
          <div>
            <p className="eyebrow mb-4">Divulgação</p>
            <h1 id="dv-t" className="font-display text-[clamp(2.5rem,6vw,4.4rem)] font-extrabold leading-[1.02] tracking-[-0.04em]">
              Divulgue para a <span className="text-liquid-deep">CDW</span> inteira.
            </h1>
            <p className="mt-6 max-w-[34rem] text-lg leading-relaxed text-muted">
              Um anúncio com @everyone, a sua mensagem no privado de quem chega, ou os dois. Você escreve, paga no Pix e a staff coloca no ar.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="#pacotes" className="btn btn-primary btn-lg">
                Ver pacotes <Icon name="arrow-right" size={18} />
              </a>
              <a href="#como-aparece" className="btn btn-secondary btn-lg">
                Ver como aparece
              </a>
            </div>
          </div>
          <dl className="divide-y divide-silver overflow-hidden rounded-[16px] border border-silver bg-porcelain shadow-card">
            <div className="flex items-baseline justify-between gap-6 px-5 py-4">
              <dt className="text-sm text-muted">Membros na CDW</dt>
              <dd className="tabular font-display text-2xl font-extrabold">
                {members !== undefined ? int(members) : <Skeleton className="inline-block h-7 w-24 align-middle" />}
              </dd>
            </div>
            {stats?.guild?.online != null && (
              <div className="flex items-baseline justify-between gap-6 px-5 py-4">
                <dt className="text-sm text-muted">Online agora</dt>
                <dd className="tabular flex items-center gap-2 font-display text-2xl font-extrabold">
                  <span className="live-dot" aria-hidden="true" />
                  {int(stats.guild.online)}
                </dd>
              </div>
            )}
            <div className="flex items-baseline justify-between gap-6 px-5 py-4">
              <dt className="text-sm text-muted">Pessoas novas por dia</dt>
              <dd className="font-display text-2xl font-extrabold">800 a 1.000</dd>
            </div>
            <div className="flex items-center justify-between gap-6 px-5 py-4">
              <dt className="text-sm text-muted">Pagamento</dt>
              <dd className="flex items-center gap-2 font-display text-2xl font-extrabold">
                <PixLogo size={20} /> Pix
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section id="como-aparece" aria-labelledby="aparece-t" className="scroll-mt-20 border-t border-silver bg-porcelain/60 py-20 sm:py-24">
        <div className="container-x">
          <SectionHeading id="aparece-t" title="Como aparece para os membros">
            A staff publica exatamente o texto que você escrever, com o seu link. Um exemplo:
          </SectionHeading>
          <div className="mt-12 grid items-start gap-x-6 gap-y-12 lg:grid-cols-2">
            <figure className="min-w-0">
              <DiscordMessagePreview variant="channel" message={PROMO_EXAMPLE.channel} link={PROMO_EXAMPLE.link} invite={PROMO_EXAMPLE.invite} />
              <figcaption className="mt-5 text-[15px] leading-relaxed text-muted">
                <span className="font-semibold text-ink">Everyone.</span> Um anúncio no canal, marcando o servidor inteiro de uma vez.
              </figcaption>
            </figure>
            <figure className="min-w-0">
              <DiscordMessagePreview variant="dm" message={PROMO_EXAMPLE.dm} link={PROMO_EXAMPLE.link} invite={PROMO_EXAMPLE.invite} />
              <figcaption className="mt-5 text-[15px] leading-relaxed text-muted">
                <span className="font-semibold text-ink">No privado.</span> Cada pessoa que entra na CDW recebe a sua mensagem, todos os dias do pacote.
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section id="pacotes" aria-labelledby="pacotes-t" className="scroll-mt-20 py-20 sm:py-24">
        <div className="container-x">
          <SectionHeading id="pacotes-t" title="Escolha o pacote">
            Preço fechado, pago uma vez no Pix.
          </SectionHeading>
          <PromoGrid promos={promos} onChoose={choose} />
        </div>
      </section>

      <section id="como-funciona-divulgacao" aria-labelledby="dv-como-t" className="border-t border-silver bg-porcelain/60 py-20 sm:py-24">
        <div className="container-x">
          <SectionHeading id="dv-como-t" title="Como funciona">
            Do pedido ao anúncio no ar em três passos.
          </SectionHeading>
          <div className="mt-10">
            <Steps items={PROMO_STEPS} />
          </div>
        </div>
      </section>

      <section id="duvidas" aria-labelledby="dv-faq-t" className="scroll-mt-20 py-20 sm:py-24">
        <div className="container-x grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
          <SectionHeading id="dv-faq-t" title="Dúvidas">
            {SUPPORT_LINE}
          </SectionHeading>
          <Faq items={PROMO_FAQ} prefix="duvida" />
        </div>
      </section>
    </>
  );
}

function PromoGrid({ promos, onChoose }: { promos: Promo[] | null; onChoose: (p: Promo) => void }) {
  const everyone = promos?.find((p) => p.key === "everyone");
  const dm = promos?.find((p) => p.key === "dm");

  if (!promos) {
    return (
      <div className="mx-auto mt-12 grid max-w-md gap-5 lg:max-w-none lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-[460px] rounded-[18px]" />
        ))}
      </div>
    );
  }
  if (promos.length === 0) {
    return <p className="card mt-12 px-6 py-10 text-center text-muted">Nenhum pacote à venda agora. Volte mais tarde.</p>;
  }

  return (
    <div className="mx-auto mt-12 grid max-w-md gap-5 lg:max-w-none lg:grid-cols-3">
      {promos.map((p) => {
        const savings = p.includes.everyone && p.includes.dm && everyone && dm ? everyone.priceCents + dm.priceCents - p.priceCents : 0;
        return (
          <article
            key={p.key}
            className={clsx(
              "relative flex flex-col rounded-[18px] border bg-porcelain p-6 shadow-card sm:p-7",
              p.highlight ? "order-first border-liquid/50 shadow-lift ring-1 ring-liquid/20 lg:order-none" : "border-silver",
            )}
          >
            {p.highlight && (
              <span className="absolute -top-3 left-6 rounded-full bg-liquid-deep px-3 py-1 text-xs font-bold text-white shadow-[0_6px_14px_-8px_rgb(15_111_192/0.9)]">
                Mais completo
              </span>
            )}
            <h3 className="font-display text-[22px] font-extrabold leading-tight tracking-tight">{p.name}</h3>
            <p className="mt-1.5 text-[15px] text-muted">{p.tagline}</p>
            <div className="mt-6">
              <div className="tabular font-display text-[2.6rem] font-extrabold leading-none tracking-[-0.03em]">{brl(p.priceCents)}</div>
              <div className="mt-2 text-sm text-dim">{promoDuration(p)}</div>
              {savings > 0 && <div className="mt-1 text-sm font-semibold text-success">{brl(savings)} a menos que os dois separados</div>}
            </div>
            <ul className="mt-6 space-y-3 border-t border-silver pt-6 text-[15px] leading-snug text-ink-2">
              {p.perks.map((perk) => (
                <li key={perk} className="flex gap-2.5">
                  <Icon name="check" size={17} strokeWidth={2.3} className="mt-px text-liquid-deep" />
                  {perk}
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-8">
              <button type="button" onClick={() => onChoose(p)} className={clsx("btn w-full", p.highlight ? "btn-primary" : "btn-secondary")}>
                Escolher <span className="sr-only">{p.name}</span>
                <Icon name="arrow-right" size={16} />
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

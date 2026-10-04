import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useParams } from "react-router";
import { motion } from "motion/react";
import { Icon } from "../components/Icon";
import { PlanIcon } from "../components/PlanIcon";
import { PageHeader, Skeleton } from "../components/ui";
import { PlanArt } from "../components/store/PlanArt";
import { CheckoutSteps, planSteps } from "../components/store/CheckoutSteps";
import { DiscordLinkCard } from "./DiscordLinkCard";
import { PixPayment, PixStart, usePaymentStream } from "./PixPanel";
import { useVip } from "./Shell";
import { useAuth } from "../lib/auth";
import { api, errorMessage } from "../lib/api";
import { usePlans } from "../lib/hooks";
import { useToast } from "../lib/toast";
import { KIND_LABEL, brl, date, planLabel } from "../lib/format";
import type { Payment, PaymentKind, Plan } from "../lib/types";

export default function Checkout() {
  const { planKey } = useParams();
  const plans = usePlans();
  const plan = plans?.find((p) => p.key === planKey);

  if (!plans) return <Skeleton className="h-[520px] rounded-[14px]" />;
  if (!plan) {
    return (
      <div className="card px-6 py-12 text-center">
        <p className="font-display text-lg font-bold">Plano não encontrado</p>
        <p className="mt-2 text-muted">Ele pode ter saído do catálogo.</p>
        <Link to="/painel/planos" className="btn btn-secondary mt-6">
          Ver planos
        </Link>
      </div>
    );
  }
  return <PlanCheckout plan={plan} key={plan.key} />;
}

function PlanCheckout({ plan }: { plan: Plan }) {
  const { user } = useAuth();
  const { vip, reload } = useVip();
  const navigate = useNavigate();
  const toast = useToast();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [reused, setReused] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [activation, setActivation] = useState<{ activated: boolean; failed: boolean } | null>(null);

  const kind: PaymentKind = vip?.active ? (vip.planKey === plan.key ? "renew" : "switch") : "new";
  const role = plan.kind === "owner" ? "cargo" : "VIP";

  usePaymentStream(payment, (e) => {
    setPayment((p) => p && { ...p, status: e.status });
    if (e.status === "paid") {
      setActivation({ activated: !!e.activated, failed: !!e.failed });
      if (e.activated) void reload();
    }
  });

  const generate = async (forceNew = false) => {
    setGenerating(true);
    setGenError(null);
    try {
      const r = await api.post<{ payment: Payment; reused?: boolean }>("/payments", { planKey: plan.key, forceNew });
      setPayment(r.payment);
      setReused(!!r.reused);
      if (forceNew) toast("Novo Pix gerado", "success");
    } catch (e) {
      setGenError(errorMessage(e));
      if (forceNew) toast(errorMessage(e), "error");
    } finally {
      setGenerating(false);
    }
  };

  const check = async () => {
    if (!payment) return;
    setChecking(true);
    try {
      const r = await api.get<{ payment: Payment }>(`/payments/${payment.id}`);
      if (r.payment.status === "pending") toast("Ainda não recebemos. Assim que cair, esta tela atualiza sozinha", "info");
      else {
        setPayment((p) => p && { ...p, status: r.payment.status });
        if (r.payment.status === "paid") setActivation((x) => x ?? { activated: false, failed: false });
      }
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setChecking(false);
    }
  };

  const showPix = payment && (payment.status === "pending" || payment.status === "paid");
  const ended = payment && !showPix ? (payment.status === "expired" ? "expired" : "other") : false;
  const stage = !user?.discord ? "discord" : activation?.activated ? "active" : "pay";

  return (
    <>
      <Link to="/painel/planos" className="mb-5 inline-flex min-h-[40px] items-center gap-2 text-sm font-medium text-muted hover:text-ink">
        <Icon name="arrow-left" size={16} /> Planos
      </Link>
      <PageHeader eyebrow={KIND_LABEL[kind]} title={planLabel(plan)}>
        Pague via Pix e o {role} ativa sozinho, sem precisar avisar ninguém.
      </PageHeader>
      <CheckoutSteps steps={planSteps(stage)} className="mb-8 max-w-xl" />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_330px] lg:gap-8">
        <div className="min-w-0">
          {!user?.discord ? (
            <DiscordLinkCard title="Antes de pagar, vincule seu Discord" text="É nele que o bot vai aplicar seu VIP. Leva 30 segundos." />
          ) : (
            <section className="card p-5 sm:p-8" aria-label="Pagamento">
              {showPix ? (
                <PixPayment
                  payment={payment}
                  note={reused ? "Você já tinha um Pix aberto para esse plano. É este aqui." : null}
                  checking={checking}
                  regenerating={generating}
                  onCheck={check}
                  onRegenerate={() => void generate(true)}
                />
              ) : (
                <PixStart ended={ended} busy={generating} error={genError} onGenerate={() => void generate(!!payment)} amountCents={plan.priceCents} />
              )}
            </section>
          )}
        </div>

        <aside className="card overflow-hidden lg:sticky lg:top-24" aria-label="Resumo do pedido">
          <div className="p-2">
            <PlanArt plan={plan} className="rounded-[10px]" />
          </div>
          <div className="px-5 pb-5 pt-3">
            <p className="eyebrow">Resumo do pedido</p>
            <div className="mt-2 flex items-center gap-2.5">
              <PlanIcon name={plan.icon} size={28} />
              <div className="min-w-0">
                <p className="truncate font-display text-lg font-extrabold">{plan.name}</p>
                <p className="text-[13px] text-muted">
                  {KIND_LABEL[kind]} · {plan.durationDays} dias
                </p>
              </div>
            </div>
            {kind !== "new" && vip && (
              <p className="mt-3 rounded-[10px] bg-liquid-mist px-3 py-2 text-[13px] text-liquid-ink">
                Os {plan.durationDays} dias entram somados ao seu VIP atual, que vence em {date(vip.expiresAt)}.
              </p>
            )}
            <div className="mt-4 flex items-baseline justify-between border-t border-silver pt-4">
              <span className="text-sm font-semibold text-ink-2">Total no Pix</span>
              <span className="tabular font-display text-2xl font-extrabold">{brl(plan.priceCents)}</span>
            </div>
            <details className="group mt-4">
              <summary className="flex min-h-[40px] cursor-pointer list-none items-center justify-between text-sm font-semibold text-ink-2">
                O que vem no plano
                <Icon name="chevron-down" size={16} className="transition-transform group-open:rotate-180" />
              </summary>
              <ul className="mt-2 space-y-2 text-[13px] text-ink-2">
                {plan.perks.map((p) => (
                  <li key={p} className="flex gap-2">
                    <Icon name="check" size={15} strokeWidth={2.4} className="mt-px text-liquid-deep" />
                    {p}
                  </li>
                ))}
              </ul>
            </details>
          </div>
        </aside>
      </div>

      {activation && (
        <ActivationOverlay
          plan={plan}
          activated={activation.activated}
          failed={activation.failed}
          expiresAt={activation.activated && vip?.planKey === plan.key ? vip.expiresAt : null}
          onTag={() => {
            void reload();
            navigate("/painel/tag");
          }}
          onPanel={() => {
            void reload();
            navigate("/painel");
          }}
        />
      )}
    </>
  );
}

/**
 * Depois do Pix: o cartão do plano enche de líquido enquanto o bot aplica o
 * cargo; no fim, mostra o resultado e os próximos passos.
 */
function ActivationOverlay({
  plan,
  activated,
  failed,
  expiresAt,
  onTag,
  onPanel,
}: {
  plan: Plan;
  activated: boolean;
  failed: boolean;
  expiresAt: string | null;
  onTag: () => void;
  onPanel: () => void;
}) {
  const [slow, setSlow] = useState(false);
  const [minShown, setMinShown] = useState(false);
  useEffect(() => {
    const a = setTimeout(() => setSlow(true), 9000);
    const b = setTimeout(() => setMinShown(true), 1400);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
    };
  }, []);

  const role = plan.kind === "owner" ? "cargo" : "VIP";
  const done = minShown && (activated || failed || slow);
  const title = !done
    ? `Pagamento confirmado. Ativando seu ${role} no servidor…`
    : activated
      ? `${planLabel(plan)} ativo${expiresAt ? ` até ${date(expiresAt)}` : ""}`
      : failed
        ? "Pagamento confirmado. A ativação deu erro e a staff já foi avisada."
        : `Pagamento confirmado. Seu ${role} termina de ativar em instantes.`;

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-y-auto bg-ice/95 px-5 py-10 backdrop-blur-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      role="dialog"
      aria-modal="true"
      aria-label={`${planLabel(plan)}: pagamento confirmado`}
    >
      <motion.div
        className="relative w-[min(300px,72vw)] rounded-[22px] border border-silver bg-porcelain p-2 shadow-float"
        initial={{ y: 30, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 26 }}
      >
        <div className="relative overflow-hidden rounded-[16px]">
          <PlanArt plan={plan} play={done && activated ? "auto" : "none"} />
          <motion.div
            className="liquid-fill mix-blend-multiply"
            initial={{ height: "0%", opacity: 0.8 }}
            animate={{ height: done ? "0%" : "100%", opacity: done ? 0 : 0.8 }}
            transition={{ duration: done ? 0.6 : 1.4, ease: [0.45, 0, 0.25, 1] }}
          />
        </div>
        {done && activated && (
          <motion.span
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute -right-3 -top-3 inline-flex items-center gap-1.5 rounded-full bg-liquid-deep px-3 py-1.5 text-sm font-bold text-white shadow-pop"
          >
            <Icon name="check" size={15} strokeWidth={2.8} /> Ativo
          </motion.span>
        )}
        <div className="flex items-center gap-2 px-2 pb-1 pt-3">
          <PlanIcon name={plan.icon} size={24} />
          <span className="font-display font-extrabold">{plan.name}</span>
        </div>
      </motion.div>

      <p className="mt-9 max-w-sm text-center text-lg font-semibold" aria-live="polite">
        {title}
      </p>
      {done && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-7 flex flex-wrap justify-center gap-3">
          <button type="button" className="btn btn-primary btn-lg" onClick={onTag}>
            Personalizar minha tag <Icon name="arrow-right" size={17} />
          </button>
          <button type="button" className="btn btn-secondary btn-lg" onClick={onPanel}>
            Ir para o painel
          </button>
        </motion.div>
      )}
    </motion.div>,
    document.body,
  );
}

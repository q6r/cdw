import { useEffect, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import clsx from "clsx";
import { Icon, PixLogo, Spinner } from "../components/Icon";
import { Alert, FieldHint, PageHeader, Skeleton } from "../components/ui";
import { CheckoutSteps, promoSteps } from "../components/store/CheckoutSteps";
import { DiscordMessagePreview } from "../components/promo/DiscordMessagePreview";
import { PixPayment, PixStart, usePaymentStream } from "./PixPanel";
import { useAuth } from "../lib/auth";
import { ApiError, api, errorMessage } from "../lib/api";
import { usePromos } from "../lib/hooks";
import { useToast } from "../lib/toast";
import { brl } from "../lib/format";
import { MENTION_RE, inviteCode, promoDuration, validateContact, validateLink, validateMessage } from "../lib/promo";
import type { InviteInfo, InviteState, Payment, Promo, PromoOrder } from "../lib/types";

const inviteCache = new Map<string, InviteState>();

/** Consulta o convite do Discord (com cache) para a prévia e para validar. */
function useInvite(link: string) {
  const code = inviteCode(link);
  const [state, setState] = useState<InviteState | undefined>(() => (code ? inviteCache.get(code) : undefined));
  useEffect(() => {
    if (!code) return setState(undefined);
    const cached = inviteCache.get(code);
    if (cached) return setState(cached);
    setState({ status: "loading" });
    let alive = true;
    const t = setTimeout(async () => {
      let next: InviteState;
      try {
        next = { status: "ok", info: await api.get<InviteInfo>(`/promos/invite?code=${encodeURIComponent(code)}`) };
        inviteCache.set(code, next);
      } catch (e) {
        next = e instanceof ApiError && e.status === 404 ? { status: "invalid" } : { status: "error" };
        if (next.status === "invalid") inviteCache.set(code, next);
      }
      if (alive) setState(next);
    }, 400);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [code]);
  return code ? state : undefined;
}

export default function PromoCheckout() {
  const { promoKey } = useParams();
  const promos = usePromos();
  const { user } = useAuth();
  const promo = promos?.find((p) => p.key === promoKey);
  if (!promos) return <Skeleton className="h-[560px] rounded-[14px]" />;
  if (!promo) {
    return (
      <div className="card px-6 py-12 text-center">
        <p className="font-display text-lg font-bold">Pacote não encontrado</p>
        <Link to="/divulgacoes" className="btn btn-secondary mt-6">
          Ver pacotes
        </Link>
      </div>
    );
  }
  return <PromoForm key={promo.key} promo={promo} discordName={user?.discord?.username ?? ""} hasDiscord={!!user?.discord} />;
}

function PromoForm({ promo, discordName, hasDiscord }: { promo: Promo; discordName: string; hasDiscord: boolean }) {
  const toast = useToast();
  const [form, setForm] = useState({ link: "", message: "", contact: discordName });
  const [touched, setTouched] = useState(false);
  const [view, setView] = useState<"form" | "pix">("form");
  const [payment, setPayment] = useState<Payment | null>(null);
  const [reused, setReused] = useState(false);
  const [openPix, setOpenPix] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<{ activated: boolean; failed: boolean } | null>(null);
  const invite = useInvite(form.link);
  const badInvite = invite?.status === "invalid";

  // Se já existe um Pix aberto para este pacote, reaproveita o texto.
  useEffect(() => {
    let alive = true;
    api
      .get<{ orders: PromoOrder[] }>("/promos/orders/mine")
      .then(({ orders }) => {
        const open = orders.find((o) => o.promoKey === promo.key && o.pixOpen);
        if (!alive || !open) return;
        setForm({ link: open.link, message: open.message, contact: open.contact ?? "" });
        setOpenPix(true);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [promo.key]);

  usePaymentStream(payment, (e) => {
    setPayment((p) => p && { ...p, status: e.status });
    if (e.status === "paid") setResult({ activated: !!e.activated, failed: !!e.failed });
  });

  const errors = {
    link: validateLink(form.link) ?? (badInvite ? "Esse convite é inválido ou expirou. No Discord, gere um convite que não expire." : null),
    message: validateMessage(form.message),
    contact: validateContact(form.contact),
  };
  const valid = !errors.link && !errors.message && !errors.contact;
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (forceNew = false) => {
    setTouched(true);
    if (!valid) return;
    setBusy(true);
    setError(null);
    try {
      const r = await api.post<{ payment: Payment; order: PromoOrder; reused?: boolean }>("/promos/orders", {
        promoKey: promo.key,
        link: form.link,
        message: form.message,
        contact: form.contact,
        forceNew,
      });
      setPayment(r.payment);
      setReused(!!r.reused);
      setForm({ link: r.order.link, message: r.order.message, contact: r.order.contact ?? "" });
      setView("pix");
      if (forceNew) toast("Novo Pix gerado", "success");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
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
        if (r.payment.status === "paid") setResult((x) => x ?? { activated: false, failed: false });
      }
    } catch (e) {
      toast(errorMessage(e), "error");
    } finally {
      setChecking(false);
    }
  };

  const paid = payment?.status === "paid";
  const stage = paid && result ? "queued" : view === "pix" ? "pay" : "text";
  const showLink = touched || badInvite;
  const showMsg = touched || MENTION_RE.test(form.message);

  return (
    <>
      <Link to="/divulgacoes" className="mb-5 inline-flex min-h-[40px] items-center gap-2 text-sm font-medium text-muted hover:text-ink">
        <Icon name="arrow-left" size={16} /> Divulgação
      </Link>
      <PageHeader eyebrow="Divulgação" title={promo.name}>
        Escreva o que vai ser divulgado, pague no Pix e a staff coloca no ar.
      </PageHeader>
      <CheckoutSteps steps={promoSteps(stage)} className="mb-8 max-w-xl" />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
        <section className="card min-w-0" aria-label="Pedido de divulgação">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-silver px-5 py-4 sm:px-7">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{promo.name}</p>
              <p className="text-[13px] text-dim">{promoDuration(promo)}</p>
            </div>
            <p className="tabular font-display text-2xl font-extrabold">{brl(promo.priceCents)}</p>
          </div>
          <div className="p-5 sm:p-7">
            <AnimatePresence mode="wait" initial={false}>
              {paid && result ? (
                <motion.div key="done" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <PromoDone failed={result.failed && !result.activated} waiting={!result.activated && !result.failed} hasDiscord={hasDiscord} />
                </motion.div>
              ) : view === "form" ? (
                <motion.form
                  key="form"
                  noValidate
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-6"
                  onSubmit={(e: FormEvent) => {
                    e.preventDefault();
                    void submit(false);
                  }}
                >
                  {openPix && !payment && (
                    <Alert tone="info" icon="clock">
                      Você tem um Pix aberto para esse pacote. Ao continuar, usamos o mesmo código com o texto abaixo.
                    </Alert>
                  )}
                  <div>
                    <label className="label" htmlFor="promo-link">
                      Link
                    </label>
                    <div className="relative">
                      <Icon name="link" size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-dim" />
                      <input
                        id="promo-link"
                        className="field pl-10"
                        value={form.link}
                        onChange={(e) => set("link")(e.target.value)}
                        placeholder="https://discord.gg/seuservidor"
                        maxLength={200}
                        inputMode="url"
                        autoComplete="off"
                        spellCheck={false}
                        aria-invalid={showLink && errors.link ? true : undefined}
                        aria-describedby="promo-link-hint"
                      />
                    </div>
                    <FieldHint id="promo-link-hint" error={showLink ? errors.link : null}>
                      Link https:// ou convite do Discord.
                    </FieldHint>
                  </div>
                  <div>
                    <label className="label" htmlFor="promo-message">
                      Mensagem
                    </label>
                    <div className="relative">
                      <textarea
                        id="promo-message"
                        className="field min-h-40 resize-y pb-8 leading-relaxed"
                        value={form.message}
                        onChange={(e) => set("message")(e.target.value)}
                        placeholder="Conte o que é, para quem é e por que vale a pena entrar."
                        maxLength={600}
                        aria-invalid={showMsg && errors.message ? true : undefined}
                        aria-describedby="promo-message-hint"
                      />
                      <span
                        className={clsx(
                          "tabular pointer-events-none absolute bottom-3 right-4 font-mono text-xs",
                          form.message.length > 560 ? "font-semibold text-warn" : "text-dim",
                        )}
                      >
                        {form.message.length}/600
                      </span>
                    </div>
                    <FieldHint id="promo-message-hint" error={showMsg ? errors.message : null}>
                      De 20 a 600 caracteres. Sem @everyone e sem @here.
                    </FieldHint>
                  </div>
                  <div>
                    <label className="label" htmlFor="promo-contact">
                      Seu Discord <span className="font-normal text-dim">(opcional)</span>
                    </label>
                    <input
                      id="promo-contact"
                      className="field"
                      value={form.contact}
                      onChange={(e) => set("contact")(e.target.value)}
                      placeholder="seu.usuario"
                      maxLength={40}
                      autoComplete="off"
                      spellCheck={false}
                      aria-invalid={touched && errors.contact ? true : undefined}
                      aria-describedby="promo-contact-hint"
                    />
                    <FieldHint id="promo-contact-hint" error={touched ? errors.contact : null}>
                      Para a staff falar com você se precisar.
                    </FieldHint>
                  </div>
                  {!hasDiscord && (
                    <p className="flex items-start gap-2.5 text-sm text-muted">
                      <Icon name="discord" size={18} className="mt-0.5 text-discord" />
                      <span>
                        Com o Discord vinculado, você recebe os avisos do pedido na DM. Não é obrigatório.{" "}
                        <Link to="/painel" className="link">
                          Vincular agora
                        </Link>
                      </span>
                    </p>
                  )}
                  <div className="flex flex-col gap-4 border-t border-silver pt-6 sm:flex-row sm:items-center sm:justify-between">
                    <p className="flex items-center gap-2 text-sm text-muted">
                      <PixLogo size={17} /> Pix de {brl(promo.priceCents)}, vale 30 minutos
                    </p>
                    <button type="submit" className="btn btn-primary btn-lg" disabled={busy}>
                      {busy ? <Spinner /> : <Icon name="qr" size={18} />}
                      {busy ? "Gerando seu Pix…" : payment ? "Salvar e voltar ao Pix" : "Gerar código Pix"}
                    </button>
                  </div>
                  {error && <Alert tone="error">{error}</Alert>}
                </motion.form>
              ) : payment && payment.status === "pending" ? (
                <motion.div key="pix" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <PixPayment
                    payment={payment}
                    note={reused ? "Você já tinha um Pix aberto para esse pacote. É este aqui, com o texto atualizado." : null}
                    checking={checking}
                    regenerating={busy}
                    onCheck={check}
                    onRegenerate={() => void submit(true)}
                    extraActions={
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setView("form")}>
                        <Icon name="message" size={16} /> Editar texto
                      </button>
                    }
                  />
                </motion.div>
              ) : (
                <motion.div key="over" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <PixStart
                    ended={payment?.status === "expired" ? "expired" : "other"}
                    busy={busy}
                    error={error}
                    onGenerate={() => void submit(true)}
                    endedText="Gere um novo código para continuar. Seu texto continua salvo aqui."
                    amountCents={promo.priceCents}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        <aside className="min-w-0 space-y-4 lg:sticky lg:top-24" aria-label="Prévia">
          <PromoPreview promo={promo} link={form.link} message={form.message} invite={invite} />
          <ul className="space-y-2.5 border-t border-silver pt-5 text-sm text-ink-2">
            {promo.perks.map((p) => (
              <li key={p} className="flex gap-2.5">
                <Icon name="check" size={16} strokeWidth={2.3} className="mt-0.5 text-liquid-deep" />
                {p}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </>
  );
}

function PromoPreview({ promo, link, message, invite }: { promo: Promo; link: string; message: string; invite?: InviteState }) {
  const both = promo.includes.everyone && promo.includes.dm;
  const [tab, setTab] = useState<"channel" | "dm">("channel");
  const variant = both ? tab : promo.includes.everyone ? "channel" : "dm";
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold">Prévia</span>
        {both ? (
          <div className="flex rounded-[10px] border border-silver bg-frost p-0.5 text-xs font-semibold" role="tablist" aria-label="Onde a mensagem aparece">
            {(
              [
                ["channel", "No canal"],
                ["dm", "No privado"],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={variant === k}
                onClick={() => setTab(k)}
                className={clsx("min-h-[32px] rounded-[8px] px-3 transition-colors", variant === k ? "bg-porcelain text-ink shadow-hairline" : "text-muted hover:text-ink")}
              >
                {label}
              </button>
            ))}
          </div>
        ) : (
          <span className="text-xs text-dim">{variant === "channel" ? "no canal, com @everyone" : "no privado de quem entra"}</span>
        )}
      </div>
      <DiscordMessagePreview variant={variant} message={message} link={link} invite={invite} />
    </div>
  );
}

function PromoDone({ failed, waiting, hasDiscord }: { failed: boolean; waiting: boolean; hasDiscord: boolean }) {
  return (
    <div className="flex flex-col items-center py-6 text-center">
      <span
        className={clsx(
          "grid h-16 w-16 place-items-center rounded-full border",
          failed ? "border-warn/40 bg-warn-soft text-warn" : "border-success/30 bg-success-soft text-success",
        )}
      >
        {waiting ? <Spinner size={24} /> : <Icon name={failed ? "alert" : "check"} size={28} strokeWidth={2.2} />}
      </span>
      <h3 className="mt-6 font-display text-xl font-extrabold">{failed || waiting ? "Pagamento confirmado" : "Pedido na fila da staff"}</h3>
      <p className="mt-2 max-w-md text-[15px] leading-relaxed text-muted" role="status">
        {failed
          ? "Recebemos o seu Pix, mas algo falhou ao registrar o pedido. A staff consegue ver o pagamento. Chame a gente no servidor."
          : waiting
            ? "Registrando o seu pedido."
            : hasDiscord
              ? "Pagamento confirmado. Você recebe um aviso na DM quando a divulgação for ao ar."
              : "Pagamento confirmado. Acompanhe o status em Minhas divulgações."}
      </p>
      {!waiting && (
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          <Link to="/painel/divulgacoes" className="btn btn-primary">
            Minhas divulgações <Icon name="arrow-right" size={16} />
          </Link>
          <Link to="/divulgacoes" className="btn btn-secondary">
            Voltar
          </Link>
        </div>
      )}
    </div>
  );
}

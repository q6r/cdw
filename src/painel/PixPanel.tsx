import { useEffect, useRef, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import clsx from "clsx";
import { Icon, PixLogo, Spinner } from "../components/Icon";
import { LiquidBar } from "../components/Liquid";
import { brl } from "../lib/format";
import { useCopy, useNow } from "../lib/hooks";
import { useToast } from "../lib/toast";
import type { Payment, PaymentEvent } from "../lib/types";

const PIX_WINDOW = 30 * 60 * 1000;

/**
 * Acompanha o pagamento pelo stream do servidor (SSE). Fecha a conexão quando
 * o status é final: pago e ativado (ou com falha), expirado, cancelado etc.
 */
export function usePaymentStream(
  payment: Payment | null,
  onEvent: (e: PaymentEvent) => void,
) {
  const cb = useRef(onEvent);
  cb.current = onEvent;
  const id = payment?.id;
  // Só abre para um Pix pendente, mas não fecha quando ele vira "pago":
  // a confirmação de ativação chega depois, pelo mesmo stream.
  const openable = payment?.status === "pending";
  const openableRef = useRef(openable);
  openableRef.current = openable;

  useEffect(() => {
    if (!id || !openableRef.current) return;
    const es = new EventSource(`/api/payments/${id}/stream`);
    es.addEventListener("status", (msg) => {
      const data = JSON.parse((msg as MessageEvent).data) as PaymentEvent;
      cb.current(data);
      if (data.status !== "pending" && (data.status !== "paid" || data.activated || data.failed)) es.close();
    });
    return () => es.close();
  }, [id]);
}

/** Tempo restante do Pix em ms (0 quando venceu). */
export function usePixCountdown(payment: Payment | null) {
  const pending = payment?.status === "pending";
  const now = useNow(!!pending);
  const remaining = payment ? Math.max(0, new Date(payment.expiresAt).getTime() - now) : 0;
  return { remaining, expired: !!pending && remaining <= 0 };
}

const mmss = (ms: number) => {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

/** Tela do Pix aberto: QR, copia e cola, prazo e ações. */
export function PixPayment({
  payment,
  note,
  checking,
  regenerating,
  onCheck,
  onRegenerate,
  extraActions,
}: {
  payment: Payment;
  note?: string | null;
  checking: boolean;
  regenerating: boolean;
  onCheck: () => void;
  onRegenerate: () => void;
  extraActions?: ReactNode;
}) {
  const toast = useToast();
  const { copied, copy } = useCopy();
  const { remaining, expired } = usePixCountdown(payment);
  const lowTime = !expired && remaining < 5 * 60 * 1000;

  const onCopy = async () => {
    if (!payment.pixCode) return;
    const ok = await copy(payment.pixCode);
    toast(
      ok ? "Pix copia e cola copiado. Agora é só colar no app do banco" : "Não consegui copiar. Selecione o código e copie manualmente",
      ok ? "success" : "error",
    );
  };

  return (
    <div className="grid gap-8 md:grid-cols-[250px_1fr] md:gap-10">
      <div className="mx-auto w-full max-w-[250px]">
        <div className={clsx("relative rounded-[18px] border border-silver bg-porcelain p-3 shadow-lift transition-[filter] duration-500", expired && "grayscale")}>
          {(["left-1.5 top-1.5 border-l-[3px] border-t-[3px] rounded-tl-[10px]", "right-1.5 top-1.5 border-r-[3px] border-t-[3px] rounded-tr-[10px]", "bottom-1.5 left-1.5 border-b-[3px] border-l-[3px] rounded-bl-[10px]", "bottom-1.5 right-1.5 border-b-[3px] border-r-[3px] rounded-br-[10px]"] as const).map((c) => (
            <span key={c} aria-hidden="true" className={clsx("pointer-events-none absolute h-6 w-6 border-liquid", c)} />
          ))}
          <div className="relative overflow-hidden rounded-[10px] bg-white">
            {payment.qrDataUrl ? (
              <img src={payment.qrDataUrl} alt="QR code do Pix" className="aspect-square w-full" draggable={false} />
            ) : (
              <div className="skeleton aspect-square w-full" />
            )}
            {!expired && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 h-12 bg-gradient-to-b from-transparent via-[rgb(22_143_229/0.22)] to-transparent motion-safe:animate-[pix-scan_2.8s_ease-in-out_infinite] motion-reduce:hidden"
              />
            )}
            {expired && (
              <div className="absolute inset-0 grid place-items-center bg-white/75">
                <span className="rounded-full bg-ink px-3 py-1.5 text-sm font-semibold text-white">Código expirado</span>
              </div>
            )}
          </div>
        </div>
        <p className="mt-4 text-center text-[13px] text-dim">Escaneie com o app do seu banco</p>
      </div>

      <div className="flex min-w-0 flex-col">
        <div className="flex items-center gap-3">
          <span className={clsx("h-2.5 w-2.5 shrink-0 rounded-full", expired ? "bg-chrome" : "bg-warn motion-safe:animate-pulse")} aria-hidden="true" />
          <span className="font-semibold" role="status" aria-live="polite">
            {expired ? "Código expirado" : "Aguardando pagamento"}
          </span>
          {!expired && (
            <span className={clsx("tabular ml-auto font-mono text-sm font-semibold", lowTime ? "text-warn" : "text-muted")} aria-label={`Tempo restante ${mmss(remaining)}`}>
              {mmss(remaining)}
            </span>
          )}
        </div>
        {!expired && <LiquidBar className="mt-3" value={remaining / PIX_WINDOW} tone={lowTime ? "warn" : "liquid"} label="Tempo restante do Pix" />}
        {note && <p className="mt-3 text-[13px] text-dim">{note}</p>}

        <label className="label mt-6" htmlFor="pix-code">
          Pix copia e cola
        </label>
        <div className="relative">
          <AnimatePresence>
            {copied && (
              <motion.span
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute -top-10 right-0 z-10 inline-flex items-center gap-1.5 rounded-full bg-success px-3 py-1.5 text-xs font-bold text-white shadow-pop"
              >
                <Icon name="check" size={14} strokeWidth={2.8} /> Código Pix copiado
              </motion.span>
            )}
          </AnimatePresence>
          <div className="flex gap-2">
            <input
              id="pix-code"
              readOnly
              value={payment.pixCode ?? ""}
              onFocus={(e) => e.target.select()}
              className={clsx("field min-w-0 truncate font-mono text-[13px] transition-colors", copied && "!border-success !bg-success-soft")}
            />
            <button
              type="button"
              onClick={onCopy}
              disabled={!payment.pixCode || expired}
              className={clsx("btn shrink-0", copied ? "border-success bg-success text-white" : "btn-primary")}
            >
              <Icon name={copied ? "check" : "copy"} size={17} />
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>
        </div>

        <ol className="mt-6 space-y-2.5 text-[15px] text-ink-2">
          <li className="flex gap-3">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-frost-2 text-xs font-bold text-ink-2">1</span>
            Abra o app do banco e escolha Pix, copia e cola (ou ler QR).
          </li>
          <li className="flex gap-3">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-frost-2 text-xs font-bold text-ink-2">2</span>
            <span>
              Confira o valor de <strong className="tabular">{brl(payment.amountCents)}</strong> e confirme.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-frost-2 text-xs font-bold text-ink-2">3</span>
            Pronto. Esta tela atualiza sozinha quando o pagamento cair.
          </li>
        </ol>

        <div className="mt-6 flex flex-wrap gap-2 border-t border-silver pt-5">
          <button type="button" className="btn btn-secondary btn-sm" onClick={onCheck} disabled={checking || expired}>
            {checking ? <Spinner size={15} /> : <Icon name="check" size={16} />}
            Já paguei
          </button>
          {extraActions}
          <button type="button" className={clsx("btn btn-sm", expired ? "btn-primary" : "btn-ghost")} onClick={onRegenerate} disabled={regenerating}>
            {regenerating ? <Spinner size={15} /> : <Icon name="refresh" size={16} />}
            {expired ? "Gerar novo Pix" : "Gerar novo"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Antes de gerar o Pix (ou depois que ele venceu). */
export function PixStart({
  ended,
  busy,
  error,
  onGenerate,
  endedText = "Gere um novo código para continuar. Se você já pagou, aguarde: a confirmação chega sozinha.",
  amountCents,
}: {
  ended: false | "expired" | "other";
  busy: boolean;
  error: string | null;
  onGenerate: () => void;
  endedText?: string;
  amountCents: number;
}) {
  return (
    <div className="flex flex-col items-center py-6 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-[20px] border border-silver bg-porcelain shadow-card">
        <PixLogo size={34} />
      </span>
      <h3 className="mt-6 font-display text-xl font-extrabold tracking-tight">
        {ended === "expired" ? "Esse Pix expirou" : ended ? "Esse Pix não foi concluído" : "Pagamento via Pix"}
      </h3>
      <p className="mt-2 max-w-sm text-[15px] text-muted">
        {ended ? endedText : "Geramos um QR code exclusivo. Ele vale por 30 minutos e a confirmação é automática."}
      </p>
      <button type="button" className="btn btn-primary btn-lg mt-7 min-w-[16rem]" onClick={onGenerate} disabled={busy}>
        {busy ? <Spinner /> : <Icon name="qr" size={19} />}
        {busy ? "Gerando seu Pix…" : ended ? "Gerar novo Pix" : `Gerar Pix de ${brl(amountCents)}`}
      </button>
      {error && (
        <p className="mt-5 flex items-center gap-2 text-sm font-medium text-danger" role="alert">
          <Icon name="alert" size={16} /> {error}
        </p>
      )}
    </div>
  );
}

import type { Plan, PaymentKind } from "./types";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const INT = new Intl.NumberFormat("pt-BR");
const COMPACT = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });

export const brl = (cents: number) => BRL.format(cents / 100);
export const int = (n: number) => INT.format(n);
export const compact = (n: number) => COMPACT.format(n);

export const date = (d: string | null | undefined) =>
  d ? new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }) : "—";

export const dateTime = (d: string | null | undefined) =>
  d
    ? new Date(d).toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

/** Tempo em call, vindo em segundos: "3h 05min", "42 min". */
export function callDuration(seconds: number) {
  if (seconds < 60) return "< 1 min";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h >= 1000) return `${compact(h)} h`;
  return h ? `${h}h ${String(m).padStart(2, "0")}min` : `${m} min`;
}

/** Dias inteiros até a data (nunca negativo). */
export const daysLeft = (d: string) => Math.max(0, Math.ceil((new Date(d).getTime() - Date.now()) / 864e5));

/** VIPs sem vencimento vêm com data em 2099 ou depois. */
export const isForever = (d: string | null | undefined) => !!d && new Date(d).getFullYear() >= 2099;

/** Fração do plano que ainda resta, de 0 a 1. */
export const fractionLeft = (d: string, totalDays = 30) => Math.min(1, daysLeft(d) / totalDays);

export const KIND_LABEL: Record<PaymentKind, string> = {
  new: "Nova assinatura",
  renew: "Renovação",
  switch: "Troca de plano",
};

/** "Cargo Royal" ou "VIP God". */
export const planLabel = (plan: Pick<Plan, "kind" | "name">) =>
  plan.kind === "owner" ? `Cargo ${plan.name}` : `VIP ${plan.name}`;

export const kindLabel = (kind: Plan["kind"]) => (kind === "owner" ? "Cargo de dono" : "VIP");

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const n = Number.parseInt(full, 16) || 0;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export const rgba = (hex: string, alpha: number) => {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/** Cor de texto legível sobre um fundo arbitrário. */
export const readableOn = (hex: string) => {
  const [r, g, b] = hexToRgb(hex);
  return 0.299 * r + 0.587 * g + 0.114 * b > 160 ? "#182632" : "#ffffff";
};

export const isHex = (v: string) => /^#[0-9a-fA-F]{6}$/.test(v);

/** Plural simples: plural(2, "dia", "dias"). */
export const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

/** Remove acentos e caixa, para busca. */
export const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** Aceita só caminhos internos em ?next=, para não virar redirecionamento aberto. */
export const safeNext = (v: string | null) =>
  v && v.startsWith("/") && !v.startsWith("//") && !v.startsWith("/\\") ? v : null;

import type { Plan, PlanKind, Vip } from "./types";

export type CategoryKey = "dono" | "vip";

export const CATEGORIES: { key: CategoryKey; kind: PlanKind; label: string; blurb: string }[] = [
  { key: "dono", kind: "owner", label: "Cargos de dono", blurb: "Cargo acima dos VIPs e gestão total da call" },
  { key: "vip", kind: "vip", label: "VIPs", blurb: "Tag e call próprias em todos" },
];

export const categoryOf = (plan: Plan): CategoryKey => (plan.kind === "owner" ? "dono" : "vip");

export const categoryByKey = (key: string | null | undefined) => CATEGORIES.find((c) => c.key === key) ?? null;

export const categoryHref = (key: CategoryKey) => `/planos?categoria=${key}`;

export const planHref = (key: string) => `/planos/${encodeURIComponent(key)}`;

export type SortKey = "destaque" | "menor-preco" | "maior-preco";

export const SORTS: [SortKey, string][] = [
  ["destaque", "Mais alto primeiro"],
  ["menor-preco", "Menor preço"],
  ["maior-preco", "Maior preço"],
];

export function sortPlans(plans: Plan[], sort: SortKey = "destaque") {
  const list = [...plans];
  if (sort === "menor-preco") return list.sort((a, b) => a.priceCents - b.priceCents || b.tier - a.tier);
  if (sort === "maior-preco") return list.sort((a, b) => b.priceCents - a.priceCents || b.tier - a.tier);
  return list.sort((a, b) => b.tier - a.tier);
}

/** Resumo de uma categoria a partir dos planos reais. */
export function categorySummary(plans: Plan[], kind: PlanKind) {
  const list = plans.filter((p) => p.kind === kind);
  if (!list.length) return null;
  const minPrice = Math.min(...list.map((p) => p.priceCents));
  const days = [...new Set(list.map((p) => p.durationDays))];
  return { count: list.length, minPrice, days: days.length === 1 ? days[0] : null, top: sortPlans(list)[0] };
}

/** Para onde vai o botão de compra: checkout logado ou cadastro com retorno. */
export function buyPath(planKey: string, signedIn: boolean) {
  const target = `/painel/comprar/${encodeURIComponent(planKey)}`;
  return signedIn ? target : `/criar-conta?next=${encodeURIComponent(target)}`;
}

/** Texto do botão conforme o VIP atual (mesma regra do painel anterior). */
export function planActionLabel(plan: Plan, vip: Vip | null | undefined) {
  const mine = !!vip?.active && vip.planKey === plan.key;
  if (plan.soldOut && !mine) return "Esgotado";
  if (vip?.active) return mine ? `Renovar +${plan.durationDays} dias` : `Trocar +${plan.durationDays} dias`;
  return "Assinar";
}

export const isMyPlan = (plan: Plan, vip: Vip | null | undefined) => !!vip?.active && vip.planKey === plan.key;

export const planArt = (key: string) => ({
  image: `/intros/cards/${key}.webp`,
  video: `/intros/cards/${key}.mp4`,
});

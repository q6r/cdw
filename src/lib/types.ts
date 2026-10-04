// Formatos das respostas da API, como o front anterior os usava.

export type PlanIconName =
  | "crown"
  | "gem"
  | "flame"
  | "bolt"
  | "star"
  | "heart"
  | "shield"
  | "trophy"
  | "rings"
  | "moon"
  | "skull"
  | "headphones"
  | "note"
  | "ghost"
  | "rocket"
  | "planet";

export type PlanKind = "owner" | "vip";

export interface Plan {
  key: string;
  name: string;
  kind: PlanKind;
  tier: number;
  priceCents: number;
  durationDays: number;
  color: string;
  icon: string;
  tagline: string;
  perks: string[];
  limits: { tagMembers: number; voiceAllowed: number; firstLadies: number };
  features: { mute: boolean; countHours: boolean };
  maxHolders: number;
  soldOut: boolean;
  spotsLeft: number | null;
}

export interface Promo {
  key: string;
  name: string;
  tagline: string;
  priceCents: number;
  durationDays: number;
  includes: { everyone: boolean; dm: boolean };
  color: string;
  icon: string;
  perks: string[];
  highlight: boolean;
}

export interface Stats {
  guild: { name: string; icon: string | null; members: number; online: number; inVoice: number; activeCalls: number } | null;
  activeVips: number;
}

export interface DiscordAccount {
  id: string;
  username: string | null;
  avatar: string | null;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: "user" | "admin";
  createdAt: string;
  discord: DiscordAccount | null;
}

export type TagIcon =
  | { kind: "cdw"; key: string; name?: string }
  | { kind: "guild"; key: string; name?: string; animated?: boolean };

export interface Member {
  id: string;
  username: string | null;
  displayName: string | null;
  avatar: string | null;
  inGuild?: boolean;
}

export type VipStatus = "active" | "grace" | "expired" | "revoked";

export interface Vip {
  id: string;
  planKey: string;
  active: boolean;
  status: VipStatus;
  startedAt: string;
  expiresAt: string;
  graceUntil: string | null;
  tag: { name: string; color: string; icon: TagIcon | null; members: Member[]; onDiscord: boolean };
  voice: { name: string; limit: number };
  limits: { tagMembers: number; voiceAllowed: number; firstLadies: number };
  firstLadies?: Member[];
}

export type PaymentStatus = "pending" | "paid" | "failed" | "cancelled" | "expired" | "refunded";
export type PaymentKind = "new" | "renew" | "switch";

export interface Payment {
  id: string;
  status: PaymentStatus;
  amountCents: number;
  expiresAt: string;
  qrDataUrl: string | null;
  pixCode: string | null;
}

export interface PaymentRow {
  id: string;
  productType?: "plan" | "promo";
  planKey?: string;
  promoKey?: string;
  planName: string;
  kind: PaymentKind;
  amountCents: number;
  status: PaymentStatus;
  createdAt: string;
  paidAt: string | null;
}

export interface PaymentEvent {
  status: PaymentStatus;
  activated?: boolean;
  failed?: boolean;
}

export type PromoOrderStatus = "awaiting_payment" | "queued" | "running" | "done" | "rejected";

export interface PromoOrder {
  id: string;
  promoKey: string;
  promoName: string;
  amountCents: number;
  status: PromoOrderStatus;
  pixOpen: boolean;
  link: string;
  message: string;
  contact: string | null;
  createdAt: string;
  endsAt: string | null;
  doneAt: string | null;
  rejectReason: string | null;
}

export interface InviteInfo {
  code: string;
  guild: { id: string; name: string; iconUrl: string | null; bannerUrl: string | null };
  members: number | null;
  online: number | null;
}

export type InviteState =
  | { status: "loading" }
  | { status: "ok"; info: InviteInfo }
  | { status: "invalid" }
  | { status: "error" };

export interface GuildEmoji {
  id: string;
  name: string;
  animated: boolean;
  url: string;
}

export type RankingPeriod = "week" | "month" | "all";
export type RankingMetric = "voice" | "messages";

export interface RankingRow {
  rank: number;
  displayName: string;
  username: string | null;
  avatar: string | null;
  value: number;
  isMe: boolean;
}

export interface RankingResponse {
  period: RankingPeriod;
  metric: RankingMetric;
  since: string | null;
  total: number;
  me: { rank: number | null; value: number } | null;
  rows: RankingRow[];
}

export interface RankingVipRow {
  rank: number;
  displayName: string;
  username: string | null;
  avatar: string | null;
  since: string;
  isMe: boolean;
  plan: { key: string; name: string; kind: PlanKind; color: string; icon: string };
}

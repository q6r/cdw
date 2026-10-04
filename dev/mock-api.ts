/**
 * API simulada para desenvolvimento (`npm run dev:mock`). Reproduz o contrato
 * que o front usa da API real, em memória, para testar cadastro, vínculo do
 * Discord, Pix, ativação, tag, call, divulgação e admin sem tocar em produção.
 *
 * Contas de teste (senha "cdw12345"):
 *   membro  - Discord vinculado, sem VIP
 *   novato  - sem Discord vinculado
 *   vip     - VIP God ativo
 *   admin   - administrador
 *
 * Pix: o pagamento é confirmado sozinho após MOCK_PAY_AFTER_MS (padrão 9000).
 * POST /api/__mock/pay/:id confirma na hora; MOCK_PAY_AFTER_MS=0 desliga o automático.
 * Código do Discord: 123456.
 */
import type { Plugin } from "vite";
import type { IncomingMessage, ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import plansFixture from "./fixtures/plans.json";
import promosFixture from "./fixtures/promos.json";
import statsFixture from "./fixtures/stats.json";
import { registerAdmin } from "./mock-admin";

export type Json = Record<string, unknown>;
type Req = IncomingMessage & { body?: Json };
export type Handler = (ctx: Ctx) => unknown | Promise<unknown>;

export interface Ctx {
  req: Req;
  res: ServerResponse;
  params: Record<string, string>;
  query: URLSearchParams;
  body: Json;
  user: MockUser | null;
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
  ) {
    super(message);
  }
}

export interface MockUser {
  id: string;
  username: string;
  email: string;
  password: string;
  role: "user" | "admin";
  createdAt: string;
  discord: { id: string; username: string; avatar: string | null } | null;
  disabled?: boolean;
}

const DAY = 864e5;
/** Foto de todos os usuários simulados (avatar do Discord escolhido pelo dono da loja). */
const MOCK_AVATAR = "https://cdn.discordapp.com/avatars/1518482740616630426/b9f0aaa5ec19f97b8f294c4c37d96a3d.png?size=128";
const now = () => new Date().toISOString();
const plus = (ms: number, from = Date.now()) => new Date(from + ms).toISOString();
const PAY_AFTER = Number(process.env.MOCK_PAY_AFTER_MS ?? 9000);

const plans: Json[] = structuredClone((plansFixture as { plans: Json[] }).plans);
const promos: Json[] = structuredClone((promosFixture as { promos: Json[] }).promos);
const stats = structuredClone(statsFixture as Json);

const users = new Map<string, MockUser>();
const sessions = new Map<string, string>();
const vips = new Map<string, Json>(); // por userId
const payments = new Map<string, Json>();
const promoOrders = new Map<string, Json>();
const pendingLinks = new Map<string, { discordId: string; code: string }>();
const listeners = new Map<string, Set<ServerResponse>>();

function seedUser(username: string, role: "user" | "admin", discord: boolean, daysAgo = 40): MockUser {
  const u: MockUser = {
    id: randomUUID(),
    username,
    email: `${username}@exemplo.com`,
    password: "cdw12345",
    role,
    createdAt: plus(-daysAgo * DAY),
    discord: discord ? { id: String(1000000000000000000n + BigInt(users.size)), username: `${username}.cdw`, avatar: MOCK_AVATAR } : null,
  };
  users.set(u.id, u);
  return u;
}

const memberNames = [
  "aurora",
  "breno.dev",
  "caio",
  "duda",
  "enzo",
  "flor",
  "gabi",
  "heitor",
  "isa",
  "joao.pedro",
  "kaique",
  "lara",
  "malu",
  "nico",
  "olivia",
  "pietro",
];
const guildMembers = memberNames.map((name, i) => ({
  id: String(1100000000000000000n + BigInt(i)),
  username: name,
  displayName: name.charAt(0).toUpperCase() + name.slice(1).replace(/\..*/, ""),
  avatar: MOCK_AVATAR as string | null,
  inGuild: true,
}));

seedUser("membro", "user", true);
seedUser("novato", "user", false, 2);
const vipUser = seedUser("vip", "user", true, 90);
seedUser("admin", "admin", true, 300);
vips.set(vipUser.id, makeVip(vipUser, plans.find((p) => p.key === "god")!, 18 * DAY));

function planByKey(key: string) {
  const p = plans.find((x) => x.key === key);
  if (!p) throw new HttpError(404, "plano não encontrado");
  return p;
}

function makeVip(user: MockUser, plan: Json, ms = Number(plan.durationDays) * DAY): Json {
  const expires = Date.now() + ms;
  return {
    id: randomUUID(),
    userId: user.id,
    planKey: plan.key,
    active: true,
    status: "active",
    startedAt: now(),
    expiresAt: new Date(expires).toISOString(),
    graceUntil: new Date(expires + 3 * DAY).toISOString(),
    tag: {
      name: user.username.charAt(0).toUpperCase() + user.username.slice(1),
      color: plan.color,
      icon: { kind: "cdw", key: plan.icon },
      members: [guildMembers[1], guildMembers[4]],
      onDiscord: true,
    },
    voice: { name: `Call de ${user.username}`, limit: 0 },
    limits: plan.limits,
    firstLadies: [],
  };
}

const publicUser = (u: MockUser | null) =>
  u && {
    id: u.id,
    username: u.username,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt,
    discord: u.discord,
  };

function publicVip(v: Json | undefined) {
  if (!v) return null;
  const { userId: _userId, ...rest } = v;
  return rest;
}

function requireUser(ctx: Ctx) {
  if (!ctx.user) throw new HttpError(401, "faça login para continuar", "unauthenticated");
  return ctx.user;
}
function requireAdmin(ctx: Ctx) {
  const u = requireUser(ctx);
  if (u.role !== "admin") throw new HttpError(403, "só a administração pode fazer isso");
  return u;
}
function requireDiscord(u: MockUser) {
  if (!u.discord) throw new HttpError(400, "vincule seu Discord antes");
  return u.discord;
}
function requireActiveVip(u: MockUser) {
  const v = vips.get(u.id);
  if (!v || !v.active) throw new HttpError(400, "você não tem VIP ativo");
  return v;
}

/* QR "de mentira" desenhado em SVG (só para a tela ter algo escaneável à vista). */
function fakeQr(seed: string) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const n = 29;
  let rects = "";
  for (let y = 0; y < n; y++)
    for (let x = 0; x < n; x++) {
      const finder = (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
      let on: boolean;
      if (finder) {
        const fx = x >= n - 7 ? x - (n - 7) : x;
        const fy = y >= n - 7 ? y - (n - 7) : y;
        on = fx === 0 || fx === 6 || fy === 0 || fy === 6 || (fx >= 2 && fx <= 4 && fy >= 2 && fy <= 4);
      } else {
        h = Math.imul(h ^ (x * 31 + y), 1540483477);
        on = (h >>> 7) % 2 === 0;
      }
      if (on) rects += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
    }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 ${n + 4} ${n + 4}" shape-rendering="crispEdges"><rect x="-2" y="-2" width="${n + 4}" height="${n + 4}" fill="#fff"/><g fill="#111">${rects}</g></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function emit(paymentId: string, data: Json) {
  for (const res of listeners.get(paymentId) ?? []) res.write(`event: status\ndata: ${JSON.stringify(data)}\n\n`);
}

function confirmPayment(id: string) {
  const p = payments.get(id);
  if (!p || p.status !== "pending") return;
  p.status = "paid";
  p.paidAt = now();
  const user = users.get(String(p.userId))!;
  if (p.productType === "promo") {
    const order = promoOrders.get(String(p.orderId));
    if (order) {
      order.status = "queued";
      order.pixOpen = false;
    }
    emit(id, { status: "paid", activated: false, failed: false });
    setTimeout(() => emit(id, { status: "paid", activated: true, failed: false }), 900);
    return;
  }
  emit(id, { status: "paid", activated: false, failed: false });
  setTimeout(() => {
    const plan = planByKey(String(p.planKey));
    const current = vips.get(user.id);
    if (current?.active) {
      const base = Math.max(Date.now(), new Date(String(current.expiresAt)).getTime());
      const expires = base + Number(plan.durationDays) * DAY;
      current.planKey = plan.key;
      current.limits = plan.limits;
      current.status = "active";
      current.expiresAt = new Date(expires).toISOString();
      current.graceUntil = new Date(expires + 3 * DAY).toISOString();
    } else {
      vips.set(user.id, makeVip(user, plan));
    }
    if (Number(plan.maxHolders) > 0 && plan.spotsLeft != null) {
      plan.spotsLeft = Math.max(0, Number(plan.spotsLeft) - 1);
      plan.soldOut = plan.spotsLeft === 0;
    }
    emit(id, { status: "paid", activated: true, failed: false });
  }, 1800);
}

function newPayment(user: MockUser, data: Json) {
  const id = randomUUID();
  const p: Json = {
    id,
    userId: user.id,
    status: "pending",
    createdAt: now(),
    paidAt: null,
    expiresAt: plus(30 * 60 * 1000),
    qrDataUrl: fakeQr(id),
    pixCode: `00020126580014br.gov.bcb.pix0136${id}5204000053039865406${(Number(data.amountCents) / 100).toFixed(2)}5802BR5903CDW6009SAO PAULO62070503***6304ABCD`,
    ...data,
  };
  payments.set(id, p);
  if (PAY_AFTER > 0) setTimeout(() => confirmPayment(id), PAY_AFTER);
  return p;
}

const publicPayment = (p: Json) => ({
  id: p.id,
  status: p.status,
  amountCents: p.amountCents,
  expiresAt: p.expiresAt,
  qrDataUrl: p.qrDataUrl,
  pixCode: p.pixCode,
});

function expireStale() {
  for (const p of payments.values())
    if (p.status === "pending" && new Date(String(p.expiresAt)).getTime() < Date.now()) p.status = "expired";
}

const emojiColors = ["#f7c948", "#ff4d9d", "#38bdf8", "#10b981", "#b46bff", "#ff7a1a", "#f43f5e", "#6366f1"];
const emojis = Array.from({ length: 24 }, (_, i) => {
  const c = emojiColors[i % emojiColors.length];
  const shape =
    i % 3 === 0
      ? `<circle cx="32" cy="32" r="24" fill="${c}"/>`
      : i % 3 === 1
        ? `<path d="M32 6l7.6 16.4 17.9 2-13.3 12.2 3.7 17.7L32 45.4 16.1 54.3l3.7-17.7L6.5 24.4l17.9-2z" fill="${c}"/>`
        : `<rect x="10" y="10" width="44" height="44" rx="12" fill="${c}"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${shape}<circle cx="24" cy="28" r="4" fill="#fff"/><circle cx="40" cy="28" r="4" fill="#fff"/><path d="M22 40q10 8 20 0" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/></svg>`;
  return {
    id: String(1200000000000000000n + BigInt(i)),
    name: `cdw_emoji_${i + 1}`,
    animated: false,
    url: `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`,
  };
});

function rankingRows(seed: number, metric: string, me: MockUser | null) {
  return guildMembers
    .map((m, i) => ({
      rank: 0,
      displayName: m.displayName,
      username: m.username,
      avatar: m.avatar,
      value: metric === "voice" ? Math.round((90000 / (i + 1)) * (1 + (seed % 3) * 0.2)) : Math.round((300 / (i + 1)) * (1 + (seed % 3) * 0.3)),
      isMe: false,
    }))
    .concat(
      me?.discord
        ? [{ rank: 0, displayName: me.username, username: me.discord.username, avatar: me.discord.avatar, value: metric === "voice" ? 5400 : 21, isMe: true }]
        : [],
    )
    .sort((a, b) => b.value - a.value)
    .map((r, i) => ({ ...r, rank: i + 1 }));
}

/* ───────────── Rotas ───────────── */

const routes: [string, string, Handler][] = [];
const on = (method: string, path: string, h: Handler) => routes.push([method, path, h]);

on("GET", "/config", () => ({ turnstileSiteKey: null }));
on("GET", "/plans", () => ({ plans }));
on("GET", "/promos", () => ({ promos }));
on("GET", "/stats", () => {
  const g = stats.guild as Json;
  g.online = Number(g.online) + Math.round(Math.random() * 40 - 20);
  return { ...stats, activeVips: [...vips.values()].filter((v) => v.active).length };
});
on("GET", "/emojis", () => ({ emojis, roleIcons: true }));

on("GET", "/auth/me", (c) => ({ user: publicUser(c.user) }));
on("POST", "/auth/login", (c) => {
  const login = String(c.body.login ?? "").trim().toLowerCase();
  const u = [...users.values()].find((x) => x.username.toLowerCase() === login || x.email.toLowerCase() === login);
  if (!u || u.password !== c.body.password) throw new HttpError(400, "usuário ou senha incorretos");
  const token = randomUUID();
  sessions.set(token, u.id);
  c.res.setHeader("Set-Cookie", `cdw_mock=${token}; Path=/; HttpOnly; SameSite=Lax`);
  return { user: publicUser(u) };
});
on("POST", "/auth/register", (c) => {
  const username = String(c.body.username ?? "").trim();
  const email = String(c.body.email ?? "").trim();
  const password = String(c.body.password ?? "");
  if (!/^[a-zA-Z0-9_.]{3,24}$/.test(username)) throw new HttpError(400, "usuário deve ter de 3 a 24 letras, números, _ ou .");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new HttpError(400, "email inválido");
  if (password.length < 8) throw new HttpError(400, "a senha precisa de pelo menos 8 caracteres");
  if ([...users.values()].some((u) => u.username.toLowerCase() === username.toLowerCase()))
    throw new HttpError(409, "esse usuário já existe");
  if ([...users.values()].some((u) => u.email.toLowerCase() === email.toLowerCase())) throw new HttpError(409, "esse email já tem conta");
  const u: MockUser = { id: randomUUID(), username, email, password, role: "user", createdAt: now(), discord: null };
  users.set(u.id, u);
  const token = randomUUID();
  sessions.set(token, u.id);
  c.res.setHeader("Set-Cookie", `cdw_mock=${token}; Path=/; HttpOnly; SameSite=Lax`);
  return { user: publicUser(u) };
});
on("POST", "/auth/logout", (c) => {
  c.res.setHeader("Set-Cookie", "cdw_mock=; Path=/; Max-Age=0");
  return { ok: true };
});
on("POST", "/auth/password", (c) => {
  const u = requireUser(c);
  if (c.body.current !== u.password) throw new HttpError(400, "a senha atual não confere");
  if (String(c.body.next ?? "").length < 8) throw new HttpError(400, "a senha nova precisa de pelo menos 8 caracteres");
  u.password = String(c.body.next);
  return { ok: true };
});
on("POST", "/auth/password/forgot", () => ({ ok: true }));
on("POST", "/auth/password/reset/check", (c) => ({ valid: c.body.token === "a".repeat(43) }));
on("POST", "/auth/password/reset", (c) => {
  if (c.body.token !== "a".repeat(43)) throw new HttpError(400, "link inválido ou expirado", "reset_invalid");
  const u = [...users.values()].find((x) => x.username === "membro")!;
  u.password = String(c.body.password);
  const token = randomUUID();
  sessions.set(token, u.id);
  c.res.setHeader("Set-Cookie", `cdw_mock=${token}; Path=/; HttpOnly; SameSite=Lax`);
  return { user: publicUser(u) };
});
on("POST", "/auth/discord/start", (c) => {
  const u = requireUser(c);
  const discordId = String(c.body.discordId ?? "");
  if (!/^\d{17,20}$/.test(discordId)) throw new HttpError(400, "ID do Discord inválido");
  if (discordId.endsWith("0000")) throw new HttpError(400, "não achei esse ID no servidor da CDW. Entre no servidor e tente de novo");
  pendingLinks.set(u.id, { discordId, code: "123456" });
  return { member: { id: discordId, username: `${u.username}.discord`, avatar: MOCK_AVATAR } };
});
on("POST", "/auth/discord/verify", (c) => {
  const u = requireUser(c);
  const pending = pendingLinks.get(u.id);
  if (!pending || c.body.code !== pending.code) throw new HttpError(400, "código incorreto ou expirado");
  u.discord = { id: pending.discordId, username: `${u.username}.discord`, avatar: MOCK_AVATAR };
  pendingLinks.delete(u.id);
  return { user: publicUser(u) };
});

on("GET", "/vip/me", (c) => ({ vip: publicVip(vips.get(requireUser(c).id)) }));
on("PATCH", "/vip/tag", (c) => {
  const v = requireActiveVip(requireUser(c));
  const tag = v.tag as Json;
  if (c.body.name !== undefined) {
    const name = String(c.body.name).trim();
    if (!name) throw new HttpError(400, "dê um nome para a tag");
    tag.name = name;
  }
  if (c.body.color !== undefined) tag.color = c.body.color;
  if (c.body.icon !== undefined) tag.icon = c.body.icon;
  return { vip: publicVip(v) };
});
on("POST", "/vip/tag/members", (c) => {
  const v = requireActiveVip(requireUser(c));
  const tag = v.tag as { members: Json[] };
  const m = guildMembers.find((x) => x.id === c.body.discordId);
  if (!m) throw new HttpError(404, "membro não encontrado no servidor");
  const limit = Number((v.limits as Json).tagMembers);
  if (limit > 0 && tag.members.length >= limit) throw new HttpError(400, "limite do plano atingido");
  if (!tag.members.some((x) => x.id === m.id)) tag.members.push(m);
  return { vip: publicVip(v) };
});
on("DELETE", "/vip/tag/members/:id", (c) => {
  const v = requireActiveVip(requireUser(c));
  const tag = v.tag as { members: Json[] };
  tag.members = tag.members.filter((x) => x.id !== c.params.id);
  return { vip: publicVip(v) };
});
on("POST", "/vip/first-ladies", (c) => {
  const v = requireActiveVip(requireUser(c));
  const list = (v.firstLadies ?? []) as Json[];
  const m = guildMembers.find((x) => x.id === c.body.discordId);
  if (!m) throw new HttpError(404, "membro não encontrado no servidor");
  if (list.length >= Number((v.limits as Json).firstLadies)) throw new HttpError(400, "limite do plano atingido");
  if (!list.some((x) => x.id === m.id)) list.push(m);
  v.firstLadies = list;
  return { vip: publicVip(v) };
});
on("DELETE", "/vip/first-ladies/:id", (c) => {
  const v = requireActiveVip(requireUser(c));
  v.firstLadies = ((v.firstLadies ?? []) as Json[]).filter((x) => x.id !== c.params.id);
  return { vip: publicVip(v) };
});
on("PATCH", "/vip/voice", (c) => {
  const v = requireActiveVip(requireUser(c));
  const voice = v.voice as Json;
  if (c.body.name !== undefined) voice.name = String(c.body.name).trim();
  if (c.body.limit !== undefined) voice.limit = Math.max(0, Math.min(99, Number(c.body.limit)));
  return { vip: publicVip(v), warning: undefined };
});
on("GET", "/vip/voice/live", (c) => {
  const u = requireUser(c);
  requireActiveVip(u);
  return { members: [{ id: u.discord!.id, username: u.discord!.username, displayName: u.username, avatar: u.discord!.avatar }, guildMembers[1], guildMembers[4]] };
});
on("POST", "/vip/voice/disconnect", () => ({ ok: true }));
on("GET", "/vip/received", (c) => {
  requireDiscord(requireUser(c));
  return {
    tags: [
      {
        vipId: "vip-aurora",
        tag: { name: "Aurora", color: "#b46bff", icon: { kind: "cdw", key: "gem" } },
        owner: { username: "aurora", avatar: guildMembers[0].avatar },
      },
    ],
  };
});
on("DELETE", "/vip/received/:vipId", () => ({ ok: true }));
on("GET", "/vip/members/search", (c) => {
  const q = (c.query.get("q") ?? "").toLowerCase();
  return { members: guildMembers.filter((m) => m.username.includes(q) || m.displayName.toLowerCase().includes(q) || m.id.includes(q)).slice(0, 8) };
});

on("POST", "/payments", (c) => {
  const u = requireUser(c);
  requireDiscord(u);
  expireStale();
  const plan = planByKey(String(c.body.planKey));
  const current = vips.get(u.id);
  const mine = current?.active && current.planKey === plan.key;
  if (plan.soldOut && !mine) throw new HttpError(400, "esse plano esgotou");
  const existing = [...payments.values()].find(
    (p) => p.userId === u.id && p.planKey === plan.key && p.status === "pending",
  );
  if (existing && !c.body.forceNew) return { payment: publicPayment(existing), reused: true };
  if (existing) existing.status = "cancelled";
  const kind = current?.active ? (mine ? "renew" : "switch") : "new";
  const p = newPayment(u, {
    productType: "plan",
    planKey: plan.key,
    planName: plan.name,
    kind,
    amountCents: plan.priceCents,
  });
  return { payment: publicPayment(p), reused: false };
});
on("GET", "/payments/mine", (c) => {
  const u = requireUser(c);
  expireStale();
  return {
    payments: [...payments.values()]
      .filter((p) => p.userId === u.id)
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
      .map((p) => ({
        id: p.id,
        productType: p.productType,
        planKey: p.planKey,
        promoKey: p.promoKey,
        planName: p.planName,
        kind: p.kind,
        amountCents: p.amountCents,
        status: p.status,
        createdAt: p.createdAt,
        paidAt: p.paidAt,
      })),
  };
});
on("GET", "/payments/:id", (c) => {
  const u = requireUser(c);
  expireStale();
  const p = payments.get(c.params.id);
  if (!p || p.userId !== u.id) throw new HttpError(404, "pagamento não encontrado");
  return { payment: publicPayment(p) };
});

on("GET", "/promos/invite", (c) => {
  const code = c.query.get("code") ?? "";
  if (code.startsWith("x")) throw new HttpError(404, "convite inválido");
  return { code, guild: { id: "1", name: `Servidor ${code}`, iconUrl: null, bannerUrl: null }, members: 4210, online: 812 };
});
on("GET", "/promos/orders/mine", (c) => {
  const u = requireUser(c);
  expireStale();
  for (const o of promoOrders.values()) {
    const p = payments.get(String(o.paymentId));
    if (o.status === "awaiting_payment") o.pixOpen = p?.status === "pending";
  }
  return {
    orders: [...promoOrders.values()]
      .filter((o) => o.userId === u.id)
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))),
  };
});
on("POST", "/promos/orders", (c) => {
  const u = requireUser(c);
  const promo = promos.find((p) => p.key === c.body.promoKey);
  if (!promo) throw new HttpError(404, "pacote não encontrado");
  const link = String(c.body.link ?? "").trim();
  const message = String(c.body.message ?? "");
  if (!link) throw new HttpError(400, "informe o link");
  if (message.trim().length < 20) throw new HttpError(400, "a mensagem precisa de pelo menos 20 caracteres");
  expireStale();
  const open = [...promoOrders.values()].find((o) => o.userId === u.id && o.promoKey === promo.key && o.status === "awaiting_payment");
  const openPay = open && payments.get(String(open.paymentId));
  if (open && openPay?.status === "pending" && !c.body.forceNew) {
    Object.assign(open, { link, message, contact: c.body.contact || null });
    return { payment: publicPayment(openPay), order: open, reused: true };
  }
  const orderId = randomUUID();
  const p = newPayment(u, {
    productType: "promo",
    promoKey: promo.key,
    planName: promo.name,
    kind: "new",
    amountCents: promo.priceCents,
    orderId,
  });
  const order: Json = {
    id: orderId,
    userId: u.id,
    paymentId: p.id,
    promoKey: promo.key,
    promoName: promo.name,
    amountCents: promo.priceCents,
    status: "awaiting_payment",
    pixOpen: true,
    link,
    message,
    contact: c.body.contact || null,
    createdAt: now(),
    endsAt: null,
    doneAt: null,
    rejectReason: null,
  };
  if (open) open.status = "rejected";
  promoOrders.set(orderId, order);
  return { payment: publicPayment(p), order, reused: false };
});

on("GET", "/ranking/vips", (c) => {
  const rows = [...vips.entries()]
    .filter(([, v]) => v.active)
    .map(([uid, v]) => {
      const u = users.get(uid)!;
      const plan = planByKey(String(v.planKey));
      return {
        displayName: u.username,
        username: u.discord?.username ?? null,
        avatar: u.discord?.avatar ?? null,
        since: v.startedAt,
        isMe: c.user?.id === uid,
        tier: Number(plan.tier),
        plan: { key: plan.key, name: plan.name, kind: plan.kind, color: plan.color, icon: plan.icon },
      };
    })
    .sort((a, b) => b.tier - a.tier)
    .map(({ tier: _t, ...r }, i) => ({ rank: i + 1, ...r }));
  return { total: rows.length, rows };
});
on("GET", "/ranking", (c) => {
  const period = c.query.get("period") ?? "week";
  const metric = c.query.get("metric") ?? "messages";
  const rows = rankingRows(period.length, metric, c.user);
  const me = c.user?.discord ? rows.find((r) => r.isMe) : null;
  return {
    period,
    metric,
    since: period === "all" ? null : period === "week" ? "2026-09-28" : "2026-10-01",
    total: rows.length,
    me: c.user?.discord ? { rank: me?.rank ?? null, value: me?.value ?? 0 } : null,
    rows: rows.slice(0, 30),
  };
});

on("POST", "/__mock/pay/:id", (c) => {
  confirmPayment(c.params.id);
  return { ok: true };
});

/* ───────────── Admin (subconjunto suficiente para as telas) ───────────── */
registerAdmin(on, { users, vips, payments, promoOrders, plans, promos, guildMembers, planByKey, makeVip, publicUser, requireAdmin, HttpError });

/* ───────────── Servidor ───────────── */

function match(pattern: string, path: string) {
  const a = pattern.split("/");
  const b = path.split("/");
  if (a.length !== b.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith(":")) params[a[i].slice(1)] = decodeURIComponent(b[i]);
    else if (a[i] !== b[i]) return null;
  }
  return params;
}

function readBody(req: Req): Promise<Json> {
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (ch) => (raw += ch));
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
  });
}

function cookieUser(req: Req) {
  const m = /(?:^|;\s*)cdw_mock=([^;]+)/.exec(req.headers.cookie ?? "");
  const id = m && sessions.get(m[1]);
  return (id && users.get(id)) || null;
}

const send = (res: ServerResponse, status: number, data: unknown) => {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
};

async function handle(req: Req, res: ServerResponse, next: () => void) {
  if (!req.url?.startsWith("/api/")) return next();
  const url = new URL(req.url, "http://localhost");
  const path = url.pathname.slice(4);
  const method = req.method ?? "GET";
  await new Promise((r) => setTimeout(r, 180 + Math.random() * 220));

  // Fluxo de status do Pix (Server-Sent Events).
  const stream = /^\/payments\/([^/]+)\/stream$/.exec(path);
  if (stream && method === "GET") {
    const p = payments.get(stream[1]);
    if (!p) return send(res, 404, { error: "pagamento não encontrado" });
    res.writeHead(200, { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" });
    res.write(`event: status\ndata: ${JSON.stringify({ status: p.status })}\n\n`);
    const set = listeners.get(p.id as string) ?? new Set();
    set.add(res);
    listeners.set(p.id as string, set);
    req.on("close", () => set.delete(res));
    return;
  }

  if (method !== "GET" && req.headers["x-cdw-request"] !== "1") return send(res, 403, { error: "requisição bloqueada" });

  for (const [m, pattern, handler] of routes) {
    if (m !== method) continue;
    const params = match(pattern, path);
    if (!params) continue;
    try {
      const body = method === "GET" ? {} : await readBody(req);
      const out = await handler({ req, res, params, query: url.searchParams, body, user: cookieUser(req) });
      return send(res, 200, out ?? { ok: true });
    } catch (e) {
      if (e instanceof HttpError) return send(res, e.status, { error: e.message, code: e.code });
      console.error("[mock-api]", e);
      return send(res, 500, { error: "erro interno do mock" });
    }
  }
  send(res, 404, { error: `rota não simulada: ${method} ${path}` });
}

/** Plugin do Vite: atende /api no `vite --mode mock` e no `vite preview --mode mock`. */
export function mockApi(): Plugin {
  return {
    name: "cdw-mock-api",
    configureServer(server) {
      server.middlewares.use((req, res, next) => void handle(req as Req, res, next));
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => void handle(req as Req, res, next));
    },
  };
}

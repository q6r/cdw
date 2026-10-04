/**
 * Endpoints de administração da API simulada. Os números de receita são
 * fictícios (só para as telas terem o que mostrar), somados aos pedidos
 * feitos durante a sessão de desenvolvimento.
 */
import { randomUUID } from "node:crypto";
import type { Ctx, Handler, HttpError, Json, MockUser } from "./mock-api";

const DAY = 864e5;
const now = () => new Date().toISOString();
const plus = (ms: number) => new Date(Date.now() + ms).toISOString();

interface Deps {
  users: Map<string, MockUser>;
  vips: Map<string, Json>;
  payments: Map<string, Json>;
  promoOrders: Map<string, Json>;
  plans: Json[];
  promos: Json[];
  guildMembers: { id: string; username: string; displayName: string; avatar: string | null; inGuild: boolean }[];
  planByKey: (key: string) => Json;
  makeVip: (user: MockUser, plan: Json, ms?: number) => Json;
  publicUser: (u: MockUser | null) => unknown;
  requireAdmin: (ctx: Ctx) => MockUser;
  HttpError: typeof HttpError;
}

export function registerAdmin(route: (method: string, path: string, h: Handler) => void, d: Deps) {
  const adminUser = (u: MockUser | undefined) =>
    u ? { id: u.id, username: u.username, email: u.email, avatar: u.discord?.avatar ?? null, discordId: u.discord?.id ?? null } : null;
  const paged = <T>(list: T[], q: URLSearchParams, size = 15) => {
    const p = Math.max(1, Number(q.get("page") ?? 1));
    const pages = Math.max(1, Math.ceil(list.length / size));
    return { items: list.slice((p - 1) * size, p * size), page: p, pages, total: list.length };
  };
  const matches = (text: string, q: URLSearchParams) => {
    const t = (q.get("q") ?? "").toLowerCase().trim();
    return !t || text.toLowerCase().includes(t);
  };
  const paidAll = () => [...d.payments.values()].filter((p) => p.status === "paid");
  const userOf = (p: Json) => d.users.get(String(p.userId));
  const adminPlan = (p: Json) => ({
    ...p,
    roleId: p.roleId === undefined ? "1300000000000000001" : p.roleId,
    categoryId: p.categoryId ?? null,
    autoRoleId: p.autoRoleId ?? null,
    active: p.active ?? true,
    holders: [...d.vips.values()].filter((v) => v.active && v.planKey === p.key).length,
  });

  route("GET", "/admin/overview", (c) => {
    d.requireAdmin(c);
    const paid = paidAll();
    const daily = Array.from({ length: 14 }, (_, i) => {
      const day = new Date(Date.now() - (13 - i) * DAY).toISOString().slice(0, 10);
      const list = paid.filter((p) => String(p.paidAt).slice(0, 10) === day);
      const seed = (i * 7919) % 5;
      const extra = i % 3 === 0 ? 0 : seed + 1;
      return { day, revenue: list.reduce((s, p) => s + Number(p.amountCents), 0) + extra * 4500, count: list.length + extra };
    });
    const byPlan = d.plans.map((p) => {
      const list = paid.filter((x) => x.planKey === p.key);
      const extra = Number(p.tier) % 3;
      return { planKey: p.key, name: p.name, count: list.length + extra, revenue: list.reduce((s, x) => s + Number(x.amountCents), 0) + extra * Number(p.priceCents) };
    });
    const last14 = daily.reduce((s, x) => s + x.revenue, 0);
    return {
      revenueTotal: last14 + 980000,
      revenue30d: last14,
      paidCount: paid.length + 42,
      pending: [...d.payments.values()].filter((p) => p.status === "pending").length,
      activeVips: [...d.vips.values()].filter((v) => v.active).length,
      users: d.users.size,
      daily,
      byPlan,
      recent: [...d.payments.values()]
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
        .slice(0, 8)
        .map((p) => ({ id: p.id, user: adminUser(userOf(p)), planKey: p.planKey ?? "", planName: p.planName, amountCents: p.amountCents, status: p.status, createdAt: p.createdAt })),
    };
  });

  route("GET", "/admin/payments", (c) => {
    d.requireAdmin(c);
    const status = c.query.get("status") ?? "";
    const list = [...d.payments.values()]
      .filter((p) => !status || p.status === status)
      .filter((p) => {
        const u = userOf(p);
        return matches(`${u?.username} ${u?.email} ${u?.discord?.id ?? ""} ${p.id}`, c.query);
      })
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
      .map((p) => ({
        id: p.id,
        user: adminUser(userOf(p)),
        planKey: p.planKey ?? "",
        planName: p.planName,
        kind: p.kind,
        amountCents: p.amountCents,
        status: p.status,
        error: null,
        createdAt: p.createdAt,
        paidAt: p.paidAt,
        pagciId: `pagci_${String(p.id).slice(0, 8)}`,
      }));
    return paged(list, c.query);
  });
  route("POST", "/admin/payments/:id/sync", (c) => {
    d.requireAdmin(c);
    const p = d.payments.get(c.params.id);
    if (!p) throw new d.HttpError(404, "pedido não encontrado");
    return { payment: { status: p.status } };
  });

  route("GET", "/admin/users", (c) => {
    const me = d.requireAdmin(c);
    const role = c.query.get("role") ?? "";
    const list = [...d.users.values()]
      .filter((u) => !role || u.role === role)
      .filter((u) => matches(`${u.username} ${u.email} ${u.discord?.id ?? ""}`, c.query))
      .map((u) => {
        const v = d.vips.get(u.id);
        return {
          id: u.id,
          username: u.username,
          email: u.email,
          role: u.role,
          owner: u.username === "admin",
          banned: !!u.disabled,
          discord: u.discord,
          vip: v ? { planKey: v.planKey, status: v.status } : null,
          spentCents: paidAll()
            .filter((p) => p.userId === u.id)
            .reduce((s, p) => s + Number(p.amountCents), 0),
          createdAt: u.createdAt,
          lastLoginAt: now(),
        };
      });
    return { ...paged(list, c.query), canManageAdmins: me.username === "admin" };
  });
  route("PATCH", "/admin/users/:id", (c) => {
    d.requireAdmin(c);
    const u = d.users.get(c.params.id);
    if (!u) throw new d.HttpError(404, "usuário não encontrado");
    if (c.body.role === "admin" || c.body.role === "user") u.role = c.body.role;
    if (typeof c.body.banned === "boolean") u.disabled = c.body.banned;
    return { user: d.publicUser(u) };
  });
  route("POST", "/admin/users/:id/reset-link", (c) => {
    d.requireAdmin(c);
    return { url: `http://localhost:5173/redefinir-senha#t=${"a".repeat(43)}`, expiresAt: plus(15 * 60 * 1000) };
  });

  route("GET", "/admin/vips", (c) => {
    d.requireAdmin(c);
    const status = c.query.get("status") ?? "";
    const list = [...d.vips.entries()]
      .filter(([, v]) => !status || v.status === status)
      .map(([uid, v]) => {
        const u = d.users.get(uid);
        const tag = v.tag as Json & { members: unknown[] };
        return {
          id: v.id,
          user: adminUser(u),
          discordId: u?.discord?.id ?? "",
          planKey: v.planKey,
          tag: { name: tag.name, color: tag.color, icon: tag.icon, members: tag.members.length },
          expiresAt: v.expiresAt,
          status: v.status,
          onDiscord: true,
          viaRole: false,
        };
      })
      .filter((r) => matches(`${r.user?.username ?? ""} ${r.user?.email ?? ""} ${r.discordId}`, c.query));
    return paged(list, c.query);
  });
  const vipById = (id: string) => {
    const e = [...d.vips.entries()].find(([, v]) => v.id === id);
    if (!e) throw new d.HttpError(404, "VIP não encontrado");
    return e;
  };
  route("POST", "/admin/vips/:id/extend", (c) => {
    d.requireAdmin(c);
    const [, v] = vipById(c.params.id);
    const exp = new Date(String(v.expiresAt)).getTime() + Number(c.body.days ?? 30) * DAY;
    Object.assign(v, { expiresAt: new Date(exp).toISOString(), graceUntil: new Date(exp + 3 * DAY).toISOString(), status: "active", active: true });
    return { ok: true };
  });
  route("POST", "/admin/vips/:id/resync", (c) => {
    d.requireAdmin(c);
    vipById(c.params.id);
    return { ok: true };
  });
  route("POST", "/admin/vips/:id/revoke", (c) => {
    d.requireAdmin(c);
    const [uid] = vipById(c.params.id);
    d.vips.delete(uid);
    return { ok: true };
  });
  route("GET", "/admin/discord/members", (c) => {
    d.requireAdmin(c);
    const q = (c.query.get("q") ?? "").toLowerCase();
    return {
      members: d.guildMembers
        .filter((m) => m.username.includes(q) || m.displayName.toLowerCase().includes(q) || m.id.includes(q))
        .slice(0, 8)
        .map((m) => ({ ...m, vip: null })),
    };
  });
  route("POST", "/admin/vips/grant", (c) => {
    d.requireAdmin(c);
    const plan = d.planByKey(String(c.body.planKey));
    const m = d.guildMembers.find((x) => x.id === c.body.discordId);
    if (!m) throw new d.HttpError(404, "membro não encontrado");
    let u = [...d.users.values()].find((x) => x.discord?.id === m.id);
    if (!u) {
      u = {
        id: randomUUID(),
        username: m.username,
        email: `${m.username}@exemplo.com`,
        password: "cdw12345",
        role: "user",
        createdAt: now(),
        discord: { id: m.id, username: m.username, avatar: m.avatar },
      };
      d.users.set(u.id, u);
    }
    const ms = c.body.permanent ? 100 * 365 * DAY : Number(c.body.days ?? plan.durationDays) * DAY;
    d.vips.set(u.id, d.makeVip(u, plan, ms));
    return { ok: true };
  });

  route("GET", "/admin/plans", (c) => {
    d.requireAdmin(c);
    return { plans: d.plans.map(adminPlan) };
  });
  route("GET", "/admin/discord/meta", (c) => {
    d.requireAdmin(c);
    return {
      ready: true,
      roles: d.plans
        .map((p, i) => ({ id: `13000000000000000${String(i).padStart(2, "0")}`, name: `VIP ${p.name}`, color: p.color as string }))
        .concat([{ id: "1300000000000000099", name: "Staff", color: "#8b9cf7" }]),
      categories: [
        { id: "1400000000000000001", name: "Calls VIP" },
        { id: "1400000000000000002", name: "Calls Donos" },
      ],
    };
  });
  route("GET", "/admin/pagci/limit", (c) => {
    d.requireAdmin(c);
    return { limit: { limitCents: 100000, rankName: "Prata" } };
  });
  route("POST", "/admin/plans", (c) => {
    d.requireAdmin(c);
    if (d.plans.some((p) => p.key === c.body.key)) throw new d.HttpError(409, "já existe um plano com esse identificador");
    const plan: Json = { ...c.body, soldOut: false, spotsLeft: null };
    d.plans.push(plan);
    return { plan: adminPlan(plan) };
  });
  route("PATCH", "/admin/plans/:key", (c) => {
    d.requireAdmin(c);
    const p = d.planByKey(c.params.key);
    Object.assign(p, c.body);
    return { plan: adminPlan(p), resynced: [...d.vips.values()].filter((v) => v.planKey === p.key).length };
  });

  const adminOrder = (o: Json) => {
    const promo = d.promos.find((p) => p.key === o.promoKey);
    const pay = d.payments.get(String(o.paymentId));
    return {
      ...o,
      includes: promo?.includes ?? { everyone: true, dm: false },
      durationDays: promo?.durationDays ?? 0,
      user: adminUser(d.users.get(String(o.userId))),
      paidAt: pay?.paidAt ?? null,
      startsAt: o.startsAt ?? null,
      staffNote: o.staffNote ?? null,
    };
  };
  const orderById = (id: string) => {
    const o = d.promoOrders.get(id);
    if (!o) throw new d.HttpError(404, "pedido não encontrado");
    return o;
  };
  route("GET", "/admin/promo-orders", (c) => {
    d.requireAdmin(c);
    const status = c.query.get("status") ?? "";
    const all = [...d.promoOrders.values()].filter((o) => o.status !== "awaiting_payment");
    const list = all
      .filter((o) => !status || o.status === status)
      .map(adminOrder)
      .filter((o) => matches(`${o.user?.username ?? ""} ${String((o as Json).contact ?? "")} ${String((o as Json).link)}`, c.query));
    return {
      ...paged(list, c.query),
      counts: { queued: all.filter((o) => o.status === "queued").length, running: all.filter((o) => o.status === "running").length },
    };
  });
  route("PATCH", "/admin/promo-orders/:id", (c) => {
    d.requireAdmin(c);
    const o = orderById(c.params.id);
    o.staffNote = String(c.body.staffNote ?? "");
    return { order: adminOrder(o) };
  });
  route("POST", "/admin/promo-orders/:id/:action", (c) => {
    d.requireAdmin(c);
    const o = orderById(c.params.id);
    const promo = d.promos.find((p) => p.key === o.promoKey);
    if (c.params.action === "start") Object.assign(o, { status: "running", startsAt: now(), endsAt: plus(Number(promo?.durationDays ?? 1) * DAY) });
    else if (c.params.action === "done") Object.assign(o, { status: "done", doneAt: now() });
    else if (c.params.action === "reject") Object.assign(o, { status: "rejected", doneAt: now(), rejectReason: String(c.body.reason ?? "") });
    else throw new d.HttpError(400, "ação inválida");
    return { order: adminOrder(o) };
  });
  route("GET", "/admin/promos", (c) => {
    d.requireAdmin(c);
    return { promos: d.promos.map((p) => ({ ...p, active: p.active ?? true })) };
  });
  route("PATCH", "/admin/promos/:key", (c) => {
    d.requireAdmin(c);
    const p = d.promos.find((x) => x.key === c.params.key);
    if (!p) throw new d.HttpError(404, "pacote não encontrado");
    Object.assign(p, c.body);
    return { promo: p };
  });

  route("GET", "/admin/revenue", (c) => {
    d.requireAdmin(c);
    const param = c.query.get("days") ?? "30";
    const days = param === "all" ? 365 : Number(param);
    const bucket = days > 90 ? "month" : "day";
    const series =
      bucket === "day"
        ? Array.from({ length: days }, (_, i) => {
            const key = new Date(Date.now() - (days - 1 - i) * DAY).toISOString().slice(0, 10);
            const seed = (i * 7919) % 7;
            return { key, revenue: seed < 2 ? 0 : seed * 5000, count: seed < 2 ? 0 : seed };
          })
        : Array.from({ length: 12 }, (_, i) => {
            const dt = new Date();
            dt.setUTCMonth(dt.getUTCMonth() - (11 - i), 1);
            return { key: dt.toISOString().slice(0, 10), revenue: ((i * 3) % 7) * 60000, count: ((i * 3) % 7) * 6 };
          });
    const total = series.reduce((s, x) => s + x.revenue, 0);
    const count = series.reduce((s, x) => s + x.count, 0);
    const vip = Math.round(total * 0.55);
    const owner = Math.round(total * 0.3);
    return {
      total,
      count,
      avgTicket: count ? Math.round(total / count) : 0,
      bucket,
      series,
      groups: {
        vip: { revenue: vip, count: Math.round(count * 0.6) },
        owner: { revenue: owner, count: Math.round(count * 0.25) },
        promo: { revenue: total - vip - owner, count: count - Math.round(count * 0.6) - Math.round(count * 0.25) },
      },
      recent: paidAll()
        .slice(0, 10)
        .map((p) => ({
          id: p.id,
          user: adminUser(userOf(p)),
          name: p.planName,
          group: p.productType === "promo" ? "promo" : d.planByKey(String(p.planKey)).kind === "owner" ? "owner" : "vip",
          amountCents: p.amountCents,
          paidAt: p.paidAt,
        })),
    };
  });
}

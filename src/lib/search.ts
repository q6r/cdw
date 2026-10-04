import { brl, kindLabel, normalize } from "./format";
import { categoryHref, planHref } from "./catalog";
import { HOME_FAQ, PROMO_FAQ } from "../content/copy";
import type { Plan, Promo, User } from "./types";
import type { IconName } from "../components/Icon";

export interface SearchEntry {
  id: string;
  group: "Planos" | "Divulgação" | "Páginas" | "Sua conta" | "Dúvidas";
  title: string;
  subtitle?: string;
  href: string;
  icon?: IconName;
  planIcon?: string;
  /** Texto usado só para casar a busca. */
  haystack: string;
}

const page = (
  id: string,
  title: string,
  href: string,
  icon: IconName,
  keywords: string,
  group: SearchEntry["group"] = "Páginas",
): SearchEntry => ({ id, group, title, href, icon, haystack: normalize(`${title} ${keywords}`) });

export function buildIndex(plans: Plan[] | null, promos: Promo[] | null, user: User | null): SearchEntry[] {
  const out: SearchEntry[] = [];

  for (const p of plans ?? []) {
    out.push({
      id: `plan-${p.key}`,
      group: "Planos",
      title: p.name,
      subtitle: `${kindLabel(p.kind)} · ${p.durationDays} dias · ${brl(p.priceCents)}${p.soldOut ? " · esgotado" : ""}`,
      href: planHref(p.key),
      planIcon: p.icon,
      haystack: normalize(`${p.name} ${p.tagline} ${kindLabel(p.kind)} ${p.perks.join(" ")} vip cargo plano`),
    });
  }
  for (const p of promos ?? []) {
    out.push({
      id: `promo-${p.key}`,
      group: "Divulgação",
      title: p.name,
      subtitle: `${p.tagline} · ${brl(p.priceCents)}`,
      href: `/divulgacoes#pacotes`,
      icon: "megaphone",
      haystack: normalize(`${p.name} ${p.tagline} ${p.perks.join(" ")} divulgacao anuncio everyone dm privado`),
    });
  }

  out.push(
    page("all-plans", "Todos os planos", "/planos", "grid", "catalogo vips cargos comprar loja"),
    page("cat-dono", "Cargos de dono", categoryHref("dono"), "crown", "dono owner 45 dias royal rockstar phantom"),
    page("cat-vip", "VIPs", categoryHref("vip"), "spark", "vip 30 dias tag call"),
    page("promos", "Divulgação", "/divulgacoes", "megaphone", "anunciar divulgar everyone mensagem privado pacotes"),
    page("ranking", "Ranking da CDW", "/ranking", "trophy", "top call mensagens ativos membros"),
    page("tag", "Teste sua tag", "/#personalize", "palette", "personalizar cor icone nome tag previa"),
    page("how", "Como funciona", "/#como-funciona", "sliders", "passos pix discord vincular"),
  );

  if (user) {
    out.push(
      page("me", "Meu painel", "/painel", "home", "conta vip status dias", "Sua conta"),
      page("me-tag", "Minha tag", "/painel/tag", "tag", "editar nome cor icone membros primeira dama", "Sua conta"),
      page("me-call", "Minha call", "/painel/call", "voice", "voz sala limite", "Sua conta"),
      page("me-pay", "Minhas compras", "/painel/pagamentos", "receipt", "pagamentos pedidos pix historico", "Sua conta"),
      page("me-promos", "Minhas divulgações", "/painel/divulgacoes", "message", "pedidos status fila", "Sua conta"),
      page("me-received", "Tags recebidas", "/painel/recebidas", "users", "tags que me deram sair", "Sua conta"),
      page("me-profile", "Meu perfil", "/painel/perfil", "user", "senha discord conta", "Sua conta"),
    );
    if (user.role === "admin") out.push(page("admin", "Painel admin", "/admin", "shield", "administracao", "Sua conta"));
  } else {
    out.push(
      page("login", "Entrar", "/entrar", "user", "login acessar conta", "Sua conta"),
      page("register", "Criar conta", "/criar-conta", "plus", "cadastro registrar", "Sua conta"),
      page("forgot", "Esqueci minha senha", "/esqueci-senha", "lock", "recuperar senha", "Sua conta"),
    );
  }

  HOME_FAQ.forEach(([q, a], i) =>
    out.push({
      id: `faq-${i}`,
      group: "Dúvidas",
      title: q,
      subtitle: a,
      href: `/#faq-${i}`,
      icon: "help",
      haystack: normalize(`${q} ${a}`),
    }),
  );
  PROMO_FAQ.forEach(([q, a], i) =>
    out.push({
      id: `pfaq-${i}`,
      group: "Dúvidas",
      title: q,
      subtitle: a,
      href: `/divulgacoes#duvida-${i}`,
      icon: "help",
      haystack: normalize(`${q} ${a} divulgacao`),
    }),
  );

  return out;
}

/** Todas as palavras precisam aparecer; título vale mais que o resto. */
export function search(index: SearchEntry[], query: string, limit = 12) {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const scored: { e: SearchEntry; score: number }[] = [];
  for (const e of index) {
    if (!words.every((w) => e.haystack.includes(w))) continue;
    const title = normalize(e.title);
    let score = 0;
    for (const w of words) {
      if (title.startsWith(w)) score += 6;
      else if (title.includes(w)) score += 4;
      else score += 1;
    }
    if (e.group === "Planos") score += 2;
    if (e.group === "Dúvidas") score -= 1;
    scored.push({ e, score });
  }
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.e);
}

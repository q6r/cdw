import { describe, expect, it } from "vitest";
import { validateContact, validateLink, validateMessage, inviteCode, promoDuration } from "./promo";
import { buyPath, planActionLabel, sortPlans, categorySummary } from "./catalog";
import { brl, safeNext, normalize } from "./format";
import { buildIndex, search } from "./search";
import { passwordStrength } from "../components/auth/fields";
import type { Plan, Vip } from "./types";

const plan = (over: Partial<Plan>): Plan => ({
  key: "x",
  name: "X",
  kind: "vip",
  tier: 1,
  priceCents: 1000,
  durationDays: 30,
  color: "#168fe5",
  icon: "star",
  tagline: "",
  perks: [],
  limits: { tagMembers: 0, voiceAllowed: 3, firstLadies: 0 },
  features: { mute: false, countHours: false },
  maxHolders: 0,
  soldOut: false,
  spotsLeft: null,
  ...over,
});

const plans = [
  plan({ key: "classic", name: "Classic", tier: 1, priceCents: 3000 }),
  plan({ key: "god", name: "God", tier: 6, priceCents: 40000, tagline: "Status divino no servidor" }),
  plan({ key: "royal", name: "Royal", kind: "owner", tier: 9, priceCents: 110000, durationDays: 45, maxHolders: 5, spotsLeft: 3 }),
];

describe("divulgação: mesmas regras do formulário anterior", () => {
  it("aceita convite do Discord e link https", () => {
    expect(validateLink("discord.gg/cidadealta")).toBeNull();
    expect(validateLink("https://discord.com/invite/abc-123")).toBeNull();
    expect(validateLink("https://minhaloja.com.br/promo")).toBeNull();
  });
  it("recusa link vazio, sem https ou com espaço", () => {
    expect(validateLink("")).toBe("Informe o link.");
    expect(validateLink("http://site.com")).toMatch(/https/);
    expect(validateLink("https://site .com")).toMatch(/https/);
    expect(validateLink("https://" + "a".repeat(200) + ".com")).toBe("Até 200 caracteres.");
  });
  it("exige mensagem de 20 a 600 caracteres sem @everyone/@here", () => {
    expect(validateMessage("")).toBe("Escreva a mensagem.");
    expect(validateMessage("curta demais")).toBe("Pelo menos 20 caracteres.");
    expect(validateMessage("Venha conhecer o servidor @everyone hoje")).toMatch(/@everyone/);
    expect(validateMessage("a".repeat(601))).toBe("No máximo 600 caracteres.");
    expect(validateMessage("Servidor novo com eventos toda semana")).toBeNull();
  });
  it("contato é opcional, mas precisa parecer um usuário do Discord", () => {
    expect(validateContact("")).toBeNull();
    expect(validateContact("fulano.cdw")).toBeNull();
    expect(validateContact("nome com espaço")).toMatch(/usuário do Discord/);
  });
  it("extrai o código do convite e descreve a duração", () => {
    expect(inviteCode("https://discord.gg/abc")).toBe("abc");
    expect(inviteCode("https://site.com")).toBeNull();
    expect(promoDuration({ includes: { everyone: false, dm: true }, durationDays: 45 })).toBe("45 dias no privado");
    expect(promoDuration({ includes: { everyone: true, dm: false }, durationDays: 0 })).toBe("Anúncio único");
  });
});

describe("catálogo", () => {
  it("ordena do plano mais alto para o mais baixo por padrão", () => {
    expect(sortPlans(plans).map((p) => p.key)).toEqual(["royal", "god", "classic"]);
    expect(sortPlans(plans, "menor-preco").map((p) => p.key)).toEqual(["classic", "god", "royal"]);
  });
  it("resume a categoria com dados reais", () => {
    expect(categorySummary(plans, "vip")).toMatchObject({ count: 2, minPrice: 3000, days: 30 });
    expect(categorySummary(plans, "owner")?.top.key).toBe("royal");
  });
  it("leva quem não está logado para o cadastro com retorno ao checkout", () => {
    expect(buyPath("god", true)).toBe("/painel/comprar/god");
    expect(buyPath("god", false)).toBe(`/criar-conta?next=${encodeURIComponent("/painel/comprar/god")}`);
  });
  it("rotula assinar, renovar, trocar e esgotado como o painel anterior", () => {
    const vip = { active: true, planKey: "god" } as Vip;
    expect(planActionLabel(plans[1], null)).toBe("Assinar");
    expect(planActionLabel(plans[1], vip)).toBe("Renovar +30 dias");
    expect(planActionLabel(plans[0], vip)).toBe("Trocar +30 dias");
    expect(planActionLabel({ ...plans[0], soldOut: true }, vip)).toBe("Esgotado");
  });
});

describe("utilidades", () => {
  it("formata reais", () => {
    expect(brl(110000).replace(/\s/g, " ")).toBe("R$ 1.100,00");
  });
  it("só aceita next interno (sem redirecionamento aberto)", () => {
    expect(safeNext("/painel/comprar/god")).toBe("/painel/comprar/god");
    expect(safeNext("//evil.com")).toBeNull();
    expect(safeNext("https://evil.com")).toBeNull();
    expect(safeNext(null)).toBeNull();
  });
  it("normaliza acentos para a busca", () => {
    expect(normalize("Relíquia DIVULGAÇÃO")).toBe("reliquia divulgacao");
  });
  it("mede a força da senha como antes", () => {
    expect(passwordStrength("abc")).toBe(0);
    expect(passwordStrength("abcdefgh")).toBe(1);
    expect(passwordStrength("Abcdefgh12!x")).toBe(4);
  });
});

describe("busca", () => {
  const index = buildIndex(plans, null, null);
  it("encontra plano pelo nome, sem acento e sem caixa", () => {
    expect(search(index, "royal")[0]?.title).toBe("Royal");
    expect(search(index, "DIVINO")[0]?.title).toBe("God");
  });
  it("encontra dúvidas pelo assunto", () => {
    expect(search(index, "pix seguro").some((r) => r.group === "Dúvidas")).toBe(true);
  });
  it("não mostra páginas da conta para quem não entrou", () => {
    expect(index.some((e) => e.id === "me-tag")).toBe(false);
    expect(index.some((e) => e.id === "login")).toBe(true);
  });
});

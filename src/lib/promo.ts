import type { Promo } from "./types";

/** Convite do Discord: discord.gg/abc ou discord.com/invite/abc. */
export const INVITE_RE = /^(?:https?:\/\/)?(?:www\.)?(?:discord\.gg|discord(?:app)?\.com\/invite)\/([a-zA-Z0-9-]{2,32})\/?$/i;
export const MENTION_RE = /@(everyone|here)\b/i;

export const inviteCode = (link: string) => INVITE_RE.exec(link.trim())?.[1] ?? null;

export const promoDuration = (p: Pick<Promo, "includes" | "durationDays">) =>
  p.includes.dm && p.durationDays > 0 ? `${p.durationDays} dias no privado` : "Anúncio único";

/** Mesmas regras do formulário anterior (o servidor valida de novo). */
export function validateLink(link: string) {
  const t = link.trim();
  if (!t) return "Informe o link.";
  if (t.length > 200) return "Até 200 caracteres.";
  if (INVITE_RE.test(t)) return null;
  if (!/^https:\/\/[^\s/]+\.[^\s/]{2,}/i.test(t) || /\s/.test(t)) return "Use um link https:// ou um convite discord.gg.";
  return null;
}

export function validateMessage(message: string) {
  const t = message.trim();
  if (!t) return "Escreva a mensagem.";
  if (MENTION_RE.test(message)) return "Tire o @everyone e o @here. A staff marca o servidor quando o pacote inclui o anúncio.";
  if (t.length < 20) return "Pelo menos 20 caracteres.";
  if (message.length > 600) return "No máximo 600 caracteres.";
  return null;
}

export function validateContact(contact: string) {
  const t = contact.trim();
  return t && !/^@?[a-zA-Z0-9_.]{2,32}(#\d{4})?$/.test(t) ? "Use o seu usuário do Discord, ex: fulano.cdw" : null;
}

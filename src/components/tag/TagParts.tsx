import { useMemo, useState } from "react";
import clsx from "clsx";
import { Icon } from "../Icon";
import { PlanIcon } from "../PlanIcon";
import { Avatar } from "../ui";
import { useApi } from "../../lib/hooks";
import { rgba } from "../../lib/format";
import type { GuildEmoji, TagIcon } from "../../lib/types";

const emojiUrl = (id: string, animated?: boolean) =>
  /^\d{17,20}$/.test(id) ? `https://cdn.discordapp.com/emojis/${id}.${animated ? "gif" : "png"}?size=64` : "";

/** Ícone de uma tag: desenho da CDW ou emoji do servidor. */
export function TagIconView({ icon, size = 20, animated = true }: { icon: TagIcon | null | undefined; size?: number; animated?: boolean }) {
  if (!icon) return null;
  if (icon.kind === "cdw") return <PlanIcon name={icon.key} size={size} animated={animated} />;
  const src = emojiUrl(icon.key, icon.animated);
  return src ? (
    <img src={src} alt={icon.name ?? ""} width={size} height={size} className="shrink-0 object-contain" draggable={false} />
  ) : null;
}

/** Pílula da tag como aparece nas listas da loja. */
export function TagPill({ name, color, icon, className }: { name: string; color: string; icon?: TagIcon | null; className?: string }) {
  return (
    <span
      className={clsx("inline-flex max-w-full items-center gap-2 rounded-[10px] px-3 py-2 text-[15px] font-semibold text-ink", className)}
      style={{ background: rgba(color, 0.12), boxShadow: `inset 0 0 0 1px ${rgba(color, 0.45)}` }}
    >
      <span className="h-3.5 w-3.5 shrink-0 rounded-full ring-1 ring-black/10" style={{ background: color }} />
      <TagIconView icon={icon} size={18} />
      <span className="truncate">{name}</span>
    </span>
  );
}

/** Emojis do servidor para usar como ícone da tag. */
export function EmojiPicker({ value, onChange }: { value: TagIcon | null; onChange: (icon: TagIcon | null) => void }) {
  const { data, loading, error } = useApi<{ emojis: GuildEmoji[]; roleIcons: boolean }>("/emojis");
  const [q, setQ] = useState("");
  const emojis = data?.emojis ?? [];
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? emojis.filter((e) => e.name.toLowerCase().includes(t)) : emojis;
  }, [emojis, q]);

  return (
    <div className="space-y-3">
      {emojis.length > 12 && (
        <div className="relative">
          <Icon name="search" size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-dim" />
          <input
            type="search"
            className="field pl-10"
            placeholder={`Buscar entre ${emojis.length} emojis do servidor`}
            aria-label="Buscar emoji"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      )}
      {loading && !data ? (
        <div className="grid grid-cols-6 gap-2 sm:grid-cols-9" aria-hidden="true">
          {Array.from({ length: 18 }, (_, i) => (
            <div key={i} className="skeleton aspect-square" />
          ))}
        </div>
      ) : error ? (
        <p className="rounded-[10px] border border-danger/25 bg-danger-soft px-4 py-3 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : emojis.length === 0 ? (
        <p className="rounded-[12px] border border-dashed border-silver-strong px-4 py-6 text-center text-sm text-muted">
          Os emojis do servidor aparecem aqui quando o bot estiver online.
        </p>
      ) : (
        <div className="grid max-h-72 grid-cols-6 gap-2 overflow-y-auto overscroll-contain p-0.5 pr-1 sm:grid-cols-9" role="group" aria-label="Emojis do servidor">
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label="Sem ícone"
            aria-pressed={!value}
            title="Sem ícone"
            className={clsx(
              "grid aspect-square place-items-center rounded-[10px] border transition-colors",
              value ? "border-dashed border-silver-strong text-dim hover:text-ink" : "border-liquid bg-liquid-soft text-liquid-deep",
            )}
          >
            <Icon name="ban" size={18} />
          </button>
          {filtered.map((e) => {
            const selected = value?.kind === "guild" && value.key === e.id;
            return (
              <button
                key={e.id}
                type="button"
                title={`:${e.name}:`}
                aria-label={e.name}
                aria-pressed={selected}
                onClick={() => onChange({ kind: "guild", key: e.id, name: e.name, animated: e.animated })}
                className={clsx(
                  "grid aspect-square place-items-center rounded-[10px] border p-2 transition-colors",
                  selected ? "border-liquid bg-liquid-soft" : "border-silver bg-porcelain hover:border-silver-strong hover:bg-frost",
                )}
              >
                <img src={e.url} alt="" className="h-full w-full object-contain" loading="lazy" decoding="async" draggable={false} />
              </button>
            );
          })}
          {q && filtered.length === 0 && (
            <p className="col-span-full py-4 text-center text-sm text-muted">Nenhum emoji com esse nome.</p>
          )}
        </div>
      )}
      {data && !data.roleIcons && emojis.length > 0 && (
        <p className="text-[13px] text-muted">No Discord o ícone só aparece no cargo com boost nível 2. No site ele aparece sempre.</p>
      )}
    </div>
  );
}

/** Prévia fiel do Discord (tema escuro do próprio app), para ver a tag antes de salvar. */
export function DiscordTagPreview({
  name,
  color,
  icon,
  username,
  avatar,
  members = 1,
}: {
  name: string;
  color: string;
  icon: TagIcon | null;
  username: string;
  avatar?: string | null;
  members?: number;
}) {
  const label = name.trim() || "Sua tag";
  return (
    <figure className="overflow-hidden rounded-[16px] border border-silver bg-porcelain p-1.5 shadow-lift">
      <figcaption className="flex items-center gap-2 px-3 pb-2 pt-1.5 text-[13px] font-semibold text-dim">
        <span className="flex gap-1" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-silver-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-silver-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-silver-strong" />
        </span>
        Prévia no Discord
      </figcaption>
      <div className="overflow-hidden rounded-[11px] bg-[#313338] text-[#dbdee1]">
        <div className="flex items-center gap-2 border-b border-black/30 px-4 py-3 text-sm font-semibold text-white">
          <span className="text-lg leading-none text-[#80848e]">#</span> geral
        </div>
        <div className="@container grid grid-cols-[1fr_auto]">
          <div className="min-w-0 space-y-4 px-4 py-4">
            <PreviewMessage username={username} avatar={avatar} color={color} icon={icon} time="Hoje às 21:04" text="cheguei, bora pra call?" />
            <PreviewMessage username={username} avatar={avatar} color={color} icon={icon} time="Hoje às 21:05" text="olha a minha tag nova" />
          </div>
          <div className="hidden w-44 border-l border-black/20 bg-[#2b2d31] px-3 py-4 @[30rem]:block">
            <div className="mb-2 truncate px-1 text-[11px] font-bold uppercase tracking-wide text-[#949ba4]">
              {label} — {members}
            </div>
            <div className="flex items-center gap-2.5 rounded-md bg-white/[0.06] px-1.5 py-1.5">
              <span className="relative">
                <Avatar src={avatar} name={username} size={30} className="!ring-0" />
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-[2.5px] border-[#2b2d31] bg-[#23a55a]" />
              </span>
              <span className="flex min-w-0 items-center gap-1">
                <span className="truncate text-sm font-medium" style={{ color }}>
                  {username}
                </span>
                <TagIconView icon={icon} size={16} />
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 border-t border-black/30 bg-[#232428] px-4 py-3">
          <span className="text-[11px] font-bold uppercase tracking-wide text-[#949ba4]">Cargos</span>
          <span
            className="inline-flex max-w-full items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-[#dbdee1]"
            style={{ backgroundColor: rgba(color, 0.12), boxShadow: `inset 0 0 0 1px ${rgba(color, 0.35)}` }}
          >
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: color }} />
            <TagIconView icon={icon} size={14} />
            <span className="truncate">{label}</span>
          </span>
        </div>
      </div>
    </figure>
  );
}

function PreviewMessage({
  username,
  avatar,
  color,
  icon,
  time,
  text,
}: {
  username: string;
  avatar?: string | null;
  color: string;
  icon: TagIcon | null;
  time: string;
  text: string;
}) {
  return (
    <div className="flex gap-3">
      <Avatar src={avatar} name={username} size={38} className="!ring-0" />
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-x-1.5">
          <span className="font-medium transition-colors duration-300" style={{ color }}>
            {username}
          </span>
          <TagIconView icon={icon} size={18} />
          <span className="text-xs text-[#949ba4]">{time}</span>
        </div>
        <p className="text-[15px] leading-snug">{text}</p>
      </div>
    </div>
  );
}

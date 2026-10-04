import { useEffect, useState } from "react";
import clsx from "clsx";
import { Icon } from "../Icon";
import { int } from "../../lib/format";
import { inviteCode } from "../../lib/promo";
import type { InviteState } from "../../lib/types";

/**
 * Prévia de como a divulgação aparece no Discord (no canal com @everyone ou
 * na DM de quem entra). Usa o tema escuro do próprio Discord.
 */
export function DiscordMessagePreview({
  variant,
  message,
  link,
  invite,
  className,
}: {
  variant: "channel" | "dm";
  message: string;
  link: string;
  invite?: InviteState;
  className?: string;
}) {
  const text = message.trim();
  const url = link.trim();
  const code = inviteCode(url);

  return (
    <div className={clsx("min-w-0 overflow-hidden rounded-[12px] border border-black/10 bg-[#313338] text-left text-[#dbdee1] shadow-lift", className)}>
      <div className="flex h-12 items-center gap-2 border-b border-black/30 px-4 text-[15px] font-semibold text-[#f2f3f5]">
        {variant === "channel" ? (
          <>
            <span className="text-xl font-normal leading-none text-[#80848e]">#</span>anúncios
          </>
        ) : (
          <>
            <Icon name="at" size={18} className="text-[#80848e]" />
            CDW
          </>
        )}
      </div>
      <div className="flex gap-3 px-4 pb-5 pt-4 sm:gap-4">
        <img src="/brand/cdw-icon-128.webp" alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-1.5 leading-tight">
            <span className="text-[15px] font-medium text-[#f2f3f5]">CDW</span>
            <span className="rounded-[3px] bg-[#5865f2] px-1 text-[10px] font-semibold leading-[15px] text-white">APP</span>
            <span className="ml-1 text-xs text-[#949ba4]">Hoje às 20:00</span>
          </div>
          <div className="mt-1 whitespace-pre-wrap text-[15px] leading-[1.375] [overflow-wrap:anywhere]">
            {variant === "channel" && (
              <>
                <span className="rounded-[3px] bg-[#5865f2]/30 px-0.5 font-medium text-[#c9cdfb]">@everyone</span>{" "}
              </>
            )}
            {text || <span className="text-[#80848e]">Sua mensagem aparece aqui.</span>}
            {"\n"}
            <span className="text-[#00a8fc]">{url || "https://discord.gg/seuservidor"}</span>
          </div>
          {url && !code ? <LinkEmbed url={url} /> : <InviteEmbed code={code} state={url ? invite : undefined} />}
        </div>
      </div>
    </div>
  );
}

function GuildIcon({ name, src, muted }: { name: string; src: string | null; muted?: boolean }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  const ok = src && /^https:\/\/cdn\.discordapp\.com\/icons\//.test(src) ? src : null;
  if (ok && !failed) {
    return <img src={ok} alt="" width={48} height={48} onError={() => setFailed(true)} className="h-12 w-12 shrink-0 rounded-[14px] object-cover" />;
  }
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "?";
  return (
    <span className={clsx("grid h-12 w-12 shrink-0 place-items-center rounded-[14px] font-display text-base font-bold", muted ? "bg-[#4e5058] text-[#b5bac1]" : "bg-[#5865f2] text-white")}>
      {initials}
    </span>
  );
}

function InviteEmbed({ code, state }: { code: string | null; state?: InviteState }) {
  const info = state?.status === "ok" ? state.info : null;
  const loading = state?.status === "loading";
  const invalid = state?.status === "invalid";
  return (
    <div className="@container mt-2 max-w-[400px] rounded-[8px] bg-[#2b2d31] p-4">
      <div className="text-xs font-semibold text-[#b5bac1]">Você recebeu um convite para um servidor</div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        {loading ? (
          <span className="h-12 w-12 shrink-0 animate-pulse rounded-[14px] bg-[#3a3c42]" />
        ) : (
          <GuildIcon name={invalid ? "?" : (info?.guild.name ?? "Seu servidor")} src={info?.guild.iconUrl ?? null} muted={invalid} />
        )}
        <div className="min-w-0 flex-1">
          {loading ? (
            <>
              <span className="block h-4 w-32 animate-pulse rounded bg-[#3a3c42]" />
              <span className="mt-2 block h-3 w-24 animate-pulse rounded bg-[#3a3c42]" />
            </>
          ) : invalid ? (
            <>
              <div className="text-[15px] font-semibold text-[#f23f43]/80">Convite inválido ou expirado</div>
              {code && <div className="truncate text-xs text-[#949ba4]">discord.gg/{code}</div>}
            </>
          ) : (
            <>
              <div className="truncate text-[15px] font-semibold text-[#f2f3f5]">{info?.guild.name ?? "Seu servidor"}</div>
              <div className="truncate text-xs text-[#949ba4]">discord.gg/{info?.code ?? code ?? "seuservidor"}</div>
              {info && (info.online !== null || info.members !== null) && (
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 whitespace-nowrap text-xs text-[#b5bac1]">
                  {info.online !== null && (
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#23a55a]" />
                      {int(info.online)} online
                    </span>
                  )}
                  {info.members !== null && (
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-[#80848e]" />
                      {int(info.members)} membros
                    </span>
                  )}
                </div>
              )}
            </>
          )}
        </div>
        {!invalid && (
          <span className="basis-full rounded-[3px] bg-[#248046] px-4 py-2 text-center text-sm font-medium text-white @[22rem]:shrink-0 @[22rem]:basis-auto">
            Entrar
          </span>
        )}
      </div>
    </div>
  );
}

function LinkEmbed({ url }: { url: string }) {
  let host = url;
  let rest = "";
  try {
    const u = new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`);
    host = u.hostname.replace(/^www\./, "");
    rest = `${u.pathname === "/" ? "" : u.pathname}${u.search}`;
  } catch {
    /* mostra o texto como veio */
  }
  return (
    <div className="mt-2 flex max-w-[400px] items-center gap-2 rounded-[4px] border-l-4 border-[#4e5058] bg-[#2b2d31] px-3 py-2.5 text-sm">
      <Icon name="link" size={15} className="text-[#949ba4]" />
      <span className="shrink-0 font-medium text-[#f2f3f5]">{host}</span>
      {rest && <span className="min-w-0 truncate text-[#949ba4]">{rest}</span>}
    </div>
  );
}
